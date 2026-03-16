import express from 'express';
import { prisma } from '../../db.js';
import { ClerkExpressRequireAuth } from '@clerk/clerk-sdk-node';

const router = express.Router();

// Helper para evitar el error de BigInt al enviar la respuesta
const serializeUser = (user) => {
  if (!user) return null;
  return {
    ...user,
    usedStorage: user.usedStorage?.toString(),
    storageLimit: user.storageLimit?.toString(),
  };
};

// OBTENER CONFIGURACIÓN
router.get('/config', ClerkExpressRequireAuth(), async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.auth.userId }
    });
    res.json(serializeUser(user));
  } catch (error) {
    res.status(500).json({ error: "Error al obtener configuración" });
  }
});

// ACTUALIZAR CONFIGURACIÓN
router.post('/update', ClerkExpressRequireAuth(), async (req, res) => {
  try {
    const { switchEnabled, recipientEmail, checkInInterval, dmsNote } = req.body;
    
    console.log("📥 Sincronizando protocolo DMS para:", req.auth.userId);

    
    const statusValue = switchEnabled ? "IDLE" : "IDLE";

    const updated = await prisma.user.update({
      where: { id: req.auth.userId },
      data: { 
        switchEnabled: Boolean(switchEnabled), 
        recipientEmail: recipientEmail || null, 
        checkInInterval: parseInt(checkInInterval) || 30,
        dmsNote: dmsNote || "", 
        lastCheckIn: new Date(), 
        dmsStatus: statusValue // 👈 Usamos un valor que el Enum sí acepte
      }
    });
    
    res.json({ 
      success: true, 
      data: serializeUser(updated) 
    });

  } catch (error) {
    console.error("🔥 Error crítico en el guardado DMS:", error);
    // Si el error persiste, es que el Enum espera otro nombre (mira tu schema.prisma)
    res.status(500).json({ success: false, error: "Error de validación de estado" });
  }
});

export default router;