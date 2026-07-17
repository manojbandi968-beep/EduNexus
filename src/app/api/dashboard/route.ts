import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { getSessionUser } from '@/lib/auth/session';
import type { DashboardStats, AttendanceChartData, QuizChartData } from '@/types';

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session || session.role !== 'principal') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const today = new Date().toISOString().split('T')[0];
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Parallel fetch all required data
    const [
      teachersSnapshot,
      studentsSnapshot,
      mentorsSnapshot,
      todayAttendanceSnapshot,
      weekAttendanceSnapshot,
      leaveRequestsSnapshot,
      quizzesSnapshot,
      tasksSnapshot,
      eventsSnapshot,
    ] = await Promise.all([
      adminDb().collection('users').where('role', 'in', ['teacher', 'both']).get(),
      adminDb().collection('students').where('status', '==', 'active').get(),
      adminDb().collection('users').where('role', 'in', ['mentor', 'both']).get(),
      adminDb().collection('attendance').where('date', '==', today).get(),
      adminDb().collection('attendance').where('date', '>=', weekAgo).get(),
      adminDb().collection('leaveRequests').where('status', '==', 'pending').get(),
      adminDb().collection('quizzes').where('date', '==', today).get(),
      adminDb().collection('tasks').where('status', 'in', ['pending', 'in_progress']).get(),
      adminDb().collection('events').where('startDate', '>=', today).orderBy('startDate').limit(5).get(),
    ]);

    const teachers = teachersSnapshot.docs.map((d) => d.data());
    const students = studentsSnapshot.docs.map((d) => d.data());
    const mentors = mentorsSnapshot.docs.map((d) => d.data());
    const todayAttendance = todayAttendanceSnapshot.docs.map((d) => d.data());
    const weekAttendance = weekAttendanceSnapshot.docs.map((d) => d.data());
    const pendingLeaves = leaveRequestsSnapshot.docs.map((d) => d.data());
    const todayQuizzes = quizzesSnapshot.docs.map((d) => d.data());
    const pendingTasks = tasksSnapshot.docs.map((d) => d.data());
    const upcomingEvents = eventsSnapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

    // Calculate stats
    const presentToday = todayAttendance.filter((a: any) => a.status === 'present').length;
    const lateToday = todayAttendance.filter((a: any) => a.status === 'late').length;
    const absentToday = teachers.length - presentToday - lateToday;

    // Attendance chart data (last 7 days)
    const attendanceChartData: AttendanceChartData[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const dayAttendance = weekAttendance.filter((a: any) => a.date === date);
      attendanceChartData.push({
        date,
        present: dayAttendance.filter((a: any) => a.status === 'present').length,
        late: dayAttendance.filter((a: any) => a.status === 'late').length,
        absent: dayAttendance.filter((a: any) => a.status === 'absent').length,
      });
    }

    // Quiz performance by subject
    const subjectQuizzes = new Map<string, { total: number; sum: number; count: number }>();
    const allQuizzesSnapshot = await adminDb().collection('quizzes').get();
    allQuizzesSnapshot.docs.forEach((d) => {
      const q = d.data();
      const subject = q.subject || 'Unknown';
      const current = subjectQuizzes.get(subject) || { total: 0, sum: 0, count: 0 };
      current.total += 1;
      current.sum += q.classAverage || 0;
      current.count += 1;
      subjectQuizzes.set(subject, current);
    });

    const quizChartData: QuizChartData[] = Array.from(subjectQuizzes.entries()).map(([subject, data]) => ({
      subject,
      average: data.count > 0 ? Math.round(data.sum / data.count) : 0,
      quizCount: data.total,
    }));

    const stats: DashboardStats = {
      totalTeachers: teachers.length,
      totalStudents: students.length,
      totalMentors: mentors.length,
      presentToday,
      absentToday,
      lateToday,
      pendingLeaves: pendingLeaves.length,
      pendingApprovals: pendingLeaves.length,
      todayQuizzes: todayQuizzes.length,
      activeClasses: teachers.length, // Simplified
      pendingTasks: pendingTasks.length,
      upcomingEvents: upcomingEvents.length,
    };

    // Recent activity (from audit logs)
    const activitySnapshot = await adminDb()
      .collection('auditLogs')
      .orderBy('timestamp', 'desc')
      .limit(10)
      .get();
    const recentActivity = activitySnapshot.docs.map((d) => {
      const data = d.data();
      return { 
        id: d.id, 
        action: data.action,
        userName: data.userName || data.userId || 'Unknown',
        userRole: data.userRole || 'system',
        details: data.details || '',
        timestamp: data.timestamp
      };
    });

    return NextResponse.json({
      stats,
      attendanceChartData,
      quizChartData,
      recentActivity,
      upcomingEvents,
      pendingLeaves: pendingLeaves.slice(0, 5),
      todayAttendance: todayAttendance.slice(0, 10),
    });
  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}