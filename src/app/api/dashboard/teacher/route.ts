import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { getServerSession } from '@/lib/auth/session';
import type { TeacherDashboardData, TeacherDashboardStats, TeacherAttendanceChartData, TeacherQuizChartData, TeacherTodayClass, TeacherRecentQuiz, TeacherAnnouncement } from '@/types';

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session || (session.role !== 'teacher' && session.role !== 'both')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const today = new Date().toISOString().split('T')[0];
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const teacherId = session.uid;

    // Parallel fetch all required data
    const [
      teacherDoc,
      todayAttendanceSnapshot,
      weekAttendanceSnapshot,
      quizzesSnapshot,
      allQuizzesSnapshot,
      timetableSnapshot,
      leaveSnapshot,
      announcementsSnapshot,
    ] = await Promise.all([
      adminDb().collection('users').doc(teacherId).get(),
      adminDb().collection('attendance').where('teacherId', '==', teacherId).where('date', '==', today).get(),
      adminDb().collection('attendance').where('teacherId', '==', teacherId).where('date', '>=', weekAgo).get(),
      adminDb().collection('quizzes').where('teacherId', '==', teacherId).where('date', '==', today).get(),
      adminDb().collection('quizzes').where('teacherId', '==', teacherId).where('date', '>=', monthAgo).get(),
      adminDb().collection('timetableEntries').where('teacherId', '==', teacherId).where('date', '==', today).orderBy('timeSlotId').get(),
      adminDb().collection('leaveRequests').where('teacherId', '==', teacherId).where('status', '==', 'pending').get(),
      adminDb().collection('announcements')
        .where('targetRoles', 'array-contains-any', ['teacher', 'both'])
        .where('isActive', '==', true)
        .orderBy('createdAt', 'desc')
        .limit(5)
        .get(),
    ]);

    const teacherData = teacherDoc.data();
    const todayAttendance = todayAttendanceSnapshot.docs.map((d) => d.data());
    const weekAttendance = weekAttendanceSnapshot.docs.map((d) => d.data());
    const todayQuizzes = quizzesSnapshot.docs.map((d) => d.data());
    const allQuizzes = allQuizzesSnapshot.docs.map((d) => d.data());
    const todayClasses = timetableSnapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    const pendingLeaves = leaveSnapshot.docs.map((d) => d.data());
    const announcements = announcementsSnapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

    // Calculate stats
    const attendanceThisMonth = weekAttendanceSnapshot.docs.map((d) => d.data()).filter((a: any) => a.date >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    const presentThisMonth = attendanceThisMonth.filter((a: any) => a.status === 'present').length;
    const totalThisMonth = attendanceThisMonth.length;
    const attendancePercent = totalThisMonth > 0 ? Math.round((presentThisMonth / totalThisMonth) * 100 * 10) / 10 : 0;

    const totalQuizzesThisSemester = allQuizzes.length;
    const avgQuizScore = allQuizzes.length > 0
      ? Math.round(allQuizzes.reduce((sum: number, q: any) => sum + (q.classAverage || 0), 0) / allQuizzes.length)
      : 0;

    const stats: TeacherDashboardStats = {
      attendancePercent,
      todayClasses: todayClasses.length,
      completedClasses: todayClasses.filter((c: any) => c.status === 'completed').length,
      upcomingClasses: todayClasses.filter((c: any) => c.status === 'upcoming').length,
      totalQuizzes: totalQuizzesThisSemester,
      avgQuizScore,
      pendingLeaves: pendingLeaves.length,
      assignedSections: teacherData?.assignedSections?.length || 0,
    };

    // Attendance chart data (last 7 days)
    const attendanceChartData: TeacherAttendanceChartData[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const dayAttendance = weekAttendance.filter((a: any) => a.date === date);
      attendanceChartData.push({
        date,
        status: dayAttendance[0]?.status || 'none',
      });
    }

    // Quiz chart data (by subject)
    const subjectQuizzes = new Map<string, { total: number; sum: number; count: number }>();
    allQuizzes.forEach((q: any) => {
      const subject = q.subject || 'Unknown';
      const current = subjectQuizzes.get(subject) || { total: 0, sum: 0, count: 0 };
      current.total += 1;
      current.sum += q.classAverage || 0;
      current.count += 1;
      subjectQuizzes.set(subject, current);
    });

    const quizChartData: TeacherQuizChartData[] = Array.from(subjectQuizzes.entries()).map(([subject, data]) => ({
      subject,
      average: data.count > 0 ? Math.round(data.sum / data.count) : 0,
      quizCount: data.total,
    }));

    // Today's classes with status
    const todaySchedule: TeacherTodayClass[] = todayClasses.map((cls: any) => ({
      period: cls.period || cls.timeSlotId,
      time: `${cls.startTime} - ${cls.endTime}`,
      subject: cls.subjectName,
      section: cls.sectionName,
      room: cls.roomNumber,
      status: cls.status || (new Date(`${today}T${cls.startTime}`) < new Date() ? 'completed' : 'upcoming'),
    }));

    // Recent quizzes
    const recentQuizzes: TeacherRecentQuiz[] = allQuizzes
      .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5)
      .map((q: any) => ({
        name: q.name,
        section: q.sectionName,
        date: q.date,
        avg: q.classAverage || 0,
        students: q.totalStudents || 0,
      }));

    return NextResponse.json({
      stats,
      attendanceChartData,
      quizChartData,
      todaySchedule,
      recentQuizzes,
      announcements: announcements.slice(0, 3).map((a: any) => ({
        title: a.title,
        type: a.type,
        time: a.createdAt,
      })),
      teacherName: teacherData?.fullName || session.name,
    } as TeacherDashboardData);
  } catch (error) {
    console.error('Teacher Dashboard API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}