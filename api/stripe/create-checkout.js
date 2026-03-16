import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const { priceId, email, userId } = req.body;

      // 1. VALIDACIÓN BÁSICA
      if (!userId || !email) {
        return res.status(400).json({ error: "Faltan datos de usuario (userId/email)" });
      }

      // 2. CREACIÓN DE LA SESIÓN DE CHECKOUT
      // Usamos el priceId que viene del frontend o uno por defecto si es el Plan Pro
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            // Si no viene priceId, usamos el de tu Plan Pro (asegúrate de ponerlo entre comillas)
            price: priceId || 'price_1T55ewFpFa6kQPuzQZRj0gPb', 
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: `${req.headers.origin}/dashboard?payment_success=true`,
        cancel_url: `${req.headers.origin}/pricing?payment_cancelled=true`,
        customer_email: email,
        
        // 3. METADATA: Vital para que el Webhook sepa a quién actualizar
        metadata: {
          clerkUserId: userId,
        },
        
        // Permite que Stripe guarde el ID del cliente para futuras facturas
        customer_creation: 'always',
      });

      // Enviamos la URL de Stripe para que el frontend redirija al usuario
      res.status(200).json({ url: session.url });

    } catch (err) {
      console.error("Error en Stripe Checkout:", err);
      res.status(500).json({ statusCode: 500, message: err.message });
    }
  } else {
    res.setHeader('Allow', 'POST');
    res.status(405).end('Method Not Allowed');
  }
}