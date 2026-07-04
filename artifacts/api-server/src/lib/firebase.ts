// firebase-admin v14 uses modular sub-package imports (not admin.app.App / admin.credential)
import { initializeApp, cert, type App, type ServiceAccount } from "firebase-admin/app";
import { getMessaging, type Messaging } from "firebase-admin/messaging";
import { logger } from "./logger";

let app: App | null = null;
let initialized = false;

/**
 * Lazily initialises Firebase Admin from FIREBASE_SERVICE_ACCOUNT env var.
 * That env var must be the full JSON string of a service account key file
 * (downloaded from Firebase Console → Project Settings → Service accounts →
 * Generate new private key).
 *
 * Returns null — and logs a warning — when the env var is absent or invalid.
 * Safe to call multiple times; only initialises once per process.
 */
export function getFirebaseApp(): App | null {
  if (initialized) return app;
  initialized = true;

  const json = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!json) {
    logger.warn("FIREBASE_SERVICE_ACCOUNT not set — Firebase Admin SDK disabled");
    return null;
  }

  try {
    const serviceAccount = JSON.parse(json) as ServiceAccount;
    app = initializeApp({ credential: cert(serviceAccount) });
    logger.info("Firebase Admin SDK initialised");
  } catch (err) {
    logger.warn({ err }, "Failed to parse FIREBASE_SERVICE_ACCOUNT — Firebase disabled");
  }

  return app;
}

export function getFirebaseMessaging(): Messaging | null {
  const firebaseApp = getFirebaseApp();
  if (!firebaseApp) return null;
  try {
    return getMessaging(firebaseApp);
  } catch (err) {
    logger.warn({ err }, "getMessaging() failed");
    return null;
  }
}
