import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { getSessionUser } from '@/lib/auth/session';
import type { MentorDashboardData, MentorDashboardStats } from '@/types';

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session || (session.role !== 'mentor' && session.role !== 'both')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const today = new Date().toISOString().split('T')[0];
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const [
      mentorDoc,
      todayAttendanceSnapshot,
      weekAttendanceSnapshot,
      monthAttendanceSnapshot,
      assignedBatchesSnapshot,
    ] = await Promise.all([
      adminDb().collection('users').doc(session.uid).get(),
      adminDb().collection('mentorAttendance').where('mentorId', '==', session.uid).where('date', '==', today).get(),
      adminDb().collection('mentorAttendance').where('mentorId', '==', session.uid).where('date', '>=', weekAgo).get(),
      adminDb().collection('mentorAttendance').where('mentorId', '==', session.uid).where('date', '>=', monthAgo).get(),
      adminDb().collection('batches').where('mentorIds', 'array-contains', session.uid).get(),
    ]);

    const mentorData = mentorDoc.data();
    const mentorName = mentorData?.fullName || mentorData?.displayName || 'Mentor';
    const assignedBatches = assignedBatchesSnapshot.docs.map((d) => d.data().name);

    const todayAttendance = todayAttendanceSnapshot.docs.map((d) => d.data());
    const weekAttendance = weekAttendanceSnapshot.docs.map((d) => d.data());
    const monthAttendance = monthAttendanceSnapshot.docs.map((d) => d.data());

    // Calculate stats
    const sessionsThisMonth = monthAttendance.length;
    const totalStudents = monthAttendance.reduce((sum, a) => sum + (a.studentCount || 0), 0);
    const avgStudentsPerSession = sessionsThisMonth > 0 ? Math.round(totalStudents / sessionsThisMonth) : 0;
    const totalHours = monthAttendance.reduce((sum, a) => sum + (a.duration || 120), 0);
    const doubtsCleared = monthAttendance.reduce((sum, a) => sum + (a.doubtsCleared || 0), 0);

    // Current streak
    let currentStreak = 0;
    for (let i = 0; i < 30; i++) {
      const checkDate = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const hasAttendance = monthAttendance.some((a: any) => a.date === checkDate);
      if (hasAttendance) currentStreak++;
      else if (i > 0) break;
    }

    // Attendance rate (sessions attended / expected sessions in month)
    const expectedSessions = 2 * 22; // 2 study hours * ~22 working days
    const attendanceRate = Math.min(100, Math.round((sessionsThisMonth / expectedSessions) * 100));

    const stats: MentorDashboardStats = {
      sessionsThisMonth,
      avgStudentsPerSession,
      totalHours,
      doubtsCleared,
      attendanceRate,
      currentStreak,
    };

    // Attendance chart data (last 7 days)
    const attendanceChartData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const dayRecords = monthAttendance.filter((a: any) => a.date === date);
      attendanceChartData.push({
        date,
        studyHour: dayRecords[0]?.studyHour || 1,
        checkedIn: dayRecords.length > 0,
        topic: dayRecords[0]?.topic,
        studentCount: dayRecords[0]?.studentCount,
      });
    }

    // Upcoming sessions (study hours)
    const currentHour = new Date().getHours();
    const isStudyHour1 = currentHour >= 17 && currentHour < 20;
    const isStudyHour2 = currentHour >= 20 && currentHour < 22;
    const currentStudyHour = isStudyHour1 ? 1 : isStudyHour2 ? 2 : null;

    const upcomingSessions = [
      {
        studyHour: 1 as const,
        time: '5:30 PM - 7:30 PM',
        isCurrent: currentStudyHour === 1,
        isUpcoming: currentHour < 17,
      },
      {
        studyHour: 2 as const,
        time: '8:30 PM - 10:00 PM',
        isCurrent: currentStudyHour === 2,
        isUpcoming: currentHour < 20 && currentHour >= 17,
      },
    ];

    // Previous sessions
    const previousSessions = monthAttendance
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5)
      .map((a) => ({
        date: a.date === today ? 'Today' : new Date(a.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
        studyHour: a.studyHour,
        topic: a.topic,
        students: a.studentCount,
        duration: a.duration || 120,
        notes: a.notes || '',
      }));

    // Announcements
    const announcementsSnapshot = await adminDb()
      .collection('announcements')
      .where('targetRoles', 'array-contains', 'mentor')
      .where('isActive', '==', true)
      .orderBy('createdAt', 'desc')
      .limit(5)
      .get();

    const announcements = announcementsSnapshot.docs.map((d) => {
      const data = d.data();
      return {
        title: data.title,
        type: data.type,
        time: data.createdAt,
      };
    });

    return NextResponse.json({
      stats,
      attendanceChartData,
      upcomingSessions,
      previousSessions,
      announcements,
      assignedBatches,
      mentorName,
    } as MentorDashboardData);
  } catch (error) {
    console.error('Mentor Dashboard API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}