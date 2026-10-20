/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Play,
  Plus,
  Tag,
  Search,
  Video,
  Youtube,
  ExternalLink,
  X,
  Flame,
  Shield,
  Check,
  Trash2,
  Dumbbell,
  Filter,
  ArrowLeft,
  Info,
  Sparkles,
  Camera,
  StopCircle,
  RotateCcw,
  Upload,
  Clock,
  Award,
  ChevronRight,
  Send,
  CheckCircle2,
  AlertCircle,
  Eye,
  Download,
  Share2,
  Maximize2,
  Sparkle,
} from 'lucide-react';
import { ScreenId, CommunityVideo, AthleteRecordedSubmission } from '../../types';
import { useApp } from '../../context/AppContext';
import { authService } from '../../services/authService';
import { UserAvatar } from '../common/UserAvatar';
import { ScrollReveal } from '../common/ScrollReveal';

interface ExerciseLibraryViewProps {
  onNavigate: (screen: ScreenId) => void;
}

type MuscleTag =
  | 'Todos'
  | 'Pecho'
  | 'Espalda'
  | 'Piernas'
  | 'Hombros'
  | 'Brazos'
  | 'Core'
  | 'Cardio'
  | 'Explosividad'
  | 'General';

const TAG_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Pecho: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  Espalda: { bg: 'bg-sky-500/15', text: 'text-sky-400', border: 'border-sky-500/30' },
  Piernas: { bg: 'bg-indigo-500/15', text: 'text-indigo-400', border: 'border-indigo-500/30' },
  Hombros: { bg: 'bg-purple-500/15', text: 'text-purple-400', border: 'border-purple-500/30' },
  Brazos: { bg: 'bg-pink-500/15', text: 'text-pink-400', border: 'border-pink-500/30' },
  Core: { bg: 'bg-teal-500/15', text: 'text-teal-400', border: 'border-teal-500/30' },
  Cardio: { bg: 'bg-rose-500/15', text: 'text-rose-400', border: 'border-rose-500/30' },
  Explosividad: { bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/30' },
  General: { bg: 'bg-neutral-500/15', text: 'text-neutral-400', border: 'border-neutral-500/30' },
};

// Robust YouTube ID extraction supporting standard watch URLs, youtu.be, shorts, and embeds
export function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  const match = trimmed.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/i
  );
  return match && match[1] ? match[1] : null;
}

// Normalize text removing accents for reliable comparison
function normalizeText(text: string): string {
  return (text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

// Thesaurus of fitness synonyms and muscle variants for intelligent search
const SYNONYM_DICTIONARY: Record<string, string[]> = {
  // Chest / Pectoral
  pecho: ['flexiones', 'lagartijas', 'push ups', 'pushups', 'press de banca', 'bench press', 'aperturas', 'fondos'],
  pectoral: ['flexiones', 'lagartijas', 'press de banca', 'pecho', 'aperturas'],
  lagartijas: ['flexiones', 'push ups', 'pushups', 'pecho', 'triceps', 'fondos', 'calistenia'],
  flexiones: ['lagartijas', 'push ups', 'pushups', 'pecho', 'triceps', 'fondos', 'calistenia'],
  pushup: ['flexiones', 'lagartijas', 'pecho', 'triceps'],
  pushups: ['flexiones', 'lagartijas', 'pecho', 'triceps'],
  'push ups': ['flexiones', 'lagartijas', 'pecho', 'triceps'],
  banca: ['press de banca', 'bench press', 'pecho', 'pectoral'],
  'press de banca': ['banca', 'bench press', 'pecho', 'pectoral'],

  // Arms / Triceps / Biceps
  brazo: ['biceps', 'triceps', 'curl', 'fondos', 'martillo', 'antebrazo', 'copa', 'extensiones'],
  brazos: ['biceps', 'triceps', 'curl', 'fondos', 'martillo', 'antebrazo', 'copa', 'extensiones'],
  biceps: ['curl', 'martillo', 'brazo', 'brazos', 'bicipital'],
  triceps: ['fondos', 'extensiones', 'copa', 'brazo', 'brazos', 'dips'],
  curl: ['biceps', 'brazo', 'brazos', 'mancuernas', 'martillo'],
  martillo: ['curl martillo', 'biceps', 'brazo', 'antebrazo'],
  fondos: ['dips', 'triceps', 'pecho', 'paralelas', 'brazo'],
  dips: ['fondos', 'triceps', 'pecho', 'paralelas'],

  // Legs / Glutes / Quads
  pierna: ['sentadilla', 'sentadillas', 'squat', 'zancadas', 'lunges', 'peso muerto', 'hip thrust', 'bulgara', 'gluteo', 'cuadriceps', 'isquios'],
  piernas: ['sentadilla', 'sentadillas', 'squat', 'zancadas', 'lunges', 'peso muerto', 'hip thrust', 'bulgara', 'gluteos', 'cuadriceps', 'isquios'],
  sentadilla: ['squat', 'pierna', 'piernas', 'cuadriceps', 'gluteos', 'bulgara', 'goblet'],
  sentadillas: ['squat', 'pierna', 'piernas', 'cuadriceps', 'gluteos', 'bulgara'],
  squat: ['sentadilla', 'sentadillas', 'pierna', 'cuadriceps'],
  bulgara: ['sentadilla bulgara', 'zancadas', 'pierna', 'gluteos', 'cuadriceps'],
  zancadas: ['lunges', 'estocadas', 'pierna', 'piernas', 'gluteos', 'cuadriceps'],
  lunges: ['zancadas', 'estocadas', 'pierna', 'gluteos'],
  estocadas: ['zancadas', 'lunges', 'pierna', 'gluteos'],
  gluteo: ['hip thrust', 'sentadilla', 'zancadas', 'peso muerto', 'bulgara', 'pierna'],
  gluteos: ['hip thrust', 'sentadilla', 'zancadas', 'peso muerto', 'bulgara', 'pierna'],
  'hip thrust': ['gluteos', 'cadera', 'pierna', 'empuje de cadera'],
  'peso muerto': ['deadlift', 'isquios', 'cadera', 'espalda', 'pierna', 'femoral'],
  deadlift: ['peso muerto', 'isquios', 'cadera', 'espalda', 'pierna'],

  // Back / Lats
  espalda: ['dominadas', 'pull ups', 'remo', 'dorsal', 'peso muerto', 'trapecio', 'jalon'],
  dorsal: ['dominadas', 'remo', 'espalda', 'jalon'],
  dominadas: ['pull ups', 'pullups', 'espalda', 'dorsal', 'calistenia'],
  'pull ups': ['dominadas', 'espalda', 'dorsal'],
  remo: ['espalda', 'dorsal', 'barbell row', 'mancuerna'],

  // Shoulders / Deltoids
  hombro: ['hombros', 'press militar', 'elevaciones laterales', 'deltoides', 'overhead press'],
  hombros: ['press militar', 'elevaciones laterales', 'deltoides', 'overhead press'],
  deltoides: ['hombro', 'hombros', 'press militar', 'elevaciones laterales'],
  'press militar': ['hombro', 'hombros', 'overhead press', 'deltoides'],
  'elevaciones laterales': ['hombro', 'hombros', 'deltoides lateral', 'vuelos'],

  // Core / Abdomen
  abdomen: ['abdominales', 'core', 'plancha', 'crunches', 'hollow body', 'rueda abdominal'],
  abdominales: ['abdomen', 'core', 'plancha', 'crunches', 'hollow body', 'rueda abdominal'],
  core: ['abdomen', 'abdominales', 'plancha', 'crunches', 'hollow body', 'rueda abdominal', 'isometria'],
  plancha: ['plank', 'core', 'abdomen', 'abdominales', 'isometria'],
  plank: ['plancha', 'core', 'abdomen', 'isometria'],
  crunches: ['abdominales', 'abdomen', 'core'],
  rueda: ['ab wheel', 'rueda abdominal', 'core', 'abdomen'],
  'rueda abdominal': ['ab wheel', 'rueda', 'core', 'abdomen'],

  // Cardio / Jumps / Explosiveness
  cardio: ['jumping jacks', 'saltos de tijera', 'skipping', 'burpees', 'resistencia', 'carrera'],
  salto: ['saltos de tijera', 'jumping jacks', 'skipping', 'salto al cajon', 'box jump', 'pliometria'],
  saltos: ['saltos de tijera', 'jumping jacks', 'skipping', 'salto al cajon', 'box jump', 'pliometria'],
  'jumping jacks': ['saltos de tijera', 'salto', 'cardio', 'calentamiento'],
  'saltos de tijera': ['jumping jacks', 'salto', 'cardio', 'calentamiento'],
  skipping: ['carrera en el sitio', 'rodillas arriba', 'cardio', 'calentamiento'],
  burpees: ['cardio', 'resistencia', 'full body', 'explosividad'],
  explosividad: ['salto al cajon', 'hang power clean', 'cargada', 'pliometria', 'box jump', 'potencia'],
  potencia: ['salto al cajon', 'hang power clean', 'cargada', 'explosividad', 'pliometria'],
};

// 20 High-Quality Verified Videos covering all requested exercises
const STARTER_VIDEOS: CommunityVideo[] = [
  {
    id: 'starter-vid-1',
    authorId: 'coach-carlos-id',
    authorName: 'Coach Carlos Rendón',
    authorRole: 'entrenador',
    title: 'Flexiones / Lagartijas (Push-Ups): Técnica Perfecta y Rango Completo',
    youtubeUrl: 'https://www.youtube.com/watch?v=IODxDxX7oi4',
    youtubeVideoId: 'IODxDxX7oi4',
    tag: 'Pecho',
    muscles: ['Pectoral mayor', 'Tríceps braquial', 'Deltoides anterior', 'Core'],
    synonyms: ['lagartijas', 'flexiones', 'pushups', 'push ups', 'pecho', 'planchas'],
    difficulty: 'Principiante',
    duration: '4:15 min',
    notes: 'Alinea muñecas bajo hombros, codos a 45° del torso, aprieta glúteos y desciende hasta rozar el suelo sin quebrar la cadera.',
    createdAt: '2026-10-01T10:00:00Z',
  },
  {
    id: 'starter-vid-2',
    authorId: 'coach-mateo-id',
    authorName: 'Coach Mateo Gómez',
    authorRole: 'entrenador',
    title: 'Press de Banca Plano: Retracción Escapular y Trayectoria Óptima',
    youtubeUrl: 'https://www.youtube.com/watch?v=rT7DgCr-3pg',
    youtubeVideoId: 'rT7DgCr-3pg',
    tag: 'Pecho',
    muscles: ['Pectoral mayor', 'Tríceps', 'Deltoides anterior'],
    synonyms: ['press de banca', 'bench press', 'pecho', 'pectoral', 'banca'],
    difficulty: 'Intermedio',
    duration: '6:30 min',
    notes: 'Claves: retracción y depresión escapular activas en el banco, codos a 45° y leg drive firme empujando el suelo con los talones.',
    createdAt: '2026-10-02T14:30:00Z',
  },
  {
    id: 'starter-vid-3',
    authorId: 'coach-carlos-id',
    authorName: 'Coach Carlos Rendón',
    authorRole: 'entrenador',
    title: 'Abdominales y Crunches: Activación sin Tensión en el Cuello',
    youtubeUrl: 'https://www.youtube.com/watch?v=Xyd_fa5zoEU',
    youtubeVideoId: 'Xyd_fa5zoEU',
    tag: 'Core',
    muscles: ['Recto abdominal', 'Oblicuos'],
    synonyms: ['abdominales', 'crunches', 'abdomen', 'core', 'vientre plano'],
    difficulty: 'Principiante',
    duration: '3:50 min',
    notes: 'Flexiona desde el esternón hacia el pubis contrayendo el abdomen; mantén la mirada en diagonal hacia arriba para proteger cervicales.',
    createdAt: '2026-10-03T09:15:00Z',
  },
  {
    id: 'starter-vid-4',
    authorId: 'ath-julian-id',
    authorName: 'Julián Castro',
    authorRole: 'atleta',
    title: 'Plancha Abdominal Isométrica: Tensión Global y Postura Recta',
    youtubeUrl: 'https://www.youtube.com/watch?v=ASdvN_XEl_c',
    youtubeVideoId: 'ASdvN_XEl_c',
    tag: 'Core',
    muscles: ['Transverso abdominal', 'Recto abdominal', 'Glúteos', 'Serrato'],
    synonyms: ['plancha', 'plank', 'core', 'abdomen', 'isometria'],
    difficulty: 'Principiante',
    duration: '3:20 min',
    notes: 'Retroversión pélvica activa (mete la pelvis hacia adentro), empuja los codos contra el piso y aprieta cuádriceps al máximo.',
    createdAt: '2026-10-04T11:45:00Z',
  },
  {
    id: 'starter-vid-5',
    authorId: 'coach-mateo-id',
    authorName: 'Coach Mateo Gómez',
    authorRole: 'entrenador',
    title: 'Rueda Abdominal (Ab Wheel Rollout): Control Anti-Extensión',
    youtubeUrl: 'https://www.youtube.com/watch?v=rqiTPdK1cWg',
    youtubeVideoId: 'rqiTPdK1cWg',
    tag: 'Core',
    muscles: ['Pared abdominal profunda', 'Dorsal ancho', 'Pectoral'],
    synonyms: ['rueda', 'ab wheel', 'abdominales', 'core', 'anti-extension'],
    difficulty: 'Avanzado',
    duration: '5:10 min',
    notes: 'No dejes caer la zona lumbar. Si sientes dolor en la espalda baja, acorta el rango hasta fortalecer la pared abdominal anterior.',
    createdAt: '2026-10-05T16:20:00Z',
  },
  {
    id: 'starter-vid-6',
    authorId: 'coach-carlos-id',
    authorName: 'Coach Carlos Rendón',
    authorRole: 'entrenador',
    title: 'Fondos en Paralelas / Banco para Tríceps (Dips)',
    youtubeUrl: 'https://www.youtube.com/watch?v=2z8JmcrW-As',
    youtubeVideoId: '2z8JmcrW-As',
    tag: 'Brazos',
    muscles: ['Tríceps braquial', 'Pectoral inferior', 'Deltoides anterior'],
    synonyms: ['fondos', 'dips', 'triceps', 'tríceps', 'brazo', 'brazos'],
    difficulty: 'Intermedio',
    duration: '4:45 min',
    notes: 'Torso erguido para enfatizar tríceps; desciende hasta 90° en codos y extiende sin hiperextender bruscamente la articulación.',
    createdAt: '2026-10-06T08:00:00Z',
  },
  {
    id: 'starter-vid-7',
    authorId: 'ath-santiago-id',
    authorName: 'Santiago Vélez',
    authorRole: 'atleta',
    title: 'Extensión de Tríceps en Polea / Copa con Mancuerna',
    youtubeUrl: 'https://www.youtube.com/watch?v=6SS6K3lAwZ8',
    youtubeVideoId: '6SS6K3lAwZ8',
    tag: 'Brazos',
    muscles: ['Cabeza larga del tríceps', 'Vasto lateral'],
    synonyms: ['copa', 'extension de triceps', 'triceps', 'tríceps', 'brazo', 'brazos'],
    difficulty: 'Principiante',
    duration: '4:00 min',
    notes: 'Mantén los codos cerrados y fijos cerca de las orejas. Controla la fase excéntrica en 2 segundos completos.',
    createdAt: '2026-10-07T13:30:00Z',
  },
  {
    id: 'starter-vid-8',
    authorId: 'coach-carlos-id',
    authorName: 'Coach Carlos Rendón',
    authorRole: 'entrenador',
    title: 'Curl de Bíceps con Mancuerna: Supinación Estricta y Codos Fijos',
    youtubeUrl: 'https://www.youtube.com/watch?v=ykJmrZ5v0Oo',
    youtubeVideoId: 'ykJmrZ5v0Oo',
    tag: 'Brazos',
    muscles: ['Bíceps braquial', 'Braquiorradial'],
    synonyms: ['curl', 'biceps', 'bíceps', 'brazo', 'brazos', 'mancuernas'],
    difficulty: 'Principiante',
    duration: '4:30 min',
    notes: 'Inicia con agarre neutro y supina la muñeca conforme sube la mancuerna. No uses balanceo con la espalda.',
    createdAt: '2026-10-08T10:10:00Z',
  },
  {
    id: 'starter-vid-9',
    authorId: 'coach-mateo-id',
    authorName: 'Coach Mateo Gómez',
    authorRole: 'entrenador',
    title: 'Curl Martillo (Hammer Curl): Grosor de Brazo y Antebrazo',
    youtubeUrl: 'https://www.youtube.com/watch?v=zC3nLlEvin4',
    youtubeVideoId: 'zC3nLlEvin4',
    tag: 'Brazos',
    muscles: ['Braquial anterior', 'Braquiorradial', 'Bíceps'],
    synonyms: ['martillo', 'curl martillo', 'biceps', 'brazo', 'brazos', 'antebrazo'],
    difficulty: 'Principiante',
    duration: '3:45 min',
    notes: 'Palmas enfrentadas en todo el recorrido. Excelente para dar grosor al brazo y proteger los tendones del codo.',
    createdAt: '2026-10-09T15:20:00Z',
  },
  {
    id: 'starter-vid-10',
    authorId: 'ath-julian-id',
    authorName: 'Julián Castro',
    authorRole: 'atleta',
    title: 'Saltos de Tijera (Jumping Jacks): Ritmo, Amortiguación y Cardio',
    youtubeUrl: 'https://www.youtube.com/watch?v=iSSAk4XCsRA',
    youtubeVideoId: 'iSSAk4XCsRA',
    tag: 'Cardio',
    muscles: ['Pantorrillas', 'Deltoides', 'Core', 'Sistema cardiovascular'],
    synonyms: ['jumping jacks', 'saltos de tijera', 'salto', 'saltos', 'cardio', 'calentamiento'],
    difficulty: 'Principiante',
    duration: '3:00 min',
    notes: 'Aterriza sobre las puntas de los pies con rodillas ligeramente flexionadas para proteger las articulaciones.',
    createdAt: '2026-10-10T08:45:00Z',
  },
  {
    id: 'starter-vid-11',
    authorId: 'coach-carlos-id',
    authorName: 'Coach Carlos Rendón',
    authorRole: 'entrenador',
    title: 'Skipping Alto en el Sitio: Coordinación, Braceo y Reactividad',
    youtubeUrl: 'https://www.youtube.com/watch?v=8opcQd9V3F8',
    youtubeVideoId: '8opcQd9V3F8',
    tag: 'Cardio',
    muscles: ['Flexores de cadera', 'Cuádriceps', 'Gemelos', 'Core'],
    synonyms: ['skipping', 'carrera en el sitio', 'rodillas arriba', 'cardio', 'calentamiento'],
    difficulty: 'Principiante',
    duration: '3:30 min',
    notes: 'Eleva rodillas a 90° con dorsiflexión de tobillo (punta del pie apuntando arriba) y braceo coordinado desde los hombros.',
    createdAt: '2026-10-11T12:00:00Z',
  },
  {
    id: 'starter-vid-12',
    authorId: 'coach-mateo-id',
    authorName: 'Coach Mateo Gómez',
    authorRole: 'entrenador',
    title: 'Sentadilla Libre y Profunda (Squat): Técnica, Profundidad y Bracing',
    youtubeUrl: 'https://www.youtube.com/watch?v=bEv6CCg2BC8',
    youtubeVideoId: 'bEv6CCg2BC8',
    tag: 'Piernas',
    muscles: ['Cuádriceps', 'Glúteo mayor', 'Isquiotibiales', 'Erectores'],
    synonyms: ['sentadilla', 'sentadillas', 'squat', 'pierna', 'piernas', 'cuadriceps', 'gluteo'],
    difficulty: 'Intermedio',
    duration: '7:20 min',
    notes: 'Presión intraabdominal activa (maniobra de Valsalva), rompe el paralelo con caderas bajo rodillas y empuja el piso con todo el pie.',
    createdAt: '2026-10-12T09:30:00Z',
  },
  {
    id: 'starter-vid-13',
    authorId: 'ath-santiago-id',
    authorName: 'Santiago Vélez',
    authorRole: 'atleta',
    title: 'Sentadilla Búlgara: Enfoque en Glúteos y Cuádriceps sin Dolor',
    youtubeUrl: 'https://www.youtube.com/watch?v=2C-uNgKwPLE',
    youtubeVideoId: '2C-uNgKwPLE',
    tag: 'Piernas',
    muscles: ['Glúteo mayor', 'Cuádriceps', 'Estabilizadores de cadera'],
    synonyms: ['bulgara', 'búlgara', 'sentadilla bulgara', 'pierna', 'gluteo', 'piernas'],
    difficulty: 'Intermedio',
    duration: '5:45 min',
    notes: 'Inclina el torso 15° hacia adelante para mayor activación de glúteo; mantén el pie delantero apoyado firme.',
    createdAt: '2026-10-13T14:15:00Z',
  },
  {
    id: 'starter-vid-14',
    authorId: 'coach-carlos-id',
    authorName: 'Coach Carlos Rendón',
    authorRole: 'entrenador',
    title: 'Zancadas / Lunges Caminando: Estabilidad y Paso Equilibrado',
    youtubeUrl: 'https://www.youtube.com/watch?v=QOVaHwm-Q6U',
    youtubeVideoId: 'QOVaHwm-Q6U',
    tag: 'Piernas',
    muscles: ['Cuádriceps', 'Glúteos', 'Isquiosurales'],
    synonyms: ['zancadas', 'lunges', 'estocadas', 'pierna', 'piernas', 'gluteo'],
    difficulty: 'Principiante',
    duration: '4:50 min',
    notes: 'Paso largo formando ángulos de 90° en ambas rodillas; no permitas que la rodilla delantera colapse hacia adentro.',
    createdAt: '2026-10-14T11:00:00Z',
  },
  {
    id: 'starter-vid-15',
    authorId: 'coach-mateo-id',
    authorName: 'Coach Mateo Gómez',
    authorRole: 'entrenador',
    title: 'Hip Thrust con Barra: Máxima Torsión y Contracción de Glúteos',
    youtubeUrl: 'https://www.youtube.com/watch?v=SEdqd1n0cvg',
    youtubeVideoId: 'SEdqd1n0cvg',
    tag: 'Piernas',
    muscles: ['Glúteo mayor', 'Isquiosurales', 'Aductores'],
    synonyms: ['hip thrust', 'empuje de cadera', 'gluteo', 'glúteo', 'gluteos', 'pierna', 'piernas'],
    difficulty: 'Intermedio',
    duration: '6:15 min',
    notes: 'Banco justo bajo las escápulas; mira al frente (barbilla pegada al pecho) y bloquea la pelvis arriba durante 1 segundo.',
    createdAt: '2026-10-15T08:20:00Z',
  },
  {
    id: 'starter-vid-16',
    authorId: 'coach-carlos-id',
    authorName: 'Coach Carlos Rendón',
    authorRole: 'entrenador',
    title: 'Dominadas Pronas Estrictas (Pull-Ups): Activación Dorsal',
    youtubeUrl: 'https://www.youtube.com/watch?v=eGo4IYlbE5g',
    youtubeVideoId: 'eGo4IYlbE5g',
    tag: 'Espalda',
    muscles: ['Dorsal ancho', 'Redondo mayor', 'Bíceps', 'Trapecio inferior'],
    synonyms: ['dominadas', 'pull ups', 'pullups', 'espalda', 'dorsal', 'calistenia'],
    difficulty: 'Avanzado',
    duration: '5:00 min',
    notes: 'Inicia el movimiento deprimiendo las escápulas antes de flexionar los codos; supera la barra con la barbilla sin encoger el cuello.',
    createdAt: '2026-10-16T10:45:00Z',
  },
  {
    id: 'starter-vid-17',
    authorId: 'ath-julian-id',
    authorName: 'Julián Castro',
    authorRole: 'atleta',
    title: 'Remo con Barra Inclinado (Barbell Row): Densidad de Espalda',
    youtubeUrl: 'https://www.youtube.com/watch?v=FWJR5Ve8gkQ',
    youtubeVideoId: 'FWJR5Ve8gkQ',
    tag: 'Espalda',
    muscles: ['Dorsal ancho', 'Romboides', 'Trapecio medio', 'Bíceps'],
    synonyms: ['remo', 'remo con barra', 'barbell row', 'espalda', 'dorsal'],
    difficulty: 'Intermedio',
    duration: '5:30 min',
    notes: 'Torso a 45°, espalda neutra, jala la barra hacia el ombligo llevando los codos pegados al cuerpo.',
    createdAt: '2026-10-17T15:00:00Z',
  },
  {
    id: 'starter-vid-18',
    authorId: 'coach-mateo-id',
    authorName: 'Coach Mateo Gómez',
    authorRole: 'entrenador',
    title: 'Peso Muerto Convencional (Deadlift): Bisagra de Cadera Segura',
    youtubeUrl: 'https://www.youtube.com/watch?v=op9kVnSso6Q',
    youtubeVideoId: 'op9kVnSso6Q',
    tag: 'Piernas',
    muscles: ['Isquiosurales', 'Glúteos', 'Erectores espinales', 'Trapecio'],
    synonyms: ['peso muerto', 'deadlift', 'isquios', 'cadera', 'espalda', 'pierna', 'femoral'],
    difficulty: 'Avanzado',
    duration: '7:50 min',
    notes: 'Barra pegada a las tibias en el despegue, empuja el suelo como si fuera una prensa y bloquea cadera sin hiperextender la zona lumbar.',
    createdAt: '2026-10-18T09:00:00Z',
  },
  {
    id: 'starter-vid-19',
    authorId: 'coach-carlos-id',
    authorName: 'Coach Carlos Rendón',
    authorRole: 'entrenador',
    title: 'Press Militar de Hombros con Barra Olímpica (Overhead Press)',
    youtubeUrl: 'https://www.youtube.com/watch?v=2yjwXTZQDDI',
    youtubeVideoId: '2yjwXTZQDDI',
    tag: 'Hombros',
    muscles: ['Deltoides anterior', 'Deltoides lateral', 'Tríceps', 'Core'],
    synonyms: ['press militar', 'overhead press', 'hombro', 'hombros', 'deltoides'],
    difficulty: 'Intermedio',
    duration: '6:00 min',
    notes: 'Aprieta glúteos y abdomen para mantener la columna rígida; empuja la barra verticalmente y mete la cabeza una vez pase la frente.',
    createdAt: '2026-10-19T13:40:00Z',
  },
  {
    id: 'starter-vid-20',
    authorId: 'ath-santiago-id',
    authorName: 'Santiago Vélez',
    authorRole: 'atleta',
    title: 'Elevaciones Laterales con Mancuerna: Aislamiento del Deltoides',
    youtubeUrl: 'https://www.youtube.com/watch?v=3VcKaXpzqRo',
    youtubeVideoId: '3VcKaXpzqRo',
    tag: 'Hombros',
    muscles: ['Deltoides lateral', 'Supraespinoso'],
    synonyms: ['elevaciones laterales', 'vuelos', 'hombro', 'hombros', 'deltoides lateral'],
    difficulty: 'Principiante',
    duration: '4:20 min',
    notes: 'Mueve los brazos en el plano escapular (30° hacia adelante del torso), lidera con los codos y detén el movimiento a la altura de los hombros.',
    createdAt: '2026-10-20T11:15:00Z',
  },
  {
    id: 'starter-vid-21',
    authorId: 'coach-mateo-id',
    authorName: 'Coach Mateo Gómez',
    authorRole: 'entrenador',
    title: 'Salto al Cajón Pliométrico: Reactividad Elástica & Explosividad',
    youtubeUrl: 'https://www.youtube.com/watch?v=52d43l87j74',
    youtubeVideoId: '52d43l87j74',
    tag: 'Explosividad',
    muscles: ['Cadena posterior', 'Extensores de rodilla', 'Tobillos'],
    synonyms: ['salto al cajon', 'box jump', 'pliometria', 'explosividad', 'potencia', 'salto', 'saltos'],
    difficulty: 'Intermedio',
    duration: '4:40 min',
    notes: 'Enfoque en tiempo de contacto mínimo con el suelo y aterrizaje suave absorbiendo el impacto con las caderas hacia atrás.',
    createdAt: '2026-10-20T11:30:00Z',
  },
  {
    id: 'starter-vid-22',
    authorId: 'coach-carlos-id',
    authorName: 'Coach Carlos Rendón',
    authorRole: 'entrenador',
    title: 'Burpees Completos: Técnica Eficiente y Gasto Metabólico',
    youtubeUrl: 'https://www.youtube.com/watch?v=dZgVxmf6jkA',
    youtubeVideoId: 'dZgVxmf6jkA',
    tag: 'Cardio',
    muscles: ['Cuerpo completo', 'Pared torácica', 'Flexores de cadera'],
    synonyms: ['burpees', 'burpee', 'cardio', 'resistencia', 'full body', 'explosividad'],
    difficulty: 'Principiante',
    duration: '3:40 min',
    notes: 'Baja apoyando las manos firmes, pecho al piso de manera controlada y salta aplaudiendo tras la cabeza con el cuerpo extendido.',
    createdAt: '2026-10-20T11:45:00Z',
  },
];

// Initial mock coach review submissions to showcase athlete recording review history
const INITIAL_SUBMISSIONS: AthleteRecordedSubmission[] = [
  {
    id: 'sub-demo-1',
    athleteId: 'demo-ath-1',
    athleteName: 'Mateo Gómez',
    athleteRole: 'atleta',
    exerciseTitle: 'Sentadilla Libre Profunda',
    muscleGroup: 'Piernas',
    notes: 'Revisión de mi profundidad y si estoy inclinando demasiado el torso hacia adelante en la serie pesada.',
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    status: 'approved',
    coachFeedback: {
      coachName: 'Coach Carlos Rendón',
      coachRole: 'entrenador',
      comment: '¡Excelente profundidad! Rompiste el paralelo limpiamente. Solo cuida empujar las rodillas ligeramente hacia afuera en el despegue inicial para maximizar el reclutamiento del glúteo medio.',
      score: 9.5,
      reviewedAt: new Date(Date.now() - 3600000 * 18).toISOString(),
    },
  },
  {
    id: 'sub-demo-2',
    athleteId: 'demo-ath-2',
    athleteName: 'Mateo Gómez',
    athleteRole: 'atleta',
    exerciseTitle: 'Flexiones / Lagartijas Estrictas',
    muscleGroup: 'Pecho',
    notes: 'Quiero confirmar si la alineación de mis codos está a 45 grados y si no estoy arqueando la espalda baja.',
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    status: 'reviewed',
    coachFeedback: {
      coachName: 'Coach Mateo Gómez',
      coachRole: 'entrenador',
      comment: 'Muy buena estabilidad del core. Para la próxima serie intenta pausar 1 segundo con el pecho a 2 cm del suelo antes de empujar con máxima potencia.',
      score: 8.8,
      reviewedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    },
  },
];

export const ExerciseLibraryView: React.FC<ExerciseLibraryViewProps> = ({ onNavigate }) => {
  const { user, language, theme } = useApp();
  const isDark = theme === 'dark';

  // Navigation tab: 'tutorials' | 'record'
  const [activeTab, setActiveTab] = useState<'tutorials' | 'record'>('tutorials');

  // Video guides state
  const [videos, setVideos] = useState<CommunityVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTag, setSelectedTag] = useState<MuscleTag>('Todos');
  const [searchQuery, setSearchQuery] = useState('');

  // Active playing video modal
  const [activePlayingVideo, setActivePlayingVideo] = useState<CommunityVideo | null>(null);

  // Modal for publishing community video
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [titleInput, setTitleInput] = useState('');
  const [youtubeUrlInput, setYoutubeUrlInput] = useState('');
  const [tagInput, setTagInput] = useState<Exclude<MuscleTag, 'Todos'>>('Pecho');
  const [notesInput, setNotesInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // ==========================================
  // ATHLETE RECORDING & SHARING STATE
  // ==========================================
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  // Recording form metadata
  const [recordExerciseTitle, setRecordExerciseTitle] = useState('');
  const [recordMuscleGroup, setRecordMuscleGroup] = useState<MuscleTag>('Piernas');
  const [recordNotes, setRecordNotes] = useState('');
  const [isSavingSubmission, setIsSavingSubmission] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);

  // Athlete submissions list
  const [submissions, setSubmissions] = useState<AthleteRecordedSubmission[]>(() => {
    try {
      const saved = localStorage.getItem('sportfitness_athlete_recordings');
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_SUBMISSIONS;
  });

  const videoPreviewRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load videos on mount
  useEffect(() => {
    let isMounted = true;
    async function loadVideos() {
      setLoading(true);
      try {
        const remoteVideos = await authService.getCommunityVideos();
        if (isMounted) {
          if (remoteVideos.length > 0) {
            const combinedMap = new Map<string, CommunityVideo>();
            STARTER_VIDEOS.forEach((v) => combinedMap.set(v.id, v));
            remoteVideos.forEach((v) => combinedMap.set(v.id, v));
            setVideos(Array.from(combinedMap.values()));
          } else {
            setVideos(STARTER_VIDEOS);
          }
        }
      } catch (err) {
        if (isMounted) setVideos(STARTER_VIDEOS);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadVideos();
    return () => {
      isMounted = false;
    };
  }, []);

  // Save submissions to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('sportfitness_athlete_recordings', JSON.stringify(submissions));
    } catch {}
  }, [submissions]);

  // Clean up camera stream when leaving tab or unmounting
  useEffect(() => {
    return () => {
      stopCameraStream();
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, []);

  // ==========================================
  // SMART REAL-TIME SEARCH WITH SYNONYMS
  // ==========================================
  const filteredVideos = useMemo(() => {
    const rawSearch = normalizeText(searchQuery);

    if (!rawSearch && selectedTag === 'Todos') {
      return videos;
    }

    // Expand search keywords with synonym dictionary
    const expandedTokens: string[] = [rawSearch];
    if (rawSearch) {
      // Check full phrase
      if (SYNONYM_DICTIONARY[rawSearch]) {
        expandedTokens.push(...SYNONYM_DICTIONARY[rawSearch].map(normalizeText));
      }
      // Check individual words
      const words = rawSearch.split(/\s+/).filter(Boolean);
      words.forEach((w) => {
        expandedTokens.push(w);
        if (SYNONYM_DICTIONARY[w]) {
          expandedTokens.push(...SYNONYM_DICTIONARY[w].map(normalizeText));
        }
      });
    }

    return videos.filter((video) => {
      // Tag filter
      const matchesTag = selectedTag === 'Todos' || video.tag === selectedTag;
      if (!matchesTag) return false;

      if (!rawSearch) return true;

      // Text elements to test against
      const normTitle = normalizeText(video.title);
      const normTag = normalizeText(video.tag);
      const normNotes = normalizeText(video.notes || '');
      const normMuscles = (video.muscles || []).map(normalizeText).join(' ');
      const normSynonyms = (video.synonyms || []).map(normalizeText).join(' ');
      const allText = `${normTitle} ${normTag} ${normNotes} ${normMuscles} ${normSynonyms}`;

      // Test direct substring match first
      if (allText.includes(rawSearch)) return true;

      // Test any expanded synonym token
      return expandedTokens.some((tok) => tok.length > 2 && allText.includes(tok));
    });
  }, [videos, selectedTag, searchQuery]);

  // Handle publishing a new community video
  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!titleInput.trim()) {
      setFormError(language === 'en' ? 'Please enter an exercise title.' : 'Ingresa el título del ejercicio.');
      return;
    }

    const videoId = extractYouTubeId(youtubeUrlInput);
    if (!videoId) {
      setFormError(
        language === 'en'
          ? 'Please enter a valid YouTube link (e.g., https://youtu.be/... or https://youtube.com/shorts/...)'
          : 'Ingresa un enlace válido de YouTube (Ej: https://youtu.be/... o https://youtube.com/shorts/...)'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await authService.publishCommunityVideo({
        authorId: user.id,
        authorName: user.name || (user.role === 'entrenador' ? 'Coach' : 'Atleta'),
        authorRole: user.role,
        authorCustomAvatar: user.customAvatar,
        title: titleInput.trim(),
        youtubeUrl: youtubeUrlInput.trim(),
        youtubeVideoId: videoId,
        tag: tagInput,
        notes: notesInput.trim(),
      });

      if (res.success && res.video) {
        setVideos((prev) => [res.video!, ...prev]);
        setShowPublishModal(false);
        setTitleInput('');
        setYoutubeUrlInput('');
        setNotesInput('');
        setTagInput('Pecho');
      } else {
        setFormError(res.error || 'Error al guardar el video en la base de datos.');
      }
    } catch (err: any) {
      setFormError(err?.message || 'Error al publicar el video guía.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteVideo = async (videoId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const confirmMsg =
      language === 'en'
        ? 'Are you sure you want to remove this video guide?'
        : '¿Estás seguro de que deseas eliminar este video guía?';
    if (!window.confirm(confirmMsg)) return;

    try {
      await authService.deleteCommunityVideo(videoId);
      setVideos((prev) => prev.filter((v) => v.id !== videoId));
    } catch (err) {
      console.error('Delete video note:', err);
    }
  };

  // ==========================================
  // WEBRTC CAMERA & MEDIA RECORDER HANDLERS
  // ==========================================
  const startCameraStream = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Tu navegador no soporta captura de cámara directa (MediaDevices API).');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
        audio: true,
      });

      mediaStreamRef.current = stream;
      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = stream;
        videoPreviewRef.current.play().catch(() => {});
      }
      setIsCameraActive(true);
    } catch (err: any) {
      console.warn('Camera access note:', err);
      setCameraError(
        err.name === 'NotAllowedError'
          ? (language === 'en' ? 'Camera permission was denied. Please allow camera access in your browser settings.' : 'Permiso de cámara denegado. Permite el acceso a la cámara en la barra de tu navegador.')
          : (language === 'en' ? 'Unable to access camera or microphone.' : 'No se pudo iniciar la cámara web o micrófono. Puedes subir un video grabado desde tu dispositivo.')
      );
      setIsCameraActive(false);
    }
  };

  const stopCameraStream = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (videoPreviewRef.current) {
      videoPreviewRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const startRecording = () => {
    if (!mediaStreamRef.current) return;
    recordedChunksRef.current = [];
    setRecordedVideoUrl(null);
    setRecordedBlob(null);

    try {
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : MediaRecorder.isTypeSupported('video/webm')
        ? 'video/webm'
        : 'video/mp4';

      const recorder = new MediaRecorder(mediaStreamRef.current, { mimeType });
      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const fullBlob = new Blob(recordedChunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(fullBlob);
        setRecordedBlob(fullBlob);
        setRecordedVideoUrl(url);
        stopCameraStream();
      };

      mediaRecorderRef.current = recorder;
      recorder.start(1000); // 1s slice
      setIsRecording(true);
      setRecordingSeconds(0);

      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      setCameraError('Error al iniciar el grabador de video: ' + (err.message || err));
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  };

  // Handle file upload alternative
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setRecordedVideoUrl(url);
    setRecordedBlob(file);
    setUploadedFileName(file.name);
    setRecordExerciseTitle(file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '));
  };

  // Submit recorded/uploaded video for coach feedback
  const handleSaveRecordedSubmission = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recordExerciseTitle.trim()) return;

    setIsSavingSubmission(true);

    const submissionId = `sub-${Date.now()}`;
    const newSubmission: AthleteRecordedSubmission = {
      id: submissionId,
      athleteId: user.id,
      athleteName: user.name || 'Atleta',
      athleteRole: user.role,
      exerciseTitle: recordExerciseTitle.trim(),
      muscleGroup: recordMuscleGroup,
      videoUrl: recordedVideoUrl || undefined,
      videoBlobSize: recordedBlob ? recordedBlob.size : undefined,
      notes: recordNotes.trim() || 'Grabación en vivo para revisión técnica biomecánica.',
      createdAt: new Date().toISOString(),
      status: 'pending',
      // Automated coach evaluation simulation based on exercise
      coachFeedback: {
        coachName: 'Coach Carlos Rendón',
        coachRole: 'entrenador',
        comment: `Video recibido exitosamente. Buena iniciativa registrando tu ${recordExerciseTitle}. Tu entrenador revisará la trayectoria de la barra, estabilidad del core y alineación de articulaciones en breve.`,
        score: 9.0,
        reviewedAt: new Date(Date.now() + 60000).toISOString(),
      },
    };

    setTimeout(() => {
      setSubmissions((prev) => [newSubmission, ...prev]);
      setIsSavingSubmission(false);
      setSubmissionSuccess(true);
      setRecordedVideoUrl(null);
      setRecordedBlob(null);
      setUploadedFileName(null);
      setRecordExerciseTitle('');
      setRecordNotes('');

      setTimeout(() => {
        setSubmissionSuccess(false);
      }, 4000);
    }, 700);
  };

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const tagsList: MuscleTag[] = [
    'Todos',
    'Pecho',
    'Espalda',
    'Piernas',
    'Hombros',
    'Brazos',
    'Core',
    'Cardio',
    'Explosividad',
  ];

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-left">
      {/* ========================================== */}
      {/* TOP HEADER & SECTION NAVIGATION            */}
      {/* ========================================== */}
      <ScrollReveal direction="down" duration={0.35}>
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-6 border-b border-[#20202A]">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#56A867]/15 border border-[#56A867]/30 text-[#56A867] text-xs font-mono font-bold uppercase tracking-wider mb-2">
              <Youtube className="w-4 h-4 text-red-500" />
              <span>{language === 'en' ? 'Training Videos & Tutorials' : 'Videos de Entrenamiento y Tutoriales'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-tight">
              {language === 'en' ? 'Exercise Video Library & Live Technique Recording' : 'Videos de Entrenamiento & Grabación de Técnica'}
            </h1>
            <p className="text-xs sm:text-sm text-neutral-300 max-w-2xl mt-1 leading-relaxed">
              {language === 'en'
                ? 'Explore HD video tutorials for every muscle group, search with smart synonyms, or record your own form using your device camera for coach feedback.'
                : 'Explora tutoriales guiados en video para cada grupo muscular, busca por sinónimos o graba tu propia ejecución en vivo con tu cámara para recibir revisión de tu entrenador.'}
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={() => onNavigate(user.role === 'entrenador' ? 'trainer-overview' : 'athlete-dashboard')}
              className="px-3.5 py-2.5 rounded-xl bg-[#161620] hover:bg-[#1E1E2C] text-neutral-300 hover:text-white border border-[#2A2A38] text-xs font-mono transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{language === 'en' ? 'Back to Dashboard' : 'Volver al Panel'}</span>
            </button>

            <button
              onClick={() => {
                setShowPublishModal(true);
                setFormError('');
              }}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-[#56A867] hover:bg-[#64B875] text-black font-bold text-xs uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(86,168,103,0.3)] hover:shadow-[0_0_25px_rgba(86,168,103,0.45)] flex items-center justify-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{language === 'en' ? 'Add YouTube Video' : 'Añadir Video Guía'}</span>
            </button>
          </div>
        </div>
      </ScrollReveal>

      {/* ========================================== */}
      {/* TABS: TUTORIALS vs GRABA TU RUTINA         */}
      {/* ========================================== */}
      <div className="flex items-center gap-3 border-b border-[#222230] pb-2">
        <button
          onClick={() => setActiveTab('tutorials')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'tutorials'
              ? 'bg-[#56A867] text-black shadow-lg shadow-[#56A867]/25'
              : 'bg-[#14141E] text-neutral-300 hover:text-white hover:bg-[#1C1C2A] border border-[#252535]'
          }`}
        >
          <Video className="w-4 h-4" />
          <span>{language === 'en' ? 'Tutorials & Exercise Library' : 'Biblioteca de Tutoriales (YouTube)'}</span>
          <span className="px-1.5 py-0.2 rounded bg-black/20 text-[10px]">
            {filteredVideos.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('record')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer relative ${
            activeTab === 'record'
              ? 'bg-[#56A867] text-black shadow-lg shadow-[#56A867]/25'
              : 'bg-[#14141E] text-neutral-300 hover:text-white hover:bg-[#1C1C2A] border border-[#252535]'
          }`}
        >
          <Camera className="w-4 h-4" />
          <span>{language === 'en' ? 'Record Your Routine / Share Execution' : 'Graba tu rutina / Comparte tu ejecución'}</span>
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
          </span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: TUTORIALS & VIDEO LIBRARY (WITH SMART SEARCH)                       */}
      {/* ========================================================================= */}
      {activeTab === 'tutorials' && (
        <div className="space-y-6">
          {/* Smart Search Bar & Quick Tags */}
          <ScrollReveal direction="up" delay={0.05} duration={0.35}>
            <div className="space-y-3 p-4 sm:p-5 rounded-2xl bg-[#121218] border border-[#20202C]">
              {/* Main Search Input */}
              <div className="relative">
                <Search className="w-5 h-5 text-[#56A867] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={
                    language === 'en'
                      ? 'Smart search: Try "flexiones", "lagartijas", "brazo", "tríceps", "sentadillas", "jumping jacks", "abdomen"...'
                      : 'Buscador inteligente: Escribe "flexiones", "lagartijas", "brazo", "tríceps", "sentadillas", "saltos", "core"...'
                  }
                  className="w-full pl-11 pr-10 py-3 rounded-xl bg-[#161622] border border-[#28283C] text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-[#56A867] transition-all font-mono"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Quick Suggestion Chips */}
              <div className="flex items-center gap-1.5 flex-wrap text-[11px] font-mono text-neutral-400 pt-1">
                <span className="text-neutral-500 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-[#56A867]" />
                  {language === 'en' ? 'Quick Searches:' : 'Búsquedas Rápidas:'}
                </span>
                {['Flexiones', 'Lagartijas', 'Tríceps', 'Bíceps', 'Sentadillas', 'Saltos de tijera', 'Skipping', 'Core', 'Press de banca'].map((chip) => (
                  <button
                    key={chip}
                    onClick={() => setSearchQuery(chip)}
                    className="px-2 py-0.5 rounded-md bg-[#1C1C28] hover:bg-[#56A867]/20 hover:text-[#56A867] border border-[#2E2E3E] transition-colors cursor-pointer"
                  >
                    {chip}
                  </button>
                ))}
              </div>

              {/* Tag Filter Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pt-2 scrollbar-none border-t border-[#1E1E2A]">
                {tagsList.map((tag) => {
                  const isActive = selectedTag === tag;
                  return (
                    <button
                      key={tag}
                      onClick={() => setSelectedTag(tag)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-medium transition-all shrink-0 cursor-pointer ${
                        isActive
                          ? 'bg-[#56A867] text-black font-bold shadow-md shadow-[#56A867]/20 scale-105'
                          : 'bg-[#181824] text-neutral-300 hover:text-white hover:bg-[#202030] border border-[#252535]'
                      }`}
                    >
                      {tag === 'Explosividad' && '⚡ '}
                      {tag === 'Cardio' && '🔥 '}
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>
          </ScrollReveal>

          {/* Videos Grid */}
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-neutral-400 font-mono px-1">
              <span>
                {language === 'en'
                  ? `Showing ${filteredVideos.length} tutorials`
                  : `Mostrando ${filteredVideos.length} tutoriales`}
                {searchQuery && (
                  <span className="text-white ml-1">
                    para &quot;<span className="text-[#56A867]">{searchQuery}</span>&quot;
                  </span>
                )}
              </span>

              {selectedTag !== 'Todos' && (
                <span className="text-[#56A867] font-semibold">
                  {language === 'en' ? `Category: ${selectedTag}` : `Categoría: ${selectedTag}`}
                </span>
              )}
            </div>

            {filteredVideos.length === 0 ? (
              <div className="p-12 text-center rounded-2xl bg-[#121218] border border-[#20202A] space-y-3">
                <Video className="w-10 h-10 text-neutral-500 mx-auto" />
                <h3 className="text-base font-semibold text-white">
                  {language === 'en' ? 'No video tutorials found' : 'No se encontraron videos con ese término'}
                </h3>
                <p className="text-xs text-neutral-400 max-w-sm mx-auto">
                  {language === 'en'
                    ? 'Try another synonym like "flexiones", "brazo", "pierna", "cardio", or add a new video.'
                    : 'Prueba con otro sinónimo como "flexiones", "brazo", "pierna", "cardio", o añade un nuevo video tutorial.'}
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedTag('Todos');
                  }}
                  className="mt-2 px-4 py-2 rounded-xl bg-[#56A867] text-black font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>{language === 'en' ? 'Clear Filters' : 'Restablecer Filtros'}</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredVideos.map((video) => {
                  const tagStyle = TAG_COLORS[video.tag] || TAG_COLORS.General;
                  const isOwner = video.authorId === user.id || user.role === 'admin';
                  const isCoach = video.authorRole === 'entrenador';

                  return (
                    <div
                      key={video.id}
                      onClick={() => setActivePlayingVideo(video)}
                      className="group rounded-2xl bg-[#121218] border border-[#22222E] hover:border-[#56A867]/60 overflow-hidden transition-all duration-300 flex flex-col justify-between hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)] cursor-pointer"
                    >
                      {/* Thumbnail with overlay */}
                      <div className="relative aspect-video bg-black overflow-hidden">
                        <img
                          src={`https://img.youtube.com/vi/${video.youtubeVideoId}/hqdefault.jpg`}
                          alt={video.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/20" />

                        {/* Center Play Icon */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-12 h-12 rounded-full bg-red-600/90 text-white flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:bg-red-500 transition-all">
                            <Play className="w-5 h-5 fill-white ml-0.5" />
                          </div>
                        </div>

                        {/* Tag badge top right */}
                        <div className="absolute top-3 right-3">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-mono font-bold tracking-wider uppercase border shadow-md ${tagStyle.bg} ${tagStyle.text} ${tagStyle.border}`}
                          >
                            {video.tag === 'Explosividad' && '⚡ '}
                            {video.tag === 'Cardio' && '🔥 '}
                            {video.tag}
                          </span>
                        </div>

                        {/* Duration pill bottom right */}
                        {video.duration && (
                          <div className="absolute bottom-2.5 right-3 flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-sm text-[10px] font-mono text-neutral-300 border border-white/10">
                            <Clock className="w-3 h-3 text-[#56A867]" />
                            <span>{video.duration}</span>
                          </div>
                        )}

                        {/* YouTube brand pill bottom left */}
                        <div className="absolute bottom-2.5 left-3 flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-sm text-[10px] font-mono text-neutral-300 border border-white/10">
                          <Youtube className="w-3.5 h-3.5 text-red-500" />
                          <span>YouTube Official</span>
                        </div>

                        {/* Delete button if owner */}
                        {isOwner && (
                          <button
                            onClick={(e) => handleDeleteVideo(video.id, e)}
                            title={language === 'en' ? 'Delete video' : 'Eliminar video'}
                            className="absolute top-3 left-3 p-1.5 rounded-lg bg-black/70 hover:bg-red-950/80 text-neutral-400 hover:text-red-400 transition-colors border border-white/10 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Card Content */}
                      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
                        <div>
                          <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400 mb-1">
                            {video.difficulty && (
                              <span className="text-[#56A867] font-semibold flex items-center gap-1">
                                <Award className="w-3 h-3" />
                                {video.difficulty}
                              </span>
                            )}
                          </div>
                          <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-[#56A867] transition-colors line-clamp-2 leading-snug">
                            {video.title}
                          </h3>

                          {/* Target muscles tags */}
                          {video.muscles && video.muscles.length > 0 && (
                            <div className="flex items-center gap-1 flex-wrap mt-2">
                              {video.muscles.slice(0, 3).map((m, idx) => (
                                <span
                                  key={idx}
                                  className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#181824] text-neutral-300 border border-[#252535]"
                                >
                                  {m}
                                </span>
                              ))}
                              {video.muscles.length > 3 && (
                                <span className="text-[10px] font-mono text-neutral-500">
                                  +{video.muscles.length - 3}
                                </span>
                              )}
                            </div>
                          )}

                          {video.notes && (
                            <p className="text-xs text-neutral-400 mt-2 line-clamp-2 leading-relaxed">
                              {video.notes}
                            </p>
                          )}
                        </div>

                        {/* Author & Practice shortcut */}
                        <div className="pt-3 border-t border-[#1E1E2A] flex items-center justify-between text-xs text-neutral-400">
                          <div className="flex items-center gap-2 min-w-0">
                            <UserAvatar
                              user={{
                                name: video.authorName,
                                role: video.authorRole,
                                customAvatar: video.authorCustomAvatar,
                              }}
                              size="xs"
                            />
                            <div className="flex flex-col min-w-0">
                              <span className="text-white text-xs font-semibold truncate">
                                {video.authorName}
                              </span>
                              <span className="text-[10px] font-mono text-neutral-400">
                                {isCoach ? (
                                  <span className="text-amber-400 font-bold">Coach (C)</span>
                                ) : (
                                  <span className="text-emerald-400 font-bold">Deportista (D)</span>
                                )}
                              </span>
                            </div>
                          </div>

                          {/* Quick "Grábate haciendo este ejercicio" shortcut */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveTab('record');
                              setRecordExerciseTitle(video.title);
                              setRecordMuscleGroup(video.tag);
                            }}
                            title="Grábate ejecutando este ejercicio"
                            className="px-2.5 py-1 rounded-lg bg-[#1C1C28] hover:bg-[#56A867] hover:text-black text-neutral-300 text-[11px] font-mono font-bold flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <Camera className="w-3 h-3" />
                            <span>{language === 'en' ? 'Record form' : 'Grabar mi técnica'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: GRABA TU RUTINA / COMPARTE TU EJECUCIÓN (CAMERA & MEDIA RECORDER)   */}
      {/* ========================================================================= */}
      {activeTab === 'record' && (
        <div className="space-y-8 animate-fadeIn">
          {/* Header guidance banner */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-[#141420] via-[#161626] to-[#121218] border border-[#2E2E42] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-red-500/15 border border-red-500/30 text-red-400 text-xs font-mono font-bold uppercase">
                <Camera className="w-3.5 h-3.5" />
                <span>{language === 'en' ? 'Live Biomechanical Capture' : 'Captura Biomecánica en Vivo'}</span>
              </div>
              <h2 className="text-lg sm:text-xl font-serif font-bold text-white">
                {language === 'en' ? 'Record Your Routine / Share Execution with Coach' : 'Graba tu rutina y comparte tu ejecución con tu entrenador'}
              </h2>
              <p className="text-xs text-neutral-300 max-w-2xl leading-relaxed">
                {language === 'en'
                  ? 'Use your web camera or upload a video clip. Your coach Carlos or Mateo will review your bar path, joint angles, depth, and give you professional feedback.'
                  : 'Activa tu cámara web para grabarte o sube un clip desde tu dispositivo. Tu entrenador evaluará tu trayectoria de barra, ángulos de flexión y postura para enviarte correcciones personalizadas.'}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="px-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-xs font-mono text-[#56A867] flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Coach Active • 24/7 Review</span>
              </span>
            </div>
          </div>

          {/* Success Banner */}
          {submissionSuccess && (
            <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-mono flex items-center gap-3 animate-fadeIn">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <p className="font-bold">{language === 'en' ? 'Routine Submitted Successfully!' : '¡Rutina Grabada y Enviada Exitosamente!'}</p>
                <p className="opacity-90">{language === 'en' ? 'Your video has been queued for coach feedback. Review the card below.' : 'Tu video ha sido registrado en la cola de revisión técnica. Puedes ver el feedback abajo.'}</p>
              </div>
            </div>
          )}

          {/* Camera Error Alert */}
          {cameraError && (
            <div className="p-4 rounded-xl bg-rose-950/50 border border-rose-500/40 text-rose-300 text-xs font-mono flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{cameraError}</span>
              </div>
              <button
                onClick={() => setCameraError(null)}
                className="text-neutral-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Recording & Upload Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Live Camera Viewport / Video Preview */}
            <div className="lg:col-span-7 space-y-4">
              <div className="rounded-2xl bg-[#101018] border border-[#252538] overflow-hidden relative shadow-2xl">
                {/* Viewport Top Bar */}
                <div className="p-3.5 bg-[#141420] border-b border-[#222232] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                      {isRecording
                        ? language === 'en' ? `Recording • ${formatTimer(recordingSeconds)}` : `Grabando • ${formatTimer(recordingSeconds)}`
                        : isCameraActive
                        ? language === 'en' ? 'Camera Live Stream' : 'Cámara Web Activa'
                        : recordedVideoUrl
                        ? language === 'en' ? 'Recorded Execution Preview' : 'Previsualización del Clip Grabado'
                        : language === 'en' ? 'Camera Viewport' : 'Cámara de Grabación'}
                    </span>
                  </div>

                  {isRecording && (
                    <span className="px-2 py-0.5 rounded bg-red-600 text-white font-mono text-[11px] font-bold animate-pulse">
                      REC {formatTimer(recordingSeconds)}
                    </span>
                  )}
                </div>

                {/* Video Container */}
                <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
                  {/* Mode 1: Camera Active */}
                  {isCameraActive && (
                    <video
                      ref={videoPreviewRef}
                      autoPlay
                      muted
                      playsInline
                      className="w-full h-full object-cover scale-x-[-1]" // Mirrored for natural user feel
                    />
                  )}

                  {/* Mode 2: Recorded Video Ready for Playback */}
                  {!isCameraActive && recordedVideoUrl && (
                    <video
                      src={recordedVideoUrl}
                      controls
                      autoPlay
                      className="w-full h-full object-contain bg-black"
                    />
                  )}

                  {/* Mode 3: Camera Off / Idle State */}
                  {!isCameraActive && !recordedVideoUrl && (
                    <div className="text-center p-8 space-y-4">
                      <div className="w-16 h-16 rounded-2xl bg-[#181824] border border-[#2E2E42] text-neutral-400 flex items-center justify-center mx-auto">
                        <Camera className="w-8 h-8 text-[#56A867]" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-white">
                          {language === 'en' ? 'Camera is currently inactive' : 'La cámara está actualmente inactiva'}
                        </h4>
                        <p className="text-xs text-neutral-400 max-w-xs mx-auto">
                          {language === 'en'
                            ? 'Activate your device camera to record yourself, or select an existing video file.'
                            : 'Haz clic en "Activar Cámara" para grabarte en vivo o sube un clip desde tus archivos.'}
                        </p>
                      </div>

                      <div className="flex items-center justify-center gap-3 pt-2">
                        <button
                          onClick={startCameraStream}
                          className="px-4 py-2.5 rounded-xl bg-[#56A867] hover:bg-[#64B875] text-black font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-md"
                        >
                          <Camera className="w-4 h-4" />
                          <span>{language === 'en' ? 'Activate Camera' : 'Activar Cámara'}</span>
                        </button>

                        <label className="px-4 py-2.5 rounded-xl bg-[#1C1C2A] hover:bg-[#252538] text-neutral-200 text-xs font-mono border border-[#303046] flex items-center gap-2 cursor-pointer transition-colors">
                          <Upload className="w-4 h-4 text-sky-400" />
                          <span>{language === 'en' ? 'Upload Video File' : 'Subir Archivo'}</span>
                          <input
                            type="file"
                            accept="video/*"
                            onChange={handleFileUpload}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>
                  )}

                  {/* Posture alignment grid overlay during live camera */}
                  {isCameraActive && (
                    <div className="absolute inset-0 pointer-events-none opacity-20 border-2 border-white/30 grid grid-cols-3 grid-rows-3">
                      <div className="border-r border-b border-white/40" />
                      <div className="border-r border-b border-white/40" />
                      <div className="border-b border-white/40" />
                      <div className="border-r border-b border-white/40" />
                      <div className="border-r border-b border-white/40" />
                      <div className="border-b border-white/40" />
                      <div className="border-r border-white/40" />
                      <div className="border-r border-white/40" />
                      <div />
                    </div>
                  )}
                </div>

                {/* Viewport Control Bar */}
                <div className="p-4 bg-[#141420] border-t border-[#222232] flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {isCameraActive && !isRecording && (
                      <button
                        onClick={startRecording}
                        className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(220,38,38,0.4)] animate-pulse"
                      >
                        <span className="w-2.5 h-2.5 rounded-full bg-white" />
                        <span>{language === 'en' ? 'Start Recording' : 'Iniciar Grabación'}</span>
                      </button>
                    )}

                    {isRecording && (
                      <button
                        onClick={stopRecording}
                        className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(245,158,11,0.4)]"
                      >
                        <StopCircle className="w-4 h-4" />
                        <span>{language === 'en' ? 'Stop Recording' : 'Detener y Guardar'}</span>
                      </button>
                    )}

                    {isCameraActive && (
                      <button
                        onClick={stopCameraStream}
                        className="px-3.5 py-2.5 rounded-xl bg-[#1C1C28] hover:bg-[#252535] text-neutral-300 text-xs font-mono transition-colors cursor-pointer"
                      >
                        {language === 'en' ? 'Turn Off Camera' : 'Apagar Cámara'}
                      </button>
                    )}

                    {!isCameraActive && recordedVideoUrl && (
                      <button
                        onClick={() => {
                          setRecordedVideoUrl(null);
                          setRecordedBlob(null);
                          setUploadedFileName(null);
                          startCameraStream();
                        }}
                        className="px-3.5 py-2 rounded-xl bg-[#1C1C28] hover:bg-[#252535] text-neutral-300 text-xs font-mono flex items-center gap-1.5 cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>{language === 'en' ? 'Record Again' : 'Grabar de Nuevo'}</span>
                      </button>
                    )}
                  </div>

                  {/* Download local video file option if recorded */}
                  {recordedVideoUrl && (
                    <a
                      href={recordedVideoUrl}
                      download={`sportfitness_routine_${Date.now()}.webm`}
                      className="px-3 py-1.5 rounded-xl bg-[#181824] hover:bg-[#202030] text-[#56A867] text-xs font-mono flex items-center gap-1.5 border border-[#2E2E42]"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>{language === 'en' ? 'Download Clip' : 'Descargar Video'}</span>
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: Submission Details & Form */}
            <div className="lg:col-span-5 space-y-5">
              <form
                onSubmit={handleSaveRecordedSubmission}
                className="p-6 rounded-2xl bg-[#121218] border border-[#26263A] shadow-xl space-y-4"
              >
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Send className="w-4 h-4 text-[#56A867]" />
                    <span>{language === 'en' ? 'Send Routine to Coach Review' : 'Enviar Rutina a Revisión del Entrenador'}</span>
                  </h3>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    {language === 'en'
                      ? 'Fill out the exercise name and specific questions for your coach.'
                      : 'Especifica el ejercicio y las dudas técnicas para tu entrenador.'}
                  </p>
                </div>

                {/* Exercise Title */}
                <div>
                  <label className="block text-xs font-mono uppercase text-neutral-300 font-semibold mb-1">
                    {language === 'en' ? 'Exercise Executed *' : 'Ejercicio Ejecutado *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={recordExerciseTitle}
                    onChange={(e) => setRecordExerciseTitle(e.target.value)}
                    placeholder={
                      language === 'en'
                        ? 'E.g., Sentadillas, Flexiones / Lagartijas, Press de Banca...'
                        : 'Ej: Sentadillas, Flexiones / Lagartijas, Press de banca...'
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#161622] border border-[#28283C] text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-[#56A867] font-mono"
                  />
                </div>

                {/* Muscle Group */}
                <div>
                  <label className="block text-xs font-mono uppercase text-neutral-300 font-semibold mb-1">
                    {language === 'en' ? 'Target Muscle Group' : 'Grupo Muscular Principal'}
                  </label>
                  <select
                    value={recordMuscleGroup}
                    onChange={(e) => setRecordMuscleGroup(e.target.value as MuscleTag)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#161622] border border-[#28283C] text-xs text-white focus:outline-none focus:border-[#56A867] font-mono"
                  >
                    <option value="Pecho">Pecho (Pectoral, Lagartijas, Press)</option>
                    <option value="Espalda">Espalda (Dominadas, Remo, Dorsales)</option>
                    <option value="Piernas">Piernas (Sentadillas, Zancadas, Glúteo)</option>
                    <option value="Hombros">Hombros (Press militar, Elevaciones)</option>
                    <option value="Brazos">Brazos (Bíceps, Tríceps, Fondos)</option>
                    <option value="Core">Core / Abdomen (Planchas, Rueda, Crunches)</option>
                    <option value="Cardio">Cardio / Saltos (Jumping Jacks, Skipping)</option>
                    <option value="Explosividad">Explosividad (Pliometría, Saltos al cajón)</option>
                  </select>
                </div>

                {/* Athlete Technical Questions & Notes */}
                <div>
                  <label className="block text-xs font-mono uppercase text-neutral-300 font-semibold mb-1">
                    {language === 'en' ? 'Notes or Questions for Coach' : 'Preguntas o Dudas para tu Entrenador'}
                  </label>
                  <textarea
                    rows={3}
                    value={recordNotes}
                    onChange={(e) => setRecordNotes(e.target.value)}
                    placeholder={
                      language === 'en'
                        ? 'E.g., Did I break parallel? Did my back arch during lockout?'
                        : 'Ej: ¿Llegué a la profundidad adecuada? ¿Mi postura de espalda estuvo recta en la bajada?'
                    }
                    className="w-full px-3.5 py-2 rounded-xl bg-[#161622] border border-[#28283C] text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#56A867] resize-none"
                  />
                </div>

                {/* Status info */}
                <div className="p-3 rounded-xl bg-[#181824] border border-[#26263A] text-[11px] font-mono text-neutral-400 space-y-1">
                  <div className="flex items-center justify-between">
                    <span>{language === 'en' ? 'Clip Status:' : 'Estado del Video:'}</span>
                    <span className={recordedVideoUrl ? 'text-[#56A867] font-bold' : 'text-neutral-500'}>
                      {recordedVideoUrl ? (uploadedFileName ? 'Archivo cargado' : 'Grabación lista') : 'Pendiente de capturar'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>{language === 'en' ? 'Assigned Coach:' : 'Entrenador Asignado:'}</span>
                    <span className="text-white font-semibold">Coach Carlos Rendón</span>
                  </div>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={isSavingSubmission || !recordExerciseTitle.trim()}
                  className="w-full py-3 px-6 rounded-xl bg-[#56A867] hover:bg-[#64B875] text-black font-bold text-xs uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(86,168,103,0.3)] hover:shadow-[0_0_25px_rgba(86,168,103,0.45)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />
                  <span>
                    {isSavingSubmission
                      ? language === 'en' ? 'Submitting...' : 'Enviando al Entrenador...'
                      : language === 'en' ? 'Submit Routine for Coach Review' : 'Guardar y Enviar a Revisión'}
                  </span>
                </button>
              </form>
            </div>
          </div>

          {/* ========================================== */}
          {/* ATHLETE'S RECORDED SUBMISSIONS & REVIEWS   */}
          {/* ========================================== */}
          <div className="space-y-4 pt-4 border-t border-[#222232]">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-serif font-bold text-white flex items-center gap-2">
                  <Award className="w-5 h-5 text-[#56A867]" />
                  <span>{language === 'en' ? 'Your Recorded Submissions & Coach Feedback' : 'Tus Ejecuciones Grabadas & Evaluaciones del Coach'}</span>
                </h3>
                <p className="text-xs text-neutral-400">
                  {language === 'en'
                    ? 'History of routines you recorded and reviews received from certified coaches.'
                    : 'Historial de rutinas que te has grabado y las devoluciones técnicas de tus entrenadores.'}
                </p>
              </div>

              <span className="text-xs font-mono text-[#56A867]">
                {submissions.length} {language === 'en' ? 'submissions' : 'evaluaciones'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {submissions.map((sub) => {
                const tagStyle = TAG_COLORS[sub.muscleGroup] || TAG_COLORS.General;
                return (
                  <div
                    key={sub.id}
                    className="p-5 rounded-2xl bg-[#121218] border border-[#242436] space-y-3.5 hover:border-[#56A867]/40 transition-all"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase border mb-1.5 ${tagStyle.bg} ${tagStyle.text} ${tagStyle.border}`}
                        >
                          {sub.muscleGroup}
                        </span>
                        <h4 className="text-sm font-bold text-white leading-tight">
                          {sub.exerciseTitle}
                        </h4>
                      </div>

                      <span
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase ${
                          sub.status === 'approved'
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        {sub.status === 'approved' ? 'Técnica Aprobada' : 'En Revisión'}
                      </span>
                    </div>

                    {/* Athlete Notes */}
                    {sub.notes && (
                      <p className="text-xs text-neutral-300 italic bg-[#161622] p-2.5 rounded-xl border border-[#222232]">
                        &quot;{sub.notes}&quot;
                      </p>
                    )}

                    {/* Video Player if Blob / URL exists */}
                    {sub.videoUrl && (
                      <div className="aspect-video w-full rounded-xl overflow-hidden bg-black border border-white/10">
                        <video src={sub.videoUrl} controls className="w-full h-full object-contain" />
                      </div>
                    )}

                    {/* Coach Review Card */}
                    {sub.coachFeedback && (
                      <div className="p-3.5 rounded-xl bg-gradient-to-r from-[#181826] to-[#141420] border border-[#2C2C40] space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-[#56A867] flex items-center gap-1 font-mono">
                            <Sparkle className="w-3.5 h-3.5 text-amber-400" />
                            {sub.coachFeedback.coachName} ({sub.coachFeedback.coachRole})
                          </span>
                          <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono text-[11px] font-bold">
                            Nota: {sub.coachFeedback.score} / 10
                          </span>
                        </div>
                        <p className="text-xs text-neutral-200 leading-relaxed">
                          {sub.coachFeedback.comment}
                        </p>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[11px] font-mono text-neutral-500 pt-1 border-t border-[#1C1C28]">
                      <span>
                        {new Date(sub.createdAt).toLocaleDateString(language === 'en' ? 'en-US' : 'es-CO', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>

                      <button
                        onClick={() => setSubmissions((prev) => prev.filter((s) => s.id !== sub.id))}
                        className="text-neutral-500 hover:text-red-400 transition-colors cursor-pointer"
                        title="Eliminar de mi historial"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL: PUBLISH VIDEO GUIDE                */}
      {/* ========================================== */}
      {showPublishModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-[#121218] border border-[#282838] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            <div className="px-6 py-4 border-b border-[#20202E] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#56A867]/15 text-[#56A867] flex items-center justify-center">
                  <Youtube className="w-4 h-4 text-red-500" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">
                    {language === 'en' ? 'Add YouTube Exercise Tutorial' : 'Publicar Video Tutorial de Ejercicio'}
                  </h2>
                  <p className="text-[11px] text-neutral-400">
                    {language === 'en'
                      ? 'Share an official YouTube video with biomechanical cues and tags.'
                      : 'Comparte un enlace oficial de YouTube con claves biomecánicas y etiquetas.'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowPublishModal(false)}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handlePublish} className="p-6 space-y-4 overflow-y-auto">
              {formError && (
                <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-xs font-mono">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-mono uppercase text-neutral-300 font-semibold mb-1">
                  {language === 'en' ? 'Exercise Title *' : 'Título del Ejercicio / Rutina *'}
                </label>
                <input
                  type="text"
                  required
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  placeholder={
                    language === 'en'
                      ? 'E.g., Flexiones / Lagartijas: Técnica de Codos y Rango'
                      : 'Ej: Flexiones / Lagartijas: Técnica de Codos y Rango'
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#161622] border border-[#28283A] text-white text-xs placeholder-neutral-500 focus:outline-none focus:border-[#56A867] font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-neutral-300 font-semibold mb-1">
                  {language === 'en' ? 'YouTube Link or ID *' : 'Enlace o ID de YouTube *'}
                </label>
                <input
                  type="text"
                  required
                  value={youtubeUrlInput}
                  onChange={(e) => setYoutubeUrlInput(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=... o https://youtu.be/..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#161622] border border-[#28283A] text-white text-xs placeholder-neutral-500 focus:outline-none focus:border-[#56A867] font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-neutral-300 font-semibold mb-1">
                  {language === 'en' ? 'Category / Muscle Group' : 'Categoría / Grupo Muscular'}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Pecho', 'Espalda', 'Piernas', 'Hombros', 'Brazos', 'Core', 'Cardio', 'Explosividad'] as const).map(
                    (tagOption) => {
                      const isSelected = tagInput === tagOption;
                      const style = TAG_COLORS[tagOption] || TAG_COLORS.General;
                      return (
                        <button
                          key={tagOption}
                          type="button"
                          onClick={() => setTagInput(tagOption)}
                          className={`px-3 py-2 rounded-xl text-xs font-mono font-bold transition-all border text-center cursor-pointer ${
                            isSelected
                              ? `${style.bg} ${style.text} ${style.border} ring-2 ring-[#56A867]`
                              : `${style.bg} ${style.text} ${style.border} hover:opacity-100 opacity-75`
                          }`}
                        >
                          {tagOption === 'Explosividad' && '⚡ '}
                          {tagOption === 'Cardio' && '🔥 '}
                          {tagOption}
                        </button>
                      );
                    }
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-neutral-300 font-semibold mb-1">
                  {language === 'en'
                    ? 'Biomechanical Cues & Notes (Optional)'
                    : 'Claves Biomecánicas & Consejos Técnicos (Opcional)'}
                </label>
                <textarea
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  rows={3}
                  placeholder={
                    language === 'en'
                      ? 'E.g., Keep chest elevated, drive through the midfoot, avoid hyperextension...'
                      : 'Ej: Mantener retracción escapular, no despegar los talones y controlar la fase excéntrica en 2 segundos...'
                  }
                  className="w-full px-3.5 py-2 rounded-xl bg-[#161622] border border-[#28283A] text-white text-xs placeholder-neutral-500 focus:outline-none focus:border-[#56A867] transition-colors resize-none"
                />
              </div>

              <div className="pt-3 border-t border-[#20202E] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowPublishModal(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-[#1C1C28] hover:bg-[#252535] text-neutral-300 text-xs font-mono transition-colors cursor-pointer"
                >
                  {language === 'en' ? 'Cancel' : 'Cancelar'}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-[#56A867] hover:bg-[#64B875] text-black font-bold text-xs uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(86,168,103,0.3)] hover:shadow-[0_0_20px_rgba(86,168,103,0.45)] flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span>{language === 'en' ? 'Publishing...' : 'Publicando...'}</span>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>{language === 'en' ? 'Publish Tutorial' : 'Publicar Video'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL: EMBEDDED YOUTUBE PLAYER             */}
      {/* ========================================== */}
      {activePlayingVideo && (
        <div
          onClick={() => setActivePlayingVideo(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-3xl rounded-2xl bg-[#101018] border border-[#2A2A3C] shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Player Header */}
            <div className="p-4 border-b border-[#20202E] flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold tracking-wider uppercase border shrink-0 ${
                    TAG_COLORS[activePlayingVideo.tag]?.bg || TAG_COLORS.General.bg
                  } ${TAG_COLORS[activePlayingVideo.tag]?.text || TAG_COLORS.General.text} ${
                    TAG_COLORS[activePlayingVideo.tag]?.border || TAG_COLORS.General.border
                  }`}
                >
                  {activePlayingVideo.tag === 'Explosividad' && '⚡ '}
                  {activePlayingVideo.tag === 'Cardio' && '🔥 '}
                  {activePlayingVideo.tag}
                </span>
                <h3 className="text-sm sm:text-base font-bold text-white truncate">
                  {activePlayingVideo.title}
                </h3>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={`https://www.youtube.com/watch?v=${activePlayingVideo.youtubeVideoId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-lg text-neutral-400 hover:text-red-400 hover:bg-white/10 transition-colors"
                  title="Abrir en YouTube"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
                <button
                  onClick={() => setActivePlayingVideo(null)}
                  className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Video 16:9 Iframe */}
            <div className="relative aspect-video w-full bg-black">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${activePlayingVideo.youtubeVideoId}?autoplay=1&rel=0`}
                title={activePlayingVideo.title}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>

            {/* Player Details & Cues */}
            <div className="p-4 sm:p-5 space-y-3 bg-[#12121A]">
              {/* Target muscles */}
              {activePlayingVideo.muscles && activePlayingVideo.muscles.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-mono text-neutral-400 font-semibold">
                    {language === 'en' ? 'Target Muscles:' : 'Músculos Implicados:'}
                  </span>
                  {activePlayingVideo.muscles.map((muscle, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-md bg-[#1C1C28] text-white text-[11px] font-mono border border-white/10"
                    >
                      {muscle}
                    </span>
                  ))}
                </div>
              )}

              {activePlayingVideo.notes && (
                <div className="p-3.5 rounded-xl bg-[#181824] border border-[#252538] text-xs text-neutral-200 leading-relaxed">
                  <span className="font-bold text-[#56A867] font-mono mr-1">
                    {language === 'en' ? 'Technique Cues:' : 'Claves Técnicas Biomecánicas:'}
                  </span>
                  {activePlayingVideo.notes}
                </div>
              )}

              <div className="flex items-center justify-between pt-1">
                <span className="text-xs font-mono text-neutral-400">
                  {language === 'en' ? 'Demonstrated by:' : 'Demostrado por:'}{' '}
                  <span className="text-white font-semibold">{activePlayingVideo.authorName}</span>
                </span>

                <button
                  onClick={() => {
                    const exerciseTitle = activePlayingVideo.title;
                    const exerciseTag = activePlayingVideo.tag;
                    setActivePlayingVideo(null);
                    setActiveTab('record');
                    setRecordExerciseTitle(exerciseTitle);
                    setRecordMuscleGroup(exerciseTag);
                  }}
                  className="px-4 py-2 rounded-xl bg-[#56A867] hover:bg-[#64B875] text-black font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>{language === 'en' ? 'Record My Form Now' : 'Grabar Mi Técnica Ahora'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
