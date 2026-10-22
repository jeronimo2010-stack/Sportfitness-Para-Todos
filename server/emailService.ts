import nodemailer, { type Transporter } from 'nodemailer';

export interface EmailSendResult {
  success: boolean;
  messageId?: string;
  previewUrl?: string;
  error?: string;
  simulated?: boolean;
}

class EmailService {
  private transporter: Transporter | null = null;
  private isConfigured: boolean = false;
  private get sendGridApiKey(): string {
    return (process.env.SENDGRID_API_KEY || '').trim();
  }
  private get sendGridFromEmail(): string {
    return (process.env.SENDGRID_FROM_EMAIL || 'sportfitness112@gmail.com').trim();
  }
  private get sendGridFromName(): string {
    return (process.env.SENDGRID_FROM_NAME || 'Sportfitness').trim();
  }
  private get sendGridReplyTo(): string {
    return (process.env.SENDGRID_REPLY_TO || 'mateobedoy20@gmail.com').trim();
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
    try {
      const payload = {
        personalizations: [{ to: [{ email: cleanTo }] }],
        from: { email: this.sendGridFromEmail, name: this.sendGridFromName },
        reply_to: { email: this.sendGridReplyTo, name: 'Sportfitness' },
        subject,
        content: [
          { type: 'text/plain', value: textContent },
          { type: 'text/html', value: htmlContent },
        ],
      };

      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.sendGridApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.status >= 200 && response.status < 300) {
        const messageId = response.headers.get('x-message-id') || `sg-${Date.now()}`;
        console.log(`[SendGrid] Email sent successfully to ${cleanTo} (ID: ${messageId})`);
        return { success: true, messageId };
      } else {
        const errText = await response.text();
        console.warn(`[SendGrid] Non-200 response (${response.status}) to ${cleanTo}:`, errText);
        return { success: false, error: `SendGrid error (${response.status}): ${errText}` };
      }
    } catch (err: any) {
      console.error(`[SendGrid] Fetch failure to ${cleanTo}:`, err);
      return { success: false, error: err?.message || 'Error al conectar con SendGrid' };
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

    const subject = `Código de verificación Sportfitness: ${code}`;
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

Este código es de uso único y expirará en exactamente 5 minutos.
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
                  ⏱️ Válido durante <strong>5 minutos</strong>
                </div>
              </div>
            </td>
          </tr>
          <!-- Security Notes -->
          <tr>
            <td style="font-size: 13px; line-height: 20px; color: #9a9ab0; padding-bottom: 24px; border-top: 1px solid #20202e; padding-top: 20px;">
              • <strong>Uso único:</strong> Este código se invalida inmediatamente tras ser utilizado.<br>
              • <strong>Confidencial:</strong> No compartas este código con nadie.<br>
              • <strong>Expiración:</strong> Tras 5 minutos deberás solicitar un código nuevo.<br>
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
    if (this.sendGridApiKey) {
      const sgResult = await this.sendViaSendGrid(cleanTo, subject, textContent, htmlContent);
      if (sgResult.success) {
        return sgResult;
      }
      console.warn('[EmailService] SendGrid attempt failed, trying alternate channels:', sgResult.error);
    }

    // 2. Secondary: If real SMTP transporter is configured, use it directly!
    if (this.transporter) {
      try {
        const info = await this.transporter.sendMail({
          from: fromAddress,
          to: cleanTo,
          subject,
          text: textContent,
          html: htmlContent,
        });

        console.log(`[EmailService] Verification email successfully sent via SMTP to ${cleanTo}. MessageId: ${info.messageId}`);
        return { success: true, messageId: info.messageId };
      } catch (err: any) {
        console.error(`[EmailService] Failed to send email via SMTP to ${cleanTo}:`, err);
      }
    }

    // 3. Fallback
    console.log(`\n======================================================`);
    console.log(`[EMAIL DISPATCH] Email to: ${cleanTo}`);
    console.log(`Subject: ${subject}`);
    console.log(`Verification Code: ${code} (Expires in 5 minutes)`);
    console.log(`======================================================\n`);

    return {
      success: true,
      simulated: true,
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
    const adminEmail = 'mateobedoy20@gmail.com';
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

    console.log(`\n======================================================`);
    console.log(`[TRAINER CREDENTIAL EMAIL DISPATCH] To: ${cleanTo}`);
    console.log(`Trainer Name: ${name}`);
    console.log(`Assigned Trainer Code: ${cleanCode}`);
    console.log(`Notice: ${mandatoryNotice}`);
    console.log(`======================================================\n`);

    return {
      success: true,
      simulated: true,
    };
  }
}

export const emailService = new EmailService();
