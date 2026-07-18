import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { COLLECTIONS } from '@/lib/firebase/firestore';
import { cookies } from 'next/headers';
import { verifySession } from '@/lib/auth/session';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session')?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decodedClaims = await verifySession();
    if (!decodedClaims) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const url = new URL(request.url);
    const date = url.searchParams.get('date') || new Date().toISOString().split('T')[0];
    const sectionId = url.searchParams.get('sectionId');
    const subjectId = url.searchParams.get('subjectId');
    const periodId = url.searchParams.get('periodId');
    const teacherId = url.searchParams.get('teacherId') || decodedClaims.uid;

    let query = adminDb()
      .collection(COLLECTIONS.STUDENT_ATTENDANCE)
      .where('date', '==', date)
      .where('teacherId', '==', teacherId);

    if (sectionId) {
      query = query.where('sectionId', '==', sectionId);
    }
    if (subjectId) {
      query = query.where('subjectId', '==', subjectId);
    }
    if (periodId) {
      query = query.where('periodId', '==', periodId);
    }

    const snapshot = await query.orderBy('studentName').get();
    const records = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    return NextResponse.json({ records });
  } catch (error) {
    console.error('Error fetching student attendance:', error);
    return NextResponse.json({ error: 'Failed to fetch attendance' }, { status: 500 });
  }
}