/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
import { Lock, ArrowRight, UserCheck, Shield, X, Sparkles } from 'lucide-react';
import { ScreenId } from '../../types';
import { useApp } from '../../context/AppContext';

interface AuthRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (screen: ScreenId) => void;
  targetModuleName?: string;
}

export const AuthRequiredModal: React.FC<AuthRequiredModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
  targetModuleName = 'este módulo',
}) => {
  const { theme, language } = useApp();
  const isDark = theme === 'dark';
  const modalRef = useRef<HTMLDivElement>(null);
  const primaryButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Focus primary CTA on open
    const timer = setTimeout(() => {
      primaryButtonRef.current?.focus();
    }, 50);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-required-title"
    >
      <div
        ref={modalRef}
        className={`w-full max-w-lg rounded-2xl border p-6 sm:p-8 shadow-2xl transition-all text-left relative ${
          isDark
            ? 'bg-[#121218] border-[#2A2A38] text-white shadow-[0_0_50px_rgba(0,0,0,0.8)]'
            : 'bg-white border-slate-300 text-slate-950 shadow-xl'
        }`}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label={language === 'es' ? 'Cerrar ventana' : 'Close modal'}
          className={`absolute top-4 right-4 p-2 rounded-xl transition-colors ${
            isDark
              ? 'text-neutral-400 hover:text-white hover:bg-neutral-800'
              : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100'
          }`}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Security Badge */}
        <div className="flex items-center gap-2 mb-4">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
              isDark
                ? 'bg-[#181822] text-[#56A867] border-[#2A2A38]'
                : 'bg-emerald-50 text-emerald-700 border-emerald-300'
            }`}
          >
            <Lock className="w-5 h-5" />
          </div>
          <span
            className={`text-xs font-mono font-bold uppercase tracking-wider ${
              isDark ? 'text-[#56A867]' : 'text-emerald-700'
            }`}
          >
            {language === 'es' ? 'Acceso Exclusivo • Registro Obligatorio' : 'Access Required • Registration Mandatory'}
          </span>
        </div>

        {/* Title */}
        <h2
          id="auth-required-title"
          className={`text-xl sm:text-2xl font-serif font-bold tracking-tight mb-2 ${
            isDark ? 'text-white' : 'text-slate-950'
          }`}
        >
          {language === 'es' ? 'Inicia Sesión o Regístrate' : 'Please Sign In or Register'}
        </h2>

        {/* Subtitle / Description */}
        <p
          className={`text-sm leading-relaxed mb-6 ${
            isDark ? 'text-neutral-300 font-light' : 'text-slate-900 font-medium'
          }`}
        >
          {language === 'es'
            ? `Antes de ingresar a "${targetModuleName}", es obligatorio identificarte en la plataforma. Inicia sesión con tus credenciales o completa tu registro de atleta para calibrar tu carga, guardar tu progreso y consultar métricas.`
            : `Before entering "${targetModuleName}", you must authenticate. Log in with your credentials or complete your athlete registration to calibrate training load and save your progress.`}
        </p>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            ref={primaryButtonRef}
            type="button"
            onClick={() => {
              onClose();
              onNavigate('athlete-login');
            }}
            className={`w-full py-3.5 px-6 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 uppercase tracking-wider ${
              isDark
                ? 'bg-[#56A867] hover:bg-[#64B875] text-black shadow-[0_0_20px_rgba(86,168,103,0.3)]'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>{language === 'es' ? 'Iniciar Sesión' : 'Sign In'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              onNavigate('athlete-register');
            }}
            className={`w-full py-3.5 px-6 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 border uppercase tracking-wider ${
              isDark
                ? 'bg-[#181822] hover:bg-[#222230] text-white border-[#2E2E3E]'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-950 border-slate-300'
            }`}
          >
            <Sparkles className="w-4 h-4 text-emerald-500" />
            <span>{language === 'es' ? 'Registrarme' : 'Register'}</span>
          </button>
        </div>

        {/* Coach Link & Return */}
        <div className="mt-6 pt-4 border-t flex items-center justify-between text-xs font-mono border-neutral-200 dark:border-neutral-800">
          <button
            type="button"
            onClick={() => {
              onClose();
              onNavigate('trainer-login');
            }}
            className={`flex items-center gap-1 transition-colors ${
              isDark ? 'text-neutral-400 hover:text-[#56A867]' : 'text-slate-800 hover:text-emerald-700 font-semibold'
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-cyan-500" />
            <span>{language === 'es' ? 'Portal Entrenadores' : 'Coaches Portal'}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className={`transition-colors ${
              isDark ? 'text-neutral-500 hover:text-neutral-300' : 'text-slate-700 hover:text-slate-950 font-semibold'
            }`}
          >
            {language === 'es' ? 'Cancelar / Volver' : 'Cancel / Back'}
          </button>
        </div>
      </div>
    </div>
  );
};
