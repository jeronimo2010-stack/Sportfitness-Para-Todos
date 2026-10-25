import { verificarCodigo } from '../../server/db.js';
import { getAdminFirestore } from '../../server/firebaseAdmin.js';
import crypto from 'crypto';

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
    const { email, code } = req.body || {};

    if (!email || !code) {
      return res.status(400).json({ success: false, error: 'Email y código son requeridos.' });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanCode = String(code).trim();
    if (cleanCode.length !== 6) {
      return res.status(400).json({ success: false, error: 'El código debe tener 6 dígitos.' });
    }

    try {
      const result = await verificarCodigo(cleanEmail, cleanCode);
      const verificationToken = `vtok_${crypto.randomBytes(24).toString('hex')}`;

      // Persist verification token in Firestore for cross-lambda consumption
      const firestore = getAdminFirestore();
      if (firestore) {
        await firestore.collection('verification_tokens').doc(verificationToken).set({
          token: verificationToken,
          email: cleanEmail,
          purpose: 'verification',
          expiresAt: Date.now() + 10 * 60 * 1000,
          createdAt: Date.now(),
        }).catch((err) => console.warn('[Firestore Admin] Notice saving verificationToken:', err));
      }

      return res.status(200).json({
        success: true,
        message: result.message,
        verificationToken,
      });
    } catch (verifErr: any) {
      return res.status(400).json({
        success: false,
        error: verifErr.message || 'El código es incorrecto o ya ha sido utilizado.',
        message: verifErr.message || 'El código es incorrecto o ya ha sido utilizado.',
      });
    }
  } catch (err: any) {
    return res.status(500).json({ success: false, error: 'Error al verificar el código.' });
  }
}
