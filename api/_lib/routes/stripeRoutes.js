import express from 'express';
import Stripe from 'stripe';

const router = express.Router();

router.post('/create-checkout', async (req, res) => {
  try {
    // 1. VALIDACIÓN VITAL: Comprobamos la clave ANTES de llamar a Stripe
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error("❌ ERROR CRÍTICO: STRIPE_SECRET_KEY no existe en el archivo .env de la carpeta api");
      return res.status(500).json({ error: "Falta la clave de Stripe en el servidor" });
    }

    // 2. Inicializamos Stripe de forma segura
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    
    const { priceId, email, userId } = req.body;

    if (!priceId) {
      return res.status(400).json({ error: "No se ha enviado el priceId" });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: `http://localhost:5173/dashboard?success=true`,
      cancel_url: `http://localhost:5173/`,
      // Pasamos undefined si el email está vacío para que Stripe no lance error
      customer_email: email || undefined, 
      metadata: { clerkUserId: userId || 'anonymous' }
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error('❌ [STRIPE_API_ERROR]:', error.message);
    res.status(500).json({ error: error.message });
  }
});

export default router;