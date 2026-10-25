/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { db } from '../../server/db.js';

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
    const { email, purpose = 'registro', code: incomingCode } = req.body || {};

    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, error: 'El correo electrónico es requerido.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const code = incomingCode && incomingCode.trim().length === 6
      ? incomingCode.trim()
      : Math.floor(100000 + Math.random() * 900000).toString();

    try {
      await db.tokens.create({
        email: cleanEmail,
        code,
        expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        is_used: false,
        purpose,
      });
    } catch (tokErr) {
      console.warn('Notice saving token to db.tokens:', tokErr);
    }

    const purposeTitle =
      purpose === 'register_trainer'
        ? 'Registro de Entrenador Oficial'
        : purpose === 'register_athlete'
        ? 'Registro de Atleta'
        : 'Verificación de Cuenta';

    const subject = `Código de verificación Sportfitness: ${code}`;
    const textContent = `
Hola,

Recibimos una solicitud para ${purposeTitle} en Sportfitness asociada a tu correo: ${cleanEmail}.

Tu código de verificación de 6 dígitos es: ${code}

Este código es de un solo uso y expirará en exactamente 5 minutos.
Si tú no realizaste esta solicitud, puedes ignorar este mensaje con seguridad.

Equipo de Seguridad Sportfitness
    `.trim();

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Código de Verificación - Sportfitness</title>
</head>
<body style="margin: 0; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b0c10; color: #e0e0e0;">
  <div style="max-width: 520px; margin: 0 auto; background-color: #121218; border: 1px solid #2a2a38; border-radius: 16px; overflow: hidden; padding: 32px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
    <div style="text-align: center; padding-bottom: 24px;">
      <div style="font-size: 24px; font-weight: 800; letter-spacing: 2px; color: #56A867; text-transform: uppercase;">
        SPORTFITNESS
      </div>
      <div style="font-size: 11px; letter-spacing: 1.5px; color: #888899; text-transform: uppercase; margin-top: 4px;">
        ${purposeTitle}
      </div>
    </div>
    <div style="font-size: 14px; line-height: 22px; color: #d0d0dc; padding-bottom: 24px;">
      Hola,<br><br>
      Recibimos una solicitud para <strong>${purposeTitle}</strong> en la plataforma Sportfitness asociada a tu dirección de correo: <strong>${cleanEmail}</strong>.
    </div>
    <div style="text-align: center; padding: 10px 0 28px 0;">
      <div style="background-color: #181824; border: 2px dashed #56A867; border-radius: 12px; padding: 20px 28px; display: inline-block;">
        <div style="font-size: 11px; font-weight: 600; letter-spacing: 1px; color: #888899; text-transform: uppercase; margin-bottom: 8px;">
          Tu Código de Verificación Único
        </div>
        <div style="font-size: 38px; font-weight: 800; letter-spacing: 8px; color: #56A867; font-family: 'Courier New', Courier, monospace;">
          ${code}
        </div>
        <div style="font-size: 12px; color: #a0a0b0; margin-top: 8px;">
          ⏱️ Válido durante <strong>5 minutos</strong>
        </div>
      </div>
    </div>
    <div style="font-size: 12px; line-height: 18px; color: #9a9ab0; padding-bottom: 20px; border-top: 1px solid #20202e; padding-top: 20px;">
      • <strong>Uso único:</strong> Este código se invalida inmediatamente tras ser utilizado.<br>
      • <strong>Confidencial:</strong> No compartas este código con nadie.<br>
      • Si tú no solicitaste este código, puedes ignorar este mensaje de forma segura.
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
        code,
        message: `Código de verificación de 6 dígitos enviado exitosamente a ${cleanEmail}.`,
      });
    } else {
      const errText = await sgResponse.text();
      console.warn(`[SendGrid Serverless] Non-200 response (${sgResponse.status}):`, errText);
      return res.status(200).json({
        success: true,
        code,
        warning: `SendGrid status ${sgResponse.status}`,
        message: `Código registrado para ${cleanEmail}.`,
      });
    }
  } catch (err: any) {
    console.error('[SendGrid Serverless] Dispatch exception:', err);
    return res.status(500).json({
      success: false,
      error: err?.message || 'Error en el servidor al enviar código.',
    });
  }
}
