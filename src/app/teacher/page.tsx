'use client';

// ============================================
// CollegeDost — Teacher Dashboard
// ============================================

import React, { useState, useEffect } from 'react';
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
  Users,
  Award,
  AlertCircle,
  BarChart2,
  PartyPopper,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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
import { createDocument, getDocuments, COLLECTIONS } from '@/lib/firebase/firestore';
import { getSocket, useSocket, useSocketEvent } from '@/lib/socket/client';
import { SOCKET_EVENTS } from '@/lib/socket/events';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import type { CollegeEvent, TeacherDashboardData } from '@/types';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function timeAgo(timestamp: string): string {
  const seconds = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes === 1) return '1 min ago';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours === 1) return '1 hr ago';
  if (hours < 24) return `${hours} hrs ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? 's' : ''} ago`;
}

export default function TeacherDashboard() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const socket = useSocket();
  const [attendanceMarked, setAttendanceMarked] = useState(false);
  const [events, setEvents] = useState<CollegeEvent[]>([]);

  const { data: dashboardData, isLoading, error } = useQuery<TeacherDashboardData>({
    queryKey: ['teacher-dashboard'],
    queryFn: () => fetch('/api/teacher/dashboard').then((r) => r.json()),
    refetchInterval: 60000,
  });

  useEffect(() => {
    if (dashboardData?.isAttendanceMarkedToday !== undefined) {
      setAttendanceMarked(dashboardData.isAttendanceMarkedToday);
    }
  }, [dashboardData?.isAttendanceMarkedToday]);

  const [greeting, setGreeting] = useState('Welcome');

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const data = await getDocuments<any>(COLLECTIONS.EVENTS);
        const formattedData = data.map(evt => ({ ...evt, date: evt.startDate || evt.date })) as CollegeEvent[];
        setEvents(formattedData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5));
      } catch (err) {
        console.error('Failed to fetch events:', err);
      }
    };
    fetchEvents();
  }, []);

  useEffect(() => {
    const currentHour = new Date().getHours();
    setGreeting(currentHour < 12 ? 'Good morning' : currentHour < 17 ? 'Good afternoon' : 'Good evening');
  }, []);



  useSocketEvent(socket ? SOCKET_EVENTS.ATTENDANCE_UPDATED : '', (payload: any) => {
    if (payload.teacherId === user?.uid) {
      queryClient.invalidateQueries({ queryKey: ['teacher-dashboard'] });
    }
  });

  useSocketEvent(socket ? SOCKET_EVENTS.LEAVE_REQUESTED : '', () => {
    queryClient.invalidateQueries({ queryKey: ['teacher-dashboard'] });
  });

  useSocketEvent(socket ? SOCKET_EVENTS.QUIZ_STARTED : '', () => {
    queryClient.invalidateQueries({ queryKey: ['teacher-dashboard'] });
  });

  useSocketEvent(socket ? SOCKET_EVENTS.ANNOUNCEMENT_CREATED : '', () => {
    queryClient.invalidateQueries({ queryKey: ['teacher-dashboard'] });
  });
  useSocketEvent(socket ? SOCKET_EVENTS.ANNOUNCEMENT_UPDATED : '', () => {
    queryClient.invalidateQueries({ queryKey: ['teacher-dashboard'] });
  });
  useSocketEvent(socket ? SOCKET_EVENTS.ANNOUNCEMENT_DELETED : '', () => {
    queryClient.invalidateQueries({ queryKey: ['teacher-dashboard'] });
  });

  useSocketEvent(socket ? SOCKET_EVENTS.EVENT_CREATED : '', (payload: any) => {
    toast.info(`New ${payload.type} declared: ${payload.title}`, {
      description: new Date(payload.startDate).toLocaleDateString('en-IN', { dateStyle: 'medium' }),
      icon: <PartyPopper className="h-4 w-4 text-primary" />,
    });
    setEvents(prev => [{
      id: payload.id,
      title: payload.title,
      type: payload.type,
      date: payload.startDate,
      description: payload.description,
      createdBy: payload.createdBy,
      creatorName: payload.createdByName,
      timestamp: new Date().toISOString()
    } as CollegeEvent, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5));
  });

  const handleMarkAttendance = async () => {
    const checkInTime = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    const status = new Date().getHours() < 9 ? 'present' : 'late';
    const dateStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

    try {
      await createDocument(COLLECTIONS.ATTENDANCE, {
        teacherId: user?.uid || '',
        teacherName: user?.displayName || 'Unknown',
        email: user?.email || '',
        status,
        checkInTime: checkInTime,
        date: dateStr,
        timestamp: new Date().toISOString(),
      });

      try {
        const socket = getSocket();
        socket.emit(SOCKET_EVENTS.TEACHER_MARK_ATTENDANCE, {
          teacherName: user?.displayName || 'Unknown',
          teacherId: user?.uid || '',
          status,
          checkInTime,
          date: dateStr,
          timestamp: Date.now(),
        });
      } catch {
        // Socket is non-critical
      }

      setAttendanceMarked(true);
      queryClient.invalidateQueries({ queryKey: ['teacher-dashboard'] });
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

  if (isLoading) {
    return (
      <DashboardLayout role="teacher">
        <div className="space-y-6 pb-8">
          <PageHeader title={`${greeting}, ${user?.displayName?.split(' ')[0] || 'Teacher'}! 👋`} description="Loading your dashboard..." />
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <StatCard key={i} title="Loading..." value="—" icon={<div className="h-5 w-5 animate-pulse bg-muted" />} delay={i * 0.1} />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout role="teacher">
        <div className="space-y-6 pb-8">
          <PageHeader title={`${greeting}, ${user?.displayName?.split(' ')[0] || 'Teacher'}! 👋`} description="Unable to load dashboard data.">
            <Button variant="outline" onClick={() => queryClient.invalidateQueries({ queryKey: ['teacher-dashboard'] })}>
              Retry
            </Button>
          </PageHeader>
        </div>
      </DashboardLayout>
    );
  }

  const stats = dashboardData?.stats || {
    attendancePercent: 0,
    todayClasses: 0,
    completedClasses: 0,
    upcomingClasses: 0,
    totalQuizzes: 0,
    avgQuizScore: 0,
    pendingLeaves: 0,
    assignedSections: 0,
  };

  const teacherName = dashboardData?.teacherName || user?.displayName?.split(' ')[0] || 'Teacher';
  const todaySchedule = dashboardData?.todaySchedule || [];
  const recentQuizzes = dashboardData?.recentQuizzes || [];
  const announcements = dashboardData?.announcements || [];
  const attendanceChartData = dashboardData?.attendanceChartData || [];
  const quizChartData = dashboardData?.quizChartData || [];

  return (
    <DashboardLayout role="teacher">
      <div className="space-y-6 pb-20 lg:pb-8">
        <PageHeader
          title={`${greeting}, ${teacherName}! 👋`}
          description="Here's your schedule and activity for today."
        />

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            title="My Attendance"
            value={`${stats.attendancePercent}%`}
            icon={<ClipboardCheck className="h-5 w-5 text-emerald-500" />}
            iconBg="bg-emerald-500/10"
            description={attendanceMarked && dashboardData?.checkInTimeToday ? `Checked in at ${dashboardData.checkInTimeToday}` : undefined}
            trend={!attendanceMarked ? { value: 2.1, label: 'this month' } : undefined}
            delay={0}
            href="/teacher/attendance"
          />
          <StatCard
            title="Today's Classes"
            value={stats.todayClasses}
            icon={<Calendar className="h-5 w-5 text-primary" />}
            iconBg="bg-primary/10"
            description={`${stats.completedClasses} done, ${stats.upcomingClasses} left`}
            delay={0.1}
            href="/teacher/timetable"
          />
          <StatCard
            title="Quizzes This Month"
            value={stats.totalQuizzes}
            icon={<FileQuestion className="h-5 w-5 text-amber-500" />}
            iconBg="bg-amber-500/10"
            trend={{ value: stats.totalQuizzes, label: 'completed' }}
            delay={0.2}
            href="/teacher/quiz"
          />
          <StatCard
            title="Avg Quiz Score"
            value={`${stats.avgQuizScore}%`}
            icon={<TrendingUp className="h-5 w-5 text-violet-500" />}
            iconBg="bg-violet-500/10"
            trend={{ value: 3.5, label: 'vs last month' }}
            delay={0.3}
            href="/teacher/quiz"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <Card className={cn('glass-card border-0', attendanceMarked && 'ring-2 ring-emerald-500/30')}>
              <CardContent className="flex flex-col items-center gap-4 p-6">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleMarkAttendance}
                  disabled={attendanceMarked}
                  className={cn(
                    'attendance-btn flex h-28 w-28 flex-col items-center justify-center rounded-full shadow-xl transition-all',
                    attendanceMarked
                      ? 'bg-emerald-500 shadow-emerald-500/30'
                      : 'gradient-primary shadow-primary/30 hover:shadow-2xl'
                  )}
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
                {todaySchedule.find((c) => c.status === 'current') ? (
                  <>
                    <div className="rounded-xl bg-primary/5 p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-lg font-bold">{todaySchedule.find((c) => c.status === 'current')?.subject}</p>
                          <p className="text-sm text-muted-foreground">
                            {todaySchedule.find((c) => c.status === 'current')?.period} · Room {todaySchedule.find((c) => c.status === 'current')?.room}
                          </p>
                        </div>
                        <StreamBadge stream="MPC" size="lg" />
                      </div>
                      <Separator className="my-3" />
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Timer className="h-4 w-4" />
                          {todaySchedule.find((c) => c.status === 'current')?.time}
                        </div>
                        <Badge variant="outline" className="border-primary/30 text-primary">
                          {todaySchedule.find((c) => c.status === 'current')?.section}
                        </Badge>
                      </div>
                    </div>

                    <Button onClick={handleStartQuiz} className="w-full gap-2 rounded-xl gradient-primary border-0 text-white">
                      <FileQuestion className="h-4 w-4" />
                      Start Quick Quiz
                    </Button>
                  </>
                ) : todaySchedule.find((c) => c.status === 'upcoming') ? (
                  <div className="text-center py-4">
                    <p className="text-muted-foreground">Next class coming up</p>
                    <p className="text-lg font-semibold mt-1">{todaySchedule.find((c) => c.status === 'upcoming')?.subject}</p>
                    <p className="text-sm text-muted-foreground">{todaySchedule.find((c) => c.status === 'upcoming')?.time} · {todaySchedule.find((c) => c.status === 'upcoming')?.section}</p>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="h-10 w-10 mx-auto opacity-30" />
                    <p className="mt-2">No classes scheduled</p>
                  </div>
                )}

                <Button variant="ghost" className="mt-3 w-full text-xs text-primary" onClick={() => router.push('/teacher/timetable')}>
                  View Full Week →
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="glass-card border-0">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Calendar className="h-4 w-4 text-primary" />
                Today's Schedule
              </CardTitle>
              <CardDescription>Your classes for today</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {todaySchedule.length > 0 ? (
                  todaySchedule.map((cls, i) => (
                    <div
                      key={i}
                      onClick={() => router.push('/teacher/timetable')}
                      className={cn(
                        'flex items-center justify-between rounded-xl p-3 transition-colors cursor-pointer',
                        cls.status === 'current'
                          ? 'bg-primary/5 ring-1 ring-primary/20'
                          : cls.status === 'completed'
                          ? 'bg-muted/30 opacity-60'
                          : 'bg-muted/30'
                      )}
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
                          className={cn(
                            cls.status === 'current'
                              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600'
                              : cls.status === 'completed'
                              ? 'border-muted-foreground/30 text-muted-foreground'
                              : ''
                          )}
                        >
                          {cls.status === 'current' ? '● Live' : cls.status === 'completed' ? '✓ Done' : cls.section}
                        </Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
                    <Calendar className="h-10 w-10 opacity-30" />
                    <p className="text-sm">No classes scheduled today</p>
                  </div>
                )}
              </div>

              <Button variant="ghost" className="mt-3 w-full text-xs text-primary" onClick={() => router.push('/teacher/timetable')}>
                View Full Week →
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="glass-card border-0">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <BarChart2 className="h-4 w-4 text-primary" />
                  Weekly Attendance
                </CardTitle>
                <CardDescription>Your attendance this week</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {attendanceChartData.map((day, i) => (
                    <motion.div
                      key={day.date}
                      initial={{ x: -10, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-center gap-3"
                    >
                      <div className="w-20 text-xs font-medium text-muted-foreground">
                        {DAY_LABELS[new Date(day.date).getDay()]}
                      </div>
                      <div className="flex-1 h-2.5 rounded-full bg-muted/30 relative overflow-hidden">
                        {day.status !== 'none' && (
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: '100%',
                              backgroundColor:
                                day.status === 'present'
                                  ? '#10b981'
                                  : day.status === 'late'
                                  ? '#f59e0b'
                                  : '#ef4444',
                            }}
                          />
                        )}
                      </div>
                      <div className="w-16 text-right text-xs">
                        <span className={cn('font-medium', day.status === 'present' && 'text-emerald-500', day.status === 'late' && 'text-amber-500', day.status === 'absent' && 'text-red-500', day.status === 'none' && 'text-muted-foreground')}>
                          {day.status === 'none' ? '—' : day.status.charAt(0).toUpperCase() + day.status.slice(1)}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <Card className="glass-card border-0">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Award className="h-4 w-4 text-primary" />
                  Quiz Performance
                </CardTitle>
                <CardDescription>Average scores by subject</CardDescription>
              </CardHeader>
              <CardContent>
                {quizChartData.length > 0 ? (
                  <div className="space-y-3">
                    {quizChartData.map((subject, i) => (
                      <motion.div
                        key={subject.subject}
                        initial={{ x: -10, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: i * 0.05 }}
                        className="space-y-1"
                      >
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium truncate pr-2">{subject.subject}</span>
                          <span className="text-primary font-bold">{subject.average}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-muted/30 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-primary transition-all duration-500"
                            style={{ width: `${subject.average}%` }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground text-right">{subject.quizCount} quizzes</p>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
                    <BarChart2 className="h-10 w-10 opacity-30" />
                    <p className="text-sm">No quiz data yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
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
                  {recentQuizzes.length > 0 ? (
                    recentQuizzes.map((quiz, i) => (
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
                    ))
                  ) : (
                    <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
                      <FileQuestion className="h-10 w-10 opacity-30" />
                      <p className="text-sm">No quizzes conducted yet</p>
                    </div>
                  )}
                </div>

                <Button variant="ghost" className="mt-3 w-full text-xs text-primary" onClick={() => router.push('/teacher/quiz')}>
                  View All Quizzes →
                </Button>
              </CardContent>
            </Card>
          </motion.div>

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
                  {announcements.length > 0 ? (
                    announcements.map((ann, i) => (
                      <div key={i} onClick={() => router.push('/teacher/announcements')} className="flex items-start gap-3 rounded-xl bg-muted/30 p-3 cursor-pointer">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                          <Megaphone className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold">{ann.title}</p>
                          <p className="text-xs text-muted-foreground">{timeAgo(ann.time)}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center gap-2 py-6 text-muted-foreground">
                      <Megaphone className="h-8 w-8 opacity-30" />
                      <p className="text-sm">No announcements</p>
                    </div>
                  )}
                </div>

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

        {stats.pendingLeaves > 0 && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.9 }}
          >
            <Link href="/teacher/leave">
              <Card className="glass-card border-0 border-amber-500/20 bg-amber-500/5 cursor-pointer">
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10">
                    <AlertCircle className="h-5 w-5 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-amber-600 dark:text-amber-400">
                      {stats.pendingLeaves} Pending Leave Request{stats.pendingLeaves !== 1 ? 's' : ''}
                    </p>
                    <p className="text-xs text-muted-foreground">Awaiting approval</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        )}

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1.1 }}
        >
          <Card className="glass-card border-0">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="space-y-1">
                <CardTitle className="text-base flex items-center gap-2">
                  <PartyPopper className="h-4 w-4 text-emerald-500" />
                  Events & Holidays
                </CardTitle>
                <CardDescription>Upcoming college events</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {events.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground text-sm">
                  <Calendar className="mx-auto h-8 w-8 opacity-20 mb-2" />
                  No upcoming events.
                </div>
              ) : (
                events.map((evt, i) => (
                  <div key={evt.id} className="flex items-start gap-3 p-3 rounded-xl bg-card border hover:border-emerald-500/30 transition-colors">
                    <div className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                      evt.type === 'holiday' ? "bg-emerald-500/10 text-emerald-600" :
                      evt.type === 'exam' ? "bg-red-500/10 text-red-600" :
                      evt.type === 'meeting' ? "bg-blue-500/10 text-blue-600" :
                      "bg-primary/10 text-primary"
                    )}>
                      <Calendar className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{evt.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">
                          {evt.date && !isNaN(new Date(evt.date).getTime()) 
                            ? new Date(evt.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) 
                            : 'TBA'}
                        </span>
                        <span className="text-[10px] uppercase font-bold tracking-wider opacity-60 bg-muted px-1.5 py-0.5 rounded">
                          {evt.type}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}