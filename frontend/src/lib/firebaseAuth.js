import { initializeApp } from "firebase/app";
import {
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithCustomToken,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
} from "firebase/auth";
import axios from "axios";
import log from "@/lib/log";

const BASE = process.env.REACT_APP_BACKEND_URL || "http://127.0.0.1:8000";
const API = `${BASE}/api`;

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID,
};

const hasFirebaseConfig = Boolean(
  process.env.REACT_APP_FIREBASE_AUTH_ENABLED === "true" &&
  firebaseConfig.apiKey &&
  firebaseConfig.authDomain &&
  firebaseConfig.projectId &&
  firebaseConfig.appId
);
let authPromise;
let authInstance;
let appInstance;

function getFirebaseAuth() {
  if (!hasFirebaseConfig) return null;
  if (!appInstance) appInstance = initializeApp(firebaseConfig);
  if (!authInstance) authInstance = getAuth(appInstance);
  return authInstance;
}

export function isFirebaseAuthConfigured() {
  return hasFirebaseConfig;
}

export function watchFirebaseUser(callback) {
  const auth = getFirebaseAuth();
  if (!auth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
}

export async function ensureFirebaseAuth(sessionId) {
  if (!hasFirebaseConfig || !sessionId) return null;
  if (authPromise) return authPromise;

  authPromise = (async () => {
    const auth = getFirebaseAuth();
    if (auth.currentUser) return auth.currentUser;

    const response = await axios.post(
      `${API}/auth/firebase/custom-token`,
      { session_id: sessionId },
      { headers: { "bypass-tunnel-reminder": "1" } },
    );
    const credential = await signInWithCustomToken(auth, response.data.custom_token);
    return credential.user;
  })().catch((error) => {
    authPromise = null;
    log.error("Firebase auth failed:", error);
    return null;
  });

  return authPromise;
}

export async function getFirebaseIdToken() {
  const auth = getFirebaseAuth();
  if (!auth?.currentUser) return null;
  try {
    return await auth.currentUser.getIdToken();
  } catch (error) {
    log.error("Firebase token refresh failed:", error);
    return null;
  }
}

export async function signInWithEmail(email, password) {
  const auth = getFirebaseAuth();
  if (!auth) throw new Error("Firebase authentication is not configured.");
  return signInWithEmailAndPassword(auth, email, password);
}

export async function signUpWithEmail(email, password) {
  const auth = getFirebaseAuth();
  if (!auth) throw new Error("Firebase authentication is not configured.");
  return createUserWithEmailAndPassword(auth, email, password);
}

export async function resetPassword(email) {
  const auth = getFirebaseAuth();
  if (!auth) throw new Error("Firebase authentication is not configured.");
  return sendPasswordResetEmail(auth, email);
}

export async function signOutUser() {
  const auth = getFirebaseAuth();
  if (!auth) return;
  await firebaseSignOut(auth);
}
