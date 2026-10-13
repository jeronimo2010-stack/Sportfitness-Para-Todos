/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Database,
  Search,
  Download,
  Copy,
  Check,
  Trash2,
  Mail,
  Shield,
  FileSpreadsheet,
  FileJson,
  RefreshCw,
  X,
  AlertCircle,
  Clock,
  Sparkles,
  Award,
  Lock,
  User,
  Phone,
  FileText,
  Activity,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { DocumentType, UserRole } from '../../types';
import { db } from '../../services/firebase';
import { collection, onSnapshot, doc, deleteDoc, getDocs, setDoc } from 'firebase/firestore';
import { ScrollReveal } from '../common/ScrollReveal';

export interface FirestoreUserRecord {
  id: string;
  documentType: DocumentType;
  documentNumber: string;
  phone?: string;
  email: string;
  role: UserRole;
  name: string;
  trainerCode?: string;
  membershipPlan?: string;
  weight?: number;
  height?: number;
  clothingSize?: string;
  bodyType?: string;
  createdAt: string;
  updatedAt?: string;
  source?: string;
}

export const DatabaseManagerView: React.FC = () => {
  const { user, language, theme } = useApp();
  const isDark = theme === 'dark';

  const [usersList, setUsersList] = useState<FirestoreUserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'atleta' | 'entrenador'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [selectedUserDetail, setSelectedUserDetail] = useState<FirestoreUserRecord | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Subscribe in real-time to Firestore 'users' collection across all devices
  useEffect(() => {
    setLoading(true);
    setErrorMessage(null);

    const usersColRef = collection(db, 'users');
    const unsubscribe = onSnapshot(
      usersColRef,
      (snapshot) => {
        const records: FirestoreUserRecord[] = [];
        snapshot.forEach((docSnap) => {
          const d = docSnap.data();
          records.push({
            id: docSnap.id,
            documentType: d.documentType || 'Cédula de Ciudadanía (CC)',
            documentNumber: d.documentNumber || `G-${docSnap.id.slice(0, 8).toUpperCase()}`,
            phone: d.phone || '',
            email: d.email || 'Sin correo',
            role: d.role === 'entrenador' ? 'entrenador' : 'atleta',
            name: d.name || 'Usuario Sportfitness',
            trainerCode: d.trainerCode || undefined,
            membershipPlan: d.membershipPlan || 'Performance Pro',
            weight: d.weight,
            height: d.height,
            clothingSize: d.clothingSize,
            bodyType: d.bodyType,
            createdAt: d.createdAt || 'Pre-existente',
            updatedAt: d.updatedAt,
            source: d.source || 'Cloud Firestore',
          });
        });

        // Sort by registration date descending
        records.sort((a, b) => {
          const dateA = new Date(a.createdAt).getTime() || 0;
          const dateB = new Date(b.createdAt).getTime() || 0;
          return dateB - dateA;
        });

        setUsersList(records);
        setLoading(false);
      },
      (err: any) => {
        console.error('[DatabaseManager] Error reading Firestore users:', err);
        setErrorMessage(
          language === 'en'
            ? 'Error connecting to Firestore database. Please verify security rules.'
            : 'Error al conectar con la colección users en Cloud Firestore. Verifica la conexión o reglas.'
        );
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [language]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const copyToClipboard = (text: string, id: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showToast(`${label} copiado al portapapeles`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      const snap = await getDocs(collection(db, 'users'));
      const records: FirestoreUserRecord[] = [];
      snap.forEach((docSnap) => {
        const d = docSnap.data();
        records.push({
          id: docSnap.id,
          documentType: d.documentType || 'Cédula de Ciudadanía (CC)',
          documentNumber: d.documentNumber || `G-${docSnap.id.slice(0, 8).toUpperCase()}`,
          phone: d.phone || '',
          email: d.email || 'Sin correo',
          role: d.role === 'entrenador' ? 'entrenador' : 'atleta',
          name: d.name || 'Usuario Sportfitness',
          trainerCode: d.trainerCode || undefined,
          membershipPlan: d.membershipPlan || 'Performance Pro',
          weight: d.weight,
          height: d.height,
          clothingSize: d.clothingSize,
          bodyType: d.bodyType,
          createdAt: d.createdAt || 'Pre-existente',
          updatedAt: d.updatedAt,
          source: d.source || 'Cloud Firestore',
        });
      });
      records.sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime() || 0;
        const dateB = new Date(b.createdAt).getTime() || 0;
        return dateB - dateA;
      });
      setUsersList(records);
      showToast(language === 'en' ? 'Firestore database synchronized live' : 'Cloud Firestore sincronizado en vivo');
    } catch (err: any) {
      setErrorMessage(err?.message || 'Error al sincronizar con Firestore');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleDeleteUser = async (id: string, email: string) => {
    if (
      confirm(
        language === 'en'
          ? `Are you sure you want to delete account ${email} from Firestore? This action is permanent.`
          : `¿Estás seguro de eliminar la cuenta de ${email} de Firestore? Esta acción borrará el documento permanentemente.`
      )
    ) {
      try {
        await deleteDoc(doc(db, 'users', id));
        showToast(
          language === 'en'
            ? 'Account removed from Firestore'
            : 'Documento de usuario eliminado exitosamente de Firestore'
        );
      } catch (err: any) {
        showToast(`Error al eliminar: ${err?.message || err}`);
      }
    }
  };

  const handleExportJSON = () => {
    // SECURE EXPORT: Plaintext passwords are NEVER exported
    const safeData = usersList.map((u) => ({
      uid: u.id,
      documentType: u.documentType,
      documentNumber: u.documentNumber,
      email: u.email,
      fullName: u.name,
      role: u.role,
      trainerCode: u.trainerCode || null,
      phone: u.phone || null,
      membershipPlan: u.membershipPlan,
      weightKg: u.weight || null,
      heightCm: u.height || null,
      clothingSize: u.clothingSize || null,
      bodyType: u.bodyType || null,
      createdAt: u.createdAt,
      securityStatus: 'Protegido con Firebase Authentication (Cifrado scrypt/bcrypt en la nube)',
    }));

    const jsonStr = JSON.stringify(safeData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sportfitness_firestore_users_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Base de datos Firestore exportada en JSON (segura sin contraseñas)');
  };

  const handleExportCSV = () => {
    // SECURE EXPORT: Plaintext passwords are NEVER exported
    const headers = [
      'UID Firestore',
      'Tipo de Documento',
      'Numero de Documento',
      'Correo Electronico',
      'Nombre Completo',
      'Rol',
      'Codigo de Entrenador',
      'Telefono',
      'Plan',
      'Fecha de Registro',
      'Estado de Seguridad',
    ];

    const rows = usersList.map((u) => [
      `"${u.id}"`,
      `"${u.documentType}"`,
      `"${u.documentNumber}"`,
      `"${u.email}"`,
      `"${u.name}"`,
      `"${u.role}"`,
      `"${u.trainerCode || 'N/A'}"`,
      `"${u.phone || 'N/A'}"`,
      `"${u.membershipPlan || 'Performance Pro'}"`,
      `"${u.createdAt}"`,
      `"Protegido en Firebase Authentication (Cifrado Cloud)"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sportfitness_firestore_users_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Base de datos exportada en CSV (segura sin contraseñas)');
  };

  // Filtered records
  const filteredRecords = useMemo(() => {
    return usersList.filter((r) => {
      const matchesRole = roleFilter === 'all' || r.role === roleFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        r.documentNumber.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        r.name.toLowerCase().includes(q) ||
        r.documentType.toLowerCase().includes(q) ||
        (r.trainerCode && r.trainerCode.toLowerCase().includes(q));
      return matchesRole && matchesSearch;
    });
  }, [usersList, searchQuery, roleFilter]);

  // Statistics
  const totalRecords = usersList.length;
  const totalAthletes = usersList.filter((r) => r.role === 'atleta').length;
  const totalTrainers = usersList.filter((r) => r.role === 'entrenador').length;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 text-left">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 p-3 px-4 rounded-xl bg-emerald-600 text-white font-mono text-xs font-semibold shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <Check className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <ScrollReveal direction="down" duration={0.4}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-neutral-200 dark:border-neutral-800">
          <div>
            <div
              className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-mono font-bold uppercase tracking-wider mb-2 ${
                isDark
                  ? 'bg-[#56A867]/15 text-[#56A867] border border-[#56A867]/30'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-300'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>Cloud Firestore Database • Colección 'users'</span>
            </div>

            <h1 className={`text-2xl sm:text-3xl font-serif font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {language === 'en' ? 'Central User Cloud Directory' : 'Directorio Central de Usuarios en la Nube'}
            </h1>
            <p className={`text-xs mt-1 ${isDark ? 'text-neutral-400' : 'text-slate-600'}`}>
              {language === 'en'
                ? 'Direct live synchronization with Google Cloud Firestore. Accounts registered from any phone, laptop, or tablet appear here in real time.'
                : 'Sincronización en vivo con Google Cloud Firestore. Todas las cuentas creadas desde celulares, computadoras o tablets aparecen aquí en tiempo real.'}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className={`p-2 rounded-xl border text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer ${
                isDark
                  ? 'bg-[#161622] hover:bg-[#1E1E2C] border-[#2A2A3C] text-neutral-200'
                  : 'bg-white hover:bg-slate-50 border-slate-300 text-slate-700 shadow-sm'
              }`}
              title="Sincronizar ahora"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-500' : ''}`} />
              <span className="hidden sm:inline">Sincronizar</span>
            </button>

            <button
              onClick={handleExportCSV}
              className={`py-2 px-3 rounded-xl border text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer ${
                isDark
                  ? 'bg-[#161622] hover:bg-[#1E1E2C] border-[#2A2A3C] text-neutral-200'
                  : 'bg-white hover:bg-slate-50 border-slate-300 text-slate-700 shadow-sm'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
              <span>CSV</span>
            </button>

            <button
              onClick={handleExportJSON}
              className={`py-2 px-3 rounded-xl border text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer ${
                isDark
                  ? 'bg-[#161622] hover:bg-[#1E1E2C] border-[#2A2A3C] text-neutral-200'
                  : 'bg-white hover:bg-slate-50 border-slate-300 text-slate-700 shadow-sm'
              }`}
            >
              <FileJson className="w-3.5 h-3.5 text-blue-400" />
              <span>JSON</span>
            </button>
          </div>
        </div>
      </ScrollReveal>

      {/* Cloud Persistence Notice */}
      <div
        className={`p-3 rounded-xl border text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 ${
          isDark
            ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
            : 'bg-emerald-50 border-emerald-200 text-emerald-800'
        }`}
      >
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            <strong>Única Fuente de Verdad:</strong> Cloud Firestore (<code>sportfitness-fdf73 / users</code>). Las contraseñas están resguardadas exclusivamente en Firebase Authentication mediante hash criptográfico (scrypt/bcrypt) y nunca en texto plano.
          </span>
        </div>
        <div className="flex items-center gap-1.5 font-mono text-[11px] shrink-0 text-emerald-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Firestore Conectado</span>
        </div>
      </div>

      {errorMessage && (
        <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Metric Cards */}
      <ScrollReveal direction="up" delay={0.08} duration={0.4}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            className={`p-4 rounded-2xl border transition-all ${
              isDark ? 'bg-[#121218] border-[#22222E]' : 'bg-white border-slate-200 shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-neutral-500 mb-1">
              <span>{language === 'en' ? 'Total Cloud Accounts' : 'Total Cuentas en la Nube'}</span>
              <Database className="w-4 h-4 text-[#56A867]" />
            </div>
            <div className={`text-2xl font-bold font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {loading ? '...' : totalRecords}
            </div>
            <div className="text-[11px] text-neutral-400 font-mono mt-0.5">
              {language === 'en' ? 'Registered across all devices' : 'Registradas en todos los dispositivos'}
            </div>
          </div>

          <div
            className={`p-4 rounded-2xl border transition-all ${
              isDark ? 'bg-[#121218] border-[#22222E]' : 'bg-white border-slate-200 shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-neutral-500 mb-1">
              <span>{language === 'en' ? 'Athletes / Trainees' : 'Atletas Registrados'}</span>
              <User className="w-4 h-4 text-emerald-400" />
            </div>
            <div className={`text-2xl font-bold font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {loading ? '...' : totalAthletes}
            </div>
            <div className="text-[11px] text-neutral-400 font-mono mt-0.5">
              {language === 'en' ? 'Athletic profiles' : 'Perfiles atléticos activos'}
            </div>
          </div>

          <div
            className={`p-4 rounded-2xl border transition-all ${
              isDark ? 'bg-[#121218] border-[#22222E]' : 'bg-white border-slate-200 shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-neutral-500 mb-1">
              <span>{language === 'en' ? 'Coaches / Trainers' : 'Entrenadores / Coaches'}</span>
              <Award className="w-4 h-4 text-blue-400" />
            </div>
            <div className={`text-2xl font-bold font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {loading ? '...' : totalTrainers}
            </div>
            <div className="text-[11px] text-neutral-400 font-mono mt-0.5">
              {language === 'en' ? 'Acreditados con código oficial' : 'Acreditados con código oficial'}
            </div>
          </div>

          <div
            className={`p-4 rounded-2xl border transition-all ${
              isDark ? 'bg-[#121218] border-[#22222E]' : 'bg-white border-slate-200 shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-neutral-500 mb-1">
              <span>{language === 'en' ? 'Credential Security' : 'Seguridad de Acceso'}</span>
              <Lock className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-sm font-bold font-mono text-emerald-400 truncate mt-1">
              Firebase Auth Hasheadas
            </div>
            <div className="text-[11px] text-neutral-400 font-mono mt-0.5">
              Zero contraseñas en texto plano
            </div>
          </div>
        </div>
      </ScrollReveal>

      {/* Filter and Search Bar */}
      <ScrollReveal direction="up" delay={0.12} duration={0.4}>
        <div
          className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-3 ${
            isDark ? 'bg-[#121218] border-[#22222E]' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                language === 'en'
                  ? 'Search by ID, email, name, coach code...'
                  : 'Buscar por documento, correo, nombre o código de coach...'
              }
              className={`w-full pl-10 pr-4 py-2 rounded-xl text-xs focus:outline-none transition-all ${
                isDark
                  ? 'bg-[#181822] border border-[#2B2B3A] text-white focus:border-[#56A867]'
                  : 'bg-slate-50 border border-slate-200 text-slate-900 focus:border-emerald-600'
              }`}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end">
            <span
              className={`text-xs font-mono mr-1 hidden sm:inline ${
                isDark ? 'text-neutral-400' : 'text-slate-500'
              }`}
            >
              {language === 'en' ? 'Filter:' : 'Filtrar:'}
            </span>
            {(['all', 'atleta', 'entrenador'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRoleFilter(r)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer ${
                  roleFilter === r
                    ? isDark
                      ? 'bg-[#56A867]/20 text-[#56A867] border border-[#56A867]/40'
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : isDark
                    ? 'bg-[#181822] text-neutral-400 hover:text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {r === 'all'
                  ? language === 'en'
                    ? 'All'
                    : 'Todos'
                  : r === 'atleta'
                  ? language === 'en'
                    ? 'Athletes'
                    : 'Atletas'
                  : language === 'en'
                  ? 'Coaches'
                  : 'Entrenadores'}
              </button>
            ))}
          </div>
        </div>
      </ScrollReveal>

      {/* Main Records Table */}
      <ScrollReveal direction="up" delay={0.16} duration={0.4}>
        <div
          className={`rounded-2xl border overflow-hidden transition-all ${
            isDark ? 'bg-[#121218] border-[#22222E]' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead
                className={`border-b text-[11px] font-mono uppercase tracking-wider ${
                  isDark
                    ? 'bg-[#161622] border-[#262636] text-neutral-400'
                    : 'bg-slate-50 border-slate-200 text-slate-500'
                }`}
              >
                <tr>
                  <th className="py-3 px-4">#</th>
                  <th className="py-3 px-4">{language === 'en' ? 'Identity Document' : 'Documento de Identidad'}</th>
                  <th className="py-3 px-4">{language === 'en' ? 'Email Address' : 'Correo Electrónico'}</th>
                  <th className="py-3 px-4">{language === 'en' ? 'Security & Auth' : 'Seguridad & Acceso'}</th>
                  <th className="py-3 px-4">{language === 'en' ? 'Role' : 'Rol'}</th>
                  <th className="py-3 px-4">{language === 'en' ? 'Full Name' : 'Nombre Completo'}</th>
                  <th className="py-3 px-4">{language === 'en' ? 'Trainer Code' : 'Código de Coach'}</th>
                  <th className="py-3 px-4">{language === 'en' ? 'Registration Date' : 'Fecha de Registro'}</th>
                  <th className="py-3 px-4 text-right">{language === 'en' ? 'Actions' : 'Acciones'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-[#1E1E2A]">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-neutral-400 font-mono">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-500" />
                      Cargando cuentas en tiempo real desde Cloud Firestore...
                    </td>
                  </tr>
                ) : filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-neutral-400 font-mono">
                      <AlertCircle className="w-8 h-8 mx-auto mb-2 text-neutral-500 opacity-60" />
                      No se encontraron usuarios en Cloud Firestore que coincidan con la búsqueda.
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((record, index) => {
                    const isCopied = copiedId === record.id;

                    return (
                      <tr
                        key={record.id}
                        className={`group transition-colors ${
                          isDark ? 'hover:bg-[#181822]' : 'hover:bg-slate-50'
                        }`}
                      >
                        {/* Index */}
                        <td className="py-3.5 px-4 font-mono text-neutral-400 text-[11px]">{index + 1}</td>

                        {/* Document Number with Copy */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <div>
                              <div className="font-mono font-semibold text-xs">{record.documentNumber}</div>
                              <div
                                className={`text-[10px] font-mono ${
                                  isDark ? 'text-neutral-500' : 'text-slate-500'
                                }`}
                              >
                                {record.documentType}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                copyToClipboard(record.documentNumber, record.id + '-doc', 'Documento')
                              }
                              title="Copiar documento"
                              className="opacity-0 group-hover:opacity-100 p-1 rounded text-neutral-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>

                        {/* Email */}
                        <td className="py-3.5 px-4 font-mono">
                          <div className="flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                            <span className="truncate max-w-[200px]" title={record.email}>
                              {record.email}
                            </span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(record.email, record.id + '-email', 'Correo')}
                              title="Copiar correo"
                              className="opacity-0 group-hover:opacity-100 p-1 rounded text-neutral-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>

                        {/* Security Column: SECURE HASH BADGE (Zero plaintext passwords) */}
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-mono text-[10px] font-semibold ${
                              isDark
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            }`}
                          >
                            <Lock className="w-3 h-3 text-emerald-400" />
                            <span>Firebase Auth • Cifrado Cloud</span>
                          </span>
                        </td>

                        {/* Role Badge */}
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                              record.role === 'entrenador'
                                ? isDark
                                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                  : 'bg-blue-50 text-blue-700 border border-blue-200'
                                : isDark
                                ? 'bg-[#56A867]/15 text-[#56A867] border border-[#56A867]/30'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}
                          >
                            {record.role === 'entrenador' ? (
                              <Award className="w-3 h-3" />
                            ) : (
                              <User className="w-3 h-3" />
                            )}
                            <span>{record.role === 'entrenador' ? 'Entrenador' : 'Atleta'}</span>
                          </span>
                        </td>

                        {/* Full Name */}
                        <td className="py-3.5 px-4 font-semibold">{record.name}</td>

                        {/* Trainer Code */}
                        <td className="py-3.5 px-4 font-mono text-[11px]">
                          {record.trainerCode ? (
                            <span className="px-2 py-0.5 rounded bg-blue-500/15 border border-blue-500/30 text-blue-400 font-bold">
                              {record.trainerCode}
                            </span>
                          ) : (
                            <span className="text-neutral-500">—</span>
                          )}
                        </td>

                        {/* Registration Date */}
                        <td className="py-3.5 px-4 font-mono text-neutral-400 text-[11px]">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3 h-3 text-neutral-500" />
                            <span>{record.createdAt ? record.createdAt.replace('T', ' ').substring(0, 16) : '—'}</span>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setSelectedUserDetail(record)}
                              title="Ver ficha completa"
                              className="px-2 py-1 rounded-lg border text-[11px] font-mono font-semibold transition-all cursor-pointer bg-neutral-800/40 hover:bg-neutral-800 border-neutral-700 text-neutral-200 hover:text-white"
                            >
                              Detalles
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteUser(record.id, record.email)}
                              title="Eliminar de Firestore"
                              className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          <div
            className={`p-3.5 px-4 border-t flex flex-col sm:flex-row items-center justify-between gap-2 text-xs font-mono ${
              isDark
                ? 'bg-[#14141E] border-[#22222E] text-neutral-400'
                : 'bg-slate-50 border-slate-200 text-slate-600'
            }`}
          >
            <div>
              Mostrando <strong>{filteredRecords.length}</strong> de <strong>{totalRecords}</strong> usuarios sincronizados desde Cloud Firestore
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-emerald-400 text-[11px]">
                <Shield className="w-3.5 h-3.5" />
                Seguridad Zero-Knowledge: Contraseñas encriptadas en Google Identity
              </span>
            </div>
          </div>
        </div>
      </ScrollReveal>

      {/* User Details Modal */}
      {selectedUserDetail && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            className={`w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-left ${
              isDark ? 'bg-[#121218] border-[#2A2A38] text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="p-6 pb-4 border-b border-inherit flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold font-mono text-base ${
                    selectedUserDetail.role === 'entrenador'
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
                      : 'bg-[#56A867]/20 text-[#56A867] border border-[#56A867]/40'
                  }`}
                >
                  {selectedUserDetail.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-base font-bold">{selectedUserDetail.name}</h3>
                  <div className="flex items-center gap-2 text-xs text-neutral-400 font-mono mt-0.5">
                    <span>{selectedUserDetail.email}</span>
                    <span>•</span>
                    <span className="uppercase text-emerald-400 font-semibold">{selectedUserDetail.role}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedUserDetail(null)}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  isDark ? 'hover:bg-neutral-800 text-neutral-400' : 'hover:bg-slate-100 text-slate-500'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-white/5 border border-inherit space-y-1">
                  <span className="text-[10px] text-neutral-400 uppercase font-mono">Tipo de Documento</span>
                  <div className="font-semibold">{selectedUserDetail.documentType}</div>
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-inherit space-y-1">
                  <span className="text-[10px] text-neutral-400 uppercase font-mono">Número de Documento</span>
                  <div className="font-mono font-bold text-sm text-emerald-400">
                    {selectedUserDetail.documentNumber}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-white/5 border border-inherit space-y-1">
                  <span className="text-[10px] text-neutral-400 uppercase font-mono">Código de Entrenador</span>
                  <div className="font-mono font-bold text-blue-400">
                    {selectedUserDetail.trainerCode || 'No aplica (Atleta)'}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-inherit space-y-1">
                  <span className="text-[10px] text-neutral-400 uppercase font-mono">Teléfono de Contacto</span>
                  <div className="font-mono">{selectedUserDetail.phone || 'No registrado'}</div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-white/5 border border-inherit space-y-1 text-center">
                  <span className="text-[9px] text-neutral-400 uppercase font-mono">Estatura</span>
                  <div className="font-bold">{selectedUserDetail.height ? `${selectedUserDetail.height} cm` : '—'}</div>
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-inherit space-y-1 text-center">
                  <span className="text-[9px] text-neutral-400 uppercase font-mono">Peso</span>
                  <div className="font-bold">{selectedUserDetail.weight ? `${selectedUserDetail.weight} kg` : '—'}</div>
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-inherit space-y-1 text-center">
                  <span className="text-[9px] text-neutral-400 uppercase font-mono">Talla / Biotipo</span>
                  <div className="font-bold text-[#56A867]">
                    {selectedUserDetail.clothingSize || '—'} / {selectedUserDetail.bodyType || '—'}
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white/5 border border-inherit space-y-1 font-mono text-[11px]">
                <div className="flex items-center justify-between text-neutral-400">
                  <span>UID Cloud Firestore:</span>
                  <span className="text-white font-bold select-all">{selectedUserDetail.id}</span>
                </div>
                <div className="flex items-center justify-between text-neutral-400 pt-1">
                  <span>Membresía:</span>
                  <span className="text-[#56A867] font-bold">{selectedUserDetail.membershipPlan}</span>
                </div>
                <div className="flex items-center justify-between text-neutral-400 pt-1">
                  <span>Seguridad de Contraseña:</span>
                  <span className="text-emerald-400 font-semibold">Cifrada en Firebase Auth (No accesible)</span>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-inherit flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedUserDetail(null)}
                className="px-4 py-2 rounded-xl bg-[#56A867] hover:bg-[#64B875] text-black font-bold font-mono text-xs cursor-pointer"
              >
                Cerrar Detalle
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
