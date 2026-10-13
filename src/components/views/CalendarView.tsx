/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
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
} from 'lucide-react';
import { ScheduledSession, ScreenId } from '../../types';
import { initialCalendarSessions } from '../../data/initialData';
import { useApp } from '../../context/AppContext';
import { PlankPenanceModal } from '../common/PlankPenanceModal';
import { localDatabase } from '../../db/localDatabase';
import { ScrollReveal } from '../common/ScrollReveal';

interface CalendarViewProps {
  onNavigate: (screen: ScreenId) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ onNavigate }) => {
  const { user, setUser, language, t, theme } = useApp();
  const [sessions, setSessions] = useState<ScheduledSession[]>(initialCalendarSessions);
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [selectedDay, setSelectedDay] = useState<number>(5);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPenanceModal, setShowPenanceModal] = useState(false);

  // User preferred workout time (Madrugada, Mañana, Tarde, Noche)
  const [preferredTime, setPreferredTime] = useState<string>(
    user.preferredWorkoutTime || '07:00'
  );
  const [isEditingTime, setIsEditingTime] = useState(false);

  // New session modal inputs
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<'Fuerza' | 'Hipertrofia' | 'Cardio' | 'Movilidad' | 'Potencia'>('Hipertrofia');
  const [newTime, setNewTime] = useState(preferredTime);
  const [newDay, setNewDay] = useState(selectedDay);

  // Days for October 2026 calendar mockup (starting Thursday)
  const daysInMonth = Array.from({ length: 31 }, (_, i) => i + 1);

  // Day 1 of Oct 2026 was a Thursday (index 3 in 0-indexed Mon-Sun: Mon=0, Tue=1, Wed=2, Thu=3, Fri=4, Sat=5, Sun=6)
  const startOffsetDays = 3;

  const getDayOfWeek = (dayNumber: number) => {
    // 0 = Monday, 1 = Tuesday, ..., 5 = Saturday, 6 = Sunday
    return (dayNumber - 1 + startOffsetDays) % 7;
  };

  const isRestDay = (dayNumber: number) => {
    const dow = getDayOfWeek(dayNumber);
    return dow === 5 || dow === 6; // Saturday or Sunday
  };

  const getSessionsForDay = (day: number) => {
    return sessions.filter((s) => s.day === day);
  };

  const handleAddSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle) return;

    const newSess: ScheduledSession = {
      id: `sess-${Date.now()}`,
      day: Number(newDay),
      month: 9,
      year: 2026,
      time: newTime,
      title: newTitle,
      type: newType,
      durationMinutes: 60,
      estimatedKcal: 450,
      completed: false,
      intensity: 'Alta',
    };

    setSessions([...sessions, newSess]);
    setShowAddModal(false);
    setNewTitle('');
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

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto text-left">
      {/* Header */}
      <ScrollReveal direction="down" duration={0.4}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-[#56A867]/15 text-[#56A867] text-[11px] font-mono font-bold uppercase tracking-wider mb-1">
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>
                {language === 'en'
                  ? 'Official Periodization • Rest on Saturday & Sunday'
                  : 'Periodización Oficial • Descanso Sábado y Domingo'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white">
              {t('calendarTitle')}
            </h1>
            <p className="text-xs sm:text-sm text-[#8E8E9E]">
              {t('calendarSubtitle')}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddModal(true)}
              className="py-2.5 px-4 rounded-xl bg-[#56A867] hover:bg-[#64B875] text-black font-bold text-xs transition-all shadow-[0_0_20px_rgba(86,168,103,0.25)] flex items-center gap-1.5 font-mono uppercase cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{t('newSession')}</span>
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

              <span className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold flex items-center gap-1 bg-[#1E1E2C] ${periodInfo.color}`}>
                <PeriodIcon className="w-3.5 h-3.5" />
                <span>{periodInfo.label} ({preferredTime})</span>
              </span>
            </div>

            {!isEditingTime ? (
              <div className="flex items-center justify-between pt-1 border-t border-[#20202E]">
                <span className="text-xs text-[#A0A0B0]">
                  {language === 'en'
                    ? <>Your active workout alarm is set for <strong>{preferredTime}</strong>.</>
                    : <>Tu alarma de sesión activa está fijada a las <strong>{preferredTime}</strong>.</>}
                </span>
                <button
                  onClick={() => setIsEditingTime(true)}
                  className="text-xs font-mono text-[#56A867] hover:underline cursor-pointer"
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
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#808090]">
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
                <>If you miss a scheduled session Monday to Friday, perform <strong>1 minute of isometric plank</strong> to keep your accumulated 1% daily discount intact.</>
              ) : (
                <>Si faltas a un día de rutina entre Lunes y Viernes, realiza <strong>1 minuto de tablón isométrico (plank)</strong> para no perder tu descuento acumulado del 1% diario.</>
              )}
            </div>

            <div className="pt-2 border-t border-[#252538] flex items-center justify-between">
              <span className="text-[10px] font-mono text-neutral-400">
                {user.penanceCompleted
                  ? (language === 'en' ? '✅ Recent plank penalty completed' : '✅ Penitencia reciente completada')
                  : (language === 'en' ? 'Active discipline' : 'Disciplina activa')}
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
          <div className="flex items-center justify-between pb-3 border-b border-[#1E1E28]">
            <h2 className="text-base font-serif font-bold text-white flex items-center gap-2">
              <span>{language === 'en' ? 'October 2026' : 'Octubre 2026'}</span>
              <span className="text-xs font-mono text-[#56A867]">
                {language === 'en' ? 'Rest: Saturday & Sunday' : 'Descanso: Sábado & Domingo'}
              </span>
            </h2>

            <div className="flex items-center gap-1 text-[#808090]">
              <button
                className="p-1.5 rounded-lg hover:bg-[#1A1A24] hover:text-white cursor-pointer"
                aria-label={language === 'en' ? 'Previous Month' : 'Mes Anterior'}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                className="p-1.5 rounded-lg hover:bg-[#1A1A24] hover:text-white cursor-pointer"
                aria-label={language === 'en' ? 'Next Month' : 'Mes Siguiente'}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Days of Week Header */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-mono pb-1 font-bold">
            <span className="text-[#8E8E9E]">{language === 'en' ? 'MON' : 'LUN'}</span>
            <span className="text-[#8E8E9E]">{language === 'en' ? 'TUE' : 'MAR'}</span>
            <span className="text-[#8E8E9E]">{language === 'en' ? 'WED' : 'MIÉ'}</span>
            <span className="text-[#8E8E9E]">{language === 'en' ? 'THU' : 'JUE'}</span>
            <span className="text-[#8E8E9E]">{language === 'en' ? 'FRI' : 'VIE'}</span>
            <span className="text-[#56A867] bg-[#56A867]/10 rounded py-0.5">
              {language === 'en' ? 'SAT (Rest)' : 'SÁB (Descanso)'}
            </span>
            <span className="text-[#56A867] bg-[#56A867]/10 rounded py-0.5">
              {language === 'en' ? 'SUN (Rest)' : 'DOM (Descanso)'}
            </span>
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1.5">
            {/* Blank offset days for Thursday start */}
            <div className="min-h-[75px] rounded-xl bg-[#0E0E12]/40 border border-transparent" />
            <div className="min-h-[75px] rounded-xl bg-[#0E0E12]/40 border border-transparent" />
            <div className="min-h-[75px] rounded-xl bg-[#0E0E12]/40 border border-transparent" />

            {daysInMonth.map((day) => {
              const daySessions = getSessionsForDay(day);
              const isSelected = selectedDay === day;
              const isToday = day === 5;
              const rest = isRestDay(day);

              return (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={`min-h-[82px] p-1.5 rounded-xl border text-left flex flex-col justify-between transition-all relative cursor-pointer ${
                    isSelected
                      ? 'bg-[#181824] border-[#56A867] shadow-[0_0_15px_rgba(86,168,103,0.15)]'
                      : rest
                      ? 'bg-[#141C10] border-[#253518] hover:bg-[#1A2514]'
                      : isToday
                      ? 'bg-[#14141E] border-[#56A867]/40'
                      : 'bg-[#101015] border-[#1C1C24] hover:bg-[#151520]'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span
                      className={`text-xs font-mono font-bold ${
                        isToday
                          ? 'text-[#56A867]'
                          : rest
                          ? 'text-[#56A867]'
                          : isSelected
                          ? 'text-white'
                          : 'text-[#8E8E9E]'
                      }`}
                    >
                      {day}
                    </span>
                    {rest ? (
                      <span className="text-[9px] font-mono text-[#56A867]/80">RELAX</span>
                    ) : isToday ? (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#56A867] animate-pulse" />
                    ) : null}
                  </div>

                  {/* Sessions tags on day */}
                  <div className="space-y-1 w-full mt-1">
                    {rest ? (
                      <div className="px-1 py-0.5 rounded text-[8px] font-mono text-[#56A867] bg-[#56A867]/10 border border-[#56A867]/20 truncate">
                        {language === 'en' ? 'Active Rest' : 'Descanso Activo'}
                      </div>
                    ) : (
                      daySessions.map((s) => (
                        <div
                          key={s.id}
                          className={`px-1.5 py-0.5 rounded text-[9px] font-mono truncate font-medium ${
                            s.completed
                              ? 'bg-[#1E2616] text-[#56A867] border border-[#2D3F1E]'
                              : 'bg-[#222230] text-white border border-[#2D2D3E]'
                          }`}
                        >
                          {s.title}
                        </div>
                      ))
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
              <h3 className="text-sm font-serif font-bold text-white">
                {language === 'en' ? 'Selected Day Plan' : 'Plan del Día Seleccionado'}
              </h3>
              <span className="text-xs font-mono text-[#56A867]">
                {selectedDay} {language === 'en' ? 'October' : 'Octubre'}{' '}
                {isRestDay(selectedDay)
                  ? language === 'en'
                    ? '(Weekend • Rest)'
                    : '(Fin de Semana • Descanso)'
                  : language === 'en'
                  ? '(Weekday)'
                  : '(Entre Semana)'}
              </span>
            </div>

            {/* Rest Day Highlight if Saturday or Sunday */}
            {isRestDay(selectedDay) ? (
              <div className="p-4 rounded-xl bg-[#152210] border border-[#56A867]/30 space-y-2 text-neutral-300">
                <span className="text-xs font-mono font-bold text-[#56A867] uppercase block">
                  {language === 'en' ? 'Official Rest Day' : 'Día Oficial de Descanso'}
                </span>
                <p className="text-xs leading-relaxed">
                  {language === 'en'
                    ? 'Saturday and Sunday are reserved for myofascial regeneration and glycogen replenishment. No routine penalty is required on these days.'
                    : 'Sábado y Domingo están reservados para la regeneración miofascial y recarga de glucógeno. No se requiere penitencia estos días.'}
                </p>
                <div className="text-[11px] text-[#A0C090] font-mono">
                  {language === 'en'
                    ? 'Suggested: Gentle walking, deep hydration, and passive mobility stretches.'
                    : 'Sugerido: Caminata suave, hidratación profunda y estiramientos pasivos.'}
                </div>
              </div>
            ) : (
              /* Weekday Routine Info */
              <div className="space-y-2.5">
                {getSessionsForDay(selectedDay).length > 0 ? (
                  getSessionsForDay(selectedDay).map((s) => (
                    <div
                      key={s.id}
                      className="p-3.5 rounded-xl border border-[#56A867]/40 bg-[#1A1A28] text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white">{s.title}</span>
                        <span className="text-[10px] font-mono text-[#56A867]">{s.time}</span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-[#808090] font-mono">
                        <span>{s.durationMinutes} min</span>
                        <span>•</span>
                        <span>~{s.estimatedKcal} kcal</span>
                        <span>•</span>
                        <span className="text-white font-semibold">
                          {language === 'en'
                            ? s.type === 'Fuerza'
                              ? 'Strength'
                              : s.type === 'Hipertrofia'
                              ? 'Hypertrophy'
                              : s.type === 'Cardio'
                              ? 'Cardio'
                              : s.type === 'Movilidad'
                              ? 'Mobility'
                              : 'Power'
                            : s.type}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 rounded-xl bg-[#161622] border border-[#222230] text-xs text-[#8E8E9E]">
                    {language === 'en'
                      ? 'No sessions scheduled for this weekday. You can schedule one or start a live workout.'
                      : 'No tienes sesiones añadidas para este día entre semana. Puedes programar una o iniciar una rutina en vivo.'}
                  </div>
                )}
              </div>
            )}
          </div>

          <button
            onClick={() => onNavigate('live-workout')}
            className="w-full py-3 px-4 rounded-xl bg-[#56A867] hover:bg-[#64B875] text-black font-bold text-xs uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(86,168,103,0.25)] flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Zap className="w-4 h-4 fill-black" />
            <span>{language === 'en' ? "Start Today's Session" : 'Iniciar Sesión de Hoy'}</span>
          </button>
        </div>
      </div>
    </ScrollReveal>

      {/* Add Session Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#121218] border border-[#2B2B38] rounded-2xl p-6 shadow-2xl space-y-4 text-left">
            <div className="flex items-center justify-between pb-2 border-b border-[#20202A]">
              <h3 className="text-lg font-serif font-bold text-white">
                {language === 'en' ? 'Schedule Workout Session' : 'Programar Sesión de Entrenamiento'}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-[#707080] hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddSession} className="space-y-3">
              <div>
                <label className="text-xs font-mono text-[#A0A0B0] block mb-1">
                  {language === 'en' ? 'Session Title' : 'Título de la Sesión'}
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                  placeholder={language === 'en' ? 'e.g. Heavy Chest & Triceps' : 'Ej. Pecho Pesado & Tríceps'}
                  className="w-full p-2.5 rounded-xl bg-[#1A1A24] border border-[#2B2B38] text-white text-xs focus:outline-none focus:border-[#56A867]"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-mono text-[#A0A0B0] block mb-1">
                    {language === 'en' ? 'Day of Month' : 'Día del Mes'}
                  </label>
                  <input
                    type="number"
                    value={newDay}
                    onChange={(e) => setNewDay(Number(e.target.value))}
                    min={1}
                    max={31}
                    className="w-full p-2.5 rounded-xl bg-[#1A1A24] border border-[#2B2B38] text-white text-xs focus:outline-none focus:border-[#56A867]"
                  />
                </div>

                <div>
                  <label className="text-xs font-mono text-[#A0A0B0] block mb-1">
                    {language === 'en' ? 'Time' : 'Hora'}
                  </label>
                  <input
                    type="time"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-[#1A1A24] border border-[#2B2B38] text-white text-xs focus:outline-none focus:border-[#56A867]"
                  />
                </div>

                <div>
                  <label className="text-xs font-mono text-[#A0A0B0] block mb-1">
                    {language === 'en' ? 'Type' : 'Tipo'}
                  </label>
                  <select
                    value={newType}
                    onChange={(e: any) => setNewType(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-[#1A1A24] border border-[#2B2B38] text-white text-xs focus:outline-none focus:border-[#56A867]"
                  >
                    <option value="Fuerza">{language === 'en' ? 'Strength' : 'Fuerza'}</option>
                    <option value="Hipertrofia">{language === 'en' ? 'Hypertrophy' : 'Hipertrofia'}</option>
                    <option value="Cardio">{language === 'en' ? 'Cardio' : 'Cardio'}</option>
                    <option value="Movilidad">{language === 'en' ? 'Mobility' : 'Movilidad'}</option>
                    <option value="Potencia">{language === 'en' ? 'Power' : 'Potencia'}</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="py-2 px-4 rounded-xl bg-[#1A1A24] text-[#A0A0B0] hover:text-white text-xs cursor-pointer"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="py-2 px-5 rounded-xl bg-[#56A867] hover:bg-[#64B875] text-black font-bold text-xs shadow-md font-mono uppercase cursor-pointer"
                >
                  {language === 'en' ? 'Save to Schedule' : 'Guardar en Agenda'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 1 Minute Plank Penance Modal */}
      <PlankPenanceModal
        isOpen={showPenanceModal}
        onClose={() => setShowPenanceModal(false)}
      />
    </div>
  );
};
