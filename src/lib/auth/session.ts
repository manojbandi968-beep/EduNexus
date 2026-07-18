// ============================================
// CollegeDost — Session Management (Server-side)
// ============================================

import { cookies } from 'next/headers';
import { adminAuth } from '@/lib/firebase/admin';
import type { UserRole } from '@/types';

const SESSION_COOKIE_NAME = '__session';
const SESSION_DURATION = 60 * 60 * 24 * 5 * 1000; // 5 days

export interface SessionUser {
  uid: string;
  email: string;
  role: UserRole;
  name: string;
  displayName: string;
  photoURL?: string;
}

export async function createSession(idToken: string, rememberMe: boolean = true): Promise<boolean> {
  try {
    const auth = adminAuth();
    // createSessionCookie requires expiresIn to be between 5 mins and 14 days.
    // We'll set it to 5 days, but if rememberMe is false, we omit maxAge from the cookie
    // so it becomes a browser session cookie.
    const sessionCookie = await auth.createSessionCookie(idToken, {
      expiresIn: SESSION_DURATION,
    });

    const cookieStore = await cookies();
    const cookieOptions: any = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    };

    if (rememberMe) {
      cookieOptions.maxAge = SESSION_DURATION / 1000;
    }

    cookieStore.set(SESSION_COOKIE_NAME, sessionCookie, cookieOptions);

    return true;
  } catch (error) {
    console.error('Failed to create session:', error);
    return false;
  }
}

export async function verifySession(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!sessionCookie) return null;

    const auth = adminAuth();
    const decodedClaims = await auth.verifySessionCookie(sessionCookie, true);

    return {
      uid: decodedClaims.uid,
      email: decodedClaims.email || '',
      role: (decodedClaims.role as UserRole) || 'teacher',
      name: decodedClaims.name || '',
      displayName: decodedClaims.name || '',
      photoURL: decodedClaims.picture,
    };
  } catch (error) {
    console.error('Session verification failed:', error);
    return null;
  }
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function getSessionUser(): Promise<SessionUser | null> {
  return verifySession();
}

export const getServerSession = getSessionUser;
