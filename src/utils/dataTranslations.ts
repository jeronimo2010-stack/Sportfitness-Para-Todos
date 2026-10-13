/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Language } from './translations';
import { WorkoutRoutine, ExerciseItem } from '../types';
import { DetailedExerciseItem } from '../data/comprehensiveExercises';

/**
 * Universal bilingual translation registry for sports, exercises, biometrics, and nutrition data.
 */
const CATEGORY_MAP: Record<string, { es: string; en: string }> = {
  Todos: { es: 'Todos', en: 'All' },
  Fuerza: { es: 'Fuerza', en: 'Strength' },
  Hipertrofia: { es: 'Hipertrofia', en: 'Hypertrophy' },
  Cardio: { es: 'Cardio', en: 'Cardio' },
  Movilidad: { es: 'Movilidad', en: 'Mobility' },
  Potencia: { es: 'Potencia', en: 'Power' },
  Explosividad: { es: 'Explosividad', en: 'Explosiveness' },
  Pecho: { es: 'Pecho', en: 'Chest' },
  Piernas: { es: 'Piernas', en: 'Legs' },
  'Espalda & Hombros': { es: 'Espalda y Hombros', en: 'Back & Shoulders' },
  Espalda: { es: 'Espalda', en: 'Back' },
  Hombros: { es: 'Hombros', en: 'Shoulders' },
  Brazos: { es: 'Brazos', en: 'Arms' },
  'Core & Abdominales': { es: 'Core y Abdominales', en: 'Core & Abs' },
  Core: { es: 'Core', en: 'Core' },
  'Equilibrio & Saltos': { es: 'Equilibrio y Saltos', en: 'Balance & Jumps' },
  Estiramientos: { es: 'Estiramientos', en: 'Stretching & Mobility' },
  Proteínas: { es: 'Proteínas', en: 'Proteins' },
  Carbohidratos: { es: 'Carbohidratos', en: 'Carbohydrates' },
  Grasas: { es: 'Grasas', en: 'Healthy Fats' },
  Micronutrientes: { es: 'Micronutrientes', en: 'Micronutrients' },
};

const BODY_TYPE_MAP: Record<string, { es: string; en: string }> = {
  Mesomorfo: { es: 'Mesomorfo', en: 'Mesomorph' },
  Ectomorfo: { es: 'Ectomorfo', en: 'Ectomorph' },
  Endomorfo: { es: 'Endomorfo', en: 'Endomorph' },
};

const EXERCISE_NAMES_MAP: Record<string, { es: string; en: string; muscleEs?: string; muscleEn?: string }> = {
  'Sentadilla Trasera': {
    es: 'Sentadilla Trasera',
    en: 'Barbell Back Squat',
    muscleEs: 'Cuádriceps, Glúteos y Erectores Espinales',
    muscleEn: 'Quadriceps, Glutes & Spinal Erectors',
  },
  'Press de Banca Plano': {
    es: 'Press de Banca Plano',
    en: 'Flat Barbell Bench Press',
    muscleEs: 'Pectoral Mayor, Tríceps Braquial y Deltoides Anterior',
    muscleEn: 'Pectoralis Major, Triceps & Anterior Deltoid',
  },
  'Peso Muerto Rumano': {
    es: 'Peso Muerto Rumano',
    en: 'Romanian Deadlift (RDL)',
    muscleEs: 'Isquiosurales, Glúteo Mayor y Cadena Posterior',
    muscleEn: 'Hamstrings, Gluteus Maximus & Posterior Chain',
  },
  'Dominadas Pronas': {
    es: 'Dominadas Pronas',
    en: 'Overhand Pull-Ups',
    muscleEs: 'Dorsal Ancho, Bíceps Braquial y Trapecio Medio/Inferior',
    muscleEn: 'Latissimus Dorsi, Biceps & Middle/Lower Trapezius',
  },
  'Prensa de Piernas 45°': {
    es: 'Prensa de Piernas 45°',
    en: '45° Leg Press',
    muscleEs: 'Cuádriceps, Glúteos y Aductores',
    muscleEn: 'Quadriceps, Glutes & Adductors',
  },
  'Elevaciones Laterales con Mancuerna': {
    es: 'Elevaciones Laterales con Mancuerna',
    en: 'Dumbbell Lateral Raises',
    muscleEs: 'Deltoides Lateral',
    muscleEn: 'Lateral Deltoid',
  },
  'Curl de Bíceps con Barra Z': {
    es: 'Curl de Bíceps con Barra Z',
    en: 'EZ-Bar Bicep Curl',
    muscleEs: 'Bíceps Braquial y Braquiorradial',
    muscleEn: 'Biceps Brachii & Brachioradialis',
  },
  'Fondos en Paralelas': {
    es: 'Fondos en Paralelas',
    en: 'Parallel Bar Dips',
    muscleEs: 'Tríceps Braquial y Pectoral Inferior',
    muscleEn: 'Triceps Brachii & Lower Pectoralis',
  },
  'Sentadilla con Barra': {
    es: 'Sentadilla con Barra',
    en: 'Barbell Squat',
    muscleEs: 'Cuádriceps y Glúteos',
    muscleEn: 'Quadriceps & Glutes',
  },
  'Press de Banca': {
    es: 'Press de Banca',
    en: 'Bench Press',
    muscleEs: 'Pectorales y Tríceps',
    muscleEn: 'Chest & Triceps',
  },
  'Plancha Abdominal Isométrica': {
    es: 'Plancha Abdominal Isométrica',
    en: 'Isometric Plank',
    muscleEs: 'Recto Abdominal y Transverso',
    muscleEn: 'Rectus Abdominis & Transverse Abdominis',
  },
  'Zancadas Búlgaras': {
    es: 'Zancadas Búlgaras',
    en: 'Bulgarian Split Squats',
    muscleEs: 'Cuádriceps y Glúteo Medio',
    muscleEn: 'Quadriceps & Gluteus Medius',
  },
  'Press Militar con Barra': {
    es: 'Press Militar con Barra',
    en: 'Overhead Barbell Press',
    muscleEs: 'Deltoides y Tríceps',
    muscleEn: 'Deltoids & Triceps',
  },
  'Remo con Barra 45°': {
    es: 'Remo con Barra 45°',
    en: '45° Barbell Row',
    muscleEs: 'Dorsales y Espalda Media',
    muscleEn: 'Lats & Mid-Back',
  },
};

const ROUTINE_TITLES_MAP: Record<string, { es: string; en: string; descEs: string; descEn: string }> = {
  'Fuerza Máxima & Hipertrofia (Tren Inferior)': {
    es: 'Fuerza Máxima & Hipertrofia (Tren Inferior)',
    en: 'Max Strength & Hypertrophy (Lower Body)',
    descEs: 'Rutina optimizada basada en datos para el desarrollo del tren inferior, enfocada en tensión mecánica máxima y acumulación de microtrauma controlado.',
    descEn: 'Data-driven optimized routine for lower body power and development, focused on maximal mechanical tension and controlled microtrauma accumulation.',
  },
  'Torso Élite: Fuerza & Tensión Mecánica': {
    es: 'Torso Élite: Fuerza & Tensión Mecánica',
    en: 'Elite Upper Body: Strength & Mechanical Tension',
    descEs: 'Enfoque en pectorales, dorsales y deltoides con énfasis en sobrecarga progresiva y trayectoria articular óptima.',
    descEn: 'Focused on chest, lats, and deltoids with strong emphasis on progressive overload and optimal joint trajectory.',
  },
  'Acondicionamiento Metabólico & Tasa Cardíaca': {
    es: 'Acondicionamiento Metabólico & Tasa Cardíaca',
    en: 'Metabolic Conditioning & Heart Rate Optimization',
    descEs: 'Circuito de alta densidad y bajo impacto osteoarticular para acelerar el aclaramiento de lactato y la resistencia aeróbica.',
    descEn: 'High-density, low-impact circuit designed to accelerate lactate clearance and boost aerobic endurance.',
  },
  'Recuperación Activa & Descompresión Espinal': {
    es: 'Recuperación Activa & Descompresión Espinal',
    en: 'Active Recovery & Spinal Decompression',
    descEs: 'Movilidad articular dirigida, descompresión gravitacional y estiramientos miofasciales para días de descanso activo.',
    descEn: 'Targeted joint mobility, gravitational decompression, and myofascial stretches for active recovery days.',
  },
};

export const translateCategory = (cat: string, lang: Language): string => {
  if (lang === 'en' && CATEGORY_MAP[cat]?.en) return CATEGORY_MAP[cat].en;
  if (CATEGORY_MAP[cat]?.es) return CATEGORY_MAP[cat].es;
  return cat;
};

export const translateBodyType = (bt: string, lang: Language): string => {
  if (lang === 'en' && BODY_TYPE_MAP[bt]?.en) return BODY_TYPE_MAP[bt].en;
  if (BODY_TYPE_MAP[bt]?.es) return BODY_TYPE_MAP[bt].es;
  return bt;
};

export const translateExerciseName = (name: string, lang: Language): string => {
  if (lang === 'en' && EXERCISE_NAMES_MAP[name]?.en) return EXERCISE_NAMES_MAP[name].en;
  return name;
};

export const translateMuscle = (muscle: string, lang: Language): string => {
  for (const item of Object.values(EXERCISE_NAMES_MAP)) {
    if (item.muscleEs === muscle && lang === 'en' && item.muscleEn) {
      return item.muscleEn;
    }
  }
  return muscle;
};

export const translateRoutine = (routine: WorkoutRoutine, lang: Language): WorkoutRoutine => {
  if (lang !== 'en') return routine;
  const match = ROUTINE_TITLES_MAP[routine.title];
  if (!match) return routine;
  return {
    ...routine,
    title: match.en,
    description: match.descEn,
    category: translateCategory(routine.category, 'en') as any,
    level: (routine.level === 'Avanzado' ? 'Advanced' : routine.level === 'Intermedio' ? 'Intermediate' : 'Beginner') as any,
  };
};

export const translateDetailedExercise = (
  ex: DetailedExerciseItem,
  lang: Language
): DetailedExerciseItem => {
  if (lang !== 'en') return ex;
  const nameTranslation = EXERCISE_NAMES_MAP[ex.name]?.en || ex.name;
  const catTranslation = translateCategory(ex.category, 'en');
  return {
    ...ex,
    name: nameTranslation,
    category: catTranslation as any,
  };
};

export const getMonthName = (monthIndex: number, lang: Language): string => {
  const monthsEs = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  const monthsEn = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return lang === 'en' ? monthsEn[monthIndex] : monthsEs[monthIndex];
};

export const getDayName = (dayIndex: number, lang: Language): string => {
  // 0: Mon, 1: Tue, ... 6: Sun
  const daysEs = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  const daysEn = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  return lang === 'en' ? daysEn[dayIndex] : daysEs[dayIndex];
};
