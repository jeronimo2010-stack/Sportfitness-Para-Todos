/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp, getApps, getApp, cert, applicationDefault, type App, type ServiceAccount } from 'firebase-admin/app';
import { getFirestore, type Firestore, type Query } from 'firebase-admin/firestore';

let firestoreInstance: Firestore | null = null;
let isInitialized = false;
let initError: string | null = null;

function parseServiceAccount(raw: string | undefined): ServiceAccount | null {
  if (!raw || !raw.trim()) return null;
  const trimmed = raw.trim();

  // Try direct JSON parse
  try {
    const parsed = JSON.parse(trimmed);
    if (parsed && typeof parsed === 'object') {
      if (typeof parsed.private_key === 'string') {
        parsed.private_key = parsed.private_key.replace(/\\n/g, '\n');
      }
      return parsed as ServiceAccount;
    }
  } catch {
    // If direct parse fails, try base64 decode
    try {
      const decoded = Buffer.from(trimmed, 'base64').toString('utf-8');
      const parsed = JSON.parse(decoded);
      if (parsed && typeof parsed === 'object') {
        if (typeof parsed.private_key === 'string') {
          parsed.private_key = parsed.private_key.replace(/\\n/g, '\n');
        }
        return parsed as ServiceAccount;
      }
    } catch {
      // Not base64 JSON either
    }
  }

  return null;
}

export function initFirebaseAdmin(): App | null {
  if (isInitialized) {
    return getApps().length > 0 ? getApp() : null;
  }

  try {
    const apps = getApps();
    if (apps.length > 0) {
      isInitialized = true;
      firestoreInstance = getFirestore();
      return getApp();
    }

    const serviceAccountEnv = process.env.FIREBASE_SERVICE_ACCOUNT;
    const serviceAccount = parseServiceAccount(serviceAccountEnv);

    const targetDatabaseId =
      process.env.FIRESTORE_DATABASE_ID ||
      'ai-studio-sportfitnesspara-13d1b18f-939a-4926-8fb2-9dc953e965e2';

    if (serviceAccount) {
      const app = initializeApp({
        credential: cert(serviceAccount),
        projectId: serviceAccount.projectId || (serviceAccount as any).project_id,
      });
      firestoreInstance = targetDatabaseId && targetDatabaseId !== '(default)'
        ? getFirestore(app, targetDatabaseId)
        : getFirestore(app);
      isInitialized = true;
      console.log(`[Firebase Admin] Successfully initialized with FIREBASE_SERVICE_ACCOUNT (database: ${targetDatabaseId}).`);
      return app;
    }

    // Attempt default application credentials if running in Google Cloud or environment has GOOGLE_APPLICATION_CREDENTIALS
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      const app = initializeApp({
        credential: applicationDefault(),
      });
      firestoreInstance = targetDatabaseId && targetDatabaseId !== '(default)'
        ? getFirestore(app, targetDatabaseId)
        : getFirestore(app);
      isInitialized = true;
      console.log(`[Firebase Admin] Initialized with Application Default Credentials (database: ${targetDatabaseId}).`);
      return app;
    }

    // If neither is present, warn clearly
    console.warn(
      '[Firebase Admin] FIREBASE_SERVICE_ACCOUNT is not set. Server database will operate with resilient stateless verification.'
    );
    initError = 'FIREBASE_SERVICE_ACCOUNT environment variable is not defined.';
    return null;
  } catch (err: any) {
    console.error('[Firebase Admin] Failed to initialize Firebase Admin SDK:', err?.message || err);
    initError = err?.message || String(err);
    return null;
  }
}

export function getAdminFirestore(): Firestore | null {
  if (!firestoreInstance && !isInitialized) {
    initFirebaseAdmin();
  }
  return firestoreInstance;
}

export function isFirestoreAdminAvailable(): boolean {
  return getAdminFirestore() !== null;
}

export function getFirebaseAdminInitError(): string | null {
  return initError;
}

export type { Firestore, Query };
