'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  CalendarOff,
  Plus,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Hourglass,
} from 'lucide-react';
import { requestLeave, subscribe, getData } from '@/lib/data-store';
import { useSyncExternalStore } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/components/ui/stat-card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { getSocket } from '@/lib/socket/client';
import { SOCKET_EVENTS } from '@/lib/socket/events';
import type { LeaveType, LeaveStatus } from '@/types';

interface LeaveRequest {
  id: string;
  type: LeaveType;
  startDate: string;
  endDate: string;
  reason: string;
  status: LeaveStatus;
  days: number;
  appliedOn: string;
  approvedBy?: string;
}

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSocket, useSocketEvent } from '@/lib/socket/client';
import { useAuth } from '@/contexts/AuthContext';

const typeColors: Record<LeaveType, string> = {
  casual: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  sick: 'bg-red-500/10 text-red-600 border-red-500/20',
  emergency: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
};

const statusIcons: Record<LeaveStatus, React.ReactNode> = {
  approved: <CheckCircle2 className="h-4 w-4 text-emerald-500" />,
  rejected: <XCircle className="h-4 w-4 text-red-500" />,
  pending: <Hourglass className="h-4 w-4 text-amber-500" />,
};

const statusColors: Record<LeaveStatus, string> = {
  approved: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  rejected: 'bg-red-500/10 text-red-600 border-red-500/20',
  pending: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
};

const leaveBalance = { casual: { used: 3, total: 12 }, sick: { used: 2, total: 10 }, emergency: { used: 0, total: 5 } };

export default function TeacherLeave() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const socket = useSocket();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ type: '' as LeaveType | '', startDate: '', endDate: '', reason: '' });

  const { data: allLeaves = [], isLoading } = useQuery({
    queryKey: ['leaves', user?.uid],
    queryFn: () => fetch(`/api/leaves?userId=${user?.uid}`).then(res => res.json()).then(data => data.records || []),
    enabled: !!user?.uid,
  });

  useSocketEvent(socket ? SOCKET_EVENTS.LEAVE_APPROVED : '', () => {
    queryClient.invalidateQueries({ queryKey: ['leaves', user?.uid] });
  });
  useSocketEvent(socket ? SOCKET_EVENTS.LEAVE_REJECTED : '', () => {
    queryClient.invalidateQueries({ queryKey: ['leaves', user?.uid] });
  });

  const handleRequest = async () => {
    if (!form.type || !form.startDate || !form.endDate || !form.reason) {
      toast.error('Please fill in all fields');
      return;
    }
    const start = new Date(form.startDate);
    const end = new Date(form.endDate);
    const days = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);

    const newLeave = {
      teacherId: user?.uid,
      teacherName: user?.displayName || 'Teacher',
      type: form.type as LeaveType,
      startDate: form.startDate,
      endDate: form.endDate,
      reason: form.reason,
      days,
    };
    
    try {
      const response = await fetch('/api/leaves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLeave),
      });
      
      if (!response.ok) throw new Error('Failed to create leave');
      
      queryClient.invalidateQueries({ queryKey: ['leaves', user?.uid] });

      if (socket) {
        socket.emit(SOCKET_EVENTS.TEACHER_REQUEST_LEAVE, {
          teacherId: user?.uid,
          teacherName: user?.displayName || 'Teacher',
          type: form.type,
          startDate: form.startDate,
          endDate: form.endDate,
          reason: form.reason,
          days,
          appliedOn: new Date().toISOString().split('T')[0],
          timestamp: Date.now()
        });
      }

      toast.success('Leave request submitted for approval');
      setDialogOpen(false);
      setForm({ type: '', startDate: '', endDate: '', reason: '' });
    } catch (error) {
      toast.error('Failed to submit leave request');
    }
  };

  return (
    <DashboardLayout role="teacher" userName={user?.displayName || 'Teacher'} userEmail={user?.email || 'teacher@collegedost.com'}>
      <div className="space-y-6 pb-20 lg:pb-8">
        <PageHeader title="Leave" description="Request and track your leave">
          <Button onClick={() => setDialogOpen(true)} className="gap-2 rounded-xl gradient-primary border-0 text-white">
            <Plus className="h-4 w-4" />
            Request Leave
          </Button>
        </PageHeader>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard title="Total Requests" value={allLeaves.length} icon={<CalendarOff className="h-5 w-5 text-primary" />} iconBg="bg-primary/10" delay={0} />
          <StatCard title="Approved" value={allLeaves.filter((l: any) => l.status === 'approved').length} icon={<CheckCircle2 className="h-5 w-5 text-emerald-500" />} iconBg="bg-emerald-500/10" delay={0.1} />
          <StatCard title="Pending" value={allLeaves.filter((l: any) => l.status === 'pending').length} icon={<Hourglass className="h-5 w-5 text-amber-500" />} iconBg="bg-amber-500/10" delay={0.2} />
          <StatCard title="Rejected" value={allLeaves.filter((l: any) => l.status === 'rejected').length} icon={<XCircle className="h-5 w-5 text-red-500" />} iconBg="bg-red-500/10" delay={0.3} />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {(Object.entries(leaveBalance) as [LeaveType, typeof leaveBalance.casual][]).map(([type, balance]) => (
            <Card key={type} className="glass-card border-0">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="outline" className={`rounded-lg text-xs capitalize ${typeColors[type]}`}>{type}</Badge>
                  <span className="text-sm font-bold">{balance.total - balance.used} left</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(balance.used / balance.total) * 100}%` }} />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{balance.used}/{balance.total} used</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="glass-card border-0">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base"><CalendarOff className="h-4 w-4 text-primary" />Leave History</CardTitle>
            <CardDescription>Your leave requests and their status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {allLeaves.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
                  <CalendarOff className="h-10 w-10 opacity-30" />
                  <p className="text-sm">No leave requests yet</p>
                </div>
              ) : (
                allLeaves.map((leave: any, i: number) => (
                  <motion.div
                    key={leave.id}
                    initial={{ y: 5, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="flex flex-col gap-2 rounded-xl bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                        {statusIcons[leave.status as LeaveStatus]}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={`rounded-lg text-[10px] px-2 capitalize ${typeColors[leave.type as LeaveType]}`}>{leave.type}</Badge>
                          <Badge variant="outline" className={`rounded-lg text-[10px] px-2 capitalize ${statusColors[leave.status as LeaveStatus]}`}>{leave.status}</Badge>
                        </div>
                        <div className="mt-0.5 flex flex-wrap items-center gap-x-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{leave.startDate} → {leave.endDate}</span>
                          <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{leave.days} day{leave.days > 1 ? 's' : ''}</span>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground line-clamp-1">{leave.reason}</p>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="rounded-2xl sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle>Request Leave</DialogTitle>
            <DialogDescription>Submit a leave request for Principal approval</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs">Leave Type *</Label>
              <Select value={form.type} onValueChange={v => setForm({ ...form, type: v as LeaveType })}>
                <SelectTrigger className="h-10 rounded-xl bg-background/50"><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="casual">Casual Leave</SelectItem>
                  <SelectItem value="sick">Sick Leave</SelectItem>
                  <SelectItem value="emergency">Emergency Leave</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">Start Date *</Label>
                <Input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} className="rounded-xl bg-background/50 h-10" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">End Date *</Label>
                <Input type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} className="rounded-xl bg-background/50 h-10" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Reason *</Label>
              <Textarea value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} placeholder="Explain the reason for your leave..." className="rounded-xl bg-background/50 min-h-[80px]" rows={3} />
            </div>
          </div>
          <DialogFooter className="gap-2 mt-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="rounded-xl">Cancel</Button>
            <Button onClick={handleRequest} className="rounded-xl gradient-primary border-0 text-white">Submit Request</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
