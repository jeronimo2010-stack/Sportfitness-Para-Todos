/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { UserProfile } from '../types';
import { getBiomechanicalProfile, getExerciseLoadForUser } from './biomechanicalWeights';

export interface ExerciseDailyTarget {
  name: string;
  muscleGroup: string;
  sets: number;
  reps: string;
  baseWeightKg: number;
  overloadAddedKg: number;
  suggestedWeightKg: number;
  rpeTarget: string;
}

export interface TodaySuggestedWorkout {
  dayName: string;
  dayIndex: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  routineTitle: string;
  routineCategory: string;
  isRestDay: boolean;
  currentWeek: number;
  overloadPercent: number;
  streakBonusKg: number;
  progressionStage: string;
  primaryExerciseName: string;
  primaryWeightKg: number;
  exercises: ExerciseDailyTarget[];
}

/**
 * Calculates progressive overload increment based on elapsed days, active streak, and completed sessions.
 * Rule: +2.5% (or +1.25 to 2.5 kg) for each completed training block/week to ensure continuous progressive overload.
 */
export function calculateProgressiveOverload(
  user: Partial<UserProfile> | null | undefined,
  baseLoadKg: number,
  isCompound: boolean = true
): {
  baseWeightKg: number;
  overloadAddedKg: number;
  suggestedWeightKg: number;
  overloadPercent: number;
  currentWeek: number;
  progressionStage: string;
} {
  const sessions = Math.max(0, Number(user?.activeDaysTotal || user?.sessionsThisWeek || user?.streakDays || 1));
  const streak = Math.max(0, Number(user?.streakDays || 1));

  // Determine progression week (1 to 12) based on sessions completed and streak consistency
  const effectiveCycles = Math.floor(Math.max(sessions, streak) / 4);
  const currentWeek = Math.min(12, Math.max(1, effectiveCycles + 1));

  // Overload multiplier: +2.5% per week completed beyond Week 1 (capped at 25% for safety)
  const overloadPercent = Math.min(25, (currentWeek - 1) * 2.5);

  // Micro-loading increments: minimum 1.25 kg for accessories, 2.5 kg for compounds
  const rawOverloadKg = baseLoadKg * (overloadPercent / 100);
  const step = isCompound ? 2.5 : 1.25;
  const overloadAddedKg = Math.round(rawOverloadKg / step) * step;

  const suggestedWeightKg = Math.max(baseLoadKg, baseLoadKg + overloadAddedKg);

  let progressionStage = 'Adaptación Inicial';
  if (currentWeek >= 2 && currentWeek <= 4) progressionStage = 'Sobrecarga Lineal (+2.5%)';
  else if (currentWeek >= 5 && currentWeek <= 8) progressionStage = 'Fuerza & Tensión Mecánica (+7.5%)';
  else if (currentWeek >= 9) progressionStage = 'Pico de Rendimiento Máximo (+15%)';

  return {
    baseWeightKg: baseLoadKg,
    overloadAddedKg,
    suggestedWeightKg,
    overloadPercent,
    currentWeek,
    progressionStage,
  };
}

/**
 * Returns the exact tailored suggested exercises and weights in kilograms for TODAY's routine.
 */
export function getTodaySuggestedWorkout(
  user: Partial<UserProfile> | null | undefined,
  language: string = 'es'
): TodaySuggestedWorkout {
  const bio = getBiomechanicalProfile(user);
  const dayIndex = new Date().getDay(); // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado

  const dayNamesEs = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const dayNamesEn = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayName = language === 'en' ? dayNamesEn[dayIndex] : dayNamesEs[dayIndex];

  // Base exercises mapped per day of the week
  let rawExercises: { name: string; muscleGroup: string; sets: number; reps: string; baseKg: number; isCompound: boolean; rpe: string }[] = [];
  let routineTitle = '';
  let routineCategory = '';
  let isRestDay = false;

  switch (dayIndex) {
    case 1: // Lunes: Piernas & Sentadillas (Leg Day)
      routineTitle = language === 'en' ? 'Leg Day: Back Squat & Quad Isolation' : 'Día de Piernas: Sentadilla & Cuádriceps';
      routineCategory = 'Fuerza';
      rawExercises = [
        { name: language === 'en' ? 'Barbell Back Squat' : 'Sentadilla con Barra Trasera', muscleGroup: 'Piernas', sets: 4, reps: '6-8 reps', baseKg: bio.squatWorkingKg, isCompound: true, rpe: 'RPE 8' },
        { name: language === 'en' ? '45° Leg Press' : 'Prensa de Piernas 45°', muscleGroup: 'Piernas', sets: 3, reps: '10-12 reps', baseKg: bio.legPressWorkingKg, isCompound: true, rpe: 'RPE 8.5' },
        { name: language === 'en' ? 'Romanian Deadlift (RDL)' : 'Peso Muerto Rumano (RDL)', muscleGroup: 'Piernas', sets: 3, reps: '10 reps', baseKg: bio.rdlWorkingKg, isCompound: true, rpe: 'RPE 8' },
        { name: language === 'en' ? 'Standing Calf Raises' : 'Elevaciones de Gemelos', muscleGroup: 'Piernas', sets: 4, reps: '15 reps', baseKg: Math.round(bio.weightKg * 0.4), isCompound: false, rpe: 'RPE 8' },
      ];
      break;

    case 2: // Martes: Torso & Press de Banca (Chest & Triceps)
      routineTitle = language === 'en' ? 'Chest & Torso: Flat Bench Press' : 'Torso & Pecho: Press de Banca Plano';
      routineCategory = 'Hipertrofia';
      rawExercises = [
        { name: language === 'en' ? 'Flat Barbell Bench Press' : 'Press de Banca Plano con Barra', muscleGroup: 'Pecho', sets: 4, reps: '6-8 reps', baseKg: bio.benchWorkingKg, isCompound: true, rpe: 'RPE 8.5' },
        { name: language === 'en' ? 'Standing Overhead Press' : 'Press Militar de Hombros', muscleGroup: 'Hombros', sets: 3, reps: '8 reps', baseKg: bio.ohpWorkingKg, isCompound: true, rpe: 'RPE 8' },
        { name: language === 'en' ? 'Parallel Bar Dips' : 'Fondos en Paralelas (Tríceps)', muscleGroup: 'Brazos', sets: 3, reps: '10 reps', baseKg: Math.max(0, Math.round(bio.weightKg * 0.15)), isCompound: true, rpe: 'RPE 8' },
        { name: language === 'en' ? 'Triceps Rope Pushdowns' : 'Extensiones de Tríceps en Polea', muscleGroup: 'Brazos', sets: 3, reps: '12 reps', baseKg: Math.round(bio.weightKg * 0.28), isCompound: false, rpe: 'RPE 8' },
      ];
      break;

    case 3: // Miércoles: Espalda & Tracción (Back & Deadlift)
      routineTitle = language === 'en' ? 'Back & Pull: Conventional Deadlift' : 'Espalda & Tracción: Peso Muerto & Dorsal';
      routineCategory = 'Fuerza';
      rawExercises = [
        { name: language === 'en' ? 'Conventional Deadlift' : 'Peso Muerto Convencional', muscleGroup: 'Espalda/Piernas', sets: 3, reps: '5 reps', baseKg: bio.deadliftWorkingKg, isCompound: true, rpe: 'RPE 8.5' },
        { name: language === 'en' ? 'Overhand Barbell Row' : 'Remo con Barra Inclinado', muscleGroup: 'Espalda', sets: 4, reps: '8 reps', baseKg: Math.round(bio.benchWorkingKg * 0.9 / 2.5) * 2.5, isCompound: true, rpe: 'RPE 8' },
        { name: language === 'en' ? 'Strict Pronated Pull-Ups' : 'Dominadas Pronas Estrictas', muscleGroup: 'Espalda', sets: 3, reps: '8-10 reps', baseKg: Math.max(0, Math.round(bio.weightKg * 0.1 / 2.5) * 2.5), isCompound: true, rpe: 'RPE 8.5' },
        { name: language === 'en' ? 'Dumbbell Bicep Curl' : 'Curl de Bíceps con Mancuerna', muscleGroup: 'Brazos', sets: 3, reps: '12 reps', baseKg: Math.max(10, Math.round(bio.weightKg * 0.16)), isCompound: false, rpe: 'RPE 8' },
      ];
      break;

    case 4: // Jueves: Potencia & Pliometría (Power & Explosivity)
      routineTitle = language === 'en' ? 'Power & Neuromuscular VBT' : 'Potencia & Pliometría Neuromuscular';
      routineCategory = 'Explosividad';
      rawExercises = [
        { name: language === 'en' ? 'Hang Power Clean' : 'Cargada Colgada de Potencia', muscleGroup: 'Explosividad', sets: 4, reps: '3 reps', baseKg: Math.round(bio.deadliftWorkingKg * 0.58 / 2.5) * 2.5, isCompound: true, rpe: 'RPE 8 (100% Vel)' },
        { name: language === 'en' ? 'Weighted Jump Squat' : 'Sentadilla con Salto Reactivo', muscleGroup: 'Piernas', sets: 4, reps: '5 reps', baseKg: Math.round(bio.squatWorkingKg * 0.35 / 2.5) * 2.5, isCompound: true, rpe: 'RPE 7.5' },
        { name: language === 'en' ? 'Plyometric Box Jump' : 'Salto al Cajón Pliométrico', muscleGroup: 'Explosividad', sets: 4, reps: '5 saltos', baseKg: 0, isCompound: false, rpe: 'RPE 7' },
        { name: language === 'en' ? 'Ab Wheel Rollout' : 'Rueda Abdominal Anti-Extensión', muscleGroup: 'Core', sets: 3, reps: '10 reps', baseKg: 0, isCompound: false, rpe: 'RPE 8' },
      ];
      break;

    case 5: // Viernes: Full Body & Glúteo / Pierna (Glute & Posterior Chain)
      routineTitle = language === 'en' ? 'Posterior Chain & Hypertrophy' : 'Cadena Posterior & Hipertrofia';
      routineCategory = 'Hipertrofia';
      rawExercises = [
        { name: language === 'en' ? 'Barbell Hip Thrust' : 'Hip Thrust con Barra', muscleGroup: 'Piernas/Glúteo', sets: 4, reps: '8-10 reps', baseKg: Math.round(bio.squatWorkingKg * 1.15 / 2.5) * 2.5, isCompound: true, rpe: 'RPE 8.5' },
        { name: language === 'en' ? 'Bulgarian Split Squat' : 'Sentadilla Búlgara con Mancuerna', muscleGroup: 'Piernas', sets: 3, reps: '10 reps/lado', baseKg: Math.max(12, Math.round(bio.weightKg * 0.25)), isCompound: true, rpe: 'RPE 8' },
        { name: language === 'en' ? 'Incline Dumbbell Press' : 'Press Inclinado con Mancuernas', muscleGroup: 'Pecho', sets: 3, reps: '10 reps', baseKg: Math.max(16, Math.round(bio.benchWorkingKg * 0.4)), isCompound: true, rpe: 'RPE 8' },
        { name: language === 'en' ? 'Isometric Plank' : 'Plancha Abdominal con Disco', muscleGroup: 'Core', sets: 3, reps: '45 seg', baseKg: 10, isCompound: false, rpe: 'RPE 8' },
      ];
      break;

    case 6: // Sábado: Acondicionamiento & HIIT (Conditioning)
      routineTitle = language === 'en' ? 'Conditioning, Kettlebell & Core' : 'Acondicionamiento Metabólico & Core';
      routineCategory = 'Cardio';
      rawExercises = [
        { name: language === 'en' ? 'Russian Kettlebell Swings' : 'Kettlebell Swings Rusos', muscleGroup: 'Cadena Posterior', sets: 4, reps: '20 reps', baseKg: Math.max(16, Math.round(bio.weightKg * 0.28)), isCompound: true, rpe: 'RPE 8' },
        { name: language === 'en' ? 'Walking Dumbbell Lunges' : 'Zancadas Caminando', muscleGroup: 'Piernas', sets: 3, reps: '16 pasos', baseKg: Math.max(12, Math.round(bio.weightKg * 0.2)), isCompound: true, rpe: 'RPE 8' },
        { name: language === 'en' ? 'Jumping Jacks & High Knees' : 'Saltos de Tijera & Skipping', muscleGroup: 'Cardio', sets: 4, reps: '45 seg', baseKg: 0, isCompound: false, rpe: 'RPE 8' },
        { name: language === 'en' ? 'Hollow Body Hold' : 'Hollow Body Isométrico', muscleGroup: 'Core', sets: 3, reps: '30 seg', baseKg: 0, isCompound: false, rpe: 'RPE 8' },
      ];
      break;

    case 0: // Domingo: Recuperación Activa & Movilidad
    default:
      routineTitle = language === 'en' ? 'Active Recovery & Joint Mobility' : 'Descarga Activa & Movilidad Articular';
      routineCategory = 'Movilidad';
      isRestDay = true;
      rawExercises = [
        { name: language === 'en' ? 'Spinal Decompression & Cat-Cow' : 'Descompresión Espinal & Movilidad Gato-Camello', muscleGroup: 'Movilidad', sets: 3, reps: '10 reps', baseKg: 0, isCompound: false, rpe: 'RPE 3' },
        { name: language === 'en' ? '90/90 Hip Flow' : 'Flujo de Cadera 90/90', muscleGroup: 'Movilidad', sets: 3, reps: '60 seg', baseKg: 0, isCompound: false, rpe: 'RPE 3' },
        { name: language === 'en' ? 'Thoracic Spine Openers' : 'Aperturas Torácicas con Foam Roller', muscleGroup: 'Movilidad', sets: 2, reps: '8 reps', baseKg: 0, isCompound: false, rpe: 'RPE 2' },
      ];
      break;
  }

  // Calculate progressive overload on each exercise
  const calibratedExercises: ExerciseDailyTarget[] = rawExercises.map((ex) => {
    if (ex.baseKg === 0) {
      return {
        name: ex.name,
        muscleGroup: ex.muscleGroup,
        sets: ex.sets,
        reps: ex.reps,
        baseWeightKg: 0,
        overloadAddedKg: 0,
        suggestedWeightKg: 0,
        rpeTarget: ex.rpe,
      };
    }

    const { overloadAddedKg, suggestedWeightKg } = calculateProgressiveOverload(user, ex.baseKg, ex.isCompound);

    return {
      name: ex.name,
      muscleGroup: ex.muscleGroup,
      sets: ex.sets,
      reps: ex.reps,
      baseWeightKg: ex.baseKg,
      overloadAddedKg,
      suggestedWeightKg,
      rpeTarget: ex.rpe,
    };
  });

  const { currentWeek, overloadPercent, progressionStage } = calculateProgressiveOverload(
    user,
    calibratedExercises[0]?.baseWeightKg || 50,
    true
  );

  const primary = calibratedExercises[0] || { name: 'Ejercicio Principal', suggestedWeightKg: 50 };

  return {
    dayName,
    dayIndex,
    routineTitle,
    routineCategory,
    isRestDay,
    currentWeek,
    overloadPercent,
    streakBonusKg: Math.min(5, Math.floor(Number(user?.streakDays || 1) / 7) * 1.25),
    progressionStage,
    primaryExerciseName: primary.name,
    primaryWeightKg: primary.suggestedWeightKg,
    exercises: calibratedExercises,
  };
}
