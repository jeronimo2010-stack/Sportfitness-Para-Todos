/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  Search,
  Play,
  Youtube,
  ExternalLink,
  X,
  Clock,
  Dumbbell,
  ChevronRight,
  Flame,
  Award,
  Users,
  BookOpen,
  Sparkles,
  CheckCircle2,
  Tv,
  Eye,
  Filter,
} from 'lucide-react';
import { ScreenId } from '../../types';
import { useApp } from '../../context/AppContext';
import {
  EXERCISE_TUTORIALS,
  PEOPLE_WORKOUTS,
  YOUTUBE_WORKOUT_SESSIONS,
  ExerciseTutorial,
  PeopleWorkout,
  YouTubeWorkoutSession,
} from '../../data/exerciseTutorialsData';

interface ExerciseVideoLibraryViewProps {
  onNavigate: (screen: ScreenId) => void;
}

// Clean accents and punctuation
function cleanText(text: string): string {
  return (text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

// Synonyms map
const SYNONYMS: Record<string, string[]> = {
  flexiones: ['lagartijas', 'pushups', 'pecho', 'brazos', 'pectoral', 'triceps'],
  lagartijas: ['flexiones', 'pushups', 'pecho', 'brazos', 'pectoral', 'triceps'],
  pushups: ['flexiones', 'lagartijas', 'pecho', 'triceps'],
  brazo: ['biceps', 'triceps', 'curl', 'martillo', 'fondos', 'diamante'],
  brazos: ['biceps', 'triceps', 'curl', 'martillo', 'fondos', 'diamante'],
  biceps: ['curl', 'martillo', 'brazos', 'pesas'],
  triceps: ['fondos', 'dips', 'diamante', 'brazos'],
  pecho: ['lagartijas', 'flexiones', 'pushups', 'pectoral'],
  pierna: ['sentadilla', 'sentadillas', 'squat', 'zancadas', 'lunges', 'rdl', 'gluteo', 'gemelos'],
  piernas: ['sentadilla', 'sentadillas', 'squat', 'zancadas', 'lunges', 'rdl', 'gluteo', 'gemelos'],
  sentadilla: ['air squat', 'piernas', 'cuadriceps', 'gluteos', 'squat'],
  sentadillas: ['air squat', 'piernas', 'cuadriceps', 'gluteos', 'squat'],
  abdomen: ['plancha', 'core', 'crunches', 'escaladores', 'abs'],
  abdominales: ['plancha', 'core', 'crunches', 'escaladores', 'abs'],
  core: ['plancha', 'abdominales', 'crunches', 'escaladores', 'abdomen'],
  hombro: ['press militar', 'overhead', 'laterales', 'elevaciones', 'deltoides'],
  hombros: ['press militar', 'overhead', 'laterales', 'elevaciones', 'deltoides'],
  espalda: ['dominadas', 'pull ups', 'remo', 'dorsales', 'lats'],
  cardio: ['jumping jacks', 'tijeras', 'saltos', 'skipping', 'rodillas', 'burpees', 'escaladores', 'hiit'],
};

export const ExerciseVideoLibraryView: React.FC<ExerciseVideoLibraryViewProps> = ({ onNavigate }) => {
  const { theme, language } = useApp();
  const isDark = theme === 'dark';

  // 3 Dedicated Viewing Tabs
  const [activeTab, setActiveTab] = useState<'tutorials' | 'people' | 'youtube'>('tutorials');

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');

  // Active Video for the 16:9 Modal Player
  const [activeModalVideo, setActiveModalVideo] = useState<{
    title: string;
    category: string;
    duration: string;
    youtubeId: string;
    youtubeUrl: string;
    authorOrChannel?: string;
    description?: string;
    keyPoints?: string[];
    exercisesList?: string[];
    tip?: string;
  } | null>(null);

  // Filtered Technical Tutorials
  const filteredTutorials = useMemo(() => {
    const query = cleanText(searchQuery);
    let variants: string[] = [query];
    if (query) {
      Object.entries(SYNONYMS).forEach(([kw, syns]) => {
        if (query.includes(kw) || kw.includes(query)) variants.push(...syns);
      });
    }

    return EXERCISE_TUTORIALS.filter((item) => {
      if (selectedCategory !== 'Todos' && item.category !== selectedCategory) return false;
      if (!query) return true;

      const haystack = cleanText(
        `${item.title} ${item.titleEn} ${item.category} ${item.description} ${item.targetMuscles.join(' ')} ${item.synonyms.join(' ')}`
      );
      return variants.some((v) => haystack.includes(v));
    });
  }, [searchQuery, selectedCategory]);

  // Filtered People / Athlete Workouts
  const filteredPeopleWorkouts = useMemo(() => {
    const query = cleanText(searchQuery);
    return PEOPLE_WORKOUTS.filter((item) => {
      if (selectedCategory !== 'Todos' && item.category !== selectedCategory && item.targetArea !== selectedCategory) {
        return false;
      }
      if (!query) return true;
      const haystack = cleanText(
        `${item.athleteName} ${item.title} ${item.titleEn} ${item.description} ${item.category} ${item.targetArea} ${item.exercisesList.join(' ')}`
      );
      return haystack.includes(query);
    });
  }, [searchQuery, selectedCategory]);

  // Filtered YouTube Workout Sessions
  const filteredYouTubeSessions = useMemo(() => {
    const query = cleanText(searchQuery);
    return YOUTUBE_WORKOUT_SESSIONS.filter((item) => {
      if (selectedCategory !== 'Todos' && item.category !== selectedCategory) return false;
      if (!query) return true;
      const haystack = cleanText(`${item.title} ${item.titleEn} ${item.channelName} ${item.category} ${item.highlight}`);
      return haystack.includes(query);
    });
  }, [searchQuery, selectedCategory]);

  return (
    <div
      className={`min-h-screen p-4 sm:p-6 lg:p-8 select-none transition-colors ${
        isDark ? 'bg-[#0A0A0E] text-[#E0E0E8]' : 'bg-slate-50 text-slate-900'
      }`}
    >
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-5 transition-colors border-neutral-800/60">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span
                className={`text-[10px] font-mono uppercase font-bold tracking-widest px-2.5 py-0.5 rounded ${
                  isDark
                    ? 'bg-[#56A867]/20 text-[#56A867] border border-[#56A867]/30'
                    : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {language === 'en' ? 'Video Hub • 100% Viewing' : 'Portal de Videos • Visualización Exclusiva'}
              </span>
              <span className="text-xs font-mono text-neutral-500">HD Streaming</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-black tracking-tight flex items-center gap-3">
              <Tv className="w-7 h-7 text-[#56A867]" />
              <span>{language === 'en' ? 'Tutorials & Workout Videos' : 'Tutoriales y Videos de Entrenamiento'}</span>
            </h1>
            <p className={`text-xs sm:text-sm mt-1 max-w-2xl ${isDark ? 'text-neutral-400' : 'text-slate-600'}`}>
              {language === 'en'
                ? 'Dedicated space exclusively to watch exercise tutorials, real athlete workouts, and full guided training sessions from YouTube.'
                : 'Apartado dedicado exclusivamente a ver tutoriales de técnica, entrenamientos de personas y videos guiados de entrenamiento de YouTube.'}
            </p>
          </div>

          {/* 3 Dedicated View Tabs */}
          <div
            className={`flex items-center p-1 rounded-xl border self-start md:self-auto overflow-x-auto ${
              isDark ? 'bg-[#121218] border-[#22222E]' : 'bg-slate-200/80 border-slate-300'
            }`}
          >
            {/* Tab 1: Tutorials */}
            <button
              onClick={() => {
                setActiveTab('tutorials');
                setSelectedCategory('Todos');
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'tutorials'
                  ? isDark
                    ? 'bg-[#56A867] text-black shadow-md'
                    : 'bg-white text-emerald-700 shadow'
                  : isDark
                  ? 'text-neutral-400 hover:text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>{language === 'en' ? 'Exercise Tutorials' : 'Tutoriales de Ejercicios'}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                  activeTab === 'tutorials'
                    ? 'bg-black/20 text-black'
                    : isDark
                    ? 'bg-neutral-800 text-neutral-300'
                    : 'bg-slate-300 text-slate-800'
                }`}
              >
                {EXERCISE_TUTORIALS.length}
              </span>
            </button>

            {/* Tab 2: People Workouts */}
            <button
              onClick={() => {
                setActiveTab('people');
                setSelectedCategory('Todos');
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'people'
                  ? isDark
                    ? 'bg-[#56A867] text-black shadow-md'
                    : 'bg-white text-emerald-700 shadow'
                  : isDark
                  ? 'text-neutral-400 hover:text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>{language === 'en' ? "People's Workouts" : 'Entrenamientos de Personas'}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                  activeTab === 'people'
                    ? 'bg-black/20 text-black'
                    : isDark
                    ? 'bg-neutral-800 text-neutral-300'
                    : 'bg-slate-300 text-slate-800'
                }`}
              >
                {PEOPLE_WORKOUTS.length}
              </span>
            </button>

            {/* Tab 3: YouTube Workouts */}
            <button
              onClick={() => {
                setActiveTab('youtube');
                setSelectedCategory('Todos');
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'youtube'
                  ? isDark
                    ? 'bg-[#56A867] text-black shadow-md'
                    : 'bg-white text-emerald-700 shadow'
                  : isDark
                  ? 'text-neutral-400 hover:text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Youtube className="w-3.5 h-3.5 text-red-500" />
              <span>{language === 'en' ? 'YouTube Sessions' : 'Videos de YouTube'}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                  activeTab === 'youtube'
                    ? 'bg-black/20 text-black'
                    : isDark
                    ? 'bg-neutral-800 text-neutral-300'
                    : 'bg-slate-300 text-slate-800'
                }`}
              >
                {YOUTUBE_WORKOUT_SESSIONS.length}
              </span>
            </button>
          </div>
        </div>

        {/* Search Bar & Dynamic Categories */}
        <div
          className={`p-4 sm:p-5 rounded-2xl border space-y-3.5 shadow-sm ${
            isDark ? 'bg-[#111116] border-[#22222E]' : 'bg-white border-slate-200'
          }`}
        >
          {/* Real-time search */}
          <div className="relative">
            <Search
              className={`w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 ${
                isDark ? 'text-neutral-400' : 'text-slate-400'
              }`}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                activeTab === 'tutorials'
                  ? language === 'en'
                    ? 'Search tutorials: e.g. "pushups", "flexiones", "sentadillas", "bíceps", "piernas", "core"...'
                    : 'Buscar tutoriales: ej. "flexiones", "lagartijas", "sentadillas", "bíceps", "piernas", "core"...'
                  : activeTab === 'people'
                  ? language === 'en'
                    ? 'Search by athlete name, routine style, or muscle: e.g. "Mateo", "Camila", "Calistenia", "Piernas"...'
                    : 'Buscar por atleta, rutina o músculo: ej. "Mateo", "Camila", "Calistenia", "Piernas", "Fuerza"...'
                  : language === 'en'
                  ? 'Search YouTube sessions: e.g. "Full Body", "HIIT", "Abdominales", "Mancuernas"...'
                  : 'Buscar sesiones en YouTube: ej. "Full Body", "HIIT", "Abdominales", "Mancuernas", "Estiramiento"...'
              }
              className={`w-full pl-11 pr-10 py-3 rounded-xl text-sm font-medium focus:outline-none transition-all ${
                isDark
                  ? 'bg-[#181822] border border-[#2A2A38] text-white placeholder-neutral-500 focus:border-[#56A867]'
                  : 'bg-slate-100 border border-slate-300 text-slate-900 placeholder-slate-400 focus:border-emerald-600'
              }`}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white p-1"
                aria-label="Limpiar búsqueda"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Categories for active tab */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {(activeTab === 'tutorials'
              ? ['Todos', 'Pecho', 'Piernas', 'Brazos', 'Espalda', 'Hombros', 'Core', 'Cardio']
              : activeTab === 'people'
              ? ['Todos', 'Fuerza', 'Calistenia', 'HIIT', 'Funcional', 'Hipertrofia', 'Core']
              : ['Todos', 'Full Body', 'HIIT', 'Abdominales', 'Brazos', 'Piernas', 'Estiramiento']
            ).map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    isSelected
                      ? isDark
                        ? 'bg-[#56A867] text-black font-bold shadow-sm'
                        : 'bg-emerald-600 text-white font-bold shadow-sm'
                      : isDark
                      ? 'bg-[#181822] text-neutral-400 hover:text-white hover:bg-[#20202E]'
                      : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* ============================================================== */}
        {/* TAB 1: TUTORIALES DE EJERCICIOS                              */}
        {/* ============================================================== */}
        {activeTab === 'tutorials' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between text-xs font-mono text-neutral-400 px-1">
              <span>
                {language === 'en'
                  ? `Showing ${filteredTutorials.length} tutorials`
                  : `Mostrando ${filteredTutorials.length} tutoriales técnicos`}
              </span>
              <span className="text-[#56A867] flex items-center gap-1">
                <Youtube className="w-3.5 h-3.5" />
                <span>YouTube 1080p Embed</span>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filteredTutorials.map((tutorial) => (
                <div
                  key={tutorial.id}
                  onClick={() =>
                    setActiveModalVideo({
                      title: language === 'en' ? tutorial.titleEn : tutorial.title,
                      category: tutorial.category,
                      duration: tutorial.duration,
                      youtubeId: tutorial.youtubeId,
                      youtubeUrl: tutorial.youtubeUrl,
                      authorOrChannel: 'Sportfitness Tech Guides',
                      description: language === 'en' ? tutorial.descriptionEn : tutorial.description,
                      keyPoints: language === 'en' ? tutorial.keyPointsEn : tutorial.keyPoints,
                    })
                  }
                  className={`group rounded-2xl border overflow-hidden flex flex-col justify-between transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl cursor-pointer ${
                    isDark
                      ? 'bg-[#111117] border-[#20202C] hover:border-[#56A867]/50 shadow-black/40'
                      : 'bg-white border-slate-200 hover:border-emerald-400 shadow-slate-200/50'
                  }`}
                >
                  <div className="relative aspect-video bg-neutral-900 overflow-hidden">
                    <img
                      src={`https://img.youtube.com/vi/${tutorial.youtubeId}/hqdefault.jpg`}
                      alt={tutorial.title}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    
                    <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-black/60 backdrop-blur-md text-[#56A867] border border-white/10 uppercase">
                        {tutorial.category}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/60 backdrop-blur-md text-neutral-300 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-[#56A867]" />
                        {tutorial.duration}
                      </span>
                    </div>

                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-[#56A867] text-black flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(86,168,103,0.5)]">
                        <Play className="w-5 h-5 fill-black ml-0.5" />
                      </div>
                    </div>

                    <div className="absolute bottom-2 left-2.5 text-[10px] font-mono font-semibold text-neutral-300">
                      <span>{tutorial.difficulty}</span>
                    </div>
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <h3
                        className={`font-serif font-bold text-base leading-snug line-clamp-2 transition-colors ${
                          isDark ? 'text-white group-hover:text-[#56A867]' : 'text-slate-900 group-hover:text-emerald-700'
                        }`}
                      >
                        {language === 'en' ? tutorial.titleEn : tutorial.title}
                      </h3>
                      <p className={`text-xs line-clamp-2 mt-1 leading-relaxed ${isDark ? 'text-neutral-400' : 'text-slate-600'}`}>
                        {language === 'en' ? tutorial.descriptionEn : tutorial.description}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-neutral-800/40 flex items-center justify-between text-xs font-semibold text-[#56A867]">
                      <span className="flex items-center gap-1">
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>{language === 'en' ? 'Watch Tutorial' : 'Ver Tutorial'}</span>
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: ENTRENAMIENTOS DE PERSONAS (COMUNIDAD & ATLETAS)      */}
        {/* ============================================================== */}
        {activeTab === 'people' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between text-xs font-mono text-neutral-400 px-1">
              <span>
                {language === 'en'
                  ? `Showing ${filteredPeopleWorkouts.length} real workouts by athletes & coaches`
                  : `Mostrando ${filteredPeopleWorkouts.length} entrenamientos de personas y atletas`}
              </span>
              <span className="text-amber-400 flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                <span>Comunidad Sportfitness</span>
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPeopleWorkouts.map((workout) => (
                <div
                  key={workout.id}
                  onClick={() =>
                    setActiveModalVideo({
                      title: language === 'en' ? workout.titleEn : workout.title,
                      category: workout.category,
                      duration: workout.duration,
                      youtubeId: workout.youtubeId,
                      youtubeUrl: workout.youtubeUrl,
                      authorOrChannel: `${workout.athleteName} (${workout.athleteRole})`,
                      description: language === 'en' ? workout.descriptionEn : workout.description,
                      exercisesList: workout.exercisesList,
                      tip: language === 'en' ? workout.athleteTipEn : workout.athleteTip,
                    })
                  }
                  className={`group rounded-2xl border overflow-hidden flex flex-col justify-between transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl cursor-pointer ${
                    isDark
                      ? 'bg-[#111117] border-[#22222E] hover:border-[#56A867]/50 shadow-black/40'
                      : 'bg-white border-slate-200 hover:border-emerald-400 shadow-slate-200/50'
                  }`}
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-video bg-neutral-900 overflow-hidden">
                    <img
                      src={`https://img.youtube.com/vi/${workout.youtubeId}/hqdefault.jpg`}
                      alt={workout.title}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

                    {/* Athlete badge */}
                    <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md border border-white/10 text-xs">
                        <div className="w-4 h-4 rounded-full bg-[#56A867] text-black font-bold text-[9px] flex items-center justify-center">
                          {workout.athleteName[0]}
                        </div>
                        <span className="font-semibold text-white">{workout.athleteName}</span>
                        <span className="text-[10px] text-[#56A867] font-mono">({workout.athleteRole})</span>
                      </div>

                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/60 backdrop-blur-md text-neutral-300">
                        {workout.duration}
                      </span>
                    </div>

                    {/* Centered Play Button */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-[#56A867] text-black flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(86,168,103,0.5)]">
                        <Play className="w-5 h-5 fill-black ml-0.5" />
                      </div>
                    </div>

                    <div className="absolute bottom-2 left-2.5 right-2.5 flex items-center justify-between text-[11px] font-mono text-neutral-300">
                      <span className="text-[#56A867] font-bold">{workout.targetArea}</span>
                      <span className="text-neutral-400">👁️ {workout.viewsCount} vistas</span>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div className="space-y-2">
                      <h3
                        className={`font-serif font-bold text-base leading-snug transition-colors ${
                          isDark ? 'text-white group-hover:text-[#56A867]' : 'text-slate-900 group-hover:text-emerald-700'
                        }`}
                      >
                        {language === 'en' ? workout.titleEn : workout.title}
                      </h3>
                      <p className={`text-xs line-clamp-2 leading-relaxed ${isDark ? 'text-neutral-400' : 'text-slate-600'}`}>
                        {language === 'en' ? workout.descriptionEn : workout.description}
                      </p>

                      {/* Exercises breakdown preview */}
                      <div className="space-y-1 pt-1">
                        <span className="text-[10px] font-mono uppercase text-neutral-500 block font-semibold">
                          {language === 'en' ? 'Exercises executed in video:' : 'Ejercicios realizados en el video:'}
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {workout.exercisesList.slice(0, 3).map((ex, i) => (
                            <span
                              key={i}
                              className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                                isDark ? 'bg-[#181824] border-[#2A2A38] text-neutral-300' : 'bg-slate-100 border-slate-300 text-slate-700'
                              }`}
                            >
                              {ex}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-neutral-800/40 flex items-center justify-between text-xs font-semibold text-[#56A867]">
                      <span className="flex items-center gap-1.5">
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>{language === 'en' ? 'Watch Full Workout' : 'Ver Entrenamiento de la Persona'}</span>
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 3: VIDEOS DE ENTRENAMIENTO DE YOUTUBE                    */}
        {/* ============================================================== */}
        {activeTab === 'youtube' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between text-xs font-mono text-neutral-400 px-1">
              <span>
                {language === 'en'
                  ? `Showing ${filteredYouTubeSessions.length} complete workout sessions from YouTube`
                  : `Mostrando ${filteredYouTubeSessions.length} sesiones completas de YouTube`}
              </span>
              <span className="text-red-400 flex items-center gap-1">
                <Youtube className="w-3.5 h-3.5" />
                <span>YouTube Guided Classes</span>
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredYouTubeSessions.map((session) => (
                <div
                  key={session.id}
                  onClick={() =>
                    setActiveModalVideo({
                      title: language === 'en' ? session.titleEn : session.title,
                      category: session.category,
                      duration: session.duration,
                      youtubeId: session.youtubeId,
                      youtubeUrl: session.youtubeUrl,
                      authorOrChannel: session.channelName,
                      description: language === 'en' ? session.highlightEn : session.highlight,
                    })
                  }
                  className={`group rounded-2xl border overflow-hidden flex flex-col justify-between transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl cursor-pointer ${
                    isDark
                      ? 'bg-[#111117] border-[#22222E] hover:border-red-500/50 shadow-black/40'
                      : 'bg-white border-slate-200 hover:border-red-400 shadow-slate-200/50'
                  }`}
                >
                  <div className="relative aspect-video bg-neutral-900 overflow-hidden">
                    <img
                      src={`https://img.youtube.com/vi/${session.youtubeId}/hqdefault.jpg`}
                      alt={session.title}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

                    <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-red-600 text-white uppercase shadow-sm">
                        YouTube • {session.category}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/60 backdrop-blur-md text-neutral-300">
                        ⏱️ {session.duration}
                      </span>
                    </div>

                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(239,68,68,0.5)]">
                        <Play className="w-5 h-5 fill-white ml-0.5" />
                      </div>
                    </div>

                    <div className="absolute bottom-2 left-2.5 right-2.5 flex items-center justify-between text-[11px] font-mono text-neutral-300">
                      <span>{session.channelName}</span>
                      <span className="text-amber-400 font-semibold">{session.caloriesBurnedEstimate}</span>
                    </div>
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div className="space-y-1.5">
                      <h3
                        className={`font-serif font-bold text-base leading-snug transition-colors ${
                          isDark ? 'text-white group-hover:text-red-400' : 'text-slate-900 group-hover:text-red-600'
                        }`}
                      >
                        {language === 'en' ? session.titleEn : session.title}
                      </h3>
                      <p className={`text-xs line-clamp-2 leading-relaxed ${isDark ? 'text-neutral-400' : 'text-slate-600'}`}>
                        {language === 'en' ? session.highlightEn : session.highlight}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-neutral-800/40 flex items-center justify-between text-xs font-semibold text-red-500">
                      <span className="flex items-center gap-1.5">
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>{language === 'en' ? 'Play YouTube Video' : 'Reproducir Video de YouTube'}</span>
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* OFFICIAL 16:9 EMBEDDED YOUTUBE PLAYER MODAL                   */}
        {/* ============================================================== */}
        {activeModalVideo && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fadeIn">
            <div
              className={`w-full max-w-4xl max-h-[94vh] rounded-2xl border overflow-hidden flex flex-col shadow-2xl transition-all ${
                isDark ? 'bg-[#101017] border-[#2B2B3D] text-[#E0E0E0]' : 'bg-white border-slate-300 text-slate-900'
              }`}
            >
              {/* Modal Top Bar */}
              <div
                className={`p-4 sm:px-6 py-3.5 border-b flex items-center justify-between ${
                  isDark ? 'bg-[#151520] border-[#222230]' : 'bg-slate-100 border-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-red-600/20 text-red-500 flex items-center justify-center">
                    <Youtube className="w-4 h-4 fill-current" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-serif font-bold text-white truncate max-w-md">
                      {activeModalVideo.title}
                    </h2>
                    <p className="text-xs text-neutral-400 flex items-center gap-2">
                      <span className="font-mono text-[#56A867] font-semibold">{activeModalVideo.category}</span>
                      <span>•</span>
                      <span>{activeModalVideo.duration}</span>
                      {activeModalVideo.authorOrChannel && (
                        <>
                          <span>•</span>
                          <span className="text-neutral-300">{activeModalVideo.authorOrChannel}</span>
                        </>
                      )}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setActiveModalVideo(null)}
                  className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  aria-label="Cerrar reproductor"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Scrollable Content */}
              <div className="flex-1 overflow-y-auto space-y-5 p-4 sm:p-6 text-left">
                {/* 16:9 Official YouTube Iframe Embed */}
                <div className="relative aspect-video rounded-xl overflow-hidden bg-black shadow-lg border border-neutral-800">
                  <iframe
                    src={`https://www.youtube.com/embed/${activeModalVideo.youtubeId}?autoplay=1&rel=0&modestbranding=1`}
                    title={activeModalVideo.title}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>

                {/* External YouTube fallback */}
                <div className="flex items-center justify-between text-xs font-mono">
                  <a
                    href={activeModalVideo.youtubeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#56A867] hover:underline flex items-center gap-1.5"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>{language === 'en' ? 'Open directly in YouTube app' : 'Abrir directamente en la app de YouTube'}</span>
                  </a>

                  <span className="text-neutral-500">Reproductor Oficial Embebido 16:9</span>
                </div>

                {/* Description */}
                {activeModalVideo.description && (
                  <p className={`text-xs leading-relaxed ${isDark ? 'text-neutral-300' : 'text-slate-700'}`}>
                    {activeModalVideo.description}
                  </p>
                )}

                {/* Optional key points */}
                {activeModalVideo.keyPoints && activeModalVideo.keyPoints.length > 0 && (
                  <div
                    className={`p-4 rounded-xl border space-y-2 ${
                      isDark ? 'bg-[#151520] border-[#252536]' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{language === 'en' ? 'Technical Key Points' : 'Puntos Clave de Ejecución Técnica'}</span>
                    </h3>
                    <ul className="space-y-1.5 text-xs">
                      {activeModalVideo.keyPoints.map((pt, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-[#56A867] font-bold mt-0.5">•</span>
                          <span className={isDark ? 'text-neutral-300' : 'text-slate-700'}>{pt}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Optional exercises list */}
                {activeModalVideo.exercisesList && activeModalVideo.exercisesList.length > 0 && (
                  <div
                    className={`p-4 rounded-xl border space-y-2 ${
                      isDark ? 'bg-[#151520] border-[#252536]' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                      <Dumbbell className="w-4 h-4" />
                      <span>{language === 'en' ? 'Exercises performed by athlete:' : 'Bloques ejecutados por el atleta:'}</span>
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {activeModalVideo.exercisesList.map((ex, i) => (
                        <div
                          key={i}
                          className={`p-2 rounded-lg border font-mono text-xs ${
                            isDark ? 'bg-[#181824] border-[#2D2D3E] text-neutral-300' : 'bg-white border-slate-200 text-slate-800'
                          }`}
                        >
                          {i + 1}. {ex}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Optional athlete tip */}
                {activeModalVideo.tip && (
                  <div className="p-3.5 rounded-xl bg-[#56A867]/10 border border-[#56A867]/30 text-xs font-mono text-[#56A867]">
                    💡 <strong>Tip del atleta:</strong> {activeModalVideo.tip}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
