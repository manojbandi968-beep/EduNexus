'use client';

import React, { useState, useSyncExternalStore } from 'react';
import { motion } from 'framer-motion';
import {
  CalendarOff,
  Search,
  CheckCircle2,
  XCircle,
  Eye,
  Calendar,
  Clock,
} from 'lucide-react';
import { subscribe, getData, updateLeaveStatus } from '@/lib/data-store';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { StatCard } from '@/components/ui/stat-card';
import { Separator } from '@/components/ui/separator';
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
import type { LeaveType, LeaveStatus } from '@/types';

interface LeaveRequest {
  id: string;
  teacherId: string;
  teacherName: string;
  type: LeaveType;
  startDate: string;
  endDate: string;
  reason: string;
  status: LeaveStatus;
  appliedOn: string;
  days: number;
}

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSocket, useSocketEvent } from '@/lib/socket/client';
import { SOCKET_EVENTS } from '@/lib/socket/events';

const leaveTypeColors: Record<LeaveType, string> = {
  casual: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  sick: 'bg-red-500/10 text-red-600 border-red-500/20',
  emergency: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
};

const statusColors: Record<LeaveStatus, string> = {
  pending: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  approved: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  rejected: 'bg-red-500/10 text-red-600 border-red-500/20',
};

function getInitials(name: string) { return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2); }

export default function LeavePage() {
  const queryClient = useQueryClient();
  const socket = useSocket();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const { data: allLeaves = [], isLoading } = useQuery({
    queryKey: ['leaves'],
    queryFn: () => fetch('/api/leaves').then(res => res.json()).then(data => data.records || []),
  });

  useSocketEvent(socket ? SOCKET_EVENTS.LEAVE_REQUESTED : '', () => {
    queryClient.invalidateQueries({ queryKey: ['leaves'] });
  });

  const [detailLeave, setDetailLeave] = useState<LeaveRequest | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ type: 'approved' | 'rejected'; leave: LeaveRequest } | null>(null);

  const filtered = allLeaves.filter((l: any) => {
    const matchSearch = l.teacherName.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || l.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const pendingCount = allLeaves.filter((l: any) => l.status === 'pending').length;

  const handleAction = async () => {
    if (!confirmAction) return;
    
    try {
      const response = await fetch('/api/leaves', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: confirmAction.leave.id,
          status: confirmAction.type,
          approvedBy: 'Principal'
        })
      });
      
      if (!response.ok) throw new Error('Failed to update leave');

      // Invalidate to refresh UI instantly
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
      
      toast.success(`Leave ${confirmAction.type === 'approved' ? 'approved' : 'rejected'} for ${confirmAction.leave.teacherName}`);
      
      // Emit socket event to notify the teacher/mentor
      if (socket) {
        socket.emit(confirmAction.type === 'approved' ? SOCKET_EVENTS.PRINCIPAL_APPROVE_LEAVE : SOCKET_EVENTS.PRINCIPAL_REJECT_LEAVE, {
          leaveId: confirmAction.leave.id,
          teacherId: confirmAction.leave.teacherId,
          teacherName: confirmAction.leave.teacherName,
          status: confirmAction.type,
          approvedBy: 'Principal',
          timestamp: Date.now()
        });
      }
    } catch (error) {
      toast.error('Failed to update leave status. Please try again.');
    } finally {
      setConfirmAction(null);
    }
  };

  return (
    <DashboardLayout role="principal" userName="Principal" userEmail="principal@collegedost.com">
      <div className="space-y-6 pb-8">
        <PageHeader title="Leave Requests" description="Review and manage teacher leave requests">
          {pendingCount > 0 && <Badge className="rounded-lg bg-amber-500/10 text-amber-600 border-amber-500/20 text-xs px-3 py-1">{pendingCount} pending</Badge>}
        </PageHeader>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard title="Total Requests" value={allLeaves.length} icon={<CalendarOff className="h-5 w-5 text-primary" />} iconBg="bg-primary/10" delay={0} />
          <StatCard title="Pending" value={pendingCount} icon={<CalendarOff className="h-5 w-5 text-amber-500" />} iconBg="bg-amber-500/10" delay={0.1} />
          <StatCard title="Approved" value={allLeaves.filter((l: any) => l.status === 'approved').length} icon={<CheckCircle2 className="h-5 w-5 text-emerald-500" />} iconBg="bg-emerald-500/10" delay={0.2} />
          <StatCard title="Rejected" value={allLeaves.filter((l: any) => l.status === 'rejected').length} icon={<XCircle className="h-5 w-5 text-red-500" />} iconBg="bg-red-500/10" delay={0.3} />
        </div>

        <Card className="glass-card border-0">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Search by name..." value={search} onChange={e => setSearch(e.target.value)} className="h-10 rounded-xl bg-background/50 pl-9" />
              </div>
              <Select value={filterStatus} onValueChange={(v) => v && setFilterStatus(v)}>
                <SelectTrigger className="h-10 w-[140px] rounded-xl bg-background/50"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="mt-6 space-y-3">
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
                  <CalendarOff className="h-12 w-12 opacity-30" />
                  <p className="text-sm font-medium">No leave requests found</p>
                </div>
              ) : (
                filtered.map((leave: any, i: number) => (
                  <motion.div
                    key={leave.id}
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="flex flex-col gap-3 rounded-xl bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 shrink-0">
                        <AvatarFallback className="bg-primary/10 text-xs font-bold text-primary">{getInitials(leave.teacherName)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold">{leave.teacherName}</p>
                          <Badge variant="outline" className={`rounded-lg text-[10px] px-2 capitalize ${leaveTypeColors[leave.type as LeaveType]}`}>{leave.type}</Badge>
                          <Badge variant="outline" className={`rounded-lg text-[10px] px-2 capitalize ${statusColors[leave.status as LeaveStatus]}`}>{leave.status}</Badge>
                        </div>
                        <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{leave.startDate} → {leave.endDate}</span>
                          <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{leave.days} day{leave.days > 1 ? 's' : ''}</span>
                          <span>Applied: {leave.appliedOn}</span>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground line-clamp-1">{leave.reason}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => setDetailLeave(leave)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      {leave.status === 'pending' && (
                        <>
                          <Button size="sm" onClick={() => setConfirmAction({ type: 'approved', leave })} className="h-8 gap-1 rounded-lg bg-emerald-500 text-xs text-white hover:bg-emerald-600">
                            <CheckCircle2 className="h-3.5 w-3.5" />Approve
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setConfirmAction({ type: 'rejected', leave })} className="h-8 gap-1 rounded-lg text-xs text-destructive">
                            <XCircle className="h-3.5 w-3.5" />Reject
                          </Button>
                        </>
                      )}
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!detailLeave} onOpenChange={() => setDetailLeave(null)}>
        <DialogContent className="rounded-2xl sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Leave Request Details</DialogTitle>
          </DialogHeader>
          {detailLeave && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12"><AvatarFallback className="bg-primary/10 font-bold text-primary">{getInitials(detailLeave.teacherName)}</AvatarFallback></Avatar>
                <div>
                  <p className="font-semibold">{detailLeave.teacherName}</p>
                  <Badge variant="outline" className={`rounded-lg text-[10px] px-2 ${statusColors[detailLeave.status]}`}>{detailLeave.status}</Badge>
                </div>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">Leave Type</span><p className="font-medium capitalize">{detailLeave.type}</p></div>
                <div><span className="text-muted-foreground">Duration</span><p className="font-medium">{detailLeave.days} day{detailLeave.days > 1 ? 's' : ''}</p></div>
                <div><span className="text-muted-foreground">Start Date</span><p className="font-medium">{detailLeave.startDate}</p></div>
                <div><span className="text-muted-foreground">End Date</span><p className="font-medium">{detailLeave.endDate}</p></div>
                <div className="col-span-2"><span className="text-muted-foreground">Applied On</span><p className="font-medium">{detailLeave.appliedOn}</p></div>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Reason</span>
                <p className="mt-1 rounded-xl bg-muted/50 p-3 text-sm">{detailLeave.reason}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailLeave(null)} className="rounded-xl">Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!confirmAction} onOpenChange={() => setConfirmAction(null)}>
        <DialogContent className="rounded-2xl sm:max-w-[380px]">
          <DialogHeader>
            <DialogTitle>{confirmAction?.type === 'approved' ? 'Approve Leave' : 'Reject Leave'}</DialogTitle>
            <DialogDescription>
              {confirmAction?.type === 'approved'
                ? `Approve ${confirmAction?.leave.teacherName}'s ${confirmAction?.leave.type} leave for ${confirmAction?.leave.days} day(s)?`
                : `Reject ${confirmAction?.leave.teacherName}'s leave request?`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfirmAction(null)} className="rounded-xl">Cancel</Button>
            <Button onClick={handleAction} className={`rounded-xl border-0 ${confirmAction?.type === 'approved' ? 'bg-emerald-500 text-white hover:bg-emerald-600' : 'bg-destructive text-white hover:bg-destructive/90'}`}>
              {confirmAction?.type === 'approved' ? 'Approve' : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
