import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { getSessionUser } from '@/lib/auth/session';
import type { TeacherDashboardData, TeacherDashboardStats } from '@/types';

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session || (session.role !== 'teacher' && session.role !== 'both')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const getLocalTime = (offsetMs = 0) => {
      const d = new Date(Date.now() - offsetMs);
      return d.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    };

    const today = getLocalTime(0);
    const weekAgo = getLocalTime(7 * 24 * 60 * 60 * 1000);
    const monthAgo = getLocalTime(30 * 24 * 60 * 60 * 1000);

    const [
      teacherDoc,
      attendanceSnapshot,
      weekAttendanceSnapshot,
      quizzesSnapshot,
      monthQuizzesSnapshot,
      leaveSnapshot,
      sectionsSnapshot,
    ] = await Promise.all([
      adminDb().collection('users').doc(session.uid).get(),
      adminDb().collection('attendance').where('teacherId', '==', session.uid).where('date', '==', today).get(),
      adminDb().collection('attendance').where('teacherId', '==', session.uid).where('date', '>=', weekAgo).get(),
      adminDb().collection('quizzes').where('teacherId', '==', session.uid).where('date', '==', today).get(),
      adminDb().collection('quizzes').where('teacherId', '==', session.uid).where('date', '>=', monthAgo).get(),
      adminDb().collection('leaveRequests').where('teacherId', '==', session.uid).where('status', '==', 'pending').get(),
      adminDb().collection('sections').where('teacherIds', 'array-contains', session.uid).get(),
    ]);

    const teacherData = teacherDoc.data();
    const teacherName = teacherData?.fullName || teacherData?.displayName || 'Teacher';
    const assignedSections = sectionsSnapshot.docs.map((d) => d.data().name);

    const todayAttendance = attendanceSnapshot.docs.map((d) => d.data());
    const weekAttendance = weekAttendanceSnapshot.docs.map((d) => d.data());
    const todayQuizzes = quizzesSnapshot.docs.map((d) => d.data());
    const monthQuizzes = monthQuizzesSnapshot.docs.map((d) => d.data());
    const pendingLeaves = leaveSnapshot.docs.map((d) => d.data());

    // Calculate stats
    const totalClassesToday = todayAttendance.length;
    const presentToday = todayAttendance.filter((a: any) => a.status === 'present').length;
    const lateToday = todayAttendance.filter((a: any) => a.status === 'late').length;
    const attendancePercent = totalClassesToday > 0 ? Math.round(((presentToday + lateToday) / totalClassesToday) * 100) : 0;

    const completedToday = todayAttendance.filter((a: any) => a.status !== 'none').length;
    const upcomingToday = Math.max(0, (teacherData?.assignedSections?.length || 4) - completedToday);

    const totalMonthQuizzes = monthQuizzes.length;
    const avgQuizScore = totalMonthQuizzes > 0
      ? Math.round(monthQuizzes.reduce((sum, q) => sum + (q.classAverage || 0), 0) / totalMonthQuizzes)
      : 0;

    const stats: TeacherDashboardStats = {
      attendancePercent,
      todayClasses: totalClassesToday,
      completedClasses: completedToday,
      upcomingClasses: upcomingToday,
      totalQuizzes: totalMonthQuizzes,
      avgQuizScore,
      pendingLeaves: pendingLeaves.length,
      assignedSections: assignedSections.length,
    };

    // Attendance chart data (last 7 days)
    const attendanceChartData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const dayAttendance = weekAttendance.find((a: any) => a.date === date);
      let status: 'present' | 'late' | 'absent' | 'none' = 'none';
      if (dayAttendance) {
        if (dayAttendance.status === 'present') status = 'present';
        else if (dayAttendance.status === 'late') status = 'late';
        else status = 'absent';
      }
      attendanceChartData.push({ date, status });
    }

    // Quiz chart data by subject
    const subjectQuizzes = new Map<string, { total: number; sum: number; count: number }>();
    const allQuizzesSnapshot = await adminDb().collection('quizzes').where('teacherId', '==', session.uid).get();
    allQuizzesSnapshot.docs.forEach((d) => {
      const q = d.data();
      const subject = q.subject || 'Unknown';
      const current = subjectQuizzes.get(subject) || { total: 0, sum: 0, count: 0 };
      current.total += 1;
      current.sum += q.classAverage || 0;
      current.count += 1;
      subjectQuizzes.set(subject, current);
    });

    const quizChartData = Array.from(subjectQuizzes.entries()).map(([subject, data]) => ({
      subject,
      average: data.count > 0 ? Math.round(data.sum / data.count) : 0,
      quizCount: data.total,
    }));

    // Today's schedule from timetable
    const timetableSnapshot = await adminDb().collection('timetables').where('isActive', '==', true).get();
    const activeTimetable = timetableSnapshot.docs[0]?.data();
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const todayDay = days[new Date().getDay()].substring(0, 3);
    const todayEntries = activeTimetable?.entries?.filter((e: any) =>
      e.dayOfWeek === todayDay
    ) || [];

    const todaySchedule = todayEntries
      .filter((e: any) => e.teacherId === session.uid)
      .sort((a: any, b: any) => a.timeSlotId.localeCompare(b.timeSlotId))
      .map((entry: any) => {
        const timeSlot = DEFAULT_SCHEDULE.find((s) => s.id === entry.timeSlotId);
        return {
          period: timeSlot?.label || entry.timeSlotId,
          time: `${timeSlot?.startTime || ''} - ${timeSlot?.endTime || ''}`,
          subject: entry.subjectId,
          section: entry.sectionId,
          room: entry.roomNumber || 'TBA',
          status: 'upcoming' as const,
        };
      });

    // Recent quizzes
    const recentQuizzes = monthQuizzes
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5)
      .map((q) => ({
        name: q.name,
        section: q.sectionId,
        date: q.date === today ? 'Today' : new Date(q.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
        avg: q.classAverage || 0,
        students: q.totalStudents || 0,
      }));

    // Announcements
    const announcementsSnapshot = await adminDb()
      .collection('announcements')
      .where('targetRoles', 'array-contains', 'teacher')
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

    const isAttendanceMarkedToday = todayAttendance.length > 0;
    const checkInTimeToday = todayAttendance.length > 0 ? (todayAttendance[0].checkInTime || todayAttendance[0].checkIn) : null;

    return NextResponse.json({
      stats,
      attendanceChartData,
      quizChartData,
      todaySchedule,
      recentQuizzes,
      announcements,
      teacherName,
      isAttendanceMarkedToday,
      checkInTimeToday,
    } as TeacherDashboardData);
  } catch (error) {
    console.error('Teacher Dashboard API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

const DEFAULT_SCHEDULE = [
  { id: 'p1', label: 'Period 1', startTime: '07:00', endTime: '08:00' },
  { id: 'p2', label: 'Period 2', startTime: '08:00', endTime: '09:00' },
  { id: 'p3', label: 'Period 3', startTime: '09:00', endTime: '10:00' },
  { id: 'p4', label: 'Period 4', startTime: '10:00', endTime: '11:00' },
  { id: 'brk', label: 'Break', startTime: '11:00', endTime: '11:15' },
  { id: 'p5', label: 'Period 5', startTime: '11:15', endTime: '12:30' },
  { id: 'lunch', label: 'Lunch', startTime: '12:30', endTime: '13:30' },
  { id: 'p6', label: 'Period 6', startTime: '13:30', endTime: '14:30' },
  { id: 'p7', label: 'Period 7', startTime: '14:30', endTime: '15:30' },
  { id: 'p8', label: 'Period 8', startTime: '15:30', endTime: '16:30' },
];