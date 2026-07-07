'use client';

import React, { useState } from 'react';
import { Save, User, Phone, Mail, BadgeCheck, BookOpen, Users, Calendar, MapPin } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function TeacherSettings() {
  const [profile, setProfile] = useState({
    name: 'Dr. Ramesh Kumar',
    email: 'ramesh@college.edu',
    phone: '+91 98765 43210',
    subject: 'Mathematics',
    stream: 'MPC',
    sections: ['MPC-A', 'MPC-B', 'MPC-C'],
  });

  const handleSave = () => {
    toast.success('Profile updated successfully');
  };

  return (
    <DashboardLayout role="teacher" userName={profile.name} userEmail={profile.email}>
      <div className="space-y-6 pb-20 lg:pb-8">
        <PageHeader title="Settings" description="Manage your profile and preferences">
          <Button onClick={handleSave} className="gap-2 rounded-xl gradient-primary border-0 text-white shadow-lg shadow-primary/25">
            <Save className="h-4 w-4" />
            Save Changes
          </Button>
        </PageHeader>

        <Card className="glass-card border-0 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-primary/10 to-secondary/5 pointer-events-none" />
          <CardContent className="relative p-6 sm:p-8">
            <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
              <div className="relative group">
                <Avatar className="h-24 w-24 rounded-2xl ring-4 ring-primary/10 shadow-xl">
                  <AvatarImage src="" alt={profile.name} />
                  <AvatarFallback className="rounded-2xl bg-gradient-to-br from-primary to-secondary text-2xl font-bold text-white">
                    {profile.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
              </div>

              <div className="flex-1 space-y-4 text-center sm:text-left">
                <div>
                  <div className="flex items-center gap-2 justify-center sm:justify-start">
                    <h2 className="text-xl font-bold">{profile.name}</h2>
                    <BadgeCheck className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-1 justify-center sm:justify-start">
                    <Badge variant="outline" className="rounded-lg bg-primary/5 text-primary border-primary/20">Teacher</Badge>
                    <Badge variant="outline" className="rounded-lg bg-emerald-500/5 text-emerald-600 border-emerald-500/20">{profile.subject}</Badge>
                    <Badge variant="outline" className="rounded-lg bg-amber-500/5 text-amber-600 border-amber-500/20">{profile.stream}</Badge>
                    <span className="text-xs text-muted-foreground flex items-center gap-1"><Mail className="h-3 w-3" />{profile.email}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground flex items-center gap-1"><User className="h-3 w-3" /> Full Name</Label>
                    <Input value={profile.name} onChange={e => setProfile({ ...profile, name: e.target.value })} className="rounded-xl bg-background/50 h-10" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="h-3 w-3" /> Phone Number</Label>
                    <Input value={profile.phone} onChange={e => setProfile({ ...profile, phone: e.target.value })} placeholder="+91 98765 43210" className="rounded-xl bg-background/50 h-10" />
                  </div>
                </div>
              </div>
            </div>

            <Separator className="my-6" />

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                { label: 'Classes/Week', value: '24', icon: BookOpen, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                { label: 'Students', value: '173', icon: Users, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                { label: 'Attendance', value: '96.2%', icon: Calendar, color: 'text-violet-500', bg: 'bg-violet-500/10' },
                { label: 'Sections', value: profile.sections.length.toString(), icon: MapPin, color: 'text-amber-500', bg: 'bg-amber-500/10' },
              ].map((stat, i) => (
                <div key={i} className="flex items-center gap-3 rounded-xl bg-muted/30 p-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.bg}`}>
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-lg font-bold">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card className="glass-card border-0">
            <CardContent className="p-6 space-y-4">
              <h3 className="text-sm font-semibold flex items-center gap-2"><BookOpen className="h-4 w-4 text-primary" /> Teaching Details</h3>
              <Separator />
              <div className="space-y-2">
                <Label className="text-xs">Subject</Label>
                <Input value={profile.subject} disabled className="rounded-xl bg-muted/30 h-10 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Stream</Label>
                <Input value={profile.stream} disabled className="rounded-xl bg-muted/30 h-10 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Assigned Sections</Label>
                <div className="flex flex-wrap gap-2">
                  {profile.sections.map(s => (
                    <Badge key={s} variant="outline" className="rounded-lg bg-primary/5 text-primary border-primary/20">{s}</Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-0">
            <CardContent className="p-6 space-y-4">
              <h3 className="text-sm font-semibold flex items-center gap-2"><Calendar className="h-4 w-4 text-primary" /> Preferences</h3>
              <Separator />
              <div className="space-y-2">
                <Label className="text-xs">Email Notifications</Label>
                <p className="text-xs text-muted-foreground">Receive email alerts for schedule changes and announcements</p>
              </div>
              <Button variant="outline" className="rounded-xl w-full" onClick={() => toast.success('Notification preferences saved')}>Update Preferences</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
