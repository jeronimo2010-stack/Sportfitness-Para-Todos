/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Wrench,
  Sparkles,
  Layers,
  Dumbbell,
  CheckCircle2,
  AlertCircle,
  Home,
  ShieldCheck,
  ChevronRight,
  Flame,
} from 'lucide-react';
import { DetailedExerciseItem } from '../../data/comprehensiveExercises';
import { useApp } from '../../context/AppContext';
import { getExerciseLoadForUser } from '../../utils/biomechanicalWeights';
import { translateCategory, translateExerciseName, translateMuscle } from '../../utils/dataTranslations';

interface ExerciseVideoPlayerModalProps {
  exercise: DetailedExerciseItem | null;
  onClose: () => void;
  onStartPractice?: (exercise: DetailedExerciseItem) => void;
}

export const ExerciseVideoPlayerModal: React.FC<ExerciseVideoPlayerModalProps> = ({
  exercise,
  onClose,
  onStartPractice,
}) => {
  const { user, language } = useApp();
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTimeSec, setCurrentTimeSec] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<1 | 0.5>(1);
  const [activeTab, setActiveTab] = useState<'video' | 'bodyType' | 'materials' | 'diy'>('video');

  const duration = exercise?.videoDurationSeconds || 45;

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTimeSec((prev) => {
          if (prev >= duration) {
            return 0; // loop
          }
          return prev + 1;
        });
      }, 1000 / playbackSpeed);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, playbackSpeed, duration]);

  if (!exercise) return null;

  const currentPercent = Math.min(100, Math.round((currentTimeSec / duration) * 100));

  // Determine user's active body type highlight
  const userBodyType = (user.bodyType?.toLowerCase() || 'mesomorfo') as 'ectomorfo' | 'mesomorfo' | 'endomorfo';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#101017] border border-[#2B2B3D] rounded-2xl w-full max-w-4xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl text-left">
        {/* Modal Header */}
        <div className="p-4 sm:px-6 py-3.5 border-b border-[#222230] flex items-center justify-between bg-[#151520]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#56A867]/15 flex items-center justify-center text-[#56A867]">
              <Play className="w-4 h-4 fill-[#56A867]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white font-serif">
                  {translateExerciseName(exercise.name, language)}
                </h3>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-[#56A867]/15 text-[#56A867]">
                  {translateCategory(exercise.category, language)}
                </span>
              </div>
              <p className="text-xs text-[#8A8A9E] flex items-center gap-1.5">
                <span>{language === 'en' ? 'Target Muscle:' : 'Músculo:'}</span>
                <strong className="text-neutral-200">{translateMuscle(exercise.targetMuscle, language)}</strong>
                <span>• {language === 'en' ? `Technical video: < 1 min (${exercise.videoDurationSeconds}s)` : `Video técnico: < 1 min (${exercise.videoDurationSeconds}s)`}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#8A8A9E] hover:text-white hover:bg-[#20202E] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-[#222230] bg-[#12121B] px-4 sm:px-6 text-xs font-mono overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('video')}
            className={`py-3 px-3 border-b-2 font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'video'
                ? 'border-[#56A867] text-[#56A867]'
                : 'border-transparent text-[#8A8A9E] hover:text-white'
            }`}
          >
            <Play className="w-3.5 h-3.5" />
            <span>{language === 'en' ? 'Video & Execution' : 'Video & Ejecución'}</span>
          </button>
          <button
            onClick={() => setActiveTab('bodyType')}
            className={`py-3 px-3 border-b-2 font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'bodyType'
                ? 'border-[#56A867] text-[#56A867]'
                : 'border-transparent text-[#8A8A9E] hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{language === 'en' ? 'Purpose for Your Body' : '¿Para qué sirve en tu cuerpo?'}</span>
          </button>
          <button
            onClick={() => setActiveTab('materials')}
            className={`py-3 px-3 border-b-2 font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'materials'
                ? 'border-[#56A867] text-[#56A867]'
                : 'border-transparent text-[#8A8A9E] hover:text-white'
            }`}
          >
            <Home className="w-3.5 h-3.5" />
            <span>{language === 'en' ? 'Home Materials' : 'Materiales en Casa'}</span>
          </button>
          <button
            onClick={() => setActiveTab('diy')}
            className={`py-3 px-3 border-b-2 font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'diy'
                ? 'border-[#56A867] text-[#56A867]'
                : 'border-transparent text-[#8A8A9E] hover:text-white'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>{language === 'en' ? 'DIY Build Guide' : 'Cómo fabricar el material (DIY)'}</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: VIDEO & EXECUTION */}
          {activeTab === 'video' && (
            <div className="space-y-4">
              {/* Simulated HD Video Player Container */}
              <div className="relative aspect-video rounded-xl bg-black overflow-hidden border border-[#2A2A38] shadow-inner group">
                <img
                  src={exercise.videoThumbnail}
                  alt={exercise.name}
                  className={`w-full h-full object-cover transition-opacity duration-300 ${
                    isPlaying ? 'opacity-70 scale-105' : 'opacity-85'
                  }`}
                />

                {/* Grid Overlay / Biomechanics lines */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/30 pointer-events-none" />

                {/* Biomechanical Angle Indicator & Rep count badge */}
                <div className="absolute top-3 left-3 flex items-center gap-2 z-10">
                  <span className="px-2 py-0.5 rounded bg-black/70 backdrop-blur border border-[#56A867]/40 text-[#56A867] text-[10px] font-mono flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-[#56A867] animate-pulse" />
                    TÉCNICA IA SPORTFITNESS
                  </span>
                  <span className="px-2 py-0.5 rounded bg-black/60 text-white text-[10px] font-mono">
                    Cadencia: 2-1-2
                  </span>
                </div>

                {/* Big Center Play/Pause button on hover/pause */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  {!isPlaying && (
                    <div className="w-16 h-16 rounded-full bg-[#56A867]/90 text-black flex items-center justify-center shadow-lg transform transition-transform group-hover:scale-110">
                      <Play className="w-8 h-8 fill-black ml-1" />
                    </div>
                  )}
                </div>

                {/* Bottom Video Controls Bar */}
                <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black/95 via-black/80 to-transparent flex flex-col gap-2 z-10">
                  {/* Scrubber */}
                  <div className="w-full bg-[#333344] h-1.5 rounded-full overflow-hidden cursor-pointer relative">
                    <div
                      className="bg-[#56A867] h-full transition-all duration-200"
                      style={{ width: `${currentPercent}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs font-mono text-neutral-300">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setIsPlaying(!isPlaying)}
                        className="p-1.5 rounded-lg bg-[#20202E] hover:bg-[#56A867] hover:text-black transition-colors"
                      >
                        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
                      </button>
                      <button
                        onClick={() => setCurrentTimeSec(0)}
                        className="p-1.5 rounded-lg bg-[#20202E] hover:bg-[#303040] text-neutral-300"
                        title="Reiniciar video"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                      <span>
                        00:{currentTimeSec < 10 ? `0${currentTimeSec}` : currentTimeSec} / 00:
                        {duration < 10 ? `0${duration}` : duration}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setPlaybackSpeed(playbackSpeed === 1 ? 0.5 : 1)}
                        className="px-2 py-0.5 rounded bg-[#20202E] text-[10px] text-neutral-300 hover:text-white"
                      >
                        {playbackSpeed === 0.5 ? '0.5x (Cámara Lenta)' : '1x Normal'}
                      </button>
                      <button
                        onClick={() => setIsMuted(!isMuted)}
                        className="p-1.5 rounded-lg bg-[#20202E] hover:bg-[#303040] text-neutral-300"
                      >
                        {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step by step instructions */}
              <div className="p-4 rounded-xl bg-[#14141E] border border-[#242432] space-y-2">
                <h4 className="text-xs font-mono uppercase tracking-wider text-[#56A867] font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Protocolo de Ejecución Técnica</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-neutral-300">
                  {exercise.stepByStepExecution.map((step, idx) => (
                    <div key={idx} className="flex items-start gap-2 bg-[#1A1A26] p-2.5 rounded-lg border border-[#252535]">
                      <span className="w-5 h-5 rounded-full bg-[#56A867]/15 text-[#56A867] text-[11px] font-bold flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <p className="leading-relaxed">{step}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: FOR EACH BODY TYPE */}
          {activeTab === 'bodyType' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-[#56A867]/10 border border-[#56A867]/25 text-xs text-neutral-300 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-[#56A867] font-bold">
                    {language === 'en' ? 'Physical metrics in your profile:' : 'Biometría registrada en tu cuenta:'}
                  </span>{' '}
                  <strong className="text-white capitalize">{user.bodyType || (language === 'en' ? 'Mesomorph' : 'Mesomorfo')}</strong> ({user.height || 178} cm, {user.weight || 78} kg, {language === 'en' ? 'Size' : 'Talla'} {user.clothingSize || 'M'}).
                  <div className="text-[11px] text-[#A0A0B0] mt-0.5">
                    {language === 'en' ? 'Initial calculated load for this exercise:' : 'Carga inicial calculada para este ejercicio:'}{' '}
                    <strong className="text-[#56A867] font-mono">{getExerciseLoadForUser(exercise.name, user)} kg</strong>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2.5 py-1 rounded-lg bg-[#56A867] text-black font-bold uppercase shrink-0">
                  {getExerciseLoadForUser(exercise.name, user)} kg {language === 'en' ? 'suggested' : 'sugeridos'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Ectomorfo */}
                <div
                  className={`p-4 rounded-xl border transition-all ${
                    userBodyType === 'ectomorfo'
                      ? 'bg-[#181D14] border-[#56A867]/50 ring-1 ring-[#56A867]/40'
                      : 'bg-[#13131C] border-[#222230]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-bold text-amber-400 uppercase">
                      {language === 'en' ? 'Ectomorph' : 'Ectomorfo'}
                    </span>
                    <span className="text-[10px] text-[#7E7E8E] font-mono">
                      {language === 'en' ? 'Lean / Long Levers' : 'Delgado / Palancas Largas'}
                    </span>
                  </div>
                  <h5 className="text-sm font-bold text-white mb-2">
                    {language === 'en' ? 'Why it works for you' : '¿Para qué sirve?'}
                  </h5>
                  <p className="text-xs text-[#A0A0B0] leading-relaxed">
                    {exercise.purposeByBodyType.ectomorfo}
                  </p>
                </div>

                {/* Mesomorfo */}
                <div
                  className={`p-4 rounded-xl border transition-all ${
                    userBodyType === 'mesomorfo'
                      ? 'bg-[#181D14] border-[#56A867]/50 ring-1 ring-[#56A867]/40'
                      : 'bg-[#13131C] border-[#222230]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-bold text-[#56A867] uppercase">
                      {language === 'en' ? 'Mesomorph' : 'Mesomorfo'}
                    </span>
                    <span className="text-[10px] text-[#7E7E8E] font-mono">
                      {language === 'en' ? 'Athletic / Fast Responder' : 'Atlético / Fácil Ganancia'}
                    </span>
                  </div>
                  <h5 className="text-sm font-bold text-white mb-2">
                    {language === 'en' ? 'Why it works for you' : '¿Para qué sirve?'}
                  </h5>
                  <p className="text-xs text-[#A0A0B0] leading-relaxed">
                    {exercise.purposeByBodyType.mesomorfo}
                  </p>
                </div>

                {/* Endomorfo */}
                <div
                  className={`p-4 rounded-xl border transition-all ${
                    userBodyType === 'endomorfo'
                      ? 'bg-[#181D14] border-[#56A867]/50 ring-1 ring-[#56A867]/40'
                      : 'bg-[#13131C] border-[#222230]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-bold text-cyan-400 uppercase">
                      {language === 'en' ? 'Endomorph' : 'Endomorfo'}
                    </span>
                    <span className="text-[10px] text-[#7E7E8E] font-mono">
                      {language === 'en' ? 'Robust Build' : 'Estructura Robusta'}
                    </span>
                  </div>
                  <h5 className="text-sm font-bold text-white mb-2">
                    {language === 'en' ? 'Why it works for you' : '¿Para qué sirve?'}
                  </h5>
                  <p className="text-xs text-[#A0A0B0] leading-relaxed">
                    {exercise.purposeByBodyType.endomorfo}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: HOUSEHOLD MATERIALS */}
          {activeTab === 'materials' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-[#14141E] border border-[#252535] space-y-2">
                  <div className="flex items-center gap-2 text-xs font-mono uppercase text-[#7E7E8E]">
                    <Dumbbell className="w-4 h-4 text-[#56A867]" />
                    <span>{language === 'en' ? 'Commercial Gym Equipment' : 'Material de Gimnasio Comercial'}</span>
                  </div>
                  <p className="text-sm font-bold text-white">{exercise.householdMaterials.recommendedGym}</p>
                  <p className="text-xs text-[#8E8E9E]">
                    {language === 'en'
                      ? 'Standard equipment found in specialized training facilities.'
                      : 'Equipo estándar utilizado en centros de acondicionamiento de alta gama.'}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#151D12] border border-[#56A867]/30 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-mono uppercase text-[#56A867] font-bold">
                    <Home className="w-4 h-4" />
                    <span>{language === 'en' ? 'Equivalent Household Item' : 'Material Casero Equivalente'}</span>
                  </div>
                  <p className="text-sm font-bold text-white">{exercise.householdMaterials.homeAlternatives}</p>
                  <p className="text-xs text-[#A0C090]">
                    {language === 'en'
                      ? '100% everyday household items you can use safely without spending a dime.'
                      : 'Elementos 100% cotidianos que encuentras en tu hogar sin gastar un centavo.'}
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#141420] border border-[#252538] space-y-2">
                <h5 className="text-xs font-mono font-bold uppercase text-amber-400 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  <span>{language === 'en' ? 'Biomechanical Tip for Best Results' : 'Clave para Conseguir los Mejores Resultados'}</span>
                </h5>
                <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
                  {exercise.householdMaterials.optimalResultsTip}
                </p>
              </div>
            </div>
          )}

          {/* TAB 4: HOW TO MAKE IT (DIY) */}
          {activeTab === 'diy' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#181824] border border-[#2C2C40] space-y-3">
                <div className="flex items-center gap-2 text-[#56A867] font-bold font-mono text-xs uppercase">
                  <Wrench className="w-4 h-4" />
                  <span>
                    {language === 'en'
                      ? 'How to build this equipment safely at home'
                      : 'Cómo fabricar este material si no lo tienes en casa'}
                  </span>
                </div>
                <div className="p-3.5 rounded-lg bg-[#101018] border border-[#20202E] text-xs sm:text-sm text-neutral-200 leading-relaxed">
                  {exercise.householdMaterials.diyGuide}
                </div>

                <div className="flex items-start gap-2 text-xs text-[#8A8A9E] pt-2 border-t border-[#252535]">
                  <ShieldCheck className="w-4 h-4 text-[#56A867] shrink-0 mt-0.5" />
                  <p>
                    <strong>{language === 'en' ? 'Biomechanical Safety:' : 'Seguridad Biomecánica:'}</strong>{' '}
                    {language === 'en'
                      ? 'Always inspect bottle lids, backpack straps, and handles before commencing sets to prevent accidental spills or tears.'
                      : 'Verifica siempre que los recipientes y amarres estén herméticamente cerrados y asegurados con cinta gruesa antes de iniciar la serie.'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:px-6 py-3 border-t border-[#222230] bg-[#14141E] flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-[#8E8E9E] font-mono">
            {translateExerciseName(exercise.name, language)} • {language === 'en' ? 'Recommended volume: 3-4 sets of' : 'Duración recomendada: 3 a 4 series de'}{' '}
            {exercise.category === 'Core & Abdominales' ? '30-45s' : '10-12 reps'}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[#20202E] hover:bg-[#282838] text-xs font-mono text-white transition-colors"
            >
              {language === 'en' ? 'Close' : 'Cerrar'}
            </button>
            {onStartPractice && (
              <button
                onClick={() => {
                  onClose();
                  onStartPractice(exercise);
                }}
                className="px-4 py-2 rounded-xl bg-[#56A867] hover:bg-[#64B875] text-black text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-[0_0_15px_rgba(86,168,103,0.2)]"
              >
                <Play className="w-3.5 h-3.5 fill-black" />
                <span>{language === 'en' ? 'Practice with Sensor' : 'Practicar Ahora con Sensor'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
