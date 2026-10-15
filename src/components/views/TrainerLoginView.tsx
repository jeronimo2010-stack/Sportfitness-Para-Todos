/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Eye,
  EyeOff,
  ArrowRight,
  Shield,
  Lock,
  Sun,
  Moon,
  Globe,
  AlertCircle,
  UserPlus,
  ArrowLeft,
  IdCard,
  Award,
  ShieldCheck,
} from 'lucide-react';
import { ScreenId, UserProfile } from '../../types';
import { EmblemLogo } from '../common/EmblemLogo';
import { useApp } from '../../context/AppContext';
import { authService } from '../../services/authService';
import { localDatabase } from '../../db/localDatabase';
import { ScrollReveal } from '../common/ScrollReveal';

interface TrainerLoginViewProps {
  onNavigate: (screen: ScreenId) => void;
  onLoginSuccess: (loggedInUser?: UserProfile) => void;
}

export const TrainerLoginView: React.FC<TrainerLoginViewProps> = ({
  onNavigate,
  onLoginSuccess,
}) => {
  const { theme, toggleTheme, language, setLanguage, t, openForgotPassword, setUser } = useApp();

  // STRICT PRIVACY DIRECTIVE: Clean, empty inputs without prefilled coach credentials or listing chips
  const [trainerId, setTrainerId] = useState('');
  const [trainerCode, setTrainerCode] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanId = trainerId.trim();
    const cleanTrainerCode = trainerCode.trim().toUpperCase();

    if (!cleanId) {
      setErrorMessage(
        language === 'es'
          ? 'Por favor ingresa tu credencial, correo o número de documento de entrenador.'
          : 'Please enter your trainer credentials, email or ID.'
      );
      return;
    }

    if (!cleanTrainerCode) {
      setErrorMessage(
        language === 'es'
          ? 'Por favor ingresa tu Número de Identificación de Entrenador (Ej: ENT-XXXXX).'
          : 'Please enter your Trainer Identification Number (e.g. ENT-XXXXX).'
      );
      return;
    }

    if (!password) {
      setErrorMessage(
        language === 'es'
          ? 'Por favor ingresa tu contraseña.'
          : 'Please enter your password.'
      );
      return;
    }

    setLoading(true);

    try {
      // 1. Proceso de autenticación de entrenador
      const res = await authService.login(cleanId, password, cleanTrainerCode);

      if (res.success && res.user) {
        // 2. Persistir sesión y token en localStorage y sessionStorage
        const token = res.token || `sf_token_${res.user.id}_${Date.now()}`;
        try {
          localStorage.setItem('sportfitness_session_token', token);
          sessionStorage.setItem('sportfitness_session_token', token);
        } catch {}

        // 3. Registrar ID activo y sincronizar usuario en base de datos local
        localDatabase.setActiveUserId(res.user.id);
        localDatabase.saveUser(res.user);

        // 4. Actualizar estado global en el AppContext
        setUser(res.user);

        // 5. Redirección inmediata al panel del entrenador
        onLoginSuccess(res.user);
        onNavigate('trainer-overview');
      } else {
        // Manejo descriptivo de errores de credenciales
        if (res.error === 'Usuario no registrado') {
          setErrorMessage(
            language === 'es'
              ? 'Usuario no registrado. No existe un entrenador registrado con estas credenciales. Debes registrarte previamente.'
              : 'Unregistered user. No trainer exists with these credentials.'
          );
        } else if (res.error === 'Contraseña incorrecta') {
          setErrorMessage(
            language === 'es'
              ? 'Contraseña incorrecta. Por favor verifica tus credenciales o recupera tu contraseña.'
              : 'Incorrect password. Please verify your credentials or recover your password.'
          );
        } else if (res.error === 'Código de entrenador requerido' || res.error === 'Código de entrenador inválido') {
          setErrorMessage(
            res.message ||
              (language === 'es'
                ? 'El Número de Identificación de Entrenador es incorrecto. Revisa el correo enviado al registrarte.'
                : 'The Trainer Identification Number is incorrect. Check the email sent upon registration.')
          );
        } else {
          setErrorMessage(res.message || res.error || 'Error al autenticar credenciales.');
        }
      }
    } catch {
      setErrorMessage(
        language === 'es'
          ? 'Error de conexión con la base de datos de entrenadores.'
          : 'Connection error with the trainer database.'
      );
    } finally {
      setLoading(false);
    }
  };

  const isDark = theme === 'dark';

  return (
    <div
      className={`h-screen max-h-screen overflow-hidden flex flex-col lg:flex-row transition-colors ${
        isDark ? 'bg-[#0B0C10] text-[#E0E0E0]' : 'bg-[#F8F9FA] text-[#1E293B]'
      }`}
    >
      {/* Left Visual Column */}
      <div
        className={`hidden lg:flex lg:w-1/2 relative border-r flex-col justify-between p-6 lg:p-10 overflow-hidden h-full min-h-0 ${
          isDark
            ? 'bg-[#101015] border-[#22222C]'
            : 'bg-gradient-to-br from-slate-900 to-slate-800 text-white border-slate-700'
        }`}
      >
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20 mix-blend-luminosity scale-105"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=1200&auto=format&fit=crop&q=80')`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#56A867]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Brand Header */}
        <div className="relative z-10 flex items-center justify-between">
          <button
            onClick={() => onNavigate('landing')}
            className="flex items-center gap-3 group focus:outline-none cursor-pointer"
          >
            <EmblemLogo size="md" />
            <div className="flex flex-col text-left">
              <span className="font-serif font-bold text-white text-lg group-hover:text-[#56A867] transition-colors">
                Sportfitness
              </span>
              <span className="text-[9px] tracking-[0.25em] text-[#56A867] font-mono font-semibold uppercase">
                Staff & Coach Portal
              </span>
            </div>
          </button>

          <button
            onClick={() => {
              if (window.history.length > 1) {
                window.history.back();
              } else {
                onNavigate('landing');
              }
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-mono transition-colors border border-white/20 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{language === 'en' ? 'Back to Home' : 'Volver al Inicio'}</span>
          </button>
        </div>

        {/* Center Motivational Info */}
        <div className="relative z-10 max-w-md my-auto py-4 text-left space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-[10px] font-mono text-cyan-400">
            <Award className="w-3.5 h-3.5" />
            <span>{language === 'en' ? 'Prescription & Applied Physiology Panel' : 'Panel de Prescripción y Fisiología Aplicada'}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-tight leading-snug">
            {language === 'en'
              ? 'Advanced Athlete, Load, and Biomechanics Management.'
              : 'Gestión Avanzada de Atletas, Cargas y Biomecánica.'}
          </h2>
          <p className="text-xs text-neutral-300 leading-relaxed font-light">
            {language === 'en'
              ? 'Monitor athlete cumulative load in real time, schedule progressive overload microcycles, and analyze neural fatigue and performance peaks.'
              : 'Supervisa en tiempo real la carga acumulada de tus atletas, programa microciclos de sobrecarga y analiza fatiga neural y rendimiento.'}
          </p>
        </div>

        {/* Bottom Security Badge */}
        <div className="relative z-10 flex items-center justify-between text-xs text-neutral-400 pt-3 border-t border-white/10">
          <span className="font-mono text-[10px]">{language === 'en' ? 'Restricted Coach Access' : 'Acceso Restringido a Entrenadores'}</span>
          <span className="font-mono text-[10px] text-cyan-400">{language === 'en' ? 'Encrypted Credentials' : 'Credenciales Encriptadas'}</span>
        </div>
      </div>

      {/* Right Form Column - Strictly fits in screen without scrolling */}
      <div className="w-full lg:w-1/2 flex flex-col justify-between p-4 sm:p-6 lg:p-8 max-w-xl mx-auto h-full overflow-hidden min-h-0">
        {/* Top Navigation */}
        <div className="flex items-center justify-between pb-2 shrink-0">
          <button
            onClick={() => {
              if (window.history.length > 1) {
                window.history.back();
              } else {
                onNavigate('landing');
              }
            }}
            className={`inline-flex items-center gap-1.5 text-xs font-mono transition-colors cursor-pointer ${
              isDark ? 'text-neutral-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{language === 'en' ? 'Back to Home' : 'Regresar al Inicio'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              title={isDark ? t('themeLight') : t('themeDark')}
              className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                isDark
                  ? 'bg-[#161620] border-[#282836] text-neutral-300 hover:text-white'
                  : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {isDark ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-slate-700" />}
            </button>

            <button
              onClick={() => setLanguage(language === 'es' ? 'en' : 'es')}
              className={`px-2 py-1 rounded-lg border text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                isDark
                  ? 'bg-[#161620] border-[#282836] text-neutral-300 hover:text-white'
                  : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
              <span className="uppercase">{language}</span>
            </button>
          </div>
        </div>

        {/* Login Body */}
        <div className="my-auto py-1 space-y-3 sm:space-y-4 shrink-0">
          <div className="text-left space-y-0.5">
            <span
              className={`text-[11px] font-mono uppercase tracking-widest font-semibold ${
                isDark ? 'text-cyan-400' : 'text-blue-600'
              }`}
            >
              {language === 'en' ? 'Coach Portal Access' : 'Acceso Entrenadores'}
            </span>
            <h3
              className={`text-2xl sm:text-3xl font-serif font-bold tracking-tight ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}
            >
              {language === 'en' ? 'Coach Sign In' : 'Iniciar Sesión Coach'}
            </h3>
            <p className={`text-xs ${isDark ? 'text-neutral-400' : 'text-slate-600'}`}>
              {language === 'en'
                ? 'Enter your institutional email, license ID, or authorized coach number.'
                : 'Introduce tu correo electrónico, cédula o código de entrenador autorizado.'}
            </p>
          </div>

          {/* Explicit Error Alert */}
          {errorMessage && (
            <div
              className={`p-3 rounded-xl border text-left text-xs transition-all space-y-1.5 ${
                isDark
                  ? 'bg-rose-950/40 border-rose-500/50 text-rose-200'
                  : 'bg-rose-50 border-rose-300 text-rose-800'
              }`}
            >
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div className="flex-1 font-medium">{errorMessage}</div>
              </div>

              {(errorMessage.includes('Usuario no registrado') || errorMessage.includes('Unregistered user')) && (
                <div className="pt-1.5 border-t border-rose-500/20 flex items-center justify-between">
                  <span className="text-[10px] opacity-80">
                    {language === 'en' ? 'Want to register as a certified coach?' : '¿Deseas darte de alta como entrenador?'}
                  </span>
                  <button
                    type="button"
                    onClick={() => onNavigate('trainer-register')}
                    className="px-2.5 py-0.5 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-black font-bold text-[11px] font-mono flex items-center gap-1 transition-all"
                  >
                    <UserPlus className="w-3 h-3" />
                    <span>{language === 'en' ? 'Coach Registration' : 'Registro de Coach'}</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Clean Form */}
          <form onSubmit={handleSubmit} method="post" action="#" autoComplete="on" className="space-y-2.5">
            <div className="space-y-1 text-left">
              <label
                htmlFor="trainer-identifier"
                className={`text-xs font-mono flex items-center gap-1.5 ${
                  isDark ? 'text-[#B0B0C0]' : 'text-slate-700'
                }`}
              >
                <IdCard className={`w-3.5 h-3.5 ${isDark ? 'text-cyan-400' : 'text-blue-600'}`} />
                <span>{language === 'en' ? 'License ID, Email, or ID Number' : 'Credencial, Correo o Documento de Identidad'}</span>
              </label>
              <input
                id="trainer-identifier"
                name="username"
                type="text"
                value={trainerId}
                onChange={(e) => {
                  setTrainerId(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                autoComplete="username"
                placeholder={language === 'en' ? 'License ID, email, or identity document' : 'Credencial, correo o documento de identidad'}
                required
                className={`w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none transition-all placeholder:text-neutral-500 ${
                  isDark
                    ? 'bg-[#131318] border border-[#242430] text-white focus:border-cyan-400'
                    : 'bg-slate-50 border border-slate-300 text-slate-900 focus:border-blue-600'
                }`}
              />
            </div>

            {/* Número de Identificación de Entrenador (Asignado al correo del entrenador) */}
            <div className="space-y-1 text-left">
              <label
                htmlFor="trainer-code"
                className={`text-xs font-mono flex items-center gap-1.5 ${
                  isDark ? 'text-[#B0B0C0]' : 'text-slate-700'
                }`}
              >
                <ShieldCheck className={`w-3.5 h-3.5 ${isDark ? 'text-cyan-400' : 'text-blue-600'}`} />
                <span>
                  {language === 'en'
                    ? 'Trainer Identification Number *'
                    : 'Número de Identificación de Entrenador *'}
                </span>
              </label>
              <input
                id="trainer-code"
                name="trainerCode"
                type="text"
                value={trainerCode}
                onChange={(e) => {
                  setTrainerCode(e.target.value.toUpperCase());
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder={language === 'en' ? 'Trainer ID number' : 'Número de identificación de entrenador'}
                required
                className={`w-full px-4 py-2.5 rounded-xl text-sm font-mono tracking-wider focus:outline-none transition-all placeholder:text-neutral-500 uppercase ${
                  isDark
                    ? 'bg-[#131318] border border-[#242430] text-cyan-300 focus:border-cyan-400'
                    : 'bg-slate-50 border border-slate-300 text-slate-900 focus:border-blue-600'
                }`}
              />
            </div>

            <div className="space-y-1 text-left">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="trainer-password"
                  className={`text-xs font-mono flex items-center gap-1.5 ${
                    isDark ? 'text-[#B0B0C0]' : 'text-slate-700'
                  }`}
                >
                  <Lock className={`w-3.5 h-3.5 ${isDark ? 'text-cyan-400' : 'text-blue-600'}`} />
                  <span>{language === 'en' ? 'Password' : 'Contraseña'}</span>
                </label>
                <button
                  type="button"
                  onClick={openForgotPassword}
                  className={`text-[11px] font-mono hover:underline font-semibold cursor-pointer ${
                    isDark ? 'text-cyan-400' : 'text-blue-600'
                  }`}
                >
                  {t('forgotPassword')}
                </button>
              </div>
              <div className="relative">
                <input
                  id="trainer-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  autoComplete="current-password"
                  aria-autocomplete="none"
                  data-lpignore="true"
                  data-form-type="other"
                  placeholder={language === 'en' ? 'Password' : 'Contraseña'}
                  required
                  className={`w-full px-4 py-2.5 pr-10 rounded-xl text-sm focus:outline-none transition-all placeholder:text-neutral-500 ${
                    isDark
                      ? 'bg-[#131318] border border-[#242430] text-white focus:border-cyan-400'
                      : 'bg-slate-50 border border-slate-300 text-slate-900 focus:border-blue-600'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer ${
                    isDark ? 'text-neutral-400 hover:text-white' : 'text-slate-400 hover:text-slate-800'
                  }`}
                  aria-label={showPassword ? (language === 'en' ? 'Hide password' : 'Ocultar contraseña') : (language === 'en' ? 'Show password' : 'Ver contraseña')}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-0.5">
              <label
                className={`flex items-center gap-2 cursor-pointer ${
                  isDark ? 'text-neutral-300' : 'text-slate-600'
                }`}
              >
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded text-cyan-500 focus:ring-0 w-3.5 h-3.5 accent-cyan-400"
                />
                <span className="text-[11px]">{language === 'en' ? 'Remember session' : 'Recordar sesión'}</span>
              </label>

              <button
                type="button"
                onClick={() => onNavigate('athlete-login')}
                className={`font-mono text-[11px] hover:underline cursor-pointer ${
                  isDark ? 'text-neutral-400 hover:text-white' : 'text-slate-600'
                }`}
              >
                {language === 'en' ? 'Are you an athlete? Enter here' : '¿Eres atleta? Accede aquí'}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full min-h-[44px] py-3 px-6 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 uppercase tracking-wider cursor-pointer focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none ${
                isDark
                  ? 'bg-cyan-400 hover:bg-cyan-300 text-black shadow-[0_0_20px_rgba(34,211,238,0.25)]'
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md'
              }`}
            >
              <span>{loading ? (language === 'en' ? 'Verifying Coach Database...' : 'Verificando en Base de Datos...') : (language === 'en' ? 'Sign In as Coach' : 'Entrar como Entrenador')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Redirect to trainer register */}
          <div className="pt-3 border-t border-neutral-800/50 flex items-center justify-between text-xs text-left">
            <span className={isDark ? 'text-neutral-400' : 'text-slate-600'}>
              {language === 'en' ? 'Do not have a coach account yet?' : '¿Aún no tienes registro de coach?'}
            </span>
            <button
              onClick={() => onNavigate('trainer-register')}
              className={`font-bold font-mono hover:underline flex items-center gap-1 cursor-pointer ${
                isDark ? 'text-cyan-400' : 'text-blue-600'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>{language === 'en' ? 'Register Coach' : 'Registrar Entrenador'}</span>
            </button>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center pt-2 shrink-0">
          <p className={`text-[10px] font-mono ${isDark ? 'text-neutral-500' : 'text-slate-500'}`}>
            {language === 'en'
              ? 'Data protection compliant with Privacy and Cybersecurity Standards.'
              : 'Protección de datos conforme a la Ley de Privacidad y Ciberseguridad.'}
          </p>
        </div>
      </div>
    </div>
  );
};
