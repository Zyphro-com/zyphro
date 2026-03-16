import express from 'express';
import Stripe from 'stripe';
import { prisma } from '../../db.js';

const router = express.Router();

const STRIPE_PRICES = {
  PRO_MONTHLY: 'price_1TAYf2FpFa6kQPuztxhIESLJ', 
  PRO_ANNUAL: 'price_1T59P6FpFa6kQPuzVk3UOfqq', 
  ULT_MONTHLY: 'price_1TAYgAFpFa6kQPuzhTuU91BR',
  ULT_ANNUAL: 'price_1T59PqFpFa6kQPuzn5i55xRk'
};

// Capacidades exactas
const BYTES_100MB = BigInt(104857600);
const BYTES_10GB = BigInt(10737418240);
const BYTES_50GB = BigInt(53687091200);

router.post('/', express.raw({ type: 'application/json' }), async (req, res) => {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // 1. EL PAGO SE HA COMPLETADO
  if (event.type === 'checkout.session.completed') {
    const session = await stripe.checkout.sessions.retrieve(
      event.data.object.id,
      { expand: ['line_items'] }
    );
    
    const clerkUserId = session.metadata?.userId || session.metadata?.clerkUserId;
    const stripeCustomerId = session.customer;
    const priceId = session.line_items?.data[0]?.price.id;

    if (clerkUserId) {
      let planToApply = 'FREE';
      let storageBytes = BYTES_100MB;

      // Lógica de asignación por Price ID
      if (priceId === STRIPE_PRICES.PRO_MONTHLY || priceId === STRIPE_PRICES.PRO_ANNUAL) {
        planToApply = 'PRO';
        storageBytes = BYTES_10GB;
      } else if (priceId === STRIPE_PRICES.ULT_MONTHLY || priceId === STRIPE_PRICES.ULT_ANNUAL) {
        planToApply = 'ULTIMATE'; // ⚡ Unificado a ULTIMATE
        storageBytes = BYTES_50GB;
      }

      console.log(`⚡ ASCENSO: ${clerkUserId} -> ${planToApply} (${storageBytes} bytes)`);

      await prisma.user.update({
        where: { id: clerkUserId },
        data: {
          plan: planToApply,
          stripeCustomerId: stripeCustomerId,
          storageLimit: storageBytes,
        },
      });
    }
  }

  // 2. LA SUSCRIPCIÓN SE HA CANCELADO (Impago o manual)
  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object;
    const user = await prisma.user.findFirst({
      where: { stripeCustomerId: subscription.customer }
    });
    
    if (user) {
      console.log(`📉 DEGRADACIÓN: ${user.id} vuelve a FREE.`);
      await prisma.user.update({
        where: { id: user.id },
        data: {
          plan: 'FREE',
          storageLimit: BYTES_100MB 
        }
      });
    }
  }

  res.status(200).json({ received: true });
});

export default router;