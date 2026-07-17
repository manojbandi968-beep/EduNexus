'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ClipboardCheck,
  MapPin,
  Clock,
  CheckCircle2,
  Calendar,
  Timer,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/components/ui/stat-card';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { createDocument, COLLECTIONS } from '@/lib/firebase/firestore';
import { useSocket, useSocketEvent, getSocket } from '@/lib/socket/client';
import { SOCKET_EVENTS } from '@/lib/socket/events';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { TeacherDashboardData } from '@/types';

interface AttendanceRecord {
  date: string;
  day: string;
  status: 'present' | 'late' | 'absent';
  checkIn: string;
  duration?: string;
}

const history: AttendanceRecord[] = [
  { date: 'Jul 5', day: 'Sat', status: 'present', checkIn: '7:45 AM', duration: '8h 15m' },
  { date: 'Jul 4', day: 'Fri', status: 'present', checkIn: '7:50 AM', duration: '8h 10m' },
  { date: 'Jul 3', day: 'Thu', status: 'late', checkIn: '9:10 AM', duration: '6h 50m' },
  { date: 'Jul 2', day: 'Wed', status: 'present', checkIn: '7:55 AM', duration: '8h 5m' },
  { date: 'Jul 1', day: 'Tue', status: 'present', checkIn: '7:40 AM', duration: '8h 20m' },
  { date: 'Jun 30', day: 'Mon', status: 'present', checkIn: '7:48 AM', duration: '8h 12m' },
];

export default function TeacherAttendance() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const socket = useSocket();

  const { data: dashboardData } = useQuery<TeacherDashboardData>({
    queryKey: ['teacher-dashboard'],
    queryFn: () => fetch('/api/teacher/dashboard').then((r) => r.json()),
  });

  const marked = dashboardData?.isAttendanceMarkedToday || false;
  const checkInTime = dashboardData?.checkInTimeToday || new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  const present = history.filter(h => h.status === 'present').length;
  const late = history.filter(h => h.status === 'late').length;

  const handleMark = async () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    toast.info('Verifying location...', { id: 'location-toast' });

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        // Mock College Location (e.g. Hyderabad)
        const COLLEGE_LAT = 17.3850;
        const COLLEGE_LNG = 78.4867;
        
        // Simple distance calculation (Euclidean for mocking)
        const distance = Math.sqrt(Math.pow(latitude - COLLEGE_LAT, 2) + Math.pow(longitude - COLLEGE_LNG, 2));
        const isInsideCollege = distance < 0.05; // ~5km radius for testing

        toast.dismiss('location-toast');

        const status = new Date().getHours() < 9 ? 'present' : 'late';
        const dateStr = new Date().toLocaleDateString('en-CA');

        try {
          await createDocument(COLLECTIONS.ATTENDANCE, {
            teacherId: user?.uid || '',
            teacherName: user?.displayName || 'Unknown',
            email: user?.email || '',
            status,
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
            userRole: 'teacher',
            details: `Marked attendance as ${status} (${isInsideCollege ? 'In Campus' : 'Off Campus'})`,
            timestamp: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });

          const socket = getSocket();
          socket.emit(SOCKET_EVENTS.TEACHER_MARK_ATTENDANCE, {
            teacherName: user?.displayName || 'Unknown',
            teacherId: user?.uid || '',
            status,
            checkInTime,
            date: dateStr,
            timestamp: Date.now(),
            location: { lat: latitude, lng: longitude },
            inCollege: isInsideCollege,
          });

          queryClient.invalidateQueries({ queryKey: ['teacher-dashboard'] });
          toast.success('Attendance marked!', { description: `Checked in at ${checkInTime} · ${isInsideCollege ? 'In Campus' : 'Off Campus'}` });
        } catch {
          toast.error('Failed to mark attendance. Please try again.');
        }
      },
      (error) => {
        toast.dismiss('location-toast');
        toast.error('Location access denied. Cannot mark attendance.');
      }
    );
  };

  return (
    <DashboardLayout role="teacher" userName="Dr. Ramesh Kumar" userEmail="ramesh@college.edu">
      <div className="space-y-6 pb-20 lg:pb-8">
        <PageHeader title="Attendance" description="Mark your daily attendance" />

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard title="This Month" value={history.length} icon={<ClipboardCheck className="h-5 w-5 text-primary" />} iconBg="bg-primary/10" delay={0} />
          <StatCard title="Present" value={present} icon={<CheckCircle2 className="h-5 w-5 text-emerald-500" />} iconBg="bg-emerald-500/10" delay={0.1} />
          <StatCard title="Late" value={late} icon={<Clock className="h-5 w-5 text-amber-500" />} iconBg="bg-amber-500/10" delay={0.2} />
          <StatCard title="Attendance %" value="96.2%" icon={<ClipboardCheck className="h-5 w-5 text-violet-500" />} iconBg="bg-violet-500/10" delay={0.3} />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card className="glass-card border-0">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base"><ClipboardCheck className="h-4 w-4 text-primary" />Today&rsquo;s Check-in</CardTitle>
              <CardDescription>Mark your attendance for today</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4 py-8">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleMark}
                disabled={marked}
                className={`flex h-32 w-32 flex-col items-center justify-center rounded-full shadow-xl transition-all ${
                  marked ? 'bg-emerald-500 shadow-emerald-500/30' : 'gradient-primary shadow-primary/30 hover:shadow-2xl'
                }`}
              >
                {marked ? (
                  <>
                    <CheckCircle2 className="h-12 w-12 text-white" />
                    <span className="mt-1 text-xs font-bold text-white/90">DONE</span>
                  </>
                ) : (
                  <>
                    <ClipboardCheck className="h-12 w-12 text-white" />
                    <span className="mt-1 text-xs font-bold text-white/90">TAP TO MARK</span>
                  </>
                )}
              </motion.button>
              <div className="text-center">
                <p className="text-sm font-semibold">{marked ? 'Attendance Recorded' : 'Tap to mark present'}</p>
                <p className="mt-1 flex items-center justify-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" />GPS Location Required
                </p>
                {marked && (
                  <div className="mt-3 space-y-1">
                    <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                      <Clock className="mr-1 h-3 w-3" />{checkInTime} — Present
                    </Badge>
                    <p className="text-xs text-muted-foreground">📍 Within campus geofence</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-0">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base"><Calendar className="h-4 w-4 text-primary" />Recent History</CardTitle>
              <CardDescription>Your last 6 attendance records</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {history.map((record, i) => (
                  <motion.div
                    key={i}
                    initial={{ x: -10, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center justify-between rounded-xl bg-muted/30 p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`h-3 w-3 rounded-full ${record.status === 'present' ? 'bg-emerald-500' : record.status === 'late' ? 'bg-amber-500' : 'bg-red-500'}`} />
                      <div>
                        <p className="text-sm font-medium">{record.date}</p>
                        <p className="text-xs text-muted-foreground">{record.day}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{record.checkIn}</span>
                      {record.duration && <span className="flex items-center gap-1"><Timer className="h-3 w-3" />{record.duration}</span>}
                      <Badge variant="outline" className={`rounded-lg text-[10px] px-2 capitalize ${
                        record.status === 'present' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' :
                        record.status === 'late' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' :
                        'bg-red-500/10 text-red-600 border-red-500/20'
                      }`}>
                        {record.status}
                      </Badge>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
