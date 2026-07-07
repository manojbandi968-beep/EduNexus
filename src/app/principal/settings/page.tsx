'use client';

import React, { useState } from 'react';
import { Save, Building2, MapPin, Clock, User, Phone, Mail, Camera, Shield, BadgeCheck } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function SettingsPage() {
  const [profile, setProfile] = useState({
    name: 'Dr. Arvind Sharma',
    email: 'principal@collegedost.com',
    phone: '+91 98765 43210',
  });

  const [form, setForm] = useState({
    collegeName: 'EduNexus Junior College',
    address: 'Hyderabad, Telangana, India',
    academicYear: '2025-26',
    latitude: '17.3850',
    longitude: '78.4867',
    geofenceRadius: '200',
    lateThreshold: '10',
    minAttendance: '75',
    workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as string[],
  });

  const days = [
    { value: 'monday', label: 'Mon' }, { value: 'tuesday', label: 'Tue' }, { value: 'wednesday', label: 'Wed' },
    { value: 'thursday', label: 'Thu' }, { value: 'friday', label: 'Fri' }, { value: 'saturday', label: 'Sat' },
  ];

  const toggleDay = (day: string) => {
    setForm(prev => ({
      ...prev,
      workingDays: prev.workingDays.includes(day) ? prev.workingDays.filter(d => d !== day) : [...prev.workingDays, day],
    }));
  };

  const handleSave = () => {
    toast.success('Settings saved successfully');
  };

  return (
    <DashboardLayout role="principal" userName="Principal" userEmail="principal@collegedost.com">
      <div className="space-y-6 pb-8">
        <PageHeader title="Settings" description="Manage your profile and institution configuration">
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
                <button className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="h-4 w-4" />
                </button>
              </div>

              <div className="flex-1 space-y-4 text-center sm:text-left">
                <div>
                  <div className="flex items-center gap-2 justify-center sm:justify-start">
                    <h2 className="text-xl font-bold">{profile.name}</h2>
                    <BadgeCheck className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex flex-wrap items-center gap-3 mt-1 justify-center sm:justify-start">
                    <Badge variant="outline" className="rounded-lg bg-primary/5 text-primary border-primary/20">Principal</Badge>
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
                { label: 'Teachers', value: '24', icon: User, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                { label: 'Students', value: '486', icon: User, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                { label: 'Mentors', value: '8', icon: Shield, color: 'text-violet-500', bg: 'bg-violet-500/10' },
                { label: 'Sections', value: '12', icon: Building2, color: 'text-amber-500', bg: 'bg-amber-500/10' },
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
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base"><Building2 className="h-4 w-4 text-primary" />Institution Details</CardTitle>
              <CardDescription>Basic information about your institution</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs">College Name</Label>
                <Input value={form.collegeName} onChange={e => setForm({ ...form, collegeName: e.target.value })} className="rounded-xl bg-background/50 h-10" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Address</Label>
                <Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className="rounded-xl bg-background/50 h-10" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Academic Year</Label>
                <Input value={form.academicYear} onChange={e => setForm({ ...form, academicYear: e.target.value })} className="rounded-xl bg-background/50 h-10" />
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-0">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base"><MapPin className="h-4 w-4 text-primary" />Campus Location</CardTitle>
              <CardDescription>Geofence settings for attendance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs">Latitude</Label>
                  <Input value={form.latitude} onChange={e => setForm({ ...form, latitude: e.target.value })} className="rounded-xl bg-background/50 h-10" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Longitude</Label>
                  <Input value={form.longitude} onChange={e => setForm({ ...form, longitude: e.target.value })} className="rounded-xl bg-background/50 h-10" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Geofence Radius (meters)</Label>
                <Input type="number" value={form.geofenceRadius} onChange={e => setForm({ ...form, geofenceRadius: e.target.value })} className="rounded-xl bg-background/50 h-10" />
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-0">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base"><Clock className="h-4 w-4 text-primary" />Attendance Rules</CardTitle>
              <CardDescription>Configure attendance policies</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs">Late Check-in Threshold (minutes)</Label>
                <Input type="number" value={form.lateThreshold} onChange={e => setForm({ ...form, lateThreshold: e.target.value })} className="rounded-xl bg-background/50 h-10" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Minimum Attendance Percentage</Label>
                <Input type="number" value={form.minAttendance} onChange={e => setForm({ ...form, minAttendance: e.target.value })} className="rounded-xl bg-background/50 h-10" />
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-0">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base"><Clock className="h-4 w-4 text-primary" />Working Days</CardTitle>
              <CardDescription>Select working days of the week</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {days.map(day => (
                  <Button
                    key={day.value}
                    type="button"
                    variant="outline"
                    onClick={() => toggleDay(day.value)}
                    className={`rounded-xl h-10 flex-1 min-w-[60px] transition-all ${
                      form.workingDays.includes(day.value)
                        ? 'bg-primary/10 text-primary border-primary/30 shadow-sm'
                        : 'opacity-60 hover:opacity-80'
                    }`}
                  >
                    {day.label}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
