'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ClipboardCheck,
  Clock,
  Timer,
  BookOpen,
  Users,
  CheckCircle2,
  Calendar,
  Search,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { StatCard } from '@/components/ui/stat-card';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { getDocuments, createDocument, updateDocument, whereClause, orderByClause, COLLECTIONS } from '@/lib/firebase/firestore';
import type { MentorAttendance } from '@/types';

export default function MentorAttendancePage() {
  const { user } = useAuth();
  const [checkedIn, setCheckedIn] = useState(false);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ topic: '', notes: '', studentCount: '' });
  const [manualSH, setManualSH] = useState<string>('');
  const [history, setHistory] = useState<MentorAttendance[]>([]);
  const [loading, setLoading] = useState(true);

  const currentHour = new Date().getHours();
  const isStudyHour1 = currentHour >= 17 && currentHour < 20;
  const isStudyHour2 = currentHour >= 20 && currentHour < 22;
  const autoSH = isStudyHour1 ? '1' : isStudyHour2 ? '2' : '';
  const selectedSH = manualSH || autoSH;
  
  const todayDateStr = new Date().toLocaleDateString('en-CA');

  useEffect(() => {
    if (!user) return;
    
    const fetchHistory = async () => {
      try {
        const records = await getDocuments<MentorAttendance>(COLLECTIONS.MENTOR_ATTENDANCE, [
          whereClause('mentorId', '==', user.uid)
        ]);
        
        // Sort by date and checkInTime descending
        records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setHistory(records);
        
        // See if already checked in today for current study hour
        if (selectedSH) {
          const alreadyCheckedIn = records.some(r => r.date === todayDateStr && String(r.studyHour) === selectedSH);
          setCheckedIn(alreadyCheckedIn);
        }
      } catch (err) {
        console.error('Failed to fetch mentor attendance', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchHistory();
  }, [user, selectedSH, todayDateStr]);

  const filtered = history.filter(h =>
    h.topic?.toLowerCase().includes(search.toLowerCase()) || h.date.includes(search)
  );

  const handleCheckIn = async () => {
    if (!user) return;
    if (!form.topic || !form.studentCount) {
      toast.error('Please fill in topic and student count');
      return;
    }
    if (!selectedSH) {
      toast.error('Please select a study hour');
      return;
    }
    
    const studentCount = parseInt(form.studentCount) || 0;
    
    try {
      toast.info('Checking in...', { id: 'checkin' });
      
      const records = await getDocuments<MentorAttendance>(COLLECTIONS.MENTOR_ATTENDANCE, [
         whereClause('mentorId', '==', user?.uid),
         whereClause('date', '==', todayDateStr),
         whereClause('studyHour', '==', parseInt(selectedSH))
      ]);
      
      let newRecord;
      if (records.length > 0) {
         const existing = records[0] as { id: string };
         await updateDocument(COLLECTIONS.MENTOR_ATTENDANCE, existing.id, {
            topic: form.topic,
            notes: form.notes,
            studentCount: studentCount
         });
         newRecord = { ...records[0], topic: form.topic, notes: form.notes, studentCount } as MentorAttendance;
      } else {
         const data = {
            mentorId: user.uid,
            mentorName: user.displayName || 'Unknown',
            email: user.email || '',
            studyHour: parseInt(selectedSH) as 1 | 2,
            date: todayDateStr,
            topic: form.topic,
            notes: form.notes,
            studentCount: studentCount,
            checkInTime: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
            inCollege: false,
         };
         const id = await createDocument(COLLECTIONS.MENTOR_ATTENDANCE, data);
         newRecord = { id, ...data } as unknown as MentorAttendance;
      }
      
      setHistory(prev => [newRecord, ...prev.filter(r => r.id !== newRecord.id)].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      setCheckedIn(true);
      toast.success(`Checked in for Study Hour ${selectedSH}!`, { id: 'checkin' });
    } catch (err) {
      console.error(err);
      toast.error('Failed to check in', { id: 'checkin' });
    }
  };

  const sessionsThisMonth = history.filter(h => h.date.startsWith(todayDateStr.slice(0, 7))).length;
  const avgStudents = history.length > 0 ? Math.round(history.reduce((acc, h) => acc + (h.studentCount || 0), 0) / history.length) : 0;
  const totalHours = history.reduce((acc, h) => acc + (h.duration || 120), 0) / 60;

  return (
    <DashboardLayout role="mentor">
      <div className="space-y-6 pb-20 lg:pb-8">
        <PageHeader title="Attendance History" description="Check in for study hours and view history" />

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard title="This Month" value={`${sessionsThisMonth} sessions`} icon={<ClipboardCheck className="h-5 w-5 text-primary" />} iconBg="bg-primary/10" delay={0} />
          <StatCard title="Total Hours" value={`${Math.round(totalHours)}h`} icon={<Clock className="h-5 w-5 text-amber-500" />} iconBg="bg-amber-500/10" delay={0.1} />
          <StatCard title="Avg Students" value={avgStudents} icon={<Users className="h-5 w-5 text-emerald-500" />} iconBg="bg-emerald-500/10" delay={0.2} />
          <StatCard title="On-Time Rate" value="—" icon={<CheckCircle2 className="h-5 w-5 text-violet-500" />} iconBg="bg-violet-500/10" delay={0.3} />
        </div>

        {!checkedIn && (
          <Card className={`glass-card border-0 ring-2 ring-primary/30`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Timer className="h-4 w-4 text-primary" />
                Check In – Study Hour
              </CardTitle>
              <CardDescription>Log today&apos;s study hour details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 sm:col-span-2">
                <Label className="text-xs">Study Hour *</Label>
                <Select value={selectedSH} onValueChange={(v) => v && setManualSH(v)}>
                  <SelectTrigger className="h-10 rounded-xl bg-background/50"><SelectValue placeholder={autoSH ? `SH ${autoSH} (auto-detected)` : 'Select study hour'} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Study Hour 1 (5:30 PM – 7:30 PM)</SelectItem>
                    <SelectItem value="2">Study Hour 2 (8:30 PM – 10:00 PM)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mt-4">
                <div className="space-y-2">
                  <Label className="text-xs">Topic Covered *</Label>
                  <Input value={form.topic} onChange={e => setForm({ ...form, topic: e.target.value })} placeholder="e.g., Organic Chemistry - Alkenes" className="rounded-xl bg-background/50 h-10" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Students Present *</Label>
                  <Input type="number" value={form.studentCount} onChange={e => setForm({ ...form, studentCount: e.target.value })} placeholder="e.g., 45" className="rounded-xl bg-background/50 h-10" />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label className="text-xs">Notes</Label>
                  <Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Observations, doubts raised, students needing help..." className="rounded-xl bg-background/50 min-h-[70px]" rows={2} />
                </div>
              </div>
              <Button onClick={handleCheckIn} className="mt-4 w-full gap-2 rounded-xl gradient-primary border-0 text-white sm:w-auto">
                <ClipboardCheck className="h-4 w-4" />
                Check In
              </Button>
            </CardContent>
          </Card>
        )}

        {checkedIn && (
          <Card className="glass-card border-0 border-emerald-500/20">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="font-semibold text-emerald-600">Checked In for Study Hour {selectedSH}</p>
                <p className="text-xs text-muted-foreground">You have successfully logged attendance for this session.</p>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="glass-card border-0">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base"><Calendar className="h-4 w-4 text-primary" />Attendance History</CardTitle>
            <CardDescription>Your study hour check-in records</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative max-w-sm mb-4">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search by topic or date..." value={search} onChange={e => setSearch(e.target.value)} className="h-10 rounded-xl bg-background/50 pl-9" />
            </div>
            
            {loading ? (
               <div className="flex justify-center p-8 text-muted-foreground">Loading history...</div>
            ) : (
              <div className="space-y-2">
                {filtered.map((h, i) => (
                  <motion.div
                    key={h.id}
                    initial={{ y: 5, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="flex flex-col gap-2 rounded-xl bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                        <BookOpen className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{h.topic || 'No topic logged'}</p>
                        <div className="flex flex-wrap items-center gap-x-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{h.date}</span>
                          <span className="flex items-center gap-1"><Timer className="h-3 w-3" />SH {h.studyHour}</span>
                          <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{h.checkInTime}</span>
                        </div>
                        {h.notes && <p className="mt-1 text-xs text-muted-foreground">📝 {h.notes}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="outline" className="rounded-lg">
                        <Users className="mr-1 h-3 w-3" />{h.studentCount || 0}
                      </Badge>
                      {h.sectionId && <Badge variant="outline" className="rounded-lg">{h.sectionId}</Badge>}
                    </div>
                  </motion.div>
                ))}
                {filtered.length === 0 && (
                  <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
                    <ClipboardCheck className="h-10 w-10 opacity-30" />
                    <p className="text-sm">No history found</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
