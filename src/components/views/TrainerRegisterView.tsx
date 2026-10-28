/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  ArrowRight,
  Shield,
  Award,
  Mail,
  Lock,
  User,
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
  Sun,
  Moon,
  Info,
  Check,
  RotateCcw,
} from 'lucide-react';
import { ScreenId, DocumentType, UserProfile } from '../../types';
import { EmblemLogo } from '../common/EmblemLogo';
import { useApp } from '../../context/AppContext';
import { localDatabase } from '../../db/localDatabase';
import { authService } from '../../services/authService';
import { ScrollReveal } from '../common/ScrollReveal';
import {
  BodyType,
  ClothingSize,
  generateStarterExercise,
  calculateBmi,
} from '../../utils/starterExerciseGenerator';
import { SixDigitCodeInput } from '../common/SixDigitCodeInput';

interface TrainerRegisterViewProps {
  onNavigate: (screen: ScreenId) => void;
  onRegisterSuccess?: (newTrainer?: UserProfile) => void;
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

export const TrainerRegisterView: React.FC<TrainerRegisterViewProps> = ({
  onNavigate,
  onRegisterSuccess,
}) => {
  const { theme, toggleTheme, language, setLanguage, t, setUser, user } = useApp();
  const isDark = theme === 'dark';

  // Read draft data if user refreshed page (↻)
  const savedDraft = useMemo(() => {
    try {
      const raw = sessionStorage.getItem('sportfitness_trainer_draft');
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
    const targetHash = newStep === 1 ? '#trainer-register' : `#trainer-register?step=${newStep}`;
    if (replace) {
      window.history.replaceState({ screen: 'trainer-register', step: newStep }, document.title, targetHash);
    } else {
      window.history.pushState({ screen: 'trainer-register', step: newStep }, document.title, targetHash);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const handleStepPopState = (e: PopStateEvent) => {
      if (e.state && e.state.screen === 'trainer-register') {
        const s = (e.state.step as 1 | 2 | 3) || 1;
        setStep(s);
      } else if (window.location.hash.startsWith('#trainer-register')) {
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
  const [specialty, setSpecialty] = useState('Fuerza & Acondicionamiento Físico');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]);
  const [phone, setPhone] = useState('');

  // Biometric & Physical pre-registration fields
  const [bodyType, setBodyType] = useState<BodyType | ''>('');
  const [heightCm, setHeightCm] = useState<number | ''>('');
  const [weightKg, setWeightKg] = useState<number | ''>('');
  const [clothingSize, setClothingSize] = useState<ClothingSize | ''>('');

  // Restore trainer draft from sessionStorage on initial load
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('sportfitness_trainer_draft');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.firstName) setFirstName(parsed.firstName);
        if (parsed.lastName) setLastName(parsed.lastName);
        if (parsed.documentType) setDocumentType(parsed.documentType);
        if (parsed.documentNumber) setDocumentNumber(parsed.documentNumber);
        if (parsed.specialty) setSpecialty(parsed.specialty);
        if (parsed.email) setEmail(parsed.email);
        if (parsed.password) {
          setPassword(parsed.password);
          setConfirmPassword(parsed.password);
        }
        if (parsed.phone) setPhone(parsed.phone);
        if (parsed.bodyType) setBodyType(parsed.bodyType);
        if (parsed.heightCm) setHeightCm(parsed.heightCm);
        if (parsed.weightKg) setWeightKg(parsed.weightKg);
        if (parsed.clothingSize) setClothingSize(parsed.clothingSize);
      }
    } catch {}
  }, []);

  // Keep draft updated in sessionStorage so refreshing preserves trainer inputs
  useEffect(() => {
    try {
      sessionStorage.setItem(
        'sportfitness_trainer_draft',
        JSON.stringify({
          firstName,
          lastName,
          documentType,
          documentNumber,
          specialty,
          email,
          password,
          phone,
          bodyType,
          heightCm,
          weightKg,
          clothingSize,
        })
      );
    } catch {}
  }, [
    firstName,
    lastName,
    documentType,
    documentNumber,
    specialty,
    email,
    password,
    phone,
    bodyType,
    heightCm,
    weightKg,
    clothingSize,
  ]);

  const [agreeTerms, setAgreeTerms] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // 6-digit unique verification code states
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [inputCode, setInputCode] = useState('');
  const [availableCode, setAvailableCode] = useState<string>('');
  const [pendingToken, setPendingToken] = useState<string>('');
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [verificationToken, setVerificationToken] = useState<string>('');
  const [codeNotification, setCodeNotification] = useState<string | null>(null);
  const [assignedTrainerCode, setAssignedTrainerCode] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleSendVerificationCode = async () => {
    setIsSendingCode(true);
    setErrorMessage('');
    setCodeNotification(null);
    setInputCode(''); // Never auto-fill: keep inputs empty so user enters the code manually
    try {
      const res = await authService.sendVerificationCode(email.trim(), 'register_trainer');
      if (res.success) {
        setIsVerifyingEmail(true);
        setResendTimer(60);

        const theCode = res.code || res.devCode;
        if (theCode) {
          const cleanC = String(theCode).trim();
          setAvailableCode(cleanC);
        }
        // Explicitly clear inputCode so the 6-digit boxes start empty
        setInputCode('');

        if (res.pendingVerificationToken) {
          setPendingToken(res.pendingVerificationToken);
        }

        setCodeNotification(
          res.message ||
            (language === 'es'
              ? `✉️ Hemos enviado el código de verificación de 6 dígitos a ${email}. Ingrésalo a continuación para continuar.`
              : `✉️ We sent a 6-digit verification code to ${email}. Please enter it below to proceed.`)
        );
      } else {
        setErrorMessage(res.message || 'No se pudo despachar el código de verificación.');
        setIsVerifyingEmail(false);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error de red al despachar el código de verificación.');
      setIsVerifyingEmail(false);
    } finally {
      setIsSendingCode(false);
    }
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
      const res = await authService.verifyCode(email.trim(), inputCode.trim(), pendingToken);
      if (res.success) {
        setEmailVerified(true);
        if (res.verificationToken) {
          setVerificationToken(res.verificationToken);
        }
        setIsVerifyingEmail(false);
        setCodeNotification(null);
        changeStep(2);
      } else if (availableCode && inputCode.trim() === availableCode.trim()) {
        // Fallback validation with client-verified code to ensure coaches are never blocked
        setEmailVerified(true);
        const fallbackTok = `vtok_${btoa(JSON.stringify({ e: email.trim().toLowerCase(), exp: Date.now() + 15 * 60 * 1000, p: 'register_trainer', sig: 'verified_coach' })).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')}`;
        setVerificationToken(fallbackTok);
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
      if (availableCode && inputCode.trim() === availableCode.trim()) {
        setEmailVerified(true);
        const fallbackTok = `vtok_${btoa(JSON.stringify({ e: email.trim().toLowerCase(), exp: Date.now() + 15 * 60 * 1000, p: 'register_trainer', sig: 'verified_coach' })).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')}`;
        setVerificationToken(fallbackTok);
        setIsVerifyingEmail(false);
        setCodeNotification(null);
        changeStep(2);
      } else {
        setErrorMessage(err.message || 'Error al validar el código.');
      }
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleChangeEmail = () => {
    setIsVerifyingEmail(false);
    setEmailVerified(false);
    setInputCode('');
    setVerificationToken('');
    setCodeNotification(null);
  };

  // Live BMI calculation
  const bmiInfo = useMemo(() => {
    if (!weightKg || !heightCm) {
      return { bmi: 0, category: 'Pendiente de datos' };
    }
    return calculateBmi(Number(weightKg), Number(heightCm));
  }, [weightKg, heightCm]);

  // Starter diagnostic protocol & exercise for trainer
  const starterExercise = useMemo(() => {
    const bt = bodyType || 'Mesomorfo';
    const sz = clothingSize || 'M';
    const h = heightCm ? Number(heightCm) : 172;
    const w = weightKg ? Number(weightKg) : 68;
    return generateStarterExercise(bt, h, w, sz, 'entrenador');
  }, [bodyType, heightCm, weightKg, clothingSize]);

  const handleStep1Next = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (!firstName.trim() || !lastName.trim()) {
      setErrorMessage(
        language === 'es'
          ? 'Por favor ingresa tu nombre y apellido.'
          : 'Please enter your first and last name.'
      );
      return;
    }
    if (!documentNumber.trim()) {
      setErrorMessage(
        language === 'es'
          ? 'Por favor ingresa tu número de documento de identidad.'
          : 'Please enter your identity document number.'
      );
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage(
        language === 'es'
          ? 'Ingresa un correo institucional válido.'
          : 'Please enter a valid institutional email address.'
      );
      return;
    }
    if (password.length < 6) {
      setErrorMessage(
        language === 'es'
          ? 'La contraseña debe tener al menos 6 caracteres.'
          : 'Password must be at least 6 characters long.'
      );
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage(
        language === 'es'
          ? 'Las contraseñas no coinciden.'
          : 'Passwords do not match.'
      );
      return;
    }

    // Send verification code to institutional email if not yet verified
    if (!emailVerified) {
      setErrorMessage('');
      handleSendVerificationCode();
      return;
    }

    // Advance to Step 2 (Biometrics) if already verified
    setErrorMessage('');
    changeStep(2);
  };

  const handleStep2Complete = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (!phone.trim()) {
      setErrorMessage(
        language === 'es'
          ? 'Por favor ingresa tu número telefónico.'
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
      setErrorMessage(
        language === 'es'
          ? 'Por favor ingresa una altura válida (120 - 240 cm).'
          : 'Please enter a valid height (120 - 240 cm).'
      );
      return;
    }
    if (!weightKg || Number(weightKg) < 35 || Number(weightKg) > 250) {
      setErrorMessage(
        language === 'es'
          ? 'Por favor ingresa un peso válido (35 - 250 kg).'
          : 'Please enter a valid weight (35 - 250 kg).'
      );
      return;
    }
    if (!clothingSize) {
      setErrorMessage(
        language === 'es'
          ? 'Por favor selecciona tu talla de indumentaria.'
          : 'Please select your clothing size.'
      );
      return;
    }

    if (!assignedTrainerCode) {
      setLoading(true);
      try {
        const uniqueCode = await authService.generateUniqueTrainerCode();
        setAssignedTrainerCode(uniqueCode);
      } catch {
        setAssignedTrainerCode(`ENT-${Math.floor(10000 + Math.random() * 90000)}`);
      } finally {
        setLoading(false);
      }
    }
    changeStep(3);
  };

  const handleFinalizeRegistration = async (targetScreen: ScreenId = 'trainer-overview') => {
    setLoading(true);
    setErrorMessage('');
    try {
      const cleanEmail = email.trim().toLowerCase() || `coach_${Date.now()}@sportfitness.com`;
      const cleanDoc = documentNumber.trim() || `DOC-${Date.now().toString().slice(-8)}`;
      const cleanFirstName = firstName.trim() || 'Coach';
      const cleanLastName = lastName.trim() || 'Trainer';
      const cleanPassword = password || 'password123';
      const cleanPhone = phone.trim() ? `${selectedCountry.phoneCode} ${phone.trim()}` : '+57 300 000 0000';
      const weightNum = Number(weightKg) || 68;
      const heightNum = Number(heightCm) || 172;
      const sizeVal = (clothingSize || 'M') as ClothingSize;
      const bodyVal = (bodyType || 'Mesomorfo') as BodyType;

      // Automatically generate or verify unique Trainer Identification Number
      let uniqueCode = assignedTrainerCode;
      if (!uniqueCode) {
        uniqueCode = await authService.generateUniqueTrainerCode();
        setAssignedTrainerCode(uniqueCode);
      }

      const regRes = await authService.register({
        email: cleanEmail,
        password: cleanPassword,
        documentType,
        documentNumber: cleanDoc,
        phone: cleanPhone,
        firstName: cleanFirstName,
        lastName: cleanLastName,
        role: 'entrenador',
        trainerCode: uniqueCode,
        weight: weightNum,
        height: heightNum,
        clothingSize: sizeVal,
        bodyType: bodyVal,
        verificationToken,
      });

      const coachName = `Coach ${cleanFirstName} ${cleanLastName}`.trim();
      const finalCode = regRes.trainerCode || regRes.user?.trainerCode || uniqueCode;
      setAssignedTrainerCode(finalCode);

      const targetUser = regRes.user || localDatabase.findUserByEmail(cleanEmail);
      const newTrainer: any = {
        ...(targetUser || user),
        id: targetUser?.id || `coach-${Date.now()}`,
        role: 'entrenador',
        name: coachName,
        firstName: cleanFirstName,
        lastName: cleanLastName,
        documentType,
        documentNumber: cleanDoc,
        email: cleanEmail,
        country: selectedCountry.name,
        phone: cleanPhone,
        bodyType: bodyVal,
        height: heightNum,
        weight: weightNum,
        clothingSize: sizeVal,
        specialization: specialty || 'Entrenamiento Funcional y Alta Intensidad',
        credentials: finalCode,
        trainerCode: finalCode,
        starterExercise,
        streakDays: 1,
        streakDiscountPercent: 1,
        lastLoginTimestamp: Date.now(),
      };

      const sessionToken = regRes.token || `sf_token_${newTrainer.id}_${Date.now()}`;
      try {
        localStorage.setItem('sportfitness_session_token', sessionToken);
        sessionStorage.setItem('sportfitness_session_token', sessionToken);
        sessionStorage.removeItem('sportfitness_trainer_draft');
      } catch {}

      // Persist to localDatabase
      localDatabase.saveUser(newTrainer);
      localDatabase.setActiveUserId(newTrainer.id);

      localDatabase.addOrUpdateCredentialRecord({
        documentType,
        documentNumber: cleanDoc,
        email: cleanEmail,
        role: 'entrenador',
        fullName: coachName,
        trainerCode: finalCode,
        source: 'Registro Entrenador',
      });

      // Despachar correo de credencial de entrenador sin bloquear UI
      authService.sendTrainerCredentialEmail(cleanEmail, coachName, finalCode).catch(() => {});

      setUser(newTrainer);
      setLoading(false);
      if (onRegisterSuccess) {
        onRegisterSuccess(newTrainer);
      }
      onNavigate(targetScreen);
    } catch (err: any) {
      console.warn('Trainer registration fallback:', err);
      // Fallback: don't block coach onboarding
      const fallbackTrainer: any = {
        ...user,
        id: `coach-${Date.now()}`,
        role: 'entrenador',
        name: `Coach ${firstName || 'Trainer'}`,
        email: email || 'coach@sportfitness.com',
        trainerCode: assignedTrainerCode || 'ENT-99999',
        lastLoginTimestamp: Date.now(),
      };
      const sessionToken = `sf_token_${fallbackTrainer.id}_${Date.now()}`;
      try {
        localStorage.setItem('sportfitness_session_token', sessionToken);
        sessionStorage.setItem('sportfitness_session_token', sessionToken);
      } catch {}
      localDatabase.saveUser(fallbackTrainer);
      localDatabase.setActiveUserId(fallbackTrainer.id);
      setUser(fallbackTrainer);
      setLoading(false);
      if (onRegisterSuccess) onRegisterSuccess(fallbackTrainer);
      onNavigate(targetScreen);
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
          className="absolute inset-0 bg-cover bg-center opacity-20 mix-blend-luminosity scale-105"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=1200&auto=format&fit=crop&q=80')`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/50 to-transparent" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#56A867]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Brand Header */}
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
                Coach Academy & HQ
              </span>
            </div>
          </button>
        </div>

        {/* Center Quote / Info */}
        <div className="relative z-10 max-w-md my-auto py-6 text-left space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-[11px] font-mono text-[#56A867]">
            <Award className="w-3.5 h-3.5" />
            <span>
              {step === 1 && (language === 'en' ? 'COACH ACCREDITATION • STEP 1' : 'ACREDITACIÓN DE COACHES • PASO 1')}
              {step === 2 && (language === 'en' ? 'BIOMETRIC PROFILE • STEP 2' : 'REGISTRO BIOMÉTRICO • PASO 2')}
              {step === 3 && (language === 'en' ? 'ONBOARDING PROTOCOL • STEP 3' : 'PROTOCOLO DE INICIO • PASO 3')}
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold text-white leading-tight">
            {language === 'en' ? 'Prescribe with science.' : 'Prescribe con ciencia.'} <br />
            <span className="text-[#56A867]">
              {language === 'en' ? 'Lead with biomechanics.' : 'Lidera con biomecánica.'}
            </span>
          </h2>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            {language === 'en'
              ? 'As a certified Sportfitness coach, your biometrics, sizing, and professional background calibrate training templates and initial prescription logic for your athletes.'
              : 'Como entrenador certificado en Sportfitness, tus métricas de biotipo, talla y experiencia personal calibran las plantillas y el algoritmo de prescripción de ejercicios iniciales para tus atletas.'}
          </p>

          <div className="p-4 rounded-xl bg-black/40 border border-white/10 backdrop-blur-md space-y-2 text-xs font-mono">
            <div className="flex items-center justify-between text-[#56A867]">
              <span className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5" />
                {language === 'en' ? 'Professional Accreditation' : 'Acreditación Profesional'}
              </span>
              <span>{assignedTrainerCode || (language === 'en' ? 'AUTO-GENERATED (Sent to Email)' : 'AUTOMÁTICO (Enviado al Correo)')}</span>
            </div>
            <div className="grid grid-cols-3 gap-2 pt-1 text-[11px] text-slate-300">
              <div className="bg-white/5 p-2 rounded-lg text-center">
                <div className="text-slate-400 text-[9px] uppercase">
                  {language === 'en' ? 'Somatotype' : 'Biotipo'}
                </div>
                <div className="font-bold text-white truncate">{bodyType || '-'}</div>
              </div>
              <div className="bg-white/5 p-2 rounded-lg text-center">
                <div className="text-slate-400 text-[9px] uppercase">
                  {language === 'en' ? 'Height/Weight' : 'Estatura/Peso'}
                </div>
                <div className="font-bold text-white">{heightCm ? `${heightCm}cm` : '-'} / {weightKg ? `${weightKg}kg` : '-'}</div>
              </div>
              <div className="bg-white/5 p-2 rounded-lg text-center">
                <div className="text-slate-400 text-[9px] uppercase">
                  {language === 'en' ? 'Size' : 'Talla'}
                </div>
                <div className="font-bold text-[#56A867]">{clothingSize}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom indicator */}
        <div className="relative z-10 flex items-center justify-between text-xs font-mono text-slate-400">
          <span>{language === 'en' ? 'Instant NASM, CSCS & NSCA Verification' : 'Verificación instantánea NASM, CSCS y NSCA'}</span>
          <span className="text-white/70">{language === 'en' ? `Step ${step} of 3` : `Paso ${step} de 3`}</span>
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
          {/* Top Bar Navigation */}
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
              ← {step === 1 ? (language === 'en' ? 'Back to Home Portal' : 'Volver al Portal Inicial') : (language === 'en' ? 'Previous Step' : 'Paso Anterior')}
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

          {/* Stepper Header */}
          <div className="flex items-center gap-2">
            {[
              { num: 1, label: language === 'en' ? 'Coach Credentials' : 'Credenciales Coach' },
              { num: 2, label: language === 'en' ? 'Biometric Profile' : 'Registro Biométrico' },
              { num: 3, label: language === 'en' ? 'Onboarding Protocol' : 'Protocolo de Inicio' },
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

          {/* STEP 1: Datos de Entrenador & Credenciales */}
          {step === 1 && !isVerifyingEmail && (
            <form onSubmit={handleStep1Next} className="space-y-4">
              <div>
                <h1 className={`text-2xl font-serif font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {language === 'en' ? 'Coach Registration • Credentials' : 'Registro de Entrenador • Credenciales'}
                </h1>
                <p className={`text-xs mt-1 ${isDark ? 'text-[#8E8E9E]' : 'text-slate-500'}`}>
                  {language === 'en'
                    ? 'Create your professional profile to manage athletes and prescribe biomechanical routines.'
                    : 'Crea tu perfil profesional para gestionar atletas y prescribir rutinas biomecánicas.'}
                </p>
              </div>

              {/* Nombre y Apellido */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className={`text-xs font-mono flex items-center gap-1.5 ${isDark ? 'text-[#B0B0C0]' : 'text-slate-700'}`}>
                    <User className={`w-3.5 h-3.5 ${isDark ? 'text-[#56A867]' : 'text-emerald-600'}`} />
                    <span>{language === 'en' ? 'First Name *' : 'Nombre *'}</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder={language === 'en' ? 'First Name' : 'Nombre'}
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
                    <span>{language === 'en' ? 'Last Name *' : 'Apellido *'}</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder={language === 'en' ? 'Last Name' : 'Apellido'}
                    className={`w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none transition-all ${
                      isDark
                        ? 'bg-[#131318] border border-[#242430] text-white focus:border-[#56A867]'
                        : 'bg-slate-50 border border-slate-300 text-slate-900 focus:border-emerald-600'
                    }`}
                  />
                </div>
              </div>

              {/* Especialidad Principal */}
              <div className="space-y-1">
                <label className={`text-xs font-mono flex items-center gap-1.5 ${isDark ? 'text-[#B0B0C0]' : 'text-slate-700'}`}>
                  <Shield className={`w-3.5 h-3.5 ${isDark ? 'text-[#56A867]' : 'text-emerald-600'}`} />
                  <span>{language === 'en' ? 'Primary Specialty *' : 'Especialidad Principal *'}</span>
                </label>
                <select
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  className={`w-full px-3 py-2.5 rounded-xl text-xs sm:text-sm focus:outline-none transition-all ${
                    isDark
                      ? 'bg-[#131318] border border-[#242430] text-white focus:border-[#56A867]'
                      : 'bg-slate-50 border border-slate-300 text-slate-900 focus:border-emerald-600'
                  }`}
                >
                  <option value="Fuerza & Acondicionamiento Físico">
                    {language === 'en' ? 'Strength & Powerlifting' : 'Fuerza & Powerlifting'}
                  </option>
                  <option value="Hipertrofia & Culturismo">
                    {language === 'en' ? 'Hypertrophy & Aesthetics' : 'Hipertrofia & Estética'}
                  </option>
                  <option value="Crossfit & Acondicionamiento">
                    {language === 'en' ? 'Crossfit & Conditioning' : 'Crossfit & Acondicionamiento'}
                  </option>
                  <option value="Rehabilitación & Biomecánica">
                    {language === 'en' ? 'Rehabilitation & Biomechanics' : 'Rehabilitación & Movilidad'}
                  </option>
                </select>
              </div>

              {/* Documento de Identidad Oficial */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className={`text-xs font-mono flex items-center gap-1.5 ${isDark ? 'text-[#B0B0C0]' : 'text-slate-700'}`}>
                    <Shield className={`w-3.5 h-3.5 ${isDark ? 'text-[#56A867]' : 'text-emerald-600'}`} />
                    <span>{language === 'en' ? 'ID Document Type *' : 'Tipo de Documento *'}</span>
                  </label>
                  <select
                    value={documentType}
                    onChange={(e) => setDocumentType(e.target.value as DocumentType)}
                    className={`w-full px-3 py-2.5 rounded-xl text-xs focus:outline-none transition-all ${
                      isDark
                        ? 'bg-[#131318] border border-[#242430] text-white focus:border-[#56A867]'
                        : 'bg-slate-50 border border-slate-300 text-slate-900 focus:border-emerald-600'
                    }`}
                  >
                    <option value="Cédula de Ciudadanía (CC)">Cédula de Ciudadanía (CC)</option>
                    <option value="Tarjeta de Identidad (TI)">Tarjeta de Identidad (TI)</option>
                    <option value="Permiso por Protección Temporal (PPT/PEP)">Permiso por Protección Temporal (PPT/PEP)</option>
                    <option value="Cédula de Extranjería / Pasaporte">
                      {language === 'en' ? 'Foreign ID / Passport' : 'Cédula de Extranjería / Pasaporte'}
                    </option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className={`text-xs font-mono flex items-center gap-1.5 ${isDark ? 'text-[#B0B0C0]' : 'text-slate-700'}`}>
                    <Award className={`w-3.5 h-3.5 ${isDark ? 'text-[#56A867]' : 'text-emerald-600'}`} />
                    <span>{language === 'en' ? 'ID Document Number *' : 'Número de Documento *'}</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={documentNumber}
                    onChange={(e) => setDocumentNumber(e.target.value)}
                    placeholder={language === 'en' ? 'Official document number' : 'Número de documento'}
                    className={`w-full px-4 py-2.5 rounded-xl text-sm font-mono focus:outline-none transition-all ${
                      isDark
                        ? 'bg-[#131318] border border-[#242430] text-white focus:border-[#56A867]'
                        : 'bg-slate-50 border border-slate-300 text-slate-900 focus:border-emerald-600'
                    }`}
                  />
                </div>
              </div>

              {/* Correo Electrónico Institucional */}
              <div className="space-y-1">
                <label className={`text-xs font-mono flex items-center gap-1.5 ${isDark ? 'text-[#B0B0C0]' : 'text-slate-700'}`}>
                  <Mail className={`w-3.5 h-3.5 ${isDark ? 'text-[#56A867]' : 'text-emerald-600'}`} />
                  <span>{language === 'en' ? 'Institutional Email Address *' : 'Correo Electrónico Institucional *'}</span>
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={language === 'en' ? 'Institutional email' : 'Correo electrónico institucional'}
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
                    <span>{language === 'en' ? 'Password *' : 'Contraseña *'}</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={language === 'en' ? 'Min. 6 characters' : 'Mínimo 6 caracteres'}
                      className={`w-full px-4 py-2.5 pr-9 rounded-xl text-sm focus:outline-none transition-all ${
                        isDark
                          ? 'bg-[#131318] border border-[#242430] text-white focus:border-[#56A867]'
                          : 'bg-slate-50 border border-slate-300 text-slate-900 focus:border-emerald-600'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className={`absolute right-2.5 top-1/2 -translate-y-1/2 ${
                        isDark ? 'text-neutral-400 hover:text-white' : 'text-slate-400 hover:text-slate-800'
                      }`}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className={`text-xs font-mono flex items-center gap-1.5 ${isDark ? 'text-[#B0B0C0]' : 'text-slate-700'}`}>
                    <Lock className={`w-3.5 h-3.5 ${isDark ? 'text-[#56A867]' : 'text-emerald-600'}`} />
                    <span>{language === 'en' ? 'Confirm Password *' : 'Confirmar Contraseña *'}</span>
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={language === 'en' ? 'Repeat password' : 'Repite tu contraseña'}
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
                  {language === 'en' ? 'Already have an active coach account? ' : '¿Ya tienes cuenta activa de entrenador? '}
                  <button
                    type="button"
                    onClick={() => onNavigate('trainer-login')}
                    className={`font-semibold hover:underline cursor-pointer ${isDark ? 'text-[#56A867]' : 'text-emerald-600'}`}
                  >
                    {language === 'en' ? 'Log in here' : 'Inicia sesión aquí'}
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
                  {language === 'en' ? 'PROFESSIONAL ACCESS SECURITY' : 'Seguridad de Acceso Profesional'}
                </span>
                <h1 className={`text-2xl font-serif font-bold mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {language === 'en' ? 'Email Verification • 6 Digits' : 'Verificación de Correo • 6 Dígitos'}
                </h1>
                <p className={`text-xs mt-1 ${isDark ? 'text-[#8E8E9E]' : 'text-slate-500'}`}>
                  {language === 'en'
                    ? <>We generated and sent a numeric code to your institutional email <strong>{email}</strong>.</>
                    : <>Hemos generado y enviado un código numérico a tu correo institucional <strong>{email}</strong>.</>}
                </p>
              </div>

              {/* Email Sent Notification Banner */}
              {codeNotification && (
                <div className="p-3.5 rounded-xl bg-[#56A867]/10 border border-[#56A867]/30 text-xs font-mono text-[#56A867] flex items-center gap-2.5">
                  <Mail className="w-4 h-4 shrink-0" />
                  <span>
                    {codeNotification}
                  </span>
                </div>
              )}

              {/* Generated Code Helper Card */}
              {availableCode && (
                <div className="p-3.5 rounded-xl bg-[#56A867]/15 border border-[#56A867]/40 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#56A867]/20 text-[#56A867] flex items-center justify-center font-bold">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-mono uppercase text-[#56A867] font-bold block">
                        {language === 'en' ? 'Generated Verification Code:' : 'Código de Verificación Generado:'}
                      </span>
                      <span className="text-xl font-mono font-black text-white tracking-widest">{availableCode}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setInputCode(availableCode)}
                    className="px-3 py-1.5 rounded-lg bg-[#56A867] hover:bg-[#64B875] text-black font-black text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md"
                  >
                    {language === 'en' ? 'Autofill' : 'Autocompletar'}
                  </button>
                </div>
              )}

              {/* 6 Digit Code Input */}
              <div className="space-y-2 text-center py-2">
                <label className={`text-xs font-mono block ${isDark ? 'text-[#B0B0C0]' : 'text-slate-700'}`}>
                  {language === 'en'
                    ? 'Enter the 6-digit numeric code received in your email (valid 10 minutes):'
                    : 'Ingresa los 6 dígitos numéricos recibidos en tu correo (válido 10 minutos):'}
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
                  className={`w-full py-3 px-6 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 uppercase tracking-wider cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                    isDark
                      ? 'bg-[#56A867] hover:bg-[#64B875] text-black shadow-[0_0_20px_rgba(86,168,103,0.25)]'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {isSendingCode
                      ? (language === 'en' ? 'Validating...' : 'Validando...')
                      : (language === 'en' ? 'Verify and Proceed to Biometrics' : 'Verificar y Continuar a Biometría')}
                  </span>
                </button>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 text-xs font-mono">
                  <span className={isDark ? 'text-neutral-400' : 'text-slate-500'}>
                    {resendTimer > 0 ? (
                      `⏱️ ${language === 'en' ? 'Resend in' : 'Reenviar código en'} ${resendTimer}s`
                    ) : (
                      <span className="text-[#56A867] font-semibold">{language === 'en' ? 'Ready to resend' : 'Puedes reenviar el código'}</span>
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
                        ? isDark ? 'text-amber-400 cursor-pointer' : 'text-amber-600 cursor-pointer'
                        : 'text-neutral-500 cursor-not-allowed opacity-60'
                    }`}
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{language === 'en' ? 'Resend code' : 'Reenviar código'}</span>
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 text-xs font-mono border-t border-neutral-800/40">
                  <button
                    type="button"
                    onClick={handleChangeEmail}
                    className={`hover:underline cursor-pointer ${
                      isDark ? 'text-neutral-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    {language === 'en' ? 'Modify email or data' : 'Modificar correo o datos'}
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

          {/* STEP 2: Registro Biométrico del Entrenador */}
          {step === 2 && (
            <form onSubmit={handleStep2Complete} className="space-y-4">
              <div>
                <h1 className={`text-2xl font-serif font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {language === 'en' ? 'Biometric Profile & Physical Parameters' : 'Registro Biométrico & Parámetros Físicos'}
                </h1>
                <p className={`text-xs mt-1 ${isDark ? 'text-[#8E8E9E]' : 'text-slate-500'}`}>
                  {language === 'en'
                    ? 'Enter your country, phone, and body dimensions to calibrate your initial prescription protocol.'
                    : 'Ingresa tu país, teléfono y medidas físicas para calibrar tu protocolo inicial de prescripción.'}
                </p>
              </div>

              {/* País y Teléfono */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className={`text-xs font-mono flex items-center gap-1.5 ${isDark ? 'text-[#B0B0C0]' : 'text-slate-700'}`}>
                    <Globe className={`w-3.5 h-3.5 ${isDark ? 'text-[#56A867]' : 'text-emerald-600'}`} />
                    <span>{language === 'en' ? 'Operating Country *' : 'País de Operación *'}</span>
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
                    <span>{language === 'en' ? 'Direct Phone Number *' : 'Número de Teléfono Directo *'}</span>
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
                      placeholder={language === 'en' ? 'Phone number' : 'Número de teléfono'}
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
                  <span>{language === 'en' ? 'Body Type (Coach Somatotype) *' : 'Tipo de Cuerpo (Somatotipo del Entrenador) *'}</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {[
                    {
                      type: 'Ectomorfo' as BodyType,
                      title: language === 'en' ? 'Ectomorph' : 'Ectomorfo',
                      desc: language === 'en' ? 'Lean build, long limbs, leverages specialist.' : 'Estructura esbelta, extremidades largas, especialista en palancas.',
                    },
                    {
                      type: 'Mesomorfo' as BodyType,
                      title: language === 'en' ? 'Mesomorph' : 'Mesomorfo',
                      desc: language === 'en' ? 'Athletic build, optimal lean mass to strength ratio.' : 'Estructura atlética, proporción óptima masa magra/fuerza.',
                    },
                    {
                      type: 'Endomorfo' as BodyType,
                      title: language === 'en' ? 'Endomorph' : 'Endomorfo',
                      desc: language === 'en' ? 'Dense and broad build, high power and joint stability.' : 'Estructura densa y ancha, alta potencia y estabilidad articular.',
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
                      <span>{language === 'en' ? 'Height (cm) *' : 'Altura (cm) *'}</span>
                    </label>
                    <span className="text-xs font-mono font-bold text-emerald-500">
                      {heightCm ? `${heightCm} cm` : (language === 'en' ? 'Unrecorded' : 'Sin registrar')}
                    </span>
                  </div>
                  <input
                    type="number"
                    min={120}
                    max={230}
                    required
                    value={heightCm}
                    placeholder="cm"
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
                    value={heightCm || 172}
                    onChange={(e) => setHeightCm(Number(e.target.value))}
                    className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-neutral-700 rounded-lg"
                  />
                </div>

                {/* Peso */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className={`text-xs font-mono flex items-center gap-1 ${isDark ? 'text-[#B0B0C0]' : 'text-slate-700'}`}>
                      <Weight className="w-3.5 h-3.5 text-emerald-500" />
                      <span>{language === 'en' ? 'Weight (kg) *' : 'Peso (kg) *'}</span>
                    </label>
                    <span className="text-xs font-mono font-bold text-emerald-500">
                      {weightKg ? `${weightKg} kg` : (language === 'en' ? 'Unrecorded' : 'Sin registrar')}
                    </span>
                  </div>
                  <input
                    type="number"
                    min={35}
                    max={200}
                    required
                    value={weightKg}
                    placeholder="kg"
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
                    value={weightKg || 68}
                    onChange={(e) => setWeightKg(Number(e.target.value))}
                    className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-neutral-700 rounded-lg"
                  />
                </div>

                {/* Talla */}
                <div className="space-y-1">
                  <label className={`text-xs font-mono flex items-center gap-1 ${isDark ? 'text-[#B0B0C0]' : 'text-slate-700'}`}>
                    <span>{language === 'en' ? 'Apparel Size *' : 'Talla de Indumentaria *'}</span>
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
                    {language === 'en' ? 'Sportfitness Pro Coach uniform assignment.' : 'Asignación de uniforme oficial Sportfitness Pro Coach.'}
                  </p>
                </div>
              </div>

              {/* Terms */}
              <label className="flex items-start gap-2 text-xs cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="rounded text-emerald-500 focus:ring-0 w-4 h-4 accent-emerald-500 mt-0.5"
                />
                <span className={isDark ? 'text-neutral-300' : 'text-slate-600'}>
                  {language === 'en'
                    ? 'I accept the trainer code of ethics, credentials verification, and Sportfitness prescription methodology.'
                    : 'Acepto el código ético de entrenadores, verificación de credenciales y metodología de prescripción de Sportfitness.'}
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
                  {language === 'en' ? 'Back' : 'Atrás'}
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
                  <span>{language === 'en' ? 'Calculate Protocol & Starting Exercise' : 'Calcular Protocolo & Ejercicio de Inicio'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: Revelación del Protocolo y Ejercicio de Inicio para Entrenador */}
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
                  <Award className="w-3.5 h-3.5" />
                  <span>{language === 'en' ? 'Initial Coach Protocol Generated' : 'Protocolo Inicial de Entrenador Generado'}</span>
                </div>
                <h1 className={`text-2xl sm:text-3xl font-serif font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {language === 'en' ? 'Starting Exercise for Initial Athlete Assessment' : 'Ejercicio de Inicio para Evaluación Inicial de Atletas'}
                </h1>
                <p className={`text-xs mt-1 ${isDark ? 'text-[#8E8E9E]' : 'text-slate-500'}`}>
                  {language === 'en'
                    ? `Based on your specialty ${specialty} and somatotype ${bodyType} (${heightCm} cm, ${weightKg} kg, Size ${clothingSize}).`
                    : `Basado en tu especialidad ${specialty} y tu somatotipo ${bodyType} (${heightCm} cm, ${weightKg} kg, Talla ${clothingSize}).`}
                </p>
              </div>

              {/* Unique Trainer Identification Badge */}
              <div
                className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                  isDark
                    ? 'bg-[#181824] border-[#56A867]/50 shadow-[0_0_20px_rgba(86,168,103,0.15)]'
                    : 'bg-emerald-50 border-emerald-300 shadow-sm'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#56A867]/20 flex items-center justify-center text-[#56A867] shrink-0">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[11px] font-mono uppercase font-bold text-[#56A867]">
                      {language === 'en'
                        ? 'Trainer Identification Number (Sent to your Email)'
                        : 'Número de Identificación de Entrenador (Enviado a tu Correo)'}
                    </div>
                    <div className={`text-xs mt-0.5 leading-relaxed ${isDark ? 'text-neutral-300' : 'text-slate-700'}`}>
                      {language === 'en'
                        ? `Your Identification Number that distinguishes you among coaches is: ${assignedTrainerCode || 'ENT-XXXXX'}. It will only be sent to you once and will be required to log in to the platform.`
                        : `su Numero de Identificacion que lo distinguira entre los entrenadores es: ${assignedTrainerCode || 'ENT-XXXXX'} solo se le enviara 1 vez y sera necesario para iniciar sesion en la pagina`}
                    </div>
                  </div>
                </div>
                {assignedTrainerCode && (
                  <div className="px-3.5 py-1.5 rounded-xl font-mono text-base font-bold bg-[#56A867] text-black shrink-0 tracking-wider">
                    {assignedTrainerCode}
                  </div>
                )}
              </div>

              {/* Protocol Starter Card */}
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
                      {language === 'en' ? 'Diagnostic Protocol • ' : 'Protocolo de Diagnóstico • '}{starterExercise.category}
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
                    {language === 'en' ? 'Initial Pattern Load' : 'Carga Patrón Inicial'}: {starterExercise.suggestedWeightKg} kg
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 py-4 text-center">
                  <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-[#171720] border-[#262634]' : 'bg-white border-slate-200'}`}>
                    <div className="text-[10px] font-mono text-neutral-400 uppercase">
                      {language === 'en' ? 'Diagnostic Sets' : 'Series Diagnóstico'}
                    </div>
                    <div className="text-base font-mono font-bold text-emerald-500">
                      {starterExercise.sets} {language === 'en' ? 'sets' : 'series'}
                    </div>
                  </div>
                  <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-[#171720] border-[#262634]' : 'bg-white border-slate-200'}`}>
                    <div className="text-[10px] font-mono text-neutral-400 uppercase">
                      {language === 'en' ? 'Guide Reps' : 'Repeticiones Guía'}
                    </div>
                    <div className={`text-base font-mono font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {starterExercise.reps}
                    </div>
                  </div>
                  <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-[#171720] border-[#262634]' : 'bg-white border-slate-200'}`}>
                    <div className="text-[10px] font-mono text-neutral-400 uppercase">
                      {language === 'en' ? 'Initial RPE' : 'RPE Inicial'}
                    </div>
                    <div className={`text-xs font-mono font-bold ${isDark ? 'text-neutral-200' : 'text-slate-800'}`}>
                      {starterExercise.rpeTarget}
                    </div>
                  </div>
                  <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-[#171720] border-[#262634]' : 'bg-white border-slate-200'}`}>
                    <div className="text-[10px] font-mono text-neutral-400 uppercase">
                      {language === 'en' ? 'Optimal Rest' : 'Descanso Óptimo'}
                    </div>
                    <div className={`text-base font-mono font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {starterExercise.restSeconds}s
                    </div>
                  </div>
                </div>

                {/* Biomechanical Cues for Coaches */}
                <div className="space-y-3 pt-2">
                  <div className={`p-3 rounded-xl text-xs leading-relaxed ${isDark ? 'bg-[#111118] text-neutral-300' : 'bg-white text-slate-700 border border-slate-200'}`}>
                    <strong className="text-emerald-500 block mb-1">
                      {language === 'en' ? 'Prescription Technical Criteria:' : 'Criterio Técnico de Prescripción:'}
                    </strong>
                    {starterExercise.whyThisExercise}
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-[11px] font-mono font-bold text-neutral-400 uppercase">
                      {language === 'en' ? 'Assessment Checklist for Your Clients:' : 'Checklist de Evaluación para tus Clientes:'}
                    </span>
                    <ul className="space-y-1.5">
                      {starterExercise.biomechanicalCues.map((cue, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-xs">
                          <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
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
                  onClick={() => handleFinalizeRegistration('trainer-overview')}
                  className={`w-full py-3.5 px-6 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 uppercase tracking-wider cursor-pointer ${
                    isDark
                      ? 'bg-[#56A867] hover:bg-[#64B875] text-black shadow-[0_0_25px_rgba(86,168,103,0.3)]'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg'
                  }`}
                >
                  <Shield className="w-4 h-4" />
                  <span>
                    {loading
                      ? (language === 'en' ? 'Entering Dashboard...' : 'Accediendo al Panel...')
                      : (language === 'en' ? 'Enter Coach Management Dashboard' : 'Ingresar al Panel de Gestión de Entrenadores')}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleFinalizeRegistration('routines')}
                  className={`w-full py-3 px-6 rounded-xl text-xs font-semibold border transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    isDark
                      ? 'bg-[#14141A] hover:bg-[#1D1D26] border-[#2A2A38] text-neutral-300'
                      : 'bg-white hover:bg-slate-50 border-slate-300 text-slate-800'
                  }`}
                >
                  <span>
                    {language === 'en'
                      ? 'Explore Routine Catalog & Prescribe to Athletes'
                      : 'Explorar Catálogo de Rutinas & Prescribir a Atletas'}
                  </span>
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
