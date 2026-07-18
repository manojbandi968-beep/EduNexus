'use server';

import { adminDb } from '@/lib/firebase/admin';
import { COLLECTIONS } from '@/lib/firebase/firestore';
import { cookies } from 'next/headers';
import { verifySession } from '@/lib/auth/session';
import { bulkStudentAttendanceSchema, type BulkStudentAttendanceInput } from '@/lib/validations';

export async function markStudentAttendance(data: BulkStudentAttendanceInput) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session')?.value;
    if (!sessionCookie) {
      return { success: false, error: 'Unauthorized' };
    }

    const decodedClaims = await verifySession();
    if (!decodedClaims) {
      return { success: false, error: 'Invalid session' };
    }

    if (decodedClaims.role !== 'teacher' && decodedClaims.role !== 'both' && decodedClaims.role !== 'principal') {
      return { success: false, error: 'Forbidden' };
    }

    const validation = bulkStudentAttendanceSchema.safeParse(data);
    if (!validation.success) {
      return { success: false, error: 'Invalid data', details: validation.error.flatten() };
    }

    const validData = validation.data;
    const now = new Date().toISOString();
    const batch = adminDb().batch();
    const results: string[] = [];

    for (const record of validData.records) {
      const docRef = adminDb().collection(COLLECTIONS.STUDENT_ATTENDANCE).doc();
      const attendanceRecord = {
        ...record,
        teacherId: validData.teacherId,
        teacherName: validData.teacherName,
        date: validData.date,
        subjectId: validData.subjectId,
        subjectName: validData.subjectName,
        periodId: validData.periodId,
        periodLabel: validData.periodLabel,
        isSubstitution: validData.isSubstitution,
        originalTeacherId: validData.originalTeacherId,
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
      details: `Marked bulk student attendance for ${validData.subjectName} - ${validData.periodLabel} (${validData.records.length} students)`,
      timestamp: now,
      createdAt: now,
      updatedAt: now,
      metadata: { studentAttendanceIds: results, sectionId: validData.sectionId, subjectId: validData.subjectId, periodId: validData.periodId },
    });

    return { success: true, ids: results, count: results.length };
  } catch (error) {
    console.error('Error marking student attendance:', error);
    return { success: false, error: 'Failed to mark attendance' };
  }
}

export async function getStudentAttendance(params: {
  date: string;
  sectionId?: string;
  subjectId?: string;
  periodId?: string;
  teacherId?: string;
}) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session')?.value;
    if (!sessionCookie) {
      return { success: false, error: 'Unauthorized' };
    }

    const decodedClaims = await verifySession();
    if (!decodedClaims) {
      return { success: false, error: 'Invalid session' };
    }

    const teacherId = params.teacherId || decodedClaims.uid;

    let query = adminDb()
      .collection(COLLECTIONS.STUDENT_ATTENDANCE)
      .where('date', '==', params.date)
      .where('teacherId', '==', teacherId);

    if (params.sectionId) {
      query = query.where('sectionId', '==', params.sectionId);
    }
    if (params.subjectId) {
      query = query.where('subjectId', '==', params.subjectId);
    }
    if (params.periodId) {
      query = query.where('periodId', '==', params.periodId);
    }

    const snapshot = await query.orderBy('studentName').get();
    const records = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    return { success: true, records };
  } catch (error) {
    console.error('Error fetching student attendance:', error);
    return { success: false, error: 'Failed to fetch attendance' };
  }
}