/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { serverDatabase } from '../../../server/db.js';
import { verificationService } from '../../../server/verificationService.js';

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
    const { email, newPassword, verificationToken } = req.body || {};
    if (!email || !newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'La nueva contraseña debe tener al menos 6 caracteres.',
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    if (verificationToken) {
      const isValid = await verificationService.consumeVerificationTokenAsync(verificationToken, cleanEmail);
      if (!isValid) {
        return res.status(403).json({
          success: false,
          error: 'Token expirado o inválido',
          message: 'La sesión de verificación ha expirado. Por favor solicita un nuevo código.',
        });
      }
    }

    const user = await serverDatabase.findUserByEmailAsync(cleanEmail);
    if (user) {
      serverDatabase.adminResetPassword(user.id, newPassword);
    }

    return res.status(200).json({
      success: true,
      message: 'Tu contraseña ha sido actualizada exitosamente. Ya puedes iniciar sesión.',
    });
  } catch (err: any) {
    console.error('Password reset handler error:', err);
    return res.status(500).json({ success: false, error: 'Error al actualizar la contraseña.' });
  }
}
