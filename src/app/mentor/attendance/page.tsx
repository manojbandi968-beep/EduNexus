'use client';

import React, { useState } from 'react';
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
import { markAttendance } from '@/lib/data-store';
import type { MentorAttendance } from '@/types';

const history: MentorAttendance[] = [
  { id: '1', mentorId: 'm1', mentorName: 'Mr. Suresh Babu', date: '2025-07-04', studyHour: 1, checkInTime: '17:32', topic: 'Organic Chemistry - Hydrocarbons', studentCount: 45, notes: 'Covered alkanes and alkenes', duration: 120, sectionId: 'MPC-A', createdAt: '2025-07-04T17:32:00Z', updatedAt: '2025-07-04T17:32:00Z' },
  { id: '2', mentorId: 'm1', mentorName: 'Mr. Suresh Babu', date: '2025-07-03', studyHour: 2, checkInTime: '20:15', topic: 'Physics - Wave Optics', studentCount: 42, notes: 'Doubt session on diffraction', duration: 90, sectionId: 'MPC-B', createdAt: '2025-07-03T20:15:00Z', updatedAt: '2025-07-03T20:15:00Z' },
  { id: '3', mentorId: 'm1', mentorName: 'Mr. Suresh Babu', date: '2025-07-02', studyHour: 1, checkInTime: '17:30', topic: 'Mathematics - Differential Equations', studentCount: 48, duration: 120, sectionId: 'MPC-A', createdAt: '2025-07-02T17:30:00Z', updatedAt: '2025-07-02T17:30:00Z' },
  { id: '4', mentorId: 'm1', mentorName: 'Mr. Suresh Babu', date: '2025-07-01', studyHour: 1, checkInTime: '17:28', topic: 'Chemistry - Periodic Table', studentCount: 44, notes: 'Students struggled with periodic trends', duration: 120, sectionId: 'BiPC-A', createdAt: '2025-07-01T17:28:00Z', updatedAt: '2025-07-01T17:28:00Z' },
];

export default function MentorAttendance() {
  const [checkedIn, setCheckedIn] = useState(false);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ topic: '', notes: '', studentCount: '' });
  const [manualSH, setManualSH] = useState<string>('');

  const currentHour = new Date().getHours();
  const isStudyHour1 = currentHour >= 17 && currentHour < 20;
  const isStudyHour2 = currentHour >= 20 && currentHour < 22;
  const autoSH = isStudyHour1 ? '1' : isStudyHour2 ? '2' : '';
  const selectedSH = manualSH || autoSH;

  const filtered = history.filter(h =>
    h.topic.toLowerCase().includes(search.toLowerCase()) || h.date.includes(search)
  );

  const handleCheckIn = () => {
    if (!form.topic || !form.studentCount) {
      toast.error('Please fill in topic and student count');
      return;
    }
    if (!selectedSH) {
      toast.error('Please select a study hour');
      return;
    }
    setCheckedIn(true);
    markAttendance({
      teacherName: `Mr. Suresh Babu (Mentor)`,
      status: 'present',
      time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      date: new Date().toISOString().split('T')[0],
    });
    toast.success(`Checked in for Study Hour ${selectedSH}!`);
  };

  return (
    <DashboardLayout role="mentor" userName="Mr. Suresh Babu" userEmail="suresh@college.edu">
      <div className="space-y-6 pb-20 lg:pb-8">
        <PageHeader title="Attendance" description="Check in for study hours and view history" />

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard title="This Month" value="24 sessions" icon={<ClipboardCheck className="h-5 w-5 text-primary" />} iconBg="bg-primary/10" delay={0} />
          <StatCard title="Total Hours" value="48h" icon={<Clock className="h-5 w-5 text-amber-500" />} iconBg="bg-amber-500/10" delay={0.1} />
          <StatCard title="Avg Students" value={45} icon={<Users className="h-5 w-5 text-emerald-500" />} iconBg="bg-emerald-500/10" delay={0.2} />
          <StatCard title="On-Time Rate" value="94%" icon={<CheckCircle2 className="h-5 w-5 text-violet-500" />} iconBg="bg-violet-500/10" delay={0.3} />
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
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                <p className="text-xs text-muted-foreground">Session started at {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
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
                      <p className="font-semibold text-sm">{h.topic}</p>
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
                      <Users className="mr-1 h-3 w-3" />{h.studentCount}
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
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
