import nodemailer, { type Transporter } from 'nodemailer';

export interface EmailSendResult {
  success: boolean;
  messageId?: string;
  previewUrl?: string;
  error?: string;
  simulated?: boolean;
}

export function maskEmail(email: string): string {
  if (!email || typeof email !== 'string') return '***';
  const clean = email.trim().toLowerCase();
  const parts = clean.split('@');
  if (parts.length !== 2) return '***';
  const user = parts[0];
  const domain = parts[1];
  const maskedUser = user.length <= 2 ? `${user[0]}***` : `${user[0]}***${user[user.length - 1]}`;
  return `${maskedUser}@${domain}`;
}

class EmailService {
  private transporter: Transporter | null = null;
  private isConfigured: boolean = false;
  private get sendGridApiKey(): string {
    return (process.env.SENDGRID_API_KEY || '').trim();
  }
  private get sendGridFromEmail(): string {
    return (process.env.FROM_EMAIL || process.env.SENDGRID_FROM_EMAIL || '').trim();
  }
  private get sendGridFromName(): string {
    return (process.env.SENDGRID_FROM_NAME || 'Sportfitness').trim();
  }
  private get sendGridReplyTo(): string {
    return (process.env.REPLY_TO_EMAIL || process.env.SENDGRID_REPLY_TO || '').trim();
  }

  constructor() {
    this.initTransporter();
  }

  private initTransporter() {
    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT) || 587;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const secure = process.env.SMTP_SECURE === 'true' || port === 465;

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: {
          user,
          pass,
        },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
      });
      this.isConfigured = true;
      console.log(`[EmailService] Configured SMTP with host: ${host}:${port}, user: ${user}`);
    } else {
      this.isConfigured = false;
      this.transporter = null;
    }
  }

  /**
   * Dispatches email directly via SendGrid v3 Mail API
   */
  public async sendViaSendGrid(
    toEmail: string,
    subject: string,
    textContent: string,
    htmlContent: string
  ): Promise<EmailSendResult> {
    const cleanTo = toEmail.trim().toLowerCase();
    const masked = maskEmail(cleanTo);
    const key = this.sendGridApiKey;
    const hasKey = Boolean(key && key.length > 10);
    const keyPrefix = hasKey ? key.substring(0, 7) + '...' : 'NONE';
    const keyLen = key ? key.length : 0;

    console.log(`[DIAG] [SENDGRID] Petición de despacho iniciada | Destino: ${masked} | Asunto: "${subject}" | API Key presente: ${hasKey} (prefix: ${keyPrefix}, len: ${keyLen}) | From: ${this.sendGridFromEmail} | ReplyTo: ${this.sendGridReplyTo}`);

    if (!hasKey) {
      console.error(`[DIAG] [SENDGRID] ERROR: SENDGRID_API_KEY no está configurada o está vacía en las variables de entorno.`);
      return { success: false, error: 'SENDGRID_API_KEY no configurada en el servidor' };
    }

    if (!this.sendGridFromEmail) {
      console.error(`[DIAG] [SENDGRID] ERROR: FROM_EMAIL no está configurada en las variables de entorno.`);
      return { success: false, error: 'FROM_EMAIL no configurada en el servidor' };
    }

    try {
      const payload: Record<string, any> = {
        personalizations: [{ to: [{ email: cleanTo }] }],
        from: { email: this.sendGridFromEmail, name: this.sendGridFromName },
        subject,
        content: [
          { type: 'text/plain', value: textContent },
          { type: 'text/html', value: htmlContent },
        ],
      };
      if (this.sendGridReplyTo) {
        payload.reply_to = { email: this.sendGridReplyTo, name: 'Sportfitness' };
      }

      console.log(`[DIAG] [SENDGRID] Enviando payload HTTP POST a https://api.sendgrid.com/v3/mail/send para ${masked}...`);

      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      console.log(`[DIAG] [SENDGRID] Respuesta HTTP recibida de SendGrid | Status: ${response.status} ${response.statusText} para ${masked}`);

      if (response.status >= 200 && response.status < 300) {
        const messageId = response.headers.get('x-message-id') || `sg-${Date.now()}`;
        console.log(`[DIAG] [SENDGRID] ÉXITO: Mensaje aceptado por SendGrid API (Status ${response.status}) | ID: ${messageId} | Destino: ${masked}`);
        return { success: true, messageId };
      } else {
        const errText = await response.text();
        console.error(`[DIAG] [SENDGRID] ERROR: SendGrid rechazó el envío (Status HTTP ${response.status}) para ${masked} | Detalle/Cuerpo del error: ${errText}`);
        let userFriendlyError = `SendGrid error (${response.status})`;
        if (response.status === 401) {
          userFriendlyError = 'SendGrid: API Key no autorizada o revocada (401). Verifica tu clave en SendGrid.';
        } else if (response.status === 403) {
          userFriendlyError = 'SendGrid: Acceso denegado o remitente no verificado (403). Verifica Sender Authentication.';
        } else if (response.status === 429) {
          userFriendlyError = 'SendGrid: Límite de tasa de envío superado (429).';
        }
        return { success: false, error: `${userFriendlyError} - ${errText}` };
      }
    } catch (err: any) {
      console.error(`[DIAG] [SENDGRID] ERROR de conexión de red al conectar con api.sendgrid.com para ${masked}:`, err?.message || err);
      return { success: false, error: err?.message || 'Error de red al conectar con SendGrid' };
    }
  }

  /**
   * Sends the 6-digit verification code directly and strictly to the user's provided email.
   * Priority 1: SendGrid API
   * Priority 2: SMTP server
   * Priority 3: Graceful fallback
   */
  public async sendVerificationEmail(
    toEmail: string,
    code: string,
    purpose: string = 'verificación'
  ): Promise<EmailSendResult> {
    const cleanTo = toEmail.trim().toLowerCase();

    // Re-initialize if environment variables were updated at runtime
    if (!this.transporter && process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      this.initTransporter();
    }

    const fromAddress =
      process.env.SMTP_FROM ||
      (process.env.SMTP_USER ? `"Sportfitness" <${process.env.SMTP_USER}>` : '"Sportfitness Security" <no-reply@sportfitness.com>');

    // Optimize subject line: Do NOT put raw verification numbers in subject line
    // Having OTP codes in the subject line sent from non-corporate domain triggers aggressive anti-phishing filters
    const subject =
      purpose === 'password_reset'
        ? 'Código para restablecer tu contraseña - Sportfitness'
        : purpose === 'register_athlete'
        ? 'Código de verificación para tu registro de Atleta - Sportfitness'
        : purpose === 'register_trainer'
        ? 'Código de verificación para tu registro de Entrenador - Sportfitness'
        : 'Tu código de verificación - Sportfitness';

    const purposeText =
      purpose === 'password_reset'
        ? 'la recuperación de tu contraseña'
        : purpose === 'register_athlete'
        ? 'completar tu registro como Atleta'
        : purpose === 'register_trainer'
        ? 'completar tu registro como Entrenador'
        : 'la verificación de tu cuenta';

    const textContent = `
Hola,

Has solicitado un código de verificación para ${purposeText} en Sportfitness.

Tu código de verificación de 6 dígitos es: ${code}

Este código es de uso único y expirará en exactamente 10 minutos.
Si tú no realizaste esta solicitud, puedes ignorar este mensaje con total tranquilidad.

Equipo de Seguridad Sportfitness
    `.trim();

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Código de Verificación - Sportfitness</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0b0c10; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #e0e0e0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0b0c10; padding: 40px 10px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width: 540px; background-color: #121218; border: 1px solid #2a2a38; border-radius: 16px; overflow: hidden; padding: 32px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
          <!-- Header -->
          <tr>
            <td align="center" style="padding-bottom: 24px;">
              <div style="font-size: 24px; font-weight: 800; letter-spacing: 2px; color: #56A867; text-transform: uppercase;">
                SPORTFITNESS
              </div>
              <div style="font-size: 11px; letter-spacing: 1.5px; color: #888899; text-transform: uppercase; margin-top: 4px;">
                Verificación de Seguridad por Correo
              </div>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="font-size: 15px; line-height: 24px; color: #d0d0dc; padding-bottom: 24px;">
              Hola,<br><br>
              Recibimos una solicitud para <strong>${purposeText}</strong> en la plataforma Sportfitness asociada a tu dirección de correo: <strong>${cleanTo}</strong>.
            </td>
          </tr>
          <!-- Code Card -->
          <tr>
            <td align="center" style="padding: 10px 0 28px 0;">
              <div style="background-color: #181824; border: 2px dashed #56A867; border-radius: 12px; padding: 22px 28px; display: inline-block;">
                <div style="font-size: 11px; font-weight: 600; letter-spacing: 1px; color: #888899; text-transform: uppercase; margin-bottom: 8px;">
                  Tu Código de Verificación Único
                </div>
                <div style="font-size: 38px; font-weight: 800; letter-spacing: 8px; color: #56A867; font-family: 'Courier New', Courier, monospace;">
                  ${code}
                </div>
                <div style="font-size: 12px; color: #a0a0b0; margin-top: 8px;">
                  ⏱️ Válido durante <strong>10 minutos</strong>
                </div>
              </div>
            </td>
          </tr>
          <!-- Security Notes -->
          <tr>
            <td style="font-size: 13px; line-height: 20px; color: #9a9ab0; padding-bottom: 24px; border-top: 1px solid #20202e; padding-top: 20px;">
              • <strong>Uso único:</strong> Este código se invalida inmediatamente tras ser utilizado.<br>
              • <strong>Confidencial:</strong> No compartas este código con nadie.<br>
              • <strong>Expiración:</strong> Tras 10 minutos deberás solicitar un código nuevo.<br>
              • Si tú no solicitaste este código, ignora este mensaje con seguridad.
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td align="center" style="font-size: 11px; color: #666677; border-top: 1px solid #1a1a24; padding-top: 16px;">
              © ${new Date().getFullYear()} Sportfitness Platform. Todos los derechos reservados.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();

    // 1. Primary: Send via SendGrid
    const masked = maskEmail(cleanTo);
    console.log(`[DIAG] [EMAIL-SVC] Solicitud de verificación procesando para ${masked} | Propósito: ${purpose} | Código (longitud: ${code.length})`);

    if (this.sendGridApiKey) {
      console.log(`[DIAG] [EMAIL-SVC] Despachando a sendViaSendGrid para ${masked}...`);
      const sgResult = await this.sendViaSendGrid(cleanTo, subject, textContent, htmlContent);
      if (sgResult.success) {
        console.log(`[DIAG] [EMAIL-SVC] SendGrid completó con éxito el envío a ${masked}. ID: ${sgResult.messageId}`);
        return sgResult;
      }
      console.warn(`[DIAG] [EMAIL-SVC] SendGrid no pudo entregar el correo a ${masked}. Error: ${sgResult.error}`);
    } else {
      console.warn(`[DIAG] [EMAIL-SVC] SENDGRID_API_KEY no configurada en variables de entorno.`);
    }

    // 2. Secondary: If real SMTP transporter is configured, use it directly!
    if (this.transporter) {
      try {
        console.log(`[DIAG] [EMAIL-SVC] Intentando fallback mediante SMTP para ${masked}`);
        const info = await this.transporter.sendMail({
          from: fromAddress,
          to: cleanTo,
          subject,
          text: textContent,
          html: htmlContent,
        });

        console.log(`[DIAG] [EMAIL-SVC] Correo entregado exitosamente vía SMTP para ${masked}. ID: ${info.messageId}`);
        return { success: true, messageId: info.messageId };
      } catch (err: any) {
        console.error(`[DIAG] [EMAIL-SVC] Fallback SMTP falló para ${masked}:`, err?.message || err);
      }
    }

    // 3. Fallback: If no provider is configured in dev/preview environment, simulate dispatch
    if (!this.sendGridApiKey && !this.transporter) {
      console.log(`\n======================================================`);
      console.log(`[SPORTFITNESS DEV PREVIEW] SIMULADOR DE ENVÍO DE CORREO`);
      console.log(`Destinatario: ${cleanTo}`);
      console.log(`Asunto: ${subject}`);
      console.log(`CÓDIGO DE VERIFICACIÓN GENERADO: ${code}`);
      console.log(`======================================================\n`);
      return {
        success: true,
        messageId: `dev-sim-${Date.now()}`,
        simulated: true,
      };
    }

    // 4. Provider failure: do NOT disguise failure as success
    console.error(`[DIAG] [EMAIL-SVC] Fallo total de despacho. Ningún proveedor de correo pudo enviar el código a ${masked}.`);
    return {
      success: false,
      error: 'No se pudo enviar el correo de verificación a través de SendGrid ni SMTP. Verifica la configuración del proveedor.',
    };
  }

  /**
   * Sends contact form inquiries via SendGrid to admin and sends confirmation to user
   */
  public async sendContactEmail(params: {
    name: string;
    email: string;
    phone?: string;
    subject?: string;
    message: string;
  }): Promise<EmailSendResult> {
    const cleanSenderEmail = params.email.trim().toLowerCase();
    const subject = params.subject || `Nuevo mensaje de contacto: ${params.name}`;
    const textContent = `
Nuevo mensaje recibido a través del formulario de contacto de Sportfitness:

Nombre: ${params.name}
Correo: ${cleanSenderEmail}
Teléfono: ${params.phone || 'No especificado'}
Asunto: ${params.subject || 'Consulta General'}

Mensaje:
${params.message}

Fecha: ${new Date().toLocaleString()}
    `.trim();

    const htmlContent = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin: 0; padding: 20px; font-family: sans-serif; background: #0c0d12; color: #f0f0f5;">
  <div style="max-width: 600px; margin: 0 auto; background: #161622; border: 1px solid #2a2a3e; border-radius: 12px; padding: 28px;">
    <h2 style="color: #56A867; margin-top: 0;">📨 Nuevo Mensaje de Contacto - Sportfitness</h2>
    <div style="background: #1e1e2d; border-radius: 8px; padding: 16px; margin: 16px 0;">
      <p style="margin: 6px 0;"><strong>Nombre:</strong> ${params.name}</p>
      <p style="margin: 6px 0;"><strong>Correo de contacto:</strong> <a href="mailto:${cleanSenderEmail}" style="color: #56A867;">${cleanSenderEmail}</a></p>
      <p style="margin: 6px 0;"><strong>Teléfono:</strong> ${params.phone || 'No especificado'}</p>
      <p style="margin: 6px 0;"><strong>Asunto:</strong> ${params.subject || 'Consulta general'}</p>
    </div>
    <div style="padding: 16px; background: #12121a; border-left: 4px solid #56A867; border-radius: 4px; font-size: 15px; line-height: 1.6;">
      <strong style="display: block; margin-bottom: 8px; color: #a0a0b8;">Mensaje del usuario:</strong>
      ${params.message.replace(/\n/g, '<br/>')}
    </div>
    <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #2a2a3e; font-size: 12px; color: #888899;">
      Este mensaje fue enviado a través del formulario de contacto oficial de Sportfitness.
    </div>
  </div>
</body>
</html>
    `.trim();

    // 1. Send to admin
    const adminEmail = (process.env.ADMIN_EMAIL || process.env.FROM_EMAIL || '').trim();
    if (!adminEmail) {
      console.warn('[DIAG] [EMAIL-SVC] No admin email configured for contact form.');
      return { success: false, error: 'ADMIN_EMAIL o FROM_EMAIL no configurada' };
    }
    const result = await this.sendViaSendGrid(adminEmail, subject, textContent, htmlContent);

    // 2. Also send confirmation to user
    try {
      const userSubject = 'Hemos recibido tu mensaje - Sportfitness';
      const userText = `Hola ${params.name},\n\nGracias por comunicarte con Sportfitness. Hemos recibido tu mensaje y nuestro equipo te responderá a la brevedad.\n\nTu mensaje:\n"${params.message}"\n\nAtentamente,\nEquipo Sportfitness`;
      const userHtml = `
      <div style="font-family: sans-serif; padding: 24px; background: #0c0d12; color: #e0e0e8;">
        <div style="max-width: 500px; margin: 0 auto; background: #161622; padding: 24px; border-radius: 12px; border: 1px solid #2a2a3e;">
          <h2 style="color: #56A867; margin-top: 0;">¡Mensaje Recibido!</h2>
          <p>Hola <strong>${params.name}</strong>,</p>
          <p>Gracias por contactar a Sportfitness. Hemos recibido tu consulta y nuestro equipo te responderá a la brevedad.</p>
          <div style="background: #101018; padding: 12px 16px; border-radius: 8px; margin: 16px 0; font-size: 13px; color: #a0a0b8;">
            "${params.message.replace(/\n/g, '<br/>')}"
          </div>
          <p style="font-size: 12px; color: #707088;">Sportfitness - Rendimiento y Salud Integral.</p>
        </div>
      </div>
      `;
      await this.sendViaSendGrid(cleanSenderEmail, userSubject, userText, userHtml);
    } catch (e) {
      console.warn('Could not send confirmation copy to user:', e);
    }

    return result;
  }

  /**
   * Sends the unique Trainer Identification Number to a newly registered trainer.
   * This number differentiates them from all other trainers and is required on login.
   */
  public async sendTrainerCredentialEmail(
    toEmail: string,
    trainerName: string,
    trainerCode: string
  ): Promise<EmailSendResult> {
    const cleanTo = toEmail.trim().toLowerCase();
    const cleanCode = trainerCode.trim().toUpperCase();
    const name = (trainerName || 'Entrenador').trim();

    const mandatoryNotice = `su Numero de Identificacion que lo distinguira entre los entrenadores es:${cleanCode} solo se le enviara 1 vez y sera necesario para iniciar sesion en la pagina`;

    const subject = `Tu Identificación Oficial de Entrenador Sportfitness: ${cleanCode}`;

    const textContent = `
Hola ${name},

¡Bienvenido al equipo de entrenadores de Sportfitness!

${mandatoryNotice}

Consérvalo en un lugar seguro.

Equipo Técnico y Metodológico Sportfitness
    `.trim();

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Identificación Oficial de Entrenador - Sportfitness</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0b0c10; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #e0e0e0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0b0c10; padding: 40px 10px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width: 560px; background-color: #121218; border: 1px solid #2a2a38; border-radius: 16px; overflow: hidden; padding: 32px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
          <!-- Header -->
          <tr>
            <td align="center" style="padding-bottom: 24px;">
              <div style="font-size: 24px; font-weight: 800; letter-spacing: 2px; color: #56A867; text-transform: uppercase;">
                SPORTFITNESS COACH
              </div>
              <div style="font-size: 11px; letter-spacing: 1.5px; color: #888899; text-transform: uppercase; margin-top: 4px;">
                Acreditación & Número de Identificación Oficial
              </div>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="font-size: 15px; line-height: 24px; color: #d0d0dc; padding-bottom: 20px;">
              Hola <strong>${name}</strong>,<br><br>
              ¡Te damos la bienvenida al equipo técnico y metodológico de <strong>Sportfitness</strong>! Tu cuenta de entrenador ha sido creada con éxito.
            </td>
          </tr>
          <!-- Official Notice Card with Exact User Message -->
          <tr>
            <td align="center" style="padding: 10px 0 28px 0;">
              <div style="background-color: #181824; border: 2px solid #56A867; border-radius: 12px; padding: 24px 30px; display: inline-block; text-align: center;">
                <div style="font-size: 14px; font-weight: 700; line-height: 22px; color: #e0e0ea; margin-bottom: 12px;">
                  su Numero de Identificacion que lo distinguira entre los entrenadores es:
                </div>
                <div style="font-size: 36px; font-weight: 900; letter-spacing: 6px; color: #56A867; font-family: 'Courier New', Courier, monospace; padding: 6px 0;">
                  ${cleanCode}
                </div>
                <div style="font-size: 13px; color: #ffb84d; font-weight: 600; margin-top: 10px; line-height: 18px;">
                  solo se le enviara 1 vez y sera necesario para iniciar sesion en la pagina
                </div>
              </div>
            </td>
          </tr>
          <!-- Security Notes -->
          <tr>
            <td style="font-size: 13px; line-height: 20px; color: #9a9ab0; padding-bottom: 24px; border-top: 1px solid #20202e; padding-top: 20px;">
              • <strong>Requisito de acceso:</strong> Cada vez que inicies sesión en tu portal de Entrenador, deberás ingresar este código en el campo obligatorio correspondiente.<br>
              • <strong>Exclusividad:</strong> Este identificador te vincula directamente a tus atletas, bitácoras y biblioteca de ejercicios.<br>
              • Guarda este correo o anota tu código en un lugar seguro.
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td align="center" style="font-size: 11px; color: #666677; border-top: 1px solid #1a1a24; padding-top: 16px;">
              © ${new Date().getFullYear()} Sportfitness Platform. Todos los derechos reservados.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
 </body>
 </html>
    `.trim();

    // 1. Primary: Send via SendGrid API
    if (this.sendGridApiKey) {
      const sgResult = await this.sendViaSendGrid(cleanTo, subject, textContent, htmlContent);
      if (sgResult.success) {
        console.log(`[EmailService] Trainer credential email dispatched via SendGrid to ${cleanTo}`);
        return sgResult;
      }
      console.warn('[EmailService] SendGrid credential attempt notice:', sgResult.error);
    }

    if (!this.transporter && process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      this.initTransporter();
    }

    const fromAddress =
      process.env.SMTP_FROM ||
      (process.env.SMTP_USER ? `"Sportfitness" <${process.env.SMTP_USER}>` : '"Sportfitness Staff" <no-reply@sportfitness.com>');

    if (this.transporter) {
      try {
        const info = await this.transporter.sendMail({
          from: fromAddress,
          to: cleanTo,
          subject,
          text: textContent,
          html: htmlContent,
        });
        console.log(`[EmailService] Trainer credential email sent to ${cleanTo}. MessageId: ${info.messageId}`);
        return { success: true, messageId: info.messageId };
      } catch (err: any) {
        console.error(`[EmailService] Failed to send trainer credential email:`, err);
        return { success: false, error: err.message };
      }
    }

    const recipientDomain = cleanTo.split('@')[1] || 'domain';
    console.error(`[EmailService] Trainer credential dispatch failed for @${recipientDomain}: No provider available.`);
    return {
      success: false,
      error: 'No se pudo enviar la credencial de entrenador por correo.',
    };
  }
}

export const emailService = new EmailService();
