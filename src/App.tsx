/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ScreenId, WorkoutRoutine, UserProfile } from './types';
import { AppProvider, useApp, guestUser } from './context/AppContext';
import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';
import { ForgotPasswordModal } from './components/common/ForgotPasswordModal';
import { OneHourReviewModal } from './components/common/OneHourReviewModal';
import { SwitchAccountModal } from './components/common/SwitchAccountModal';
import { NotificationPromptModal } from './components/common/NotificationPromptModal';
import { AuthRequiredModal } from './components/common/AuthRequiredModal';
import { ContactModal } from './components/common/ContactModal';
import { ScrollProgressBar } from './components/common/ScrollProgressBar';
import { localDatabase } from './db/localDatabase';

// Views
import { LandingView } from './components/views/LandingView';
import { AthleteLoginView } from './components/views/AthleteLoginView';
import { AthleteRegisterView } from './components/views/AthleteRegisterView';
import { TrainerLoginView } from './components/views/TrainerLoginView';
import { TrainerRegisterView } from './components/views/TrainerRegisterView';
import { AthleteDashboardView } from './components/views/AthleteDashboardView';
import { TrainerOverviewView } from './components/views/TrainerOverviewView';
import { RoutineCatalogView } from './components/views/RoutineCatalogView';
import { LiveWorkoutView } from './components/views/LiveWorkoutView';
import { CalendarView } from './components/views/CalendarView';
import { NutritionView } from './components/views/NutritionView';
import { ReviewsView } from './components/views/ReviewsView';
import { ExerciseLibraryView } from './components/views/ExerciseLibraryView';
import { SettingsView } from './components/views/SettingsView';
import { WeeklyNewsView } from './components/views/WeeklyNewsView';
import { DatabaseManagerView } from './components/views/DatabaseManagerView';
import { MyAccountView } from './components/views/MyAccountView';

function MainAppContent() {
  const {
    currentScreen,
    navigateTo,
    user,
    setUser,
    isAuthenticated,
    language,
    theme,
    notificationConsent,
    acceptNotifications,
    declineNotifications,
    isContactModalOpen,
    closeContactModal,
  } = useApp();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedRoutine, setSelectedRoutine] = useState<WorkoutRoutine | null>(null);
  const [showSwitchAccountModal, setShowSwitchAccountModal] = useState(false);
  const [authGuardTarget, setAuthGuardTarget] = useState<string | null>(null);

  // Authentication Enforcement Guard:
  // Before entering "Entrenamiento del Día", "Comunidad y Reseñas", or "Configuración",
  // users MUST sign in or register.
  useEffect(() => {
    const protectedScreens: Record<string, string> = {
      'live-workout': language === 'es' ? 'Entrenamiento del Día' : 'Workout of the Day',
      'routines': language === 'es' ? 'Entrenamiento del Día' : 'Workout of the Day',
      'routine-catalog': language === 'es' ? 'Entrenamiento del Día' : 'Workout of the Day',
      'reviews': language === 'es' ? 'Comunidad y Reseñas' : 'Community & Reviews',
      'settings': language === 'es' ? 'Configuración' : 'Settings',
    };

    if (!isAuthenticated && protectedScreens[currentScreen]) {
      setAuthGuardTarget(protectedScreens[currentScreen]);
      navigateTo('landing', { replace: true });
    }
  }, [currentScreen, isAuthenticated, language, navigateTo]);

  const handleLoginSuccess = (role: 'atleta' | 'entrenador', loggedInUser?: UserProfile) => {
    let resolvedUser: UserProfile;

    if (loggedInUser) {
      resolvedUser = loggedInUser;
    } else {
      const active = localDatabase.getActiveUser();
      if (active && active.role === role) {
        resolvedUser = active;
      } else {
        const matchingUsers = localDatabase.getUsers().filter((u) => u.role === role);
        resolvedUser = matchingUsers.length > 0 ? matchingUsers[matchingUsers.length - 1] : (active || guestUser);
      }
    }

    localDatabase.setActiveUserId(resolvedUser.id);
    localDatabase.saveUser(resolvedUser);
    try {
      if (!localStorage.getItem('sportfitness_session_token')) {
        const token = `sf_session_${resolvedUser.id}_${Date.now()}`;
        localStorage.setItem('sportfitness_session_token', token);
        sessionStorage.setItem('sportfitness_session_token', token);
      }
    } catch {}
    setUser(resolvedUser);

    if (role === 'atleta') {
      navigateTo('athlete-dashboard');
    } else {
      navigateTo('trainer-overview');
    }
  };

  const isAuthOrLanding = [
    'landing',
    'athlete-login',
    'athlete-register',
    'trainer-login',
    'trainer-register',
  ].includes(currentScreen);

  const isDark = theme === 'dark';

  return (
    <div
      className={`min-h-screen flex flex-col transition-colors duration-200 selection:bg-[#56A867] selection:text-black ${
        isDark ? 'bg-[#0B0C10] text-[#E0E0E0]' : 'bg-[#F8F9FA] text-[#1E293B]'
      }`}
    >
      {/* Global Scroll Progress & Smooth Scroll-to-Top */}
      <ScrollProgressBar />

      {/* Universal Password Recovery Modal */}
      <ForgotPasswordModal />

      {/* Universal Contact & Support Modal */}
      <ContactModal
        isOpen={isContactModalOpen}
        onClose={closeContactModal}
      />

      {/* Switch Local Account Modal */}
      <SwitchAccountModal
        isOpen={showSwitchAccountModal}
        onClose={() => setShowSwitchAccountModal(false)}
        onNavigate={navigateTo}
      />

      {/* 1-Hour Usage Feedback Popup Modal */}
      <OneHourReviewModal
        currentUser={user}
        onReviewSubmitted={() => {
          // Review submitted
        }}
      />

      {/* Central Announcement Modal for Notification Permission */}
      <NotificationPromptModal
        isOpen={notificationConsent === 'prompt' && !isAuthOrLanding}
        onAccept={acceptNotifications}
        onDecline={declineNotifications}
      />

      {/* Required Authentication Guard Modal */}
      <AuthRequiredModal
        isOpen={Boolean(authGuardTarget)}
        onClose={() => setAuthGuardTarget(null)}
        onNavigate={navigateTo}
        targetModuleName={authGuardTarget || undefined}
      />

      {/* Header (visible across in-app modules) */}
      {!isAuthOrLanding && (
        <Header
          user={user}
          currentScreen={currentScreen}
          onNavigate={navigateTo}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          onOpenSwitchAccount={() => setShowSwitchAccountModal(true)}
        />
      )}

      <div className="flex-1 flex w-full max-w-full min-w-0">
        {!isAuthOrLanding && (
          <Sidebar
            currentScreen={currentScreen}
            onNavigate={navigateTo}
            userRole={user.role}
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
            onOpenSwitchAccount={() => setShowSwitchAccountModal(true)}
          />
        )}

        {/* Main Viewport Content */}
        <main
          className={`flex-1 w-full max-w-full min-w-0 transition-all duration-300 overflow-x-hidden ${
            !isAuthOrLanding ? 'lg:pl-64' : ''
          }`}
        >
          {currentScreen === 'landing' && (
            <LandingView onNavigate={navigateTo} />
          )}

          {currentScreen === 'athlete-login' && (
            <AthleteLoginView
              onNavigate={navigateTo}
              onLoginSuccess={(u) => handleLoginSuccess('atleta', u)}
            />
          )}

          {currentScreen === 'athlete-register' && (
            <AthleteRegisterView
              onNavigate={navigateTo}
              onRegisterSuccess={(u) => handleLoginSuccess('atleta', u)}
            />
          )}

          {currentScreen === 'trainer-login' && (
            <TrainerLoginView
              onNavigate={navigateTo}
              onLoginSuccess={(u) => handleLoginSuccess('entrenador', u)}
            />
          )}

          {currentScreen === 'trainer-register' && (
            <TrainerRegisterView
              onNavigate={navigateTo}
              onRegisterSuccess={(u) => handleLoginSuccess('entrenador', u)}
            />
          )}

          {currentScreen === 'athlete-dashboard' && (
            user.role === 'entrenador' ? (
              <TrainerOverviewView onNavigate={navigateTo} />
            ) : (
              <AthleteDashboardView
                onNavigate={navigateTo}
                user={user}
              />
            )
          )}

          {currentScreen === 'trainer-overview' && (
            <TrainerOverviewView onNavigate={navigateTo} />
          )}

          {(currentScreen === 'routines' || currentScreen === 'routine-catalog') && (
            user.role === 'entrenador' ? (
              <TrainerOverviewView onNavigate={navigateTo} />
            ) : (
              <RoutineCatalogView
                onNavigate={navigateTo}
                onSelectRoutine={(routine) => setSelectedRoutine(routine)}
                user={user}
              />
            )
          )}

          {currentScreen === 'live-workout' && (
            user.role === 'entrenador' ? (
              <TrainerOverviewView onNavigate={navigateTo} />
            ) : (
              <LiveWorkoutView
                onNavigate={navigateTo}
                user={user}
                selectedRoutine={selectedRoutine}
              />
            )
          )}

          {currentScreen === 'calendar' && (
            <CalendarView onNavigate={navigateTo} />
          )}

          {currentScreen === 'nutrition' && (
            <NutritionView onNavigate={navigateTo} />
          )}

          {currentScreen === 'reviews' && (
            <ReviewsView onNavigate={navigateTo} user={user} />
          )}

          {(currentScreen === 'exercises' || currentScreen === 'exercise-library') && (
            <ExerciseLibraryView onNavigate={navigateTo} />
          )}

          {currentScreen === 'weekly-news' && (
            <WeeklyNewsView onNavigate={navigateTo} />
          )}

          {(currentScreen === 'database' || currentScreen === 'database-manager') && (
            user.role === 'entrenador' ? (
              <DatabaseManagerView />
            ) : (
              <div className="p-8 max-w-lg mx-auto my-16 text-center rounded-2xl border border-amber-500/30 bg-amber-500/10">
                <h2 className="text-lg font-serif font-bold text-amber-400 mb-2">
                  {language === 'en' ? 'Coach Access Only' : 'Acceso Exclusivo para Entrenadores'}
                </h2>
                <p className="text-xs text-neutral-300 mb-5 leading-relaxed">
                  {language === 'en'
                    ? 'The SQL database management console is strictly reserved for verified coaches and trainers.'
                    : 'La consola de administración de la base de datos SQL está reservada exclusivamente para cuentas con rol de Entrenador (Coach).'}
                </p>
                <button
                  onClick={() => navigateTo('athlete-dashboard')}
                  className="px-4 py-2 rounded-xl text-xs font-bold font-mono uppercase bg-[#56A867] hover:bg-[#64B875] text-black transition-all shadow-md"
                >
                  {language === 'en' ? 'Return to Dashboard' : 'Volver al Dashboard'}
                </button>
              </div>
            )
          )}

          {(currentScreen === 'my-account' || currentScreen === 'account') && (
            <MyAccountView />
          )}

          {currentScreen === 'settings' && <SettingsView />}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainAppContent />
    </AppProvider>
  );
}
