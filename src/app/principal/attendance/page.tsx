'use client';

import React, { useState, useSyncExternalStore } from 'react';
import { motion } from 'framer-motion';
import {
  ClipboardCheck,
  Search,
  Calendar,
  Clock,
} from 'lucide-react';
import { subscribe, getData } from '@/lib/data-store';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { StatCard } from '@/components/ui/stat-card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from 'recharts';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSocket, useSocketEvent } from '@/lib/socket/client';
import { SOCKET_EVENTS } from '@/lib/socket/events';

function getInitials(name: string) { return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2); }

const statusColors = { present: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20', late: 'bg-amber-500/10 text-amber-600 border-amber-500/20', absent: 'bg-red-500/10 text-red-600 border-red-500/20' };

const weeklyData = [
  { day: 'Mon', present: 145, late: 12, absent: 5 },
  { day: 'Tue', present: 150, late: 8, absent: 4 },
  { day: 'Wed', present: 148, late: 10, absent: 4 },
  { day: 'Thu', present: 142, late: 15, absent: 5 },
  { day: 'Fri', present: 146, late: 11, absent: 5 },
];

export default function AttendancePage() {
  const queryClient = useQueryClient();
  const socket = useSocket();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  
  useSocketEvent(socket ? SOCKET_EVENTS.ATTENDANCE_UPDATED : '', () => {
    queryClient.invalidateQueries({ queryKey: ['attendance'] });
  });

  const todayStr = new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const { data: fetchRecords = [] } = useQuery({
    queryKey: ['attendance'],
    queryFn: () => fetch('/api/attendance').then(r => r.json()).then(d => d.records || []),
    refetchInterval: 30000,
  });

  const recordsData = fetchRecords.map((r: any) => ({
    id: r.id,
    name: r.teacherName || r.mentorName || 'Unknown',
    role: r.role,
    status: r.status || 'present',
    checkIn: r.checkIn || '-',
    date: r.date,
  }));

  const filtered = recordsData.filter((r: any) => {
    const matchSearch = r.name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || r.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const present = recordsData.filter((r: any) => r.status === 'present').length;
  const late = recordsData.filter((r: any) => r.status === 'late').length;
  const absent = recordsData.filter((r: any) => r.status === 'absent').length;

  return (
    <DashboardLayout role="principal" userName="Principal" userEmail="principal@collegedost.com">
      <div className="space-y-6 pb-8">
        <PageHeader title="Attendance" description="Monitor daily teacher attendance">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            {todayStr || 'Loading...'}
          </div>
        </PageHeader>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard title="Total Staff" value={recordsData.length} icon={<ClipboardCheck className="h-5 w-5 text-primary" />} iconBg="bg-primary/10" delay={0} />
          <StatCard title="Present" value={present} icon={<ClipboardCheck className="h-5 w-5 text-emerald-500" />} iconBg="bg-emerald-500/10" description={`${Math.round(recordsData.length > 0 ? (present / recordsData.length) * 100 : 0)}%`} delay={0.1} />
          <StatCard title="Late" value={late} icon={<Clock className="h-5 w-5 text-amber-500" />} iconBg="bg-amber-500/10" delay={0.2} />
          <StatCard title="Absent" value={absent} icon={<ClipboardCheck className="h-5 w-5 text-red-500" />} iconBg="bg-red-500/10" delay={0.3} />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card className="glass-card border-0 lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base"><ClipboardCheck className="h-4 w-4 text-primary" />Today&rsquo;s Attendance</CardTitle>
              <CardDescription>Teacher check-ins for today</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="h-10 rounded-xl bg-background/50 pl-9" />
                </div>
                <Select value={filterStatus} onValueChange={(v) => v && setFilterStatus(v)}>
                  <SelectTrigger className="h-10 w-[130px] rounded-xl bg-background/50"><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="present">Present</SelectItem>
                    <SelectItem value="late">Late</SelectItem>
                    <SelectItem value="absent">Absent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                {fetchRecords.map((r: any, i: number) => (
                  <motion.div
                    key={r.id || i}
                    initial={{ y: 5, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className="group flex items-center justify-between rounded-xl bg-muted/30 p-3 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8"><AvatarFallback className="bg-primary/10 text-[10px] font-bold text-primary">{getInitials(r.name)}</AvatarFallback></Avatar>
                      <div>
                        <p className="text-sm font-semibold">{r.name}</p>
                        <p className="text-xs text-muted-foreground">{r.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">{r.checkIn}</span>
                      <Badge variant="outline" className={`rounded-lg text-[10px] px-2 capitalize ${statusColors[r.status as 'present' | 'late' | 'absent']}`}>{r.status}</Badge>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-0">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base"><ClipboardCheck className="h-4 w-4 text-primary" />Weekly Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={weeklyData} barGap={2}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="day" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis fontSize={11} tickLine={false} axisLine={false} />
                  <RechartsTooltip contentStyle={{ background: 'var(--popover)', border: '1px solid var(--border)', borderRadius: '12px', fontSize: '12px' }} />
                  <Bar dataKey="present" fill="#10b981" radius={[3, 3, 0, 0]} name="Present" />
                  <Bar dataKey="late" fill="#f59e0b" radius={[3, 3, 0, 0]} name="Late" />
                  <Bar dataKey="absent" fill="#ef4444" radius={[3, 3, 0, 0]} name="Absent" />
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-4 flex items-center justify-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />Present</span>
                <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-amber-500" />Late</span>
                <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-red-500" />Absent</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
