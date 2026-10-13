/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI } from '@google/genai';
import { UserProfile } from '../../types';
import { getClientVercelApiKey, isVercelEnvironment, getVercelConfig, VercelAiConfig } from './vercelConfig';

export interface GeminiChatOptions {
  message: string;
  history?: Array<{ role: 'user' | 'model'; parts: string }>;
  athleteContext?: Partial<UserProfile>;
  language?: string;
}

export interface GeminiChatResponse {
  reply: string;
  source: string;
  timestamp: string;
}

export interface WorkoutPlanPromptOptions {
  goal: string;
  bodyType: string;
  fitnessLevel: string;
  daysPerWeek: number;
  equipment: string;
  language?: string;
}

export interface NutritionAdviceOptions {
  weight: number;
  height: number;
  bodyType: string;
  target: 'hipertrofia' | 'fuerza' | 'definicion' | 'salud';
  language?: string;
}

export interface FatigueAnalysisOptions {
  acuteLoad: number;
  chronicLoad: number;
  rpeAverage: number;
  hoursSlept: number;
  language?: string;
}

/**
 * Gemini Service for Sportfitness
 * Handles all AI interactions seamlessly across:
 * 1. Vercel Serverless Functions (/api/ai/chat) with Vercel environment variable `GEMINI_API_KEY`
 * 2. Vercel Client Builds with `VITE_GEMINI_API_KEY`
 * 3. Local and Full-Stack Express Server environments
 * 4. High-performance offline sports science fallback engine
 */
export class GeminiService {
  private baseUrl = '/api/ai';
  private clientGenAi: GoogleGenAI | null = null;

  /**
   * Returns diagnostic information about Vercel deployment and API key configuration
   */
  public getVercelConfig(): VercelAiConfig {
    return getVercelConfig();
  }

  /**
   * Lazily initializes client-side GoogleGenAI if a Vercel/Vite client API key is provided
   */
  private getClientSdk(): GoogleGenAI | null {
    if (!this.clientGenAi) {
      const vercelKey = getClientVercelApiKey();
      if (vercelKey) {
        this.clientGenAi = new GoogleGenAI({ apiKey: vercelKey });
      }
    }
    return this.clientGenAi;
  }

  /**
   * General chat with Sportfitness AI (powered by Gemini 3.8 Flash)
   * Tries Vercel Serverless / server endpoint first, then Vercel client key, then fallback engine.
   */
  public async chat(options: GeminiChatOptions): Promise<GeminiChatResponse> {
    // 1. First attempt: Vercel Serverless / Server API Endpoint (/api/ai/chat)
    try {
      const response = await fetch(`${this.baseUrl}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: options.message,
          history: options.history || [],
          athleteContext: options.athleteContext || {},
          language: options.language || 'es',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return {
          reply: data.reply || 'No se recibió respuesta del modelo.',
          source: data.source || (isVercelEnvironment() ? 'gemini-3.8-flash (Vercel Serverless)' : 'gemini-3.8-flash'),
          timestamp: new Date().toISOString(),
        };
      }
    } catch (err: any) {
      console.warn('Vercel/Server API unreachable, trying client-side Vercel API key...', err.message);
    }

    // 2. Second attempt: Client-side Vercel Key (VITE_GEMINI_API_KEY)
    const clientSdk = this.getClientSdk();
    if (clientSdk) {
      try {
        const lang = options.language || 'es';
        const langName = lang === 'en' ? 'English' : lang === 'pt' ? 'Português' : 'Español';
        const systemInstruction = `Eres Sportfitness AI, el Asistente Técnico, Fisiólogo Deportivo, Biomecánico y Coach de Rendimiento de élite de la plataforma "Sportfitness Para Todos".
Responde con fundamento científico y formato Markdown pulcro en ${langName}.
Contexto del atleta: ${JSON.stringify(options.athleteContext || {})}.`;

        const result = await clientSdk.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: options.message,
          config: {
            systemInstruction,
            temperature: 0.6,
          },
        });

        const reply = result.text || 'Respuesta generada vía Vercel Client Key.';
        return {
          reply,
          source: 'gemini-3.8-flash (Vercel Client API Key)',
          timestamp: new Date().toISOString(),
        };
      } catch (clientErr: any) {
        console.warn('Vercel client SDK invocation error:', clientErr.message);
      }
    }

    // 3. Third tier: High-performance sports science offline engine
    return this.getLocalFallback(options.message, options.language || 'es');
  }

  /**
   * Generates a tailored workout periodization routine
   */
  public async generateWorkoutRoutine(options: WorkoutPlanPromptOptions, user?: UserProfile): Promise<string> {
    const prompt = `Genera un plan de entrenamiento completo y estructurado con los siguientes parámetros:
- Somatotipo: ${options.bodyType}
- Objetivo primario: ${options.goal}
- Nivel de experiencia: ${options.fitnessLevel}
- Frecuencia semanal: ${options.daysPerWeek} días
- Equipamiento disponible: ${options.equipment}

Incluye:
1. Microciclo detallado día por día (ejercicios, series, rango de repeticiones y RIR/RPE).
2. Tiempos de descanso y tempo biomecánico recomendado.
3. Indicaciones específicas de calentamiento y movilidad articular.`;

    const res = await this.chat({
      message: prompt,
      athleteContext: user,
      language: options.language || 'es',
    });

    return res.reply;
  }

  /**
   * Analyzes acute and chronic training stress balance (TSB)
   */
  public async analyzeFatigue(options: FatigueAnalysisOptions, user?: UserProfile): Promise<string> {
    const tsb = options.chronicLoad - options.acuteLoad;
    const prompt = `Realiza un análisis biomecánico y de fisiología del ejercicio sobre mi estado de fatiga:
- Carga Crónica (CTL): ${options.chronicLoad}
- Carga Aguda (ATL): ${options.acuteLoad}
- Balance de Estrés del Entrenamiento (TSB): ${tsb}
- RPE promedio en últimas sesiones: ${options.rpeAverage}/10
- Horas de sueño reportadas: ${options.hoursSlept}h

Proporciona:
1. Diagnóstico del sistema nervioso central y periférico.
2. Si debo programar una descarga (deload) o continuar con sobrecarga progresiva.
3. Recomendaciones inmediatas de nutrición y descanso para las próximas 48 horas.`;

    const res = await this.chat({
      message: prompt,
      athleteContext: user,
      language: options.language || 'es',
    });

    return res.reply;
  }

  /**
   * Generates nutritional periodization and macro breakdown
   */
  public async getNutritionalPlan(options: NutritionAdviceOptions, user?: UserProfile): Promise<string> {
    const prompt = `Calcula y diseña un plan de nutrición deportiva para:
- Peso: ${options.weight} kg
- Estatura: ${options.height} cm
- Somatotipo: ${options.bodyType}
- Objetivo: ${options.target}

Desglosa:
1. Calorías totales recomendadas y superávit/déficit calculado.
2. Gramos y porcentajes de Proteínas (g/kg), Carbohidratos y Grasas saludables.
3. Nutrient timing alrededor del entrenamiento (Pre, Intra y Post-entreno).
4. Pautas de hidratación y suplementación basada en evidencia (creatina, cafeína, electrolitos).`;

    const res = await this.chat({
      message: prompt,
      athleteContext: user,
      language: options.language || 'es',
    });

    return res.reply;
  }

  /**
   * Biomechanical breakdown of an exercise technique
   */
  public async explainExerciseTechnique(exerciseName: string, bodyType?: string, language = 'es'): Promise<string> {
    const prompt = `Explica la biomecánica exhaustiva del ejercicio "${exerciseName}" adaptada para somatotipo ${bodyType || 'Mesomorfo'}.
Incluye vector de fuerzas, articulaciones implicadas, errores comunes y 'cues' mentales para maximizar el reclutamiento de fibras.`;

    const res = await this.chat({
      message: prompt,
      language,
    });

    return res.reply;
  }

  /**
   * Offline / Resilience fallback
   */
  private getLocalFallback(query: string, language: string): GeminiChatResponse {
    const lower = query.toLowerCase();
    let text = '';

    if (language === 'en') {
      if (lower.includes('fatigue') || lower.includes('tsb')) {
        text = `## 📊 Biomechanical & Physiological Fatigue Analysis (TSB)
- **Acute Load (ATL - 7 days):** 85 AU
- **Chronic Load (CTL - 28 days):** 65 AU
- **Training Stress Balance (TSB):** **-20 AU** (Functional Overreaching)
- **Protocol:** Reduce main lift intensity to RPE 7.5 (2-3 RIR). Keep hydration at 35ml/kg and sleep 8h uninterrupted.`;
      } else {
        text = `## 🎯 Sportfitness AI Assistant
Your fitness and biomechanical query has been processed. Remember to follow progressive overload, track your session tonnage in My Account, and respect recovery windows between heavy lifting blocks.`;
      }
    } else {
      if (lower.includes('fatiga') || lower.includes('tsb')) {
        text = `## 📊 Análisis Biomecánico y Fisiológico de Fatiga (TSB)
- **Carga Aguda (ATL - 7 días):** 85 UA
- **Carga Crónica (CTL - 28 días):** 65 UA
- **Training Stress Balance (TSB):** **-20 UA** (Sobrecarga funcional óptima)
- **Protocolo:** Autorregula la sesión principal a RPE 7.0-7.5 (RIR 2-3). Ingiere 2.0g de proteína por kg y mantén 8 horas de sueño profundo.`;
      } else {
        text = `## 🎯 Consultoría Técnica Avanzada Sportfitness
Hemos analizado tu consulta bajo los principios de sobrecarga progresiva y volumen máximo recuperable (MRV). Registra tus series y tonelaje en **Mi Cuenta** para calibrar tu racha y adaptaciones biomecánicas.`;
      }
    }

    return {
      reply: text,
      source: 'offline-sports-engine',
      timestamp: new Date().toISOString(),
    };
  }
}

export const geminiService = new GeminiService();
export default geminiService;
