'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Layers,
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  Users,
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
import type { StreamCode } from '@/types';

interface Section {
  id: string;
  name: string;
  streamCode: StreamCode;
  capacity: number;
  currentStrength: number;
  classTeacher?: string;
}

const initialSections: Section[] = [
  { id: '1', name: 'MPC-A', streamCode: 'MPC', capacity: 60, currentStrength: 58, classTeacher: 'Dr. Ramesh Kumar' },
  { id: '2', name: 'MPC-B', streamCode: 'MPC', capacity: 60, currentStrength: 55, classTeacher: 'Prof. S. Lakshmi' },
  { id: '3', name: 'MPC-C', streamCode: 'MPC', capacity: 60, currentStrength: 60, classTeacher: 'Dr. Sunita Desai' },
  { id: '4', name: 'BiPC-A', streamCode: 'BiPC', capacity: 60, currentStrength: 52, classTeacher: 'Dr. Venkat Rao' },
  { id: '5', name: 'BiPC-B', streamCode: 'BiPC', capacity: 60, currentStrength: 48 },
  { id: '6', name: 'CEC-A', streamCode: 'CEC', capacity: 60, currentStrength: 45, classTeacher: 'Prof. Kavita Sharma' },
  { id: '7', name: 'CEC-B', streamCode: 'CEC', capacity: 60, currentStrength: 40 },
];

const streamColors: Record<StreamCode, string> = {
  MPC: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20',
  BiPC: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  CEC: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
};

const emptySection = { name: '', streamCode: '' as StreamCode, capacity: 60 };

export default function SectionsPage() {
  const [sections, setSections] = useState<Section[]>(initialSections);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Section | null>(null);
  const [form, setForm] = useState(emptySection);
  const [deleteConfirm, setDeleteConfirm] = useState<Section | null>(null);

  const filtered = sections.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));

  const openAdd = () => { setEditing(null); setForm(emptySection); setDialogOpen(true); };
  const openEdit = (s: Section) => { setEditing(s); setForm({ name: s.name, streamCode: s.streamCode, capacity: s.capacity }); setDialogOpen(true); };

  const handleSave = () => {
    if (!form.name || !form.streamCode) {
      toast.error('Please fill in all fields');
      return;
    }
    if (editing) {
      setSections(prev => prev.map(s => s.id === editing.id ? { ...s, ...form, currentStrength: s.currentStrength } : s));
      toast.success('Section updated');
    } else {
      setSections(prev => [...prev, { ...form, id: String(Date.now()), currentStrength: 0 }]);
      toast.success('Section added');
    }
    setDialogOpen(false);
  };

  const handleDelete = () => {
    if (!deleteConfirm) return;
    setSections(prev => prev.filter(s => s.id !== deleteConfirm.id));
    toast.success(`${deleteConfirm.name} deleted`);
    setDeleteConfirm(null);
  };

  return (
    <DashboardLayout role="principal" userName="Principal" userEmail="principal@collegedost.com">
      <div className="space-y-6 pb-8">
        <PageHeader title="Sections" description="Manage class sections and capacity">
          <Button onClick={openAdd} className="gap-2 rounded-xl gradient-primary border-0 text-white">
            <Plus className="h-4 w-4" />
            Add Section
          </Button>
        </PageHeader>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard title="Total Sections" value={sections.length} icon={<Layers className="h-5 w-5 text-primary" />} iconBg="bg-primary/10" delay={0} />
          <StatCard title="Total Capacity" value={sections.reduce((a, s) => a + s.capacity, 0)} icon={<Users className="h-5 w-5 text-emerald-500" />} iconBg="bg-emerald-500/10" delay={0.1} />
          <StatCard title="Total Enrolled" value={sections.reduce((a, s) => a + s.currentStrength, 0)} icon={<Users className="h-5 w-5 text-amber-500" />} iconBg="bg-amber-500/10" delay={0.2} />
          <StatCard title="Avg Fill Rate" value={`${Math.round(sections.reduce((a, s) => a + (s.currentStrength / s.capacity) * 100, 0) / sections.length)}%`} icon={<Users className="h-5 w-5 text-violet-500" />} iconBg="bg-violet-500/10" delay={0.3} />
        </div>

        <Card className="glass-card border-0">
          <CardContent className="p-4 sm:p-6">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search sections..." value={search} onChange={e => setSearch(e.target.value)} className="h-10 rounded-xl bg-background/50 pl-9" />
            </div>

            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.length === 0 ? (
                <div className="col-span-full flex flex-col items-center gap-2 py-12 text-muted-foreground">
                  <Layers className="h-12 w-12 opacity-30" />
                  <p className="text-sm font-medium">No sections found</p>
                </div>
              ) : (
                filtered.map((section, i) => {
                  const fillRate = Math.round((section.currentStrength / section.capacity) * 100);
                  const fillColor = fillRate >= 90 ? 'bg-emerald-500' : fillRate >= 70 ? 'bg-amber-500' : 'bg-slate-400';
                  return (
                    <motion.div
                      key={section.id}
                      initial={{ y: 10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: i * 0.03 }}
                      className="group rounded-xl bg-muted/30 p-4 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <p className="text-lg font-bold">{section.name}</p>
                          <Badge variant="outline" className={`rounded-lg text-[10px] px-2 ${streamColors[section.streamCode]}`}>{section.streamCode}</Badge>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger render={
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"><MoreHorizontal className="h-4 w-4" /></Button>
                          } />
                          <DropdownMenuContent align="end" className="rounded-xl">
                            <DropdownMenuItem className="gap-2 rounded-lg text-xs" onClick={() => openEdit(section)}><Pencil className="h-3.5 w-3.5" />Edit</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="gap-2 rounded-lg text-xs text-destructive" onClick={() => setDeleteConfirm(section)}><Trash2 className="h-3.5 w-3.5" />Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div className="mt-3 space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Strength</span>
                          <span className="font-semibold">{section.currentStrength}/{section.capacity}</span>
                        </div>
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                          <div className={`h-full rounded-full transition-all ${fillColor}`} style={{ width: `${fillRate}%` }} />
                        </div>
                        <p className="text-xs text-muted-foreground">{fillRate}% filled</p>
                      </div>
                      {section.classTeacher && (
                        <p className="mt-2 text-xs text-muted-foreground">Class Teacher: <span className="font-medium text-foreground">{section.classTeacher}</span></p>
                      )}
                    </motion.div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="rounded-2xl sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Section' : 'Add Section'}</DialogTitle>
            <DialogDescription>{editing ? 'Update section details' : 'Enter the new section details'}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs">Section Name *</Label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g., MPC-D" className="rounded-xl bg-background/50 h-10" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Stream *</Label>
              <Select value={form.streamCode} onValueChange={v => setForm({ ...form, streamCode: v as StreamCode })}>
                <SelectTrigger className="h-10 rounded-xl bg-background/50"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="MPC">MPC</SelectItem>
                  <SelectItem value="BiPC">BiPC</SelectItem>
                  <SelectItem value="CEC">CEC</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Capacity</Label>
              <Input type="number" value={form.capacity} onChange={e => setForm({ ...form, capacity: Number(e.target.value) })} className="rounded-xl bg-background/50 h-10" min={1} max={200} />
            </div>
          </div>
          <DialogFooter className="gap-2 mt-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="rounded-xl">Cancel</Button>
            <Button onClick={handleSave} className="rounded-xl gradient-primary border-0 text-white">{editing ? 'Update' : 'Add Section'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="rounded-2xl sm:max-w-[380px]">
          <DialogHeader>
            <DialogTitle>Delete Section</DialogTitle>
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
