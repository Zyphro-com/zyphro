import express from "express";
import multer from 'multer';
import fs from 'fs';
import { createVortex, getVortex } from "../controllers/vortexController.js";

if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

const upload = multer({ 
  dest: 'uploads/',
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB (o el límite que quieras)
});

const router = express.Router();

router.post('/create', upload.single('file'), createVortex);
router.get('/:id', getVortex);

export default router;