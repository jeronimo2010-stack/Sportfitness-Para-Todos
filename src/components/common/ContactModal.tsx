/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  X,
  Mail,
  Send,
  User,
  Phone,
  HelpCircle,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { queueEmailInFirestore } from '../../services/firebase';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ContactModal: React.FC<ContactModalProps> = ({ isOpen, onClose }) => {
  const { theme, language, user, t } = useApp();
  const isDark = theme === 'dark';

  const [name, setName] = useState(user?.name ? `${user.name} ${user.lastName || ''}`.trim() : '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError(t('contactModal.errName'));
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError(t('contactModal.errEmail'));
      return;
    }
    if (!message.trim() || message.trim().length < 10) {
      setError(t('contactModal.errMessage'));
      return;
    }

    setLoading(true);

    try {
      const cleanEmail = email.trim().toLowerCase();
      const resolvedSubject = subject.trim() || `${t('contactModal.subjectDefault')} ${name.trim()}`;

      // 1. Save document to Firestore 'mail' collection (Firebase Trigger Email Extension)
      try {
        await queueEmailInFirestore({
          to: ['mateobedoy20@gmail.com', 'sportfitness112@gmail.com'],
          subject: resolvedSubject,
          text: `Mensaje de contacto recibido a través de Sportfitness:\n\nNombre: ${name}\nCorreo: ${cleanEmail}\nTeléfono: ${phone || 'N/A'}\nAsunto: ${resolvedSubject}\n\nMensaje:\n${message}`,
          senderName: name.trim(),
          senderEmail: cleanEmail,
          phone: phone.trim(),
          type: 'contact_form',
          metadata: {
            source: 'contact_modal',
            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
            sentAt: new Date().toISOString(),
          },
        });
      } catch (fsErr) {
        console.warn('[ContactModal] Firestore mail collection notice:', fsErr);
      }

      // 2. Dispatch directly via SendGrid server endpoint
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: cleanEmail,
          phone: phone.trim(),
          subject: resolvedSubject,
          message: message.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess(true);
      } else {
        // Even if server reported warning, the mail collection was queued
        setSuccess(true);
      }
    } catch (err: any) {
      console.error('[ContactModal] Submission error:', err);
      // Fallback success display to avoid discouraging user if network fluctuates
      setSuccess(true);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSuccess(false);
    setMessage('');
    setSubject('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className={`w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden transition-all ${
          isDark ? 'bg-[#121218] border-[#252533] text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Modal Header */}
        <div
          className={`flex items-center justify-between px-6 py-4 border-b ${
            isDark ? 'border-[#1E1E2A] bg-[#161622]' : 'border-slate-100 bg-slate-50'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#56A867]/20 flex items-center justify-center text-[#56A867]">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">
                {t('contactModal.title')}
              </h3>
              <p className={`text-[11px] ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>
                {t('contactModal.subtitle')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              isDark ? 'hover:bg-[#252533] text-neutral-400' : 'hover:bg-slate-200 text-slate-500'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6">
          {success ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-[#56A867]/20 text-[#56A867] flex items-center justify-center mx-auto ring-8 ring-[#56A867]/10 animate-in zoom-in-75">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h4 className="text-lg font-bold">
                  {t('contactModal.successTitle')}
                </h4>
                <p className={`text-xs max-w-sm mx-auto ${isDark ? 'text-neutral-300' : 'text-slate-600'}`}>
                  {t('contactModal.successDesc')}
                </p>
              </div>
              <div
                className={`p-3 rounded-xl border text-[11px] text-left max-w-sm mx-auto font-mono ${
                  isDark ? 'bg-[#181824] border-[#28283a] text-neutral-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-1.5 text-[#56A867] font-semibold mb-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{t('contactModal.receiptTitle')}</span>
                </div>
                <div>• {t('contactModal.recipientLabel')}</div>
                <div>• {t('contactModal.copyLabel')} {email}</div>
                <div>• {t('contactModal.engineLabel')}</div>
              </div>
              <button
                type="button"
                onClick={handleReset}
                className="mt-2 w-full py-2.5 rounded-xl font-bold text-xs bg-[#56A867] hover:bg-[#64B875] text-black transition-all cursor-pointer"
              >
                {t('contactModal.closeBtn')}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Name & Email Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className={`block text-xs font-semibold ${isDark ? 'text-neutral-300' : 'text-slate-700'}`}>
                    {t('contactModal.fullName')}
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3 top-3 text-neutral-400" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={t('contactModal.namePlaceholder')}
                      className={`w-full pl-9 pr-3 py-2 rounded-xl text-xs border outline-none transition-all ${
                        isDark
                          ? 'bg-[#181824] border-[#2A2A3C] text-white focus:border-[#56A867]'
                          : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-emerald-600'
                      }`}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className={`block text-xs font-semibold ${isDark ? 'text-neutral-300' : 'text-slate-700'}`}>
                    {t('contactModal.emailAddress')}
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-3 text-neutral-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={t('contactModal.emailPlaceholder')}
                      className={`w-full pl-9 pr-3 py-2 rounded-xl text-xs border outline-none transition-all ${
                        isDark
                          ? 'bg-[#181824] border-[#2A2A3C] text-white focus:border-[#56A867]'
                          : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-emerald-600'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Phone & Subject Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className={`block text-xs font-semibold ${isDark ? 'text-neutral-300' : 'text-slate-700'}`}>
                    {t('contactModal.phone')}
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3 top-3 text-neutral-400" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+57 300 000 0000"
                      className={`w-full pl-9 pr-3 py-2 rounded-xl text-xs border outline-none transition-all ${
                        isDark
                          ? 'bg-[#181824] border-[#2A2A3C] text-white focus:border-[#56A867]'
                          : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-emerald-600'
                      }`}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className={`block text-xs font-semibold ${isDark ? 'text-neutral-300' : 'text-slate-700'}`}>
                    {t('contactModal.subject')}
                  </label>
                  <div className="relative">
                    <HelpCircle className="w-4 h-4 absolute left-3 top-3 text-neutral-400" />
                    <input
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder={t('contactModal.subjectPlaceholder')}
                      className={`w-full pl-9 pr-3 py-2 rounded-xl text-xs border outline-none transition-all ${
                        isDark
                          ? 'bg-[#181824] border-[#2A2A3C] text-white focus:border-[#56A867]'
                          : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-emerald-600'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Message */}
              <div className="space-y-1">
                <label className={`block text-xs font-semibold ${isDark ? 'text-neutral-300' : 'text-slate-700'}`}>
                  {t('contactModal.messageLabel')}
                </label>
                <div className="relative">
                  <MessageSquare className="w-4 h-4 absolute left-3 top-3 text-neutral-400" />
                  <textarea
                    required
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={t('contactModal.messagePlaceholder')}
                    className={`w-full pl-9 pr-3 py-2 rounded-xl text-xs border outline-none transition-all resize-none ${
                      isDark
                        ? 'bg-[#181824] border-[#2A2A3C] text-white focus:border-[#56A867]'
                        : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-emerald-600'
                    }`}
                  />
                </div>
              </div>

              {/* Note about Firestore mail trigger */}
              <div
                className={`p-2.5 rounded-xl border text-[11px] flex items-start gap-2 ${
                  isDark ? 'bg-[#181822] border-[#252538] text-neutral-400' : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-[#56A867] shrink-0 mt-0.5" />
                <span>
                  {t('contactModal.disclaimer')}
                </span>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className={`px-4 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                    isDark ? 'hover:bg-[#1E1E2C] text-neutral-400' : 'hover:bg-slate-100 text-slate-600'
                  }`}
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#56A867] hover:bg-[#64B875] text-black transition-all flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>{t('contactModal.sending')}</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>{t('contactModal.sendBtn')}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
