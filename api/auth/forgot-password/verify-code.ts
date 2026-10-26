import { verificarCodigo } from '../../../server/db.js';
import { verificationService } from '../../../server/verificationService.js';
import { getAdminFirestore } from '../../../server/firebaseAdmin.js';

function parseCookies(cookieHeader?: string): Record<string, string> {
  const list: Record<string, string> = {};
  if (!cookieHeader) return list;
  cookieHeader.split(';').forEach((cookie) => {
    const [name, ...rest] = cookie.split('=');
    const cleanName = name?.trim();
    if (!cleanName) return;
    const value = rest.join('=').trim();
    list[cleanName] = decodeURIComponent(value);
  });
  return list;
}

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
    const { email, code, pendingToken: bodyPendingToken } = req.body || {};

    if (!email || !code) {
      return res.status(400).json({ success: false, error: 'Email y código son requeridos.' });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanCode = String(code).trim();
    if (cleanCode.length !== 6) {
      return res.status(400).json({ success: false, error: 'El código debe tener 6 dígitos.' });
    }

    const cookies = parseCookies(req.headers.cookie);
    const pendingToken = bodyPendingToken || cookies['sf_verify_state'];

    try {
      const result = await verificarCodigo(cleanEmail, cleanCode, pendingToken);
      const verificationToken = verificationService.generateSignedVerificationToken(cleanEmail, 'password_reset');

      // Clear the pending verification state cookie
      res.setHeader('Set-Cookie', 'sf_verify_state=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax');

      const firestore = getAdminFirestore();
      if (firestore) {
        await firestore.collection('verification_tokens').doc(verificationToken).set({
          token: verificationToken,
          email: cleanEmail,
          purpose: 'password_reset',
          expiresAt: Date.now() + 15 * 60 * 1000,
          createdAt: Date.now(),
        }).catch((err) => console.warn('[Firestore Admin] Notice saving password reset token:', err));
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
    return res.status(500).json({ success: false, error: 'Error al verificar el código de recuperación.' });
  }
}
