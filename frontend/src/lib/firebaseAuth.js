import log from "@/lib/log";

const firebaseAuthEnabled = process.env.REACT_APP_FIREBASE_AUTH_ENABLED === "true";

export function isFirebaseAuthConfigured() {
  return false;
}

export async function ensureFirebaseAuth() {
  if (firebaseAuthEnabled) {
    log.warn("Firebase auth is enabled in env but the Firebase web SDK is not bundled for this build.");
  }
  return null;
}

export async function getFirebaseIdToken() {
  return null;
}
