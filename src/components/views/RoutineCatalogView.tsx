/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  Dumbbell,
  Clock,
  Zap,
  Filter,
  Search,
  Plus,
  ArrowRight,
  Sparkles,
  TrendingUp,
  CheckCircle2,
  Scale,
  ShieldCheck,
  Quote,
  X,
  Check,
  Save,
  Activity,
  Ruler,
  Weight,
  Shirt,
} from 'lucide-react';
import { ScreenId, WorkoutRoutine, UserProfile, ClothingSize, BodyType, UserProgressRecord } from '../../types';
import { initialRoutines } from '../../data/initialData';
import { useApp } from '../../context/AppContext';
import { getCalibratedRoutine, getExerciseLoadForUser } from '../../utils/biomechanicalWeights';
import { ScrollReveal, StaggerContainer, StaggerItem } from '../common/ScrollReveal';
import { translateCategory, translateRoutine, translateExerciseName } from '../../utils/dataTranslations';
import { generateStarterExercise } from '../../utils/starterExerciseGenerator';
import { authService } from '../../services/authService';
import heroImg from '../../assets/images/hero_athletic_training_1791848598982.jpg';

interface RoutineCatalogViewProps {
  onNavigate: (screen: ScreenId) => void;
  onSelectRoutine?: (routine: WorkoutRoutine) => void;
  user?: UserProfile;
}

export const RoutineCatalogView: React.FC<RoutineCatalogViewProps> = ({
  onNavigate,
  onSelectRoutine,
  user,
}) => {
  const { user: contextUser, setUser, language, t } = useApp();
  const currentUser = user || contextUser;

  // Calibrate all system routines dynamically according to current user biometrics
  const calibratedInitial = useMemo(() => {
    return initialRoutines.map((r) => getCalibratedRoutine(r, currentUser));
  }, [currentUser]);

  const [routines, setRoutines] = useState<WorkoutRoutine[]>(calibratedInitial);
  const [activeCategory, setActiveCategory] = useState<string>('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Health recalibration modal state
  const [isEditingHealth, setIsEditingHealth] = useState(false);
  const [editWeight, setEditWeight] = useState<number>(currentUser.weight || 75);
  const [editHeight, setEditHeight] = useState<number>(currentUser.height || 175);
  const [editClothingSize, setEditClothingSize] = useState<ClothingSize>(currentUser.clothingSize || 'M');
  const [editBodyType, setEditBodyType] = useState<BodyType>(currentUser.bodyType || 'Mesomorfo');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Progress and session state
  const [progressRecord, setProgressRecord] = useState<UserProgressRecord | null>(null);

  useEffect(() => {
    let isMounted = true;
    if (currentUser.id) {
      authService.getProgress(currentUser.id).then((p) => {
        if (isMounted && p) setProgressRecord(p);
      }).catch(() => {});
    }
    return () => { isMounted = false; };
  }, [currentUser.id]);

  const workoutLogs = useMemo(() => {
    return Array.isArray(progressRecord?.workoutLogs) ? progressRecord.workoutLogs : [];
  }, [progressRecord]);

  const hasCompletedAnySession = Boolean(
    workoutLogs.length > 0 && (progressRecord?.sessionsCompleted ?? 0) > 0
  );

  const isInactiveOver15Days = useMemo(() => {
    if (!hasCompletedAnySession || workoutLogs.length === 0) return false;
    const latest = workoutLogs[0];
    const rawDate = latest.date || latest.timestamp;
    if (!rawDate) return false;
    const parsed = new Date(rawDate).getTime();
    if (isNaN(parsed)) return false;
    return (Date.now() - parsed) / (1000 * 60 * 60 * 24) > 15;
  }, [hasCompletedAnySession, workoutLogs]);

  const isZeroState = !hasCompletedAnySession || isInactiveOver15Days;

  // Calibrated starter exercise (Image 1)
  const starterExercise = useMemo(() => {
    return generateStarterExercise(
      currentUser.bodyType || 'Mesomorfo',
      currentUser.height || 175,
      currentUser.weight || 75,
      currentUser.clothingSize || 'M',
      currentUser.role === 'entrenador' ? 'entrenador' : 'atleta'
    );
  }, [currentUser.bodyType, currentUser.height, currentUser.weight, currentUser.clothingSize, currentUser.role]);

  // Biomechanical baseline loads
  const squatLoad = useMemo(() => getExerciseLoadForUser('Sentadilla Trasera', currentUser), [currentUser]);
  const legPressLoad = useMemo(() => getExerciseLoadForUser('Prensa de Piernas 45°', currentUser), [currentUser]);
  const rdlLoad = useMemo(() => getExerciseLoadForUser('Peso Muerto Rumano', currentUser), [currentUser]);

  const handleSaveHealthProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser.id) return;
    try {
      const res = await authService.updateHealthProfile(currentUser.id, {
        weight: editWeight,
        height: editHeight,
        clothingSize: editClothingSize,
        bodyType: editBodyType,
      });
      if (res.success && res.healthProfile) {
        setUser({
          ...currentUser,
          weight: res.healthProfile.weight,
          height: res.healthProfile.height,
          clothingSize: res.healthProfile.clothingSize,
          bodyType: res.healthProfile.bodyType,
        });
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

  // Sync routines when currentUser changes
  useEffect(() => {
    setRoutines(initialRoutines.map((r) => getCalibratedRoutine(r, currentUser)));
  }, [currentUser]);

  // New routine form state
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<'Fuerza' | 'Hipertrofia' | 'Cardio' | 'Movilidad' | 'Explosividad'>('Explosividad');
  const [newDuration, setNewDuration] = useState(60);
  const [newVolume, setNewVolume] = useState(9000);
  const [newDesc, setNewDesc] = useState('');

  const categories = ['Todos', 'Fuerza', 'Hipertrofia', 'Cardio', 'Movilidad', 'Explosividad'];

  const filteredRoutines = routines.filter((r) => {
    const matchesCategory = activeCategory === 'Todos' || r.category === activeCategory;
    const matchesSearch =
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleCreateRoutine = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle) return;

    const squatLoad = getExerciseLoadForUser('Sentadilla con Barra', currentUser);
    const benchLoad = getExerciseLoadForUser('Press de Banca', currentUser);

    const created: WorkoutRoutine = {
      id: `routine-${Date.now()}`,
      title: newTitle,
      category: newCategory,
      level: 'Avanzado',
      durationMinutes: Number(newDuration),
      targetVolumeKg: Number(newVolume),
      intensityRpe: 'RPE 8 - 9',
      description: newDesc || (language === 'en' ? 'Custom routine calibrated to your biometric profile.' : 'Rutina personalizada adaptada a tu perfil biométrico.'),
      coverImage: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&auto=format&fit=crop&q=80',
      exercises: [
        { exerciseId: 'ex-squat', name: 'Sentadilla con Barra', sets: 4, reps: '8 reps', targetWeightKg: squatLoad },
        { exerciseId: 'ex-bench', name: 'Press de Banca', sets: 4, reps: '8 reps', targetWeightKg: benchLoad },
      ],
    };

    setRoutines([created, ...routines]);
    setShowCreateModal(false);
    setNewTitle('');
    setNewDesc('');
  };

  const handleAssignRoutine = (routineTitle: string) => {
    const msg = language === 'en'
      ? `Routine "${routineTitle}" added to your training schedule with personalized loads.`
      : `Rutina "${routineTitle}" agregada a tu agenda de entrenamiento con cargas personalizadas.`;
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto text-left relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#161622] border border-[#56A867] text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-5 h-5 text-[#56A867] shrink-0" />
          <span className="text-xs font-mono">{toastMessage}</span>
        </div>
      )}

      {/* Header & Create CTA */}
      <ScrollReveal direction="down" duration={0.4}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-[#56A867]/15 text-[#56A867] text-[11px] font-mono font-bold uppercase tracking-wider mb-1">
              <Dumbbell className="w-3.5 h-3.5" />
              <span>{language === 'en' ? 'Training Blocks & Routines Library' : 'Biblioteca de Bloques y Rutinas'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white">
              {language === 'en' ? 'Workout Routine Catalog' : 'Catálogo de Entrenamientos'}
            </h1>
            <p className="text-xs text-[#8E8E9E] mt-1">
              {language === 'en'
                ? 'Biomechanically scaled loads adapted to your body metrics and profile.'
                : 'Cargas adaptadas a tu cuenta y biometría registrada.'}
            </p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="py-2.5 px-5 rounded-xl bg-[#56A867] hover:bg-[#64B875] text-black font-bold text-xs transition-all shadow-[0_0_20px_rgba(86,168,103,0.25)] flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>{language === 'en' ? 'Design New Routine' : 'Diseñar Nueva Rutina'}</span>
          </button>
        </div>
      </ScrollReveal>

      {/* 1. Featured Scheduled Workout & Coach Desk Note (Transferido desde Dashboard) */}
      <ScrollReveal direction="up" delay={0.05} duration={0.5}>
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
                  {isZeroState ? '0 kg (Calibración)' : 'Calibrado'}
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

              <div className="mt-3 inline-flex flex-wrap items-center gap-x-2 gap-y-1 px-2.5 py-1.5 rounded-lg bg-[#161622] border border-[#222232] text-[11px] font-mono text-[#8E8E9E]">
                <span className="text-[#56A867] font-bold">{language === 'en' ? 'Active Biometrics:' : 'Biometría Activa:'}</span>
                <span>{language === 'en' ? 'Weight:' : 'Peso:'} <strong className="text-white">{currentUser.weight || 75} kg</strong></span>
                <span>•</span>
                <span>{language === 'en' ? 'Height:' : 'Altura:'} <strong className="text-white">{currentUser.height || 175} cm</strong></span>
                <span>•</span>
                <span>{language === 'en' ? 'Size:' : 'Talla:'} <strong className="text-[#56A867]">{currentUser.clothingSize || 'M'}</strong></span>
                <span>•</span>
                <span>{language === 'en' ? 'Somatotype:' : 'Somatotipo:'} <strong className="text-white">{language === 'en' ? (currentUser.bodyType === 'Mesomorfo' ? 'Mesomorph' : currentUser.bodyType === 'Ectomorfo' ? 'Ectomorph' : 'Endomorph') : (currentUser.bodyType || 'Mesomorfo')}</strong></span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[#22222E] flex flex-wrap items-center gap-3">
              <button
                onClick={() => {
                  if (onSelectRoutine && filteredRoutines[0]) {
                    onSelectRoutine(translateRoutine(filteredRoutines[0], language));
                  }
                  onNavigate('live-workout');
                }}
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

              <a
                href="#catalogo-rutinas"
                className="py-3 px-5 rounded-xl bg-[#1A1A24] hover:bg-[#232330] text-white font-medium text-xs border border-[#2A2A38] transition-all cursor-pointer inline-flex items-center gap-2"
              >
                <span>{language === 'en' ? 'Explore Routine Catalog' : 'Ver Detalles del Bloque'}</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#56A867]" />
              </a>
            </div>
          </div>

          {/* Right 1 Col: Coach Quote & Feedback Note */}
          <div className="space-y-4 flex flex-col justify-between">
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
            <div className="p-5 rounded-2xl bg-[#14141C] border border-[#242432] space-y-2 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className={`w-2 h-2 rounded-full ${isZeroState ? 'bg-amber-400' : 'bg-[#56A867]'}`} />
                  <span className="text-xs font-bold text-white">
                    {language === 'en' ? "Coach's Note (Carlos V.)" : 'Nota de tu Coach (Carlos V.)'}
                  </span>
                </div>
                <p className="text-xs text-[#A0A0B0] leading-relaxed">
                  {!hasCompletedAnySession
                    ? (language === 'en'
                        ? `Welcome to Sportfitness, ${currentUser.name.split(' ')[0]}! All your metrics are initialized at zero. Once you finish your first live session, I will evaluate your biomechanical technique and record your initial training loads in the database.`
                        : `¡Bienvenido a Sportfitness, ${currentUser.name.split(' ')[0]}! Todas tus métricas están en ceros. En cuanto termines tu primera sesión en vivo, evaluaré tu precisión biomecánica y registraré tus primeras marcas en la base de datos.`)
                    : isInactiveOver15Days
                    ? (language === 'en'
                        ? `Hello ${currentUser.name.split(' ')[0]}, you have been inactive for more than 15 days. For physiological safety, your accumulated tonnage and streak have returned to zero. Start back with adaptation sets.`
                        : `Hola ${currentUser.name.split(' ')[0]}, detectamos más de 15 días sin actividad registrada. Por seguridad neuromuscular y tendinosa, tu carga acumulada y racha han vuelto a ceros. Reanuda con series de adaptación.`)
                    : (language === 'en'
                        ? `"Excellent technical execution on your last block, ${currentUser.name.split(' ')[0]}. Keep focus on intra-abdominal pressure before every heavy set."`
                        : `"Excelente ejecución técnica en tu último bloque, ${currentUser.name.split(' ')[0]}. Mantén el foco en la respiración intra-abdominal antes de cada serie pesada."`)}
                </p>
              </div>
              <div className="pt-2 border-t border-[#20202E] flex justify-between items-center text-[11px] mt-3">
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

      {/* 2. Starter Exercise Banner (Registro Biométrico • Ejercicio de Inicio) */}
      <ScrollReveal direction="up" delay={0.08} duration={0.5}>
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
              <p className="text-xs text-[#9E9EA8] mt-1 max-w-2xl leading-relaxed">
                {language === 'en'
                  ? `Calibrated for your somatotype ${currentUser.bodyType === 'Mesomorfo' ? 'Mesomorph' : currentUser.bodyType === 'Ectomorfo' ? 'Ectomorph' : (currentUser.bodyType || 'Mesomorph')} (${currentUser.height || 175} cm, ${currentUser.weight || 75} kg, Size ${currentUser.clothingSize || 'M'}). Target stimulus: progressive overload and technical mastery.`
                  : `Calibrado para tu somatotipo ${currentUser.bodyType || 'Mesomorfo'} (${currentUser.height || 175} cm, ${currentUser.weight || 75} kg, Talla ${currentUser.clothingSize || 'M'}). ${starterExercise.whyThisExercise}`}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => onNavigate('live-workout')}
                className="py-2.5 px-4 rounded-xl bg-[#56A867] hover:bg-[#64B875] text-black text-xs font-bold font-mono uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-[0_0_15px_rgba(86,168,103,0.25)] cursor-pointer"
              >
                <Dumbbell className="w-3.5 h-3.5" />
                <span>{language === 'en' ? 'Train This Exercise' : 'Entrenar Este Ejercicio'}</span>
              </button>
              <button
                onClick={() => setIsEditingHealth(true)}
                className="py-2.5 px-3 rounded-xl bg-[#181822] hover:bg-[#20202E] border border-[#2A2A38] text-neutral-300 text-xs font-mono transition-colors cursor-pointer"
                title={language === 'en' ? 'Recalibrate biometrics' : 'Actualizar datos biométricos'}
              >
                {language === 'en' ? 'Recalibrate' : 'Recalibrar'}
              </button>
            </div>
          </div>

          {/* Prescription chips - Clean flex-col layout to avoid overlapping */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 text-xs font-mono relative z-10">
            <div className="bg-[#12121A] p-3 rounded-xl border border-[#1E1E28] min-w-0 flex flex-col justify-between">
              <span className="text-[#7E7E8E] text-[10px] uppercase tracking-wider">
                {language === 'en' ? 'Sets × Reps' : 'Series × Reps'}
              </span>
              <span className="text-[#56A867] font-bold text-xs sm:text-sm mt-1">{starterExercise.sets} × {starterExercise.reps}</span>
            </div>
            <div className="bg-[#12121A] p-3 rounded-xl border border-[#1E1E28] min-w-0 flex flex-col justify-between">
              <span className="text-[#7E7E8E] text-[10px] uppercase tracking-wider">
                {language === 'en' ? 'Initial Load' : 'Carga Inicial'}
              </span>
              <span className="text-white font-bold text-xs sm:text-sm mt-1">{starterExercise.suggestedWeightKg} kg</span>
            </div>
            <div className="bg-[#12121A] p-3 rounded-xl border border-[#1E1E28] min-w-0 flex flex-col justify-between">
              <span className="text-[#7E7E8E] text-[10px] uppercase tracking-wider">
                {language === 'en' ? 'Target RPE' : 'Objetivo RPE'}
              </span>
              <span className="text-white font-bold text-xs sm:text-sm mt-1 break-words">{starterExercise.rpeTarget}</span>
            </div>
            <div className="bg-[#12121A] p-3 rounded-xl border border-[#1E1E28] min-w-0 flex flex-col justify-between">
              <span className="text-[#7E7E8E] text-[10px] uppercase tracking-wider">
                {language === 'en' ? 'Target Muscle' : 'Músculo Principal'}
              </span>
              <span className="text-white font-bold text-xs sm:text-sm mt-1 break-words">{starterExercise.targetMuscle}</span>
            </div>
          </div>
        </div>
      </ScrollReveal>

      {/* Recalibration Biometrics Modal */}
      {isEditingHealth && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#12121A] border border-[#56A867]/40 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-[#222230]">
              <div className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-[#56A867]" />
                <h3 className="text-sm font-bold text-white font-serif uppercase tracking-wider">
                  {language === 'en' ? 'Recalibrate Biometrics' : 'Recalibrar Datos Biométricos'}
                </h3>
              </div>
              <button
                onClick={() => setIsEditingHealth(false)}
                className="p-1 rounded-md text-[#8E8E9E] hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {saveSuccess ? (
              <div className="p-4 rounded-xl bg-[#56A867]/15 border border-[#56A867] text-center space-y-2">
                <Check className="w-8 h-8 text-[#56A867] mx-auto animate-bounce" />
                <p className="text-sm font-bold text-white">
                  {language === 'en' ? 'Biometrics updated & routine recalibrated!' : '¡Biometría actualizada y rutina recalibrada!'}
                </p>
              </div>
            ) : (
              <form onSubmit={handleSaveHealthProfile} className="space-y-3.5 text-left">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-mono text-[#A0A0B0]">
                      {language === 'en' ? 'Weight (kg)' : 'Peso (kg)'}
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

                  <div className="space-y-1">
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
                  <div className="space-y-1">
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

                  <div className="space-y-1">
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
                    className="flex-1 py-2.5 rounded-xl border border-[#2A2A3C] text-xs font-mono text-[#A0A0B0] hover:text-white cursor-pointer"
                  >
                    {language === 'en' ? 'Cancel' : 'Cancelar'}
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-[#56A867] hover:bg-[#64B875] text-black font-bold text-xs font-mono uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{language === 'en' ? 'Save & Recalibrate' : 'Guardar & Recalibrar'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Anchor for scrolling to catalog */}
      <div id="catalogo-rutinas" />

      {/* Biometric Account Calibration Banner */}
      <ScrollReveal direction="up" delay={0.1} duration={0.4}>
        <div className="p-4 rounded-2xl bg-[#13131B] border border-[#222232] flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#56A867]/15 border border-[#56A867]/30 flex items-center justify-center text-[#56A867]">
              <Scale className="w-4 h-4" />
            </div>
            <div>
              <div className="text-white font-bold flex items-center gap-2">
                <span>{language === 'en' ? 'Active Calibration:' : 'Calibración Activa:'} {currentUser.name}</span>
                <span className="px-2 py-0.5 rounded bg-[#1C1C2A] text-[#56A867] text-[10px]">
                  {currentUser.bodyType || (language === 'en' ? 'Mesomorph' : 'Mesomorfo')}
                </span>
              </div>
              <div className="text-[#8E8E9E] text-[11px] flex items-center gap-2 mt-0.5">
                <span>{language === 'en' ? 'Weight:' : 'Peso:'} <strong className="text-white">{currentUser.weight || 78} kg</strong></span>
                <span>•</span>
                <span>{language === 'en' ? 'Height:' : 'Altura:'} <strong className="text-white">{currentUser.height || 178} cm</strong></span>
                <span>•</span>
                <span>{language === 'en' ? 'Size:' : 'Talla:'} <strong className="text-[#56A867]">{currentUser.clothingSize || 'M'}</strong></span>
              </div>
            </div>
          </div>

          <div className="text-[11px] text-[#A0A0B0] bg-[#191924] px-3 py-1.5 rounded-xl border border-[#262638] flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#56A867]" />
            <span>{language === 'en' ? 'All loads scaled to your skeletal structure and weight' : 'Todas las cargas se han escalado a tu estructura y peso'}</span>
          </div>
        </div>
      </ScrollReveal>

      {/* Filter and Search Bar */}
      <ScrollReveal direction="up" delay={0.12} duration={0.4}>
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Categories Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-mono font-medium transition-all whitespace-nowrap ${
                  activeCategory === cat
                    ? 'bg-[#56A867] text-black font-bold shadow-[0_0_15px_rgba(86,168,103,0.2)]'
                    : 'bg-[#14141C] text-[#8E8E9E] hover:text-white border border-[#20202A]'
                }`}
              >
                {translateCategory(cat, language)}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#707080]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={language === 'en' ? 'Search by name or focus...' : 'Buscar por nombre o enfoque...'}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#14141C] border border-[#242430] text-xs text-white placeholder:text-[#606070] focus:outline-none focus:border-[#56A867]"
            />
          </div>
        </div>
      </ScrollReveal>

      {/* Routines Grid */}
      {filteredRoutines.length === 0 ? (
        <div className="py-16 text-center rounded-2xl bg-[#121218] border border-[#22222E] p-8 space-y-3">
          <Dumbbell className="w-10 h-10 text-[#56A867]/50 mx-auto" />
          <h3 className="text-base font-bold text-white font-serif">
            {language === 'en' ? 'No routines found in this category' : 'No se encontraron rutinas en esta categoría'}
          </h3>
          <p className="text-xs text-[#8E8E9E]">
            {language === 'en' ? 'Try selecting "All" or a different category' : 'Intenta seleccionando "Todos" o una categoría diferente'}
          </p>
          <button
            onClick={() => { setActiveCategory('Todos'); setSearchQuery(''); }}
            className="px-4 py-2 rounded-xl bg-[#56A867] hover:bg-[#64B875] text-black text-xs font-bold font-mono transition-colors cursor-pointer"
          >
            {language === 'en' ? 'View All Routines' : 'Ver Todas las Rutinas'}
          </button>
        </div>
      ) : (
        <div
          key={`${activeCategory}-${searchQuery}`}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fadeIn"
        >
          {filteredRoutines.map((routine) => {
            const localizedRoutine = translateRoutine(routine, language);
            return (
              <div
                key={routine.id}
                className="rounded-2xl bg-[#121218] border border-[#22222E] hover:border-[#56A867]/40 transition-all overflow-hidden flex flex-col justify-between group h-full shadow-lg"
              >
                {/* Cover Image & Badges */}
                <div className="relative h-48 w-full overflow-hidden">
                  <img
                    src={localizedRoutine.coverImage || heroImg}
                    alt={localizedRoutine.title}
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      const target = e.currentTarget;
                      if (target.src !== heroImg) {
                        target.src = heroImg;
                      }
                    }}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-60"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#121218] via-[#121218]/40 to-transparent" />

                  <div className="absolute top-3 left-3 flex gap-2">
                    <span className="px-2.5 py-1 rounded-full bg-black/80 backdrop-blur-md text-[#56A867] text-[10px] font-mono font-bold uppercase border border-[#56A867]/30">
                      {translateCategory(localizedRoutine.category, language)}
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-[#181824]/90 text-white text-[10px] font-mono">
                      {localizedRoutine.level}
                    </span>
                  </div>

                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs font-mono text-[#E0E0E0]">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-[#56A867]" />
                      {localizedRoutine.durationMinutes} min
                    </span>
                    <span className="text-[#56A867] font-bold">
                      {localizedRoutine.intensityRpe}
                    </span>
                  </div>
                </div>

                {/* Content Body */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-lg font-serif font-bold text-white group-hover:text-[#56A867] transition-colors leading-snug">
                        {localizedRoutine.title}
                      </h3>
                      <span className="text-[11px] font-mono text-[#56A867] whitespace-nowrap font-bold">
                        {language === 'en' ? 'Vol:' : 'Vol:'} {localizedRoutine.targetVolumeKg.toLocaleString()}kg
                      </span>
                    </div>
                    <p className="text-xs text-[#9E9EA8] leading-relaxed line-clamp-2">
                      {localizedRoutine.description}
                    </p>

                    {/* Exercises Preview with Calibrated Weights */}
                    {localizedRoutine.exercises.length > 0 && (
                      <div className="pt-2 space-y-1.5 border-t border-[#1C1C26]">
                        <div className="flex items-center justify-between text-[10px] font-mono uppercase text-[#707080]">
                          <span>{language === 'en' ? 'Key exercises' : 'Ejercicios clave'} ({localizedRoutine.exercises.length}):</span>
                          <span className="text-[#56A867]">{language === 'en' ? 'Scaled load' : 'Carga adaptada'}</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {localizedRoutine.exercises.map((ex, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 rounded bg-[#181822] text-[#B0B0C0] text-[10px] font-mono border border-[#242432] flex items-center gap-1.5"
                            >
                              <span>{translateExerciseName(ex.name, language)}</span>
                              <strong className="text-[#56A867]">@{ex.targetWeightKg}kg</strong>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-4 border-t border-[#1E1E28] flex items-center gap-2">
                    <button
                      onClick={() => {
                        if (onSelectRoutine) onSelectRoutine(localizedRoutine);
                        onNavigate('live-workout');
                      }}
                      className="flex-1 py-2.5 px-4 rounded-xl bg-[#56A867] hover:bg-[#64B875] text-black font-bold text-xs transition-all shadow-[0_0_15px_rgba(86,168,103,0.2)] flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Zap className="w-3.5 h-3.5 fill-black" />
                      <span>{language === 'en' ? 'Start Routine' : 'Iniciar Rutina'}</span>
                    </button>

                    <button
                      onClick={() => handleAssignRoutine(localizedRoutine.title)}
                      className="py-2.5 px-3 rounded-xl bg-[#1A1A24] hover:bg-[#242432] text-[#A0A0B0] hover:text-white text-xs border border-[#282836] transition-colors cursor-pointer"
                      title={language === 'en' ? 'Assign to calendar' : 'Asignar al calendario'}
                    >
                      {language === 'en' ? 'Assign' : 'Asignar'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Create Routine */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#121218] border border-[#2A2A38] rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#20202C]">
              <h2 className="text-lg font-serif font-bold text-white">
                {language === 'en' ? 'Design New Training Block' : 'Diseñar Nuevo Bloque de Entrenamiento'}
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-[#808090] hover:text-white text-xs font-mono"
              >
                {language === 'en' ? 'Close' : 'Cerrar'}
              </button>
            </div>

            <form onSubmit={handleCreateRoutine} className="space-y-4 text-xs font-mono text-left">
              <div>
                <label className="block text-[#A0A0B0] mb-1">
                  {language === 'en' ? 'Routine Title' : 'Nombre de la Rutina'}
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder={language === 'en' ? 'E.g., Upper Power & Hypertrophy' : 'Ej: Upper Power & Hipertrofia'}
                  required
                  className="w-full p-2.5 rounded-xl bg-[#161622] border border-[#262636] text-white focus:outline-none focus:border-[#56A867]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#A0A0B0] mb-1">
                    {language === 'en' ? 'Category' : 'Categoría'}
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e: any) => setNewCategory(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-[#161622] border border-[#262636] text-white focus:outline-none focus:border-[#56A867]"
                  >
                    <option value="Explosividad">{language === 'en' ? 'Explosiveness / Power' : 'Explosividad / Potencia'}</option>
                    <option value="Fuerza">{language === 'en' ? 'Strength' : 'Fuerza'}</option>
                    <option value="Hipertrofia">{language === 'en' ? 'Hypertrophy' : 'Hipertrofia'}</option>
                    <option value="Cardio">{language === 'en' ? 'Cardio' : 'Cardio'}</option>
                    <option value="Movilidad">{language === 'en' ? 'Mobility' : 'Movilidad'}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#A0A0B0] mb-1">
                    {language === 'en' ? 'Duration (minutes)' : 'Duración (minutos)'}
                  </label>
                  <input
                    type="number"
                    value={newDuration}
                    onChange={(e) => setNewDuration(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl bg-[#161622] border border-[#262636] text-white focus:outline-none focus:border-[#56A867]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#A0A0B0] mb-1">
                  {language === 'en' ? 'Description / Objectives' : 'Descripción / Objetivos'}
                </label>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  rows={3}
                  placeholder={language === 'en' ? 'Progressive overload focus and joint tempo...' : 'Enfoque de sobrecarga progresiva y tempo articular...'}
                  className="w-full p-2.5 rounded-xl bg-[#161622] border border-[#262636] text-white focus:outline-none focus:border-[#56A867]"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-[#1A1A24] text-[#A0A0B0] hover:text-white"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#56A867] hover:bg-[#64B875] text-black font-bold"
                >
                  {language === 'en' ? 'Create Block' : 'Crear Bloque'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
