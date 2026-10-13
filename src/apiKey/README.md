# 🔑 Sportfitness API Key Integration (GitHub & Vercel)

Esta carpeta (`src/apiKey/`) contiene el código fuente, la arquitectura de seguridad y los conectores para la **API Key de Google Gemini** en **Sportfitness**, compatible tanto con **GitHub** como con **Vercel**.

---

## 🎯 Propósito de este Módulo

Permitir a cualquier desarrollador que clone o revise este proyecto desde **GitHub**:
1. Ver exactamente cómo la aplicación gestiona la API Key sin exponer secretos en el repositorio.
2. Desplegar con un solo clic en **Vercel** usando variables de entorno protegidas.
3. Probar y verificar la conexión con **Gemini 3.8 Flash** en tiempo real.

---

## 📂 Archivos en esta Carpeta

- **`apiKeyManager.ts`**: Clase `ApiKeyManager` con funciones de resolución (`getClientApiKey`), enmascaramiento seguro (`maskKey`), validación de formato Google (`validateGoogleApiKey`) y diagnóstico de entorno.
- **`vercelGithubApiKey.ts`**: Mapeo y especificación de variables entre los secretos de GitHub Actions y las variables de entorno de Vercel.
- **`ApiKeyStatusCard.tsx`**: Componente visual interactivo para visualizar el estado, entorno y código de la API Key dentro de la aplicación.
- **`index.ts`**: Punto de exportación limpio para importar en cualquier módulo (`import { ApiKeyManager, ApiKeyStatusCard } from '@/apiKey'`).

---

## 💻 Código de la Aplicación para la API Key

### 1. En Vercel Serverless (`/api/ai/chat.ts`):
Vercel inyecta la variable secreta en el backend serverless para que **NUNCA** viaje al navegador:

```typescript
import { GoogleGenAI } from '@google/genai';

export default async function handler(req, res) {
  // Vercel lee la variable desde Project Settings > Environment Variables:
  const apiKey = process.env.GEMINI_API_KEY;
  
  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: 'gemini-3.8-flash',
    contents: req.body.message
  });
  
  return res.json({ reply: response.text });
}
```

### 2. En el Cliente Vite (`src/apiKey/apiKeyManager.ts`):
Para despliegues estáticos en Vercel o pruebas locales:

```typescript
const clientKey = import.meta.env.VITE_GEMINI_API_KEY;
if (clientKey) {
  // Conexión directa autorizada
}
```

---

## 🛠️ Cómo Configurar en GitHub y Vercel

### Paso 1: En GitHub (Secrets del Repositorio)
1. Ve a tu repositorio en GitHub.
2. Abre **Settings** > **Secrets and variables** > **Actions**.
3. Haz clic en **New repository secret**.
4. Nombre: `GEMINI_API_KEY`
5. Valor: Tu clave obtenida en [Google AI Studio](https://aistudio.google.com/).

### Paso 2: En Vercel (Variables de Entorno)
1. Abre tu proyecto en el panel de Vercel.
2. Ve a **Settings** > **Environment Variables**.
3. Añade:
   - **Key:** `GEMINI_API_KEY`
   - **Value:** [Tu API Key de Google AI Studio]
   - **Environments:** Production, Preview, Development
4. Guarda y haz un **Redeploy**.

---

## 🔒 Regla de Seguridad (Anti-Fugas)
- La clave nunca se escribe en duro en ningún archivo de código.
- Los commits a GitHub nunca contendrán tu clave personal.
- La función `ApiKeyManager.maskKey()` garantiza que la interfaz solo muestre los primeros 6 y últimos 4 caracteres (ej. `AIzaSy••••••••••••3A9`).
