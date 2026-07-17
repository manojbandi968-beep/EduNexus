import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';
import { cookies } from 'next/headers';

const SESSION_DURATION = 60 * 60 * 24 * 5 * 1000; // 5 days

export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json();

    if (!idToken) {
      return NextResponse.json({ error: 'Missing idToken' }, { status: 400 });
    }

    const auth = adminAuth();

    const decodedToken = await auth.verifyIdToken(idToken);

    const userRecord = await auth.getUser(decodedToken.uid);
    const role = userRecord.customClaims?.role || 'teacher';

    const sessionCookie = await auth.createSessionCookie(idToken, {
      expiresIn: SESSION_DURATION,
    });

    const cookieStore = await cookies();
    cookieStore.set('__session', sessionCookie, {
      maxAge: SESSION_DURATION / 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    const userAgent = request.headers.get('user-agent') || '';
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const browser = userAgent.match(/(Chrome|Firefox|Safari|Edge|Opera)/i)?.[1] || 'Unknown';
    const device = userAgent.includes('Mobile') ? 'Mobile' : 'Desktop';

    // Log the successful login attempt
    try {
      const { logLoginAttempt } = await import('@/lib/audit');
      await logLoginAttempt({
        email: decodedToken.email || 'unknown@email.com',
        success: true,
        role: role as any,
        ipAddress,
        userAgent,
        browser,
        device
      });
    } catch (e) {
      console.error('Failed to log login attempt', e);
    }

    return NextResponse.json({ success: true, role });
  } catch (error) {
    console.error('Session creation error:', error);
    return NextResponse.json({ error: 'Failed to create session' }, { status: 401 });
  }
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('__session')?.value;
    
    if (!sessionCookie) {
      return NextResponse.json({ user: null });
    }
    
    const auth = adminAuth();
    const decodedClaims = await auth.verifySessionCookie(sessionCookie, true);
    
    return NextResponse.json({
      user: {
        uid: decodedClaims.uid,
        email: decodedClaims.email,
        role: decodedClaims.role || 'teacher',
        displayName: decodedClaims.name || 'User',
      }
    });
  } catch (error) {
    return NextResponse.json({ user: null });
  }
}
