'use client';

import React, { useState, useSyncExternalStore } from 'react';
import { motion } from 'framer-motion';
import {
  FileQuestion,
  Search,
  Calendar,
  TrendingUp,
  Users,
} from 'lucide-react';
import { subscribe, getData } from '@/lib/data-store';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from 'recharts';

interface Quiz {
  id: string;
  name: string;
  subject: string;
  teacher: string;
  section: string;
  stream: 'MPC' | 'BiPC' | 'CEC';
  date: string;
  avgScore: number;
  students: number;
}

const mockQuizzes: Quiz[] = [
  { id: '1', name: 'Calculus Test 5', subject: 'Mathematics', teacher: 'Dr. Ramesh Kumar', section: 'MPC-A', stream: 'MPC', date: '2025-07-05', avgScore: 76, students: 58 },
  { id: '2', name: 'Integration Quiz', subject: 'Mathematics', teacher: 'Dr. Ramesh Kumar', section: 'MPC-B', stream: 'MPC', date: '2025-07-04', avgScore: 72, students: 55 },
  { id: '3', name: 'Matrices Test', subject: 'Mathematics', teacher: 'Dr. Ramesh Kumar', section: 'MPC-C', stream: 'MPC', date: '2025-07-03', avgScore: 81, students: 60 },
  { id: '4', name: 'Kinematics Quiz', subject: 'Physics', teacher: 'Prof. S. Lakshmi', section: 'MPC-A', stream: 'MPC', date: '2025-07-05', avgScore: 68, students: 58 },
  { id: '5', name: 'Organic Chem Test', subject: 'Chemistry', teacher: 'Dr. Sunita Desai', section: 'BiPC-A', stream: 'BiPC', date: '2025-07-04', avgScore: 74, students: 48 },
  { id: '6', name: 'Cell Biology Quiz', subject: 'Biology', teacher: 'Dr. Venkat Rao', section: 'BiPC-A', stream: 'BiPC', date: '2025-07-03', avgScore: 82, students: 50 },
  { id: '7', name: 'Market Structures', subject: 'Commerce', teacher: 'Prof. Kavita Sharma', section: 'CEC-A', stream: 'CEC', date: '2025-07-02', avgScore: 71, students: 42 },
  { id: '8', name: 'English Grammar', subject: 'English', teacher: 'Prof. Meera Nair', section: 'MPC-A', stream: 'MPC', date: '2025-07-01', avgScore: 79, students: 57 },
];

export default function QuizzesPage() {
  const [search, setSearch] = useState('');
  const [filterStream, setFilterStream] = useState('all');
  const store = useSyncExternalStore(subscribe, getData, getData);

  const quizzes = [
    ...store.quizzes.map(q => ({
      id: q.id,
      name: q.name,
      subject: q.topic,
      teacher: q.teacherName,
      section: q.section,
      stream: q.stream as 'MPC' | 'BiPC' | 'CEC',
      date: q.date,
      avgScore: q.avgScore,
      students: q.students,
    })),
    ...mockQuizzes,
  ];

  const subjectAvg = quizzes.reduce<Record<string, { total: number; count: number }>>((acc, q) => {
    if (!acc[q.subject]) acc[q.subject] = { total: 0, count: 0 };
    acc[q.subject].total += q.avgScore;
    acc[q.subject].count += 1;
    return acc;
  }, {});

  const chartData = Object.entries(subjectAvg).map(([subject, data]) => ({
    subject,
    avg: Math.round(data.total / data.count),
  }));

  const filtered = quizzes.filter(q => {
    const matchSearch = q.name.toLowerCase().includes(search.toLowerCase()) || q.teacher.toLowerCase().includes(search.toLowerCase());
    const matchStream = filterStream === 'all' || q.stream === filterStream;
    return matchSearch && matchStream;
  });

  return (
    <DashboardLayout role="principal" userName="Principal" userEmail="principal@collegedost.com">
      <div className="space-y-6 pb-8">
        <PageHeader title="Quizzes" description="Track quiz performance across subjects and sections" />

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard title="Total Quizzes" value={quizzes.length} icon={<FileQuestion className="h-5 w-5 text-primary" />} iconBg="bg-primary/10" delay={0} />
          <StatCard title="Overall Avg" value={`${Math.round(quizzes.reduce((a, q) => a + q.avgScore, 0) / quizzes.length)}%`} icon={<TrendingUp className="h-5 w-5 text-emerald-500" />} iconBg="bg-emerald-500/10" delay={0.1} />
          <StatCard title="Students Tested" value={quizzes.reduce((a, q) => a + q.students, 0)} icon={<Users className="h-5 w-5 text-amber-500" />} iconBg="bg-amber-500/10" delay={0.2} />
          <StatCard title="This Week" value={quizzes.filter(q => q.date >= '2025-07-05').length} icon={<Calendar className="h-5 w-5 text-violet-500" />} iconBg="bg-violet-500/10" delay={0.3} />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card className="glass-card border-0 lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base"><FileQuestion className="h-4 w-4 text-primary" />Recent Quizzes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder="Search quizzes..." value={search} onChange={e => setSearch(e.target.value)} className="h-10 rounded-xl bg-background/50 pl-9" />
                </div>
                <Select value={filterStream} onValueChange={(v) => v && setFilterStream(v)}>
                  <SelectTrigger className="h-10 w-[130px] rounded-xl bg-background/50"><SelectValue placeholder="Stream" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Streams</SelectItem>
                    <SelectItem value="MPC">MPC</SelectItem>
                    <SelectItem value="BiPC">BiPC</SelectItem>
                    <SelectItem value="CEC">CEC</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-3">
                {filtered.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
                    <FileQuestion className="h-12 w-12 opacity-30" />
                    <p className="text-sm font-medium">No quizzes found</p>
                  </div>
                ) : (
                  filtered.map((quiz, i) => (
                    <motion.div key={quiz.id} initial={{ y: 5, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: i * 0.02 }} className="flex items-center justify-between rounded-xl bg-muted/30 p-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold truncate">{quiz.name}</p>
                          <StreamBadge stream={quiz.stream} size="sm" />
                        </div>
                        <div className="mt-0.5 flex flex-wrap items-center gap-x-3 text-xs text-muted-foreground">
                          <span>{quiz.subject}</span>
                          <span>{quiz.teacher}</span>
                          <span>{quiz.section}</span>
                          <span>{quiz.date}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 ml-4">
                        <div className="text-right">
                          <p className={`text-lg font-bold ${quiz.avgScore >= 75 ? 'text-emerald-500' : quiz.avgScore >= 60 ? 'text-amber-500' : 'text-red-500'}`}>{quiz.avgScore}%</p>
                          <p className="text-[10px] text-muted-foreground">{quiz.students} students</p>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-0">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base"><TrendingUp className="h-4 w-4 text-primary" />Average by Subject</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData} layout="vertical" barSize={18}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                  <XAxis type="number" fontSize={11} tickLine={false} axisLine={false} domain={[0, 100]} />
                  <YAxis dataKey="subject" type="category" fontSize={11} tickLine={false} axisLine={false} width={80} />
                  <RechartsTooltip contentStyle={{ background: 'var(--popover)', border: '1px solid var(--border)', borderRadius: '12px', fontSize: '12px' }} />
                  <Bar dataKey="avg" fill="var(--primary)" radius={[0, 4, 4, 0]} name="Average %" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
