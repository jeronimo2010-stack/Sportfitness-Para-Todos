/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ScreenId =
  | 'landing'
  | 'athlete-login'
  | 'athlete-register'
  | 'trainer-login'
  | 'trainer-register'
  | 'athlete-dashboard'
  | 'my-account'
  | 'account'
  | 'trainer-overview'
  | 'routines'
  | 'routine-catalog'
  | 'live-workout'
  | 'support'
  | 'support-center'
  | 'vip-plans'
  | 'calendar'
  | 'nutrition'
  | 'reviews'
  | 'exercises'
  | 'exercise-library'
  | 'exercise-videos'
  | 'videos-tutoriales'
  | 'news'
  | 'novedades'
  | 'weekly-news'
  | 'running'
  | 'running-tracker'
  | 'settings'
  | 'database'
  | 'database-manager';

export type UserRole = 'atleta' | 'entrenador' | 'admin';

export type DocumentType =
  | 'Cédula de Ciudadanía (CC)'
  | 'Tarjeta de Identidad (TI)'
  | 'Permiso por Protección Temporal (PPT/PEP)'
  | 'Cédula de Extranjería / Pasaporte';

export interface StoredCredentialRecord {
  id: string;
  documentType: DocumentType;
  documentNumber: string;
  phone?: string;
  email: string;
  role: UserRole;
  fullName: string;
  trainerCode?: string;
  createdAt: string;
  lastLoginAt?: string;
  status: 'Activo' | 'Inactivo';
  source?: 'Registro Atleta' | 'Registro Entrenador' | 'Carga Manual' | 'Sistema';
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

export type BodyType = 'Ectomorfo' | 'Mesomorfo' | 'Endomorfo';
export type ClothingSize = 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL';

export interface ProgressMilestone {
  id: string;
  date: string;
  title: string;
  description: string;
}

export interface UserProgressRecord {
  userId: string;
  sessionsCompleted: number;
  weeklyVolumePercent: number;
  totalVolumeKg: number;
  streakDays: number;
  streakDiscountPercent: number;
  efficiencyScoreAvg: number;
  lastUpdated: string;
  workoutLogs: any[];
  milestones: ProgressMilestone[];
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  error?: string;
  token?: string;
  user?: UserProfile;
  trainerCode?: string;
  progress?: UserProgressRecord;
  isNewUser?: boolean;
  needsRoleSelection?: boolean;
  authUser?: any;
}

export interface UserProfile {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  password?: string;
  role: UserRole;
  avatar: string;
  customAvatar?: string; // Optional user-uploaded custom profile photo
  membershipPlan: 'Free' | 'Elite Access' | 'Performance Pro' | 'Obsidian Ultimate';
  specialization?: string;
  trainerId?: string;
  trainerCode?: string;
  credentials?: string;
  weeklyVolumePercent: number;
  streakDays: number;
  streakDiscountPercent: number; // 1% per streak day
  lastLoginTimestamp?: number;
  sessionsThisWeek?: number; // Infinite logins, counted from weekly cycle
  activeDaysTotal?: number; // Total cumulative active physical training days since registration
  totalSessionsCompleted?: number;
  gpsRoutes?: Array<{
    id: string;
    date: string;
    name: string;
    distanceKm: number;
    durationMinutes: number;
    avgPace: string;
    caloriesBurned?: number;
  }>;
  fontSizePreference?: number;
  weight: number;
  height: number;
  country?: string;
  phone?: string;
  documentType?: DocumentType;
  documentNumber?: string;
  preferredWorkoutTime?: string; // '06:30 AM', 'Mañana', 'Tarde', 'Madrugada'
  penancePending?: boolean; // 1 min plank required if missed routine
  penanceCompleted?: boolean;
  dailySteps?: number;
  dailyKm?: number;
  mealChecklist?: {
    desayuno: boolean;
    almuerzo: boolean;
    cena: boolean;
    merienda: boolean;
  };
  bodyType?: 'Ectomorfo' | 'Mesomorfo' | 'Endomorfo';
  clothingSize?: 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL';
  starterExercise?: {
    exerciseName: string;
    category: string;
    targetMuscle: string;
    bmi: number;
    bmiCategory: string;
    suggestedWeightKg: number;
    sets: number;
    reps: string;
    rpeTarget: string;
    biomechanicalCues: string[];
    whyThisExercise: string;
    alternativeExercise?: string;
  };
  notes?: UserNote[];
}

export interface WorkoutSet {
  setNumber: number;
  targetReps: string;
  weightKg: number;
  repsCompleted: number;
  rpe: number; // 1 to 10
  completed: boolean;
  timestamp?: string;
}

export interface AppNotification {
  id: string;
  type: 'gps' | 'running' | 'system' | 'workout';
  titleKey: string;
  descKey: string;
  interpolations?: Record<string, string | number>;
  fallbackTitle: string;
  fallbackDesc: string;
  timestamp: number;
  unread: boolean;
}

export interface ExerciseItem {
  id: string;
  name: string;
  category: 'Piernas' | 'Pecho' | 'Espalda/Piernas' | 'Brazos' | 'Hombros' | 'Core' | 'Cardio' | 'Explosividad';
  description: string;
  primaryMuscle: string;
  biomechanicalCues: string[];
  commonMistakes: string[];
  videoThumbnail: string;
  videoUrl?: string;
  defaultSets: number;
  targetRepsRange: string;
  historyLogs?: {
    date: string;
    sets: string;
    weight: string;
  }[];
}

export interface WorkoutRoutine {
  id: string;
  title: string;
  category: 'Fuerza' | 'Hipertrofia' | 'Cardio' | 'Movilidad' | 'Potencia' | 'Explosividad';
  level: 'Principiante' | 'Intermedio' | 'Avanzado' | 'Élite';
  durationMinutes: number;
  targetVolumeKg: number;
  intensityRpe: string;
  description: string;
  coverImage: string;
  exercises: {
    exerciseId: string;
    name: string;
    sets: number;
    reps: string;
    targetWeightKg: number;
  }[];
}

export interface CommunityVideo {
  id: string;
  authorId: string;
  authorName: string;
  authorRole: UserRole;
  authorCustomAvatar?: string;
  title: string;
  youtubeUrl: string;
  youtubeVideoId: string;
  tag: 'Pecho' | 'Espalda' | 'Piernas' | 'Hombros' | 'Brazos' | 'Explosividad' | 'Core' | 'Cardio' | 'General';
  muscles?: string[];
  synonyms?: string[];
  difficulty?: 'Principiante' | 'Intermedio' | 'Avanzado';
  duration?: string;
  notes?: string;
  createdAt: string;
  likes?: number;
}

export interface AthleteRecordedSubmission {
  id: string;
  athleteId: string;
  athleteName: string;
  athleteRole?: UserRole;
  exerciseTitle: string;
  muscleGroup: string;
  videoUrl?: string; // Object URL or data URL
  videoBlobSize?: number;
  notes: string;
  createdAt: string;
  status: 'pending' | 'reviewed' | 'approved';
  coachFeedback?: {
    coachName: string;
    coachRole: string;
    comment: string;
    score: number; // 1-10
    reviewedAt: string;
  };
}

export interface AthleteRecord {
  id: string;
  name: string;
  initials: string;
  email: string;
  avatar?: string;
  currentProgram: string;
  complianceRate: number;
  lastActive: string;
  status: 'active' | 'warning' | 'pr' | 'missed';
  statusMessage: string;
  fatigueIndexTsb: number;
  totalVolumeTonnes: number;
}

export interface ScheduledSession {
  id: string;
  day: number; // 1-31
  month: number; // 0-11
  year: number;
  time: string;
  title: string;
  type: 'Fuerza' | 'Hipertrofia' | 'Cardio' | 'Movilidad' | 'Descanso Activo' | 'Potencia' | 'Explosividad';
  durationMinutes: number;
  estimatedKcal: number;
  completed: boolean;
  intensity: 'Baja' | 'Media' | 'Alta';
  exercises?: string[];
  notes?: string;
}

export interface DayCalendarOverride {
  day: number;
  status: 'training' | 'rest';
  restType?: 'Descanso Total' | 'Descanso Activo' | 'Movilidad & Recuperación' | 'Recarga de Glucógeno';
  restNotes?: string;
  updatedAt?: string;
}

export interface MealItem {
  id: string;
  mealTime: 'Desayuno' | 'Almuerzo' | 'Pre-Entreno' | 'Cena' | 'Snack';
  time: string;
  name: string;
  calories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  completed: boolean;
}

export interface RecipeItem {
  id: string;
  title: string;
  prepTimeMinutes: number;
  description: string;
  image: string;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  category: string;
}

export interface ReviewItem {
  id: string;
  authorName: string;
  authorRole: string;
  authorAvatar?: string;
  rating: number; // 1-5
  date: string;
  title: string;
  content: string;
  likes: number;
  hasLiked?: boolean;
}

export interface PrivateCoach {
  id: string;
  name: string;
  specialty: string;
  experienceYears: number;
  rateUsd: number;
  sessionMinutes: number;
  rating: number;
  avatar: string;
  tagline: string;
}

export interface GymEquipment {
  id: string;
  name: string;
  description: string;
  priceUsd: number;
  image: string;
  category: string;
  stock: number;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: string;
  highlightCard?: {
    title: string;
    description: string;
    actionLabel?: string;
    actionTarget?: ScreenId;
  };
}
