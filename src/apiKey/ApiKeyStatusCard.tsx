/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Key,
  ShieldCheck,
  Code2,
  CheckCircle2,
  Copy,
  ExternalLink,
  Server,
  Globe,
  Check,
} from 'lucide-react';
import { ApiKeyManager } from './apiKeyManager';
import { SPORTFITNESS_API_KEY_SPECS } from './vercelGithubApiKey';

interface ApiKeyStatusCardProps {
  isDark?: boolean;
}

export const ApiKeyStatusCard: React.FC<ApiKeyStatusCardProps> = ({ isDark = true }) => {
  const [copied, setCopied] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const status = ApiKeyManager.getStatus();
  const codeSnippet = ApiKeyManager.getCodeExplanation();

  const handleCopyCode = () => {
    navigator.clipboard.writeText(codeSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={`p-6 rounded-2xl border transition-all ${
        isDark ? 'bg-[#121218] border-[#22222E]' : 'bg-white border-slate-200 shadow-sm'
      }`}
      id="api-key-status-card"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-inherit mb-4">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              isDark ? 'bg-[#56A867]/15 text-[#56A867]' : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
            }`}
          >
            <Key className="w-4 h-4" />
          </div>
          <div>
            <h2 className={`font-serif font-bold text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Código & Estado de la API Key (GitHub & Vercel)
            </h2>
            <p className={`text-xs ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>
              Configuración transparente de la clave de Google Gemini para producción y repositorio
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold ${
              status.isConfigured
                ? isDark
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{status.isConfigured ? 'Integración Activa' : 'Pendiente'}</span>
          </span>
        </div>
      </div>

      {/* Grid of status indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <div
          className={`p-3 rounded-xl border ${
            isDark ? 'bg-[#181822] border-[#22222E]' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className="flex items-center gap-1.5 text-xs text-neutral-400 mb-1">
            <Server className="w-3.5 h-3.5" />
            <span className="font-mono text-[10px] uppercase">Proveedor</span>
          </div>
          <p className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
            {status.provider === 'vercel-serverless'
              ? 'Vercel Serverless'
              : status.provider === 'vercel-client'
              ? 'Vercel Client (Vite)'
              : 'Google AI Studio'}
          </p>
        </div>

        <div
          className={`p-3 rounded-xl border ${
            isDark ? 'bg-[#181822] border-[#22222E]' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className="flex items-center gap-1.5 text-neutral-400 mb-1">
            <Globe className="w-3.5 h-3.5" />
            <span className="font-mono text-[10px] uppercase">Entorno</span>
          </div>
          <p className={`text-xs font-bold capitalize ${isDark ? 'text-white' : 'text-slate-800'}`}>
            {status.environment}
          </p>
        </div>

        <div
          className={`p-3 rounded-xl border ${
            isDark ? 'bg-[#181822] border-[#22222E]' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className="flex items-center gap-1.5 text-neutral-400 mb-1">
            <Key className="w-3.5 h-3.5" />
            <span className="font-mono text-[10px] uppercase">Clave Protegida</span>
          </div>
          <p className="text-xs font-mono text-emerald-400 truncate">{status.maskedKey}</p>
        </div>
      </div>

      {/* Variables required in Vercel & GitHub */}
      <div className="space-y-2 mb-4">
        <span className={`text-[11px] font-mono font-bold uppercase tracking-wider block ${isDark ? 'text-neutral-400' : 'text-slate-600'}`}>
          Variables de Entorno para GitHub / Vercel:
        </span>
        <div className="grid grid-cols-1 gap-2">
          {SPORTFITNESS_API_KEY_SPECS.map((spec) => (
            <div
              key={spec.name}
              className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs ${
                isDark ? 'bg-[#161620] border-[#262634]' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div>
                <div className="flex items-center gap-2">
                  <code className="font-mono font-bold text-[#56A867] bg-black/40 px-2 py-0.5 rounded text-[11px]">
                    {spec.name}
                  </code>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${isDark ? 'bg-zinc-800 text-zinc-300' : 'bg-slate-200 text-slate-700'}`}>
                    {spec.scope}
                  </span>
                </div>
                <p className={`mt-1 text-[11px] ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>
                  {spec.description}
                </p>
              </div>
              <span className="text-[10px] font-mono opacity-60 shrink-0">
                {spec.destination}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Code Toggle Button */}
      <div className="pt-2 border-t border-inherit flex items-center justify-between">
        <button
          type="button"
          onClick={() => setShowCode(!showCode)}
          className={`text-xs font-mono font-bold flex items-center gap-1.5 transition-colors ${
            isDark ? 'text-[#56A867] hover:underline' : 'text-emerald-600 hover:underline'
          }`}
        >
          <Code2 className="w-3.5 h-3.5" />
          <span>{showCode ? 'Ocultar Código de la API Key' : 'Ver Código de la Aplicación para la API Key'}</span>
        </button>

        <a
          href="https://aistudio.google.com/app/apikey"
          target="_blank"
          rel="noreferrer"
          className="text-xs text-neutral-400 hover:text-white flex items-center gap-1 transition-colors"
        >
          <span>Obtener Clave en Google AI Studio</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {/* Code Viewer Panel */}
      {showCode && (
        <div className="mt-3 relative rounded-xl overflow-hidden border border-zinc-700/60 bg-zinc-950 p-4">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-800 text-[11px] text-zinc-400 font-mono">
            <span>src/apiKey/apiKeyManager.ts & /api/ai/chat.ts</span>
            <button
              onClick={handleCopyCode}
              className="flex items-center gap-1 px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[10px] transition-colors"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? 'Copiado' : 'Copiar Código'}</span>
            </button>
          </div>
          <pre className="text-[11px] font-mono text-zinc-300 leading-relaxed overflow-x-auto whitespace-pre">
            {codeSnippet}
          </pre>
        </div>
      )}
    </div>
  );
};
