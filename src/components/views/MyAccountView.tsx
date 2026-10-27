/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  User,
  Mail,
  Phone,
  CreditCard,
  Flame,
  Calendar,
  TrendingUp,
  Dumbbell,
  Scale,
  Ruler,
  Shirt,
  AlertTriangle,
  Trash2,
  LogOut,
  CheckCircle2,
  RefreshCw,
  ShieldCheck,
  Award,
  ChevronRight,
  Activity,
  Zap,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { localDatabase } from '../../db/localDatabase';
import { SwitchAccountModal } from '../common/SwitchAccountModal';
import { ScrollReveal } from '../common/ScrollReveal';
import { UserAvatar } from '../common/UserAvatar';
import { PersonalRecordsFolderManager } from '../dashboard/PersonalRecordsFolderManager';

export const MyAccountView: React.FC = () => {
  const { user, setUser, t, navigateTo, deleteCurrentAccount, logout, language, theme } = useApp();
  const isDark = theme === 'dark';

  const [progressData, setProgressData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditingHealth, setIsEditingHealth] = useState(false);
  const [isSwitchAccountOpen, setIsSwitchAccountOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Edit Anthropometric form state
  const [weightInput, setWeightInput] = useState(user.weight || 75);
  const [heightInput, setHeightInput] = useState(user.height || 175);
  const [clothingSizeInput, setClothingSizeInput] = useState(user.clothingSize || 'M');
  const [bodyTypeInput, setBodyTypeInput] = useState(user.bodyType || 'Mesomorfo');

  // Fetch verified progress data linked to user ID
  const loadUserData = async () => {
    setIsLoading(true);
    try {
      if (user.id) {
        const res = await fetch(`/api/user/${user.id}/progress`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.progress) {
            setProgressData(data.progress);
            setIsLoading(false);
            return;
          }
        }
      }
    } catch {
      // Fallback to local database
    }

    if (user.id) {
      const localProgress = localDatabase.getUserProgress(user.id);
      setProgressData(localProgress);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadUserData();
  }, [user.id]);

  // Calculate BMI and Category
  const heightM = (user.height || 175) / 100;
  const currentBmi = Number(((user.weight || 75) / (heightM * heightM)).toFixed(1));
  let bmiCategory = language === 'en' ? 'Optimal Athletic Composition' : 'Composición Atlética Óptima';
  if (currentBmi < 18.5) bmiCategory = language === 'en' ? 'Underweight' : 'Bajo Peso';
  else if (currentBmi >= 25 && currentBmi < 30) bmiCategory = language === 'en' ? 'Functional Overweight' : 'Sobrepeso Funcional';
  else if (currentBmi >= 30) bmiCategory = language === 'en' ? 'High Density' : 'Densidad Elevada';

  // Handle Anthropometric Save
  const handleSaveHealthProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedWeight = parseFloat(String(weightInput)) || 75;
    const parsedHeight = parseFloat(String(heightInput)) || 175;

    try {
      const res = await fetch(`/api/user/${user.id}/health-profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weight: parsedWeight,
          height: parsedHeight,
          clothingSize: clothingSizeInput,
          bodyType: bodyTypeInput,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.healthProfile) {
          setUser({
            ...user,
            weight: data.healthProfile.weight,
            height: data.healthProfile.height,
            clothingSize: data.healthProfile.clothingSize,
            bodyType: data.healthProfile.bodyType,
          });
          setIsEditingHealth(false);
          setStatusMessage({
            type: 'success',
            text: language === 'en'
              ? 'Anthropometric data updated and saved to database.'
              : 'Datos antropométricos actualizados y guardados en base de datos.',
          });
          return;
        }
      }
    } catch {
      // Fallback
    }

    // Local save
    const updated = {
      ...user,
      weight: parsedWeight,
      height: parsedHeight,
      clothingSize: clothingSizeInput as any,
      bodyType: bodyTypeInput as any,
    };
    setUser(updated);
    localDatabase.saveUser(updated);
    setIsEditingHealth(false);
    setStatusMessage({
      type: 'success',
      text: language === 'en'
        ? 'Anthropometric measurements updated successfully.'
        : 'Datos antropométricos actualizados exitosamente.',
    });
  };

  // Handle Permanent Cascading Account Deletion
  const handleConfirmDeleteAccount = async () => {
    const requiredWord = language === 'en' ? 'DELETE' : 'ELIMINAR';
    const inputUpper = deleteConfirmationText.trim().toUpperCase();
    if (inputUpper !== 'ELIMINAR' && inputUpper !== 'DELETE') {
      setStatusMessage({
        type: 'error',
        text: language === 'en'
          ? `You must type "${requiredWord}" to confirm permanent deletion.`
          : 'Debes escribir la palabra "ELIMINAR" para confirmar el borrado definitivo.',
      });
      return;
    }

    setIsDeleting(true);
    try {
      await deleteCurrentAccount();
    } catch (err: any) {
      setIsDeleting(false);
      setStatusMessage({
        type: 'error',
        text: (language === 'en' ? 'Error deleting account: ' : 'Error al intentar eliminar la cuenta: ') + err.message,
      });
    }
  };

  // Computed metrics (Strictly actual user progress - never invent figures, 0 until real volume is moved)
  const workoutLogs = Array.isArray(progressData?.workoutLogs) ? progressData.workoutLogs : [];
  const hasRealWorkouts = workoutLogs.length > 0 || (Number(progressData?.sessionsCompleted) > 0 && Number(progressData?.totalVolumeKg) > 0);

  const totalSessions = hasRealWorkouts ? (progressData?.sessionsCompleted ?? 0) : 0;
  const totalVolume = hasRealWorkouts
    ? (workoutLogs.length > 0
        ? workoutLogs.reduce((sum: number, log: any) => sum + (Number(log.tonnageRecordedKg) || 0), 0) || (progressData?.totalVolumeKg ?? 0)
        : (progressData?.totalVolumeKg ?? 0))
    : 0;
  const streakCount = hasRealWorkouts ? (progressData?.streakDays ?? 0) : 0;
  const activeDays = hasRealWorkouts ? (progressData?.activeDaysTotal ?? 0) : 0;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8 space-y-8" id="my-account-module">
      {/* Module Header */}
      <ScrollReveal direction="down" duration={0.4}>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-6">
          <div>
            <div className="flex items-center gap-3">
              <UserAvatar user={user} size="lg" className="w-12 h-12 shadow-lg shadow-[#56A867]/20" />
              <div>
                <h1 className={`text-2xl sm:text-3xl font-black uppercase tracking-tight ${isDark ? 'text-white' : 'text-zinc-900'}`}>
                  {t('accountTitle')}
                </h1>
                <p className={`text-sm sm:text-base mt-1 ${isDark ? 'text-zinc-200' : 'text-zinc-600'}`}>
                  {t('accountSubtitle')}
                </p>
              </div>
            </div>
          </div>

          {/* Quick actions: Cambiar Cuenta & Cerrar Sesión */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              id="switch-account-btn"
              onClick={() => setIsSwitchAccountOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 font-bold text-sm transition-colors shadow-sm"
            >
              <RefreshCw className="w-4 h-4 text-[#56A867]" />
              <span>{t('switchAccount')}</span>
            </button>

            <button
              id="logout-btn"
              onClick={logout}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-500 font-bold text-sm transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>{t('logout')}</span>
            </button>
          </div>
        </div>
      </ScrollReveal>

      {/* Status banner if any */}
      {statusMessage && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between gap-3 ${
            statusMessage.type === 'success'
              ? 'bg-[#56A867]/10 border-[#56A867]/30 text-[#448652] dark:text-[#56A867]'
              : 'bg-red-500/10 border-red-500/30 text-red-500'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
            <span className="font-semibold text-sm">{statusMessage.text}</span>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-xs font-bold underline cursor-pointer"
          >
            {language === 'en' ? 'Close' : 'Cerrar'}
          </button>
        </div>
      )}

      {/* ==========================================
          1. INFORMACIÓN PERSONAL Y ANTROPOMÉTRICA
         ========================================== */}
      <ScrollReveal direction="up" delay={0.08} duration={0.4}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Account Credentials & Identity */}
        <div className="lg:col-span-1 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-4">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#56A867]" />
              <span>{language === 'en' ? 'Identity & Account' : 'Identidad & Cuenta'}</span>
            </h2>
            <span className="px-2.5 py-1 text-xs font-black uppercase rounded-full bg-[#56A867]/20 text-[#448652] dark:text-[#56A867] border border-[#56A867]/30">
              {user.role}
            </span>
          </div>

          <div className="space-y-4 text-sm">
            <div>
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block">
                {language === 'en' ? 'Full Name' : 'Nombre Completo'}
              </label>
              <p className="font-bold text-base text-zinc-900 dark:text-white mt-0.5">
                {user.name} {user.lastName || ''}
              </p>
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-zinc-400" />
                <span>{t('emailLabel')}</span>
              </label>
              <p className="font-mono text-zinc-800 dark:text-zinc-200 mt-0.5 break-all">
                {user.email || (language === 'en' ? 'Not registered' : 'No registrado')}
              </p>
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-zinc-400" />
                <span>{t('phoneLabel')}</span>
              </label>
              <p className="font-mono text-zinc-800 dark:text-zinc-200 mt-0.5">
                {user.phone || '+57 310 987 6543'}
              </p>
            </div>

            <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-zinc-400" />
                <span>{t('dniLabel')}</span>
              </label>
              <div className="flex items-center justify-between mt-1">
                <span className="font-mono font-bold text-zinc-900 dark:text-white">
                  {user.documentNumber || '1020304050'}
                </span>
                <span className="text-xs text-zinc-500">
                  {user.documentType || 'CC'}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <div>
                <span className="text-xs text-zinc-500 block">{language === 'en' ? 'Unique Identifier (ID)' : 'Identificador Único (ID)'}</span>
                <span className="font-mono text-xs text-zinc-400">{user.id || 'usr-default'}</span>
              </div>
              <div className="text-right">
                <span className="text-xs text-zinc-500 block">{language === 'en' ? 'Active Plan' : 'Plan Activo'}</span>
                <span className="font-bold text-xs text-[#56A867]">{user.membershipPlan || 'Performance Pro'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (2 cols): Anthropometrics & Physical Profile */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-4">
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-[#56A867]" />
                <span>{t('personalInfoTitle')}</span>
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                {t('personalInfoDesc')}
              </p>
            </div>

            <button
              onClick={() => setIsEditingHealth(!isEditingHealth)}
              className="px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-xs font-bold text-zinc-900 dark:text-zinc-100 transition-colors cursor-pointer"
            >
              {isEditingHealth ? t('cancel') : (language === 'en' ? 'Edit Biometrics' : 'Editar Biometría')}
            </button>
          </div>

          {/* Anthropometric Cards Grid */}
          {!isEditingHealth ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-zinc-50 dark:bg-zinc-800/60 rounded-xl p-4 border border-zinc-200/60 dark:border-zinc-800 min-w-0 flex flex-col justify-between">
                <div className="flex items-center gap-2 text-zinc-500 mb-1">
                  <Scale className="w-4 h-4 text-[#56A867] shrink-0" />
                  <span className="text-xs font-bold uppercase tracking-wider">{t('weightLabel')}</span>
                </div>
                <div className="mt-0.5">
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-zinc-900 dark:text-white">{user.weight || 75}</span>
                    <span className="text-xs text-zinc-500 font-bold">kg</span>
                  </div>
                  <span className="text-[11px] text-zinc-400 dark:text-zinc-500 block mt-0.5">
                    {language === 'en' ? 'Body weight' : 'Peso corporal'}
                  </span>
                </div>
              </div>

              <div className="bg-zinc-50 dark:bg-zinc-800/60 rounded-xl p-4 border border-zinc-200/60 dark:border-zinc-800 min-w-0 flex flex-col justify-between">
                <div className="flex items-center gap-2 text-zinc-500 mb-1">
                  <Ruler className="w-4 h-4 text-[#56A867] shrink-0" />
                  <span className="text-xs font-bold uppercase tracking-wider">{t('heightLabel')}</span>
                </div>
                <div className="mt-0.5">
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-zinc-900 dark:text-white">{user.height || 175}</span>
                    <span className="text-xs text-zinc-500 font-bold">cm</span>
                  </div>
                  <span className="text-[11px] text-zinc-400 dark:text-zinc-500 block mt-0.5">
                    {language === 'en' ? 'Stature' : 'Estatura activa'}
                  </span>
                </div>
              </div>

              <div className="bg-zinc-50 dark:bg-zinc-800/60 rounded-xl p-4 border border-zinc-200/60 dark:border-zinc-800 min-w-0 flex flex-col justify-between">
                <div className="flex items-center gap-2 text-zinc-500 mb-1">
                  <Shirt className="w-4 h-4 text-[#56A867] shrink-0" />
                  <span className="text-xs font-bold uppercase tracking-wider">{t('clothingSizeLabel')}</span>
                </div>
                <div className="mt-0.5">
                  <span className="text-2xl font-black text-zinc-900 dark:text-white block">
                    {user.clothingSize || 'M'}
                  </span>
                  <span className="text-[11px] text-zinc-400 dark:text-zinc-500 block mt-0.5">
                    {language === 'en' ? 'Textile size' : 'Medida textil'}
                  </span>
                </div>
              </div>

              <div className="bg-zinc-50 dark:bg-zinc-800/60 rounded-xl p-4 border border-[#56A867]/30 dark:border-[#56A867]/40 bg-gradient-to-br from-[#56A867]/5 via-transparent to-transparent min-w-0 flex flex-col justify-between">
                <div className="flex items-center gap-2 text-zinc-500 mb-1">
                  <Activity className="w-4 h-4 text-[#56A867] shrink-0" />
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">{t('bodyTypeLabel')}</span>
                </div>
                <div className="mt-0.5">
                  <span className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white leading-tight block break-words">
                    {language === 'en'
                      ? (user.bodyType === 'Mesomorfo' ? 'Mesomorph' : user.bodyType === 'Ectomorfo' ? 'Ectomorph' : 'Endomorph')
                      : (user.bodyType || 'Mesomorfo')}
                  </span>
                  <span className="text-[11px] text-[#448652] dark:text-[#56A867] font-semibold block mt-0.5">
                    {language === 'en' ? 'Biomechanical structure' : 'Estructura biomecánica'}
                  </span>
                </div>
              </div>

              {/* Live BMI display */}
              <div className="col-span-2 xl:col-span-4 bg-gradient-to-r from-lime-500/10 via-transparent to-transparent rounded-xl p-4 border border-[#56A867]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-bold text-[#448652] dark:text-[#56A867] uppercase tracking-wider block">
                    {t('bmiLabel')}
                  </span>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-3xl font-black text-zinc-900 dark:text-white font-mono">
                      {currentBmi}
                    </span>
                    <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                      • {bmiCategory}
                    </span>
                  </div>
                </div>
                <span className="text-xs text-zinc-500 max-w-sm">
                  {language === 'en'
                    ? 'Mathematically calculated from your height and current body weight under WHO international standards.'
                    : 'Calculado matemáticamente con tu estatura y peso corporal actual bajo la norma internacional OMS.'}
                </span>
              </div>
            </div>
          ) : (
            /* Editing form */
            <form onSubmit={handleSaveHealthProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <div>
                  <label className="text-xs font-bold text-zinc-500 uppercase block mb-1">
                    {t('weightLabel')} (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="35"
                    max="220"
                    value={weightInput}
                    onChange={(e) => setWeightInput(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-500 uppercase block mb-1">
                    {t('heightLabel')} (cm)
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="100"
                    max="230"
                    value={heightInput}
                    onChange={(e) => setHeightInput(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-500 uppercase block mb-1">
                    {t('clothingSizeLabel')}
                  </label>
                  <select
                    value={clothingSizeInput}
                    onChange={(e) => setClothingSizeInput(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white font-bold"
                  >
                    <option value="XS">XS</option>
                    <option value="S">S</option>
                    <option value="M">M</option>
                    <option value="L">L</option>
                    <option value="XL">XL</option>
                    <option value="XXL">XXL</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-500 uppercase block mb-1">
                    {t('bodyTypeLabel')}
                  </label>
                  <select
                    value={bodyTypeInput}
                    onChange={(e) => setBodyTypeInput(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white font-bold"
                  >
                    <option value="Ectomorfo">{language === 'en' ? 'Ectomorph' : 'Ectomorfo'}</option>
                    <option value="Mesomorfo">{language === 'en' ? 'Mesomorph' : 'Mesomorfo'}</option>
                    <option value="Endomorfo">{language === 'en' ? 'Endomorph' : 'Endomorfo'}</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditingHealth(false)}
                  className="px-4 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 font-bold text-sm cursor-pointer"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#56A867] hover:bg-[#64B875] text-black font-black text-sm transition-colors shadow-md cursor-pointer"
                >
                  {t('save')}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </ScrollReveal>

      {/* ==========================================
          2. PANEL DE PROGRESO Y MÉTRICAS
         ========================================== */}
      <ScrollReveal direction="up" delay={0.12} duration={0.4}>
        <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-zinc-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#56A867]" />
              <span>{t('metricsPanelTitle')}</span>
            </h2>
            <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
              {language === 'en'
                ? 'Metrics synchronized in real time with your persistent database.'
                : 'Métricas sincronizadas en tiempo real con tu base de datos persistente.'}
            </p>
          </div>
        </div>

        {/* Top 4 Performance Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Streak Counter */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black text-zinc-500 uppercase tracking-wider">
                {t('streakTitle')}
              </span>
              <div className="w-8 h-8 rounded-lg bg-orange-500/10 text-orange-500 flex items-center justify-center">
                <Flame className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black text-zinc-900 dark:text-white font-mono">
                {streakCount}
              </span>
              <span className="text-sm font-bold text-orange-500">
                {language === 'en' ? 'consecutive days' : 'días consecutivos'}
              </span>
            </div>
            <p className="text-xs text-zinc-500 mt-2 leading-relaxed">
              {t('streakSubtitle')}
            </p>
            <div className="mt-3 w-full bg-zinc-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-orange-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (streakCount / 30) * 100)}%` }}
              />
            </div>
          </div>

          {/* Active Days Total */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black text-zinc-500 uppercase tracking-wider">
                {t('activeDaysTitle')}
              </span>
              <div className="w-8 h-8 rounded-lg bg-[#56A867]/10 text-[#56A867] flex items-center justify-center">
                <Calendar className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black text-zinc-900 dark:text-white font-mono">
                {activeDays}
              </span>
              <span className="text-sm font-bold text-[#56A867]">
                {language === 'en' ? 'active days' : 'días activos'}
              </span>
            </div>
            <p className="text-xs text-zinc-500 mt-2 leading-relaxed">
              {t('activeDaysSubtitle')}
            </p>
            <div className="mt-3 w-full bg-zinc-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-[#56A867] h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (activeDays / 60) * 100)}%` }}
              />
            </div>
          </div>

          {/* Total Sessions Completed */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black text-zinc-500 uppercase tracking-wider">
                {language === 'en' ? 'Completed Sessions' : 'Sesiones Completadas'}
              </span>
              <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center">
                <Dumbbell className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black text-zinc-900 dark:text-white font-mono">
                {totalSessions}
              </span>
              <span className="text-sm font-bold text-sky-500">
                {language === 'en' ? 'routines completed' : 'rutinas finalizadas'}
              </span>
            </div>
            <p className="text-xs text-zinc-500 mt-2 leading-relaxed">
              {language === 'en'
                ? 'Logged with technical RPE scoring and live verification.'
                : 'Registradas con evaluación técnica RPE y verificación en vivo.'}
            </p>
          </div>

          {/* Cumulative Tonnage */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black text-zinc-500 uppercase tracking-wider">
                {language === 'en' ? 'Accumulated Volume' : 'Volumen Acumulado'}
              </span>
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
                <Award className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black text-zinc-900 dark:text-white font-mono">
                {totalVolume > 0 ? (totalVolume / 1000).toFixed(1) : '0'}
              </span>
              <span className="text-sm font-bold text-purple-400">
                {language === 'en' ? 'tonnes moved' : 'toneladas movidas'}
              </span>
            </div>
            <p className="text-xs text-zinc-500 mt-2 leading-relaxed">
              {language === 'en'
                ? 'Biomechanical calculation of sets × repetitions × load.'
                : 'Cálculo acumulativo biomecánico de series × repeticiones × peso.'}
            </p>
          </div>
        </div>

        {/* Global History and Strength Personal Records */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Completed Workouts History */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                  <Dumbbell className="w-4 h-4 text-[#56A867]" />
                  <span>{t('globalHistoryTitle')}</span>
                </h3>
                <p className="text-xs text-zinc-500">
                  {t('globalHistorySubtitle')}
                </p>
              </div>
              <button
                onClick={() => navigateTo('routines')}
                className="text-xs font-bold text-[#56A867] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>{language === 'en' ? 'Explore Routines' : 'Explorar Rutinas'}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {workoutLogs.length > 0 ? (
                workoutLogs.map((log: any) => (
                  <div
                    key={log.id}
                    className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/60 dark:border-zinc-800 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-sm font-bold text-zinc-900 dark:text-white">
                        {log.exerciseName}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-zinc-500 mt-0.5">
                        <span>{log.date}</span>
                        <span>•</span>
                        <span>{log.durationMinutes} min</span>
                        {log.tonnageRecordedKg ? (
                          <>
                            <span>•</span>
                            <span className="text-[#56A867] font-semibold">{log.tonnageRecordedKg} kg {language === 'en' ? 'load' : 'carga'}</span>
                          </>
                        ) : null}
                      </div>
                    </div>
                    {log.efficiencyScore ? (
                      <span className="px-2 py-1 text-xs font-bold rounded bg-[#56A867]/20 text-[#448652] dark:text-[#56A867] border border-[#56A867]/30">
                        Score {log.efficiencyScore}%
                      </span>
                    ) : null}
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-zinc-500 text-sm">
                  <Dumbbell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  {language === 'en' ? 'No recent workouts logged yet.' : 'No hay entrenamientos recientes registrados.'}
                </div>
              )}
            </div>
          </div>

          {/* Strength Personal Records & Folder System */}
          <PersonalRecordsFolderManager
            user={user}
            language={language}
            onNavigateToWorkout={() => navigateTo('live-workout')}
            variant="card"
          />
        </div>
      </div>
    </ScrollReveal>

      {/* ==========================================
          3. ZONA DE CUENTA, SEGURIDAD & ACCIONES
         ========================================== */}
      <ScrollReveal direction="up" delay={0.16} duration={0.4}>
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-red-500/20 p-6 shadow-sm space-y-4">
          <div className="border-b border-zinc-200 dark:border-zinc-800 pb-3">
            <h3 className="text-base font-bold text-red-500 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              <span>{language === 'en' ? 'Account Management & Privacy Zone' : 'Zona de Gestión y Privacidad de Cuenta'}</span>
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              {language === 'en'
                ? 'Secure session switching and cascading permanent deletion options.'
                : 'Opciones de cambio seguro de sesión y eliminación definitiva en cascada.'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
            <div>
              <h4 className="text-sm font-bold text-zinc-900 dark:text-white">
                {t('deleteAccount')}
              </h4>
              <p className="text-xs text-zinc-500 mt-0.5 max-w-xl">
                {t('deleteAccountSubtitle')}
              </p>
            </div>

            <button
              id="delete-account-btn"
              onClick={() => setIsDeleteModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm transition-colors shadow-md self-start sm:self-auto cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>{t('deleteAccount')}</span>
            </button>
          </div>
        </div>
      </ScrollReveal>

      {/* ==========================================
          MODAL: CONFIRMAR ELIMINACIÓN EN CASCADA
         ========================================== */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-red-500/40 rounded-2xl max-w-md w-full p-6 space-y-5 text-white shadow-2xl">
            <div className="flex items-center gap-3 text-red-400">
              <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black uppercase">
                {t('deleteAccountConfirmModalTitle')}
              </h3>
            </div>

            <div className="space-y-2 text-sm text-zinc-300">
              <p className="font-semibold text-red-300">
                {t('deleteAccountConfirmModalDesc')}
              </p>
              <ul className="list-disc pl-5 space-y-1 text-xs text-zinc-400">
                <li>{language === 'en' ? 'Profile and personal data (email, ID, phone).' : 'Perfil y datos personales (correo, DNI, teléfono).'}</li>
                <li>{language === 'en' ? 'Metrics and accumulated streak counter.' : 'Métricas y contador de racha acumulada.'}</li>
                <li>{language === 'en' ? 'Complete workout history and 1RM records.' : 'Historial completo de entrenamientos y marcas 1RM.'}</li>
                <li>{language === 'en' ? 'Anthropometric and biometric data records.' : 'Registros antropométricos y datos biométricos.'}</li>
              </ul>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-zinc-400 block">
                {language === 'en' ? (
                  <>Type the word <span className="text-red-400 font-mono font-black">DELETE</span> or <span className="text-red-400 font-mono font-black">ELIMINAR</span> to confirm:</>
                ) : (
                  <>Escribe la palabra <span className="text-red-400 font-mono font-black">ELIMINAR</span> para confirmar:</>
                )}
              </label>
              <input
                type="text"
                value={deleteConfirmationText}
                onChange={(e) => setDeleteConfirmationText(e.target.value)}
                placeholder={language === 'en' ? 'DELETE' : 'ELIMINAR'}
                className="w-full px-3 py-2 rounded-xl bg-zinc-800 border border-zinc-700 text-white font-mono font-bold tracking-wider text-center"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setDeleteConfirmationText('');
                }}
                className="px-4 py-2 rounded-xl border border-zinc-700 text-zinc-300 font-bold text-sm cursor-pointer"
              >
                {t('cancel')}
              </button>
              <button
                type="button"
                disabled={isDeleting || (deleteConfirmationText.trim().toUpperCase() !== 'ELIMINAR' && deleteConfirmationText.trim().toUpperCase() !== 'DELETE')}
                onClick={handleConfirmDeleteAccount}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-sm transition-colors shadow-lg cursor-pointer"
              >
                {isDeleting ? (language === 'en' ? 'Deleting...' : 'Borrando...') : t('deleteAccountConfirmBtn')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Switch Account Modal */}
      {isSwitchAccountOpen && (
        <SwitchAccountModal
          isOpen={isSwitchAccountOpen}
          onClose={() => setIsSwitchAccountOpen(false)}
        />
      )}
    </div>
  );
};
