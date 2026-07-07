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
import { createDocument, COLLECTIONS } from '@/lib/firebase/firestore';
import { getSocket } from '@/lib/socket/client';
import { SOCKET_EVENTS } from '@/lib/socket/events';

// Mock data
const previousSessions = [
  {
    date: 'Today',
    studyHour: 1,
    topic: 'Organic Chemistry - Hydrocarbons',
    students: 45,
    duration: 120,
    notes: 'Covered alkanes and alkenes. Students need more practice on naming conventions.',
  },
  {
    date: 'Yesterday',
    studyHour: 2,
    topic: 'Physics - Wave Optics',
    students: 42,
    duration: 90,
    notes: 'Doubt session on diffraction patterns. Most students understood well.',
  },
  {
    date: '2 days ago',
    studyHour: 1,
    topic: 'Mathematics - Differential Equations',
    students: 48,
    duration: 120,
    notes: 'Practiced solving first-order ODEs. 5 students need additional help.',
  },
];

const announcements = [
  { title: 'Study Hour timing changed for Saturday', time: '3 hours ago' },
  { title: 'Extra doubt session for BiPC batch', time: '1 day ago' },
];

export default function MentorDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const [checkedIn, setCheckedIn] = useState<{ 1: boolean; 2: boolean }>({ 1: false, 2: false });
  const [sessionForm, setSessionForm] = useState({
    topic: '',
    notes: '',
    studentCount: '',
  });

  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? 'Good morning' : currentHour < 17 ? 'Good afternoon' : 'Good evening';

  // Determine current study hour
  const isStudyHour1 = currentHour >= 17 && currentHour < 20;
  const isStudyHour2 = currentHour >= 20 && currentHour < 22;
  const currentStudyHour = isStudyHour1 ? 1 : isStudyHour2 ? 2 : null;

  const handleCheckIn = async (studyHour: 1 | 2) => {
    const checkInTime = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    const dateStr = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

    try {
      await createDocument(COLLECTIONS.MENTOR_ATTENDANCE, {
        mentorId: user?.uid || '',
        mentorName: user?.displayName || 'Unknown',
        email: user?.email || '',
        studyHour,
        checkIn: checkInTime,
        date: dateStr,
        timestamp: new Date().toISOString(),
      });

      try {
        const socket = getSocket();
        socket.emit(SOCKET_EVENTS.ATTENDANCE_UPDATED, { teacherName: user?.displayName, status: 'present', time: checkInTime });
      } catch {
        // Socket is non-critical
      }

      setCheckedIn(prev => ({ ...prev, [studyHour]: true }));
      toast.success(`Checked in for Study Hour ${studyHour}!`, {
        description: `Session started at ${checkInTime}`,
      });
    } catch (error) {
      console.error('Check-in error:', error);
      toast.error('Failed to check in. Please try again.');
    }
  };

  const handleLogSession = () => {
    if (!sessionForm.topic || !sessionForm.studentCount) {
      toast.error('Please fill in topic and student count');
      return;
    }
    toast.success('Session logged successfully! 📝');
    setSessionForm({ topic: '', notes: '', studentCount: '' });
  };

  return (
    <DashboardLayout role="mentor">
      <div className="space-y-6 pb-20 lg:pb-8">
        {/* Header */}
        <PageHeader
          title={`${greeting}, Mr. Suresh! 📚`}
          description="Manage study hours and track student progress."
        />

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            title="Sessions This Month"
            value={24}
            icon={<BookOpen className="h-5 w-5 text-primary" />}
            iconBg="bg-primary/10"
            trend={{ value: 12, label: 'vs last month' }}
            delay={0}
            href="/mentor/attendance"
          />
          <StatCard
            title="Avg Students"
            value={45}
            icon={<Users className="h-5 w-5 text-emerald-500" />}
            iconBg="bg-emerald-500/10"
            description="per session"
            delay={0.1}
            href="/mentor/attendance"
          />
          <StatCard
            title="Total Hours"
            value="48h"
            icon={<Clock className="h-5 w-5 text-amber-500" />}
            iconBg="bg-amber-500/10"
            trend={{ value: 5, label: 'this month' }}
            delay={0.2}
            href="/mentor/attendance"
          />
          <StatCard
            title="Doubts Cleared"
            value={156}
            icon={<FileText className="h-5 w-5 text-violet-500" />}
            iconBg="bg-violet-500/10"
            description="this semester"
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
            <Card className={`glass-card border-0 ${currentStudyHour === 1 ? 'ring-2 ring-primary/30' : ''}`}>
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
                  className={`w-full rounded-xl px-4 py-3 text-sm font-semibold shadow-lg transition-all ${
                    checkedIn[1]
                      ? 'bg-emerald-500 text-white shadow-emerald-500/25'
                      : 'gradient-primary text-white shadow-primary/25 hover:shadow-xl'
                  }`}
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
            <Card className={`glass-card border-0 ${currentStudyHour === 2 ? 'ring-2 ring-primary/30' : ''}`}>
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
                  className={`w-full rounded-xl px-4 py-3 text-sm font-semibold shadow-lg transition-all ${
                    checkedIn[2]
                      ? 'bg-emerald-500 text-white shadow-emerald-500/25'
                      : 'gradient-cec text-white shadow-amber-500/25 hover:shadow-xl'
                  }`}
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
              <CardDescription>Record today&apos;s study hour details</CardDescription>
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
                  {previousSessions.map((session, i) => (
                    <div key={i} onClick={() => router.push('/mentor/attendance')} className="rounded-xl bg-muted/30 p-4 cursor-pointer">
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
                  ))}
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
                  {announcements.map((ann, i) => (
                    <div key={i} onClick={() => router.push('/mentor/announcements')} className="flex items-start gap-3 rounded-xl bg-muted/30 p-3 cursor-pointer">
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

                <Separator className="my-4" />

                {/* Assigned Batches */}
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Assigned Batches
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {['MPC-A', 'MPC-B', 'BiPC-A'].map((batch) => (
                      <Badge key={batch} variant="outline" className="rounded-lg">
                        {batch}
                      </Badge>
                    ))}
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
