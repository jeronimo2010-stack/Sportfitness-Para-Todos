/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { Globe, Check, ChevronDown } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Language } from '../../utils/translations';

interface LanguageSelectorProps {
  variant?: 'pills' | 'dropdown' | 'compact-pills';
  className?: string;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  variant = 'pills',
  className = '',
}) => {
  const { language, setLanguage, theme } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isDark = theme === 'dark';

  const languages: { id: Language; label: string; shortLabel: string; flag: string }[] = [
    { id: 'es', label: 'Español', shortLabel: 'ES', flag: '🇪🇸' },
    { id: 'en', label: 'English', shortLabel: 'EN', flag: '🇺🇸' },
  ];

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (variant === 'pills' || variant === 'compact-pills') {
    const isCompact = variant === 'compact-pills';
    return (
      <div
        className={`inline-flex items-center p-1 rounded-xl border transition-all ${
          isDark
            ? 'bg-[#121218] border-[#242432]'
            : 'bg-slate-100 border-slate-300'
        } ${className}`}
        role="group"
        aria-label="Selector de idioma / Language selector"
      >
        {languages.map((item) => {
          const isActive = language === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setLanguage(item.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer ${
                isActive
                  ? isDark
                    ? 'bg-[#56A867] text-black shadow-md shadow-[#56A867]/25 font-bold'
                    : 'bg-emerald-600 text-white shadow-sm font-bold'
                  : isDark
                  ? 'text-neutral-400 hover:text-white hover:bg-[#1E1E28]'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              <span className="text-sm leading-none">{item.flag}</span>
              <span className={isCompact ? 'hidden sm:inline font-mono' : 'font-mono'}>
                {isCompact ? item.shortLabel : item.label}
              </span>
            </button>
          );
        })}
      </div>
    );
  }

  // Dropdown variant
  const currentLang = languages.find((l) => l.id === language) || languages[0];

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-mono font-bold transition-all cursor-pointer ${
          isDark
            ? 'bg-[#14141C] border-[#282838] text-white hover:border-[#56A867]/60'
            : 'bg-white border-slate-300 text-slate-800 hover:border-emerald-500 shadow-sm'
        }`}
      >
        <span className="text-base leading-none">{currentLang.flag}</span>
        <span>{currentLang.label}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          } ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}
        />
      </button>

      {isOpen && (
        <div
          className={`absolute right-0 mt-2 w-44 rounded-xl border p-1 shadow-2xl z-50 animate-fadeIn ${
            isDark
              ? 'bg-[#14141C] border-[#2E2E3E] text-white'
              : 'bg-white border-slate-200 text-slate-900 shadow-slate-300'
          }`}
        >
          <div className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-neutral-400 border-b border-white/5 mb-1">
            {language === 'en' ? 'Select Language' : 'Seleccionar Idioma'}
          </div>
          {languages.map((item) => {
            const isSelected = language === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setLanguage(item.id);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  isSelected
                    ? isDark
                      ? 'bg-[#56A867]/20 text-[#56A867] font-bold'
                      : 'bg-emerald-50 text-emerald-800 font-bold'
                    : isDark
                    ? 'text-neutral-300 hover:bg-[#1E1E28]'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-base leading-none">{item.flag}</span>
                  <span>{item.label}</span>
                </div>
                {isSelected && <Check className="w-4 h-4 text-[#56A867]" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
