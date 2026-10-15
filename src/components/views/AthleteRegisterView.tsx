/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  ArrowRight,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Globe,
  Phone,
  Activity,
  Ruler,
  Weight,
  Sparkles,
  CheckCircle2,
  Dumbbell,
  Shield,
  ChevronRight,
  Sun,
  Moon,
  Info,
  Flame,
  FileText,
  KeyRound,
  RotateCcw,
  AlertTriangle,
} from 'lucide-react';
import { ScreenId, DocumentType, UserProfile } from '../../types';
import { EmblemLogo } from '../common/EmblemLogo';
import { useApp } from '../../context/AppContext';
import { localDatabase } from '../../db/localDatabase';
import { authService } from '../../services/authService';
import { ScrollReveal } from '../common/ScrollReveal';
import { GoogleSignInButton } from '../common/GoogleSignInButton';
import { SixDigitCodeInput } from '../common/SixDigitCodeInput';
import {
  BodyType,
  ClothingSize,
  generateStarterExercise,
  calculateBmi,
} from '../../utils/starterExerciseGenerator';

interface AthleteRegisterViewProps {
  onNavigate: (screen: ScreenId) => void;
  onRegisterSuccess?: (newUser?: UserProfile) => void;
}

const COUNTRIES = [
  { code: 'CO', name: 'Colombia', phoneCode: '+57', flag: '🇨🇴' },
  { code: 'MX', name: 'México', phoneCode: '+52', flag: '🇲🇽' },
  { code: 'ES', name: 'España', phoneCode: '+34', flag: '🇪🇸' },
  { code: 'AR', name: 'Argentina', phoneCode: '+54', flag: '🇦🇷' },
  { code: 'CL', name: 'Chile', phoneCode: '+56', flag: '🇨🇱' },
  { code: 'PE', name: 'Perú', phoneCode: '+51', flag: '🇵🇪' },
  { code: 'US', name: 'Estados Unidos', phoneCode: '+1', flag: '🇺🇸' },
  { code: 'EC', name: 'Ecuador', phoneCode: '+593', flag: '🇪🇨' },
  { code: 'UY', name: 'Uruguay', phoneCode: '+598', flag: '🇺🇾' },
  { code: 'CR', name: 'Costa Rica', phoneCode: '+506', flag: '🇨🇷' },
];

export const AthleteRegisterView: React.FC<AthleteRegisterViewProps> = ({
  onNavigate,
  onRegisterSuccess,
}) => {
  const { theme, toggleTheme, language, setLanguage, t, setUser, user } = useApp();
  const isDark = theme === 'dark';

  // Read draft data if user refreshed page (↻)
  const savedDraft = useMemo(() => {
    try {
      const raw = sessionStorage.getItem('sportfitness_athlete_draft');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  // Step control synchronized with URL hash & browser history
  const getInitialStep = (): 1 | 2 | 3 => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash;
      if (hash.includes('step=3')) return 3;
      if (hash.includes('step=2')) return 2;
      if (window.history.state && window.history.state.step) {
        const s = Number(window.history.state.step);
        if (s === 1 || s === 2 || s === 3) return s as 1 | 2 | 3;
      }
    }
    return 1;
  };

  const [step, setStep] = useState<1 | 2 | 3>(getInitialStep);

  const changeStep = (newStep: 1 | 2 | 3, replace = false) => {
    setStep(newStep);
    const targetHash = newStep === 1 ? '#athlete-register' : `#athlete-register?step=${newStep}`;
    if (replace) {
      window.history.replaceState({ screen: 'athlete-register', step: newStep }, document.title, targetHash);
    } else {
      window.history.pushState({ screen: 'athlete-register', step: newStep }, document.title, targetHash);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const handleStepPopState = (e: PopStateEvent) => {
      if (e.state && e.state.screen === 'athlete-register') {
        const s = (e.state.step as 1 | 2 | 3) || 1;
        setStep(s);
      } else if (window.location.hash.startsWith('#athlete-register')) {
        const hash = window.location.hash;
        if (hash.includes('step=3')) setStep(3);
        else if (hash.includes('step=2')) setStep(2);
        else setStep(1);
      }
    };

    window.addEventListener('popstate', handleStepPopState);
    return () => window.removeEventListener('popstate', handleStepPopState);
  }, []);

  // Form states initialized completely empty without pre-filled values
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [documentType, setDocumentType] = useState<DocumentType>('Cédula de Ciudadanía (CC)');
  const [documentNumber, setDocumentNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Email 6-digit verification state
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [inputCode, setInputCode] = useState('');
  const [emailVerified, setEmailVerified] = useState(false);
  const [codeNotification, setCodeNotification] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState(60);

  // Verification resend countdown timer
  useEffect(() => {
    let interval: any = null;
    if (isVerifyingEmail && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isVerifyingEmail, resendTimer]);

  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]);
  const [phone, setPhone] = useState('');

  // Biometric & Physical pre-registration fields
  const [bodyType, setBodyType] = useState<BodyType | ''>('');
  const [heightCm, setHeightCm] = useState<number | ''>('');
  const [weightKg, setWeightKg] = useState<number | ''>('');
  const [clothingSize, setClothingSize] = useState<ClothingSize | ''>('');

  // Keep draft updated in sessionStorage so refreshing (↻) preserves user data
  useEffect(() => {
    try {
      sessionStorage.setItem(
        'sportfitness_athlete_draft',
        JSON.stringify({
          firstName,
          lastName,
          documentType,
          documentNumber,
          email,
          phone,
          bodyType,
          heightCm,
          weightKg,
          clothingSize,
          emailVerified,
        })
      );
    } catch {}
  }, [
    firstName,
    lastName,
    documentType,
    documentNumber,
    email,
    phone,
    bodyType,
    heightCm,
    weightKg,
    clothingSize,
    emailVerified,
  ]);

  const [agreeTerms, setAgreeTerms] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [duplicateAccountDoc, setDuplicateAccountDoc] = useState<string | null>(null);

  // Live BMI calculation
  const bmiInfo = useMemo(() => {
    if (!weightKg || !heightCm) {
      return {
        bmi: 0,
        category: language === 'en' ? 'Pending data' : 'Pendiente de datos',
      };
    }
    return calculateBmi(Number(weightKg), Number(heightCm), language as 'es' | 'en');
  }, [weightKg, heightCm, language]);

  // Recommended starter exercise
  const starterExercise = useMemo(() => {
    const bt = bodyType || 'Mesomorfo';
    const sz = clothingSize || 'M';
    const h = heightCm ? Number(heightCm) : 170;
    const w = weightKg ? Number(weightKg) : 70;
    return generateStarterExercise(bt, h, w, sz, 'atleta', language as 'es' | 'en');
  }, [bodyType, heightCm, weightKg, clothingSize, language]);

  const handleSendVerificationCode = async () => {
    setIsSendingCode(true);
    setErrorMessage('');
    try {
      await authService.sendVerificationCode(email.trim(), 'register_athlete');
      setIsVerifyingEmail(true);
      setInputCode('');
      setCodeNotification(
        language === 'es'
          ? `✉️ Hemos enviado un código de verificación de 6 dígitos a ${email}. Revisa tu bandeja de entrada o carpeta de spam e ingrésalo a continuación.`
          : `✉️ We sent a 6-digit verification code to ${email}. Please check your inbox or spam folder and enter it below.`
      );
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al despachar el código de verificación.');
      setIsVerifyingEmail(true);
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleStep1Next = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setDuplicateAccountDoc(null);

    if (!firstName.trim() || !lastName.trim()) {
      setErrorMessage(t('nameRequiredError'));
      return;
    }

    if (!documentNumber.trim()) {
      setErrorMessage(t('documentRequiredError'));
      return;
    }

    // Check if document already exists in localDatabase
    const existingUser = localDatabase.findUserByDocument(documentNumber.trim());
    if (existingUser) {
      setDuplicateAccountDoc(documentNumber.trim());
      setErrorMessage(
        language === 'es'
          ? `Ya existe una cuenta con este número de documento (${documentNumber.trim()}). Inicia sesión directamente.`
          : `An account already exists with this document number (${documentNumber.trim()}). Please log in.`
      );
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      setErrorMessage(t('emailRequiredError'));
      return;
    }

    if (password.length < 6) {
      setErrorMessage(t('passwordLengthError'));
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage(t('passwordMatchError'));
      return;
    }

    // Avance fluido directo al Paso 2 (Biometría y Contacto)
    setErrorMessage('');
    changeStep(2);
  };

  const handleVerifyEmailCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (inputCode.trim().length !== 6) {
      setErrorMessage(
        language === 'es'
          ? 'Por favor ingresa los 6 dígitos numéricos recibidos en tu correo.'
          : 'Please enter the 6 digits received in your email.'
      );
      return;
    }

    setIsSendingCode(true);
    try {
      const res = await authService.verifyCode(email.trim(), inputCode.trim());
      if (res.success) {
        setEmailVerified(true);
        setIsVerifyingEmail(false);
        setCodeNotification(null);
        changeStep(2);
      } else {
        setErrorMessage(
          res.message ||
            (language === 'es'
              ? 'El código de 6 dígitos ingresado es incorrecto o ha expirado. Por favor verifica tu correo.'
              : 'The 6-digit code entered is incorrect or expired. Please check your email.')
        );
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al validar el código.');
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleChangeEmail = () => {
    setIsVerifyingEmail(false);
    setEmailVerified(false);
    setInputCode('');
    setCodeNotification(null);
  };

  const handleAutofillCode = async () => {
    try {
      const hint = await authService.getVerificationHint(email.trim());
      if (hint && hint.length === 6) {
        setInputCode(hint);
        setErrorMessage('');
      } else {
        setErrorMessage(
          language === 'es'
            ? 'Aún no se ha generado un código o el servidor está procesando el envío.'
            : 'No code found yet. Please click Resend.'
        );
      }
    } catch {
      setErrorMessage('No se pudo autocompletar el código.');
    }
  };

  const handleStep2Complete = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (!phone.trim()) {
      setErrorMessage(
        language === 'es'
          ? 'Por favor ingresa tu número de teléfono.'
          : 'Please enter your phone number.'
      );
      return;
    }
    if (!bodyType) {
      setErrorMessage(
        language === 'es'
          ? 'Por favor selecciona tu tipo de cuerpo (somatotipo).'
          : 'Please select your body type (somatotype).'
      );
      return;
    }
    if (!heightCm || Number(heightCm) < 120 || Number(heightCm) > 240) {
      setErrorMessage(t('heightRangeError'));
      return;
    }
    if (!weightKg || Number(weightKg) < 35 || Number(weightKg) > 250) {
      setErrorMessage(t('weightRangeError'));
      return;
    }
    if (!clothingSize) {
      setErrorMessage(t('clothingSizeRequiredError'));
      return;
    }

    // Move to step 3 to present the personalized starting exercise!
    changeStep(3);
  };

  const handleFinalizeRegistration = async (targetScreen: ScreenId = 'athlete-dashboard') => {
    setLoading(true);
    setErrorMessage('');

    try {
      const fullPhone = `${selectedCountry.phoneCode} ${phone.trim()}`;
      const res = await authService.register({
        email: email.trim(),
        password,
        documentType,
        documentNumber: documentNumber.trim(),
        phone: fullPhone,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        role: 'atleta',
        weight: Number(weightKg),
        height: Number(heightCm),
        clothingSize: (clothingSize || 'M') as ClothingSize,
        bodyType: (bodyType || 'Mesomorfo') as BodyType,
      });

      if (res.success && res.user) {
        try {
          sessionStorage.removeItem('sportfitness_athlete_draft');
        } catch {}
        const enrichedUser: UserProfile = {
          ...res.user,
          starterExercise,
          country: selectedCountry.name,
          dailyKm: 0,
          dailySteps: 0,
          weeklyVolumePercent: 0,
          sessionsThisWeek: 0,
          streakDays: 0,
          streakDiscountPercent: 0,
        };

        localDatabase.saveUser(enrichedUser);
        setUser(enrichedUser);

        if (onRegisterSuccess) {
          onRegisterSuccess(enrichedUser);
        }
        onNavigate(targetScreen);
      } else {
        setErrorMessage(res.error || 'No se pudo completar el registro.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Error al conectar con Firebase y la base de datos para registrar al usuario.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`min-h-screen flex flex-col lg:flex-row transition-colors ${
        isDark ? 'bg-[#0B0C10] text-[#E0E0E0]' : 'bg-[#F8F9FA] text-[#1E293B]'
      }`}
    >
      {/* Left Visual Column */}
      <div
        className={`lg:w-5/12 relative border-b lg:border-b-0 lg:border-r flex flex-col justify-between p-6 sm:p-10 lg:p-14 overflow-hidden min-h-[360px] lg:min-h-screen ${
          isDark
            ? 'bg-[#101015] border-[#22222C]'
            : 'bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-white border-slate-700'
        }`}
      >
        <div
          className="absolute inset-0 bg-cover bg-center opacity-25 mix-blend-luminosity scale-105"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=1200&auto=format&fit=crop&q=80')`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#56A867]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header */}
        <div className="relative z-10 flex items-center justify-between">
          <button
            onClick={() => onNavigate('landing')}
            className="flex items-center gap-3 group focus:outline-none"
          >
            <EmblemLogo size="md" />
            <div className="flex flex-col text-left">
              <span className="font-serif font-bold text-white text-xl group-hover:text-[#56A867] transition-colors">
                Sportfitness
              </span>
              <span className="text-[10px] tracking-[0.25em] text-[#56A867] font-mono font-semibold uppercase">
                {language === 'en' ? 'Biometric Onboarding' : 'Registro Biométrico'}
              </span>
            </div>
          </button>
        </div>

        {/* Dynamic Left Preview according to step */}
        <div className="relative z-10 max-w-md my-auto py-6 text-left space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-[11px] font-mono text-[#56A867]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>
              {step === 1 && (language === 'en' ? 'STEP 1 • ACCOUNT & CREDENTIALS' : 'PASO 1 • CUENTA & ACCESO')}
              {step === 2 && (language === 'en' ? 'STEP 2 • BIOMETRICS & SOMATOTYPE' : 'PASO 2 • BIOMETRÍA & SOMATOTIPO')}
              {step === 3 && (language === 'en' ? 'STEP 3 • YOUR STARTER EXERCISE' : 'PASO 3 • TU EJERCICIO DE INICIO')}
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold text-white leading-tight">
            {language === 'en' ? (
              <>Every physique has a <br /><span className="text-[#56A867]">unique biomechanics.</span></>
            ) : (
              <>Cada cuerpo tiene una <br /><span className="text-[#56A867]">biomecánica única.</span></>
            )}
          </h2>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            {t('preRegisterSubtitle')}
          </p>

          {/* Quick Metrics preview card */}
          <div className="p-4 rounded-xl bg-black/40 border border-white/10 backdrop-blur-md space-y-2">
            <div className="flex items-center justify-between text-xs font-mono text-[#56A867]">
              <span className="flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5" />
                {language === 'en' ? 'Live Diagnostic' : 'Diagnóstico en Vivo'}
              </span>
              <span>{language === 'en' ? 'BMI' : 'IMC'}: {bmiInfo.bmi}</span>
            </div>
            <div className="grid grid-cols-3 gap-2 pt-1 text-[11px] text-slate-300 font-mono">
              <div className="bg-white/5 p-2 rounded-lg text-center">
                <div className="text-slate-400 text-[9px] uppercase">{language === 'en' ? 'Biotype' : 'Biotipo'}</div>
                <div className="font-bold text-white truncate">{bodyType || '-'}</div>
              </div>
              <div className="bg-white/5 p-2 rounded-lg text-center">
                <div className="text-slate-400 text-[9px] uppercase">{language === 'en' ? 'Height/Weight' : 'Estatura/Peso'}</div>
                <div className="font-bold text-white">
                  {heightCm ? `${heightCm}cm` : '-'} / {weightKg ? `${weightKg}kg` : '-'}
                </div>
              </div>
              <div className="bg-white/5 p-2 rounded-lg text-center">
                <div className="text-slate-400 text-[9px] uppercase">{t('clothingSizeLabel')}</div>
                <div className="font-bold text-[#56A867]">{clothingSize || '-'}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom indicator */}
        <div className="relative z-10 flex items-center justify-between text-xs font-mono text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#56A867] animate-pulse" />
            <span>{language === 'en' ? 'Biomechanical Engine Active' : 'Algoritmo Biomecánico Activo'}</span>
          </div>
          <span className="text-white/70">
            {language === 'en' ? `Step ${step} of 3` : `Paso ${step} de 3`}
          </span>
        </div>
      </div>

      {/* Right Column: Multi-Step Registration Form */}
      <div
        className={`lg:w-7/12 flex items-center justify-center p-6 sm:p-10 lg:p-12 transition-colors ${
          isDark ? 'bg-[#0B0C10]' : 'bg-white'
        }`}
      >
        <ScrollReveal direction="up" delay={0.08} duration={0.4} className="w-full max-w-xl">
          <div className="w-full max-w-xl space-y-6 text-left">
          {/* Top Bar Navigation & Controls */}
          <div className="flex items-center justify-between pb-2 border-b border-neutral-200 dark:border-neutral-800">
            <button
              onClick={() => {
                if (step > 1) {
                  if (window.history.length > 1) {
                    window.history.back();
                  } else {
                    changeStep(1);
                  }
                } else {
                  if (window.history.length > 1) {
                    window.history.back();
                  } else {
                    onNavigate('landing');
                  }
                }
              }}
              className={`text-xs transition-colors flex items-center gap-1 cursor-pointer ${
                isDark ? 'text-neutral-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              ← {step === 1 ? t('backToHomePortal') : t('previousStep')}
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={toggleTheme}
                title={isDark ? t('themeLight') : t('themeDark')}
                className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                  isDark
                    ? 'bg-[#161620] border-[#2A2A38] text-neutral-300'
                    : 'bg-slate-100 border-slate-200 text-slate-700'
                }`}
              >
                {isDark ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5" />}
              </button>

              <button
                onClick={() => setLanguage(language === 'es' ? 'en' : 'es')}
                className={`px-2 py-1 rounded-lg border text-[11px] font-mono font-bold uppercase transition-colors cursor-pointer ${
                  isDark
                    ? 'bg-[#161620] border-[#2A2A38] text-neutral-300'
                    : 'bg-slate-100 border-slate-200 text-slate-700'
                }`}
              >
                {language}
              </button>
            </div>
          </div>

          {/* Stepper Header Pills */}
          <div className="flex items-center gap-2">
            {[
              { num: 1, label: t('biometricStep1Title').split('•')[1]?.trim() || (language === 'en' ? 'Account & Credentials' : 'Identidad & Clave') },
              { num: 2, label: t('biometricStep2Title').split('•')[1]?.trim() || (language === 'en' ? 'Biometrics & Measurements' : 'Biometría & Medidas') },
              { num: 3, label: t('biometricStep3Title').split('•')[1]?.trim() || (language === 'en' ? 'Starter Exercise' : 'Ejercicio de Inicio') },
            ].map((s) => (
              <div
                key={s.num}
                className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-mono text-center border transition-all ${
                  step === s.num
                    ? isDark
                      ? 'bg-[#56A867]/15 border-[#56A867] text-[#56A867] font-bold'
                      : 'bg-emerald-50 border-emerald-600 text-emerald-700 font-bold'
                    : step > s.num
                    ? isDark
                      ? 'bg-[#14141A] border-neutral-700 text-neutral-400'
                      : 'bg-slate-100 border-slate-300 text-slate-600'
                    : isDark
                    ? 'bg-[#101015] border-neutral-800 text-neutral-600'
                    : 'bg-slate-50 border-slate-200 text-slate-400'
                }`}
              >
                <span className="hidden sm:inline">{s.num}. </span>
                {s.label}
              </div>
            ))}
          </div>

          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
              <Info className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* STEP 1: Datos Personales, Documento, Correo y Contraseña */}
          {step === 1 && !isVerifyingEmail && (
            <form onSubmit={handleStep1Next} className="space-y-4">
              <div>
                <h1 className={`text-2xl font-serif font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {language === 'en' ? 'Athlete Registration • Initial Details' : 'Registro de Atleta • Datos Iniciales'}
                </h1>
                <p className={`text-xs mt-1 ${isDark ? 'text-[#8E8E9E]' : 'text-slate-500'}`}>
                  {language === 'en'
                    ? 'Create your institutional username and password to begin your registration.'
                    : 'Crea tu usuario y contraseña institucional para comenzar tu registro.'}
                </p>
              </div>

              {/* Quick Google Registration */}
              <div className="space-y-3 pb-1">
                <GoogleSignInButton
                  role="atleta"
                  text={t('quickGoogleRegister')}
                  onSuccess={(googleUser) => {
                    setUser(googleUser);
                    if (onRegisterSuccess) {
                      onRegisterSuccess(googleUser);
                    }
                    onNavigate('athlete-dashboard');
                  }}
                  onError={(err) => setErrorMessage(err)}
                />

                <div className="relative flex items-center justify-center my-2">
                  <div className={`border-t w-full ${isDark ? 'border-neutral-800' : 'border-slate-200'}`} />
                  <span
                    className={`px-3 text-[11px] font-mono uppercase tracking-wider shrink-0 ${
                      isDark ? 'bg-[#0B0C10] text-neutral-500' : 'bg-white text-slate-400'
                    }`}
                  >
                    {t('orFillDetails')}
                  </span>
                  <div className={`border-t w-full ${isDark ? 'border-neutral-800' : 'border-slate-200'}`} />
                </div>
              </div>

              {/* Duplicate Document Alert if triggered */}
              {duplicateAccountDoc && (
                <div className="p-3.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-xs text-amber-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>
                      {language === 'en'
                        ? <>An account already exists with document <strong>{duplicateAccountDoc}</strong>.</>
                        : <>Ya existe una cuenta con el documento <strong>{duplicateAccountDoc}</strong>.</>}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onNavigate('athlete-login')}
                    className="px-3 py-1 rounded-lg bg-amber-500 text-black font-mono font-bold text-[11px] uppercase hover:bg-amber-400 shrink-0 cursor-pointer"
                  >
                    {t('login')}
                  </button>
                </div>
              )}

              {/* Nombre y Apellido */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className={`text-xs font-mono flex items-center gap-1.5 ${isDark ? 'text-[#B0B0C0]' : 'text-slate-700'}`}>
                    <User className={`w-3.5 h-3.5 ${isDark ? 'text-[#56A867]' : 'text-emerald-600'}`} />
                    <span>{t('firstNameLabel')} *</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder={t('firstNamePlaceholder')}
                    className={`w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none transition-all ${
                      isDark
                        ? 'bg-[#131318] border border-[#242430] text-white focus:border-[#56A867]'
                        : 'bg-slate-50 border border-slate-300 text-slate-900 focus:border-emerald-600'
                    }`}
                  />
                </div>

                <div className="space-y-1">
                  <label className={`text-xs font-mono flex items-center gap-1.5 ${isDark ? 'text-[#B0B0C0]' : 'text-slate-700'}`}>
                    <User className={`w-3.5 h-3.5 ${isDark ? 'text-[#56A867]' : 'text-emerald-600'}`} />
                    <span>{t('lastNameLabel')} *</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder={t('lastNamePlaceholder')}
                    className={`w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none transition-all ${
                      isDark
                        ? 'bg-[#131318] border border-[#242430] text-white focus:border-[#56A867]'
                        : 'bg-slate-50 border border-slate-300 text-slate-900 focus:border-emerald-600'
                    }`}
                  />
                </div>
              </div>

              {/* Tipo de Documento y Número de Documento */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className={`text-xs font-mono flex items-center gap-1.5 ${isDark ? 'text-[#B0B0C0]' : 'text-slate-700'}`}>
                    <FileText className={`w-3.5 h-3.5 ${isDark ? 'text-[#56A867]' : 'text-emerald-600'}`} />
                    <span>{t('docTypeLabel')} *</span>
                  </label>
                  <select
                    value={documentType}
                    onChange={(e) => setDocumentType(e.target.value as DocumentType)}
                    className={`w-full px-3 py-2.5 rounded-xl text-xs sm:text-sm focus:outline-none transition-all ${
                      isDark
                        ? 'bg-[#131318] border border-[#242430] text-white focus:border-[#56A867]'
                        : 'bg-slate-50 border border-slate-300 text-slate-900 focus:border-emerald-600'
                    }`}
                  >
                    <option value="Cédula de Ciudadanía (CC)">
                      {language === 'en' ? 'National ID Card (CC)' : 'Cédula de Ciudadanía (CC)'}
                    </option>
                    <option value="Tarjeta de Identidad (TI)">
                      {language === 'en' ? 'Youth Identity Card (TI)' : 'Tarjeta de Identidad (TI)'}
                    </option>
                    <option value="Permiso por Protección Temporal (PPT/PEP)">
                      {language === 'en' ? 'Temporary Protection Permit (PPT/PEP)' : 'Permiso por Protección Temporal (PPT/PEP)'}
                    </option>
                    <option value="Cédula de Extranjería / Pasaporte">
                      {language === 'en' ? 'Foreigner ID / Passport' : 'Cédula de Extranjería / Pasaporte'}
                    </option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className={`text-xs font-mono flex items-center gap-1.5 ${isDark ? 'text-[#B0B0C0]' : 'text-slate-700'}`}>
                    <FileText className={`w-3.5 h-3.5 ${isDark ? 'text-[#56A867]' : 'text-emerald-600'}`} />
                    <span>{t('docNumberLabel')} *</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={documentNumber}
                    onChange={(e) => {
                      setDocumentNumber(e.target.value);
                      if (duplicateAccountDoc) setDuplicateAccountDoc(null);
                    }}
                    placeholder={t('docNumberPlaceholder')}
                    className={`w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none transition-all ${
                      isDark
                        ? 'bg-[#131318] border border-[#242430] text-white focus:border-[#56A867]'
                        : 'bg-slate-50 border border-slate-300 text-slate-900 focus:border-emerald-600'
                    }`}
                  />
                </div>
              </div>

              {/* Correo Electrónico */}
              <div className="space-y-1">
                <label className={`text-xs font-mono flex items-center gap-1.5 ${isDark ? 'text-[#B0B0C0]' : 'text-slate-700'}`}>
                  <Mail className={`w-3.5 h-3.5 ${isDark ? 'text-[#56A867]' : 'text-emerald-600'}`} />
                  <span>{t('emailLabel')} *</span>
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={language === 'en' ? 'Email address' : 'Correo electrónico'}
                  className={`w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none transition-all ${
                    isDark
                      ? 'bg-[#131318] border border-[#242430] text-white focus:border-[#56A867]'
                      : 'bg-slate-50 border border-slate-300 text-slate-900 focus:border-emerald-600'
                  }`}
                />
              </div>

              {/* Contraseñas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className={`text-xs font-mono flex items-center gap-1.5 ${isDark ? 'text-[#B0B0C0]' : 'text-slate-700'}`}>
                    <Lock className={`w-3.5 h-3.5 ${isDark ? 'text-[#56A867]' : 'text-emerald-600'}`} />
                    <span>{t('passwordLabel')} *</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={t('passwordPlaceholderMin6')}
                      className={`w-full px-4 py-2.5 pr-9 rounded-xl text-sm focus:outline-none transition-all ${
                        isDark
                          ? 'bg-[#131318] border border-[#242430] text-white focus:border-[#56A867]'
                          : 'bg-slate-50 border border-slate-300 text-slate-900 focus:border-emerald-600'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className={`absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer ${
                        isDark ? 'text-neutral-400 hover:text-white' : 'text-slate-400 hover:text-slate-800'
                      }`}
                      aria-label={showPassword ? (language === 'en' ? 'Hide password' : 'Ocultar contraseña') : (language === 'en' ? 'Show password' : 'Ver contraseña')}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className={`text-xs font-mono flex items-center gap-1.5 ${isDark ? 'text-[#B0B0C0]' : 'text-slate-700'}`}>
                    <Lock className={`w-3.5 h-3.5 ${isDark ? 'text-[#56A867]' : 'text-emerald-600'}`} />
                    <span>{t('confirmPasswordLabel')} *</span>
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={t('confirmPasswordPlaceholder')}
                    className={`w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none transition-all ${
                      isDark
                        ? 'bg-[#131318] border border-[#242430] text-white focus:border-[#56A867]'
                        : 'bg-slate-50 border border-slate-300 text-slate-900 focus:border-emerald-600'
                    }`}
                  />
                </div>
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  className={`w-full py-3 px-6 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 uppercase tracking-wider cursor-pointer ${
                    isDark
                      ? 'bg-[#56A867] hover:bg-[#64B875] text-black shadow-[0_0_20px_rgba(86,168,103,0.25)]'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md'
                  }`}
                >
                  <span>{language === 'en' ? 'Continue to Biometrics' : 'Continuar a Biometría'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              <div className="text-center pt-2">
                <p className={`text-xs ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>
                  {t('alreadyRegisteredPrompt')}{' '}
                  <button
                    type="button"
                    onClick={() => onNavigate('athlete-login')}
                    className={`font-semibold hover:underline cursor-pointer ${isDark ? 'text-[#56A867]' : 'text-emerald-600'}`}
                  >
                    {t('loginHereBtn')}
                  </button>
                </p>
              </div>
            </form>
          )}

          {/* STEP 1.5: Verificación de Código de 6 Dígitos */}
          {step === 1 && isVerifyingEmail && (
            <form onSubmit={handleVerifyEmailCode} className="space-y-5 animate-fadeIn">
              <div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#56A867]/15 text-[#56A867] uppercase">
                  {language === 'en' ? 'Access Security' : 'Seguridad de Acceso'}
                </span>
                <h1 className={`text-2xl font-serif font-bold mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {language === 'en' ? 'Email Verification • 6 Digits' : 'Verificación de Correo • 6 Dígitos'}
                </h1>
                <p className={`text-xs mt-1 ${isDark ? 'text-[#8E8E9E]' : 'text-slate-500'}`}>
                  {language === 'en' ? (
                    <>We generated and sent a 6-digit numeric code to your email <strong>{email}</strong>.</>
                  ) : (
                    <>Hemos generado y enviado un código numérico a tu correo <strong>{email}</strong>.</>
                  )}
                </p>
              </div>

              {/* Email Sent Notification Banner */}
              {codeNotification && (
                <div className="p-3.5 rounded-xl bg-[#56A867]/10 border border-[#56A867]/30 text-xs font-mono text-[#56A867] flex items-center gap-2.5">
                  <Mail className="w-4 h-4 shrink-0" />
                  <span>
                    {language === 'en'
                      ? `✉️ We sent a 6-digit verification code to ${email}. Please check your inbox or spam folder and enter it below.`
                      : `✉️ Hemos enviado un código de verificación de 6 dígitos a ${email}. Revisa tu bandeja de entrada o carpeta de spam e ingrésalo a continuación.`}
                  </span>
                </div>
              )}

              {/* 6 Digit Code Input */}
              <div className="space-y-2 text-center py-2">
                <label className={`text-xs font-mono block ${isDark ? 'text-[#B0B0C0]' : 'text-slate-700'}`}>
                  {language === 'en'
                    ? 'Enter the 6-digit numeric code received (valid 10 minutes):'
                    : 'Ingresa los 6 dígitos numéricos recibidos (válido 10 minutos):'}
                </label>
                <SixDigitCodeInput
                  value={inputCode}
                  onChange={setInputCode}
                  onComplete={(c) => setInputCode(c)}
                  disabled={isSendingCode}
                  isDark={isDark}
                />
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <button
                  type="submit"
                  disabled={isSendingCode || inputCode.length !== 6}
                  className={`w-full py-3 px-6 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${
                    isDark
                      ? 'bg-[#56A867] hover:bg-[#64B875] text-black shadow-[0_0_20px_rgba(86,168,103,0.25)]'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {isSendingCode
                      ? language === 'en' ? 'Validating...' : 'Validando...'
                      : language === 'en' ? 'Verify and Continue to Biometrics' : 'Verificar y Continuar a Biometría'}
                  </span>
                </button>

                {/* Resend and Timer */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 text-xs font-mono">
                  <span className={isDark ? 'text-neutral-400' : 'text-slate-500'}>
                    {resendTimer > 0 ? (
                      `⏱️ ${language === 'en' ? 'Resend in' : 'Reenviar código en'} ${resendTimer}s`
                    ) : (
                      <span className="text-[#56A867] font-semibold">{language === 'en' ? 'Code expired / Ready to resend' : 'Puedes reenviar el código'}</span>
                    )}
                  </span>

                  <button
                    type="button"
                    disabled={resendTimer > 0 || isSendingCode}
                    onClick={() => {
                      handleSendVerificationCode();
                      setResendTimer(60);
                    }}
                    className={`hover:underline flex items-center gap-1 ${
                      resendTimer === 0 && !isSendingCode
                        ? isDark ? 'text-[#56A867] cursor-pointer' : 'text-emerald-600 cursor-pointer'
                        : 'text-neutral-500 cursor-not-allowed opacity-60'
                    }`}
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>
                      {language === 'en' ? 'Resend Code' : 'Reenviar Código'}
                    </span>
                  </button>
                </div>

                {/* Alternate Actions */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 text-xs font-mono border-t border-neutral-800/40">
                  <button
                    type="button"
                    onClick={handleChangeEmail}
                    className={`hover:underline flex items-center gap-1 cursor-pointer ${
                      isDark ? 'text-neutral-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>
                      {language === 'en'
                        ? 'Change email address'
                        : 'Cambiar correo por uno diferente'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsVerifyingEmail(false);
                      changeStep(2);
                    }}
                    className={`hover:underline flex items-center gap-1 cursor-pointer font-bold ${
                      isDark ? 'text-[#56A867]' : 'text-emerald-700'
                    }`}
                  >
                    <span>
                      {language === 'en'
                        ? 'Skip for now & Continue to Biometrics →'
                        : 'Omitir por ahora y continuar a Biometría →'}
                    </span>
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* STEP 2: Registro Biométrico (País, Teléfono, Tipo de Cuerpo, Altura, Peso, Talla) */}
          {step === 2 && (
            <form onSubmit={handleStep2Complete} className="space-y-4">
              <div>
                <h1 className={`text-2xl font-serif font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {language === 'en' ? 'Biometric Registration & Metrics' : 'Registro Biométrico & Medidas'}
                </h1>
                <p className={`text-xs mt-1 ${isDark ? 'text-[#8E8E9E]' : 'text-slate-500'}`}>
                  {language === 'en'
                    ? 'Enter your country, phone, and physical characteristics to calculate your optimal starter exercise.'
                    : 'Ingresa tu país, teléfono y características físicas para calcular tu ejercicio de inicio óptimo.'}
                </p>
              </div>

              {/* País y Teléfono */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className={`text-xs font-mono flex items-center gap-1.5 ${isDark ? 'text-[#B0B0C0]' : 'text-slate-700'}`}>
                    <Globe className={`w-3.5 h-3.5 ${isDark ? 'text-[#56A867]' : 'text-emerald-600'}`} />
                    <span>{t('countryLabel')} *</span>
                  </label>
                  <select
                    value={selectedCountry.code}
                    onChange={(e) => {
                      const found = COUNTRIES.find((c) => c.code === e.target.value);
                      if (found) setSelectedCountry(found);
                    }}
                    className={`w-full px-3 py-2.5 rounded-xl text-xs focus:outline-none transition-all ${
                      isDark
                        ? 'bg-[#131318] border border-[#242430] text-white focus:border-[#56A867]'
                        : 'bg-slate-50 border border-slate-300 text-slate-900 focus:border-emerald-600'
                    }`}
                  >
                    {COUNTRIES.map((country) => (
                      <option key={country.code} value={country.code}>
                        {country.flag} {country.name} ({country.phoneCode})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className={`text-xs font-mono flex items-center gap-1.5 ${isDark ? 'text-[#B0B0C0]' : 'text-slate-700'}`}>
                    <Phone className={`w-3.5 h-3.5 ${isDark ? 'text-[#56A867]' : 'text-emerald-600'}`} />
                    <span>{t('phoneLabel')} *</span>
                  </label>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`px-2.5 py-2 rounded-xl text-xs font-mono border ${
                        isDark ? 'bg-[#171720] border-[#2A2A38] text-neutral-400' : 'bg-slate-100 border-slate-300 text-slate-700'
                      }`}
                    >
                      {selectedCountry.phoneCode}
                    </span>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder={t('phonePlaceholder')}
                      className={`flex-1 px-3.5 py-2.5 rounded-xl text-sm focus:outline-none transition-all ${
                        isDark
                          ? 'bg-[#131318] border border-[#242430] text-white focus:border-[#56A867]'
                          : 'bg-slate-50 border border-slate-300 text-slate-900 focus:border-emerald-600'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Tipo de Cuerpo (Somatotipo) */}
              <div className="space-y-2">
                <label className={`text-xs font-mono flex items-center gap-1.5 ${isDark ? 'text-[#B0B0C0]' : 'text-slate-700'}`}>
                  <Activity className={`w-3.5 h-3.5 ${isDark ? 'text-[#56A867]' : 'text-emerald-600'}`} />
                  <span>{t('bodyTypeLabel')} *</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {[
                    {
                      type: 'Ectomorfo' as BodyType,
                      title: language === 'en' ? 'Ectomorph' : 'Ectomorfo',
                      desc: language === 'en'
                        ? 'Lean frame, longer levers, fast metabolic rate.'
                        : 'Estructura delgada, extremidades largas, metabolismo veloz.',
                    },
                    {
                      type: 'Mesomorfo' as BodyType,
                      title: language === 'en' ? 'Mesomorph' : 'Mesomorfo',
                      desc: language === 'en'
                        ? 'Athletic frame, balanced leverage, natural power.'
                        : 'Estructura atlética, proporciones equilibradas, fuerza natural.',
                    },
                    {
                      type: 'Endomorfo' as BodyType,
                      title: language === 'en' ? 'Endomorph' : 'Endomorfo',
                      desc: language === 'en'
                        ? 'Broad, solid frame, high foundation of force & density.'
                        : 'Estructura ancha y robusta, gran base de fuerza y densidad.',
                    },
                  ].map((item) => (
                    <button
                      key={item.type}
                      type="button"
                      onClick={() => setBodyType(item.type)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        bodyType === item.type
                          ? isDark
                            ? 'bg-[#56A867]/15 border-[#56A867] shadow-[0_0_15px_rgba(86,168,103,0.15)]'
                            : 'bg-emerald-50 border-emerald-600 shadow-sm'
                          : isDark
                          ? 'bg-[#131318] border-[#22222E] hover:border-neutral-700'
                          : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-xs font-bold ${
                            bodyType === item.type
                              ? isDark
                                ? 'text-[#56A867]'
                                : 'text-emerald-700'
                              : isDark
                              ? 'text-white'
                              : 'text-slate-900'
                          }`}
                        >
                          {item.title}
                        </span>
                        {bodyType === item.type && (
                          <CheckCircle2
                            className={`w-3.5 h-3.5 ${isDark ? 'text-[#56A867]' : 'text-emerald-600'}`}
                          />
                        )}
                      </div>
                      <p className={`text-[10px] mt-1 line-clamp-2 ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>
                        {item.desc}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Altura, Peso y Talla */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Altura */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className={`text-xs font-mono flex items-center gap-1 ${isDark ? 'text-[#B0B0C0]' : 'text-slate-700'}`}>
                      <Ruler className="w-3.5 h-3.5 text-emerald-500" />
                      <span>{t('heightCmLabel')} *</span>
                    </label>
                    <span className="text-xs font-mono font-bold text-emerald-500">
                      {heightCm ? `${heightCm} cm` : (language === 'en' ? 'Unset' : 'Sin registrar')}
                    </span>
                  </div>
                  <input
                    type="number"
                    min={120}
                    max={230}
                    required
                    value={heightCm}
                    placeholder={t('heightPlaceholder')}
                    onChange={(e) => setHeightCm(e.target.value === '' ? '' : Number(e.target.value))}
                    className={`w-full px-3 py-2 rounded-xl text-sm focus:outline-none transition-all ${
                      isDark
                        ? 'bg-[#131318] border border-[#242430] text-white focus:border-[#56A867]'
                        : 'bg-slate-50 border border-slate-300 text-slate-900 focus:border-emerald-600'
                    }`}
                  />
                  <input
                    type="range"
                    min={120}
                    max={230}
                    value={heightCm || 170}
                    onChange={(e) => setHeightCm(Number(e.target.value))}
                    className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-neutral-700 rounded-lg"
                  />
                </div>

                {/* Peso */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className={`text-xs font-mono flex items-center gap-1 ${isDark ? 'text-[#B0B0C0]' : 'text-slate-700'}`}>
                      <Weight className="w-3.5 h-3.5 text-emerald-500" />
                      <span>{t('weightKgLabel')} *</span>
                    </label>
                    <span className="text-xs font-mono font-bold text-emerald-500">
                      {weightKg ? `${weightKg} kg` : (language === 'en' ? 'Unset' : 'Sin registrar')}
                    </span>
                  </div>
                  <input
                    type="number"
                    min={35}
                    max={200}
                    required
                    value={weightKg}
                    placeholder={t('weightPlaceholder')}
                    onChange={(e) => setWeightKg(e.target.value === '' ? '' : Number(e.target.value))}
                    className={`w-full px-3 py-2 rounded-xl text-sm focus:outline-none transition-all ${
                      isDark
                        ? 'bg-[#131318] border border-[#242430] text-white focus:border-[#56A867]'
                        : 'bg-slate-50 border border-slate-300 text-slate-900 focus:border-emerald-600'
                    }`}
                  />
                  <input
                    type="range"
                    min={35}
                    max={160}
                    value={weightKg || 70}
                    onChange={(e) => setWeightKg(Number(e.target.value))}
                    className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-neutral-700 rounded-lg"
                  />
                </div>

                {/* Talla */}
                <div className="space-y-1">
                  <label className={`text-xs font-mono flex items-center gap-1 ${isDark ? 'text-[#B0B0C0]' : 'text-slate-700'}`}>
                    <span>{t('clothingSizeLabel')} *</span>
                  </label>
                  <div className="grid grid-cols-6 gap-1">
                    {(['XS', 'S', 'M', 'L', 'XL', 'XXL'] as ClothingSize[]).map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setClothingSize(size)}
                        className={`py-2 rounded-lg text-xs font-mono font-bold border transition-colors cursor-pointer ${
                          clothingSize === size
                            ? isDark
                              ? 'bg-[#56A867] text-black border-[#56A867]'
                              : 'bg-emerald-600 text-white border-emerald-600'
                            : isDark
                            ? 'bg-[#15151E] text-neutral-300 border-[#262634] hover:border-neutral-600'
                            : 'bg-slate-100 text-slate-700 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                  <p className={`text-[10px] mt-1 ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>
                    {language === 'en'
                      ? 'Calibrates thoracic frame width and support geometry.'
                      : 'Define el ancho torácico y la estructura de soporte.'}
                  </p>
                </div>
              </div>

              {/* Terms checkbox */}
              <label className="flex items-start gap-2 text-xs cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="rounded text-emerald-500 focus:ring-0 w-4 h-4 accent-emerald-500 mt-0.5"
                />
                <span className={isDark ? 'text-neutral-300' : 'text-slate-600'}>
                  {t('termsBiometricsLabel')}
                </span>
              </label>

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    if (window.history.length > 1) {
                      window.history.back();
                    } else {
                      changeStep(1);
                    }
                  }}
                  className={`py-3 px-4 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
                    isDark ? 'border-neutral-700 text-neutral-300 hover:bg-neutral-800' : 'border-slate-300 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {t('back')}
                </button>
                <button
                  type="submit"
                  disabled={!agreeTerms}
                  className={`flex-1 py-3 px-6 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 uppercase tracking-wider disabled:opacity-50 cursor-pointer ${
                    isDark
                      ? 'bg-[#56A867] hover:bg-[#64B875] text-black shadow-[0_0_20px_rgba(86,168,103,0.25)]'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md'
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{t('calculateStarterExerciseBtn')}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: Revelación del "Buen Ejercicio de Inicio" adaptado */}
          {step === 3 && (
            <div className="space-y-5 animate-in fade-in duration-300">
              <div>
                <div
                  className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-bold uppercase mb-2 ${
                    isDark
                      ? 'bg-[#56A867]/15 text-[#56A867] border border-[#56A867]/30'
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{t('diagnosticCompletedBadge')}</span>
                </div>
                <h1 className={`text-2xl sm:text-3xl font-serif font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {t('starterExerciseTitle')}
                </h1>
                <p className={`text-xs mt-1 ${isDark ? 'text-[#8E8E9E]' : 'text-slate-500'}`}>
                  {language === 'en' ? (
                    <>Designed for your <strong className="text-emerald-500">{bodyType || 'Mesomorph'}</strong> somatotype ({heightCm} cm, {weightKg} kg, Size {clothingSize}).</>
                  ) : (
                    <>Diseñado para tu biotipo <strong className="text-emerald-500">{bodyType}</strong> ({heightCm} cm, {weightKg} kg, Talla {clothingSize}).</>
                  )}
                </p>
              </div>

              {/* Main Starter Exercise Card */}
              <div
                className={`p-5 rounded-2xl border relative overflow-hidden transition-all ${
                  isDark
                    ? 'bg-gradient-to-br from-[#14141E] to-[#0E0E14] border-[#56A867]/40 shadow-[0_0_30px_rgba(86,168,103,0.1)]'
                    : 'bg-gradient-to-br from-emerald-50/50 to-white border-emerald-300 shadow-lg'
                }`}
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-neutral-200 dark:border-neutral-800">
                  <div>
                    <span className="text-[10px] font-mono tracking-widest uppercase text-emerald-500 font-bold">
                      {starterExercise.category} • {starterExercise.targetMuscle}
                    </span>
                    <h2 className={`text-xl font-serif font-bold mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {starterExercise.exerciseName}
                    </h2>
                  </div>

                  <div
                    className={`px-3 py-1 rounded-xl text-xs font-mono font-bold border shrink-0 ${
                      isDark ? 'bg-[#181822] border-[#2A2A38] text-[#56A867]' : 'bg-white border-emerald-200 text-emerald-700'
                    }`}
                  >
                    {t('initialLoadLabel')}: {starterExercise.suggestedWeightKg} kg
                  </div>
                </div>

                {/* Prescription metrics grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 py-4 text-center">
                  <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-[#171720] border-[#262634]' : 'bg-white border-slate-200'}`}>
                    <div className="text-[10px] font-mono text-neutral-400 uppercase">{t('setsLabel')}</div>
                    <div className="text-base font-mono font-bold text-emerald-500">{starterExercise.sets} {language === 'en' ? 'sets' : 'series'}</div>
                  </div>
                  <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-[#171720] border-[#262634]' : 'bg-white border-slate-200'}`}>
                    <div className="text-[10px] font-mono text-neutral-400 uppercase">{t('repsLabel')}</div>
                    <div className={`text-base font-mono font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {starterExercise.reps}
                    </div>
                  </div>
                  <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-[#171720] border-[#262634]' : 'bg-white border-slate-200'}`}>
                    <div className="text-[10px] font-mono text-neutral-400 uppercase">{t('intensityLabel')}</div>
                    <div className={`text-xs font-mono font-bold ${isDark ? 'text-neutral-200' : 'text-slate-800'}`}>
                      {starterExercise.rpeTarget}
                    </div>
                  </div>
                  <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-[#171720] border-[#262634]' : 'bg-white border-slate-200'}`}>
                    <div className="text-[10px] font-mono text-neutral-400 uppercase">{t('restLabel')}</div>
                    <div className={`text-base font-mono font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {starterExercise.restSeconds}s
                    </div>
                  </div>
                </div>

                {/* Biomechanical reasoning */}
                <div className="space-y-3 pt-2">
                  <div className={`p-3 rounded-xl text-xs leading-relaxed ${isDark ? 'bg-[#111118] text-neutral-300' : 'bg-white text-slate-700 border border-slate-200'}`}>
                    <strong className="text-emerald-500 block mb-1">{t('whyExerciseTitle')}</strong>
                    {starterExercise.whyThisExercise}
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-[11px] font-mono font-bold text-neutral-400 uppercase">
                      {t('biomechanicalCuesTitle')}
                    </span>
                    <ul className="space-y-1.5">
                      {starterExercise.biomechanicalCues.map((cue, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-xs">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                          <span className={isDark ? 'text-neutral-300' : 'text-slate-700'}>{cue}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleFinalizeRegistration('live-workout')}
                  className={`w-full py-3.5 px-6 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 uppercase tracking-wider cursor-pointer ${
                    isDark
                      ? 'bg-[#56A867] hover:bg-[#64B875] text-black shadow-[0_0_25px_rgba(86,168,103,0.3)]'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg'
                  }`}
                >
                  <Dumbbell className="w-4 h-4" />
                  <span>{loading ? (language === 'en' ? 'Preparing Room...' : 'Preparando Sala...') : t('liveWorkoutStartBtn')}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleFinalizeRegistration('athlete-dashboard')}
                  className={`w-full py-3 px-6 rounded-xl text-xs font-semibold border transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    isDark
                      ? 'bg-[#14141A] hover:bg-[#1D1D26] border-[#2A2A38] text-neutral-300'
                      : 'bg-white hover:bg-slate-50 border-slate-300 text-slate-800'
                  }`}
                >
                  <span>{t('saveAndGoDashboardBtn')}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </ScrollReveal>
    </div>
  </div>
  );
};
