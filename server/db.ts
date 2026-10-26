import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { getAdminFirestore, type Query } from './firebaseAdmin.ts';

export interface UserHealthProfile {
  weight: number; // kg
  height: number; // cm
  clothingSize: 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL';
  bodyType: 'Ectomorfo' | 'Mesomorfo' | 'Endomorfo';
  bmi: number;
  bmiCategory: string;
}

export interface WorkoutHistoryEntry {
  id: string;
  date: string;
  exerciseName: string;
  durationMinutes: number;
  weightKg: number;
  efficiencyScore: number;
  completed: boolean;
  tonnageRecordedKg?: number;
}

export interface UserProgressData {
  userId: string;
  sessionsCompleted: number;
  weeklyVolumePercent: number;
  totalVolumeKg: number;
  streakDays: number;
  streakDiscountPercent: number;
  activeDaysTotal?: number;
  efficiencyScoreAvg: number;
  lastUpdated: string;
  workoutLogs: WorkoutHistoryEntry[];
  gpsRoutes?: Array<{
    id: string;
    date: string;
    name: string;
    distanceKm: number;
    durationMinutes: number;
    avgPace: string;
    caloriesBurned?: number;
  }>;
  milestones: {
    id: string;
    date: string;
    title: string;
    description: string;
  }[];
}

export interface UserNote {
  id: string;
  userId: string;
  title: string;
  content: string;
  category: 'Entrenamiento' | 'Nutrición' | 'Recuperación' | 'Marcas Personales' | 'General';
  date: string;
  pinned?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface DatabaseUser {
  id: string;
  email: string;
  passwordHash: string;
  salt: string;
  documentType: string;
  documentNumber: string;
  phone: string;
  fullName: string;
  firstName: string;
  lastName: string;
  role: 'atleta' | 'entrenador' | 'admin';
  membershipPlan: string;
  trainerCode?: string;
  createdAt: string;
  lastLoginAt: string;
  status?: 'Activo' | 'Inactivo';
  healthProfile: UserHealthProfile;
  progress: UserProgressData;
  notes?: UserNote[];
}

export interface SafeAdminUserRecord {
  id: string;
  email: string;
  documentType: string;
  documentNumber: string;
  phone: string;
  fullName: string;
  firstName: string;
  lastName: string;
  role: 'atleta' | 'entrenador' | 'admin';
  membershipPlan: string;
  trainerCode?: string;
  createdAt: string;
  lastLoginAt: string;
  status: 'Activo' | 'Inactivo';
  healthProfile: UserHealthProfile;
  progress: UserProgressData;
  notes?: UserNote[];
}

export interface PlatformAdminMetrics {
  totalRegisteredUsers: number;
  totalAthletes: number;
  totalTrainers: number;
  totalAdmins: number;
  activeSessionsCount: number;
  totalWorkoutsLogged: number;
  totalTonnageKg: number;
  databaseSizeBytes: number;
  lastSyncAt: string;
}

export interface TokenRecord {
  id: string;
  email: string;
  code: string;
  is_used: boolean;
  expires_at: string;
  created_at: string;
  purpose?: string;
}

interface DatabaseSchema {
  users: DatabaseUser[];
  activeSessions: { [token: string]: { userId: string; createdAt: string } };
  tokens?: TokenRecord[];
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'sportfitness_database.json');

export const isServerless = Boolean(
  process.env.VERCEL ||
  process.env.AWS_LAMBDA_FUNCTION_NAME ||
  process.env.LAMBDA_TASK_ROOT ||
  process.env.VERCEL_ENV ||
  process.env.VERCEL_URL
);

async function saveUserToFirestore(user: DatabaseUser): Promise<void> {
  const firestore = getAdminFirestore();
  if (!firestore) return;
  try {
    await firestore.collection('users').doc(user.id).set(user, { merge: true });
  } catch (err) {
    console.warn('[Firestore Admin] Notice saving user to Firestore:', err);
  }
}

// Helper for secure password hashing with salt
export function hashPassword(password: string, existingSalt?: string): { hash: string; salt: string } {
  const salt = existingSalt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha256').toString('hex');
  return { hash, salt };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  const calculated = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha256').toString('hex');
  return calculated === hash;
}

function calculateBmi(weightKg: number, heightCm: number): { bmi: number; category: string } {
  if (!heightCm || heightCm <= 0) return { bmi: 22.5, category: 'Saludable' };
  const heightM = heightCm / 100;
  const bmi = Number((weightKg / (heightM * heightM)).toFixed(1));
  let category = 'Normopeso';
  if (bmi < 18.5) category = 'Bajo peso';
  else if (bmi < 25) category = 'Composición Atlética Óptima';
  else if (bmi < 30) category = 'Sobrepeso Funcional';
  else category = 'Obesidad';
  return { bmi, category };
}

// Initial seed accounts with properly hashed credentials
function getInitialSeedUsers(): DatabaseUser[] {
  const mateoPass = hashPassword('password123');
  const carlosPass = hashPassword('password123');
  const adminPass = hashPassword('AdminPassword2026!');

  const mateoBmi = calculateBmi(82.5, 181);
  const carlosBmi = calculateBmi(84.0, 183);
  const adminBmi = calculateBmi(76.0, 178);

  return [
    {
      id: 'usr-admin-master',
      email: 'admin@sportfitness.com',
      passwordHash: adminPass.hash,
      salt: adminPass.salt,
      documentType: 'Cédula de Ciudadanía (CC)',
      documentNumber: '999000111',
      phone: '+57 300 000 0001',
      fullName: 'Administrador General Sportfitness',
      firstName: 'Admin',
      lastName: 'General',
      role: 'admin',
      membershipPlan: 'Obsidian Ultimate (Admin)',
      createdAt: '2026-01-01T00:00:00.000Z',
      lastLoginAt: '2026-09-15T08:00:00.000Z',
      status: 'Activo',
      healthProfile: {
        weight: 76.0,
        height: 178,
        clothingSize: 'M',
        bodyType: 'Mesomorfo',
        bmi: adminBmi.bmi,
        bmiCategory: adminBmi.category,
      },
      progress: {
        userId: 'usr-admin-master',
        sessionsCompleted: 15,
        weeklyVolumePercent: 100,
        totalVolumeKg: 42000,
        streakDays: 45,
        streakDiscountPercent: 50,
        activeDaysTotal: 90,
        efficiencyScoreAvg: 99,
        lastUpdated: '2026-09-15T08:00:00.000Z',
        workoutLogs: [],
        milestones: [
          {
            id: 'ms-admin-sys',
            date: '2026-01-01',
            title: 'Control Maestro Activo',
            description: 'Acceso de administrador central verificado.',
          },
        ],
        gpsRoutes: [],
      },
    },
    {
      id: 'usr-mateo',
      email: 'mateo.atleta@sportfitness.com',
      passwordHash: mateoPass.hash,
      salt: mateoPass.salt,
      documentType: 'Cédula de Ciudadanía (CC)',
      documentNumber: '1020304050',
      phone: '+57 312 456 7890',
      fullName: 'Mateo Gómez',
      firstName: 'Mateo',
      lastName: 'Gómez',
      role: 'atleta',
      membershipPlan: 'Performance Pro',
      createdAt: '2026-08-15T08:30:00.000Z',
      lastLoginAt: '2026-09-03T07:15:00.000Z',
      healthProfile: {
        weight: 82.5,
        height: 181,
        clothingSize: 'L',
        bodyType: 'Mesomorfo',
        bmi: mateoBmi.bmi,
        bmiCategory: mateoBmi.category,
      },
      progress: {
        userId: 'usr-mateo',
        sessionsCompleted: 0,
        weeklyVolumePercent: 0,
        totalVolumeKg: 0,
        streakDays: 0,
        streakDiscountPercent: 0,
        activeDaysTotal: 0,
        efficiencyScoreAvg: 0,
        lastUpdated: '2026-09-04T08:00:00.000Z',
        workoutLogs: [],
        milestones: [
          {
            id: 'ms-welcome',
            date: '2026-09-04',
            title: 'Cuenta Creada',
            description: 'Registro inicial de atleta. Completa tu primera sesión para iniciar tu racha.',
          },
        ],
        gpsRoutes: [],
      },
    },
    {
      id: 'usr-carlos-coach',
      email: 'carlos.coach@sportfitness.com',
      passwordHash: carlosPass.hash,
      salt: carlosPass.salt,
      documentType: 'Cédula de Ciudadanía (CC)',
      documentNumber: '79456123',
      phone: '+57 300 987 6543',
      fullName: 'Carlos Martínez',
      firstName: 'Carlos',
      lastName: 'Martínez',
      role: 'entrenador',
      membershipPlan: 'Obsidian Ultimate',
      trainerCode: 'ENT-20261',
      createdAt: '2026-07-20T10:00:00.000Z',
      lastLoginAt: '2026-09-03T06:00:00.000Z',
      healthProfile: {
        weight: 84.0,
        height: 183,
        clothingSize: 'XL',
        bodyType: 'Mesomorfo',
        bmi: carlosBmi.bmi,
        bmiCategory: carlosBmi.category,
      },
      progress: {
        userId: 'usr-carlos-coach',
        sessionsCompleted: 6,
        weeklyVolumePercent: 95,
        totalVolumeKg: 18400,
        streakDays: 24,
        streakDiscountPercent: 24,
        activeDaysTotal: 45,
        efficiencyScoreAvg: 96,
        lastUpdated: '2026-09-03T06:00:00.000Z',
        workoutLogs: [],
        gpsRoutes: [],
        milestones: [
          {
            id: 'ms-coach-1',
            date: '2026-07-20',
            title: 'Coach Certificado',
            description: 'Alta de entrenador jefe en Sportfitness Obsidian.',
          },
        ],
      },
    },
  ];
}

class ServerDatabase {
  private db: DatabaseSchema = { users: [], activeSessions: {} };
  private initialized = false;

  private ensureDataDir() {
    if (isServerless) return;
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
    } catch (err: any) {
      if (err?.code !== 'EROFS') {
        console.warn('Failed to create data directory:', err?.message || err);
      }
    }
  }

  public init() {
    if (this.initialized) return;
    this.ensureDataDir();

    try {
      if (!isServerless && fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.db = JSON.parse(raw);
        if (!this.db.users || this.db.users.length === 0) {
          this.db.users = getInitialSeedUsers();
          this.saveToFile();
        } else {
          // Verify admin user is present
          const hasAdmin = this.db.users.some(
            (u) => u.role === 'admin' || u.email.toLowerCase() === 'admin@sportfitness.com'
          );
          if (!hasAdmin) {
            const adminUser = getInitialSeedUsers()[0];
            this.db.users.unshift(adminUser);
            this.saveToFile();
          }
        }
        if (!this.db.activeSessions) {
          this.db.activeSessions = {};
          this.saveToFile();
        }
        if (!this.db.tokens) {
          this.db.tokens = [];
          this.saveToFile();
        }
      } else {
        this.db = {
          users: getInitialSeedUsers(),
          activeSessions: {},
          tokens: [],
        };
        this.saveToFile();
      }
    } catch (error) {
      this.db = {
        users: getInitialSeedUsers(),
        activeSessions: {},
        tokens: [],
      };
      this.saveToFile();
    }
    if (!this.db.tokens) {
      this.db.tokens = [];
    }
    this.initialized = true;
  }

  public saveToFile() {
    if (isServerless) return;
    try {
      this.ensureDataDir();
      fs.writeFileSync(DB_FILE, JSON.stringify(this.db, null, 2), 'utf-8');
    } catch {
      // In serverless / read-only filesystem environments, storage is handled in Firestore
    }
  }

  // --- QUERY METHODS ---

  public findUserByEmail(email: string): DatabaseUser | undefined {
    this.init();
    const clean = email.trim().toLowerCase();
    return this.db.users.find((u) => u.email.toLowerCase() === clean);
  }

  public findUserByDocument(documentNumber: string): DatabaseUser | undefined {
    this.init();
    const clean = documentNumber.trim().toLowerCase();
    return this.db.users.find((u) => u.documentNumber.toLowerCase() === clean);
  }

  public findUserByIdentifier(identifier: string): DatabaseUser | undefined {
    this.init();
    if (!identifier || !identifier.trim()) return undefined;
    const clean = identifier.trim().toLowerCase();

    return this.db.users.find((u) => {
      return (
        u.email.toLowerCase() === clean ||
        u.documentNumber.toLowerCase() === clean
      );
    });
  }

  public findUserById(id: string): DatabaseUser | undefined {
    this.init();
    return this.db.users.find((u) => u.id === id);
  }

  public generateUniqueTrainerCode(): string {
    this.init();
    let code = '';
    let exists = true;
    while (exists) {
      const num = Math.floor(10000 + Math.random() * 90000);
      code = `ENT-${num}`;
      exists = this.db.users.some((u) => u.trainerCode === code);
    }
    return code;
  }

  // --- REGISTRATION METHOD ---
  // Mandatory: Email (unique), Password (hashed), ID/DNI (unique), Phone (mandatory)
  // Plus health profile (Weight, Height, Clothing Size)
  // Plus Progress initialized from ZERO
  public registerUser(params: {
    id?: string;
    email: string;
    password: string;
    documentType: string;
    documentNumber: string;
    phone: string;
    fullName?: string;
    firstName: string;
    lastName: string;
    role?: 'atleta' | 'entrenador';
    trainerCode?: string;
    weight: number;
    height: number;
    clothingSize: 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL';
    bodyType?: 'Ectomorfo' | 'Mesomorfo' | 'Endomorfo';
  }): { success: boolean; user?: DatabaseUser; error?: string } {
    this.init();

    const cleanEmail = params.email.trim().toLowerCase();
    const cleanDoc = params.documentNumber.trim();
    const cleanPhone = params.phone.trim();

    // 1. Email format validation
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { success: false, error: 'Ingresa un correo electrónico válido.' };
    }

    // 2. Uniqueness check: Email
    const existingByEmail = this.findUserByEmail(cleanEmail);
    if (existingByEmail) {
      return {
        success: false,
        error: 'El correo electrónico ya se encuentra registrado. Por favor inicia sesión.',
      };
    }

    // 3. Uniqueness check: ID / DNI
    if (!cleanDoc) {
      return { success: false, error: 'El número de identificación (ID/DNI) es obligatorio.' };
    }
    const existingByDoc = this.findUserByDocument(cleanDoc);
    if (existingByDoc) {
      return {
        success: false,
        error: `El documento de identidad ${cleanDoc} ya se encuentra registrado.`,
      };
    }

    // 4. Mandatory phone check
    if (!cleanPhone) {
      return { success: false, error: 'El número de teléfono es obligatorio.' };
    }

    // 5. Password length
    if (!params.password || params.password.length < 6) {
      return { success: false, error: 'La contraseña debe contener al menos 6 caracteres.' };
    }

    // 6. Cryptographic Password Hashing (Salt + PBKDF2 SHA-256)
    const { hash, salt } = hashPassword(params.password);

    const nowIso = new Date().toISOString();
    const newId = params.id?.trim() || `usr-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const fullName = params.fullName || `${params.firstName.trim()} ${params.lastName.trim()}`.trim();
    const bmiCalc = calculateBmi(params.weight, params.height);

    // Initial Progress record initialized from ZERO
    const zeroProgress: UserProgressData = {
      userId: newId,
      sessionsCompleted: 0,
      weeklyVolumePercent: 0,
      totalVolumeKg: 0,
      streakDays: 0,
      streakDiscountPercent: 0,
      activeDaysTotal: 0,
      efficiencyScoreAvg: 0,
      lastUpdated: nowIso,
      workoutLogs: [],
      gpsRoutes: [],
      milestones: [
        {
          id: `ms-${Date.now()}`,
          date: nowIso.split('T')[0],
          title: 'Registro de Cuenta Creado',
          description: 'Inicialización de progreso desde cero con perfil antropométrico vinculado.',
        },
      ],
    };

    const assignedTrainerCode =
      params.role === 'entrenador'
        ? params.trainerCode?.trim().toUpperCase() || this.generateUniqueTrainerCode()
        : undefined;

    const newUser: DatabaseUser = {
      id: newId,
      email: cleanEmail,
      passwordHash: hash,
      salt,
      documentType: params.documentType || 'Cédula de Ciudadanía (CC)',
      documentNumber: cleanDoc,
      phone: cleanPhone,
      fullName,
      firstName: params.firstName.trim(),
      lastName: params.lastName.trim(),
      role: params.role || 'atleta',
      membershipPlan: 'Performance Pro',
      trainerCode: assignedTrainerCode,
      createdAt: nowIso,
      lastLoginAt: nowIso,
      healthProfile: {
        weight: params.weight,
        height: params.height,
        clothingSize: params.clothingSize,
        bodyType: params.bodyType || 'Mesomorfo',
        bmi: bmiCalc.bmi,
        bmiCategory: bmiCalc.category,
      },
      progress: zeroProgress,
    };

    this.db.users.push(newUser);
    this.saveToFile();

    return { success: true, user: newUser };
  }

  // --- LOGIN METHOD ---
  // Strict rules:
  // - If user does not exist in DB: return error "Usuario no registrado"
  // - If password mismatch: return error "Contraseña incorrecta"
  // - If role is entrenador: trainerCode must match
  // - If valid: update lastLogin and return user with loaded progress history
  public authenticateUser(
    identifier: string,
    passwordAttempt: string,
    trainerCodeAttempt?: string
  ): { success: boolean; user?: DatabaseUser; error?: string } {
    this.init();

    if (!identifier || !identifier.trim()) {
      return { success: false, error: 'Ingresa tu correo electrónico o número de documento.' };
    }

    const user = this.findUserByIdentifier(identifier);
    if (!user) {
      // STRICT REQUIREMENT: Explicit "Usuario no registrado"
      return {
        success: false,
        error: 'Usuario no registrado',
      };
    }

    if (!verifyPassword(passwordAttempt, user.passwordHash, user.salt)) {
      return {
        success: false,
        error: 'Contraseña incorrecta',
      };
    }

    // Role-specific check for trainer identification number
    if (user.role === 'entrenador') {
      if (!trainerCodeAttempt || !trainerCodeAttempt.trim()) {
        return {
          success: false,
          error: 'Número de Identificación de Entrenador requerido',
        };
      }
      const cleanAttempt = trainerCodeAttempt.trim().toUpperCase();
      const expectedCode = (user.trainerCode || '').trim().toUpperCase();
      const expectedCreds = ((user as any).credentials || '').trim().toUpperCase();
      const expectedDoc = (user.documentNumber || '').trim().toUpperCase();

      const isMatch =
        (expectedCode && cleanAttempt === expectedCode) ||
        (expectedCreds && cleanAttempt === expectedCreds) ||
        (expectedDoc && cleanAttempt === expectedDoc);

      if (!isMatch) {
        return {
          success: false,
          error: 'Número de Identificación de Entrenador inválido',
        };
      }
    }

    // Update lastLoginAt
    user.lastLoginAt = new Date().toISOString();
    this.saveToFile();

    return { success: true, user };
  }

  // --- GOOGLE SIGN-IN ---
  public authenticateOrRegisterGoogleUser(payload: {
    id?: string;
    email: string;
    name: string;
    role?: 'atleta' | 'entrenador';
    trainerCode?: string;
    avatar?: string;
  }): { success: boolean; user: DatabaseUser; token: string } {
    this.init();
    const cleanEmail = payload.email.trim().toLowerCase();
    let user = this.findUserByEmail(cleanEmail);
    const nowIso = new Date().toISOString();

    if (!user) {
      const parts = payload.name.trim().split(' ');
      const firstName = parts[0] || 'Atleta';
      const lastName = parts.slice(1).join(' ') || 'Google';
      const fakePass = hashPassword(`google-auth-${Date.now()}`);
      const newId = payload.id?.trim() || `usr-g-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const assignedRole = payload.role === 'entrenador' ? 'entrenador' : 'atleta';
      const assignedTrainerCode = assignedRole === 'entrenador'
        ? (payload.trainerCode || `ENT-${Math.floor(10000 + Math.random() * 90000)}`)
        : undefined;
      const bmiCalc = calculateBmi(74.0, 176);

      const zeroProgress: UserProgressData = {
        userId: newId,
        sessionsCompleted: 0,
        weeklyVolumePercent: 0,
        totalVolumeKg: 0,
        streakDays: 0,
        streakDiscountPercent: 0,
        activeDaysTotal: 0,
        efficiencyScoreAvg: 0,
        lastUpdated: nowIso,
        workoutLogs: [],
        gpsRoutes: [],
        milestones: [
          {
            id: `ms-${Date.now()}`,
            date: nowIso.split('T')[0],
            title: 'Cuenta Creada con Google',
            description: 'Acceso inmediato verificado con cuenta Google.',
          },
        ],
      };

      user = {
        id: newId,
        email: cleanEmail,
        passwordHash: fakePass.hash,
        salt: fakePass.salt,
        documentType: 'Cédula de Ciudadanía (CC)',
        documentNumber: `G-${Math.floor(10000000 + Math.random() * 90000000)}`,
        phone: '+57 300 123 4567',
        fullName: payload.name || (assignedRole === 'entrenador' ? 'Coach Google' : 'Atleta Google'),
        firstName,
        lastName,
        role: assignedRole,
        trainerCode: assignedTrainerCode,
        membershipPlan: 'Performance Pro',
        createdAt: nowIso,
        lastLoginAt: nowIso,
        healthProfile: {
          weight: 74.0,
          height: 176,
          clothingSize: 'M',
          bodyType: 'Mesomorfo',
          bmi: bmiCalc.bmi,
          bmiCategory: bmiCalc.category,
        },
        progress: zeroProgress,
        notes: [
          {
            id: `note-welcome-${Date.now()}`,
            userId: newId,
            title: 'Bienvenida a tu Diario de Notas',
            content: 'Aquí puedes registrar tus sensaciones tras cada entrenamiento, tus marcas personales (1RM), reflexiones de nutrición y notas clave.',
            category: 'General',
            date: nowIso.split('T')[0],
            pinned: true,
            createdAt: nowIso,
            updatedAt: nowIso,
          }
        ],
      };
      this.db.users.push(user);
    } else {
      user.lastLoginAt = nowIso;
      if (payload.role && !user.role) {
        user.role = payload.role;
      }
      if (payload.trainerCode && !user.trainerCode) {
        user.trainerCode = payload.trainerCode;
      }
      if (!user.notes) {
        user.notes = [];
      }
    }

    this.saveToFile();
    const token = this.createSession(user.id);
    return { success: true, user, token };
  }

  // --- USER NOTES DATABASE METHODS ---

  public getUserNotes(userId: string): UserNote[] {
    this.init();
    const user = this.findUserById(userId);
    if (!user) return [];
    if (!user.notes) {
      user.notes = [];
    }
    return user.notes;
  }

  public addUserNote(
    userId: string,
    noteData: {
      title: string;
      content: string;
      category?: 'Entrenamiento' | 'Nutrición' | 'Recuperación' | 'Marcas Personales' | 'General';
      pinned?: boolean;
    }
  ): UserNote | null {
    this.init();
    const user = this.findUserById(userId);
    if (!user) return null;
    if (!user.notes) {
      user.notes = [];
    }

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

    user.notes.unshift(newNote);
    this.saveToFile();
    return newNote;
  }

  public updateUserNote(
    userId: string,
    noteId: string,
    updates: Partial<UserNote>
  ): UserNote | null {
    this.init();
    const user = this.findUserById(userId);
    if (!user || !user.notes) return null;

    const idx = user.notes.findIndex((n) => n.id === noteId);
    if (idx < 0) return null;

    user.notes[idx] = {
      ...user.notes[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    this.saveToFile();
    return user.notes[idx];
  }

  public deleteUserNote(userId: string, noteId: string): boolean {
    this.init();
    const user = this.findUserById(userId);
    if (!user || !user.notes) return false;

    const initialLen = user.notes.length;
    user.notes = user.notes.filter((n) => n.id !== noteId);
    if (user.notes.length !== initialLen) {
      this.saveToFile();
      return true;
    }
    return false;
  }

  // --- PROGRESS TRACKING & PERSISTENCE ---

  public getUserProgress(userId: string): UserProgressData | undefined {
    this.init();
    const user = this.findUserById(userId);
    return user ? user.progress : undefined;
  }

  public recordWorkoutProgress(
    userId: string,
    workout: {
      exerciseName: string;
      durationMinutes: number;
      weightKg: number;
      tonnageRecordedKg?: number;
      efficiencyScore?: number;
    }
  ): { success: boolean; progress?: UserProgressData; error?: string } {
    this.init();
    const user = this.findUserById(userId);
    if (!user) {
      return { success: false, error: 'Usuario no encontrado' };
    }

    const nowIso = new Date().toISOString();
    const efficiency = workout.efficiencyScore || 92;
    const tonnage = workout.tonnageRecordedKg || Math.round(workout.weightKg * 24);

    const newLog: WorkoutHistoryEntry = {
      id: `log-${Date.now()}`,
      date: nowIso.split('T')[0],
      exerciseName: workout.exerciseName,
      durationMinutes: workout.durationMinutes,
      weightKg: workout.weightKg,
      efficiencyScore: efficiency,
      completed: true,
      tonnageRecordedKg: tonnage,
    };

    // Update cumulative stats
    user.progress.sessionsCompleted += 1;
    user.progress.totalVolumeKg += tonnage;
    user.progress.streakDays = (user.progress.streakDays || 0) + 1;
    user.progress.streakDiscountPercent = Math.min(50, user.progress.streakDays);
    user.progress.weeklyVolumePercent = Math.min(100, Math.round((user.progress.sessionsCompleted / 5) * 100));
    user.progress.lastUpdated = nowIso;
    user.progress.workoutLogs.unshift(newLog);

    // Keep up to 100 logs
    if (user.progress.workoutLogs.length > 100) {
      user.progress.workoutLogs = user.progress.workoutLogs.slice(0, 100);
    }

    // Add milestone if applicable
    if (user.progress.sessionsCompleted === 1) {
      user.progress.milestones.unshift({
        id: `ms-${Date.now()}`,
        date: nowIso.split('T')[0],
        title: 'Primera Sesión Registrada',
        description: `Completó ${workout.exerciseName} con ${tonnage} kg de tonelaje.`,
      });
    }

    this.saveToFile();
    return { success: true, progress: user.progress };
  }

  // --- HEALTH PROFILE UPDATE ---
  public updateHealthProfile(
    userId: string,
    update: {
      weight: number;
      height: number;
      clothingSize: 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL';
      bodyType?: 'Ectomorfo' | 'Mesomorfo' | 'Endomorfo';
    }
  ): { success: boolean; healthProfile?: UserHealthProfile; error?: string } {
    this.init();
    const user = this.findUserById(userId);
    if (!user) return { success: false, error: 'Usuario no encontrado' };

    const bmiCalc = calculateBmi(update.weight, update.height);
    user.healthProfile = {
      weight: update.weight,
      height: update.height,
      clothingSize: update.clothingSize,
      bodyType: update.bodyType || user.healthProfile.bodyType || 'Mesomorfo',
      bmi: bmiCalc.bmi,
      bmiCategory: bmiCalc.category,
    };

    this.saveToFile();
    return { success: true, healthProfile: user.healthProfile };
  }

  // --- RECORD GPS ROUTE ---
  public recordGpsRoute(
    userId: string,
    route: {
      name: string;
      distanceKm: number;
      durationMinutes: number;
      avgPace: string;
      caloriesBurned?: number;
    }
  ): { success: boolean; progress?: UserProgressData; error?: string } {
    this.init();
    const user = this.findUserById(userId);
    if (!user) return { success: false, error: 'Usuario no encontrado' };

    if (!user.progress.gpsRoutes) {
      user.progress.gpsRoutes = [];
    }

    const newRoute = {
      id: `gps-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      name: route.name || 'Ruta GPS Outdoor',
      distanceKm: route.distanceKm,
      durationMinutes: route.durationMinutes,
      avgPace: route.avgPace,
      caloriesBurned: route.caloriesBurned || Math.round(route.distanceKm * 65),
    };

    user.progress.gpsRoutes.unshift(newRoute);
    user.progress.activeDaysTotal = (user.progress.activeDaysTotal || 0) + 1;
    this.saveToFile();

    return { success: true, progress: user.progress };
  }

  // --- PERMANENT CASCADING ACCOUNT DELETION ---
  public deleteUser(userId: string): { success: boolean; message?: string; error?: string } {
    this.init();
    const index = this.db.users.findIndex(
      (u) => u.id === userId || u.email.toLowerCase() === userId.toLowerCase() || u.documentNumber === userId
    );

    if (index === -1) {
      return { success: false, error: 'Usuario no encontrado en la base de datos para eliminar.' };
    }

    const removedUser = this.db.users.splice(index, 1)[0];

    // Cascade: Purge all active server sessions for this user ID
    if (this.db.activeSessions) {
      for (const token of Object.keys(this.db.activeSessions)) {
        if (this.db.activeSessions[token].userId === removedUser.id) {
          delete this.db.activeSessions[token];
        }
      }
    }

    this.saveToFile();

    return {
      success: true,
      message: `Cuenta de ${removedUser.fullName} (${removedUser.email}, ID: ${removedUser.id}) y todo su historial de progreso, métricas, rutas GPS y credenciales eliminados definitivamente en cascada.`,
    };
  }

  // ==========================================
  // SERVER SESSION MANAGEMENT (TOKEN AUTHORIZATION)
  // ==========================================

  public createSession(userId: string): string {
    this.init();
    if (!this.db.activeSessions) {
      this.db.activeSessions = {};
    }
    const token = crypto.randomBytes(32).toString('hex');
    this.db.activeSessions[token] = {
      userId,
      createdAt: new Date().toISOString(),
    };
    this.saveToFile();
    return token;
  }

  public getSession(token: string): { user: DatabaseUser; session: { userId: string; createdAt: string } } | null {
    this.init();
    if (!token || !this.db.activeSessions || !this.db.activeSessions[token]) {
      return null;
    }
    const session = this.db.activeSessions[token];
    const user = this.findUserById(session.userId);
    if (!user) {
      delete this.db.activeSessions[token];
      this.saveToFile();
      return null;
    }
    return { user, session };
  }

  public revokeSession(token: string): boolean {
    this.init();
    if (this.db.activeSessions && this.db.activeSessions[token]) {
      delete this.db.activeSessions[token];
      this.saveToFile();
      return true;
    }
    return false;
  }

  // ==========================================
  // SECURE ADMINISTRATIVE OPERATIONS
  // (Always guarded by server-side requireAdmin)
  // ==========================================

  public getAllUsersForAdmin(): SafeAdminUserRecord[] {
    this.init();
    return this.db.users.map((u) => {
      const { passwordHash, salt, ...safe } = u;
      return {
        ...safe,
        status: safe.status || 'Activo',
      };
    });
  }

  public adminCreateUser(params: {
    email: string;
    password: string;
    documentType?: string;
    documentNumber: string;
    phone?: string;
    fullName?: string;
    firstName?: string;
    lastName?: string;
    role: 'admin' | 'atleta' | 'entrenador';
    membershipPlan?: string;
    weight?: number;
    height?: number;
    clothingSize?: 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL';
    bodyType?: 'Ectomorfo' | 'Mesomorfo' | 'Endomorfo';
  }): { success: boolean; user?: SafeAdminUserRecord; error?: string } {
    this.init();
    const cleanEmail = (params.email || '').trim().toLowerCase();
    const cleanDoc = (params.documentNumber || '').trim();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { success: false, error: 'Correo electrónico inválido.' };
    }
    if (!cleanDoc) {
      return { success: false, error: 'Número de documento obligatorio.' };
    }
    if (!params.password || params.password.length < 6) {
      return { success: false, error: 'La contraseña debe tener al menos 6 caracteres.' };
    }
    if (this.findUserByEmail(cleanEmail)) {
      return { success: false, error: 'El correo electrónico ya existe en la base de datos.' };
    }
    if (this.findUserByDocument(cleanDoc)) {
      return { success: false, error: 'El documento ya está registrado.' };
    }

    const { hash, salt } = hashPassword(params.password);
    const nowIso = new Date().toISOString();
    const newId = `usr-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const weightNum = Number(params.weight) || 75;
    const heightNum = Number(params.height) || 175;
    const bmiCalc = calculateBmi(weightNum, heightNum);
    const fName = params.firstName || 'Usuario';
    const lName = params.lastName || 'Sportfitness';
    const fullName = params.fullName || `${fName} ${lName}`.trim();

    const newUser: DatabaseUser = {
      id: newId,
      email: cleanEmail,
      passwordHash: hash,
      salt,
      documentType: params.documentType || 'Cédula de Ciudadanía (CC)',
      documentNumber: cleanDoc,
      phone: params.phone || '+57 300 000 0000',
      fullName,
      firstName: fName,
      lastName: lName,
      role: params.role || 'atleta',
      membershipPlan:
        params.membershipPlan ||
        (params.role === 'admin'
          ? 'Obsidian Ultimate (Admin)'
          : params.role === 'entrenador'
          ? 'Obsidian Ultimate'
          : 'Performance Pro'),
      createdAt: nowIso,
      lastLoginAt: nowIso,
      status: 'Activo',
      healthProfile: {
        weight: weightNum,
        height: heightNum,
        clothingSize: params.clothingSize || 'M',
        bodyType: params.bodyType || 'Mesomorfo',
        bmi: bmiCalc.bmi,
        bmiCategory: bmiCalc.category,
      },
      progress: {
        userId: newId,
        sessionsCompleted: 0,
        weeklyVolumePercent: 0,
        totalVolumeKg: 0,
        streakDays: 0,
        streakDiscountPercent: 0,
        activeDaysTotal: 0,
        efficiencyScoreAvg: 0,
        lastUpdated: nowIso,
        workoutLogs: [],
        milestones: [
          {
            id: `ms-${Date.now()}`,
            date: nowIso.split('T')[0],
            title: 'Usuario Creado por Administrador',
            description: 'Alta autorizada en base de datos central.',
          },
        ],
        gpsRoutes: [],
      },
    };

    this.db.users.push(newUser);
    this.saveToFile();
    const { passwordHash, salt: s, ...safeUser } = newUser;
    return { success: true, user: { ...safeUser, status: 'Activo' } };
  }

  public adminUpdateUser(
    userId: string,
    updates: {
      role?: 'admin' | 'atleta' | 'entrenador';
      fullName?: string;
      firstName?: string;
      lastName?: string;
      phone?: string;
      membershipPlan?: string;
      documentNumber?: string;
      documentType?: string;
      email?: string;
      status?: 'Activo' | 'Inactivo';
    }
  ): { success: boolean; user?: SafeAdminUserRecord; error?: string } {
    this.init();
    const user = this.findUserById(userId);
    if (!user) {
      return { success: false, error: 'Usuario no encontrado para actualizar.' };
    }

    if (updates.email && updates.email !== user.email) {
      const existing = this.findUserByEmail(updates.email);
      if (existing && existing.id !== userId) {
        return { success: false, error: 'El nuevo correo ya está registrado por otro usuario.' };
      }
      user.email = updates.email.trim().toLowerCase();
    }

    if (updates.documentNumber && updates.documentNumber !== user.documentNumber) {
      const existing = this.findUserByDocument(updates.documentNumber);
      if (existing && existing.id !== userId) {
        return { success: false, error: 'El nuevo documento ya está registrado por otro usuario.' };
      }
      user.documentNumber = updates.documentNumber.trim();
    }

    if (updates.role) user.role = updates.role;
    if (updates.fullName) user.fullName = updates.fullName.trim();
    if (updates.firstName) user.firstName = updates.firstName.trim();
    if (updates.lastName) user.lastName = updates.lastName.trim();
    if (updates.phone) user.phone = updates.phone.trim();
    if (updates.membershipPlan) user.membershipPlan = updates.membershipPlan;
    if (updates.documentType) user.documentType = updates.documentType;
    if (updates.status) user.status = updates.status;

    this.saveToFile();
    const { passwordHash, salt, ...safeUser } = user;
    return { success: true, user: { ...safeUser, status: safeUser.status || 'Activo' } };
  }

  public adminResetPassword(userId: string, newPass: string): { success: boolean; message?: string; error?: string } {
    this.init();
    const user = this.findUserById(userId);
    if (!user) {
      return { success: false, error: 'Usuario no encontrado para restablecer contraseña.' };
    }
    const { hash, salt } = hashPassword(newPass);
    user.passwordHash = hash;
    user.salt = salt;
    this.saveToFile();
    return { success: true, message: `Contraseña actualizada exitosamente para ${user.email}.` };
  }

  public getAdminMetrics(): PlatformAdminMetrics {
    this.init();
    const totalRegisteredUsers = this.db.users.length;
    const totalAthletes = this.db.users.filter((u) => u.role === 'atleta').length;
    const totalTrainers = this.db.users.filter((u) => u.role === 'entrenador').length;
    const totalAdmins = this.db.users.filter((u) => u.role === 'admin').length;
    const activeSessionsCount = this.db.activeSessions ? Object.keys(this.db.activeSessions).length : 0;

    let totalWorkoutsLogged = 0;
    let totalTonnageKg = 0;
    for (const u of this.db.users) {
      if (u.progress) {
        totalWorkoutsLogged += u.progress.sessionsCompleted || 0;
        totalTonnageKg += u.progress.totalVolumeKg || 0;
      }
    }

    let databaseSizeBytes = 0;
    try {
      if (fs.existsSync(DB_FILE)) {
        databaseSizeBytes = fs.statSync(DB_FILE).size;
      }
    } catch {}

    return {
      totalRegisteredUsers,
      totalAthletes,
      totalTrainers,
      totalAdmins,
      activeSessionsCount,
      totalWorkoutsLogged,
      totalTonnageKg,
      databaseSizeBytes,
      lastSyncAt: new Date().toISOString(),
    };
  }

  // ==========================================
  // TOKENS MODEL (Firestore & Memory)
  // ==========================================
  public tokens = {
    findOne: async (options: {
      where: {
        email?: string;
        code?: string;
        is_used?: boolean;
        id?: string;
      };
    }): Promise<TokenRecord | null> => {
      const { email, code, is_used, id } = options.where;
      const firestore = getAdminFirestore();

      if (firestore) {
        try {
          let q: Query = firestore.collection('tokens');
          if (email !== undefined) {
            q = q.where('email', '==', email.trim().toLowerCase());
          }
          if (is_used !== undefined) {
            q = q.where('is_used', '==', is_used);
          }
          const snap = await q.get();
          if (!snap.empty) {
            const docs = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as TokenRecord[];
            // Sort by creation time descending (newest first)
            docs.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
            const match = docs.find((t) => {
              if (id !== undefined && t.id !== id) return false;
              if (code !== undefined && String(t.code).trim() !== String(code).trim()) return false;
              return true;
            });
            if (match) return match;
          }
        } catch (fsErr) {
          console.warn('[Firestore Admin] Notice searching tokens in Firestore:', fsErr);
        }
      }

      this.init();
      if (!this.db.tokens) {
        this.db.tokens = [];
      }
      const record = this.db.tokens.slice().reverse().find((t) => {
        if (id !== undefined && t.id !== id) return false;
        if (email !== undefined && t.email.trim().toLowerCase() !== email.trim().toLowerCase()) return false;
        if (code !== undefined && String(t.code).trim() !== String(code).trim()) return false;
        if (is_used !== undefined && t.is_used !== is_used) return false;
        return true;
      });

      return record || null;
    },

    update: async (
      values: Partial<TokenRecord>,
      options: { where: { id?: string; email?: string } }
    ): Promise<number> => {
      let count = 0;
      const firestore = getAdminFirestore();

      if (firestore) {
        try {
          if (options.where.id) {
            const docRef = firestore.collection('tokens').doc(options.where.id);
            const docSnap = await docRef.get();
            if (docSnap.exists) {
              await docRef.set({ ...values, updatedAt: new Date().toISOString() }, { merge: true });
              count++;
            }
          } else if (options.where.email) {
            const snap = await firestore
              .collection('tokens')
              .where('email', '==', options.where.email.trim().toLowerCase())
              .get();
            const batch = firestore.batch();
            snap.forEach((d) => {
              batch.set(d.ref, { ...values, updatedAt: new Date().toISOString() }, { merge: true });
              count++;
            });
            if (!snap.empty) {
              await batch.commit();
            }
          }
        } catch (fsErr) {
          console.warn('[Firestore Admin] Notice updating tokens in Firestore:', fsErr);
        }
      }

      this.init();
      if (!this.db.tokens) {
        this.db.tokens = [];
      }
      this.db.tokens = this.db.tokens.map((t) => {
        let match = true;
        if (options.where.id !== undefined && t.id !== options.where.id) match = false;
        if (options.where.email !== undefined && t.email.trim().toLowerCase() !== options.where.email.trim().toLowerCase()) match = false;

        if (match) {
          if (!firestore) count++;
          return { ...t, ...values };
        }
        return t;
      });

      if (count > 0) {
        this.saveToFile();
      }
      return count;
    },

    create: async (tokenData: {
      email: string;
      code: string;
      expires_at: string;
      is_used?: boolean;
      purpose?: string;
    }): Promise<TokenRecord> => {
      this.init();
      if (!this.db.tokens) {
        this.db.tokens = [];
      }
      const id = `tok-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
      const record: TokenRecord = {
        id,
        email: tokenData.email.trim().toLowerCase(),
        code: tokenData.code.trim(),
        is_used: tokenData.is_used ?? false,
        expires_at: tokenData.expires_at,
        created_at: new Date().toISOString(),
        purpose: tokenData.purpose || 'general',
      };

      this.db.tokens.push(record);
      this.saveToFile();

      const firestore = getAdminFirestore();
      if (firestore) {
        try {
          await firestore.collection('tokens').doc(id).set({
            ...record,
            expiresAtMs: new Date(tokenData.expires_at).getTime(),
            createdAtMs: Date.now(),
          });
        } catch (fsErr) {
          console.warn('[Firestore Admin] Notice writing token to Firestore:', fsErr);
        }
      }

      return record;
    },

    findAll: async (options?: { where?: Partial<TokenRecord> }): Promise<TokenRecord[]> => {
      const firestore = getAdminFirestore();
      if (firestore) {
        try {
          let q: Query = firestore.collection('tokens');
          if (options?.where?.email) {
            q = q.where('email', '==', options.where.email.trim().toLowerCase());
          }
          if (options?.where?.is_used !== undefined) {
            q = q.where('is_used', '==', options.where.is_used);
          }
          const snap = await q.get();
          if (!snap.empty) {
            return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as TokenRecord[];
          }
        } catch (fsErr) {
          console.warn('[Firestore Admin] Notice findAll tokens in Firestore:', fsErr);
        }
      }

      this.init();
      if (!this.db.tokens) {
        this.db.tokens = [];
      }
      if (!options?.where) return [...this.db.tokens];
      return this.db.tokens.filter((t) => {
        for (const [k, v] of Object.entries(options.where!)) {
          if ((t as any)[k] !== v) return false;
        }
        return true;
      });
    },
  };

  // --- ASYNC USER & SESSION METHODS (FIRESTORE INTEGRATION) ---

  public async findUserByEmailAsync(email: string): Promise<DatabaseUser | undefined> {
    const clean = email.trim().toLowerCase();
    const existing = this.findUserByEmail(clean);
    if (existing) return existing;

    const firestore = getAdminFirestore();
    if (firestore) {
      try {
        const snap = await firestore.collection('users').where('email', '==', clean).limit(1).get();
        if (!snap.empty) {
          const u = snap.docs[0].data() as DatabaseUser;
          this.init();
          const inMemIdx = this.db.users.findIndex((x) => x.id === u.id);
          if (inMemIdx >= 0) this.db.users[inMemIdx] = u;
          else this.db.users.push(u);
          return u;
        }
      } catch (err) {
        console.warn('[Firestore Admin] Notice findUserByEmailAsync:', err);
      }
    }
    return undefined;
  }

  public async findUserByIdAsync(id: string): Promise<DatabaseUser | undefined> {
    const existing = this.findUserById(id);
    if (existing) return existing;

    const firestore = getAdminFirestore();
    if (firestore) {
      try {
        const docSnap = await firestore.collection('users').doc(id).get();
        if (docSnap.exists) {
          const u = docSnap.data() as DatabaseUser;
          this.init();
          const inMemIdx = this.db.users.findIndex((x) => x.id === u.id);
          if (inMemIdx >= 0) this.db.users[inMemIdx] = u;
          else this.db.users.push(u);
          return u;
        }
      } catch (err) {
        console.warn('[Firestore Admin] Notice findUserByIdAsync:', err);
      }
    }
    return undefined;
  }

  public async findUserByIdentifierAsync(identifier: string): Promise<DatabaseUser | undefined> {
    if (!identifier || !identifier.trim()) return undefined;
    const clean = identifier.trim().toLowerCase();
    const existing = this.findUserByIdentifier(clean);
    if (existing) return existing;

    const firestore = getAdminFirestore();
    if (firestore) {
      try {
        const snapEmail = await firestore.collection('users').where('email', '==', clean).limit(1).get();
        if (!snapEmail.empty) {
          const u = snapEmail.docs[0].data() as DatabaseUser;
          this.init();
          this.db.users.push(u);
          return u;
        }
        const snapDoc = await firestore.collection('users').where('documentNumber', '==', clean).limit(1).get();
        if (!snapDoc.empty) {
          const u = snapDoc.docs[0].data() as DatabaseUser;
          this.init();
          this.db.users.push(u);
          return u;
        }
      } catch (err) {
        console.warn('[Firestore Admin] Notice findUserByIdentifierAsync:', err);
      }
    }
    return undefined;
  }
}

export const serverDatabase = new ServerDatabase();
export const db = serverDatabase;

/**
 * Verifica un código de verificación activo según las reglas:
 * 1. Buscar el token activo y no expirado en Firestore o memoria
 * 2. Comprobar si ha expirado (15 minutos)
 * 3. Marcar como usado inmediatamente
 */
export async function verificarCodigo(
  email: string,
  codigoIngresado: string,
  pendingToken?: string
) {
  const cleanEmail = email.trim().toLowerCase();
  const cleanCode = codigoIngresado.trim();

  // 1. Buscar el token activo y no expirado en Firestore o memoria
  const registroToken = await db.tokens.findOne({
    where: { 
      email: cleanEmail, 
      code: cleanCode,
      is_used: false 
    }
  });

  if (registroToken) {
    // 2. Comprobar si ha expirado (15 minutos)
    const ahora = new Date();
    if (ahora > new Date(registroToken.expires_at)) {
      throw new Error("El código ha expirado. Solicita uno nuevo.");
    }

    // 3. Marcar como usado inmediatamente
    await db.tokens.update(
      { is_used: true }, 
      { where: { id: registroToken.id } }
    );

    return { success: true, message: "Código verificado correctamente." };
  }

  // 4. Verificación resiliente sin estado (HMAC) para Serverless Vercel
  if (pendingToken && typeof pendingToken === 'string') {
    try {
      const decodedJson = Buffer.from(pendingToken, 'base64url').toString('utf-8');
      const stateObj = JSON.parse(decodedJson);
      if (stateObj && stateObj.e === cleanEmail && stateObj.exp && stateObj.sig) {
        if (Date.now() > stateObj.exp) {
          throw new Error("El código ha expirado. Solicita uno nuevo.");
        }
        const pepper = (
          process.env.SECURITY_PEPPER ||
          process.env.SESSION_SECRET ||
          'sf_secure_pepper_2026_sportfitness_auth_hash'
        ).trim();
        const expectedPayload = `${cleanEmail}:${cleanCode}:${stateObj.exp}:${stateObj.p || 'registro'}`;
        const expectedSig = crypto.createHmac('sha256', pepper).update(expectedPayload).digest('hex');
        const sigBuf = Buffer.from(stateObj.sig);
        const expBuf = Buffer.from(expectedSig);
        if (sigBuf.length === expBuf.length && crypto.timingSafeEqual(sigBuf, expBuf)) {
          return { success: true, message: "Código verificado correctamente." };
        }
      }
    } catch (e: any) {
      if (e.message && e.message.includes('expirado')) throw e;
    }
  }

  throw new Error("El código es incorrecto o ya ha sido utilizado.");
}
