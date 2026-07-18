'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Search,
  CheckCircle2,
  XCircle,
  UserX,
  MoreHorizontal,
  Mail,
  BookOpen,
  GraduationCap,
  Filter,
  RefreshCw,
  Plus,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { StatCard } from '@/components/ui/stat-card';
import { StreamBadge } from '@/components/ui/stream-badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import type { AccountStatus } from '@/types';

interface Teacher {
  id: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  stream: 'MPC' | 'BiPC' | 'CEC';
  status: AccountStatus;
  joinedDate: string;
  assignedSections: string[];
  lastLogin?: string;
}

const emptyTeacher = { name: '', email: '', phone: '', subject: '', stream: '' as 'MPC' | 'BiPC' | 'CEC', status: 'pending' as AccountStatus, assignedSections: [] as string[] };


function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function StatusBadge({ status }: { status: AccountStatus }) {
  const styles: Record<AccountStatus, { label: string; class: string }> = {
    approved: { label: 'Approved', class: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' },
    pending: { label: 'Pending', class: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
    rejected: { label: 'Rejected', class: 'bg-red-500/10 text-red-600 border-red-500/20' },
    disabled: { label: 'Disabled', class: 'bg-slate-500/10 text-slate-600 border-slate-500/20' },
  };
  const s = styles[status];
  return (
    <Badge variant="outline" className={`rounded-lg border ${s.class}`}>
      {s.label}
    </Badge>
  );
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getDocuments, updateDocument, COLLECTIONS, whereClause } from '@/lib/firebase/firestore';

export default function TeachersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterStream, setFilterStream] = useState<string>('all');
  const [confirmDialog, setConfirmDialog] = useState<{ type: 'approve' | 'reject' | 'disable' | 'enable'; teacher: Teacher } | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyTeacher);

  const { data: teachers = [], isLoading } = useQuery<Teacher[]>({
    queryKey: ['teachers'],
    queryFn: async () => {
      // Teachers are stored in users collection with role='teacher'
      const data = await getDocuments(COLLECTIONS.USERS, [whereClause('role', '==', 'teacher')]);
      return data.map((t: any) => ({
        id: t.id,
        name: t.fullName || t.name || 'Unknown',
        email: t.email,
        phone: t.phone || '',
        subject: t.subject || '',
        stream: t.stream || 'MPC',
        status: t.status || 'pending',
        joinedDate: t.createdAt ? new Date(t.createdAt).toISOString().slice(0, 10) : '',
        assignedSections: t.assignedSections || [],
        lastLogin: t.lastLogin,
      }));
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: AccountStatus }) => {
      await updateDocument(COLLECTIONS.USERS, id, { status, updatedAt: new Date().toISOString() });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      setConfirmDialog(null);
    },
    onError: (error) => {
      toast.error('Failed to update teacher status');
      console.error(error);
    }
  });

  const addTeacherMutation = useMutation({
    mutationFn: async (newTeacher: any) => {
      // Use the registration API to create Auth user and DB document securely
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: newTeacher.name,
          email: newTeacher.email,
          phone: newTeacher.phone,
          subject: newTeacher.subject,
          stream: newTeacher.stream,
          password: 'Password@123', // Default password
          role: 'teacher',
          status: 'approved',
        }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to add teacher');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      toast.success('Teacher added successfully. Default password is Password@123');
      setAddDialogOpen(false);
      setForm(emptyTeacher);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to add teacher');
    }
  });

  const filtered = teachers.filter(t => {
    const matchSearch = t.name.toLowerCase().includes(search.toLowerCase()) || t.email.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || t.status === filterStatus;
    const matchStream = filterStream === 'all' || t.stream === filterStream;
    return matchSearch && matchStatus && matchStream;
  });

  const stats = {
    total: teachers.length,
    approved: teachers.filter(t => t.status === 'approved').length,
    pending: teachers.filter(t => t.status === 'pending').length,
    disabled: teachers.filter(t => t.status === 'disabled').length,
  };

  const handleConfirm = () => {
    if (!confirmDialog) return;
    const { type, teacher } = confirmDialog;
    
    let newStatus: AccountStatus;
    let successMessage = '';
    
    if (type === 'approve') { newStatus = 'approved'; successMessage = `${teacher.name} approved successfully`; }
    else if (type === 'reject') { newStatus = 'rejected'; successMessage = `${teacher.name} rejected`; }
    else if (type === 'disable') { newStatus = 'disabled'; successMessage = `${teacher.name} disabled`; }
    else { newStatus = 'approved'; successMessage = `${teacher.name} enabled`; }

    toast.promise(updateStatusMutation.mutateAsync({ id: teacher.id, status: newStatus }), {
      loading: 'Updating status...',
      success: successMessage,
      error: 'Could not update status'
    });
  };

  const openAddDialog = () => {
    setForm(emptyTeacher);
    setAddDialogOpen(true);
  };

  const handleAddSave = () => {
    if (!form.name || !form.email || !form.subject || !form.stream) {
      toast.error('Please fill in all required fields');
      return;
    }
    addTeacherMutation.mutate(form);
  };

  return (
    <DashboardLayout role="principal" userName="Principal" userEmail="principal@collegedost.com">
      <div className="space-y-6 pb-8">
        <PageHeader
          title="Teachers"
          description="Manage teacher accounts, approvals, and assignments"
        >
          <Button onClick={openAddDialog} className="gap-2 rounded-xl gradient-primary border-0 text-white">
            <Plus className="h-4 w-4" />
            Add Teacher
          </Button>
          <Button variant="outline" className="gap-2 rounded-xl">
            <RefreshCw className="h-4 w-4" />
            Sync
          </Button>
        </PageHeader>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard title="Total Teachers" value={stats.total} icon={<Users className="h-5 w-5 text-primary" />} iconBg="bg-primary/10" delay={0} />
          <StatCard title="Active" value={stats.approved} icon={<CheckCircle2 className="h-5 w-5 text-emerald-500" />} iconBg="bg-emerald-500/10" delay={0.1} />
          <StatCard title="Pending" value={stats.pending} icon={<Filter className="h-5 w-5 text-amber-500" />} iconBg="bg-amber-500/10" delay={0.2} />
          <StatCard title="Disabled" value={stats.disabled} icon={<UserX className="h-5 w-5 text-slate-500" />} iconBg="bg-slate-500/10" delay={0.3} />
        </div>

        <Card className="glass-card border-0">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search teachers..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="h-10 rounded-xl bg-background/50 pl-9"
                />
              </div>
              <div className="flex gap-2">
                <Select value={filterStatus} onValueChange={(v) => v && setFilterStatus(v)}>
                  <SelectTrigger className="h-10 w-[130px] rounded-xl bg-background/50">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="disabled">Disabled</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterStream} onValueChange={(v) => v && setFilterStream(v)}>
                  <SelectTrigger className="h-10 w-[130px] rounded-xl bg-background/50">
                    <SelectValue placeholder="Stream" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Streams</SelectItem>
                    <SelectItem value="MPC">MPC</SelectItem>
                    <SelectItem value="BiPC">BiPC</SelectItem>
                    <SelectItem value="CEC">CEC</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
                  <Users className="h-12 w-12 opacity-30" />
                  <p className="text-sm font-medium">No teachers found</p>
                  <p className="text-xs">Try adjusting your search or filters</p>
                  <Button onClick={openAddDialog} variant="outline" className="mt-2 gap-2 rounded-xl"><Plus className="h-4 w-4" />Add Teacher</Button>
                </div>
              ) : (
                filtered.map((teacher, i) => (
                  <motion.div
                    key={teacher.id}
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="flex flex-col gap-3 rounded-xl bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 shrink-0">
                        <AvatarFallback className="bg-primary/10 text-xs font-bold text-primary">
                          {getInitials(teacher.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold truncate">{teacher.name}</p>
                          <StatusBadge status={teacher.status} />
                        </div>
                        <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {teacher.email}
                          </span>
                          <span className="flex items-center gap-1">
                            <BookOpen className="h-3 w-3" />
                            {teacher.subject}
                          </span>
                          <StreamBadge stream={teacher.stream} size="sm" />
                        </div>
                        {teacher.assignedSections.length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {teacher.assignedSections.map(s => (
                              <Badge key={s} variant="outline" className="rounded-md text-[10px] px-1.5 py-0">
                                {s}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      {teacher.status === 'pending' && (
                        <>
                          <Button size="sm" onClick={() => setConfirmDialog({ type: 'approve', teacher })} className="h-8 gap-1 rounded-lg bg-emerald-500 text-xs text-white hover:bg-emerald-600">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Approve
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setConfirmDialog({ type: 'reject', teacher })} className="h-8 gap-1 rounded-lg text-xs text-destructive">
                            <XCircle className="h-3.5 w-3.5" />
                            Reject
                          </Button>
                        </>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger render={
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        } />
                        <DropdownMenuContent align="end" className="rounded-xl">
                          <DropdownMenuItem className="gap-2 rounded-lg text-xs">
                            <Mail className="h-3.5 w-3.5" />
                            Send Email
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2 rounded-lg text-xs">
                            <GraduationCap className="h-3.5 w-3.5" />
                            View Schedule
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {teacher.status === 'approved' ? (
                            <DropdownMenuItem onClick={() => setConfirmDialog({ type: 'disable', teacher })} className="gap-2 rounded-lg text-xs text-destructive">
                              <UserX className="h-3.5 w-3.5" />
                              Disable Account
                            </DropdownMenuItem>
                          ) : teacher.status === 'disabled' ? (
                            <DropdownMenuItem onClick={() => setConfirmDialog({ type: 'enable', teacher })} className="gap-2 rounded-lg text-xs text-emerald-600">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Enable Account
                            </DropdownMenuItem>
                          ) : null}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!confirmDialog} onOpenChange={() => setConfirmDialog(null)}>
        <DialogContent className="rounded-2xl sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>
              {confirmDialog?.type === 'approve' && 'Approve Teacher'}
              {confirmDialog?.type === 'reject' && 'Reject Teacher'}
              {confirmDialog?.type === 'disable' && 'Disable Teacher'}
              {confirmDialog?.type === 'enable' && 'Enable Teacher'}
            </DialogTitle>
            <DialogDescription>
              {confirmDialog?.type === 'approve' && `Approve ${confirmDialog?.teacher.name} as a ${confirmDialog?.teacher.subject} teacher.`}
              {confirmDialog?.type === 'reject' && `Reject ${confirmDialog?.teacher.name}'s registration request.`}
              {confirmDialog?.type === 'disable' && `Disable ${confirmDialog?.teacher.name}'s account. They will not be able to log in.`}
              {confirmDialog?.type === 'enable' && `Enable ${confirmDialog?.teacher.name}'s account. They will regain access.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfirmDialog(null)} className="rounded-xl">
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              className={`rounded-xl border-0 ${
                confirmDialog?.type === 'approve' || confirmDialog?.type === 'enable'
                  ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                  : 'bg-destructive text-white hover:bg-destructive/90'
              }`}
            >
              {confirmDialog?.type === 'approve' && 'Approve'}
              {confirmDialog?.type === 'reject' && 'Reject'}
              {confirmDialog?.type === 'disable' && 'Disable'}
              {confirmDialog?.type === 'enable' && 'Enable'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="rounded-2xl sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Add Teacher</DialogTitle>
            <DialogDescription>Enter the new teacher details. They will receive an invitation email.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs">Full Name *</Label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Teacher name" className="rounded-xl bg-background/50 h-10" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Email *</Label>
              <Input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="teacher@college.edu" className="rounded-xl bg-background/50 h-10" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Phone</Label>
              <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+91 9876543210" className="rounded-xl bg-background/50 h-10" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Subject *</Label>
              <Input value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} placeholder="Mathematics" className="rounded-xl bg-background/50 h-10" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Stream *</Label>
              <Select value={form.stream} onValueChange={v => setForm({ ...form, stream: v as 'MPC' | 'BiPC' | 'CEC' })}>
                <SelectTrigger className="h-10 rounded-xl bg-background/50"><SelectValue placeholder="Select stream" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="MPC">MPC</SelectItem>
                  <SelectItem value="BiPC">BiPC</SelectItem>
                  <SelectItem value="CEC">CEC</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Assigned Sections</Label>
              <Input value={form.assignedSections.join(', ')} onChange={e => setForm({ ...form, assignedSections: e.target.value ? e.target.value.split(',').map(s => s.trim()).filter(Boolean) : [] })} placeholder="MPC-A, MPC-B" className="rounded-xl bg-background/50 h-10" />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setAddDialogOpen(false)} className="rounded-xl">Cancel</Button>
            <Button onClick={handleAddSave} className="rounded-xl gradient-primary border-0 text-white">Add Teacher</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
