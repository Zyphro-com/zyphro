import { prisma } from "../../db.js";
import { checkDeadManSwitches } from '../utils/deathClock.js';
import fs from 'fs';
import path from 'path';

// --- CREAR VÓRTICE (SEGURIDAD, CUOTAS Y LÍMITES POR PLAN) ---
export const createVortex = async (req, res) => {
  try {
    const userId = req.auth?.userId || null;
    let { content, type, expirationHours, maxViews, fileName } = req.body;
    const file = req.file;

    if (type === 'text' && !content) return res.status(400).json({ error: "Falta el contenido." });
    if (type === 'file' && !file) return res.status(400).json({ error: "Archivo no recibido." });

    const sizeInBytes = type === 'file' ? file.size : Buffer.byteLength(content, 'utf8');

    const result = await prisma.$transaction(async (tx) => {
      let user = null;
      if (userId) {
        user = await tx.user.findUnique({ where: { id: userId } });
        
        // Si no existe (raro), lo creamos como FREE
        if (!user) {
          user = await tx.user.create({
            data: { 
              id: userId, 
              email: `${userId}@zyphro.local`, 
              plan: "FREE", 
              storageLimit: BigInt(104857600) 
            }
          });
        }

        // VALIDACIÓN DE CUOTA
        if (BigInt(user.usedStorage) + BigInt(sizeInBytes) > BigInt(user.storageLimit)) {
          throw new Error("QUOTA_EXCEEDED");
        }
      }

      // 🛡️ APLICAR REGLAS SEGÚN PLAN
      const isFree = !user || user.plan === "FREE";
      
      if (isFree) {
        expirationHours = 24; // Forzado 24h para Free
        maxViews = 1;        // Forzado 1 vista para Free
      } else {
        // Planes de pago: Pro y Ultimate (Máx 30 días = 720h)
        expirationHours = Math.min(parseInt(expirationHours) || 24, 720);
        maxViews = Math.min(parseInt(maxViews) || 1, 100);
      }

      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + expirationHours);

      const newSecret = await tx.secret.create({
        data: {
          userId: userId,
          title: type === 'file' ? `Archivo: ${fileName || file.originalname}` : "Secure Drop",
          type: type || "text",
          content: type === 'file' ? file.path : content,
          fileSize: BigInt(sizeInBytes),
          expiresAt: expiresAt,
          maxViews: maxViews,
          viewCount: 0
        }
      });

      if (userId) {
        await tx.user.update({
          where: { id: userId },
          data: { usedStorage: { increment: sizeInBytes } }
        });
      }
      return newSecret;
    });

    res.status(200).json({ success: true, vortexId: result.id });

  } catch (error) {
    if (error.message === "QUOTA_EXCEEDED") {
      if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(402).json({ error: "Búnker lleno. Sube de nivel para obtener más espacio." });
    }
    console.error("❌ Error createVortex:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// --- LEER Y DESTRUIR ---
export const getVortex = async (req, res) => {
  try {
    const { id } = req.params;
    const secret = await prisma.secret.findUnique({ where: { id } });

    if (!secret) return res.status(404).json({ error: "Vórtice no disponible" });

    const destroySecret = async () => {
      try {
        await prisma.$transaction(async (tx) => {
          await tx.secret.delete({ where: { id } });
          if (secret.userId) {
            await tx.user.update({
              where: { id: secret.userId },
              data: { usedStorage: { decrement: secret.fileSize || 0 } }
            });
          }
        });
        if (secret.type === 'file' && fs.existsSync(secret.content)) {
          fs.unlinkSync(secret.content);
        }
      } catch (e) { console.error("Error destruyendo rastro:", e); }
    };

    // Comprobar expiración
    if (new Date() > new Date(secret.expiresAt) || (secret.maxViews > 0 && secret.viewCount >= secret.maxViews)) {
      await destroySecret();
      return res.status(404).json({ error: "El vórtice ha expirado." });
    }

    let responseContent = secret.content;
    if (secret.type === 'file') {
      try {
        responseContent = fs.readFileSync(path.resolve(secret.content), 'utf-8');
      } catch (err) {
        return res.status(404).json({ error: "Contenido no accesible." });
      }
    }

    const updatedSecret = await prisma.secret.update({
      where: { id },
      data: { viewCount: { increment: 1 } }
    });
    
    if (updatedSecret.viewCount >= secret.maxViews) await destroySecret();

    res.json({
      title: secret.title,
      type: secret.type,
      content: responseContent,
      expiresAt: secret.expiresAt,
      remainingViews: Math.max(0, secret.maxViews - updatedSecret.viewCount)
    });

  } catch (error) {
    res.status(500).json({ error: "Error al recuperar el búnker." });
  }
};

// --- OBTENER VÓRTICES (FILTRADO) ---
export const getUserVortices = async (req, res) => {
  try {
    if (!req.auth?.userId) return res.status(401).json({ error: "No autorizado" });
    const { userId } = req.auth;

    const vortices = await prisma.secret.findMany({
      where: { 
        userId,
        NOT: { title: { startsWith: "[HERENCIA]" } }
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        type: true,
        expiresAt: true,
        maxViews: true,
        viewCount: true,
        createdAt: true,
        fileSize: true
      }
    });

    res.json(vortices);
  } catch (error) {
    res.status(500).json({ error: "Error al recuperar tus activos." });
  }
};

// --- HEARTBEAT ---
export const heartbeat = async (req, res) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) return res.status(401).json({ error: "No autorizado" });
    
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { lastCheckIn: new Date(), dmsStatus: "IDLE" }
    });
    
    const nextCheckIn = new Date(updatedUser.lastCheckIn.getTime() + (updatedUser.checkInInterval || 24) * 60 * 60 * 1000);
    res.json({ success: true, lastCheckIn: updatedUser.lastCheckIn, nextCheckInDue: nextCheckIn });
  } catch (error) {
    res.status(500).json({ error: "Fallo de sincronización." });
  }
};

// --- MANTENIMIENTO ---
export const cleanupVortices = async (req, res) => {
  try {
    const now = new Date();
    const expired = await prisma.secret.findMany({
      where: { 
        OR: [
          { expiresAt: { lt: now } },
          { AND: [{ maxViews: { gt: 0 } }, { viewCount: { gte: prisma.secret.fields.maxViews } }] }
        ]
      }
    });

    for (const secret of expired) {
      await prisma.$transaction(async (tx) => {
        const exists = await tx.secret.findUnique({ where: { id: secret.id } });
        if (exists) {
          await tx.secret.delete({ where: { id: secret.id } });
          if (secret.userId) {
            await tx.user.update({
              where: { id: secret.userId },
              data: { usedStorage: { decrement: secret.fileSize || 0 } }
            });
          }
        }
      });
      if (secret.type === 'file' && fs.existsSync(secret.content)) {
        try { fs.unlinkSync(secret.content); } catch (e) {}
      }
    }
    await checkDeadManSwitches();
    res.json({ success: true, cleared: expired.length });
  } catch (error) {
    res.status(500).json({ error: "Error en mantenimiento." });
  }
};