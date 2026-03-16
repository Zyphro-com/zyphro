import 'dotenv/config';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

async function testVortexMail() {
  console.log("🚀 Probando conexión con Zyphro Mail...");
  
  const { data, error } = await resend.emails.send({
    from: 'Zyphro Test <bunker@zyphro.com>',
    to: 'TU_CORREO_PERSONAL@gmail.com', // Pon tu email aquí para ver si llega
    subject: '🧪 TEST: Conexión del Búnker establecida',
    html: '<strong>Si recibes esto, el protocolo DMS ya puede enviar herencias desde zyphro.com</strong>'
  });

  if (error) {
    return console.error("❌ Error de Resend:", error);
  }

  console.log("✅ ¡Correo enviado! ID:", data.id);
}

testVortexMail();