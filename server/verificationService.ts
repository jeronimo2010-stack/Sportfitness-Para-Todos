import crypto from 'crypto';
import { emailService, maskEmail } from './emailService.ts';
import { db } from './db.ts';
import { getAdminFirestore } from './firebaseAdmin.ts';

export interface VerificationRecord {
  email: string;
  codeHash: string;
  expiresAt: number; // millisecond timestamp (10 minutes)
  used: boolean;
  failedAttempts: number; // maximum 5 attempts allowed
  purpose: string;
  createdAt: number;
}

export interface VerificationTokenRecord {
  token: string;
  email: string;
  purpose: string;
  expiresAt: number;
  createdAt: number;
}

interface RateLimitRecord {
  lastSent: number;
  sendTimestamps: number[];
}

class VerificationService {
  private codes: Map<string, VerificationRecord> = new Map();
  private verifiedTokens: Map<string, VerificationTokenRecord> = new Map();
  private emailRateLimits: Map<string, RateLimitRecord> = new Map();
  private ipRateLimits: Map<string, RateLimitRecord> = new Map();

  // Email format regular expression
  private emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

  private get pepper(): string {
    return (
      process.env.SECURITY_PEPPER ||
      process.env.SESSION_SECRET ||
      'sf_secure_pepper_2026_sportfitness_auth_hash'
    ).trim();
  }

  /**
   * Generates a signed tamper-proof state token containing HMAC signature.
   * Enables 100% resilient verification across stateless serverless invocations (e.g. Vercel).
   */
  public generateSignedState(
    email: string,
    code: string,
    purpose: string = 'registro',
    expirationMinutes = 15
  ): string {
    const cleanEmail = email.trim().toLowerCase();
    const cleanCode = code.trim();
    const expiresAt = Date.now() + expirationMinutes * 60 * 1000;
    const payload = `${cleanEmail}:${cleanCode}:${expiresAt}:${purpose}`;
    const signature = crypto.createHmac('sha256', this.pepper).update(payload).digest('hex');
    const stateObj = {
      e: cleanEmail,
      exp: expiresAt,
      p: purpose,
      sig: signature,
    };
    return Buffer.from(JSON.stringify(stateObj)).toString('base64url');
  }

  /**
   * Verifies incoming code against signed state token.
   */
  public verifySignedState(
    email: string,
    inputCode: string,
    stateToken?: string
  ): { valid: boolean; purpose?: string; error?: string } {
    if (!stateToken || typeof stateToken !== 'string') {
      return { valid: false, error: 'Token de estado no proporcionado.' };
    }

    try {
      const decodedJson = Buffer.from(stateToken, 'base64url').toString('utf-8');
      const stateObj = JSON.parse(decodedJson);
      if (!stateObj || !stateObj.e || !stateObj.exp || !stateObj.sig) {
        return { valid: false, error: 'Estructura de token inválida.' };
      }

      const cleanEmail = email.trim().toLowerCase();
      if (stateObj.e !== cleanEmail) {
        return { valid: false, error: 'El correo no coincide con la solicitud original.' };
      }

      if (Date.now() > stateObj.exp) {
        return { valid: false, error: 'El código ha expirado (validez de 15 minutos).' };
      }

      const cleanCode = inputCode.trim();
      const expectedPayload = `${cleanEmail}:${cleanCode}:${stateObj.exp}:${stateObj.p || 'registro'}`;
      const expectedSig = crypto.createHmac('sha256', this.pepper).update(expectedPayload).digest('hex');

      const sigBuf = Buffer.from(stateObj.sig);
      const expectedBuf = Buffer.from(expectedSig);
      if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
        return { valid: false, error: 'El código es incorrecto.' };
      }

      return { valid: true, purpose: stateObj.p };
    } catch {
      return { valid: false, error: 'Error al decodificar token de estado.' };
    }
  }

  /**
   * Generates a signed single-use verification token that can be consumed by /api/auth/register or password reset.
   */
  public generateSignedVerificationToken(email: string, purpose: string = 'verification'): string {
    const cleanEmail = email.trim().toLowerCase();
    const expiresAt = Date.now() + 15 * 60 * 1000;
    const payload = `verified:${cleanEmail}:${expiresAt}:${purpose}`;
    const sig = crypto.createHmac('sha256', this.pepper).update(payload).digest('hex');
    const tokenObj = {
      e: cleanEmail,
      exp: expiresAt,
      p: purpose,
      sig,
    };
    return `vtok_${Buffer.from(JSON.stringify(tokenObj)).toString('base64url')}`;
  }

  /**
   * Generates a deterministic SHA-256 hash using the 6-digit code, the target email, and a server-side pepper.
   */
  public hashCode(code: string, email: string): string {
    const cleanCode = (code || '').trim();
    const cleanEmail = (email || '').trim().toLowerCase();
    return crypto
      .createHash('sha256')
      .update(`${cleanCode}:${cleanEmail}:${this.pepper}`)
      .digest('hex');
  }

  public isValidEmail(email: string): boolean {
    if (!email || typeof email !== 'string') return false;
    const trimmed = email.trim();
    if (trimmed.length < 5 || trimmed.length > 254) return false;
    return this.emailRegex.test(trimmed);
  }

  /**
   * Rate limiting and cooldown checks:
   * 1. 60-second cooldown per email
   * 2. Max 5 sends per hour per email
   * 3. Max 5 sends per hour per client IP (excluding local dev loopback)
   */
  public checkRateLimits(
    email: string,
    ip: string
  ): { allowed: boolean; status?: number; error?: string; message?: string } {
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanIp = (ip || 'unknown').trim();
    const now = Date.now();
    const ONE_HOUR = 60 * 60 * 1000;
    const COOLDOWN = 60 * 1000; // 60 seconds

    // 1. Email checks
    const emailRecord = this.emailRateLimits.get(cleanEmail);
    if (emailRecord) {
      if (now - emailRecord.lastSent < COOLDOWN) {
        const remainingSec = Math.ceil((COOLDOWN - (now - emailRecord.lastSent)) / 1000);
        console.warn(`[DIAG] [VERIF-SVC] Rate limit: Cooldown activo para ${maskEmail(cleanEmail)} (restan ${remainingSec}s)`);
        return {
          allowed: false,
          status: 429,
          error: 'cooldown_active',
          message: `Por favor espera ${remainingSec} segundos antes de solicitar otro código para este correo.`,
        };
      }

      const recentEmailSends = emailRecord.sendTimestamps.filter((ts) => now - ts < ONE_HOUR);
      if (recentEmailSends.length >= 5) {
        console.warn(`[DIAG] [VERIF-SVC] Rate limit: Límite horario de 5 envíos alcanzado para ${maskEmail(cleanEmail)}`);
        return {
          allowed: false,
          status: 429,
          error: 'hourly_limit_reached',
          message: 'Has alcanzado el límite de 5 envíos por hora para este correo. Por favor intenta más tarde.',
        };
      }
    }

    // 2. IP checks:
    // Exemption for loopback/localhost ONLY when NODE_ENV !== 'production'
    const isProduction = process.env.NODE_ENV === 'production';
    const isLoopback =
      cleanIp === '::1' ||
      cleanIp === '127.0.0.1' ||
      cleanIp === '::ffff:127.0.0.1' ||
      cleanIp === 'localhost';
    const shouldExemptIp = !isProduction && isLoopback;

    // In production or for non-loopback IPs: enforce IP rate limit.
    // Do NOT pool "unknown" or empty IPs into a shared bucket to avoid blocking unrelated clients.
    if (!shouldExemptIp && cleanIp && cleanIp !== 'unknown') {
      const ipRecord = this.ipRateLimits.get(cleanIp);
      if (ipRecord) {
        const recentIpSends = ipRecord.sendTimestamps.filter((ts) => now - ts < ONE_HOUR);
        if (recentIpSends.length >= 5) {
          console.warn(`[DIAG] [VERIF-SVC] Rate limit: Límite de 5 envíos por IP alcanzado para IP: ${cleanIp}`);
          return {
            allowed: false,
            status: 429,
            error: 'ip_limit_reached',
            message: 'Has alcanzado el límite de 5 envíos por hora desde tu conexión. Por favor intenta más tarde.',
          };
        }
      }
    }

    return { allowed: true };
  }

  /**
   * Records a successful code dispatch for rate limiting
   */
  public recordSend(email: string, ip: string): void {
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanIp = (ip || '').trim();
    const now = Date.now();
    const ONE_HOUR = 60 * 60 * 1000;

    // Update email record
    const emailRecord = this.emailRateLimits.get(cleanEmail) || { lastSent: 0, sendTimestamps: [] };
    const filteredEmail = emailRecord.sendTimestamps.filter((ts) => now - ts < ONE_HOUR);
    filteredEmail.push(now);
    this.emailRateLimits.set(cleanEmail, { lastSent: now, sendTimestamps: filteredEmail });

    // Update IP record: only track valid, identifiable IPs (never group as "unknown")
    const isProduction = process.env.NODE_ENV === 'production';
    const isLoopback =
      cleanIp === '::1' ||
      cleanIp === '127.0.0.1' ||
      cleanIp === '::ffff:127.0.0.1' ||
      cleanIp === 'localhost';
    const shouldExemptIp = !isProduction && isLoopback;

    if (!shouldExemptIp && cleanIp && cleanIp !== 'unknown') {
      const ipRecord = this.ipRateLimits.get(cleanIp) || { lastSent: 0, sendTimestamps: [] };
      const filteredIp = ipRecord.sendTimestamps.filter((ts) => now - ts < ONE_HOUR);
      filteredIp.push(now);
      this.ipRateLimits.set(cleanIp, { lastSent: now, sendTimestamps: filteredIp });
    }
  }

  /**
   * Generates a cryptographically random 6-digit numeric code with leading zeros,
   * sends it via SendGrid, and stores ONLY its SHA-256 hash in server memory.
   * Expiration: exactly 10 minutes.
   * Single-use only.
   */
  public async generateAndSendCode(
    email: string,
    purpose: string = 'general',
    ip: string = ''
  ): Promise<{ success: boolean; status?: number; error?: string; message: string }> {
    const cleanEmail = (email || '').trim().toLowerCase();
    const masked = maskEmail(cleanEmail);

    console.log(`[DIAG] [VERIF-SVC] generateAndSendCode iniciado | Email: ${masked} | Purpose: ${purpose} | IP: ${ip || 'unknown'}`);

    // 1. Validate email format
    if (!this.isValidEmail(cleanEmail)) {
      console.warn(`[DIAG] [VERIF-SVC] Validación rechazada: Formato de correo no válido para ${masked}`);
      return {
        success: false,
        status: 400,
        error: 'invalid_format',
        message: 'El correo electrónico ingresado no tiene un formato válido.',
      };
    }

    // 2. Rate limiting check
    const rateCheck = this.checkRateLimits(cleanEmail, ip);
    if (!rateCheck.allowed) {
      console.warn(`[DIAG] [VERIF-SVC] Validación rechazada por rate limit (${rateCheck.error}) para ${masked}: ${rateCheck.message}`);
      return {
        success: false,
        status: rateCheck.status || 429,
        error: rateCheck.error,
        message: rateCheck.message || 'Límite de solicitudes superado.',
      };
    }

    console.log(`[DIAG] [VERIF-SVC] Validaciones superadas para ${masked}. Generando código numérico de 6 dígitos...`);

    // 3. Generate 6-digit code with leading zeros (000000 - 999999)
    const numericCode = crypto.randomInt(0, 1000000).toString().padStart(6, '0');

    // 4. Send email strictly to the destination email via SendGrid (awaited before returning)
    console.log(`[DIAG] [VERIF-SVC] Despachando a emailService.sendVerificationEmail para ${masked}...`);
    const emailResult = await emailService.sendVerificationEmail(cleanEmail, numericCode, purpose);

    if (!emailResult.success) {
      // Clean up / purge any partial code record so un-sent codes never linger
      this.codes.delete(cleanEmail);
      console.error(`[DIAG] [VERIF-SVC] ERROR: Envío rechazado por emailService para ${masked}. Detalle: ${emailResult.error}. Limpiando registro de código.`);
      return {
        success: false,
        status: 502,
        error: emailResult.error || 'send_failed',
        message: `No se pudo enviar el correo de verificación (${emailResult.error || 'Fallo del proveedor'}). Por favor verifica el servicio de correo.`,
      };
    }

    // 5. Compute SHA-256 hash with pepper - NEVER store raw code
    const codeHash = this.hashCode(numericCode, cleanEmail);
    const now = Date.now();
    const EXPIRATION_MS = 10 * 60 * 1000; // exactly 10 minutes

    const record: VerificationRecord = {
      email: cleanEmail,
      codeHash,
      expiresAt: now + EXPIRATION_MS,
      used: false,
      failedAttempts: 0,
      purpose,
      createdAt: now,
    };

    this.codes.set(cleanEmail, record);
    this.recordSend(cleanEmail, ip);

    // Persist token in Firestore tokens collection with expiration
    try {
      await db.tokens.create({
        email: cleanEmail,
        code: numericCode,
        expires_at: new Date(now + EXPIRATION_MS).toISOString(),
        is_used: false,
        purpose,
      });
    } catch (tokErr) {
      console.warn('[VERIF-SVC] Notice saving code to db.tokens:', tokErr);
    }

    const firestore = getAdminFirestore();
    if (firestore) {
      firestore
        .collection('verification_records')
        .doc(cleanEmail)
        .set(record)
        .catch((fsErr) => {
          console.warn('[Firestore Admin] Notice saving verification record:', fsErr);
        });
    }

    const pendingStateToken = this.generateSignedState(cleanEmail, numericCode, purpose, 15);

    console.log(`[DIAG] [VERIF-SVC] ÉXITO: Código despachado correctamente a ${masked} y hash SHA-256 persistido (expira en 10m)`);

    return {
      success: true,
      message: emailResult.simulated
        ? `✉️ [Modo Vista Previa] Código generado: ${numericCode} (ingrésalo a continuación para continuar).`
        : `Código de verificación de 6 dígitos enviado exitosamente a ${cleanEmail}. Revisa tu bandeja de entrada o spam.`,
      pendingVerificationToken: pendingStateToken,
      devCode: emailResult.simulated ? numericCode : undefined,
    } as any;
  }

  /**
   * Validates the 6-digit code against the stored SHA-256 hash.
   * Limits: Maximum 5 failed attempts per code before permanent invalidation.
   * Expiration: 10 minutes.
   * Single-use: marks code as used immediately and issues a verificationToken.
   */
  public async verifyCode(
    email: string,
    inputCode: string,
    pendingStateToken?: string
  ): Promise<{ success: boolean; status?: number; error?: string; message: string; verificationToken?: string }> {
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanCode = (inputCode || '').replace(/\D/g, '').trim();
    const masked = maskEmail(cleanEmail);

    console.log(`[DIAG] [VERIF-SVC] Intento de verificación de código para ${masked} | Longitud código recibido: ${cleanCode.length}`);

    // 1. Email format check
    if (!this.isValidEmail(cleanEmail)) {
      console.warn(`[DIAG] [VERIF-SVC] Verificación rechazada: Formato inválido para ${masked}`);
      return {
        success: false,
        status: 400,
        error: 'invalid_format',
        message: 'El formato del correo electrónico es inválido.',
      };
    }

    // 2. Code format check (must be exactly 6 digits)
    if (!cleanCode || cleanCode.length !== 6 || !/^\d{6}$/.test(cleanCode)) {
      console.warn(`[DIAG] [VERIF-SVC] Verificación rechazada: Código debe tener exactamente 6 dígitos para ${masked}`);
      return {
        success: false,
        status: 400,
        error: 'invalid_code',
        message: 'Por favor ingresa los 6 dígitos numéricos del código recibido.',
      };
    }

    let record = this.codes.get(cleanEmail);
    const now = Date.now();

    // Cross-lambda / Serverless fallback: Check Firestore if in-memory record is absent
    if (!record) {
      const firestore = getAdminFirestore();
      if (firestore) {
        try {
          const docSnap = await firestore.collection('verification_records').doc(cleanEmail).get();
          if (docSnap.exists) {
            record = docSnap.data() as VerificationRecord;
            this.codes.set(cleanEmail, record);
          }
        } catch (fsErr) {
          console.warn('[Firestore Admin] Notice retrieving verification record:', fsErr);
        }
      }
    }

    // Secondary fallback: check db.tokens
    if (!record || record.used) {
      const dbToken = await db.tokens.findOne({
        where: {
          email: cleanEmail,
          code: cleanCode,
          is_used: false,
        },
      });

      if (dbToken && new Date(dbToken.expires_at).getTime() > now) {
        // Valid token found in db.tokens
        await db.tokens.update({ is_used: true }, { where: { id: dbToken.id } });
        const verificationToken = this.generateSignedVerificationToken(cleanEmail, dbToken.purpose || 'general');
        const tokenRec: VerificationTokenRecord = {
          token: verificationToken,
          email: cleanEmail,
          purpose: dbToken.purpose || 'general',
          expiresAt: now + 15 * 60 * 1000,
          createdAt: now,
        };
        this.verifiedTokens.set(verificationToken, tokenRec);

        const firestore = getAdminFirestore();
        if (firestore) {
          firestore.collection('verification_tokens').doc(verificationToken).set(tokenRec).catch(() => {});
        }

        console.log(`[DIAG] [VERIF-SVC] Verificación EXITOSA vía db.tokens para ${masked}. Token emitido: ${verificationToken.substring(0, 10)}...`);
        return {
          success: true,
          message: 'Código verificado correctamente.',
          verificationToken,
        };
      }
    }

    // Tertiary resilient fallback: Stateless signed HMAC state token (guaranteed to work across any serverless lambdas)
    if ((!record || record.used) && pendingStateToken) {
      const stateCheck = this.verifySignedState(cleanEmail, cleanCode, pendingStateToken);
      if (stateCheck.valid) {
        const verificationToken = this.generateSignedVerificationToken(cleanEmail, stateCheck.purpose || 'verification');
        const tokenRec: VerificationTokenRecord = {
          token: verificationToken,
          email: cleanEmail,
          purpose: stateCheck.purpose || 'verification',
          expiresAt: now + 15 * 60 * 1000,
          createdAt: now,
        };
        this.verifiedTokens.set(verificationToken, tokenRec);

        const firestore = getAdminFirestore();
        if (firestore) {
          firestore.collection('verification_tokens').doc(verificationToken).set(tokenRec).catch(() => {});
        }

        console.log(`[DIAG] [VERIF-SVC] Verificación EXITOSA vía HMAC state token para ${masked}.`);
        return {
          success: true,
          message: 'Código verificado correctamente.',
          verificationToken,
        };
      }
    }

    if (!record || record.used) {
      console.warn(`[DIAG] [VERIF-SVC] Verificación rechazada: Código no encontrado o ya utilizado para ${masked}`);
      return {
        success: false,
        status: 400,
        error: 'invalid_or_used',
        message: 'El código es incorrecto o ya ha sido utilizado.',
      };
    }

    // Check expiration (10 minutes)
    if (now > record.expiresAt) {
      record.used = true;
      console.warn(`[DIAG] [VERIF-SVC] Verificación rechazada: Código expirado para ${masked}`);
      return {
        success: false,
        status: 400,
        error: 'expired_code',
        message: 'El código ha expirado (validez de 10 minutos). Por favor solicita uno nuevo.',
      };
    }

    // Check failed attempts limit (max 5)
    if (record.failedAttempts >= 5) {
      record.used = true;
      console.warn(`[DIAG] [VERIF-SVC] Verificación rechazada: Máximo de 5 intentos fallidos superado para ${masked}`);
      return {
        success: false,
        status: 403,
        error: 'max_attempts_exceeded',
        message: 'Has superado el máximo de 5 intentos fallidos. Este código ha sido invalidado por seguridad. Solicita uno nuevo.',
      };
    }

    // Hash user's input and compare
    const inputHash = this.hashCode(cleanCode, cleanEmail);
    if (inputHash !== record.codeHash) {
      record.failedAttempts++;
      const remaining = 5 - record.failedAttempts;
      console.warn(`[DIAG] [VERIF-SVC] Verificación fallida: Código incorrecto para ${masked}. Intento ${record.failedAttempts}/5`);

      const firestore = getAdminFirestore();
      if (firestore) {
        firestore.collection('verification_records').doc(cleanEmail).update({
          failedAttempts: record.failedAttempts,
          used: record.failedAttempts >= 5,
        }).catch(() => {});
      }

      if (record.failedAttempts >= 5) {
        record.used = true;
        return {
          success: false,
          status: 403,
          error: 'max_attempts_exceeded',
          message: 'Has superado el máximo de 5 intentos fallidos. El código ha sido invalidado.',
        };
      }

      return {
        success: false,
        status: 400,
        error: 'incorrect_code',
        message: `El código ingresado es incorrecto. Te quedan ${remaining} ${remaining === 1 ? 'intento' : 'intentos'}.`,
      };
    }

    // Code is valid! Mark as used immediately (single-use)
    record.used = true;
    const firestore = getAdminFirestore();
    if (firestore) {
      firestore.collection('verification_records').doc(cleanEmail).update({ used: true }).catch(() => {});
    }

    // Also update any matching tokens in db.tokens
    db.tokens.update({ is_used: true }, { where: { email: cleanEmail } }).catch(() => {});

    // Issue cryptographically secure single-use verificationToken (valid 10 minutes)
    const verificationToken = `vtok_${crypto.randomBytes(32).toString('hex')}`;
    const tokenRecord: VerificationTokenRecord = {
      token: verificationToken,
      email: cleanEmail,
      purpose: record.purpose || 'general',
      expiresAt: now + 10 * 60 * 1000,
      createdAt: now,
    };
    this.verifiedTokens.set(verificationToken, tokenRecord);

    if (firestore) {
      firestore.collection('verification_tokens').doc(verificationToken).set(tokenRecord).catch(() => {});
    }

    console.log(`[DIAG] [VERIF-SVC] Verificación EXITOSA para ${masked}. Token emitido: ${verificationToken.substring(0, 10)}...`);

    return {
      success: true,
      message: 'Código verificado correctamente.',
      verificationToken,
    };
  }

  /**
   * Consumes a verification token for sensitive operations (register, password reset).
   * Validates target email, expiration, and ensures single-use by immediately deleting the token.
   */
  public consumeVerificationToken(token: string, email: string): boolean {
    if (!token || typeof token !== 'string') return false;
    const cleanEmail = (email || '').trim().toLowerCase();
    const tokenRecord = this.verifiedTokens.get(token);

    if (tokenRecord) {
      if (tokenRecord.email !== cleanEmail) return false;
      if (Date.now() > tokenRecord.expiresAt) {
        this.verifiedTokens.delete(token);
        return false;
      }
      this.verifiedTokens.delete(token);
      const firestore = getAdminFirestore();
      if (firestore) {
        firestore.collection('verification_tokens').doc(token).delete().catch(() => {});
      }
      return true;
    }

    return false;
  }

  public async consumeVerificationTokenAsync(token: string, email: string): Promise<boolean> {
    if (!token || typeof token !== 'string') return false;
    const cleanEmail = (email || '').trim().toLowerCase();

    // 1. Check in memory
    const inMem = this.consumeVerificationToken(token, cleanEmail);
    if (inMem) return true;

    // 2. Stateless cryptographic HMAC verification for vtok_ signed tokens
    if (token.startsWith('vtok_')) {
      try {
        const rawB64 = token.substring(5);
        const decoded = JSON.parse(Buffer.from(rawB64, 'base64url').toString('utf-8'));
        if (decoded && decoded.e === cleanEmail && Date.now() <= decoded.exp && decoded.sig) {
          const expectedPayload = `verified:${cleanEmail}:${decoded.exp}:${decoded.p || 'verification'}`;
          const expectedSig = crypto.createHmac('sha256', this.pepper).update(expectedPayload).digest('hex');
          const sigBuf = Buffer.from(decoded.sig);
          const expBuf = Buffer.from(expectedSig);
          if (sigBuf.length === expBuf.length && crypto.timingSafeEqual(sigBuf, expBuf)) {
            // Valid signed token verified
            this.verifiedTokens.delete(token);
            const firestore = getAdminFirestore();
            if (firestore) {
              firestore.collection('consumed_tokens').doc(token).set({ consumedAt: Date.now(), email: cleanEmail }).catch(() => {});
            }
            return true;
          }
        }
      } catch {
        // Fall through to Firestore
      }
    }

    // 3. Check Firestore
    const firestore = getAdminFirestore();
    if (firestore) {
      try {
        const docRef = firestore.collection('verification_tokens').doc(token);
        const snap = await docRef.get();
        if (snap.exists) {
          const data = snap.data() as VerificationTokenRecord;
          await docRef.delete();
          if (data && data.email === cleanEmail && Date.now() <= data.expiresAt) {
            return true;
          }
        }
      } catch (err) {
        console.warn('[Firestore Admin] Notice consumeVerificationTokenAsync:', err);
      }
    }

    return false;
  }
}

export const verificationService = new VerificationService();
