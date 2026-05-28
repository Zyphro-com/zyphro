import { prisma } from "../../db.js";
import fs from 'fs';
import path from 'path';

const MAX_FILE_SIZE = BigInt(500 * 1024 * 1024); // 500MB

export const createVortex = async (req, res) => {
  try {
    let { content, type, expirationHours, maxViews, fileName } = req.body;
    const file = req.file;

    type = (type || (file ? 'FILE' : 'TEXT')).toUpperCase();

    if (type === 'TEXT' && !content) return res.status(400).json({ error: "Contenido vacío." });
    if (type === 'FILE' && !file) return res.status(400).json({ error: "Archivo no detectado." });

    const sizeInBytes = type === 'FILE' ? BigInt(file.size) : BigInt(Buffer.byteLength(content || '', 'utf8'));

    if (sizeInBytes > MAX_FILE_SIZE) {
      if (file && fs.existsSync(file.path)) fs.unlinkSync(file.path);
      return res.status(400).json({ error: "El archivo supera el límite técnico de 500MB." });
    }

    const parsedExpiration = parseInt(expirationHours) || 24;
    const parsedMaxViews = parseInt(maxViews) || 1;
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + parsedExpiration);

    const newVortex = await prisma.vortex.create({
      data: {
        type,
        fileName: type === 'FILE' ? (fileName || file.originalname) : "nota_cifrada.txt",
        fileSize: sizeInBytes,
        mimeType: type === 'FILE' ? file.mimetype : "text/plain",
        s3Key: type === 'FILE' ? file.path : null,
        textContent: type === 'TEXT' ? content : null,
        expiresAt,
        maxViews: parsedMaxViews,
      }
    });

    return res.status(200).json({ success: true, vortexId: newVortex.id });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    console.error("❌ ERROR_VORTEX_ENGINE:", error);
    return res.status(500).json({ error: "Fallo interno en el motor de cifrado." });
  }
};

export const getVortex = async (req, res) => {
  try {
    const { id } = req.params;
    const vortex = await prisma.vortex.findUnique({ where: { id } });

    if (!vortex) return res.status(404).json({ error: "Cápsula no encontrada o ya desintegrada." });

    const desintegrate = async () => {
      try {
        await prisma.vortex.delete({ where: { id } });
        if (vortex.type === 'FILE' && vortex.s3Key && fs.existsSync(vortex.s3Key)) {
          fs.unlinkSync(vortex.s3Key);
        }
      } catch (e) { console.error("Error en purga:", e); }
    };

    if (new Date() > new Date(vortex.expiresAt)) {
      await desintegrate();
      return res.status(410).json({ error: "Cápsula expirada por límite de tiempo." });
    }

    let content = vortex.textContent;
    if (vortex.type === 'FILE') {
      try {
        content = fs.readFileSync(path.resolve(vortex.s3Key), 'utf-8');
      } catch (err) {
        return res.status(404).json({ error: "Archivo físico no encontrado." });
      }
    }

    const updated = await prisma.vortex.update({
      where: { id },
      data: { downloadCount: { increment: 1 } }
    });

    if (updated.downloadCount >= updated.maxViews) {
      await desintegrate();
    }

    return res.json({
      fileName: vortex.fileName,
      type: vortex.type,
      content,
      expiresAt: vortex.expiresAt,
      downloadCount: updated.downloadCount,
      remainingViews: Math.max(0, (updated.maxViews - updated.downloadCount))
    });

  } catch (error) {
    console.error("❌ ERROR_GET_VORTEX:", error);
    return res.status(500).json({ error: "Fallo al acceder al nodo." });
  }
};