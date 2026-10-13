# Gemini Service & Vercel API Key Integration

Esta carpeta contiene la integración de **Sportfitness AI** con **Google Gemini (gemini-3.8-flash)**, configurada específicamente para funcionar de forma nativa en **Vercel** y **GitHub**.

---

## 🚀 Cómo configurar la API Key en Vercel (Paso a Paso)

Al subir este proyecto desde **GitHub** a **Vercel**, debes configurar tu clave de Gemini:

### Opción 1 (Recomendada y Más Segura): Serverless Function
1. Abre tu proyecto en el **[Vercel Dashboard](https://vercel.com/dashboard)**.
2. Ve a **Settings** (Configuración) > **Environment Variables**.
3. Añade una nueva variable:
   - **Key / Nombre:** `GEMINI_API_KEY`
   - **Value / Valor:** Tu API Key de Google AI Studio (inicia con `AIzaSy...`).
   - **Target:** Selecciona *Production*, *Preview* y *Development*.
4. Haz clic en **Save** y luego realiza un **Redeploy** (o haz un nuevo commit a tu rama principal de GitHub).
5. Vercel ejecutará automáticamente la función serverless en `/api/ai/chat.ts`, manteniendo tu clave segura sin exponerla al navegador.

### Opción 2: Variable de Cliente Vite (Para despliegues estáticos en Vercel)
Si prefieres que la llamada a Gemini se realice directamente desde el cliente:
1. En **Vercel Dashboard** > **Settings** > **Environment Variables**.
2. Añade la variable:
   - **Key / Nombre:** `VITE_GEMINI_API_KEY`
   - **Value / Valor:** Tu API Key de Google AI Studio.
3. El servicio `geminiService` detectará automáticamente esta clave con `import.meta.env.VITE_GEMINI_API_KEY` y se conectará directamente con `@google/genai`.

---

## 📁 Estructura de Archivos

```
src/geminiService/
├── geminiService.ts   # Conector principal con soporte dual para Vercel Serverless y Client API Key
├── vercelConfig.ts    # Detector de entorno Vercel y resolución de claves
├── index.ts           # Exportaciones unificadas para imports limpios
└── README.md          # Esta guía de integración con Vercel
```

## 💻 Ejemplos de Uso en el Código

```typescript
import { geminiService, getVercelConfig } from '@/geminiService';

// 1. Verificar configuración de Vercel
const vercelStatus = getVercelConfig();
console.log('¿Está corriendo en Vercel?:', vercelStatus.isVercel);
console.log('Fuente de la clave:', vercelStatus.source);

// 2. Realizar consulta deportiva con Gemini
const response = await geminiService.chat({
  message: '¿Cómo programar la sentadilla para somatotipo mesomorfo?',
  language: 'es'
});

console.log(response.reply);
```

## 🛠️ Archivos en la Raíz del Proyecto para Vercel
- `/api/ai/chat.ts`: Función Serverless nativa de Vercel que lee `process.env.GEMINI_API_KEY`.
- `vercel.json`: Reglas de compilación y enrutamiento SPA para Vercel.
- `.env.example`: Plantilla de variables de entorno requeridas.
