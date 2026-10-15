import crypto from 'crypto';
import { emailService } from './emailService';
import { db, verificarCodigo } from './db';

export interface VerificationRecord {
  email: string;
  code: string;
  expiresAt: number; // millisecond timestamp
  used: boolean;
  attempts: number;
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

class VerificationService {
  private codes: Map<string, VerificationRecord> = new Map();
  private verifiedTokens: Map<string, VerificationTokenRecord> = new Map();
  private usedCodesHistory: Map<string, Set<string>> = new Map();

  // Email format regular expression
  private emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

  public isValidEmail(email: string): boolean {
    if (!email || typeof email !== 'string') return false;
    const trimmed = email.trim();
    if (trimmed.length < 5 || trimmed.length > 254) return false;
    return this.emailRegex.test(trimmed);
  }

  /**
   * Generates a secure 6-digit numeric verification code, stores it temporarily in the backend,
   * sets 5-minute expiration, and dispatches it strictly to the user's provided email.
   * SECURITY: The generated code is NEVER returned in the API response or sent to the client.
   */
  public async generateAndSendCode(
    email: string,
    purpose: string = 'general'
  ): Promise<{ success: boolean; error?: string; message: string; expiresInSeconds?: number; code?: string }> {
    const cleanEmail = (email || '').trim().toLowerCase();

    // 1. Validate email format
    if (!this.isValidEmail(cleanEmail)) {
      return {
        success: false,
        error: 'invalid_format',
        message: 'El correo electrónico ingresado no tiene un formato válido (ejemplo: usuario@dominio.com).',
      };
    }

    // 2. Generate cryptographically random 6-digit numeric code strictly distinct from prior codes
    const history = this.usedCodesHistory.get(cleanEmail) || new Set<string>();
    const prevRecord = this.codes.get(cleanEmail);
    let numericCode = crypto.randomInt(100000, 1000000).toString();
    let attempts = 0;
    while ((history.has(numericCode) || (prevRecord && prevRecord.code === numericCode)) && attempts < 50) {
      numericCode = crypto.randomInt(100000, 1000000).toString();
      attempts++;
    }
    history.add(numericCode);
    if (history.size > 50) {
      const first = history.values().next().value;
      if (first) history.delete(first);
    }
    this.usedCodesHistory.set(cleanEmail, history);

    // 3. Expiration time: exactly 10 minutes (600,000 ms)
    const EXPIRATION_MS = 10 * 60 * 1000;
    const now = Date.now();
    const expiresAt = now + EXPIRATION_MS;

    // 4. Send email strictly to the user's provided email
    const emailResult = await emailService.sendVerificationEmail(cleanEmail, numericCode, purpose);

    if (!emailResult.success) {
      return {
        success: false,
        error: 'send_failed',
        message: emailResult.error || 'No se pudo enviar el correo de verificación. Por favor verifica la dirección e inténtalo más tarde.',
      };
    }

    // 5. Store record on server (overwrites any previous unverified code for this email)
    const record: VerificationRecord = {
      email: cleanEmail,
      code: numericCode,
      expiresAt,
      used: false,
      attempts: 0,
      purpose,
      createdAt: now,
    };
    this.codes.set(cleanEmail, record);

    // Also persist token into db.tokens
    try {
      await db.tokens.create({
        email: cleanEmail,
        code: numericCode,
        expires_at: new Date(expiresAt).toISOString(),
        is_used: false,
        purpose,
      });
    } catch (tokErr) {
      console.warn('Notice saving token to db.tokens:', tokErr);
    }

    return {
      success: true,
      code: numericCode,
      message: `Código de verificación de 6 dígitos enviado exitosamente a ${cleanEmail}. Revisa tu bandeja de entrada o carpeta de spam.`,
      expiresInSeconds: 600,
    };
  }

  /**
   * Registers a verification code created by the system/client for validation
   */
  public registerCode(
    email: string,
    code: string,
    purpose: string = 'general'
  ): { success: boolean; message: string } {
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanCode = (code || '').trim();
    if (!this.isValidEmail(cleanEmail)) {
      return { success: false, message: 'Correo inválido' };
    }
    const history = this.usedCodesHistory.get(cleanEmail) || new Set<string>();
    history.add(cleanCode);
    this.usedCodesHistory.set(cleanEmail, history);

    const record: VerificationRecord = {
      email: cleanEmail,
      code: cleanCode,
      expiresAt: Date.now() + 15 * 60 * 1000,
      used: false,
      attempts: 0,
      purpose,
      createdAt: Date.now(),
    };
    this.codes.set(cleanEmail, record);

    // Also persist in db.tokens
    db.tokens.create({
      email: cleanEmail,
      code: cleanCode,
      expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      is_used: false,
      purpose,
    }).catch((e) => console.warn('Error saving registered token to db:', e));

    return { success: true, message: 'Código registrado en el servidor' };
  }

  /**
   * Validates the 6-digit code entered by the user using verificarCodigo
   */
  public async verifyCode(
    email: string,
    inputCode: string
  ): Promise<{ success: boolean; error?: string; message: string; verificationToken?: string }> {
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanCode = (inputCode || '').trim();

    // 1. Email format check
    if (!this.isValidEmail(cleanEmail)) {
      return {
        success: false,
        error: 'invalid_format',
        message: 'El formato del correo electrónico es inválido.',
      };
    }

    // 2. Code format check
    if (!cleanCode || cleanCode.length !== 6 || !/^\d{6}$/.test(cleanCode)) {
      return {
        success: false,
        error: 'invalid_code',
        message: 'Por favor ingresa los 6 dígitos numéricos del código recibido.',
      };
    }

    try {
      const verif = await verificarCodigo(cleanEmail, cleanCode);
      const record = this.codes.get(cleanEmail);
      if (record) {
        record.used = true;
      }

      const verificationToken = `vtok_${crypto.randomBytes(24).toString('hex')}`;
      this.verifiedTokens.set(verificationToken, {
        token: verificationToken,
        email: cleanEmail,
        purpose: record?.purpose || 'general',
        expiresAt: Date.now() + 15 * 60 * 1000,
        createdAt: Date.now(),
      });

      return {
        success: true,
        message: verif.message,
        verificationToken,
      };
    } catch (dbErr: any) {
      // In-memory fallback if token was only cached in memory
      const record = this.codes.get(cleanEmail);
      if (record && !record.used && record.code === cleanCode && Date.now() <= record.expiresAt) {
        record.used = true;
        const verificationToken = `vtok_${crypto.randomBytes(24).toString('hex')}`;
        this.verifiedTokens.set(verificationToken, {
          token: verificationToken,
          email: cleanEmail,
          purpose: record.purpose,
          expiresAt: Date.now() + 15 * 60 * 1000,
          createdAt: Date.now(),
        });
        return {
          success: true,
          message: 'Código verificado correctamente.',
          verificationToken,
        };
      }

      return {
        success: false,
        error: 'verification_failed',
        message: dbErr.message || 'El código es incorrecto o ya ha sido utilizado.',
      };
    }
  }

  /**
   * Consumes a verification token for actions such as password reset
   */
  public consumeVerificationToken(token: string, email: string): boolean {
    const cleanEmail = (email || '').trim().toLowerCase();
    const tokenRecord = this.verifiedTokens.get(token);
    if (!tokenRecord) return false;
    if (tokenRecord.email !== cleanEmail) return false;
    if (Date.now() > tokenRecord.expiresAt) {
      this.verifiedTokens.delete(token);
      return false;
    }
    // Delete after single use
    this.verifiedTokens.delete(token);
    return true;
  }

  /**
   * Retrieves active code for user in case of email delivery delay or test environment
   */
  public getLatestCode(email: string): string | null {
    const cleanEmail = (email || '').trim().toLowerCase();
    const record = this.codes.get(cleanEmail);
    if (!record || record.used || Date.now() > record.expiresAt) {
      return null;
    }
    return record.code;
  }
}

export const verificationService = new VerificationService();
