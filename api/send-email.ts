/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

const SENDGRID_API_KEY =
  process.env.SENDGRID_API_KEY || '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';
const SENDGRID_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'sportfitness112@gmail.com';
const SENDGRID_FROM_NAME = process.env.SENDGRID_FROM_NAME || 'Sportfitness';
const SENDGRID_REPLY_TO = process.env.SENDGRID_REPLY_TO || 'mateobedoy20@gmail.com';

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
    const { to, subject, text, html, senderName, replyTo } = req.body || {};

    if (!to) {
      return res.status(400).json({ success: false, error: 'Recipient "to" email is required.' });
    }

    const recipients = Array.isArray(to) ? to : [to];
    const cleanRecipients = recipients.map((r: string) => ({ email: r.trim().toLowerCase() }));

    const payload = {
      personalizations: [{ to: cleanRecipients }],
      from: {
        email: SENDGRID_FROM_EMAIL,
        name: senderName || SENDGRID_FROM_NAME,
      },
      reply_to: {
        email: replyTo || SENDGRID_REPLY_TO,
        name: 'Sportfitness Soporte',
      },
      subject: subject || 'Notificación de Sportfitness',
      content: [
        {
          type: 'text/plain',
          value: text || 'Notificación de Sportfitness',
        },
        {
          type: 'text/html',
          value: html || `<p>${(text || '').replace(/\n/g, '<br/>')}</p>`,
        },
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
      const messageId = sgResponse.headers.get('x-message-id') || `sg-${Date.now()}`;
      return res.status(200).json({
        success: true,
        message: 'Correo despachado exitosamente mediante SendGrid.',
        messageId,
      });
    } else {
      const errorText = await sgResponse.text();
      console.warn(`[Vercel SendGrid] Non-200 response (${sgResponse.status}):`, errorText);
      return res.status(sgResponse.status).json({
        success: false,
        error: `SendGrid error (${sgResponse.status}): ${errorText}`,
      });
    }
  } catch (error: any) {
    console.error('[Vercel SendGrid] Dispatch error:', error);
    return res.status(500).json({
      success: false,
      error: error?.message || 'Error interno despachando correo con SendGrid.',
    });
  }
}
