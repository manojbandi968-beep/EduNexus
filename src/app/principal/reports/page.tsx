'use client';

import React from 'react';
import { Download, TrendingUp, Users, ClipboardCheck, FileQuestion } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatCard } from '@/components/ui/stat-card';
import { XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip as RechartsTooltip, LineChart, Line } from 'recharts';

const attendanceTrend = [
  { month: 'Feb', rate: 92 }, { month: 'Mar', rate: 88 }, { month: 'Apr', rate: 94 },
  { month: 'May', rate: 85 }, { month: 'Jun', rate: 91 }, { month: 'Jul', rate: 89 },
];

const quizTrend = [
  { month: 'Feb', avg: 72 }, { month: 'Mar', avg: 75 }, { month: 'Apr', avg: 78 },
  { month: 'May', avg: 71 }, { month: 'Jun', avg: 76 }, { month: 'Jul', avg: 74 },
];

const reports = [
  { title: 'Monthly Attendance Report', desc: 'Detailed attendance data for the current month', icon: ClipboardCheck, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  { title: 'Quiz Performance Summary', desc: 'Average scores and performance trends by subject', icon: FileQuestion, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  { title: 'Teacher Performance Review', desc: 'Individual teacher metrics and analytics', icon: Users, color: 'text-primary', bg: 'bg-primary/10' },
  { title: 'Academic Progress Report', desc: 'Overall academic performance across all streams', icon: TrendingUp, color: 'text-violet-500', bg: 'bg-violet-500/10' },
];

export default function ReportsPage() {
  return (
    <DashboardLayout role="principal" userName="Principal" userEmail="principal@collegedost.com">
      <div className="space-y-6 pb-8">
        <PageHeader title="Reports" description="Generate and view performance reports">
          <Button variant="outline" className="gap-2 rounded-xl"><Download className="h-4 w-4" />Export All</Button>
        </PageHeader>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard title="Avg Attendance" value="89.4%" icon={<ClipboardCheck className="h-5 w-5 text-emerald-500" />} iconBg="bg-emerald-500/10" delay={0} />
          <StatCard title="Avg Quiz Score" value="74.3%" icon={<FileQuestion className="h-5 w-5 text-amber-500" />} iconBg="bg-amber-500/10" delay={0.1} />
          <StatCard title="Active Teachers" value="42" icon={<Users className="h-5 w-5 text-primary" />} iconBg="bg-primary/10" delay={0.2} />
          <StatCard title="Total Students" value="390" icon={<TrendingUp className="h-5 w-5 text-violet-500" />} iconBg="bg-violet-500/10" delay={0.3} />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {reports.map((report, i) => {
            const Icon = report.icon;
            return (
              <Card key={i} className="glass-card border-0 group cursor-pointer hover:bg-muted/30 transition-colors">
                <CardContent className="flex items-center gap-4 p-5">
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${report.bg}`}>
                    <Icon className={`h-6 w-6 ${report.color}`} />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">{report.title}</p>
                    <p className="text-xs text-muted-foreground">{report.desc}</p>
                  </div>
                  <Button variant="ghost" size="sm" className="rounded-lg text-xs">Generate</Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card className="glass-card border-0">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base"><ClipboardCheck className="h-4 w-4 text-emerald-500" />Attendance Trend</CardTitle>
              <CardDescription>Monthly attendance rate (%)</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={attendanceTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="month" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} domain={[70, 100]} />
                  <RechartsTooltip contentStyle={{ background: 'var(--popover)', border: '1px solid var(--border)', borderRadius: '12px', fontSize: '12px' }} />
                  <Line type="monotone" dataKey="rate" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981', r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="glass-card border-0">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base"><FileQuestion className="h-4 w-4 text-amber-500" />Quiz Score Trend</CardTitle>
              <CardDescription>Monthly average quiz scores (%)</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={quizTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="month" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} domain={[60, 100]} />
                  <RechartsTooltip contentStyle={{ background: 'var(--popover)', border: '1px solid var(--border)', borderRadius: '12px', fontSize: '12px' }} />
                  <Line type="monotone" dataKey="avg" stroke="#f59e0b" strokeWidth={2} dot={{ fill: '#f59e0b', r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
