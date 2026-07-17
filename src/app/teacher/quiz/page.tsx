'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  FileQuestion,
  Plus,
  Search,
  TrendingUp,
  Users,
  Calendar,
  ChevronRight,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StatCard } from '@/components/ui/stat-card';
import { StreamBadge } from '@/components/ui/stream-badge';
import { createQuiz } from '@/lib/data-store';
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
import { useAuth } from '@/contexts/AuthContext';
import { getSocket, useSocket, useSocketEvent } from '@/lib/socket/client';
import { SOCKET_EVENTS } from '@/lib/socket/events';
import type { StreamCode } from '@/types';

interface Quiz {
  id: string;
  name: string;
  topic: string;
  section: string;
  stream: StreamCode;
  date: string;
  avgScore: number;
  students: number;
  totalStudents: number;
}

const initialQuizzes: Quiz[] = [
  { id: '1', name: 'Calculus Test 5', topic: 'Calculus', section: 'MPC-A', stream: 'MPC', date: '2025-07-05', avgScore: 76, students: 58, totalStudents: 58 },
  { id: '2', name: 'Integration Quiz', topic: 'Integration', section: 'MPC-B', stream: 'MPC', date: '2025-07-04', avgScore: 72, students: 55, totalStudents: 55 },
  { id: '3', name: 'Matrices Test', topic: 'Matrices', section: 'MPC-C', stream: 'MPC', date: '2025-07-03', avgScore: 81, students: 60, totalStudents: 60 },
  { id: '4', name: 'Differentiation Practice', topic: 'Differentiation', section: 'MPC-A', stream: 'MPC', date: '2025-06-28', avgScore: 74, students: 56, totalStudents: 58 },
  { id: '5', name: 'Vectors Quiz', topic: 'Vectors', section: 'MPC-B', stream: 'MPC', date: '2025-06-25', avgScore: 69, students: 52, totalStudents: 55 },
];

function TeacherQuizContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [quizzes, setQuizzes] = useState<Quiz[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('teacher_quizzes');
      if (saved) return JSON.parse(saved);
    }
    return initialQuizzes;
  });

  useEffect(() => {
    localStorage.setItem('teacher_quizzes', JSON.stringify(quizzes));
  }, [quizzes]);

  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const hasOpened = useRef(false);

  useEffect(() => {
    if (searchParams.get('create') === 'true' && !hasOpened.current) {
      hasOpened.current = true;
      setDialogOpen(true);
    }
  }, [searchParams]);
  const { user } = useAuth();
  const [form, setForm] = useState({ name: '', topic: '', section: '', stream: '' as StreamCode | '', questionCount: '' });

  const socket = useSocket();

  useSocketEvent(socket ? SOCKET_EVENTS.QUIZ_ENDED : '', (payload: any) => {
    // Check if it's this teacher's quiz
    if (payload.teacherId === user?.uid) {
      setQuizzes(prev => {
        // Find if it already exists, if so update score/students
        const existingIdx = prev.findIndex(q => q.topic === payload.topic && q.date === new Date().toISOString().split('T')[0]);
        if (existingIdx !== -1) {
          const newQuizzes = [...prev];
          newQuizzes[existingIdx] = {
            ...newQuizzes[existingIdx],
            students: payload.totalStudents,
            totalStudents: payload.totalStudents,
            avgScore: Math.floor(Math.random() * 20) + 70 // Mock score
          };
          return newQuizzes;
        } else {
          return [{
            id: String(Date.now()),
            name: `${payload.topic} Quiz`,
            topic: payload.topic,
            section: 'General',
            stream: 'MPC',
            date: new Date().toISOString().split('T')[0],
            avgScore: Math.floor(Math.random() * 20) + 70,
            students: payload.totalStudents,
            totalStudents: payload.totalStudents,
          }, ...prev];
        }
      });
      toast.success(`Quiz on ${payload.topic} saved! Completed at ${payload.istTime}`);
    }
  });

  const filtered = quizzes.filter(q => q.name.toLowerCase().includes(search.toLowerCase()) || q.topic.toLowerCase().includes(search.toLowerCase()));

  const handleCreate = () => {
    if (!form.name || !form.topic || !form.section || !form.stream) {
      toast.error('Please fill in all fields');
      return;
    }
    const newQuiz: Quiz = {
      id: String(Date.now()),
      name: form.name,
      topic: form.topic,
      section: form.section,
      stream: form.stream as StreamCode,
      date: new Date().toISOString().split('T')[0],
      avgScore: 0,
      students: 0,
      totalStudents: 0,
    };
    setQuizzes(prev => [newQuiz, ...prev]);
    createQuiz({ ...newQuiz, teacherName: user?.displayName || 'Dr. Ramesh Kumar', students: 0, totalStudents: 0, topic: newQuiz.topic });
    
    // Broadcast via WebSocket to update Principal Dashboard
    const socket = getSocket();
    if (socket) {
      socket.emit(SOCKET_EVENTS.TEACHER_START_QUIZ, {
        teacherName: user?.displayName || 'Teacher',
        teacherId: user?.uid || 'unknown',
        subject: form.topic,
        section: form.section,
        stream: form.stream,
        timestamp: Date.now(),
      });
    }
    
    toast.success('Quiz created successfully');
    setDialogOpen(false);
    setForm({ name: '', topic: '', section: '', stream: '', questionCount: '' });
    
    // Redirect to Live Quiz page
    router.push(`/teacher/quiz/${newQuiz.id}/live?topic=${encodeURIComponent(newQuiz.topic)}&name=${encodeURIComponent(newQuiz.name)}&section=${encodeURIComponent(newQuiz.section)}&stream=${encodeURIComponent(newQuiz.stream)}`);
  };

  return (
    <DashboardLayout role="teacher" userName="Dr. Ramesh Kumar" userEmail="ramesh@college.edu">
      <div className="space-y-6 pb-20 lg:pb-8">
        <PageHeader title="Quizzes" description="Create and manage quizzes">
          <Button onClick={() => setDialogOpen(true)} className="gap-2 rounded-xl gradient-primary border-0 text-white">
            <Plus className="h-4 w-4" />
            New Quiz
          </Button>
        </PageHeader>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard title="Total Quizzes" value={quizzes.length} icon={<FileQuestion className="h-5 w-5 text-primary" />} iconBg="bg-primary/10" delay={0} />
          <StatCard title="Avg Score" value={`${Math.round(quizzes.reduce((a, q) => a + q.avgScore, 0) / quizzes.length)}%`} icon={<TrendingUp className="h-5 w-5 text-emerald-500" />} iconBg="bg-emerald-500/10" delay={0.1} />
          <StatCard title="Students Tested" value={quizzes.reduce((a, q) => a + q.students, 0)} icon={<Users className="h-5 w-5 text-amber-500" />} iconBg="bg-amber-500/10" delay={0.2} />
          <StatCard title="This Week" value={quizzes.filter(q => q.date >= '2025-07-05').length} icon={<Calendar className="h-5 w-5 text-violet-500" />} iconBg="bg-violet-500/10" delay={0.3} />
        </div>

        <Card className="glass-card border-0">
          <CardHeader className="pb-2">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="flex items-center gap-2 text-base"><FileQuestion className="h-4 w-4 text-primary" />All Quizzes</CardTitle>
              <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Search quizzes..." value={search} onChange={e => setSearch(e.target.value)} className="h-9 rounded-xl bg-background/50 pl-9 text-xs" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
                  <FileQuestion className="h-12 w-12 opacity-30" />
                  <p className="text-sm font-medium">No quizzes yet</p>
                  <Button variant="outline" onClick={() => setDialogOpen(true)} className="mt-2 gap-2 rounded-xl"><Plus className="h-4 w-4" />Create Quiz</Button>
                </div>
              ) : (
                filtered.map((quiz, i) => (
                  <motion.div
                    key={quiz.id}
                    initial={{ y: 5, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="flex items-center justify-between rounded-xl bg-muted/30 p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold">{quiz.name}</p>
                        <StreamBadge stream={quiz.stream} size="sm" />
                      </div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-x-3 text-xs text-muted-foreground">
                        <span>{quiz.topic}</span>
                        <span>{quiz.section}</span>
                        <span>{quiz.date}</span>
                        <span>{quiz.students}/{quiz.totalStudents} students</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 ml-4">
                      <div className="text-right">
                        <p className={`text-lg font-bold ${quiz.avgScore >= 75 ? 'text-emerald-500' : quiz.avgScore >= 60 ? 'text-amber-500' : 'text-slate-500'}`}>
                          {quiz.avgScore > 0 ? `${quiz.avgScore}%` : '-'}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="rounded-2xl sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Create New Quiz</DialogTitle>
            <DialogDescription>Set up a new quiz for your section</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs">Quiz Name *</Label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g., Calculus Test 6" className="rounded-xl bg-background/50 h-10" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Topic *</Label>
              <Input value={form.topic} onChange={e => setForm({ ...form, topic: e.target.value })} placeholder="e.g., Integration by Parts" className="rounded-xl bg-background/50 h-10" />
            </div>
            <div className="grid grid-cols-2 gap-4">
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
                <Select value={form.section} onValueChange={v => v && setForm({ ...form, section: v })}>
                  <SelectTrigger className="h-10 rounded-xl bg-background/50"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {['MPC-A', 'MPC-B', 'MPC-C', 'BiPC-A', 'BiPC-B', 'CEC-A', 'CEC-B'].map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Number of Questions</Label>
              <Input type="number" value={form.questionCount} onChange={e => setForm({ ...form, questionCount: e.target.value })} placeholder="e.g., 30" className="rounded-xl bg-background/50 h-10" />
            </div>
          </div>
          <DialogFooter className="gap-2 mt-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="rounded-xl">Cancel</Button>
            <Button onClick={handleCreate} className="rounded-xl gradient-primary border-0 text-white">Create Quiz</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

export default function TeacherQuiz() {
  return (
    <Suspense fallback={null}>
      <TeacherQuizContent />
    </Suspense>
  );
}
