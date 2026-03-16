import express from "express";
import { prisma } from "../../db.js";
import { ClerkExpressRequireAuth } from '@clerk/clerk-sdk-node';

const router = express.Router();

// Helper para limpiar BigInt
const serialize = (obj) => ({
  ...obj,
  fileSize: obj.fileSize?.toString() || "0"
});

// --- 1. LISTAR ACTIVOS DE LA BÓVEDA ---
router.get("/", ClerkExpressRequireAuth(), async (req, res) => {
  try {
    const secrets = await prisma.secret.findMany({
      where: { 
        userId: req.auth.userId,
        title: { startsWith: "[HERENCIA]" }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    const cleanSecrets = secrets.map(s => ({
      ...serialize(s),
      title: s.title.replace("[HERENCIA] ", "")
    }));

    res.json(cleanSecrets);
  } catch (error) {
    res.status(500).json({ error: "Error al leer activos" });
  }
});

// --- 2. GUARDAR NUEVO ACTIVO (CON LÍMITES DE PLAN) ---
router.post("/", ClerkExpressRequireAuth(), async (req, res) => {
  try {
    const { title, content, type } = req.body;
    if (!content) return res.status(400).json({ error: "Contenido vacío" });

    // Verificar el plan del usuario y cuántos activos de herencia tiene
    const user = await prisma.user.findUnique({
      where: { id: req.auth.userId },
      select: { plan: true }
    });

    const heritageCount = await prisma.secret.count({
      where: { 
        userId: req.auth.userId,
        title: { startsWith: "[HERENCIA]" }
      }
    });

    // REGLA: Plan FREE solo permite 1 activo de herencia
    if (user.plan === "FREE" && heritageCount >= 1) {
      return res.status(403).json({ 
        error: "Límite del plan FREE alcanzado. Sube a PRO para activos ilimitados." 
      });
    }

    const newSecret = await prisma.secret.create({
      data: {
        userId: req.auth.userId,
        title: `[HERENCIA] ${title || 'Sin título'}`,
        content: content,
        type: type || 'note',
        fileSize: BigInt(0),
        // 100 años de expiración para DMS
        expiresAt: new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000)
      }
    });

    res.json({ success: true, id: newSecret.id });
  } catch (error) {
    console.error("Error en vault POST:", error);
    res.status(500).json({ error: "Fallo al guardar secreto" });
  }
});

// --- 3. BORRAR ACTIVO ---
router.delete("/:id", ClerkExpressRequireAuth(), async (req, res) => {
  try {
    await prisma.secret.delete({
      where: { 
        id: req.params.id,
        userId: req.auth.userId 
      }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Error al borrar" });
  }
});

export default router;