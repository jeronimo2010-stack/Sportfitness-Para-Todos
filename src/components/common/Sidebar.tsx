/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  LayoutDashboard,
  User,
  Dumbbell,
  BarChart3,
  Calendar,
  Utensils,
  Star,
  Bot,
  Settings,
  Sparkles,
  LogOut,
  Users,
  Sun,
  Moon,
  Globe,
  KeyRound,
  X,
  Activity,
  Newspaper,
  Flame,
  Database,
  Glasses,
} from 'lucide-react';
import { ScreenId, UserProfile } from '../../types';
import { useApp } from '../../context/AppContext';
import { UserAvatar } from './UserAvatar';

interface SidebarProps {
  currentScreen: ScreenId;
  onNavigate: (screen: ScreenId) => void;
  userRole?: string;
  isOpen?: boolean;
  onClose?: () => void;
  onOpenSwitchAccount?: () => void;
}

interface SidebarNavItem {
  id: ScreenId;
  label: string;
  icon: any;
  badge?: string;
  highlight?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentScreen,
  onNavigate,
  isOpen = false,
  onClose,
  onOpenSwitchAccount,
}) => {
  const { theme, toggleTheme, fontSizeMode, cycleFontSize, language, setLanguage, t, user, logout } = useApp();

  const isDark = theme === 'dark';

  const isCoach = user.role === 'entrenador';

  const mainNavItems: SidebarNavItem[] = [
    {
      id: 'my-account' as ScreenId,
      label: t('accountTitle'),
      icon: User,
      badge: 'PRO',
    },
    {
      id: (isCoach ? 'trainer-overview' : 'athlete-dashboard') as ScreenId,
      label: t('dashboard'),
      icon: LayoutDashboard,
    },
    // Do NOT offer 'routines' (entrenamientos) to coach accounts
    ...(!isCoach
      ? [
          {
            id: 'routines' as ScreenId,
            label: t('routines'),
            icon: Dumbbell,
            badge: '4',
          },
        ]
      : []),
    {
      id: 'calendar' as ScreenId,
      label: t('calendar'),
      icon: Calendar,
    },
    {
      id: 'weekly-news' as ScreenId,
      label: t('sidebar.newsAndStreak'),
      icon: Newspaper,
    },
    {
      id: 'nutrition' as ScreenId,
      label: t('nutrition'),
      icon: Utensils,
    },
    ...(!isCoach
      ? [
          {
            id: 'trainer-overview' as ScreenId,
            label: t('coaches'),
            icon: Users,
          },
        ]
      : []),
    {
      id: 'reviews' as ScreenId,
      label: t('reviews'),
      icon: Star,
    },
    // SQL Database is ONLY visible from a coach (entrenador) account
    ...(isCoach
      ? [
          {
            id: 'database' as ScreenId,
            label: t('sidebar.sqlDatabase'),
            icon: Database,
            badge: 'SQL',
          },
        ]
      : []),
    {
      id: 'settings' as ScreenId,
      label: t('settings'),
      icon: Settings,
    },
  ];

  const sidebarContent = (
    <div
      className={`w-64 flex flex-col justify-between p-4 h-full shrink-0 border-r select-none transition-colors ${
        isDark
          ? 'bg-[#0E0E12] border-[#1E1E24] text-[#E0E0E0]'
          : 'bg-slate-50 border-slate-200 text-slate-900'
      }`}
    >
      {/* Upper Navigation Items with scrollable container */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <div className="flex items-center justify-between px-2 pb-3 shrink-0">
          <span
            className={`text-[10px] font-mono uppercase tracking-[0.2em] font-semibold ${
              isDark ? 'text-neutral-400' : 'text-slate-600'
            }`}
          >
            {t('sidebar.platformTitle')}
          </span>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg md:hidden text-neutral-400 hover:text-white min-w-[36px] min-h-[36px] flex items-center justify-center cursor-pointer"
              aria-label={t('sidebar.closeMenu')}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto space-y-1 pr-1.5 overscroll-contain">
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentScreen === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id);
                  if (onClose) onClose();
                }}
                className={`w-full min-h-[42px] flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group cursor-pointer focus-visible:ring-2 focus-visible:ring-[#56A867] focus-visible:outline-none ${
                  isActive
                    ? isDark
                      ? 'bg-[#56A867]/20 text-[#56A867] font-bold border border-[#56A867]/40 shadow-[0_0_15px_rgba(86,168,103,0.15)]'
                      : 'bg-emerald-50 text-emerald-800 font-bold border border-emerald-300 shadow-sm'
                    : isDark
                    ? 'text-white hover:text-[#56A867] hover:bg-[#18181F]'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-transform group-hover:scale-110 shrink-0 ${
                      isActive
                        ? isDark
                          ? 'text-[#56A867]'
                          : 'text-emerald-600'
                        : item.highlight
                        ? isDark
                          ? 'text-[#56A867]'
                          : 'text-emerald-600'
                        : isDark
                        ? 'text-neutral-300 group-hover:text-[#56A867]'
                        : 'text-slate-600 group-hover:text-slate-900'
                    }`}
                  />
                  <span className={isDark && !isActive ? 'text-white' : ''}>{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-md ${
                      isDark ? 'bg-[#242430] text-neutral-300' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Controls & Upgrade Card */}
      <div className="space-y-4 pt-4 border-t border-inherit shrink-0">
        {/* Quick Language & Theme toggles */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-xl text-xs font-mono flex items-center justify-center gap-1.5 border transition-all ${
              isDark
                ? 'bg-[#14141A] border-[#22222A] text-neutral-300 hover:text-white'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            {isDark ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span>{t('header.themeLightLabel')}</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-slate-700" />
                <span>{t('header.themeDarkLabel')}</span>
              </>
            )}
          </button>

          <button
            onClick={() => setLanguage(language === 'es' ? 'en' : 'es')}
            title={t('sidebar.switchToLang')}
            className={`p-2 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-1.5 border transition-all ${
              isDark
                ? 'bg-[#14141A] border-[#22222A] text-neutral-300 hover:text-white'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <span>{language === 'es' ? '🇪🇸 ES' : '🇺🇸 EN'}</span>
          </button>
        </div>

        {/* User Mini Bar with Logout Button */}
        <div
          className={`flex items-center justify-between p-2 rounded-xl border ${
            isDark ? 'bg-[#14141A] border-[#1E1E26]' : 'bg-white border-slate-200'
          }`}
        >
          <div
            onClick={() => {
              onNavigate('my-account');
              if (onClose) onClose();
            }}
            className="flex items-center gap-2.5 cursor-pointer hover:opacity-80 transition-opacity"
            title={t('sidebar.viewMyAccount')}
          >
            <UserAvatar user={user} size="sm" border={false} className="w-8 h-8" />
            <div className="flex flex-col text-left">
              <span className={`text-xs font-semibold truncate max-w-[90px] ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {user.name}
              </span>
              <span
                className={`text-[10px] font-mono ${
                  isDark ? 'text-[#56A867]' : 'text-emerald-700 font-semibold'
                }`}
              >
                {user.membershipPlan}
              </span>
            </div>
          </div>

          <button
            onClick={() => {
              if (onClose) onClose();
              logout();
            }}
            title={t('logout')}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-red-500 hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-[57px] bottom-0 z-40">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
          <div className="relative z-10 h-full">{sidebarContent}</div>
        </div>
      )}
    </>
  );
};
