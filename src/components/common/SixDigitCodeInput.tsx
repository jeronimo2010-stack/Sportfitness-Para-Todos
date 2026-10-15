/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect } from 'react';

interface SixDigitCodeInputProps {
  value: string; // 6-digit string
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
  isDark?: boolean;
}

export const SixDigitCodeInput: React.FC<SixDigitCodeInputProps> = ({
  value,
  onChange,
  onComplete,
  disabled = false,
  autoFocus = true,
  isDark = true,
}) => {
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  // Split value into 6 characters
  const digits = Array.from({ length: 6 }, (_, i) => value[i] || '');

  useEffect(() => {
    if (autoFocus && inputRefs.current[0] && !value) {
      inputRefs.current[0].focus();
    }
  }, [autoFocus, value]);

  const handleChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/\D/g, '');
    if (!rawVal) {
      // Cleared current digit
      const nextDigits = [...digits];
      nextDigits[index] = '';
      const nextStr = nextDigits.join('').slice(0, 6);
      onChange(nextStr);
      return;
    }

    // If pasted or typed multiple digits
    if (rawVal.length > 1) {
      handlePastedString(rawVal, index);
      return;
    }

    // Single digit typed
    const single = rawVal.slice(-1);
    const nextDigits = [...digits];
    nextDigits[index] = single;
    const nextStr = nextDigits.join('').slice(0, 6);
    onChange(nextStr);

    if (index < 5 && single) {
      inputRefs.current[index + 1]?.focus();
    }

    if (nextStr.length === 6 && onComplete) {
      onComplete(nextStr);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      // Focus previous input on backspace if current is empty
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePastedString = (pasted: string, startIndex: number = 0) => {
    const cleaned = pasted.replace(/\D/g, '').slice(0, 6);
    if (!cleaned) return;

    let nextDigits = [...digits];
    for (let i = 0; i < cleaned.length; i++) {
      const targetIdx = startIndex + i;
      if (targetIdx < 6) {
        nextDigits[targetIdx] = cleaned[i];
      }
    }
    const nextStr = nextDigits.join('').slice(0, 6);
    onChange(nextStr);

    const focusIdx = Math.min(startIndex + cleaned.length, 5);
    inputRefs.current[focusIdx]?.focus();

    if (nextStr.length === 6 && onComplete) {
      onComplete(nextStr);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text');
    handlePastedString(pasted, 0);
  };

  return (
    <div className="flex items-center justify-center gap-2 sm:gap-3 py-2">
      {digits.map((digit, idx) => (
        <input
          key={idx}
          ref={(el) => {
            inputRefs.current[idx] = el;
          }}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          value={digit}
          disabled={disabled}
          onChange={(e) => handleChange(idx, e)}
          onKeyDown={(e) => handleKeyDown(idx, e)}
          onPaste={idx === 0 ? handlePaste : undefined}
          aria-label={`Dígito ${idx + 1} de verificación`}
          className={`w-11 h-13 text-center text-xl font-mono font-bold rounded-xl focus:outline-none transition-all shadow-sm ${
            isDark
              ? 'bg-[#181824] border border-[#2D2D3E] text-[#56A867] focus:border-[#56A867] focus:ring-2 focus:ring-[#56A867]/30'
              : 'bg-white border border-slate-300 text-emerald-700 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20'
          } ${digit ? (isDark ? 'border-[#56A867]/60' : 'border-emerald-500') : ''}`}
        />
      ))}
    </div>
  );
};
