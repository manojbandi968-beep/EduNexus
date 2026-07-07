'use client';

// ============================================
// CollegeDost — Principal Dashboard
// ============================================

import React, { useEffect, useState, useCallback } from 'react';
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
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatCard } from '@/components/ui/stat-card';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
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
import { getSocket } from '@/lib/socket/client';
import { SOCKET_EVENTS, type TeacherActivityPayload, type QuizStartedPayload } from '@/lib/socket/events';
import { getDocuments, subscribeToCollection, COLLECTIONS, whereClause, orderByClause } from '@/lib/firebase/firestore';

const quizPerformanceData = [
  { subject: 'Maths', avg: 78 },
  { subject: 'Physics', avg: 72 },
  { subject: 'Chemistry', avg: 68 },
  { subject: 'Biology', avg: 82 },
  { subject: 'English', avg: 75 },
  { subject: 'Commerce', avg: 71 },
];

const streamDistribution = [
  { name: 'MPC', value: 180, color: '#6366f1' },
  { name: 'BiPC', value: 120, color: '#10b981' },
  { name: 'CEC', value: 90, color: '#f59e0b' },
];

const initialRecentActivity = [
  { name: 'Prof. Lakshmi', action: 'Conducted quiz in MPC-A', time: '15 min ago', type: 'quiz' },
  { name: 'Mr. Suresh', action: 'Requested casual leave', time: '30 min ago', type: 'leave' },
  { name: 'Dr. Priya', action: 'Started Study Hour 1', time: '1 hr ago', type: 'study' },
  { name: 'System', action: 'Daily report generated', time: '2 hrs ago', type: 'system' },
];

const pendingApprovals = [
  { name: 'Ankit Sharma', role: 'Teacher', subject: 'Physics', stream: 'MPC' },
  { name: 'Priya Reddy', role: 'Mentor', subject: 'Chemistry', stream: 'BiPC' },
];

function timeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes === 1) return '1 min ago';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours} hr ago`;
}

interface AttendanceRecord {
  id: string;
  teacherName: string;
  status: 'present' | 'late' | 'absent';
  checkIn: string;
  date: string;
  timestamp: string;
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function PrincipalDashboard() {
  const h = new Date().getHours();
  const greeting = h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening';
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [recentActivity, setRecentActivity] = useState(initialRecentActivity);
  const [totalTeachers, setTotalTeachers] = useState(0);

  const todayRecords = attendanceRecords.filter(
    (r) => r.date === new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  );
  const presentToday = todayRecords.filter((r) => r.status === 'present').length;
  const lateToday = todayRecords.filter((r) => r.status === 'late').length;
  const absentToday = todayRecords.filter((r) => r.status === 'absent').length;

  const attendanceChartData = DAY_LABELS.map((day) => {
    const dayRecords = attendanceRecords.filter((r) => {
      const d = new Date(r.timestamp);
      return DAY_LABELS[d.getDay()] === day;
    });
    return {
      day,
      present: dayRecords.filter((r) => r.status === 'present').length,
      late: dayRecords.filter((r) => r.status === 'late').length,
      absent: dayRecords.filter((r) => r.status === 'absent').length,
    };
  });

  const addActivity = useCallback((item: { name: string; action: string; time: string; type: string }) => {
    setRecentActivity((prev) => [item, ...prev].slice(0, 20));
  }, []);

  useEffect(() => {
    const loadToday = async () => {
      const users = await getDocuments<{ id: string }>(COLLECTIONS.USERS, [
        whereClause('role', 'in', ['teacher', 'mentor', 'both']),
      ]);
      setTotalTeachers(users.length);
    };
    loadToday();
  }, []);

  useEffect(() => {
    const unsub = subscribeToCollection<AttendanceRecord>(
      COLLECTIONS.ATTENDANCE,
      [],
      (records) => {
        setAttendanceRecords(records);
      }
    );
    return () => unsub();
  }, []);

  useEffect(() => {
    const socket = getSocket();

    socket.on(SOCKET_EVENTS.ATTENDANCE_UPDATED, () => {
      // Firestore subscription will pick up changes automatically
    });

    socket.on(SOCKET_EVENTS.QUIZ_STARTED, (payload: QuizStartedPayload) => {
      addActivity({
        name: payload.teacherName,
        action: `Conducted quiz in ${payload.section}`,
        time: timeAgo(payload.timestamp),
        type: 'quiz',
      });
    });

    socket.on(SOCKET_EVENTS.TEACHER_ACTIVITY, (payload: TeacherActivityPayload) => {
      addActivity({
        name: payload.teacherName,
        action: payload.action,
        time: timeAgo(payload.timestamp),
        type: payload.type,
      });
    });

    return () => {
      socket.off(SOCKET_EVENTS.ATTENDANCE_UPDATED);
      socket.off(SOCKET_EVENTS.QUIZ_STARTED);
      socket.off(SOCKET_EVENTS.TEACHER_ACTIVITY);
    };
  }, [addActivity]);

  return (
    <DashboardLayout role="principal" userName="Principal" userEmail="principal@collegedost.com">
      <div className="space-y-6 pb-8">
        {/* Header */}
        <PageHeader
          title="Dashboard"
          description={`Good ${greeting}, Principal — here's your overview for today.`}
        >
          <Button variant="outline" className="gap-2 rounded-xl">
            <Bell className="h-4 w-4" />
            Announcements
          </Button>
        </PageHeader>

        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            title="Total Teachers"
            value={totalTeachers || 47}
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
            description={`${totalTeachers ? ((presentToday / totalTeachers) * 100).toFixed(1) : '0'}% attendance`}
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
            value={390}
            icon={<GraduationCap className="h-5 w-5 text-violet-500" />}
            iconBg="bg-violet-500/10"
            trend={{ value: 2, label: 'this semester' }}
            delay={0.3}
            href="/principal/students"
          />
        </div>

        {/* Alert Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Link href="/principal/teachers">
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
                    <p className="text-sm font-semibold text-red-600 dark:text-red-400">{absentToday} Absent</p>
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
                      3 Pending Leaves
                    </p>
                    <p className="text-xs text-muted-foreground">Awaiting approval</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </Link>

          <Link href="/principal/teachers">
            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="cursor-pointer"
            >
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                    <AlertTriangle className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-primary">2 Pending Approvals</p>
                    <p className="text-xs text-muted-foreground">New registrations</p>
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
                    <XAxis dataKey="day" fontSize={12} tickLine={false} axisLine={false} />
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
                  <BarChart data={quizPerformanceData} layout="vertical" barSize={20}>
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
                    <Bar dataKey="avg" fill="var(--primary)" radius={[0, 6, 6, 0]} name="Average %" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Bottom Row: Activity + Distribution + Approvals */}
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
                    {recentActivity.map((item, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <Avatar className="h-8 w-8 shrink-0">
                          <AvatarFallback className="bg-primary/10 text-[10px] font-bold text-primary">
                            {item.name.split(' ').map((n) => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-0.5">
                          <p className="text-xs">
                            <span className="font-semibold">{item.name}</span>{' '}
                            <span className="text-muted-foreground">{item.action}</span>
                          </p>
                          <p className="text-[10px] text-muted-foreground">{item.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </motion.div>

          {/* Stream Distribution */}
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
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: s.color }}
                      />
                      <span className="font-medium">{s.name}</span>
                      <span className="text-muted-foreground">({s.value})</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Pending Approvals */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.9 }}
          >
            <Card className="glass-card border-0">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Users className="h-4 w-4 text-primary" />
                  Pending Approvals
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {pendingApprovals.map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded-xl bg-muted/50 p-3"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="bg-primary/10 text-xs font-bold text-primary">
                            {item.name.split(' ').map((n) => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-semibold">{item.name}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {item.role} · {item.subject} · {item.stream}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button size="sm" className="h-7 rounded-lg bg-emerald-500 px-2 text-[10px] text-white hover:bg-emerald-600">
                          Approve
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 rounded-lg px-2 text-[10px] text-destructive">
                          Reject
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <Separator className="my-3" />

                <Link href="/principal/teachers">
                  <Button variant="ghost" className="w-full text-xs text-primary">
                    View All Teachers →
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
}
