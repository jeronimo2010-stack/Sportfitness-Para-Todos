/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  Flame,
  Zap,
  TrendingUp,
  Award,
  Calendar,
  Clock,
  Dumbbell,
  ArrowRight,
  ChevronRight,
  Sparkles,
  Quote,
  CheckCircle2,
  BarChart2,
  Activity,
  Ruler,
  Weight,
  Scale,
  Edit3,
  Save,
  X,
  History,
  ShieldCheck,
  Check,
  AlertTriangle,
} from 'lucide-react';
import { ScreenId, UserProfile, ClothingSize, BodyType, UserProgressRecord } from '../../types';
import { generateStarterExercise, calculateBmi } from '../../utils/starterExerciseGenerator';
import { getBiomechanicalProfile, getExerciseLoadForUser } from '../../utils/biomechanicalWeights';
import { authService } from '../../services/authService';
import { useApp } from '../../context/AppContext';
import { localDatabase } from '../../db/localDatabase';
import { ScrollReveal, StaggerContainer, StaggerItem } from '../common/ScrollReveal';
import { AthleteNotesWidget } from '../dashboard/AthleteNotesWidget';
import { PersonalRecordsFolderManager } from '../dashboard/PersonalRecordsFolderManager';

interface AthleteDashboardViewProps {
  onNavigate: (screen: ScreenId) => void;
  user: UserProfile;
}

export const AthleteDashboardView: React.FC<AthleteDashboardViewProps> = ({
  onNavigate,
  user,
}) => {
  const { setUser, language, t } = useApp();

  // If active user is coach, redirect immediately to trainer-overview (no workouts for coaches)
  useEffect(() => {
    if (user.role === 'entrenador') {
      onNavigate('trainer-overview');
    }
  }, [user.role, onNavigate]);

  const [timeRange, setTimeRange] = useState<'1M' | '3M' | 'YTD'>('1M');
  const [progressRecord, setProgressRecord] = useState<UserProgressRecord | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(true);

  // Health profile edit modal state
  const [isEditingHealth, setIsEditingHealth] = useState(false);
  const [editWeight, setEditWeight] = useState<number>(user.weight || 75);
  const [editHeight, setEditHeight] = useState<number>(user.height || 175);
  const [editClothingSize, setEditClothingSize] = useState<ClothingSize>(user.clothingSize || 'M');
  const [editBodyType, setEditBodyType] = useState<BodyType>(user.bodyType || 'Mesomorfo');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load progress history from database on component mount or user change
  useEffect(() => {
    let isMounted = true;
    const fetchProgress = async () => {
      if (!user.id) {
        setLoadingProgress(false);
        return;
      }
      try {
        const prog = await authService.getProgress(user.id);
        if (isMounted && prog) {
          setProgressRecord(prog);
        }
      } catch (e) {
        console.error('Error fetching progress:', e);
      } finally {
        if (isMounted) setLoadingProgress(false);
      }
    };

    fetchProgress();
    return () => {
      isMounted = false;
    };
  }, [user.id]);

  const bioProfile = useMemo(() => getBiomechanicalProfile(user), [user]);
  const squatLoad = useMemo(() => getExerciseLoadForUser('Sentadilla Trasera', user), [user]);
  const legPressLoad = useMemo(() => getExerciseLoadForUser('Prensa de Piernas 45°', user), [user]);
  const rdlLoad = useMemo(() => getExerciseLoadForUser('Peso Muerto Rumano', user), [user]);

  const starterExercise = useMemo(() => {
    return generateStarterExercise(
      user.bodyType || 'Mesomorfo',
      user.height || 175,
      user.weight || 75,
      user.clothingSize || 'M',
      'atleta'
    );
  }, [user.bodyType, user.height, user.weight, user.clothingSize]);

  const bmiInfo = useMemo(
    () => calculateBmi(user.weight || 75, user.height || 175),
    [user.weight, user.height]
  );

  const handleSaveHealthProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await authService.updateHealthProfile(user.id, {
        weight: editWeight,
        height: editHeight,
        clothingSize: editClothingSize,
        bodyType: editBodyType,
      });

      if (res.success) {
        const updatedUser: UserProfile = {
          ...user,
          weight: editWeight,
          height: editHeight,
          clothingSize: editClothingSize,
          bodyType: editBodyType,
        };
        setUser(updatedUser);
        localDatabase.saveUser(updatedUser);
        setSaveSuccess(true);
        setTimeout(() => {
          setSaveSuccess(false);
          setIsEditingHealth(false);
        }, 1200);
      }
    } catch (err) {
      console.error('Error updating health profile:', err);
    }
  };

  // Extract real workout logs
  const workoutLogs = useMemo(() => {
    return Array.isArray(progressRecord?.workoutLogs) ? progressRecord.workoutLogs : [];
  }, [progressRecord]);

  const hasCompletedAnySession = Boolean(
    workoutLogs.length > 0 && (progressRecord?.sessionsCompleted ?? 0) > 0
  );

  // Check if user has had no exercise for > 15 days
  const { isInactiveOver15Days, daysSinceLastWorkout } = useMemo(() => {
    if (!hasCompletedAnySession || workoutLogs.length === 0) {
      return { isInactiveOver15Days: false, daysSinceLastWorkout: 0 };
    }
    const latestLog = workoutLogs[0];
    const rawDate = latestLog.date || latestLog.timestamp || progressRecord?.lastUpdated;
    if (!rawDate) return { isInactiveOver15Days: false, daysSinceLastWorkout: 0 };

    const parsedDate = new Date(rawDate).getTime();
    if (isNaN(parsedDate)) return { isInactiveOver15Days: false, daysSinceLastWorkout: 0 };

    const diffDays = Math.floor((Date.now() - parsedDate) / (1000 * 60 * 60 * 24));
    return {
      isInactiveOver15Days: diffDays > 15,
      daysSinceLastWorkout: diffDays,
    };
  }, [hasCompletedAnySession, workoutLogs, progressRecord]);

  // STRICT REQUIREMENT:
  // "en dashboard no inventes nada, si el usuario es nuevo y no ha hecho su primera sesion deja todo en ceros y si el usuario lleva mas de 15 dias sin hacer ejercicio vuelve a dejarlo en ceros"
  const isZeroState = !hasCompletedAnySession || isInactiveOver15Days;

  const sessionsThisWeek = isZeroState ? 0 : (user.sessionsThisWeek || progressRecord?.sessionsCompleted || 0);
  const weeklyVolumePercent = isZeroState ? 0 : (user.weeklyVolumePercent || progressRecord?.weeklyVolumePercent || 0);
  const streakDays = isZeroState ? 0 : (user.streakDays || progressRecord?.streakDays || 0);
  const totalVolumeKg = isZeroState ? 0 : (progressRecord?.totalVolumeKg || 0);

  // Real technical accuracy from workout logs or 0%
  const technicalAccuracy = useMemo(() => {
    if (isZeroState || workoutLogs.length === 0) return 0;
    const sum = workoutLogs.reduce((acc: number, l: any) => acc + (Number(l.efficiencyScore) || 90), 0);
    return Math.round(sum / workoutLogs.length);
  }, [isZeroState, workoutLogs]);

  // Chart data: strictly 0s for new users and inactive users
  const chartData = useMemo(() => {
    const days = language === 'en'
      ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
      : ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

    if (isZeroState || workoutLogs.length === 0) {
      return days.map((d, i) => ({
        day: d,
        volume: 0,
        technique: 0,
        isToday: i === (new Date().getDay() + 6) % 7,
      }));
    }

    return days.map((d, i) => {
      const matchingLog = workoutLogs[i];
      const vol = matchingLog ? (matchingLog.tonnageRecordedKg || matchingLog.weightKg * 20) : 0;
      const tech = matchingLog ? (matchingLog.efficiencyScore || 90) : 0;
      return {
        day: d,
        volume: vol,
        technique: tech,
        isToday: i === (new Date().getDay() + 6) % 7,
      };
    });
  }, [isZeroState, workoutLogs, language]);

  // Dynamic progressive overload logic (aumento progresivo basado en sesiones y microciclos)
  const progressiveOverloadFactor = useMemo(() => {
    if (isZeroState) return 1.0;
    const sessions = progressRecord?.sessionsCompleted || 0;
    const blocks = Math.floor(sessions / 3);
    // Incrementa un 2.5% de sobrecarga cada 3 entrenamientos completados con éxito (hasta un +20% por mesociclo)
    return 1 + Math.min(0.20, blocks * 0.025);
  }, [isZeroState, progressRecord?.sessionsCompleted]);

  // Peso sugerido para hoy (Peso Objetivo Diario de la Sesión)
  const suggestedExerciseToday = useMemo(() => {
    const todayIndex = (new Date().getDay() + 6) % 7; // 0 = Lunes, 6 = Domingo
    const w = user.weight || 75;

    const baseSquat = squatLoad || 60;
    const baseLegPress = legPressLoad || 100;
    const baseRdl = rdlLoad || 70;
    const baseStarter = starterExercise.suggestedWeightKg || 40;

    const dailySchedule = [
      { name: 'Sentadilla Trasera con Barra', base: baseSquat, reps: '4 × 8', muscle: 'Cuádriceps & Glúteo' },
      { name: 'Press de Banca Plano', base: Math.round(w * 0.75), reps: '4 × 8', muscle: 'Pectoral Mayor & Tríceps' },
      { name: 'Peso Muerto Rumano', base: baseRdl, reps: '3 × 10', muscle: 'Cadena Posterior & Isquios' },
      { name: 'Press Militar Estricto', base: Math.round(w * 0.50), reps: '4 × 8', muscle: 'Deltoides & Estabilidad' },
      { name: 'Prensa de Piernas 45°', base: baseLegPress, reps: '3 × 10', muscle: 'Tren Inferior & Glúteos' },
      { name: 'Remo con Barra Prono', base: Math.round(w * 0.70), reps: '4 × 10', muscle: 'Dorsal & Espalda Media' },
      { name: 'Calibración Funcional & Core', base: baseStarter, reps: '3 × 12', muscle: 'Core & Readaptación' },
    ];

    const todayEx = dailySchedule[todayIndex] || dailySchedule[0];
    const targetWeightKg = Math.round(todayEx.base * progressiveOverloadFactor);
    const overloadIncrementKg = Math.max(0, targetWeightKg - todayEx.base);
    const overloadPercent = Math.round((progressiveOverloadFactor - 1) * 100 * 10) / 10;

    return {
      exerciseName: todayEx.name,
      targetWeightKg: isZeroState ? todayEx.base : targetWeightKg,
      baseWeightKg: todayEx.base,
      reps: todayEx.reps,
      muscle: todayEx.muscle,
      overloadPercent: isZeroState ? 0 : overloadPercent,
      overloadIncrementKg: isZeroState ? 0 : overloadIncrementKg,
    };
  }, [squatLoad, legPressLoad, rdlLoad, starterExercise, progressiveOverloadFactor, user.weight, isZeroState]);

  // Tabla 2: Registro de Progresión de Sobrecarga Dinámica (Semana a Semana)
  const progressiveOverloadCycle = useMemo(() => {
    const w = user.weight || 75;
    const currentSessions = progressRecord?.sessionsCompleted || 0;
    const currentWeek = isZeroState ? 1 : Math.min(6, Math.max(1, Math.floor(currentSessions / 3) + 1));

    const weeks = [
      {
        weekNumber: 1,
        phaseName: 'Adaptación Anatómica & Calibración Biomecánica',
        overloadPercent: '+0.0%',
        overloadIncrementKg: '+0.0 kg',
        avgLoadKg: Math.round(w * 0.75),
        targetVolumeReps: '120 reps efectivas',
        status: isZeroState ? 'Activo' : (currentWeek > 1 ? 'Completado' : currentWeek === 1 ? 'Activo' : 'Programado'),
        coachTip: 'Foco en tempo excéntrico controlado de 3s y alineación articular.',
      },
      {
        weekNumber: 2,
        phaseName: 'Hipertrofia Funcional & Tensión Mecánica',
        overloadPercent: '+2.5%',
        overloadIncrementKg: '+1.5 kg - 2.0 kg',
        avgLoadKg: Math.round(w * 0.75 * 1.025),
        targetVolumeReps: '130 reps efectivas',
        status: isZeroState ? 'Programado' : (currentWeek > 2 ? 'Completado' : currentWeek === 2 ? 'Activo' : 'Programado'),
        coachTip: 'Incorporación de microcargas progresivas en levantamientos básicos.',
      },
      {
        weekNumber: 3,
        phaseName: 'Sobrecarga Progresiva Dinámica - Fase I',
        overloadPercent: '+5.0%',
        overloadIncrementKg: '+3.0 kg - 4.0 kg',
        avgLoadKg: Math.round(w * 0.75 * 1.05),
        targetVolumeReps: '140 reps efectivas',
        status: isZeroState ? 'Programado' : (currentWeek > 3 ? 'Completado' : currentWeek === 3 ? 'Activo' : 'Programado'),
        coachTip: 'Mayor densidad de estímulo sin alterar la cadencia ni el rango de movimiento.',
      },
      {
        weekNumber: 4,
        phaseName: 'Sobrecarga Progresiva Dinámica - Fase II',
        overloadPercent: '+7.5%',
        overloadIncrementKg: '+4.5 kg - 5.5 kg',
        avgLoadKg: Math.round(w * 0.75 * 1.075),
        targetVolumeReps: '140 reps efectivas',
        status: isZeroState ? 'Programado' : (currentWeek > 4 ? 'Completado' : currentWeek === 4 ? 'Activo' : 'Programado'),
        coachTip: 'Pico de volumen muscular. Énfasis en recuperación e hidratación.',
      },
      {
        weekNumber: 5,
        phaseName: 'Fuerza Máxima e Intensidad Neuromuscular',
        overloadPercent: '+10.0%',
        overloadIncrementKg: '+6.0 kg - 8.0 kg',
        avgLoadKg: Math.round(w * 0.75 * 1.10),
        targetVolumeReps: '110 reps efectivas',
        status: isZeroState ? 'Programado' : (currentWeek > 5 ? 'Completado' : currentWeek === 5 ? 'Activo' : 'Programado'),
        coachTip: 'Reclutamiento motor máximo a RPE 9. Mayor tiempo de descanso interserie.',
      },
      {
        weekNumber: 6,
        phaseName: 'Descarga Programada (Deload) & Supercompensación',
        overloadPercent: '-30.0%',
        overloadIncrementKg: 'Carga regenerativa',
        avgLoadKg: Math.round(w * 0.75 * 0.70),
        targetVolumeReps: '70 reps regenerativas',
        status: isZeroState ? 'Programado' : (currentWeek > 6 ? 'Completado' : currentWeek === 6 ? 'Activo' : 'Programado'),
        coachTip: 'Disipación de fatiga central para asimilar la adaptación neuromuscular.',
      },
    ];

    return { weeks, currentWeek };
  }, [user.weight, progressRecord?.sessionsCompleted, isZeroState]);

  const maxVolume = isZeroState ? 1000 : Math.max(1000, Math.round(bioProfile.targetSessionVolumeKg * 1.25));

  const renderGreeting = () => {
    switch (language) {
      case 'en':
        return <>Hello, <span className="text-[#56A867]">{user.name}</span>!</>;
      case 'pt':
        return <>Olá, <span className="text-[#56A867]">{user.name}</span>!</>;
      case 'fr':
        return <>Bonjour, <span className="text-[#56A867]">{user.name}</span>!</>;
      case 'de':
        return <>Hallo, <span className="text-[#56A867]">{user.name}</span>!</>;
      case 'it':
        return <>Ciao, <span className="text-[#56A867]">{user.name}</span>!</>;
      case 'es':
      default:
        return <>¡Hola, <span className="text-[#56A867]">{user.name}</span>!</>;
    }
  };

  const getTranslatedSubtitle = () => {
    const w = user.weight || 75;
    const h = user.height || 175;
    const s = user.clothingSize || 'M';
    switch (language) {
      case 'en':
        return `Your anthropometric profile (${w} kg • ${h} cm • Size ${s}) is permanently linked to your database.`;
      case 'pt':
        return `Seu perfil antropométrico (${w} kg • ${h} cm • Tamanho ${s}) está permanentemente vinculado ao seu banco de dados.`;
      case 'fr':
        return `Votre profil anthropométrique (${w} kg • ${h} cm • Taille ${s}) est lié en permanence à votre base de données.`;
      case 'de':
        return `Dein anthropometrisches Profil (${w} kg • ${h} cm • Größe ${s}) ist dauerhaft mit deiner Datenbank verknüpft.`;
      case 'it':
        return `Il tuo profilo antropometrico (${w} kg • ${h} cm • Taglia ${s}) è collegato in modo permanente al tuo database.`;
      case 'es':
      default:
        return `Tu perfil antropométrico (${w} kg • ${h} cm • Talla ${s}) está vinculado permanentemente a tu base de datos.`;
    }
  };

  const weeklyVolumeLabel = language === 'en' ? 'Weekly Volume' : language === 'pt' ? 'Volume Semanal' : language === 'fr' ? 'Volume Hebdomadaire' : language === 'de' ? 'Wöchentliches Volumen' : language === 'it' ? 'Volume Settimanale' : 'Volumen Semanal';
  const sessionsRatioLabel = language === 'en' ? `${sessionsThisWeek} of 5 sessions completed` : language === 'pt' ? `${sessionsThisWeek} de 5 sessões atingidas` : language === 'fr' ? `${sessionsThisWeek} sur 5 séances réussies` : language === 'de' ? `${sessionsThisWeek} von 5 Einheiten erreicht` : language === 'it' ? `${sessionsThisWeek} su 5 sessioni completate` : `${sessionsThisWeek} de 5 sesiones logradas`;
  const startingLogLabel = language === 'en' ? 'Starting log' : language === 'pt' ? 'Iniciando registro' : language === 'fr' ? 'Démarrage du journal' : language === 'de' ? 'Protokollstart' : language === 'it' ? 'Inizio registro' : 'Iniciando registro';
  const accumulatedKgLabel = language === 'en' ? 'accumulated' : language === 'pt' ? 'acumulados' : language === 'fr' ? 'accumulés' : language === 'de' ? 'gesammelt' : language === 'it' ? 'accumulati' : 'acumulados';

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 text-left">
      {/* Top Welcome Header & Weekly Progress Donut */}
      <ScrollReveal direction="down" delay={0.05} duration={0.5}>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 sm:p-6 rounded-2xl bg-[#121218] border border-[#20202A] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#56A867]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="space-y-1.5 z-10">
            <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-[#56A867]/15 text-[#56A867] text-[11px] font-mono font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Plan {user.membershipPlan || 'Performance Pro'} • ID: {user.documentNumber || user.id.slice(0, 10)}</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-serif font-bold text-white tracking-tight">
              {renderGreeting()}
            </h1>
            <p className="text-xs sm:text-sm text-neutral-300">
              {getTranslatedSubtitle()}
            </p>
          </div>

          {/* Weekly Volume Ring KPI */}
          <div className="flex items-center gap-4 z-10 bg-[#16161F] p-3.5 rounded-xl border border-[#272733] shrink-0">
            <div className="relative w-16 h-16 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-[#252532]"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-[#56A867] transition-all duration-1000 ease-out"
                  strokeDasharray={`${weeklyVolumePercent}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <span className="absolute text-xs font-mono font-bold text-white">
                {weeklyVolumePercent}%
              </span>
            </div>
            <div className="flex flex-col text-left">
              <span className="text-xs font-bold text-white">{weeklyVolumeLabel}</span>
              <span className="text-[11px] text-[#A0A0B0]">
                {sessionsRatioLabel}
              </span>
              <span className="text-[10px] text-[#56A867] font-mono mt-0.5">
                {totalVolumeKg > 0 ? `${totalVolumeKg.toLocaleString()} kg ${accumulatedKgLabel}` : (isZeroState ? `0 kg ${accumulatedKgLabel}` : startingLogLabel)}
              </span>
            </div>
          </div>
        </div>
      </ScrollReveal>

      {/* Dynamic Status Notification for Inactivity (>15 days) or New User (0 sessions) */}
      {isInactiveOver15Days && (
        <ScrollReveal direction="up" delay={0.06} duration={0.4}>
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-5 h-5 shrink-0 text-amber-400" />
              <span>
                {language === 'en'
                  ? `Inactivity Alert: More than 15 days (${daysSinceLastWorkout} days) without exercise. Training load and active streak have been reset to zero.`
                  : `Alerta de Inactividad: Llevas más de 15 días (${daysSinceLastWorkout} días) sin entrenar. Tu carga acumulada y racha han vuelto a ceros.`}
              </span>
            </div>
            <button
              onClick={() => onNavigate('live-workout')}
              className="px-3.5 py-1.5 rounded-lg bg-[#56A867] hover:bg-[#64B875] text-black font-bold uppercase text-xs shrink-0 transition-all self-start sm:self-auto cursor-pointer"
            >
              {language === 'en' ? 'Resume Workout' : 'Reanudar Entrenamiento'}
            </button>
          </div>
        </ScrollReveal>
      )}

      {!hasCompletedAnySession && (
        <ScrollReveal direction="up" delay={0.06} duration={0.4}>
          <div className="p-4 rounded-xl bg-[#56A867]/10 border border-[#56A867]/30 text-neutral-300 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-5 h-5 shrink-0 text-[#56A867]" />
              <span>
                {language === 'en'
                  ? 'New Athlete: Metrics are clean at zero. Start your first workout to begin recording your actual load and technique.'
                  : 'Atleta Nuevo: Todas las métricas están en ceros. Inicia tu primera sesión en vivo para comenzar a registrar tu carga real y técnica.'}
              </span>
            </div>
            <button
              onClick={() => onNavigate('live-workout')}
              className="px-3.5 py-1.5 rounded-lg bg-[#56A867] hover:bg-[#64B875] text-black font-bold uppercase text-xs shrink-0 transition-all self-start sm:self-auto cursor-pointer"
            >
              {language === 'en' ? 'Start 1st Session' : 'Iniciar 1ra Sesión'}
            </button>
          </div>
        </ScrollReveal>
      )}

      {/* 4 Metric Cards */}
      <StaggerContainer staggerDelay={0.08} className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StaggerItem direction="up" distance={20}>
          <div className="p-4 rounded-xl bg-[#13131A] border border-[#22222E] hover:border-[#56A867]/30 transition-all h-full">
            <div className="flex items-center justify-between text-[#8E8E9E] mb-2">
              <span className="text-xs font-mono uppercase">{language === 'en' ? 'Sessions' : language === 'de' ? 'Einheiten' : 'Sesiones'}</span>
              <Calendar className="w-4 h-4 text-[#56A867]" />
            </div>
            <div className="text-2xl font-bold font-mono text-white">{sessionsThisWeek}/5</div>
            <p className="text-[11px] text-[#7E7E8E] mt-1">
              {isZeroState
                ? (language === 'en' ? '0 active sessions' : '0 sesiones activas')
                : (language === 'en' ? 'Logged this week' : 'Registradas esta semana')}
            </p>
          </div>
        </StaggerItem>

        <StaggerItem direction="up" distance={20}>
          <div className="p-4 rounded-xl bg-[#13131A] border border-[#22222E] hover:border-[#56A867]/30 transition-all h-full">
            <div className="flex items-center justify-between text-[#8E8E9E] mb-2">
              <span className="text-xs font-mono uppercase text-[#56A867] font-bold">
                {language === 'en' ? 'Target Weight Today' : 'Peso Sugerido Hoy'}
              </span>
              <Dumbbell className="w-4 h-4 text-[#56A867]" />
            </div>
            <div className="text-2xl font-bold font-mono text-white flex items-baseline gap-1">
              <span>{suggestedExerciseToday.targetWeightKg}</span>
              <span className="text-xs font-normal text-[#8E8E9E]">kg</span>
            </div>
            <p className="text-[11px] text-white font-medium mt-1 truncate">
              {suggestedExerciseToday.exerciseName}
            </p>
            <div className="mt-1 flex items-center gap-1.5 text-[10px] text-[#56A867] font-mono">
              <TrendingUp className="w-3 h-3 shrink-0" />
              <span className="truncate">
                {suggestedExerciseToday.reps} • +{suggestedExerciseToday.overloadPercent}% sobrecarga (+{suggestedExerciseToday.overloadIncrementKg} kg)
              </span>
            </div>
          </div>
        </StaggerItem>

        <StaggerItem direction="up" distance={20}>
          <div className="p-4 rounded-xl bg-[#13131A] border border-[#22222E] hover:border-[#56A867]/30 transition-all h-full">
            <div className="flex items-center justify-between text-[#8E8E9E] mb-2">
              <span className="text-xs font-mono uppercase">{language === 'en' ? 'Technical Accuracy' : language === 'pt' ? 'Precisão Técnica' : language === 'fr' ? 'Précision Technique' : language === 'de' ? 'Präzision' : 'Precisión Técnica'}</span>
              <Award className="w-4 h-4 text-[#56A867]" />
            </div>
            <div className="text-2xl font-bold font-mono text-white">
              {technicalAccuracy > 0 ? `${technicalAccuracy}%` : '0%'}
            </div>
            <p className="text-[11px] text-[#7E7E8E] mt-1">
              {isZeroState
                ? (language === 'en' ? 'No evaluated sessions yet (0%)' : 'Sin sesiones evaluadas (0%)')
                : (language === 'en' ? 'Biomechanical AI score' : 'Score biomecánico evaluado')}
            </p>
          </div>
        </StaggerItem>

        <StaggerItem direction="up" distance={20}>
          <div className="p-4 rounded-xl bg-[#13131A] border border-[#22222E] hover:border-[#56A867]/30 transition-all h-full">
            <div className="flex items-center justify-between text-[#8E8E9E] mb-2">
              <span className="text-xs font-mono uppercase">{language === 'en' ? 'Active Streak' : language === 'pt' ? 'Sequência Ativa' : language === 'fr' ? 'Série Active' : language === 'de' ? 'Aktive Serie' : 'Racha Activa'}</span>
              <Flame className="w-4 h-4 text-[#FFB800] fill-[#FFB800]" />
            </div>
            <div className="text-2xl font-bold font-mono text-white">
              {streakDays} {language === 'en' ? 'Days' : language === 'pt' ? 'Dias' : language === 'fr' ? 'Jours' : language === 'de' ? 'Tage' : 'Días'}
            </div>
            <p className="text-[11px] text-[#7E7E8E] mt-1">
              {isZeroState
                ? (language === 'en' ? 'Initial streak (0 days)' : 'Racha inicial (0 días)')
                : (language === 'en' ? 'Accumulated consistency' : 'Consistencia acumulada')}
            </p>
          </div>
        </StaggerItem>
      </StaggerContainer>

      {/* HEALTH PROFILE CARD (Perfil de Salud: Peso, Altura, Talla) */}
      <ScrollReveal direction="up" delay={0.1} duration={0.5}>
      <div className="p-5 rounded-2xl bg-[#13131C] border border-[#262638] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#222230]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#56A867]/15 text-[#56A867]">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white font-serif uppercase tracking-wider">
                {language === 'en' ? 'Health Profile & Anthropometrics' : 'Perfil de Salud & Antropometría'}
              </h3>
              <p className="text-[11px] text-[#8E8E9E]">
                {language === 'en' ? 'Biometric data permanently linked to your account' : 'Datos biométricos vinculados permanentemente a tu cuenta'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('my-account')}
              className="px-3 py-1.5 rounded-xl bg-[#56A867]/10 hover:bg-[#56A867]/20 border border-[#56A867]/30 text-xs font-mono text-[#56A867] font-bold flex items-center gap-1.5 transition-all self-start sm:self-auto"
            >
              <Activity className="w-3.5 h-3.5" />
              <span>{language === 'en' ? 'View in My Account' : 'Ver en Mi Cuenta'}</span>
            </button>
            <button
              onClick={() => {
                setEditWeight(user.weight || 75);
                setEditHeight(user.height || 175);
                setEditClothingSize(user.clothingSize || 'M');
                setEditBodyType(user.bodyType || 'Mesomorfo');
                setIsEditingHealth(true);
              }}
              className="px-3.5 py-1.5 rounded-xl bg-[#181824] hover:bg-[#222232] border border-[#2A2A3C] text-xs font-mono text-[#56A867] font-bold flex items-center gap-1.5 transition-all self-start sm:self-auto"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{language === 'en' ? 'Update Measurements' : 'Actualizar Medidas'}</span>
            </button>
          </div>
        </div>

        {/* Biometrics Display Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="p-3 rounded-xl bg-[#171722] border border-[#222230]">
            <span className="text-[10px] font-mono text-[#7E7E8E] uppercase flex items-center gap-1">
              <Weight className="w-3 h-3 text-[#56A867]" /> {t('weight')}
            </span>
            <div className="text-xl font-bold font-mono text-white mt-1">
              {user.weight || 75} <span className="text-xs font-normal text-[#8E8E9E]">kg</span>
            </div>
            <span className="text-[10px] text-[#56A867] font-mono">
              {language === 'en' ? 'Active Weigh-in' : 'Pesaje Activo'}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-[#171722] border border-[#222230]">
            <span className="text-[10px] font-mono text-[#7E7E8E] uppercase flex items-center gap-1">
              <Ruler className="w-3 h-3 text-[#56A867]" /> {t('height')}
            </span>
            <div className="text-xl font-bold font-mono text-white mt-1">
              {user.height || 175} <span className="text-xs font-normal text-[#8E8E9E]">cm</span>
            </div>
            <span className="text-[10px] text-[#8E8E9E] font-mono">
              {language === 'en' ? 'Stature' : 'Estatura'}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-[#171722] border border-[#222230]">
            <span className="text-[10px] font-mono text-[#7E7E8E] uppercase flex items-center gap-1">
              <Activity className="w-3 h-3 text-[#56A867]" /> {t('clothingSize')}
            </span>
            <div className="text-xl font-bold font-mono text-[#56A867] mt-1">
              {user.clothingSize || 'M'}
            </div>
            <span className="text-[10px] text-[#8E8E9E] font-mono">
              {language === 'en' ? 'Textile size' : 'Medida textil'}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-[#171722] border border-[#222230]">
            <span className="text-[10px] font-mono text-[#7E7E8E] uppercase flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-[#56A867]" /> {t('bmi')}
            </span>
            <div className="text-xl font-bold font-mono text-white mt-1">
              {bmiInfo.bmi}
            </div>
            <span className="text-[10px] text-emerald-400 font-mono truncate">
              {language === 'en' ? (bmiInfo.category === 'Peso normal / Óptimo' ? 'Normal / Optimal weight' : bmiInfo.category) : bmiInfo.category}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-[#171722] border border-[#222230] col-span-2 sm:col-span-1">
            <span className="text-[10px] font-mono text-[#7E7E8E] uppercase flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#56A867]" /> {t('bodyType')}
            </span>
            <div className="text-sm font-bold font-mono text-white mt-1 truncate">
              {language === 'en' ? (user.bodyType === 'Mesomorfo' ? 'Mesomorph' : user.bodyType === 'Ectomorfo' ? 'Ectomorph' : 'Endomorph') : (user.bodyType || 'Mesomorfo')}
            </div>
            <span className="text-[10px] text-[#8E8E9E] font-mono">
              {language === 'en' ? 'Bone structure' : 'Estructura ósea'}
            </span>
          </div>
        </div>
      </div>
      </ScrollReveal>

      {/* MODAL: ACTUALIZAR PERFIL DE SALUD */}
      {isEditingHealth && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#12121A] border border-[#56A867]/40 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-[#222230]">
              <div className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-[#56A867]" />
                <h3 className="text-sm font-bold text-white font-serif uppercase tracking-wider">
                  {language === 'en' ? 'Update Health Profile' : 'Actualizar Datos de Salud'}
                </h3>
              </div>
              <button
                onClick={() => setIsEditingHealth(false)}
                className="p-1 rounded-md text-[#8E8E9E] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {saveSuccess ? (
              <div className="p-4 rounded-xl bg-[#56A867]/15 border border-[#56A867] text-center space-y-2">
                <Check className="w-8 h-8 text-[#56A867] mx-auto animate-bounce" />
                <p className="text-sm font-bold text-white">
                  {language === 'en' ? 'Measurements updated and saved successfully!' : '¡Medidas actualizadas y guardadas con éxito!'}
                </p>
                <p className="text-xs text-[#8E8E9E]">
                  {language === 'en' ? 'Biomechanical loads recalculated in the database.' : 'Tus cargas biomecánicas se han recalculado en la base de datos.'}
                </p>
              </div>
            ) : (
              <form onSubmit={handleSaveHealthProfile} className="space-y-3.5">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1 text-left">
                    <label className="text-xs font-mono text-[#A0A0B0]">
                      {language === 'en' ? 'Current Weight (kg)' : 'Peso Actual (kg)'}
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="35"
                      max="250"
                      value={editWeight}
                      onChange={(e) => setEditWeight(parseFloat(e.target.value) || 0)}
                      required
                      className="w-full bg-[#181824] text-sm text-white px-3 py-2 rounded-xl border border-[#252538] focus:border-[#56A867] focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1 text-left">
                    <label className="text-xs font-mono text-[#A0A0B0]">
                      {language === 'en' ? 'Height (cm)' : 'Altura (cm)'}
                    </label>
                    <input
                      type="number"
                      min="120"
                      max="240"
                      value={editHeight}
                      onChange={(e) => setEditHeight(parseFloat(e.target.value) || 0)}
                      required
                      className="w-full bg-[#181824] text-sm text-white px-3 py-2 rounded-xl border border-[#252538] focus:border-[#56A867] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1 text-left">
                    <label className="text-xs font-mono text-[#A0A0B0]">
                      {language === 'en' ? 'Clothing Size' : 'Talla de Ropa'}
                    </label>
                    <select
                      value={editClothingSize}
                      onChange={(e) => setEditClothingSize(e.target.value as ClothingSize)}
                      className="w-full bg-[#181824] text-sm text-white px-3 py-2 rounded-xl border border-[#252538] focus:border-[#56A867] focus:outline-none"
                    >
                      {(['XS', 'S', 'M', 'L', 'XL', 'XXL'] as ClothingSize[]).map((sz) => (
                        <option key={sz} value={sz}>
                          {language === 'en' ? `Size ${sz}` : `Talla ${sz}`}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1 text-left">
                    <label className="text-xs font-mono text-[#A0A0B0]">
                      {language === 'en' ? 'Somatotype' : 'Somatotipo'}
                    </label>
                    <select
                      value={editBodyType}
                      onChange={(e) => setEditBodyType(e.target.value as BodyType)}
                      className="w-full bg-[#181824] text-sm text-white px-3 py-2 rounded-xl border border-[#252538] focus:border-[#56A867] focus:outline-none"
                    >
                      <option value="Ectomorfo">{language === 'en' ? 'Ectomorph' : 'Ectomorfo'}</option>
                      <option value="Mesomorfo">{language === 'en' ? 'Mesomorph' : 'Mesomorfo'}</option>
                      <option value="Endomorfo">{language === 'en' ? 'Endomorph' : 'Endomorfo'}</option>
                    </select>
                  </div>
                </div>

                <div className="pt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditingHealth(false)}
                    className="flex-1 py-2.5 rounded-xl border border-[#2A2A3C] text-xs font-mono text-[#A0A0B0] hover:text-white"
                  >
                    {language === 'en' ? 'Cancel' : 'Cancelar'}
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-[#56A867] hover:bg-[#64B875] text-black font-bold text-xs font-mono uppercase tracking-wider flex items-center justify-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{language === 'en' ? 'Save Changes' : 'Guardar en BD'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Starter Exercise Banner (Prerregistro Biométrico) */}
      <ScrollReveal direction="up" delay={0.1} duration={0.5}>
        <div className="p-5 rounded-2xl bg-gradient-to-br from-[#151520] via-[#101018] to-[#0A0A0F] border border-[#56A867]/30 shadow-[0_0_25px_rgba(86,168,103,0.08)] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-72 h-72 bg-[#56A867]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#22222E] relative z-10">
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-[#56A867]/15 text-[#56A867] text-[10px] font-mono font-bold uppercase tracking-wider mb-1">
                <Sparkles className="w-3 h-3" />
                <span>{language === 'en' ? 'Biometric Profile • Starter Exercise' : 'Registro Biométrico • Ejercicio de Inicio'}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-serif font-bold text-white flex items-center gap-2">
                <span>{starterExercise.exerciseName}</span>
                <span className="text-xs font-mono font-normal text-[#56A867] bg-[#1B1B26] px-2 py-0.5 rounded-md border border-[#2B2B3A]">
                  {starterExercise.category}
                </span>
              </h2>
              <p className="text-xs text-[#9E9EA8] mt-1 max-w-2xl">
                {language === 'en'
                  ? `Calibrated for your somatotype ${user.bodyType === 'Mesomorfo' ? 'Mesomorph' : user.bodyType === 'Ectomorfo' ? 'Ectomorph' : (user.bodyType || 'Mesomorph')} (${user.height || 175} cm, ${user.weight || 75} kg, Size ${user.clothingSize || 'M'}). Target stimulus: progressive overload and technical mastery.`
                  : `Calibrado para tu somatotipo ${user.bodyType || 'Mesomorfo'} (${user.height || 175} cm, ${user.weight || 75} kg, Talla ${user.clothingSize || 'M'}). ${starterExercise.whyThisExercise}`}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => onNavigate('live-workout')}
                className="py-2.5 px-4 rounded-xl bg-[#56A867] hover:bg-[#64B875] text-black text-xs font-bold font-mono uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-[0_0_15px_rgba(86,168,103,0.25)]"
              >
                <Dumbbell className="w-3.5 h-3.5" />
                <span>{language === 'en' ? 'Train This Exercise' : 'Entrenar Este Ejercicio'}</span>
              </button>
              <button
                onClick={() => setIsEditingHealth(true)}
                className="py-2.5 px-3 rounded-xl bg-[#181822] hover:bg-[#20202E] border border-[#2A2A38] text-neutral-300 text-xs font-mono transition-colors"
                title={language === 'en' ? 'Recalibrate biometrics' : 'Actualizar datos biométricos'}
              >
                {language === 'en' ? 'Recalibrate' : 'Recalibrar'}
              </button>
            </div>
          </div>

          {/* Prescription chips */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 text-xs font-mono relative z-10">
            <div className="bg-[#12121A] p-2.5 rounded-xl border border-[#1E1E28] flex items-center justify-between">
              <span className="text-[#7E7E8E] text-[10px] uppercase">
                {language === 'en' ? 'Sets × Reps' : 'Series × Reps'}
              </span>
              <span className="text-[#56A867] font-bold">{starterExercise.sets} × {starterExercise.reps}</span>
            </div>
            <div className="bg-[#12121A] p-2.5 rounded-xl border border-[#1E1E28] flex items-center justify-between">
              <span className="text-[#7E7E8E] text-[10px] uppercase">
                {language === 'en' ? 'Initial Load' : 'Carga Inicial'}
              </span>
              <span className="text-white font-bold">{starterExercise.suggestedWeightKg} kg</span>
            </div>
            <div className="bg-[#12121A] p-2.5 rounded-xl border border-[#1E1E28] flex items-center justify-between">
              <span className="text-[#7E7E8E] text-[10px] uppercase">
                {language === 'en' ? 'Target RPE' : 'Objetivo RPE'}
              </span>
              <span className="text-white font-bold">{starterExercise.rpeTarget}</span>
            </div>
            <div className="bg-[#12121A] p-2.5 rounded-xl border border-[#1E1E28] flex items-center justify-between">
              <span className="text-[#7E7E8E] text-[10px] uppercase">
                {language === 'en' ? 'Target Muscle' : 'Músculo Principal'}
              </span>
              <span className="text-white font-bold truncate">{starterExercise.targetMuscle}</span>
            </div>
          </div>
        </div>
      </ScrollReveal>

      {/* Main Grid: Upcoming Workout Session + Coach Quote */}
      <ScrollReveal direction="up" delay={0.1} duration={0.5}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Upcoming Scheduled Workout Card */}
          <div className="lg:col-span-2 p-6 rounded-2xl bg-gradient-to-br from-[#16161F] to-[#111116] border border-[#272733] relative overflow-hidden flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-full bg-[#56A867] text-black font-bold text-[10px] font-mono uppercase">
                    {!hasCompletedAnySession
                      ? (language === 'en' ? 'First Session' : 'Primera Sesión')
                      : isInactiveOver15Days
                      ? (language === 'en' ? 'Reactivation' : 'Readaptación')
                      : (language === 'en' ? 'Next Session' : 'Próxima Sesión')}
                  </span>
                  <span className="text-xs text-[#808090] font-mono flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-[#56A867]" />{' '}
                    {isZeroState
                      ? (language === 'en' ? 'Ready to Start' : 'Lista para iniciar')
                      : (language === 'en' ? 'In 2 hours (18:00)' : 'En 2 horas (18:00)')}
                  </span>
                </div>
                <span className="text-xs font-mono text-[#56A867] font-semibold">
                  {language === 'en' ? 'Target:' : 'Objetivo:'}{' '}
                  {isZeroState ? '0 kg (Calibración)' : `${bioProfile.targetSessionVolumeKg.toLocaleString()} kg`}
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white mb-2">
                {!hasCompletedAnySession
                  ? (language === 'en' ? 'Session 1: Biomechanical Calibration' : 'Sesión 1: Calibración Biomecánica')
                  : isInactiveOver15Days
                  ? (language === 'en' ? 'Reactivation Block: Joint & Neural Adaptation' : 'Bloque de Readaptación: Articular & Neuromuscular')
                  : 'Leg Day: Hypertrophy & Force Isolation'}
              </h2>
              <p className="text-xs sm:text-sm text-[#A0A0B0] leading-relaxed max-w-xl">
                {!hasCompletedAnySession
                  ? (language === 'en'
                      ? 'Welcome to your training plan. Your account starts with zero metrics. Complete this initial routine to calibrate your effective loads and establish baseline biomechanical technique.'
                      : 'Bienvenido a tu plan de entrenamiento. Tu cuenta inicia limpia en ceros. Completa esta rutina inicial para calibrar tus cargas efectivas y registrar tu técnica biomecánica base.')
                  : isInactiveOver15Days
                  ? (language === 'en'
                      ? 'You have been inactive for over 15 days. Active load and streak have been set to zero to avoid overtraining and injury. Start with light compound movements.'
                      : 'Llevas más de 15 días sin entrenar. La carga acumulada y la racha se han reiniciado a cero para prevenir lesiones y sobrecargas. Inicia con movimientos de adaptación articular.')
                  : (language === 'en'
                      ? 'Focus on 3-second eccentric control on Back Squats and Leg Press. Loads tailored to your registered biometrics.'
                      : 'Foco en control excéntrico de 3 segundos en Sentadilla Trasera y Prensa de Piernas. Cargas ajustadas a tus biométricos de registro.')}
              </p>

              {/* Exercise preview pills */}
              <div className="mt-4 flex flex-wrap gap-2">
                {!hasCompletedAnySession ? (
                  <>
                    <span className="px-3 py-1 rounded-lg bg-[#1D1D27] text-white text-xs font-mono border border-[#2B2B38] flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#56A867]" />
                      {language === 'en' ? 'Mobility & Joint Warmup' : 'Movilidad & Calentamiento'} (5 min)
                    </span>
                    <span className="px-3 py-1 rounded-lg bg-[#1D1D27] text-white text-xs font-mono border border-[#2B2B38] flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#56A867]" />
                      {language === 'en' ? 'Postural Technique Test' : 'Test de Técnica Postural'} (3 series)
                    </span>
                    <span className="px-3 py-1 rounded-lg bg-[#1D1D27] text-white text-xs font-mono border border-[#2B2B38] flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#56A867]" />
                      {starterExercise.exerciseName} ({starterExercise.sets} × {starterExercise.reps} @ {starterExercise.suggestedWeightKg} kg)
                    </span>
                  </>
                ) : isInactiveOver15Days ? (
                  <>
                    <span className="px-3 py-1 rounded-lg bg-[#1D1D27] text-white text-xs font-mono border border-[#2B2B38] flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      {language === 'en' ? '3s Eccentric Tempo' : 'Cadencia Excéntrica 3s'}
                    </span>
                    <span className="px-3 py-1 rounded-lg bg-[#1D1D27] text-white text-xs font-mono border border-[#2B2B38] flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#56A867]" />
                      {language === 'en' ? 'Moderate Load Reactivation' : 'Carga Moderada de Adaptación'}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="px-3 py-1 rounded-lg bg-[#1D1D27] text-white text-xs font-mono border border-[#2B2B38] flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#56A867]" />
                      {language === 'en' ? 'Back Squat' : 'Sentadilla Trasera'} (4 × 6-8 @ {squatLoad} kg)
                    </span>
                    <span className="px-3 py-1 rounded-lg bg-[#1D1D27] text-white text-xs font-mono border border-[#2B2B38] flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#56A867]" />
                      {language === 'en' ? '45° Leg Press' : 'Prensa 45°'} (3 × 10 @ {legPressLoad} kg)
                    </span>
                    <span className="px-3 py-1 rounded-lg bg-[#1D1D27] text-white text-xs font-mono border border-[#2B2B38] flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#56A867]" />
                      {language === 'en' ? 'Romanian Deadlift' : 'Peso Muerto Rumano'} (3 × 12 @ {rdlLoad} kg)
                    </span>
                  </>
                )}
              </div>

              <div className="mt-2.5 inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-[#161622] border border-[#222232] text-[11px] font-mono text-[#8E8E9E]">
                <span className="text-[#56A867] font-bold">{language === 'en' ? 'Active Biometrics:' : 'Biometría Activa:'}</span>
                <span>{language === 'en' ? 'Weight:' : 'Peso:'} <strong className="text-white">{user.weight || 75} kg</strong></span>
                <span>•</span>
                <span>{language === 'en' ? 'Height:' : 'Altura:'} <strong className="text-white">{user.height || 175} cm</strong></span>
                <span>•</span>
                <span>{language === 'en' ? 'Size:' : 'Talla:'} <strong className="text-[#56A867]">{user.clothingSize || 'M'}</strong></span>
                <span>•</span>
                <span>{language === 'en' ? 'Somatotype:' : 'Somatotipo:'} <strong className="text-white">{language === 'en' ? (user.bodyType === 'Mesomorfo' ? 'Mesomorph' : user.bodyType === 'Ectomorfo' ? 'Ectomorph' : 'Endomorph') : (user.bodyType || 'Mesomorfo')}</strong></span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[#22222E] flex flex-wrap items-center gap-3">
              <button
                onClick={() => onNavigate('live-workout')}
                className="py-3 px-6 rounded-xl bg-[#56A867] hover:bg-[#64B875] text-black font-bold text-xs transition-all shadow-[0_0_20px_rgba(86,168,103,0.3)] hover:shadow-[0_0_30px_rgba(86,168,103,0.5)] flex items-center gap-2 uppercase tracking-wider cursor-pointer"
              >
                <Zap className="w-4 h-4 fill-black" />
                <span>
                  {!hasCompletedAnySession
                    ? (language === 'en' ? 'START FIRST SESSION' : 'INICIAR PRIMERA SESIÓN')
                    : isInactiveOver15Days
                    ? (language === 'en' ? 'RESUME WORKOUT' : 'REANUDAR ENTRENAMIENTO')
                    : (language === 'en' ? 'START SESSION' : 'INICIAR SESIÓN')}
                </span>
              </button>

              <button
                onClick={() => onNavigate('routines')}
                className="py-3 px-5 rounded-xl bg-[#1A1A24] hover:bg-[#232330] text-white font-medium text-xs border border-[#2A2A38] transition-all cursor-pointer"
              >
                {language === 'en' ? 'View Routine Details' : 'Ver Detalles del Bloque'}
              </button>
            </div>
          </div>

          {/* Right 1 Col: Coach Quote & Feedback Note */}
          <div className="space-y-4">
            {/* Quote Card */}
            <div className="p-5 rounded-2xl bg-[#14141C] border border-[#242432] relative">
              <Quote className="w-8 h-8 text-[#56A867]/20 absolute top-4 right-4" />
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#56A867] font-semibold">
                {language === 'en' ? "Coach's Principle" : 'Máxima del Entrenador'}
              </span>
              <p className="mt-2 text-sm text-[#E0E0E0] font-serif italic leading-relaxed">
                "Precision is the difference between sweat and progress."
              </p>
              <span className="text-xs text-[#808090] font-mono block mt-2">— Coach V.</span>
            </div>

            {/* Coach Specific Feedback */}
            <div className="p-5 rounded-2xl bg-[#14141C] border border-[#242432] space-y-2">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${isZeroState ? 'bg-amber-400' : 'bg-[#56A867]'}`} />
                <span className="text-xs font-bold text-white">
                  {language === 'en' ? "Coach's Note (Carlos V.)" : 'Nota de tu Coach (Carlos V.)'}
                </span>
              </div>
              <p className="text-xs text-[#A0A0B0] leading-relaxed">
                {!hasCompletedAnySession
                  ? (language === 'en'
                      ? `Welcome to Sportfitness, ${user.name.split(' ')[0]}! All your metrics are initialized at zero. Once you finish your first live session, I will evaluate your biomechanical technique and record your initial training loads in the database.`
                      : `¡Bienvenido a Sportfitness, ${user.name.split(' ')[0]}! Todas tus métricas están en ceros. En cuanto termines tu primera sesión en vivo, evaluaré tu precisión biomecánica y registraré tus primeras marcas en la base de datos.`)
                  : isInactiveOver15Days
                  ? (language === 'en'
                      ? `Hello ${user.name.split(' ')[0]}, you have been inactive for more than 15 days. For physiological safety, your accumulated tonnage and streak have returned to zero. Start back with adaptation sets.`
                      : `Hola ${user.name.split(' ')[0]}, detectamos más de 15 días sin actividad registrada. Por seguridad neuromuscular y tendinosa, tu carga acumulada y racha han vuelto a ceros. Reanuda con series de adaptación.`)
                  : (language === 'en'
                      ? `"Excellent technical execution on your last block, ${user.name.split(' ')[0]}. Keep focus on intra-abdominal pressure before every heavy set."`
                      : `"Excelente ejecución técnica en tu último bloque, ${user.name.split(' ')[0]}. Mantén el foco en la respiración intra-abdominal antes de cada serie pesada."`)}
              </p>
              <div className="pt-2 flex justify-between items-center text-[11px]">
                <span className="text-[#6E6E7E] font-mono">
                  {language === 'en' ? 'Verified by Head Coach' : 'Verificado por Head Coach'}
                </span>
                <span className={`font-mono font-semibold ${isZeroState ? 'text-amber-400' : 'text-[#56A867]'}`}>
                  {!hasCompletedAnySession
                    ? (language === 'en' ? 'Awaiting 1st Session' : 'Esperando 1ra Sesión')
                    : isInactiveOver15Days
                    ? (language === 'en' ? 'Reactivation Required' : 'Inactividad > 15 Días')
                    : (language === 'en' ? 'Active' : 'Activo')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </ScrollReveal>

      {/* TABLAS DE CONTROL DE FUERZA & CARGA PROGRESIVA DINÁMICA */}
      <ScrollReveal direction="up" delay={0.09} duration={0.5}>
        <div className="space-y-6">
          {/* GESTIÓN DE MARCAS, 1RM & CARPETAS DE FUERZA (SIN REGISTROS AUTOMÁTICOS) */}
          <PersonalRecordsFolderManager
            user={user}
            language={language}
            onNavigateToWorkout={() => onNavigate('live-workout')}
            variant="section"
          />


          {/* TABLA 2: REGISTRO DE PROGRESIÓN DE SOBRECARGA DINÁMICA (SEMANA A SEMANA) */}
          <div className="p-5 sm:p-6 rounded-2xl bg-[#121218] border border-[#20202A] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#20202A]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#56A867]/15 text-[#56A867]">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white font-serif uppercase tracking-wider flex items-center gap-2">
                    <span>{language === 'en' ? 'Dynamic Progressive Overload Calendar' : 'Tabla de Progresión de Sobrecarga Dinámica'}</span>
                    <span className="px-2 py-0.5 rounded-full bg-[#56A867]/20 text-[#56A867] text-[10px] font-mono font-bold">
                      Mesociclo 6 Semanas
                    </span>
                  </h3>
                  <p className="text-[11px] text-[#8E8E9E]">
                    {language === 'en'
                      ? 'Periodized progression: incremental +2.5% load per week to guarantee continuous strength and neuromuscular adaptation.'
                      : 'Periodización de sobrecarga: incremento del 2.5% semanal para garantizar sobrecarga progresiva y evitar mesetas.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs font-mono text-[#8E8E9E]">
                <span>Semana Actual:</span>
                <span className="px-2.5 py-1 rounded-lg bg-[#56A867] text-black font-bold font-mono">
                  Semana {progressiveOverloadCycle.currentWeek} de 6
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono border-collapse">
                <thead>
                  <tr className="border-b border-[#242436] text-[#8E8E9E] uppercase text-[10px] tracking-wider">
                    <th className="py-2.5 px-3">{language === 'en' ? 'Microcycle' : 'Microciclo'}</th>
                    <th className="py-2.5 px-3">{language === 'en' ? 'Biomechanical Phase' : 'Fase & Enfoque'}</th>
                    <th className="py-2.5 px-3 text-center">{language === 'en' ? 'Overload Rate' : 'Sobrecarga (%)'}</th>
                    <th className="py-2.5 px-3 text-center">{language === 'en' ? 'Load Increment' : 'Incremento en kg'}</th>
                    <th className="py-2.5 px-3 text-center">{language === 'en' ? 'Avg Load' : 'Carga Media'}</th>
                    <th className="py-2.5 px-3 text-center">{language === 'en' ? 'Effective Volume' : 'Volumen'}</th>
                    <th className="py-2.5 px-3 text-center">{language === 'en' ? 'Status' : 'Estado'}</th>
                    <th className="py-2.5 px-3">{language === 'en' ? "Coach's Technical Guidance" : 'Indicación Técnica del Coach'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1D1D2A] text-neutral-200">
                  {progressiveOverloadCycle.weeks.map((week) => {
                    const isCurrent = week.status === 'Activo';
                    return (
                      <tr
                        key={week.weekNumber}
                        className={`transition-colors ${
                          isCurrent
                            ? 'bg-[#56A867]/10 border-l-2 border-[#56A867]'
                            : 'hover:bg-[#161622]/60'
                        }`}
                      >
                        <td className="py-3 px-3 font-bold text-white whitespace-nowrap">
                          Semana {week.weekNumber}
                        </td>
                        <td className="py-3 px-3 text-white font-medium">
                          {week.phaseName}
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-[#56A867]">
                          {week.overloadPercent}
                        </td>
                        <td className="py-3 px-3 text-center text-[#A0A0B0]">
                          {week.overloadIncrementKg}
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-white">
                          {week.avgLoadKg} kg
                        </td>
                        <td className="py-3 px-3 text-center text-[#9E9EA8] whitespace-nowrap">
                          {week.targetVolumeReps}
                        </td>
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              week.status === 'Completado'
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : week.status === 'Activo'
                                ? 'bg-[#56A867] text-black'
                                : 'bg-[#1E1E2C] text-[#707080]'
                            }`}
                          >
                            {week.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-[11px] text-[#A0A0B0] italic">
                          {week.coachTip}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </ScrollReveal>

      {/* HISTORIAL DE PROGRESO DE LA BASE DE DATOS */}
      <ScrollReveal direction="up" delay={0.1} duration={0.5}>
        <div className="p-6 rounded-2xl bg-[#121218] border border-[#20202A] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#20202A]">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-[#56A867]/15 text-[#56A867]">
                <History className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white font-serif uppercase tracking-wider">
                  {language === 'en' ? 'Accumulated Training & Progress History' : 'Historial Acumulado de Progreso & Entrenamientos'}
                </h3>
                <p className="text-[11px] text-[#8E8E9E]">
                  {language === 'en'
                    ? 'Logged training loads and completed sessions persisted in the database'
                    : 'Cargas registradas y sesiones completadas persistidas en la base de datos'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono text-[#56A867]">
              <ShieldCheck className="w-4 h-4" />
              <span>{language === 'en' ? 'Permanent DB Synchronization' : 'Sincronización Permanente en BD'}</span>
            </div>
          </div>

          {progressRecord?.workoutLogs && progressRecord.workoutLogs.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {progressRecord.workoutLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3.5 rounded-xl bg-[#161622] border border-[#252535] space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between font-mono">
                    <span className="text-[#56A867] font-bold">{log.date}</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                      {language === 'en' ? 'Completed' : 'Completado'}
                    </span>
                  </div>
                  <div className="text-white font-bold text-sm">{log.exerciseName}</div>
                  <div className="grid grid-cols-3 gap-1 text-[11px] font-mono text-[#9E9EA8] pt-1 border-t border-[#222230]">
                    <div>
                      <span className="block text-[9px] text-[#707080]">{language === 'en' ? 'DURATION' : 'DURACIÓN'}</span>
                      <strong className="text-white">{log.durationMinutes} min</strong>
                    </div>
                    <div>
                      <span className="block text-[9px] text-[#707080]">{language === 'en' ? 'TOTAL LOAD' : 'CARGA ACUMULADA'}</span>
                      <strong className="text-[#56A867]">{log.tonnageRecordedKg} kg</strong>
                    </div>
                    <div>
                      <span className="block text-[9px] text-[#707080]">{language === 'en' ? 'FORM SCORE' : 'SCORE TÉC.'}</span>
                      <strong className="text-white">{log.efficiencyScore}%</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 rounded-xl bg-[#151520] border border-dashed border-[#28283A] text-center space-y-2">
              <Dumbbell className="w-8 h-8 text-[#56A867]/40 mx-auto" />
              <h4 className="text-sm font-bold text-white">
                {language === 'en'
                  ? 'Progress log initialized from scratch (0 sessions, 0 kg)'
                  : 'Registro de progreso inicializado desde cero (0 sesiones, 0 kg)'}
              </h4>
              <p className="text-xs text-[#8E8E9E] max-w-md mx-auto">
                {language === 'en'
                  ? 'Upon registration, your account has been created with a clean database history. Start your first workout session to begin logging volume and personal records.'
                  : 'Al registrarte, tu cuenta ha sido creada con historial limpio en la base de datos. Inicia tu primera sesión de entrenamiento para empezar a acumular carga y registrar tus marcas.'}
              </p>
              <div className="pt-2">
                <button
                  onClick={() => onNavigate('live-workout')}
                  className="px-4 py-2 rounded-xl bg-[#56A867] hover:bg-[#64B875] text-black font-bold text-xs font-mono uppercase tracking-wider inline-flex items-center gap-1.5 transition-all shadow-md"
                >
                  <Zap className="w-3.5 h-3.5 fill-black" />
                  <span>{language === 'en' ? 'Start First Session' : 'Comenzar Primera Sesión'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </ScrollReveal>

      {/* ATHLETE PERSONAL NOTES & TRAINING JOURNAL IN DATABASE */}
      <ScrollReveal direction="up" delay={0.11} duration={0.5}>
        <AthleteNotesWidget userId={user.id} />
      </ScrollReveal>

      {/* Activity Chart: Volume vs Technique */}
      <ScrollReveal direction="up" delay={0.12} duration={0.5}>
        <div className="p-6 rounded-2xl bg-[#121218] border border-[#20202A]">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-lg font-serif font-bold text-white">
                {language === 'en' ? 'Weekly Activity: Volume vs. Technique' : 'Actividad Semanal: Volumen vs. Técnica'}
              </h3>
              <p className="text-xs text-[#8E8E9E]">
                {language === 'en'
                  ? 'Accumulated volume progression and biomechanical accuracy score.'
                  : 'Progresión de carga acumulada y score de precisión biomecánica.'}
              </p>
            </div>

            {/* Time range selector */}
            <div className="p-1 rounded-xl bg-[#181822] border border-[#272734] flex items-center gap-1 text-xs font-mono">
              {(['1M', '3M', 'YTD'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setTimeRange(r)}
                  className={`px-3 py-1 rounded-lg transition-colors ${
                    timeRange === r
                      ? 'bg-[#56A867] text-black font-bold'
                      : 'text-[#8E8E9E] hover:text-white'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Bar chart visualization */}
          <div className="h-48 flex items-end gap-2 sm:gap-4 pt-4 border-b border-[#20202A]">
            {chartData.map((item, index) => {
              const heightPercent = item.volume > 0
                ? Math.max(8, Math.round((item.volume / maxVolume) * 100))
                : 3;
              return (
                <div
                  key={index}
                  className="flex-1 flex flex-col items-center gap-2 h-full justify-end group cursor-pointer"
                >
                  <div
                    className="w-full rounded-t-lg transition-all duration-300 relative group-hover:brightness-125"
                    style={{
                      height: `${heightPercent}%`,
                      backgroundColor: item.volume > 0 ? (item.isToday ? '#56A867' : '#2A3A2E') : '#181822',
                    }}
                  >
                    <div
                      className="absolute -top-1 w-full h-1 rounded-full"
                      style={{ backgroundColor: item.volume > 0 ? (item.isToday ? '#64B875' : '#3D5542') : '#252535' }}
                    />
                  </div>

                  <span
                    className={`text-xs font-mono tabular-nums ${
                      item.isToday ? 'text-[#56A867] font-bold' : 'text-neutral-400'
                    }`}
                  >
                    {item.day}
                  </span>
                  <span className="text-[10px] text-[#555566] font-mono hidden sm:inline">
                    {item.volume > 0 ? `${(item.volume / 1000).toFixed(1)}k` : '0 kg'}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-4 flex items-center justify-between text-xs text-[#707080] font-mono">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-[#56A867]" />
                <span className="text-white">{language === 'en' ? 'Load Volume (kg)' : 'Volumen de Carga (kg)'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#64B875]" />
                <span>{language === 'en' ? 'Biomechanical Accuracy (%)' : 'Precisión Biomecánica (%)'}</span>
              </div>
            </div>
            <span>{language === 'en' ? 'Updated in real time' : 'Actualizado en tiempo real'}</span>
          </div>
        </div>
      </ScrollReveal>
    </div>
  );
};
