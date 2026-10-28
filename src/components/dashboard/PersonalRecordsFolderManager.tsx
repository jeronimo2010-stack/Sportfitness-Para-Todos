/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Award,
  Zap,
  Plus,
  FolderPlus,
  Folder,
  Trash2,
  Edit3,
  Dumbbell,
  Calculator,
  ChevronRight,
  TrendingUp,
  X,
  Check,
  Flame,
  Tag,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { UserProfile, PersonalRecordFolder, PersonalStrengthRecord } from '../../types';
import { localDatabase } from '../../db/localDatabase';

interface PersonalRecordsFolderManagerProps {
  user: UserProfile;
  language?: string;
  onNavigateToWorkout?: () => void;
  variant?: 'card' | 'section';
}

const COMMON_EXERCISES = [
  'Sentadilla Trasera con Barra',
  'Prensa de Piernas 45°',
  'Peso Muerto Rumano (RDL)',
  'Press de Banca Plano',
  'Press Militar Estricto',
  'Hip Thrust con Barra',
  'Remo con Barra Prono',
  'Dominadas con Lastre',
  'Fondos en Paralelas con Lastre',
  'Curl de Bíceps con Barra',
];

const FOLDER_COLORS = [
  { name: 'Esmeralda', value: '#56A867' },
  { name: 'Cielo', value: '#38BDF8' },
  { name: 'Ámbar', value: '#F59E0B' },
  { name: 'Rosa', value: '#EC4899' },
  { name: 'Púrpura', value: '#A855F7' },
  { name: 'Índigo', value: '#6366F1' },
];

export const PersonalRecordsFolderManager: React.FC<PersonalRecordsFolderManagerProps> = ({
  user,
  language = 'es',
  onNavigateToWorkout,
  variant = 'card',
}) => {
  const [folders, setFolders] = useState<PersonalRecordFolder[]>([]);
  const [records, setRecords] = useState<PersonalStrengthRecord[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string>('all');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [isCalcModalOpen, setIsCalcModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<PersonalStrengthRecord | null>(null);

  // Form state for record
  const [recordForm, setRecordForm] = useState({
    exercise: '',
    weightKg: 80,
    reps: '1RM',
    progress: '+2.5 kg',
    date: new Date().toISOString().split('T')[0],
    folderId: '',
    notes: '',
  });

  // Form state for folder
  const [folderForm, setFolderForm] = useState({
    name: '',
    color: '#56A867',
    icon: 'folder',
  });

  // Calculator state
  const [calcWeight, setCalcWeight] = useState(80);
  const [calcReps, setCalcReps] = useState(5);
  const [calcFormula, setCalcFormula] = useState<'brzycki' | 'epley'>('brzycki');

  // Load data from localDatabase
  const loadData = () => {
    if (!user?.id) return;
    const loadedFolders = localDatabase.getRecordFolders(user.id);
    const loadedRecords = localDatabase.getPersonalRecords(user.id);
    setFolders(loadedFolders);
    setRecords(loadedRecords);
  };

  useEffect(() => {
    loadData();
  }, [user?.id]);

  // Filtered records based on active folder
  const filteredRecords = useMemo(() => {
    if (selectedFolderId === 'all') return records;
    if (selectedFolderId === 'unassigned') {
      return records.filter((r) => !r.folderId);
    }
    return records.filter((r) => r.folderId === selectedFolderId);
  }, [records, selectedFolderId]);

  // Calculated 1RM
  const calculatedOneRm = useMemo(() => {
    const w = Number(calcWeight) || 0;
    const r = Math.min(15, Math.max(1, Number(calcReps) || 1));
    if (w <= 0) return 0;
    if (r === 1) return w;

    if (calcFormula === 'brzycki') {
      // Brzycki: weight / (1.0278 - (0.0278 * reps))
      return Math.round(w / (1.0278 - 0.0278 * r));
    } else {
      // Epley: weight * (1 + 0.0333 * reps)
      return Math.round(w * (1 + 0.0333 * r));
    }
  }, [calcWeight, calcReps, calcFormula]);

  // Open add record modal
  const handleOpenAddRecord = (prefilled?: Partial<typeof recordForm>) => {
    setEditingRecord(null);
    setRecordForm({
      exercise: prefilled?.exercise || '',
      weightKg: prefilled?.weightKg || 80,
      reps: prefilled?.reps || '1RM',
      progress: prefilled?.progress || '+2.5 kg',
      date: prefilled?.date || new Date().toISOString().split('T')[0],
      folderId: prefilled?.folderId || (selectedFolderId !== 'all' && selectedFolderId !== 'unassigned' ? selectedFolderId : (folders[0]?.id || '')),
      notes: prefilled?.notes || '',
    });
    setIsAddModalOpen(true);
  };

  // Open edit modal
  const handleOpenEditRecord = (record: PersonalStrengthRecord) => {
    setEditingRecord(record);
    setRecordForm({
      exercise: record.exercise,
      weightKg: record.weightKg,
      reps: record.reps,
      progress: record.progress || '',
      date: record.date,
      folderId: record.folderId || '',
      notes: record.notes || '',
    });
    setIsAddModalOpen(true);
  };

  // Save record
  const handleSaveRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recordForm.exercise.trim() || Number(recordForm.weightKg) <= 0) return;

    if (editingRecord) {
      localDatabase.updatePersonalRecord(user.id, editingRecord.id, {
        exercise: recordForm.exercise.trim(),
        weightKg: Number(recordForm.weightKg),
        reps: recordForm.reps,
        progress: recordForm.progress ? recordForm.progress.trim() : undefined,
        date: recordForm.date,
        folderId: recordForm.folderId || undefined,
        notes: recordForm.notes ? recordForm.notes.trim() : undefined,
      });
    } else {
      localDatabase.addPersonalRecord(user.id, {
        exercise: recordForm.exercise.trim(),
        weightKg: Number(recordForm.weightKg),
        reps: recordForm.reps,
        progress: recordForm.progress ? recordForm.progress.trim() : undefined,
        date: recordForm.date,
        folderId: recordForm.folderId || undefined,
        notes: recordForm.notes ? recordForm.notes.trim() : undefined,
      });
    }

    setIsAddModalOpen(false);
    setEditingRecord(null);
    loadData();
  };

  // Delete record
  const handleDeleteRecord = (id: string) => {
    localDatabase.deletePersonalRecord(user.id, id);
    loadData();
  };

  // Save new folder
  const handleCreateFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!folderForm.name.trim()) return;

    const newFld = localDatabase.addRecordFolder(user.id, {
      name: folderForm.name.trim(),
      color: folderForm.color,
      icon: folderForm.icon,
    });

    setIsFolderModalOpen(false);
    setFolderForm({ name: '', color: '#56A867', icon: 'folder' });
    loadData();
    setSelectedFolderId(newFld.id);
  };

  // Delete folder
  const handleDeleteFolder = (folderId: string) => {
    localDatabase.deleteRecordFolder(user.id, folderId);
    if (selectedFolderId === folderId) {
      setSelectedFolderId('all');
    }
    loadData();
  };

  // Save from 1RM calculator
  const handleSaveFromCalculator = () => {
    setIsCalcModalOpen(false);
    handleOpenAddRecord({
      exercise: 'Levantamiento Máximo Calibrado',
      weightKg: calculatedOneRm,
      reps: '1RM',
      progress: '+2.5 kg',
      notes: `Calculado con fórmula ${calcFormula === 'brzycki' ? 'Brzycki' : 'Epley'} a partir de ${calcWeight} kg × ${calcReps} reps.`,
    });
  };

  const getFolderById = (id?: string) => folders.find((f) => f.id === id);

  return (
    <div
      className={`rounded-2xl transition-all ${
        variant === 'card'
          ? 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 sm:p-6 shadow-sm space-y-5'
          : 'bg-[#121218] border border-[#20202A] p-5 sm:p-6 space-y-5'
      }`}
    >
      {/* 1. Header with Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-200 dark:border-zinc-800 pb-4">
        <div>
          <h3 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <Award className="w-5 h-5 text-[#56A867]" />
            <span>{language === 'en' ? 'Strength Milestones & Personal Records' : 'Marcas de Fuerza & Récords Personales'}</span>
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            {language === 'en'
              ? 'Organize your 1RMs and personal records into custom training folders'
              : 'Organiza tus logros, 1RM y marcas máximas en carpetas personalizadas sin registros automáticos'}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setIsCalcModalOpen(true)}
            className="px-2.5 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-zinc-300 dark:border-zinc-700"
            title="Calcular 1RM mediante fórmulas científicas"
          >
            <Zap className="w-3.5 h-3.5 text-[#56A867]" />
            <span>{language === 'en' ? 'Test 1RM' : 'Probar 1RM'}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsFolderModalOpen(true)}
            className="px-2.5 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-zinc-300 dark:border-zinc-700"
            title="Crear una nueva carpeta para clasificar ejercicios"
          >
            <FolderPlus className="w-3.5 h-3.5 text-sky-400" />
            <span>{language === 'en' ? '+ New Folder' : '+ Carpeta'}</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenAddRecord()}
            className="px-3 py-1.5 rounded-xl bg-[#56A867] hover:bg-[#489257] text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm shadow-[#56A867]/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{language === 'en' ? 'Add PR / 1RM' : 'Agregar Logro / 1RM'}</span>
          </button>
        </div>
      </div>

      {/* 2. Folder Navigation Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none text-xs">
        <button
          type="button"
          onClick={() => setSelectedFolderId('all')}
          className={`px-3 py-1.5 rounded-xl font-medium transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
            selectedFolderId === 'all'
              ? 'bg-[#56A867] text-white shadow-sm'
              : 'bg-zinc-100 dark:bg-zinc-800/80 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300'
          }`}
        >
          <Folder className="w-3.5 h-3.5" />
          <span>{language === 'en' ? 'All Records' : 'Todas las carpetas'}</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
              selectedFolderId === 'all'
                ? 'bg-white/25 text-white'
                : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300'
            }`}
          >
            {records.length}
          </span>
        </button>

        {folders.map((folder) => {
          const count = records.filter((r) => r.folderId === folder.id).length;
          const isSelected = selectedFolderId === folder.id;
          return (
            <div
              key={folder.id}
              className={`group flex items-center rounded-xl transition-all shrink-0 ${
                isSelected
                  ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-sm'
                  : 'bg-zinc-100 dark:bg-zinc-800/80 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300'
              }`}
            >
              <button
                type="button"
                onClick={() => setSelectedFolderId(folder.id)}
                className="px-3 py-1.5 flex items-center gap-1.5 cursor-pointer font-medium"
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: folder.color || '#56A867' }}
                />
                <span>{folder.name}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                    isSelected
                      ? 'bg-white/20 dark:bg-zinc-900/10'
                      : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300'
                  }`}
                >
                  {count}
                </span>
              </button>

              {/* Delete folder button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteFolder(folder.id);
                }}
                className={`p-1 pr-2 opacity-0 group-hover:opacity-100 hover:text-red-400 transition-opacity cursor-pointer ${
                  isSelected ? 'text-zinc-300 dark:text-zinc-600' : 'text-zinc-400'
                }`}
                title={`Eliminar carpeta "${folder.name}"`}
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          );
        })}

        {/* Unassigned pill if any */}
        {records.some((r) => !r.folderId) && (
          <button
            type="button"
            onClick={() => setSelectedFolderId('unassigned')}
            className={`px-3 py-1.5 rounded-xl font-medium transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
              selectedFolderId === 'unassigned'
                ? 'bg-[#56A867] text-white'
                : 'bg-zinc-100 dark:bg-zinc-800/80 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300'
            }`}
          >
            <span>{language === 'en' ? 'Uncategorized' : 'Sin Carpeta'}</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-zinc-200 dark:bg-zinc-700">
              {records.filter((r) => !r.folderId).length}
            </span>
          </button>
        )}
      </div>

      {/* 3. Records List / Grid */}
      <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
        {filteredRecords.length === 0 ? (
          <div className="py-10 px-4 text-center rounded-2xl bg-zinc-50 dark:bg-zinc-800/30 border border-dashed border-zinc-300 dark:border-zinc-800 space-y-3">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-[#56A867]/15 flex items-center justify-center text-[#56A867]">
              <Award className="w-6 h-6" />
            </div>
            <div className="max-w-md mx-auto space-y-1">
              <h4 className="text-sm font-bold text-zinc-900 dark:text-white">
                {selectedFolderId === 'all'
                  ? language === 'en'
                    ? 'No personal records logged yet'
                    : 'Sin registros automáticos cargados'
                  : language === 'en'
                  ? 'No records in this folder'
                  : 'Esta carpeta aún no tiene marcas'}
              </h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {language === 'en'
                  ? 'Add your actual 1RM, PRs or heavy lifts to track real progress across your folders.'
                  : 'Empieza a registrar tus marcas reales (1RM, series pesadas o récords) para organizarlas en tus carpetas.'}
              </p>
            </div>
            <div className="pt-2 flex justify-center gap-2">
              <button
                type="button"
                onClick={() => handleOpenAddRecord()}
                className="px-4 py-2 rounded-xl bg-[#56A867] hover:bg-[#489257] text-white text-xs font-bold flex items-center gap-2 transition-all shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{language === 'en' ? 'Log Your First Record' : 'Agregar tu Primer Logro / 1RM'}</span>
              </button>
            </div>
          </div>
        ) : (
          filteredRecords.map((record) => {
            const folder = getFolderById(record.folderId);
            return (
              <div
                key={record.id}
                className="group p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/60 dark:border-zinc-800 flex items-center justify-between hover:border-zinc-300 dark:hover:border-zinc-700 transition-all"
              >
                <div className="flex-1 min-w-0 pr-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-bold text-zinc-900 dark:text-white truncate">
                      {record.exercise}
                    </p>
                    {folder && (
                      <span
                        className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-md"
                        style={{
                          backgroundColor: `${folder.color || '#56A867'}20`,
                          color: folder.color || '#56A867',
                        }}
                      >
                        <Tag className="w-2.5 h-2.5" />
                        {folder.name}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 opacity-60" />
                      {record.date}
                    </span>
                    <span>•</span>
                    <span className="font-mono text-[#56A867] font-semibold">{record.reps}</span>
                    {record.notes && (
                      <>
                        <span>•</span>
                        <span className="truncate max-w-[200px] text-zinc-400 italic">
                          "{record.notes}"
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="text-base font-mono font-black text-zinc-900 dark:text-white block">
                      {record.weightKg} kg
                    </span>
                    {record.progress ? (
                      <span className="inline-block text-[11px] font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded mt-0.5">
                        {record.progress}
                      </span>
                    ) : (
                      <span className="text-[10px] text-zinc-400 font-mono">1RM</span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => handleOpenEditRecord(record)}
                      className="p-1.5 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
                      title="Editar marca"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteRecord(record.id)}
                      className="p-1.5 rounded-lg hover:bg-red-500/20 text-zinc-500 hover:text-red-400 transition-colors cursor-pointer"
                      title="Eliminar marca"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL 1: ADD / EDIT RECORD */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#181824] rounded-2xl border border-zinc-200 dark:border-[#2C2C3E] w-full max-w-lg shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-[#56A867]/20 text-[#56A867]">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                    {editingRecord ? 'Editar Marca / 1RM' : 'Agregar Logro / 1RM'}
                  </h3>
                  <p className="text-xs text-zinc-500">
                    Registra tu carga levantada y asígnala a una carpeta
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRecord} className="space-y-4">
              {/* Exercise Name */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Nombre del Ejercicio *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Sentadilla Trasera, Press Banca, Peso Muerto..."
                  value={recordForm.exercise}
                  onChange={(e) => setRecordForm({ ...recordForm, exercise: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white text-sm focus:outline-none focus:border-[#56A867]"
                />
                {/* Exercise suggestions */}
                <div className="flex items-center gap-1.5 flex-wrap mt-2">
                  <span className="text-[10px] text-zinc-400">Sugerencias:</span>
                  {COMMON_EXERCISES.slice(0, 4).map((ex) => (
                    <button
                      key={ex}
                      type="button"
                      onClick={() => setRecordForm({ ...recordForm, exercise: ex })}
                      className="px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 hover:bg-[#56A867]/20 text-[10px] text-zinc-600 dark:text-zinc-300 hover:text-[#56A867] cursor-pointer"
                    >
                      {ex}
                    </button>
                  ))}
                </div>
              </div>

              {/* Weight and Reps Row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Carga (kg) *
                  </label>
                  <div className="flex items-center">
                    <input
                      type="number"
                      step="0.5"
                      min="1"
                      max="600"
                      required
                      value={recordForm.weightKg}
                      onChange={(e) => setRecordForm({ ...recordForm, weightKg: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white text-sm font-mono font-bold focus:outline-none focus:border-[#56A867]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Repeticiones / Marca
                  </label>
                  <select
                    value={recordForm.reps}
                    onChange={(e) => setRecordForm({ ...recordForm, reps: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white text-sm focus:outline-none focus:border-[#56A867]"
                  >
                    <option value="1RM">1RM (Fuerza Máxima)</option>
                    <option value="2 reps">2 reps</option>
                    <option value="3 reps">3 reps (Triple)</option>
                    <option value="5 reps">5 reps (Fuerza)</option>
                    <option value="6 reps">6 reps</option>
                    <option value="8 reps">8 reps (Hipertrofia)</option>
                    <option value="10 reps">10 reps</option>
                    <option value="12 reps">12 reps</option>
                  </select>
                </div>
              </div>

              {/* Folder and Progress Row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Carpeta de Organización
                  </label>
                  <select
                    value={recordForm.folderId}
                    onChange={(e) => setRecordForm({ ...recordForm, folderId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white text-sm focus:outline-none focus:border-[#56A867]"
                  >
                    <option value="">Sin Carpeta (General)</option>
                    {folders.map((fld) => (
                      <option key={fld.id} value={fld.id}>
                        {fld.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Mejora / Progreso
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. +5 kg, +2.5 kg, PR!"
                    value={recordForm.progress}
                    onChange={(e) => setRecordForm({ ...recordForm, progress: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white text-sm focus:outline-none focus:border-[#56A867]"
                  />
                </div>
              </div>

              {/* Date and Notes */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Fecha del Récord
                  </label>
                  <input
                    type="date"
                    required
                    value={recordForm.date}
                    onChange={(e) => setRecordForm({ ...recordForm, date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white text-sm focus:outline-none focus:border-[#56A867]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Notas Técnicas / Sensaciones
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Buen tempo, sin molestias"
                    value={recordForm.notes}
                    onChange={(e) => setRecordForm({ ...recordForm, notes: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white text-sm focus:outline-none focus:border-[#56A867]"
                  />
                </div>
              </div>

              {/* Footer Buttons */}
              <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-xs font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#56A867] hover:bg-[#489257] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-[#56A867]/20 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingRecord ? 'Guardar Cambios' : 'Registrar Marca'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: CREATE FOLDER */}
      {isFolderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#181824] rounded-2xl border border-zinc-200 dark:border-[#2C2C3E] w-full max-w-md shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-sky-500/20 text-sky-400">
                  <FolderPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                    Nueva Carpeta de Ejercicios
                  </h3>
                  <p className="text-xs text-zinc-500">
                    Organiza tus marcas por grupo muscular o disciplina
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsFolderModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateFolder} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Nombre de la Carpeta *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Glúteos & Cadera, Halterofilia, Brazos..."
                  value={folderForm.name}
                  onChange={(e) => setFolderForm({ ...folderForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white text-sm focus:outline-none focus:border-[#56A867]"
                />
              </div>

              {/* Color Selection */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Color Identificador
                </label>
                <div className="flex items-center gap-2">
                  {FOLDER_COLORS.map((col) => (
                    <button
                      key={col.value}
                      type="button"
                      onClick={() => setFolderForm({ ...folderForm, color: col.value })}
                      className={`w-7 h-7 rounded-full transition-transform cursor-pointer flex items-center justify-center ${
                        folderForm.color === col.value ? 'ring-2 ring-white scale-110 shadow-sm' : 'opacity-80 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: col.value }}
                      title={col.name}
                    >
                      {folderForm.color === col.value && (
                        <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsFolderModalOpen(false)}
                  className="px-4 py-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-xs font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#56A867] hover:bg-[#489257] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Crear Carpeta</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: 1RM SCIENTIFIC CALCULATOR ("Probar 1RM") */}
      {isCalcModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#181824] rounded-2xl border border-zinc-200 dark:border-[#2C2C3E] w-full max-w-lg shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-[#56A867]/20 text-[#56A867]">
                  <Calculator className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                    Calculadora Científica 1RM
                  </h3>
                  <p className="text-xs text-zinc-500">
                    Estima tu repetición máxima a partir de una serie submáxima
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCalcModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Carga Levantada (kg)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="600"
                    value={calcWeight}
                    onChange={(e) => setCalcWeight(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white text-base font-mono font-bold focus:outline-none focus:border-[#56A867]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Repeticiones Completadas (1-15)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="15"
                    value={calcReps}
                    onChange={(e) => setCalcReps(parseInt(e.target.value, 10) || 1)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white text-base font-mono font-bold focus:outline-none focus:border-[#56A867]"
                  />
                </div>
              </div>

              {/* Formula Picker */}
              <div className="flex items-center gap-2 text-xs">
                <span className="text-zinc-500">Fórmula:</span>
                <button
                  type="button"
                  onClick={() => setCalcFormula('brzycki')}
                  className={`px-2.5 py-1 rounded-lg cursor-pointer ${
                    calcFormula === 'brzycki'
                      ? 'bg-[#56A867] text-white font-bold'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300'
                  }`}
                >
                  Brzycki (Recomendada)
                </button>
                <button
                  type="button"
                  onClick={() => setCalcFormula('epley')}
                  className={`px-2.5 py-1 rounded-lg cursor-pointer ${
                    calcFormula === 'epley'
                      ? 'bg-[#56A867] text-white font-bold'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300'
                  }`}
                >
                  Epley
                </button>
              </div>

              {/* Result Banner */}
              <div className="p-4 rounded-xl bg-[#56A867]/15 border border-[#56A867]/30 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-[#56A867] uppercase tracking-wider block">
                    1RM Estimado
                  </span>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Fuerza máxima calculada
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-3xl font-mono font-black text-zinc-900 dark:text-white">
                    {calculatedOneRm}
                  </span>
                  <span className="text-sm font-bold text-[#56A867] ml-1">kg</span>
                </div>
              </div>

              {/* Percentages Breakdown */}
              <div>
                <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-2">
                  Zonas de Carga (% de 1RM):
                </p>
                <div className="grid grid-cols-4 gap-1.5 text-center text-xs font-mono">
                  {[
                    { pct: 95, reps: '2 reps' },
                    { pct: 90, reps: '3-4 reps' },
                    { pct: 85, reps: '5-6 reps' },
                    { pct: 80, reps: '8 reps' },
                    { pct: 75, reps: '10 reps' },
                    { pct: 70, reps: '12 reps' },
                    { pct: 65, reps: '15 reps' },
                    { pct: 60, reps: 'Resistencia' },
                  ].map((zone) => (
                    <div
                      key={zone.pct}
                      className="p-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800"
                    >
                      <span className="text-zinc-400 text-[10px] block">{zone.pct}%</span>
                      <span className="font-bold text-zinc-900 dark:text-white">
                        {Math.round(calculatedOneRm * (zone.pct / 100))} kg
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCalcModalOpen(false)}
                  className="px-4 py-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-xs font-semibold cursor-pointer"
                >
                  Cerrar
                </button>
                <button
                  type="button"
                  onClick={handleSaveFromCalculator}
                  className="px-5 py-2 rounded-xl bg-[#56A867] hover:bg-[#489257] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Award className="w-4 h-4" />
                  <span>Guardar este 1RM en mis Marcas</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
