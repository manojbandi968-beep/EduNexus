import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { getSessionUser } from '@/lib/auth/session';

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session || session.role !== 'principal') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const [
      teachersSnapshot,
      studentsSnapshot,
      mentorsSnapshot,
      attendanceSnapshot,
      mentorAttendanceSnapshot,
      quizzesSnapshot,
    ] = await Promise.all([
      adminDb().collection('users').where('role', 'in', ['teacher', 'both']).get(),
      adminDb().collection('students').where('status', '==', 'active').get(),
      adminDb().collection('users').where('role', 'in', ['mentor', 'both']).get(),
      adminDb().collection('attendance').get(),
      adminDb().collection('mentorAttendance').get(),
      adminDb().collection('quizzes').get(),
    ]);

    const teachersCount = teachersSnapshot.size;
    const studentsCount = studentsSnapshot.size;
    const mentorsCount = mentorsSnapshot.size;

    const attendanceRecords = attendanceSnapshot.docs.map(d => d.data());
    const mentorAttendanceRecords = mentorAttendanceSnapshot.docs.map(d => d.data());
    const quizzes = quizzesSnapshot.docs.map(d => d.data());

    // Calculate last 6 months
    const months = [];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        label: monthNames[d.getMonth()],
        year: d.getFullYear(),
        month: d.getMonth()
      });
    }

    // Process Attendance Trend
    let totalPresent = 0;
    let totalAttendanceRecords = attendanceRecords.length;
    
    const attendanceTrend = months.map(m => {
      const monthRecords = attendanceRecords.filter(r => {
        if (!r.date) return false;
        const d = new Date(r.date);
        return d.getMonth() === m.month && d.getFullYear() === m.year;
      });
      
      const present = monthRecords.filter(r => r.status === 'present').length;
      totalPresent += present;
      
      const rate = monthRecords.length > 0 ? Math.round((present / monthRecords.length) * 100) : 0;
      return { month: m.label, rate };
    });

    // Process Mentor Attendance Trend
    let totalMentorSessions = mentorAttendanceRecords.length;
    let totalStudyHours = mentorAttendanceRecords.reduce((acc, r) => acc + (r.duration || 120), 0) / 60; // fallback 120 mins if duration missing

    // Process Quiz Trend
    let totalQuizSum = 0;
    let totalQuizCount = 0;
    
    const quizTrend = months.map(m => {
      const monthQuizzes = quizzes.filter(q => {
        if (!q.date) return false;
        const d = new Date(q.date);
        return d.getMonth() === m.month && d.getFullYear() === m.year;
      });
      
      const sum = monthQuizzes.reduce((acc, q) => acc + (q.classAverage || 0), 0);
      const avg = monthQuizzes.length > 0 ? Math.round(sum / monthQuizzes.length) : 0;
      
      totalQuizSum += sum;
      totalQuizCount += monthQuizzes.length;
      
      return { month: m.label, avg };
    });

    const avgAttendance = totalAttendanceRecords > 0 ? Math.round((totalPresent / totalAttendanceRecords) * 100) : 0;
    const avgQuizScore = totalQuizCount > 0 ? Math.round(totalQuizSum / totalQuizCount) : 0;

    return NextResponse.json({
      stats: {
        avgAttendance,
        avgQuizScore,
        activeTeachers: teachersCount,
        totalStudents: studentsCount,
        totalMentors: mentorsCount,
        totalMentorSessions,
        totalStudyHours: Math.round(totalStudyHours),
      },
      attendanceTrend,
      quizTrend,
    });
  } catch (error) {
    console.error('Reports API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
