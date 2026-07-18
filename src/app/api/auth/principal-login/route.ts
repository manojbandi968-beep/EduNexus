import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { createSession } from '@/lib/auth/session';
import { logLoginAttempt } from '@/lib/audit';

const MAX_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, securityPin, userAgent, rememberMe = true } = body;

    const auth = adminAuth();
    const db = adminDb();

    const ipAddress = request.headers.get('x-forwarded-for') ||
                      request.headers.get('x-real-ip') ||
                      'unknown';

    const browser = userAgent?.match(/(Chrome|Firefox|Safari|Edge|Opera)/i)?.[1] || 'Unknown';
    const device = userAgent?.includes('Mobile') ? 'Mobile' : 'Desktop';

    if (!email || !password || !securityPin) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    const attemptsRef = db.collection('loginAttempts').doc(email.replace(/[.@]/g, '_'));
    const attemptsDoc = await attemptsRef.get();

    if (attemptsDoc.exists) {
      const data = attemptsDoc.data();
      if (data && data.count >= MAX_ATTEMPTS) {
        const lockoutEnd = new Date(data.lastAttempt).getTime() + LOCKOUT_MINUTES * 60 * 1000;
        if (Date.now() < lockoutEnd) {
          await logLoginAttempt({ email, success: false, role: 'principal', ipAddress, userAgent, browser, device });
          return NextResponse.json(
            { error: `Account locked. Try again in ${LOCKOUT_MINUTES} minutes.` },
            { status: 429 }
          );
        }
        await attemptsRef.set({ count: 0, lastAttempt: new Date().toISOString() });
      }
    }

    const principalQuery = await db
      .collection('users')
      .where('email', '==', email)
      .where('role', '==', 'principal')
      .limit(1)
      .get();

    if (principalQuery.empty) {
      await logLoginAttempt({ email, success: false, role: 'principal', ipAddress, userAgent, browser, device });
      await attemptsRef.set({
        count: (attemptsDoc.exists ? (attemptsDoc.data()?.count || 0) : 0) + 1,
        lastAttempt: new Date().toISOString(),
      }, { merge: true });
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const principalData = principalQuery.docs[0].data();

    // Security PIN check
    if (principalData.securityPin !== securityPin) {
      await logLoginAttempt({ email, success: false, role: 'principal', ipAddress, userAgent, browser, device });
      await attemptsRef.set({
        count: (attemptsDoc.exists ? (attemptsDoc.data()?.count || 0) : 0) + 1,
        lastAttempt: new Date().toISOString(),
      }, { merge: true });
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Verify password via Firebase Auth REST API
    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    const signInRes = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, returnSecureToken: true }),
      }
    );

    if (!signInRes.ok) {
      await logLoginAttempt({ email, success: false, role: 'principal', ipAddress, userAgent, browser, device });
      await attemptsRef.set({
        count: (attemptsDoc.exists ? (attemptsDoc.data()?.count || 0) : 0) + 1,
        lastAttempt: new Date().toISOString(),
      }, { merge: true });
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const { idToken, localId } = await signInRes.json();

    // Ensure custom claims are set
    await auth.setCustomUserClaims(localId, { role: 'principal' });

    // Create proper Firebase session cookie
    const created = await createSession(idToken, rememberMe);
    if (!created) {
      return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
    }

    await attemptsRef.set({ count: 0, lastAttempt: new Date().toISOString() });

    await logLoginAttempt({ email, success: true, role: 'principal', ipAddress, userAgent, browser, device });

    await db.collection('users').doc(principalQuery.docs[0].id).update({
      lastLogin: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Principal login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
