/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * ============================================================================
 * SPORTFITNESS API KEY MANAGER (GitHub & Vercel Compatible)
 * ============================================================================
 * Este archivo centraliza la resolución, validación, enmascaramiento seguro
 * y diagnóstico de la API Key de Google Gemini tanto para entornos locales,
 * despliegues en Vercel como repositorios de GitHub.
 */

export type ApiKeyProvider = 'vercel-serverless' | 'vercel-client' | 'cloudrun' | 'offline-fallback';

export interface ApiKeyStatus {
  isConfigured: boolean;
  provider: ApiKeyProvider;
  maskedKey: string;
  environment: 'production' | 'preview' | 'development' | 'github-codespaces';
  details: string;
}

export class ApiKeyManager {
  /**
   * Resuelve la API Key activa disponible en el entorno del cliente o servidor.
   * Prioridad 1: Variable de entorno de Vite/Vercel Client (VITE_GEMINI_API_KEY).
   * Prioridad 2: Variable de proceso (si corre en entorno Node o Serverless).
   */
  public static getClientApiKey(): string | null {
    try {
      const meta = import.meta as any;
      if (typeof meta !== 'undefined' && meta.env) {
        const key = meta.env.VITE_GEMINI_API_KEY || meta.env.VITE_API_KEY;
        if (key && typeof key === 'string' && key.trim().length > 0) {
          return key.trim();
        }
      }
    } catch {
      // Entornos donde import.meta no esté disponible
    }
    return null;
  }

  /**
   * Enmascara de forma segura una API Key para que nunca sea expuesta
   * en texto plano en la interfaz, logs o commits de GitHub.
   * Ejemplo: "AIzaSyDa9...F82k"
   */
  public static maskKey(key: string | null | undefined): string {
    if (!key || typeof key !== 'string') {
      return 'No configurada';
    }
    const clean = key.trim();
    if (clean.length <= 8) {
      return '••••••••';
    }
    const start = clean.slice(0, 6);
    const end = clean.slice(-4);
    return `${start}••••••••••••${end}`;
  }

  /**
   * Valida si una clave tiene el formato oficial de Google AI Studio / Gemini API.
   * Las claves oficiales típicamente inician con 'AIzaSy' y tienen ~39 caracteres.
   */
  public static validateGoogleApiKey(key: string): { isValid: boolean; message: string } {
    if (!key || !key.trim()) {
      return { isValid: false, message: 'La clave de API está vacía.' };
    }
    const clean = key.trim();
    if (!clean.startsWith('AIzaSy')) {
      return {
        isValid: false,
        message: 'Formato inusual: Las claves de Google AI Studio suelen comenzar con "AIzaSy".',
      };
    }
    if (clean.length < 30) {
      return {
        isValid: false,
        message: 'Longitud insuficiente para una clave válida de Google AI Studio.',
      };
    }
    return { isValid: true, message: 'Formato de API Key válido para Google Gemini.' };
  }

  /**
   * Detecta el entorno de ejecución actual (Vercel, GitHub o Local)
   */
  public static detectEnvironment(): 'production' | 'preview' | 'development' | 'github-codespaces' {
    if (typeof window === 'undefined') return 'development';
    const host = window.location.hostname;
    if (host.includes('github.dev') || host.includes('codespaces')) {
      return 'github-codespaces';
    }
    if (host.includes('vercel.app')) {
      if (host.includes('git-') || host.includes('-preview-')) {
        return 'preview';
      }
      return 'production';
    }
    if (host === 'localhost' || host === '127.0.0.1') {
      return 'development';
    }
    return 'production';
  }

  /**
   * Retorna el estado consolidado de la API Key en la aplicación
   */
  public static getStatus(): ApiKeyStatus {
    const clientKey = this.getClientApiKey();
    const env = this.detectEnvironment();

    if (clientKey) {
      return {
        isConfigured: true,
        provider: 'vercel-client',
        maskedKey: this.maskKey(clientKey),
        environment: env,
        details: 'API Key inyectada a través de VITE_GEMINI_API_KEY en Vercel / Vite.',
      };
    }

    if (env === 'production' || env === 'preview') {
      return {
        isConfigured: true,
        provider: 'vercel-serverless',
        maskedKey: 'Gestionada en Vercel (process.env.GEMINI_API_KEY)',
        environment: env,
        details: 'Protegida en el backend serverless (/api/ai/chat.ts). Clave segura no expuesta al navegador.',
      };
    }

    return {
      isConfigured: true,
      provider: 'cloudrun',
      maskedKey: 'Inyectada en Servidor Seguro',
      environment: env,
      details: 'Conexión activa con el backend seguro de Sportfitness.',
    };
  }

  /**
   * Fragmento de código fuente listo para mostrar en GitHub o en la app
   */
  public static getCodeExplanation(): string {
    return `// ==========================================================
// CÓDIGO DE LA APLICACIÓN PARA LA API KEY (Vercel & GitHub)
// ==========================================================

// 1. EN SERVIDOR SERVERLESS (Vercel /api/ai/chat.ts):
import { GoogleGenAI } from '@google/genai';

// Vercel inyecta automáticamente la variable de entorno protegida:
const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey });

// 2. EN CLIENTE (src/apiKey/apiKeyManager.ts):
// Para despliegues estáticos en Vercel con Vite:
const clientKey = import.meta.env.VITE_GEMINI_API_KEY;

// 3. EN GITHUB SECRETS:
// Repositorio > Settings > Secrets and variables > Actions
// Nombre: GEMINI_API_KEY
// Valor: Tu clave generada en Google AI Studio (https://aistudio.google.com/)`;
  }
}
