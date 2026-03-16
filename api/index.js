import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import cron from 'node-cron';
import { rateLimit } from 'express-rate-limit';
import { prisma } from './db.js';

// --- IMPORTACIÓN DE RUTAS ---
import stripeRoutes from './_lib/routes/stripeRoutes.js';
import stripeWebhook from './_lib/routes/stripeWebhook.js';
import apiKeyRoutes from "./_lib/routes/apiKeyRoutes.js";
import vortexRoutes from "./_lib/routes/vortexRoutes.js";
import secretRoutes from './_lib/routes/secrets.js'; 
import switchRoutes from './_lib/routes/switch.js';
import mailRoutes from './_lib/routes/mail.js';
import vaultRoutes from './_lib/routes/vault.js';
import userRoutes from './_lib/routes/userRoutes.js';
import { checkDeadManSwitches } from './_lib/utils/deathClock.js';

const app = express();
BigInt.prototype.toJSON = function() {
  return this.toString();
};
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- 1. CONFIGURACIÓN INICIAL Y PARSERS ---
app.set('trust proxy', 1); 
app.use(cors());
app.use(morgan('dev'));

// Webhook debe ir ANTES de express.json()
app.use('/api/webhook/stripe', express.raw({ type: 'application/json' }), stripeWebhook);

app.use(express.json({ limit: '10mb' })); 

// --- 2. RUTAS DE SISTEMA Y PAGOS ---
app.use('/api/stripe', stripeRoutes);
app.use('/api/v1/user', userRoutes); // <--- REGISTRO DE LA NUEVA RUTA

// --- 3. RUTAS DE SERVICIOS ---
app.use('/api/v1/mail', mailRoutes); 
app.use('/api/v1/vault', vaultRoutes);

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  message: { error: "Demasiadas peticiones." }
});

const createVortexLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 5, 
  message: { error: "Límite de creación alcanzado." }
});

app.use(generalLimiter);
app.use("/api/v1/vortex/create", createVortexLimiter); 
app.use("/api/v1/vortex", vortexRoutes);
app.use("/api/keys", apiKeyRoutes);
app.use('/api/messages', secretRoutes); 
app.use('/api/switch', switchRoutes);

// --- 4. PRODUCCIÓN Y CRON JOBS ---
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist', 'index.html'));
  });
}

const PORT = process.env.PORT || 3000;

// CRON: DMS y Purga de Mail
cron.schedule('* * * * *', () => { checkDeadManSwitches(); });
cron.schedule('*/10 * * * *', async () => {
  try {
    await prisma.anon_aliases.deleteMany({ where: { expires_at: { lt: new Date() } } });
  } catch (error) { console.error('❌ ERROR_PURGA:', error); }
});

app.listen(PORT, () => {
  console.log(`🚀 ZYPHRO CORE BLINDADO | Puerto: ${PORT} | XChaCha20`);
});