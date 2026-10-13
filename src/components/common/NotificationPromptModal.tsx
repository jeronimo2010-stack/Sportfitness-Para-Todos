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
  const { language, theme } = useApp();
  const isDark = theme === 'dark';

  if (!isOpen) return null;

  const content = {
    es: {
      tag: 'Aviso del Sistema',
      title: '¿Deseas activar las notificaciones?',
      desc: 'Recibe alertas sobre tus entrenamientos programados, monitoreo de fatiga biomecánica (TSB) y seguimiento de tu racha sin saturar tu dispositivo.',
      acceptBtn: 'Activar Notificaciones',
      declineBtn: 'Ahora no',
      privacyNote: 'Puedes cambiar esta preferencia en cualquier momento desde Configuración.',
    },
    en: {
      tag: 'System Notice',
      title: 'Enable workout notifications?',
      desc: 'Receive timely workout reminders, biomechanical fatigue alerts (TSB), and streak milestones without cluttering your device.',
      acceptBtn: 'Enable Notifications',
      declineBtn: 'Not now',
      privacyNote: 'You can modify this preference anytime in Settings.',
    },
    pt: {
      tag: 'Aviso do Sistema',
      title: 'Deseja ativar as notificações?',
      desc: 'Receba lembretes de treinos programados, alertas de fadiga biomecânica (TSB) e acompanhamento da sua sequência.',
      acceptBtn: 'Ativar Notificações',
      declineBtn: 'Agora não',
      privacyNote: 'Você pode alterar essa preferência a qualquer momento nas Configurações.',
    },
    fr: {
      tag: 'Avis Système',
      title: 'Activer les notifications ?',
      desc: 'Recevez des rappels pour vos séances programmées, des alertes de fatigue biomécanique (TSB) et le suivi de votre série.',
      acceptBtn: 'Activer les notifications',
      declineBtn: 'Pas maintenant',
      privacyNote: 'Vous pouvez modifier cette préférence à tout moment dans les Paramètres.',
    },
    de: {
      tag: 'Systemhinweis',
      title: 'Benachrichtigungen aktivieren?',
      desc: 'Erhalten Sie Erinnerungen an geplante Trainingseinheiten, biomechanische TSB-Warnungen und Serien-Updates.',
      acceptBtn: 'Benachrichtigungen aktivieren',
      declineBtn: 'Jetzt nicht',
      privacyNote: 'Sie können diese Einstellung jederzeit in den Einstellungen ändern.',
    },
    it: {
      tag: 'Avviso di Sistema',
      title: 'Attivare le notifiche?',
      desc: 'Ricevi promemoria di allenamento programmati, avvisi di fatica biomeccanica (TSB) e monitoraggio della tua serie.',
      acceptBtn: 'Attiva notifiche',
      declineBtn: 'Non ora',
      privacyNote: 'Puoi modificare questa preferenza in qualsiasi momento nelle Impostazioni.',
    },
  }[language] || {
    tag: 'Aviso del Sistema',
    title: '¿Deseas activar las notificaciones?',
    desc: 'Recibe alertas sobre tus entrenamientos programados, monitoreo de fatiga biomecánica (TSB) y seguimiento de tu racha.',
    acceptBtn: 'Activar Notificaciones',
    declineBtn: 'Ahora no',
    privacyNote: 'Puedes cambiar esta preferencia en cualquier momento desde Configuración.',
  };

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
          aria-label="Cerrar aviso"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Glowing Bell Icon */}
        <div className="w-14 h-14 rounded-2xl bg-[#56A867]/15 border border-[#56A867]/30 flex items-center justify-center mx-auto mb-4 text-[#56A867]">
          <Bell className="w-7 h-7 animate-bounce" style={{ animationDuration: '2s' }} />
        </div>

        {/* Small Tag */}
        <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-[#56A867]/10 text-[#56A867] mb-2">
          {content.tag}
        </span>

        {/* Title */}
        <h3
          id="notif-modal-title"
          className="text-lg sm:text-xl font-serif font-bold tracking-tight mb-2"
        >
          {content.title}
        </h3>

        {/* Description */}
        <p className={`text-xs sm:text-sm leading-relaxed mb-6 ${isDark ? 'text-[#9E9EB2]' : 'text-slate-600'}`}>
          {content.desc}
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5">
          <button
            id="btn-accept-notifications"
            onClick={onAccept}
            className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-[#56A867] hover:bg-[#9eff1a] text-black font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-[#56A867]/20 flex items-center justify-center gap-2"
          >
            <Bell className="w-4 h-4" />
            <span>{content.acceptBtn}</span>
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
            {content.declineBtn}
          </button>
        </div>

        {/* Privacy Note */}
        <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] opacity-60">
          <ShieldCheck className="w-3.5 h-3.5 text-[#56A867]" />
          <span>{content.privacyNote}</span>
        </div>
      </div>
    </div>
  );
};
