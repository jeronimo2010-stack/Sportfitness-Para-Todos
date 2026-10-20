/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Search,
  Play,
  Video,
  Youtube,
  ExternalLink,
  X,
  Camera,
  StopCircle,
  RotateCcw,
  Upload,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Dumbbell,
  Send,
  ChevronRight,
  Filter,
  Flame,
  Layers,
  Award,
} from 'lucide-react';
import { ScreenId, UserRole } from '../../types';
import { useApp } from '../../context/AppContext';
import { EXERCISE_TUTORIALS, ExerciseTutorial } from '../../data/exerciseTutorialsData';

interface ExerciseVideoLibraryViewProps {
  onNavigate: (screen: ScreenId) => void;
}

interface RecordedSubmission {
  id: string;
  athleteId: string;
  athleteName: string;
  athleteEmail: string;
  exerciseTitle: string;
  category: string;
  videoUrl?: string;
  notes: string;
  createdAt: string;
  status: 'pending' | 'reviewed';
  feedback?: string;
}

// Strip accents and punctuation for smooth intelligent matching
function cleanText(text: string): string {
  return (text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

// Synonyms dictionary mapping query tokens to related workout concepts
const FITNESS_SYNONYMS: Record<string, string[]> = {
  flexiones: ['lagartijas', 'pushups', 'push ups', 'pecho', 'brazo', 'brazos', 'pectoral', 'triceps'],
  lagartijas: ['flexiones', 'pushups', 'push ups', 'pecho', 'brazo', 'brazos', 'pectoral', 'triceps'],
  pushups: ['flexiones', 'lagartijas', 'pecho', 'triceps'],
  brazo: ['biceps', 'triceps', 'curl', 'martillo', 'fondos', 'diamante', 'antebrazo', 'mancuernas'],
  brazos: ['biceps', 'triceps', 'curl', 'martillo', 'fondos', 'diamante', 'antebrazo', 'mancuernas'],
  biceps: ['curl', 'martillo', 'brazo', 'brazos', 'mancuernas'],
  triceps: ['fondos', 'dips', 'diamante', 'brazo', 'brazos'],
  pecho: ['lagartijas', 'flexiones', 'pushups', 'diamante', 'pectoral'],
  pierna: ['sentadilla', 'sentadillas', 'squat', 'zancadas', 'lunges', 'rdl', 'gluteo', 'gluteos', 'gemelos', 'isquios'],
  piernas: ['sentadilla', 'sentadillas', 'squat', 'zancadas', 'lunges', 'rdl', 'gluteo', 'gluteos', 'gemelos', 'isquios'],
  sentadilla: ['air squat', 'piernas', 'cuadriceps', 'gluteos', 'squat'],
  sentadillas: ['air squat', 'piernas', 'cuadriceps', 'gluteos', 'squat'],
  abdomen: ['plancha', 'core', 'crunches', 'escaladores', 'mountain climbers'],
  abdominales: ['plancha', 'core', 'crunches', 'escaladores', 'mountain climbers'],
  core: ['plancha', 'abdominales', 'crunches', 'escaladores', 'abdomen'],
  hombro: ['press militar', 'overhead', 'laterales', 'elevaciones', 'deltoides'],
  hombros: ['press militar', 'overhead', 'laterales', 'elevaciones', 'deltoides'],
  espalda: ['dominadas', 'pull ups', 'remo', 'dorsales', 'lats'],
  cardio: ['jumping jacks', 'tijeras', 'saltos', 'skipping', 'rodillas', 'burpees', 'escaladores', 'hiit'],
};

const CATEGORIES = ['Todos', 'Pecho', 'Piernas', 'Brazos', 'Espalda', 'Hombros', 'Core', 'Cardio'] as const;
const DIFFICULTIES = ['Todos', 'Principiante', 'Intermedio', 'Avanzado'] as const;

export const ExerciseVideoLibraryView: React.FC<ExerciseVideoLibraryViewProps> = ({ onNavigate }) => {
  const { theme, language, user } = useApp();
  const isDark = theme === 'dark';

  // Active top tab
  const [activeTab, setActiveTab] = useState<'tutorials' | 'record'>('tutorials');

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('Todos');

  // Active selected video for modal player
  const [selectedTutorial, setSelectedTutorial] = useState<ExerciseTutorial | null>(null);

  // Camera & Recording State
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);

  // Submission Form State
  const [submitExerciseTitle, setSubmitExerciseTitle] = useState('');
  const [submitCategory, setSubmitCategory] = useState('Pecho');
  const [submitNotes, setSubmitNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // List of submissions saved in localStorage
  const [submissions, setSubmissions] = useState<RecordedSubmission[]>([]);

  // Refs for camera stream & media recorder
  const videoPreviewRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load saved submissions from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('sportfitness_recorded_submissions_v2');
      if (stored) {
        setSubmissions(JSON.parse(stored));
      }
    } catch (e) {
      console.warn('Error reading stored submissions:', e);
    }
  }, []);

  // Intelligent filter
  const filteredTutorials = useMemo(() => {
    const query = cleanText(searchQuery);

    // Expand search query with synonyms
    let queryVariants: string[] = [query];
    if (query) {
      Object.entries(FITNESS_SYNONYMS).forEach(([keyword, synonyms]) => {
        if (query.includes(keyword) || keyword.includes(query)) {
          queryVariants.push(...synonyms);
        }
      });
    }

    return EXERCISE_TUTORIALS.filter((item) => {
      // Category filter
      if (selectedCategory !== 'Todos' && item.category !== selectedCategory) {
        return false;
      }

      // Difficulty filter
      if (selectedDifficulty !== 'Todos' && item.difficulty !== selectedDifficulty) {
        return false;
      }

      // Search matching
      if (!query) return true;

      const title = cleanText(item.title);
      const titleEn = cleanText(item.titleEn);
      const cat = cleanText(item.category);
      const desc = cleanText(item.description);
      const muscles = item.targetMuscles.map(cleanText).join(' ');
      const syns = item.synonyms.map(cleanText).join(' ');

      const combinedHaystack = `${title} ${titleEn} ${cat} ${desc} ${muscles} ${syns}`;

      // Match either direct query or any of the synonym variants
      return queryVariants.some((variant) => combinedHaystack.includes(variant));
    });
  }, [searchQuery, selectedCategory, selectedDifficulty]);

  // Clean up camera stream and timer on unmount
  useEffect(() => {
    return () => {
      stopCamera();
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, []);

  // Camera Management
  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error(
          language === 'en'
            ? 'Camera access is not supported by your browser in this environment.'
            : 'Tu navegador o entorno no soporta acceso directo a la cámara.'
        );
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
      console.warn('Camera access failed, attempting video-only fallback:', err);
      // Attempt fallback with video only (if microphone was denied)
      try {
        const streamVideoOnly = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
        mediaStreamRef.current = streamVideoOnly;
        if (videoPreviewRef.current) {
          videoPreviewRef.current.srcObject = streamVideoOnly;
          videoPreviewRef.current.play().catch(() => {});
        }
        setIsCameraActive(true);
      } catch (fallbackErr: any) {
        setCameraError(
          language === 'en'
            ? 'Could not connect to camera. Please verify camera permissions in your browser.'
            : 'No se pudo acceder a la cámara. Revisa los permisos de cámara en tu navegador.'
        );
        setIsCameraActive(false);
      }
    }
  };

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (videoPreviewRef.current) {
      videoPreviewRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  // Recording Management
  const startRecording = () => {
    if (!mediaStreamRef.current) {
      startCamera();
      return;
    }

    recordedChunksRef.current = [];
    setRecordedVideoUrl(null);
    setRecordedBlob(null);
    setRecordSeconds(0);

    try {
      const mimeTypes = ['video/webm;codecs=vp9,opus', 'video/webm', 'video/mp4'];
      let chosenMime = '';
      for (const mime of mimeTypes) {
        if (MediaRecorder.isTypeSupported(mime)) {
          chosenMime = mime;
          break;
        }
      }

      const options = chosenMime ? { mimeType: chosenMime } : undefined;
      const recorder = new MediaRecorder(mediaStreamRef.current, options);

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, {
          type: chosenMime || 'video/webm',
        });
        const url = URL.createObjectURL(blob);
        setRecordedVideoUrl(url);
        setRecordedBlob(blob);
        setIsRecording(false);
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      };

      recorder.start(500); // 500ms chunk slices
      mediaRecorderRef.current = recorder;
      setIsRecording(true);

      timerIntervalRef.current = setInterval(() => {
        setRecordSeconds((prev) => prev + 1);
      }, 1000);
    } catch (e: any) {
      console.error('Error starting MediaRecorder:', e);
      setCameraError(
        language === 'en'
          ? 'Failed to record video with your device.'
          : 'Error al iniciar la grabación en este dispositivo.'
      );
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  const resetRecording = () => {
    if (recordedVideoUrl) {
      URL.revokeObjectURL(recordedVideoUrl);
    }
    setRecordedVideoUrl(null);
    setRecordedBlob(null);
    setRecordSeconds(0);
    recordedChunksRef.current = [];
  };

  // Send Recorded Technique to Coach
  const handleSubmitToCoach = (e: React.FormEvent) => {
    e.preventDefault();
    if (!submitExerciseTitle.trim()) return;

    setIsSubmitting(true);

    const newSubmission: RecordedSubmission = {
      id: `sub-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      athleteId: user?.id || 'guest',
      athleteName: user?.fullName || 'Atleta Sportfitness',
      athleteEmail: user?.email || '',
      exerciseTitle: submitExerciseTitle.trim(),
      category: submitCategory,
      videoUrl: recordedVideoUrl || undefined,
      notes: submitNotes.trim(),
      createdAt: new Date().toISOString(),
      status: 'pending',
    };

    const updated = [newSubmission, ...submissions];
    setSubmissions(updated);
    try {
      localStorage.setItem('sportfitness_recorded_submissions_v2', JSON.stringify(updated));
    } catch (err) {
      console.warn('LocalStorage save error:', err);
    }

    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitSuccess(true);
      setSubmitNotes('');
      // Leave success message for 3 seconds then clear
      setTimeout(() => setSubmitSuccess(false), 4000);
    }, 600);
  };

  // Helper to open practice recording directly for a specific tutorial
  const handleOpenPracticeForTutorial = (tutorial: ExerciseTutorial) => {
    setSelectedTutorial(null);
    setActiveTab('record');
    setSubmitExerciseTitle(tutorial.title);
    setSubmitCategory(tutorial.category);
    // Start camera when entering recording tab
    setTimeout(() => {
      startCamera();
    }, 150);
  };

  // Format seconds into MM:SS
  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className={`min-h-screen p-4 sm:p-6 lg:p-8 select-none transition-colors ${
      isDark ? 'bg-[#0A0A0E] text-[#E0E0E8]' : 'bg-slate-50 text-slate-900'
    }`}>
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-5 transition-colors border-neutral-800/60">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className={`text-[10px] font-mono uppercase font-bold tracking-widest px-2.5 py-0.5 rounded ${
                isDark ? 'bg-[#56A867]/20 text-[#56A867] border border-[#56A867]/30' : 'bg-emerald-100 text-emerald-800'
              }`}>
                {language === 'en' ? 'Technique & Video Lab' : 'Laboratorio Técnico & Videos'}
              </span>
              <span className="text-xs font-mono text-neutral-500">v2.0 HD</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-black tracking-tight flex items-center gap-3">
              <Video className="w-7 h-7 text-[#56A867]" />
              <span>{language === 'en' ? 'Workout Videos & Tutorials' : 'Videos de Entrenamiento y Tutoriales'}</span>
            </h1>
            <p className={`text-xs sm:text-sm mt-1 max-w-2xl ${isDark ? 'text-neutral-400' : 'text-slate-600'}`}>
              {language === 'en'
                ? 'Master exact biomechanical execution with official YouTube video tutorials, smart synonym search, and camera recording for coach reviews.'
                : 'Perfecciona tu técnica con más de 20 tutoriales de YouTube, buscador inteligente en tiempo real y grabación de técnica con tu cámara para revisión del entrenador.'}
            </p>
          </div>

          {/* Tab Selector */}
          <div className={`flex items-center p-1 rounded-xl border self-start md:self-auto ${
            isDark ? 'bg-[#121218] border-[#22222E]' : 'bg-slate-200/80 border-slate-300'
          }`}>
            <button
              onClick={() => {
                setActiveTab('tutorials');
                stopCamera();
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'tutorials'
                  ? isDark
                    ? 'bg-[#56A867] text-black shadow-md'
                    : 'bg-white text-emerald-700 shadow'
                  : isDark
                  ? 'text-neutral-400 hover:text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Youtube className="w-4 h-4" />
              <span>{language === 'en' ? 'Tutorials Library' : 'Biblioteca de Tutoriales'}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                activeTab === 'tutorials' ? 'bg-black/20 text-black' : isDark ? 'bg-neutral-800 text-neutral-300' : 'bg-slate-300 text-slate-800'
              }`}>
                {EXERCISE_TUTORIALS.length}
              </span>
            </button>

            <button
              onClick={() => {
                setActiveTab('record');
                startCamera();
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'record'
                  ? isDark
                    ? 'bg-[#56A867] text-black shadow-md'
                    : 'bg-white text-emerald-700 shadow'
                  : isDark
                  ? 'text-neutral-400 hover:text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Camera className="w-4 h-4" />
              <span>{language === 'en' ? 'Record & Send to Coach' : 'Graba tu Rutina / Envía al Coach'}</span>
            </button>
          </div>
        </div>

        {/* ============================================================== */}
        {/* TAB 1: TUTORIALS & YOUTUBE LIBRARY                           */}
        {/* ============================================================== */}
        {activeTab === 'tutorials' && (
          <div className="space-y-6 animate-fadeIn">
            
            {/* Search Bar & Smart Filter Controls */}
            <div className={`p-4 sm:p-5 rounded-2xl border space-y-4 shadow-sm ${
              isDark ? 'bg-[#111116] border-[#22222E]' : 'bg-white border-slate-200'
            }`}>
              
              {/* Search input with live synonym feedback */}
              <div className="relative">
                <Search className={`w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 ${
                  isDark ? 'text-neutral-400' : 'text-slate-400'
                }`} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={
                    language === 'en'
                      ? 'Smart search: e.g. "pushups", "flexiones", "lagartijas", "brazo", "biceps", "piernas", "abdominales"...'
                      : 'Buscador inteligente: ej. "flexiones", "lagartijas", "brazo", "bíceps", "tríceps", "pierna", "core", "sentadillas"...'
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

              {/* Category Pills & Difficulty Filter */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-1">
                {/* Categories */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  {CATEGORIES.map((cat) => {
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

                {/* Difficulty Filter */}
                <div className="flex items-center gap-2 self-end lg:self-auto shrink-0">
                  <span className={`text-[11px] font-mono ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>
                    {language === 'en' ? 'Level:' : 'Nivel:'}
                  </span>
                  <div className="flex items-center gap-1">
                    {DIFFICULTIES.map((diff) => (
                      <button
                        key={diff}
                        onClick={() => setSelectedDifficulty(diff)}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-mono font-medium transition-all cursor-pointer ${
                          selectedDifficulty === diff
                            ? isDark
                              ? 'bg-[#2E2E40] text-[#56A867] border border-[#56A867]/40 font-bold'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold'
                            : isDark
                            ? 'text-neutral-500 hover:text-neutral-300'
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        {diff}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Status and count summary */}
              <div className="flex items-center justify-between pt-1 text-xs font-mono text-neutral-500">
                <span>
                  {language === 'en'
                    ? `Showing ${filteredTutorials.length} of ${EXERCISE_TUTORIALS.length} exercises`
                    : `Mostrando ${filteredTutorials.length} de ${EXERCISE_TUTORIALS.length} tutoriales`}
                </span>
                {searchQuery && (
                  <span className="text-[#56A867] truncate max-w-xs">
                    🔍 {language === 'en' ? 'Smart filter active' : 'Filtro inteligente activo'}
                  </span>
                )}
              </div>
            </div>

            {/* Video Cards Grid */}
            {filteredTutorials.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {filteredTutorials.map((tutorial) => {
                  return (
                    <div
                      key={tutorial.id}
                      onClick={() => setSelectedTutorial(tutorial)}
                      className={`group rounded-2xl border overflow-hidden flex flex-col justify-between transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl cursor-pointer ${
                        isDark
                          ? 'bg-[#111117] border-[#20202C] hover:border-[#56A867]/50 shadow-black/40'
                          : 'bg-white border-slate-200 hover:border-emerald-400 shadow-slate-200/50'
                      }`}
                    >
                      {/* Thumbnail Container (16:9) with YouTube Preview */}
                      <div className="relative aspect-video bg-neutral-900 overflow-hidden">
                        <img
                          src={`https://img.youtube.com/vi/${tutorial.youtubeId}/hqdefault.jpg`}
                          alt={tutorial.title}
                          loading="lazy"
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        
                        {/* Overlay gradient */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

                        {/* Top badges */}
                        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between">
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-black/60 backdrop-blur-md text-[#56A867] border border-white/10 uppercase">
                            {tutorial.category}
                          </span>
                          <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-black/60 backdrop-blur-md text-neutral-300 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-[#56A867]" />
                            {tutorial.duration}
                          </span>
                        </div>

                        {/* Centered Play Button */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-12 h-12 rounded-full bg-[#56A867] text-black flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(86,168,103,0.5)]">
                            <Play className="w-5 h-5 fill-black ml-0.5" />
                          </div>
                        </div>

                        {/* Bottom difficulty indicator */}
                        <div className="absolute bottom-2 left-2.5 text-[10px] font-mono font-semibold text-neutral-300 flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            tutorial.difficulty === 'Principiante' ? 'bg-emerald-400' : tutorial.difficulty === 'Intermedio' ? 'bg-amber-400' : 'bg-rose-400'
                          }`} />
                          <span>{tutorial.difficulty}</span>
                        </div>
                      </div>

                      {/* Card Body */}
                      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                        <div className="space-y-1.5">
                          <h3 className={`font-serif font-bold text-base leading-snug line-clamp-2 transition-colors ${
                            isDark ? 'text-white group-hover:text-[#56A867]' : 'text-slate-900 group-hover:text-emerald-700'
                          }`}>
                            {language === 'en' ? tutorial.titleEn : tutorial.title}
                          </h3>
                          <p className={`text-xs line-clamp-2 leading-relaxed ${
                            isDark ? 'text-neutral-400' : 'text-slate-600'
                          }`}>
                            {language === 'en' ? tutorial.descriptionEn : tutorial.description}
                          </p>
                        </div>

                        {/* Muscles & Equipment */}
                        <div className="pt-2 border-t border-neutral-800/40 space-y-1.5">
                          <div className="flex items-center gap-1 text-[11px] font-mono text-neutral-400">
                            <Dumbbell className="w-3 h-3 text-[#56A867] shrink-0" />
                            <span className="truncate">{language === 'en' ? tutorial.equipmentEn : tutorial.equipment}</span>
                          </div>

                          <div className="flex items-center justify-between text-xs font-semibold text-[#56A867] pt-1">
                            <span className="flex items-center gap-1">
                              <Play className="w-3 h-3 fill-current" />
                              {language === 'en' ? 'Watch Tutorial' : 'Ver Tutorial'}
                            </span>
                            <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Empty Search Results */
              <div className={`p-12 text-center rounded-2xl border space-y-3 ${
                isDark ? 'bg-[#111116] border-[#22222E]' : 'bg-white border-slate-200'
              }`}>
                <Search className="w-10 h-10 mx-auto text-neutral-500 stroke-1" />
                <h3 className="text-lg font-serif font-bold">
                  {language === 'en' ? 'No matching exercises found' : 'No encontramos ejercicios con ese término'}
                </h3>
                <p className="text-xs text-neutral-400 max-w-md mx-auto">
                  {language === 'en'
                    ? 'Try searching with common synonyms like "flexiones", "pushups", "brazo", "piernas", "core", or reset the category filters.'
                    : 'Intenta buscar con sinónimos como "flexiones", "pushups", "brazo", "piernas", "core", o restablece los filtros de categoría.'}
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('Todos');
                    setSelectedDifficulty('Todos');
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold font-mono uppercase bg-[#56A867] text-black hover:bg-[#64B875] transition-all cursor-pointer"
                >
                  {language === 'en' ? 'Clear Filters' : 'Restablecer Filtros'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: RECORD WORKOUT / SEND TECHNIQUE TO COACH              */}
        {/* ============================================================== */}
        {activeTab === 'record' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn">
            
            {/* Left Column: Live Camera & Recorder */}
            <div className={`lg:col-span-7 p-5 rounded-2xl border space-y-4 ${
              isDark ? 'bg-[#111116] border-[#22222E]' : 'bg-white border-slate-200'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-serif font-bold flex items-center gap-2">
                    <Camera className="w-5 h-5 text-[#56A867]" />
                    <span>{language === 'en' ? 'Live Camera & Movement Recorder' : 'Cámara en Vivo & Grabador de Técnica'}</span>
                  </h2>
                  <p className={`text-xs ${isDark ? 'text-neutral-400' : 'text-slate-600'}`}>
                    {language === 'en'
                      ? 'Record up to 60 seconds of your set to verify range of motion, posture, and biomechanics.'
                      : 'Graba hasta 60 segundos de tu serie para que el entrenador verifique tu rango de movimiento y postura.'}
                  </p>
                </div>

                {isRecording && (
                  <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/20 border border-red-500/40 text-red-400 text-xs font-mono font-bold animate-pulse">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                    <span>REC {formatTime(recordSeconds)}</span>
                  </div>
                )}
              </div>

              {/* Viewport for Camera / Recorded Video */}
              <div className="relative aspect-video rounded-xl overflow-hidden bg-black border border-neutral-800 flex items-center justify-center">
                {/* If user finished recording and has a video URL */}
                {recordedVideoUrl ? (
                  <video
                    src={recordedVideoUrl}
                    controls
                    className="w-full h-full object-contain bg-black"
                  />
                ) : (
                  /* Live Camera Preview */
                  <video
                    ref={videoPreviewRef}
                    autoPlay
                    playsInline
                    muted
                    className={`w-full h-full object-cover scale-x-[-1] ${
                      !isCameraActive ? 'hidden' : ''
                    }`}
                  />
                )}

                {/* Camera Inactive placeholder */}
                {!isCameraActive && !recordedVideoUrl && (
                  <div className="p-6 text-center space-y-3">
                    <Camera className="w-12 h-12 mx-auto text-neutral-600 stroke-1" />
                    <p className="text-xs text-neutral-400 max-w-sm mx-auto">
                      {cameraError
                        ? cameraError
                        : language === 'en'
                        ? 'Click below to activate your webcam or phone camera and begin recording.'
                        : 'Haz clic en el botón inferior para encender tu cámara y comenzar la grabación.'}
                    </p>
                    <button
                      type="button"
                      onClick={startCamera}
                      className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-[#56A867] text-black hover:bg-[#64B875] transition-all cursor-pointer shadow-md"
                    >
                      {language === 'en' ? 'Turn On Camera' : 'Activar Cámara'}
                    </button>
                  </div>
                )}
              </div>

              {/* Recording Controls */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-2">
                  {!isRecording ? (
                    <button
                      type="button"
                      onClick={startRecording}
                      disabled={!isCameraActive && !recordedVideoUrl}
                      className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-red-600 hover:bg-red-700 text-white transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                    >
                      <span className="w-3 h-3 rounded-full bg-white animate-ping" />
                      <span>{language === 'en' ? 'Start Recording' : 'Iniciar Grabación'}</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={stopRecording}
                      className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-red-600 hover:bg-red-700 text-white transition-all flex items-center gap-2 cursor-pointer shadow-lg animate-pulse"
                    >
                      <StopCircle className="w-4 h-4" />
                      <span>{language === 'en' ? 'Stop Recording' : 'Finalizar Grabación'}</span>
                    </button>
                  )}

                  {recordedVideoUrl && (
                    <button
                      type="button"
                      onClick={resetRecording}
                      className={`px-4 py-2.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                        isDark ? 'bg-[#1C1C28] text-neutral-300 hover:bg-[#252536]' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                      }`}
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>{language === 'en' ? 'Re-record' : 'Volver a Grabar'}</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {isCameraActive && (
                    <button
                      type="button"
                      onClick={stopCamera}
                      className={`px-3 py-2 rounded-xl text-xs font-mono transition-colors cursor-pointer ${
                        isDark ? 'text-neutral-400 hover:text-white' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      {language === 'en' ? 'Turn Off Camera' : 'Apagar Cámara'}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: Submission Form & History */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Submission Form */}
              <div className={`p-5 rounded-2xl border space-y-4 ${
                isDark ? 'bg-[#111116] border-[#22222E]' : 'bg-white border-slate-200'
              }`}>
                <div>
                  <h3 className="font-serif font-bold text-base flex items-center gap-2">
                    <Send className="w-4 h-4 text-[#56A867]" />
                    <span>{language === 'en' ? 'Send Execution to Coach' : 'Enviar Ejecución al Entrenador'}</span>
                  </h3>
                  <p className={`text-xs ${isDark ? 'text-neutral-400' : 'text-slate-600'}`}>
                    {language === 'en'
                      ? 'Your assigned coach will evaluate posture, rhythm, joint path, and provide feedback.'
                      : 'Tu entrenador evaluará tu postura, ritmo y trayectoria articular para darte retroalimentación.'}
                  </p>
                </div>

                {submitSuccess && (
                  <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 text-xs font-medium flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>
                      {language === 'en'
                        ? 'Video sent successfully! Your coach has been notified for technical review.'
                        : '¡Video enviado exitosamente! Tu entrenador ha recibido la notificación de revisión.'}
                    </span>
                  </div>
                )}

                <form onSubmit={handleSubmitToCoach} className="space-y-3.5 text-left">
                  <div className="space-y-1">
                    <label className={`text-xs font-mono block ${isDark ? 'text-neutral-300' : 'text-slate-700'}`}>
                      {language === 'en' ? 'Exercise Name' : 'Nombre del Ejercicio'}
                    </label>
                    <input
                      type="text"
                      required
                      value={submitExerciseTitle}
                      onChange={(e) => setSubmitExerciseTitle(e.target.value)}
                      placeholder={language === 'en' ? 'e.g. Barbell Squat, Push-ups...' : 'ej. Sentadilla con Barra, Lagartijas, RDL...'}
                      className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-medium focus:outline-none transition-all ${
                        isDark
                          ? 'bg-[#181822] border border-[#2A2A38] text-white focus:border-[#56A867]'
                          : 'bg-slate-100 border border-slate-300 text-slate-900 focus:border-emerald-600'
                      }`}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className={`text-xs font-mono block ${isDark ? 'text-neutral-300' : 'text-slate-700'}`}>
                      {language === 'en' ? 'Muscle Group' : 'Grupo Muscular'}
                    </label>
                    <select
                      value={submitCategory}
                      onChange={(e) => setSubmitCategory(e.target.value)}
                      className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-medium focus:outline-none transition-all ${
                        isDark
                          ? 'bg-[#181822] border border-[#2A2A38] text-white focus:border-[#56A867]'
                          : 'bg-slate-100 border border-slate-300 text-slate-900 focus:border-emerald-600'
                      }`}
                    >
                      <option value="Pecho">{language === 'en' ? 'Chest (Pecho)' : 'Pecho'}</option>
                      <option value="Piernas">{language === 'en' ? 'Legs (Piernas)' : 'Piernas'}</option>
                      <option value="Brazos">{language === 'en' ? 'Arms (Brazos)' : 'Brazos'}</option>
                      <option value="Espalda">{language === 'en' ? 'Back (Espalda)' : 'Espalda'}</option>
                      <option value="Hombros">{language === 'en' ? 'Shoulders (Hombros)' : 'Hombros'}</option>
                      <option value="Core">{language === 'en' ? 'Core / Abs' : 'Core / Abdomen'}</option>
                      <option value="Cardio">{language === 'en' ? 'Cardio & HIIT' : 'Cardio & Calistenia'}</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className={`text-xs font-mono block ${isDark ? 'text-neutral-300' : 'text-slate-700'}`}>
                      {language === 'en' ? 'Questions or notes for your coach' : 'Preguntas o notas para tu entrenador'}
                    </label>
                    <textarea
                      rows={3}
                      value={submitNotes}
                      onChange={(e) => setSubmitNotes(e.target.value)}
                      placeholder={
                        language === 'en'
                          ? 'e.g. "I felt slight tension in my lower back on rep 8, please check my hip depth."'
                          : 'ej. "Sentí una ligera molestia lumbar en la octava repetición, por favor revisa la profundidad de mi cadera."'
                      }
                      className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-medium focus:outline-none transition-all resize-none ${
                        isDark
                          ? 'bg-[#181822] border border-[#2A2A38] text-white focus:border-[#56A867]'
                          : 'bg-slate-100 border border-slate-300 text-slate-900 focus:border-emerald-600'
                      }`}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting || !submitExerciseTitle.trim()}
                    className={`w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md ${
                      isDark
                        ? 'bg-[#56A867] hover:bg-[#64B875] text-black shadow-[0_0_15px_rgba(86,168,103,0.25)]'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isSubmitting ? (language === 'en' ? 'Sending...' : 'Enviando...') : (language === 'en' ? 'Send for Review' : 'Enviar para Revisión')}</span>
                  </button>
                </form>
              </div>

              {/* Submissions History */}
              <div className={`p-5 rounded-2xl border space-y-3 ${
                isDark ? 'bg-[#111116] border-[#22222E]' : 'bg-white border-slate-200'
              }`}>
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-400">
                  {language === 'en' ? 'Sent Submissions' : 'Tus Envíos Registrados'} ({submissions.length})
                </h4>

                {submissions.length > 0 ? (
                  <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                    {submissions.map((sub) => (
                      <div
                        key={sub.id}
                        className={`p-3 rounded-xl border text-xs space-y-1.5 transition-colors ${
                          isDark ? 'bg-[#161620] border-[#242434]' : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white truncate max-w-[180px]">{sub.exerciseTitle}</span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30">
                            {sub.status === 'pending' ? (language === 'en' ? 'Pending Review' : 'En Revisión') : (language === 'en' ? 'Reviewed' : 'Revisado')}
                          </span>
                        </div>
                        <p className={`text-[11px] truncate ${isDark ? 'text-neutral-400' : 'text-slate-600'}`}>
                          {sub.notes || (language === 'en' ? 'No extra notes provided' : 'Sin notas adicionales')}
                        </p>
                        <div className="flex items-center justify-between text-[10px] font-mono text-neutral-500 pt-1">
                          <span>{sub.category}</span>
                          <span>{new Date(sub.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-neutral-500 italic">
                    {language === 'en' ? 'No routine videos submitted yet.' : 'Aún no has enviado grabaciones de tu rutina.'}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* OFFICIAL 16:9 EMBEDDED YOUTUBE PLAYER MODAL                   */}
        {/* ============================================================== */}
        {selectedTutorial && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fadeIn">
            <div className={`w-full max-w-4xl max-h-[94vh] rounded-2xl border overflow-hidden flex flex-col shadow-2xl transition-all ${
              isDark ? 'bg-[#101017] border-[#2B2B3D] text-[#E0E0E0]' : 'bg-white border-slate-300 text-slate-900'
            }`}>
              
              {/* Modal Top Bar */}
              <div className={`p-4 sm:px-6 py-3.5 border-b flex items-center justify-between ${
                isDark ? 'bg-[#151520] border-[#222230]' : 'bg-slate-100 border-slate-200'
              }`}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#56A867]/20 text-[#56A867] flex items-center justify-center">
                    <Youtube className="w-4 h-4 fill-current" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-serif font-bold text-white truncate max-w-md">
                      {language === 'en' ? selectedTutorial.titleEn : selectedTutorial.title}
                    </h2>
                    <p className="text-xs text-neutral-400 flex items-center gap-2">
                      <span className="font-mono text-[#56A867] font-semibold">{selectedTutorial.category}</span>
                      <span>•</span>
                      <span>{selectedTutorial.difficulty}</span>
                      <span>•</span>
                      <span>{selectedTutorial.duration}</span>
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedTutorial(null)}
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
                    src={`https://www.youtube.com/embed/${selectedTutorial.youtubeId}?autoplay=1&rel=0&modestbranding=1`}
                    title={selectedTutorial.title}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>

                {/* External YouTube fallback */}
                <div className="flex items-center justify-between text-xs font-mono">
                  <a
                    href={selectedTutorial.youtubeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#56A867] hover:underline flex items-center gap-1.5"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>{language === 'en' ? 'Open directly on YouTube' : 'Abrir directamente en YouTube'}</span>
                  </a>

                  <button
                    onClick={() => handleOpenPracticeForTutorial(selectedTutorial)}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase bg-[#56A867] text-black hover:bg-[#64B875] transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>{language === 'en' ? 'Record My Technique' : 'Grabar Mi Técnica'}</span>
                  </button>
                </div>

                {/* Biomechanical Details & Technical Key Points */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  
                  {/* Key Execution Points */}
                  <div className={`p-4 rounded-xl border space-y-2.5 ${
                    isDark ? 'bg-[#151520] border-[#252536]' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{language === 'en' ? 'Execution Key Points' : 'Puntos Clave de Ejecución'}</span>
                    </h3>
                    <ul className="space-y-1.5 text-xs">
                      {(language === 'en' ? selectedTutorial.keyPointsEn : selectedTutorial.keyPoints).map((pt, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-[#56A867] font-bold mt-0.5">•</span>
                          <span className={isDark ? 'text-neutral-300' : 'text-slate-700'}>{pt}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Common Mistakes to Avoid */}
                  <div className={`p-4 rounded-xl border space-y-2.5 ${
                    isDark ? 'bg-[#151520] border-[#252536]' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-rose-400 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      <span>{language === 'en' ? 'Common Mistakes to Avoid' : 'Errores Comunes a Evitar'}</span>
                    </h3>
                    <ul className="space-y-1.5 text-xs">
                      {(language === 'en' ? selectedTutorial.commonMistakesEn : selectedTutorial.commonMistakes).map((mst, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-rose-400 font-bold mt-0.5">✕</span>
                          <span className={isDark ? 'text-neutral-300' : 'text-slate-700'}>{mst}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Muscles worked & Equipment */}
                <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                  isDark ? 'bg-[#151520] border-[#252536]' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="space-y-1">
                    <span className="font-mono text-neutral-400 text-[11px] block">
                      {language === 'en' ? 'Target Muscles' : 'Músculos Involucrados'}
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedTutorial.targetMuscles.map((m, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded text-[11px] font-medium bg-[#56A867]/15 text-[#56A867]">
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1 sm:text-right">
                    <span className="font-mono text-neutral-400 text-[11px] block">
                      {language === 'en' ? 'Required Equipment' : 'Equipo Requerido'}
                    </span>
                    <span className="font-semibold text-white">
                      {language === 'en' ? selectedTutorial.equipmentEn : selectedTutorial.equipment}
                    </span>
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
