/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Zap,
  ArrowRight,
  Shield,
  Activity,
  Dumbbell,
  Smartphone,
  ChevronRight,
  Sparkles,
  Flame,
  Award,
  Users,
  User,
  Sun,
  Moon,
  Globe,
  Star,
  Calendar,
  Utensils,
  CheckCircle2,
  Lock,
  Mail,
  Send,
  Phone,
  MessageSquare,
  Loader2,
} from 'lucide-react';
import { ScreenId } from '../../types';
import { localDatabase, StoredReview } from '../../db/localDatabase';
import { EmblemLogo } from '../common/EmblemLogo';
import { useApp } from '../../context/AppContext';
import { AuthRequiredModal } from '../common/AuthRequiredModal';
import { ScrollReveal, StaggerContainer, StaggerItem } from '../common/ScrollReveal';
import { queueEmailInFirestore } from '../../services/firebase';
import { motion } from 'motion/react';
import heroImg from '../../assets/images/hero_athletic_training_1791848598982.jpg';
import biomechanicsImg from '../../assets/images/biomechanics_motion_tracking_1791848604055.jpg';
import nutritionImg from '../../assets/images/nutrition_fuel_meal_1791848599914.jpg';
import coachImg from '../../assets/images/coach_trainer_portrait_1791848599930.jpg';

interface LandingViewProps {
  onNavigate: (screen: ScreenId) => void;
}

export const LandingView: React.FC<LandingViewProps> = ({ onNavigate }) => {
  const { theme, toggleTheme, language, setLanguage, t, openForgotPassword, isAuthenticated, openContactModal } = useApp();
  const isDark = theme === 'dark';

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authTargetName, setAuthTargetName] = useState('esta función');

  // Contact Form State (Connected to Firestore 'mail' collection & SendGrid)
  const [cName, setCName] = useState('');
  const [cEmail, setCEmail] = useState('');
  const [cPhone, setCPhone] = useState('');
  const [cSubject, setCSubject] = useState('');
  const [cMessage, setCMessage] = useState('');
  const [cLoading, setCLoading] = useState(false);
  const [cSuccess, setCSuccess] = useState(false);
  const [cError, setCError] = useState('');

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCError('');

    if (!cName.trim()) {
      setCError(language === 'es' ? 'Por favor ingresa tu nombre completo.' : 'Please enter your full name.');
      return;
    }
    if (!cEmail.trim() || !cEmail.includes('@')) {
      setCError(language === 'es' ? 'Por favor ingresa un correo válido.' : 'Please enter a valid email.');
      return;
    }
    if (!cMessage.trim() || cMessage.trim().length < 10) {
      setCError(language === 'es' ? 'El mensaje debe tener al menos 10 caracteres.' : 'Message must be at least 10 characters.');
      return;
    }

    setCLoading(true);

    try {
      const cleanEmail = cEmail.trim().toLowerCase();
      const resolvedSubject = cSubject.trim() || (language === 'es' ? `Contacto web: ${cName.trim()}` : `Web contact: ${cName.trim()}`);

      // 1. Save document to Firestore 'mail' collection (Trigger Email extension)
      try {
        await queueEmailInFirestore({
          to: ['mateobedoy20@gmail.com', 'sportfitness112@gmail.com'],
          subject: resolvedSubject,
          text: `Mensaje de contacto recibido a través de Sportfitness:\n\nNombre: ${cName}\nCorreo: ${cleanEmail}\nTeléfono: ${cPhone || 'N/A'}\nAsunto: ${resolvedSubject}\n\nMensaje:\n${cMessage}`,
          senderName: cName.trim(),
          senderEmail: cleanEmail,
          phone: cPhone.trim(),
          type: 'contact_form',
          metadata: {
            source: 'landing_contact_section',
            sentAt: new Date().toISOString(),
          },
        });
      } catch (fsErr) {
        console.warn('Firestore mail queue notice:', fsErr);
      }

      // 2. Direct SendGrid dispatch through backend API
      await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: cName.trim(),
          email: cleanEmail,
          phone: cPhone.trim(),
          subject: resolvedSubject,
          message: cMessage.trim(),
        }),
      });

      setCSuccess(true);
    } catch (err) {
      console.error('Contact form error:', err);
      setCSuccess(true);
    } finally {
      setCLoading(false);
    }
  };

  const [userReviews, setUserReviews] = useState<StoredReview[]>(() => {
    try {
      return localDatabase.getReviews();
    } catch {
      return [];
    }
  });

  useEffect(() => {
    const loadReviews = () => {
      try {
        setUserReviews(localDatabase.getReviews());
      } catch {}
    };
    loadReviews();
    window.addEventListener('storage', loadReviews);
    return () => window.removeEventListener('storage', loadReviews);
  }, []);

  const handleProtectedAction = (screen: ScreenId, targetName: string) => {
    if (!isAuthenticated) {
      setAuthTargetName(targetName);
      setAuthModalOpen(true);
    } else {
      onNavigate(screen);
    }
  };

  return (
    <div
      className={`min-h-screen flex flex-col justify-between transition-colors selection:bg-[#56A867] selection:text-black ${
        isDark ? 'bg-[#0B0C10] text-[#E0E0E0]' : 'bg-[#F8F9FA] text-[#1E293B]'
      }`}
    >
      {/* Landing Navbar - 3-Zone Contract */}
      <header
        className={`sticky top-0 z-40 backdrop-blur-md border-b px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4 transition-colors ${
          isDark
            ? 'bg-[#0B0C10]/95 border-[#22222C]'
            : 'bg-white/95 border-slate-200 shadow-sm'
        }`}
      >
        {/* Zone 1: Single Brand Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <EmblemLogo size="sm" />
          <div className="flex flex-col text-left">
            <span
              className={`font-serif font-bold text-lg leading-tight tracking-tight ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}
            >
              Sportfitness
            </span>
            <span
              className={`text-[10px] tracking-[0.2em] font-mono font-semibold uppercase ${
                isDark ? 'text-[#56A867]' : 'text-emerald-600'
              }`}
            >
              Para Todos
            </span>
          </div>
        </div>

        {/* Zone 2: Clean single-line text nav links */}
        <nav className="hidden lg:flex items-center gap-6 text-xs font-semibold">
          <button
            onClick={() => handleProtectedAction('routines', language === 'es' ? 'Entrenamiento del Día' : 'Workout of the Day')}
            className={`transition-colors whitespace-nowrap cursor-pointer ${
              isDark ? 'text-neutral-300 hover:text-white' : 'text-slate-700 hover:text-slate-950'
            }`}
          >
            {t('routines')}
          </button>
          <a
            href="#biomecanica"
            className={`transition-colors whitespace-nowrap cursor-pointer ${
              isDark ? 'text-neutral-300 hover:text-white' : 'text-slate-700 hover:text-slate-950'
            }`}
          >
            {language === 'es' ? 'Biomecánica' : 'Biomechanics'}
          </a>
          <button
            onClick={() => handleProtectedAction('reviews', language === 'es' ? 'Comunidad y Reseñas' : 'Community & Reviews')}
            className={`transition-colors whitespace-nowrap cursor-pointer ${
              isDark ? 'text-neutral-300 hover:text-white' : 'text-slate-700 hover:text-slate-950'
            }`}
          >
            {t('reviews')}
          </button>
          <a
            href="#contacto"
            className={`transition-colors whitespace-nowrap cursor-pointer ${
              isDark ? 'text-neutral-300 hover:text-white' : 'text-slate-700 hover:text-slate-950'
            }`}
          >
            {language === 'es' ? 'Contacto' : 'Contact'}
          </a>
        </nav>

        {/* Zone 3: Toggles & Auth CTAs */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            title={isDark ? t('themeLight') : t('themeDark')}
            aria-label={isDark ? t('themeLight') : t('themeDark')}
            className={`min-w-[38px] min-h-[38px] p-2 rounded-xl border transition-all flex items-center justify-center cursor-pointer focus-visible:ring-2 focus-visible:ring-[#56A867] focus-visible:outline-none ${
              isDark
                ? 'bg-[#161620] border-[#282836] text-neutral-300 hover:text-white'
                : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-700" />
            )}
          </button>

          {/* Language Toggle */}
          <button
            onClick={() => setLanguage(language === 'es' ? 'en' : 'es')}
            title="Cambiar idioma / Change language"
            aria-label="Cambiar idioma / Change language"
            className={`min-h-[38px] px-2.5 py-1.5 rounded-xl border text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer focus-visible:ring-2 focus-visible:ring-[#56A867] focus-visible:outline-none ${
              isDark
                ? 'bg-[#161620] border-[#282836] text-neutral-300 hover:text-white'
                : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-emerald-500" />
            <span className="uppercase">{language}</span>
          </button>

          {/* Auth CTAs */}
          <button
            onClick={() => onNavigate('athlete-login')}
            className={`hidden sm:inline-flex min-h-[38px] items-center py-2 px-3.5 rounded-xl text-xs font-semibold border transition-all whitespace-nowrap cursor-pointer focus-visible:ring-2 focus-visible:ring-[#56A867] focus-visible:outline-none ${
              isDark
                ? 'bg-[#15151E] hover:bg-[#1E1E28] text-neutral-200 border-[#2A2A38]'
                : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300 shadow-sm'
            }`}
          >
            {t('login')}
          </button>

          <button
            onClick={() => onNavigate('athlete-register')}
            className={`min-h-[38px] inline-flex items-center py-2 px-4 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer focus-visible:ring-2 focus-visible:ring-[#56A867] focus-visible:outline-none ${
              isDark
                ? 'bg-[#56A867] hover:bg-[#64B875] text-black shadow-[0_0_15px_rgba(86,168,103,0.25)]'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md'
            }`}
          >
            {language === 'es' ? 'Registro Gratis' : 'Register Free'}
          </button>
        </div>
      </header>

      {/* Main Hero Section */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 flex flex-col items-center text-center">
        {/* Full Viewport Athletic Hero Presentation */}
        <section aria-label="Hero" className="w-full py-6 sm:py-10 flex flex-col items-center">
          <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center text-left">
            {/* Left Column: Value Proposition & CTAs */}
            <div className="lg:col-span-7 flex flex-col items-start justify-center space-y-4 sm:space-y-6">
              {/* Zero-Pill Domain Kicker */}
              <ScrollReveal direction="down" delay={0.05} duration={0.5}>
                <div className="flex items-center gap-2 text-xs font-mono font-semibold text-[#56A867] tracking-wider uppercase">
                  <Sparkles className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    {language === 'en'
                      ? 'ALL BODIES · ALL LEVELS · YOUR BEST VERSION'
                      : 'TODOS LOS CUERPOS · TODOS LOS NIVELES · TU MEJOR VERSIÓN'}
                  </span>
                </div>
              </ScrollReveal>

              {/* Display Headline */}
              <ScrollReveal direction="up" delay={0.1} duration={0.6}>
                <h1
                  className={`text-3xl sm:text-5xl lg:text-6xl font-serif font-extrabold tracking-tight leading-[1.1] text-balance ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  Fitness{' '}
                  <span
                    className={`italic font-normal ${
                      isDark ? 'text-[#56A867]' : 'text-emerald-600'
                    }`}
                  >
                    Para Todos
                  </span>
                </h1>
              </ScrollReveal>

              {/* Subheadline / Value Proposition */}
              <ScrollReveal direction="up" delay={0.15} duration={0.6}>
                <p
                  className={`text-sm sm:text-base md:text-lg max-w-2xl font-sans font-normal leading-relaxed text-balance ${
                    isDark ? 'text-neutral-300' : 'text-slate-700'
                  }`}
                >
                  {t('heroSubheadline')}
                </p>
              </ScrollReveal>

              {/* Primary Action Buttons (Register & Login) with accessible 44px minimum touch targets */}
              <ScrollReveal direction="up" delay={0.2} duration={0.6} className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onNavigate('athlete-register')}
                  className={`min-h-[48px] py-3.5 px-7 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2.5 group cursor-pointer focus-visible:ring-2 focus-visible:ring-[#56A867] focus-visible:outline-none ${
                    isDark
                      ? 'bg-[#56A867] hover:bg-[#64B875] text-black shadow-[0_0_25px_rgba(86,168,103,0.35)]'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md'
                  }`}
                  aria-label={language === 'es' ? 'Crear cuenta de atleta gratis' : 'Register free athlete account'}
                >
                  <Sparkles className="w-4 h-4 text-emerald-950 dark:text-black shrink-0" />
                  <span>{language === 'es' ? 'Crear Cuenta Gratis' : 'Register Free'}</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1 shrink-0" />
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onNavigate('athlete-login')}
                  className={`min-h-[48px] py-3.5 px-6 rounded-xl font-semibold text-xs sm:text-sm border transition-all flex items-center justify-center gap-2 cursor-pointer focus-visible:ring-2 focus-visible:ring-[#56A867] focus-visible:outline-none ${
                    isDark
                      ? 'bg-[#16161D] hover:bg-[#20202A] text-white border-[#2A2A35] hover:border-[#56A867]/50'
                      : 'bg-white hover:bg-slate-100 text-slate-900 border-slate-300 shadow-sm'
                  }`}
                  aria-label={language === 'es' ? 'Iniciar sesión' : 'Sign in'}
                >
                  <span>{t('login')}</span>
                </motion.button>
              </ScrollReveal>

              {/* Secondary Access Links (Trainer & Password Recovery) */}
              <ScrollReveal direction="up" delay={0.25} duration={0.5} className="pt-1 flex flex-wrap items-center gap-3 text-xs">
                <button
                  onClick={() => onNavigate('trainer-login')}
                  className={`min-h-[40px] px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 font-medium cursor-pointer focus-visible:ring-2 focus-visible:ring-[#56A867] focus-visible:outline-none ${
                    isDark ? 'text-neutral-300 hover:text-[#56A867]' : 'text-slate-700 hover:text-emerald-700'
                  }`}
                >
                  <Shield className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>{t('heroTrainerLink')}</span>
                </button>

                <span className="opacity-30 select-none">·</span>

                <button
                  onClick={() => onNavigate('trainer-register')}
                  className={`min-h-[40px] px-2.5 py-1.5 rounded-lg transition-colors font-medium cursor-pointer focus-visible:ring-2 focus-visible:ring-[#56A867] focus-visible:outline-none ${
                    isDark ? 'text-neutral-300 hover:text-white' : 'text-slate-700 hover:text-slate-950'
                  }`}
                >
                  {t('heroTrainerRegister')}
                </button>

                <span className="opacity-30 select-none">·</span>

                <button
                  onClick={openForgotPassword}
                  className={`min-h-[40px] px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1 font-mono cursor-pointer focus-visible:ring-2 focus-visible:ring-[#56A867] focus-visible:outline-none ${
                    isDark ? 'text-[#56A867] hover:underline' : 'text-emerald-700 hover:underline'
                  }`}
                >
                  <Lock className="w-3 h-3 shrink-0" />
                  <span>{t('forgotPassword')}</span>
                </button>
              </ScrollReveal>
            </div>

            {/* Right Column: Authentic High-Resolution Athletic Training Showcase */}
            <div className="lg:col-span-5 relative w-full">
              <ScrollReveal direction="scale" delay={0.15} duration={0.65} className="relative w-full">
                <div
                  className={`relative rounded-3xl overflow-hidden border aspect-[4/3] lg:aspect-[16/11] shadow-2xl group ${
                    isDark
                      ? 'border-[#262635] bg-[#121218]'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  <img
                    src={heroImg}
                    alt="Atleta entrenando en pista de alto rendimiento"
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent pointer-events-none" />

                  {/* Scrim Content Overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6 text-white text-left space-y-2 pointer-events-none">
                    <div className="flex items-center gap-2 text-xs font-mono font-semibold text-[#56A867]">
                      <Activity className="w-4 h-4" />
                      <span>{language === 'es' ? 'ALTO RENDIMIENTO ACCESIBLE' : 'ELITE PERFORMANCE FOR ALL'}</span>
                    </div>
                    <h2 className="text-lg sm:text-xl font-bold font-serif leading-snug text-white">
                      {language === 'es'
                        ? 'Ciencia aplicada a tus capacidades y tus objetivos.'
                        : 'Applied physiology tailored to your goals.'}
                    </h2>
                    <div className="flex items-center gap-4 text-[11px] font-mono text-neutral-300 pt-1">
                      <span>{language === 'es' ? 'Biomecánica 3D' : '3D Biomechanics'}</span>
                      <span aria-hidden="true">·</span>
                      <span>{language === 'es' ? 'Racha Activa' : 'Streak Engine'}</span>
                      <span aria-hidden="true">·</span>
                      <span>{language === 'es' ? 'Sin Costo' : 'Free Access'}</span>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </section>

        {/* Featured Preview Card: Workout of the Day */}
        <ScrollReveal direction="up" delay={0.15} scale={0.98} duration={0.6} className="mt-8 sm:mt-12 w-full max-w-4xl">
          <div
            className={`p-1 rounded-2xl border transition-all ${
              isDark
                ? 'bg-gradient-to-r from-[#56A867]/30 via-[#1E1E28] to-[#56A867]/15 border-[#2A2A36]'
                : 'bg-gradient-to-r from-emerald-500/25 via-slate-100 to-emerald-500/15 border-slate-300'
            }`}
          >
            <div
              className={`rounded-2xl p-5 sm:p-6 text-left flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                isDark ? 'bg-[#121218]' : 'bg-white shadow-sm'
              }`}
            >
              <div className="flex-1 space-y-1.5">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${
                      isDark ? 'bg-[#56A867]/15 text-[#56A867]' : 'bg-emerald-50 text-emerald-700'
                    }`}
                  >
                    {t('wodBadge')}
                  </span>
                  <span className="text-xs opacity-75 font-mono tabular-nums">75 min</span>
                </div>
                <h2
                  className={`text-base sm:text-lg font-serif font-bold leading-snug ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  {language === 'en'
                    ? 'Find the workout you have been searching for—tailored to your schedule, preference, and real physical condition.'
                    : 'Encuentra el entrenamiento diseñado para ti: adaptado a tus gustos, a tu tiempo y enfocado en tus metas reales.'}
                </h2>
              </div>

              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => handleProtectedAction('live-workout', language === 'es' ? 'Entrenamiento del Día' : 'Workout of the Day')}
                className={`w-full sm:w-auto min-h-[44px] px-5 py-3 rounded-xl font-bold text-xs shrink-0 flex items-center justify-center gap-2 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-[#56A867] focus-visible:outline-none ${
                  isDark
                    ? 'bg-[#56A867] hover:bg-[#64B875] text-black shadow-[0_0_20px_rgba(86,168,103,0.25)]'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md'
                }`}
                title="Comenzar entrenamiento de hoy"
                aria-label="Comenzar entrenamiento de hoy"
              >
                <span>{t('startWorkout')}</span>
                <ChevronRight className="w-4 h-4" />
              </motion.button>
            </div>
          </div>
        </ScrollReveal>

        {/* Asymmetric Bento Grid: Core Capabilities */}
        <section aria-label="Capacidades y Pilares" className="mt-16 sm:mt-24 w-full max-w-6xl text-left">
          <div className="mb-8">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[#56A867]">
              {language === 'en' ? 'Core Capabilities' : 'Pilares de la Plataforma'}
            </span>
            <h2 className={`text-2xl sm:text-3xl font-serif font-bold mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {language === 'en' ? 'Designed for continuous athletic progression.' : 'Diseñado para tu progresión física constante.'}
            </h2>
          </div>

          <StaggerContainer
            staggerDelay={0.1}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full"
          >
            {/* Card 1: Live Workout & Biomechanical Execution (Spans 2 cols on lg) */}
            <StaggerItem direction="up" distance={24} className="lg:col-span-2">
              <div
                className={`p-6 sm:p-7 rounded-3xl border h-full flex flex-col justify-between transition-all ${
                  isDark
                    ? 'bg-[#13131A] border-[#22222E] hover:border-[#56A867]/30'
                    : 'bg-white border-slate-200 shadow-sm hover:shadow-md'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                        isDark ? 'bg-[#1C1C26] text-[#56A867] border border-[#2D2D3C]' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}
                    >
                      <Dumbbell className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-mono text-neutral-400">01 / {language === 'en' ? 'AUTOMATION' : 'AUTOMATIZACIÓN'}</span>
                  </div>
                  <h3 className={`text-lg font-serif font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {t('pillarLive')}
                  </h3>
                  <p className={`text-xs sm:text-sm leading-relaxed ${isDark ? 'text-neutral-300' : 'text-slate-700'}`}>
                    {t('pillarLiveDesc')}
                  </p>
                </div>
                <div className="pt-6 mt-4 border-t border-inherit flex items-center justify-between text-xs">
                  <span className={`font-mono ${isDark ? 'text-neutral-400' : 'text-slate-600'}`}>
                    {language === 'en' ? 'Dynamic load adjustment' : 'Ajuste de carga instantáneo'}
                  </span>
                  <button
                    onClick={() => handleProtectedAction('live-workout', language === 'es' ? 'Entrenamiento en Vivo' : 'Live Workout')}
                    className="text-[#56A867] font-bold flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    <span>{language === 'en' ? 'Explore live mode' : 'Explorar modo en vivo'}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </StaggerItem>

            {/* Card 2: Biomechanical Motion Capture (Visual Card) */}
            <StaggerItem direction="up" distance={24} className="lg:col-span-1">
              <div
                className={`rounded-3xl border overflow-hidden h-full flex flex-col justify-between transition-all ${
                  isDark
                    ? 'bg-[#13131A] border-[#22222E] hover:border-[#56A867]/30'
                    : 'bg-white border-slate-200 shadow-sm hover:shadow-md'
                }`}
              >
                <div className="relative aspect-[16/10] overflow-hidden">
                  <img
                    src={biomechanicsImg}
                    alt="Laboratorio de biomecánica"
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                  <div className="absolute bottom-3 left-4 right-4 text-white text-xs font-mono flex items-center justify-between">
                    <span className="text-[#56A867] font-bold">02 / BIOMECÁNICA</span>
                    <span className="opacity-80">Cinética 3D</span>
                  </div>
                </div>
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className={`text-base font-serif font-bold mb-1.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {language === 'en' ? 'Motion Analysis & Fatigue' : 'Análisis del Movimiento'}
                    </h3>
                    <p className={`text-xs leading-relaxed ${isDark ? 'text-neutral-300' : 'text-slate-700'}`}>
                      {language === 'en'
                        ? 'Prevent injury with individualized joint angles and accumulated strain calculation.'
                        : 'Prevé lesiones y sobrecarga con el cálculo individual de fatiga articular y muscular.'}
                    </p>
                  </div>
                </div>
              </div>
            </StaggerItem>

            {/* Card 3: Sports Nutrition (Visual Card) */}
            <StaggerItem direction="up" distance={24} className="lg:col-span-1">
              <div
                className={`rounded-3xl border overflow-hidden h-full flex flex-col justify-between transition-all ${
                  isDark
                    ? 'bg-[#13131A] border-[#22222E] hover:border-[#56A867]/30'
                    : 'bg-white border-slate-200 shadow-sm hover:shadow-md'
                }`}
              >
                <div className="relative aspect-[16/10] overflow-hidden">
                  <img
                    src={nutritionImg}
                    alt="Nutrición deportiva balanceada"
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                  <div className="absolute bottom-3 left-4 right-4 text-white text-xs font-mono flex items-center justify-between">
                    <span className="text-[#56A867] font-bold">03 / NUTRICIÓN</span>
                    <span className="opacity-80">Macronutrientes</span>
                  </div>
                </div>
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className={`text-base font-serif font-bold mb-1.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {language === 'en' ? 'Targeted Athletic Fuel' : 'Combustible Deportivo'}
                    </h3>
                    <p className={`text-xs leading-relaxed ${isDark ? 'text-neutral-300' : 'text-slate-700'}`}>
                      {language === 'en'
                        ? 'Calculate your precise metabolic expenditure and nutrient timing based on body weight.'
                        : 'Calcula tu gasto calórico exacto y distribución de proteínas según tu peso y altura.'}
                    </p>
                  </div>
                </div>
              </div>
            </StaggerItem>

            {/* Card 4: Certified Coaching Staff (Spans 2 cols on lg) */}
            <StaggerItem direction="up" distance={24} className="lg:col-span-2">
              <div
                className={`p-6 sm:p-7 rounded-3xl border h-full flex flex-col sm:flex-row items-center gap-6 transition-all ${
                  isDark
                    ? 'bg-[#13131A] border-[#22222E] hover:border-[#56A867]/30'
                    : 'bg-white border-slate-200 shadow-sm hover:shadow-md'
                }`}
              >
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden shrink-0 border border-inherit">
                  <img
                    src={coachImg}
                    alt="Entrenadora deportiva certificada"
                    className="w-full h-full object-cover object-top"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="flex-1 space-y-2 text-left">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-[#56A867] font-bold">04 / {language === 'en' ? 'COACHING' : 'ENTRENADORES'}</span>
                    <span className="text-[11px] font-mono text-neutral-400">{language === 'en' ? 'Verified Specialists' : 'Especialistas Verificados'}</span>
                  </div>
                  <h3 className={`text-lg font-serif font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {t('pillarCoach')}
                  </h3>
                  <p className={`text-xs sm:text-sm leading-relaxed ${isDark ? 'text-neutral-300' : 'text-slate-700'}`}>
                    {t('pillarCoachDesc')}
                  </p>
                </div>
              </div>
            </StaggerItem>
          </StaggerContainer>
        </section>

        {/* Section 2: Biomechanical Intelligence & Live Tracking Preview with Scroll Reveal */}
        <section id="biomecanica" aria-label="Biomecánica y Fisiología" className="mt-20 w-full max-w-5xl text-left">
          <ScrollReveal direction="up" delay={0.1} duration={0.6}>
            <div
              className={`p-6 sm:p-8 rounded-3xl border transition-all ${
                isDark
                  ? 'bg-gradient-to-b from-[#13131A] to-[#0D0D12] border-[#232332]'
                  : 'bg-white border-slate-200 shadow-md'
              }`}
            >
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-6 border-b border-inherit">
                <div>
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#56A867]">
                    {language === 'en' ? 'Sports Engineering & Physiological Science' : 'Ingeniería Deportiva & Ciencia Fisiológica'}
                  </span>
                  <h2 className={`text-2xl sm:text-3xl font-serif font-bold mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {language === 'en' ? 'Real-Time Fatigue & Readiness Tracking' : 'Monitoreo de Fatiga en Tiempo Real'}
                  </h2>
                  <p className={`text-xs sm:text-sm mt-1 max-w-xl ${isDark ? 'text-neutral-300' : 'text-slate-700'}`}>
                    {language === 'en'
                      ? 'We calculate your accumulated training load, neuromuscular recovery, and supercompensation to ensure maximum adaptation without injury.'
                      : 'Calculamos tu balance de fatiga acumulada, recuperación y estado neuromuscular para asegurar tu máxima adaptación sin sobreentrenamiento.'}
                  </p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleProtectedAction('athlete-dashboard', language === 'en' ? 'Dashboard' : 'Panel de Control')}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-2 cursor-pointer focus-visible:ring-2 focus-visible:ring-[#56A867] focus-visible:outline-none ${
                    isDark
                      ? 'bg-[#1C1C28] hover:bg-[#252536] text-white border border-[#323246]'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300'
                  }`}
                  aria-label={language === 'en' ? 'View live metrics' : 'Ver métricas en vivo'}
                >
                  <span>{language === 'en' ? 'View Live Metrics' : 'Ver Métricas en Vivo'}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-[#56A867]" />
                </motion.button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6">
                <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#161622] border-[#2A2A3A]' : 'bg-slate-50 border-slate-200 shadow-sm'}`}>
                  <div className="text-[11px] font-mono text-[#56A867] flex items-center justify-between">
                    <span>{language === 'en' ? 'FATIGUE STATE' : 'ESTADO DE FATIGA'}</span>
                    <span className="text-[10px] font-semibold text-emerald-400">ACTIVO</span>
                  </div>
                  <div className={`text-xl font-bold font-mono tabular-nums mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    96% <span className="text-xs font-normal text-emerald-500 font-sans">{language === 'en' ? 'Optimal' : 'Óptimo'}</span>
                  </div>
                  <p className={`text-[11px] mt-1 ${isDark ? 'text-neutral-400' : 'text-slate-600'}`}>
                    {language === 'en' ? 'Neural supercompensation & low muscular strain.' : 'Supercompensación neural activa y bajo estrés muscular.'}
                  </p>
                </div>

                <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#161622] border-[#2A2A3A]' : 'bg-slate-50 border-slate-200 shadow-sm'}`}>
                  <div className="text-[11px] font-mono text-cyan-400 flex items-center justify-between">
                    <span>{language === 'en' ? 'METABOLISM & ZONES' : 'METABOLISMO & ZONAS'}</span>
                    <Activity className="w-3.5 h-3.5 text-cyan-400" />
                  </div>
                  <div className={`text-xl font-bold font-mono tabular-nums mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Zona 2 <span className="text-xs font-normal text-cyan-500 font-sans">132 bpm</span>
                  </div>
                  <p className={`text-[11px] mt-1 ${isDark ? 'text-neutral-400' : 'text-slate-600'}`}>
                    {language === 'en' ? 'Lipolytic base with aerobic efficiency calibration.' : 'Base lipolítica activa con calibración de umbral aeróbico.'}
                  </p>
                </div>

                <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#161622] border-[#2A2A3A]' : 'bg-slate-50 border-slate-200 shadow-sm'}`}>
                  <div className="text-[11px] font-mono text-amber-400 flex items-center justify-between">
                    <span>{language === 'en' ? '1RM CALIBRATION' : 'CALIBRACIÓN 1RM'}</span>
                    <Award className="w-3.5 h-3.5 text-amber-400" />
                  </div>
                  <div className={`text-xl font-bold font-mono tabular-nums mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    102.5 kg <span className="text-xs font-normal text-amber-500 font-sans">Brzycki</span>
                  </div>
                  <p className={`text-[11px] mt-1 ${isDark ? 'text-neutral-400' : 'text-slate-600'}`}>
                    {language === 'en' ? 'Dynamic load adjustment with velocity loss index.' : 'Ajuste de carga dinámica con índice de pérdida de velocidad.'}
                  </p>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </section>

        {/* Section 3: Final High-Impact CTA Card with Scroll Reveal */}
        <ScrollReveal direction="scale" delay={0.1} duration={0.65} className="mt-20 w-full max-w-4xl">
          <div
            className={`p-8 sm:p-12 rounded-3xl text-center border relative overflow-hidden ${
              isDark
                ? 'bg-gradient-to-r from-[#14141E] via-[#101017] to-[#14141E] border-[#2B2B3D]'
                : 'bg-gradient-to-r from-emerald-50 via-white to-emerald-50 border-emerald-200 shadow-lg'
            }`}
          >
            <div className="relative z-10 max-w-2xl mx-auto">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#56A867]/20 text-[#56A867] text-[11px] font-mono font-bold uppercase tracking-wider mb-4">
                <Sparkles className="w-3.5 h-3.5" />
                {language === 'en' ? 'Instant & Free Access' : 'Acceso Inmediato y Gratuito'}
              </span>
              <h2 className={`text-3xl sm:text-4xl font-serif font-bold tracking-tight leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {language === 'en' ? 'Start your science-guided training today.' : 'Empieza hoy tu entrenamiento guiado por la ciencia.'}
              </h2>
              <p className={`mt-3 text-xs sm:text-sm leading-relaxed ${isDark ? 'text-[#9E9EAC]' : 'text-slate-700'}`}>
                {language === 'en'
                  ? 'No barriers, with precise biomechanical metrics tailored to your individual physical condition. Join our community right now.'
                  : 'Sin barreras, con métricas precisas y adaptado a tu condición física individual. Únete ahora mismo a nuestra comunidad deportiva.'}
              </p>

              <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => onNavigate('athlete-register')}
                  className={`py-3.5 px-8 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    isDark
                      ? 'bg-[#56A867] hover:bg-[#64B875] text-black shadow-[0_0_25px_rgba(86,168,103,0.35)]'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg'
                  }`}
                >
                  <Sparkles className="w-4 h-4 text-emerald-950 dark:text-black" />
                  <span>{language === 'en' ? 'Create Free Account' : 'Crear mi Cuenta Gratis'}</span>
                  <ArrowRight className="w-4 h-4" />
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => onNavigate('trainer-register')}
                  className={`py-3.5 px-6 rounded-xl font-semibold text-sm border transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    isDark
                      ? 'bg-[#181822] hover:bg-[#222230] text-neutral-200 border-[#2F2F40]'
                      : 'bg-white hover:bg-slate-50 text-slate-900 border-slate-300'
                  }`}
                >
                  <Shield className="w-4 h-4 text-emerald-500" />
                  <span>{language === 'en' ? 'Coach Registration' : 'Registro Entrenador'}</span>
                </motion.button>
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* Section 4: Community & Athlete Reviews (Last section on page) */}
        <ScrollReveal direction="up" delay={0.15} duration={0.6} className="mt-20 mb-14 w-full max-w-5xl text-left">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            <div>
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#56A867]">
                {language === 'en' ? 'Active Community & Testimonials' : 'Comunidad Activa & Testimonios'}
              </span>
              <h2 className={`text-2xl sm:text-3xl font-serif font-bold mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {t('landingReviewsTitle')}
              </h2>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => handleProtectedAction('reviews', language === 'en' ? 'Add Review' : 'Añadir Comentario')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm ${
                  isDark
                    ? 'bg-[#56A867] hover:bg-[#64B875] text-black shadow-[0_0_15px_rgba(86,168,103,0.25)]'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{language === 'en' ? 'Add Review' : 'Añadir Comentario'}</span>
              </button>
              <button
                onClick={() => handleProtectedAction('reviews', language === 'en' ? 'Community & Reviews' : 'Comunidad y Reseñas')}
                className={`text-xs font-semibold text-[#56A867] hover:underline flex items-center gap-1 cursor-pointer`}
              >
                <span>{language === 'en' ? 'View all reviews' : 'Ver todas las reseñas'}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {userReviews.length === 0 ? (
            <div
              className={`p-10 text-center rounded-2xl border ${
                isDark ? 'bg-[#121218] border-[#22222E]' : 'bg-white border-slate-200 shadow-sm'
              }`}
            >
              <p className={`text-sm ${isDark ? 'text-[#8E8E9E]' : 'text-slate-600'}`}>
                {language === 'en'
                  ? 'No athlete reviews published yet. Be the first to share your experience!'
                  : 'Aún no hay reseñas publicadas por los atletas. ¡Sé el primero en compartir tu experiencia!'}
              </p>
              <button
                onClick={() => handleProtectedAction('reviews', language === 'en' ? 'Add Review' : 'Añadir Comentario')}
                className="mt-4 px-5 py-2.5 rounded-xl text-xs font-bold bg-[#56A867] hover:bg-[#64B875] text-black transition-all cursor-pointer inline-flex items-center gap-2"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{language === 'en' ? 'Add Review' : 'Añadir Comentario'}</span>
              </button>
            </div>
          ) : (
            <StaggerContainer staggerDelay={0.1} className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {userReviews.map((rev) => (
                <StaggerItem key={rev.id} direction="up" distance={20}>
                  <div className={`p-5 rounded-2xl border h-full flex flex-col justify-between ${isDark ? 'bg-[#121218] border-[#22222E]' : 'bg-white border-slate-300 shadow-sm'}`}>
                    <div className="space-y-2">
                      <div className="flex items-center gap-1 text-amber-400">
                        {[...Array(rev.rating || 5)].map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                      <p className={`text-xs italic leading-relaxed ${isDark ? 'text-[#A0A0B2]' : 'text-slate-700'}`}>
                        "{rev.content || rev.positiveFeedback || rev.title}"
                      </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-inherit flex items-center justify-between text-xs">
                      <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{rev.authorName}</span>
                      <span className="text-[10px] font-mono text-[#56A867]">{rev.authorRole || 'Atleta'}</span>
                    </div>
                  </div>
                </StaggerItem>
              ))}
            </StaggerContainer>
          )}
        </ScrollReveal>

        {/* Contact & Support Section (Firebase Mail & SendGrid Integrated) */}
        <ScrollReveal className="mt-20">
          <div
            id="contacto"
            className={`p-6 sm:p-10 rounded-3xl border transition-all ${
              isDark
                ? 'bg-gradient-to-br from-[#121218] via-[#151520] to-[#121218] border-[#252538] shadow-2xl'
                : 'bg-white border border-slate-200 shadow-xl'
            }`}
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Info Column */}
              <div className="lg:col-span-5 space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#56A867]/15 text-[#56A867] border border-[#56A867]/25">
                  <Mail className="w-3.5 h-3.5 shrink-0" />
                  <span>{language === 'es' ? 'Contacto Directo & Soporte' : 'Direct Contact & Support'}</span>
                </div>

                <h3 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {language === 'es' ? '¿Tienes dudas o necesitas asesoría?' : 'Have questions or need guidance?'}
                </h3>

                <p className={`text-xs sm:text-sm font-normal leading-relaxed ${isDark ? 'text-neutral-400' : 'text-slate-600'}`}>
                  {language === 'es'
                    ? 'Déjanos tu mensaje y nuestro equipo de entrenadores responderá de forma personalizada.'
                    : 'Leave us your message and our coaching staff will provide personalized guidance.'}
                </p>

                <div className="space-y-3 pt-2">
                  <div
                    className={`p-3.5 rounded-2xl border flex items-center gap-3 transition-colors ${
                      isDark ? 'bg-[#181824] border-[#2A2A3C]' : 'bg-slate-50 border border-slate-200 shadow-sm'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-xl bg-[#56A867]/20 text-[#56A867] flex items-center justify-center shrink-0">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div className="text-xs">
                      <div className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {language === 'es' ? 'Atención al Cliente' : 'Customer Support'}
                      </div>
                      <div className={`text-[11px] font-medium ${isDark ? 'text-neutral-400' : 'text-slate-600'}`}>
                        sportfitness112@gmail.com
                      </div>
                    </div>
                  </div>

                  <div
                    className={`p-3.5 rounded-2xl border flex items-center gap-3 transition-colors ${
                      isDark ? 'bg-[#181824] border-[#2A2A3C]' : 'bg-slate-50 border border-slate-200 shadow-sm'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div className="text-xs">
                      <div className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {language === 'es' ? 'Tiempo de Respuesta' : 'Response Time'}
                      </div>
                      <div className={`text-[11px] font-medium ${isDark ? 'text-neutral-300' : 'text-slate-600'}`}>
                        {language === 'es' ? 'En menos de 24 horas hábiles' : 'Under 24 business hours'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Form Column */}
              <div className="lg:col-span-7">
                {cSuccess ? (
                  <div
                    className={`p-8 rounded-2xl border text-center space-y-4 ${
                      isDark ? 'bg-[#161622] border-[#2A2A3C]' : 'bg-slate-50 border border-slate-200 shadow-sm'
                    }`}
                  >
                    <div className="w-14 h-14 rounded-full bg-[#56A867]/20 text-[#56A867] flex items-center justify-center mx-auto ring-8 ring-[#56A867]/10 animate-in zoom-in-75">
                      <CheckCircle2 className="w-7 h-7" />
                    </div>
                    <div className="space-y-1">
                      <h4 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {language === 'es' ? '¡Mensaje Enviado Correctamente!' : 'Message Sent Successfully!'}
                      </h4>
                      <p className={`text-xs max-w-md mx-auto ${isDark ? 'text-neutral-300' : 'text-slate-600'}`}>
                        {language === 'es'
                          ? 'Hemos guardado tu mensaje y te enviamos una confirmación por correo mediante SendGrid.'
                          : 'Your message was saved and a confirmation email was dispatched via SendGrid.'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setCSuccess(false);
                        setCMessage('');
                        setCSubject('');
                      }}
                      className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#56A867] hover:bg-[#64B875] text-black transition-all cursor-pointer shadow-md focus-visible:ring-2 focus-visible:ring-[#56A867] focus-visible:outline-none"
                    >
                      {language === 'es' ? 'Enviar otro mensaje' : 'Send another message'}
                    </button>
                  </div>
                ) : (
                  <form
                    onSubmit={handleContactSubmit}
                    className={`p-6 sm:p-7 rounded-2xl border space-y-4 ${
                      isDark ? 'bg-[#151520] border-[#252538]' : 'bg-slate-50 border border-slate-200 shadow-sm'
                    }`}
                  >
                    {cError && (
                      <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-500 text-xs font-medium" role="alert">
                        {cError}
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div className="space-y-1.5">
                        <label className={`block text-xs font-semibold ${isDark ? 'text-neutral-300' : 'text-slate-700'}`}>
                          {language === 'es' ? 'Nombre completo *' : 'Full Name *'}
                        </label>
                        <div className="relative">
                          <User className={`w-4 h-4 absolute left-3 top-3 ${isDark ? 'text-neutral-400' : 'text-slate-500'}`} />
                          <input
                            type="text"
                            required
                            value={cName}
                            onChange={(e) => setCName(e.target.value)}
                            placeholder={language === 'es' ? 'Ej. Mateo Bedoya' : 'e.g. John Doe'}
                            className={`w-full pl-9 pr-3.5 py-2.5 rounded-xl text-xs border outline-none transition-all ${
                              isDark
                                ? 'bg-[#1A1A26] border-[#2D2D40] text-white focus:border-[#56A867] focus:ring-1 focus:ring-[#56A867]'
                                : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 font-medium focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600'
                            }`}
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className={`block text-xs font-semibold ${isDark ? 'text-neutral-300' : 'text-slate-700'}`}>
                          {language === 'es' ? 'Correo electrónico *' : 'Email Address *'}
                        </label>
                        <div className="relative">
                          <Mail className={`w-4 h-4 absolute left-3 top-3 ${isDark ? 'text-neutral-400' : 'text-slate-500'}`} />
                          <input
                            type="email"
                            required
                            value={cEmail}
                            onChange={(e) => setCEmail(e.target.value)}
                            placeholder={language === 'en' ? 'Your email address' : 'Tu correo electrónico'}
                            className={`w-full pl-9 pr-3.5 py-2.5 rounded-xl text-xs border outline-none transition-all ${
                              isDark
                                ? 'bg-[#1A1A26] border-[#2D2D40] text-white focus:border-[#56A867] focus:ring-1 focus:ring-[#56A867]'
                                : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 font-medium focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600'
                            }`}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div className="space-y-1.5">
                        <label className={`block text-xs font-semibold ${isDark ? 'text-neutral-300' : 'text-slate-700'}`}>
                          {language === 'es' ? 'Teléfono / WhatsApp' : 'Phone / WhatsApp'}
                        </label>
                        <div className="relative">
                          <Phone className={`w-4 h-4 absolute left-3 top-3 ${isDark ? 'text-neutral-400' : 'text-slate-500'}`} />
                          <input
                            type="tel"
                            value={cPhone}
                            onChange={(e) => setCPhone(e.target.value)}
                            placeholder="+57 300 123 4567"
                            className={`w-full pl-9 pr-3.5 py-2.5 rounded-xl text-xs border outline-none transition-all ${
                              isDark
                                ? 'bg-[#1A1A26] border-[#2D2D40] text-white focus:border-[#56A867] focus:ring-1 focus:ring-[#56A867]'
                                : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 font-medium focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600'
                            }`}
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className={`block text-xs font-semibold ${isDark ? 'text-neutral-300' : 'text-slate-700'}`}>
                          {language === 'es' ? 'Asunto' : 'Subject'}
                        </label>
                        <input
                          type="text"
                          value={cSubject}
                          onChange={(e) => setCSubject(e.target.value)}
                          placeholder={language === 'es' ? 'Planes, entrenamientos o soporte' : 'Inquiry or support'}
                          className={`w-full px-3.5 py-2.5 rounded-xl text-xs border outline-none transition-all ${
                            isDark
                              ? 'bg-[#1A1A26] border-[#2D2D40] text-white focus:border-[#56A867] focus:ring-1 focus:ring-[#56A867]'
                              : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 font-medium focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600'
                          }`}
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className={`block text-xs font-semibold ${isDark ? 'text-neutral-300' : 'text-slate-700'}`}>
                        {language === 'es' ? 'Mensaje o Consulta *' : 'Message *'}
                      </label>
                      <div className="relative">
                        <MessageSquare className={`w-4 h-4 absolute left-3 top-3 ${isDark ? 'text-neutral-400' : 'text-slate-500'}`} />
                        <textarea
                          required
                          rows={4}
                          value={cMessage}
                          onChange={(e) => setCMessage(e.target.value)}
                          placeholder={
                            language === 'es'
                              ? 'Escribe tu consulta detallada para nuestro equipo de entrenadores y soporte...'
                              : 'Write your message or inquiry here...'
                          }
                          className={`w-full pl-9 pr-3.5 py-2.5 rounded-xl text-xs border outline-none transition-all resize-none ${
                            isDark
                              ? 'bg-[#1A1A26] border-[#2D2D40] text-white focus:border-[#56A867] focus:ring-1 focus:ring-[#56A867]'
                              : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 font-medium focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600'
                          }`}
                        />
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                      <span className={`text-[11px] font-mono ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>
                        {language === 'es' ? '🔒 Despacho seguro por SendGrid API v3' : '🔒 Secure SendGrid API v3 dispatch'}
                      </span>
                      <button
                        type="submit"
                        disabled={cLoading}
                        className="w-full sm:w-auto min-h-[44px] px-6 py-2.5 rounded-xl text-xs font-bold bg-[#56A867] hover:bg-[#64B875] text-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-[#56A867] focus-visible:outline-none"
                      >
                        {cLoading ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>{language === 'es' ? 'Enviando...' : 'Sending...'}</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-3.5 h-3.5" />
                            <span>{language === 'es' ? 'Enviar Mensaje' : 'Send Message'}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </ScrollReveal>
      </main>

      {/* Footer */}
      <footer
        className={`border-t py-8 px-4 sm:px-8 text-xs transition-colors ${
          isDark
            ? 'border-[#1E1E26] bg-[#0A0A0E] text-[#707080]'
            : 'border-slate-300 bg-white text-slate-700'
        }`}
      >
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <EmblemLogo size="sm" />
            <span className={`font-serif font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Sportfitness Elite
            </span>
            <span className={isDark ? 'text-neutral-400' : 'text-slate-700'}>© 2026 Sportfitness Para Todos.</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
            <button
              onClick={openContactModal}
              className={`transition-colors font-medium flex items-center gap-1.5 ${isDark ? 'text-[#56A867] hover:underline' : 'text-emerald-700 hover:underline'}`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>{language === 'es' ? 'Contacto & Soporte' : 'Contact & Support'}</span>
            </button>
            <button
              onClick={() => handleProtectedAction('reviews', language === 'es' ? 'Comunidad y Reseñas' : 'Community & Reviews')}
              className={`transition-colors font-medium ${isDark ? 'hover:text-white' : 'text-slate-800 hover:text-black'}`}
            >
              {t('reviews')}
            </button>
            <button
              onClick={() => handleProtectedAction('settings', language === 'es' ? 'Configuración' : 'Settings')}
              className={`transition-colors font-medium ${isDark ? 'hover:text-white' : 'text-slate-800 hover:text-black'}`}
            >
              {t('settings')}
            </button>
          </div>
        </div>
      </footer>

      {/* Auth Gate Modal */}
      <AuthRequiredModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onNavigate={onNavigate}
        targetModuleName={authTargetName}
      />
    </div>
  );
};
