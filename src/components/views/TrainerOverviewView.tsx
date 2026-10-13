/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Users,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Search,
  Plus,
  Filter,
  MoreVertical,
  Activity,
  MessageSquare,
  FileText,
  Sparkles,
  ArrowUpRight,
  Shield,
  Dumbbell,
} from 'lucide-react';
import { AthleteRecord, ScreenId } from '../../types';
import { initialAthletes } from '../../data/initialData';
import { useApp } from '../../context/AppContext';
import { ScrollReveal } from '../common/ScrollReveal';

interface TrainerOverviewViewProps {
  onNavigate: (screen: ScreenId) => void;
}

export const TrainerOverviewView: React.FC<TrainerOverviewViewProps> = ({ onNavigate }) => {
  const { user, language, t } = useApp();
  const [athletes, setAthletes] = useState<AthleteRecord[]>(initialAthletes);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'warning' | 'active' | 'pr'>('all');
  const [showNewProgramModal, setShowNewProgramModal] = useState(false);
  const [newProgramName, setNewProgramName] = useState('');
  const [newProgramAthlete, setNewProgramAthlete] = useState(athletes[0]?.name || '');

  const filteredAthletes = athletes.filter((ath) => {
    const matchesSearch =
      ath.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ath.currentProgram.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || ath.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const handleCreateProgram = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProgramName) return;
    const msg = language === 'en'
      ? `Program "${newProgramName}" assigned successfully to ${newProgramAthlete}.`
      : `Programa "${newProgramName}" asignado con éxito a ${newProgramAthlete}.`;
    alert(msg);
    setShowNewProgramModal(false);
    setNewProgramName('');
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 text-left">
      {/* Top Header & Fast Action */}
      <ScrollReveal direction="down" duration={0.4}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-[#56A867]/15 text-[#56A867] text-[11px] font-mono font-bold uppercase tracking-wider mb-1">
              <Shield className="w-3.5 h-3.5" />
              <span>{language === 'en' ? 'High Performance Console' : 'Consola de Alto Rendimiento'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white">
              {language === 'en' ? 'Hello, ' : '¡Hola, '}<span className="text-[#56A867]">{user.name}</span>!
            </h1>
            <p className="text-xs sm:text-sm text-neutral-300">
              {language === 'en'
                ? 'Supervise athlete fatigue status (TSB), RPE logs, and training adherence across your roster.'
                : 'Supervisa el estado de fatiga (TSB), registros de RPE y adherencia de tu equipo de atletas.'}
            </p>
          </div>

          <button
            onClick={() => setShowNewProgramModal(true)}
            className="py-3 px-5 rounded-xl bg-[#56A867] hover:bg-[#64B875] text-black font-bold text-xs transition-all shadow-[0_0_20px_rgba(86,168,103,0.25)] hover:shadow-[0_0_25px_rgba(86,168,103,0.4)] flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{language === 'en' ? '+ New Program' : '+ Nuevo Programa'}</span>
          </button>
        </div>
      </ScrollReveal>

      {/* Roster Status KPI Cards */}
      <ScrollReveal direction="up" delay={0.08} duration={0.4}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Total Athletes */}
          <div className="p-5 rounded-2xl bg-[#121218] border border-[#20202A] flex items-center justify-between">
            <div>
              <span className="text-xs font-mono uppercase text-neutral-300 font-semibold">
                {language === 'en' ? 'Total Athletes' : 'Total Atletas'}
              </span>
              <div className="text-3xl font-bold font-mono text-white mt-1">48</div>
              <span className="text-[11px] text-[#56A867] font-mono">
                {language === 'en' ? '+4 added this month' : '+4 agregados este mes'}
              </span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-[#1A1A24] border border-[#2A2A38] flex items-center justify-center text-[#56A867]">
              <Users className="w-6 h-6" />
            </div>
          </div>

          {/* Alerts Requiring Attention */}
          <div className="p-5 rounded-2xl bg-[#181214] border border-[#3E1C22] flex items-center justify-between">
            <div>
              <span className="text-xs font-mono uppercase text-[#FF7070]">
                {language === 'en' ? 'Attention Alerts' : 'Alertas de Atención'}
              </span>
              <div className="text-3xl font-bold font-mono text-[#FF4D4D] mt-1">3</div>
              <span className="text-[11px] text-[#FF9E9E] font-mono">
                {language === 'en' ? '2 TSB overloads • 1 checkin' : '2 sobrecargas TSB • 1 checkin'}
              </span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-[#2A151A] border border-[#4E2228] flex items-center justify-center text-[#FF4D4D]">
              <AlertTriangle className="w-6 h-6" />
            </div>
          </div>

          {/* Compliance Rate */}
          <div className="p-5 rounded-2xl bg-[#121218] border border-[#20202A] flex items-center justify-between">
            <div>
              <span className="text-xs font-mono uppercase text-[#808090]">
                {language === 'en' ? 'Compliance Rate' : 'Tasa de Cumplimiento'}
              </span>
              <div className="text-3xl font-bold font-mono text-white mt-1">82%</div>
              <span className="text-[11px] text-[#56A867] font-mono">
                {language === 'en' ? '+3.5% vs previous week' : '+3.5% vs semana previa'}
              </span>
            </div>
            <div className="relative w-12 h-12 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-[#252532]"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-[#56A867]"
                  strokeDasharray="82, 100"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <span className="absolute text-[10px] font-mono font-bold text-white">82%</span>
            </div>
          </div>
        </div>
      </ScrollReveal>

      {/* 2-Column Grid: Live Updates Feed & Athlete Roster Table */}
      <ScrollReveal direction="up" delay={0.12} duration={0.4}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 1 Col: Live Feed "Recent Athlete Updates" */}
        <div className="p-5 rounded-2xl bg-[#121218] border border-[#20202A] space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#1E1E28]">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#56A867]" />
              <h2 className="text-sm font-bold text-white font-serif">
                {language === 'en' ? 'Live Athlete Feed' : 'Feed en Vivo de Atletas'}
              </h2>
            </div>
            <span className="w-2 h-2 rounded-full bg-[#56A867] animate-ping" />
          </div>

          <div className="space-y-3">
            {athletes.map((ath) => (
              <div
                key={ath.id}
                className={`p-3 rounded-xl border text-xs transition-colors ${
                  ath.status === 'warning'
                    ? 'bg-[#1C1418] border-[#3F1E24]'
                    : ath.status === 'pr'
                    ? 'bg-[#181B14] border-[#2A3F1E]'
                    : 'bg-[#16161F] border-[#22222E]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">{ath.name}</span>
                  <span className="text-[10px] text-[#707080] font-mono">{ath.lastActive}</span>
                </div>
                <p className="text-[#A0A0B0] mt-1 text-[11px] leading-relaxed">
                  {ath.statusMessage}
                </p>
                <div className="mt-2 flex items-center justify-between pt-1 border-t border-white/5">
                  <span className="text-[10px] font-mono text-[#56A867]">
                    TSB: {ath.fatigueIndexTsb}
                  </span>
                  <button
                    onClick={() => alert(language === 'en' ? `Opening feedback channel with ${ath.name}` : `Abriendo canal de feedback con ${ath.name}`)}
                    className="text-[10px] text-[#A0A0B0] hover:text-white flex items-center gap-1 font-mono"
                  >
                    <MessageSquare className="w-3 h-3" />
                    <span>{language === 'en' ? 'Contact' : 'Contactar'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right 2 Cols: Athlete Roster Management */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-[#121218] border border-[#20202A] space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <h2 className="text-base font-serif font-bold text-white">
              {language === 'en' ? `Active Athlete Roster (${filteredAthletes.length})` : `Roster de Atletas Activos (${filteredAthletes.length})`}
            </h2>

            {/* Search Bar */}
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#707080]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={language === 'en' ? 'Search by name or program...' : 'Buscar por nombre o programa...'}
                className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[#181822] border border-[#282834] text-xs text-white placeholder:text-[#606070] focus:outline-none focus:border-[#56A867]"
              />
            </div>
          </div>

          {/* Status filter tabs */}
          <div className="flex items-center gap-2 border-b border-[#1E1E28] pb-3 text-xs font-mono">
            <button
              onClick={() => setSelectedStatus('all')}
              className={`px-3 py-1 rounded-lg transition-colors ${
                selectedStatus === 'all'
                  ? 'bg-[#56A867]/15 text-[#56A867] font-bold border border-[#56A867]/30'
                  : 'text-[#808090] hover:text-white'
              }`}
            >
              {language === 'en' ? `All (${athletes.length})` : `Todos (${athletes.length})`}
            </button>
            <button
              onClick={() => setSelectedStatus('warning')}
              className={`px-3 py-1 rounded-lg transition-colors ${
                selectedStatus === 'warning'
                  ? 'bg-[#FF4D4D]/15 text-[#FF4D4D] font-bold border border-[#FF4D4D]/30'
                  : 'text-[#808090] hover:text-white'
              }`}
            >
              {language === 'en' ? 'On Alert (1)' : 'En Alerta (1)'}
            </button>
            <button
              onClick={() => setSelectedStatus('pr')}
              className={`px-3 py-1 rounded-lg transition-colors ${
                selectedStatus === 'pr'
                  ? 'bg-[#56A867]/15 text-[#56A867] font-bold border border-[#56A867]/30'
                  : 'text-[#808090] hover:text-white'
              }`}
            >
              {language === 'en' ? 'PR Records (1)' : 'Récords PR (1)'}
            </button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#20202A] text-[#707080] font-mono">
                  <th className="pb-3 font-medium">{language === 'en' ? 'Athlete' : 'Atleta'}</th>
                  <th className="pb-3 font-medium">{language === 'en' ? 'Current Program' : 'Programa Actual'}</th>
                  <th className="pb-3 font-medium">{language === 'en' ? 'Adherence' : 'Cumplimiento'}</th>
                  <th className="pb-3 font-medium">{language === 'en' ? 'TSB Index' : 'Índice TSB'}</th>
                  <th className="pb-3 font-medium text-right">{language === 'en' ? 'Action' : 'Acción'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1B1B24]">
                {filteredAthletes.map((ath) => (
                  <tr key={ath.id} className="hover:bg-[#161620] transition-colors group">
                    <td className="py-3.5 pr-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-[#20202C] border border-[#303040] flex items-center justify-center text-white font-bold font-mono text-[10px]">
                          {ath.initials}
                        </div>
                        <div>
                          <div className="font-bold text-white group-hover:text-[#56A867] transition-colors">
                            {ath.name}
                          </div>
                          <div className="text-[10px] text-[#707080] font-mono">{ath.email}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-2 text-[#C0C0D0]">
                      <span>{ath.currentProgram}</span>
                    </td>

                    <td className="py-3.5 px-2">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 rounded-full bg-[#20202A] overflow-hidden">
                          <div
                            style={{ width: `${ath.complianceRate}%` }}
                            className={`h-full rounded-full ${
                              ath.complianceRate > 80 ? 'bg-[#56A867]' : 'bg-[#FFB800]'
                            }`}
                          />
                        </div>
                        <span className="font-mono text-[11px] text-white">
                          {ath.complianceRate}%
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-2">
                      <span
                        className={`inline-block px-2 py-0.5 rounded font-mono text-[10px] font-bold ${
                          ath.fatigueIndexTsb < -25
                            ? 'bg-[#FF4D4D]/15 text-[#FF4D4D]'
                            : 'bg-[#56A867]/15 text-[#56A867]'
                        }`}
                      >
                        {ath.fatigueIndexTsb} TSB
                      </span>
                    </td>

                    <td className="py-3.5 pl-2 text-right">
                      <button
                        onClick={() => {
                          const info = language === 'en'
                            ? `Athlete: ${ath.name}\nEmail: ${ath.email}\nProgram: ${ath.currentProgram}\nCompliance: ${ath.complianceRate}%\nFatigue (TSB): ${ath.fatigueIndexTsb}`
                            : `Atleta: ${ath.name}\nCorreo: ${ath.email}\nPrograma: ${ath.currentProgram}\nCumplimiento: ${ath.complianceRate}%\nÍndice Fatiga (TSB): ${ath.fatigueIndexTsb}`;
                          alert(info);
                        }}
                        className="p-1.5 rounded-lg bg-[#1D1D27] hover:bg-[#56A867] hover:text-black text-white transition-all inline-flex items-center gap-1 font-mono text-[10px] cursor-pointer"
                        title={language === 'en' ? 'View athlete profile' : 'Ver ficha de atleta'}
                      >
                        <span>{language === 'en' ? 'Profile' : 'Ficha'}</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </ScrollReveal>

      {/* Modal: Create Program */}
      {showNewProgramModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#13131A] border border-[#2B2B38] rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#22222E]">
              <h3 className="text-lg font-serif font-bold text-white">
                {language === 'en' ? 'Assign New Microcycle' : 'Asignar Nuevo Microciclo'}
              </h3>
              <button
                onClick={() => setShowNewProgramModal(false)}
                className="text-[#707080] hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateProgram} className="space-y-3 text-left">
              <div>
                <label className="text-xs font-mono text-[#A0A0B0] block mb-1">
                  {language === 'en' ? 'Assigned Athlete' : 'Atleta Asignado'}
                </label>
                <select
                  value={newProgramAthlete}
                  onChange={(e) => setNewProgramAthlete(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#1A1A24] border border-[#2B2B38] text-white text-xs focus:outline-none focus:border-[#56A867]"
                >
                  {athletes.map((a) => (
                    <option key={a.id} value={a.name}>
                      {a.name} ({a.currentProgram})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-mono text-[#A0A0B0] block mb-1">
                  {language === 'en' ? 'Program Name' : 'Nombre del Programa'}
                </label>
                <input
                  type="text"
                  value={newProgramName}
                  onChange={(e) => setNewProgramName(e.target.value)}
                  required
                  placeholder={language === 'en' ? 'e.g. Lower Body Hypertrophy Phase 3' : 'Ej. Hipertrofia Tren Inferior Fase 3'}
                  className="w-full p-2.5 rounded-xl bg-[#1A1A24] border border-[#2B2B38] text-white text-xs focus:outline-none focus:border-[#56A867]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-mono text-[#A0A0B0] block mb-1">
                    {language === 'en' ? 'Duration (Weeks)' : 'Duración (Semanas)'}
                  </label>
                  <input
                    type="number"
                    defaultValue={4}
                    min={1}
                    max={16}
                    className="w-full p-2.5 rounded-xl bg-[#1A1A24] border border-[#2B2B38] text-white text-xs focus:outline-none focus:border-[#56A867]"
                  />
                </div>
                <div>
                  <label className="text-xs font-mono text-[#A0A0B0] block mb-1">
                    {language === 'en' ? 'Target RPE' : 'RPE Objetivo'}
                  </label>
                  <input
                    type="text"
                    defaultValue="RPE 8 - 9.5"
                    className="w-full p-2.5 rounded-xl bg-[#1A1A24] border border-[#2B2B38] text-white text-xs focus:outline-none focus:border-[#56A867]"
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowNewProgramModal(false)}
                  className="py-2 px-4 rounded-xl bg-[#1A1A24] text-[#A0A0B0] hover:text-white text-xs"
                >
                  {language === 'en' ? 'Cancel' : 'Cancelar'}
                </button>
                <button
                  type="submit"
                  className="py-2 px-5 rounded-xl bg-[#56A867] hover:bg-[#64B875] text-black font-bold text-xs shadow-md"
                >
                  {language === 'en' ? 'Confirm Assignment' : 'Confirmar Asignación'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
