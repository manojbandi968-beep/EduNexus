'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Search, Eye, Clock, User, Monitor, Globe } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { StatCard } from '@/components/ui/stat-card';

interface AuditEntry {
  id: string;
  action: string;
  user: string;
  role: string;
  details: string;
  timestamp: string;
  ipAddress: string;
  browser: string;
  device: string;
  type: 'login' | 'attendance' | 'quiz' | 'leave' | 'admin' | 'system';
}

const logs: AuditEntry[] = [
  { id: '1', action: 'Successful Login', user: 'principal@collegedost.com', role: 'principal', details: 'Logged in as Principal', timestamp: '2025-07-05 08:30:00', ipAddress: '192.168.1.100', browser: 'Chrome 125', device: 'Desktop', type: 'login' },
  { id: '2', action: 'Attendance Marked', user: 'ramesh@college.edu', role: 'teacher', details: 'Marked attendance for Period 1 - MPC-A', timestamp: '2025-07-05 07:45:00', ipAddress: '192.168.1.101', browser: 'Chrome 125', device: 'Mobile', type: 'attendance' },
  { id: '3', action: 'Quiz Created', user: 'ramesh@college.edu', role: 'teacher', details: 'Created "Calculus Test 5" for MPC-A', timestamp: '2025-07-04 14:20:00', ipAddress: '192.168.1.101', browser: 'Chrome 125', device: 'Desktop', type: 'quiz' },
  { id: '4', action: 'Leave Approved', user: 'principal@collegedost.com', role: 'principal', details: 'Approved casual leave for Prof. Kavita Sharma (Jul 14-16)', timestamp: '2025-07-05 09:15:00', ipAddress: '192.168.1.100', browser: 'Chrome 125', device: 'Desktop', type: 'leave' },
  { id: '5', action: 'Login Failed', user: 'unknown@attempt.com', role: 'unknown', details: 'Failed login attempt with incorrect credentials', timestamp: '2025-07-05 03:22:00', ipAddress: '203.0.113.50', browser: 'Firefox 120', device: 'Desktop', type: 'login' },
  { id: '6', action: 'Teacher Approved', user: 'principal@collegedost.com', role: 'principal', details: 'Approved teacher registration: Ankit Sharma (Physics)', timestamp: '2025-07-03 11:00:00', ipAddress: '192.168.1.100', browser: 'Chrome 125', device: 'Desktop', type: 'admin' },
  { id: '7', action: 'System Backup', user: 'system', role: 'system', details: 'Automated daily backup completed successfully', timestamp: '2025-07-05 02:00:00', ipAddress: '127.0.0.1', browser: '-', device: 'Server', type: 'system' },
  { id: '8', action: 'Attendance Edited', user: 'ramesh@college.edu', role: 'teacher', details: 'Edited attendance record for Period 3 - MPC-B', timestamp: '2025-07-04 10:30:00', ipAddress: '192.168.1.101', browser: 'Chrome 125', device: 'Desktop', type: 'attendance' },
];

const typeColors: Record<string, string> = {
  login: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  attendance: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  quiz: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  leave: 'bg-violet-500/10 text-violet-600 border-violet-500/20',
  admin: 'bg-primary/10 text-primary border-primary/20',
  system: 'bg-slate-500/10 text-slate-600 border-slate-500/20',
};

export default function AuditLogsPage() {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [selectedLog, setSelectedLog] = useState<AuditEntry | null>(null);

  const filtered = logs.filter(l => {
    const matchSearch = l.user.toLowerCase().includes(search.toLowerCase()) || l.details.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === 'all' || l.type === filterType;
    return matchSearch && matchType;
  });

  const todayCount = logs.filter(l => l.timestamp.startsWith('2025-07-05')).length;

  return (
    <DashboardLayout role="principal" userName="Principal" userEmail="principal@collegedost.com">
      <div className="space-y-6 pb-8">
        <PageHeader title="Audit Logs" description="Track all system activities and security events">
          <Badge variant="outline" className="rounded-lg bg-destructive/10 text-destructive border-destructive/20 text-xs px-3 py-1">{todayCount} events today</Badge>
        </PageHeader>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard title="Total Events" value={logs.length} icon={<Shield className="h-5 w-5 text-primary" />} iconBg="bg-primary/10" delay={0} />
          <StatCard title="Logins" value={logs.filter(l => l.type === 'login').length} icon={<Shield className="h-5 w-5 text-blue-500" />} iconBg="bg-blue-500/10" delay={0.1} />
          <StatCard title="Attendance" value={logs.filter(l => l.type === 'attendance').length} icon={<Shield className="h-5 w-5 text-emerald-500" />} iconBg="bg-emerald-500/10" delay={0.2} />
          <StatCard title="Admin Actions" value={logs.filter(l => l.type === 'admin').length} icon={<Shield className="h-5 w-5 text-amber-500" />} iconBg="bg-amber-500/10" delay={0.3} />
        </div>

        <Card className="glass-card border-0">
          <CardHeader className="pb-2">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="flex items-center gap-2 text-base"><Shield className="h-4 w-4 text-primary" />Activity Log</CardTitle>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="h-9 w-48 rounded-xl bg-background/50 pl-9 text-xs" />
                </div>
                <Select value={filterType} onValueChange={(v) => v && setFilterType(v)}>
                  <SelectTrigger className="h-9 w-[120px] rounded-xl bg-background/50 text-xs"><SelectValue placeholder="Type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="login">Login</SelectItem>
                    <SelectItem value="attendance">Attendance</SelectItem>
                    <SelectItem value="quiz">Quiz</SelectItem>
                    <SelectItem value="leave">Leave</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {filtered.map((log, i) => (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.01 }}
                    className="flex items-center justify-between rounded-xl bg-muted/20 p-3 cursor-pointer hover:bg-muted/40 transition-colors"
                    onClick={() => setSelectedLog(log)}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className={`h-2 w-2 shrink-0 rounded-full ${log.type === 'login' && log.action.includes('Failed') ? 'bg-red-500' : 'bg-primary'}`} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-semibold truncate">{log.action}</p>
                          <Badge variant="outline" className={`rounded text-[8px] px-1.5 py-0 ${typeColors[log.type]}`}>{log.type}</Badge>
                        </div>
                        <p className="text-[10px] text-muted-foreground truncate">{log.user} · {log.details}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 ml-4">
                      <span className="text-[10px] text-muted-foreground">{log.timestamp}</span>
                      <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                  </motion.div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="rounded-2xl sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">{selectedLog?.action}</DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <Badge variant="outline" className={`rounded-lg text-xs px-2 ${typeColors[selectedLog.type]}`}>{selectedLog.type}</Badge>
              <p className="text-sm">{selectedLog.details}</p>
              <Separator />
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="flex items-center gap-2"><User className="h-3.5 w-3.5 text-muted-foreground" /><span className="text-muted-foreground">User:</span> {selectedLog.user}</div>
                <div className="flex items-center gap-2"><Shield className="h-3.5 w-3.5 text-muted-foreground" /><span className="text-muted-foreground">Role:</span> {selectedLog.role}</div>
                <div className="flex items-center gap-2"><Clock className="h-3.5 w-3.5 text-muted-foreground" /><span className="text-muted-foreground">Time:</span> {selectedLog.timestamp}</div>
                <div className="flex items-center gap-2"><Globe className="h-3.5 w-3.5 text-muted-foreground" /><span className="text-muted-foreground">IP:</span> {selectedLog.ipAddress}</div>
                <div className="flex items-center gap-2"><Monitor className="h-3.5 w-3.5 text-muted-foreground" /><span className="text-muted-foreground">Browser:</span> {selectedLog.browser}</div>
                <div className="flex items-center gap-2"><Monitor className="h-3.5 w-3.5 text-muted-foreground" /><span className="text-muted-foreground">Device:</span> {selectedLog.device}</div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
