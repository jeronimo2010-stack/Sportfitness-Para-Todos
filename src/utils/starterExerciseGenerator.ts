/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { getFrameFactorFromSize, getLeverFactorFromHeight } from './biomechanicalWeights';

export type BodyType = 'Ectomorfo' | 'Mesomorfo' | 'Endomorfo';
export type ClothingSize = 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL';

export interface StarterExerciseRecommendation {
  exerciseName: string;
  category: 'Piernas' | 'Pecho' | 'Espalda' | 'Cuerpo Completo';
  targetMuscle: string;
  bmi: number;
  bmiCategory: string;
  suggestedWeightKg: number;
  sets: number;
  reps: string;
  rpeTarget: string;
  restSeconds: number;
  biomechanicalCues: string[];
  whyThisExercise: string;
  alternativeExercise: string;
}

export function calculateBmi(
  weightKg: number,
  heightCm: number,
  lang: 'es' | 'en' = 'es'
): { bmi: number; category: string } {
  if (heightCm <= 0 || weightKg <= 0) {
    return {
      bmi: 22,
      category: lang === 'en' ? 'Normal Weight' : 'Normopeso',
    };
  }
  const heightMeters = heightCm / 100;
  const bmi = parseFloat((weightKg / (heightMeters * heightMeters)).toFixed(1));

  let category = lang === 'en' ? 'Normal Weight' : 'Normopeso';
  if (bmi < 18.5) {
    category = lang === 'en' ? 'Underweight / Lean Frame' : 'Bajo peso / Longilíneo';
  } else if (bmi < 25) {
    category = lang === 'en' ? 'Optimal Composition' : 'Composición Óptima';
  } else if (bmi < 30) {
    category = lang === 'en' ? 'High Density / Recomposition' : 'Densidad Elevada / Recomposición';
  } else {
    category = lang === 'en' ? 'Robust Build / High Load' : 'Estructura Robusta / Alta Carga';
  }

  return { bmi, category };
}

export function generateStarterExercise(
  bodyType: BodyType,
  heightCm: number,
  weightKg: number,
  clothingSize: ClothingSize,
  role: 'atleta' | 'entrenador' = 'atleta',
  lang: 'es' | 'en' = 'es'
): StarterExerciseRecommendation {
  const { bmi, category: bmiCategory } = calculateBmi(weightKg, heightCm, lang);
  const frameFactor = getFrameFactorFromSize(clothingSize);
  const leverFactor = getLeverFactorFromHeight(heightCm);
  const structuralModifier = frameFactor * leverFactor;

  // Height-based biomechanical cues
  const leverCues: string[] = [];
  if (heightCm > 180) {
    leverCues.push(
      lang === 'en'
        ? 'Long levers detected: slightly widen your stance past shoulder width to allow optimal hip crease flexion.'
        : 'Palancas largas detectadas: abre tu base ligeramente más allá del ancho de hombros para permitir una óptima flexión de cadera.'
    );
  } else if (heightCm < 170) {
    leverCues.push(
      lang === 'en'
        ? 'Excellent mechanical advantage: keep an upright torso and aim for deep range of motion without heel lift.'
        : 'Excelente ventaja mecánica: mantén el torso erguido y busca un rango de movimiento profundo sin despegar los talones.'
    );
  } else {
    leverCues.push(
      lang === 'en'
        ? 'Standard proportions: evenly distribute weight between midfoot and heel throughout the entire concentric drive.'
        : 'Proporciones estándar: distribuye el peso equitativamente entre el talón y el metatarso durante toda la fase concéntrica.'
    );
  }

  if (bodyType === 'Ectomorfo') {
    // Ectomorph: Focus on controlled multi-joint motor pattern with dumbbell/kettlebell
    const rawWeight = weightKg * 0.22 * structuralModifier;
    const suggestedWeight = Math.max(8, Math.round(rawWeight / 2) * 2);
    return {
      exerciseName: lang === 'en' ? 'Pause Goblet Squat' : 'Sentadilla Goblet con Pausa en Fondo',
      category: 'Piernas',
      targetMuscle: lang === 'en' ? 'Quadriceps, Gluteus Maximus & Anterior Core' : 'Cuádriceps, Glúteo Mayor y Core Anterior',
      bmi,
      bmiCategory,
      suggestedWeightKg: suggestedWeight,
      sets: 3,
      reps: '10 - 12 reps',
      rpeTarget: lang === 'en' ? 'RPE 7.0 (2-3 reps in reserve)' : 'RPE 7.0 (2-3 repeticiones en recámara)',
      restSeconds: 90,
      biomechanicalCues: [
        lang === 'en'
          ? 'Hold the dumbbell flush against your sternum with elbows tucked downward toward the floor.'
          : 'Sostén la mancuerna pegada al esternón con los codos apuntando hacia el suelo.',
        ...leverCues,
        lang === 'en'
          ? 'Hold a strict 1-second pause at maximum depth to stabilize the core and eliminate momentum.'
          : 'Haz una pausa de 1 segundo en el punto más profundo para activar el core y evitar rebotes elásticos.',
      ],
      whyThisExercise:
        lang === 'en'
          ? `Calibrated for your registered weight (${weightKg} kg), height (${heightCm} cm), and size (${clothingSize}). Your Ectomorph somatotype thrives on front-loaded movements that build squat motor patterns while shielding the spine with ${suggestedWeight} kg.`
          : `Calibrado para tu peso registrado (${weightKg} kg), estatura (${heightCm} cm) y talla (${clothingSize}). Tu somatotipo Ectomorfo se beneficia de ejercicios con carga frontal que enseñan el patrón de sentadilla protegiendo la columna con ${suggestedWeight} kg.`,
      alternativeExercise:
        lang === 'en'
          ? `Flat Dumbbell Bench Press (3 sets x 10 reps @ ${Math.max(6, Math.round((suggestedWeight * 0.75) / 2) * 2)} kg)`
          : `Press Plano con Mancuernas (3 series x 10 reps @ ${Math.max(6, Math.round((suggestedWeight * 0.75) / 2) * 2)} kg)`,
    };
  }

  if (bodyType === 'Endomorfo') {
    // Endomorph: Focus on high metabolic recruitment, solid base, knee/hip stabilization
    const rawWeight = weightKg * 0.45 * structuralModifier;
    const suggestedWeight = Math.max(20, Math.round(rawWeight / 2.5) * 2.5);
    return {
      exerciseName: lang === 'en' ? 'Box Squat with 3-1-1 Tempo' : 'Sentadilla al Cajón (Box Squat) con Tempo 3-1-1',
      category: 'Piernas',
      targetMuscle: lang === 'en' ? 'Glutes, Hamstrings & Vaste Medialis' : 'Glúteos, Isquiotibiales y Vasto Medial',
      bmi,
      bmiCategory,
      suggestedWeightKg: suggestedWeight,
      sets: 4,
      reps: '10 - 12 reps',
      rpeTarget: lang === 'en' ? 'RPE 7.5 (2 reps in reserve)' : 'RPE 7.5 (2 repeticiones en recámara)',
      restSeconds: 75,
      biomechanicalCues: [
        lang === 'en'
          ? 'Control down for 3 seconds until lightly brushing the box without losing spinal tension.'
          : 'Desciende controlando el movimiento en 3 segundos hasta rozar el cajón sin perder tensión muscular.',
        ...leverCues,
        lang === 'en'
          ? 'Initiate explosive ascent by driving the entire foot surface into the floor.'
          : 'Inicia el ascenso explosivo empujando el suelo con toda la planta del pie.',
      ],
      whyThisExercise:
        lang === 'en'
          ? `Prescribed for your ${weightKg} kg bodyweight, ${heightCm} cm height, and size ${clothingSize} structure. The box squat with ${suggestedWeight} kg provides safe knee and lumbar joint stops while fueling high metabolic output.`
          : `Prescrito para tus ${weightKg} kg de peso, ${heightCm} cm y estructura talla ${clothingSize}. La sentadilla al cajón con ${suggestedWeight} kg proporciona un tope articular seguro para la rodilla y lumbar, mientras quema alta densidad energética.`,
      alternativeExercise:
        lang === 'en'
          ? `45° Incline Leg Press (4 sets x 12 reps @ ${Math.round((suggestedWeight * 2.2) / 5) * 5} kg)`
          : `Prensa Inclinada a 45° (4 series x 12 reps @ ${Math.round((suggestedWeight * 2.2) / 5) * 5} kg)`,
    };
  }

  // Mesomorfo (default)
  const rawWeight = weightKg * 0.58 * structuralModifier;
  const suggestedWeight = Math.max(25, Math.round(rawWeight / 2.5) * 2.5);
  return {
    exerciseName: lang === 'en' ? 'Classic Olympic Barbell Back Squat' : 'Sentadilla Trasera Clásica con Barra Olímpica',
    category: 'Piernas',
    targetMuscle: lang === 'en' ? 'Quadriceps, Posterior Chain & Spinal Erectors' : 'Cuádriceps, Cadena Posterior y Erector Espinal',
    bmi,
    bmiCategory,
    suggestedWeightKg: suggestedWeight,
    sets: 4,
    reps: '8 - 10 reps',
    rpeTarget: 'RPE 7.5 - 8.0',
    restSeconds: 120,
    biomechanicalCues: [
      lang === 'en'
        ? 'Rest the barbell securely across mid or low traps according to shoulder mobility.'
        : 'Apoya la barra firmemente sobre el trapecio medio o bajo según tu comodidad articular.',
      ...leverCues,
      lang === 'en'
        ? 'Apply the Valsalva maneuver before descent to generate rock-solid intra-abdominal bracing.'
        : 'Aplica maniobra de Valsalva antes de descender para generar presión intraabdominal blindada.',
    ],
    whyThisExercise:
      lang === 'en'
        ? `Precisely designed for your onboarding metrics: ${weightKg} kg, ${heightCm} cm, and size ${clothingSize}. Your Mesomorph somatotype possesses high neuromuscular recruitment and responds immediately to a ${suggestedWeight} kg baseline load.`
        : `Diseñado con exactitud para tus datos de registro: ${weightKg} kg, ${heightCm} cm y talla ${clothingSize}. Tu biotipo Mesomorfo cuenta con alta capacidad de reclutamiento neuromuscular y respuesta inmediata a la carga de ${suggestedWeight} kg.`,
    alternativeExercise:
      lang === 'en'
        ? `Romanian Barbell Deadlift (3 sets x 8 reps @ ${Math.round((suggestedWeight * 0.85) / 2.5) * 2.5} kg)`
        : `Peso Muerto Rumano con Barra (3 series x 8 reps @ ${Math.round((suggestedWeight * 0.85) / 2.5) * 2.5} kg)`,
  };
}
