import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { prisma } from './db.js';

import vortexRoutes from "./_lib/routes/vortexRoutes.js";

const app = express();

BigInt.prototype.toJSON = function() { 
  return this.toString(); 
};

app.use(cors({ 
  origin: [
    process.env.FRONTEND_URL, 
    'http://localhost:5173',  
    'https://zyphro.com',
    'https://www.zyphro.com'
  ].filter(Boolean), 
  credentials: true 
}));

app.use(express.json({ limit: '50mb' })); 

// --- RUTAS MAESTRAS ---
app.use('/api/v1/vortex', vortexRoutes);  

// --- ENDPOINT PARA EL CRON JOB DE VERCEL ---
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

if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`🛸 ZYPHRO VORTEX ENGINE | LOCAL ONLINE EN PUERTO ${PORT}`);
  });
}

// 🚀 VITAL PARA VERCEL: Apagamos su analizador automático 
// para que no rompa los archivos de Multer al subirlos.
export const config = {
  api: {
    bodyParser: false,
  },
};

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🛸 ZYPHRO VORTEX ENGINE | ONLINE EN PUERTO ${PORT}`);
});