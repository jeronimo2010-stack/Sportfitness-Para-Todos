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
} from 'lucide-react';
import { ScreenId, WorkoutRoutine, UserProfile } from '../../types';
import { initialRoutines } from '../../data/initialData';
import { useApp } from '../../context/AppContext';
import { getCalibratedRoutine, getExerciseLoadForUser } from '../../utils/biomechanicalWeights';
import { ScrollReveal, StaggerContainer, StaggerItem } from '../common/ScrollReveal';
import { translateCategory, translateRoutine, translateExerciseName } from '../../utils/dataTranslations';
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
  const { user: contextUser, language, t } = useApp();
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
      <StaggerContainer staggerDelay={0.07} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRoutines.map((routine) => {
          const localizedRoutine = translateRoutine(routine, language);
          return (
            <StaggerItem key={routine.id} className="h-full">
              <div
                className="rounded-2xl bg-[#121218] border border-[#22222E] hover:border-[#56A867]/40 transition-all overflow-hidden flex flex-col justify-between group h-full"
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
                    className="flex-1 py-2.5 px-4 rounded-xl bg-[#56A867] hover:bg-[#64B875] text-black font-bold text-xs transition-all shadow-[0_0_15px_rgba(86,168,103,0.2)] flex items-center justify-center gap-1.5"
                  >
                    <Zap className="w-3.5 h-3.5 fill-black" />
                    <span>{language === 'en' ? 'Start Routine' : 'Iniciar Rutina'}</span>
                  </button>

                  <button
                    onClick={() => handleAssignRoutine(localizedRoutine.title)}
                    className="py-2.5 px-3 rounded-xl bg-[#1A1A24] hover:bg-[#242432] text-[#A0A0B0] hover:text-white text-xs border border-[#282836] transition-colors"
                    title={language === 'en' ? 'Assign to calendar' : 'Asignar al calendario'}
                  >
                    {language === 'en' ? 'Assign' : 'Asignar'}
                  </button>
                </div>
              </div>
            </div>
            </StaggerItem>
          );
        })}
      </StaggerContainer>

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
