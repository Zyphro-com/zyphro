import express from "express";
import multer from 'multer';
// ❌ Borramos la importación de 'fs' porque en Vercel no se pueden crear carpetas
import { createVortex, getVortex } from "../controllers/vortexController.js";

// ✅ CONFIGURACIÓN PARA VERCEL: 
// La única carpeta donde Vercel nos deja guardar cosas temporales es en '/tmp/'
const upload = multer({ 
  dest: '/tmp/',
  limits: { fileSize: 50 * 1024 * 1024 } // Límite de 50MB (Para evitar bloqueos de Vercel)
});

const router = express.Router();

// Public routes: create and fetch
router.post('/create', upload.single('file'), createVortex);
router.get('/:id', getVortex);

export default router;