/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect } from 'react';

interface SixDigitCodeInputProps {
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  disabled?: boolean;
  isDark?: boolean;
  autoFocus?: boolean;
}

export const SixDigitCodeInput: React.FC<SixDigitCodeInputProps> = ({
  value,
  onChange,
  onComplete,
  disabled = false,
  isDark = true,
  autoFocus = true,
}) => {
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // Split value into array of 6 digits
  const digits = Array.from({ length: 6 }, (_, i) => value[i] || '');

  useEffect(() => {
    if (autoFocus && inputsRef.current[0] && !disabled) {
      inputsRef.current[0].focus();
    }
  }, [autoFocus, disabled]);

  const handleChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/\D/g, '');
    if (!rawVal) {
      // Emptying character
      const newDigits = [...digits];
      newDigits[index] = '';
      const combined = newDigits.join('');
      onChange(combined);
      return;
    }

    // If pasted or multi-char in one input
    if (rawVal.length > 1) {
      const pastedDigits = rawVal.slice(0, 6);
      onChange(pastedDigits);
      if (pastedDigits.length === 6 && onComplete) {
        onComplete(pastedDigits);
      }
      const nextIdx = Math.min(pastedDigits.length, 5);
      inputsRef.current[nextIdx]?.focus();
      return;
    }

    const char = rawVal[rawVal.length - 1];
    const newDigits = [...digits];
    newDigits[index] = char;
    const combined = newDigits.join('');
    onChange(combined);

    if (combined.length === 6 && onComplete) {
      onComplete(combined);
    }

    // Auto-advance
    if (index < 5 && char) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        inputsRef.current[index - 1]?.focus();
        const newDigits = [...digits];
        newDigits[index - 1] = '';
        onChange(newDigits.join(''));
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputsRef.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted) {
      onChange(pasted);
      if (pasted.length === 6 && onComplete) {
        onComplete(pasted);
      }
      const focusIndex = Math.min(pasted.length, 5);
      inputsRef.current[focusIndex]?.focus();
    }
  };

  return (
    <div className="flex items-center justify-center gap-2 sm:gap-3 py-2">
      {Array.from({ length: 6 }).map((_, idx) => (
        <input
          key={idx}
          ref={(el) => {
            inputsRef.current[idx] = el;
          }}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          disabled={disabled}
          value={digits[idx]}
          onChange={(e) => handleChange(idx, e)}
          onKeyDown={(e) => handleKeyDown(idx, e)}
          onPaste={handlePaste}
          className={`w-10 h-12 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-mono font-bold rounded-xl focus:outline-none transition-all ${
            isDark
              ? 'bg-[#181824] border border-[#2D2D3E] text-[#56A867] focus:border-[#56A867] focus:ring-1 focus:ring-[#56A867]/50'
              : 'bg-slate-50 border border-slate-300 text-emerald-700 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-text'}`}
        />
      ))}
    </div>
  );
};
