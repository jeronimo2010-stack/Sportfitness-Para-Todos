/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  Dumbbell,
  Moon,
  Flame,
  Activity,
  Zap,
  Check,
  Trash2,
  Plus,
  RotateCcw,
  Sparkles,
  Info,
  X,
  Coffee,
  HeartPulse,
} from 'lucide-react';
import { ScheduledSession, DayCalendarOverride } from '../../types';

interface CalendarDayModalProps {
  isOpen: boolean;
  onClose: () => void;
  day: number;
  month?: number;
  year?: number;
  isRestDefault: boolean;
  dayOverride?: DayCalendarOverride;
  daySessions: ScheduledSession[];
  preferredWorkoutTime: string;
  language: string;
  onSaveDay: (params: {
    day: number;
    isRest: boolean;
    restType?: 'Descanso Total' | 'Descanso Activo' | 'Movilidad & Recuperación' | 'Recarga de Glucógeno';
    restNotes?: string;
    sessions: ScheduledSession[];
  }) => void;
  onDeleteDayActivity: (day: number) => void;
  onResetDayToRecommended: (day: number) => void;
}

export const CalendarDayModal: React.FC<CalendarDayModalProps> = ({
  isOpen,
  onClose,
  day,
  month = 9, // October (0-indexed = 9)
  year = 2026,
  isRestDefault,
  dayOverride,
  daySessions,
  preferredWorkoutTime,
  language,
  onSaveDay,
  onDeleteDayActivity,
  onResetDayToRecommended,
}) => {
  // Current mode for the day: 'training' or 'rest'
  const initialMode = dayOverride
    ? dayOverride.status
    : isRestDefault && daySessions.length === 0
    ? 'rest'
    : daySessions.length > 0
    ? 'training'
    : isRestDefault
    ? 'rest'
    : 'training';

  const [mode, setMode] = useState<'training' | 'rest'>(initialMode);

  // Rest day details
  const [restType, setRestType] = useState<
    'Descanso Total' | 'Descanso Activo' | 'Movilidad & Recuperación' | 'Recarga de Glucógeno'
  >(dayOverride?.restType || (isRestDefault ? 'Descanso Total' : 'Descanso Activo'));
  const [restNotes, setRestNotes] = useState<string>(
    dayOverride?.restNotes ||
      (language === 'en'
        ? 'Active recovery: hydration, light walking and joint mobility.'
        : 'Recuperación activa: hidratación, caminata ligera y movilidad articular.')
  );

  // Training sessions list for this day
  const [currentSessions, setCurrentSessions] = useState<ScheduledSession[]>([]);

  // New session input form state
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<
    'Fuerza' | 'Hipertrofia' | 'Cardio' | 'Movilidad' | 'Potencia'
  >('Fuerza');
  const [newTime, setNewTime] = useState(preferredWorkoutTime || '07:00');
  const [newDuration, setNewDuration] = useState(60);
  const [newIntensity, setNewIntensity] = useState<'Baja' | 'Media' | 'Alta'>('Alta');
  const [newExercises, setNewExercises] = useState<string[]>([]);
  const [customExerciseInput, setCustomExerciseInput] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync state when day or props change
  useEffect(() => {
    if (isOpen) {
      const activeMode = dayOverride
        ? dayOverride.status
        : daySessions.length > 0
        ? 'training'
        : isRestDefault
        ? 'rest'
        : 'training';

      setMode(activeMode);
      setRestType(dayOverride?.restType || (isRestDefault ? 'Descanso Total' : 'Descanso Activo'));
      setRestNotes(
        dayOverride?.restNotes ||
          (language === 'en'
            ? 'Active recovery: hydration, light walking and joint mobility.'
            : 'Recuperación activa: hidratación, caminata ligera y movilidad articular.')
      );
      setCurrentSessions([...daySessions]);
      setShowAddForm(daySessions.length === 0);
      setNewTime(preferredWorkoutTime || '07:00');
      setToastMessage(null);
    }
  }, [isOpen, day, dayOverride, daySessions, isRestDefault, preferredWorkoutTime, language]);

  if (!isOpen) return null;

  // Day of week calculation for Oct 2026 (day 1 was Thursday = index 3)
  const getDayName = (dayNum: number) => {
    const dow = (dayNum - 1 + 3) % 7;
    const namesEs = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    const namesEn = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    return language === 'en' ? namesEn[dow] : namesEs[dow];
  };

  const dayName = getDayName(day);

  // Quick routine presets for easy 1-click scheduling
  const routinePresets = [
    {
      category: 'Fuerza',
      title: language === 'en' ? 'Heavy Chest & Triceps (Strength)' : 'Pecho Pesado & Tríceps (Fuerza)',
      type: 'Fuerza' as const,
      duration: 65,
      intensity: 'Alta' as const,
      kcal: 540,
      exercises: ['Press de Banca Plano', 'Press Inclinado con Mancuernas', 'Fondos en Paralelas'],
    },
    {
      category: 'Fuerza',
      title: language === 'en' ? 'Legs: Back Squats & Posterior Chain' : 'Piernas: Sentadilla & Cadena Posterior',
      type: 'Fuerza' as const,
      duration: 75,
      intensity: 'Alta' as const,
      kcal: 620,
      exercises: ['Sentadilla con Barra Trasera', 'Prensa 45°', 'Peso Muerto Rumano (RDL)'],
    },
    {
      category: 'Cardio',
      title: language === 'en' ? 'Cardio HIIT & Functional Core' : 'Cardio HIIT & Core Funcional',
      type: 'Cardio' as const,
      duration: 35,
      intensity: 'Alta' as const,
      kcal: 380,
      exercises: ['Burpees Pliométricos', 'Plank Isométrico', 'Salto a la Cuerda'],
    },
    {
      category: 'Cardio',
      title: language === 'en' ? 'Steady Aerobic Zone 2 Running' : 'Trote Continuo en Zona 2',
      type: 'Cardio' as const,
      duration: 45,
      intensity: 'Media' as const,
      kcal: 420,
      exercises: ['Trote Continuo 6.5 km', 'Respiración Nasal & Cadencia'],
    },
    {
      category: 'Movilidad',
      title: language === 'en' ? 'Hip Mobility & Spine Decompression' : 'Movilidad de Cadera & Descompresión Espinal',
      type: 'Movilidad' as const,
      duration: 25,
      intensity: 'Baja' as const,
      kcal: 140,
      exercises: ['Movilidad 90/90 de Cadera', 'Gato-Camello', 'Puente Glúteo Activo'],
    },
    {
      category: 'Potencia',
      title: language === 'en' ? 'Explosive Power & Box Jumps (VBT)' : 'Potencia Pliométrica & Saltos al Cajón',
      type: 'Potencia' as const,
      duration: 50,
      intensity: 'Alta' as const,
      kcal: 460,
      exercises: ['Salto al Cajón Pliométrico', 'Sentadilla con Salto Reactivo', 'Cargada Colgada'],
    },
  ];

  const commonExercisesList = [
    'Sentadilla con Barra',
    'Press de Banca',
    'Peso Muerto',
    'Dominadas Lastradas',
    'Prensa de Piernas',
    'RDL Isquiotibiales',
    'Cardio HIIT',
    'Trote en Zona 2',
    'Salto al Cajón',
    'Plank Isométrico',
    'Movilidad 90/90',
    'Remo con Barra',
  ];

  const handleApplyPreset = (preset: (typeof routinePresets)[0]) => {
    setNewTitle(preset.title);
    setNewType(preset.type);
    setNewDuration(preset.duration);
    setNewIntensity(preset.intensity);
    setNewExercises(preset.exercises);
    setShowAddForm(true);
  };

  const handleAddExerciseTag = (exName: string) => {
    if (!newExercises.includes(exName)) {
      setNewExercises([...newExercises, exName]);
    }
  };

  const handleRemoveExerciseTag = (exName: string) => {
    setNewExercises(newExercises.filter((e) => e !== exName));
  };

  const handleAddCustomExercise = (e: React.FormEvent) => {
    e.preventDefault();
    if (customExerciseInput.trim() && !newExercises.includes(customExerciseInput.trim())) {
      setNewExercises([...newExercises, customExerciseInput.trim()]);
      setCustomExerciseInput('');
    }
  };

  const handleCreateSession = () => {
    if (!newTitle.trim()) {
      alert(language === 'en' ? 'Please enter a routine title' : 'Por favor ingresa un título para la rutina');
      return;
    }

    const estimatedKcal =
      newType === 'Cardio'
        ? Math.round(newDuration * 11)
        : newType === 'Fuerza' || newType === 'Hipertrofia'
        ? Math.round(newDuration * 8)
        : Math.round(newDuration * 5);

    const newSess: ScheduledSession = {
      id: `sess-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      day,
      month,
      year,
      time: newTime,
      title: newTitle.trim(),
      type: newType,
      durationMinutes: newDuration,
      estimatedKcal,
      completed: false,
      intensity: newIntensity,
      exercises: newExercises,
    };

    setCurrentSessions([...currentSessions, newSess]);
    setNewTitle('');
    setNewExercises([]);
    setShowAddForm(false);
    showNotice(language === 'en' ? 'Session added to day list' : 'Sesión agregada a la lista del día');
  };

  const handleDeleteSession = (id: string) => {
    setCurrentSessions(currentSessions.filter((s) => s.id !== id));
    showNotice(language === 'en' ? 'Session removed' : 'Sesión eliminada');
  };

  const handleToggleCompleted = (id: string) => {
    setCurrentSessions(
      currentSessions.map((s) => (s.id === id ? { ...s, completed: !s.completed } : s))
    );
  };

  const showNotice = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Main Save Handler: Saves changes to localDatabase and informs parent
  const handleSaveAll = () => {
    if (mode === 'rest') {
      onSaveDay({
        day,
        isRest: true,
        restType,
        restNotes,
        sessions: [], // Clears active training for this day
      });
    } else {
      // If user selected training mode but has no sessions yet, create a default one if title exists
      let finalSessions = [...currentSessions];
      if (finalSessions.length === 0 && newTitle.trim()) {
        finalSessions.push({
          id: `sess-${Date.now()}`,
          day,
          month,
          year,
          time: newTime,
          title: newTitle.trim(),
          type: newType,
          durationMinutes: newDuration,
          estimatedKcal: Math.round(newDuration * 8),
          completed: false,
          intensity: newIntensity,
          exercises: newExercises,
        });
      }

      onSaveDay({
        day,
        isRest: false,
        sessions: finalSessions,
      });
    }

    onClose();
  };

  const handleDeleteEntireDay = () => {
    if (
      confirm(
        language === 'en'
          ? `Delete all scheduled activity for ${dayName} ${day} October?`
          : `¿Deseas eliminar toda la actividad programada para el ${dayName} ${day} de Octubre?`
      )
    ) {
      onDeleteDayActivity(day);
      onClose();
    }
  };

  const handleResetToDefault = () => {
    onResetDayToRecommended(day);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-2xl bg-[#101016] border border-[#252538] rounded-3xl p-5 sm:p-7 shadow-2xl space-y-6 text-left my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#1E1E2C]">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#56A867]/15 text-[#56A867] flex items-center justify-center font-bold text-lg font-mono border border-[#56A867]/30">
              {day}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold font-serif text-white">
                  {dayName}, {day} {language === 'en' ? 'October 2026' : 'de Octubre, 2026'}
                </h2>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider ${
                    mode === 'rest'
                      ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                      : 'bg-[#56A867]/15 text-[#56A867] border border-[#56A867]/30'
                  }`}
                >
                  {mode === 'rest'
                    ? language === 'en'
                      ? '☕ Rest Day'
                      : '☕ Día de Descanso'
                    : language === 'en'
                    ? '🏋️ Training Day'
                    : '🏋️ Día de Entrenamiento'}
                </span>
              </div>
              <p className="text-xs text-[#8E8E9E]">
                {language === 'en'
                  ? 'Personalize your training schedule, assign exercises, or set as rest.'
                  : 'Personaliza tu agenda: programa rutinas, asigna ejercicios o marca día de descanso.'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-[#1C1C28] hover:bg-[#252538] text-[#8E8E9E] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Cerrar modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Feedback notification toast inside modal */}
        {toastMessage && (
          <div className="p-2.5 rounded-xl bg-[#56A867]/15 border border-[#56A867]/30 text-[#56A867] text-xs font-mono flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* 1. Primary Segmented Mode Switch: ENTRENAMIENTO vs DESCANSO */}
        <div className="grid grid-cols-2 p-1.5 rounded-2xl bg-[#161622] border border-[#232334] gap-2">
          <button
            type="button"
            onClick={() => setMode('training')}
            className={`py-3 px-4 rounded-xl text-xs sm:text-sm font-bold font-mono uppercase flex items-center justify-center gap-2 transition-all cursor-pointer ${
              mode === 'training'
                ? 'bg-[#56A867] text-black shadow-[0_0_20px_rgba(86,168,103,0.3)]'
                : 'text-[#8E8E9E] hover:text-white hover:bg-[#1E1E2E]'
            }`}
          >
            <Dumbbell className="w-4 h-4" />
            <span>{language === 'en' ? 'Training Day' : 'Día de Entrenamiento'}</span>
          </button>

          <button
            type="button"
            onClick={() => setMode('rest')}
            className={`py-3 px-4 rounded-xl text-xs sm:text-sm font-bold font-mono uppercase flex items-center justify-center gap-2 transition-all cursor-pointer ${
              mode === 'rest'
                ? 'bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.35)]'
                : 'text-[#8E8E9E] hover:text-white hover:bg-[#1E1E2E]'
            }`}
          >
            <Coffee className="w-4 h-4" />
            <span>{language === 'en' ? 'Rest Day' : 'Día de Descanso'}</span>
          </button>
        </div>

        {/* 2. MODE: REST DAY VIEW */}
        {mode === 'rest' && (
          <div className="p-4 sm:p-5 rounded-2xl bg-[#141826] border border-blue-500/30 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                <Moon className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>{language === 'en' ? 'Rest & Regeneration Protocol' : 'Protocolo de Descanso y Regeneración'}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-bold">
                    {language === 'en' ? 'Protected Streak' : 'Racha Protegida'}
                  </span>
                </h3>
                <p className="text-xs text-[#9BB0D0] leading-relaxed">
                  {language === 'en'
                    ? 'Marking this day as Rest exempts you from the missed session penalty and keeps your daily streak intact.'
                    : 'Al marcar este día como Descanso, no se te aplicará penitencia de tabla isométrica y tu racha del 1% diario permanecerá segura.'}
                </p>
              </div>
            </div>

            {/* Rest Type Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono font-bold text-[#A0B0D0] block">
                {language === 'en' ? 'Type of Rest' : 'Modalidad de Descanso'}:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  {
                    id: 'Descanso Total',
                    name: language === 'en' ? 'Complete Passive Rest' : 'Descanso Total / Pasivo',
                    desc: language === 'en' ? 'Sleep, relaxation, no exercise' : 'Sueño reparador, relajación total',
                  },
                  {
                    id: 'Descanso Activo',
                    name: language === 'en' ? 'Active Recovery' : 'Descanso Activo',
                    desc: language === 'en' ? 'Light walking, casual cycling' : 'Caminata ligera, paseo, baja intensidad',
                  },
                  {
                    id: 'Movilidad & Recuperación',
                    name: language === 'en' ? 'Mobility & Stretching' : 'Movilidad & Estiramiento',
                    desc: language === 'en' ? 'Foam rolling, myofascial release' : 'Foam roller, yoga, descompresión articular',
                  },
                  {
                    id: 'Recarga de Glucógeno',
                    name: language === 'en' ? 'Nutritional & Glycogen Recharge' : 'Recarga de Glucógeno',
                    desc: language === 'en' ? 'Hydration & high clean carbs' : 'Hidratación con electrolitos y comida nutritiva',
                  },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setRestType(item.id as any)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      restType === item.id
                        ? 'bg-blue-950/60 border-blue-400 text-white shadow-[0_0_15px_rgba(59,130,246,0.2)]'
                        : 'bg-[#121520] border-[#222838] text-[#8E9EBE] hover:bg-[#181D2C]'
                    }`}
                  >
                    <div className="text-xs font-bold text-white flex items-center justify-between">
                      <span>{item.name}</span>
                      {restType === item.id && <Check className="w-3.5 h-3.5 text-blue-400" />}
                    </div>
                    <div className="text-[11px] text-[#7A8EAE] mt-0.5">{item.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Rest Notes */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono font-bold text-[#A0B0D0] block">
                {language === 'en' ? 'Athlete Rest Notes & Recommendations' : 'Notas y Recomendaciones para este Día'}:
              </label>
              <textarea
                value={restNotes}
                onChange={(e) => setRestNotes(e.target.value)}
                rows={2}
                placeholder={
                  language === 'en'
                    ? 'e.g. 8h sleep, drink 35ml/kg water, 20 min walk in the afternoon.'
                    : 'Ej. 8h de sueño, tomar 35ml de agua por kg de peso, caminata de 20 min.'
                }
                className="w-full p-2.5 rounded-xl bg-[#0F121C] border border-[#252C3E] text-white text-xs focus:outline-none focus:border-blue-400"
              />
            </div>
          </div>
        )}

        {/* 3. MODE: TRAINING DAY VIEW */}
        {mode === 'training' && (
          <div className="space-y-5">
            {/* Existing Scheduled Sessions for this Day */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-mono uppercase font-bold text-[#A0A0B0] flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-[#56A867]" />
                  <span>
                    {language === 'en'
                      ? `Scheduled Sessions for this Day (${currentSessions.length})`
                      : `Sesiones Programadas para este Día (${currentSessions.length})`}
                  </span>
                </h3>

                <button
                  type="button"
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="text-xs font-mono text-[#56A867] hover:underline flex items-center gap-1 cursor-pointer font-bold"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{showAddForm ? (language === 'en' ? 'Hide Form' : 'Ocultar Formulario') : (language === 'en' ? 'Add Another Routine' : 'Agregar Otra Rutina')}</span>
                </button>
              </div>

              {currentSessions.length > 0 ? (
                <div className="space-y-2.5">
                  {currentSessions.map((session, idx) => (
                    <div
                      key={session.id}
                      className="p-3.5 rounded-2xl bg-[#161622] border border-[#26263A] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                              session.type === 'Fuerza' || session.type === 'Hipertrofia'
                                ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                                : session.type === 'Cardio'
                                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                                : session.type === 'Movilidad'
                                ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                                : 'bg-[#56A867]/15 text-[#56A867] border border-[#56A867]/30'
                            }`}
                          >
                            {session.type}
                          </span>
                          <span className="font-bold text-white text-sm">{session.title}</span>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-[#8E8E9E] font-mono">
                          <span className="flex items-center gap-1 text-[#56A867]">
                            <Clock className="w-3.5 h-3.5" />
                            {session.time}
                          </span>
                          <span>•</span>
                          <span>{session.durationMinutes} min</span>
                          <span>•</span>
                          <span>~{session.estimatedKcal} kcal</span>
                          <span>•</span>
                          <span className="text-neutral-300">Intensidad: {session.intensity}</span>
                        </div>

                        {session.exercises && session.exercises.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1 pt-1 border-t border-[#20202E]">
                            {session.exercises.map((ex, eIdx) => (
                              <span
                                key={eIdx}
                                className="px-1.5 py-0.5 rounded bg-[#20202E] text-[10px] font-mono text-[#A0A0B0]"
                              >
                                {ex}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <button
                          type="button"
                          onClick={() => handleToggleCompleted(session.id)}
                          className={`px-2.5 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                            session.completed
                              ? 'bg-[#56A867]/20 text-[#56A867] border border-[#56A867]/40'
                              : 'bg-[#20202E] text-[#8E8E9E] hover:text-white'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>{session.completed ? (language === 'en' ? 'Completed' : 'Completada') : (language === 'en' ? 'Pending' : 'Pendiente')}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteSession(session.id)}
                          className="p-1.5 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors cursor-pointer"
                          title={language === 'en' ? 'Delete session' : 'Eliminar sesión'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-[#14141E] border border-dashed border-[#282838] text-center space-y-1">
                  <Dumbbell className="w-6 h-6 text-[#56A867] mx-auto opacity-70" />
                  <p className="text-xs text-[#8E8E9E]">
                    {language === 'en'
                      ? 'No sessions assigned yet. Pick a recommended preset below or create your own.'
                      : 'No hay sesiones asignadas aún. Elige una plantilla rápida abajo o crea una a medida.'}
                  </p>
                </div>
              )}
            </div>

            {/* Quick 1-Click Routine Presets */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-[#A0A0B0] flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-[#56A867]" />
                  <span>{language === 'en' ? 'Quick Routine Presets (1-Click)' : 'Plantillas Rápidas Recomendadas (1 Clic)'}</span>
                </span>
                <span className="text-[10px] font-mono text-[#707080]">
                  {language === 'en' ? 'Auto-fills form' : 'Rellena automáticamente'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {routinePresets.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleApplyPreset(preset)}
                    className="p-2.5 rounded-xl bg-[#14141E] border border-[#242436] hover:border-[#56A867]/50 hover:bg-[#1A1A28] text-left transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#202030] text-[#56A867] font-bold">
                        {preset.category}
                      </span>
                      <span className="text-[10px] font-mono text-[#707080]">{preset.duration} min</span>
                    </div>
                    <div className="text-xs font-bold text-white mt-1 group-hover:text-[#56A867] transition-colors truncate">
                      {preset.title}
                    </div>
                    <div className="text-[10px] font-mono text-[#707080] truncate mt-0.5">
                      {preset.exercises.join(' • ')}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* New Session Custom Form */}
            {showAddForm && (
              <div className="p-4 sm:p-5 rounded-2xl bg-[#141420] border border-[#2B2B3E] space-y-4">
                <div className="flex items-center justify-between border-b border-[#202030] pb-2">
                  <h4 className="text-xs font-mono font-bold text-white uppercase flex items-center gap-1.5">
                    <Plus className="w-3.5 h-3.5 text-[#56A867]" />
                    <span>{language === 'en' ? 'Configure New Workout Session' : 'Configurar Nueva Sesión de Entrenamiento'}</span>
                  </h4>
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="text-xs font-mono text-[#707080] hover:text-white"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-mono text-[#A0A0B0] block mb-1">
                      {language === 'en' ? 'Routine Title' : 'Título de la Rutina'}:
                    </label>
                    <input
                      type="text"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder={
                        language === 'en'
                          ? 'e.g. Heavy Legs & Glutes (RPE 9)'
                          : 'Ej. Piernas Pesadas & Glúteos (RPE 9)'
                      }
                      className="w-full p-2.5 rounded-xl bg-[#1A1A28] border border-[#2B2B3D] text-white text-xs focus:outline-none focus:border-[#56A867]"
                    />
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div>
                      <label className="text-xs font-mono text-[#A0A0B0] block mb-1">
                        {language === 'en' ? 'Category' : 'Categoría'}:
                      </label>
                      <select
                        value={newType}
                        onChange={(e: any) => setNewType(e.target.value)}
                        className="w-full p-2 rounded-xl bg-[#1A1A28] border border-[#2B2B3D] text-white text-xs focus:outline-none focus:border-[#56A867]"
                      >
                        <option value="Fuerza">{language === 'en' ? 'Strength' : 'Fuerza'}</option>
                        <option value="Hipertrofia">{language === 'en' ? 'Hypertrophy' : 'Hipertrofia'}</option>
                        <option value="Cardio">{language === 'en' ? 'Cardio' : 'Cardio'}</option>
                        <option value="Movilidad">{language === 'en' ? 'Mobility' : 'Movilidad'}</option>
                        <option value="Potencia">{language === 'en' ? 'Power' : 'Potencia'}</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-mono text-[#A0A0B0] block mb-1">
                        {language === 'en' ? 'Time' : 'Hora'}:
                      </label>
                      <input
                        type="time"
                        value={newTime}
                        onChange={(e) => setNewTime(e.target.value)}
                        className="w-full p-2 rounded-xl bg-[#1A1A28] border border-[#2B2B3D] text-white text-xs focus:outline-none focus:border-[#56A867]"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-mono text-[#A0A0B0] block mb-1">
                        {language === 'en' ? 'Duration (min)' : 'Duración (min)'}:
                      </label>
                      <input
                        type="number"
                        min={10}
                        max={180}
                        step={5}
                        value={newDuration}
                        onChange={(e) => setNewDuration(Number(e.target.value))}
                        className="w-full p-2 rounded-xl bg-[#1A1A28] border border-[#2B2B3D] text-white text-xs focus:outline-none focus:border-[#56A867]"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-mono text-[#A0A0B0] block mb-1">
                        {language === 'en' ? 'Intensity' : 'Intensidad'}:
                      </label>
                      <select
                        value={newIntensity}
                        onChange={(e: any) => setNewIntensity(e.target.value)}
                        className="w-full p-2 rounded-xl bg-[#1A1A28] border border-[#2B2B3D] text-white text-xs focus:outline-none focus:border-[#56A867]"
                      >
                        <option value="Baja">{language === 'en' ? 'Low' : 'Baja'}</option>
                        <option value="Media">{language === 'en' ? 'Medium' : 'Media'}</option>
                        <option value="Alta">{language === 'en' ? 'High' : 'Alta'}</option>
                      </select>
                    </div>
                  </div>

                  {/* Exercise Tags Builder */}
                  <div className="space-y-1.5 pt-1">
                    <label className="text-xs font-mono text-[#A0A0B0] block">
                      {language === 'en' ? 'Assigned Exercises (Optional)' : 'Ejercicios Asignados (Opcional)'}:
                    </label>

                    {newExercises.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 p-2 rounded-xl bg-[#101018] border border-[#242434]">
                        {newExercises.map((ex, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-[#56A867]/15 text-[#56A867] text-xs font-mono font-medium border border-[#56A867]/30"
                          >
                            <span>{ex}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveExerciseTag(ex)}
                              className="hover:text-red-400 font-bold ml-1 cursor-pointer"
                            >
                              ✕
                            </button>
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={customExerciseInput}
                        onChange={(e) => setCustomExerciseInput(e.target.value)}
                        placeholder={language === 'en' ? 'Add exercise name and press Enter...' : 'Escribe nombre de ejercicio y presiona Enter...'}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddCustomExercise(e);
                          }
                        }}
                        className="flex-1 p-2 rounded-xl bg-[#1A1A28] border border-[#2B2B3D] text-white text-xs focus:outline-none focus:border-[#56A867]"
                      />
                      <button
                        type="button"
                        onClick={handleAddCustomExercise}
                        className="px-3 py-1.5 rounded-xl bg-[#202030] hover:bg-[#28283C] text-xs font-mono text-white cursor-pointer"
                      >
                        + {language === 'en' ? 'Add' : 'Agregar'}
                      </button>
                    </div>

                    {/* Quick exercise chips from library */}
                    <div className="flex flex-wrap gap-1 pt-1">
                      {commonExercisesList.map((ex, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => handleAddExerciseTag(ex)}
                          className="px-2 py-0.5 rounded bg-[#181824] hover:bg-[#222232] text-[10px] font-mono text-[#8E8E9E] hover:text-[#56A867] cursor-pointer"
                        >
                          + {ex}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={handleCreateSession}
                      className="px-4 py-2 rounded-xl bg-[#56A867] hover:bg-[#64B875] text-black font-bold font-mono text-xs uppercase shadow-md flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{language === 'en' ? 'Add Session to Day' : 'Añadir Sesión al Día'}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 4. Action & Persistence Bar */}
        <div className="pt-4 border-t border-[#1E1E2C] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleResetToDefault}
              className="px-3 py-2 rounded-xl bg-[#161622] hover:bg-[#1E1E2E] text-[#8E8E9E] hover:text-white text-xs font-mono flex items-center justify-center gap-1.5 transition-colors cursor-pointer w-full sm:w-auto"
              title={language === 'en' ? 'Reset to default periodization' : 'Restablecer a recomendación oficial'}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{language === 'en' ? 'Reset Day' : 'Restablecer Día'}</span>
            </button>

            {currentSessions.length > 0 && (
              <button
                type="button"
                onClick={handleDeleteEntireDay}
                className="px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 text-xs font-mono flex items-center justify-center gap-1.5 transition-colors cursor-pointer w-full sm:w-auto"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{language === 'en' ? 'Clear Day' : 'Eliminar Actividad'}</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 rounded-xl bg-[#161622] hover:bg-[#1E1E2E] text-[#8E8E9E] hover:text-white text-xs font-mono font-bold cursor-pointer"
            >
              {language === 'en' ? 'Cancel' : 'Cancelar'}
            </button>

            <button
              type="button"
              onClick={handleSaveAll}
              className="py-2.5 px-6 rounded-xl bg-[#56A867] hover:bg-[#64B875] text-black font-bold text-xs font-mono uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(86,168,103,0.3)] flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{language === 'en' ? 'Save Changes' : 'Guardar Cambios'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
