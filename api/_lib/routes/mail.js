import express from 'express';
import { ClerkExpressRequireAuth } from '@clerk/clerk-sdk-node';
import { prisma } from '../../db.js';
import { simpleParser } from 'mailparser';

const router = express.Router();

function generateRandomString(length) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// --- 1. RUTA: LISTAR ALIAS CON TIEMPO RESTANTE ---
router.get('/aliases', ClerkExpressRequireAuth(), async (req, res) => {
  const userId = req.auth.userId;
  try {
    const aliases = await prisma.anon_aliases.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' }
    });

    const aliasesWithTime = aliases.map(alias => {
      const now = new Date();
      const expires = new Date(alias.expires_at);
      const diffMs = expires - now;
      const timeLeftMinutes = Math.max(0, Math.floor(diffMs / 60000));
      
      return {
        ...alias,
        timeLeftMinutes 
      };
    });

    res.json(aliasesWithTime);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener alias de identidad" });
  }
});

// --- 2. RUTA: GENERAR NUEVO ALIAS (LÍMITES SEGÚN MATRIZ ZYPHRO) ---
router.post('/generate', ClerkExpressRequireAuth(), async (req, res) => {
  const { durationMinutes } = req.body;
  const userId = req.auth.userId;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true }
    });

    const count = await prisma.anon_aliases.count({
      where: { user_id: userId }
    });

    // 🛡️ APLICACIÓN DE LA MATRIZ DE NEGOCIO
    if (user?.plan === 'FREE' && count >= 1) {
      return res.status(403).json({ 
        error: "Límite del Plan FREE alcanzado", 
        message: "El plan gratuito solo permite 1 alias activo. Sube a PRO para obtener 3." 
      });
    }

    if (user?.plan === 'PRO' && count >= 3) {
      return res.status(403).json({ 
        error: "Límite del Plan PRO alcanzado", 
        message: "Has alcanzado el límite de 3 alias. Sube a ULTIMATE para alias ilimitados." 
      });
    }

    // Si es ULTIMATE o no ha llegado al límite, generamos
    const alias = `${generateRandomString(8)}@zyphro.com`;
    const expiresAt = new Date();
    
    // Forzamos un máximo de duración de 24h (1440 min) si es FREE para evitar abusos
    const finalDuration = user?.plan === 'FREE' ? Math.min(parseInt(durationMinutes) || 60, 1440) : (parseInt(durationMinutes) || 60);
    
    expiresAt.setMinutes(expiresAt.getMinutes() + finalDuration);

    const newAlias = await prisma.anon_aliases.create({
      data: {
        user_id: userId,
        alias_email: alias,
        expires_at: expiresAt
      }
    });
    res.json(newAlias);
  } catch (err) {
    console.error("Error al generar alias:", err);
    res.status(500).json({ error: "Fallo en la generación de identidad fantasma" });
  }
});

// --- 3. RUTA: ELIMINAR UN ALIAS COMPLETO ---
router.delete('/aliases/:aliasId', ClerkExpressRequireAuth(), async (req, res) => {
  const { aliasId } = req.params;
  const userId = req.auth.userId;

  try {
    const id = parseInt(aliasId);

    await prisma.$transaction([
      prisma.received_emails.deleteMany({ where: { alias_id: id } }),
      prisma.anon_aliases.delete({
        where: { id: id, user_id: userId }
      })
    ]);

    res.json({ success: true, message: "Nodo de identidad purgado" });
  } catch (err) {
    res.status(500).json({ error: "No se pudo eliminar el alias" });
  }
});

// --- 4. RUTA: OBTENER MENSAJES ---
router.get('/messages/:aliasId', ClerkExpressRequireAuth(), async (req, res) => {
  const { aliasId } = req.params;
  try {
    const messages = await prisma.received_emails.findMany({
      where: { alias_id: parseInt(aliasId) },
      orderBy: { received_at: 'desc' }
    });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: "Fallo al interceptar mensajes" });
  }
});

// --- 5. RUTA: ELIMINAR CORREO INDIVIDUAL ---
router.delete('/messages/:messageId', ClerkExpressRequireAuth(), async (req, res) => {
  const { messageId } = req.params;
  try {
    await prisma.received_emails.delete({
      where: { id: parseInt(messageId) }
    });
    res.json({ success: true, message: "Rastro de correo eliminado" });
  } catch (err) {
    res.status(500).json({ error: "No se pudo purgar el mensaje" });
  }
});

// --- 6. RUTA: WEBHOOK (RECEPCIÓN DESDE SERVIDOR DE CORREO) ---
router.post('/webhook', async (req, res) => {
  const { recipient, sender, 'body-html': rawEmail } = req.body;
  try {
    const cleanRecipient = recipient.split('<').pop().split('>')[0].toLowerCase().trim();
    const parsed = await simpleParser(rawEmail);
    
    const aliasNode = await prisma.anon_aliases.findFirst({
      where: { alias_email: cleanRecipient }
    });

    if (!aliasNode) return res.status(404).send("Alias inexistente");

    if (new Date() > new Date(aliasNode.expires_at)) {
      return res.status(410).send("Nodo expirado");
    }

    await prisma.received_emails.create({
      data: {
        alias_id: aliasNode.id, 
        from_address: sender || parsed.from?.text || 'Remitente Protegido',
        subject: parsed.subject || '(Sin Asunto)',
        body_html: parsed.html || parsed.textAsHtml || parsed.text || 'Contenido Cifrado Vacío'
      }
    });

    res.status(200).send("OK");
  } catch (err) {
    console.error("❌ Webhook Mail Error:", err);
    res.status(500).send("Error procesando entrada");
  }
});

export default router;