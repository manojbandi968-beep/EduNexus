'use client';

// ============================================
// CollegeDost — Mentor Dashboard
// ============================================

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  BookOpen,
  Clock,
  Users,
  CheckCircle2,
  FileText,
  Megaphone,
  Timer,
  PenLine,
  Calendar,
  ClipboardCheck,
  TrendingUp,
  Target,
  Award,
  BarChart2,
  PartyPopper
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatCard } from '@/components/ui/stat-card';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { createDocument, getDocuments, COLLECTIONS } from '@/lib/firebase/firestore';
import { getSocket, useSocket, useSocketEvent } from '@/lib/socket/client';
import { SOCKET_EVENTS } from '@/lib/socket/events';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import type { CollegeEvent } from '@/types';

interface MentorDashboardData {
  stats: {
    sessionsThisMonth: number;
    avgStudentsPerSession: number;
    totalHours: number;
    doubtsCleared: number;
    attendanceRate: number;
    currentStreak: number;
  };
  attendanceChartData: {
    date: string;
    studyHour: 1 | 2;
    checkedIn: boolean;
    topic?: string;
    studentCount?: number;
  }[];
  upcomingSessions: {
    studyHour: 1 | 2;
    time: string;
    isCurrent: boolean;
    isUpcoming: boolean;
  }[];
  previousSessions: {
    date: string;
    studyHour: 1 | 2;
    topic: string;
    students: number;
    duration: number;
    notes: string;
  }[];
  announcements: {
    title: string;
    type: string;
    time: string;
  }[];
  assignedBatches: string[];
  mentorName: string;
}

function timeAgo(timestamp: string): string {
  if (!timestamp) return 'Unknown';
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

export default function MentorDashboard() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const socket = useSocket();
  const [checkedIn, setCheckedIn] = useState<{ 1: boolean; 2: boolean }>({ 1: false, 2: false });
  const [sessionForm, setSessionForm] = useState({
    topic: '',
    notes: '',
    studentCount: '',
  });
  const [events, setEvents] = useState<CollegeEvent[]>([]);

  React.useEffect(() => {
    const fetchEvents = async () => {
      try {
        const data = await getDocuments<CollegeEvent>(COLLECTIONS.EVENTS);
        setEvents(data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5));
      } catch (err) {
        console.error('Failed to fetch events:', err);
      }
    };
    fetchEvents();
  }, []);

  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? 'Good morning' : currentHour < 17 ? 'Good afternoon' : 'Good evening';

  const { data: dashboardData, isLoading, error } = useQuery<MentorDashboardData>({
    queryKey: ['mentor-dashboard'],
    queryFn: () => fetch('/api/mentor/dashboard').then((r) => r.json()),
    refetchInterval: 60000,
  });

  // Real-time socket events
  useSocketEvent(socket ? SOCKET_EVENTS.SESSION_LOGGED : '', (payload: any) => {
    if (payload.mentorId === user?.uid) {
      queryClient.invalidateQueries({ queryKey: ['mentor-dashboard'] });
    }
  });

  useSocketEvent(socket ? SOCKET_EVENTS.ANNOUNCEMENT_CREATED : '', () => {
    queryClient.invalidateQueries({ queryKey: ['mentor-dashboard'] });
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

  if (isLoading) {
    return (
      <DashboardLayout role="mentor">
        <div className="space-y-6 pb-8">
          <PageHeader title={`${greeting}, ${user?.displayName?.split(' ')[0] || 'Mentor'}! 📚`} description="Loading your dashboard..." />
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
      <DashboardLayout role="mentor">
        <div className="space-y-6 pb-8">
          <PageHeader title={`${greeting}, ${user?.displayName?.split(' ')[0] || 'Mentor'}! 📚`} description="Unable to load dashboard data.">
            <Button variant="outline" onClick={() => queryClient.invalidateQueries({ queryKey: ['mentor-dashboard'] })}>
              Retry
            </Button>
          </PageHeader>
        </div>
      </DashboardLayout>
    );
  }

  const stats = dashboardData?.stats || {
    sessionsThisMonth: 0,
    avgStudentsPerSession: 0,
    totalHours: 0,
    doubtsCleared: 0,
    attendanceRate: 0,
    currentStreak: 0,
  };

  const mentorName = dashboardData?.mentorName || user?.displayName || 'Mentor';
  const upcomingSessions = dashboardData?.upcomingSessions || [];
  const previousSessions = dashboardData?.previousSessions || [];
  const announcements = dashboardData?.announcements || [];
  const assignedBatches = dashboardData?.assignedBatches || [];
  const attendanceChartData = dashboardData?.attendanceChartData || [];

  // Determine current study hour state
  const isStudyHour1 = currentHour >= 17 && currentHour < 20;
  const isStudyHour2 = currentHour >= 20 && currentHour < 22;
  const currentStudyHour = isStudyHour1 ? 1 : isStudyHour2 ? 2 : null;

  const handleCheckIn = async (studyHour: 1 | 2) => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    toast.info('Verifying location...', { id: 'location-toast' });

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const COLLEGE_LAT = 17.3850;
        const COLLEGE_LNG = 78.4867;
        const distance = Math.sqrt(Math.pow(latitude - COLLEGE_LAT, 2) + Math.pow(longitude - COLLEGE_LNG, 2));
        const isInsideCollege = distance < 0.05;

        toast.dismiss('location-toast');

        const checkInTime = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
        const dateStr = new Date().toLocaleDateString('en-CA');

        try {
          await createDocument(COLLECTIONS.MENTOR_ATTENDANCE, {
            mentorId: user?.uid || '',
            mentorName: user?.displayName || 'Unknown',
            email: user?.email || '',
            studyHour,
            checkIn: checkInTime,
            date: dateStr,
            location: { lat: latitude, lng: longitude },
            inCollege: isInsideCollege,
            timestamp: new Date().toISOString(),
          });

          await createDocument(COLLECTIONS.AUDIT_LOGS, {
            action: 'attendance',
            userId: user?.uid || '',
            userName: user?.displayName || 'Unknown',
            userRole: 'mentor',
            details: `Checked in for Study Hour ${studyHour} (${isInsideCollege ? 'In Campus' : 'Off Campus'})`,
            timestamp: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });

          try {
            const socket = getSocket();
            socket.emit(SOCKET_EVENTS.TEACHER_MARK_ATTENDANCE, {
              teacherName: user?.displayName || 'Unknown',
              teacherId: user?.uid || '',
              status: 'present',
              checkInTime,
              date: dateStr,
              timestamp: Date.now(),
              location: { lat: latitude, lng: longitude },
              inCollege: isInsideCollege,
            });
          } catch {
            // Socket is non-critical
          }

          setCheckedIn(prev => ({ ...prev, [studyHour]: true }));
          queryClient.invalidateQueries({ queryKey: ['mentor-dashboard'] });
          toast.success(`Checked in for Study Hour ${studyHour}!`, {
            description: `Session started at ${checkInTime} · ${isInsideCollege ? 'In Campus' : 'Off Campus'}`,
          });
        } catch (error) {
          console.error('Check-in error:', error);
          toast.error('Failed to check in. Please try again.');
        }
      },
      (error) => {
        toast.dismiss('location-toast');
        toast.error('Location access denied. Cannot check in.');
      }
    );
  };

  const handleLogSession = () => {
    if (!sessionForm.topic || !sessionForm.studentCount) {
      toast.error('Please fill in topic and student count');
      return;
    }
    
    const socket = getSocket();
    if (socket) {
      socket.emit(SOCKET_EVENTS.TEACHER_LOG_SESSION, {
        mentorId: user?.uid || 'unknown',
        mentorName: user?.displayName || 'Mentor',
        studyHour: 1, // Or get from state if applicable
        topic: sessionForm.topic,
        notes: sessionForm.notes,
        studentCount: parseInt(sessionForm.studentCount) || 0,
        date: new Date().toISOString().split('T')[0],
        checkInTime: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        timestamp: Date.now()
      });
    }
    
    toast.success('Session logged successfully! 📝');
    setSessionForm({ topic: '', notes: '', studentCount: '' });
  };

  return (
    <DashboardLayout role="mentor">
      <div className="space-y-6 pb-20 lg:pb-8">
        {/* Header */}
        <PageHeader
          title={`${greeting}, ${mentorName}! 📚`}
          description="Manage study hours and track student progress."
        />

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            title="Sessions This Month"
            value={stats.sessionsThisMonth}
            icon={<BookOpen className="h-5 w-5 text-primary" />}
            iconBg="bg-primary/10"
            trend={{ value: stats.currentStreak, label: 'day streak' }}
            delay={0}
            href="/mentor/attendance"
          />
          <StatCard
            title="Avg Students/Session"
            value={stats.avgStudentsPerSession}
            icon={<Users className="h-5 w-5 text-emerald-500" />}
            iconBg="bg-emerald-500/10"
            description="per session"
            delay={0.1}
            href="/mentor/attendance"
          />
          <StatCard
            title="Total Hours"
            value={`${stats.totalHours}h`}
            icon={<Clock className="h-5 w-5 text-amber-500" />}
            iconBg="bg-amber-500/10"
            delay={0.2}
            href="/mentor/attendance"
          />
          <StatCard
            title="Doubts Cleared"
            value={stats.doubtsCleared}
            icon={<FileText className="h-5 w-5 text-violet-500" />}
            iconBg="bg-violet-500/10"
            description="this month"
            delay={0.3}
            href="/mentor/attendance"
          />
        </div>

        {/* Check-In Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Study Hour 1 */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <Card className={cn('glass-card border-0', currentStudyHour === 1 && 'ring-2 ring-primary/30')}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Timer className="h-4 w-4 text-primary" />
                    Study Hour 1
                  </CardTitle>
                  {currentStudyHour === 1 && (
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                    </span>
                  )}
                </div>
                <CardDescription>5:30 PM — 7:30 PM</CardDescription>
              </CardHeader>
              <CardContent>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleCheckIn(1)}
                  disabled={checkedIn[1]}
                  className={cn(
                    'w-full rounded-xl px-4 py-3 text-sm font-semibold shadow-lg transition-all',
                    checkedIn[1]
                      ? 'bg-emerald-500 text-white shadow-emerald-500/25'
                      : 'gradient-primary text-white shadow-primary/25 hover:shadow-xl'
                  )}
                >
                  {checkedIn[1] ? (
                    <span className="flex items-center justify-center gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      Checked In ✓
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <ClipboardCheck className="h-4 w-4" />
                      Check In
                    </span>
                  )}
                </motion.button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Study Hour 2 */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <Card className={cn('glass-card border-0', currentStudyHour === 2 && 'ring-2 ring-primary/30')}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Timer className="h-4 w-4 text-amber-500" />
                    Study Hour 2
                  </CardTitle>
                  {currentStudyHour === 2 && (
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                    </span>
                  )}
                </div>
                <CardDescription>8:30 PM — 10:00 PM</CardDescription>
              </CardHeader>
              <CardContent>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleCheckIn(2)}
                  disabled={checkedIn[2]}
                  className={cn(
                    'w-full rounded-xl px-4 py-3 text-sm font-semibold shadow-lg transition-all',
                    checkedIn[2]
                      ? 'bg-emerald-500 text-white shadow-emerald-500/25'
                      : 'gradient-cec text-white shadow-amber-500/25 hover:shadow-xl'
                  )}
                >
                  {checkedIn[2] ? (
                    <span className="flex items-center justify-center gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      Checked In ✓
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <ClipboardCheck className="h-4 w-4" />
                      Check In
                    </span>
                  )}
                </motion.button>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Session Log Form */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="glass-card border-0">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <PenLine className="h-4 w-4 text-primary" />
                Log Study Session
              </CardTitle>
              <CardDescription>Record today's study hour details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="topic" className="text-sm">
                    Topic Covered
                  </Label>
                  <Input
                    id="topic"
                    placeholder="e.g., Organic Chemistry - Alkenes"
                    value={sessionForm.topic}
                    onChange={(e) => setSessionForm({ ...sessionForm, topic: e.target.value })}
                    className="rounded-xl bg-background/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="students" className="text-sm">
                    Number of Students
                  </Label>
                  <Input
                    id="students"
                    type="number"
                    placeholder="e.g., 45"
                    value={sessionForm.studentCount}
                    onChange={(e) =>
                      setSessionForm({ ...sessionForm, studentCount: e.target.value })
                    }
                    className="rounded-xl bg-background/50"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="notes" className="text-sm">
                    Notes / Observations
                  </Label>
                  <Textarea
                    id="notes"
                    placeholder="Any observations, doubts raised, students needing extra help..."
                    value={sessionForm.notes}
                    onChange={(e) => setSessionForm({ ...sessionForm, notes: e.target.value })}
                    className="rounded-xl bg-background/50"
                    rows={3}
                  />
                </div>
              </div>

              <Button
                onClick={handleLogSession}
                className="mt-4 w-full gap-2 rounded-xl gradient-primary border-0 text-white sm:w-auto"
              >
                <CheckCircle2 className="h-4 w-4" />
                Save Session Log
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Previous Sessions + Announcements */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Previous Sessions */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="lg:col-span-2"
          >
            <Card className="glass-card border-0">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Calendar className="h-4 w-4 text-primary" />
                  Previous Sessions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {previousSessions.length > 0 ? (
                    previousSessions.map((session, i) => (
                      <div
                        key={i}
                        onClick={() => router.push('/mentor/attendance')}
                        className="rounded-xl bg-muted/30 p-4 cursor-pointer"
                      >
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <p className="text-sm font-semibold">{session.topic}</p>
                            <p className="text-xs text-muted-foreground">
                              {session.date} · Study Hour {session.studyHour} · {session.duration} min
                            </p>
                          </div>
                          <Badge variant="outline" className="shrink-0">
                            <Users className="mr-1 h-3 w-3" />
                            {session.students}
                          </Badge>
                        </div>
                        {session.notes && (
                          <p className="mt-2 rounded-lg bg-background/50 p-2 text-xs text-muted-foreground">
                            📝 {session.notes}
                          </p>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
                      <Calendar className="h-10 w-10 opacity-30" />
                      <p className="text-sm">No previous sessions</p>
                    </div>
                  )}
                </div>

                <Button variant="ghost" className="mt-3 w-full text-xs text-primary" onClick={() => router.push('/mentor/attendance')}>
                  View All Sessions →
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
                  {announcements.length > 0 ? (
                    announcements.map((ann, i) => (
                      <div
                        key={i}
                        onClick={() => router.push('/mentor/announcements')}
                        className="flex items-start gap-3 rounded-xl bg-muted/30 p-3 cursor-pointer"
                      >
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

                {/* Assigned Batches */}
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Assigned Batches
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {assignedBatches.length > 0 ? (
                      assignedBatches.map((batch) => (
                        <Badge key={batch} variant="outline" className="rounded-lg">
                          {batch}
                        </Badge>
                      ))
                    ) : (
                      <Badge variant="outline" className="rounded-lg">
                        No batches assigned
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Attendance Rate Card */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.9 }}
        >
          <Card className="glass-card border-0">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Target className="h-4 w-4 text-emerald-500" />
                Attendance Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <div className="text-center">
                  <p className="text-3xl font-bold text-emerald-600">{stats.attendanceRate}%</p>
                  <p className="text-xs text-muted-foreground">Monthly Rate</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-primary">{stats.currentStreak}</p>
                  <p className="text-xs text-muted-foreground">Day Streak</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-amber-500">{stats.sessionsThisMonth}</p>
                  <p className="text-xs text-muted-foreground">Sessions Done</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-violet-500">{stats.doubtsCleared}</p>
                  <p className="text-xs text-muted-foreground">Doubts Cleared</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Weekly Attendance Chart */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1.0 }}
        >
          <Card className="glass-card border-0">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <BarChart2 className="h-4 w-4 text-primary" />
                Weekly Study Hours Attendance
              </CardTitle>
              <CardDescription>Your check-in status for the past week</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-around h-48 px-2">
                {attendanceChartData.map((day, i) => (
                  <div key={day.date} className="flex flex-col items-center gap-2 flex-1">
                    <div className="flex gap-1 h-full items-end flex-1">
                      {day.checkedIn ? (
                        <div
                          className="flex-1 rounded-t bg-emerald-500 transition-all duration-500"
                          style={{ height: '80%' }}
                        />
                      ) : (
                        <div className="flex-1 rounded-t bg-muted/30" style={{ height: '20%' }} />
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(day.date).toLocaleDateString('en-IN', { weekday: 'short' })}
                    </span>
                    {day.checkedIn && (
                      <Badge variant="outline" className="text-[10px] px-1.5 bg-emerald-500/10 text-emerald-600">
                        SH {day.studyHour}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center justify-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Checked In
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-muted/30" />
                  Missed
                </span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Upcoming Events & Holidays Widget */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.9 }}
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
                          {new Date(evt.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
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