import express from 'express';
import { prisma } from '../../db.js';
import { ClerkExpressRequireAuth } from '@clerk/clerk-sdk-node';

const router = express.Router();

/**
 * @route   GET /api/v1/user/me
 * @desc    Obtiene el estado del búnker, plan y límites del usuario
 * @access  Private (Clerk Auth)
 */
router.get('/me', ClerkExpressRequireAuth(), async (req, res) => {
  try {
    const userId = req.auth.userId;

    // Usamos upsert para garantizar que el usuario exista en nuestra DB 
    // y evitar errores 404 innecesarios tras el registro o migraciones.
    const user = await prisma.user.upsert({
      where: { id: userId },
      update: {}, // Si existe, no actualizamos nada aquí
      create: {
        id: userId,
        // Fallback para el email si no se sincronizó previamente
        email: `${userId}@zyphro.local`, 
        plan: 'FREE',
        storageLimit: BigInt(104857600), // 100MB Base
        usedStorage: BigInt(0)
      },
      select: {
        plan: true,
        usedStorage: true,
        storageLimit: true
      }
    });

    // ⚡ FIX BIGINT: Convertimos a String para que la serialización JSON no falle
    return res.status(200).json({
      success: true,
      plan: user.plan,
      usedStorage: user.usedStorage.toString(),
      storageLimit: user.storageLimit.toString(),
      // Calculamos el porcentaje disponible para facilitar el trabajo al Frontend
      usagePercentage: Number((user.usedStorage * BigInt(100)) / user.storageLimit)
    });

  } catch (error) {
    console.error("❌ Error en User_Profile_Core:", error.message);
    return res.status(500).json({ 
      error: "Error interno en la infraestructura de usuario",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;