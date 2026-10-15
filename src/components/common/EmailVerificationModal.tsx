/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Mail, CheckCircle2, X, RefreshCw, ArrowRight, ShieldCheck } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { authService } from '../../services/authService';
import { localDatabase } from '../../db/localDatabase';
import { SixDigitCodeInput } from './SixDigitCodeInput';

interface EmailVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  email?: string;
  purpose?: 'login' | 'register_athlete' | 'register_trainer' | 'verification';
  onSuccess: (verifiedEmail: string, token?: string) => void;
}

export const EmailVerificationModal: React.FC<EmailVerificationModalProps> = ({
  isOpen,
  onClose,
  email: initialEmail = '',
  purpose = 'verification',
  onSuccess,
}) => {
  const { t, theme, language, setUser, navigateTo } = useApp();
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'request' | 'verify'>('request');
  const [timer, setTimer] = useState(60);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [codeNotification, setCodeNotification] = useState<string | null>(null);

  const isDark = theme === 'dark';

  useEffect(() => {
    if (isOpen) {
      setEmail(initialEmail);
      setCode('');
      setErrorMessage('');
      setCodeNotification(null);
      if (initialEmail && initialEmail.includes('@')) {
        // Automatically request code if email was prefilled
        handleSendCode(initialEmail);
      } else {
        setStep('request');
      }
    }
  }, [isOpen, initialEmail]);

  // Resend countdown timer
  useEffect(() => {
    let interval: any = null;
    if (step === 'verify' && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  if (!isOpen) return null;

  const handleSendCode = async (targetEmail: string) => {
    const cleanEmail = targetEmail.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMessage(
        language === 'en'
          ? 'Please enter a valid email address'
          : 'Por favor ingresa un correo electrónico válido'
      );
      return;
    }

    setErrorMessage('');
    setIsLoading(true);

    try {
      const res = await authService.sendVerificationCode(cleanEmail, purpose);
      if (res.success) {
        setCodeNotification(
          language === 'en'
            ? `✉️ 6-digit security code sent to ${cleanEmail}. Valid for 10 minutes.`
            : `✉️ Código de seguridad de 6 dígitos enviado a ${cleanEmail}. Válido por 10 minutos.`
        );
        setStep('verify');
        setTimer(60);
        setCode('');
      } else {
        setErrorMessage(res.error || res.message || 'No se pudo enviar el código.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al comunicarse con el servicio de correo.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (code.length !== 6) {
      setErrorMessage(
        language === 'en'
          ? 'Please enter the complete 6 digits'
          : 'Por favor ingresa los 6 dígitos completos'
      );
      return;
    }

    setErrorMessage('');
    setIsLoading(true);

    try {
      const res = await authService.verifyCode(email.trim(), code);
      if (res.success) {
        // If this verification is for login, authenticate the user directly
        if (purpose === 'login') {
          const user = localDatabase.findUserByEmail(email.trim());
          if (user) {
            localDatabase.setActiveUserId(user.id);
            setUser(user);
            onSuccess(email.trim(), res.verificationToken);
            onClose();
            navigateTo(user.role === 'entrenador' ? 'trainer-overview' : 'athlete-dashboard');
            return;
          }
        }
        onSuccess(email.trim(), res.verificationToken);
        onClose();
      } else {
        setErrorMessage(
          res.message ||
            (language === 'en'
              ? 'Invalid or expired 6-digit code. Check your email or request a new code.'
              : 'Código de 6 dígitos inválido o expirado. Revisa tu correo o solicita uno nuevo.')
        );
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al validar el código.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div
        className={`w-full max-w-md rounded-2xl border shadow-2xl p-6 relative transition-all ${
          isDark
            ? 'bg-[#121218] border-[#2A2A38] text-[#E0E0E0]'
            : 'bg-white border-slate-200 text-slate-900 shadow-slate-300/50'
        }`}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className={`absolute top-4 right-4 p-2 rounded-xl transition-colors ${
            isDark ? 'hover:bg-[#1E1E28] text-neutral-400' : 'hover:bg-slate-100 text-slate-500'
          }`}
          aria-label={language === 'en' ? 'Close' : 'Cerrar'}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5">
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold ${
              isDark
                ? 'bg-[#56A867]/15 text-[#56A867] border border-[#56A867]/30'
                : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
            }`}
          >
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="text-left">
            <h2 className="text-lg font-serif font-bold tracking-tight">
              {purpose === 'login'
                ? language === 'en' ? 'Login with 6-Digit Code' : 'Acceso Seguro con Código de 6 Dígitos'
                : language === 'en' ? 'Email Verification' : 'Verificación de Correo'}
            </h2>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>
              {language === 'en'
                ? 'Sent directly via SMTP / Nodemailer'
                : 'Enviado directamente a tu bandeja de entrada'}
            </p>
          </div>
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium flex items-center gap-2 text-left">
            <span>⚠️</span>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* STEP 1: Request Code (if email was not provided) */}
        {step === 'request' && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendCode(email);
            }}
            className="space-y-4 text-left"
          >
            <div className="space-y-1.5">
              <label
                className={`text-xs font-mono font-medium flex items-center gap-1.5 ${
                  isDark ? 'text-neutral-300' : 'text-slate-700'
                }`}
              >
                <Mail className={`w-4 h-4 ${isDark ? 'text-[#56A867]' : 'text-emerald-600'}`} />
                <span>{language === 'en' ? 'Registered Email' : 'Correo Electrónico'}</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ejemplo@sportfitness.com"
                className={`w-full px-4 py-3 rounded-xl text-sm focus:outline-none transition-all ${
                  isDark
                    ? 'bg-[#161620] border border-[#282836] text-white focus:border-[#56A867]'
                    : 'bg-slate-50 border border-slate-200 text-slate-900 focus:border-emerald-500'
                }`}
              />
              <p className={`text-[11px] ${isDark ? 'text-neutral-500' : 'text-slate-400'}`}>
                {language === 'en'
                  ? 'We will generate and send a 6-digit numeric code with 10-minute validity.'
                  : 'Generaremos y enviaremos un código de 6 dígitos con validez de 10 minutos.'}
              </p>
            </div>

            <div className="pt-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className={`px-4 py-2.5 rounded-xl text-xs font-medium transition-colors ${
                  isDark ? 'bg-[#181822] hover:bg-[#222230] text-neutral-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {t('cancel')}
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 uppercase tracking-wider ${
                  isDark
                    ? 'bg-[#56A867] hover:bg-[#64B875] text-black shadow-[0_0_15px_rgba(86,168,103,0.25)]'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md'
                }`}
              >
                <span>{isLoading ? t('loading') : (language === 'en' ? 'Send Code' : 'Enviar Código')}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        )}

        {/* STEP 2: Verify Code */}
        {step === 'verify' && (
          <form onSubmit={handleVerify} className="space-y-4 text-left">
            {codeNotification && (
              <div
                className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 transition-all ${
                  isDark
                    ? 'bg-emerald-950/40 border-[#56A867]/40 text-[#56A867]'
                    : 'bg-emerald-50 border-emerald-300 text-emerald-800'
                }`}
              >
                <Mail className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-semibold">
                    {language === 'en' ? '6-Digit Code Dispatched' : 'Código de 6 Dígitos Enviado'}
                  </p>
                  <p className="text-[11px] font-mono opacity-90">{codeNotification}</p>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className={`text-xs block text-center ${isDark ? 'text-neutral-300' : 'text-slate-600'}`}>
                {language === 'en'
                  ? `Enter the 6 digits sent to ${email}:`
                  : `Ingresa los 6 dígitos enviados a ${email}:`}
              </label>

              {/* 6 Individual Digits Input Component */}
              <SixDigitCodeInput
                value={code}
                onChange={setCode}
                onComplete={(completedCode) => {
                  setCode(completedCode);
                }}
                disabled={isLoading}
                isDark={isDark}
              />

              <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs pt-1">
                <span className={isDark ? 'text-neutral-400 font-mono text-[11px]' : 'text-slate-500 font-mono text-[11px]'}>
                  {timer > 0 ? (
                    `⏱️ ${language === 'en' ? 'Resend code in' : 'Reenviar código en'} ${timer}s`
                  ) : (
                    <span className="text-[#56A867] font-semibold">
                      {language === 'en' ? 'You can resend now' : 'Ya puedes solicitar un nuevo código'}
                    </span>
                  )}
                </span>

                <button
                  type="button"
                  disabled={timer > 0 || isLoading}
                  onClick={() => handleSendCode(email)}
                  className={`flex items-center gap-1 font-medium transition-colors ${
                    timer === 0 && !isLoading
                      ? isDark
                        ? 'text-[#56A867] hover:underline cursor-pointer'
                        : 'text-emerald-600 hover:underline cursor-pointer'
                      : 'text-neutral-500 cursor-not-allowed opacity-60'
                  }`}
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>{language === 'en' ? 'Resend Code' : 'Reenviar Código'}</span>
                </button>
              </div>
            </div>

            <div className="pt-3 flex justify-between items-center gap-3">
              <button
                type="button"
                onClick={() => setStep('request')}
                className={`px-4 py-2.5 rounded-xl text-xs font-medium transition-colors ${
                  isDark ? 'bg-[#181822] hover:bg-[#222230] text-neutral-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {language === 'en' ? 'Change Email' : 'Cambiar Correo'}
              </button>

              <button
                type="submit"
                disabled={isLoading || code.length !== 6}
                className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed ${
                  isDark
                    ? 'bg-[#56A867] hover:bg-[#64B875] text-black shadow-[0_0_15px_rgba(86,168,103,0.25)]'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{isLoading ? t('loading') : (language === 'en' ? 'Verify Code' : 'Verificar Código')}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
