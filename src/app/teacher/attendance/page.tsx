'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  ClipboardCheck,
  MapPin,
  Clock,
  CheckCircle2,
  Calendar,
  Timer,
  Users,
  BookOpen,
  Check,
  X,
  Minus,
  Download,
  Filter,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/components/ui/stat-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { getDocuments, whereClause, COLLECTIONS, createDocument } from '@/lib/firebase/firestore';
import { DEFAULT_SCHEDULE } from '@/lib/constants';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import type { TeacherDashboardData, TeacherAttendance, StudentAttendance, Student, Subject, Section, Timetable, TimeSlot } from '@/types';

interface StudentWithAttendance extends Student {
  attendanceStatus?: 'present' | 'late' | 'absent';
  attendanceId?: string;
}

export default function TeacherAttendancePage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'my' | 'student'>('my');
  const [history, setHistory] = useState<TeacherAttendance[]>([]);
  const [loading, setLoading] = useState(true);

  // Student attendance state
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedPeriodId, setSelectedPeriodId] = useState('');
  const [students, setStudents] = useState<StudentWithAttendance[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [periods, setPeriods] = useState<TimeSlot[]>([]);
  const [studentLoading, setStudentLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { data: dashboardData } = useQuery<TeacherDashboardData>({
    queryKey: ['teacher-dashboard'],
    queryFn: () => fetch('/api/teacher/dashboard').then((r) => r.json()),
  });

  const marked = dashboardData?.isAttendanceMarkedToday || false;
  const checkInTime = dashboardData?.checkInTimeToday || '--:--';

  // Fetch teacher's own attendance history
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

  // Fetch sections, subjects, periods for student attendance
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [sectionsData, subjectsData] = await Promise.all([
          getDocuments<Section>(COLLECTIONS.SECTIONS),
          getDocuments<Subject>(COLLECTIONS.SUBJECTS),
        ]);

        // Use default schedule for periods
        const periodsData = DEFAULT_SCHEDULE.filter(p => p.type === 'period');

        // Filter sections assigned to this teacher
        const teacherSections = sectionsData.filter(s => 
          // This would need teacher assignment data
          true // For now show all, can filter later
        );

        setSections(teacherSections);
        setSubjects(subjectsData);
        setPeriods(periodsData);
      } catch (err) {
        console.error('Failed to fetch metadata', err);
      }
    };
    fetchMetadata();
  }, []);

  // Fetch students for selected section and their attendance
  const fetchStudents = useCallback(async () => {
    if (!selectedSectionId || !selectedSubjectId || !selectedPeriodId) {
      setStudents([]);
      return;
    }

    setStudentLoading(true);
    try {
      // Get students in section
      const studentsData = await getDocuments<Student>(COLLECTIONS.STUDENTS, [
        whereClause('section', '==', selectedSectionId),
        whereClause('status', '==', 'active'),
      ]);

      // Get existing attendance for this date/section/subject/period
      const attendanceData = await getDocuments<StudentAttendance>(COLLECTIONS.STUDENT_ATTENDANCE, [
        whereClause('date', '==', selectedDate),
        whereClause('sectionId', '==', selectedSectionId),
        whereClause('subjectId', '==', selectedSubjectId),
        whereClause('periodId', '==', selectedPeriodId),
      ]);

      const attendanceMap = new Map(attendanceData.map(a => [a.studentId, a]));

      const studentsWithAttendance: StudentWithAttendance[] = studentsData
        .sort((a, b) => a.rollNumber.localeCompare(b.rollNumber))
        .map(student => {
          const attendance = attendanceMap.get(student.id);
          return {
            ...student,
            attendanceStatus: attendance?.status,
            attendanceId: attendance?.id,
          };
        });

      setStudents(studentsWithAttendance);
    } catch (err) {
      console.error('Failed to fetch students', err);
      toast.error('Failed to load students');
    } finally {
      setStudentLoading(false);
    }
  }, [selectedDate, selectedSectionId, selectedSubjectId, selectedPeriodId]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const handleMarkTeacherAttendance = async () => {
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

  const toggleStudentStatus = (studentId: string) => {
    setStudents(prev => prev.map(s => {
      if (s.id !== studentId) return s;
      const current = s.attendanceStatus;
      let next: 'present' | 'late' | 'absent' = 'present';
      if (current === 'present') next = 'late';
      else if (current === 'late') next = 'absent';
      else next = 'present';
      return { ...s, attendanceStatus: next };
    }));
  };

  const handleSubmitStudentAttendance = async () => {
    if (!selectedSectionId || !selectedSubjectId || !selectedPeriodId || !selectedDate) {
      toast.error('Please select section, subject, period and date');
      return;
    }

    const recordsToSubmit = students
      .filter(s => s.attendanceStatus)
      .map(s => ({
        studentId: s.id,
        studentName: s.name,
        rollNumber: s.rollNumber,
        status: s.attendanceStatus!,
      }));

    if (recordsToSubmit.length === 0) {
      toast.error('No attendance records to submit');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/student-attendance/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: selectedDate,
          sectionId: selectedSectionId,
          subjectId: selectedSubjectId,
          subjectName: subjects.find(s => s.id === selectedSubjectId)?.name || '',
          periodId: selectedPeriodId,
          periodLabel: periods.find(p => p.id === selectedPeriodId)?.label || '',
          teacherId: user?.uid || '',
          teacherName: user?.displayName || 'Unknown',
          records: recordsToSubmit,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to submit');

      toast.success(`Attendance saved for ${data.count} students`);
      fetchStudents(); // Refresh to show saved status
    } catch (err) {
      console.error('Failed to submit attendance:', err);
      toast.error('Failed to submit attendance');
    } finally {
      setSubmitting(false);
    }
  };

  const present = history.filter(h => h.status === 'present').length;
  const late = history.filter(h => h.status === 'late').length;
  const totalThisMonth = history.filter(h => h.date.startsWith(new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }).slice(0, 7))).length;
  const attendancePercent = history.length > 0 ? Math.round(((present + late) / history.length) * 100) : 0;

  const studentStats = {
    present: students.filter(s => s.attendanceStatus === 'present').length,
    late: students.filter(s => s.attendanceStatus === 'late').length,
    absent: students.filter(s => s.attendanceStatus === 'absent').length,
    total: students.length,
  };

  return (
    <DashboardLayout role="teacher">
      <div className="space-y-6 pb-20 lg:pb-8">
        <PageHeader title="Attendance" description="Manage daily attendance" />

        {/* Tab Navigation */}
        <div className="flex gap-2 bg-muted/30 rounded-xl p-1">
          <Button
            variant={activeTab === 'my' ? 'default' : 'ghost'}
            className="flex-1 gap-2 rounded-lg"
            onClick={() => setActiveTab('my')}
          >
            <ClipboardCheck className="h-4 w-4" />
            My Attendance
          </Button>
          <Button
            variant={activeTab === 'student' ? 'default' : 'ghost'}
            className="flex-1 gap-2 rounded-lg"
            onClick={() => setActiveTab('student')}
          >
            <Users className="h-4 w-4" />
            Student Attendance
          </Button>
        </div>

        {activeTab === 'my' && (
          <>
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
                    onClick={handleMarkTeacherAttendance}
                    disabled={marked}
                    className={cn(
                      'flex h-32 w-32 flex-col items-center justify-center rounded-full shadow-xl transition-all',
                      marked
                        ? 'bg-emerald-500 shadow-emerald-500/30'
                        : 'gradient-primary shadow-primary/30 hover:shadow-2xl'
                    )}
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
                              <div className={cn('h-3 w-3 rounded-full', record.status === 'present' ? 'bg-emerald-500' : record.status === 'late' ? 'bg-amber-500' : 'bg-red-500')} />
                              <div>
                                <p className="text-sm font-medium">{record.date}</p>
                                <p className="text-xs text-muted-foreground">{dayName}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {record.checkInTime || '--:--'}
                              </span>
                              <Badge variant="outline" className={cn(
                                'rounded-lg text-[10px] px-2 capitalize',
                                record.status === 'present' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' :
                                record.status === 'late' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' :
                                'bg-red-500/10 text-red-600 border-red-500/20'
                              )}>
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
          </>
        )}

        {activeTab === 'student' && (
          <>
            {/* Filters */}
            <Card className="glass-card border-0">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base"><Users className="h-4 w-4 text-primary" />Mark Student Attendance</CardTitle>
                <CardDescription>Select section, subject, period and date to mark attendance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
                  <div className="space-y-2">
                    <Label className="text-xs">Date *</Label>
                    <Input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="rounded-xl bg-background/50 h-10"
                      max={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Section *</Label>
                    <Select value={selectedSectionId} onValueChange={(v) => v && setSelectedSectionId(v)}>
                      <SelectTrigger className="h-10 rounded-xl bg-background/50"><SelectValue placeholder="Select section" /></SelectTrigger>
                      <SelectContent>
                        {sections.map(s => (
                          <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Subject *</Label>
                    <Select value={selectedSubjectId} onValueChange={(v) => v && setSelectedSubjectId(v)}>
                      <SelectTrigger className="h-10 rounded-xl bg-background/50"><SelectValue placeholder="Select subject" /></SelectTrigger>
                      <SelectContent>
                        {subjects.map(s => (
                          <SelectItem key={s.id} value={s.id}>{s.name} ({s.code})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Period *</Label>
                    <Select value={selectedPeriodId} onValueChange={(v) => v && setSelectedPeriodId(v)}>
                      <SelectTrigger className="h-10 rounded-xl bg-background/50"><SelectValue placeholder="Select period" /></SelectTrigger>
                      <SelectContent>
                        {periods.filter(p => p.type === 'period').map(p => (
                          <SelectItem key={p.id} value={p.id}>{p.label} ({p.startTime}-{p.endTime})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 sm:col-span-2 lg:col-span-2 flex items-end gap-2">
                    <Button onClick={fetchStudents} disabled={studentLoading} className="gap-2 rounded-xl h-10">
                      <Filter className="h-4 w-4" />
                      Load Students
                    </Button>
                  </div>
</div>
               </CardContent>
             </Card>

            {/* Student Stats */}
            {students.length > 0 && (
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <StatCard title="Total" value={studentStats.total} icon={<Users className="h-5 w-5 text-primary" />} iconBg="bg-primary/10" delay={0} />
                <StatCard title="Present" value={studentStats.present} icon={<CheckCircle2 className="h-5 w-5 text-emerald-500" />} iconBg="bg-emerald-500/10" delay={0.1} />
                <StatCard title="Late" value={studentStats.late} icon={<Clock className="h-5 w-5 text-amber-500" />} iconBg="bg-amber-500/10" delay={0.2} />
                <StatCard title="Absent" value={studentStats.absent} icon={<X className="h-5 w-5 text-red-500" />} iconBg="bg-red-500/10" delay={0.3} />
              </div>
            )}

            {/* Students List */}
            <Card className="glass-card border-0">
              <CardHeader className="pb-2">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-base"><Users className="h-4 w-4 text-primary" />Students - {sections.find(s => s.id === selectedSectionId)?.name || 'Select Section'}</CardTitle>
                    <CardDescription>
                      {subjects.find(s => s.id === selectedSubjectId)?.name} • {periods.find(p => p.id === selectedPeriodId)?.label} • {selectedDate}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="gap-2 rounded-xl" onClick={() => {}}>
                      <Download className="h-3.5 w-3.5" />
                      Export CSV
                    </Button>
                    <Button onClick={handleSubmitStudentAttendance} disabled={submitting || students.length === 0} className="gap-2 rounded-xl gradient-primary border-0 text-white">
                      <Check className="h-3.5 w-3.5" />
                      {submitting ? 'Saving...' : 'Save Attendance'}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {studentLoading ? (
                  <div className="flex justify-center p-8 text-muted-foreground">Loading students...</div>
                ) : students.length > 0 ? (
                  <div className="space-y-2 max-h-[500px] overflow-y-auto">
                    {students.map((student, i) => (
                      <motion.div
                        key={student.id}
                        initial={{ x: -10, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: i * 0.02 }}
                        className="flex items-center gap-3 rounded-xl bg-muted/30 p-3"
                      >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-xs font-bold text-primary">
                          {student.rollNumber.slice(-2)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold truncate">{student.name}</p>
                          <p className="text-xs text-muted-foreground">{student.rollNumber} • {student.section}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant={student.attendanceStatus === 'present' ? 'default' : 'outline'}
                            size="icon"
                            className={cn('h-9 w-9 rounded-lg', student.attendanceStatus === 'present' && 'bg-emerald-500 text-white')}
                            onClick={() => toggleStudentStatus(student.id)}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            variant={student.attendanceStatus === 'late' ? 'default' : 'outline'}
                            size="icon"
                            className={cn('h-9 w-9 rounded-lg', student.attendanceStatus === 'late' && 'bg-amber-500 text-white')}
                            onClick={() => toggleStudentStatus(student.id)}
                          >
                            <Clock className="h-4 w-4" />
                          </Button>
                          <Button
                            variant={student.attendanceStatus === 'absent' ? 'default' : 'outline'}
                            size="icon"
                            className={cn('h-9 w-9 rounded-lg', student.attendanceStatus === 'absent' && 'bg-red-500 text-white')}
                            onClick={() => toggleStudentStatus(student.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                          <Button
                            variant={!student.attendanceStatus ? 'default' : 'outline'}
                            size="icon"
                            className={cn('h-9 w-9 rounded-lg', !student.attendanceStatus && 'bg-muted-foreground/10 text-muted-foreground')}
                            onClick={() => toggleStudentStatus(student.id)}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                        </div>
                        {student.attendanceId && (
                          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px]">
                            Saved
                          </Badge>
                        )}
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
                    <Users className="h-12 w-12 opacity-30" />
                    <p className="text-sm font-medium">No students found</p>
                    <p className="text-xs">Select section, subject, period and click Load Students</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}