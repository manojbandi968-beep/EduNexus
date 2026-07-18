import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { COLLECTIONS } from '@/lib/firebase/firestore';
import { cookies } from 'next/headers';
import { verifySession } from '@/lib/auth/session';
import { bulkStudentAttendanceSchema } from '@/lib/validations';

export async function POST(request: NextRequest) {
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

    if (decodedClaims.role !== 'teacher' && decodedClaims.role !== 'both' && decodedClaims.role !== 'principal') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validation = bulkStudentAttendanceSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid data', details: validation.error.flatten() }, { status: 400 });
    }

    const data = validation.data;
    const now = new Date().toISOString();
    const batch = adminDb().batch();
    const results: string[] = [];

    for (const record of data.records) {
      const docRef = adminDb().collection(COLLECTIONS.STUDENT_ATTENDANCE).doc();
      const attendanceRecord = {
        ...record,
        teacherId: data.teacherId,
        teacherName: data.teacherName,
        date: data.date,
        subjectId: data.subjectId,
        subjectName: data.subjectName,
        periodId: data.periodId,
        periodLabel: data.periodLabel,
        isSubstitution: data.isSubstitution,
        originalTeacherId: data.originalTeacherId,
        markedBy: decodedClaims.uid,
        markedByName: decodedClaims.name || 'Unknown',
        markedAt: now,
        createdAt: now,
        updatedAt: now,
      };
      batch.set(docRef, attendanceRecord);
      results.push(docRef.id);
    }

    await batch.commit();

    await adminDb().collection(COLLECTIONS.AUDIT_LOGS).add({
      action: 'attendance_marked',
      userId: decodedClaims.uid,
      userName: decodedClaims.name || 'Unknown',
      userRole: decodedClaims.role,
      details: `Marked bulk student attendance for ${data.subjectName} - ${data.periodLabel} (${data.records.length} students)`,
      timestamp: now,
      createdAt: now,
      updatedAt: now,
      metadata: { studentAttendanceIds: results, sectionId: data.sectionId, subjectId: data.subjectId, periodId: data.periodId },
    });

    return NextResponse.json({ ids: results, count: results.length });
  } catch (error) {
    console.error('Error marking bulk student attendance:', error);
    return NextResponse.json({ error: 'Failed to mark attendance' }, { status: 500 });
  }
}