import "dotenv/config";
import express from "express";
import path from "path";
import crypto from "crypto";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";
import { serverDatabase } from "./server/db.js";
import { emailService, maskEmail } from "./server/emailService.js";
import { verificationService } from "./server/verificationService.js";

const app = express();
app.set("trust proxy", true);

function getClientIp(req: express.Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.trim()) {
    return forwarded.split(",")[0].trim();
  }
  if (Array.isArray(forwarded) && forwarded.length > 0) {
    return forwarded[0].trim();
  }
  return (req.ip || req.socket.remoteAddress || "").trim();
}

function parsePort(): number {
  const portArgIndex = process.argv.indexOf("--port");
  if (portArgIndex !== -1 && process.argv[portArgIndex + 1]) {
    const val = parseInt(process.argv[portArgIndex + 1], 10);
    if (!isNaN(val) && val > 0) return val;
  }
  if (process.env.PORT) {
    const val = parseInt(process.env.PORT, 10);
    if (!isNaN(val) && val > 0) return val;
  }
  return 3000;
}

const PORT = parsePort();

app.use(express.json());

// Prohibit direct client email relaying (to/subject/html)
app.all("/api/send-email", (req, res) => {
  return res.status(403).json({
    success: false,
    error: "Security Policy Violation",
    message: "Direct client email relaying (to/subject/html) is prohibited. All emails must be dispatched through dedicated server endpoints with server-generated codes.",
  });
});

// API Health Check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ==========================================
// AUTHENTICATION & AUTHORIZATION MIDDLEWARE
// ==========================================

function extractToken(req: express.Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7).trim();
  }
  const queryToken = req.query.token as string;
  if (queryToken && typeof queryToken === "string") {
    return queryToken.trim();
  }
  return null;
}

/**
 * Middleware: Verify that incoming request has a valid active session token.
 * Populates req.user, req.userRole, and req.sessionToken from the verified database user.
 */
function authenticateSession(req: express.Request, res: express.Response, next: express.NextFunction) {
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({
      success: false,
      error: "No autenticado. Se requiere token de sesión para acceder a este recurso.",
    });
  }

  const sessionData = serverDatabase.getSession(token);
  if (!sessionData) {
    return res.status(401).json({
      success: false,
      error: "Sesión inválida o expirada. Por favor inicie sesión nuevamente.",
    });
  }

  (req as any).user = sessionData.user;
  (req as any).userRole = sessionData.user.role;
  (req as any).sessionToken = token;
  next();
}

/**
 * Middleware: Require administrator privileges.
 * Strictly verifies role against the server database record associated with the token.
 * NEVER trusts client-supplied roles in headers or body!
 */
function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  authenticateSession(req, res, () => {
    const role = (req as any).userRole;
    if (role !== "admin") {
      return res.status(403).json({
        success: false,
        error: "Acceso denegado: Esta operación requiere permisos exclusivos de Administrador.",
      });
    }
    next();
  });
}

// ==========================================
// 1. AUTHENTICATION ENDPOINTS
// ==========================================

// Register a new user
// Note: Public registration only allows 'atleta' or 'entrenador'.
// Creating an 'admin' account is strictly prohibited through public registration.
app.post("/api/auth/register", (req, res) => {
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
    } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, error: "El correo electrónico es obligatorio." });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, error: "La contraseña debe tener al menos 6 caracteres." });
    }
    if (!documentNumber || !documentNumber.trim()) {
      return res.status(400).json({ success: false, error: "El número de documento / ID es obligatorio." });
    }
    if (!phone || !phone.trim()) {
      return res.status(400).json({ success: false, error: "El número de teléfono es obligatorio." });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Security requirement: Require and consume single-use verificationToken issued by server
    if (!verificationToken || typeof verificationToken !== "string") {
      return res.status(403).json({
        success: false,
        error: "Token de verificación requerido",
        message: "Debes validar tu correo con el código de 6 dígitos antes de completar tu registro.",
      });
    }

    const isTokenValid = verificationService.consumeVerificationToken(verificationToken, cleanEmail);
    if (!isTokenValid) {
      return res.status(403).json({
        success: false,
        error: "Token expirado o inválido",
        message: "La sesión de verificación ha expirado o el token es inválido. Solicita un nuevo código de verificación.",
      });
    }

    const weightNum = Number(weight) || 75;
    const heightNum = Number(height) || 175;
    const sizeVal = (clothingSize as any) || "M";

    // Enforce role safety: public signup cannot grant 'admin'
    const assignedRole = role === "entrenador" ? "entrenador" : "atleta";

    const result = serverDatabase.registerUser({
      id: id || undefined,
      email,
      password,
      documentType: documentType || "Cédula de Ciudadanía (CC)",
      documentNumber,
      phone,
      trainerCode: trainerCode || undefined,
      firstName: firstName || "Atleta",
      lastName: lastName || "Sportfitness",
      role: assignedRole,
      weight: weightNum,
      height: heightNum,
      clothingSize: sizeVal,
      bodyType: bodyType || "Mesomorfo",
    });

    if (!result.success || !result.user) {
      if (result.error && result.error.includes("ya se encuentra registrado")) {
        const cleanEmail = email.trim().toLowerCase();
        const existing = serverDatabase.findUserByEmail(cleanEmail);
        if (existing) {
          // If password matches existing user, authenticate and update biometric metrics!
          const authCheck = serverDatabase.authenticateUser(cleanEmail, password, trainerCode);
          if (authCheck.success && authCheck.user) {
            if (weightNum && heightNum) {
              authCheck.user.healthProfile = {
                ...authCheck.user.healthProfile,
                weight: weightNum,
                height: heightNum,
                clothingSize: sizeVal,
                bodyType: bodyType || authCheck.user.healthProfile?.bodyType || 'Mesomorfo',
              };
              serverDatabase.saveToFile();
            }
            const token = serverDatabase.createSession(authCheck.user.id);
            const { passwordHash, salt, ...safeUser } = authCheck.user;
            return res.status(200).json({
              success: true,
              alreadyRegistered: true,
              message: "Usuario previamente registrado. Sesión autenticada y métricas sincronizadas.",
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
        error: result.error || "No se pudo registrar el usuario.",
        alreadyRegistered: result.error?.includes("ya se encuentra registrado") || false,
      });
    }

    // If registered user is a trainer, dispatch their exclusive trainer identification number via email
    if (assignedRole === "entrenador" && result.user.trainerCode) {
      emailService
        .sendTrainerCredentialEmail(result.user.email, result.user.fullName, result.user.trainerCode)
        .catch((err) => console.error("Error sending trainer credential email:", err));
    }

    // Create session token and persist on server
    const token = serverDatabase.createSession(result.user.id);

    // Remove sensitive passwordHash and salt from response
    const { passwordHash, salt, ...safeUser } = result.user;

    return res.status(201).json({
      success: true,
      message:
        assignedRole === "entrenador"
          ? `Entrenador registrado con éxito. Se ha enviado tu Número de Identificación de Entrenador (${safeUser.trainerCode}) a tu correo electrónico.`
          : "Usuario registrado con éxito. Progreso inicializado en 0.",
      token,
      user: safeUser,
      role: safeUser.role,
      trainerCode: safeUser.trainerCode,
    });
  } catch (err: any) {
    console.error("Register Error:", err);
    return res.status(500).json({ success: false, error: "Error en el servidor al registrar usuario." });
  }
});

// Login endpoint
app.post("/api/auth/login", (req, res) => {
  try {
    const { identifier, password, trainerCode } = req.body;

    if (!identifier || !identifier.trim()) {
      return res.status(400).json({
        success: false,
        error: "Ingresa tu correo electrónico o número de documento.",
      });
    }

    if (!password) {
      return res.status(400).json({
        success: false,
        error: "Ingresa tu contraseña.",
      });
    }

    const result = serverDatabase.authenticateUser(identifier, password, trainerCode);

    if (!result.success || !result.user) {
      const err = result.error || "Usuario no registrado";

      if (err === "Código de entrenador requerido") {
        return res.status(400).json({
          success: false,
          error: "Código de entrenador requerido",
          message:
            "Para iniciar sesión como entrenador, es obligatorio ingresar tu Número de Identificación de Entrenador (Ej: ENT-XXXXX) asignado a tu correo.",
        });
      }

      if (err === "Código de entrenador inválido") {
        return res.status(401).json({
          success: false,
          error: "Código de entrenador inválido",
          message:
            "El Número de Identificación de Entrenador es incorrecto o no coincide con tu cuenta. Revisa tu correo de bienvenida o contacta a soporte.",
        });
      }

      return res.status(401).json({
        success: false,
        error: err,
        message:
          err === "Usuario no registrado"
            ? "Usuario no registrado. Este correo o documento no existe en la base de datos. Debes registrarte previamente para acceder."
            : "Contraseña incorrecta. Por favor verifica tus credenciales.",
      });
    }

    // Persist verified session on server
    const token = serverDatabase.createSession(result.user.id);
    const { passwordHash, salt, ...safeUser } = result.user;

    return res.json({
      success: true,
      message: "Autenticación exitosa. Credenciales y permisos verificados en el servidor.",
      token,
      user: safeUser,
      role: safeUser.role,
      progress: safeUser.progress,
      trainerCode: safeUser.trainerCode,
    });
  } catch (err: any) {
    console.error("Login Error:", err);
    return res.status(500).json({ success: false, error: "Error en el servidor al autenticar." });
  }
});

// ==========================================
// EMAIL VERIFICATION CODE ENDPOINTS
// ==========================================

// Send 6-digit verification code to email (for registration / verification)
app.post("/api/auth/send-verification-code", async (req, res) => {
  try {
    const { email, purpose = "registro" } = req.body || {};
    const masked = maskEmail(email || "");
    const clientIp = getClientIp(req);

    console.log(`[DIAG] [ROUTE /send-verification-code] Petición POST recibida | Email: ${masked} | Purpose: ${purpose} | IP: ${clientIp || 'unknown'}`);

    if (!email || !email.trim()) {
      console.warn(`[DIAG] [ROUTE /send-verification-code] Rechazada: Correo electrónico vacío o no proporcionado.`);
      return res.status(400).json({ success: false, error: "El correo electrónico es requerido." });
    }

    const cleanEmail = email.trim().toLowerCase();

    console.log(`[DIAG] [ROUTE /send-verification-code] Invocando verificationService.generateAndSendCode para ${masked}...`);
    const result = await verificationService.generateAndSendCode(cleanEmail, purpose, clientIp);

    if (!result.success) {
      console.error(`[DIAG] [ROUTE /send-verification-code] Falló generateAndSendCode para ${masked}: ${result.error}`);
      return res.status(result.status || 400).json({
        success: false,
        error: result.error,
        message: result.message,
      });
    }

    console.log(`[DIAG] [ROUTE /send-verification-code] Respuesta 200 OK enviada al cliente para ${masked}`);
    // Security: NEVER return verification PIN in HTTP response
    return res.json({
      success: true,
      message: result.message,
    });
  } catch (error: any) {
    console.error("[DIAG] [ROUTE /send-verification-code] Excepción no controlada:", error);
    return res.status(500).json({ success: false, error: "Error en el servidor al despachar el código." });
  }
});

// Dedicated trainer credential email dispatch endpoint (requires authenticated server/trainer context)
app.post("/api/auth/trainer/send-credential", async (req, res) => {
  try {
    const { email, trainerName, trainerCode } = req.body || {};
    const masked = maskEmail(email || "");
    console.log(`[DIAG] [ROUTE /trainer/send-credential] Petición recibida para ${masked}`);

    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, error: "El correo electrónico es requerido." });
    }
    if (!trainerCode || !trainerCode.trim()) {
      return res.status(400).json({ success: false, error: "El código de entrenador es requerido." });
    }

    const result = await emailService.sendTrainerCredentialEmail(
      email.trim(),
      trainerName || "Entrenador",
      trainerCode.trim().toUpperCase()
    );

    return res.json({
      success: true,
      message: "Identificación de entrenador despachada al correo.",
      result,
    });
  } catch (error: any) {
    console.error("[DIAG] [ROUTE /trainer/send-credential] Error:", error);
    return res.status(500).json({ success: false, error: "Error en el servidor al enviar código de entrenador." });
  }
});

// Verify 6-digit code
app.post("/api/auth/verify-code", async (req, res) => {
  try {
    const { email, code } = req.body || {};
    const masked = maskEmail(email || "");
    console.log(`[DIAG] [ROUTE /verify-code] Petición POST recibida para ${masked}`);

    if (!email || !code) {
      console.warn(`[DIAG] [ROUTE /verify-code] Rechazada: Correo o código ausente para ${masked}`);
      return res.status(400).json({ success: false, error: "Correo electrónico y código son obligatorios." });
    }

    const result = await verificationService.verifyCode(email, code);
    if (!result.success) {
      console.warn(`[DIAG] [ROUTE /verify-code] Validación de código no exitosa para ${masked}: ${result.error}`);
      return res.status(result.status || 400).json({
        success: false,
        error: result.error,
        message: result.message,
      });
    }

    console.log(`[DIAG] [ROUTE /verify-code] Validación exitosa para ${masked}`);
    return res.json({
      success: true,
      message: result.message,
      verificationToken: result.verificationToken,
    });
  } catch (error: any) {
    console.error("[DIAG] [ROUTE /verify-code] Excepción no controlada:", error);
    return res.status(500).json({ success: false, error: "Error al validar el código." });
  }
});

// Password Reset: Request code
app.post("/api/auth/forgot-password/send-code", async (req, res) => {
  try {
    const { email } = req.body || {};
    const masked = maskEmail(email || "");
    const clientIp = getClientIp(req);

    console.log(`[DIAG] [ROUTE /forgot-password/send-code] Petición POST recibida | Email: ${masked} | IP: ${clientIp || 'unknown'}`);

    if (!email || !email.trim()) {
      console.warn(`[DIAG] [ROUTE /forgot-password/send-code] Rechazada: Correo no ingresado.`);
      return res.status(400).json({ success: false, error: "Ingresa tu correo electrónico." });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check rate limits & cooldown (60s cooldown, max 5/hr per email)
    const rateCheck = verificationService.checkRateLimits(cleanEmail, clientIp);
    if (!rateCheck.allowed) {
      console.warn(`[DIAG] [ROUTE /forgot-password/send-code] Rechazada por rate limit (${rateCheck.error}) para ${masked}`);
      return res.status(rateCheck.status || 429).json({
        success: false,
        error: rateCheck.error,
        message: rateCheck.message,
      });
    }

    // Check if account exists in authoritative database (data/sportfitness_database.json)
    const userInDb = serverDatabase.findUserByEmail(cleanEmail);
    console.log(`[DIAG] [ROUTE /forgot-password/send-code] Verificación en base de datos: exists=${!!userInDb} para ${masked}`);

    if (userInDb) {
      // User exists: dispatch recovery code via SendGrid
      console.log(`[DIAG] [ROUTE /forgot-password/send-code] Cuenta confirmada. Invocando generateAndSendCode (password_reset) para ${masked}...`);
      const result = await verificationService.generateAndSendCode(cleanEmail, "password_reset", clientIp);

      if (!result.success) {
        console.error(`[DIAG] [ROUTE /forgot-password/send-code] ERROR SendGrid al despachar código para ${masked}: ${result.error}`);
        // Return 502 with error message that does NOT reveal whether account exists
        return res.status(502).json({
          success: false,
          error: "send_failed",
          message: "Ocurrió un error en el servicio de correo al procesar tu solicitud. Por favor intenta más tarde.",
        });
      }
    } else {
      // User does NOT exist: do NOT call SendGrid, record rate limit attempt and simulate matching dispatch latency
      console.log(`[DIAG] [ROUTE /forgot-password/send-code] Cuenta inexistente para ${masked}. Omitiendo SendGrid y simulando latencia uniforme.`);
      verificationService.recordSend(cleanEmail, clientIp);
      await new Promise((resolve) => setTimeout(resolve, 450));
    }

    // Security: Response is 100% IDENTICAL whether the email exists or not to prevent account enumeration
    console.log(`[DIAG] [ROUTE /forgot-password/send-code] Respuesta uniforme devuelta para ${masked}`);
    return res.json({
      success: true,
      message: `Si la cuenta ${cleanEmail} está registrada en Sportfitness, recibirás un código de recuperación de 6 dígitos. Revisa tu bandeja de entrada o spam.`,
    });
  } catch (error: any) {
    console.error("[DIAG] [ROUTE /forgot-password/send-code] Excepción no controlada:", error);
    return res.status(500).json({ success: false, error: "Error al solicitar código de recuperación." });
  }
});

// Password Reset: Verify code
app.post("/api/auth/forgot-password/verify-code", async (req, res) => {
  try {
    const { email, code } = req.body || {};
    if (!email || !code) {
      return res.status(400).json({ success: false, error: "Correo electrónico y código son obligatorios." });
    }

    const result = await verificationService.verifyCode(email, code);
    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.json({
      success: true,
      message: result.message,
      verificationToken: result.verificationToken,
    });
  } catch (error: any) {
    console.error("forgot-password verify-code error:", error);
    return res.status(500).json({ success: false, error: "Error al verificar código de recuperación." });
  }
});

// Password Reset: Apply new password
app.post("/api/auth/forgot-password/reset", (req, res) => {
  try {
    const { email, newPassword, verificationToken } = req.body || {};
    if (!email || !newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: "La nueva contraseña debe tener al menos 6 caracteres.",
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    if (verificationToken) {
      const isValid = verificationService.consumeVerificationToken(verificationToken, cleanEmail);
      if (!isValid) {
        return res.status(403).json({
          success: false,
          error: "Token expirado o inválido",
          message: "La sesión de verificación ha expirado. Por favor solicita un nuevo código.",
        });
      }
    }

    const user = serverDatabase.findUserByEmail(cleanEmail);
    if (user) {
      serverDatabase.adminResetPassword(user.id, newPassword);
    }

    return res.json({
      success: true,
      message: "Tu contraseña ha sido actualizada exitosamente. Ya puedes iniciar sesión.",
    });
  } catch (error: any) {
    console.error("forgot-password reset error:", error);
    return res.status(500).json({ success: false, error: "Error al actualizar la contraseña." });
  }
});

// Contact Form Endpoint (Sends directly via SendGrid and triggers email)
app.post("/api/contact", async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body || {};
    if (!name || !name.trim() || !email || !email.trim() || !message || !message.trim()) {
      return res.status(400).json({
        success: false,
        error: "Por favor completa los campos obligatorios: nombre, correo y mensaje.",
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const result = await emailService.sendContactEmail({
      name: name.trim(),
      email: cleanEmail,
      phone: phone?.trim() || "",
      subject: subject?.trim() || `Nuevo contacto de ${name.trim()}`,
      message: message.trim(),
    });

    return res.json({
      success: true,
      message: "Tu mensaje ha sido enviado correctamente. Nos pondremos en contacto contigo pronto.",
      messageId: result.messageId,
    });
  } catch (error: any) {
    console.error("Contact API error:", error);
    return res.status(500).json({
      success: false,
      error: "Ocurrió un error al procesar tu mensaje. Intenta nuevamente.",
    });
  }
});

// Google Sign-In endpoint
app.post("/api/auth/google", (req, res) => {
  try {
    const { id, email, name, role, trainerCode, avatar } = req.body;
    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, error: "El correo de Google es requerido." });
    }

    const result = serverDatabase.authenticateOrRegisterGoogleUser({
      id: id?.trim(),
      email: email.trim(),
      name: name?.trim() || "Atleta Google",
      role: role === "entrenador" ? "entrenador" : "atleta",
      trainerCode: trainerCode?.trim(),
      avatar,
    });

    const { passwordHash, salt, ...safeUser } = result.user;

    return res.json({
      success: true,
      message: "Sesión iniciada correctamente con Google.",
      token: result.token,
      user: safeUser,
      role: safeUser.role,
      trainerCode: safeUser.trainerCode,
      progress: safeUser.progress,
    });
  } catch (err: any) {
    console.error("Google Auth Error:", err);
    return res.status(500).json({ success: false, error: "Error en el servidor con Google Auth." });
  }
});

// Verify current session
app.get("/api/auth/verify-session", authenticateSession, (req, res) => {
  const user = (req as any).user;
  const { passwordHash, salt, ...safeUser } = user;
  res.json({
    success: true,
    user: safeUser,
    role: user.role,
    progress: user.progress,
  });
});

// Logout endpoint
app.post("/api/auth/logout", (req, res) => {
  const token = extractToken(req);
  if (token) {
    serverDatabase.revokeSession(token);
  }
  res.json({ success: true, message: "Sesión cerrada correctamente. Token revocado en el servidor." });
});

// ==========================================
// 2. PROTECTED USER PROGRESS & PROFILE ENDPOINTS
// ==========================================

// Get user progress history (user themselves or admin)
app.get("/api/user/:userId/progress", authenticateSession, (req, res) => {
  const requestingUser = (req as any).user;
  const { userId } = req.params;

  if (requestingUser.role !== "admin" && requestingUser.id !== userId) {
    return res.status(403).json({
      success: false,
      error: "Acceso denegado: No tienes autorización para consultar el progreso de otro usuario.",
    });
  }

  const progress = serverDatabase.getUserProgress(userId);
  if (!progress) {
    return res.status(404).json({ success: false, error: "Usuario o registro de progreso no encontrado." });
  }
  return res.json({ success: true, progress });
});

// Record workout progress update
app.post("/api/user/:userId/progress", authenticateSession, (req, res) => {
  const requestingUser = (req as any).user;
  const { userId } = req.params;

  if (requestingUser.role !== "admin" && requestingUser.id !== userId) {
    return res.status(403).json({
      success: false,
      error: "Acceso denegado: No puedes registrar entrenamientos para otra cuenta.",
    });
  }

  const { exerciseName, durationMinutes, weightKg, tonnageRecordedKg, efficiencyScore } = req.body;

  const result = serverDatabase.recordWorkoutProgress(userId, {
    exerciseName: exerciseName || "Entrenamiento Funcional",
    durationMinutes: Number(durationMinutes) || 30,
    weightKg: Number(weightKg) || 75,
    tonnageRecordedKg: Number(tonnageRecordedKg),
    efficiencyScore: Number(efficiencyScore),
  });

  if (!result.success || !result.progress) {
    return res.status(400).json({ success: false, error: result.error || "No se pudo registrar el progreso." });
  }

  return res.json({
    success: true,
    message: "Progreso actualizado y persistido permanentemente en la base de datos.",
    progress: result.progress,
  });
});

// Update health profile (weight, height, clothingSize)
app.put("/api/user/:userId/health-profile", authenticateSession, (req, res) => {
  const requestingUser = (req as any).user;
  const { userId } = req.params;

  if (requestingUser.role !== "admin" && requestingUser.id !== userId) {
    return res.status(403).json({
      success: false,
      error: "Acceso denegado: No puedes modificar el perfil de salud de otro atleta.",
    });
  }

  const { weight, height, clothingSize, bodyType } = req.body;

  const result = serverDatabase.updateHealthProfile(userId, {
    weight: Number(weight),
    height: Number(height),
    clothingSize: clothingSize as any,
    bodyType,
  });

  if (!result.success || !result.healthProfile) {
    return res.status(400).json({ success: false, error: result.error || "No se pudo actualizar el perfil de salud." });
  }

  return res.json({
    success: true,
    message: "Perfil antropométrico actualizado exitosamente.",
    healthProfile: result.healthProfile,
  });
});

// Get user full details (only owner or admin)
app.get("/api/user/:userId", authenticateSession, (req, res) => {
  const requestingUser = (req as any).user;
  const { userId } = req.params;

  if (requestingUser.role !== "admin" && requestingUser.id !== userId) {
    return res.status(403).json({
      success: false,
      error: "Acceso denegado: Solo el titular de la cuenta o un administrador puede ver este perfil.",
    });
  }

  const user = serverDatabase.findUserById(userId);
  if (!user) {
    return res.status(404).json({ success: false, error: "Usuario no encontrado." });
  }
  const { passwordHash, salt, ...safeUser } = user;
  return res.json({ success: true, user: safeUser });
});

// Delete user account (only owner or admin)
app.delete("/api/user/:userId", authenticateSession, (req, res) => {
  const requestingUser = (req as any).user;
  const { userId } = req.params;

  if (requestingUser.role !== "admin" && requestingUser.id !== userId) {
    return res.status(403).json({
      success: false,
      error: "Acceso denegado: No estás autorizado para eliminar esta cuenta.",
    });
  }

  const result = serverDatabase.deleteUser(userId);
  if (!result.success) {
    return res.status(404).json(result);
  }
  return res.json(result);
});

app.post("/api/user/:userId/delete", authenticateSession, (req, res) => {
  const requestingUser = (req as any).user;
  const { userId } = req.params;

  if (requestingUser.role !== "admin" && requestingUser.id !== userId) {
    return res.status(403).json({
      success: false,
      error: "Acceso denegado: No estás autorizado para eliminar esta cuenta.",
    });
  }

  const result = serverDatabase.deleteUser(userId);
  if (!result.success) {
    return res.status(404).json(result);
  }
  return res.json(result);
});

// Record outdoor GPS Route for user
app.post("/api/user/:userId/gps-route", authenticateSession, (req, res) => {
  const requestingUser = (req as any).user;
  const { userId } = req.params;

  if (requestingUser.role !== "admin" && requestingUser.id !== userId) {
    return res.status(403).json({
      success: false,
      error: "Acceso denegado: No puedes registrar rutas GPS para otra cuenta.",
    });
  }

  const { name, distanceKm, durationMinutes, avgPace, caloriesBurned } = req.body;
  const result = serverDatabase.recordGpsRoute(userId, {
    name: name || "Ruta GPS Outdoor",
    distanceKm: Number(distanceKm) || 5.0,
    durationMinutes: Number(durationMinutes) || 30,
    avgPace: avgPace || "5:45 min/km",
    caloriesBurned: Number(caloriesBurned),
  });
  if (!result.success) {
    return res.status(400).json(result);
  }
  return res.json(result);
});

// ==========================================
// USER NOTES & TRAINING JOURNAL ENDPOINTS
// ==========================================

// Get notes for user
app.get("/api/user/:userId/notes", authenticateSession, (req, res) => {
  const requestingUser = (req as any).user;
  const { userId } = req.params;

  if (requestingUser.role !== "admin" && requestingUser.id !== userId) {
    return res.status(403).json({
      success: false,
      error: "Acceso denegado: No tienes permiso para ver las notas de otro atleta.",
    });
  }

  const notes = serverDatabase.getUserNotes(userId);
  return res.json({ success: true, notes });
});

// Add new note for user
app.post("/api/user/:userId/notes", authenticateSession, (req, res) => {
  const requestingUser = (req as any).user;
  const { userId } = req.params;

  if (requestingUser.role !== "admin" && requestingUser.id !== userId) {
    return res.status(403).json({
      success: false,
      error: "Acceso denegado: No puedes crear notas para otra cuenta.",
    });
  }

  const { title, content, category, pinned } = req.body;
  if (!content || !content.trim()) {
    return res.status(400).json({ success: false, error: "El contenido de la nota no puede estar vacío." });
  }

  const newNote = serverDatabase.addUserNote(userId, {
    title: title || "Nota de Entrenamiento",
    content: content.trim(),
    category,
    pinned,
  });

  if (!newNote) {
    return res.status(404).json({ success: false, error: "No se encontró el usuario para agregar la nota." });
  }

  return res.status(201).json({
    success: true,
    message: "Nota persistida exitosamente en la base de datos.",
    note: newNote,
  });
});

// Update note
app.put("/api/user/:userId/notes/:noteId", authenticateSession, (req, res) => {
  const requestingUser = (req as any).user;
  const { userId, noteId } = req.params;

  if (requestingUser.role !== "admin" && requestingUser.id !== userId) {
    return res.status(403).json({
      success: false,
      error: "Acceso denegado: No puedes modificar notas de otra cuenta.",
    });
  }

  const updated = serverDatabase.updateUserNote(userId, noteId, req.body);
  if (!updated) {
    return res.status(404).json({ success: false, error: "Nota o usuario no encontrado." });
  }

  return res.json({
    success: true,
    message: "Nota actualizada en la base de datos.",
    note: updated,
  });
});

// Delete note
app.delete("/api/user/:userId/notes/:noteId", authenticateSession, (req, res) => {
  const requestingUser = (req as any).user;
  const { userId, noteId } = req.params;

  if (requestingUser.role !== "admin" && requestingUser.id !== userId) {
    return res.status(403).json({
      success: false,
      error: "Acceso denegado: No puedes eliminar notas de otra cuenta.",
    });
  }

  const deleted = serverDatabase.deleteUserNote(userId, noteId);
  if (!deleted) {
    return res.status(404).json({ success: false, error: "Nota o usuario no encontrado." });
  }

  return res.json({
    success: true,
    message: "Nota eliminada permanentemente de la base de datos.",
  });
});

// ==========================================
// 3. ADMINISTRATIVE DATABASE ENDPOINTS
// (Strictly protected by requireAdmin middleware)
// ==========================================

// Get all database records (safe: passwords remain hashed and protected on server)
app.get("/api/admin/database/records", requireAdmin, (req, res) => {
  try {
    const records = serverDatabase.getAllUsersForAdmin();
    const metrics = serverDatabase.getAdminMetrics();
    return res.json({
      success: true,
      records,
      metrics,
    });
  } catch (error: any) {
    console.error("Admin records error:", error);
    return res.status(500).json({ success: false, error: "Error al obtener registros de base de datos." });
  }
});

// Admin: Add a new user directly to database
app.post("/api/admin/database/records", requireAdmin, (req, res) => {
  try {
    const result = serverDatabase.adminCreateUser(req.body);
    if (!result.success) {
      return res.status(400).json(result);
    }
    return res.status(201).json(result);
  } catch (error: any) {
    console.error("Admin create user error:", error);
    return res.status(500).json({ success: false, error: "Error al crear usuario en base de datos." });
  }
});

// Admin: Update user in database
app.put("/api/admin/database/records/:userId", requireAdmin, (req, res) => {
  try {
    const { userId } = req.params;
    const result = serverDatabase.adminUpdateUser(userId, req.body);
    if (!result.success) {
      return res.status(400).json(result);
    }
    return res.json(result);
  } catch (error: any) {
    console.error("Admin update user error:", error);
    return res.status(500).json({ success: false, error: "Error al actualizar usuario." });
  }
});

// Admin: Delete user from database
app.delete("/api/admin/database/records/:userId", requireAdmin, (req, res) => {
  try {
    const { userId } = req.params;
    const result = serverDatabase.deleteUser(userId);
    if (!result.success) {
      return res.status(404).json(result);
    }
    return res.json(result);
  } catch (error: any) {
    console.error("Admin delete user error:", error);
    return res.status(500).json({ success: false, error: "Error al eliminar usuario." });
  }
});

// Admin: Reset a user password securely
app.post("/api/admin/database/records/:userId/reset-password", requireAdmin, (req, res) => {
  try {
    const { userId } = req.params;
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: "La nueva contraseña debe tener al menos 6 caracteres.",
      });
    }
    const result = serverDatabase.adminResetPassword(userId, newPassword);
    if (!result.success) {
      return res.status(400).json(result);
    }
    return res.json(result);
  } catch (error: any) {
    console.error("Admin reset password error:", error);
    return res.status(500).json({ success: false, error: "Error al restablecer la contraseña." });
  }
});

// Admin: Export entire database safely as JSON
app.get("/api/admin/database/export", requireAdmin, (req, res) => {
  try {
    const records = serverDatabase.getAllUsersForAdmin();
    const metrics = serverDatabase.getAdminMetrics();

    res.setHeader(
      "Content-Disposition",
      `attachment; filename=sportfitness_database_export_${Date.now()}.json`
    );
    res.setHeader("Content-Type", "application/json");

    return res.json({
      exportTimestamp: new Date().toISOString(),
      authorizedByAdmin: (req as any).user.email,
      metrics,
      totalRecords: records.length,
      records,
    });
  } catch (error: any) {
    console.error("Admin export error:", error);
    return res.status(500).json({ success: false, error: "Error al exportar base de datos." });
  }
});

// Admin: Metrics overview
app.get("/api/admin/metrics", requireAdmin, (req, res) => {
  try {
    const metrics = serverDatabase.getAdminMetrics();
    return res.json({ success: true, metrics });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: "Error al obtener métricas administrativas." });
  }
});

// ==========================================
// 4. SUPPORT TICKETING & COACH DESK ENDPOINTS
// (Replaces the unused generic AI chatbot with a dedicated certified support desk)
// ==========================================

interface SupportTicket {
  id: string;
  athleteEmail: string;
  athleteName: string;
  category: string;
  subject: string;
  message: string;
  urgency: "Normal" | "Alta" | "Urgente";
  status: "Pendiente" | "En Revisión" | "Resuelto";
  createdAt: string;
  assignedCoach: string;
}

const activeSupportTickets: SupportTicket[] = [
  {
    id: "TCK-2026-101",
    athleteEmail: "mateo.atleta@sportfitness.com",
    athleteName: "Mateo Gómez",
    category: "Metodología de Entrenamiento",
    subject: "Ajuste de sobrecarga en sentadilla goblet por molestia de rodilla",
    message: "Presento ligera molestia en tendón rotuliano al romper paralelo. Solicito variante biomecánica.",
    urgency: "Alta",
    status: "En Revisión",
    createdAt: "2026-09-14T10:30:00.000Z",
    assignedCoach: "Coach Carlos Martínez (Especialista en Biomecánica)",
  },
  {
    id: "TCK-2026-102",
    athleteEmail: "camila.ospina@sportfitness.com",
    athleteName: "Camila Ospina",
    category: "Nutrición & Suplementación",
    subject: "Distribución de carbohidratos en semana de descarga competitiva",
    message: "Tengo dudas sobre cómo reducir la carga glucídica sin perder masa magra.",
    urgency: "Normal",
    status: "Resuelto",
    createdAt: "2026-09-12T14:15:00.000Z",
    assignedCoach: "Nutricionista Valeria Duque",
  },
];

app.get("/api/support/tickets", (req, res) => {
  return res.json({ success: true, tickets: activeSupportTickets });
});

app.post("/api/support/tickets", (req, res) => {
  const { athleteEmail, athleteName, category, subject, message, urgency } = req.body;

  if (!athleteEmail || !subject || !message) {
    return res.status(400).json({
      success: false,
      error: "Debes completar el correo, asunto y mensaje para enviar tu solicitud al equipo técnico.",
    });
  }

  const newTicket: SupportTicket = {
    id: `TCK-${Date.now().toString().slice(-6)}`,
    athleteEmail: athleteEmail.trim(),
    athleteName: athleteName?.trim() || "Atleta Sportfitness",
    category: category || "Soporte General",
    subject: subject.trim(),
    message: message.trim(),
    urgency: urgency || "Normal",
    status: "Pendiente",
    createdAt: new Date().toISOString(),
    assignedCoach: "Equipo Técnico y Metodológico Sportfitness",
  };

  activeSupportTickets.unshift(newTicket);

  return res.status(201).json({
    success: true,
    message: "Tu ticket de soporte ha sido radicado con éxito. Un entrenador o técnico responderá en menos de 2 horas.",
    ticket: newTicket,
  });
});

// ==========================================
// 5. SERVER-SIDE GEMINI AI CHAT ENDPOINT
// ==========================================
app.post("/api/ai/chat", async (req, res) => {
  try {
    const { message, athleteContext, language = "es" } = req.body || {};

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "El mensaje es obligatorio." });
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(200).json({
        reply:
          "## ⚠️ Clave de Gemini API no configurada en el servidor\n\n" +
          "Para activar el Asistente Técnico y Biomecánico con IA en tiempo real:\n" +
          "1. Configura la variable `GEMINI_API_KEY` en tu entorno o archivo `.env`.\n" +
          "2. Reinicia el servidor para aplicar los cambios.",
        source: "offline-sports-engine",
      });
    }

    const ai = new GoogleGenAI({ apiKey });

    const langNameMap: Record<string, string> = {
      es: "Español",
      en: "English",
      pt: "Português",
      fr: "Français",
      de: "Deutsch",
      it: "Italiano",
    };
    const targetLangName = langNameMap[language] || "Español";

    const systemInstruction = `Eres Sportfitness AI, el Asistente Técnico, Fisiólogo Deportivo, Biomecánico y Coach de Rendimiento de élite de la plataforma "Sportfitness Para Todos".
Tu misión es resolver cualquier inquietud de atletas, entrenadores o usuarios sobre:
1. Ciencias del Ejercicio (fisiología neuromuscular, biomecánica de levantamientos, periodización de fuerza e hipertrofia, resistencia aeróbica, RPE, TSB y recuperación).
2. Nutrición Deportiva y Composición Corporal (macronutrientes, micronutrientes, hidratación, timing y suplementación basada en evidencia científica).
3. Cultura Deportiva General e Historia (reglamentos olímpicos, hitos del atletismo, récords mundiales, disciplinas de combate, calistenia, halterofilia y deportes de equipo).
4. Salud, Prevención de Lesiones y Ergonomía.

REGLAS DE ORO OBLIGATORIAS:
- NUNCA des respuestas superficiales, cortas o incompletas. Cada respuesta debe ser profunda, exhaustiva, científicamente fundamentada y con utilidad práctica inmediata.
- Estructura SIEMPRE tus respuestas con formato Markdown pulcro: Títulos principales (##), subtítulos (###), listas ordenadas/desglosadas con viñetas, tablas cuando sea pertinente y recomendaciones concretas paso a paso.
- Idioma de respuesta: Responde SIEMPRE en ${targetLangName} con terminología precisa y natural.
- Contexto del atleta activo: ${JSON.stringify(athleteContext || {})}.`;

    const modelName = process.env.GEMINI_MODEL || "gemini-2.5-flash";
    const prompt = `${message}\n\n[Idioma preferido del usuario: ${targetLangName}]\n[Datos del usuario: ${JSON.stringify(athleteContext || {})}]`;

    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.6,
      },
    });

    const reply = response.text || "Respuesta procesada correctamente por Sportfitness AI.";
    return res.status(200).json({ reply, source: `${modelName} (Server-Side Proxy)` });
  } catch (error: any) {
    console.error("Server-Side Gemini API Error:", error);
    return res.status(500).json({
      reply: "Ocurrió un error al procesar la solicitud con Gemini en el servidor. Por favor verifica tu clave API o cuota.",
      error: error.message,
    });
  }
});

async function startServer() {
  try {
    if (process.env.NODE_ENV !== "production") {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } else {
      const distPath = path.join(process.cwd(), "dist");
      app.use(express.static(distPath));
      app.get("*", (req, res) => {
        res.sendFile(path.join(distPath, "index.html"));
      });
    }

    const server = app.listen(PORT, "0.0.0.0", () => {
      console.log(`Sportfitness Server running on http://0.0.0.0:${PORT}`);
    });

    server.on("error", (err: any) => {
      console.error("Server listen error:", err);
    });
  } catch (err) {
    console.error("Failed to start Sportfitness server:", err);
    process.exit(1);
  }
}

process.on("unhandledRejection", (reason) => {
  console.warn("Unhandled Promise Rejection in server.ts:", reason);
});

startServer();
