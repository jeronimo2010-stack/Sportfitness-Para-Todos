/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * ============================================================================
 * GUÍA DE CÓDIGO Y SINCRONIZACIÓN: GITHUB SECRETS -> VERCEL API KEY
 * ============================================================================
 * Esta utilidad modela y describe la integración entre el repositorio de GitHub
 * y el entorno de ejecución en Vercel para la API KEY de Gemini.
 */

export interface GitHubSecretSpec {
  name: string;
  destination: 'Vercel Environment Variables' | 'GitHub Actions Secrets';
  scope: 'Serverless (Backend)' | 'Browser Client (Frontend)';
  description: string;
  exampleValue: string;
}

export const SPORTFITNESS_API_KEY_SPECS: GitHubSecretSpec[] = [
  {
    name: 'GEMINI_API_KEY',
    destination: 'Vercel Environment Variables',
    scope: 'Serverless (Backend)',
    description:
      'Clave secreta principal de Google AI Studio. Vercel la inyecta de forma segura a la función serverless /api/ai/chat.ts sin que sea visible en el código del navegador.',
    exampleValue: 'AIzaSyD-abc123xyz456...',
  },
  {
    name: 'VITE_GEMINI_API_KEY',
    destination: 'Vercel Environment Variables',
    scope: 'Browser Client (Frontend)',
    description:
      'Variable pública de cliente (opcional). Permite a la aplicación cliente Vite en Vercel invocar directamente el SDK de Gemini si no se utiliza backend serverless.',
    exampleValue: 'AIzaSyD-abc123xyz456...',
  },
];

/**
 * Retorna las instrucciones completas en Markdown para configurar la API KEY
 * desde GitHub hacia Vercel.
 */
export function getGitHubToVercelInstructions(): string {
  return `### Flujo de Conexión: GitHub ➔ Vercel ➔ Aplicación Sportfitness

1. **Obtener tu API Key:**
   - Ingresa a [Google AI Studio](https://aistudio.google.com/).
   - Genera tu clave API gratuita para el modelo **Gemini 3.8 Flash**.

2. **Configurar en GitHub (Para CI/CD y despliegue automático):**
   - En tu repositorio de GitHub, ve a **Settings** > **Secrets and variables** > **Actions**.
   - Crea un nuevo repository secret llamado \`GEMINI_API_KEY\`.

3. **Vincular en Vercel:**
   - Importa tu repositorio de GitHub en [Vercel](https://vercel.com/new).
   - En el paso de configuración del proyecto, despliega la sección **Environment Variables**.
   - Agrega:
     - **Key:** \`GEMINI_API_KEY\`
     - **Value:** [Tu clave de Google AI Studio]
   - Haz clic en **Deploy**.

4. **Cómo consume este código la API Key:**
   - El archivo \`/api/ai/chat.ts\` se ejecuta como función serverless en Vercel.
   - Lee \`process.env.GEMINI_API_KEY\` y responde a la interfaz de Sportfitness sin exponer la clave.`;
}
