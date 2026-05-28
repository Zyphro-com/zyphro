import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cron from 'node-cron'; // 👈 Añadida esta importación necesaria
import { prisma } from './db.js';

// --- IMPORTACIÓN DE RUTAS ---
import vortexRoutes from "./_lib/routes/vortexRoutes.js";

const app = express();

// Soporte para BigInt (Vital para manejar bytes de almacenamiento sin errores)
BigInt.prototype.toJSON = function() { 
  return this.toString(); 
};

app.use(cors({ 
  origin: [
    process.env.FRONTEND_URL, 
    'http://localhost:5173',  
    'https://zyphro.com' 
  ].filter(Boolean), 
  credentials: true 
}));


// 2. Parser de JSON con límite aumentado para grandes bloques de texto cifrado
app.use(express.json({ limit: '50mb' })); 

// --- 3. RUTAS MAESTRAS (Vortex-Only Mode) ---
app.use('/api/v1/vortex', vortexRoutes);  // El corazón: Envíos y descargas

// --- 4. MOTOR DE PURGA AUTOMÁTICA (Mantenimiento Efímero) ---
// Se ejecuta cada 10 minutos para limpiar cápsulas expiradas
cron.schedule('*/10 * * * *', async () => {
  try {
    // 🚩 REPARADO: Usamos 'vortex' que es el nombre en tu nuevo Schema.prisma
    const deleted = await prisma.vortex.deleteMany({
      where: {
        expiresAt: { lt: new Date() }
      }
    });

    if (deleted.count > 0) {
      console.log(`🧹 [LIMPIEZA] ${deleted.count} cápsulas desintegradas de la órbita.`);
    }
  } catch (error) {
    console.error('❌ [ERROR_PURGA]:', error.message);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`
  🛸 ZYPHRO VORTEX ENGINE | ONLINE
  --------------------------------
  🛰️  Modo: Solo Vortex (Clean Slate)
  🔒 Cifrado: xChaCha20 Active
  📡 Puerto: ${PORT}
  `);
});