/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Bell, ShieldCheck, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface NotificationPromptModalProps {
  isOpen: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

export const NotificationPromptModal: React.FC<NotificationPromptModalProps> = ({
  isOpen,
  onAccept,
  onDecline,
}) => {
  const { theme, t } = useApp();
  const isDark = theme === 'dark';

  if (!isOpen) return null;

  return (
    <div
      id="notification-permission-overlay"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="notif-modal-title"
    >
      <div
        id="notification-permission-card"
        className={`w-full max-w-sm sm:max-w-md rounded-2xl p-6 sm:p-7 shadow-2xl border relative text-center transition-all ${
          isDark
            ? 'bg-[#14141C] border-[#2B2B3D] text-white shadow-black/80'
            : 'bg-white border-slate-200 text-slate-900 shadow-slate-300'
        }`}
      >
        {/* Close icon button (acts as decline) */}
        <button
          id="btn-close-notif-modal"
          onClick={onDecline}
          className="absolute top-4 right-4 p-1.5 rounded-lg opacity-60 hover:opacity-100 hover:bg-neutral-500/10 transition-colors"
          aria-label={t('notifications.closeAria')}
        >
          <X className="w-4 h-4" />
        </button>

        {/* Glowing Bell Icon */}
        <div className="w-14 h-14 rounded-2xl bg-[#56A867]/15 border border-[#56A867]/30 flex items-center justify-center mx-auto mb-4 text-[#56A867]">
          <Bell className="w-7 h-7 animate-bounce" style={{ animationDuration: '2s' }} />
        </div>

        {/* Small Tag */}
        <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-[#56A867]/10 text-[#56A867] mb-2">
          {t('notifications.tag')}
        </span>

        {/* Title */}
        <h3
          id="notif-modal-title"
          className="text-lg sm:text-xl font-serif font-bold tracking-tight mb-2"
        >
          {t('notifications.title')}
        </h3>

        {/* Description */}
        <p className={`text-xs sm:text-sm leading-relaxed mb-6 ${isDark ? 'text-[#9E9EB2]' : 'text-slate-600'}`}>
          {t('notifications.desc')}
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5">
          <button
            id="btn-accept-notifications"
            onClick={onAccept}
            className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-[#56A867] hover:bg-[#9eff1a] text-black font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-[#56A867]/20 flex items-center justify-center gap-2"
          >
            <Bell className="w-4 h-4" />
            <span>{t('notifications.acceptBtn')}</span>
          </button>

          <button
            id="btn-decline-notifications"
            onClick={onDecline}
            className={`w-full sm:w-auto py-3 px-5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-colors border ${
              isDark
                ? 'bg-[#1C1C26] hover:bg-[#252533] text-neutral-300 border-[#2D2D3E]'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
            }`}
          >
            {t('notifications.declineBtn')}
          </button>
        </div>

        {/* Privacy Note */}
        <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] opacity-60">
          <ShieldCheck className="w-3.5 h-3.5 text-[#56A867]" />
          <span>{t('notifications.privacyNote')}</span>
        </div>
      </div>
    </div>
  );
};
