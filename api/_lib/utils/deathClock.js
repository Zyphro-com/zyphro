import { prisma } from "../../db.js";
import { Resend } from 'resend';

export const checkDeadManSwitches = async () => {
  const now = new Date();
  
  if (!process.env.RESEND_API_KEY) {
    console.error("❌ [VIGÍA] Error: RESEND_API_KEY no configurada.");
    return;
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  console.log(`⏱️ [VIGÍA] Escaneando latidos del búnker... (${now.toLocaleTimeString()})`);
  
  try {
    // 1. FILTRADO DE SUJETOS EN RIESGO
    const users = await prisma.user.findMany({
      where: {
        switchEnabled: true,
        dmsStatus: { in: ["IDLE", "WARNING"] },
      },
      include: {
        secrets: true 
      }
    });

    for (const user of users) {
      if (!user.lastCheckIn || !user.recipientEmail) continue;

      // Calculamos el intervalo (dmsInterval en horas o checkInInterval en días)
      // Asumiendo que 'checkInInterval' son días según tu código
      const intervalMs = user.checkInInterval * 24 * 60 * 60 * 1000;
      const expirationTime = new Date(user.lastCheckIn.getTime() + intervalMs);
      
      if (now > expirationTime) {
        console.log(`🚨 [DMS] PROTOCOLO ACTIVADO para: ${user.email || user.id}`);

        // Construcción de la lista de herencia
        const listaVortices = user.secrets.map(s => {
  const tituloLimpio = s.title.replace(/\[HERENCIA\]/g, '').trim();
  return `<li style="margin-bottom: 10px;">
            <strong style="color: #2563eb;">${tituloLimpio}</strong><br/>
            <code style="font-size: 11px; background: #f1f5f9; padding: 2px 5px;">ID: ${s.id}</code>
          </li>`;
}).join('');

        const { error } = await resend.emails.send({
          from: 'Zyphro Security <bunker@zyphro.com>', 
          to: user.recipientEmail,
          subject: '🚨 ACCESO DE EMERGENCIA: Protocolo Zyphro Activado',
          html: `
            <div style="font-family: sans-serif; padding: 20px; color: #0f172a; background-color: #f8fafc;">
              <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; padding: 40px; border-radius: 16px; shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);">
                <h1 style="color: #2563eb; font-size: 24px; font-weight: 900; font-style: italic; text-transform: uppercase;">ZYPHRO PROTOCOL</h1>
                <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;"/>
                <p style="font-size: 16px; line-height: 1.6;">Se ha detectado una inactividad prolongada y falta de respuesta en la cuenta de seguridad de <strong>${user.email || 'Agente Anon'}</strong>.</p>
                
                <div style="background: #0f172a; padding: 20px; border-radius: 12px; margin: 25px 0; color: #f8fafc;">
                  <h3 style="margin-top: 0; color: #3b82f6; font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em;">Mensaje Póstumo:</h3>
                  <p style="font-family: monospace; font-size: 14px; margin-bottom: 0;">"${user.dmsNote || 'El emisor no adjuntó una nota para este activo.'}"</p>
                </div>

                <h3 style="font-size: 14px; text-transform: uppercase; color: #64748b;">Activos Digitales Liberados:</h3>
                <ul style="list-style: none; padding: 0;">
                  ${listaVortices || '<li style="color: #94a3b8;">No se encontraron activos en el búnker de herencia.</li>'}
                </ul>
                
                <div style="margin-top: 40px; padding: 20px; border-top: 1px solid #e2e8f0;">
                  <p style="font-size: 11px; color: #94a3b8; line-height: 1.5; text-align: center;">
                    <strong>AVISO DE SEGURIDAD:</strong> Estos activos han sido liberados por inactividad. Zyphro utiliza cifrado XChaCha20 de extremo a extremo. Si el contenido requiere llaves de descifrado, estas deben haber sido proporcionadas por el emisor de forma independiente. Zyphro no tiene acceso a las llaves maestras.
                  </p>
                </div>
              </div>
            </div>
          `
        });

        if (!error) {
          // Desactivamos el switch para evitar bucles de correo
          await prisma.user.update({
            where: { id: user.id },
            data: { dmsStatus: "TRIGGERED", switchEnabled: false }
          });
          console.log(`✅ [DMS] Herencia entregada con éxito a: ${user.recipientEmail}`);
        } else {
          console.error("❌ [DMS] Error al enviar email con Resend:", error);
        }
      }
    }
  } catch (error) {
    console.error("❌ [VIGÍA] Fallo crítico en el escaneo:", error);
  }
};