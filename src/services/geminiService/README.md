# Gemini Service & Vercel API Key Integration

Esta carpeta contiene la integración de **Sportfitness AI** con **Google Gemini (gemini-3.8-flash)**, configurada específicamente para funcionar de forma nativa en **Vercel** y **GitHub**.

Consulte la documentación detallada en `src/geminiService/README.md`.

## Resumen de Configuración en Vercel
1. Agregue `GEMINI_API_KEY` en **Vercel Dashboard** > **Settings** > **Environment Variables**.
2. Vercel ejecutará automáticamente la función en `/api/ai/chat.ts`.
3. Para clientes estáticos, también se admite `VITE_GEMINI_API_KEY`.
