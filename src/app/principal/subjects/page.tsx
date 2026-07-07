'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  BookOpen,
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/components/ui/stat-card';
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
import type { StreamCode } from '@/types';

interface Subject {
  id: string;
  name: string;
  code: string;
  streams: StreamCode[];
  teacherCount: number;
}

const initialSubjects: Subject[] = [
  { id: '1', name: 'Mathematics', code: 'MATH', streams: ['MPC'], teacherCount: 3 },
  { id: '2', name: 'Physics', code: 'PHY', streams: ['MPC', 'BiPC'], teacherCount: 4 },
  { id: '3', name: 'Chemistry', code: 'CHEM', streams: ['MPC', 'BiPC'], teacherCount: 3 },
  { id: '4', name: 'Biology', code: 'BIO', streams: ['BiPC'], teacherCount: 2 },
  { id: '5', name: 'Botany', code: 'BOT', streams: ['BiPC'], teacherCount: 1 },
  { id: '6', name: 'Zoology', code: 'ZOO', streams: ['BiPC'], teacherCount: 1 },
  { id: '7', name: 'Commerce', code: 'COM', streams: ['CEC'], teacherCount: 2 },
  { id: '8', name: 'Economics', code: 'ECO', streams: ['CEC'], teacherCount: 2 },
  { id: '9', name: 'Civics', code: 'CIV', streams: ['CEC'], teacherCount: 1 },
  { id: '10', name: 'English', code: 'ENG', streams: ['MPC', 'BiPC', 'CEC'], teacherCount: 2 },
  { id: '11', name: 'Sanskrit', code: 'SAN', streams: ['MPC', 'BiPC', 'CEC'], teacherCount: 1 },
];

const streamColors: Record<StreamCode, string> = { MPC: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20', BiPC: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20', CEC: 'bg-amber-500/10 text-amber-600 border-amber-500/20' };

const emptySubject = { name: '', code: '', streams: [] as StreamCode[] };

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>(initialSubjects);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Subject | null>(null);
  const [form, setForm] = useState(emptySubject);
  const [deleteConfirm, setDeleteConfirm] = useState<Subject | null>(null);

  const filtered = subjects.filter(s => s.name.toLowerCase().includes(search.toLowerCase()) || s.code.toLowerCase().includes(search.toLowerCase()));

  const openAdd = () => { setEditing(null); setForm(emptySubject); setDialogOpen(true); };
  const openEdit = (s: Subject) => { setEditing(s); setForm({ name: s.name, code: s.code, streams: [...s.streams] }); setDialogOpen(true); };

  const toggleStream = (stream: StreamCode) => {
    setForm(prev => ({
      ...prev,
      streams: prev.streams.includes(stream) ? prev.streams.filter(s => s !== stream) : [...prev.streams, stream],
    }));
  };

  const handleSave = () => {
    if (!form.name || !form.code || form.streams.length === 0) {
      toast.error('Please fill in all fields and select at least one stream');
      return;
    }
    if (editing) {
      setSubjects(prev => prev.map(s => s.id === editing.id ? { ...s, ...form, teacherCount: s.teacherCount } : s));
      toast.success('Subject updated');
    } else {
      setSubjects(prev => [...prev, { ...form, id: String(Date.now()), teacherCount: 0 }]);
      toast.success('Subject added');
    }
    setDialogOpen(false);
  };

  const handleDelete = () => {
    if (!deleteConfirm) return;
    setSubjects(prev => prev.filter(s => s.id !== deleteConfirm.id));
    toast.success(`${deleteConfirm.name} deleted`);
    setDeleteConfirm(null);
  };

  return (
    <DashboardLayout role="principal" userName="Principal" userEmail="principal@collegedost.com">
      <div className="space-y-6 pb-8">
        <PageHeader title="Subjects" description="Manage academic subjects and stream mappings">
          <Button onClick={openAdd} className="gap-2 rounded-xl gradient-primary border-0 text-white">
            <Plus className="h-4 w-4" />
            Add Subject
          </Button>
        </PageHeader>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard title="Total Subjects" value={subjects.length} icon={<BookOpen className="h-5 w-5 text-primary" />} iconBg="bg-primary/10" delay={0} />
          <StatCard title="MPC Subjects" value={subjects.filter(s => s.streams.includes('MPC')).length} icon={<BookOpen className="h-5 w-5 text-indigo-500" />} iconBg="bg-indigo-500/10" delay={0.1} />
          <StatCard title="BiPC Subjects" value={subjects.filter(s => s.streams.includes('BiPC')).length} icon={<BookOpen className="h-5 w-5 text-emerald-500" />} iconBg="bg-emerald-500/10" delay={0.2} />
          <StatCard title="CEC Subjects" value={subjects.filter(s => s.streams.includes('CEC')).length} icon={<BookOpen className="h-5 w-5 text-amber-500" />} iconBg="bg-amber-500/10" delay={0.3} />
        </div>

        <Card className="glass-card border-0">
          <CardContent className="p-4 sm:p-6">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search subjects..." value={search} onChange={e => setSearch(e.target.value)} className="h-10 rounded-xl bg-background/50 pl-9" />
            </div>

            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.length === 0 ? (
                <div className="col-span-full flex flex-col items-center gap-2 py-12 text-muted-foreground">
                  <BookOpen className="h-12 w-12 opacity-30" />
                  <p className="text-sm font-medium">No subjects found</p>
                </div>
              ) : (
                filtered.map((subject, i) => (
                  <motion.div
                    key={subject.id}
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="group rounded-xl bg-muted/30 p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold">{subject.name}</p>
                        <p className="text-xs text-muted-foreground font-mono">{subject.code}</p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger render={
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"><MoreHorizontal className="h-4 w-4" /></Button>
                        } />
                        <DropdownMenuContent align="end" className="rounded-xl">
                          <DropdownMenuItem className="gap-2 rounded-lg text-xs" onClick={() => openEdit(subject)}><Pencil className="h-3.5 w-3.5" />Edit</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="gap-2 rounded-lg text-xs text-destructive" onClick={() => setDeleteConfirm(subject)}><Trash2 className="h-3.5 w-3.5" />Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {subject.streams.map(stream => (
                        <Badge key={stream} variant="outline" className={`rounded-lg text-[10px] px-2 py-0.5 ${streamColors[stream]}`}>
                          {stream}
                        </Badge>
                      ))}
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">{subject.teacherCount} teacher{subject.teacherCount !== 1 ? 's' : ''} assigned</p>
                  </motion.div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="rounded-2xl sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Subject' : 'Add Subject'}</DialogTitle>
            <DialogDescription>{editing ? 'Update subject details' : 'Enter the new subject details'}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs">Subject Name *</Label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g., Mathematics" className="rounded-xl bg-background/50 h-10" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Subject Code *</Label>
              <Input value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="e.g., MATH" className="rounded-xl bg-background/50 h-10 font-mono" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Applicable Streams *</Label>
              <div className="flex gap-2">
                {(['MPC', 'BiPC', 'CEC'] as StreamCode[]).map(stream => (
                  <Button
                    key={stream}
                    type="button"
                    variant="outline"
                    onClick={() => toggleStream(stream)}
                    className={`flex-1 rounded-xl h-10 transition-all ${form.streams.includes(stream) ? streamColors[stream] + ' border-2' : ''}`}
                  >
                    {stream}
                  </Button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 mt-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="rounded-xl">Cancel</Button>
            <Button onClick={handleSave} className="rounded-xl gradient-primary border-0 text-white">{editing ? 'Update' : 'Add Subject'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="rounded-2xl sm:max-w-[380px]">
          <DialogHeader>
            <DialogTitle>Delete Subject</DialogTitle>
            <DialogDescription>Are you sure you want to delete {deleteConfirm?.name}? This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteConfirm(null)} className="rounded-xl">Cancel</Button>
            <Button onClick={handleDelete} className="rounded-xl bg-destructive text-white hover:bg-destructive/90 border-0">Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
