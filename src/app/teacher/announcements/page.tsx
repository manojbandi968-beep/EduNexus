'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Megaphone,
  Search,
  Calendar,
  Eye,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { StatCard } from '@/components/ui/stat-card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { AnnouncementType } from '@/types';

interface Announcement {
  id: string;
  title: string;
  content: string;
  type: AnnouncementType;
  publisherName: string;
  createdAt: string;
}

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSocket, useSocketEvent } from '@/lib/socket/client';
import { SOCKET_EVENTS } from '@/lib/socket/events';
import { useAuth } from '@/contexts/AuthContext';

const typeColors: Record<AnnouncementType, string> = {
  notice: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20',
  holiday: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  meeting: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  exam: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  emergency: 'bg-red-500/10 text-red-600 border-red-500/20',
};

export default function TeacherAnnouncements() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const socket = useSocket();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Announcement | null>(null);

  const { data: announcements = [], isLoading } = useQuery({
    queryKey: ['announcements', 'teacher'],
    queryFn: () => fetch('/api/announcements?role=teacher').then(res => res.json()).then(data => data.records || []),
  });

  useSocketEvent(socket ? SOCKET_EVENTS.ANNOUNCEMENT_CREATED : '', () => {
    queryClient.invalidateQueries({ queryKey: ['announcements', 'teacher'] });
  });

  const filtered = announcements.filter((a: Announcement) =>
    a.title.toLowerCase().includes(search.toLowerCase()) || a.content.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout role="teacher" userName={user?.displayName || 'Teacher'} userEmail={user?.email || 'teacher@collegedost.com'}>
      <div className="space-y-6 pb-20 lg:pb-8">
        <PageHeader title="Announcements" description="View announcements from the Principal" />

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard title="Total" value={announcements.length} icon={<Megaphone className="h-5 w-5 text-primary" />} iconBg="bg-primary/10" delay={0} />
          <StatCard title="Meetings" value={announcements.filter((a: Announcement) => a.type === 'meeting').length} icon={<Megaphone className="h-5 w-5 text-blue-500" />} iconBg="bg-blue-500/10" delay={0.1} />
          <StatCard title="Exams" value={announcements.filter((a: Announcement) => a.type === 'exam').length} icon={<Megaphone className="h-5 w-5 text-amber-500" />} iconBg="bg-amber-500/10" delay={0.2} />
          <StatCard title="Holidays" value={announcements.filter((a: Announcement) => a.type === 'holiday' || a.type === 'emergency').length} icon={<Megaphone className="h-5 w-5 text-emerald-500" />} iconBg="bg-emerald-500/10" delay={0.3} />
        </div>

        <Card className="glass-card border-0">
          <CardContent className="p-4 sm:p-6">
            <div className="relative max-w-sm mb-6">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search announcements..." value={search} onChange={e => setSearch(e.target.value)} className="h-10 rounded-xl bg-background/50 pl-9" />
            </div>

            <div className="space-y-3">
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
                  <Megaphone className="h-12 w-12 opacity-30" />
                  <p className="text-sm font-medium">No announcements found</p>
                </div>
              ) : (
                filtered.map((ann: Announcement, i: number) => (
                  <motion.div
                    key={ann.id}
                    initial={{ y: 5, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="group rounded-xl bg-muted/30 p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => setSelected(ann)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={`rounded-lg text-[10px] px-2 ${typeColors[ann.type]}`}>{ann.type}</Badge>
                          <p className="font-semibold truncate">{ann.title}</p>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{ann.content}</p>
                        <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{ann.createdAt}</span>
                          <span>By {ann.publisherName}</span>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-3">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="rounded-2xl sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">{selected?.title}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <Badge variant="outline" className={`rounded-lg text-xs px-2 ${typeColors[selected.type]}`}>{selected.type}</Badge>
              <p className="text-sm">{selected.content}</p>
              <Separator />
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{selected.createdAt}</span>
                <span>Published by {selected.publisherName}</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
