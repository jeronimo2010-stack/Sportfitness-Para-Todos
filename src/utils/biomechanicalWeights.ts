/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { UserProfile, ExerciseItem, WorkoutRoutine, WorkoutSet } from '../types';

export interface BiomechanicalProfile {
  weightKg: number;
  heightCm: number;
  clothingSize: string;
  bodyType: string;
  frameFactor: number;
  leverFactor: number;
  somatotypeFactor: number;
  combinedFactor: number;
  squatWorkingKg: number;
  benchWorkingKg: number;
  deadliftWorkingKg: number;
  legPressWorkingKg: number;
  rdlWorkingKg: number;
  ohpWorkingKg: number;
  targetSessionVolumeKg: number;
  totalWeeklyTonnageTonnes: number;
}

/**
 * Returns bone frame structural multiplier derived from clothing size (talla).
 * Larger clothing sizes (L, XL, XXL) reflect broader clavicles, thicker wrists/ankles, and skeletal robusticity.
 */
export function getFrameFactorFromSize(clothingSize?: string): number {
  switch (clothingSize?.toUpperCase()) {
    case 'XS':
      return 0.88;
    case 'S':
      return 0.94;
    case 'M':
      return 1.0;
    case 'L':
      return 1.06;
    case 'XL':
      return 1.12;
    case 'XXL':
      return 1.18;
    default:
      return 1.0;
  }
}

/**
 * Returns mechanical lever multiplier derived from athlete height.
 * Taller lifters face longer moment arms requiring greater torque; shorter lifters have favorable biomechanical leverages.
 */
export function getLeverFactorFromHeight(heightCm: number): number {
  if (heightCm >= 188) return 0.93;
  if (heightCm >= 182) return 0.96;
  if (heightCm <= 162) return 1.06;
  if (heightCm <= 170) return 1.03;
  return 1.0;
}

/**
 * Returns muscle fiber recruitment modifier from somatotype.
 */
export function getSomatotypeFactor(bodyType?: string): number {
  const norm = bodyType?.toLowerCase();
  if (norm?.includes('ecto')) return 0.92;
  if (norm?.includes('meso')) return 1.05;
  if (norm?.includes('endo')) return 1.0;
  return 1.02;
}

/**
 * Calculates complete biomechanical profile tailored to the user's registered bodyweight, height, and clothing size.
 */
export function getBiomechanicalProfile(user: Partial<UserProfile> | null | undefined): BiomechanicalProfile {
  const weightKg = Number(user?.weight) && Number(user?.weight) > 0 ? Number(user?.weight) : 78;
  const heightCm = Number(user?.height) && Number(user?.height) > 0 ? Number(user?.height) : 178;
  const clothingSize = user?.clothingSize || 'M';
  const bodyType = user?.bodyType || 'Mesomorfo';

  const frameFactor = getFrameFactorFromSize(clothingSize);
  const leverFactor = getLeverFactorFromHeight(heightCm);
  const somatotypeFactor = getSomatotypeFactor(bodyType);

  const combinedFactor = parseFloat((frameFactor * leverFactor * somatotypeFactor).toFixed(3));

  // Exercise loads: base multiplier relative to bodyweight * combinedFactor
  // Cleanly rounded to standard gym plates (2.5 kg increments)
  const round2_5 = (val: number, minVal: number = 20) =>
    Math.max(minVal, Math.round(val / 2.5) * 2.5);
  const round5 = (val: number, minVal: number = 40) =>
    Math.max(minVal, Math.round(val / 5) * 5);

  const squatWorkingKg = round2_5(weightKg * 1.35 * combinedFactor, 20);
  const benchWorkingKg = round2_5(weightKg * 0.95 * combinedFactor, 20);
  const deadliftWorkingKg = round2_5(weightKg * 1.7 * combinedFactor, 30);
  const legPressWorkingKg = round5(weightKg * 2.45 * combinedFactor, 50);
  const rdlWorkingKg = round2_5(weightKg * 1.05 * combinedFactor, 20);
  const ohpWorkingKg = round2_5(weightKg * 0.58 * combinedFactor, 15);

  // Target session volume based on bodyweight and frame
  const targetSessionVolumeKg = Math.round((weightKg * 180 * combinedFactor) / 100) * 100;
  const totalWeeklyTonnageTonnes = parseFloat(((targetSessionVolumeKg * 4.2) / 1000).toFixed(1));

  return {
    weightKg,
    heightCm,
    clothingSize,
    bodyType,
    frameFactor,
    leverFactor,
    somatotypeFactor,
    combinedFactor,
    squatWorkingKg,
    benchWorkingKg,
    deadliftWorkingKg,
    legPressWorkingKg,
    rdlWorkingKg,
    ohpWorkingKg,
    targetSessionVolumeKg,
    totalWeeklyTonnageTonnes,
  };
}

/**
 * Calculates tailored weight (in kg) for a specific exercise name and athlete metrics.
 */
export function getExerciseLoadForUser(
  exerciseNameOrId: string,
  user: Partial<UserProfile> | null | undefined
): number {
  const profile = getBiomechanicalProfile(user);
  const lower = exerciseNameOrId.toLowerCase();

  if (lower.includes('prensa') || lower.includes('leg press')) {
    return profile.legPressWorkingKg;
  }
  if (lower.includes('sentadilla con barra') || lower.includes('sentadilla trasera') || lower.includes('back squat')) {
    return profile.squatWorkingKg;
  }
  if (lower.includes('sentadilla goblet') || lower.includes('goblet')) {
    return Math.max(8, Math.round((profile.weightKg * 0.26 * profile.combinedFactor) / 2) * 2);
  }
  if (lower.includes('sentadilla al cajón') || lower.includes('box squat')) {
    return Math.max(20, Math.round((profile.weightKg * 0.85 * profile.combinedFactor) / 2.5) * 2.5);
  }
  if (lower.includes('peso muerto rumano') || lower.includes('rdl')) {
    return profile.rdlWorkingKg;
  }
  if (lower.includes('peso muerto') || lower.includes('deadlift')) {
    return profile.deadliftWorkingKg;
  }
  if (lower.includes('press de banca') || lower.includes('bench press') || lower.includes('press plano')) {
    return profile.benchWorkingKg;
  }
  if (lower.includes('press militar') || lower.includes('shoulder press') || lower.includes('hombros')) {
    return profile.ohpWorkingKg;
  }
  if (lower.includes('kettlebell')) {
    const kbRaw = profile.weightKg * 0.28 * profile.combinedFactor;
    if (kbRaw <= 14) return 12;
    if (kbRaw <= 18) return 16;
    if (kbRaw <= 22) return 20;
    if (kbRaw <= 26) return 24;
    if (kbRaw <= 30) return 28;
    return 32;
  }
  if (lower.includes('dominadas') || lower.includes('pull-up')) {
    // Weighted pullup added load
    const addedRaw = (profile.weightKg * 0.16 * profile.combinedFactor);
    return Math.max(0, Math.round(addedRaw / 2.5) * 2.5);
  }
  if (lower.includes('curl') || lower.includes('tríceps') || lower.includes('triceps')) {
    return Math.max(6, Math.round((profile.weightKg * 0.15 * profile.combinedFactor) / 2) * 2);
  }

  // Default compound estimate
  return Math.max(20, Math.round((profile.weightKg * 0.8 * profile.combinedFactor) / 2.5) * 2.5);
}

/**
 * Returns a workout routine with exercises and target tonnage calibrated to the user's registered weight, height, and talla.
 */
export function getCalibratedRoutine(
  routine: WorkoutRoutine,
  user: Partial<UserProfile> | null | undefined
): WorkoutRoutine {
  const profile = getBiomechanicalProfile(user);

  // Scale target volume proportionally
  const baselineWeight = 82.5;
  const scaleRatio = (profile.weightKg / baselineWeight) * profile.combinedFactor;
  const scaledVolume = Math.round((routine.targetVolumeKg * scaleRatio) / 100) * 100;

  const calibratedExercises = routine.exercises.map((ex) => {
    const calibratedKg = getExerciseLoadForUser(ex.name || ex.exerciseId, user);
    return {
      ...ex,
      targetWeightKg: calibratedKg,
    };
  });

  return {
    ...routine,
    targetVolumeKg: Math.max(2000, scaledVolume),
    exercises: calibratedExercises,
  };
}

/**
 * Returns a list of exercise items with dynamic history logs calibrated to the user's registered metrics.
 */
export function getCalibratedExerciseItem(
  exercise: ExerciseItem,
  user: Partial<UserProfile> | null | undefined
): ExerciseItem {
  const currentWeight = getExerciseLoadForUser(exercise.name || exercise.id, user);

  const prev1 = Math.max(10, currentWeight - 2.5);
  const prev2 = Math.max(10, currentWeight + 5);

  const unit = exercise.id === 'ex-pullups' ? `+${currentWeight} kg` : `${currentWeight} kg`;
  const prev1Unit = exercise.id === 'ex-pullups' ? `+${prev1} kg` : `${prev1} kg`;
  const prev2Unit = exercise.id === 'ex-pullups' ? `+${prev2} kg` : `${prev2} kg`;

  return {
    ...exercise,
    historyLogs: [
      { date: 'Hoy', sets: '4 series × 8 reps', weight: unit },
      { date: 'Hace 4 días', sets: '4 series × 8 reps', weight: prev1Unit },
      { date: 'Hace 10 días', sets: '5 series × 5 reps', weight: prev2Unit },
    ],
  };
}

/**
 * Generates calibrated workout sets for live workout mode based on the user's active exercise and registered metrics.
 */
export function getCalibratedLiveSets(
  exerciseName: string,
  user: Partial<UserProfile> | null | undefined
): { workingWeightKg: number; initialCompletedSets: WorkoutSet[] } {
  const workingWeightKg = getExerciseLoadForUser(exerciseName, user);
  const warmupSetWeight = Math.max(20, Math.round((workingWeightKg * 0.9) / 2.5) * 2.5);

  return {
    workingWeightKg,
    initialCompletedSets: [
      {
        setNumber: 1,
        targetReps: '8 reps',
        weightKg: warmupSetWeight,
        repsCompleted: 8,
        rpe: 7.5,
        completed: true,
        timestamp: '18:04',
      },
      {
        setNumber: 2,
        targetReps: '8 reps',
        weightKg: workingWeightKg,
        repsCompleted: 8,
        rpe: 8.0,
        completed: true,
        timestamp: '18:11',
      },
    ],
  };
}
