'use client';

import React, { useState, useEffect } from 'react';
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
import { createDocument, getDocuments, whereClause, COLLECTIONS } from '@/lib/firebase/firestore';
import { useSocket, getSocket } from '@/lib/socket/client';
import { SOCKET_EVENTS } from '@/lib/socket/events';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { TeacherDashboardData, TeacherAttendance } from '@/types';

export default function TeacherAttendancePage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const socket = useSocket();

  const { data: dashboardData } = useQuery<TeacherDashboardData>({
    queryKey: ['teacher-dashboard'],
    queryFn: () => fetch('/api/teacher/dashboard').then((r) => r.json()),
  });

  const [history, setHistory] = useState<TeacherAttendance[]>([]);
  const [loading, setLoading] = useState(true);

  const marked = dashboardData?.isAttendanceMarkedToday || false;
  const checkInTime = dashboardData?.checkInTimeToday || '--:--';

  useEffect(() => {
    if (!user) return;
    const fetchHistory = async () => {
      try {
        const records = await getDocuments<TeacherAttendance>(COLLECTIONS.ATTENDANCE, [
          whereClause('teacherId', '==', user.uid)
        ]);
        records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setHistory(records);
      } catch (err) {
        console.error('Failed to fetch teacher attendance', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [user]);

  const present = history.filter(h => h.status === 'present').length;
  const late = history.filter(h => h.status === 'late').length;
  const totalThisMonth = history.filter(h => h.date.startsWith(new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }).slice(0, 7))).length;
  const attendancePercent = history.length > 0 ? Math.round(((present + late) / history.length) * 100) : 0;

  const handleMark = async () => {
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

        const status = new Date().getHours() < 9 ? 'present' : 'late';
        const dateStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
        const currentCheckInTime = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

        try {
          const data = {
            teacherId: user?.uid || '',
            teacherName: user?.displayName || 'Unknown',
            email: user?.email || '',
            status,
            checkIn: currentCheckInTime,
            date: dateStr,
            location: { lat: latitude, lng: longitude },
            inCollege: isInsideCollege,
            timestamp: new Date().toISOString(),
          };
          
          const id = await createDocument(COLLECTIONS.ATTENDANCE, data);
          setHistory(prev => [{ id, ...data } as unknown as TeacherAttendance, ...prev]);

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

          const socketInstance = getSocket();
          socketInstance.emit(SOCKET_EVENTS.TEACHER_MARK_ATTENDANCE, {
            teacherName: user?.displayName || 'Unknown',
            teacherId: user?.uid || '',
            status,
            checkInTime: currentCheckInTime,
            date: dateStr,
            timestamp: Date.now(),
            location: { lat: latitude, lng: longitude },
            inCollege: isInsideCollege,
          });

          queryClient.invalidateQueries({ queryKey: ['teacher-dashboard'] });
          toast.success('Attendance marked!', { description: `Checked in at ${currentCheckInTime} · ${isInsideCollege ? 'In Campus' : 'Off Campus'}` });
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
    <DashboardLayout role="teacher">
      <div className="space-y-6 pb-20 lg:pb-8">
        <PageHeader title="Attendance" description="Mark your daily attendance" />

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard title="This Month" value={totalThisMonth} icon={<ClipboardCheck className="h-5 w-5 text-primary" />} iconBg="bg-primary/10" delay={0} />
          <StatCard title="Present" value={present} icon={<CheckCircle2 className="h-5 w-5 text-emerald-500" />} iconBg="bg-emerald-500/10" delay={0.1} />
          <StatCard title="Late" value={late} icon={<Clock className="h-5 w-5 text-amber-500" />} iconBg="bg-amber-500/10" delay={0.2} />
          <StatCard title="Attendance %" value={`${attendancePercent}%`} icon={<ClipboardCheck className="h-5 w-5 text-violet-500" />} iconBg="bg-violet-500/10" delay={0.3} />
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
                      <Clock className="mr-1 h-3 w-3" />{checkInTime} — Marked
                    </Badge>
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
                {loading ? (
                  <div className="flex justify-center p-8 text-muted-foreground">Loading history...</div>
                ) : history.length > 0 ? (
                  history.slice(0, 6).map((record, i) => {
                    // Attempt to parse day name safely
                    let dayName = 'Day';
                    try {
                       dayName = new Date(record.date).toLocaleDateString('en-US', { weekday: 'short' });
                    } catch (e) {}

                    return (
                      <motion.div
                        key={record.id || i}
                        initial={{ x: -10, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-center justify-between rounded-xl bg-muted/30 p-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`h-3 w-3 rounded-full ${record.status === 'present' ? 'bg-emerald-500' : record.status === 'late' ? 'bg-amber-500' : 'bg-red-500'}`} />
                          <div>
                            <p className="text-sm font-medium">{record.date}</p>
                            <p className="text-xs text-muted-foreground">{dayName}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {/* @ts-ignore - checkIn might exist in DB but not type */}
                            {record.checkInTime || record.checkIn || '--:--'}
                          </span>
                          <Badge variant="outline" className={`rounded-lg text-[10px] px-2 capitalize ${
                            record.status === 'present' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' :
                            record.status === 'late' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' :
                            'bg-red-500/10 text-red-600 border-red-500/20'
                          }`}>
                            {record.status}
                          </Badge>
                        </div>
                      </motion.div>
                    );
                  })
                ) : (
                  <div className="flex justify-center p-8 text-muted-foreground">No history found</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
