/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Language } from './translations';

/**
 * Returns the standardized BCP 47 language tag according to active app language.
 * Default is 'es-ES' for Spanish, 'en-US' for English.
 */
export function getLocale(language: Language | string): string {
  if (language === 'en') return 'en-US';
  if (language === 'pt') return 'pt-BR';
  if (language === 'fr') return 'fr-FR';
  if (language === 'de') return 'de-DE';
  if (language === 'it') return 'it-IT';
  return 'es-ES';
}

/**
 * Formats a Date/timestamp into a localized date string.
 */
export function formatDate(
  date: Date | string | number,
  language: Language | string,
  options?: Intl.DateTimeFormatOptions
): string {
  try {
    const d = typeof date === 'object' ? date : new Date(date);
    if (isNaN(d.getTime())) return '';
    const locale = getLocale(language);
    return new Intl.DateTimeFormat(locale, options || { dateStyle: 'medium' }).format(d);
  } catch {
    return String(date);
  }
}

/**
 * Formats a Date/timestamp into a localized time string (e.g., 14:30 or 2:30 PM).
 */
export function formatTime(
  date: Date | string | number,
  language: Language | string,
  options?: Intl.DateTimeFormatOptions
): string {
  try {
    const d = typeof date === 'object' ? date : new Date(date);
    if (isNaN(d.getTime())) return '';
    const locale = getLocale(language);
    return new Intl.DateTimeFormat(
      locale,
      options || { hour: '2-digit', minute: '2-digit' }
    ).format(d);
  } catch {
    return String(date);
  }
}

/**
 * Formats a Date/timestamp into a localized full date + time string.
 */
export function formatDateTime(
  date: Date | string | number,
  language: Language | string,
  options?: Intl.DateTimeFormatOptions
): string {
  try {
    const d = typeof date === 'object' ? date : new Date(date);
    if (isNaN(d.getTime())) return '';
    const locale = getLocale(language);
    return new Intl.DateTimeFormat(
      locale,
      options || { dateStyle: 'medium', timeStyle: 'short' }
    ).format(d);
  } catch {
    return String(date);
  }
}

/**
 * Formats a number with localized decimal and thousands separators.
 */
export function formatNumber(
  value: number,
  language: Language | string,
  options?: Intl.NumberFormatOptions
): string {
  try {
    if (typeof value !== 'number' || isNaN(value)) return '0';
    const locale = getLocale(language);
    return new Intl.NumberFormat(locale, options).format(value);
  } catch {
    return String(value);
  }
}
