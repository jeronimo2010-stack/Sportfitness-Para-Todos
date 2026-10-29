/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  X,
  Flame,
  Award,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { localDatabase } from '../../db/localDatabase';

interface PlankPenanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const PlankPenanceModal: React.FC<PlankPenanceModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { user, setUser, t } = useApp();
  const [secondsLeft, setSecondsLeft] = useState(60);
  const [isActive, setIsActive] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isActive && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft((prev) => prev - 1);
      }, 1000);
    } else if (secondsLeft === 0 && !isCompleted) {
      setIsCompleted(true);
      setIsActive(false);
      // Mark penance resolved
      const updated = {
        ...user,
        penancePending: false,
        penanceCompleted: true,
      };
      setUser(updated);
      localDatabase.saveUser(updated);
      if (onSuccess) onSuccess();
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, secondsLeft, isCompleted, user, setUser, onSuccess]);

  if (!isOpen) return null;

  const percentDone = Math.round(((60 - secondsLeft) / 60) * 100);

  const handleReset = () => {
    setIsActive(false);
    setSecondsLeft(60);
    setIsCompleted(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn text-left">
      <div className="bg-[#12121A] border border-amber-500/40 rounded-2xl w-full max-w-lg overflow-hidden shadow-[0_0_40px_rgba(245,158,11,0.15)]">
        {/* Header */}
        <div className="p-4 sm:px-6 py-3.5 bg-gradient-to-r from-amber-500/20 to-red-500/10 border-b border-amber-500/30 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-5 h-5 text-amber-400 animate-pulse" />
            <div>
              <h3 className="text-sm font-bold text-white font-serif uppercase tracking-wider">
                {t('plankModal.title')}
              </h3>
              <p className="text-[10px] font-mono text-amber-300">
                {t('plankModal.subtitle')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-[#8E8E9E] hover:text-white hover:bg-[#20202E]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 text-center space-y-6">
          {!isCompleted ? (
            <>
              <div>
                <p className="text-xs text-[#9E9EA8] max-w-sm mx-auto">
                  {t('plankModal.desc')} <strong>{t('plankModal.discountTag')}</strong>{t('plankModal.descCont')}
                </p>
              </div>

              {/* Big Circular Countdown Display */}
              <div className="relative w-44 h-44 mx-auto flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    className="stroke-[#222230]"
                    strokeWidth="7"
                    fill="transparent"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    className="stroke-amber-400 transition-all duration-1000 ease-linear"
                    strokeWidth="7"
                    strokeDasharray={264}
                    strokeDashoffset={264 - (264 * percentDone) / 100}
                    strokeLinecap="round"
                    fill="transparent"
                  />
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-mono font-bold text-white tracking-tighter">
                    00:{secondsLeft < 10 ? `0${secondsLeft}` : secondsLeft}
                  </span>
                  <span className="text-[10px] font-mono text-amber-400 uppercase tracking-widest mt-0.5">
                    {isActive ? t('plankModal.inPosition') : t('plankModal.ready')}
                  </span>
                </div>
              </div>

              {/* Technique Cues */}
              <div className="p-3 bg-[#181824] rounded-xl border border-[#242436] text-left text-xs text-neutral-300 space-y-1">
                <div className="flex items-center gap-1.5 text-amber-400 font-bold font-mono text-[11px] uppercase">
                  <Flame className="w-3.5 h-3.5" />
                  <span>{t('plankModal.postureTitle')}</span>
                </div>
                <p className="text-[11px] text-[#A0A0B0]">
                  {t('plankModal.postureCues')}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => setIsActive(!isActive)}
                  className={`px-6 py-2.5 rounded-xl font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all shadow-lg ${
                    isActive
                      ? 'bg-amber-500 hover:bg-amber-400 text-black'
                      : 'bg-[#56A867] hover:bg-[#64B875] text-black shadow-[0_0_20px_rgba(86,168,103,0.3)]'
                  }`}
                >
                  {isActive ? (
                    <>
                      <Pause className="w-4 h-4 fill-current" />
                      <span>{t('plankModal.pause')}</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-current" />
                      <span>{secondsLeft === 60 ? t('plankModal.start') : t('plankModal.resume')}</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleReset}
                  className="p-2.5 rounded-xl bg-[#1C1C28] hover:bg-[#252535] text-neutral-300"
                  title={t('plankModal.resetTitle')}
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            /* Completed Penance State */
            <div className="py-4 space-y-4 animate-scaleUp">
              <div className="w-16 h-16 rounded-full bg-[#56A867]/15 border border-[#56A867]/40 text-[#56A867] mx-auto flex items-center justify-center">
                <Award className="w-9 h-9" />
              </div>
              <h3 className="text-xl font-bold font-serif text-white">
                {t('plankModal.completedTitle')}
              </h3>
              <p className="text-xs text-[#9E9EA8] max-w-sm mx-auto">
                {t('plankModal.completedDesc')} <strong>{t('plankModal.accumulatedDiscount')}</strong>.
              </p>

              <div className="pt-2">
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-xl bg-[#56A867] hover:bg-[#64B875] text-black font-mono text-xs font-bold uppercase tracking-wider shadow-[0_0_15px_rgba(86,168,103,0.3)]"
                >
                  {t('plankModal.continueToCalendar')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
