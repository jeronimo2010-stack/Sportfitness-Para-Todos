/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  X,
  Shield,
  LogOut,
  KeyRound,
  AlertCircle,
  ArrowRight,
  UserCheck,
} from 'lucide-react';
import { ScreenId } from '../../types';
import { useApp } from '../../context/AppContext';
import { authService } from '../../services/authService';
import { UserAvatar } from './UserAvatar';
import { GoogleSignInButton } from './GoogleSignInButton';

interface SwitchAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (screen: ScreenId) => void;
}

export const SwitchAccountModal: React.FC<SwitchAccountModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  const { user, setUser, logout, t } = useApp();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSecureSwitch = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const clean = identifier.trim();
    if (!clean || !password) {
      setErrorMsg(t('switchAccount.missingFields'));
      return;
    }

    setLoading(true);
    try {
      const res = await authService.login(clean, password);
      if (res.success && res.user) {
        setUser(res.user);
        onClose();
        const targetScreen = res.user.role === 'entrenador' ? 'trainer-overview' : 'athlete-dashboard';
        if (onNavigate) {
          onNavigate(targetScreen);
        } else {
          window.location.hash = `#/${targetScreen}`;
        }
      } else {
        setErrorMsg(res.error || res.message || t('switchAccount.invalidCredentials'));
      }
    } catch {
      setErrorMsg(t('switchAccount.dbError'));
    } finally {
      setLoading(false);
    }
  };

  const handlePurgeAndLogout = () => {
    onClose();
    logout();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn text-left">
      <div className="bg-[#12121A] border border-[#2A2A3C] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-4 sm:px-6 py-3.5 bg-[#161622] border-b border-[#222230] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#56A867]" />
            <div>
              <h3 className="text-sm font-bold text-white font-serif uppercase tracking-wider">
                {t('switchAccount.modalTitle')}
              </h3>
              <p className="text-[10px] font-mono text-[#8E8E9E]">
                {t('switchAccount.privacySubtitle')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-[#8E8E9E] hover:text-white hover:bg-[#20202E]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current Active Account Indicator */}
        <div className="p-4 border-b border-[#20202E] bg-[#14141E]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <UserAvatar user={user} size="sm" className="w-9 h-9 shrink-0" />
              <div className="min-w-0">
                <div className="text-[10px] font-mono text-[#56A867] uppercase font-bold">
                  {t('switchAccount.activeSessionTag')}
                </div>
                <div className="text-xs font-bold text-white truncate">{user.name}</div>
                <div className="text-[10px] text-[#8E8E9E] truncate">{user.email || t('switchAccount.noEmail')}</div>
              </div>
            </div>

            <button
              onClick={handlePurgeAndLogout}
              className="px-3 py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-xs font-mono font-bold flex items-center gap-1.5 transition-all"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{t('logout')}</span>
            </button>
          </div>
        </div>

        {/* Form to Authenticate as Another Account */}
        <div className="p-5 space-y-4">
          <div className="text-left space-y-1">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-[#56A867]" />
              <span>{t('switchAccount.authAnother')}</span>
            </h4>
            <p className="text-[11px] text-[#8E8E9E]">
              {t('switchAccount.authAnotherDesc')}
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSecureSwitch} autoComplete="off" className="space-y-3">
            <div className="space-y-1 text-left">
              <label className="text-[11px] font-mono text-[#A0A0B0]">
                {t('switchAccount.idLabel')}
              </label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                autoComplete="off"
                placeholder={t('switchAccount.idPlaceholder')}
                required
                className="w-full bg-[#181824] text-xs text-white px-3 py-2.5 rounded-xl border border-[#252538] focus:border-[#56A867] focus:outline-none placeholder-[#606070]"
              />
            </div>

            <div className="space-y-1 text-left">
              <label className="text-[11px] font-mono text-[#A0A0B0]">
                {t('switchAccount.passwordLabel')}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                placeholder="••••••••••••"
                required
                className="w-full bg-[#181824] text-xs text-white px-3 py-2.5 rounded-xl border border-[#252538] focus:border-[#56A867] focus:outline-none placeholder-[#606070]"
              />
            </div>

            <div className="pt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 px-4 rounded-xl border border-[#28283A] text-xs font-mono text-[#A0A0B0] hover:text-white hover:bg-[#1A1A26] transition-all"
              >
                {t('cancel')}
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2.5 px-4 rounded-xl bg-[#56A867] hover:bg-[#64B875] text-black font-bold text-xs font-mono uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-md"
              >
                <span>{loading ? t('switchAccount.verifying') : t('switchAccount.switchBtn')}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>

          {/* Google Quick Switch */}
          <div className="pt-3 border-t border-[#222230]">
            <GoogleSignInButton
              text={t('switchAccount.googleSwitch')}
              onSuccess={(switchedUser) => {
                setUser(switchedUser);
                onClose();
                if (switchedUser.role === 'entrenador') {
                  onNavigate('trainer-overview');
                } else {
                  onNavigate('athlete-dashboard');
                }
              }}
              onError={(err) => setErrorMsg(err)}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
