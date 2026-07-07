import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import type { UserRole } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, email, password, role } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    const auth = adminAuth();
    const db = adminDb();

    let firebaseUser;
    try {
      firebaseUser = await auth.createUser({
        email,
        password,
        displayName: email.split('@')[0],
        disabled: false,
      });
    } catch {
      return NextResponse.json({ error: 'Failed to create account. Email may already be in use.' }, { status: 409 });
    }

    await auth.setCustomUserClaims(firebaseUser.uid, {
      role: role || 'teacher',
      linkedTo: userId || '',
      isAdditionalEmail: true,
    });

    await db.collection('users').doc(firebaseUser.uid).set({
      fullName: email.split('@')[0],
      email,
      phone: '',
      role: role || 'teacher',
      status: 'approved',
      isPhoneVerified: false,
      isEmailVerified: false,
      isAdditionalEmail: true,
      linkedTo: userId || '',
      subject: '',
      stream: '',
      assignedSections: [],
      assignedBatches: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    if (userId) {
      const userDoc = await db.collection('users').doc(userId).get();
      if (userDoc.exists) {
        const existing = userDoc.data()?.additionalEmails || [];
        if (!existing.includes(email)) {
          await db.collection('users').doc(userId).update({
            additionalEmails: [...existing, email],
            updatedAt: new Date().toISOString(),
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Email registered successfully. You can now login with this email.',
      uid: firebaseUser.uid,
    });
  } catch (error) {
    console.error('Add email error:', error);
    return NextResponse.json({ error: 'Failed to register email' }, { status: 500 });
  }
}
