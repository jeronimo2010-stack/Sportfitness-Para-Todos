/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, ScreenId } from '../types';
import { initialUser } from '../data/initialData';
import { Language, Theme, translations } from '../utils/translations';
import { localDatabase } from '../db/localDatabase';
import { authService } from '../services/authService';

export type FontSizeMode = 'small' | 'standard' | 'large' | 'xlarge';

export const VALID_SCREENS: Record<string, ScreenId> = {
  landing: 'landing',
  'athlete-login': 'athlete-login',
  'athlete-register': 'athlete-register',
  'trainer-login': 'trainer-login',
  'trainer-register': 'trainer-register',
  'athlete-dashboard': 'athlete-dashboard',
  dashboard: 'athlete-dashboard',
  'my-account': 'my-account',
  account: 'my-account',
  'trainer-overview': 'trainer-overview',
  trainer: 'trainer-overview',
  routines: 'routines',
  'routine-catalog': 'routines',
  'live-workout': 'live-workout',
  support: 'athlete-dashboard',
  'support-center': 'athlete-dashboard',
  calendar: 'calendar',
  nutrition: 'nutrition',
  reviews: 'reviews',
  exercises: 'athlete-dashboard',
  'exercise-library': 'athlete-dashboard',
  news: 'weekly-news',
  novedades: 'weekly-news',
  'weekly-news': 'weekly-news',
  running: 'athlete-dashboard',
  'running-tracker': 'athlete-dashboard',
  settings: 'settings',
  database: 'database',
  'database-manager': 'database',
};

export const SCREEN_TITLES: Record<string, string> = {
  landing: 'Sportfitness • Portal Oficial',
  'athlete-login': 'Sportfitness • Iniciar Sesión Atleta',
  'athlete-register': 'Sportfitness • Registro de Atleta',
  'trainer-login': 'Sportfitness • Iniciar Sesión Entrenador',
  'trainer-register': 'Sportfitness • Registro de Entrenador',
  'athlete-dashboard': 'Sportfitness • Dashboard del Atleta',
  'trainer-overview': 'Sportfitness • Panel de Entrenadores',
  routines: 'Sportfitness • Catálogo de Rutinas',
  'routine-catalog': 'Sportfitness • Catálogo de Rutinas',
  'live-workout': 'Sportfitness • Entrenamiento en Vivo',
  support: 'Sportfitness • Centro de Ayuda & Soporte',
  'support-center': 'Sportfitness • Centro de Ayuda & Soporte',
  calendar: 'Sportfitness • Calendario & Programación',
  nutrition: 'Sportfitness • Nutrición & Dietas',
  reviews: 'Sportfitness • Reseñas y Calificaciones',
  exercises: 'Sportfitness • Biblioteca de Ejercicios',
  'exercise-library': 'Sportfitness • Biblioteca de Ejercicios',
  'running-tracker': 'Sportfitness • Monitor de Running GPS',
  'weekly-news': 'Sportfitness • Boletín Deportivo Semanal',
  database: 'Sportfitness • Gestor de Base de Datos',
  'my-account': 'Sportfitness • Mi Cuenta & Seguridad',
  settings: 'Sportfitness • Configuración del Sistema',
};

export const SCREEN_TITLES_EN: Record<string, string> = {
  landing: 'Sportfitness • Official Portal',
  'athlete-login': 'Sportfitness • Athlete Login',
  'athlete-register': 'Sportfitness • Athlete Registration',
  'trainer-login': 'Sportfitness • Coach Login',
  'trainer-register': 'Sportfitness • Coach Registration',
  'athlete-dashboard': 'Sportfitness • Athlete Dashboard',
  'trainer-overview': 'Sportfitness • Coach Overview',
  routines: 'Sportfitness • Routine Catalog',
  'routine-catalog': 'Sportfitness • Routine Catalog',
  'live-workout': 'Sportfitness • Live Workout Session',
  support: 'Sportfitness • Help Center & Support',
  'support-center': 'Sportfitness • Help Center & Support',
  calendar: 'Sportfitness • Calendar & Schedule',
  nutrition: 'Sportfitness • Nutrition & Macros',
  reviews: 'Sportfitness • Community Reviews',
  exercises: 'Sportfitness • Exercise Library & Videos',
  'exercise-library': 'Sportfitness • Exercise Library & Videos',
  'running-tracker': 'Sportfitness • GPS Running Tracker',
  'weekly-news': 'Sportfitness • Weekly Sports Digest',
  database: 'Sportfitness • Local Database Manager',
  'my-account': 'Sportfitness • My Account & Progress',
  settings: 'Sportfitness • System Settings',
};

export function getScreenTitle(screen: ScreenId, lang: Language): string {
  if (lang === 'en') {
    return SCREEN_TITLES_EN[screen] || 'Sportfitness • High Performance';
  }
  return SCREEN_TITLES[screen] || 'Sportfitness • Alto Rendimiento';
}

export function parseScreenFromLocation(): ScreenId | null {
  if (typeof window === 'undefined') return null;
  // 1. Check window.location.hash
  if (window.location.hash) {
    const raw = window.location.hash.replace(/^#[/]?/, '').split('?')[0].trim().toLowerCase();
    if (raw && VALID_SCREENS[raw]) {
      return VALID_SCREENS[raw];
    }
  }
  // 2. Check window.history.state
  if (window.history && window.history.state && window.history.state.screen) {
    const rawState = String(window.history.state.screen).toLowerCase();
    if (VALID_SCREENS[rawState]) {
      return VALID_SCREENS[rawState];
    }
  }
  // 3. Check sessionStorage
  try {
    const saved = sessionStorage.getItem('sportfitness_screen');
    if (saved && VALID_SCREENS[saved]) {
      return VALID_SCREENS[saved];
    }
  } catch {}
  return null;
}

export const guestUser: UserProfile = {
  id: '',
  name: 'Invitado',
  lastName: '',
  email: '',
  role: 'atleta',
  avatar: '',
  customAvatar: undefined,
  membershipPlan: 'Free',
  weeklyVolumePercent: 0,
  streakDays: 0,
  streakDiscountPercent: 0,
  sessionsThisWeek: 0,
  activeDaysTotal: 0,
  weight: 70,
  height: 175,
  clothingSize: 'M',
  bodyType: 'Mesomorfo',
};

export interface AppNotification {
  id: string | number;
  title: string;
  desc: string;
  time: string;
  unread: boolean;
}

interface AppContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  fontSizeMode: FontSizeMode;
  setFontSizeMode: (mode: FontSizeMode) => void;
  fontSizePx: number;
  setFontSizePx: (px: number) => void;
  cycleFontSize: () => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof typeof translations['es'] | string, fallback?: string) => string;
  user: UserProfile;
  setUser: (user: UserProfile) => void;
  isAuthenticated: boolean;
  isForgotPasswordOpen: boolean;
  openForgotPassword: () => void;
  closeForgotPassword: () => void;
  isContactModalOpen: boolean;
  openContactModal: () => void;
  closeContactModal: () => void;
  logout: () => void;
  deleteCurrentAccount: () => Promise<{ success: boolean; message?: string }>;
  currentScreen: ScreenId;
  navigateTo: (screen: ScreenId, options?: { replace?: boolean }) => void;
  // Notifications & Permission State
  notifications: AppNotification[];
  notificationConsent: 'prompt' | 'granted' | 'denied';
  acceptNotifications: () => void;
  declineNotifications: () => void;
  markAllNotificationsRead: () => void;
  clearAllNotifications: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{
  children: React.ReactNode;
  initialScreen?: ScreenId;
}> = ({ children, initialScreen = 'landing' }) => {
  const [theme, setThemeState] = useState<Theme>('dark');
  
  // Font size state with numeric pixel precision and accessibility modes
  const [fontSizePx, setFontSizePxState] = useState<number>(() => {
    const savedPx = localStorage.getItem('app_font_size_px');
    if (savedPx) {
      const parsed = parseFloat(savedPx);
      if (!isNaN(parsed) && parsed >= 13 && parsed <= 23) return parsed;
    }
    const savedMode = localStorage.getItem('app_font_size') as FontSizeMode;
    if (savedMode === 'small') return 14;
    if (savedMode === 'standard') return 16;
    if (savedMode === 'xlarge') return 21;
    return 18.5; // High readability default
  });

  const [fontSizeMode, setFontSizeModeState] = useState<FontSizeMode>(() => {
    const savedMode = localStorage.getItem('app_font_size') as FontSizeMode;
    return savedMode || 'large';
  });

  const [language, setLanguageState] = useState<Language>(() => {
    const savedLang = localStorage.getItem('sportfitness_lang') as Language;
    return savedLang || 'es';
  });

  const [user, setUser] = useState<UserProfile>(() => {
    try {
      return localDatabase.getActiveUser() || guestUser;
    } catch {
      return guestUser;
    }
  });

  const isAuthenticated = Boolean(
    user && user.id && user.id.trim() !== '' && user.email && user.email.trim() !== ''
  );
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);

  const openContactModal = () => setIsContactModalOpen(true);
  const closeContactModal = () => setIsContactModalOpen(false);
  const [currentScreen, setCurrentScreen] = useState<ScreenId>(() => {
    const fromLoc = parseScreenFromLocation();
    if (fromLoc) return fromLoc;
    return initialScreen || 'landing';
  });

  // Browser History & Time-Travel (Back ←, Forward →, Refresh ↻) Synchronization
  useEffect(() => {
    const initialResolved = parseScreenFromLocation() || currentScreen || 'landing';
    const targetHash = initialResolved === 'landing' ? '#' : `#${initialResolved}`;
    const initialTitle = getScreenTitle(initialResolved, language);
    document.title = initialTitle;

    try {
      window.history.replaceState({ screen: initialResolved }, initialTitle, targetHash);
      sessionStorage.setItem('sportfitness_screen', initialResolved);
    } catch {}

    const handlePopState = (event: PopStateEvent) => {
      let target: ScreenId = 'landing';
      if (event.state && event.state.screen && VALID_SCREENS[event.state.screen]) {
        target = VALID_SCREENS[event.state.screen];
      } else if (window.location.hash) {
        const raw = window.location.hash.replace(/^#[/]?/, '').split('?')[0].trim().toLowerCase();
        if (VALID_SCREENS[raw]) {
          target = VALID_SCREENS[raw];
        }
      } else {
        target = 'landing';
      }

      setCurrentScreen(target);
      const title = getScreenTitle(target, language);
      document.title = title;
      try {
        sessionStorage.setItem('sportfitness_screen', target);
      } catch {}
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleHashChange = () => {
      if (!window.location.hash || window.location.hash === '#' || window.location.hash === '#/') {
        setCurrentScreen('landing');
        document.title = getScreenTitle('landing', language);
        try {
          sessionStorage.setItem('sportfitness_screen', 'landing');
        } catch {}
        return;
      }
      const raw = window.location.hash.replace(/^#[/]?/, '').split('?')[0].trim().toLowerCase();
      if (VALID_SCREENS[raw]) {
        const target = VALID_SCREENS[raw];
        setCurrentScreen(target);
        const title = getScreenTitle(target, language);
        document.title = title;
        try {
          sessionStorage.setItem('sportfitness_screen', target);
        } catch {}
      }
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handleHashChange);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  // Sync font size with HTML root style & data-attribute for global real-time application
  useEffect(() => {
    const root = document.documentElement;
    root.style.fontSize = `${fontSizePx}px`;
    root.setAttribute('data-font-size', fontSizeMode);
    localStorage.setItem('app_font_size_px', String(fontSizePx));
    localStorage.setItem('app_font_size', fontSizeMode);
  }, [fontSizePx, fontSizeMode]);

  const setFontSizePx = (px: number) => {
    const clamped = Math.max(13, Math.min(23, px));
    setFontSizePxState(clamped);
    let mode: FontSizeMode = 'large';
    if (clamped <= 14.5) mode = 'small';
    else if (clamped <= 17) mode = 'standard';
    else if (clamped <= 19.5) mode = 'large';
    else mode = 'xlarge';
    setFontSizeModeState(mode);
  };

  const setFontSizeMode = (mode: FontSizeMode) => {
    setFontSizeModeState(mode);
    let px = 18.5;
    if (mode === 'small') px = 14;
    if (mode === 'standard') px = 16;
    if (mode === 'large') px = 18.5;
    if (mode === 'xlarge') px = 21;
    setFontSizePxState(px);
  };

  const cycleFontSize = () => {
    setFontSizeModeState((prev) => {
      if (prev === 'small') return 'standard';
      if (prev === 'standard') return 'large';
      if (prev === 'large') return 'xlarge';
      return 'standard';
    });
  };

  // Sync theme with HTML document class
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const setTheme = (t: Theme) => {
    setThemeState(t);
  };

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('sportfitness_lang', lang);
    } catch {}
    document.title = getScreenTitle(currentScreen, lang);
  };

  const t = (key: keyof typeof translations['es'] | string, fallback?: string): string => {
    const dict = (translations[language] || translations.es) as Record<string, string>;
    if (dict && dict[key]) return dict[key];
    const esDict = translations.es as Record<string, string>;
    if (esDict && esDict[key]) return esDict[key];
    return fallback !== undefined ? fallback : (key as string);
  };

  const openForgotPassword = () => setIsForgotPasswordOpen(true);
  const closeForgotPassword = () => setIsForgotPasswordOpen(false);

  const navigateTo = (screen: ScreenId, options?: { replace?: boolean }) => {
    const resolvedScreen = VALID_SCREENS[screen] || screen;
    setCurrentScreen(resolvedScreen);
    try {
      sessionStorage.setItem('sportfitness_screen', resolvedScreen);
    } catch {}

    const title = SCREEN_TITLES[resolvedScreen] || 'Sportfitness';
    document.title = title;

    const targetHash = resolvedScreen === 'landing' ? '#' : `#${resolvedScreen}`;
    if (options?.replace) {
      window.history.replaceState({ screen: resolvedScreen }, title, targetHash);
    } else {
      if (window.location.hash === targetHash) {
        window.history.replaceState({ screen: resolvedScreen }, title, targetHash);
      } else {
        window.history.pushState({ screen: resolvedScreen }, title, targetHash);
      }
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const logout = () => {
    // STRICT ZERO-TRACE LOGOUT:
    // Purges localStorage, sessionStorage, and active memory user to ensure no trace remains
    localDatabase.purgeClientSession();
    setUser(guestUser);
    try {
      sessionStorage.removeItem('sportfitness_screen');
    } catch {}
    navigateTo('landing', { replace: true });
  };

  // Notification Permission and State
  const [notificationConsent, setNotificationConsentState] = useState<'prompt' | 'granted' | 'denied'>(() => {
    const saved = localStorage.getItem('sportfitness_notification_consent');
    if (saved === 'granted' || saved === 'denied') return saved;
    return 'prompt';
  });

  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    const consent = localStorage.getItem('sportfitness_notification_consent');
    // If not granted (new user or denied), notifications list is EMPTY
    if (consent !== 'granted') {
      return [];
    }
    const saved = localStorage.getItem('sportfitness_notifications_list');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [
      {
        id: 'notice-welcome',
        title: '¡Notificaciones activadas!',
        desc: 'Recibirás avisos sobre tus entrenamientos, estado de fatiga y racha.',
        time: 'Ahora',
        unread: true,
      },
    ];
  });

  const acceptNotifications = () => {
    localStorage.setItem('sportfitness_notification_consent', 'granted');
    setNotificationConsentState('granted');
    const welcomeNotice: AppNotification = {
      id: `notice-${Date.now()}`,
      title:
        language === 'en'
          ? 'Notifications Activated'
          : language === 'pt'
          ? 'Notificações Ativadas'
          : language === 'fr'
          ? 'Notifications Activées'
          : language === 'de'
          ? 'Benachrichtigungen Aktiviert'
          : language === 'it'
          ? 'Notifiche Attivate'
          : '¡Notificaciones activadas!',
      desc:
        language === 'en'
          ? 'You will receive reminders for scheduled workouts and fatigue monitoring.'
          : language === 'pt'
          ? 'Você receberá lembretes de treinos e alertas de fadiga.'
          : language === 'fr'
          ? 'Vous recevrez des rappels pour vos entraînements et la fatigue.'
          : language === 'de'
          ? 'Erhalten Sie Erinnerungen für Workouts und Belastungssteuerung.'
          : language === 'it'
          ? 'Riceverai promemoria per allenamenti e monitoraggio della fatica.'
          : 'Recibirás avisos sobre tus entrenamientos programados y monitoreo de fatiga.',
      time: language === 'en' ? 'Just now' : 'Ahora',
      unread: true,
    };
    const updated = [welcomeNotice];
    setNotifications(updated);
    localStorage.setItem('sportfitness_notifications_list', JSON.stringify(updated));
  };

  const declineNotifications = () => {
    localStorage.setItem('sportfitness_notification_consent', 'denied');
    setNotificationConsentState('denied');
    setNotifications([]);
    localStorage.removeItem('sportfitness_notifications_list');
  };

  const markAllNotificationsRead = () => {
    setNotifications((prev) => {
      const updated = prev.map((n) => ({ ...n, unread: false }));
      localStorage.setItem('sportfitness_notifications_list', JSON.stringify(updated));
      return updated;
    });
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    localStorage.removeItem('sportfitness_notifications_list');
  };

  const deleteCurrentAccount = async (): Promise<{ success: boolean; message?: string }> => {
    if (!user.id) {
      return { success: false, message: 'No hay usuario autenticado.' };
    }
    const res = await authService.deleteAccount(user.id);
    localDatabase.purgeClientSession();
    setUser(guestUser);
    setNotifications([]);
    localStorage.removeItem('sportfitness_notification_consent');
    localStorage.removeItem('sportfitness_notifications_list');
    setNotificationConsentState('prompt');
    navigateTo('landing');
    return {
      success: true,
      message: res.message || 'Cuenta eliminada exitosamente en cascada.',
    };
  };

  return (
    <AppContext.Provider
      value={{
        theme,
        setTheme,
        toggleTheme,
        fontSizeMode,
        setFontSizeMode,
        fontSizePx,
        setFontSizePx,
        cycleFontSize,
        language,
        setLanguage,
        t,
        user,
        setUser,
        isAuthenticated,
        isForgotPasswordOpen,
        openForgotPassword,
        closeForgotPassword,
        isContactModalOpen,
        openContactModal,
        closeContactModal,
        logout,
        deleteCurrentAccount,
        currentScreen,
        navigateTo,
        notifications,
        notificationConsent,
        acceptNotifications,
        declineNotifications,
        markAllNotificationsRead,
        clearAllNotifications,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
