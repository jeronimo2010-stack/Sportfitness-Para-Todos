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
  const { user, t } = useApp();
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
      user.name || t('common.userFallback'),
      user.role === 'entrenador' ? t('reviewModal.defaultCoachRole') : t('reviewModal.defaultAthleteRole'),
      rating,
      positiveComment,
      improvementComment || t('reviewModal.defaultImprovement')
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
            <span>{t('reviewModal.oneHourBadge')}</span>
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
              <h3 className="text-xl font-bold font-serif text-white">{t('reviewModal.thankYouTitle')}</h3>
              <p className="text-xs text-[#9E9EA8] max-w-xs mx-auto">
                {t('reviewModal.thankYouDesc')}
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <h3 className="text-lg font-bold font-serif text-white">
                  {t('reviewModal.questionTitle')}
                </h3>
                <p className="text-xs text-[#8E8E9E] mt-1">
                  {t('reviewModal.questionSubtitle')}
                </p>
              </div>

              {/* Star Picker */}
              <div className="p-3.5 rounded-xl bg-[#171724] border border-[#252538] flex flex-col items-center justify-center gap-2">
                <span className="text-xs font-mono text-[#A0A0B0]">{t('reviewModal.selectStars')}</span>
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
                  {rating === 5 && t('reviewModal.rating5')}
                  {rating === 4 && t('reviewModal.rating4')}
                  {rating === 3 && t('reviewModal.rating3')}
                  {rating === 2 && t('reviewModal.rating2')}
                  {rating === 1 && t('reviewModal.rating1')}
                </span>
              </div>

              {/* Positive comment */}
              <div className="space-y-1">
                <label className="text-xs font-mono text-neutral-300 font-bold flex items-center gap-1.5">
                  <ThumbsUp className="w-3.5 h-3.5 text-[#56A867]" />
                  <span>{t('reviewModal.positiveLabel')}</span>
                </label>
                <textarea
                  required
                  rows={2}
                  value={positiveComment}
                  onChange={(e) => setPositiveComment(e.target.value)}
                  placeholder={t('reviewModal.positivePlaceholder')}
                  className="w-full bg-[#161622] border border-[#252538] focus:border-[#56A867] rounded-xl p-2.5 text-xs text-white placeholder-[#606070] focus:outline-none"
                />
              </div>

              {/* Improvement suggestion */}
              <div className="space-y-1">
                <label className="text-xs font-mono text-neutral-300 font-bold flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                  <span>{t('reviewModal.improvementLabel')}</span>
                </label>
                <textarea
                  rows={2}
                  value={improvementComment}
                  onChange={(e) => setImprovementComment(e.target.value)}
                  placeholder={t('reviewModal.improvementPlaceholder')}
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
                  {t('reviewModal.remindLater')}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#56A867] hover:bg-[#64B875] text-black text-xs font-mono font-bold uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(86,168,103,0.25)]"
                >
                  {t('reviewModal.submitBtn')}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
