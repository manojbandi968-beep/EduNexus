import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fullName, email, phone, subject, stream, role } = body;

    if (!fullName || !email || !phone || !subject || !stream || !role) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    const auth = adminAuth();
    const db = adminDb();

    const existingUser = await db
      .collection('users')
      .where('email', '==', email)
      .limit(1)
      .get();

    if (!existingUser.empty) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }

    // Create Firebase Auth user (disabled until principal approves)
    let firebaseUser;
    try {
      firebaseUser = await auth.createUser({
        email,
        displayName: fullName,
        disabled: true,
      });
    } catch {
      return NextResponse.json({ error: 'Failed to create user account' }, { status: 500 });
    }

    await auth.setCustomUserClaims(firebaseUser.uid, { role });

    await db.collection('users').doc(firebaseUser.uid).set({
      fullName,
      email,
      phone,
      subject,
      stream,
      role,
      status: 'pending',
      isPhoneVerified: false,
      isEmailVerified: false,
      assignedSections: [],
      assignedBatches: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: 'Registration submitted. Awaiting Principal approval.',
      userId: firebaseUser.uid,
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
  }
}
