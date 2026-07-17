'use client';

import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Users,
  GraduationCap,
  ClipboardCheck,
  Clock,
  UserX,
  AlertTriangle,
  FileQuestion,
  CalendarOff,
  TrendingUp,
  Activity,
  BookOpen,
  Bell,
  Calendar,
  CheckCircle2,
  XCircle,
  Hourglass,
  Mail,
  Briefcase,
  Target,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatCard } from '@/components/ui/stat-card';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useSocket, useSocketEvent } from '@/lib/socket/client';
import { SOCKET_EVENTS, type TeacherActivityPayload, type QuizStartedPayload } from '@/lib/socket/events';
import { useQuery, useQueryClient } from '@tanstack/react-query';

interface DashboardData {
  stats: {
    totalTeachers: number;
    totalStudents: number;
    totalMentors: number;
    presentToday: number;
    absentToday: number;
    lateToday: number;
    pendingLeaves: number;
    pendingApprovals: number;
    todayQuizzes: number;
    activeClasses: number;
    pendingTasks: number;
    upcomingEvents: number;
  };
  attendanceChartData: { date: string; present: number; late: number; absent: number }[];
  quizChartData: { subject: string; average: number; quizCount: number }[];
  recentActivity: {
    id: string;
    action: string;
    userName: string;
    userRole: string;
    details: string;
    timestamp: string;
  }[];
  upcomingEvents: { id: string; title: string; startDate: string; type: string }[];
  pendingLeaves: {
    id: string;
    teacherName: string;
    type: string;
    startDate: string;
    endDate: string;
    reason: string;
    days: number;
    status: string;
    appliedOn: string;
  }[];
  todayAttendance: {
    id: string;
    teacherName: string;
    status: string;
    checkIn: string;
    date: string;
  }[];
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const streamDistribution = [
  { name: 'MPC', value: 180, color: '#6366f1' },
  { name: 'BiPC', value: 120, color: '#10b981' },
  { name: 'CEC', value: 90, color: '#f59e0b' },
];

function timeAgo(timestamp: string | number): string {
  const tsNumber = typeof timestamp === 'string' && /^\d+$/.test(timestamp) ? Number(timestamp) : timestamp;
  const dateObj = new Date(tsNumber);
  
  // Verify date is valid before proceeding
  if (isNaN(dateObj.getTime())) return 'Unknown time';

  const seconds = Math.floor((Date.now() - dateObj.getTime()) / 1000);
  
  // Format exactly in IST for the dashboard
  const istTime = dateObj.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' });
  
  if (seconds < 60) return `Just now • ${istTime}`;
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago • ${istTime}`;
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr${hours > 1 ? 's' : ''} ago • ${istTime}`;
  
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? 's' : ''} ago • ${istTime}`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export default function PrincipalDashboard() {
  const queryClient = useQueryClient();
  const socket = useSocket();
  const [recentActivity, setRecentActivity] = useState<DashboardData['recentActivity']>([]);
  const [activityCounter, setActivityCounter] = useState(0);

  const h = new Date().getHours();
  const greeting = h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening';

  const { data: dashboardData, isLoading, error } = useQuery<DashboardData>({
    queryKey: ['dashboard-data'],
    queryFn: () => fetch('/api/dashboard').then((r) => r.json()),
    refetchInterval: 30000,
  });

  const stats = dashboardData?.stats || {
    totalTeachers: 0,
    totalStudents: 0,
    totalMentors: 0,
    presentToday: 0,
    absentToday: 0,
    lateToday: 0,
    pendingLeaves: 0,
    pendingApprovals: 0,
    todayQuizzes: 0,
    activeClasses: 0,
    pendingTasks: 0,
    upcomingEvents: 0,
  };

  const attendanceChartData = dashboardData?.attendanceChartData || [];
  const quizChartData = dashboardData?.quizChartData || [];

  const todayRecords = dashboardData?.todayAttendance || [];
  const presentToday = todayRecords.filter((r) => r.status === 'present').length;
  const lateToday = todayRecords.filter((r) => r.status === 'late').length;
  const absentToday = todayRecords.filter((r) => r.status === 'absent').length;

  const addActivity = useCallback((item: { 
    id: string; 
    action: string; 
    userName: string; 
    userRole: string; 
    details: string; 
    timestamp: string; 
  }) => {
    setRecentActivity((prev) => [item, ...prev].slice(0, 20));
    setActivityCounter((c) => c + 1);
  }, []);

  // Real-time socket events
  useSocketEvent(socket ? SOCKET_EVENTS.ATTENDANCE_UPDATED : '', (payload: any) => {
    queryClient.invalidateQueries({ queryKey: ['dashboard-data'] });
  });

  useSocketEvent(socket ? SOCKET_EVENTS.QUIZ_STARTED : '', (payload: QuizStartedPayload) => {
    queryClient.invalidateQueries({ queryKey: ['dashboard-data'] });
    addActivity({
      id: `activity-${Date.now()}`,
      userName: payload.teacherName,
      userRole: 'teacher',
      action: `Conducted quiz in ${payload.section}`,
      details: `Quiz conducted in ${payload.section}`,
      timestamp: payload.timestamp.toString(),
    });
  });

  useSocketEvent(socket ? SOCKET_EVENTS.LEAVE_REQUESTED : '', (payload: any) => {
    queryClient.invalidateQueries({ queryKey: ['dashboard-data'] });
    queryClient.invalidateQueries({ queryKey: ['leaves'] });
    addActivity({
      id: `activity-${Date.now()}`,
      userName: payload.teacherName,
      userRole: 'teacher',
      action: `Requested ${payload.type} leave (${payload.days} days)`,
      details: `Leave requested: ${payload.type} for ${payload.days} days`,
      timestamp: payload.timestamp.toString(),
    });
  });

  useSocketEvent(socket ? SOCKET_EVENTS.LEAVE_APPROVED : '', (payload: any) => {
    queryClient.invalidateQueries({ queryKey: ['dashboard-data'] });
    queryClient.invalidateQueries({ queryKey: ['leaves'] });
    addActivity({
      id: `activity-${Date.now()}`,
      userName: 'Principal',
      userRole: 'principal',
      action: `Approved leave for ${payload.teacherName}`,
      details: `Leave approved for ${payload.teacherName}`,
      timestamp: payload.timestamp.toString(),
    });
  });

  useSocketEvent(socket ? SOCKET_EVENTS.ANNOUNCEMENT_CREATED : '', (payload: any) => {
    queryClient.invalidateQueries({ queryKey: ['dashboard-data'] });
    queryClient.invalidateQueries({ queryKey: ['announcements'] });
    addActivity({
      id: `activity-${Date.now()}`,
      userName: 'Principal',
      userRole: 'principal',
      action: `Published announcement: ${payload.title}`,
      details: `Announcement: ${payload.title}`,
      timestamp: new Date().toISOString(),
    });
  });

  useSocketEvent(socket ? SOCKET_EVENTS.ANNOUNCEMENT_UPDATED : '', () => {
    queryClient.invalidateQueries({ queryKey: ['dashboard-data'] });
    queryClient.invalidateQueries({ queryKey: ['announcements'] });
  });

  useSocketEvent(socket ? SOCKET_EVENTS.ANNOUNCEMENT_DELETED : '', () => {
    queryClient.invalidateQueries({ queryKey: ['dashboard-data'] });
    queryClient.invalidateQueries({ queryKey: ['announcements'] });
  });

  useSocketEvent(socket ? SOCKET_EVENTS.TASK_ASSIGNED : '', (payload: any) => {
    queryClient.invalidateQueries({ queryKey: ['dashboard-data'] });
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
    addActivity({
      id: `activity-${Date.now()}`,
      userName: 'Principal',
      userRole: 'principal',
      action: `Assigned task "${payload.title}" to ${payload.assignedToName}`,
      details: `Task assigned: ${payload.title} to ${payload.assignedToName}`,
      timestamp: payload.timestamp.toString(),
    });
  });

  useSocketEvent(socket ? SOCKET_EVENTS.SESSION_LOGGED : '', (payload: any) => {
    queryClient.invalidateQueries({ queryKey: ['dashboard-data'] });
    queryClient.invalidateQueries({ queryKey: ['mentorAttendance'] });
    addActivity({
      id: `activity-${Date.now()}`,
      userName: payload.mentorName,
      userRole: 'mentor',
      action: `Logged Study Hour ${payload.studyHour}: ${payload.topic}`,
      details: `Study hour ${payload.studyHour}: ${payload.topic}`,
      timestamp: payload.timestamp.toString(),
    });
  });

  useSocketEvent(socket ? SOCKET_EVENTS.STUDENT_REPORT_CREATED : '', (payload: any) => {
    queryClient.invalidateQueries({ queryKey: ['dashboard-data'] });
    queryClient.invalidateQueries({ queryKey: ['studentReports'] });
    addActivity({
      id: `activity-${Date.now()}`,
      userName: payload.mentorName,
      userRole: 'mentor',
      action: `Created report for ${payload.studentName}`,
      details: `Student report created for ${payload.studentName}`,
      timestamp: payload.timestamp.toString(),
    });
  });

  useSocketEvent(socket ? SOCKET_EVENTS.TEACHER_ACTIVITY : '', (payload: TeacherActivityPayload) => {
    addActivity({
      id: `activity-${Date.now()}`,
      userName: payload.teacherName,
      userRole: 'teacher',
      action: payload.action,
      details: payload.details || payload.action,
      timestamp: payload.timestamp.toString(),
    });
  });

  return (
    <DashboardLayout role="principal" userName="Principal" userEmail="principal@collegedost.com">
      <div className="space-y-6 pb-8">
        {/* Header */}
        <PageHeader
          title="Dashboard"
          description={`Good ${greeting}, Principal — here's your overview for today.`}
        >
          <Button variant="outline" className="gap-2 rounded-xl" onClick={() => window.location.href = '/principal/announcements'}>
            <Bell className="h-4 w-4" />
            Announcements
          </Button>
        </PageHeader>

        {/* Stats Row - Primary */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            title="Total Teachers"
            value={stats.totalTeachers}
            icon={<Users className="h-5 w-5 text-primary" />}
            iconBg="bg-primary/10"
            trend={{ value: 4, label: 'this month' }}
            delay={0}
            href="/principal/teachers"
          />
          <StatCard
            title="Present Today"
            value={presentToday}
            icon={<ClipboardCheck className="h-5 w-5 text-emerald-500" />}
            iconBg="bg-emerald-500/10"
            description={`${stats.totalTeachers ? ((presentToday / stats.totalTeachers) * 100).toFixed(1) : '0'}% attendance`}
            delay={0.1}
            href="/principal/attendance"
          />
          <StatCard
            title="Late Arrivals"
            value={lateToday}
            icon={<Clock className="h-5 w-5 text-amber-500" />}
            iconBg="bg-amber-500/10"
            trend={{ value: -15, label: 'vs yesterday' }}
            delay={0.2}
            href="/principal/attendance"
          />
          <StatCard
            title="Total Students"
            value={stats.totalStudents}
            icon={<GraduationCap className="h-5 w-5 text-violet-500" />}
            iconBg="bg-violet-500/10"
            trend={{ value: 2, label: 'this semester' }}
            delay={0.3}
            href="/principal/students"
          />
        </div>

        {/* Stats Row - Secondary */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            title="Total Mentors"
            value={stats.totalMentors}
            icon={<Target className="h-5 w-5 text-indigo-500" />}
            iconBg="bg-indigo-500/10"
            delay={0}
            href="/principal/teachers"
          />
          <StatCard
            title="Pending Leaves"
            value={stats.pendingLeaves}
            icon={<CalendarOff className="h-5 w-5 text-amber-500" />}
            iconBg="bg-amber-500/10"
            description="Awaiting approval"
            delay={0.1}
            href="/principal/leave"
          />
          <StatCard
            title="Pending Tasks"
            value={stats.pendingTasks}
            icon={<Briefcase className="h-5 w-5 text-blue-500" />}
            iconBg="bg-blue-500/10"
            delay={0.2}
            href="/principal/tasks"
          />
          <StatCard
            title="Upcoming Events"
            value={stats.upcomingEvents}
            icon={<Calendar className="h-5 w-5 text-emerald-500" />}
            iconBg="bg-emerald-500/10"
            delay={0.3}
            href="/principal/calendar"
          />
        </div>

        {/* Alert Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Link href="/principal/attendance">
            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="cursor-pointer"
            >
              <Card className="border-red-500/20 bg-red-500/5">
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-500/10">
                    <UserX className="h-5 w-5 text-red-500" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-red-600 dark:text-red-400">
                      {absentToday} {absentToday === 1 ? 'Absent' : 'Absent'}
                    </p>
                    <p className="text-xs text-muted-foreground">Teachers absent today</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </Link>

          <Link href="/principal/leave">
            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="cursor-pointer"
            >
              <Card className="border-amber-500/20 bg-amber-500/5">
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10">
                    <CalendarOff className="h-5 w-5 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-amber-600 dark:text-amber-400">
                      {stats.pendingLeaves} Pending Leave{stats.pendingLeaves !== 1 ? 's' : ''}
                    </p>
                    <p className="text-xs text-muted-foreground">Awaiting approval</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </Link>

          <Link href="/principal/tasks">
            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="cursor-pointer"
            >
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                    <Briefcase className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-primary">
                      {stats.pendingTasks} Pending Task{stats.pendingTasks !== 1 ? 's' : ''}
                    </p>
                    <p className="text-xs text-muted-foreground">Assigned to staff</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </Link>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Weekly Attendance Chart */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="glass-card border-0">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Activity className="h-4 w-4 text-primary" />
                  Weekly Attendance
                </CardTitle>
                <CardDescription>Teacher attendance this week</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={attendanceChartData} barGap={4}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis
                      dataKey="date"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => new Date(value).toLocaleDateString('en-IN', { weekday: 'short' })}
                    />
                    <YAxis fontSize={12} tickLine={false} axisLine={false} />
                    <RechartsTooltip
                      contentStyle={{
                        background: 'var(--popover)',
                        border: '1px solid var(--border)',
                        borderRadius: '12px',
                        fontSize: '12px',
                      }}
                    />
                    <Bar dataKey="present" fill="#10b981" radius={[4, 4, 0, 0]} name="Present" />
                    <Bar dataKey="late" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Late" />
                    <Bar dataKey="absent" fill="#ef4444" radius={[4, 4, 0, 0]} name="Absent" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>

          {/* Quiz Performance Chart */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <Card className="glass-card border-0">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileQuestion className="h-4 w-4 text-primary" />
                  Quiz Performance
                </CardTitle>
                <CardDescription>Average scores by subject</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={quizChartData} layout="vertical" barSize={20}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                    <XAxis type="number" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
                    <YAxis dataKey="subject" type="category" fontSize={12} tickLine={false} axisLine={false} width={80} />
                    <RechartsTooltip
                      contentStyle={{
                        background: 'var(--popover)',
                        border: '1px solid var(--border)',
                        borderRadius: '12px',
                        fontSize: '12px',
                      }}
                    />
                    <Bar dataKey="average" fill="var(--primary)" radius={[0, 6, 6, 0]} name="Average %" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Bottom Row: Activity + Distribution + Pending Items */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Recent Activity */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="lg:col-span-1"
          >
            <Card className="glass-card border-0">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[280px]">
                  <div className="space-y-3">
                    {dashboardData?.recentActivity?.length ? (
                      dashboardData.recentActivity.map((item, i) => (
                        <motion.div
                          key={item.id || i}
                          initial={{ x: -10, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: i * 0.05 }}
                          className="flex items-start gap-3"
                        >
                          <Avatar className="h-8 w-8 shrink-0">
                            <AvatarFallback className="bg-primary/10 text-[10px] font-bold text-primary">
                              {item.userName.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 space-y-0.5">
                            <p className="text-xs">
                              <span className="font-semibold">{item.userName}</span>{' '}
                              <span className="text-muted-foreground">{item.details || item.action}</span>
                            </p>
                            <p className="text-[10px] text-muted-foreground">{timeAgo(item.timestamp)}</p>
                          </div>
                          <Badge
                            variant="outline"
                            className={`rounded-lg text-[10px] px-2 ${
                              item.userRole === 'principal'
                                ? 'bg-primary/10 text-primary'
                                : item.userRole === 'teacher'
                                ? 'bg-emerald-500/10 text-emerald-600'
                                : 'bg-amber-500/10 text-amber-600'
                            }`}
                          >
                            {item.userRole}
                          </Badge>
                        </motion.div>
                      ))
                    ) : (
                      <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
                        <Activity className="h-10 w-10 opacity-30" />
                        <p className="text-sm font-medium">No recent activity</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </motion.div>

          {/* Student Distribution */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <Card className="glass-card border-0">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <BookOpen className="h-4 w-4 text-primary" />
                  Student Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={streamDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {streamDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      contentStyle={{
                        background: 'var(--popover)',
                        border: '1px solid var(--border)',
                        borderRadius: '12px',
                        fontSize: '12px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-2 flex items-center justify-center gap-4">
                  {streamDistribution.map((s) => (
                    <div key={s.name} className="flex items-center gap-1.5 text-xs">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                      <span className="font-medium">{s.name}</span>
                      <span className="text-muted-foreground">({s.value})</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Pending Leaves + Upcoming Events */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.9 }}
          >
            <div className="space-y-4">
              {/* Pending Leaves */}
              <Card className="glass-card border-0">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <CalendarOff className="h-4 w-4 text-amber-500" />
                    Pending Leaves
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {dashboardData?.pendingLeaves?.length ? (
                      dashboardData.pendingLeaves.slice(0, 5).map((leave, i) => (
                        <motion.div
                          key={leave.id || i}
                          initial={{ x: -10, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: i * 0.05 }}
                          className="flex flex-col gap-2 rounded-xl bg-muted/30 p-3 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <Avatar className="h-9 w-9 shrink-0">
                              <AvatarFallback className="bg-primary/10 text-xs font-bold text-primary">
                                {leave.teacherName.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold truncate">{leave.teacherName}</p>
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                                <Badge variant="outline" className={`rounded-lg text-[10px] px-2 capitalize ${
                                  leave.type === 'casual' ? 'bg-blue-500/10 text-blue-600 border-blue-500/20' :
                                  leave.type === 'sick' ? 'bg-red-500/10 text-red-600 border-red-500/20' :
                                  'bg-amber-500/10 text-amber-600 border-amber-500/20'
                                }`}>
                                  {leave.type}
                                </Badge>
                                <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{formatDate(leave.startDate)} → {formatDate(leave.endDate)}</span>
                                <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{leave.days} day{leave.days > 1 ? 's' : ''}</span>
                              </div>
                              <p className="mt-1 text-xs text-muted-foreground line-clamp-1">{leave.reason}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 self-end sm:self-center">
                            <Button size="sm" className="h-8 gap-1 rounded-lg bg-emerald-500 text-xs text-white hover:bg-emerald-600">
                              <CheckCircle2 className="h-3.5 w-3.5" />Approve
                            </Button>
                            <Button size="sm" variant="ghost" className="h-8 gap-1 rounded-lg text-xs text-destructive">
                              <XCircle className="h-3.5 w-3.5" />Reject
                            </Button>
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      <div className="flex flex-col items-center gap-2 py-6 text-muted-foreground">
                        <CalendarOff className="h-8 w-8 opacity-30" />
                        <p className="text-sm">No pending leaves</p>
                      </div>
                    )}
                  </div>
                  <Link href="/principal/leave">
                    <Button variant="ghost" className="mt-3 w-full text-xs text-primary">
                      View All →
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Upcoming Events */}
              <Card className="glass-card border-0">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Calendar className="h-4 w-4 text-emerald-500" />
                    Upcoming Events
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-48 overflow-y-auto">
                    {dashboardData?.upcomingEvents && dashboardData.upcomingEvents.length > 0 ? (
                      dashboardData.upcomingEvents.slice(0, 4).map((event, i) => (
                        <motion.div
                          key={event.id || i}
                          initial={{ x: -10, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: i * 0.05 }}
                          className="flex items-start gap-3 rounded-xl bg-muted/30 p-3"
                        >
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
                            <Mail className="h-4 w-4 text-emerald-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate">{event.title}</p>
                            <p className="text-xs text-muted-foreground">{formatDate(event.startDate)}</p>
                          </div>
                          <Badge variant="outline" className="rounded-lg text-[10px] px-2 shrink-0 capitalize">{event.type}</Badge>
                        </motion.div>
                      ))
                    ) : (
                      <div className="flex flex-col items-center gap-2 py-6 text-muted-foreground">
                        <Calendar className="h-8 w-8 opacity-30" />
                        <p className="text-sm">No upcoming events</p>
                      </div>
                    )}
                  </div>
                  <Link href="/principal/calendar">
                    <Button variant="ghost" className="mt-3 w-full text-xs text-primary">
                      View Calendar →
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
}