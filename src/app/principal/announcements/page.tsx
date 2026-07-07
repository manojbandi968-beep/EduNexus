'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Megaphone,
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  Eye,
  Calendar,
  Target,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import type { AnnouncementType, UserRole, StreamCode } from '@/types';

interface Announcement {
  id: string;
  title: string;
  content: string;
  type: AnnouncementType;
  publishedBy: string;
  publisherName: string;
  targetRoles: UserRole[];
  targetStreams?: StreamCode[];
  isActive: boolean;
  createdAt: string;
}

const typeColors: Record<AnnouncementType, string> = {
  notice: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20',
  holiday: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  meeting: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  exam: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  emergency: 'bg-red-500/10 text-red-600 border-red-500/20',
};

const initialAnnouncements: Announcement[] = [
  { id: '1', title: 'Staff Meeting Tomorrow', content: 'All teachers are requested to attend the staff meeting tomorrow at 3:30 PM in the conference hall. Attendance is mandatory.', type: 'meeting', publishedBy: 'principal', publisherName: 'Principal', targetRoles: ['teacher', 'mentor'], isActive: true, createdAt: '2025-07-04' },
  { id: '2', title: 'Mid-term Exam Schedule Released', content: 'The mid-term examination schedule has been released. Please check the timetable section for details.', type: 'exam', publishedBy: 'principal', publisherName: 'Principal', targetRoles: ['teacher', 'mentor'], targetStreams: ['MPC', 'BiPC', 'CEC'], isActive: true, createdAt: '2025-07-03' },
  { id: '3', title: 'College Closed for Local Holiday', content: 'The college will remain closed on August 15th for Independence Day celebrations.', type: 'holiday', publishedBy: 'principal', publisherName: 'Principal', targetRoles: ['teacher', 'mentor'], isActive: true, createdAt: '2025-07-02' },
  { id: '4', title: 'Emergency: Power Maintenance', content: 'Power maintenance scheduled for Saturday. Study hours will be adjusted accordingly.', type: 'emergency', publishedBy: 'principal', publisherName: 'Principal', targetRoles: ['teacher', 'mentor'], isActive: true, createdAt: '2025-07-01' },
];

const roles = ['principal', 'teacher', 'mentor', 'both'] as UserRole[];

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>(initialAnnouncements);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Announcement | null>(null);
  const [form, setForm] = useState({ title: '', content: '', type: '' as AnnouncementType | '', targetRoles: [] as UserRole[], targetStreams: [] as StreamCode[], expiresAt: '' });
  const [detail, setDetail] = useState<Announcement | null>(null);

  const filtered = announcements.filter(a => a.title.toLowerCase().includes(search.toLowerCase()));

  const openAdd = () => { setEditing(null); setForm({ title: '', content: '', type: '', targetRoles: [], targetStreams: [], expiresAt: '' }); setDialogOpen(true); };

  const toggleRole = (role: UserRole) => {
    setForm(prev => ({ ...prev, targetRoles: prev.targetRoles.includes(role) ? prev.targetRoles.filter(r => r !== role) : [...prev.targetRoles, role] }));
  };

  const toggleStream = (stream: StreamCode) => {
    setForm(prev => ({ ...prev, targetStreams: prev.targetStreams.includes(stream) ? prev.targetStreams.filter(s => s !== stream) : [...prev.targetStreams, stream] }));
  };

  const handleSave = () => {
    if (!form.title || !form.content || !form.type || form.targetRoles.length === 0) {
      toast.error('Please fill in all required fields');
      return;
    }
    const ann: Announcement = {
      id: editing ? editing.id : String(Date.now()),
      title: form.title,
      content: form.content,
      type: form.type as AnnouncementType,
      publishedBy: 'principal',
      publisherName: 'Principal',
      targetRoles: form.targetRoles,
      targetStreams: form.targetStreams.length > 0 ? form.targetStreams : undefined,
      isActive: true,
      createdAt: editing ? editing.createdAt : new Date().toISOString().split('T')[0],
    };
    if (editing) {
      setAnnouncements(prev => prev.map(a => a.id === editing.id ? ann : a));
      toast.success('Announcement updated');
    } else {
      setAnnouncements(prev => [ann, ...prev]);
      toast.success('Announcement published');
    }
    setDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    setAnnouncements(prev => prev.filter(a => a.id !== id));
    toast.success('Announcement deleted');
  };

  return (
    <DashboardLayout role="principal" userName="Principal" userEmail="principal@collegedost.com">
      <div className="space-y-6 pb-8">
        <PageHeader title="Announcements" description="Create and manage announcements for teachers and mentors">
          <Button onClick={openAdd} className="gap-2 rounded-xl gradient-primary border-0 text-white">
            <Plus className="h-4 w-4" />
            New Announcement
          </Button>
        </PageHeader>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard title="Total" value={announcements.length} icon={<Megaphone className="h-5 w-5 text-primary" />} iconBg="bg-primary/10" delay={0} />
          <StatCard title="Active" value={announcements.filter(a => a.isActive).length} icon={<Megaphone className="h-5 w-5 text-emerald-500" />} iconBg="bg-emerald-500/10" delay={0.1} />
          <StatCard title="Meetings" value={announcements.filter(a => a.type === 'meeting').length} icon={<Megaphone className="h-5 w-5 text-blue-500" />} iconBg="bg-blue-500/10" delay={0.2} />
          <StatCard title="Holidays" value={announcements.filter(a => a.type === 'holiday').length} icon={<Megaphone className="h-5 w-5 text-emerald-500" />} iconBg="bg-emerald-500/10" delay={0.3} />
        </div>

        <Card className="glass-card border-0">
          <CardContent className="p-4 sm:p-6">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search announcements..." value={search} onChange={e => setSearch(e.target.value)} className="h-10 rounded-xl bg-background/50 pl-9" />
            </div>

            <div className="mt-6 space-y-3">
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
                  <Megaphone className="h-12 w-12 opacity-30" />
                  <p className="text-sm font-medium">No announcements</p>
                </div>
              ) : (
                filtered.map((ann, i) => (
                  <motion.div
                    key={ann.id}
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="group rounded-xl bg-muted/30 p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={`rounded-lg text-[10px] px-2 ${typeColors[ann.type]}`}>{ann.type}</Badge>
                          <p className="font-semibold truncate">{ann.title}</p>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{ann.content}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{ann.createdAt}</span>
                          <span className="flex items-center gap-1"><Target className="h-3 w-3" />{ann.targetRoles.join(', ')}</span>
                          {ann.targetStreams && <span>{ann.targetStreams.join(', ')}</span>}
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger render={
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"><MoreHorizontal className="h-4 w-4" /></Button>
                        } />
                        <DropdownMenuContent align="end" className="rounded-xl">
                          <DropdownMenuItem className="gap-2 rounded-lg text-xs" onClick={() => setDetail(ann)}><Eye className="h-3.5 w-3.5" />View</DropdownMenuItem>
                          <DropdownMenuItem className="gap-2 rounded-lg text-xs" onClick={() => { setEditing(ann); setForm({ title: ann.title, content: ann.content, type: ann.type, targetRoles: ann.targetRoles, targetStreams: ann.targetStreams || [], expiresAt: '' }); setDialogOpen(true); }}><Pencil className="h-3.5 w-3.5" />Edit</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="gap-2 rounded-lg text-xs text-destructive" onClick={() => handleDelete(ann.id)}><Trash2 className="h-3.5 w-3.5" />Delete</DropdownMenuItem>
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="rounded-2xl sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Announcement' : 'New Announcement'}</DialogTitle>
            <DialogDescription>Fill in the details below</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs">Title *</Label>
              <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Announcement title" className="rounded-xl bg-background/50 h-10" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Type *</Label>
              <Select value={form.type} onValueChange={v => setForm({ ...form, type: v as AnnouncementType })}>
                <SelectTrigger className="h-10 rounded-xl bg-background/50"><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="notice">Notice</SelectItem>
                  <SelectItem value="holiday">Holiday</SelectItem>
                  <SelectItem value="meeting">Meeting</SelectItem>
                  <SelectItem value="exam">Exam</SelectItem>
                  <SelectItem value="emergency">Emergency</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Content *</Label>
              <Textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} placeholder="Announcement content..." className="rounded-xl bg-background/50 min-h-[100px]" rows={4} />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Target Roles *</Label>
              <div className="flex flex-wrap gap-2">
                {roles.map(role => (
                  <Button key={role} type="button" variant="outline" onClick={() => toggleRole(role)} className={`rounded-xl h-9 text-xs capitalize ${form.targetRoles.includes(role) ? 'bg-primary/10 text-primary border-primary/30' : ''}`}>
                    {role}
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Target Streams (optional)</Label>
              <div className="flex gap-2">
                {(['MPC', 'BiPC', 'CEC'] as StreamCode[]).map(stream => (
                  <Button key={stream} type="button" variant="outline" onClick={() => toggleStream(stream)} className={`flex-1 rounded-xl h-9 text-xs ${form.targetStreams.includes(stream) ? 'bg-primary/10 text-primary border-primary/30' : ''}`}>
                    {stream}
                  </Button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 mt-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="rounded-xl">Cancel</Button>
            <Button onClick={handleSave} className="rounded-xl gradient-primary border-0 text-white">{editing ? 'Update' : 'Publish'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!detail} onOpenChange={() => setDetail(null)}>
        <DialogContent className="rounded-2xl sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>{detail?.title}</DialogTitle>
            <DialogDescription>Published on {detail?.createdAt}</DialogDescription>
          </DialogHeader>
          {detail && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={`rounded-lg text-xs px-2 ${typeColors[detail.type]}`}>{detail.type}</Badge>
                <Badge variant="outline" className="rounded-lg text-xs">{detail.isActive ? 'Active' : 'Inactive'}</Badge>
              </div>
              <p className="text-sm">{detail.content}</p>
              <Separator />
              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                <span>Target: {detail.targetRoles.join(', ')}</span>
                {detail.targetStreams && <span>| Streams: {detail.targetStreams.join(', ')}</span>}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetail(null)} className="rounded-xl">Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
