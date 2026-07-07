'use client';

// ============================================
// CollegeDost — Teacher Dashboard
// ============================================

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ClipboardCheck,
  Calendar,
  FileQuestion,
  Clock,
  MapPin,
  CheckCircle2,
  TrendingUp,
  Megaphone,
  ChevronRight,
  Timer,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatCard } from '@/components/ui/stat-card';
import { PageHeader } from '@/components/ui/page-header';
import { StreamBadge } from '@/components/ui/stream-badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { createDocument, COLLECTIONS } from '@/lib/firebase/firestore';
import { getSocket } from '@/lib/socket/client';
import { SOCKET_EVENTS } from '@/lib/socket/events';

// Mock data
const todaySchedule = [
  { period: 'Period 1', time: '7:00 - 8:00', subject: 'Mathematics', section: 'MPC-A', room: '101', status: 'completed' },
  { period: 'Period 3', time: '9:00 - 10:00', subject: 'Mathematics', section: 'MPC-B', room: '205', status: 'current' },
  { period: 'Period 5', time: '11:15 - 12:30', subject: 'Mathematics', section: 'MPC-C', room: '301', status: 'upcoming' },
  { period: 'Period 7', time: '2:30 - 3:30', subject: 'Mathematics', section: 'BiPC-A', room: '102', status: 'upcoming' },
];

const recentQuizzes = [
  { name: 'Calculus Test 5', section: 'MPC-A', date: 'Today', avg: 76, students: 58 },
  { name: 'Integration Quiz', section: 'MPC-B', date: 'Yesterday', avg: 72, students: 55 },
  { name: 'Matrices Test', section: 'MPC-C', date: '2 days ago', avg: 81, students: 60 },
];

const announcements = [
  { title: 'Staff Meeting Tomorrow', type: 'meeting', time: '2 hours ago' },
  { title: 'Mid-term Exam Schedule Released', type: 'exam', time: '1 day ago' },
];

export default function TeacherDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const [attendanceMarked, setAttendanceMarked] = useState(false);
  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? 'Good morning' : currentHour < 17 ? 'Good afternoon' : 'Good evening';

  const handleMarkAttendance = async () => {
    const checkInTime = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    const status = new Date().getHours() < 9 ? 'present' : 'late';
    const dateStr = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

    try {
      await createDocument(COLLECTIONS.ATTENDANCE, {
        teacherId: user?.uid || '',
        teacherName: user?.displayName || 'Unknown',
        email: user?.email || '',
        status,
        checkIn: checkInTime,
        date: dateStr,
        timestamp: new Date().toISOString(),
      });

      try {
        const socket = getSocket();
        socket.emit(SOCKET_EVENTS.ATTENDANCE_UPDATED, { teacherName: user?.displayName, status, time: checkInTime });
      } catch {
        // Socket is non-critical
      }

      setAttendanceMarked(true);
      toast.success('Attendance marked successfully! 🎉', {
        description: 'Location: Campus (within geofence)',
      });
    } catch (error) {
      console.error('Attendance error:', error);
      toast.error('Failed to mark attendance. Please try again.');
    }
  };

  const handleStartQuiz = () => {
    router.push('/teacher/quiz?create=true');
  };

  return (
    <DashboardLayout role="teacher">
      <div className="space-y-6 pb-20 lg:pb-8">
        {/* Header */}
        <PageHeader
          title={`${greeting}, ${user?.displayName?.split(' ')[0] || 'Teacher'}! 👋`}
          description="Here's your schedule and activity for today."
        />

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            title="My Attendance"
            value="96.2%"
            icon={<ClipboardCheck className="h-5 w-5 text-emerald-500" />}
            iconBg="bg-emerald-500/10"
            trend={{ value: 2.1, label: 'this month' }}
            delay={0}
            href="/teacher/attendance"
          />
          <StatCard
            title="Today's Classes"
            value={4}
            icon={<Calendar className="h-5 w-5 text-primary" />}
            iconBg="bg-primary/10"
            description="2 completed, 2 upcoming"
            delay={0.1}
            href="/teacher/timetable"
          />
          <StatCard
            title="Quizzes Done"
            value={28}
            icon={<FileQuestion className="h-5 w-5 text-amber-500" />}
            iconBg="bg-amber-500/10"
            trend={{ value: 8, label: 'this semester' }}
            delay={0.2}
            href="/teacher/quiz"
          />
          <StatCard
            title="Avg Quiz Score"
            value="76%"
            icon={<TrendingUp className="h-5 w-5 text-violet-500" />}
            iconBg="bg-violet-500/10"
            trend={{ value: 3.5, label: 'vs last month' }}
            delay={0.3}
            href="/teacher/quiz"
          />
        </div>

        {/* Attendance Button + Current Class */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* One-Tap Attendance */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <Card className={`glass-card border-0 ${attendanceMarked ? 'ring-2 ring-emerald-500/30' : ''}`}>
              <CardContent className="flex flex-col items-center gap-4 p-6">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleMarkAttendance}
                  disabled={attendanceMarked}
                  className={`attendance-btn flex h-28 w-28 flex-col items-center justify-center rounded-full shadow-xl transition-all ${
                    attendanceMarked
                      ? 'bg-emerald-500 shadow-emerald-500/30'
                      : 'gradient-primary shadow-primary/30 hover:shadow-2xl'
                  }`}
                >
                  {attendanceMarked ? (
                    <>
                      <CheckCircle2 className="h-10 w-10 text-white" />
                      <span className="mt-1 text-[10px] font-bold text-white/90">DONE</span>
                    </>
                  ) : (
                    <>
                      <ClipboardCheck className="h-10 w-10 text-white" />
                      <span className="mt-1 text-[10px] font-bold text-white/90">TAP</span>
                    </>
                  )}
                </motion.button>

                <div className="text-center">
                  <p className="text-sm font-semibold">
                    {attendanceMarked ? 'Attendance Recorded ✓' : 'Mark Attendance'}
                  </p>
                  <p className="mt-0.5 flex items-center justify-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    GPS Location Required
                  </p>
                  {attendanceMarked && (
                    <Badge className="mt-2 bg-emerald-500/10 text-emerald-600">
                      <Clock className="mr-1 h-3 w-3" />
                      {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} — Present
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Current / Next Class */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="glass-card border-0 ring-2 ring-primary/20">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  </span>
                  <CardTitle className="text-base">Current Class</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-xl bg-primary/5 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-lg font-bold">Mathematics</p>
                      <p className="text-sm text-muted-foreground">Period 3 · Room 205</p>
                    </div>
                    <StreamBadge stream="MPC" size="lg" />
                  </div>
                  <Separator className="my-3" />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Timer className="h-4 w-4" />
                      9:00 AM — 10:00 AM
                    </div>
                    <Badge variant="outline" className="border-primary/30 text-primary">
                      MPC-B
                    </Badge>
                  </div>
                </div>

                <Button onClick={handleStartQuiz} className="w-full gap-2 rounded-xl gradient-primary border-0 text-white">
                  <FileQuestion className="h-4 w-4" />
                  Start Quick Quiz
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Today's Schedule */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="glass-card border-0">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Calendar className="h-4 w-4 text-primary" />
                Today&apos;s Schedule
              </CardTitle>
              <CardDescription>Your classes for today</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {todaySchedule.map((cls, i) => (
                  <div
                    key={i}
                    onClick={() => router.push('/teacher/timetable')}
                    className={`flex items-center justify-between rounded-xl p-3 transition-colors cursor-pointer ${
                      cls.status === 'current'
                        ? 'bg-primary/5 ring-1 ring-primary/20'
                        : cls.status === 'completed'
                          ? 'bg-muted/30 opacity-60'
                          : 'bg-muted/30'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-xs font-bold text-primary">
                        {cls.period.replace('Period ', 'P')}
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{cls.subject}</p>
                        <p className="text-xs text-muted-foreground">
                          {cls.time} · Room {cls.room}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <StreamBadge stream="MPC" size="sm" />
                      <Badge
                        variant="outline"
                        className={
                          cls.status === 'current'
                            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600'
                            : cls.status === 'completed'
                              ? 'border-muted-foreground/30 text-muted-foreground'
                              : ''
                        }
                      >
                        {cls.status === 'current' ? '● Live' : cls.status === 'completed' ? '✓ Done' : cls.section}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>

              <Button variant="ghost" className="mt-3 w-full text-xs text-primary" onClick={() => router.push('/teacher/timetable')}>
                View Full Week →
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Quizzes + Announcements */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Recent Quizzes */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            <Card className="glass-card border-0">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileQuestion className="h-4 w-4 text-primary" />
                  Recent Quizzes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentQuizzes.map((quiz, i) => (
                    <div key={i} onClick={() => router.push('/teacher/quiz')} className="flex items-center justify-between rounded-xl bg-muted/30 p-3 cursor-pointer">
                      <div>
                        <p className="text-sm font-semibold">{quiz.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {quiz.section} · {quiz.date} · {quiz.students} students
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <p className="text-lg font-bold text-primary">{quiz.avg}%</p>
                          <p className="text-[10px] text-muted-foreground">Average</p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  ))}
                </div>

                <Button variant="ghost" className="mt-3 w-full text-xs text-primary" onClick={() => router.push('/teacher/quiz')}>
                  View All Quizzes →
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Announcements */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <Card className="glass-card border-0">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Megaphone className="h-4 w-4 text-primary" />
                  Announcements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {announcements.map((ann, i) => (
                    <div key={i} className="flex items-start gap-3 rounded-xl bg-muted/30 p-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <Megaphone className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{ann.title}</p>
                        <p className="text-xs text-muted-foreground">{ann.time}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Campus Map Quick Access */}
                <Separator className="my-4" />
                <div className="rounded-xl bg-gradient-to-r from-primary/5 to-primary/10 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                      <MapPin className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold">Campus Directions</p>
                      <p className="text-xs text-muted-foreground">Get navigation to campus</p>
                    </div>
                    <Button size="sm" variant="outline" className="rounded-lg text-xs" onClick={() => router.push('/teacher/campus')}>
                      Open Map
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
}
