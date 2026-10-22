/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Plus,
  Check,
  Zap,
  Clock,
  Dumbbell,
  CheckCircle2,
  Award,
  ChevronRight,
  Flame,
  Volume2,
  Sparkles,
  Scale,
  User,
} from 'lucide-react';
import { ExerciseItem, ScreenId, WorkoutSet, UserProfile, WorkoutRoutine } from '../../types';
import { initialExercises } from '../../data/initialData';
import { useApp } from '../../context/AppContext';
import { authService } from '../../services/authService';
import { localDatabase } from '../../db/localDatabase';
import {
  getExerciseLoadForUser,
  getCalibratedExerciseItem,
} from '../../utils/biomechanicalWeights';
import { ScrollReveal } from '../common/ScrollReveal';

interface LiveWorkoutViewProps {
  onNavigate: (screen: ScreenId) => void;
  user?: UserProfile;
  selectedRoutine?: WorkoutRoutine | null;
}

export const LiveWorkoutView: React.FC<LiveWorkoutViewProps> = ({
  onNavigate,
  user,
  selectedRoutine,
}) => {
  const { user: contextUser, setUser } = useApp();
  const currentUser = user || contextUser;

  // Calibrated exercises based on user's registered weight, height, and clothing size
  const rawExerciseList =
    selectedRoutine?.exercises && selectedRoutine.exercises.length > 0
      ? selectedRoutine.exercises
      : initialExercises.slice(0, 3);

  const calibratedExercises = useMemo(() => {
    return rawExerciseList.map((ex) => getCalibratedExerciseItem(ex, currentUser));
  }, [rawExerciseList, currentUser]);

  const [activeExerciseIndex, setActiveExerciseIndex] = useState(0);

  // Active workout timer
  const [elapsedSeconds, setElapsedSeconds] = useState(1458); // ~24 min
  const [isWorkoutActive, setIsWorkoutActive] = useState(true);

  // Rest timer
  const [restSeconds, setRestSeconds] = useState(84); // 01:24
  const [isResting, setIsResting] = useState(true);

  const fallbackExercise: ExerciseItem = {
    id: 'ex-default-squat',
    name: 'Sentadilla Trasera',
    category: 'Piernas',
    primaryMuscle: 'Cuádriceps y Glúteos',
    description: 'Sentadilla profunda con mecánica biomecánica controlada.',
    biomechanicalCues: ['Apoyo trípode en pies', 'Bracing intra-abdominal', 'Columna neutral'],
    commonMistakes: ['Colapso de rodillas', 'Despegue de talones'],
    videoThumbnail: '',
    defaultSets: 4,
    targetRepsRange: '8-10 reps',
  };

  const currentExercise =
    calibratedExercises[activeExerciseIndex] || calibratedExercises[0] || fallbackExercise;

  // Dynamic calibrated target weight for current active exercise and user biometrics
  const targetLoadKg = useMemo(() => {
    return getExerciseLoadForUser(currentExercise.name || currentExercise.id, currentUser);
  }, [currentExercise, currentUser]);

  // Load registration form state initialized to the user's calibrated weight
  const [currentSetNumber, setCurrentSetNumber] = useState(3);
  const [weightKg, setWeightKg] = useState<number>(targetLoadKg);
  const [repsCompleted, setRepsCompleted] = useState(8);
  const [rpe, setRpe] = useState(8.5);

  // Completed sets history dynamically initialized from user's calibrated profile
  const [completedSets, setCompletedSets] = useState<WorkoutSet[]>(() => {
    const warmupKg = Math.max(15, Math.round((targetLoadKg * 0.92) / 2.5) * 2.5);
    return [
      {
        setNumber: 1,
        targetReps: '8 reps',
        weightKg: warmupKg,
        repsCompleted: 8,
        rpe: 7.5,
        completed: true,
        timestamp: '18:04',
      },
      {
        setNumber: 2,
        targetReps: '8 reps',
        weightKg: targetLoadKg,
        repsCompleted: 8,
        rpe: 8.0,
        completed: true,
        timestamp: '18:11',
      },
    ];
  });

  // When active exercise or user changes, synchronize the working weight and completed sets history
  useEffect(() => {
    setWeightKg(targetLoadKg);
    const warmupKg = Math.max(15, Math.round((targetLoadKg * 0.92) / 2.5) * 2.5);
    setCompletedSets([
      {
        setNumber: 1,
        targetReps: '8 reps',
        weightKg: warmupKg,
        repsCompleted: 8,
        rpe: 7.5,
        completed: true,
        timestamp: '18:04',
      },
      {
        setNumber: 2,
        targetReps: '8 reps',
        weightKg: targetLoadKg,
        repsCompleted: 8,
        rpe: 8.0,
        completed: true,
        timestamp: '18:11',
      },
    ]);
  }, [targetLoadKg, currentUser.id, activeExerciseIndex]);

  const [showFinishModal, setShowFinishModal] = useState(false);

  // Elapsed workout timer interval
  useEffect(() => {
    let interval: any = null;
    if (isWorkoutActive) {
      interval = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isWorkoutActive]);

  // Rest countdown timer interval
  useEffect(() => {
    let interval: any = null;
    if (isResting && restSeconds > 0) {
      interval = setInterval(() => {
        setRestSeconds((prev) => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isResting, restSeconds]);

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleRegisterSet = (e: React.FormEvent) => {
    e.preventDefault();
    const newSet: WorkoutSet = {
      setNumber: currentSetNumber,
      targetReps: '8 reps',
      weightKg,
      repsCompleted,
      rpe,
      completed: true,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setCompletedSets([...completedSets, newSet]);
    setCurrentSetNumber((prev) => prev + 1);
    setRestSeconds(90); // Reset rest timer to 90 seconds
    setIsResting(true);
  };

  const totalTonnageRecorded = completedSets.reduce(
    (acc, set) => acc + set.weightKg * set.repsCompleted,
    0
  );

  const handleFinishWorkout = async () => {
    setIsWorkoutActive(false);
    const duration = Math.max(1, Math.round(elapsedSeconds / 60));
    const tonnage = totalTonnageRecorded || Math.round(weightKg * 10);

    try {
      if (currentUser.id) {
        await authService.recordWorkout(currentUser.id, {
          exerciseName: currentExercise.name,
          durationMinutes: duration,
          weightKg: currentUser.weight || 75,
          tonnageRecordedKg: tonnage,
          efficiencyScore: 92,
        });

        const currentSessions = (currentUser.sessionsThisWeek || 0) + 1;
        const newStreak = (currentUser.streakDays || 0) + 1;
        const updated: UserProfile = {
          ...currentUser,
          sessionsThisWeek: currentSessions,
          streakDays: newStreak,
          streakDiscountPercent: Math.min(50, newStreak),
          weeklyVolumePercent: Math.min(100, Math.round((currentSessions / 5) * 100)),
        };
        setUser(updated);
        localDatabase.saveUser(updated);
      }
    } catch (err) {
      console.error('Error persisting workout session:', err);
    }

    setShowFinishModal(true);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto text-left">
      {/* Top Banner with live stats and active account biometrics */}
      <ScrollReveal direction="down" duration={0.4}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[#121218] border border-[#20202A]">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-[#56A867] animate-ping" />
            <div>
              <h1 className="text-lg font-serif font-bold text-white flex items-center gap-2 flex-wrap">
                <span>Sesión en Vivo: {selectedRoutine?.title || 'Leg Day Hypertrophy'}</span>
                <span className="px-2 py-0.5 rounded bg-[#56A867]/15 text-[#56A867] text-[10px] font-mono">
                  SERIE {currentSetNumber}/4
                </span>
              </h1>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#808090] mt-0.5">
                <span>
                  Tiempo: <strong className="font-mono text-white">{formatTime(elapsedSeconds)}</strong>
                </span>
                <span>•</span>
                <span>
                  Carga Acumulada: <strong className="font-mono text-[#56A867]">{totalTonnageRecorded} kg</strong>
                </span>
                <span>•</span>
                <span className="px-2 py-0.5 rounded bg-[#1A1A26] border border-[#2B2B3E] text-[#B0B0C4] font-mono text-[11px] flex items-center gap-1.5">
                  <Scale className="w-3 h-3 text-[#56A867]" />
                  <span>Cuenta: <strong className="text-white">{currentUser.name}</strong></span>
                  <span>({currentUser.weight || 78} kg • {currentUser.height || 178} cm • Talla {currentUser.clothingSize || 'M'})</span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsWorkoutActive(!isWorkoutActive)}
              className="p-2.5 rounded-xl bg-[#1A1A24] border border-[#2B2B38] text-white hover:text-[#56A867] text-xs transition-colors"
              title={isWorkoutActive ? 'Pausar sesión' : 'Reanudar sesión'}
            >
              {isWorkoutActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>

            <button
              onClick={handleFinishWorkout}
              className="py-2.5 px-4 rounded-xl bg-[#FF4D4D]/20 hover:bg-[#FF4D4D] text-[#FF4D4D] hover:text-white font-bold text-xs border border-[#FF4D4D]/40 transition-all shadow-md"
            >
              Finalizar Sesión
            </button>
          </div>
        </div>
      </ScrollReveal>

      {/* 3-Column Athletic Grid */}
      <ScrollReveal direction="up" delay={0.1} duration={0.4}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 3 cols: Exercise Progress List */}
        <div className="lg:col-span-3 p-5 rounded-2xl bg-[#121218] border border-[#20202A] space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#1E1E28]">
              <span className="text-xs font-mono uppercase text-[#808090]">Ejercicios del Bloque</span>
              <span className="text-xs font-mono text-[#56A867] font-bold">
                {activeExerciseIndex + 1}/{calibratedExercises.length}
              </span>
            </div>

            <div className="space-y-2">
              {calibratedExercises.map((ex, index) => {
                const isActive = index === activeExerciseIndex;
                const isPast = index < activeExerciseIndex;
                const exTargetLoad = getExerciseLoadForUser(ex.name || ex.id, currentUser);
                return (
                  <button
                    key={ex.id}
                    onClick={() => setActiveExerciseIndex(index)}
                    className={`w-full p-3 rounded-xl text-left text-xs transition-all flex items-center justify-between border ${
                      isActive
                        ? 'bg-[#56A867]/15 border-[#56A867]/40 text-white shadow-[0_0_15px_rgba(86,168,103,0.1)]'
                        : isPast
                        ? 'bg-[#15151E] border-[#22222E] text-[#808090]'
                        : 'bg-[#101015] border-[#1C1C24] text-[#A0A0B0] hover:bg-[#181822]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center font-mono text-[10px] font-bold ${
                          isActive
                            ? 'bg-[#56A867] text-black'
                            : isPast
                            ? 'bg-[#22222E] text-[#56A867]'
                            : 'bg-[#1E1E28] text-[#707080]'
                        }`}
                      >
                        {isPast ? <Check className="w-3.5 h-3.5" /> : index + 1}
                      </div>
                      <div className="truncate">
                        <div className="font-semibold truncate">{ex.name}</div>
                        <div className="text-[10px] text-[#707080] font-mono flex items-center gap-1.5">
                          <span>{ex.defaultSets} × {ex.targetRepsRange}</span>
                          <span>•</span>
                          <span className="text-[#56A867] font-bold">@{exTargetLoad}kg</span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#181822] border border-[#242432] text-xs space-y-1">
            <span className="text-[10px] font-mono text-[#56A867] uppercase font-bold">
              Cue Biomecánico
            </span>
            <p className="text-[#A0A0B0] text-[11px] leading-relaxed">
              {currentExercise.biomechanicalCues[0]}
            </p>
          </div>
        </div>

        {/* Center 5 cols: Rest Timer & Biomechanical Visual */}
        <div className="lg:col-span-5 p-6 rounded-2xl bg-[#121218] border border-[#20202A] flex flex-col justify-between space-y-6">
          {/* Exercise Visual Container */}
          <div className="relative rounded-xl overflow-hidden h-48 sm:h-56 bg-[#0E0E12] border border-[#22222C]">
            <img
              src={currentExercise.videoThumbnail}
              alt={currentExercise.name}
              className="w-full h-full object-cover opacity-60"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#121218] via-transparent to-transparent" />
            <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/80 backdrop-blur-md border border-[#56A867]/40 text-[#56A867] text-[10px] font-mono font-bold uppercase">
              {currentExercise.primaryMuscleGroup}
            </div>
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
              <div>
                <span className="text-xs font-mono text-[#A0A0B0]">Ejercicio Activo</span>
                <h3 className="text-lg font-serif font-bold text-white leading-tight">
                  {currentExercise.name}
                </h3>
              </div>
              <span className="px-3 py-1 rounded-lg bg-[#56A867] text-black font-mono font-bold text-xs shadow-lg">
                {targetLoadKg} kg
              </span>
            </div>
          </div>

          {/* Rest Countdown Circle */}
          <div className="p-6 rounded-2xl bg-[#171722] border border-[#252535] flex flex-col items-center justify-center text-center space-y-3 relative overflow-hidden">
            <div className="flex items-center gap-2 text-xs font-mono text-[#56A867]">
              <Clock className="w-4 h-4 animate-spin" />
              <span className="uppercase tracking-widest font-bold">Tiempo de Descanso</span>
            </div>

            <div className="text-5xl sm:text-6xl font-serif font-bold text-white tracking-wider font-mono">
              {formatTime(restSeconds)}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setRestSeconds((prev) => prev + 30)}
                className="py-1.5 px-3 rounded-lg bg-[#20202E] text-white text-xs font-mono hover:bg-[#2A2A3C] transition-colors border border-[#303042]"
              >
                +30s
              </button>
              <button
                onClick={() => setIsResting(!isResting)}
                className="py-1.5 px-3 rounded-lg bg-[#20202E] text-white text-xs font-mono hover:bg-[#2A2A3C] transition-colors border border-[#303042]"
              >
                {isResting ? 'Pausar' : 'Continuar'}
              </button>
              <button
                onClick={() => setRestSeconds(0)}
                className="py-1.5 px-3 rounded-lg bg-[#56A867]/15 text-[#56A867] text-xs font-mono hover:bg-[#56A867]/25 transition-colors border border-[#56A867]/30 font-bold"
              >
                Saltar
              </button>
            </div>
          </div>
        </div>

        {/* Right 4 cols: Dynamic Load Registration Form */}
        <div className="lg:col-span-4 p-6 rounded-2xl bg-[#121218] border border-[#20202A] space-y-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#1E1E28]">
              <h3 className="text-sm font-mono font-bold uppercase text-white">
                Registro de Serie (S{currentSetNumber})
              </h3>
              <span className="text-[10px] font-mono text-[#56A867] font-bold">
                Target: 8 reps @ {targetLoadKg}kg
              </span>
            </div>

            <div className="mt-2.5 p-2 rounded-lg bg-[#171722] border border-[#252535] text-[11px] font-mono text-[#9EA0B0] flex items-center justify-between">
              <span>Calibrado para {currentUser.name}:</span>
              <strong className="text-[#56A867]">{currentUser.weight || 78} kg • Talla {currentUser.clothingSize || 'M'}</strong>
            </div>
          </div>

          <form onSubmit={handleRegisterSet} className="space-y-4 text-left">
            <div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-mono text-[#A0A0B0] block mb-1">
                    Carga (kg)
                  </label>
                  <input
                    type="number"
                    value={weightKg}
                    onChange={(e) => setWeightKg(Number(e.target.value))}
                    step="0.5"
                    required
                    className="w-full p-2.5 rounded-xl bg-[#181822] border border-[#272734] text-white text-base font-mono font-bold focus:outline-none focus:border-[#56A867]"
                  />
                </div>

                <div>
                  <label className="text-xs font-mono text-[#A0A0B0] block mb-1">
                    Reps Realizadas
                  </label>
                  <input
                    type="number"
                    value={repsCompleted}
                    onChange={(e) => setRepsCompleted(Number(e.target.value))}
                    min={1}
                    max={50}
                    required
                    className="w-full p-2.5 rounded-xl bg-[#181822] border border-[#272734] text-white text-base font-mono font-bold focus:outline-none focus:border-[#56A867]"
                  />
                </div>
              </div>

              {/* Quick load adjustments */}
              <div className="flex items-center gap-1 mt-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setWeightKg((w) => Math.max(2.5, w - 5))}
                  className="px-2 py-0.5 rounded bg-[#1A1A26] border border-[#27273A] text-[10px] font-mono text-[#A0A0B0] hover:text-white"
                >
                  -5 kg
                </button>
                <button
                  type="button"
                  onClick={() => setWeightKg((w) => Math.max(2.5, w - 2.5))}
                  className="px-2 py-0.5 rounded bg-[#1A1A26] border border-[#27273A] text-[10px] font-mono text-[#A0A0B0] hover:text-white"
                >
                  -2.5 kg
                </button>
                <button
                  type="button"
                  onClick={() => setWeightKg(targetLoadKg)}
                  className="px-2 py-0.5 rounded bg-[#56A867]/15 border border-[#56A867]/40 text-[10px] font-mono text-[#56A867] font-bold"
                  title="Restablecer a carga calculada según registro"
                >
                  Calibrado ({targetLoadKg}kg)
                </button>
                <button
                  type="button"
                  onClick={() => setWeightKg((w) => w + 2.5)}
                  className="px-2 py-0.5 rounded bg-[#1A1A26] border border-[#27273A] text-[10px] font-mono text-[#A0A0B0] hover:text-white"
                >
                  +2.5 kg
                </button>
                <button
                  type="button"
                  onClick={() => setWeightKg((w) => w + 5)}
                  className="px-2 py-0.5 rounded bg-[#1A1A26] border border-[#27273A] text-[10px] font-mono text-[#A0A0B0] hover:text-white"
                >
                  +5 kg
                </button>
              </div>
            </div>

            {/* RPE Scale Slider */}
            <div>
              <div className="flex items-center justify-between text-xs font-mono mb-1">
                <span className="text-[#A0A0B0]">Esfuerzo Percibido (RPE):</span>
                <span className="text-[#56A867] font-bold text-sm">{rpe} / 10</span>
              </div>
              <input
                type="range"
                min="6"
                max="10"
                step="0.5"
                value={rpe}
                onChange={(e) => setRpe(Number(e.target.value))}
                className="w-full h-1.5 bg-[#22222E] rounded-lg appearance-none cursor-pointer accent-[#56A867]"
              />
              <div className="flex justify-between text-[10px] text-[#606070] font-mono mt-1">
                <span>RIR 4 (Fácil)</span>
                <span>RPE 8 (2 en recámara)</span>
                <span className="text-[#FF4D4D]">RPE 10 (Fallo)</span>
              </div>
            </div>

            {/* Métrica de Explosividad y VBT */}
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono font-bold text-amber-400 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5" />
                  <span>Métrica de Explosividad (VBT)</span>
                </span>
                <span className="font-mono text-[10px] text-amber-300">
                  Potencia: {Math.max(150, Math.round(weightKg * 9.8 * 0.92))} W
                </span>
              </div>
              <p className="text-[11px] text-neutral-300 leading-tight">
                Velocidad concéntrica óptima: <strong className="text-white">&gt;0.85 m/s</strong>. Despegue con máxima aceleración terminal y cadencia explosiva.
              </p>
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 rounded-xl bg-[#56A867] hover:bg-[#64B875] text-black font-bold text-xs uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(86,168,103,0.25)] flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Registrar Serie {currentSetNumber}</span>
            </button>
          </form>

          {/* Series History Table */}
          <div className="pt-3 border-t border-[#1E1E28] space-y-2">
            <span className="text-[10px] font-mono uppercase text-[#707080]">
              Series Completadas Hoy:
            </span>
            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {completedSets.map((set, idx) => (
                <div
                  key={idx}
                  className="p-2 rounded-lg bg-[#161620] border border-[#22222E] flex items-center justify-between text-xs font-mono"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded bg-[#56A867]/15 text-[#56A867] flex items-center justify-center text-[10px] font-bold">
                      S{set.setNumber}
                    </span>
                    <span className="text-white font-bold">{set.weightKg} kg</span>
                    <span className="text-[#A0A0B0]">× {set.repsCompleted} reps</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px]">
                    <span className="text-[#56A867]">RPE {set.rpe}</span>
                    <Check className="w-3.5 h-3.5 text-[#56A867]" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </ScrollReveal>

      {/* Workout Completion Summary Modal */}
      {showFinishModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#121218] border border-[#56A867]/50 rounded-2xl p-6 shadow-[0_0_50px_rgba(86,168,103,0.2)] text-center space-y-5">
            <div className="w-16 h-16 rounded-full bg-[#56A867]/20 border border-[#56A867] flex items-center justify-center text-[#56A867] mx-auto animate-bounce">
              <Award className="w-8 h-8" />
            </div>

            <div>
              <span className="text-xs font-mono uppercase tracking-widest text-[#56A867] font-bold">
                Sesión Concluida Con Éxito
              </span>
              <h2 className="text-2xl font-serif font-bold text-white mt-1">
                ¡Gran Trabajo, {currentUser.name.split(' ')[0]}!
              </h2>
              <p className="text-xs text-[#9E9EA8] mt-1">
                Tus métricas de carga han sido sincronizadas con tu cuenta y perfil ({currentUser.weight || 78} kg • Talla {currentUser.clothingSize || 'M'}).
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-[#181822] border border-[#272734] text-xs font-mono">
              <div>
                <span className="text-[#707080] text-[10px]">Tiempo</span>
                <div className="text-white font-bold">{formatTime(elapsedSeconds)}</div>
              </div>
              <div>
                <span className="text-[#707080] text-[10px]">Carga Acumulada</span>
                <div className="text-[#56A867] font-bold">{totalTonnageRecorded} kg</div>
              </div>
              <div>
                <span className="text-[#707080] text-[10px]">Series</span>
                <div className="text-white font-bold">{completedSets.length}</div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowFinishModal(false);
                  onNavigate('athlete-dashboard');
                }}
                className="flex-1 py-3 rounded-xl bg-[#56A867] hover:bg-[#64B875] text-black font-bold text-xs uppercase tracking-wider shadow-lg"
              >
                Volver al Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
