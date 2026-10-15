/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  Plus,
  ChevronLeft,
  ChevronRight,
  Flame,
  CheckCircle2,
  Dumbbell,
  Zap,
  Activity,
  ShieldAlert,
  Moon,
  Sun,
  Sunrise,
  Sunset,
  Sparkles,
  RotateCcw,
  Edit3,
  Coffee,
  Check,
  AlertCircle,
} from 'lucide-react';
import { ScheduledSession, ScreenId, DayCalendarOverride } from '../../types';
import { initialCalendarSessions } from '../../data/initialData';
import { useApp } from '../../context/AppContext';
import { PlankPenanceModal } from '../common/PlankPenanceModal';
import { CalendarDayModal } from '../calendar/CalendarDayModal';
import { localDatabase } from '../../db/localDatabase';
import { ScrollReveal } from '../common/ScrollReveal';

interface CalendarViewProps {
  onNavigate: (screen: ScreenId) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ onNavigate }) => {
  const { user, setUser, language, t, theme } = useApp();

  // Persistent calendar state loaded from localDatabase
  const [sessions, setSessions] = useState<ScheduledSession[]>(() =>
    localDatabase.getCalendarSessions()
  );
  const [dayOverrides, setDayOverrides] = useState<Record<number, DayCalendarOverride>>(() =>
    localDatabase.getCalendarOverrides()
  );

  const [selectedDay, setSelectedDay] = useState<number>(5); // Default to today (Oct 5)
  const [isDayModalOpen, setIsDayModalOpen] = useState(false);
  const [showPenanceModal, setShowPenanceModal] = useState(false);
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  // User preferred workout time (Madrugada, Mañana, Tarde, Noche)
  const [preferredTime, setPreferredTime] = useState<string>(
    user.preferredWorkoutTime || '07:00'
  );
  const [isEditingTime, setIsEditingTime] = useState(false);

  // Days for October 2026 calendar mockup (starting Thursday)
  const daysInMonth = Array.from({ length: 31 }, (_, i) => i + 1);

  // Day 1 of Oct 2026 was a Thursday (index 3 in 0-indexed Mon-Sun: Mon=0, Tue=1, Wed=2, Thu=3, Fri=4, Sat=5, Sun=6)
  const startOffsetDays = 3;

  const getDayOfWeek = (dayNumber: number) => {
    // 0 = Monday, 1 = Tuesday, ..., 5 = Saturday, 6 = Sunday
    return (dayNumber - 1 + startOffsetDays) % 7;
  };

  // Determine if a day is marked as Rest:
  // 1. If explicit user override exists, respect it (training vs rest).
  // 2. Otherwise default to Saturday (5) & Sunday (6) as rest days.
  const isDayRest = (dayNumber: number) => {
    if (dayOverrides[dayNumber]) {
      return dayOverrides[dayNumber].status === 'rest';
    }
    const dow = getDayOfWeek(dayNumber);
    return dow === 5 || dow === 6;
  };

  const isRestDefault = (dayNumber: number) => {
    const dow = getDayOfWeek(dayNumber);
    return dow === 5 || dow === 6;
  };

  const getSessionsForDay = (day: number) => {
    return sessions.filter((s) => s.day === day);
  };

  const showToast = (message: string) => {
    setFeedbackToast(message);
    setTimeout(() => setFeedbackToast(null), 3500);
  };

  // Handle Save from CalendarDayModal
  const handleSaveDay = (params: {
    day: number;
    isRest: boolean;
    restType?: 'Descanso Total' | 'Descanso Activo' | 'Movilidad & Recuperación' | 'Recarga de Glucógeno';
    restNotes?: string;
    sessions: ScheduledSession[];
  }) => {
    const { day, isRest, restType, restNotes, sessions: updatedDaySessions } = params;

    // 1. Update Overrides
    const newOverrides = { ...dayOverrides };
    if (isRest) {
      newOverrides[day] = {
        day,
        status: 'rest',
        restType,
        restNotes,
        updatedAt: new Date().toISOString(),
      };
    } else {
      newOverrides[day] = {
        day,
        status: 'training',
        updatedAt: new Date().toISOString(),
      };
    }

    // 2. Update Sessions
    const remainingSessions = sessions.filter((s) => s.day !== day);
    const newSessionsList = isRest
      ? remainingSessions
      : [...remainingSessions, ...updatedDaySessions];

    // 3. Persist to localDatabase and update React state
    setDayOverrides(newOverrides);
    setSessions(newSessionsList);
    localDatabase.saveCalendarOverrides(newOverrides);
    localDatabase.saveCalendarSessions(newSessionsList);

    showToast(
      isRest
        ? language === 'en'
          ? `Day ${day} saved as Rest Day.`
          : `Día ${day} guardado como Día de Descanso.`
        : language === 'en'
        ? `Day ${day} workout schedule updated.`
        : `Rutina del día ${day} actualizada exitosamente.`
    );
  };

  // Handle Delete Day Activity
  const handleDeleteDayActivity = (day: number) => {
    const remainingSessions = sessions.filter((s) => s.day !== day);
    const newOverrides = { ...dayOverrides };

    // If day was default weekend, revert to rest; if weekday, leave clean
    if (isRestDefault(day)) {
      newOverrides[day] = {
        day,
        status: 'rest',
        restType: 'Descanso Total',
        updatedAt: new Date().toISOString(),
      };
    } else {
      delete newOverrides[day];
    }

    setSessions(remainingSessions);
    setDayOverrides(newOverrides);
    localDatabase.saveCalendarSessions(remainingSessions);
    localDatabase.saveCalendarOverrides(newOverrides);

    showToast(
      language === 'en'
        ? `Activities cleared for day ${day}.`
        : `Actividades eliminadas para el día ${day}.`
    );
  };

  // Handle Reset Day to Recommended
  const handleResetDayToRecommended = (day: number) => {
    const newOverrides = { ...dayOverrides };
    delete newOverrides[day];

    // Re-seed default sessions if any exist for this day
    const defaultForDay = initialCalendarSessions.filter((s) => s.day === day);
    const remainingSessions = sessions.filter((s) => s.day !== day);
    const newSessionsList = [...remainingSessions, ...defaultForDay];

    setDayOverrides(newOverrides);
    setSessions(newSessionsList);
    localDatabase.saveCalendarOverrides(newOverrides);
    localDatabase.saveCalendarSessions(newSessionsList);

    showToast(
      language === 'en'
        ? `Day ${day} reset to recommended periodization.`
        : `Día ${day} restablecido a la periodización recomendada.`
    );
  };

  // Reset entire calendar month to recommended defaults
  const handleResetEntireCalendar = () => {
    const confirmText =
      language === 'en'
        ? 'Are you sure you want to restore the official recommended periodization for the entire month? All custom edits will be reset.'
        : '¿Estás seguro de restablecer la agenda recomendada oficial de todo el mes? Se restaurarán los descansos de fin de semana y rutinas base.';

    if (window.confirm(confirmText)) {
      const resetData = localDatabase.resetCalendarToRecommended();
      setSessions([...resetData.sessions]);
      setDayOverrides({});
      showToast(
        language === 'en'
          ? 'Calendar fully restored to recommended periodization.'
          : 'Calendario restaurado a la periodización recomendada oficial.'
      );
    }
  };

  const handleSavePreferredTime = (newTimeVal: string) => {
    setPreferredTime(newTimeVal);
    const updated = {
      ...user,
      preferredWorkoutTime: newTimeVal,
    };
    setUser(updated);
    localDatabase.saveUser(updated);
    setIsEditingTime(false);
    showToast(
      language === 'en'
        ? `Preferred workout time updated to ${newTimeVal}.`
        : `Horario preferido fijado a las ${newTimeVal}.`
    );
  };

  const getTimePeriodLabel = (timeStr: string) => {
    const hour = parseInt(timeStr.split(':')[0], 10);
    if (hour >= 4 && hour < 7) {
      return {
        label: language === 'en' ? 'Dawn' : 'Madrugada',
        icon: Sunrise,
        color: 'text-purple-400',
      };
    }
    if (hour >= 7 && hour < 12) {
      return {
        label: language === 'en' ? 'Morning' : 'Mañana',
        icon: Sun,
        color: 'text-amber-400',
      };
    }
    if (hour >= 12 && hour < 19) {
      return {
        label: language === 'en' ? 'Afternoon' : 'Tarde',
        icon: Sunset,
        color: 'text-orange-400',
      };
    }
    return {
      label: language === 'en' ? 'Night' : 'Noche',
      icon: Moon,
      color: 'text-blue-400',
    };
  };

  const periodInfo = getTimePeriodLabel(preferredTime);
  const PeriodIcon = periodInfo.icon;

  // Selected Day info
  const selectedDaySessions = getSessionsForDay(selectedDay);
  const selectedDayIsRest = isDayRest(selectedDay);
  const selectedDayOverride = dayOverrides[selectedDay];

  // Count metrics for summary
  const totalTrainingDays = daysInMonth.filter((d) => !isDayRest(d)).length;
  const totalRestDays = daysInMonth.filter((d) => isDayRest(d)).length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto text-left">
      {/* Toast Feedback */}
      {feedbackToast && (
        <div className="fixed top-4 right-4 z-50 p-3 rounded-2xl bg-[#161622] border border-[#56A867] text-white text-xs font-mono shadow-2xl flex items-center gap-2 animate-in slide-in-from-top-4">
          <CheckCircle2 className="w-4 h-4 text-[#56A867]" />
          <span>{feedbackToast}</span>
        </div>
      )}

      {/* Header */}
      <ScrollReveal direction="down" duration={0.4}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-[#56A867]/15 text-[#56A867] text-[11px] font-mono font-bold uppercase tracking-wider mb-1">
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>
                {language === 'en'
                  ? `Flexible Periodization • ${totalTrainingDays} Training Days • ${totalRestDays} Rest Days`
                  : `Periodización Flexible • ${totalTrainingDays} Días de Entrenamiento • ${totalRestDays} Descanso`}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white">
              {t('calendarTitle')}
            </h1>
            <p className="text-xs sm:text-sm text-[#8E8E9E]">
              {language === 'en'
                ? 'Click on any day to customize your routine, assign exercises, or mark as a rest day.'
                : 'Haz clic en cualquier día para personalizar tu rutina, asignar ejercicios o marcar día de descanso.'}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleResetEntireCalendar}
              className="py-2.5 px-3.5 rounded-xl bg-[#161622] hover:bg-[#1E1E2E] border border-[#2B2B3D] text-[#8E8E9E] hover:text-white font-mono text-xs flex items-center gap-1.5 transition-all cursor-pointer"
              title={
                language === 'en'
                  ? 'Reset all days to recommended periodization'
                  : 'Restablecer toda la agenda a la recomendación oficial'
              }
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{language === 'en' ? 'Reset Recommended' : 'Restablecer Agenda'}</span>
            </button>

            <button
              onClick={() => setIsDayModalOpen(true)}
              className="py-2.5 px-4 rounded-xl bg-[#56A867] hover:bg-[#64B875] text-black font-bold text-xs transition-all shadow-[0_0_20px_rgba(86,168,103,0.25)] flex items-center gap-1.5 font-mono uppercase cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{language === 'en' ? `Edit Day ${selectedDay}` : `Editar Día ${selectedDay}`}</span>
            </button>
          </div>
        </div>
      </ScrollReveal>

      {/* Horario de Entrenamiento Definido por Usuario & Penitencia Banner */}
      <ScrollReveal direction="up" delay={0.1} duration={0.4}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* User Defined Time Card */}
          <div className="p-4 rounded-2xl bg-[#14141E] border border-[#252538] flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#56A867]/15 text-[#56A867] flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-mono uppercase font-bold text-white">
                    {t('workoutTimeTitle')}
                  </h3>
                  <p className="text-[11px] text-[#8E8E9E]">{t('fixedByYou')}</p>
                </div>
              </div>

              <span
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold flex items-center gap-1 bg-[#1E1E2C] ${periodInfo.color}`}
              >
                <PeriodIcon className="w-3.5 h-3.5" />
                <span>
                  {periodInfo.label} ({preferredTime})
                </span>
              </span>
            </div>

            {!isEditingTime ? (
              <div className="flex items-center justify-between pt-1 border-t border-[#20202E]">
                <span className="text-xs text-[#A0A0B0]">
                  {language === 'en' ? (
                    <>
                      Your active workout alarm is set for <strong>{preferredTime}</strong>.
                    </>
                  ) : (
                    <>
                      Tu alarma de sesión activa está fijada a las <strong>{preferredTime}</strong>.
                    </>
                  )}
                </span>
                <button
                  onClick={() => setIsEditingTime(true)}
                  className="text-xs font-mono text-[#56A867] hover:underline cursor-pointer font-bold"
                >
                  {t('changeSchedule')}
                </button>
              </div>
            ) : (
              <div className="pt-2 border-t border-[#20202E] space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    value={preferredTime}
                    onChange={(e) => setPreferredTime(e.target.value)}
                    className="bg-[#1C1C28] border border-[#2B2B3D] text-white px-3 py-1.5 rounded-xl text-xs font-mono focus:outline-none focus:border-[#56A867]"
                  />
                  <button
                    onClick={() => handleSavePreferredTime(preferredTime)}
                    className="px-3 py-1.5 rounded-xl bg-[#56A867] text-black font-mono text-xs font-bold uppercase hover:bg-[#64B875] cursor-pointer"
                  >
                    {t('save')}
                  </button>
                  <button
                    onClick={() => setIsEditingTime(false)}
                    className="px-2 py-1.5 text-xs text-[#8E8E9E] hover:text-white cursor-pointer"
                  >
                    {t('cancel')}
                  </button>
                </div>

                {/* Quick presets */}
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#808090] flex-wrap">
                  <span>{t('presets')}:</span>
                  <button
                    onClick={() => handleSavePreferredTime('05:30')}
                    className="px-2 py-0.5 rounded bg-[#1F1F2E] hover:text-white cursor-pointer"
                  >
                    {language === 'en' ? 'Dawn 5:30 AM' : 'Madrugada 5:30 AM'}
                  </button>
                  <button
                    onClick={() => handleSavePreferredTime('07:30')}
                    className="px-2 py-0.5 rounded bg-[#1F1F2E] hover:text-white cursor-pointer"
                  >
                    {language === 'en' ? 'Morning 7:30 AM' : 'Mañana 7:30 AM'}
                  </button>
                  <button
                    onClick={() => handleSavePreferredTime('14:00')}
                    className="px-2 py-0.5 rounded bg-[#1F1F2E] hover:text-white cursor-pointer"
                  >
                    {language === 'en' ? 'Afternoon 2:00 PM' : 'Tarde 2:00 PM'}
                  </button>
                  <button
                    onClick={() => handleSavePreferredTime('19:30')}
                    className="px-2 py-0.5 rounded bg-[#1F1F2E] hover:text-white cursor-pointer"
                  >
                    {language === 'en' ? 'Night 7:30 PM' : 'Noche 7:30 PM'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Missed Routine Penance / Racha Card */}
          <div className="p-4 rounded-2xl bg-[#161622] border border-amber-500/30 flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-mono uppercase font-bold text-white">
                    {language === 'en'
                      ? 'Missed Weekday Routine Penalty'
                      : 'Penitencia por Día Faltante de Entre Semana'}
                  </h3>
                  <p className="text-[11px] text-[#8E8E9E]">
                    {language === 'en' ? 'Streak rescue protocol' : 'Protocolo de rescate de racha'}
                  </p>
                </div>
              </div>

              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#56A867]/15 text-[#56A867] font-bold">
                {language === 'en'
                  ? `Streak: ${user.streakDays || 1} days (${user.streakDiscountPercent || 1}% OFF)`
                  : `Racha: ${user.streakDays || 1} días (${user.streakDiscountPercent || 1}% OFF)`}
              </span>
            </div>

            <div className="text-xs text-[#A0A0B0] leading-relaxed">
              {language === 'en' ? (
                <>
                  If you miss a scheduled training day, perform <strong>1 minute of isometric plank</strong> to keep your accumulated 1% daily discount intact. (Days marked as <em>Rest</em> are exempt).
                </>
              ) : (
                <>
                  Si faltas a un día de entrenamiento programado, realiza <strong>1 minuto de tablón isométrico (plank)</strong> para no perder tu descuento acumulado del 1% diario. (Los días marcados como <em>Descanso</em> están exentos).
                </>
              )}
            </div>

            <div className="pt-2 border-t border-[#252538] flex items-center justify-between">
              <span className="text-[10px] font-mono text-neutral-400">
                {user.penanceCompleted
                  ? language === 'en'
                    ? '✅ Recent plank penalty completed'
                    : '✅ Penitencia reciente completada'
                  : language === 'en'
                  ? 'Active discipline'
                  : 'Disciplina activa'}
              </span>
              <button
                onClick={() => setShowPenanceModal(true)}
                className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-mono font-bold text-xs flex items-center gap-1.5 transition-all shadow-[0_0_15px_rgba(245,158,11,0.25)] cursor-pointer"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>{language === 'en' ? 'Perform 1-Min Plank' : 'Realizar 1 Minuto de Tablón'}</span>
              </button>
            </div>
          </div>
        </div>
      </ScrollReveal>

      {/* Main Grid: Calendar Days + Right Panel Weekly Overview */}
      <ScrollReveal direction="up" delay={0.15} duration={0.4}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left 8 cols: Calendar Grid */}
          <div className="lg:col-span-8 p-5 rounded-2xl bg-[#121218] border border-[#20202A] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#1E1E28]">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-serif font-bold text-white flex items-center gap-2">
                  <span>{language === 'en' ? 'October 2026' : 'Octubre 2026'}</span>
                </h2>
                <span className="text-xs font-mono text-[#56A867] hidden sm:inline">
                  {language === 'en' ? '• Click any day to edit' : '• Clic en cualquier día para editar'}
                </span>
              </div>

              {/* Legend guide */}
              <div className="flex items-center gap-3 text-[11px] font-mono">
                <span className="flex items-center gap-1 text-[#56A867]">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#56A867]" />
                  <span>{language === 'en' ? 'Training' : 'Entrenamiento'}</span>
                </span>
                <span className="flex items-center gap-1 text-blue-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  <span>{language === 'en' ? 'Rest Day' : 'Descanso'}</span>
                </span>
              </div>
            </div>

            {/* Days of Week Header */}
            <div className="grid grid-cols-7 gap-1 text-center text-xs font-mono pb-1 font-bold">
              <span className="text-[#8E8E9E]">{language === 'en' ? 'MON' : 'LUN'}</span>
              <span className="text-[#8E8E9E]">{language === 'en' ? 'TUE' : 'MAR'}</span>
              <span className="text-[#8E8E9E]">{language === 'en' ? 'WED' : 'MIÉ'}</span>
              <span className="text-[#8E8E9E]">{language === 'en' ? 'THU' : 'JUE'}</span>
              <span className="text-[#8E8E9E]">{language === 'en' ? 'FRI' : 'VIE'}</span>
              <span className="text-blue-400 bg-blue-500/10 rounded py-0.5">
                {language === 'en' ? 'SAT' : 'SÁB'}
              </span>
              <span className="text-blue-400 bg-blue-500/10 rounded py-0.5">
                {language === 'en' ? 'SUN' : 'DOM'}
              </span>
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1.5">
              {/* Blank offset days for Thursday start (Oct 1 = Thursday) */}
              <div className="min-h-[86px] rounded-xl bg-[#0E0E12]/30 border border-transparent" />
              <div className="min-h-[86px] rounded-xl bg-[#0E0E12]/30 border border-transparent" />
              <div className="min-h-[86px] rounded-xl bg-[#0E0E12]/30 border border-transparent" />

              {daysInMonth.map((day) => {
                const daySessions = getSessionsForDay(day);
                const isSelected = selectedDay === day;
                const isToday = day === 5;
                const rest = isDayRest(day);
                const hasOverride = Boolean(dayOverrides[day]);

                return (
                  <button
                    key={day}
                    onClick={() => {
                      setSelectedDay(day);
                      setIsDayModalOpen(true);
                    }}
                    className={`min-h-[88px] p-2 rounded-2xl border text-left flex flex-col justify-between transition-all relative cursor-pointer group ${
                      isSelected
                        ? 'ring-2 ring-[#56A867] ring-offset-2 ring-offset-[#0B0C10] shadow-[0_0_20px_rgba(86,168,103,0.2)]'
                        : ''
                    } ${
                      rest
                        ? 'bg-[#121624] border-[#202940] hover:bg-[#161D32]'
                        : daySessions.length > 0
                        ? 'bg-[#121B14] border-[#24422A] hover:bg-[#162419]'
                        : 'bg-[#101016] border-[#1E1E28] hover:bg-[#161622]'
                    }`}
                  >
                    {/* Top Row: Day Number & Status Badge */}
                    <div className="flex items-center justify-between w-full">
                      <span
                        className={`text-xs font-mono font-bold ${
                          isToday
                            ? 'text-[#56A867] underline underline-offset-2'
                            : rest
                            ? 'text-blue-400'
                            : daySessions.length > 0
                            ? 'text-[#56A867]'
                            : 'text-[#8E8E9E]'
                        }`}
                      >
                        {day}
                      </span>

                      {rest ? (
                        <span className="text-[9px] font-mono text-blue-400 flex items-center gap-0.5">
                          <Coffee className="w-2.5 h-2.5" />
                          <span>REST</span>
                        </span>
                      ) : daySessions.length > 0 ? (
                        <span className="text-[9px] font-mono text-[#56A867] flex items-center gap-0.5">
                          <Dumbbell className="w-2.5 h-2.5" />
                          {isToday && <span className="w-1.5 h-1.5 rounded-full bg-[#56A867] animate-pulse" />}
                        </span>
                      ) : isToday ? (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#56A867] animate-pulse" />
                      ) : (
                        <span className="text-[9px] font-mono text-[#505060] group-hover:text-[#56A867] transition-colors">
                          +
                        </span>
                      )}
                    </div>

                    {/* Sessions or Rest Label */}
                    <div className="space-y-1 w-full mt-1.5">
                      {rest ? (
                        <div className="px-1.5 py-0.5 rounded-lg text-[9px] font-mono text-blue-300 bg-blue-500/15 border border-blue-500/20 truncate">
                          {dayOverrides[day]?.restType ||
                            (isRestDefault(day)
                              ? language === 'en'
                                ? 'Weekend Rest'
                                : 'Descanso Finde'
                              : language === 'en'
                              ? 'Active Rest'
                              : 'Descanso')}
                        </div>
                      ) : daySessions.length > 0 ? (
                        daySessions.slice(0, 2).map((s) => (
                          <div
                            key={s.id}
                            className={`px-1.5 py-0.5 rounded-lg text-[9px] font-mono truncate font-medium flex items-center justify-between ${
                              s.completed
                                ? 'bg-[#1E2616] text-[#56A867] border border-[#2D3F1E]'
                                : s.type === 'Fuerza' || s.type === 'Hipertrofia'
                                ? 'bg-red-500/15 text-red-300 border border-red-500/25'
                                : s.type === 'Cardio'
                                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/25'
                                : s.type === 'Movilidad'
                                ? 'bg-blue-500/15 text-blue-300 border border-blue-500/25'
                                : 'bg-[#222230] text-white border border-[#2D2D3E]'
                            }`}
                          >
                            <span className="truncate">{s.title}</span>
                          </div>
                        ))
                      ) : (
                        <div className="text-[9px] font-mono text-[#505060] group-hover:text-[#8E8E9E] text-center py-1">
                          {language === 'en' ? 'Click to assign' : 'Asignar'}
                        </div>
                      )}

                      {daySessions.length > 2 && (
                        <div className="text-[8px] font-mono text-[#56A867] text-right">
                          +{daySessions.length - 2} {language === 'en' ? 'more' : 'más'}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right 4 cols: Weekly Plan Panel */}
          <div className="lg:col-span-4 p-5 rounded-2xl bg-[#121218] border border-[#20202A] space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#1E1E28]">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-serif font-bold text-white">
                    {language === 'en' ? 'Selected Day Plan' : 'Plan del Día Seleccionado'}
                  </h3>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                      selectedDayIsRest
                        ? 'bg-blue-500/15 text-blue-400'
                        : 'bg-[#56A867]/15 text-[#56A867]'
                    }`}
                  >
                    {selectedDayIsRest
                      ? language === 'en'
                        ? 'Rest'
                        : 'Descanso'
                      : language === 'en'
                      ? 'Workout'
                      : 'Entrenamiento'}
                  </span>
                </div>

                <span className="text-xs font-mono text-[#56A867] font-bold">
                  {selectedDay} {language === 'en' ? 'October' : 'Octubre'}
                </span>
              </div>

              {/* Edit Button for Selected Day */}
              <button
                type="button"
                onClick={() => setIsDayModalOpen(true)}
                className="w-full py-2.5 px-3 rounded-xl bg-[#1A1A28] hover:bg-[#222236] border border-[#2D2D42] hover:border-[#56A867] text-white text-xs font-mono font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5 text-[#56A867]" />
                <span>
                  {language === 'en'
                    ? `Modify Day ${selectedDay} (Routines / Rest)`
                    : `Personalizar Día ${selectedDay} (Rutinas / Descanso)`}
                </span>
              </button>

              {/* Rest Day Highlight */}
              {selectedDayIsRest ? (
                <div className="p-4 rounded-xl bg-[#13192B] border border-blue-500/30 space-y-3 text-neutral-300">
                  <div className="flex items-center gap-2 text-blue-400 font-mono font-bold text-xs uppercase">
                    <Coffee className="w-4 h-4" />
                    <span>
                      {selectedDayOverride?.restType ||
                        (language === 'en' ? 'Scheduled Rest Day' : 'Día Programado de Descanso')}
                    </span>
                  </div>

                  <p className="text-xs leading-relaxed text-[#9BB0D0]">
                    {selectedDayOverride?.restNotes ||
                      (language === 'en'
                        ? 'This day is reserved for myofascial recovery and cellular regeneration. No routine penalty applies today.'
                        : 'Este día está reservado para la regeneración articular, muscular y recarga energética. No se aplica penitencia.')}
                  </p>

                  <div className="p-2.5 rounded-lg bg-[#0F1322] border border-blue-500/20 text-[11px] text-blue-300 font-mono">
                    💡{' '}
                    {language === 'en'
                      ? 'Suggested: 30 min gentle walk, 35ml/kg hydration, deep sleep.'
                      : 'Sugerido: Caminata suave de 30 min, hidratación profunda y 8h de sueño.'}
                  </div>
                </div>
              ) : (
                /* Workout Sessions List */
                <div className="space-y-2.5">
                  {selectedDaySessions.length > 0 ? (
                    selectedDaySessions.map((s) => (
                      <div
                        key={s.id}
                        className="p-3.5 rounded-xl border border-[#56A867]/40 bg-[#1A1A28] text-xs space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white text-sm">{s.title}</span>
                          <span className="text-[10px] font-mono text-[#56A867] flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {s.time}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-[11px] text-[#8E8E9E] font-mono">
                          <span>{s.durationMinutes} min</span>
                          <span>•</span>
                          <span>~{s.estimatedKcal} kcal</span>
                          <span>•</span>
                          <span className="text-white font-semibold">{s.type}</span>
                          <span>•</span>
                          <span className="text-neutral-300">{s.intensity}</span>
                        </div>

                        {s.exercises && s.exercises.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1 border-t border-[#222234]">
                            {s.exercises.map((ex, i) => (
                              <span
                                key={i}
                                className="px-1.5 py-0.5 rounded bg-[#12121C] text-[10px] font-mono text-[#A0A0B0]"
                              >
                                {ex}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="p-5 rounded-xl bg-[#161622] border border-[#222230] text-center space-y-2">
                      <AlertCircle className="w-6 h-6 text-[#707080] mx-auto" />
                      <p className="text-xs text-[#8E8E9E]">
                        {language === 'en'
                          ? 'No routine scheduled for this day yet. Click "Modify Day" to add exercises or mark it as rest.'
                          : 'Aún no has programado una rutina para este día. Haz clic en "Personalizar Día" para agregarla o marcarlo como descanso.'}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <button
              onClick={() => onNavigate('live-workout')}
              className="w-full py-3 px-4 rounded-xl bg-[#56A867] hover:bg-[#64B875] text-black font-bold text-xs uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(86,168,103,0.25)] flex items-center justify-center gap-1.5 cursor-pointer mt-4"
            >
              <Zap className="w-4 h-4 fill-black" />
              <span>{language === 'en' ? "Start Today's Session" : 'Iniciar Sesión de Hoy'}</span>
            </button>
          </div>
        </div>
      </ScrollReveal>

      {/* Interactive Day Editor Modal */}
      <CalendarDayModal
        isOpen={isDayModalOpen}
        onClose={() => setIsDayModalOpen(false)}
        day={selectedDay}
        isRestDefault={isRestDefault(selectedDay)}
        dayOverride={dayOverrides[selectedDay]}
        daySessions={selectedDaySessions}
        preferredWorkoutTime={preferredTime}
        language={language}
        onSaveDay={handleSaveDay}
        onDeleteDayActivity={handleDeleteDayActivity}
        onResetDayToRecommended={handleResetDayToRecommended}
      />

      {/* 1 Minute Plank Penance Modal */}
      <PlankPenanceModal
        isOpen={showPenanceModal}
        onClose={() => setShowPenanceModal(false)}
      />
    </div>
  );
};
