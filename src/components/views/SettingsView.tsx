/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  Sun,
  Moon,
  Globe,
  KeyRound,
  Shield,
  User,
  Scale,
  Ruler,
  Flame,
  LogOut,
  CheckCircle2,
  Bell,
  Sparkles,
  Database,
  Glasses,
  Trash2,
  RefreshCw,
  AlertTriangle,
  ChevronRight,
  TrendingUp,
  Camera,
  Upload,
  Image as ImageIcon,
  Link as LinkIcon,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ScreenId, ClothingSize, BodyType, UserProfile } from '../../types';
import { Language } from '../../utils/translations';
import { getBiomechanicalProfile } from '../../utils/biomechanicalWeights';
import { SwitchAccountModal } from '../common/SwitchAccountModal';
import { ApiKeyStatusCard } from '../../apiKey';
import { ScrollReveal } from '../common/ScrollReveal';
import { UserAvatar } from '../common/UserAvatar';
import { localDatabase } from '../../db/localDatabase';

export const SettingsView: React.FC = () => {
  const {
    theme,
    toggleTheme,
    setTheme,
    fontSizeMode,
    setFontSizeMode,
    fontSizePx,
    setFontSizePx,
    language,
    setLanguage,
    t,
    user,
    setUser,
    openForgotPassword,
    logout,
    deleteCurrentAccount,
    navigateTo,
  } = useApp();

  const [savedToast, setSavedToast] = useState(false);
  const [name, setName] = useState(user.name);
  const [weight, setWeight] = useState(user.weight || 78);
  const [height, setHeight] = useState(user.height || 178);
  const [clothingSize, setClothingSize] = useState<ClothingSize>(user.clothingSize || 'M');
  const [bodyType, setBodyType] = useState<BodyType>(user.bodyType || 'Mesomorfo');
  const [unit, setUnit] = useState<'kg' | 'lbs'>('kg');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  // Modals state
  const [isSwitchAccountOpen, setIsSwitchAccountOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // Custom photo upload & personalization state
  const [customPhotoInput, setCustomPhotoInput] = useState(user.customAvatar || '');
  const [photoUploadError, setPhotoUploadError] = useState('');
  const [photoSuccessToast, setPhotoSuccessToast] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setPhotoUploadError(language === 'en' ? 'Please select a valid image file.' : 'Por favor selecciona un archivo de imagen válido.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setPhotoUploadError(language === 'en' ? 'Image exceeds 5MB limit.' : 'La imagen supera los 5MB de tamaño.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setCustomPhotoInput(result);
        setPhotoUploadError('');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveCustomPhoto = () => {
    if (!customPhotoInput.trim()) {
      handleRemoveCustomPhoto();
      return;
    }
    const updatedUser: UserProfile = {
      ...user,
      customAvatar: customPhotoInput.trim(),
    };
    setUser(updatedUser);
    localDatabase.saveUser(updatedUser);
    setPhotoSuccessToast(true);
    setTimeout(() => setPhotoSuccessToast(false), 2500);
  };

  const handleRemoveCustomPhoto = () => {
    const updatedUser: UserProfile = {
      ...user,
      customAvatar: undefined,
    };
    setUser(updatedUser);
    localDatabase.saveUser(updatedUser);
    setCustomPhotoInput('');
    setPhotoSuccessToast(true);
    setTimeout(() => setPhotoSuccessToast(false), 2500);
  };

  // Dynamic preview of biomechanical weights based on current form inputs
  const dynamicBio = getBiomechanicalProfile({
    ...user,
    weight: Number(weight),
    height: Number(height),
    clothingSize,
    bodyType,
  });

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setUser({
      ...user,
      name,
      weight: Number(weight),
      height: Number(height),
      clothingSize,
      bodyType,
    });
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2500);
  };

  const handleDeleteAccount = async () => {
    const inputUpper = deleteConfirmationText.trim().toUpperCase();
    if (inputUpper !== 'ELIMINAR' && inputUpper !== 'DELETE') {
      setDeleteError(
        language === 'en'
          ? 'You must type "DELETE" or "ELIMINAR" to authorize deletion.'
          : 'Debes escribir la palabra "ELIMINAR" para autorizar el borrado.'
      );
      return;
    }
    setIsDeleting(true);
    setDeleteError('');
    try {
      await deleteCurrentAccount();
    } catch (err: any) {
      setIsDeleting(false);
      setDeleteError(err.message || 'Error al eliminar la cuenta');
    }
  };

  const isDark = theme === 'dark';

  const languagesList: { id: Language; label: string; flag: string }[] = [
    { id: 'es', label: 'Español', flag: '🇪🇸' },
    { id: 'en', label: 'English', flag: '🇺🇸' },
    { id: 'pt', label: 'Português', flag: '🇧🇷' },
    { id: 'fr', label: 'Français', flag: '🇫🇷' },
    { id: 'de', label: 'Deutsch', flag: '🇩🇪' },
    { id: 'it', label: 'Italiano', flag: '🇮🇹' },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-5xl mx-auto text-left" id="settings-view">
      {/* Header */}
      <ScrollReveal direction="down" duration={0.4}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div
              className={`inline-flex items-center gap-2 px-3 py-0.5 rounded-full text-[11px] font-mono font-bold uppercase tracking-wider mb-1 ${
                isDark
                  ? 'bg-[#56A867]/15 text-[#56A867]'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              }`}
            >
              <SettingsIcon className="w-3.5 h-3.5" />
              <span>{t('settings')}</span>
            </div>
            <h1 className={`text-2xl sm:text-3xl font-serif font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {t('settingsTitle')}
            </h1>
            <p className={`text-xs sm:text-sm ${isDark ? 'text-[#8E8E9E]' : 'text-slate-500'}`}>
              {t('settingsSubtitle')}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigateTo('my-account')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-colors ${
                isDark
                  ? 'bg-[#181824] border-[#56A867]/40 text-[#56A867] hover:bg-[#56A867]/10'
                  : 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>{t('accountTitle')}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            {savedToast && (
              <div className="p-2.5 px-4 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4" />
                <span>Configuración guardada correctamente</span>
              </div>
            )}
          </div>
        </div>
      </ScrollReveal>

      <ScrollReveal direction="up" delay={0.08} duration={0.4}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Custom Profile Photo Section */}
        <div
          className={`p-6 rounded-2xl border transition-all md:col-span-2 ${
            isDark ? 'bg-[#121218] border-[#22222E]' : 'bg-white border-slate-200 shadow-sm'
          }`}
          id="custom-avatar-card"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-inherit mb-4">
            <div className="flex items-center gap-2.5">
              <Camera className={`w-5 h-5 ${isDark ? 'text-[#56A867]' : 'text-emerald-600'}`} />
              <div>
                <h2 className={`font-serif font-bold text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {language === 'en' ? 'Profile Picture & Avatar Badge' : 'Foto de Perfil & Insignia de Cuenta'}
                </h2>
                <span className={`text-[11px] font-mono ${isDark ? 'text-[#56A867]' : 'text-emerald-600'}`}>
                  {user.role === 'entrenador'
                    ? (language === 'en' ? 'Default: Coach Badge "C" • Customizable with your own photo' : 'Por defecto: Insignia de Coach "C" • Personalizable con tu foto')
                    : (language === 'en' ? 'Default: Athlete Badge "D" • Customizable with your own photo' : 'Por defecto: Insignia de Deportista "D" • Personalizable con tu foto')}
                </span>
              </div>
            </div>

            {photoSuccessToast && (
              <div className="p-2 px-3 rounded-xl bg-[#56A867]/20 border border-[#56A867]/40 text-[#56A867] text-xs font-semibold flex items-center gap-1.5 animate-in fade-in">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{language === 'en' ? 'Avatar updated successfully' : 'Foto de perfil actualizada con éxito'}</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Left: Avatar Preview */}
            <div className="lg:col-span-4 flex flex-col items-center justify-center p-5 rounded-2xl bg-[#0B0C10] border border-[#1E1E28] text-center">
              <div className="relative mb-3">
                <UserAvatar
                  user={{
                    ...user,
                    customAvatar: customPhotoInput || user.customAvatar,
                  }}
                  size="2xl"
                  border={true}
                  className="w-24 h-24 shadow-2xl ring-4 ring-[#56A867]/20"
                />
                <span className="absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-[#56A867] text-black shadow">
                  {user.role === 'entrenador' ? 'Coach' : 'Deportista'}
                </span>
              </div>

              <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {user.name}
              </span>
              <span className="text-xs text-[#56A867] font-mono">
                {customPhotoInput || user.customAvatar
                  ? (language === 'en' ? 'Personalized Photo Active' : 'Foto Personalizada Activa')
                  : user.role === 'entrenador'
                  ? (language === 'en' ? 'Default Coach Badge: "C"' : 'Insignia Predeterminada: "C"')
                  : (language === 'en' ? 'Default Athlete Badge: "D"' : 'Insignia Predeterminada: "D"')}
              </span>
            </div>

            {/* Right: Upload Controls */}
            <div className="lg:col-span-8 space-y-4">
              <div className={`p-4 rounded-xl border text-xs ${
                isDark ? 'bg-[#15151F] border-[#222230] text-neutral-300' : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}>
                <p className="leading-relaxed">
                  {language === 'en'
                    ? 'In coach accounts no picture is displayed by default, only a "C", and in athlete accounts a "D". You can upload your own photo below or restore the default badge whenever you wish.'
                    : 'En las cuentas de coach no se muestra foto, solo una "C", y en la cuenta de deportista una "D". Puedes subir tu propia foto personalizada a continuación o volver a la insignia predeterminada cuando lo desees.'}
                </p>
              </div>

              {photoUploadError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{photoUploadError}</span>
                </div>
              )}

              {/* Upload via File or Link */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* File picker */}
                <div>
                  <label className="block text-xs font-mono text-neutral-400 mb-1.5 flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5 text-[#56A867]" />
                    <span>{language === 'en' ? 'Upload Image File' : 'Subir Archivo de Imagen'}</span>
                  </label>
                  <label className={`w-full py-2.5 px-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-mono cursor-pointer transition-all ${
                    isDark ? 'bg-[#181824] hover:bg-[#202030] border-[#2A2A3C] text-white' : 'bg-white hover:bg-slate-50 border-slate-300 text-slate-900'
                  }`}>
                    <ImageIcon className="w-4 h-4 text-[#56A867]" />
                    <span className="truncate">{language === 'en' ? 'Choose Image (JPG, PNG)' : 'Elegir Imagen (JPG, PNG)'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Direct Image URL */}
                <div>
                  <label className="block text-xs font-mono text-neutral-400 mb-1.5 flex items-center gap-1.5">
                    <LinkIcon className="w-3.5 h-3.5 text-[#56A867]" />
                    <span>{language === 'en' ? 'Or Paste Image URL' : 'O Pegar URL de Imagen'}</span>
                  </label>
                  <input
                    type="url"
                    value={customPhotoInput.startsWith('data:') ? '' : customPhotoInput}
                    onChange={(e) => {
                      setCustomPhotoInput(e.target.value);
                      setPhotoUploadError('');
                    }}
                    placeholder="https://..."
                    className={`w-full p-2.5 rounded-xl border text-xs font-mono ${
                      isDark ? 'bg-[#181824] border-[#2A2A3C] text-white placeholder:text-neutral-600' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleSaveCustomPhoto}
                  className="py-2.5 px-5 rounded-xl bg-[#56A867] hover:bg-[#64B875] text-black font-bold text-xs font-mono uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-[0_0_15px_rgba(86,168,103,0.25)] cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{language === 'en' ? 'Save Custom Photo' : 'Guardar Foto Personalizada'}</span>
                </button>

                {(user.customAvatar || customPhotoInput) && (
                  <button
                    type="button"
                    onClick={handleRemoveCustomPhoto}
                    className="py-2.5 px-4 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 font-bold text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>
                      {user.role === 'entrenador'
                        ? (language === 'en' ? 'Restore Coach "C" Badge' : 'Restaurar Insignia Coach "C"')
                        : (language === 'en' ? 'Restore Athlete "D" Badge' : 'Restaurar Insignia Deportista "D"')}
                    </span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Section 1: Appearance & Theme Mode */}
        <div
          className={`p-6 rounded-2xl border transition-all ${
            isDark ? 'bg-[#121218] border-[#22222E]' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <div className="flex items-center gap-2.5 pb-3 border-b border-inherit mb-4">
            <Sun className={`w-5 h-5 ${isDark ? 'text-[#56A867]' : 'text-amber-500'}`} />
            <h2 className={`font-serif font-bold text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {t('prefAppearance')}
            </h2>
          </div>

          <p className={`text-xs mb-4 leading-relaxed ${isDark ? 'text-neutral-400' : 'text-slate-600'}`}>
            Alterna entre la estética Obsidian de alto contraste para entrenamientos con baja iluminación o el modo claro limpio y luminoso.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setTheme('dark')}
              className={`p-4 rounded-xl border flex flex-col items-center gap-2 text-xs font-semibold transition-all ${
                isDark
                  ? 'bg-[#181822] border-[#56A867] text-[#56A867] shadow-[0_0_15px_rgba(86,168,103,0.15)]'
                  : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Moon className="w-5 h-5" />
              <span>{t('themeDark')} (Obsidian)</span>
            </button>

            <button
              type="button"
              onClick={() => setTheme('light')}
              className={`p-4 rounded-xl border flex flex-col items-center gap-2 text-xs font-semibold transition-all ${
                !isDark
                  ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm'
                  : 'bg-[#161620] border-[#262634] text-neutral-400 hover:text-white'
              }`}
            >
              <Sun className="w-5 h-5 text-amber-500" />
              <span>{t('themeLight')} (Clean)</span>
            </button>
          </div>
        </div>

        {/* Section 2: Language Switcher (6 Languages) */}
        <div
          className={`p-6 rounded-2xl border transition-all ${
            isDark ? 'bg-[#121218] border-[#22222E]' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <div className="flex items-center gap-2.5 pb-3 border-b border-inherit mb-4">
            <Globe className={`w-5 h-5 ${isDark ? 'text-[#56A867]' : 'text-emerald-600'}`} />
            <h2 className={`font-serif font-bold text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {t('prefLanguage')}
            </h2>
          </div>

          <p className={`text-xs mb-4 leading-relaxed ${isDark ? 'text-neutral-400' : 'text-slate-600'}`}>
            Selecciona el idioma dinámico para todos los módulos, métricas antropométricas, racha y respuestas del asistente IA.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {languagesList.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setLanguage(item.id)}
                className={`p-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all ${
                  language === item.id
                    ? isDark
                      ? 'bg-[#181822] border-[#56A867] text-[#56A867] shadow-[0_0_12px_rgba(86,168,103,0.15)]'
                      : 'bg-emerald-50 border-emerald-500 text-emerald-800'
                    : isDark
                    ? 'bg-[#161620] border-[#262634] text-neutral-400 hover:text-white'
                    : 'bg-slate-100 border-slate-200 text-slate-700'
                }`}
              >
                <span>{item.flag}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Section 3: Font Size Scale for Glasses & Distance (Slider + Presets) */}
        <div
          className={`p-6 rounded-2xl border transition-all md:col-span-2 ${
            isDark ? 'bg-[#121218] border-[#22222E]' : 'bg-white border-slate-200 shadow-sm'
          }`}
          id="font-size-config-card"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-inherit mb-4">
            <div className="flex items-center gap-2.5">
              <Glasses className={`w-5 h-5 ${isDark ? 'text-[#56A867]' : 'text-emerald-600'}`} />
              <div>
                <h2 className={`font-serif font-bold text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {t('prefFontSize')}
                </h2>
                <span className={`text-[11px] font-mono ${isDark ? 'text-[#56A867]' : 'text-emerald-600'}`}>
                  Escalado global en tiempo real • Diseñado para ver con gafas y a distancia
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded-lg border ${
                isDark ? 'bg-zinc-800 border-zinc-700 text-[#56A867]' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
              }`}>
                {fontSizePx}px • {fontSizeMode.toUpperCase()}
              </span>
            </div>
          </div>

          <p className={`text-xs mb-4 leading-relaxed ${isDark ? 'text-neutral-400' : 'text-slate-600'}`}>
            {t('fontSizeDesc')}
          </p>

          {/* Continuous interactive font slider */}
          <div className="mb-6 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-zinc-500">
              <span>Mínimo (14px)</span>
              <span className="text-zinc-900 dark:text-white font-mono">{fontSizePx}px (Actual)</span>
              <span>Máximo (22px)</span>
            </div>
            <input
              id="font-size-slider"
              type="range"
              min="14"
              max="22"
              step="0.5"
              value={fontSizePx}
              onChange={(e) => setFontSizePx(parseFloat(e.target.value))}
              className="w-full accent-lime-400 h-2 bg-zinc-200 dark:bg-zinc-700 rounded-lg cursor-pointer"
            />
            {/* Live Text Preview Box */}
            <div className="p-3 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
              <span className="text-xs text-zinc-400 block mb-1">Vista Previa de Lectura:</span>
              <p className="font-semibold text-zinc-900 dark:text-white leading-relaxed">
                "Serie 3: 12 Repeticiones con 85 kg • Descanso restante: 90 segundos • Frecuencia Cardíaca: 142 BPM"
              </p>
            </div>
          </div>

          {/* Quick Preset Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <button
              type="button"
              onClick={() => setFontSizeMode('small')}
              className={`p-3.5 rounded-xl border flex flex-col text-left gap-1 transition-all ${
                fontSizeMode === 'small'
                  ? isDark
                    ? 'bg-[#181822] border-[#56A867] text-[#56A867] shadow-[0_0_12px_rgba(86,168,103,0.15)]'
                    : 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-sm'
                  : isDark
                  ? 'bg-[#161620] border-[#262634] text-neutral-300 hover:text-white'
                  : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs">{t('fontSizeSmall')}</span>
                <span className="text-[10px] font-mono opacity-70">14px</span>
              </div>
              <span className="text-[11px] opacity-75">Compacto para pantallas con alta densidad.</span>
            </button>

            <button
              type="button"
              onClick={() => setFontSizeMode('standard')}
              className={`p-3.5 rounded-xl border flex flex-col text-left gap-1 transition-all ${
                fontSizeMode === 'standard'
                  ? isDark
                    ? 'bg-[#181822] border-[#56A867] text-[#56A867] shadow-[0_0_12px_rgba(86,168,103,0.15)]'
                    : 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-sm'
                  : isDark
                  ? 'bg-[#161620] border-[#262634] text-neutral-300 hover:text-white'
                  : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs">{t('fontSizeStandard')}</span>
                <span className="text-[10px] font-mono opacity-70">16px</span>
              </div>
              <span className="text-[11px] opacity-75">Tamaño estándar clásico web.</span>
            </button>

            <button
              type="button"
              onClick={() => setFontSizeMode('large')}
              className={`p-3.5 rounded-xl border flex flex-col text-left gap-1 transition-all relative overflow-hidden ${
                fontSizeMode === 'large'
                  ? isDark
                    ? 'bg-[#181822] border-[#56A867] text-[#56A867] shadow-[0_0_12px_rgba(86,168,103,0.15)] ring-1 ring-[#56A867]/40'
                    : 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-sm ring-1 ring-emerald-500/40'
                  : isDark
                  ? 'bg-[#161620] border-[#262634] text-neutral-300 hover:text-white'
                  : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs flex items-center gap-1">
                  {t('fontSizeLarge')} <span className="text-[9px] px-1 rounded bg-[#56A867]/20 text-[#56A867]">TOP</span>
                </span>
                <span className="text-[10px] font-mono opacity-70">18.5px</span>
              </div>
              <span className="text-[11px] opacity-75">Nítido y descansado para gafas.</span>
            </button>

            <button
              type="button"
              onClick={() => setFontSizeMode('xlarge')}
              className={`p-3.5 rounded-xl border flex flex-col text-left gap-1 transition-all ${
                fontSizeMode === 'xlarge'
                  ? isDark
                    ? 'bg-[#181822] border-[#56A867] text-[#56A867] shadow-[0_0_12px_rgba(86,168,103,0.15)] ring-1 ring-[#56A867]/40'
                    : 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-sm ring-1 ring-emerald-500/40'
                  : isDark
                  ? 'bg-[#161620] border-[#262634] text-neutral-300 hover:text-white'
                  : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs">{t('fontSizeXLarge')}</span>
                <span className="text-[10px] font-mono opacity-70">21px</span>
              </div>
              <span className="text-[11px] opacity-75">Máxima legibilidad a distancia.</span>
            </button>
          </div>
        </div>

        {/* Section 4: Biomechanical Profile Form */}
        <div
          className={`p-6 rounded-2xl border transition-all ${
            isDark ? 'bg-[#121218] border-[#22222E]' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between pb-3 border-b border-inherit mb-4">
            <div className="flex items-center gap-2.5">
              <User className={`w-5 h-5 ${isDark ? 'text-[#56A867]' : 'text-emerald-600'}`} />
              <h2 className={`font-serif font-bold text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {t('prefBiometrics')}
              </h2>
            </div>
            <button
              onClick={() => navigateTo('my-account')}
              className="text-xs font-bold text-[#56A867] hover:underline flex items-center gap-1"
            >
              <span>Ver Historial Antropométrico</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label className={`block text-xs font-mono mb-1.5 ${isDark ? 'text-neutral-400' : 'text-slate-600'}`}>
                Nombre del Atleta
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`w-full p-2.5 rounded-xl border text-xs font-sans ${
                  isDark ? 'bg-[#161620] border-[#262634] text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={`block text-xs font-mono mb-1.5 ${isDark ? 'text-neutral-400' : 'text-slate-600'}`}>
                  {t('weightLabel')} (kg)
                </label>
                <input
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(Number(e.target.value))}
                  className={`w-full p-2.5 rounded-xl border text-xs font-mono ${
                    isDark ? 'bg-[#161620] border-[#262634] text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-xs font-mono mb-1.5 ${isDark ? 'text-neutral-400' : 'text-slate-600'}`}>
                  {t('heightLabel')} (cm)
                </label>
                <input
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(Number(e.target.value))}
                  className={`w-full p-2.5 rounded-xl border text-xs font-mono ${
                    isDark ? 'bg-[#161620] border-[#262634] text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={`block text-xs font-mono mb-1.5 ${isDark ? 'text-neutral-400' : 'text-slate-600'}`}>
                  {t('clothingSizeLabel')}
                </label>
                <select
                  value={clothingSize}
                  onChange={(e) => setClothingSize(e.target.value as ClothingSize)}
                  className={`w-full p-2.5 rounded-xl border text-xs font-sans ${
                    isDark ? 'bg-[#161620] border-[#262634] text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                >
                  <option value="XS">XS (Extra Small)</option>
                  <option value="S">S (Small)</option>
                  <option value="M">M (Medium)</option>
                  <option value="L">L (Large)</option>
                  <option value="XL">XL (Extra Large)</option>
                  <option value="XXL">XXL (Double Extra)</option>
                </select>
              </div>

              <div>
                <label className={`block text-xs font-mono mb-1.5 ${isDark ? 'text-neutral-400' : 'text-slate-600'}`}>
                  {t('bodyTypeLabel')}
                </label>
                <select
                  value={bodyType}
                  onChange={(e) => setBodyType(e.target.value as BodyType)}
                  className={`w-full p-2.5 rounded-xl border text-xs font-sans ${
                    isDark ? 'bg-[#161620] border-[#262634] text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                >
                  <option value="Ectomorfo">Ectomorfo</option>
                  <option value="Mesomorfo">Mesomorfo</option>
                  <option value="Endomorfo">Endomorfo</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 ${
                isDark
                  ? 'bg-[#56A867] hover:bg-[#9eff1a] text-black shadow-[0_0_15px_rgba(86,168,103,0.2)]'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{t('save')} Biometría</span>
            </button>
          </form>
        </div>

        {/* Section 5: Security, Account Switching & Permanent Deletion */}
        <div
          className={`p-6 rounded-2xl border transition-all flex flex-col justify-between ${
            isDark ? 'bg-[#121218] border-[#22222E]' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <div className="space-y-3">
            <div className="flex items-center gap-2.5 pb-3 border-b border-inherit">
              <Shield className={`w-5 h-5 ${isDark ? 'text-[#56A867]' : 'text-emerald-600'}`} />
              <h2 className={`font-serif font-bold text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {t('prefSecurity')}
              </h2>
            </div>

            <p className={`text-xs leading-relaxed ${isDark ? 'text-neutral-400' : 'text-slate-600'}`}>
              Gestión de credenciales, cambio de usuario sin exponer datos residuales y eliminación definitiva.
            </p>

            {/* Go to My Account */}
            <button
              type="button"
              onClick={() => navigateTo('my-account')}
              className={`w-full p-3 rounded-xl border flex items-center justify-between text-xs font-semibold transition-colors ${
                isDark
                  ? 'bg-[#181824] border-[#2B2B38] text-white hover:border-[#56A867]/50'
                  : 'bg-slate-50 border-slate-200 text-slate-800 hover:border-emerald-500'
              }`}
            >
              <div className="flex items-center gap-2">
                <User className={`w-4 h-4 ${isDark ? 'text-[#56A867]' : 'text-emerald-600'}`} />
                <span>
                  {language === 'en'
                    ? `${t('accountTitle')} (View ID, Streak & Biometrics)`
                    : `${t('accountTitle')} (Ver DNI, Racha y Biometría)`}
                </span>
              </div>
              <span className={`text-[10px] font-mono ${isDark ? 'text-[#56A867]' : 'text-emerald-600'}`}>
                {language === 'en' ? 'Open Module →' : 'Abrir Módulo →'}
              </span>
            </button>

            {/* Switch account button */}
            <button
              type="button"
              onClick={() => setIsSwitchAccountOpen(true)}
              className={`w-full p-3 rounded-xl border flex items-center justify-between text-xs font-semibold transition-colors ${
                isDark
                  ? 'bg-[#181824] border-[#2B2B38] text-white hover:border-[#56A867]/50'
                  : 'bg-slate-50 border-slate-200 text-slate-800 hover:border-emerald-500'
              }`}
            >
              <div className="flex items-center gap-2">
                <RefreshCw className={`w-4 h-4 ${isDark ? 'text-[#56A867]' : 'text-emerald-600'}`} />
                <span>{t('switchAccount')}</span>
              </div>
              <span className={`text-[10px] font-mono ${isDark ? 'text-[#56A867]' : 'text-emerald-600'}`}>
                {language === 'en' ? 'Switch →' : 'Cambiar →'}
              </span>
            </button>

            {/* Change password */}
            <button
              type="button"
              onClick={openForgotPassword}
              className={`w-full p-3 rounded-xl border flex items-center justify-between text-xs font-semibold transition-colors ${
                isDark
                  ? 'bg-[#181824] border-[#2B2B38] text-white hover:border-[#56A867]/50'
                  : 'bg-slate-50 border-slate-200 text-slate-800 hover:border-emerald-500'
              }`}
            >
              <div className="flex items-center gap-2">
                <KeyRound className={`w-4 h-4 ${isDark ? 'text-[#56A867]' : 'text-emerald-600'}`} />
                <span>{t('changePassword')}</span>
              </div>
              <span className={`text-[10px] font-mono ${isDark ? 'text-[#56A867]' : 'text-emerald-600'}`}>
                {language === 'en' ? 'Manage →' : 'Gestionar →'}
              </span>
            </button>

            {/* Credential DB view - Strictly for coach / entrenador */}
            {user.role === 'entrenador' && (
              <button
                type="button"
                onClick={() => navigateTo('database')}
                className={`w-full p-3 rounded-xl border flex items-center justify-between text-xs font-semibold transition-colors ${
                  isDark
                    ? 'bg-[#181824] border-[#2B2B38] text-white hover:border-[#56A867]/50'
                    : 'bg-slate-50 border-slate-200 text-slate-800 hover:border-emerald-500'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Database className={`w-4 h-4 ${isDark ? 'text-[#56A867]' : 'text-emerald-600'}`} />
                  <span>{language === 'en' ? 'SQL Credential & Access Database' : 'Base de Datos de Credenciales & Acceso'}</span>
                </div>
                <span className={`text-[10px] font-mono ${isDark ? 'text-[#56A867]' : 'text-emerald-600'}`}>
                  {language === 'en' ? 'View →' : 'Ver →'}
                </span>
              </button>
            )}
          </div>

          <div className="pt-4 border-t border-inherit space-y-2.5 mt-4">
            {/* Logout button */}
            <button
              type="button"
              onClick={() => {
                if (window.confirm(t('logoutConfirmation'))) {
                  logout();
                }
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 font-bold text-xs border border-red-500/30 transition-all flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              <span>{t('logout')}</span>
            </button>

            {/* Permanent Account Deletion trigger */}
            <button
              type="button"
              onClick={() => setIsDeleteModalOpen(true)}
              className="w-full py-2 px-3 rounded-xl text-red-500/80 hover:text-red-400 hover:bg-red-500/5 text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{t('deleteAccount')}</span>
            </button>
          </div>
        </div>
      </div>
    </ScrollReveal>

      {/* GitHub & Vercel API Key Code & Status Viewer */}
      <ScrollReveal direction="up" delay={0.12} duration={0.4}>
        <ApiKeyStatusCard isDark={isDark} />
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

            {deleteError && (
              <p className="text-xs text-red-400 font-bold bg-red-500/10 p-2 rounded-lg border border-red-500/20">
                {deleteError}
              </p>
            )}

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
                  setDeleteError('');
                }}
                className="px-4 py-2 rounded-xl border border-zinc-700 text-zinc-300 font-bold text-sm cursor-pointer"
              >
                {t('cancel')}
              </button>
              <button
                type="button"
                disabled={isDeleting || (deleteConfirmationText.trim().toUpperCase() !== 'ELIMINAR' && deleteConfirmationText.trim().toUpperCase() !== 'DELETE')}
                onClick={handleDeleteAccount}
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
