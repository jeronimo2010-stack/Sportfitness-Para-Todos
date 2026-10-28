/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Star, X, Sparkles, MessageSquare, ThumbsUp, HelpCircle, CheckCircle2 } from 'lucide-react';
import { localDatabase } from '../../db/localDatabase';
import { useApp } from '../../context/AppContext';

interface OneHourReviewModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  onReviewSubmitted?: () => void;
  currentUser?: any;
}

export const OneHourReviewModal: React.FC<OneHourReviewModalProps> = ({
  isOpen = false,
  onClose = () => {},
  onReviewSubmitted,
}) => {
  const { user } = useApp();
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [positiveComment, setPositiveComment] = useState('');
  const [improvementComment, setImprovementComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!positiveComment.trim()) return;

    localDatabase.addReview(
      user.name || 'Atleta Sportfitness',
      user.role === 'entrenador' ? 'Entrenador Certificado' : 'Atleta en Entrenamiento',
      rating,
      positiveComment,
      improvementComment || 'Excelente plataforma integral.'
    );

    setSubmitted(true);
    setTimeout(() => {
      if (onReviewSubmitted) onReviewSubmitted();
      onClose();
      setSubmitted(false);
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#12121A] border border-[#2B2B3D] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl text-left">
        {/* Header */}
        <div className="p-4 sm:px-6 py-3.5 border-b border-[#222230] flex items-center justify-between bg-[#161622]">
          <div className="flex items-center gap-2 text-xs font-mono text-[#56A867] uppercase font-bold tracking-wider">
            <Sparkles className="w-4 h-4" />
            <span>Valoración de Experiencia • 1 Hora de Uso</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-[#7E7E8E] hover:text-white hover:bg-[#20202E]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-5">
          {submitted ? (
            <div className="py-8 text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-[#56A867]/15 text-[#56A867] mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold font-serif text-white">¡Muchas Gracias por tu Reseña!</h3>
              <p className="text-xs text-[#9E9EA8] max-w-xs mx-auto">
                Tu opinión ya fue integrada al promedio general de estrellas para guiar a nuevos atletas y entrenadores.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <h3 className="text-lg font-bold font-serif text-white">
                  ¿Te ha gustado tu experiencia en Sportfitness?
                </h3>
                <p className="text-xs text-[#8E8E9E] mt-1">
                  Has completado sesiones en la plataforma. Tu calificación nos permite recalcular el promedio general en tiempo real.
                </p>
              </div>

              {/* Star Picker */}
              <div className="p-3.5 rounded-xl bg-[#171724] border border-[#252538] flex flex-col items-center justify-center gap-2">
                <span className="text-xs font-mono text-[#A0A0B0]">Selecciona de 1 a 5 estrellas:</span>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(star)}
                      className="p-1 transform transition-transform hover:scale-125 focus:outline-none"
                    >
                      <Star
                        className={`w-7 h-7 transition-colors ${
                          star <= (hoverRating || rating)
                            ? 'text-[#FFB800] fill-[#FFB800]'
                            : 'text-[#3E3E50]'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <span className="text-xs font-mono font-bold text-[#FFB800]">
                  {rating === 5 && '★★★★★ ¡Excelente (5/5)!'}
                  {rating === 4 && '★★★★☆ Muy Buena (4/5)'}
                  {rating === 3 && '★★★☆☆ Aceptable (3/5)'}
                  {rating === 2 && '★★☆☆☆ Regular (2/5)'}
                  {rating === 1 && '★☆☆☆☆ Requiere Mejoras (1/5)'}
                </span>
              </div>

              {/* Positive comment */}
              <div className="space-y-1">
                <label className="text-xs font-mono text-neutral-300 font-bold flex items-center gap-1.5">
                  <ThumbsUp className="w-3.5 h-3.5 text-[#56A867]" />
                  <span>¿Qué fue lo que más te gustó? (Comentario positivo)</span>
                </label>
                <textarea
                  required
                  rows={2}
                  value={positiveComment}
                  onChange={(e) => setPositiveComment(e.target.value)}
                  placeholder="Ej. Me encantaron los videos cortos, los materiales caseros y la racha con 1% de descuento diario..."
                  className="w-full bg-[#161622] border border-[#252538] focus:border-[#56A867] rounded-xl p-2.5 text-xs text-white placeholder-[#606070] focus:outline-none"
                />
              </div>

              {/* Improvement suggestion */}
              <div className="space-y-1">
                <label className="text-xs font-mono text-neutral-300 font-bold flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                  <span>¿Qué podemos mejorar para dar una mejor experiencia a nuevos usuarios?</span>
                </label>
                <textarea
                  rows={2}
                  value={improvementComment}
                  onChange={(e) => setImprovementComment(e.target.value)}
                  placeholder="Ej. Añadir más opciones de estiramientos o retos semanales..."
                  className="w-full bg-[#161622] border border-[#252538] focus:border-[#56A867] rounded-xl p-2.5 text-xs text-white placeholder-[#606070] focus:outline-none"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-[#1C1C28] hover:bg-[#252535] text-xs font-mono text-[#8E8E9E] transition-colors"
                >
                  Recordarme más tarde
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#56A867] hover:bg-[#64B875] text-black text-xs font-mono font-bold uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(86,168,103,0.25)]"
                >
                  Publicar Reseña
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
