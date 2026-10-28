/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Star,
  ThumbsUp,
  MessageSquare,
  Sparkles,
  Award,
  Filter,
  Plus,
  CheckCircle2,
  X,
  ChevronRight,
} from 'lucide-react';
import { ReviewItem, ScreenId, UserProfile } from '../../types';
import { initialReviews } from '../../data/initialData';
import { localDatabase } from '../../db/localDatabase';
import { useApp } from '../../context/AppContext';
import { ScrollReveal, StaggerContainer, StaggerItem } from '../common/ScrollReveal';
import { UserAvatar } from '../common/UserAvatar';

interface ReviewsViewProps {
  onNavigate: (screen: ScreenId) => void;
  user: UserProfile;
}

export const ReviewsView: React.FC<ReviewsViewProps> = ({ onNavigate, user }) => {
  const { theme, t, language, isAuthenticated } = useApp();
  const [reviews, setReviews] = useState<ReviewItem[]>(() => {
    try {
      const stored = localDatabase.getReviews();
      if (stored && stored.length > 0) {
        return stored.map((s) => ({
          id: s.id,
          authorName: s.authorName,
          authorRole: s.authorRole,
          authorAvatar: s.authorAvatar,
          rating: s.rating,
          date: s.date,
          title: s.title || (s.positiveFeedback ? s.positiveFeedback.slice(0, 40) : 'Reseña de Atleta'),
          content: s.content || s.positiveFeedback || '',
          likes: s.likes || 0,
          hasLiked: s.hasLiked,
        }));
      }
    } catch {}
    return [];
  });
  const [showAddReview, setShowAddReview] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const handleOpenAddReview = () => {
    if (!isAuthenticated || (user.role as string) === 'invitado' || !user.email) {
      setShowAuthModal(true);
      return;
    }
    setShowAddReview(true);
  };

  const isDark = theme === 'dark';

  const ratingsBreakdown = [
    { stars: 5, percent: 85 },
    { stars: 4, percent: 10 },
    { stars: 3, percent: 3 },
    { stars: 2, percent: 1 },
    { stars: 1, percent: 1 },
  ];

  const handleLike = (id: string) => {
    setReviews((prev) => {
      const updated = prev.map((r) =>
        r.id === id
          ? {
              ...r,
              likes: r.hasLiked ? r.likes - 1 : r.likes + 1,
              hasLiked: !r.hasLiked,
            }
          : r
      );
      return updated;
    });
  };

  const handleAddReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) return;

    const stored = localDatabase.addReview(
      user.name || (language === 'en' ? 'Athlete' : 'Atleta'),
      user.role === 'entrenador'
        ? (language === 'en' ? 'Certified Coach' : 'Coach Certificado')
        : (language === 'en' ? 'Verified Athlete' : 'Atleta Verificado'),
      rating,
      content,
      '',
      title,
      content,
      user.customAvatar || ''
    );

    const newRev: ReviewItem = {
      id: stored.id,
      authorName: stored.authorName,
      authorRole: stored.authorRole,
      authorAvatar: stored.authorAvatar,
      rating: stored.rating,
      date: stored.date,
      title: stored.title || title,
      content: stored.content || content,
      likes: stored.likes || 0,
      hasLiked: false,
    };

    setReviews([newRev, ...reviews]);
    setShowAddReview(false);
    setTitle('');
    setContent('');
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto text-left">
      {/* Header */}
      <ScrollReveal direction="down" duration={0.4}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div
              className={`inline-flex items-center gap-2 px-3 py-0.5 rounded-full text-[11px] font-mono font-bold uppercase tracking-wider mb-1 ${
                isDark
                  ? 'bg-[#56A867]/15 text-[#56A867]'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              }`}
            >
              <Star className={`w-3.5 h-3.5 fill-current`} />
              <span>{language === 'en' ? 'Elite Community & Feedback' : 'Comunidad & Valoraciones de Élite'}</span>
            </div>
            <h1 className={`text-2xl sm:text-3xl font-serif font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {t('reviewsTitle')}
            </h1>
            <p className={`text-xs sm:text-sm ${isDark ? 'text-[#8E8E9E]' : 'text-slate-500'}`}>
              {t('reviewsSubtitle')}
            </p>
          </div>

          <button
            onClick={handleOpenAddReview}
            className={`py-3 px-5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 shadow-md ${
              isDark
                ? 'bg-[#56A867] hover:bg-[#64B875] text-black shadow-[0_0_20px_rgba(86,168,103,0.25)]'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>{t('leaveReview')}</span>
          </button>
        </div>
      </ScrollReveal>

      {/* Global Satisfaction & Breakdown Box */}
      <ScrollReveal direction="up" delay={0.1} duration={0.5}>
        <div
          className={`p-6 rounded-2xl border grid grid-cols-1 md:grid-cols-12 gap-6 items-center transition-colors ${
            isDark
              ? 'bg-[#121218] border-[#20202A]'
              : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          {/* Left 4 cols: Big Score */}
          <div className={`md:col-span-4 text-center md:text-left space-y-2 border-b md:border-b-0 md:border-r pb-4 md:pb-0 md:pr-6 ${isDark ? 'border-[#1E1E28]' : 'border-slate-200'}`}>
            <div className={`text-5xl font-serif font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>4.8</div>
            <div className={`flex items-center justify-center md:justify-start gap-1 ${isDark ? 'text-[#56A867]' : 'text-emerald-500'}`}>
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-current" />
              ))}
            </div>
            <p className={`text-xs ${isDark ? 'text-[#8E8E9E]' : 'text-slate-500'}`}>
              {language === 'en'
                ? <span>Based on <strong className={isDark ? 'text-white' : 'text-slate-900'}>+1,204</strong> verified athlete ratings.</span>
                : <span>Basado en <strong className={isDark ? 'text-white' : 'text-slate-900'}>+1,204</strong> calificaciones verificadas de atletas.</span>}
            </p>
          </div>

          {/* Right 8 cols: Star Breakdown Bars */}
          <div className="md:col-span-8 space-y-2">
            {ratingsBreakdown.map((item) => (
              <div key={item.stars} className="flex items-center gap-3 text-xs font-mono">
                <span className={`w-6 flex items-center gap-1 ${isDark ? 'text-[#A0A0B0]' : 'text-slate-600'}`}>
                  <span>{item.stars}</span>
                  <Star className={`w-3 h-3 fill-current ${isDark ? 'text-[#56A867]' : 'text-emerald-500'}`} />
                </span>
                <div className={`flex-1 h-2 rounded-full overflow-hidden ${isDark ? 'bg-[#1A1A24]' : 'bg-slate-100'}`}>
                  <div
                    style={{ width: `${item.percent}%` }}
                    className={`h-full rounded-full ${isDark ? 'bg-[#56A867]' : 'bg-emerald-500'}`}
                  />
                </div>
                <span className={`w-10 text-right ${isDark ? 'text-[#707080]' : 'text-slate-400'}`}>{item.percent}%</span>
              </div>
            ))}
          </div>
        </div>
      </ScrollReveal>

      {/* Reviews Feed */}
      <div className="space-y-4">
        <ScrollReveal direction="up" delay={0.1}>
          <div className={`flex items-center justify-between pb-2 border-b ${isDark ? 'border-[#1E1E28]' : 'border-slate-200'}`}>
            <h3 className={`text-base font-serif font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {language === 'en' ? `Recent Community Reviews (${reviews.length})` : `Comentarios Recientes de la Comunidad (${reviews.length})`}
            </h3>
            <span className={`text-xs font-mono ${isDark ? 'text-[#808090]' : 'text-slate-400'}`}>
              {language === 'en' ? 'Sorted by Relevance' : 'Ordenados por Relevancia'}
            </span>
          </div>
        </ScrollReveal>

        {reviews.length === 0 ? (
          <div
            className={`p-10 text-center rounded-2xl border ${
              isDark ? 'bg-[#121218] border-[#20202A]' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <MessageSquare className="w-10 h-10 mx-auto text-[#56A867] mb-3 opacity-80" />
            <h4 className={`text-base font-serif font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {language === 'en' ? 'No reviews published yet' : 'Aún no hay valoraciones publicadas'}
            </h4>
            <p className={`text-xs mt-1.5 max-w-md mx-auto ${isDark ? 'text-[#888898]' : 'text-slate-600'}`}>
              {language === 'en'
                ? 'Be the first athlete to share your feedback and help the community reach peak performance.'
                : 'Sé el primer atleta en compartir tu experiencia y ayudar a la comunidad a alcanzar su máximo nivel deportivo.'}
            </p>
            <button
              onClick={handleOpenAddReview}
              className="mt-4 px-5 py-2 rounded-xl text-xs font-bold bg-[#56A867] hover:bg-[#64B875] text-black transition-all cursor-pointer inline-flex items-center gap-2"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{language === 'en' ? 'Write First Review' : 'Escribir Primera Reseña'}</span>
            </button>
          </div>
        ) : (
          <StaggerContainer staggerDelay={0.08} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reviews.map((rev) => (
              <StaggerItem key={rev.id}>
                <div
                  className={`p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-3 h-full ${
                    isDark
                      ? 'bg-[#121218] border-[#20202A] hover:border-[#56A867]/30'
                      : 'bg-white border-slate-200 hover:border-emerald-300 shadow-sm'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <UserAvatar
                          user={{
                            name: rev.authorName,
                            role: rev.authorRole.toLowerCase().includes('coach') || rev.authorRole.toLowerCase().includes('entrenador') ? 'entrenador' : 'atleta',
                            customAvatar: rev.authorAvatar && !rev.authorAvatar.includes('unsplash.com') ? rev.authorAvatar : undefined,
                          }}
                          size="md"
                          className="w-10 h-10 shrink-0"
                        />
                        <div>
                          <h4 className={`font-bold text-xs ${isDark ? 'text-white' : 'text-slate-900'}`}>{rev.authorName}</h4>
                          <span className={`text-[10px] font-mono ${isDark ? 'text-[#56A867]' : 'text-emerald-700'}`}>{rev.authorRole}</span>
                        </div>
                      </div>

                      <div className={`flex items-center gap-0.5 ${isDark ? 'text-[#56A867]' : 'text-amber-500'}`}>
                        {[...Array(rev.rating)].map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 fill-current" />
                        ))}
                      </div>
                    </div>

                    <h5 className={`font-serif font-bold text-sm pt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      "{rev.title}"
                    </h5>
                    <p className={`text-xs leading-relaxed ${isDark ? 'text-[#9E9EA8]' : 'text-slate-600'}`}>
                      {rev.content}
                    </p>
                  </div>

                  <div className={`pt-3 border-t flex items-center justify-between text-xs font-mono ${isDark ? 'border-[#1C1C26] text-[#707080]' : 'border-slate-100 text-slate-400'}`}>
                    <span>{rev.date}</span>

                    <button
                      onClick={() => handleLike(rev.id)}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-colors ${
                        rev.hasLiked
                          ? isDark
                            ? 'bg-[#56A867]/15 text-[#56A867] font-bold'
                            : 'bg-emerald-50 text-emerald-700 font-bold'
                          : isDark
                          ? 'hover:bg-[#1A1A24] text-[#808090]'
                          : 'hover:bg-slate-100 text-slate-500'
                      }`}
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                      <span>{rev.likes}</span>
                    </button>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        )}
      </div>

      {/* Modal: Add Review */}
      {showAddReview && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div
            className={`w-full max-w-md border rounded-2xl p-6 shadow-2xl space-y-4 ${
              isDark ? 'bg-[#121218] border-[#2B2B38] text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className={`flex items-center justify-between pb-2 border-b ${isDark ? 'border-[#20202A]' : 'border-slate-200'}`}>
              <h3 className="text-lg font-serif font-bold">
                {language === 'en' ? 'Share Your Review' : 'Compartir Valoración'}
              </h3>
              <button
                onClick={() => setShowAddReview(false)}
                className={`p-1 rounded-lg ${isDark ? 'text-neutral-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddReview} className="space-y-3 text-left">
              <div>
                <label className={`text-xs font-mono block mb-1 ${isDark ? 'text-[#A0A0B0]' : 'text-slate-600'}`}>
                  {language === 'en' ? 'Rating (Stars)' : 'Calificación (Estrellas)'}
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((st) => (
                    <button
                      type="button"
                      key={st}
                      onClick={() => setRating(st)}
                      className="p-1 hover:scale-110 transition-transform"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          st <= rating
                            ? isDark
                              ? 'text-[#56A867] fill-[#56A867]'
                              : 'text-amber-500 fill-amber-500'
                            : isDark
                            ? 'text-[#404052]'
                            : 'text-slate-300'
                        }`}
                      />
                    </button>
                  ))}
                  <span className={`text-xs font-mono ml-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>{rating} / 5</span>
                </div>
              </div>

              <div>
                <label className={`text-xs font-mono block mb-1 ${isDark ? 'text-[#A0A0B0]' : 'text-slate-600'}`}>
                  {language === 'en' ? 'Title of your Review' : 'Título de tu Experiencia'}
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  placeholder={language === 'en' ? 'e.g. Unmatched biomechanical precision' : 'Ej. Precisión biomecánica inigualable'}
                  className={`w-full p-2.5 rounded-xl text-xs focus:outline-none transition-all ${
                    isDark
                      ? 'bg-[#1A1A24] border border-[#2B2B38] text-white focus:border-[#56A867]'
                      : 'bg-slate-50 border border-slate-300 text-slate-900 focus:border-emerald-600'
                  }`}
                />
              </div>

              <div>
                <label className={`text-xs font-mono block mb-1 ${isDark ? 'text-[#A0A0B0]' : 'text-slate-600'}`}>
                  {language === 'en' ? 'Detailed Feedback' : 'Comentario Detallado'}
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={4}
                  required
                  placeholder={
                    language === 'en'
                      ? 'Describe how the workouts and progression systems have impacted your strength and fitness goals...'
                      : 'Describe cómo las rutinas y entrenamientos han impactado tus marcas de fuerza y progreso físico...'
                  }
                  className={`w-full p-2.5 rounded-xl text-xs focus:outline-none transition-all ${
                    isDark
                      ? 'bg-[#1A1A24] border border-[#2B2B38] text-white focus:border-[#56A867]'
                      : 'bg-slate-50 border border-slate-300 text-slate-900 focus:border-emerald-600'
                  }`}
                />
              </div>

              <div className="pt-2 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowAddReview(false)}
                  className={`py-2 px-4 rounded-xl text-xs ${isDark ? 'bg-[#1A1A24] text-[#A0A0B0] hover:text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                >
                  {language === 'en' ? 'Cancel' : 'Cancelar'}
                </button>
                <button
                  type="submit"
                  className={`py-2 px-5 rounded-xl font-bold text-xs shadow-md transition-all ${
                    isDark
                      ? 'bg-[#56A867] hover:bg-[#64B875] text-black'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  }`}
                >
                  {language === 'en' ? 'Publish Review' : 'Publicar Reseña'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL: REGISTRO REQUERIDO PARA RESEÑAS
         ========================================== */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            className={`border rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl text-left ${
              isDark ? 'bg-[#14141E] border-[#2E2E3E] text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#56A867]/20 flex items-center justify-center text-[#56A867]">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold">
                    {language === 'en' ? 'Registration Required' : 'Registro Requerido'}
                  </h3>
                  <p className={`text-xs ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>
                    {language === 'en' ? 'Community of Athletes and Coaches' : 'Comunidad de Atletas y Entrenadores'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAuthModal(false)}
                className={`p-1.5 rounded-lg transition-colors ${
                  isDark ? 'hover:bg-neutral-800 text-neutral-400' : 'hover:bg-slate-100 text-slate-500'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className={`text-xs leading-relaxed ${isDark ? 'text-neutral-300' : 'text-slate-600'}`}>
              {language === 'en'
                ? 'To publish a review or comment and share your experience with the community, you must register on the platform or log in with your account.'
                : 'Para publicar una reseña o comentario y compartir tu experiencia con la comunidad, debes registrarte en la plataforma o iniciar sesión con tu cuenta.'}
            </p>

            <div className="space-y-2 pt-2">
              <button
                onClick={() => {
                  setShowAuthModal(false);
                  onNavigate('athlete-register');
                }}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-[#56A867] hover:bg-[#64B875] text-black transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer"
              >
                <span>{language === 'en' ? 'Create Athlete Account' : 'Crear Cuenta de Atleta'}</span>
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => {
                  setShowAuthModal(false);
                  onNavigate('athlete-login');
                }}
                className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold border transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  isDark
                    ? 'border-[#2A2A38] hover:bg-[#1C1C28] text-white'
                    : 'border-slate-300 hover:bg-slate-100 text-slate-800'
                }`}
              >
                <span>{language === 'en' ? 'Already have an account • Sign In' : 'Ya tengo cuenta • Iniciar Sesión'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
