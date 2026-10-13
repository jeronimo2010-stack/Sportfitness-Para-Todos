/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Dumbbell, Award, ArrowRight, AlertCircle, ShieldCheck } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { authService } from '../../services/authService';
import { UserProfile } from '../../types';

interface GoogleRoleSelectModalProps {
  isOpen: boolean;
  authUser: any;
  onClose: () => void;
  onSuccess: (user: UserProfile) => void;
}

export const GoogleRoleSelectModal: React.FC<GoogleRoleSelectModalProps> = ({
  isOpen,
  authUser,
  onClose,
  onSuccess,
}) => {
  const { language, theme } = useApp();
  const isDark = theme === 'dark';
  const [selectedRole, setSelectedRole] = useState<'atleta' | 'entrenador'>('atleta');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen || !authUser) return null;

  const displayName = authUser.displayName || authUser.email?.split('@')[0] || 'Usuario';
  const userEmail = authUser.email || '';
  const photoUrl = authUser.photoURL;

  const handleConfirmRole = async () => {
    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await authService.completeGoogleRegistration(authUser, selectedRole);
      if (res.success && res.user) {
        onSuccess(res.user);
        onClose();
      } else {
        setErrorMessage(res.error || 'Error al completar el registro con Google.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Error de conexión al guardar tu perfil.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        className={`w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-left ${
          isDark ? 'bg-[#121218] border-[#2A2A38] text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Header */}
        <div className="p-6 pb-4 border-b border-inherit flex items-start justify-between">
          <div className="flex items-center gap-3">
            {photoUrl ? (
              <img
                src={photoUrl}
                alt={displayName}
                className="w-12 h-12 rounded-full border-2 border-[#56A867] object-cover shrink-0"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-[#56A867]/20 border border-[#56A867] flex items-center justify-center text-lg font-bold text-[#56A867] shrink-0">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <div className="flex items-center gap-1.5 text-xs text-[#56A867] font-mono font-semibold uppercase">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{language === 'en' ? 'Google Account Verified' : 'Cuenta de Google Verificada'}</span>
              </div>
              <h3 className="text-lg font-bold">
                {language === 'en' ? `Welcome, ${displayName}!` : `¡Bienvenido, ${displayName}!`}
              </h3>
              <p className={`text-xs ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>{userEmail}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors ${
              isDark ? 'hover:bg-neutral-800 text-neutral-400' : 'hover:bg-slate-100 text-slate-500'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          <div className="space-y-1">
            <h4 className="text-sm font-bold">
              {language === 'en'
                ? 'Select your role on the Sportfitness Platform:'
                : 'Selecciona cómo vas a utilizar la plataforma Sportfitness:'}
            </h4>
            <p className={`text-xs ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>
              {language === 'en'
                ? 'This customizes your profile, workout algorithm, and dashboard experience.'
                : 'Esto calibra tu panel, algoritmo de entrenamiento y permisos de la cuenta.'}
            </p>
          </div>

          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Role Cards */}
          <div className="space-y-3">
            {/* Athlete Option */}
            <div
              className={`p-4 rounded-xl border text-left flex items-start justify-between gap-3 ${
                isDark
                  ? 'bg-[#56A867]/15 border-[#56A867] ring-1 ring-[#56A867]'
                  : 'bg-emerald-50 border-emerald-600 ring-1 ring-emerald-600'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-[#56A867] text-black shrink-0 mt-0.5">
                  <Dumbbell className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-sm">
                    {language === 'en' ? 'Athlete / Trainee Profile' : 'Perfil de Deportista / Atleta'}
                  </div>
                  <div className={`text-xs mt-1 leading-relaxed ${isDark ? 'text-neutral-300' : 'text-slate-600'}`}>
                    {language === 'en'
                      ? 'Access workouts, 1RM calculator, personal progress tracking, and nutrition.'
                      : 'Acceso completo a entrenamientos, calculadora 1RM, bitácora de progreso y nutrición.'}
                  </div>
                </div>
              </div>
              <div className="w-4 h-4 rounded-full border-2 border-[#56A867] flex items-center justify-center shrink-0 mt-1">
                <div className="w-2 h-2 rounded-full bg-[#56A867]" />
              </div>
            </div>

            {/* Note about Coaches */}
            <div
              className={`p-3 rounded-xl border text-xs leading-relaxed ${
                isDark ? 'bg-[#181822] border-[#2A2A38] text-neutral-400' : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}
            >
              <span className="font-semibold text-amber-500">
                {language === 'en' ? 'Coach notice: ' : 'Aviso para Coaches: '}
              </span>
              {language === 'en'
                ? 'Coach accounts require institutional registration with a unique Trainer Identification Number and cannot use Google sign-in.'
                : 'Las cuentas de entrenador requieren registro institucional con Número de Identificación único y no utilizan inicio de sesión con Google.'}
            </div>
          </div>

          {/* Confirm Button */}
          <button
            type="button"
            disabled={loading}
            onClick={handleConfirmRole}
            className={`w-full py-3 px-6 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 uppercase tracking-wider cursor-pointer ${
              selectedRole === 'entrenador'
                ? 'bg-cyan-400 hover:bg-cyan-300 text-black shadow-lg shadow-cyan-400/20'
                : 'bg-[#56A867] hover:bg-[#64B875] text-black shadow-lg shadow-[#56A867]/20'
            }`}
          >
            {loading ? (
              <span>
                {language === 'en' ? 'Configuring Account in Firestore...' : 'Configurando Cuenta en Firestore...'}
              </span>
            ) : (
              <>
                <span>
                  {language === 'en'
                    ? `Continue as ${selectedRole === 'entrenador' ? 'Coach' : 'Athlete'}`
                    : `Continuar como ${selectedRole === 'entrenador' ? 'Entrenador' : 'Deportista'}`}
                </span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
