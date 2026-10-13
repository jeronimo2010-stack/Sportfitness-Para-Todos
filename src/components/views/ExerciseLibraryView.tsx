/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
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
  UserCheck,
} from 'lucide-react';
import { ScreenId, CommunityVideo } from '../../types';
import { useApp } from '../../context/AppContext';
import { authService } from '../../services/authService';
import { UserAvatar } from '../common/UserAvatar';
import { ScrollReveal } from '../common/ScrollReveal';

interface ExerciseLibraryViewProps {
  onNavigate: (screen: ScreenId) => void;
}

type MuscleTag = 'Todos' | 'Pecho' | 'Espalda' | 'Piernas' | 'Hombros' | 'Brazos' | 'Explosividad' | 'Core';

const TAG_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Pecho: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  Espalda: { bg: 'bg-sky-500/15', text: 'text-sky-400', border: 'border-sky-500/30' },
  Piernas: { bg: 'bg-indigo-500/15', text: 'text-indigo-400', border: 'border-indigo-500/30' },
  Hombros: { bg: 'bg-purple-500/15', text: 'text-purple-400', border: 'border-purple-500/30' },
  Brazos: { bg: 'bg-pink-500/15', text: 'text-pink-400', border: 'border-pink-500/30' },
  Explosividad: { bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/30' },
  Core: { bg: 'bg-teal-500/15', text: 'text-teal-400', border: 'border-teal-500/30' },
  General: { bg: 'bg-neutral-500/15', text: 'text-neutral-400', border: 'border-neutral-500/30' },
};

// Robust YouTube ID extraction supporting standard watch URLs, short youtu.be, and Shorts format
export function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  const match = trimmed.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/i
  );
  return match && match[1] ? match[1] : null;
}

// Initial starter video guides to provide immediate high-value guidance across tags
const STARTER_VIDEOS: CommunityVideo[] = [
  {
    id: 'starter-vid-1',
    authorId: 'coach-carlos-id',
    authorName: 'Coach Carlos Rendón',
    authorRole: 'entrenador',
    title: 'Press de Banca Plano: Retracción Escapular y Trayectoria',
    youtubeUrl: 'https://www.youtube.com/watch?v=rT7DgCr-3pg',
    youtubeVideoId: 'rT7DgCr-3pg',
    tag: 'Pecho',
    notes: 'Claves: retracción y depresión escapular activas, codos a 45° del torso y leg drive firme en el suelo.',
    createdAt: '2026-09-20T10:00:00Z',
  },
  {
    id: 'starter-vid-2',
    authorId: 'coach-mateo-id',
    authorName: 'Coach Mateo Gómez',
    authorRole: 'entrenador',
    title: 'Salto al Cajón Pliométrico: Técnica Reactiva & Explosividad',
    youtubeUrl: 'https://www.youtube.com/watch?v=52d43l87j74',
    youtubeVideoId: '52d43l87j74',
    tag: 'Explosividad',
    notes: 'Enfoque en tiempo de contacto mínimo con el suelo (<0.2s) y extensión violenta de cadera para reclutamiento neuromuscular tipo IIx.',
    createdAt: '2026-09-22T14:30:00Z',
  },
  {
    id: 'starter-vid-3',
    authorId: 'ath-julian-id',
    authorName: 'Julián Castro',
    authorRole: 'atleta',
    title: 'Dominadas Pronas Estrictas: Rango Completo y Activación',
    youtubeUrl: 'https://www.youtube.com/watch?v=eGo4IYlbE5g',
    youtubeVideoId: 'eGo4IYlbE5g',
    tag: 'Espalda',
    notes: 'Evitar balanceo inercial; iniciar con retracción escapular previa al tirón y pausar 1 segundo con la barbilla sobre la barra.',
    createdAt: '2026-09-24T09:15:00Z',
  },
  {
    id: 'starter-vid-4',
    authorId: 'coach-carlos-id',
    authorName: 'Coach Carlos Rendón',
    authorRole: 'entrenador',
    title: 'Sentadilla Trasera Profunda: Posición de Pies y Bracing',
    youtubeUrl: 'https://www.youtube.com/watch?v=bEv6CCg2BC8',
    youtubeVideoId: 'bEv6CCg2BC8',
    tag: 'Piernas',
    notes: 'Mantener presión intraabdominal (Valsalva), descender rompiendo paralelo con rodillas alineadas a la punta de los pies.',
    createdAt: '2026-09-25T11:45:00Z',
  },
  {
    id: 'starter-vid-5',
    authorId: 'ath-santiago-id',
    authorName: 'Santiago Vélez',
    authorRole: 'atleta',
    title: 'Press Militar de Hombros con Barra Olímpica',
    youtubeUrl: 'https://www.youtube.com/watch?v=2yjwXTZQDDI',
    youtubeVideoId: '2yjwXTZQDDI',
    tag: 'Hombros',
    notes: 'Bloqueo glúteo y abdominal fuerte para evitar hiperextensión lumbar al empujar la barra sobre la cabeza.',
    createdAt: '2026-09-26T16:20:00Z',
  },
  {
    id: 'starter-vid-6',
    authorId: 'coach-mateo-id',
    authorName: 'Coach Mateo Gómez',
    authorRole: 'entrenador',
    title: 'Hang Power Clean (Cargada Colgada Explosiva)',
    youtubeUrl: 'https://www.youtube.com/watch?v=mEyoH5FVacY',
    youtubeVideoId: 'mEyoH5FVacY',
    tag: 'Explosividad',
    notes: 'Aceleración máxima desde la posición sobre rodillas. El tirón vertical debe ser instantáneo y los codos deben girar rápido.',
    createdAt: '2026-09-27T08:00:00Z',
  },
];

export const ExerciseLibraryView: React.FC<ExerciseLibraryViewProps> = ({ onNavigate }) => {
  const { user, language } = useApp();

  const [videos, setVideos] = useState<CommunityVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTag, setSelectedTag] = useState<MuscleTag>('Todos');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal for publishing video
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [titleInput, setTitleInput] = useState('');
  const [youtubeUrlInput, setYoutubeUrlInput] = useState('');
  const [tagInput, setTagInput] = useState<Exclude<MuscleTag, 'Todos'>>('Pecho');
  const [notesInput, setNotesInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Active playing video modal
  const [activePlayingVideo, setActivePlayingVideo] = useState<CommunityVideo | null>(null);

  // Load videos on mount from Firestore
  useEffect(() => {
    let isMounted = true;
    async function loadVideos() {
      setLoading(true);
      try {
        const remoteVideos = await authService.getCommunityVideos();
        if (isMounted) {
          if (remoteVideos.length > 0) {
            // Merge starter videos with any new user videos without duplicates
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

  // Filter videos by selected tag and search keyword
  const filteredVideos = useMemo(() => {
    return videos.filter((v) => {
      const matchesTag = selectedTag === 'Todos' || v.tag === selectedTag;
      const cleanSearch = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !cleanSearch ||
        v.title.toLowerCase().includes(cleanSearch) ||
        v.authorName.toLowerCase().includes(cleanSearch) ||
        (v.notes && v.notes.toLowerCase().includes(cleanSearch)) ||
        v.tag.toLowerCase().includes(cleanSearch);
      return matchesTag && matchesSearch;
    });
  }, [videos, selectedTag, searchQuery]);

  // Preview computed ID for live feedback in publish modal
  const parsedPreviewId = useMemo(() => {
    return extractYouTubeId(youtubeUrlInput);
  }, [youtubeUrlInput]);

  // Handle publishing new video
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

  const tagsList: MuscleTag[] = [
    'Todos',
    'Pecho',
    'Espalda',
    'Piernas',
    'Hombros',
    'Brazos',
    'Explosividad',
    'Core',
  ];

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-left">
      {/* Top Banner & Header */}
      <ScrollReveal direction="down" duration={0.35}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#20202A]">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#56A867]/15 border border-[#56A867]/30 text-[#56A867] text-xs font-mono font-bold uppercase tracking-wider mb-2">
              <Youtube className="w-4 h-4 text-red-500" />
              <span>{language === 'en' ? 'Community Video Guides' : 'Videos Guía de Ejercicios'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-tight">
              {language === 'en' ? 'Exercise Library & Technique Guides' : 'Ejercicios y Videos Guía'}
            </h1>
            <p className="text-xs sm:text-sm text-neutral-300 max-w-2xl mt-1">
              {language === 'en'
                ? 'Share and watch short technical exercise guides via YouTube links, categorized by muscle group and explosive power.'
                : 'Publica y consulta videos cortos guía de técnica de ejercicios mediante enlaces de YouTube, etiquetados por grupo muscular (Pecho, Espalda, Piernas, Explosividad, etc.).'}
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={() => onNavigate(user.role === 'entrenador' ? 'trainer-overview' : 'athlete-dashboard')}
              className="px-3.5 py-2.5 rounded-xl bg-[#161620] hover:bg-[#1E1E2C] text-neutral-300 hover:text-white border border-[#2A2A38] text-xs font-mono transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{language === 'en' ? 'Dashboard' : 'Volver'}</span>
            </button>

            <button
              onClick={() => {
                setShowPublishModal(true);
                setFormError('');
              }}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-[#56A867] hover:bg-[#64B875] text-black font-bold text-xs uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(86,168,103,0.3)] hover:shadow-[0_0_25px_rgba(86,168,103,0.45)] flex items-center justify-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{language === 'en' ? 'Publish Video Guide' : 'Publicar Video Guía'}</span>
            </button>
          </div>
        </div>
      </ScrollReveal>

      {/* Filter Tabs & Search Bar */}
      <ScrollReveal direction="up" delay={0.08} duration={0.35}>
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Tag Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {tagsList.map((tag) => {
              const isActive = selectedTag === tag;
              return (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-medium transition-all shrink-0 cursor-pointer ${
                    isActive
                      ? 'bg-[#56A867] text-black font-bold shadow-md shadow-[#56A867]/20 scale-105'
                      : 'bg-[#14141E] text-neutral-300 hover:text-white hover:bg-[#1C1C2A] border border-[#252535]'
                  }`}
                >
                  {tag === 'Explosividad' && '⚡ '}
                  {tag}
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="relative min-w-[260px] md:w-72">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={language === 'en' ? 'Search by exercise or cue...' : 'Buscar ejercicio, técnica o etiqueta...'}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#14141E] border border-[#252535] text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#56A867] transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </ScrollReveal>

      {/* Videos Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs text-neutral-400 font-mono">
          <span>
            {language === 'en'
              ? `Showing ${filteredVideos.length} video guides`
              : `Mostrando ${filteredVideos.length} videos guía`}
          </span>
          {selectedTag !== 'Todos' && (
            <span className="text-[#56A867] font-semibold">
              {language === 'en' ? `Filtered by: ${selectedTag}` : `Filtrado por: ${selectedTag}`}
            </span>
          )}
        </div>

        {filteredVideos.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-[#121218] border border-[#20202A] space-y-3">
            <Video className="w-10 h-10 text-neutral-500 mx-auto" />
            <h3 className="text-base font-semibold text-white">
              {language === 'en' ? 'No video guides found' : 'No se encontraron videos en esta categoría'}
            </h3>
            <p className="text-xs text-neutral-400 max-w-sm mx-auto">
              {language === 'en'
                ? 'Be the first to publish a short exercise guide with a YouTube link!'
                : '¡Sé el primero en compartir un video corto guía de técnica con un enlace de YouTube!'}
            </p>
            <button
              onClick={() => setShowPublishModal(true)}
              className="mt-2 px-4 py-2 rounded-xl bg-[#56A867] text-black font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{language === 'en' ? 'Publish Video' : 'Publicar Ahora'}</span>
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
                  {/* Thumbnail / Embed Cover */}
                  <div className="relative aspect-video bg-black overflow-hidden">
                    <img
                      src={`https://img.youtube.com/vi/${video.youtubeVideoId}/hqdefault.jpg`}
                      alt={video.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />

                    {/* Play button overlay */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-red-600/90 text-white flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:bg-red-500 transition-all">
                        <Play className="w-5 h-5 fill-white ml-0.5" />
                      </div>
                    </div>

                    {/* Tag badge on top right */}
                    <div className="absolute top-3 right-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-mono font-bold tracking-wider uppercase border shadow-md ${tagStyle.bg} ${tagStyle.text} ${tagStyle.border}`}
                      >
                        {video.tag === 'Explosividad' && '⚡ '}
                        {video.tag}
                      </span>
                    </div>

                    {/* Duration / YouTube pill on bottom left */}
                    <div className="absolute bottom-2.5 left-3 flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-sm text-[10px] font-mono text-neutral-300 border border-white/10">
                      <Youtube className="w-3 h-3 text-red-500" />
                      <span>YouTube Guide</span>
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

                  {/* Body Content */}
                  <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-[#56A867] transition-colors line-clamp-2 leading-snug">
                        {video.title}
                      </h3>
                      {video.notes && (
                        <p className="text-xs text-neutral-300 mt-2 line-clamp-2 leading-relaxed">
                          {video.notes}
                        </p>
                      )}
                    </div>

                    {/* Author Footer */}
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
                          <span className="text-[10px] font-mono text-neutral-400 flex items-center gap-1">
                            {isCoach ? (
                              <span className="text-amber-400 font-bold">Coach (C)</span>
                            ) : (
                              <span className="text-emerald-400 font-bold">Deportista (D)</span>
                            )}
                          </span>
                        </div>
                      </div>

                      <span className="text-[10px] font-mono text-neutral-300">
                        {new Date(video.createdAt).toLocaleDateString(language === 'en' ? 'en-US' : 'es-CO', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ========================================== */}
      {/* MODAL: PUBLISH VIDEO GUIDE                */}
      {/* ========================================== */}
      {showPublishModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-[#121218] border border-[#282838] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-[#20202E] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#56A867]/15 text-[#56A867] flex items-center justify-center">
                  <Youtube className="w-4 h-4 text-red-500" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">
                    {language === 'en' ? 'Publish Short Exercise Guide' : 'Publicar Video Guía de Ejercicio'}
                  </h2>
                  <p className="text-[11px] text-neutral-400">
                    {language === 'en'
                      ? 'Share a YouTube video with technique cues and tags.'
                      : 'Comparte un video de YouTube con claves técnicas y etiquetas.'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowPublishModal(false)}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handlePublish} className="p-6 space-y-4 overflow-y-auto">
              {formError && (
                <div className="p-3 rounded-xl bg-red-950/40 border border-red-800/60 text-red-300 text-xs flex items-center gap-2">
                  <Info className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Author badge display */}
              <div className="p-3 rounded-xl bg-[#181824] border border-[#262638] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <UserAvatar user={user} size="sm" />
                  <div>
                    <div className="text-xs font-semibold text-white">{user.name}</div>
                    <div className="text-[10px] font-mono text-neutral-400">
                      {user.role === 'entrenador'
                        ? 'Publicando como Entrenador Oficial (Insignia C)'
                        : 'Publicando como Atleta / Deportista (Insignia D)'}
                    </div>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#56A867]/15 text-[#56A867]">
                  {user.role === 'entrenador' ? 'COACH' : 'DEPORTISTA'}
                </span>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-mono uppercase text-neutral-300 font-semibold mb-1">
                  {language === 'en' ? 'Exercise Title *' : 'Título del Ejercicio *'}
                </label>
                <input
                  type="text"
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  placeholder={
                    language === 'en'
                      ? 'E.g., Incline Dumbbell Press with 2s Pause'
                      : 'Ej: Press Inclinado con Mancuernas (Pausa 2s)'
                  }
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#161622] border border-[#28283A] text-white text-xs placeholder-neutral-500 focus:outline-none focus:border-[#56A867] transition-colors"
                />
              </div>

              {/* YouTube Link */}
              <div>
                <label className="block text-xs font-mono uppercase text-neutral-300 font-semibold mb-1">
                  {language === 'en' ? 'YouTube Link (Standard or Shorts) *' : 'Enlace de YouTube (Video o Shorts) *'}
                </label>
                <div className="relative">
                  <Youtube className="w-4 h-4 text-red-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="url"
                    value={youtubeUrlInput}
                    onChange={(e) => setYoutubeUrlInput(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=... o https://youtu.be/..."
                    required
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-[#161622] border border-[#28283A] text-white text-xs placeholder-neutral-500 focus:outline-none focus:border-[#56A867] transition-colors"
                  />
                </div>
                <p className="text-[10px] text-neutral-300 mt-1">
                  {language === 'en'
                    ? 'Accepts standard watch URLs, youtu.be short links, and YouTube Shorts.'
                    : 'Acepta enlaces estándar watch?v=, enlaces cortos youtu.be o YouTube Shorts.'}
                </p>
              </div>

              {/* Live Preview if ID is recognized */}
              {parsedPreviewId && (
                <div className="rounded-xl overflow-hidden border border-[#56A867]/40 bg-black/60 p-2 space-y-2">
                  <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#56A867]">
                    <Check className="w-3.5 h-3.5" />
                    <span>
                      {language === 'en'
                        ? `Video ID detected: ${parsedPreviewId}`
                        : `ID de video detectado: ${parsedPreviewId}`}
                    </span>
                  </div>
                  <div className="relative aspect-video rounded-lg overflow-hidden bg-black">
                    <iframe
                      src={`https://www.youtube-nocookie.com/embed/${parsedPreviewId}`}
                      title="Preview"
                      className="w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </div>
              )}

              {/* Muscle Tag Selector */}
              <div>
                <label className="block text-xs font-mono uppercase text-neutral-300 font-semibold mb-1.5">
                  {language === 'en' ? 'Muscle Group / Focus Tag *' : 'Etiqueta de Grupo Muscular / Enfoque *'}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(['Pecho', 'Espalda', 'Piernas', 'Hombros', 'Brazos', 'Explosividad', 'Core'] as const).map(
                    (tagOption) => {
                      const isSelected = tagInput === tagOption;
                      const style = TAG_COLORS[tagOption] || TAG_COLORS.General;
                      return (
                        <button
                          key={tagOption}
                          type="button"
                          onClick={() => setTagInput(tagOption)}
                          className={`px-3 py-2 rounded-xl text-xs font-mono font-medium transition-all text-center cursor-pointer border ${
                            isSelected
                              ? 'bg-[#56A867] text-black font-bold border-[#56A867] shadow-md shadow-[#56A867]/25'
                              : `${style.bg} ${style.text} ${style.border} hover:opacity-100 opacity-75`
                          }`}
                        >
                          {tagOption === 'Explosividad' && '⚡ '}
                          {tagOption}
                        </button>
                      );
                    }
                  )}
                </div>
              </div>

              {/* Technical cues / instructions */}
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

              {/* Action Buttons */}
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
                      <span>{language === 'en' ? 'Publish to Community' : 'Publicar Video'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL: FULLSCREEN YOUTUBE PLAYER           */}
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
                  {activePlayingVideo.tag}
                </span>
                <h3 className="text-sm sm:text-base font-bold text-white truncate">
                  {activePlayingVideo.title}
                </h3>
              </div>

              <button
                onClick={() => setActivePlayingVideo(null)}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
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
              {activePlayingVideo.notes && (
                <div className="p-3 rounded-xl bg-[#181824] border border-[#252538] text-xs text-neutral-200 leading-relaxed">
                  <span className="font-bold text-[#56A867] font-mono mr-1">
                    {language === 'en' ? 'Technique Cues:' : 'Claves Técnicas:'}
                  </span>
                  {activePlayingVideo.notes}
                </div>
              )}

              <div className="flex items-center justify-between text-xs text-neutral-400">
                <div className="flex items-center gap-2">
                  <UserAvatar
                    user={{
                      name: activePlayingVideo.authorName,
                      role: activePlayingVideo.authorRole,
                      customAvatar: activePlayingVideo.authorCustomAvatar,
                    }}
                    size="sm"
                  />
                  <div>
                    <span className="font-semibold text-white">{activePlayingVideo.authorName}</span>
                    <span className="text-[10px] font-mono text-neutral-400 ml-2">
                      ({activePlayingVideo.authorRole === 'entrenador' ? 'Insignia C • Coach' : 'Insignia D • Atleta'})
                    </span>
                  </div>
                </div>

                <a
                  href={activePlayingVideo.youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white text-xs font-mono transition-colors border border-white/10"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-red-500" />
                  <span>YouTube</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
