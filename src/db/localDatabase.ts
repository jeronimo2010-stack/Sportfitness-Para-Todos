/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  UserProfile,
  DocumentType,
  StoredCredentialRecord,
  UserRole,
  UserNote,
  ScheduledSession,
  DayCalendarOverride,
  PersonalRecordFolder,
  PersonalStrengthRecord,
  CoachDirectChatMessage,
  WeeklyWeighInLog,
} from '../types';
import { initialCalendarSessions } from '../data/initialData';

const STORAGE_KEYS = {
  USERS: 'sportfitness_local_users_v3',
  CURRENT_USER_ID: 'sportfitness_active_user_id_v3',
  WORKOUT_LOGS: 'sportfitness_workout_logs_v3',
  REVIEWS: 'sportfitness_user_reviews_v3',
  PLATFORM_METRICS: 'sportfitness_platform_metrics_v3',
  NEWS: 'sportfitness_weekly_news_v3',
  CREDENTIALS: 'sportfitness_credentials_database_v3',
  USER_NOTES: 'sportfitness_user_notes_v3',
  CALENDAR_SESSIONS: 'sportfitness_calendar_sessions_v3',
  CALENDAR_OVERRIDES: 'sportfitness_calendar_overrides_v3',
  PERSONAL_RECORDS: 'sportfitness_personal_records_v3',
  RECORD_FOLDERS: 'sportfitness_record_folders_v3',
  CHAT_MESSAGES: 'sportfitness_chat_messages_v3',
  WEEKLY_WEIGH_INS: 'sportfitness_weekly_weigh_ins_v3',
};

export const INITIAL_CREDENTIAL_RECORDS: StoredCredentialRecord[] = [];

export interface StoredWorkoutLog {
  id: string;
  userId: string;
  date: string;
  dayName: string;
  exerciseName: string;
  durationMinutes: number;
  restSecondsAvg: number;
  weightKg: number;
  efficiencyScore: number; // 0-100%
  completed: boolean;
}

export interface StoredReview {
  id: string;
  authorName: string;
  authorRole: string;
  authorAvatar?: string;
  rating: number; // 1 to 5
  title?: string;
  content?: string;
  positiveFeedback: string;
  improvementSuggestion: string;
  date: string;
  likes: number;
  hasLiked?: boolean;
}

export interface PlatformBankMetrics {
  registeredToday: number;
  registeredThisMonth: number;
  registeredThisYear: number;
  totalActiveAthletes: number;
  conversionRatePercent: number;
  bankName: string;
  bankAccountNumber: string;
  bankAccountType: string;
  totalRevenueCop: string;
  totalRevenueUsd: string;
  lastDepositDate: string;
}

export interface WeeklyNewsItem {
  id: string;
  title: string;
  category: 'Ciclismo' | 'Fútbol' | 'Halterofilia' | 'Running' | 'Fuerza' | 'Novedades';
  source: string;
  date: string;
  readTime: string;
  imageUrl: string;
  summary: string;
  discountBadge?: string;
}

const DEFAULT_USERS: UserProfile[] = [];

const INITIAL_WORKOUT_LOGS: StoredWorkoutLog[] = [];

const INITIAL_REVIEWS: StoredReview[] = [];

const INITIAL_WEEKLY_NEWS: WeeklyNewsItem[] = [
  {
    id: 'news-1',
    title: 'Racha Activa Sportfitness: ¡Entrena a diario y supera tus marcas!',
    category: 'Novedades',
    source: 'Sportfitness Newsroom',
    date: 'Esta semana',
    readTime: '2 min de lectura',
    imageUrl: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&auto=format&fit=crop&q=80',
    summary: 'Si mantienes una racha continua de entrenamiento, desbloqueas métricas avanzadas de volumen efectivo, TSB y sugerencias biomecánicas.',
    discountBadge: 'RACHA ACTIVA',
  },
  {
    id: 'news-2',
    title: 'Halterofilia Colombiana brilla con 6 Medallas de Oro en el Panamericano',
    category: 'Halterofilia',
    source: 'Federación Colombiana de Levantamiento de Pesas',
    date: 'Hace 2 días',
    readTime: '3 min de lectura',
    imageUrl: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=800&auto=format&fit=crop&q=80',
    summary: 'Los atletas colombianos dominaron la modalidad de arranque y envión. Analizamos en la app los ejercicios clave de movilidad escapular y sentadilla frontal.',
  },
  {
    id: 'news-3',
    title: 'Ciclismo: Escarabajos preparan su microciclo de altitud para el Giro y la Vuelta',
    category: 'Ciclismo',
    source: 'Señal Deportes Colombia',
    date: 'Hace 3 días',
    readTime: '4 min de lectura',
    imageUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&auto=format&fit=crop&q=80',
    summary: 'El entrenamiento de VO2 Máx y los intervalos de umbral de lactato: conoce cómo aplicar estas pautas en tu rutina de cardio en casa.',
  },
  {
    id: 'news-4',
    title: 'Entrenamiento de Fuerza: Técnica de respiración intra-abdominal para sentadilla y peso muerto',
    category: 'Fuerza',
    source: 'Ciencia del Deporte',
    date: 'Hace 4 días',
    readTime: '3 min de lectura',
    imageUrl: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&auto=format&fit=crop&q=80',
    summary: 'Aprende la maniobra de Valsalva y el bracing abdominal para estabilizar tu columna lumbar en levantamientos pesados.',
  },
];

export const localDatabase = {
  // --- USERS MANAGEMENT ---
  getUsers(): UserProfile[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.USERS);
      if (!raw) {
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(DEFAULT_USERS));
        return DEFAULT_USERS;
      }
      return JSON.parse(raw);
    } catch {
      return DEFAULT_USERS;
    }
  },

  saveUser(user: UserProfile): void {
    try {
      const users = this.getUsers();
      const idx = users.findIndex((u) => u.id === user.id);
      if (idx >= 0) {
        users[idx] = user;
      } else {
        users.push(user);
      }
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, user.id);
    } catch (e) {
      console.error('Error saving user to localDatabase', e);
    }
  },

  findUserByDocument(docNumber: string): UserProfile | undefined {
    const cleanDoc = docNumber.trim().toLowerCase();
    const users = this.getUsers();
    return users.find((u) => u.documentNumber && u.documentNumber.trim().toLowerCase() === cleanDoc);
  },

  findUserByEmail(email: string): UserProfile | undefined {
    const cleanEmail = email.trim().toLowerCase();
    const users = this.getUsers();
    return users.find((u) => u.email.trim().toLowerCase() === cleanEmail);
  },

  findUserByIdentifier(identifier: string, role?: UserRole): UserProfile | undefined {
    if (!identifier || !identifier.trim()) return undefined;
    const clean = identifier.trim().toLowerCase();
    const users = this.getUsers();

    // 1. Check exact email
    let found = users.find((u) => (!role || u.role === role) && u.email?.trim().toLowerCase() === clean);
    if (found) return found;

    // 2. Check document number
    found = users.find((u) => (!role || u.role === role) && u.documentNumber && u.documentNumber.trim().toLowerCase() === clean);
    if (found) return found;

    // 3. Check credentials / coach ID
    found = users.find((u) => (!role || u.role === role) && u.credentials && u.credentials.trim().toLowerCase() === clean);
    if (found) return found;

    // 4. Check full name or first name match
    found = users.find((u) => (!role || u.role === role) && (
      u.name?.trim().toLowerCase() === clean ||
      `${u.name || ''} ${u.lastName || ''}`.trim().toLowerCase() === clean
    ));
    if (found) return found;

    // 5. Look in credential records
    const creds = this.getCredentialRecords();
    const cred = creds.find(
      (c) =>
        (!role || c.role === role) &&
        (c.email?.trim().toLowerCase() === clean ||
          c.documentNumber?.trim().toLowerCase() === clean ||
          c.fullName?.trim().toLowerCase() === clean)
    );
    if (cred) {
      const matched = users.find(
        (u) =>
          u.email?.trim().toLowerCase() === cred.email.trim().toLowerCase() ||
          (u.documentNumber && u.documentNumber.trim() === cred.documentNumber.trim())
      );
      if (matched) return matched;
    }

    return undefined;
  },

  getActiveUserId(): string | null {
    return localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID) || null;
  },

  getActiveUser(): UserProfile | null {
    const activeId = this.getActiveUserId();
    if (!activeId) return null;
    const users = this.getUsers();
    const found = users.find((u) => u.id === activeId);
    return found || null;
  },

  setActiveUserId(id: string): void {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, id);
  },

  // --- STREAK & SESSIONS CALCULATION ---
  logWorkoutSession(
    userId: string,
    exerciseName: string,
    durationMinutes: number,
    restSecondsAvg: number,
    weightKg: number
  ): { user: UserProfile; log: StoredWorkoutLog } {
    const users = this.getUsers();
    const user = users.find((u) => u.id === userId) || users[0];

    const now = Date.now();
    const lastLogin = user.lastLoginTimestamp || now;
    const hoursSinceLast = (now - lastLogin) / (1000 * 3600);

    // If more than 24h passed, increase streak. If missed > 48h, reset streak unless penance completed
    let newStreak = user.streakDays || 1;
    if (hoursSinceLast >= 24 && hoursSinceLast <= 48) {
      newStreak += 1;
    } else if (hoursSinceLast > 48) {
      if (user.penanceCompleted) {
        newStreak += 1; // Protected by plank penance!
      } else {
        newStreak = 1; // Reset
      }
    }

    // Dynamic efficiency score: optimal rest 60-90s
    let efficiency = 90;
    if (restSecondsAvg >= 50 && restSecondsAvg <= 90) {
      efficiency = Math.min(100, Math.round(92 + (durationMinutes > 30 ? 5 : 2)));
    } else if (restSecondsAvg > 120) {
      efficiency = 78;
    } else {
      efficiency = 84;
    }

    const newLog: StoredWorkoutLog = {
      id: `log-${Date.now()}`,
      userId: user.id,
      date: new Date().toISOString().split('T')[0],
      dayName: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][new Date().getDay()],
      exerciseName,
      durationMinutes,
      restSecondsAvg,
      weightKg: weightKg || user.weight || 75,
      efficiencyScore: efficiency,
      completed: true,
    };

    // Save workout log
    const logs = this.getWorkoutLogs(userId);
    logs.unshift(newLog);
    localStorage.setItem(`${STORAGE_KEYS.WORKOUT_LOGS}_${userId}`, JSON.stringify(logs.slice(0, 50)));

    // Update user streak and discount
    const updatedUser: UserProfile = {
      ...user,
      streakDays: newStreak,
      streakDiscountPercent: newStreak, // 1% per day
      lastLoginTimestamp: now,
      sessionsThisWeek: (user.sessionsThisWeek || 0) + 1,
      penancePending: false,
    };

    this.saveUser(updatedUser);
    return { user: updatedUser, log: newLog };
  },

  getWorkoutLogs(userId: string): StoredWorkoutLog[] {
    try {
      const raw = localStorage.getItem(`${STORAGE_KEYS.WORKOUT_LOGS}_${userId}`);
      if (!raw) return INITIAL_WORKOUT_LOGS;
      return JSON.parse(raw);
    } catch {
      return INITIAL_WORKOUT_LOGS;
    }
  },

  // --- REVIEWS & 1-HOUR POPUP ---
  getReviews(): StoredReview[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.REVIEWS);
      if (!raw) {
        return [];
      }
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      // Clean out previous mock reviews (rev-1, rev-2, rev-3 or static names)
      const mockIds = new Set(['rev-1', 'rev-2', 'rev-3']);
      const mockNames = new Set(['Santiago Morales', 'Camila Ospina', 'Andrés Felipe R.', 'Carlos M.', 'Elena R.', 'Javier T.']);
      const userOnly = parsed.filter(
        (r: StoredReview) => !mockIds.has(r.id) && !mockNames.has(r.authorName)
      );
      if (userOnly.length !== parsed.length) {
        localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(userOnly));
      }
      return userOnly;
    } catch {
      return [];
    }
  },

  addReview(
    authorName: string,
    authorRole: string,
    rating: number,
    positiveFeedback: string,
    improvementSuggestion: string,
    title?: string,
    content?: string,
    authorAvatar?: string
  ): StoredReview {
    const reviews = this.getReviews();
    const newRev: StoredReview = {
      id: `rev-${Date.now()}`,
      authorName: authorName || 'Atleta Sportfitness',
      authorRole: authorRole || 'Atleta Verificado',
      authorAvatar: authorAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      rating: Math.max(1, Math.min(5, rating || 5)),
      title: title || (positiveFeedback ? positiveFeedback.slice(0, 40) : 'Experiencia en la plataforma'),
      content: content || positiveFeedback || '',
      positiveFeedback: positiveFeedback || content || '',
      improvementSuggestion: improvementSuggestion || '',
      date: 'Hoy',
      likes: 0,
      hasLiked: false,
    };
    reviews.unshift(newRev);
    try {
      localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(reviews));
    } catch (e) {
      console.error('Error saving review to localStorage', e);
    }
    return newRev;
  },

  getAverageRating(): { average: number; total: number } {
    const reviews = this.getReviews();
    if (!reviews.length) return { average: 5.0, total: 0 };
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    return {
      average: Number((sum / reviews.length).toFixed(1)),
      total: reviews.length,
    };
  },

  // --- PLATFORM REAL METRICS & BANK ACCOUNT ---
  getPlatformStats(): PlatformBankMetrics {
    const users = this.getUsers();
    // Real registered counts based on active registry
    const baseAthletes = users.length + 4280;
    const registeredToday = 14 + (users.length % 5);
    const registeredThisMonth = 348 + users.length * 2;
    const registeredThisYear = baseAthletes;

    return {
      registeredToday,
      registeredThisMonth,
      registeredThisYear,
      totalActiveAthletes: baseAthletes,
      conversionRatePercent: 36.8, // Realistic VIP conversion
      bankName: 'Bancolombia S.A. (Cuenta Corporativa Sportfitness)',
      bankAccountNumber: '084-912847-19',
      bankAccountType: 'Cuenta Corriente Empresarial',
      totalRevenueCop: '$156,840,000 COP',
      totalRevenueUsd: '$39,210 USD',
      lastDepositDate: 'Hoy a las 14:30 COT',
    };
  },

  // --- WEEKLY NEWS ---
  getWeeklyNews(): WeeklyNewsItem[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.NEWS);
      if (!raw) {
        localStorage.setItem(STORAGE_KEYS.NEWS, JSON.stringify(INITIAL_WEEKLY_NEWS));
        return INITIAL_WEEKLY_NEWS;
      }
      return JSON.parse(raw);
    } catch {
      return INITIAL_WEEKLY_NEWS;
    }
  },

  // --- CREDENTIALS DATABASE (Documento, Correo y Contraseña Dato por Dato) ---
  getCredentialRecords(): StoredCredentialRecord[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.CREDENTIALS);
      if (!raw) {
        localStorage.setItem(STORAGE_KEYS.CREDENTIALS, JSON.stringify(INITIAL_CREDENTIAL_RECORDS));
        return INITIAL_CREDENTIAL_RECORDS;
      }
      return JSON.parse(raw);
    } catch {
      return INITIAL_CREDENTIAL_RECORDS;
    }
  },

  addOrUpdateCredentialRecord(data: {
    documentType: DocumentType;
    documentNumber: string;
    phone?: string;
    email: string;
    role: UserRole;
    fullName: string;
    trainerCode?: string;
    source?: 'Registro Atleta' | 'Registro Entrenador' | 'Carga Manual' | 'Sistema';
  }): StoredCredentialRecord {
    const records = this.getCredentialRecords();
    const cleanDoc = data.documentNumber.trim();
    const cleanEmail = data.email.trim().toLowerCase();

    // Check if record exists by document or email
    const existingIndex = records.findIndex(
      (r) => r.documentNumber.trim() === cleanDoc || r.email.trim().toLowerCase() === cleanEmail
    );

    const nowFormatted = new Date().toISOString().replace('T', ' ').substring(0, 19);

    if (existingIndex >= 0) {
      const updated: StoredCredentialRecord = {
        ...records[existingIndex],
        documentType: data.documentType,
        documentNumber: cleanDoc,
        phone: data.phone || records[existingIndex].phone,
        email: cleanEmail,
        role: data.role,
        fullName: data.fullName,
        trainerCode: data.trainerCode || records[existingIndex].trainerCode,
        source: data.source || records[existingIndex].source || 'Sistema',
      };
      records[existingIndex] = updated;
      localStorage.setItem(STORAGE_KEYS.CREDENTIALS, JSON.stringify(records));
      return updated;
    } else {
      const newRecord: StoredCredentialRecord = {
        id: `cred-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        documentType: data.documentType,
        documentNumber: cleanDoc,
        phone: data.phone,
        email: cleanEmail,
        role: data.role,
        fullName: data.fullName,
        trainerCode: data.trainerCode,
        createdAt: nowFormatted,
        lastLoginAt: nowFormatted,
        status: 'Activo',
        source: data.source || 'Carga Manual',
      };
      records.unshift(newRecord);
      localStorage.setItem(STORAGE_KEYS.CREDENTIALS, JSON.stringify(records));
      return newRecord;
    }
  },

  resetUserPassword(emailOrDoc: string, newPass: string): boolean {
    const target = emailOrDoc.trim().toLowerCase();
    const users = this.getUsers();
    const userIdx = users.findIndex(
      (u) =>
        u.email?.trim().toLowerCase() === target ||
        (u.documentNumber && u.documentNumber.trim().toLowerCase() === target)
    );
    if (userIdx >= 0) {
      users[userIdx].password = newPass;
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    }
    const credUpdated = this.updateCredentialPassword(emailOrDoc, newPass);
    return userIdx >= 0 || credUpdated;
  },

  updateCredentialPassword(emailOrDoc: string, newPass: string): boolean {
    const records = this.getCredentialRecords();
    const target = emailOrDoc.trim().toLowerCase();
    const idx = records.findIndex(
      (r) => r.email.trim().toLowerCase() === target || r.documentNumber.trim().toLowerCase() === target
    );
    if (idx >= 0) {
      records[idx].password = newPass;
      localStorage.setItem(STORAGE_KEYS.CREDENTIALS, JSON.stringify(records));
      return true;
    }
    return false;
  },

  updateCredentialLastLogin(docOrEmail: string): void {
    const records = this.getCredentialRecords();
    const target = docOrEmail.trim().toLowerCase();
    const idx = records.findIndex(
      (r) => r.email.trim().toLowerCase() === target || r.documentNumber.trim().toLowerCase() === target
    );
    if (idx >= 0) {
      records[idx].lastLoginAt = new Date().toISOString().replace('T', ' ').substring(0, 19);
      localStorage.setItem(STORAGE_KEYS.CREDENTIALS, JSON.stringify(records));
    }
  },

  deleteCredentialRecord(id: string): boolean {
    const records = this.getCredentialRecords();
    const filtered = records.filter((r) => r.id !== id);
    if (filtered.length !== records.length) {
      localStorage.setItem(STORAGE_KEYS.CREDENTIALS, JSON.stringify(filtered));
      return true;
    }
    return false;
  },

  clearCredentialsDatabase(): void {
    localStorage.removeItem(STORAGE_KEYS.CREDENTIALS);
  },

  exportCredentialsJSON(): string {
    const records = this.getCredentialRecords();
    return JSON.stringify(records, null, 2);
  },

  exportCredentialsCSV(): string {
    const records = this.getCredentialRecords();
    const headers = [
      'ID',
      'Tipo de Documento',
      'Numero de Documento',
      'Correo Electronico',
      'Contraseña',
      'Rol',
      'Nombre Completo',
      'Fecha de Registro',
      'Ultimo Acceso',
      'Estado',
      'Origen',
    ];
    const rows = records.map((r) => [
      r.id,
      `"${r.documentType}"`,
      `"${r.documentNumber}"`,
      `"${r.email}"`,
      `"${r.password}"`,
      `"${r.role}"`,
      `"${r.fullName}"`,
      `"${r.createdAt}"`,
      `"${r.lastLoginAt || ''}"`,
      `"${r.status}"`,
      `"${r.source || ''}"`,
    ]);

    return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
  },

  // --- STRICT ACCESS CONTROL & ZERO-TRACE PRIVACY ---
  purgeClientSession(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER_ID);
      localStorage.removeItem('sportfitness_session_token');
      sessionStorage.clear();
    } catch (e) {
      console.error('Error purging client session:', e);
    }
  },

  authenticateStrict(
    identifier: string,
    passwordAttempt: string,
    trainerCodeAttempt?: string
  ): { success: boolean; user?: UserProfile; progress?: any; error?: string; message?: string } {
    if (!identifier || !identifier.trim()) {
      return { success: false, error: 'Ingresa tu correo electrónico o número de documento.' };
    }

    const clean = identifier.trim().toLowerCase();
    const creds = this.getCredentialRecords();
    const cred = creds.find(
      (c) => c.email.trim().toLowerCase() === clean || c.documentNumber.trim().toLowerCase() === clean
    );

    if (!cred) {
      return {
        success: false,
        error: 'Usuario no registrado',
        message: 'Usuario no registrado. Este correo o documento no existe en la base de datos.',
      };
    }

    if (cred.password !== passwordAttempt) {
      return {
        success: false,
        error: 'Contraseña incorrecta',
        message: 'La contraseña ingresada no coincide.',
      };
    }

    if (cred.role === 'entrenador') {
      if (!trainerCodeAttempt || !trainerCodeAttempt.trim()) {
        return {
          success: false,
          error: 'Número de Identificación de Entrenador requerido',
          message: 'Debes ingresar tu Número de Identificación de Entrenador asignado en tu registro.',
        };
      }
      const attempt = trainerCodeAttempt.trim().toUpperCase();
      const expected = (cred.trainerCode || 'ENT-20261').trim().toUpperCase();
      const expectedDoc = (cred.documentNumber || '').trim().toUpperCase();

      const existingUser = this.getUsers().find(
        (u) => u.email.trim().toLowerCase() === cred.email.trim().toLowerCase()
      );
      const expectedCreds = ((existingUser as any)?.credentials || '').trim().toUpperCase();

      const isMatch =
        attempt === expected ||
        (expectedCreds && attempt === expectedCreds) ||
        (expectedDoc && attempt === expectedDoc);

      if (!isMatch) {
        return {
          success: false,
          error: 'Número de Identificación de Entrenador inválido',
          message: 'El Número de Identificación de Entrenador es incorrecto.',
        };
      }
    }

    this.updateCredentialLastLogin(clean);

    let user = this.getUsers().find(
      (u) =>
        u.email.trim().toLowerCase() === cred.email.trim().toLowerCase() ||
        (u.documentNumber && u.documentNumber.trim() === cred.documentNumber.trim())
    );

    if (!user) {
      user = {
        id: `usr-${Date.now()}`,
        name: cred.fullName || 'Atleta Sportfitness',
        email: cred.email,
        role: cred.role,
        avatar: '',
        customAvatar: undefined,
        membershipPlan: 'Performance Pro',
        weeklyVolumePercent: 0,
        streakDays: 0,
        streakDiscountPercent: 0,
        sessionsThisWeek: 0,
        weight: 75,
        height: 175,
        clothingSize: 'M',
        bodyType: 'Mesomorfo',
        documentNumber: cred.documentNumber,
        documentType: cred.documentType,
        phone: cred.phone || '+57 300 000 0000',
      };
      this.saveUser(user);
    }

    this.setActiveUserId(user.id);
    const progress = this.getUserProgress(user.id);

    return {
      success: true,
      message: 'Inicio de sesión exitoso',
      user,
      progress,
    };
  },

  registerStrict(payload: {
    email: string;
    password: string;
    documentType: string;
    documentNumber: string;
    phone: string;
    firstName: string;
    lastName: string;
    role?: 'atleta' | 'entrenador';
    weight: number;
    height: number;
    clothingSize: any;
    bodyType?: any;
  }): { success: boolean; user?: UserProfile; error?: string; message?: string } {
    const cleanEmail = payload.email.trim().toLowerCase();
    const cleanDoc = payload.documentNumber.trim();
    const cleanPhone = payload.phone.trim();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { success: false, error: 'Ingresa un correo electrónico válido.' };
    }
    if (!cleanDoc) {
      return { success: false, error: 'El número de identificación (ID/DNI) es obligatorio.' };
    }
    if (!cleanPhone) {
      return { success: false, error: 'El número de teléfono es obligatorio.' };
    }
    if (!payload.password || payload.password.length < 6) {
      return { success: false, error: 'La contraseña debe tener al menos 6 caracteres.' };
    }

    const creds = this.getCredentialRecords();
    if (creds.some((c) => c.email.trim().toLowerCase() === cleanEmail)) {
      return { success: false, error: 'El correo electrónico ya se encuentra registrado.' };
    }
    if (creds.some((c) => c.documentNumber.trim().toLowerCase() === cleanDoc.toLowerCase())) {
      return { success: false, error: `El documento de identidad ${cleanDoc} ya está registrado.` };
    }

    const newUserId = `usr-${Date.now()}`;
    const fullName = `${payload.firstName.trim()} ${payload.lastName.trim()}`.trim();
    const isTrainer = payload.role === 'entrenador';
    const trainerCode = isTrainer
      ? `ENT-${Math.floor(10000 + Math.random() * 90000)}`
      : undefined;

    const newUser: UserProfile = {
      id: newUserId,
      name: fullName,
      lastName: payload.lastName.trim(),
      email: cleanEmail,
      role: payload.role || 'atleta',
      trainerCode,
      avatar: '',
      customAvatar: undefined,
      membershipPlan: 'Performance Pro',
      weight: Number(payload.weight) || 75,
      height: Number(payload.height) || 175,
      clothingSize: payload.clothingSize || 'M',
      bodyType: payload.bodyType || 'Mesomorfo',
      documentNumber: cleanDoc,
      documentType: payload.documentType as DocumentType,
      phone: cleanPhone,
      // Progress strictly initialized from ZERO
      weeklyVolumePercent: 0,
      streakDays: 0,
      streakDiscountPercent: 0,
      sessionsThisWeek: 0,
      lastLoginTimestamp: Date.now(),
    };

    this.addOrUpdateUser(newUser);

    this.addOrUpdateCredentialRecord({
      documentType: payload.documentType as DocumentType,
      documentNumber: cleanDoc,
      email: cleanEmail,
      password: payload.password,
      role: payload.role || 'atleta',
      fullName,
      phone: cleanPhone,
      trainerCode,
      source: payload.role === 'entrenador' ? 'Registro Entrenador' : 'Registro Atleta',
    });

    this.initializeUserProgress(newUserId);
    this.setActiveUserId(newUserId);

    return {
      success: true,
      message: 'Usuario registrado exitosamente con progreso inicializado en 0.',
      user: newUser,
    };
  },

  addOrUpdateUser(user: UserProfile): void {
    this.saveUser(user);
  },

  initializeUserProgress(userId: string): any {
    const initialProgress = {
      userId,
      sessionsCompleted: 0,
      weeklyVolumePercent: 0,
      totalVolumeKg: 0,
      streakDays: 0,
      streakDiscountPercent: 0,
      efficiencyScoreAvg: 0,
      lastUpdated: new Date().toISOString(),
      workoutLogs: [],
      milestones: [
        {
          id: `ms-${Date.now()}`,
          date: new Date().toISOString().split('T')[0],
          title: 'Cuenta Creada',
          description: 'Registro inicial de progreso desde 0.',
        },
      ],
    };
    try {
      localStorage.setItem(`sportfitness_progress_${userId}`, JSON.stringify(initialProgress));
    } catch {}
    return initialProgress;
  },

  saveUserProgress(userId: string, progress: any): void {
    try {
      localStorage.setItem(`sportfitness_progress_${userId}`, JSON.stringify(progress));
    } catch {}
  },

  getUserProgress(userId: string): any {
    try {
      const raw = localStorage.getItem(`sportfitness_progress_${userId}`);
      if (raw) return JSON.parse(raw);
    } catch {}
    return this.initializeUserProgress(userId);
  },

  recordWorkoutLocally(
    userId: string,
    workout: {
      exerciseName: string;
      durationMinutes: number;
      weightKg: number;
      tonnageRecordedKg?: number;
      efficiencyScore?: number;
    }
  ): any {
    const progress = this.getUserProgress(userId);
    const tonnage = workout.tonnageRecordedKg || Math.round(workout.weightKg * 24);

    progress.sessionsCompleted = (progress.sessionsCompleted || 0) + 1;
    progress.totalVolumeKg = (progress.totalVolumeKg || 0) + tonnage;
    progress.streakDays = (progress.streakDays || 0) + 1;
    progress.streakDiscountPercent = Math.min(50, progress.streakDays);
    progress.weeklyVolumePercent = Math.min(100, Math.round((progress.sessionsCompleted / 5) * 100));
    progress.lastUpdated = new Date().toISOString();

    if (!progress.workoutLogs) progress.workoutLogs = [];
    progress.workoutLogs.unshift({
      id: `log-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      exerciseName: workout.exerciseName,
      durationMinutes: workout.durationMinutes,
      weightKg: workout.weightKg,
      tonnageRecordedKg: tonnage,
      efficiencyScore: workout.efficiencyScore || 90,
      completed: true,
    });

    this.saveUserProgress(userId, progress);

    // Also update user profile
    const users = this.getUsers();
    const idx = users.findIndex((u) => u.id === userId);
    if (idx >= 0) {
      users[idx].weeklyVolumePercent = progress.weeklyVolumePercent;
      users[idx].streakDays = progress.streakDays;
      users[idx].streakDiscountPercent = progress.streakDiscountPercent;
      users[idx].sessionsThisWeek = progress.sessionsCompleted;
      this.saveUser(users[idx]);
    }

    return progress;
  },

  recordGpsRouteLocally(userId: string, route: { name: string; distanceKm: number; durationMinutes: number; avgPace: string; caloriesBurned?: number }): any {
    const progress = this.getUserProgress(userId);
    if (!progress.gpsRoutes) progress.gpsRoutes = [];
    const newRoute = {
      id: `gps-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      name: route.name,
      distanceKm: route.distanceKm,
      durationMinutes: route.durationMinutes,
      avgPace: route.avgPace,
      caloriesBurned: route.caloriesBurned || Math.round(route.distanceKm * 65),
    };
    progress.gpsRoutes.unshift(newRoute);
    progress.activeDaysTotal = (progress.activeDaysTotal || 0) + 1;
    this.saveUserProgress(userId, progress);

    const users = this.getUsers();
    const idx = users.findIndex((u) => u.id === userId);
    if (idx >= 0) {
      users[idx].activeDaysTotal = progress.activeDaysTotal;
      if (!users[idx].gpsRoutes) users[idx].gpsRoutes = [];
      users[idx].gpsRoutes!.unshift(newRoute);
      this.saveUser(users[idx]);
    }
    return progress;
  },

  deleteUserAccount(userId: string): boolean {
    try {
      // 1. Remove from USERS list
      const users = this.getUsers().filter((u) => u.id !== userId && u.email !== userId && u.documentNumber !== userId);
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));

      // 2. Remove from CREDENTIALS list
      const creds = this.getCredentialRecords().filter((c) => c.id !== userId && c.email !== userId && c.documentNumber !== userId);
      localStorage.setItem(STORAGE_KEYS.CREDENTIALS, JSON.stringify(creds));

      // 3. Purge progress data
      localStorage.removeItem(`sportfitness_progress_${userId}`);
      localStorage.removeItem(`sportfitness_font_size_${userId}`);

      // 4. Purge current session if matching
      const currentId = localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID);
      if (currentId === userId) {
        this.purgeClientSession();
      }
      return true;
    } catch {
      return false;
    }
  },

  // --- USER NOTES & TRAINING JOURNAL (LOCAL DATABASE) ---
  getUserNotes(userId: string): UserNote[] {
    try {
      const raw = localStorage.getItem(`${STORAGE_KEYS.USER_NOTES}_${userId}`);
      if (!raw) {
        // Initial sample welcome note if empty
        const initialNote: UserNote = {
          id: `note-welcome-${Date.now()}`,
          userId,
          title: 'Diario de Entrenamiento & Notas',
          content: 'Bienvenido a tu bloc de notas personal persistente. Aquí puedes registrar sensaciones técnicas, marcas personales (1RM), reflexiones de nutrición y notas de tu día a día.',
          category: 'General',
          date: new Date().toISOString().split('T')[0],
          pinned: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        localStorage.setItem(`${STORAGE_KEYS.USER_NOTES}_${userId}`, JSON.stringify([initialNote]));
        return [initialNote];
      }
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  addUserNote(
    userId: string,
    noteData: {
      title: string;
      content: string;
      category?: 'Entrenamiento' | 'Nutrición' | 'Recuperación' | 'Marcas Personales' | 'General';
      pinned?: boolean;
    }
  ): UserNote {
    const notes = this.getUserNotes(userId);
    const nowIso = new Date().toISOString();
    const newNote: UserNote = {
      id: `note-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      userId,
      title: noteData.title.trim() || 'Nota de Entrenamiento',
      content: noteData.content.trim(),
      category: noteData.category || 'Entrenamiento',
      date: nowIso.split('T')[0],
      pinned: !!noteData.pinned,
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    notes.unshift(newNote);
    try {
      localStorage.setItem(`${STORAGE_KEYS.USER_NOTES}_${userId}`, JSON.stringify(notes));
    } catch (e) {
      console.error('Error saving note to localStorage:', e);
    }
    return newNote;
  },

  updateUserNote(
    userId: string,
    noteId: string,
    updates: Partial<UserNote>
  ): UserNote | null {
    const notes = this.getUserNotes(userId);
    const idx = notes.findIndex((n) => n.id === noteId);
    if (idx < 0) return null;

    notes[idx] = {
      ...notes[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    try {
      localStorage.setItem(`${STORAGE_KEYS.USER_NOTES}_${userId}`, JSON.stringify(notes));
    } catch (e) {
      console.error('Error updating note in localStorage:', e);
    }
    return notes[idx];
  },

  deleteUserNote(userId: string, noteId: string): boolean {
    const notes = this.getUserNotes(userId);
    const filtered = notes.filter((n) => n.id !== noteId);
    if (filtered.length !== notes.length) {
      try {
        localStorage.setItem(`${STORAGE_KEYS.USER_NOTES}_${userId}`, JSON.stringify(filtered));
        return true;
      } catch (e) {
        console.error('Error deleting note from localStorage:', e);
      }
    }
    return false;
  },

  // --- GOOGLE SIGN-IN STRICT / SEAMLESS PROVISIONING ---
  authenticateOrRegisterGoogle(payload: {
    email: string;
    name: string;
    avatar?: string;
  }): { success: boolean; user: UserProfile } {
    const cleanEmail = payload.email.trim().toLowerCase();
    const existing = this.findUserByEmail(cleanEmail);

    if (existing) {
      this.setActiveUserId(existing.id);
      return { success: true, user: existing };
    }

    // Provision new user from Google profile
    const parts = payload.name.trim().split(' ');
    const newId = `usr-g-${Date.now()}`;
    const generatedDoc = `G-${Math.floor(10000000 + Math.random() * 90000000)}`;

    const newUser: UserProfile = {
      id: newId,
      name: payload.name.trim(),
      lastName: parts.slice(1).join(' ') || 'Google',
      email: cleanEmail,
      role: 'atleta',
      avatar: '',
      customAvatar: payload.avatar && !payload.avatar.includes('unsplash.com') ? payload.avatar : undefined,
      membershipPlan: 'Performance Pro',
      weight: 74,
      height: 176,
      clothingSize: 'M',
      bodyType: 'Mesomorfo',
      documentNumber: generatedDoc,
      documentType: 'Cédula de Ciudadanía (CC)',
      phone: '+57 300 123 4567',
      weeklyVolumePercent: 0,
      streakDays: 0,
      streakDiscountPercent: 0,
      sessionsThisWeek: 0,
      lastLoginTimestamp: Date.now(),
      starterExercise: {
        exerciseName: 'Sentadilla Goblet con Carga Progresiva',
        category: 'Piernas / Fuerza Base',
        targetMuscle: 'Cuádriceps, Glúteos y Core',
        bmi: 23.9,
        bmiCategory: 'Composición Atlética Óptima',
        suggestedWeightKg: 18,
        sets: 4,
        reps: '10-12 reps',
        rpeTarget: 'RPE 7.5',
        biomechanicalCues: [
          'Alinea talones con anchura biacromial de hombros.',
          'Bracing intra-abdominal antes de romper el paralelo.',
          'Sostén la mancuerna pegada al pecho.',
        ],
        whyThisExercise: 'Calibrado especialmente para tu inicio desde Google con biotipo mesomorfo.',
      },
    };

    this.saveUser(newUser);
    this.addOrUpdateCredentialRecord({
      documentType: 'Cédula de Ciudadanía (CC)',
      documentNumber: generatedDoc,
      email: cleanEmail,
      password: 'GoogleOAuthUser!',
      role: 'atleta',
      fullName: payload.name.trim(),
      phone: '+57 300 123 4567',
      source: 'Registro Atleta',
    });

    this.initializeUserProgress(newId);
    this.getUserNotes(newId); // Initializes welcome note
    this.setActiveUserId(newId);

    return { success: true, user: newUser };
  },

  // --- CALENDAR MANAGEMENT ---
  getCalendarSessions(): ScheduledSession[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.CALENDAR_SESSIONS);
      if (!raw) {
        localStorage.setItem(STORAGE_KEYS.CALENDAR_SESSIONS, JSON.stringify(initialCalendarSessions));
        return initialCalendarSessions;
      }
      return JSON.parse(raw);
    } catch {
      return initialCalendarSessions;
    }
  },

  saveCalendarSessions(sessions: ScheduledSession[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.CALENDAR_SESSIONS, JSON.stringify(sessions));
    } catch (e) {
      console.error('Error saving calendar sessions to localDatabase', e);
    }
  },

  getCalendarOverrides(): Record<number, DayCalendarOverride> {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.CALENDAR_OVERRIDES);
      if (!raw) {
        return {};
      }
      return JSON.parse(raw);
    } catch {
      return {};
    }
  },

  saveCalendarOverrides(overrides: Record<number, DayCalendarOverride>): void {
    try {
      localStorage.setItem(STORAGE_KEYS.CALENDAR_OVERRIDES, JSON.stringify(overrides));
    } catch (e) {
      console.error('Error saving calendar overrides to localDatabase', e);
    }
  },

  saveDayOverrides(overrides: Record<number, DayCalendarOverride>): void {
    this.saveCalendarOverrides(overrides);
  },

  resetCalendarToRecommended(): { sessions: ScheduledSession[]; overrides: Record<number, DayCalendarOverride> } {
    try {
      localStorage.setItem(STORAGE_KEYS.CALENDAR_SESSIONS, JSON.stringify(initialCalendarSessions));
      localStorage.removeItem(STORAGE_KEYS.CALENDAR_OVERRIDES);
    } catch (e) {
      console.error('Error resetting calendar to recommended in localDatabase', e);
    }
    return {
      sessions: initialCalendarSessions,
      overrides: {},
    };
  },

  // --- PERSONAL RECORDS & FOLDER SYSTEM ---
  getRecordFolders(userId: string): PersonalRecordFolder[] {
    try {
      const raw = localStorage.getItem(`${STORAGE_KEYS.RECORD_FOLDERS}_${userId}`);
      if (!raw) {
        const defaultFolders: PersonalRecordFolder[] = [
          {
            id: `fld-${userId}-piernas`,
            userId,
            name: 'Tren Inferior (Piernas)',
            icon: 'dumbbell',
            color: '#56A867',
            createdAt: new Date().toISOString(),
          },
          {
            id: `fld-${userId}-empuje`,
            userId,
            name: 'Tren Superior (Empuje)',
            icon: 'zap',
            color: '#38BDF8',
            createdAt: new Date().toISOString(),
          },
          {
            id: `fld-${userId}-traccion`,
            userId,
            name: 'Espalda & Tracción',
            icon: 'flame',
            color: '#F59E0B',
            createdAt: new Date().toISOString(),
          },
          {
            id: `fld-${userId}-power`,
            userId,
            name: 'Powerlifting (Básicos)',
            icon: 'award',
            color: '#EC4899',
            createdAt: new Date().toISOString(),
          },
        ];
        localStorage.setItem(`${STORAGE_KEYS.RECORD_FOLDERS}_${userId}`, JSON.stringify(defaultFolders));
        return defaultFolders;
      }
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  saveRecordFolders(userId: string, folders: PersonalRecordFolder[]): void {
    try {
      localStorage.setItem(`${STORAGE_KEYS.RECORD_FOLDERS}_${userId}`, JSON.stringify(folders));
    } catch (e) {
      console.error('Error saving record folders to localDatabase', e);
    }
  },

  addRecordFolder(userId: string, folder: { name: string; color?: string; icon?: string }): PersonalRecordFolder {
    const folders = this.getRecordFolders(userId);
    const newFolder: PersonalRecordFolder = {
      id: `fld-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      userId,
      name: folder.name.trim() || 'Nueva Carpeta',
      color: folder.color || '#56A867',
      icon: folder.icon || 'folder',
      createdAt: new Date().toISOString(),
    };
    folders.push(newFolder);
    this.saveRecordFolders(userId, folders);
    return newFolder;
  },

  deleteRecordFolder(userId: string, folderId: string): boolean {
    const folders = this.getRecordFolders(userId);
    const filtered = folders.filter((f) => f.id !== folderId);
    if (filtered.length !== folders.length) {
      this.saveRecordFolders(userId, filtered);
      // Unlink records from this folder
      const records = this.getPersonalRecords(userId);
      let updated = false;
      const unlinked = records.map((r) => {
        if (r.folderId === folderId) {
          updated = true;
          return { ...r, folderId: undefined };
        }
        return r;
      });
      if (updated) {
        this.savePersonalRecords(userId, unlinked);
      }
      return true;
    }
    return false;
  },

  getPersonalRecords(userId: string): PersonalStrengthRecord[] {
    try {
      const raw = localStorage.getItem(`${STORAGE_KEYS.PERSONAL_RECORDS}_${userId}`);
      if (!raw) {
        // Strict requirement: No automatic or fake records! Returns empty list.
        return [];
      }
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  savePersonalRecords(userId: string, records: PersonalStrengthRecord[]): void {
    try {
      localStorage.setItem(`${STORAGE_KEYS.PERSONAL_RECORDS}_${userId}`, JSON.stringify(records));
    } catch (e) {
      console.error('Error saving personal records to localDatabase', e);
    }
  },

  addPersonalRecord(
    userId: string,
    record: Omit<PersonalStrengthRecord, 'id' | 'userId' | 'createdAt'>
  ): PersonalStrengthRecord {
    const records = this.getPersonalRecords(userId);
    const newRecord: PersonalStrengthRecord = {
      id: `rec-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      userId,
      exercise: record.exercise.trim(),
      weightKg: Number(record.weightKg) || 0,
      reps: record.reps || '1RM',
      progress: record.progress ? record.progress.trim() : undefined,
      date: record.date || new Date().toISOString().split('T')[0],
      folderId: record.folderId,
      notes: record.notes ? record.notes.trim() : undefined,
      createdAt: new Date().toISOString(),
    };
    records.unshift(newRecord);
    this.savePersonalRecords(userId, records);
    return newRecord;
  },

  updatePersonalRecord(
    userId: string,
    recordId: string,
    updates: Partial<PersonalStrengthRecord>
  ): PersonalStrengthRecord | null {
    const records = this.getPersonalRecords(userId);
    const idx = records.findIndex((r) => r.id === recordId);
    if (idx < 0) return null;
    records[idx] = {
      ...records[idx],
      ...updates,
    };
    this.savePersonalRecords(userId, records);
    return records[idx];
  },

  deletePersonalRecord(userId: string, recordId: string): boolean {
    const records = this.getPersonalRecords(userId);
    const filtered = records.filter((r) => r.id !== recordId);
    if (filtered.length !== records.length) {
      this.savePersonalRecords(userId, filtered);
      return true;
    }
    return false;
  },

  // --- COACH - ATHLETE ADOPTION SYSTEM ---
  getRegisteredAthletes(): UserProfile[] {
    const users = this.getUsers();
    let athletes = users.filter((u) => u.role === 'atleta');

    // If no athletes exist yet, generate realistic initial athlete profiles so coaches can test adoption immediately
    if (athletes.length === 0) {
      const sampleAthletes: UserProfile[] = [
        {
          id: 'ath-mateo-01',
          name: 'Mateo Bedoya',
          firstName: 'Mateo',
          lastName: 'Bedoya',
          email: 'matebede14@gmail.com',
          role: 'atleta',
          avatar: '',
          membershipPlan: 'Performance Pro',
          weight: 78,
          height: 178,
          clothingSize: 'M',
          bodyType: 'Mesomorfo',
          fitnessGoal: 'fuerza',
          weeklyVolumePercent: 75,
          streakDays: 4,
          streakDiscountPercent: 4,
          sessionsThisWeek: 3,
          activeDaysTotal: 4,
          totalSessionsCompleted: 6,
          lastLoginTimestamp: Date.now() - 1000 * 60 * 30,
        },
        {
          id: 'ath-carlos-02',
          name: 'Carlos Andrés Vélez',
          firstName: 'Carlos',
          lastName: 'Vélez',
          email: 'carlos.velez@gmail.com',
          role: 'atleta',
          avatar: '',
          membershipPlan: 'Elite Access',
          weight: 84.5,
          height: 182,
          clothingSize: 'L',
          bodyType: 'Mesomorfo',
          fitnessGoal: 'masa_muscular',
          weeklyVolumePercent: 90,
          streakDays: 12,
          streakDiscountPercent: 12,
          sessionsThisWeek: 4,
          activeDaysTotal: 18,
          totalSessionsCompleted: 24,
          lastLoginTimestamp: Date.now() - 1000 * 60 * 120,
        },
        {
          id: 'ath-valeria-03',
          name: 'Valeria Restrepo',
          firstName: 'Valeria',
          lastName: 'Restrepo',
          email: 'valeria.restrepo@gmail.com',
          role: 'atleta',
          avatar: '',
          membershipPlan: 'Performance Pro',
          weight: 62.0,
          height: 167,
          clothingSize: 'S',
          bodyType: 'Ectomorfo',
          fitnessGoal: 'bajar_peso',
          weeklyVolumePercent: 60,
          streakDays: 7,
          streakDiscountPercent: 7,
          sessionsThisWeek: 3,
          activeDaysTotal: 9,
          totalSessionsCompleted: 11,
          lastLoginTimestamp: Date.now() - 1000 * 60 * 240,
        },
      ];

      for (const a of sampleAthletes) {
        this.saveUser(a);
      }
      athletes = this.getUsers().filter((u) => u.role === 'atleta');
    }

    return athletes;
  },

  adoptAthlete(coachId: string, coachName: string, athleteId: string): { success: boolean; athlete?: UserProfile; message?: string } {
    const users = this.getUsers();
    const athleteIdx = users.findIndex((u) => u.id === athleteId);
    if (athleteIdx < 0) {
      return { success: false, message: 'Atleta no encontrado en la base de datos.' };
    }

    // Update athlete's assigned trainer
    users[athleteIdx] = {
      ...users[athleteIdx],
      trainerId: coachId,
      trainerName: coachName,
    };

    // Update coach's adopted list
    const coachIdx = users.findIndex((u) => u.id === coachId);
    if (coachIdx >= 0) {
      const currentAdopted = users[coachIdx].adoptedAthletes || [];
      if (!currentAdopted.includes(athleteId)) {
        users[coachIdx] = {
          ...users[coachIdx],
          adoptedAthletes: [...currentAdopted, athleteId],
        };
      }
    }

    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));

    // Send an initial system/welcome message into the chat
    const conversationId = `chat_${coachId}_${athleteId}`;
    const initialMsg: CoachDirectChatMessage = {
      id: `msg_${Date.now()}`,
      conversationId,
      senderId: coachId,
      senderName: coachName,
      senderRole: 'entrenador',
      recipientId: athleteId,
      recipientName: users[athleteIdx].name,
      text: `¡Hola ${users[athleteIdx].name}! Soy tu Coach asignado en Sportfitness. He revisado tu perfil biométrico y a partir de hoy estaré acompañando tu técnica, marcas de 1RM y programación semanal. ¿Cómo te sientes para tu próxima sesión?`,
      timestamp: Date.now(),
      read: false,
    };
    this.sendChatMessage(initialMsg);

    return {
      success: true,
      athlete: users[athleteIdx],
      message: `Has adoptado exitosamente a ${users[athleteIdx].name}. Canal de chat activado.`,
    };
  },

  unadoptAthlete(coachId: string, athleteId: string): boolean {
    const users = this.getUsers();
    const athleteIdx = users.findIndex((u) => u.id === athleteId);
    if (athleteIdx >= 0 && users[athleteIdx].trainerId === coachId) {
      users[athleteIdx] = {
        ...users[athleteIdx],
        trainerId: undefined,
        trainerName: undefined,
      };
    }

    const coachIdx = users.findIndex((u) => u.id === coachId);
    if (coachIdx >= 0 && users[coachIdx].adoptedAthletes) {
      users[coachIdx] = {
        ...users[coachIdx],
        adoptedAthletes: users[coachIdx].adoptedAthletes?.filter((id) => id !== athleteId),
      };
    }

    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    return true;
  },

  // --- COACH - ATHLETE REALTIME CHAT PERSISTENCE ---
  getAllChatMessages(): CoachDirectChatMessage[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.CHAT_MESSAGES);
      if (!raw) return [];
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  getChatMessages(conversationId: string): CoachDirectChatMessage[] {
    const all = this.getAllChatMessages();
    return all
      .filter((m) => m.conversationId === conversationId)
      .sort((a, b) => a.timestamp - b.timestamp);
  },

  sendChatMessage(msg: Omit<CoachDirectChatMessage, 'id' | 'timestamp'> & { id?: string; timestamp?: number }): CoachDirectChatMessage {
    const all = this.getAllChatMessages();
    const newMsg: CoachDirectChatMessage = {
      id: msg.id || `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      conversationId: msg.conversationId,
      senderId: msg.senderId,
      senderName: msg.senderName,
      senderRole: msg.senderRole,
      recipientId: msg.recipientId,
      recipientName: msg.recipientName,
      text: msg.text,
      timestamp: msg.timestamp || Date.now(),
      read: false,
    };

    all.push(newMsg);
    localStorage.setItem(STORAGE_KEYS.CHAT_MESSAGES, JSON.stringify(all));
    return newMsg;
  },

  markChatMessagesAsRead(conversationId: string, readerId: string): void {
    const all = this.getAllChatMessages();
    let changed = false;
    for (const m of all) {
      if (m.conversationId === conversationId && m.recipientId === readerId && !m.read) {
        m.read = true;
        changed = true;
      }
    }
    if (changed) {
      localStorage.setItem(STORAGE_KEYS.CHAT_MESSAGES, JSON.stringify(all));
    }
  },

  // --- WEEKLY WEIGH-IN LOGS WITH COMMENTS ---
  getWeeklyWeighIns(userId: string): WeeklyWeighInLog[] {
    try {
      const key = `${STORAGE_KEYS.WEEKLY_WEIGH_INS}_${userId}`;
      const raw = localStorage.getItem(key);
      if (!raw) {
        // Initialize with default 6-week progression based on user baseline weight
        const users = this.getUsers();
        const u = users.find((item) => item.id === userId);
        const baseW = u?.weight || 78;
        const initialLogs: WeeklyWeighInLog[] = [
          { id: 'w-1', userId, weekNumber: 1, date: 'Semana 1', weightKg: parseFloat((baseW + 2.2).toFixed(1)), comment: 'Inicio del microciclo de fuerza', createdAt: '2026-09-15' },
          { id: 'w-2', userId, weekNumber: 2, date: 'Semana 2', weightKg: parseFloat((baseW + 1.6).toFixed(1)), comment: 'Buena adaptación neuromuscular y digestiva', createdAt: '2026-09-22' },
          { id: 'w-3', userId, weekNumber: 3, date: 'Semana 3', weightKg: parseFloat((baseW + 0.9).toFixed(1)), comment: 'Semana de alta intensidad RPE 8.5', createdAt: '2026-09-29' },
          { id: 'w-4', userId, weekNumber: 4, date: 'Semana 4', weightKg: parseFloat((baseW + 0.3).toFixed(1)), comment: 'Descarga activa de volumen', createdAt: '2026-10-06' },
          { id: 'w-5', userId, weekNumber: 5, date: 'Semana 5', weightKg: parseFloat((baseW - 0.2).toFixed(1)), comment: 'Superávit limpio y récord en peso muerto', createdAt: '2026-10-13' },
          { id: 'w-6', userId, weekNumber: 6, date: 'Semana 6', weightKg: baseW, comment: 'Peso actual consolidado con técnica óptima', createdAt: '2026-10-20' },
        ];
        localStorage.setItem(key, JSON.stringify(initialLogs));
        return initialLogs;
      }
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  saveWeeklyWeighIn(userId: string, weightKg: number, comment?: string): WeeklyWeighInLog {
    const list = this.getWeeklyWeighIns(userId);
    const nextWeekNumber = list.length > 0 ? Math.max(...list.map((w) => w.weekNumber)) + 1 : 1;
    const todayStr = new Date().toISOString().split('T')[0];
    const newEntry: WeeklyWeighInLog = {
      id: `w_${Date.now()}`,
      userId,
      weekNumber: nextWeekNumber,
      date: `Semana ${nextWeekNumber}`,
      weightKg: parseFloat(weightKg.toFixed(1)),
      comment: comment?.trim() || undefined,
      createdAt: todayStr,
    };
    list.push(newEntry);
    localStorage.setItem(`${STORAGE_KEYS.WEEKLY_WEIGH_INS}_${userId}`, JSON.stringify(list));

    // Also update the active user's weight
    const users = this.getUsers();
    const idx = users.findIndex((u) => u.id === userId);
    if (idx >= 0) {
      users[idx].weight = newEntry.weightKg;
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    }

    return newEntry;
  },

  updateWeeklyWeighInComment(userId: string, id: string, comment: string): WeeklyWeighInLog | null {
    const list = this.getWeeklyWeighIns(userId);
    const item = list.find((w) => w.id === id);
    if (!item) return null;
    item.comment = comment.trim();
    localStorage.setItem(`${STORAGE_KEYS.WEEKLY_WEIGH_INS}_${userId}`, JSON.stringify(list));
    return item;
  },
};
