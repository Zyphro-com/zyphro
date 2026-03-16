import express from "express";
import { prisma } from "../../db.js";
import { hybridAuth } from "../middlewares/hybridAuth.js"; 
import { 
  createVortex, 
  heartbeat, 
  getVortex, 
  getUserVortices, 
  cleanupVortices 
} from "../controllers/vortexController.js"; 
import { ClerkExpressRequireAuth, ClerkExpressWithAuth } from '@clerk/clerk-sdk-node';
import multer from 'multer';
import fs from 'fs';

// Asegurar directorio de subida
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}
const upload = multer({ dest: 'uploads/' });

const router = express.Router();

// --- MIDDLEWARE DE CONTROL DE CUOTA ---
// Verifica el espacio antes de permitir la subida masiva
const checkStorageQuota = async (req, res, next) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) return next();

    // Auto-registro/Sincronización de usuario con UPSERT
    const user = await prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: {
        id: userId,
        email: `${userId}@zyphro.local`,
        plan: "FREE",
        storageLimit: BigInt(104857600), // 100MB
        usedStorage: BigInt(0)
      },
      select: { usedStorage: true, storageLimit: true }
    });

    // Verificación de capacidad (Comparación de BigInt)
    if (user.usedStorage >= user.storageLimit) {
      return res.status(402).json({ 
        error: "Búnker lleno", 
        message: "Límite de capacidad alcanzado. Sube a PRO para obtener 10GB." 
      });
    }

    next();
  } catch (error) {
    console.error("❌ Quota Error:", error);
    res.status(500).json({ error: "Error en validación de infraestructura de cuotas" });
  }
};

// --- RUTAS DE ADMINISTRACIÓN Y SISTEMA ---
router.get("/user", ClerkExpressRequireAuth(), getUserVortices);
router.get("/cleanup", cleanupVortices); // Cron Job

// --- RUTAS DE OPERACIÓN ---

// Crear Vórtice: Check de cuota -> Subida de archivo -> Controlador
router.post("/create", ClerkExpressWithAuth(), checkStorageQuota, upload.single('file'), createVortex); 

// Obtener Vórtice (Público/Privado con ID)
router.get("/get/:id", getVortex);

// Señal de vida (Dead Man Switch)
router.post("/heartbeat", hybridAuth, heartbeat);

// --- ELIMINACIÓN MANUAL (DESTRUCCIÓN TOTAL) ---
router.delete("/delete/:id", ClerkExpressRequireAuth(), async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.auth;

    // Buscamos en la tabla 'Secret' (donde guardamos los vórtices)
    const secret = await prisma.secret.findUnique({ where: { id } });

    if (!secret) return res.status(404).json({ error: "Vórtice no encontrado" });
    if (secret.userId !== userId) return res.status(403).json({ error: "No autorizado para destruir este activo" });

    // 1. TRANSACCIÓN ATÓMICA: Borrado y devolución de cuota
    await prisma.$transaction(async (tx) => {
      // Devolvemos el espacio al búnker del usuario
      await tx.user.update({
        where: { id: userId },
        data: {
          usedStorage: {
            decrement: secret.fileSize // BigInt se maneja solo aquí
          }
        }
      });

      // Borramos de la base de datos
      await tx.secret.delete({ where: { id } });
    });

    // 2. BORRADO FÍSICO DEL ARCHIVO (Si es tipo file)
    if (secret.type === 'file' && fs.existsSync(secret.content)) {
      fs.unlinkSync(secret.content);
    }

    res.json({ success: true, message: "Activo destruido y espacio liberado." });
  } catch (error) {
    console.error("❌ Error en borrado manual:", error);
    res.status(500).json({ error: "Error interno al procesar la destrucción." });
  }
});

export default router;