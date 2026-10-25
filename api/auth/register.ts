/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { serverDatabase } from '../../server/db.js';
import { verificationService } from '../../server/verificationService.js';
import { emailService } from '../../server/emailService.js';

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
    const {
      id,
      email,
      password,
      documentType,
      documentNumber,
      phone,
      firstName,
      lastName,
      role,
      trainerCode,
      weight,
      height,
      clothingSize,
      bodyType,
      verificationToken,
    } = req.body || {};

    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, error: 'El correo electrónico es obligatorio.' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, error: 'La contraseña debe tener al menos 6 caracteres.' });
    }
    if (!documentNumber || !documentNumber.trim()) {
      return res.status(400).json({ success: false, error: 'El número de documento / ID es obligatorio.' });
    }
    if (!phone || !phone.trim()) {
      return res.status(400).json({ success: false, error: 'El número de teléfono es obligatorio.' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Security requirement: Require and consume single-use verificationToken
    if (!verificationToken || typeof verificationToken !== 'string') {
      return res.status(403).json({
        success: false,
        error: 'Token de verificación requerido',
        message: 'Debes validar tu correo con el código de 6 dígitos antes de completar tu registro.',
      });
    }

    const isTokenValid = await verificationService.consumeVerificationTokenAsync(verificationToken, cleanEmail);
    if (!isTokenValid) {
      return res.status(403).json({
        success: false,
        error: 'Token expirado o inválido',
        message: 'La sesión de verificación ha expirado o el token es inválido. Solicita un nuevo código de verificación.',
      });
    }

    const weightNum = Number(weight) || 75;
    const heightNum = Number(height) || 175;
    const sizeVal = (clothingSize as any) || 'M';

    const assignedRole = role === 'entrenador' ? 'entrenador' : 'atleta';

    const result = serverDatabase.registerUser({
      id: id || undefined,
      email,
      password,
      documentType: documentType || 'Cédula de Ciudadanía (CC)',
      documentNumber,
      phone,
      trainerCode: trainerCode || undefined,
      firstName: firstName || 'Atleta',
      lastName: lastName || 'Sportfitness',
      role: assignedRole,
      weight: weightNum,
      height: heightNum,
      clothingSize: sizeVal,
      bodyType: bodyType || 'Mesomorfo',
    });

    if (!result.success || !result.user) {
      if (result.error && result.error.includes('ya se encuentra registrado')) {
        const existing = await serverDatabase.findUserByEmailAsync(cleanEmail);
        if (existing) {
          const authCheck = serverDatabase.authenticateUser(cleanEmail, password, trainerCode);
          if (authCheck.success && authCheck.user) {
            const token = serverDatabase.createSession(authCheck.user.id);
            const { passwordHash, salt, ...safeUser } = authCheck.user;
            return res.status(200).json({
              success: true,
              alreadyRegistered: true,
              message: 'Usuario previamente registrado. Sesión autenticada y métricas sincronizadas.',
              token,
              user: safeUser,
              role: safeUser.role,
              trainerCode: safeUser.trainerCode,
            });
          }
        }
      }
      return res.status(400).json({
        success: false,
        error: result.error || 'No se pudo registrar el usuario.',
        alreadyRegistered: result.error?.includes('ya se encuentra registrado') || false,
      });
    }

    if (assignedRole === 'entrenador' && result.user.trainerCode) {
      emailService
        .sendTrainerCredentialEmail(result.user.email, result.user.fullName, result.user.trainerCode)
        .catch((err) => console.error('Error sending trainer credential email:', err));
    }

    const token = serverDatabase.createSession(result.user.id);
    const { passwordHash, salt, ...safeUser } = result.user;

    return res.status(201).json({
      success: true,
      message:
        assignedRole === 'entrenador'
          ? `Entrenador registrado con éxito. Se ha enviado tu Número de Identificación (${safeUser.trainerCode}) a tu correo.`
          : 'Usuario registrado con éxito. Bienvenido a Sportfitness.',
      token,
      user: safeUser,
      role: safeUser.role,
      trainerCode: safeUser.trainerCode,
    });
  } catch (err: any) {
    console.error('Register Handler Error:', err);
    return res.status(500).json({ success: false, error: 'Error en el servidor al registrar usuario.' });
  }
}
