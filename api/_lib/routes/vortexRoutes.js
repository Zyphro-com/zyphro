import express from "express";
import multer from 'multer';
import fs from 'fs';
import { createVortex, getVortex } from "../controllers/vortexController.js";

// Configuración de Multer para subidas temporales (se borran tras cifrar)
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

const upload = multer({ 
  dest: 'uploads/',
  limits: { fileSize: 50 * 1024 * 1024 * 1024 } // 50GB
});

const router = express.Router();

// Public routes: create and fetch
router.post('/create', upload.single('file'), createVortex);
router.get('/:id', getVortex);

export default router;