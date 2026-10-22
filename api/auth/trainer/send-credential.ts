/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

const SENDGRID_API_KEY = (process.env.SENDGRID_API_KEY || '').trim();
const SENDGRID_FROM_EMAIL = (process.env.SENDGRID_FROM_EMAIL || 'sportfitness112@gmail.com').trim();
const SENDGRID_FROM_NAME = (process.env.SENDGRID_FROM_NAME || 'Sportfitness').trim();
const SENDGRID_REPLY_TO = (process.env.SENDGRID_REPLY_TO || 'mateobedoy20@gmail.com').trim();

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  try {
    const { email, trainerName, trainerCode } = req.body || {};

    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, error: 'El correo electrónico es requerido.' });
    }
    if (!trainerCode || !trainerCode.trim()) {
      return res.status(400).json({ success: false, error: 'El código de entrenador es requerido.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanCode = trainerCode.trim().toUpperCase();
    const name = (trainerName || 'Entrenador').trim();

    const mandatoryNotice = `su Numero de Identificacion que lo distinguira entre los entrenadores es:${cleanCode} solo se le enviara 1 vez y sera necesario para iniciar sesion en la pagina`;

    const subject = `Tu Número de Identificación de Entrenador Sportfitness: ${cleanCode}`;
    const textContent = `
Hola ${name},

¡Bienvenido a Sportfitness!

${mandatoryNotice}

Por favor guarda este número en un lugar seguro.

Equipo Sportfitness
    `.trim();

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Número de Identificación de Entrenador - Sportfitness</title>
</head>
<body style="margin: 0; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b0c10; color: #e0e0e0;">
  <div style="max-width: 540px; margin: 0 auto; background-color: #121218; border: 1px solid #2a2a38; border-radius: 16px; overflow: hidden; padding: 32px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
    <div style="text-align: center; padding-bottom: 24px;">
      <div style="font-size: 24px; font-weight: 800; letter-spacing: 2px; color: #56A867; text-transform: uppercase;">
        SPORTFITNESS COACH
      </div>
      <div style="font-size: 11px; letter-spacing: 1.5px; color: #888899; text-transform: uppercase; margin-top: 4px;">
        Identificación Oficial de Entrenador
      </div>
    </div>
    
    <div style="font-size: 15px; line-height: 24px; color: #d0d0dc; padding-bottom: 20px;">
      Hola <strong>${name}</strong>,<br><br>
      Tu cuenta de entrenador en <strong>Sportfitness</strong> ha sido creada exitosamente.
    </div>

    <!-- Official Notice Card -->
    <div style="background-color: #181824; border: 2px solid #56A867; border-radius: 12px; padding: 22px 26px; margin: 10px 0 24px 0; text-align: center;">
      <div style="font-size: 14px; font-weight: 600; line-height: 22px; color: #f0f0f5; margin-bottom: 14px;">
        su Numero de Identificacion que lo distinguira entre los entrenadores es:
      </div>
      <div style="font-size: 36px; font-weight: 900; letter-spacing: 6px; color: #56A867; font-family: 'Courier New', Courier, monospace; padding: 10px 0;">
        ${cleanCode}
      </div>
      <div style="font-size: 13px; color: #ffb84d; font-weight: 600; margin-top: 10px; line-height: 18px;">
        solo se le enviara 1 vez y sera necesario para iniciar sesion en la pagina
      </div>
    </div>

    <div style="font-size: 12px; line-height: 19px; color: #9a9ab0; padding-bottom: 20px; border-top: 1px solid #20202e; padding-top: 20px;">
      • <strong>Acceso a la plataforma:</strong> Para ingresar a tu panel de entrenador, siempre se te solicitará este código.<br>
      • <strong>Seguridad:</strong> Guarda este correo o anota tu código en un lugar seguro para no perder el acceso a tu cuenta.
    </div>
    <div style="text-align: center; font-size: 11px; color: #666677; border-top: 1px solid #1a1a24; padding-top: 16px;">
      © ${new Date().getFullYear()} Sportfitness Platform. Todos los derechos reservados.
    </div>
  </div>
</body>
</html>
    `.trim();

    const payload = {
      personalizations: [{ to: [{ email: cleanEmail }] }],
      from: { email: SENDGRID_FROM_EMAIL, name: SENDGRID_FROM_NAME },
      reply_to: { email: SENDGRID_REPLY_TO, name: 'Sportfitness Soporte' },
      subject,
      content: [
        { type: 'text/plain', value: textContent },
        { type: 'text/html', value: htmlContent },
      ],
    };

    const sgResponse = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (sgResponse.status >= 200 && sgResponse.status < 300) {
      return res.status(200).json({
        success: true,
        message: 'Código de identificación de entrenador despachado exitosamente mediante SendGrid.',
      });
    } else {
      const errText = await sgResponse.text();
      console.warn(`[Trainer Credential Serverless] SendGrid non-200:`, errText);
      return res.status(200).json({
        success: true,
        warning: `SendGrid status ${sgResponse.status}`,
        message: 'Identificación de entrenador procesada.',
      });
    }
  } catch (err: any) {
    console.error('[Trainer Credential Serverless] Error:', err);
    return res.status(500).json({
      success: false,
      error: err?.message || 'Error en el servidor al despachar identificación de entrenador.',
    });
  }
}
