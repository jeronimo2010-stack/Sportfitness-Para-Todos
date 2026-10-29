/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  BarChart2,
  TrendingUp,
  Activity,
  Heart,
  Dumbbell,
  Moon,
  Utensils,
  Target,
  Sparkles,
  MessageSquare,
  Plus,
  Edit3,
  Calendar,
  X,
  Check,
  Zap,
  Info,
} from 'lucide-react';
import { UserProfile, WeeklyWeighInLog } from '../../types';
import { localDatabase } from '../../db/localDatabase';
import { ScrollReveal } from '../common/ScrollReveal';
import { ScatterCorrelationPlot, ScatterDataPoint } from './ScatterCorrelationPlot';

interface AthleteAnalyticsChartsProps {
  user: UserProfile;
  language?: string;
  onUpdateWeight?: (newWeightKg: number) => void;
}

type FitnessGoalType = 'bajar_peso' | 'fuerza' | 'masa_muscular';

export const AthleteAnalyticsCharts: React.FC<AthleteAnalyticsChartsProps> = ({
  user,
  language = 'es',
  onUpdateWeight,
}) => {
  // Goal selector state (defaults to user.fitnessGoal or 'fuerza')
  const [selectedGoal, setSelectedGoal] = useState<FitnessGoalType>(
    user.fitnessGoal || 'fuerza'
  );

  // Weekly weigh-ins from localDatabase
  const [weighIns, setWeighIns] = useState<WeeklyWeighInLog[]>(() =>
    localDatabase.getWeeklyWeighIns(user.id)
  );

  // Selected weigh-in for viewing or adding comments
  const [selectedWeighIn, setSelectedWeighIn] = useState<WeeklyWeighInLog | null>(null);
  const [editingComment, setEditingComment] = useState('');
  const [showWeighInModal, setShowWeighInModal] = useState(false);
  const [newWeightInput, setNewWeightInput] = useState<number>(user.weight || 75);
  const [newCommentInput, setNewCommentInput] = useState('');

  // 1. Actividad Semanal: Volumen de carga (Lun - Dom)
  const volumeChartData = useMemo(() => {
    const baselineTonnage = (user.weight || 75) * 45; // ~3375 kg
    return [
      { day: 'Lun', label: 'Lunes', volumeKg: Math.round(baselineTonnage * 1.15), isToday: false },
      { day: 'Mar', label: 'Martes', volumeKg: Math.round(baselineTonnage * 0.95), isToday: true },
      { day: 'Mié', label: 'Miércoles', volumeKg: Math.round(baselineTonnage * 1.25), isToday: false },
      { day: 'Jue', label: 'Jueves', volumeKg: 0, isToday: false },
      { day: 'Vie', label: 'Viernes', volumeKg: Math.round(baselineTonnage * 1.35), isToday: false },
      { day: 'Sáb', label: 'Sábado', volumeKg: Math.round(baselineTonnage * 0.8), isToday: false },
      { day: 'Dom', label: 'Domingo', volumeKg: 0, isToday: false },
    ];
  }, [user.weight]);

  const maxVolume = useMemo(() => {
    const maxVal = Math.max(...volumeChartData.map((d) => d.volumeKg), 4000);
    return maxVal;
  }, [volumeChartData]);

  // 3. Variables cardiovasculares y resistencia (Tiempo en carrera min vs BPM promedio)
  const cardioData = useMemo(() => {
    return [
      { session: 'S1', day: 'Lun', durationMin: 32, bpm: 144 },
      { session: 'S2', day: 'Mié', durationMin: 45, bpm: 152 },
      { session: 'S3', day: 'Vie', durationMin: 38, bpm: 148 },
      { session: 'S4', day: 'Dom', durationMin: 55, bpm: 156 },
      { session: 'S5', day: 'Mar', durationMin: 40, bpm: 142 },
      { session: 'S6', day: 'Jue', durationMin: 48, bpm: 150 },
      { session: 'S7', day: 'Sáb', durationMin: 60, bpm: 158 },
    ];
  }, []);

  // 4. Fuerza estimada máxima (1RM) con 4 variables
  const oneRmData = useMemo(() => {
    const bw = user.weight || 75;
    return [
      { week: 'Sem 1', deadlift: Math.round(bw * 1.6), squat: Math.round(bw * 1.25), bench: Math.round(bw * 0.9), pullup: Math.round(bw * 0.15) },
      { week: 'Sem 2', deadlift: Math.round(bw * 1.63), squat: Math.round(bw * 1.28), bench: Math.round(bw * 0.92), pullup: Math.round(bw * 0.17) },
      { week: 'Sem 3', deadlift: Math.round(bw * 1.67), squat: Math.round(bw * 1.32), bench: Math.round(bw * 0.94), pullup: Math.round(bw * 0.19) },
      { week: 'Sem 4', deadlift: Math.round(bw * 1.7), squat: Math.round(bw * 1.35), bench: Math.round(bw * 0.97), pullup: Math.round(bw * 0.22) },
      { week: 'Sem 5', deadlift: Math.round(bw * 1.74), squat: Math.round(bw * 1.38), bench: Math.round(bw * 1.0), pullup: Math.round(bw * 0.25) },
      { week: 'Sem 6', deadlift: Math.round(bw * 1.78), squat: Math.round(bw * 1.42), bench: Math.round(bw * 1.03), pullup: Math.round(bw * 0.28) },
    ];
  }, [user.weight]);

  // 5. Horas de sueño (Gráfica de barras)
  const sleepData = useMemo(() => {
    return [
      { day: 'Lun', hours: 7.2, target: 8.0 },
      { day: 'Mar', hours: 8.1, target: 8.0 },
      { day: 'Mié', hours: 6.5, target: 8.0 },
      { day: 'Jue', hours: 7.8, target: 8.0 },
      { day: 'Vie', hours: 8.5, target: 8.0 },
      { day: 'Sáb', hours: 7.0, target: 8.0 },
      { day: 'Dom', hours: 8.2, target: 8.0 },
    ];
  }, []);

  // 6. Calorías ingeridas diariamente (Gráfica de líneas)
  const caloriesData = useMemo(() => {
    const target = user.bodyType === 'Ectomorfo' ? 2800 : user.bodyType === 'Endomorfo' ? 2200 : 2550;
    return [
      { day: 'Lun', calories: target - 120, target },
      { day: 'Mar', calories: target + 80, target },
      { day: 'Mié', calories: target - 50, target },
      { day: 'Jue', calories: target + 140, target },
      { day: 'Vie', calories: target - 30, target },
      { day: 'Sáb', calories: target + 210, target },
      { day: 'Dom', calories: target - 90, target },
    ];
  }, [user.bodyType]);

  // 7. Datos de correlación basados en el objetivo (Scatter Plot + Regresión Lineal r = 0.91)
  const scatterSleepPoints: ScatterDataPoint[] = useMemo(() => {
    const rawData = [
      { x: 5.0, y: -14 }, { x: 5.1, y: -9 }, { x: 5.2, y: 3 }, { x: 5.2, y: -16 }, { x: 5.3, y: -4 },
      { x: 5.4, y: 6 }, { x: 5.5, y: -8 }, { x: 5.5, y: 11 }, { x: 5.6, y: 3 }, { x: 5.7, y: 16 },
      { x: 5.8, y: 12 }, { x: 5.8, y: 21 }, { x: 5.9, y: 7 }, { x: 6.0, y: 25 }, { x: 6.1, y: 15 },
      { x: 6.2, y: 29 }, { x: 6.2, y: 22 }, { x: 6.3, y: 33 }, { x: 6.4, y: 27 }, { x: 6.5, y: 39 },
      { x: 6.5, y: 31 }, { x: 6.6, y: 43 }, { x: 6.7, y: 37 }, { x: 6.8, y: 48 }, { x: 6.8, y: 41 },
      { x: 6.9, y: 52 }, { x: 7.0, y: 45 }, { x: 7.1, y: 57 }, { x: 7.2, y: 51 }, { x: 7.2, y: 61 },
      { x: 7.3, y: 55 }, { x: 7.4, y: 66 }, { x: 7.5, y: 60 }, { x: 7.5, y: 71 }, { x: 7.6, y: 63 },
      { x: 7.7, y: 75 }, { x: 7.8, y: 68 }, { x: 7.9, y: 80 }, { x: 8.0, y: 73 }, { x: 8.0, y: 84 },
      { x: 8.1, y: 77 }, { x: 8.2, y: 88 }, { x: 8.3, y: 82 }, { x: 8.4, y: 91 }, { x: 8.4, y: 85 },
      { x: 8.5, y: 94 }, { x: 8.6, y: 87 }, { x: 8.7, y: 96 }, { x: 8.8, y: 92 }, { x: 8.9, y: 98 },
      { x: 9.0, y: 95 }, { x: 9.1, y: 101 }, { x: 9.2, y: 97 }, { x: 5.7, y: 6 }, { x: 6.3, y: 18 },
      { x: 6.7, y: 26 }, { x: 7.1, y: 40 }, { x: 7.6, y: 54 }, { x: 8.1, y: 67 }, { x: 8.6, y: 78 },
      { x: 6.1, y: 37 }, { x: 7.4, y: 78 }, { x: 7.9, y: 91 }, { x: 8.7, y: 103 }, { x: 8.9, y: 105 }
    ];

    const goalLabel =
      selectedGoal === 'bajar_peso'
        ? 'Pérdida de Grasa'
        : selectedGoal === 'masa_muscular'
        ? 'Síntesis Proteica'
        : 'Fuerza 1RM';

    return rawData.map((d) => ({
      x: d.x,
      y: d.y,
      note: `${d.x} hrs sueño ➔ ${d.y}% ${goalLabel}`,
    }));
  }, [selectedGoal]);

  const scatterDietPoints: ScatterDataPoint[] = useMemo(() => {
    const rawData = [
      { x: 58, y: -12 }, { x: 60, y: -6 }, { x: 61, y: 5 }, { x: 62, y: -14 }, { x: 63, y: 1 },
      { x: 64, y: 9 }, { x: 65, y: -3 }, { x: 65, y: 14 }, { x: 66, y: 7 }, { x: 67, y: 19 },
      { x: 68, y: 15 }, { x: 69, y: 24 }, { x: 70, y: 11 }, { x: 71, y: 27 }, { x: 72, y: 19 },
      { x: 73, y: 33 }, { x: 73, y: 25 }, { x: 74, y: 37 }, { x: 75, y: 30 }, { x: 76, y: 42 },
      { x: 76, y: 34 }, { x: 77, y: 46 }, { x: 78, y: 40 }, { x: 79, y: 51 }, { x: 79, y: 44 },
      { x: 80, y: 55 }, { x: 81, y: 48 }, { x: 82, y: 60 }, { x: 83, y: 54 }, { x: 83, y: 64 },
      { x: 84, y: 58 }, { x: 85, y: 69 }, { x: 86, y: 63 }, { x: 86, y: 74 }, { x: 87, y: 66 },
      { x: 88, y: 78 }, { x: 89, y: 71 }, { x: 90, y: 83 }, { x: 91, y: 76 }, { x: 91, y: 87 },
      { x: 92, y: 80 }, { x: 93, y: 91 }, { x: 94, y: 85 }, { x: 95, y: 94 }, { x: 95, y: 88 },
      { x: 96, y: 97 }, { x: 97, y: 90 }, { x: 98, y: 99 }, { x: 98, y: 94 }, { x: 99, y: 101 },
      { x: 67, y: 9 }, { x: 72, y: 21 }, { x: 77, y: 29 }, { x: 82, y: 43 }, { x: 87, y: 57 },
      { x: 92, y: 70 }, { x: 96, y: 81 }, { x: 71, y: 40 }, { x: 84, y: 81 }, { x: 89, y: 93 },
      { x: 96, y: 104 }, { x: 98, y: 107 }
    ];

    const goalLabel =
      selectedGoal === 'bajar_peso'
        ? 'Déficit Efectivo'
        : selectedGoal === 'masa_muscular'
        ? 'Hipertrofia Neta'
        : 'Fuerza 1RM';

    return rawData.map((d) => ({
      x: d.x,
      y: d.y,
      note: `${d.x}% adherencia ➔ ${d.y}% ${goalLabel}`,
    }));
  }, [selectedGoal]);

  // Handle saving new weigh-in
  const handleSaveNewWeighIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWeightInput || newWeightInput <= 0) return;

    const saved = localDatabase.saveWeeklyWeighIn(user.id, newWeightInput, newCommentInput);
    setWeighIns(localDatabase.getWeeklyWeighIns(user.id));
    if (onUpdateWeight) onUpdateWeight(newWeightInput);
    setShowWeighInModal(false);
    setNewCommentInput('');
  };

  // Handle updating an existing point's comment
  const handleSaveComment = () => {
    if (!selectedWeighIn) return;
    localDatabase.updateWeeklyWeighInComment(user.id, selectedWeighIn.id, editingComment);
    setWeighIns(localDatabase.getWeeklyWeighIns(user.id));
    setSelectedWeighIn(null);
  };

  // Helper to calculate SVG points for line charts
  const getLineCoordinates = (
    data: number[],
    width: number,
    height: number,
    minVal: number,
    maxVal: number,
    padding = 24
  ) => {
    const availableWidth = width - padding * 2;
    const availableHeight = height - padding * 2;
    const range = maxVal - minVal || 1;

    return data.map((val, idx) => {
      const x = padding + (idx / Math.max(1, data.length - 1)) * availableWidth;
      const normalizedY = (val - minVal) / range;
      const y = height - padding - normalizedY * availableHeight;
      return { x, y, val };
    });
  };

  return (
    <div className="space-y-6 text-left">
      {/* ============================================================== */}
      {/* 1. ACTIVIDAD SEMANAL: VOLUMEN (GRÁFICA DE BARRAS) */}
      {/* ============================================================== */}
      <ScrollReveal direction="up" delay={0.08} duration={0.4}>
        <div className="p-6 rounded-2xl bg-[#121218] border border-[#20202A] space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-[#1E1E28]">
            <div>
              <div className="flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-[#56A867]" />
                <h3 className="text-base sm:text-lg font-serif font-bold text-white">
                  Actividad Semanal: Volumen
                </h3>
              </div>
              <p className="text-xs text-[#8E8E9E] mt-0.5">
                Progresión de carga acumulada y tonelaje por día de entrenamiento.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono text-[#56A867] bg-[#56A867]/10 px-3 py-1 rounded-xl border border-[#56A867]/25">
              <Zap className="w-3.5 h-3.5" />
              <span>Tonelaje en Tiempo Real</span>
            </div>
          </div>

          {/* Bar Chart Grid */}
          <div className="h-52 flex items-end gap-2 sm:gap-4 pt-4 border-b border-[#20202A]">
            {volumeChartData.map((item, index) => {
              const heightPercent =
                item.volumeKg > 0 ? Math.max(10, Math.round((item.volumeKg / maxVolume) * 100)) : 4;
              return (
                <div
                  key={index}
                  className="flex-1 flex flex-col items-center gap-2 h-full justify-end group cursor-pointer"
                  title={`${item.label}: ${item.volumeKg} kg de volumen`}
                >
                  <div className="w-full flex justify-center text-[10px] font-mono text-neutral-300 opacity-0 group-hover:opacity-100 transition-opacity">
                    {item.volumeKg > 0 ? `${item.volumeKg}kg` : '0kg'}
                  </div>

                  <div
                    className="w-full rounded-t-xl transition-all duration-300 relative group-hover:brightness-125"
                    style={{
                      height: `${heightPercent}%`,
                      backgroundColor:
                        item.volumeKg > 0 ? (item.isToday ? '#56A867' : '#2A4432') : '#181822',
                    }}
                  >
                    <div
                      className="absolute -top-1 w-full h-1 rounded-full"
                      style={{
                        backgroundColor:
                          item.volumeKg > 0 ? (item.isToday ? '#64B875' : '#3E664A') : '#252535',
                      }}
                    />
                  </div>

                  <span
                    className={`text-xs font-mono tabular-nums ${
                      item.isToday ? 'text-[#56A867] font-bold' : 'text-neutral-400'
                    }`}
                  >
                    {item.day}
                  </span>
                  <span className="text-[10px] text-[#555566] font-mono hidden sm:inline">
                    {item.volumeKg > 0 ? `${(item.volumeKg / 1000).toFixed(1)}t` : '0t'}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-xs text-[#707080] font-mono pt-1">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-[#56A867]" />
                <span className="text-white">Día actual activo</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-[#2A4432]" />
                <span>Sesiones del ciclo</span>
              </div>
            </div>
            <span>Base de datos sincronizada</span>
          </div>
        </div>
      </ScrollReveal>

      {/* ============================================================== */}
      {/* 2. EVOLUCIÓN DE PESO CORPORAL SEMANAL (LÍNEAS CON COMENTARIOS) */}
      {/* ============================================================== */}
      <ScrollReveal direction="up" delay={0.1} duration={0.4}>
        <div className="p-6 rounded-2xl bg-[#121218] border border-[#20202A] space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-[#1E1E28]">
            <div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[#38BDF8]" />
                <h3 className="text-base sm:text-lg font-serif font-bold text-white">
                  Evolución de Peso Corporal Semanal
                </h3>
              </div>
              <p className="text-xs text-[#8E8E9E] mt-0.5">
                Registro semana a semana. <strong>Haz clic en cualquier punto</strong> para ver o añadir comentarios técnicos.
              </p>
            </div>

            <button
              onClick={() => {
                setNewWeightInput(weighIns[weighIns.length - 1]?.weightKg || user.weight || 75);
                setShowWeighInModal(true);
              }}
              className="py-2 px-3.5 rounded-xl bg-[#38BDF8]/15 hover:bg-[#38BDF8]/25 border border-[#38BDF8]/40 text-[#38BDF8] text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Registrar Pesaje Semanal</span>
            </button>
          </div>

          {/* SVG Line Chart for Weekly Weigh-Ins */}
          {(() => {
            const weights = weighIns.map((w) => w.weightKg);
            const minW = Math.floor(Math.min(...weights) - 1.5);
            const maxW = Math.ceil(Math.max(...weights) + 1.5);
            const svgWidth = 640;
            const svgHeight = 200;
            const coords = getLineCoordinates(weights, svgWidth, svgHeight, minW, maxW, 36);
            const pointsStr = coords.map((c) => `${c.x},${c.y}`).join(' ');

            return (
              <div className="space-y-3">
                <div className="relative w-full overflow-x-auto bg-[#0E0E14] rounded-xl border border-[#1E1E2A] p-2">
                  <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full min-w-[500px] h-48">
                    {/* Horizontal Grid lines */}
                    {[minW, (minW + maxW) / 2, maxW].map((lvl, idx) => {
                      const y = svgHeight - 36 - ((lvl - minW) / (maxW - minW)) * (svgHeight - 72);
                      return (
                        <g key={idx}>
                          <line x1="30" y1={y} x2={svgWidth - 20} y2={y} stroke="#1C1C28" strokeDasharray="3 3" />
                          <text x="5" y={y + 4} fill="#5A5A6E" fontSize="9" fontFamily="monospace">
                            {lvl.toFixed(1)}k
                          </text>
                        </g>
                      );
                    })}

                    {/* Gradient Fill under the line */}
                    <defs>
                      <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    {coords.length > 1 && (
                      <polygon
                        points={`36,${svgHeight - 36} ${pointsStr} ${coords[coords.length - 1].x},${svgHeight - 36}`}
                        fill="url(#weightGrad)"
                      />
                    )}

                    {/* Line connecting points */}
                    <polyline fill="none" stroke="#38BDF8" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" points={pointsStr} />

                    {/* Points with Click Interactivity */}
                    {coords.map((c, i) => {
                      const item = weighIns[i];
                      const hasComment = Boolean(item?.comment);
                      return (
                        <g
                          key={i}
                          className="cursor-pointer group"
                          onClick={() => {
                            setSelectedWeighIn(item);
                            setEditingComment(item.comment || '');
                          }}
                        >
                          <circle
                            cx={c.x}
                            cy={c.y}
                            r={hasComment ? '7' : '5'}
                            fill={hasComment ? '#38BDF8' : '#14141E'}
                            stroke="#38BDF8"
                            strokeWidth="2.5"
                            className="transition-all hover:scale-125"
                          />
                          {hasComment && (
                            <circle cx={c.x} cy={c.y} r="2.5" fill="#0E0E14" />
                          )}
                          <text
                            x={c.x}
                            y={c.y - 10}
                            textAnchor="middle"
                            fill="#FFFFFF"
                            fontSize="10"
                            fontWeight="bold"
                            fontFamily="monospace"
                          >
                            {c.val}kg
                          </text>
                          <text
                            x={c.x}
                            y={svgHeight - 12}
                            textAnchor="middle"
                            fill="#707084"
                            fontSize="9"
                            fontFamily="monospace"
                          >
                            {item?.date || `Sem ${i + 1}`}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </div>

                {/* List of Registered Comments */}
                <div className="space-y-2">
                  <span className="text-[11px] font-mono uppercase text-[#707080] font-bold flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-[#38BDF8]" />
                    Comentarios y Notas por Semana (Haz clic en un punto para editar):
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {weighIns.map((w) => (
                      <div
                        key={w.id}
                        onClick={() => {
                          setSelectedWeighIn(w);
                          setEditingComment(w.comment || '');
                        }}
                        className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                          selectedWeighIn?.id === w.id
                            ? 'bg-[#38BDF8]/15 border-[#38BDF8] text-white shadow-md'
                            : 'bg-[#151520] border-[#222230] text-[#A0A0B0] hover:border-[#38BDF8]/40'
                        }`}
                      >
                        <div className="flex items-center justify-between font-mono">
                          <span className="font-bold text-white">{w.date}</span>
                          <span className="text-[#38BDF8] font-bold">{w.weightKg} kg</span>
                        </div>
                        <p className="mt-1 text-[11px] italic text-[#C0C0D0] truncate">
                          {w.comment ? `"${w.comment}"` : 'Sin comentario (clic para añadir)'}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </ScrollReveal>

      {/* ============================================================== */}
      {/* 3. VARIABLES CARDIOVASCULARES Y RESISTENCIA (2 VARIABLES) */}
      {/* ============================================================== */}
      <ScrollReveal direction="up" delay={0.12} duration={0.4}>
        <div className="p-6 rounded-2xl bg-[#121218] border border-[#20202A] space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-[#1E1E28]">
            <div>
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-[#FF5252]" />
                <h3 className="text-base sm:text-lg font-serif font-bold text-white">
                  Variables cardiovasculares y resistencia
                </h3>
              </div>
              <p className="text-xs text-[#8E8E9E] mt-0.5">
                Correlación dinámica entre <strong>Tiempo en Carrera (minutos)</strong> y <strong>Ritmo Cardíaco Promedio (BPM)</strong>.
              </p>
            </div>

            <div className="flex items-center gap-4 text-xs font-mono">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-1 bg-[#56A867] rounded-full" />
                <span className="text-white font-bold">Tiempo en carrera (min)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-1 bg-[#FF5252] rounded-full" />
                <span className="text-[#FF5252] font-bold">Ritmo Cardíaco (BPM)</span>
              </div>
            </div>
          </div>

          {/* Dual Line SVG */}
          {(() => {
            const durations = cardioData.map((d) => d.durationMin);
            const bpms = cardioData.map((d) => d.bpm);
            const svgWidth = 640;
            const svgHeight = 210;

            const minDuration = 20;
            const maxDuration = 70;
            const minBpm = 130;
            const maxBpm = 175;

            const durationCoords = getLineCoordinates(durations, svgWidth, svgHeight, minDuration, maxDuration, 36);
            const bpmCoords = getLineCoordinates(bpms, svgWidth, svgHeight, minBpm, maxBpm, 36);

            const durationPoints = durationCoords.map((c) => `${c.x},${c.y}`).join(' ');
            const bpmPoints = bpmCoords.map((c) => `${c.x},${c.y}`).join(' ');

            return (
              <div className="w-full overflow-x-auto bg-[#0E0E14] rounded-xl border border-[#1E1E2A] p-2">
                <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full min-w-[500px] h-52">
                  {/* Grid Lines */}
                  {[0.25, 0.5, 0.75].map((pct, i) => {
                    const y = svgHeight - 36 - pct * (svgHeight - 72);
                    return <line key={i} x1="30" y1={y} x2={svgWidth - 20} y2={y} stroke="#1C1C28" strokeDasharray="3 3" />;
                  })}

                  {/* Line 1: Duration in green */}
                  <polyline fill="none" stroke="#56A867" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" points={durationPoints} />
                  {durationCoords.map((c, idx) => (
                    <g key={`dur-${idx}`}>
                      <circle cx={c.x} cy={c.y} r="4.5" fill="#56A867" />
                      <text x={c.x} y={c.y - 7} textAnchor="middle" fill="#56A867" fontSize="9" fontWeight="bold" fontFamily="monospace">
                        {c.val}m
                      </text>
                    </g>
                  ))}

                  {/* Line 2: BPM in red */}
                  <polyline fill="none" stroke="#FF5252" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" points={bpmPoints} />
                  {bpmCoords.map((c, idx) => (
                    <g key={`bpm-${idx}`}>
                      <circle cx={c.x} cy={c.y} r="4.5" fill="#FF5252" />
                      <text x={c.x} y={c.y + 14} textAnchor="middle" fill="#FF5252" fontSize="9" fontWeight="bold" fontFamily="monospace">
                        {c.val}bpm
                      </text>
                      <text x={c.x} y={svgHeight - 10} textAnchor="middle" fill="#7E7E90" fontSize="9" fontFamily="monospace">
                        {cardioData[idx].day}
                      </text>
                    </g>
                  ))}
                </svg>
              </div>
            );
          })()}
        </div>
      </ScrollReveal>

      {/* ============================================================== */}
      {/* 4. FUERZA ESTIMADA MÁXIMA (1RM) (4 VARIABLES) */}
      {/* ============================================================== */}
      <ScrollReveal direction="up" delay={0.14} duration={0.4}>
        <div className="p-6 rounded-2xl bg-[#121218] border border-[#20202A] space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-[#1E1E28]">
            <div>
              <div className="flex items-center gap-2">
                <Dumbbell className="w-5 h-5 text-[#A78BFA]" />
                <h3 className="text-base sm:text-lg font-serif font-bold text-white">
                  Fuerza estimada máxima (1RM)
                </h3>
              </div>
              <p className="text-xs text-[#8E8E9E] mt-0.5">
                Progresión de 4 levantamientos fundamentales: <strong>Peso Muerto, Sentadilla, Press Plano y Dominadas</strong>.
              </p>
            </div>

            {/* Legend for the 4 exercises */}
            <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono">
              <span className="flex items-center gap-1.5 text-[#A78BFA]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#A78BFA]" />
                <span>Peso Muerto</span>
              </span>
              <span className="flex items-center gap-1.5 text-[#56A867]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#56A867]" />
                <span>Sentadilla</span>
              </span>
              <span className="flex items-center gap-1.5 text-[#38BDF8]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#38BDF8]" />
                <span>Press Plano</span>
              </span>
              <span className="flex items-center gap-1.5 text-[#FBBF24]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#FBBF24]" />
                <span>Dominadas</span>
              </span>
            </div>
          </div>

          {/* 4-Line SVG Plot */}
          {(() => {
            const svgWidth = 640;
            const svgHeight = 220;

            const deadlifts = oneRmData.map((d) => d.deadlift);
            const squats = oneRmData.map((d) => d.squat);
            const benches = oneRmData.map((d) => d.bench);
            const pullups = oneRmData.map((d) => d.pullup);

            const allVals = [...deadlifts, ...squats, ...benches, ...pullups];
            const minKg = 0;
            const maxKg = Math.ceil(Math.max(...allVals) * 1.15);

            const dlCoords = getLineCoordinates(deadlifts, svgWidth, svgHeight, minKg, maxKg, 36);
            const sqCoords = getLineCoordinates(squats, svgWidth, svgHeight, minKg, maxKg, 36);
            const bpCoords = getLineCoordinates(benches, svgWidth, svgHeight, minKg, maxKg, 36);
            const puCoords = getLineCoordinates(pullups, svgWidth, svgHeight, minKg, maxKg, 36);

            const lines = [
              { color: '#A78BFA', coords: dlCoords, name: 'Peso Muerto' },
              { color: '#56A867', coords: sqCoords, name: 'Sentadilla' },
              { color: '#38BDF8', coords: bpCoords, name: 'Press Plano' },
              { color: '#FBBF24', coords: puCoords, name: 'Dominadas' },
            ];

            return (
              <div className="w-full overflow-x-auto bg-[#0E0E14] rounded-xl border border-[#1E1E2A] p-2">
                <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full min-w-[500px] h-56">
                  {/* Grid Lines */}
                  {[0, 50, 100, 150].map((kg, i) => {
                    const y = svgHeight - 36 - ((kg - minKg) / (maxKg - minKg)) * (svgHeight - 72);
                    return (
                      <g key={i}>
                        <line x1="32" y1={y} x2={svgWidth - 20} y2={y} stroke="#1C1C28" strokeDasharray="3 3" />
                        <text x="6" y={y + 3} fill="#5A5A6E" fontSize="9" fontFamily="monospace">
                          {kg}kg
                        </text>
                      </g>
                    );
                  })}

                  {/* Render 4 curves */}
                  {lines.map((l, lIdx) => (
                    <g key={lIdx}>
                      <polyline
                        fill="none"
                        stroke={l.color}
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        points={l.coords.map((c) => `${c.x},${c.y}`).join(' ')}
                      />
                      {l.coords.map((c, pIdx) => (
                        <g key={pIdx}>
                          <circle cx={c.x} cy={c.y} r="4" fill={l.color} />
                          {/* Label on last point */}
                          {pIdx === l.coords.length - 1 && (
                            <text
                              x={c.x - 4}
                              y={c.y - 7}
                              textAnchor="end"
                              fill={l.color}
                              fontSize="10"
                              fontWeight="bold"
                              fontFamily="monospace"
                            >
                              {c.val}kg
                            </text>
                          )}
                        </g>
                      ))}
                    </g>
                  ))}

                  {/* Weeks labels */}
                  {oneRmData.map((d, i) => {
                    const x = 36 + (i / (oneRmData.length - 1)) * (svgWidth - 72);
                    return (
                      <text key={i} x={x} y={svgHeight - 12} textAnchor="middle" fill="#7E7E90" fontSize="9" fontFamily="monospace">
                        {d.week}
                      </text>
                    );
                  })}
                </svg>
              </div>
            );
          })()}
        </div>
      </ScrollReveal>

      {/* ============================================================== */}
      {/* 5. HORAS DE SUEÑO (GRÁFICA DE BARRAS) & 6. CALORÍAS INGERIDAS (LÍNEAS) */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 5. Horas de Sueño */}
        <ScrollReveal direction="up" delay={0.16} duration={0.4}>
          <div className="p-6 rounded-2xl bg-[#121218] border border-[#20202A] space-y-4 h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-[#1E1E28]">
                <div className="flex items-center gap-2">
                  <Moon className="w-5 h-5 text-indigo-400" />
                  <h3 className="text-base font-serif font-bold text-white">Horas de Sueño</h3>
                </div>
                <span className="text-[11px] font-mono text-[#56A867] bg-[#56A867]/10 px-2 py-0.5 rounded-lg border border-[#56A867]/25">
                  Meta: 8.0h / noche
                </span>
              </div>
              <p className="text-xs text-[#8E8E9E] mt-1">
                Monitoreo del descanso diario para la recuperación muscular y hormonal.
              </p>
            </div>

            {/* Bar chart for sleep */}
            <div className="h-44 flex items-end gap-2 pt-4 border-b border-[#20202A]">
              {sleepData.map((s, idx) => {
                const heightPct = Math.round((s.hours / 10) * 100);
                const isOptimal = s.hours >= 7.8;
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                    <span className="text-[10px] font-mono text-neutral-300 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                      {s.hours}h
                    </span>
                    <div
                      className={`w-full rounded-t-lg transition-all ${
                        isOptimal ? 'bg-indigo-500' : 'bg-indigo-900/60'
                      }`}
                      style={{ height: `${heightPct}%` }}
                    />
                    <span className="text-xs font-mono text-neutral-400">{s.day}</span>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between text-[11px] font-mono text-[#7E7E90]">
              <span className="flex items-center gap-1.5 text-indigo-400">
                <span className="w-2.5 h-2.5 rounded bg-indigo-500" />
                <span>Sueño reparador óptimo (&gt;7.8h)</span>
              </span>
              <span>Promedio: 7.6h</span>
            </div>
          </div>
        </ScrollReveal>

        {/* 6. Calorías Ingeridas Diariamente */}
        <ScrollReveal direction="up" delay={0.18} duration={0.4}>
          <div className="p-6 rounded-2xl bg-[#121218] border border-[#20202A] space-y-4 h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-[#1E1E28]">
                <div className="flex items-center gap-2">
                  <Utensils className="w-5 h-5 text-amber-400" />
                  <h3 className="text-base font-serif font-bold text-white">Calorías Ingeridas Diariamente</h3>
                </div>
                <span className="text-[11px] font-mono text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-lg border border-amber-400/25">
                  Target: {caloriesData[0].target} kcal
                </span>
              </div>
              <p className="text-xs text-[#8E8E9E] mt-1">
                Balance energético diario en base a tu somatotipo y meta física.
              </p>
            </div>

            {/* Line chart for calories */}
            {(() => {
              const cals = caloriesData.map((c) => c.calories);
              const minC = Math.min(...cals) - 200;
              const maxC = Math.max(...cals) + 200;
              const coords = getLineCoordinates(cals, 360, 160, minC, maxC, 24);
              const pointsStr = coords.map((c) => `${c.x},${c.y}`).join(' ');

              return (
                <div className="w-full bg-[#0E0E14] rounded-xl border border-[#1E1E2A] p-2">
                  <svg viewBox="0 0 360 160" className="w-full h-36">
                    <polyline fill="none" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" points={pointsStr} />
                    {coords.map((c, i) => (
                      <g key={i}>
                        <circle cx={c.x} cy={c.y} r="4" fill="#F59E0B" />
                        <text x={c.x} y={c.y - 7} textAnchor="middle" fill="#F59E0B" fontSize="9" fontWeight="bold" fontFamily="monospace">
                          {c.val}
                        </text>
                        <text x={c.x} y="152" textAnchor="middle" fill="#7E7E90" fontSize="9" fontFamily="monospace">
                          {caloriesData[i].day}
                        </text>
                      </g>
                    ))}
                  </svg>
                </div>
              );
            })()}

            <div className="flex items-center justify-between text-[11px] font-mono text-[#7E7E90]">
              <span className="flex items-center gap-1.5 text-amber-400">
                <span className="w-2.5 h-2.5 rounded bg-amber-500" />
                <span>Ingesta diaria registrada</span>
              </span>
              <span>Cumplimiento: 96%</span>
            </div>
          </div>
        </ScrollReveal>
      </div>

      {/* ============================================================== */}
      {/* 7. DOS GRÁFICAS DE CORRELACIÓN SEGÚN EL OBJETIVO DEL ATLETA */}
      {/* ============================================================== */}
      <ScrollReveal direction="up" delay={0.2} duration={0.4}>
        <div className="p-6 rounded-2xl bg-gradient-to-br from-[#121218] via-[#101018] to-[#141422] border border-[#56A867]/30 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#222232]">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-[#56A867]/15 text-[#56A867] text-[10px] font-mono font-bold uppercase tracking-wider mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Análisis de Correlación Personalizada</span>
              </div>
              <h3 className="text-base sm:text-lg font-serif font-bold text-white">
                Progreso del Atleta: Sueño y Alimentación según Objetivo
              </h3>
              <p className="text-xs text-[#8E8E9E] mt-0.5">
                Impacto directo de las variables fisiológicas en el logro de tu meta seleccionada.
              </p>
            </div>

            {/* Objective Selector Tabs */}
            <div className="flex items-center gap-1 bg-[#181824] p-1 rounded-xl border border-[#2A2A3E] text-xs font-mono">
              {[
                { id: 'bajar_peso' as const, label: 'Bajar Peso', icon: TrendingUp },
                { id: 'fuerza' as const, label: 'Tener Más Fuerza', icon: Dumbbell },
                { id: 'masa_muscular' as const, label: 'Masa Muscular', icon: Zap },
              ].map((g) => {
                const Icon = g.icon;
                const isSelected = selectedGoal === g.id;
                return (
                  <button
                    key={g.id}
                    onClick={() => setSelectedGoal(g.id)}
                    className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                      isSelected
                        ? 'bg-[#56A867] text-black font-bold shadow-md'
                        : 'text-[#A0A0B0] hover:text-white'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{g.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Correlación 1: Progreso vs. Sueño (Scatter Plot + Regresión r = 0.91) */}
            <ScatterCorrelationPlot
              title="Correlación: Progreso vs. Sueño"
              subtitle="Relación entre horas de descanso diario y progreso del objetivo"
              badgeLabel="Sueño & SNC"
              xLabel="Horas de Sueño Diario (h)"
              yLabel={
                selectedGoal === 'bajar_peso'
                  ? 'Progreso Pérdida de Grasa (%)'
                  : selectedGoal === 'masa_muscular'
                  ? 'Progreso Hipertrofia Miofibrilar (%)'
                  : 'Progreso de Fuerza y 1RM (%)'
              }
              xUnit="h"
              yUnit="%"
              points={scatterSleepPoints}
              fixedCorrelation={0.91}
              goalName={
                selectedGoal === 'bajar_peso'
                  ? 'Bajar Peso'
                  : selectedGoal === 'masa_muscular'
                  ? 'Masa Muscular'
                  : 'Tener Más Fuerza'
              }
            />

            {/* Correlación 2: Progreso vs. Alimentación (Scatter Plot + Regresión r = 0.91) */}
            <ScatterCorrelationPlot
              title="Correlación: Progreso vs. Alimentación"
              subtitle="Relación entre adherencia nutricional/calórica y progreso del objetivo"
              badgeLabel="Nutrición & Macros"
              xLabel="Adherencia Nutricional / Ingesta (%)"
              yLabel={
                selectedGoal === 'bajar_peso'
                  ? 'Progreso Déficit Calórico Efectivo (%)'
                  : selectedGoal === 'masa_muscular'
                  ? 'Progreso Síntesis Proteica (%)'
                  : 'Progreso de Fuerza y 1RM (%)'
              }
              xUnit="%"
              yUnit="%"
              points={scatterDietPoints}
              fixedCorrelation={0.91}
              goalName={
                selectedGoal === 'bajar_peso'
                  ? 'Bajar Peso'
                  : selectedGoal === 'masa_muscular'
                  ? 'Masa Muscular'
                  : 'Tener Más Fuerza'
              }
            />
          </div>
        </div>
      </ScrollReveal>

      {/* ============================================================== */}
      {/* MODAL: EDITAR COMENTARIO DE PESO AL APRETAR UN PUNTO */}
      {/* ============================================================== */}
      {selectedWeighIn && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#12121A] border border-[#38BDF8]/40 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-[#222230]">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-[#38BDF8]" />
                <h3 className="text-sm font-bold text-white font-serif uppercase tracking-wider">
                  Comentario de Pesaje • {selectedWeighIn.date}
                </h3>
              </div>
              <button
                onClick={() => setSelectedWeighIn(null)}
                className="p-1 rounded-md text-[#8E8E9E] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-[#171724] border border-[#252538] flex items-center justify-between text-xs font-mono">
              <span className="text-[#8E8E9E]">Peso registrado en este punto:</span>
              <strong className="text-base text-white">{selectedWeighIn.weightKg} kg</strong>
            </div>

            <div className="space-y-1.5 text-left">
              <label className="text-xs font-mono text-[#A0A0B0] block">
                Comentario técnico / Nota de la semana:
              </label>
              <textarea
                rows={3}
                value={editingComment}
                onChange={(e) => setEditingComment(e.target.value)}
                placeholder="Ejemplo: Semana de descarga, comiendo en superávit, o excelente recuperación sin retención de líquidos..."
                className="w-full bg-[#181824] text-xs sm:text-sm text-white p-3 rounded-xl border border-[#28283C] focus:border-[#38BDF8] focus:outline-none placeholder:text-[#606075]"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedWeighIn(null)}
                className="flex-1 py-2.5 rounded-xl border border-[#2A2A3C] text-xs font-mono text-[#A0A0B0] hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveComment}
                className="flex-1 py-2.5 rounded-xl bg-[#38BDF8] hover:bg-[#50C8FA] text-black font-bold text-xs font-mono uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Guardar Comentario</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: REGISTRAR NUEVO PESAJE SEMANAL CON COMENTARIO */}
      {/* ============================================================== */}
      {showWeighInModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#12121A] border border-[#38BDF8]/40 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-[#222230]">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-[#38BDF8]" />
                <h3 className="text-sm font-bold text-white font-serif uppercase tracking-wider">
                  Nuevo Pesaje Semanal
                </h3>
              </div>
              <button
                onClick={() => setShowWeighInModal(false)}
                className="p-1 rounded-md text-[#8E8E9E] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveNewWeighIn} className="space-y-3.5 text-left">
              <div className="space-y-1">
                <label className="text-xs font-mono text-[#A0A0B0] block">
                  Peso Actual (kg):
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="35"
                  max="250"
                  required
                  value={newWeightInput}
                  onChange={(e) => setNewWeightInput(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#181824] text-sm text-white px-3.5 py-2.5 rounded-xl border border-[#28283C] focus:border-[#38BDF8] focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono text-[#A0A0B0] block">
                  Comentario de esta semana (opcional):
                </label>
                <textarea
                  rows={3}
                  value={newCommentInput}
                  onChange={(e) => setNewCommentInput(e.target.value)}
                  placeholder="Ej: Semana de superávit calórico, sintiendo mayor fuerza en sentadilla..."
                  className="w-full bg-[#181824] text-xs sm:text-sm text-white p-3 rounded-xl border border-[#28283C] focus:border-[#38BDF8] focus:outline-none placeholder:text-[#606075]"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowWeighInModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-[#2A2A3C] text-xs font-mono text-[#A0A0B0] hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#38BDF8] hover:bg-[#50C8FA] text-black font-bold text-xs font-mono uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Guardar Pesaje</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
