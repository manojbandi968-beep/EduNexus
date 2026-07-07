// ============================================
// CollegeDost — Firebase Auth Helpers (Client-side)
// ============================================

import {
  signInWithPopup,
  GoogleAuthProvider,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User as FirebaseUser,
  type ConfirmationResult,
} from 'firebase/auth';
import { auth } from './config';

// ---- Google Sign-In ----

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

export async function signInWithGoogle(): Promise<FirebaseUser> {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

// ---- Phone OTP ----

let recaptchaVerifier: RecaptchaVerifier | null = null;

export function initRecaptcha(containerId: string): RecaptchaVerifier {
  if (recaptchaVerifier) {
    recaptchaVerifier.clear();
  }
  recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
    size: 'invisible',
    callback: () => {
      // reCAPTCHA solved
    },
  });
  return recaptchaVerifier;
}

export async function sendPhoneOTP(phoneNumber: string): Promise<ConfirmationResult> {
  if (!recaptchaVerifier) {
    throw new Error('RecaptchaVerifier not initialized. Call initRecaptcha first.');
  }
  return signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
}

// ---- Sign Out ----

export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
  // Clear session cookie via server action
  await fetch('/api/auth/logout', { method: 'POST' });
}

// ---- Auth State Listener ----

export function onAuthStateChange(callback: (user: FirebaseUser | null) => void) {
  return onAuthStateChanged(auth, callback);
}

// ---- Get Current User ----

export function getCurrentUser(): FirebaseUser | null {
  return auth.currentUser;
}

// ---- Get ID Token ----

export async function getIdToken(): Promise<string | null> {
  const user = auth.currentUser;
  if (!user) return null;
  return user.getIdToken();
}

// ---- Create Session ----

export async function createSessionCookie(): Promise<boolean> {
  const idToken = await getIdToken();
  if (!idToken) return false;

  const response = await fetch('/api/auth/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
  });

  return response.ok;
}
