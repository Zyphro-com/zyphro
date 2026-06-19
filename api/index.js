import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { prisma } from './db.js';

import vortexRoutes from "./_lib/routes/vortexRoutes.js";

const app = express();

// Solución para que Prisma procese los números BigInt en los JSON
BigInt.prototype.toJSON = function() { 
  return this.toString(); 
};

// 🚀 CONFIGURACIÓN CORS UNIFICADA Y SEGURA
const allowedOrigins = [
  process.env.FRONTEND_URL, 
  'http://localhost:5173',  
  'https://zyphro.com',
  'https://www.zyphro.com'
].filter(Boolean);

app.use(cors({ 
  origin: allowedOrigins, 
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  credentials: true 
}));

// Responder automáticamente a las peticiones de pre-vuelo (OPTIONS) antes de las rutas
app.options('*', cors());

app.use(express.json({ limit: '50mb' })); 

// --- RUTAS MAESTRAS ---
app.use('/api/v1/vortex', vortexRoutes);  

// --- ENDPOINT PARA EL CRON JOB ---
app.get('/api/v1/vortex/cleanup', async (req, res) => {
  try {
    const deleted = await prisma.vortex.deleteMany({
      where: { expiresAt: { lt: new Date() } }
    });
    res.status(200).json({ message: `Cápsulas borradas: ${deleted.count}` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 🚀 UN SÓLO LISTENER PARA TODO (Funciona en Local y en Render)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🛸 ZYPHRO VORTEX ENGINE | ONLINE EN PUERTO ${PORT}`);
});