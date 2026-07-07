'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StreamBadge } from '@/components/ui/stream-badge';
import { Separator } from '@/components/ui/separator';
import { DAYS_OF_WEEK } from '@/lib/constants';
import type { DayOfWeek, StreamCode } from '@/types';

interface ClassEntry {
  id: string;
  period: string;
  time: string;
  subject: string;
  section: string;
  stream: StreamCode;
  room: string;
  status?: 'completed' | 'current' | 'upcoming';
}

const weekData: Record<string, ClassEntry[]> = {
  monday: [
    { id: 'm1', period: 'Period 1', time: '7:00 - 8:00', subject: 'Mathematics', section: 'MPC-A', stream: 'MPC', room: '101', status: 'completed' },
    { id: 'm2', period: 'Period 3', time: '9:00 - 10:00', subject: 'Mathematics', section: 'MPC-B', stream: 'MPC', room: '205', status: 'current' },
    { id: 'm3', period: 'Period 5', time: '11:15 - 12:30', subject: 'Mathematics', section: 'MPC-C', stream: 'MPC', room: '301', status: 'upcoming' },
    { id: 'm4', period: 'Period 7', time: '2:30 - 3:30', subject: 'Mathematics', section: 'BiPC-A', stream: 'BiPC', room: '102', status: 'upcoming' },
  ],
  tuesday: [
    { id: 't1', period: 'Period 2', time: '8:00 - 9:00', subject: 'Mathematics', section: 'MPC-A', stream: 'MPC', room: '101' },
    { id: 't2', period: 'Period 4', time: '10:00 - 11:00', subject: 'Mathematics', section: 'MPC-B', stream: 'MPC', room: '205' },
    { id: 't3', period: 'Period 6', time: '1:30 - 2:30', subject: 'Mathematics', section: 'BiPC-A', stream: 'BiPC', room: '102' },
  ],
  wednesday: [
    { id: 'w1', period: 'Period 1', time: '7:00 - 8:00', subject: 'Mathematics', section: 'MPC-C', stream: 'MPC', room: '301' },
    { id: 'w2', period: 'Period 3', time: '9:00 - 10:00', subject: 'Mathematics', section: 'MPC-A', stream: 'MPC', room: '101' },
    { id: 'w3', period: 'Period 5', time: '11:15 - 12:30', subject: 'Mathematics', section: 'MPC-B', stream: 'MPC', room: '205' },
  ],
  thursday: [
    { id: 'th1', period: 'Period 2', time: '8:00 - 9:00', subject: 'Mathematics', section: 'BiPC-A', stream: 'BiPC', room: '102' },
    { id: 'th2', period: 'Period 4', time: '10:00 - 11:00', subject: 'Mathematics', section: 'MPC-C', stream: 'MPC', room: '301' },
  ],
  friday: [
    { id: 'f1', period: 'Period 1', time: '7:00 - 8:00', subject: 'Mathematics', section: 'MPC-B', stream: 'MPC', room: '205' },
    { id: 'f2', period: 'Period 6', time: '1:30 - 2:30', subject: 'Mathematics', section: 'MPC-A', stream: 'MPC', room: '101' },
  ],
  saturday: [
    { id: 's1', period: 'Period 3', time: '9:00 - 10:00', subject: 'Mathematics', section: 'MPC-A', stream: 'MPC', room: '101' },
  ],
};

const weekDays = DAYS_OF_WEEK.map(d => d.value);

export default function TeacherTimetable() {
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>('monday');
  const dayIndex = weekDays.indexOf(selectedDay);

  const entries = weekData[selectedDay] || [];
  const currentPeriod = entries.find(e => e.status === 'current');

  const prevDay = () => { const idx = dayIndex > 0 ? dayIndex - 1 : weekDays.length - 1; setSelectedDay(weekDays[idx] as DayOfWeek); };
  const nextDay = () => { const idx = dayIndex < weekDays.length - 1 ? dayIndex + 1 : 0; setSelectedDay(weekDays[idx] as DayOfWeek); };

  return (
    <DashboardLayout role="teacher" userName="Dr. Ramesh Kumar" userEmail="ramesh@college.edu">
      <div className="space-y-6 pb-20 lg:pb-8">
        <PageHeader title="My Timetable" description="View your weekly class schedule" />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={prevDay} className="h-9 w-9 rounded-xl"><ChevronLeft className="h-4 w-4" /></Button>
            <div className="flex items-center gap-2 px-3">
              <Calendar className="h-4 w-4 text-primary" />
              <span className="font-semibold">{DAYS_OF_WEEK.find(d => d.value === selectedDay)?.label}</span>
            </div>
            <Button variant="outline" size="icon" onClick={nextDay} className="h-9 w-9 rounded-xl"><ChevronRight className="h-4 w-4" /></Button>
          </div>
          <div className="flex gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500" />{entries.filter(e => e.status === 'completed').length} done</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-primary" />{entries.filter(e => e.status === 'current').length} live</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-muted-foreground/30" />{entries.filter(e => !e.status || e.status === 'upcoming').length} upcoming</span>
          </div>
        </div>

        {currentPeriod && (
          <Card className="glass-card border-0 ring-2 ring-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                </span>
                <span className="text-xs font-semibold text-primary">Current Class</span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-bold">{currentPeriod.subject}</p>
                  <p className="text-sm text-muted-foreground">{currentPeriod.period} · Room {currentPeriod.room}</p>
                </div>
                <StreamBadge stream={currentPeriod.stream} size="lg" />
              </div>
              <Separator className="my-3" />
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1 text-muted-foreground"><Clock className="h-4 w-4" />{currentPeriod.time}</span>
                <Badge variant="outline" className="border-primary/30 text-primary">{currentPeriod.section}</Badge>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-3">
          {entries.length === 0 ? (
            <Card className="glass-card border-0">
              <CardContent className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
                <Calendar className="h-12 w-12 opacity-30" />
                <p className="text-sm font-medium">No classes on {DAYS_OF_WEEK.find(d => d.value === selectedDay)?.label}</p>
              </CardContent>
            </Card>
          ) : (
            entries.map((cls, i) => (
              <motion.div
                key={cls.id}
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className={`glass-card border-0 ${cls.status === 'current' ? 'ring-2 ring-primary/20' : ''}`}>
                  <CardContent className={`flex items-center justify-between p-4 ${cls.status === 'completed' ? 'opacity-60' : ''}`}>
                    <div className="flex items-center gap-4">
                      <div className={`flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl ${cls.status === 'current' ? 'bg-primary text-primary-foreground' : 'bg-primary/10'}`}>
                        <span className="text-xs font-bold">{cls.period.replace('Period ', 'P')}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">{cls.subject}</p>
                          <Badge variant="outline" className="rounded-lg text-[10px]">{cls.section}</Badge>
                          <StreamBadge stream={cls.stream} size="sm" />
                        </div>
                        <div className="mt-1 flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{cls.time}</span>
                          <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />Room {cls.room}</span>
                        </div>
                      </div>
                    </div>
                    <Badge className={`rounded-lg text-[10px] ${cls.status === 'current' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : cls.status === 'completed' ? 'bg-muted-foreground/10 text-muted-foreground border-muted-foreground/20' : ''}`}>
                      {cls.status === 'current' ? '● Live' : cls.status === 'completed' ? '✓ Done' : 'Upcoming'}
                    </Badge>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
