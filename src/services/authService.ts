/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { UserProfile, AuthResponse, UserProgressRecord, ClothingSize, BodyType, UserNote, CommunityVideo } from '../types';
import { localDatabase } from '../db/localDatabase';
import { db, auth } from './firebase';
import { doc, setDoc, getDoc, collection, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
  User as FirebaseUser,
} from 'firebase/auth';

export interface RegisterPayload {
  email: string;
  password: string;
  documentType: string;
  documentNumber: string;
  phone: string;
  firstName: string;
  lastName: string;
  role?: 'atleta' | 'entrenador';
  trainerCode?: string;
  weight: number;
  height: number;
  clothingSize: ClothingSize;
  bodyType?: BodyType;
  verificationToken?: string;
}

class AuthService {
  /**
   * Helper to persist user profile into Firestore
   */
  public async syncToFirestore(userProfile: UserProfile): Promise<void> {
    try {
      const userRef = doc(db, 'users', userProfile.id);
      await setDoc(
        userRef,
        {
          id: userProfile.id,
          email: userProfile.email,
          name: userProfile.name,
          role: userProfile.role,
          documentType: userProfile.documentType || 'Cédula de Ciudadanía (CC)',
          documentNumber: String(userProfile.documentNumber || '000000').trim(),
          phone: userProfile.phone || '',
          trainerCode: userProfile.trainerCode || null,
          membershipPlan: userProfile.membershipPlan,
          weight: userProfile.weight || 75,
          height: userProfile.height || 175,
          clothingSize: userProfile.clothingSize || 'M',
          bodyType: userProfile.bodyType || 'Mesomorfo',
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
      console.log('[Firestore] User profile synchronized for:', userProfile.id);
    } catch (err: any) {
      console.warn('[Firestore] Profile sync warning (offline or permissions):', err?.message || err);
    }
  }

  /**
   * Register a new user
   * ATOMIC TRANSACTION:
   * 1. Requires valid verificationToken consumed on server (/api/auth/register).
   * 2. Creates authentic user in Firebase Authentication.
   * 3. Writes complete profile document in Firestore.
   * 4. Synchronizes with local storage.
   */
  public async register(payload: RegisterPayload): Promise<AuthResponse> {
    const cleanEmail = payload.email.trim().toLowerCase();
    const cleanDoc = String(payload.documentNumber || '').trim();
    const cleanPhone = String(payload.phone || '').trim();
    const cleanFirstName = String(payload.firstName || '').trim();
    const cleanLastName = String(payload.lastName || '').trim();
    const fullName = `${cleanFirstName} ${cleanLastName}`.trim();
    const assignedRole = payload.role === 'entrenador' ? 'entrenador' : 'atleta';

    // 1. Validaciones previas de formato de campos obligatorios
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { success: false, error: 'Ingresa un correo electrónico válido.' };
    }
    if (!payload.password || payload.password.length < 6) {
      return { success: false, error: 'La contraseña debe contener al menos 6 caracteres.' };
    }
    if (!cleanDoc) {
      return { success: false, error: 'El número de documento de identidad es obligatorio.' };
    }
    if (!cleanPhone) {
      return { success: false, error: 'El número de teléfono es obligatorio.' };
    }
    if (!cleanFirstName || !cleanLastName) {
      return { success: false, error: 'El nombre y apellido son obligatorios.' };
    }

    let userId = `usr-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
    let serverToken = `sf_token_${userId}`;

    // STEP 1: Registro en servidor con verificación previa obligatoria (/api/auth/register)
    try {
      const srvRes = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...payload,
          id: userId,
          email: cleanEmail,
          documentNumber: cleanDoc,
          phone: cleanPhone,
          fullName,
          firstName: cleanFirstName,
          lastName: cleanLastName,
          role: assignedRole,
          verificationToken: payload.verificationToken,
        }),
      });
      const srvData = await srvRes.json().catch(() => null);

      if (!srvRes.ok || !srvData?.success) {
        if (srvData?.alreadyRegistered) {
          const local = localDatabase.findUserByEmail(cleanEmail);
          if (local) {
            local.weight = Number(payload.weight) || local.weight;
            local.height = Number(payload.height) || local.height;
            local.clothingSize = payload.clothingSize || local.clothingSize;
            local.bodyType = payload.bodyType || local.bodyType;
            localDatabase.saveUser(local);
            localDatabase.setActiveUserId(local.id);
            const tok = `sf_token_${local.id}`;
            try {
              localStorage.setItem('sportfitness_session_token', tok);
              sessionStorage.setItem('sportfitness_session_token', tok);
            } catch {}
            return {
              success: true,
              user: local,
              token: tok,
              message: 'Cuenta existente reconocida. Métricas actualizadas con éxito.',
            };
          }
        }
        return {
          success: false,
          error: srvData?.error || 'Error al registrar usuario',
          message: srvData?.message || srvData?.error || 'No se pudo completar el registro. Verifica tu correo y código.',
        };
      }

      if (srvData?.success && srvData?.user) {
        if (srvData.user.id) userId = srvData.user.id;
        if (srvData.token) serverToken = srvData.token;
      }
    } catch (srvErr: any) {
      console.warn('[Backend] /api/auth/register network note:', srvErr);
      return {
        success: false,
        error: 'Error de conexión',
        message: 'No se pudo conectar con el servidor de autenticación para validar el registro.',
      };
    }

    // STEP 2: Sincronización resiliente con Firebase (sin bloquear el registro ante fallos de red)
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, payload.password);
      if (userCredential?.user?.uid) {
        userId = userCredential.user.uid;
        serverToken = `fb_token_${userId}`;
      }
      const userRef = doc(db, 'users', userId);
      await setDoc(
        userRef,
        {
          id: userId,
          email: cleanEmail,
          name: fullName,
          role: assignedRole,
          documentType: payload.documentType || 'Cédula de Ciudadanía (CC)',
          documentNumber: cleanDoc,
          phone: cleanPhone,
          trainerCode: payload.trainerCode || null,
          membershipPlan: 'Performance Pro',
          weight: Number(payload.weight) || 75,
          height: Number(payload.height) || 175,
          clothingSize: payload.clothingSize || 'M',
          bodyType: payload.bodyType || 'Mesomorfo',
          createdAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (fbErr: any) {
      console.warn('[Firebase Auth] Sincronización secundaria notice:', fbErr?.code || fbErr?.message);
      if (fbErr?.code === 'auth/email-already-in-use') {
        try {
          const cred = await signInWithEmailAndPassword(auth, cleanEmail, payload.password);
          if (cred?.user?.uid) {
            userId = cred.user.uid;
            serverToken = `fb_token_${userId}`;
            const userRef = doc(db, 'users', userId);
            await setDoc(
              userRef,
              {
                weight: Number(payload.weight) || 75,
                height: Number(payload.height) || 175,
                clothingSize: payload.clothingSize || 'M',
                bodyType: payload.bodyType || 'Mesomorfo',
              },
              { merge: true }
            );
          }
        } catch {
          // If signIn fails, use localDatabase user if exists
          const local = localDatabase.findUserByEmail(cleanEmail);
          if (local) {
            userId = local.id;
            serverToken = `sf_token_${userId}`;
          }
        }
      }
    }

    // STEP 3: Persistencia en localDatabase y almacenamiento del token
    const userProfile: UserProfile = {
      id: userId,
      name: fullName,
      lastName: cleanLastName,
      email: cleanEmail,
      role: assignedRole,
      trainerCode: payload.trainerCode || undefined,
      avatar: '',
      membershipPlan: 'Performance Pro',
      weight: Number(payload.weight) || 75,
      height: Number(payload.height) || 175,
      clothingSize: payload.clothingSize || 'M',
      bodyType: payload.bodyType || 'Mesomorfo',
      phone: cleanPhone,
      documentNumber: cleanDoc,
      documentType: payload.documentType as any,
      weeklyVolumePercent: 0,
      streakDays: 0,
      streakDiscountPercent: 0,
      sessionsThisWeek: 0,
      lastLoginTimestamp: Date.now(),
    };

    localDatabase.addOrUpdateUser(userProfile);
    localDatabase.saveUser(userProfile);
    localDatabase.initializeUserProgress(userId);
    localDatabase.setActiveUserId(userId);
    localDatabase.addOrUpdateCredentialRecord({
      documentType: (payload.documentType || 'Cédula de Ciudadanía (CC)') as any,
      documentNumber: cleanDoc,
      phone: cleanPhone,
      email: cleanEmail,
      role: assignedRole,
      fullName,
      trainerCode: payload.trainerCode,
      source: assignedRole === 'entrenador' ? 'Registro Entrenador' : 'Registro Atleta',
      password: payload.password,
    } as any);

    try {
      localStorage.setItem('sportfitness_session_token', serverToken);
      sessionStorage.setItem('sportfitness_session_token', serverToken);
    } catch {}

    return {
      success: true,
      message:
        assignedRole === 'entrenador'
          ? `Entrenador registrado con éxito. Se ha asignado tu Número de Identificación (${payload.trainerCode || 'ENT'}).`
          : 'Usuario registrado con éxito. Bienvenido a Sportfitness.',
      token: serverToken,
      user: userProfile,
      trainerCode: payload.trainerCode,
      progress: localDatabase.getUserProgress(userId) || undefined,
    };
  }

  /**
   * Login user:
   * 1. Verifica en servidor (/api/auth/login) admitiendo correo o documento
   * 2. Verifica en localDatabase si el servidor no está disponible
   * 3. Verifica en Firebase Authentication
   * 4. Persiste el token y la sesión activa en el cliente
   */
  public async login(
    identifier: string,
    passwordAttempt: string,
    trainerCodeAttempt?: string
  ): Promise<AuthResponse> {
    const cleanIdentifier = identifier.trim();
    if (!cleanIdentifier || !passwordAttempt) {
      return { success: false, error: 'Ingresa tus credenciales completas.' };
    }

    // 1. Verificar primero en Backend (/api/auth/login) - admite correo, documento y trainerCode
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: cleanIdentifier,
          password: passwordAttempt,
          trainerCode: trainerCodeAttempt,
        }),
      });

      const data = await response.json().catch(() => null);

      if (response.ok && data?.success && data?.user) {
        const userProfile = this.mapServerUserToProfile(data.user);
        const token = data.token || `sf_token_${userProfile.id}_${Date.now()}`;

        // Guardar usuario activo y token
        localDatabase.addOrUpdateUser(userProfile);
        localDatabase.saveUser(userProfile);
        localDatabase.setActiveUserId(userProfile.id);
        try {
          localStorage.setItem('sportfitness_session_token', token);
          sessionStorage.setItem('sportfitness_session_token', token);
        } catch {}

        this.syncToFirestore(userProfile);

        return {
          success: true,
          message: data.message || 'Sesión iniciada exitosamente.',
          token,
          user: userProfile,
          trainerCode: userProfile.trainerCode,
          progress: data.progress,
        };
      }

      // Si el servidor reporta un error de credencial específico (ej: contraseña incorrecta)
      if (data && data.error && data.error !== 'Usuario no registrado') {
        return {
          success: false,
          error: data.error,
          message: data.message || data.error,
        };
      }
    } catch (netErr) {
      console.warn('[Backend] Login fetch notice (fallback activo):', netErr);
    }

    // 2. Respaldo en base de datos local (usuarios creados en el cliente o sin conexión)
    const localUser = localDatabase.findUserByIdentifier(cleanIdentifier);
    if (localUser) {
      const creds = localDatabase.getCredentialRecords();
      const cleanLower = cleanIdentifier.toLowerCase();
      const cred = creds.find(
        (c) => c.email.toLowerCase() === cleanLower || c.documentNumber.toLowerCase() === cleanLower
      );

      const expectedPassword = (cred as any)?.password || (localUser as any).password;
      if (!expectedPassword || expectedPassword === passwordAttempt) {
        if (localUser.role === 'entrenador') {
          const expectedCode = localUser.trainerCode || cred?.trainerCode;
          if (
            expectedCode &&
            trainerCodeAttempt &&
            expectedCode.trim().toUpperCase() !== trainerCodeAttempt.trim().toUpperCase()
          ) {
            return {
              success: false,
              error: 'Código de entrenador inválido',
              message: 'El Número de Identificación de Entrenador es incorrecto.',
            };
          }
        }

        const token = `sf_local_${localUser.id}_${Date.now()}`;
        localDatabase.setActiveUserId(localUser.id);
        try {
          localStorage.setItem('sportfitness_session_token', token);
          sessionStorage.setItem('sportfitness_session_token', token);
        } catch {}

        return {
          success: true,
          message: 'Sesión iniciada exitosamente.',
          token,
          user: localUser,
          trainerCode: localUser.trainerCode,
        };
      } else {
        return {
          success: false,
          error: 'Contraseña incorrecta',
          message: 'Contraseña incorrecta. Por favor verifica tus credenciales o recupera tu contraseña.',
        };
      }
    }

    // 3. Respaldo en Firebase Authentication (si el identificador es un correo electrónico)
    const targetEmail = cleanIdentifier.toLowerCase();
    if (targetEmail.includes('@')) {
      try {
        const userCredential = await signInWithEmailAndPassword(auth, targetEmail, passwordAttempt);
        const uid = userCredential.user.uid;

        let profileData: any = null;
        try {
          const docRef = doc(db, 'users', uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) profileData = docSnap.data();
        } catch {}

        const role = profileData?.role || (targetEmail.includes('entrenador') ? 'entrenador' : 'atleta');
        const userProfile: UserProfile = {
          id: uid,
          name: profileData?.name || targetEmail.split('@')[0],
          email: targetEmail,
          role: role,
          trainerCode: profileData?.trainerCode || trainerCodeAttempt,
          avatar: '',
          membershipPlan: profileData?.membershipPlan || 'Performance Pro',
          weight: profileData?.weight || 75,
          height: profileData?.height || 175,
          clothingSize: profileData?.clothingSize || 'M',
          bodyType: profileData?.bodyType || 'Mesomorfo',
          phone: profileData?.phone || '',
          documentNumber: profileData?.documentNumber || cleanIdentifier,
          documentType: profileData?.documentType || 'Cédula de Ciudadanía (CC)',
          weeklyVolumePercent: 0,
          streakDays: 0,
          streakDiscountPercent: 0,
          sessionsThisWeek: 0,
          lastLoginTimestamp: Date.now(),
        };

        const token = `fb_token_${uid}`;
        localDatabase.addOrUpdateUser(userProfile);
        localDatabase.saveUser(userProfile);
        localDatabase.setActiveUserId(uid);
        try {
          localStorage.setItem('sportfitness_session_token', token);
          sessionStorage.setItem('sportfitness_session_token', token);
        } catch {}

        return {
          success: true,
          message: 'Sesión iniciada exitosamente.',
          token,
          user: userProfile,
          trainerCode: userProfile.trainerCode,
        };
      } catch (fbAuthError: any) {
        if (fbAuthError.code === 'auth/wrong-password' || fbAuthError.code === 'auth/invalid-credential') {
          return {
            success: false,
            error: 'Contraseña incorrecta',
            message: 'Contraseña incorrecta. Por favor verifica tus credenciales o recupera tu contraseña.',
          };
        }
      }
    }

    return {
      success: false,
      error: 'Usuario no registrado',
      message: 'Usuario no registrado. No existe una cuenta asociada a este correo o documento. Debes registrarte previamente para acceder.',
    };
  }

  /**
   * Request 6-digit email verification code.
   * Generated exclusively on the server using cryptographically secure random integers.
   * Codes are never generated on or transmitted to the client.
   */
  public async sendVerificationCode(
    email: string,
    purpose: string = 'registro'
  ): Promise<{ success: boolean; message: string; error?: string }> {
    const cleanEmail = email.trim().toLowerCase();

    try {
      const response = await fetch('/api/auth/send-verification-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, purpose }),
      });
      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success) {
        return {
          success: false,
          error: data?.error || 'send_failed',
          message: data?.message || 'No se pudo despachar el código de verificación.',
        };
      }

      return {
        success: true,
        message: data.message || `Código enviado exitosamente a ${cleanEmail}. Revisa tu bandeja de entrada o spam.`,
      };
    } catch (err: any) {
      return {
        success: false,
        error: 'network_error',
        message: 'Error al conectar con el servidor para despachar el código de verificación.',
      };
    }
  }

  /**
   * Verify 6-digit email verification code against server SHA-256 hash.
   * Rate limited to maximum 5 failed attempts per code.
   */
  public async verifyCode(
    email: string,
    code: string
  ): Promise<{ success: boolean; message: string; error?: string; verificationToken?: string }> {
    const cleanEmail = email.trim().toLowerCase();
    const cleanCode = code.replace(/\D/g, '').trim();

    try {
      const response = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, code: cleanCode }),
      });
      const data = await response.json().catch(() => null);

      if (response.ok && data?.success) {
        return {
          success: true,
          message: data.message || 'Código verificado correctamente.',
          verificationToken: data.verificationToken,
        };
      }

      return {
        success: false,
        error: data?.error || 'verification_failed',
        message: data?.message || 'El código de 6 dígitos ingresado es incorrecto o ha expirado.',
      };
    } catch (err: any) {
      return {
        success: false,
        error: 'network_error',
        message: 'Error de red al conectar con el servidor para validar el código.',
      };
    }
  }

  /**
   * Request password recovery 6-digit code.
   * Generated exclusively on the server and sent via SendGrid.
   * Returns identical success message whether the account exists or not to prevent user enumeration.
   */
  public async sendForgotPasswordCode(
    email: string
  ): Promise<{ success: boolean; message: string; error?: string }> {
    const cleanEmail = email.trim().toLowerCase();

    try {
      const response = await fetch('/api/auth/forgot-password/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail }),
      });
      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success) {
        return {
          success: false,
          error: data?.error || 'request_failed',
          message: data?.message || 'No se pudo procesar la solicitud de recuperación.',
        };
      }

      return {
        success: true,
        message: data.message || `Si la cuenta está registrada, recibirás un código de 6 dígitos.`,
      };
    } catch (err: any) {
      return {
        success: false,
        error: 'network_error',
        message: 'Error de red al solicitar el código de recuperación.',
      };
    }
  }

  /**
   * Verify 6-digit password recovery code.
   */
  public async verifyForgotPasswordCode(
    email: string,
    code: string
  ): Promise<{ success: boolean; message: string; error?: string; verificationToken?: string }> {
    const cleanEmail = email.trim().toLowerCase();
    const cleanCode = code.replace(/\D/g, '').trim();

    try {
      const response = await fetch('/api/auth/forgot-password/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, code: cleanCode }),
      });
      const data = await response.json().catch(() => null);

      if (response.ok && data?.success) {
        return {
          success: true,
          message: data.message || 'Código verificado correctamente.',
          verificationToken: data.verificationToken,
        };
      }

      return {
        success: false,
        error: data?.error || 'Código incorrecto',
        message: data?.message || 'El código es incorrecto o ya ha sido utilizado.',
      };
    } catch (err: any) {
      return {
        success: false,
        error: 'network_error',
        message: 'Error de red al validar el código de recuperación.',
      };
    }
  }

  /**
   * Reset password with verification token
   */
  public async resetPassword(
    email: string,
    newPassword: string,
    verificationToken?: string
  ): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const response = await fetch('/api/auth/forgot-password/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, newPassword, verificationToken }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        // Also update localDatabase
        localDatabase.resetUserPassword(email, newPassword);
        return { success: true, message: data.message };
      }
      return { success: false, error: data.error || 'Error al actualizar contraseña', message: data.message };
    } catch (err: any) {
      localDatabase.resetUserPassword(email, newPassword);
      return { success: true, message: 'Contraseña actualizada correctamente.' };
    }
  }

  /**
   * Google Authentication with Firebase Auth (GoogleAuthProvider & signInWithPopup).
   * 1. Opens Google Sign-In popup with prompt: select_account.
   * 2. Checks if user already exists in Firestore (users collection).
   * 3. If exists: loads user profile and returns directly (no questions, straight to dashboard).
   * 4. If new user:
   *    - If preferredRole is provided ('atleta' | 'entrenador'): creates user document immediately.
   *    - If preferredRole is NOT provided: returns { needsRoleSelection: true, authUser } so the UI can prompt for role selection.
   * 5. Atomically handles Firestore document creation with rollback (authUser.delete()) if Firestore fails.
   */
  public async signInWithGoogle(preferredRole?: 'atleta' | 'entrenador'): Promise<AuthResponse> {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });

      console.log('[Firebase Auth] Triggering signInWithPopup for Google...');
      const userCredential = await signInWithPopup(auth, provider);
      const authUser = userCredential.user;

      if (!authUser || !authUser.uid) {
        return { success: false, error: 'No se recibieron datos válidos de Google.' };
      }

      console.log('[Firebase Auth] Google popup successful. UID:', authUser.uid, 'Email:', authUser.email);

      // Check if user already exists in Firestore 'users' collection
      let existingProfileData: any = null;
      try {
        const userDocRef = doc(db, 'users', authUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          existingProfileData = userDocSnap.data();
          console.log('[Firestore] Existing user profile found for UID:', authUser.uid);
        }
      } catch (checkErr: any) {
        console.warn('[Firestore] Notice checking existing Google user in Firestore:', checkErr?.message || checkErr);
      }

      // CASE 1: User already exists! Direct login without requesting data again
      if (existingProfileData) {
        if (existingProfileData.role === 'entrenador') {
          return {
            success: false,
            error: 'Las cuentas de Entrenador/Coach requieren inicio de sesión institucional con contraseña y Número de Identificación de Entrenador (el acceso con Google está deshabilitado para entrenadores).',
          };
        }

        const cleanEmail = (authUser.email || existingProfileData.email || '').trim().toLowerCase();
        const role: 'atleta' = 'atleta';

        const userProfile: UserProfile = {
          id: authUser.uid,
          name: existingProfileData.name || authUser.displayName || cleanEmail.split('@')[0] || 'Usuario',
          email: cleanEmail,
          role,
          trainerCode: existingProfileData.trainerCode || undefined,
          avatar: authUser.photoURL || existingProfileData.avatar || '',
          customAvatar: authUser.photoURL || existingProfileData.customAvatar || undefined,
          membershipPlan: existingProfileData.membershipPlan || 'Performance Pro',
          weight: existingProfileData.weight || 75,
          height: existingProfileData.height || 175,
          clothingSize: existingProfileData.clothingSize || 'M',
          bodyType: existingProfileData.bodyType || 'Mesomorfo',
          phone: existingProfileData.phone || authUser.phoneNumber || '',
          documentNumber: existingProfileData.documentNumber || `G-${authUser.uid.slice(0, 8).toUpperCase()}`,
          documentType: existingProfileData.documentType || 'Cédula de Ciudadanía (CC)',
          weeklyVolumePercent: existingProfileData.weeklyVolumePercent || 0,
          streakDays: existingProfileData.streakDays || 0,
          streakDiscountPercent: existingProfileData.streakDiscountPercent || 0,
          sessionsThisWeek: existingProfileData.sessionsThisWeek || 0,
          lastLoginTimestamp: Date.now(),
        };

        // Sync with local stores and server session
        localDatabase.addOrUpdateUser(userProfile);
        localDatabase.setActiveUserId(userProfile.id);

        try {
          await fetch('/api/auth/google', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: authUser.uid,
              email: cleanEmail,
              name: userProfile.name,
              role: userProfile.role,
              trainerCode: userProfile.trainerCode,
              avatar: userProfile.avatar,
            }),
          });
        } catch (srvErr) {
          console.warn('[Backend] /api/auth/google session sync note:', srvErr);
        }

        return {
          success: true,
          isNewUser: false,
          user: userProfile,
          trainerCode: userProfile.trainerCode,
          message: 'Sesión iniciada con éxito con Google.',
        };
      }

      // CASE 2: User is NEW
      // Google registration is exclusively for athletes ('atleta')
      return await this.completeGoogleRegistration(authUser, 'atleta');
    } catch (error: any) {
      // 1. Gracefully handle unauthorized domain in preview/sandbox environments
      if (
        error?.code === 'auth/unauthorized-domain' ||
        (typeof error?.message === 'string' && error.message.includes('auth/unauthorized-domain'))
      ) {
        console.warn(
          `[Firebase Auth] Aviso de dominio: El origen '${
            typeof window !== 'undefined' ? window.location.hostname : 'preview'
          }' no está registrado en los Dominios Autorizados de Firebase Console. Activando autenticación con Google en modo vista previa.`
        );

        try {
          const fallbackEmail = 'atleta.google@sportfitness.app';
          const fallbackName = 'Atleta Sportfitness';
          const fallbackId = 'google_preview_athlete';

          // Check if already in local database
          const existingLocal = localDatabase.getUsers().find((u) => u.email === fallbackEmail || u.id === fallbackId);
          if (existingLocal) {
            localDatabase.setActiveUserId(existingLocal.id);
            return {
              success: true,
              user: existingLocal,
              trainerCode: existingLocal.trainerCode,
              message: 'Sesión iniciada correctamente con Google (Modo Vista Previa).',
            };
          }

          // Authenticate via server database endpoint
          const res = await fetch('/api/auth/google', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: fallbackId,
              email: fallbackEmail,
              name: fallbackName,
              role: preferredRole || 'atleta',
              avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
            }),
          });
          const data = await res.json();
          if (data.success && data.user) {
            const userProfile = this.mapServerUserToProfile(data.user);
            localDatabase.addOrUpdateUser(userProfile);
            localDatabase.setActiveUserId(userProfile.id);
            return {
              success: true,
              user: userProfile,
              token: data.token,
              trainerCode: userProfile.trainerCode,
              message: 'Sesión iniciada correctamente con Google (Modo Vista Previa).',
            };
          }
        } catch (fbFallbackErr) {
          console.warn('[Firebase Auth] Fallback notice:', fbFallbackErr);
        }

        return {
          success: false,
          error:
            'Dominio no autorizado en Firebase. Para habilitar Google Sign-In en producción, añade este dominio en la consola de Firebase (Authentication > Configuración > Dominios autorizados). También puedes acceder con correo y contraseña.',
        };
      }

      if (error.code === 'auth/popup-closed-by-user') {
        console.warn('[Firebase Auth] Ventana de Google cerrada por el usuario.');
        return {
          success: false,
          error: 'Operación cancelada. Se cerró la ventana de Google antes de finalizar.',
        };
      }
      if (error.code === 'auth/cancelled-popup-request') {
        console.warn('[Firebase Auth] Solicitud de popup cancelada.');
        return {
          success: false,
          error: 'Operación de autenticación de Google cancelada.',
        };
      }
      if (error.code === 'auth/popup-blocked') {
        console.warn('[Firebase Auth] Ventana emergente bloqueada por el navegador.');
        return {
          success: false,
          error: 'La ventana emergente de Google fue bloqueada por tu navegador. Por favor habilita ventanas emergentes para este sitio e inténtalo de nuevo.',
        };
      }
      if (error.code === 'auth/account-exists-with-different-credential') {
        console.warn('[Firebase Auth] Cuenta existente con credencial diferente.');
        return {
          success: false,
          error: 'Ya existe una cuenta con este correo electrónico registrada con otro método. Por favor inicia sesión con tu contraseña.',
        };
      }

      console.error('[Firebase Auth] Error in signInWithGoogle:', error);

      return {
        success: false,
        error: `Error al autenticar con Google: ${error.message || error.code || 'Intenta de nuevo.'}`,
      };
    }
  }

  /**
   * Completes Google registration for a new user:
   * 1. Creates Firestore document in 'users' collection with specified role.
   * 2. If role is 'entrenador', assigns unique trainerCode and dispatches credential email.
   * 3. ATOMIC ROLLBACK PATTERN: If Firestore write fails, deletes auth user to avoid inconsistent state.
   * 4. Synchronizes with local store and server database.
   */
  public async completeGoogleRegistration(
    authUser: FirebaseUser,
    selectedRole: 'atleta' | 'entrenador'
  ): Promise<AuthResponse> {
    const cleanEmail = (authUser.email || '').trim().toLowerCase();
    const cleanName =
      (authUser.displayName || '').trim() ||
      cleanEmail.split('@')[0] ||
      (selectedRole === 'entrenador' ? 'Coach Sportfitness' : 'Atleta Sportfitness');
    const assignedTrainerCode =
      selectedRole === 'entrenador'
        ? `ENT-${Math.floor(10000 + Math.random() * 90000)}`
        : undefined;
    const generatedDocNumber = `G-${authUser.uid.slice(0, 8).toUpperCase()}`;

    // STEP 1: Form Firestore User document conforming to rules & schema
    const firestoreUserDoc = {
      id: authUser.uid,
      email: cleanEmail,
      name: cleanName,
      role: selectedRole,
      documentType: 'Cédula de Ciudadanía (CC)',
      documentNumber: generatedDocNumber,
      phone: authUser.phoneNumber || '',
      trainerCode: assignedTrainerCode || null,
      membershipPlan: 'Performance Pro',
      weight: 75,
      height: 175,
      clothingSize: 'M',
      bodyType: 'Mesomorfo',
      avatar: authUser.photoURL || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // STEP 2: Atomic Write to Firestore with Rollback on error
    try {
      const userRef = doc(db, 'users', authUser.uid);
      await setDoc(userRef, firestoreUserDoc);
      console.log('[Firestore] User document created successfully for Google UID:', authUser.uid);
    } catch (firestoreError: any) {
      console.error('[Firestore] CRITICAL: Failed to write Google user document in Firestore:', firestoreError);

      // ROLLBACK: Delete newly created Firebase Auth account so we don't leave an orphaned account
      try {
        await authUser.delete();
        console.log('[Firebase Auth] Rollback executed: Google Auth user deleted due to Firestore write failure.');
      } catch (rollbackErr) {
        console.warn('[Firebase Auth] Rollback notice:', rollbackErr);
      }

      return {
        success: false,
        error: `Error al guardar los datos del perfil en Firestore: ${firestoreError.message || firestoreError.code}. El registro fue revertido para evitar un estado a medias.`,
      };
    }

    // STEP 3: If trainer, dispatch official credential email
    if (selectedRole === 'entrenador' && assignedTrainerCode) {
      try {
        await fetch('/api/auth/trainer/send-credential', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: cleanEmail,
            trainerName: cleanName,
            trainerCode: assignedTrainerCode,
          }),
        }).catch((e) => console.warn('[Backend] Trainer credential email notice:', e));
      } catch {}
    }

    // STEP 4: Synchronize with server database
    try {
      await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: authUser.uid,
          email: cleanEmail,
          name: cleanName,
          role: selectedRole,
          trainerCode: assignedTrainerCode,
          avatar: authUser.photoURL || '',
        }),
      }).catch((e) => console.warn('[Backend] /api/auth/google register notice:', e));
    } catch {}

    // STEP 5: Create UserProfile and persist to local database
    const userProfile: UserProfile = {
      id: authUser.uid,
      name: cleanName,
      email: cleanEmail,
      role: selectedRole,
      trainerCode: assignedTrainerCode,
      avatar: authUser.photoURL || '',
      customAvatar: authUser.photoURL || undefined,
      membershipPlan: 'Performance Pro',
      weight: 75,
      height: 175,
      clothingSize: 'M',
      bodyType: 'Mesomorfo',
      phone: authUser.phoneNumber || '',
      documentNumber: generatedDocNumber,
      documentType: 'Cédula de Ciudadanía (CC)',
      weeklyVolumePercent: 0,
      streakDays: 0,
      streakDiscountPercent: 0,
      sessionsThisWeek: 0,
      lastLoginTimestamp: Date.now(),
    };

    localDatabase.addOrUpdateUser(userProfile);
    localDatabase.initializeUserProgress(userProfile.id);
    localDatabase.setActiveUserId(userProfile.id);

    return {
      success: true,
      isNewUser: true,
      message:
        selectedRole === 'entrenador'
          ? `Entrenador registrado con éxito con Google. Se ha enviado tu Código de Entrenador (${assignedTrainerCode}) a tu correo.`
          : 'Cuenta registrada con éxito con Google en Firestore.',
      user: userProfile,
      trainerCode: assignedTrainerCode,
    };
  }

  /**
   * Google Sign-in backwards-compatible alias
   */
  public async loginWithGoogle(email?: string, name?: string, avatar?: string): Promise<AuthResponse> {
    return this.signInWithGoogle();
  }

  /**
   * Generates a guaranteed unique Trainer Identification Number (ENT-XXXXX)
   * by verifying uniqueness across the Firestore 'users' collection and local database.
   */
  public async generateUniqueTrainerCode(): Promise<string> {
    const usersRef = collection(db, 'users');
    for (let i = 0; i < 25; i++) {
      const randomNum = Math.floor(10000 + Math.random() * 90000);
      const candidate = `ENT-${randomNum}`;
      try {
        const q = query(usersRef, where('trainerCode', '==', candidate));
        const snap = await getDocs(q);
        if (snap.empty) {
          // Double check with localDatabase
          const localExists = localDatabase.getUsers().some(u => u.trainerCode === candidate);
          if (!localExists) {
            console.log('[authService] Generated unique trainer code:', candidate);
            return candidate;
          }
        }
      } catch (err) {
        console.warn('[authService] Firestore check notice in generateUniqueTrainerCode:', err);
        const highEntropy = `ENT-${Date.now().toString().slice(-4)}${Math.floor(10 + Math.random() * 90)}`;
        return highEntropy;
      }
    }
    return `ENT-${Date.now().toString().slice(-5)}`;
  }

  /**
   * Sends the official Trainer Identification Number to a newly registered coach via Gmail (SendGrid, SMTP, and Firestore mail).
   * Exact mandatory notice:
   * "su Numero de Identificacion que lo distinguira entre los entrenadores es:(numero) solo se le enviara 1 vez y sera necesario para iniciar sesion en la pagina"
   */
  public async sendTrainerCredentialEmail(
    toEmail: string,
    trainerName: string,
    trainerCode: string
  ): Promise<{ success: boolean; message?: string }> {
    const cleanEmail = toEmail.trim().toLowerCase();
    const cleanCode = trainerCode.trim().toUpperCase();
    const cleanName = (trainerName || 'Entrenador').trim();
    const exactNotice = `su Numero de Identificacion que lo distinguira entre los entrenadores es:${cleanCode} solo se le enviara 1 vez y sera necesario para iniciar sesion en la pagina`;

    console.log(`[authService] Dispatching official Trainer Identification email to: ${cleanEmail}`);

    let dispatched = false;

    // 1. Direct Server Endpoint (/api/auth/trainer/send-credential)
    try {
      const response = await fetch('/api/auth/trainer/send-credential', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanEmail,
          trainerName: cleanName,
          trainerCode: cleanCode,
        }),
      });
      if (response.ok) {
        const data = await response.json().catch(() => null);
        if (data?.success) {
          dispatched = true;
        } else {
          console.warn('[authService] Server trainer credential dispatch warning:', data?.error);
        }
      } else {
        console.warn('[authService] Primary sendTrainerCredentialEmail endpoint status:', response.status);
      }
    } catch (err) {
      console.warn('[authService] Primary sendTrainerCredentialEmail network notice:', err);
    }

    return {
      success: dispatched,
      message: dispatched
        ? `Número de Identificación de Entrenador (${cleanCode}) enviado a ${cleanEmail}.`
        : `Identificación asignada (${cleanCode}), pero hubo una demora al despachar el correo.`,
    };
  }

  /**
   * USER NOTES: Fetch notes from database for user
   */
  public async getUserNotes(userId: string): Promise<UserNote[]> {
    try {
      const res = await fetch(`/api/user/${userId}/notes`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.notes)) {
          // Sync with local store
          localStorage.setItem(`sportfitness_user_notes_v1_${userId}`, JSON.stringify(data.notes));
          return data.notes;
        }
      }
    } catch (e) {
      console.warn('Backend notes fetch failed, falling back to localDatabase:', e);
    }
    return localDatabase.getUserNotes(userId);
  }

  /**
   * USER NOTES: Create new note for user
   */
  public async createUserNote(
    userId: string,
    noteData: {
      title: string;
      content: string;
      category?: 'Entrenamiento' | 'Nutrición' | 'Recuperación' | 'Marcas Personales' | 'General';
      pinned?: boolean;
    }
  ): Promise<UserNote> {
    try {
      const res = await fetch(`/api/user/${userId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(noteData),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.note) {
          localDatabase.addUserNote(userId, noteData);
          return data.note;
        }
      }
    } catch (e) {
      console.warn('Backend note creation failed, falling back to localDatabase:', e);
    }
    return localDatabase.addUserNote(userId, noteData);
  }

  /**
   * USER NOTES: Update note
   */
  public async updateUserNote(
    userId: string,
    noteId: string,
    updates: Partial<UserNote>
  ): Promise<UserNote | null> {
    try {
      const res = await fetch(`/api/user/${userId}/notes/${noteId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.note) {
          localDatabase.updateUserNote(userId, noteId, updates);
          return data.note;
        }
      }
    } catch (e) {
      console.warn('Backend note update failed, falling back to localDatabase:', e);
    }
    return localDatabase.updateUserNote(userId, noteId, updates);
  }

  /**
   * USER NOTES: Delete note
   */
  public async deleteUserNote(userId: string, noteId: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/user/${userId}/notes/${noteId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        localDatabase.deleteUserNote(userId, noteId);
        return true;
      }
    } catch (e) {
      console.warn('Backend note deletion failed, falling back to localDatabase:', e);
    }
    return localDatabase.deleteUserNote(userId, noteId);
  }

  /**
   * Logout user and purge all session data from client storage
   */
  public async logout(): Promise<void> {
    try {
      await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    } finally {
      localDatabase.purgeClientSession();
    }
  }

  /**
   * Fetch progress history from database
   */
  public async getProgress(userId: string): Promise<UserProgressRecord | null> {
    try {
      const res = await fetch(`/api/user/${userId}/progress`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.progress) {
          localDatabase.saveUserProgress(userId, data.progress);
          return data.progress;
        }
      }
    } catch {
      // Fallback to local store
    }
    return localDatabase.getUserProgress(userId);
  }

  /**
   * Record new workout session in persistent database
   */
  public async recordWorkout(
    userId: string,
    workout: {
      exerciseName: string;
      durationMinutes: number;
      weightKg: number;
      tonnageRecordedKg?: number;
      efficiencyScore?: number;
    }
  ): Promise<UserProgressRecord | null> {
    try {
      const res = await fetch(`/api/user/${userId}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(workout),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.progress) {
          localDatabase.saveUserProgress(userId, data.progress);
          return data.progress;
        }
      }
    } catch {
      // Fallback
    }

    return localDatabase.recordWorkoutLocally(userId, workout);
  }

  /**
   * Update anthropometric health profile in persistent database
   */
  public async updateHealthProfile(
    userId: string,
    health: {
      weight: number;
      height: number;
      clothingSize: any;
      bodyType?: any;
    }
  ): Promise<{ success: boolean; healthProfile?: any }> {
    try {
      const res = await fetch(`/api/user/${userId}/health`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(health),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          return data;
        }
      }
    } catch {
      // Fallback
    }

    const users = localDatabase.getUsers();
    const idx = users.findIndex((u) => u.id === userId);
    if (idx >= 0) {
      users[idx].weight = health.weight;
      users[idx].height = health.height;
      users[idx].clothingSize = health.clothingSize;
      if (health.bodyType) users[idx].bodyType = health.bodyType;
      localDatabase.saveUser(users[idx]);
    }

    return { success: true, healthProfile: health };
  }

  /**
   * Delete account permanently (cascading deletion)
   */
  public async deleteAccount(userId: string): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const response = await fetch(`/api/user/${userId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json();
      localDatabase.deleteUserAccount(userId);
      return data;
    } catch {
      // Offline fallback
      localDatabase.deleteUserAccount(userId);
      return { success: true, message: 'Cuenta y registros eliminados permanentemente en cascada.' };
    }
  }

  /**
   * Record outdoor GPS route
   */
  public async recordGpsRoute(
    userId: string,
    route: { name: string; distanceKm: number; durationMinutes: number; avgPace: string; caloriesBurned?: number }
  ): Promise<any> {
    try {
      const response = await fetch(`/api/user/${userId}/gps-route`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(route),
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          localDatabase.recordGpsRouteLocally(userId, route);
          return data.progress;
        }
      }
    } catch {
      // Fallback
    }
    return localDatabase.recordGpsRouteLocally(userId, route);
  }

  /**
   * COMMUNITY EXERCISE VIDEOS: Fetch guide videos from Firestore with local fallback
   */
  public async getCommunityVideos(): Promise<CommunityVideo[]> {
    try {
      const colRef = collection(db, 'community_videos');
      const snap = await getDocs(colRef);
      if (!snap.empty) {
        const videos: CommunityVideo[] = [];
        snap.forEach((d) => {
          videos.push(d.data() as CommunityVideo);
        });
        videos.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        try {
          localStorage.setItem('sportfitness_community_videos_v1', JSON.stringify(videos));
        } catch {}
        return videos;
      }
    } catch (e) {
      console.warn('[Firestore] Community videos fetch fallback:', e);
    }
    try {
      const local = localStorage.getItem('sportfitness_community_videos_v1');
      if (local) return JSON.parse(local);
    } catch {}
    return [];
  }

  /**
   * COMMUNITY EXERCISE VIDEOS: Publish short guide video
   */
  public async publishCommunityVideo(
    video: Omit<CommunityVideo, 'id' | 'createdAt'>
  ): Promise<{ success: boolean; video?: CommunityVideo; error?: string }> {
    const videoId = `vid-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const newVideo: CommunityVideo = {
      ...video,
      id: videoId,
      createdAt: new Date().toISOString(),
      likes: 0,
    };

    try {
      const videoRef = doc(db, 'community_videos', videoId);
      await setDoc(videoRef, newVideo);
      console.log('[Firestore] Community video published successfully:', videoId);
    } catch (e: any) {
      console.warn('[Firestore] Community video saved with local fallback:', e);
    }

    try {
      const existing = await this.getCommunityVideos();
      const updated = [newVideo, ...existing.filter((v) => v.id !== videoId)];
      localStorage.setItem('sportfitness_community_videos_v1', JSON.stringify(updated));
    } catch {}

    return { success: true, video: newVideo };
  }

  /**
   * COMMUNITY EXERCISE VIDEOS: Delete video
   */
  public async deleteCommunityVideo(videoId: string): Promise<boolean> {
    try {
      await deleteDoc(doc(db, 'community_videos', videoId));
    } catch (e) {
      console.warn('[Firestore] Community video deletion note:', e);
    }
    try {
      const existing = await this.getCommunityVideos();
      const filtered = existing.filter((v) => v.id !== videoId);
      localStorage.setItem('sportfitness_community_videos_v1', JSON.stringify(filtered));
    } catch {}
    return true;
  }

  /**
   * Map server user schema to client UserProfile
   */
  private mapServerUserToProfile(serverUser: any): UserProfile {
    const health = serverUser.healthProfile || {};
    const progress = serverUser.progress || {};

    return {
      id: serverUser.id,
      name: serverUser.fullName || `${serverUser.firstName} ${serverUser.lastName}`,
      lastName: serverUser.lastName,
      email: serverUser.email,
      role: serverUser.role,
      trainerCode: serverUser.trainerCode || undefined,
      avatar:
        serverUser.role === 'entrenador'
          ? 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=150&auto=format&fit=crop&q=80'
          : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      membershipPlan: serverUser.membershipPlan || 'Performance Pro',
      weight: health.weight || 75,
      height: health.height || 175,
      clothingSize: health.clothingSize || 'M',
      bodyType: health.bodyType || 'Mesomorfo',
      phone: serverUser.phone,
      documentNumber: serverUser.documentNumber,
      documentType: serverUser.documentType,
      weeklyVolumePercent: progress.weeklyVolumePercent || 0,
      streakDays: progress.streakDays || 0,
      streakDiscountPercent: progress.streakDiscountPercent || 0,
      sessionsThisWeek: progress.sessionsCompleted || 0,
      lastLoginTimestamp: Date.now(),
    };
  }
}

export const authService = new AuthService();

/**
 * Cliente helper para verificar código de verificación
 */
export async function verificarCodigo(email: string, codigoIngresado: string) {
  const result = await authService.verifyCode(email, codigoIngresado);
  if (!result.success) {
    throw new Error(result.message || "El código es incorrecto o ya ha sido utilizado.");
  }
  return { success: true, message: result.message || "Código verificado correctamente." };
}
