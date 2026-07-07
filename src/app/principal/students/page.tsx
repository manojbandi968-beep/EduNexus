'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  GraduationCap,
  Search,
  Plus,
  Download,
  Upload,
  MoreHorizontal,
  Phone,
  UserPlus,
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import type { StreamCode, StudentStatus, Gender } from '@/types';

interface Student {
  id: string;
  rollNumber: string;
  name: string;
  stream: StreamCode;
  section: string;
  admissionNumber: string;
  parentMobile: string;
  studentMobile?: string;
  gender: Gender;
  batch: string;
  status: StudentStatus;
}

const initialStudents: Student[] = [
  { id: '1', rollNumber: 'MPC001', name: 'Aarav Sharma', stream: 'MPC', section: 'MPC-A', admissionNumber: 'ADM-2025-001', parentMobile: '+91 9876543201', studentMobile: '+91 9876543101', gender: 'male', batch: '2025-26', status: 'active' },
  { id: '2', rollNumber: 'MPC002', name: 'Ananya Reddy', stream: 'MPC', section: 'MPC-A', admissionNumber: 'ADM-2025-002', parentMobile: '+91 9876543202', gender: 'female', batch: '2025-26', status: 'active' },
  { id: '3', rollNumber: 'MPC003', name: 'Rahul Verma', stream: 'MPC', section: 'MPC-B', admissionNumber: 'ADM-2025-003', parentMobile: '+91 9876543203', gender: 'male', batch: '2025-26', status: 'active' },
  { id: '4', rollNumber: 'BPC001', name: 'Sneha Patel', stream: 'BiPC', section: 'BiPC-A', admissionNumber: 'ADM-2025-004', parentMobile: '+91 9876543204', gender: 'female', batch: '2025-26', status: 'active' },
  { id: '5', rollNumber: 'BPC002', name: 'Vikram Singh', stream: 'BiPC', section: 'BiPC-A', admissionNumber: 'ADM-2025-005', parentMobile: '+91 9876543205', gender: 'male', batch: '2025-26', status: 'inactive' },
  { id: '6', rollNumber: 'CEC001', name: 'Priya Gupta', stream: 'CEC', section: 'CEC-A', admissionNumber: 'ADM-2025-006', parentMobile: '+91 9876543206', studentMobile: '+91 9876543106', gender: 'female', batch: '2025-26', status: 'active' },
  { id: '7', rollNumber: 'MPC004', name: 'Arjun Nair', stream: 'MPC', section: 'MPC-C', admissionNumber: 'ADM-2025-007', parentMobile: '+91 9876543207', gender: 'male', batch: '2025-26', status: 'active' },
  { id: '8', rollNumber: 'BPC003', name: 'Neha Joshi', stream: 'BiPC', section: 'BiPC-B', admissionNumber: 'ADM-2025-008', parentMobile: '+91 9876543208', gender: 'female', batch: '2025-26', status: 'transferred' },
  { id: '9', rollNumber: 'CEC002', name: 'Rohit Kumar', stream: 'CEC', section: 'CEC-B', admissionNumber: 'ADM-2025-009', parentMobile: '+91 9876543209', gender: 'male', batch: '2025-26', status: 'active' },
  { id: '10', rollNumber: 'MPC005', name: 'Divya K', stream: 'MPC', section: 'MPC-A', admissionNumber: 'ADM-2025-010', parentMobile: '+91 9876543210', gender: 'female', batch: '2025-26', status: 'active' },
];

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function GenderBadge({ gender }: { gender: Gender }) {
  const styles = { male: 'bg-blue-500/10 text-blue-600', female: 'bg-pink-500/10 text-pink-600', other: 'bg-purple-500/10 text-purple-600' };
  return <Badge variant="outline" className={`rounded-lg text-[10px] px-2 ${styles[gender]}`}>{gender}</Badge>;
}

const emptyStudent = { rollNumber: '', name: '', stream: '' as StreamCode, section: '', admissionNumber: '', parentMobile: '', studentMobile: '', gender: 'male' as Gender, batch: '2025-26', status: 'active' as StudentStatus };

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>(initialStudents);
  const [search, setSearch] = useState('');
  const [filterStream, setFilterStream] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [form, setForm] = useState(emptyStudent);

  const filtered = students.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) || s.rollNumber.toLowerCase().includes(search.toLowerCase()) || s.admissionNumber.toLowerCase().includes(search.toLowerCase());
    const matchStream = filterStream === 'all' || s.stream === filterStream;
    const matchStatus = filterStatus === 'all' || s.status === filterStatus;
    return matchSearch && matchStream && matchStatus;
  });

  const stats = {
    total: students.length,
    active: students.filter(s => s.status === 'active').length,
    inactive: students.filter(s => s.status === 'inactive').length,
    transferred: students.filter(s => s.status === 'transferred').length,
  };

  const openAdd = () => {
    setEditingStudent(null);
    setForm(emptyStudent);
    setDialogOpen(true);
  };

  const openEdit = (s: Student) => {
    setEditingStudent(s);
    setForm({ ...s, studentMobile: s.studentMobile || '' });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.name || !form.rollNumber || !form.stream || !form.section) {
      toast.error('Please fill in all required fields');
      return;
    }
    if (editingStudent) {
      setStudents(prev => prev.map(s => s.id === editingStudent.id ? { ...form, id: s.id } : s));
      toast.success('Student updated');
    } else {
      const newStudent = { ...form, id: String(Date.now()) };
      setStudents(prev => [...prev, newStudent]);
      toast.success('Student added');
    }
    setDialogOpen(false);
  };

  return (
    <DashboardLayout role="principal" userName="Principal" userEmail="principal@collegedost.com">
      <div className="space-y-6 pb-8">
        <PageHeader title="Students" description="Manage student records and enrollment">
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2 rounded-xl">
              <Upload className="h-4 w-4" />
              Import
            </Button>
            <Button variant="outline" className="gap-2 rounded-xl">
              <Download className="h-4 w-4" />
              Export
            </Button>
            <Button onClick={openAdd} className="gap-2 rounded-xl gradient-primary border-0 text-white">
              <Plus className="h-4 w-4" />
              Add Student
            </Button>
          </div>
        </PageHeader>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard title="Total Students" value={stats.total} icon={<GraduationCap className="h-5 w-5 text-primary" />} iconBg="bg-primary/10" delay={0} />
          <StatCard title="Active" value={stats.active} icon={<GraduationCap className="h-5 w-5 text-emerald-500" />} iconBg="bg-emerald-500/10" delay={0.1} />
          <StatCard title="Inactive" value={stats.inactive} icon={<GraduationCap className="h-5 w-5 text-amber-500" />} iconBg="bg-amber-500/10" delay={0.2} />
          <StatCard title="Transferred" value={stats.transferred} icon={<GraduationCap className="h-5 w-5 text-blue-500" />} iconBg="bg-blue-500/10" delay={0.3} />
        </div>

        <Card className="glass-card border-0">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Search by name, roll, or admission no..." value={search} onChange={e => setSearch(e.target.value)} className="h-10 rounded-xl bg-background/50 pl-9" />
              </div>
              <div className="flex gap-2">
                <Select value={filterStream} onValueChange={(v) => v && setFilterStream(v)}>
                  <SelectTrigger className="h-10 w-[120px] rounded-xl bg-background/50"><SelectValue placeholder="Stream" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Streams</SelectItem>
                    <SelectItem value="MPC">MPC</SelectItem>
                    <SelectItem value="BiPC">BiPC</SelectItem>
                    <SelectItem value="CEC">CEC</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={(v) => v && setFilterStatus(v)}>
                  <SelectTrigger className="h-10 w-[120px] rounded-xl bg-background/50"><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="transferred">Transferred</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
                  <GraduationCap className="h-12 w-12 opacity-30" />
                  <p className="text-sm font-medium">No students found</p>
                  <Button onClick={openAdd} variant="outline" className="mt-2 gap-2 rounded-xl"><UserPlus className="h-4 w-4" />Add Student</Button>
                </div>
              ) : (
                filtered.map((student, i) => (
                  <motion.div
                    key={student.id}
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="flex flex-col gap-3 rounded-xl bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 shrink-0">
                        <AvatarFallback className="bg-primary/10 text-xs font-bold text-primary">{getInitials(student.name)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold truncate">{student.name}</p>
                          <Badge variant="outline" className={`rounded-lg text-[10px] px-2 ${student.status === 'active' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : student.status === 'inactive' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' : 'bg-blue-500/10 text-blue-600 border-blue-500/20'}`}>
                            {student.status}
                          </Badge>
                        </div>
                        <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                          <span className="font-mono">{student.rollNumber}</span>
                          <StreamBadge stream={student.stream} size="sm" />
                          <span>{student.section}</span>
                          <GenderBadge gender={student.gender} />
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{student.parentMobile}</span>
                          {student.studentMobile && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{student.studentMobile}</span>}
                          <span>Batch: {student.batch}</span>
                        </div>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger render={
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg shrink-0"><MoreHorizontal className="h-4 w-4" /></Button>
                      } />
                      <DropdownMenuContent align="end" className="rounded-xl">
                        <DropdownMenuItem className="gap-2 rounded-lg text-xs" onClick={() => openEdit(student)}>Edit Details</DropdownMenuItem>
                        <DropdownMenuItem className="gap-2 rounded-lg text-xs"><GraduationCap className="h-3.5 w-3.5" />View Performance</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="gap-2 rounded-lg text-xs text-destructive">Remove Student</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </motion.div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="rounded-2xl sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingStudent ? 'Edit Student' : 'Add Student'}</DialogTitle>
            <DialogDescription>{editingStudent ? 'Update student details' : 'Enter the new student details'}</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs">Roll Number *</Label>
              <Input value={form.rollNumber} onChange={e => setForm({ ...form, rollNumber: e.target.value })} placeholder="MPC001" className="rounded-xl bg-background/50 h-10" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Full Name *</Label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Student name" className="rounded-xl bg-background/50 h-10" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Stream *</Label>
              <Select value={form.stream} onValueChange={v => setForm({ ...form, stream: v as StreamCode })}>
                <SelectTrigger className="h-10 rounded-xl bg-background/50"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="MPC">MPC</SelectItem>
                  <SelectItem value="BiPC">BiPC</SelectItem>
                  <SelectItem value="CEC">CEC</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Section *</Label>
              <Input value={form.section} onChange={e => setForm({ ...form, section: e.target.value })} placeholder="MPC-A" className="rounded-xl bg-background/50 h-10" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Admission Number *</Label>
              <Input value={form.admissionNumber} onChange={e => setForm({ ...form, admissionNumber: e.target.value })} placeholder="ADM-2025-001" className="rounded-xl bg-background/50 h-10" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Gender</Label>
              <Select value={form.gender} onValueChange={v => setForm({ ...form, gender: v as Gender })}>
                <SelectTrigger className="h-10 rounded-xl bg-background/50"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Parent Mobile *</Label>
              <Input value={form.parentMobile} onChange={e => setForm({ ...form, parentMobile: e.target.value })} placeholder="+91 9876543210" className="rounded-xl bg-background/50 h-10" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Student Mobile</Label>
              <Input value={form.studentMobile || ''} onChange={e => setForm({ ...form, studentMobile: e.target.value })} placeholder="Optional" className="rounded-xl bg-background/50 h-10" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Batch</Label>
              <Input value={form.batch} onChange={e => setForm({ ...form, batch: e.target.value })} placeholder="2025-26" className="rounded-xl bg-background/50 h-10" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Status</Label>
              <Select value={form.status} onValueChange={v => setForm({ ...form, status: v as StudentStatus })}>
                <SelectTrigger className="h-10 rounded-xl bg-background/50"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="transferred">Transferred</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2 mt-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="rounded-xl">Cancel</Button>
            <Button onClick={handleSave} className="rounded-xl gradient-primary border-0 text-white">{editingStudent ? 'Update' : 'Add Student'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
