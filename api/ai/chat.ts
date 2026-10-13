/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI } from '@google/genai';

/**
 * Vercel Serverless Function for Sportfitness AI Chat
 * Endpoint: /api/ai/chat
 * Reads the Vercel Environment Variable: GEMINI_API_KEY
 */
export default async function handler(req: any, res: any) {
  // Allow CORS for Vercel preview and production deployments
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { message, history, athleteContext, language = 'es' } = req.body || {};

    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

    if (!apiKey) {
      // Vercel deployment without API key configured yet - return structured fallback
      return res.status(200).json({
        reply:
          '## ⚠️ Clave de API de Vercel no configurada\n\n' +
          'Para activar la inteligencia artificial en tu despliegue de Vercel:\n' +
          '1. Ve al panel de tu proyecto en **Vercel Dashboard**.\n' +
          '2. Navega a **Settings** > **Environment Variables**.\n' +
          '3. Agrega la variable `GEMINI_API_KEY` con tu clave de Google AI Studio.\n' +
          '4. Haz un redeploy para aplicar los cambios.',
        source: 'vercel-setup-needed',
      });
    }

    const ai = new GoogleGenAI({
      apiKey,
    });

    const langNameMap: Record<string, string> = {
      es: 'Español',
      en: 'English',
      pt: 'Português',
      fr: 'Français',
      de: 'Deutsch',
      it: 'Italiano',
    };
    const targetLangName = langNameMap[language] || 'Español';

    const systemInstruction = `Eres Sportfitness AI, el Asistente Técnico, Fisiólogo Deportivo, Biomecánico y Coach de Rendimiento de élite de la plataforma "Sportfitness Para Todos".
Tu misión es resolver cualquier inquietud de atletas, entrenadores o usuarios sobre:
1. Ciencias del Ejercicio (fisiología neuromuscular, biomecánica de levantamientos, periodización de fuerza e hipertrofia, resistencia aeróbica, RPE, TSB y recuperación).
2. Nutrición Deportiva y Composición Corporal (macronutrientes, micronutrientes, hidratación, timing y suplementación basada en evidencia científica).
3. Cultura Deportiva General e Historia (reglamentos olímpicos, hitos del atletismo, récords mundiales, disciplinas de combate, calistenia, halterofilia y deportes de equipo).
4. Salud, Prevención de Lesiones y Ergonomía.

REGLAS DE ORO OBLIGATORIAS:
- NUNCA des respuestas superficiales, cortas o incompletas. Cada respuesta debe ser profunda, exhaustiva, científicamente fundamentada y con utilidad práctica inmediata.
- Estructura SIEMPRE tus respuestas con formato Markdown pulcro: Títulos principales (##), subtítulos (###), listas ordenadas/desglosadas con viñetas, tablas cuando sea pertinente y recomendaciones concretas paso a paso.
- Idioma de respuesta: Responde SIEMPRE en ${targetLangName} con terminología precisa y natural.
- Contexto del atleta activo: ${JSON.stringify(athleteContext || {})}.`;

    const modelName = 'gemini-3.8-flash';
    const prompt = `${message}\n\n[Idioma preferido del usuario: ${targetLangName}]\n[Datos del usuario: ${JSON.stringify(athleteContext || {})}]`;

    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.6,
      },
    });

    const reply = response.text || 'Respuesta procesada correctamente por Sportfitness AI en Vercel.';
    return res.status(200).json({ reply, source: 'gemini-3.8-flash (Vercel Serverless)' });
  } catch (error: any) {
    console.error('Vercel Gemini API Error:', error);
    return res.status(500).json({
      reply: 'Ocurrió un error al procesar la solicitud con Gemini en Vercel. Por favor verifica tu cuota o clave API.',
      error: error.message,
    });
  }
}
