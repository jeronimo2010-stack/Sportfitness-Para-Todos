/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { db } from '../../../server/db.js';
import { verificationService } from '../../../server/verificationService.js';

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
    const { email, code: incomingCode } = req.body || {};

    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, error: 'El correo electrónico es requerido.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const code = incomingCode && incomingCode.trim().length === 6
      ? incomingCode.trim()
      : Math.floor(100000 + Math.random() * 900000).toString();

    // Generate cryptographic stateless verification state token
    const pendingToken = verificationService.generateSignedState(cleanEmail, code, 'password_reset', 15);

    try {
      await db.tokens.create({
        email: cleanEmail,
        code,
        expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        is_used: false,
        purpose: 'password_reset',
      });
    } catch (tokErr) {
      console.warn('Notice saving recovery token to db.tokens:', tokErr);
    }

    const subject = `Código de recuperación Sportfitness: ${code}`;
    const textContent = `
Hola,

Recibimos una solicitud para restablecer la contraseña de tu cuenta Sportfitness (${cleanEmail}).

Tu código de recuperación de 6 dígitos es: ${code}

Este código tiene una validez de 5 minutos.
Si tú no realizaste esta solicitud, puedes ignorar este mensaje; tu contraseña actual no será modificada.

Equipo de Seguridad Sportfitness
    `.trim();

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Recuperación de Contraseña - Sportfitness</title>
</head>
<body style="margin: 0; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b0c10; color: #e0e0e0;">
  <div style="max-width: 520px; margin: 0 auto; background-color: #121218; border: 1px solid #2a2a38; border-radius: 16px; overflow: hidden; padding: 32px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
    <div style="text-align: center; padding-bottom: 24px;">
      <div style="font-size: 24px; font-weight: 800; letter-spacing: 2px; color: #56A867; text-transform: uppercase;">
        SPORTFITNESS
      </div>
      <div style="font-size: 11px; letter-spacing: 1.5px; color: #888899; text-transform: uppercase; margin-top: 4px;">
        Recuperación de Contraseña
      </div>
    </div>
    <div style="font-size: 14px; line-height: 22px; color: #d0d0dc; padding-bottom: 24px;">
      Hola,<br><br>
      Recibimos una solicitud para restablecer la contraseña de acceso a tu cuenta en <strong>Sportfitness</strong> asociada al correo: <strong>${cleanEmail}</strong>.
    </div>
    <div style="text-align: center; padding: 10px 0 28px 0;">
      <div style="background-color: #181824; border: 2px dashed #56A867; border-radius: 12px; padding: 20px 28px; display: inline-block;">
        <div style="font-size: 11px; font-weight: 600; letter-spacing: 1px; color: #888899; text-transform: uppercase; margin-bottom: 8px;">
          Tu Código de Recuperación Único
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
      • Ingresa este código de 6 dígitos en la ventana de recuperación para definir una contraseña nueva.<br>
      • Si tú no solicitaste este cambio, puedes ignorar este correo; tu cuenta permanece 100% segura.
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

    // Set cookie for stateless verification
    res.setHeader(
      'Set-Cookie',
      `sf_verify_state=${pendingToken}; Path=/; Max-Age=900; SameSite=Lax`
    );

    if (sgResponse.status >= 200 && sgResponse.status < 300) {
      return res.status(200).json({
        success: true,
        code,
        pendingVerificationToken: pendingToken,
        message: `Código de recuperación enviado a ${cleanEmail}. Revisa tu bandeja de entrada o spam.`,
      });
    } else {
      const errText = await sgResponse.text();
      console.warn(`[SendGrid Serverless] Non-200 response (${sgResponse.status}):`, errText);
      return res.status(200).json({
        success: true,
        code,
        pendingVerificationToken: pendingToken,
        warning: `SendGrid status ${sgResponse.status}`,
        message: `Código de recuperación generado para ${cleanEmail}.`,
      });
    }
  } catch (err: any) {
    console.error('[SendGrid Serverless] Dispatch exception:', err);
    return res.status(500).json({
      success: false,
      error: err?.message || 'Error en el servidor al enviar código de recuperación.',
    });
  }
}
