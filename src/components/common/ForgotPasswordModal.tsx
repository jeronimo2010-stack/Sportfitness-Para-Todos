/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  KeyRound,
  Mail,
  ShieldCheck,
  Lock,
  ArrowRight,
  CheckCircle2,
  X,
  RefreshCw,
  Eye,
  EyeOff,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { localDatabase } from '../../db/localDatabase';
import { authService } from '../../services/authService';
import { SixDigitCodeInput } from './SixDigitCodeInput';

export const ForgotPasswordModal: React.FC = () => {
  const { isForgotPasswordOpen, closeForgotPassword, t, theme, language, navigateTo, setUser, user } = useApp();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState(['', '', '', '', '', '']);
  const [verificationToken, setVerificationToken] = useState<string | null>(null);
  const [codeNotification, setCodeNotification] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [timer, setTimer] = useState(45);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isForgotPasswordOpen) {
      setStep(1);
      setEmail('');
      setPin(['', '', '', '', '', '']);
      setVerificationToken(null);
      setCodeNotification(null);
      setNewPassword('');
      setConfirmPassword('');
      setError('');
    }
  }, [isForgotPasswordOpen]);

  useEffect(() => {
    let interval: any = null;
    if (step === 2 && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  if (!isForgotPasswordOpen) return null;

  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      setError(language === 'en' ? 'Please enter a valid email address' : 'Ingresa un correo electrónico válido');
      return;
    }
    setError('');
    setIsLoading(true);

    try {
      await authService.sendForgotPasswordCode(email.trim());
      setCodeNotification(
        language === 'en'
          ? `✉️ 6-digit recovery code sent to ${email.trim()}. Please check your inbox or spam folder.`
          : `✉️ Hemos enviado un código de recuperación de 6 dígitos a ${email.trim()}. Revisa tu bandeja de entrada o spam.`
      );
      setStep(2);
      setTimer(45);
      setPin(['', '', '', '', '', '']);
    } catch (err: any) {
      setError(err.message || 'Error al conectar con el servidor.');
      setStep(2);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setError('');
    setIsLoading(true);
    setPin(['', '', '', '', '', '']);
    try {
      const res = await authService.sendForgotPasswordCode(email.trim());
      if (res.success) {
        setCodeNotification(
          language === 'en'
            ? `✉️ New 6-digit recovery code sent to ${email.trim()}. Check your email.`
            : `✉️ Nuevo código de 6 dígitos enviado a ${email.trim()}. Revisa tu correo.`
        );
        setTimer(45);
      } else {
        setError(res.message || 'No se pudo reenviar el código.');
      }
    } catch (err: any) {
      setError(err.message || 'Error al reenviar código.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePinChange = (index: number, val: string) => {
    if (val.length > 1) val = val.slice(-1);
    const newPin = [...pin];
    newPin[index] = val;
    setPin(newPin);

    // Auto-focus next input
    if (val && index < 5) {
      const nextInput = document.getElementById(`pin-input-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullPin = pin.join('');
    if (fullPin.length !== 6) {
      setError(language === 'en' ? 'Please enter the 6 verification digits' : 'Por favor ingresa los 6 dígitos de verificación');
      return;
    }
    setError('');
    setIsLoading(true);

    try {
      const res = await authService.verifyForgotPasswordCode(email.trim(), fullPin);
      if (res.success) {
        setVerificationToken(res.verificationToken || null);
        setStep(3);
      } else {
        setError(
          res.message ||
            (language === 'en'
              ? 'The 6-digit code entered is incorrect or expired. Check your email.'
              : 'El código de 6 dígitos ingresado es incorrecto o ha expirado. Revisa tu correo.')
        );
      }
    } catch (err: any) {
      setError(err.message || 'Error al validar el código.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStep3Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setError(language === 'en' ? 'Password must be at least 6 characters' : 'La contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(language === 'en' ? 'Passwords do not match' : 'Las contraseñas no coinciden');
      return;
    }
    setError('');
    setIsLoading(true);

    try {
      const res = await authService.resetPassword(email.trim(), newPassword, verificationToken || undefined);
      if (res.success) {
        setStep(4);
      } else {
        setError(res.message || res.error || 'Error al actualizar contraseña.');
      }
    } catch (err: any) {
      setError(err.message || 'Error al restablecer contraseña.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinishAndLogin = () => {
    closeForgotPassword();
    setStep(1);
    const dbUser = email ? localDatabase.findUserByEmail(email) : undefined;
    if (dbUser) {
      setUser(dbUser);
      localDatabase.setActiveUserId(dbUser.id);
      navigateTo(dbUser.role === 'entrenador' ? 'trainer-overview' : 'athlete-dashboard');
    } else {
      setUser({
        ...user,
        email: email || user.email,
      });
      navigateTo('athlete-dashboard');
    }
  };

  const isDark = theme === 'dark';

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div
        className={`w-full max-w-lg rounded-2xl border shadow-2xl p-6 relative transition-all ${
          isDark
            ? 'bg-[#121218] border-[#2A2A38] text-[#E0E0E0]'
            : 'bg-white border-slate-200 text-slate-900 shadow-slate-300/50'
        }`}
      >
        {/* Close Button */}
        <button
          onClick={closeForgotPassword}
          className={`absolute top-4 right-4 p-2 rounded-xl transition-colors ${
            isDark ? 'hover:bg-[#1E1E28] text-neutral-400' : 'hover:bg-slate-100 text-slate-500'
          }`}
          aria-label={language === 'en' ? 'Close modal' : 'Cerrar modal'}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-6">
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold ${
              isDark
                ? 'bg-[#56A867]/15 text-[#56A867] border border-[#56A867]/30'
                : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
            }`}
          >
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-serif font-bold tracking-tight">
              {t('pwdRecoveryTitle')}
            </h2>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>
              {t('pwdRecoveryDesc')}
            </p>
          </div>
        </div>

        {/* Stepper Indicator */}
        <div className="flex items-center justify-between mb-6 px-1">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-mono font-bold transition-all ${
                  step === s
                    ? isDark
                      ? 'bg-[#56A867] text-black shadow-[0_0_12px_rgba(86,168,103,0.35)]'
                      : 'bg-emerald-600 text-white'
                    : step > s
                    ? isDark
                      ? 'bg-[#1E1E28] text-[#56A867] border border-[#56A867]/40'
                      : 'bg-emerald-100 text-emerald-700'
                    : isDark
                    ? 'bg-[#181820] text-neutral-500 border border-[#262634]'
                    : 'bg-slate-100 text-slate-400'
                }`}
              >
                {step > s ? '✓' : s}
              </div>
              {s < 4 && (
                <div
                  className={`w-8 sm:w-14 h-0.5 rounded ${
                    step > s
                      ? isDark
                        ? 'bg-[#56A867]'
                        : 'bg-emerald-500'
                      : isDark
                      ? 'bg-[#22222E]'
                      : 'bg-slate-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium flex items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* STEP 1: Enter Email */}
        {step === 1 && (
          <form onSubmit={handleStep1Submit} className="space-y-4">
            <div className="space-y-1.5 text-left">
              <label
                className={`text-xs font-mono font-medium flex items-center gap-1.5 ${
                  isDark ? 'text-neutral-300' : 'text-slate-700'
                }`}
              >
                <Mail className={`w-4 h-4 ${isDark ? 'text-[#56A867]' : 'text-emerald-600'}`} />
                <span>{t('pwdEmailLabel')}</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('pwdEmailPlaceholder')}
                className={`w-full px-4 py-3 rounded-xl text-sm focus:outline-none transition-all ${
                  isDark
                    ? 'bg-[#161620] border border-[#282836] text-white focus:border-[#56A867]'
                    : 'bg-slate-50 border border-slate-200 text-slate-900 focus:border-emerald-500'
                }`}
              />
              <p className={`text-[11px] ${isDark ? 'text-neutral-500' : 'text-slate-400'}`}>
                {language === 'en'
                  ? 'We will generate and send a unique 6-digit verification code to your email.'
                  : 'Te enviaremos un código de seguridad de 6 dígitos para verificar tu identidad.'}
              </p>
            </div>

            <div className="pt-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeForgotPassword}
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
                <span>{isLoading ? t('loading') : t('pwdSendCode')}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        )}

        {/* STEP 2: PIN Code Entry */}
        {step === 2 && (
          <form onSubmit={handleStep2Submit} className="space-y-4">
            <div className="text-left space-y-2">
              {/* Simulated Inbox / Email dispatch notification */}
              {codeNotification && (
                <div
                  className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 transition-all animate-fadeIn ${
                    isDark
                      ? 'bg-emerald-950/40 border-[#56A867]/40 text-[#56A867]'
                      : 'bg-emerald-50 border-emerald-300 text-emerald-800'
                  }`}
                >
                  <Mail className="w-4 h-4 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <p className="font-semibold">{language === 'en' ? 'Security Code Sent' : 'Código de Seguridad Enviado'}</p>
                    <p className="text-[11px] font-mono opacity-90">
                      {language === 'en'
                        ? `✉️ 6-digit recovery code sent to ${email.trim()}. Please check your inbox or spam folder.`
                        : `✉️ Hemos enviado un código de recuperación de 6 dígitos a ${email.trim()}. Revisa tu bandeja de entrada o spam.`}
                    </p>
                  </div>
                </div>
              )}

              <p className={`text-xs ${isDark ? 'text-neutral-300' : 'text-slate-600'}`}>
                {language === 'en'
                  ? `Enter the unique 6-digit code sent to ${email} to verify your identity:`
                  : `Digita el código único de 6 dígitos enviado a ${email} para verificar tu identidad:`}
              </p>

              {/* 6 Digit Box Inputs */}
              <SixDigitCodeInput
                value={pin.join('')}
                onChange={(val) => {
                  const arr = Array.from({ length: 6 }, (_, i) => val[i] || '');
                  setPin(arr);
                }}
                disabled={isLoading}
                isDark={isDark}
              />

              {/* Timer and Resend option */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs pt-1">
                <span className={isDark ? 'text-neutral-400 font-mono' : 'text-slate-500 font-mono'}>
                  {timer > 0 ? (
                    `⏱️ ${t('pwdResendPin')} ${timer} ${t('pwdSeconds')}`
                  ) : (
                    <span className="text-emerald-500 font-semibold">{language === 'en' ? 'Code expired' : 'Código expirado'}</span>
                  )}
                </span>

                <button
                  type="button"
                  disabled={timer > 0}
                  onClick={handleResendCode}
                  className={`flex items-center gap-1 font-medium transition-colors cursor-pointer ${
                    timer === 0
                      ? isDark
                        ? 'text-[#56A867] hover:underline'
                        : 'text-emerald-600 hover:underline'
                      : 'text-neutral-600 cursor-not-allowed'
                  }`}
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>{language === 'en' ? 'Resend code' : 'Reenviar código'}</span>
                </button>
              </div>
            </div>

            <div className="pt-2 flex justify-between items-center gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className={`px-4 py-2.5 rounded-xl text-xs font-medium transition-colors ${
                  isDark ? 'bg-[#181822] hover:bg-[#222230] text-neutral-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {t('back')}
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
                <span>{isLoading ? t('loading') : t('confirm')}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: Enter New Password */}
        {step === 3 && (
          <form onSubmit={handleStep3Submit} className="space-y-4 text-left">
            <div className="space-y-1.5">
              <label
                className={`text-xs font-mono font-medium flex items-center gap-1.5 ${
                  isDark ? 'text-neutral-300' : 'text-slate-700'
                }`}
              >
                <Lock className={`w-4 h-4 ${isDark ? 'text-[#56A867]' : 'text-emerald-600'}`} />
                <span>{t('pwdNewPasswordLabel')}</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder={language === 'en' ? 'Minimum 6 characters' : 'Mínimo 6 caracteres'}
                  className={`w-full px-4 py-3 pr-10 rounded-xl text-sm focus:outline-none transition-all ${
                    isDark
                      ? 'bg-[#161620] border border-[#282836] text-white focus:border-[#56A867]'
                      : 'bg-slate-50 border border-slate-200 text-slate-900 focus:border-emerald-500'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label
                className={`text-xs font-mono font-medium flex items-center gap-1.5 ${
                  isDark ? 'text-neutral-300' : 'text-slate-700'
                }`}
              >
                <ShieldCheck className={`w-4 h-4 ${isDark ? 'text-[#56A867]' : 'text-emerald-600'}`} />
                <span>{t('pwdConfirmPasswordLabel')}</span>
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={language === 'en' ? 'Repeat your new password' : 'Repite tu nueva contraseña'}
                className={`w-full px-4 py-3 rounded-xl text-sm focus:outline-none transition-all ${
                  isDark
                    ? 'bg-[#161620] border border-[#282836] text-white focus:border-[#56A867]'
                    : 'bg-slate-50 border border-slate-200 text-slate-900 focus:border-emerald-500'
                }`}
              />
            </div>

            <div className="pt-2 flex justify-end gap-3">
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 uppercase tracking-wider ${
                  isDark
                    ? 'bg-[#56A867] hover:bg-[#64B875] text-black shadow-[0_0_15px_rgba(86,168,103,0.25)]'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md'
                }`}
              >
                <span>{isLoading ? t('loading') : t('pwdUpdateBtn')}</span>
                <CheckCircle2 className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* STEP 4: Success Confirmation */}
        {step === 4 && (
          <div className="text-center py-4 space-y-4">
            <div className="w-16 h-16 rounded-full bg-[#56A867]/20 text-[#56A867] border border-[#56A867]/40 flex items-center justify-center mx-auto scale-110 animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-lg font-serif font-bold">{t('pwdStep4Title')}</h3>
              <p className={`text-xs mt-1 max-w-sm mx-auto ${isDark ? 'text-neutral-400' : 'text-slate-600'}`}>
                {t('pwdSuccessMsg')}
              </p>
            </div>

            <div className="pt-3">
              <button
                type="button"
                onClick={handleFinishAndLogin}
                className={`w-full py-3.5 px-6 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                  isDark
                    ? 'bg-[#56A867] hover:bg-[#64B875] text-black shadow-[0_0_20px_rgba(86,168,103,0.3)]'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>{t('pwdDirectLogin')}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
