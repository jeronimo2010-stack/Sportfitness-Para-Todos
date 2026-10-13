/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Configuration and detector for Vercel deployment & API Keys.
 *
 * When deploying Sportfitness on Vercel:
 * 1. Recommended (Secure Serverless): Set `GEMINI_API_KEY` in Vercel Project Settings > Environment Variables.
 *    Vercel Serverless Functions in `/api/ai/chat.ts` read `process.env.GEMINI_API_KEY`.
 * 2. Optional (Client-side Vite): Set `VITE_GEMINI_API_KEY` in Vercel Project Settings.
 *    Vite exposes this to the browser via `import.meta.env.VITE_GEMINI_API_KEY`.
 */

export interface VercelAiConfig {
  hasServerlessApiKey: boolean;
  hasClientVercelApiKey: boolean;
  isVercel: boolean;
  endpointUrl: string;
  source: 'vercel-serverless' | 'vercel-client' | 'local-server' | 'fallback';
}

/**
 * Detects whether the application is running on Vercel
 */
export function isVercelEnvironment(): boolean {
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    return host.includes('vercel.app') || host.includes('vercel-preview');
  }
  return false;
}

/**
 * Retrieves the client-side Vercel API key if injected via Vite
 */
export function getClientVercelApiKey(): string | null {
  try {
    // Check Vite environment variable
    const meta = import.meta as any;
    if (typeof meta !== 'undefined' && meta.env) {
      const viteKey = meta.env.VITE_GEMINI_API_KEY || meta.env.VITE_API_KEY;
      if (viteKey && typeof viteKey === 'string' && viteKey.trim().length > 0) {
        return viteKey.trim();
      }
    }
  } catch (err) {
    // Ignore in non-Vite environments
  }
  return null;
}

/**
 * Returns complete diagnostic status for Vercel and Gemini API keys
 */
export function getVercelConfig(): VercelAiConfig {
  const isVercel = isVercelEnvironment();
  const clientKey = getClientVercelApiKey();
  const hasClientVercelApiKey = !!clientKey;

  return {
    hasServerlessApiKey: true, // Will be verified dynamically by the /api/ai/chat serverless function
    hasClientVercelApiKey,
    isVercel,
    endpointUrl: '/api/ai/chat',
    source: hasClientVercelApiKey ? 'vercel-client' : isVercel ? 'vercel-serverless' : 'local-server',
  };
}
