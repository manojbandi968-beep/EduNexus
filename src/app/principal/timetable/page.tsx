'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar,
  Plus,
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
  MapPin,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StreamBadge } from '@/components/ui/stream-badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DAYS_OF_WEEK, DEFAULT_SCHEDULE } from '@/lib/constants';
import type { DayOfWeek, StreamCode } from '@/types';

interface TimetableEntry {
  id: string;
  dayOfWeek: DayOfWeek;
  timeSlotId: string;
  section: string;
  subject: string;
  teacher: string;
  room: string;
}

const periods = DEFAULT_SCHEDULE.filter(s => s.type === 'period');

const dayEntries: Record<string, TimetableEntry[]> = {
  monday: [
    { id: 'm1', dayOfWeek: 'monday', timeSlotId: 'p1', section: 'MPC-A', subject: 'Mathematics', teacher: 'Dr. Ramesh Kumar', room: '101' },
    { id: 'm2', dayOfWeek: 'monday', timeSlotId: 'p2', section: 'MPC-B', subject: 'Mathematics', teacher: 'Dr. Ramesh Kumar', room: '205' },
    { id: 'm3', dayOfWeek: 'monday', timeSlotId: 'p3', section: 'MPC-A', subject: 'Physics', teacher: 'Prof. S. Lakshmi', room: '101' },
    { id: 'm4', dayOfWeek: 'monday', timeSlotId: 'p5', section: 'MPC-C', subject: 'Mathematics', teacher: 'Dr. Ramesh Kumar', room: '301' },
    { id: 'm5', dayOfWeek: 'monday', timeSlotId: 'p6', section: 'MPC-A', subject: 'Chemistry', teacher: 'Dr. Sunita Desai', room: '102' },
    { id: 'm6', dayOfWeek: 'monday', timeSlotId: 'p7', section: 'BiPC-A', subject: 'Biology', teacher: 'Dr. Venkat Rao', room: '201' },
  ],
  tuesday: [
    { id: 't1', dayOfWeek: 'tuesday', timeSlotId: 'p1', section: 'MPC-B', subject: 'Mathematics', teacher: 'Dr. Ramesh Kumar', room: '205' },
    { id: 't2', dayOfWeek: 'tuesday', timeSlotId: 'p2', section: 'MPC-A', subject: 'Physics', teacher: 'Prof. S. Lakshmi', room: '101' },
    { id: 't3', dayOfWeek: 'tuesday', timeSlotId: 'p4', section: 'BiPC-A', subject: 'Chemistry', teacher: 'Dr. Venkat Rao', room: '201' },
  ],
  wednesday: [
    { id: 'w1', dayOfWeek: 'wednesday', timeSlotId: 'p1', section: 'MPC-C', subject: 'Mathematics', teacher: 'Dr. Ramesh Kumar', room: '301' },
  ],
  thursday: [],
  friday: [],
  saturday: [],
};

const sections = ['MPC-A', 'MPC-B', 'MPC-C', 'BiPC-A', 'BiPC-B', 'CEC-A', 'CEC-B'];

export default function TimetablePage() {
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>('monday');
  const [filterSection, setFilterSection] = useState('all');
  const dayIndex = DAYS_OF_WEEK.findIndex(d => d.value === selectedDay);

  const entries = (dayEntries[selectedDay] || []).filter(e => filterSection === 'all' || e.section === filterSection);

  const prevDay = () => { const idx = dayIndex > 0 ? dayIndex - 1 : DAYS_OF_WEEK.length - 1; setSelectedDay(DAYS_OF_WEEK[idx].value); };
  const nextDay = () => { const idx = dayIndex < DAYS_OF_WEEK.length - 1 ? dayIndex + 1 : 0; setSelectedDay(DAYS_OF_WEEK[idx].value); };

  const getPeriodById = (id: string) => periods.find(p => p.id === id);

  return (
    <DashboardLayout role="principal" userName="Principal" userEmail="principal@collegedost.com">
      <div className="space-y-6 pb-8">
        <PageHeader title="Timetable" description="View and manage the master timetable">
          <Button className="gap-2 rounded-xl gradient-primary border-0 text-white">
            <Plus className="h-4 w-4" />
            Edit Timetable
          </Button>
        </PageHeader>

        <Card className="glass-card border-0">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={prevDay} className="h-9 w-9 rounded-xl"><ChevronLeft className="h-4 w-4" /></Button>
                <div className="flex items-center gap-2 px-3">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span className="font-semibold">{DAYS_OF_WEEK.find(d => d.value === selectedDay)?.label}</span>
                </div>
                <Button variant="outline" size="icon" onClick={nextDay} className="h-9 w-9 rounded-xl"><ChevronRight className="h-4 w-4" /></Button>
              </div>
              <Select value={filterSection} onValueChange={(v) => v && setFilterSection(v)}>
                <SelectTrigger className="h-10 w-[160px] rounded-xl bg-background/50"><SelectValue placeholder="Section" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sections</SelectItem>
                  {sections.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-3">
          {entries.length === 0 ? (
            <Card className="glass-card border-0">
              <CardContent className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
                <Calendar className="h-12 w-12 opacity-30" />
                <p className="text-sm font-medium">No classes scheduled for {DAYS_OF_WEEK.find(d => d.value === selectedDay)?.label}</p>
              </CardContent>
            </Card>
          ) : (
            entries.map((entry, i) => {
              const period = getPeriodById(entry.timeSlotId);
              return (
                <motion.div
                  key={entry.id}
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className="glass-card border-0">
                    <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-primary/10">
                          <span className="text-xs font-bold text-primary">{period?.label.replace('Period ', 'P')}</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold">{entry.subject}</p>
                            <StreamBadge stream={entry.section.split('-')[0] as StreamCode} size="sm" />
                            <Badge variant="outline" className="rounded-lg text-[10px]">{entry.section}</Badge>
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{period?.startTime} - {period?.endTime}</span>
                            <span className="flex items-center gap-1"><User className="h-3 w-3" />{entry.teacher}</span>
                            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />Room {entry.room}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
