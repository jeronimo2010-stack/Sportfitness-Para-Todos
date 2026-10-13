/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Bell,
  BellOff,
  Menu,
  X,
  Search,
  Zap,
  ChevronDown,
  User,
  Shield,
  Dumbbell,
  Calendar,
  Sparkles,
  Award,
  Layers,
  Sun,
  Moon,
  Globe,
  LogOut,
  KeyRound,
  CheckCircle2,
  Trash2,
} from 'lucide-react';
import { ScreenId, UserProfile } from '../../types';
import { EmblemLogo } from './EmblemLogo';
import { useApp } from '../../context/AppContext';
import { LanguageSelector } from './LanguageSelector';
import { UserAvatar } from './UserAvatar';

interface HeaderProps {
  currentScreen: ScreenId;
  onNavigate: (screen: ScreenId) => void;
  user: UserProfile;
  onToggleSidebar?: () => void;
  onOpenSwitchAccount?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentScreen,
  onNavigate,
  user,
  onToggleSidebar,
  onOpenSwitchAccount,
}) => {
  const {
    theme,
    toggleTheme,
    language,
    setLanguage,
    t,
    logout,
    openForgotPassword,
    notifications,
    notificationConsent,
    acceptNotifications,
    markAllNotificationsRead,
  } = useApp();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showModuleSelector, setShowModuleSelector] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);

  const hasUnread = notifications.some((n) => n.unread);

  const isCoach = user.role === 'entrenador';

  // Ordered modules as requested, excluding sport assistant, and database only for coach
  const modulesList: { id: ScreenId; title: string; category: string }[] = [
    { id: 'landing', title: t('navLanding'), category: language === 'en' ? 'Public' : 'Público' },
    { id: 'athlete-login', title: t('navAthleteLogin'), category: language === 'en' ? 'Access' : 'Acceso' },
    { id: 'trainer-login', title: t('navTrainerLogin'), category: language === 'en' ? 'Access' : 'Acceso' },
    { id: 'my-account', title: t('accountTitle'), category: language === 'en' ? 'Account' : 'Cuenta' },
    { id: 'athlete-dashboard', title: t('navAthleteDashboard'), category: language === 'en' ? 'Athlete' : 'Atleta' },
    { id: 'trainer-overview', title: t('navTrainerDashboard'), category: language === 'en' ? 'Coach' : 'Entrenador' },
    // Do NOT offer workouts (routines / live-workout) to coaches
    ...(!isCoach
      ? [
          { id: 'routines' as ScreenId, title: t('navRoutines'), category: language === 'en' ? 'Workout' : 'Entrenamiento' },
          { id: 'live-workout' as ScreenId, title: t('navLiveWorkout'), category: language === 'en' ? 'Workout' : 'Entrenamiento' },
        ]
      : []),
    { id: 'calendar', title: t('navCalendar'), category: language === 'en' ? 'Schedule' : 'Agenda' },
    { id: 'nutrition', title: t('navNutrition'), category: language === 'en' ? 'Nutrition' : 'Nutrición' },
    { id: 'reviews', title: t('navReviews'), category: language === 'en' ? 'Community' : 'Comunidad' },
    ...(isCoach
      ? [
          {
            id: 'database' as ScreenId,
            title: language === 'en' ? 'SQL Database' : 'Base de Datos SQL',
            category: language === 'en' ? 'Database' : 'Base de Datos',
          },
        ]
      : []),
    { id: 'settings', title: t('navSettings'), category: language === 'en' ? 'Settings' : 'Ajustes' },
  ];

  const isDark = theme === 'dark';

  return (
    <header
      className={`sticky top-0 z-50 px-4 lg:px-8 py-3 flex items-center justify-between transition-all backdrop-blur-md border-b ${
        isDark
          ? 'bg-[#0B0C10]/95 border-[#222228] text-[#E0E0E0]'
          : 'bg-white/95 border-slate-200 text-slate-900 shadow-sm'
      }`}
    >
      {/* Click-outside backdrop to dismiss open dropdowns */}
      {(showModuleSelector || showNotifications || showUserMenu) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setShowModuleSelector(false);
            setShowNotifications(false);
            setShowUserMenu(false);
          }}
        />
      )}

      {/* Brand & Emblem */}
      <div className="flex items-center gap-2 sm:gap-3">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className={`min-w-[40px] min-h-[40px] p-2 rounded-lg md:hidden flex items-center justify-center transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-[#56A867] focus-visible:outline-none ${
              isDark ? 'hover:bg-[#181820] text-neutral-300' : 'hover:bg-slate-100 text-slate-700'
            }`}
            aria-label="Abrir menú de navegación lateral"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <button
          onClick={() => onNavigate('landing')}
          className="flex items-center gap-2.5 sm:gap-3 text-left focus:outline-none group focus-visible:ring-2 focus-visible:ring-[#56A867] focus-visible:outline-none rounded-lg p-1"
        >
          <EmblemLogo size="sm" />
          <div className="hidden sm:flex flex-col">
            <span
              className={`font-serif font-bold text-lg tracking-wide transition-colors leading-tight ${
                isDark ? 'text-white group-hover:text-[#56A867]' : 'text-slate-900 group-hover:text-emerald-600'
              }`}
            >
              Fitness
            </span>
            <span
              className={`text-[10px] tracking-[0.2em] font-mono font-semibold uppercase ${
                isDark ? 'text-[#56A867]' : 'text-emerald-600'
              }`}
            >
              Para Todos
            </span>
          </div>
        </button>

        {/* Global Module Switcher Pill */}
        <div className="relative ml-1 sm:ml-2">
          <button
            onClick={() => setShowModuleSelector(!showModuleSelector)}
            className={`min-h-[38px] flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono transition-all border cursor-pointer focus-visible:ring-2 focus-visible:ring-[#56A867] focus-visible:outline-none ${
              isDark
                ? 'bg-[#18181C] hover:bg-[#222228] border-[#2D2D35] hover:border-[#56A867]/50 text-[#E0E0E0]'
                : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800'
            }`}
            title={language === 'en' ? 'Select section' : 'Seleccionar sección'}
            aria-expanded={showModuleSelector}
          >
            <Layers className={`w-3.5 h-3.5 shrink-0 ${isDark ? 'text-[#56A867]' : 'text-emerald-600'}`} />
            <span className="hidden md:inline font-sans text-xs opacity-75">
              {language === 'en' ? 'Section:' : 'Sección:'}
            </span>
            <span className="font-semibold truncate max-w-[110px] sm:max-w-[180px]">
              {modulesList.find((m) => m.id === currentScreen)?.title.split('.')[1]?.trim() || currentScreen}
            </span>
            <ChevronDown className="w-3 h-3 opacity-60 shrink-0" />
          </button>

          {showModuleSelector && (
            <div
              className={`absolute left-0 mt-2 w-80 sm:w-96 max-h-[460px] overflow-y-auto rounded-xl shadow-2xl p-2 z-50 border ${
                isDark
                  ? 'bg-[#121216] border-[#2A2A32] divide-y divide-[#1E1E24]'
                  : 'bg-white border-slate-200 divide-y divide-slate-100 shadow-slate-300'
              }`}
            >
              <div
                className={`p-2 text-[11px] font-mono uppercase tracking-wider flex items-center justify-between ${
                  isDark ? 'text-[#56A867]' : 'text-emerald-700 font-bold'
                }`}
              >
                <span>{language === 'en' ? 'Platform Navigation' : 'Arquitectura Completa'}</span>
                <span className="text-neutral-500">
                  {modulesList.length} {language === 'en' ? 'views' : 'vistas'}
                </span>
              </div>
              <div className="py-1 space-y-0.5">
                {modulesList.map((mod) => (
                  <button
                    key={mod.id}
                    onClick={() => {
                      onNavigate(mod.id);
                      setShowModuleSelector(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between transition-colors ${
                      currentScreen === mod.id
                        ? isDark
                          ? 'bg-[#56A867]/15 text-[#56A867] font-semibold border border-[#56A867]/30'
                          : 'bg-emerald-50 text-emerald-800 font-bold border border-emerald-300'
                        : isDark
                        ? 'text-white hover:bg-[#1A1A22] hover:text-[#56A867] font-medium'
                        : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <span>{mod.title}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                        isDark ? 'bg-[#1F1F28] text-neutral-400' : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {mod.category}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Controls: Theme Toggle, Language Switcher, Notifications, User Menu */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick CTA to Live Workout */}
        {currentScreen !== 'live-workout' && (
          <button
            onClick={() => onNavigate('live-workout')}
            className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-xs transition-all shadow-md ${
              isDark
                ? 'bg-[#56A867] text-black hover:bg-[#64B875] shadow-[0_0_15px_rgba(86,168,103,0.25)]'
                : 'bg-emerald-600 text-white hover:bg-emerald-700'
            }`}
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>{t('startWorkout')}</span>
          </button>
        )}

        {/* 1. Theme Toggle Button (Dark / Light) */}
        <button
          onClick={toggleTheme}
          title={isDark ? t('themeLight') : t('themeDark')}
          className={`p-2 rounded-lg border transition-all flex items-center gap-1.5 ${
            isDark
              ? 'bg-[#141418] hover:bg-[#1E1E24] text-neutral-300 hover:text-white border-[#222228]'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border-slate-200'
          }`}
          aria-label="Toggle dark/light theme"
        >
          {isDark ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-slate-700" />
          )}
          <span className="hidden lg:inline text-[11px] font-mono font-medium">
            {isDark ? (language === 'en' ? 'Light' : 'Claro') : (language === 'en' ? 'Dark' : 'Oscuro')}
          </span>
        </button>

        {/* 2. Language Selector (Visible, simple, modern: ES / EN) */}
        <LanguageSelector variant="compact-pills" className="hidden sm:inline-flex" />

        {/* Notifications Icon with Badge */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className={`min-w-[40px] min-h-[40px] p-2 rounded-lg border transition-colors relative flex items-center justify-center cursor-pointer focus-visible:ring-2 focus-visible:ring-[#56A867] focus-visible:outline-none ${
              isDark
                ? 'bg-[#141418] hover:bg-[#1E1E24] text-neutral-300 hover:text-white border-[#222228]'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border-slate-200'
            }`}
            aria-label="Abrir centro de notificaciones"
            aria-expanded={showNotifications}
          >
            <Bell className="w-4 h-4" />
            {hasUnread && (
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500 ring-2 ring-current" />
            )}
          </button>

          {showNotifications && (
            <div
              className={`absolute right-0 mt-2 w-[calc(100vw-2rem)] sm:w-80 max-w-sm rounded-xl border shadow-2xl p-3 z-50 ${
                isDark ? 'bg-[#121216] border-[#2A2A32]' : 'bg-white border-slate-200 shadow-slate-300'
              }`}
            >
              <div className="flex items-center justify-between pb-2 border-b border-inherit mb-2">
                <span className={`text-xs font-mono font-bold uppercase tracking-wider ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {language === 'en' ? `Notifications (${notifications.length})` : `Notificaciones (${notifications.length})`}
                </span>
                {notifications.length > 0 && hasUnread && (
                  <button
                    onClick={markAllNotificationsRead}
                    className={`text-[10px] font-mono cursor-pointer hover:underline p-1 ${isDark ? 'text-[#56A867]' : 'text-emerald-600'}`}
                  >
                    {language === 'en' ? 'Mark read' : 'Marcar leídas'}
                  </button>
                )}
              </div>

              {notifications.length === 0 ? (
                <div className="py-6 px-3 text-center space-y-2">
                  <BellOff className="w-6 h-6 mx-auto opacity-40 text-neutral-400" />
                  <p className={`text-xs ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>
                    {language === 'en' ? 'No pending notifications' : 'No tienes notificaciones pendientes'}
                  </p>
                  {notificationConsent !== 'granted' && (
                    <button
                      onClick={() => {
                        setShowNotifications(false);
                        acceptNotifications();
                      }}
                      className="mt-1 text-[11px] text-[#56A867] hover:underline font-mono font-medium block mx-auto cursor-pointer p-1"
                    >
                      {language === 'en' ? '+ Enable notifications' : '+ Activar notificaciones'}
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`p-2.5 rounded-lg text-xs transition-colors ${
                        n.unread
                          ? isDark
                            ? 'bg-[#1A1A22] border-l-2 border-[#56A867]'
                            : 'bg-emerald-50 border-l-2 border-emerald-600'
                          : isDark
                          ? 'bg-[#141418]'
                          : 'bg-slate-50'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <span className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{n.title}</span>
                        <span className="text-[10px] opacity-60 font-mono">{n.time}</span>
                      </div>
                      <p className={`mt-1 text-[11px] leading-relaxed ${isDark ? 'text-neutral-400' : 'text-slate-600'}`}>
                        {n.desc}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* User Profile Avatar & Full Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className={`min-h-[40px] flex items-center gap-2 p-1 pr-2.5 rounded-full border transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-[#56A867] focus-visible:outline-none ${
              isDark
                ? 'bg-[#141418] hover:bg-[#1E1E24] border-[#222228]'
                : 'bg-slate-100 hover:bg-slate-200 border-slate-200'
            }`}
            aria-label="Menú de perfil de usuario"
            aria-expanded={showUserMenu}
          >
            <UserAvatar user={user} size="sm" border={false} className="w-7 h-7" />
            <span className={`hidden sm:inline text-xs font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {user.name}
            </span>
            <ChevronDown className="w-3 h-3 opacity-60" />
          </button>

          {showUserMenu && (
            <div
              className={`absolute right-0 mt-2 w-64 rounded-xl border shadow-2xl p-2 z-50 divide-y ${
                isDark
                  ? 'bg-[#121216] border-[#2A2A32] divide-[#1E1E24]'
                  : 'bg-white border-slate-200 divide-slate-100 shadow-slate-300'
              }`}
            >
              <div className="p-3 text-left">
                <p className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{user.name}</p>
                <p className={`text-[11px] truncate ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>{user.email}</p>
                <div
                  className={`mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold ${
                    isDark ? 'bg-[#56A867]/15 text-[#56A867]' : 'bg-emerald-50 text-emerald-700'
                  }`}
                >
                  <Award className="w-3 h-3" />
                  {user.membershipPlan}
                </div>
              </div>

              <div className="py-1 text-left">
                <button
                  onClick={() => {
                    onNavigate('my-account');
                    setShowUserMenu(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs rounded-lg flex items-center gap-2 transition-colors ${
                    isDark ? 'text-neutral-300 hover:bg-[#1A1A22] hover:text-white' : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <User className="w-3.5 h-3.5 text-[#56A867]" />
                  <span className="font-bold text-[#56A867]">{t('accountTitle')} & Progreso</span>
                </button>

                <button
                  onClick={() => {
                    onNavigate('athlete-dashboard');
                    setShowUserMenu(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs rounded-lg flex items-center gap-2 transition-colors ${
                    isDark ? 'text-neutral-300 hover:bg-[#1A1A22] hover:text-white' : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <User className="w-3.5 h-3.5 text-emerald-500" />
                  <span>{t('dashboard')}</span>
                </button>

                <button
                  onClick={() => {
                    onNavigate('settings');
                    setShowUserMenu(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs rounded-lg flex items-center gap-2 transition-colors ${
                    isDark ? 'text-neutral-300 hover:bg-[#1A1A22] hover:text-white' : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                  <span>{t('settings')}</span>
                </button>

                {onOpenSwitchAccount && (
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      onOpenSwitchAccount();
                    }}
                    className={`w-full text-left px-3 py-2 text-xs rounded-lg flex items-center gap-2 transition-colors ${
                      isDark ? 'text-neutral-300 hover:bg-[#1A1A22] hover:text-white' : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <User className="w-3.5 h-3.5 text-blue-400" />
                    <span>{t('switchAccount')}</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    openForgotPassword();
                    setShowUserMenu(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs rounded-lg flex items-center gap-2 transition-colors ${
                    isDark ? 'text-neutral-300 hover:bg-[#1A1A22] hover:text-white' : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <KeyRound className="w-3.5 h-3.5 text-emerald-500" />
                  <span>{t('changePassword')}</span>
                </button>
              </div>

              {/* 3. Cerrar Sesión & Eliminar Cuenta Buttons */}
              <div className="p-1 space-y-0.5">
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    onNavigate('settings');
                  }}
                  className="w-full text-left px-3 py-2 text-xs text-rose-400 hover:bg-rose-500/10 rounded-lg flex items-center gap-2 font-semibold transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                  <span>{t('deleteAccount')}</span>
                </button>

                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    logout();
                  }}
                  className="w-full text-left px-3 py-2 text-xs text-red-500 hover:bg-red-500/10 rounded-lg flex items-center gap-2 font-semibold transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>{t('logout')}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
