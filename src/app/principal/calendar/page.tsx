'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Plus, Save } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { createDocument, getDocuments, COLLECTIONS } from '@/lib/firebase/firestore';
import { getSocket } from '@/lib/socket/client';
import { SOCKET_EVENTS } from '@/lib/socket/events';
import type { CollegeEvent, EventType } from '@/types';

const GOOGLE_CALENDAR_SRC = 'https://calendar.google.com/calendar/embed?height=600&wkst=1&ctz=Asia%2FKolkata&showPrint=0&showCalendars=0&showTabs=1&showTitle=0&src=ZW4uaW5kaWFuI2hvbGlkYXlAZ3JvdXAudi5jYWxlbmRhci5nb29nbGUuY29t&color=%230B8043';

export default function CalendarPage() {
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [events, setEvents] = useState<CollegeEvent[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({ title: '', type: 'event' as EventType, date: '', description: '' });

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      // Assuming we get all events, we could add sorting/limits in production
      const data = await getDocuments<CollegeEvent>(COLLECTIONS.EVENTS);
      // Sort by date (descending)
      setEvents(data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    } catch (error) {
      console.error('Failed to fetch events:', error);
    }
  };

  const handleCreate = async () => {
    if (!form.title || !form.type || !form.date) {
      toast.error('Please fill in title, type and date.');
      return;
    }

    setIsSubmitting(true);
    try {
      const newEvent: Omit<CollegeEvent, 'id'> = {
        title: form.title,
        type: form.type,
        date: form.date,
        description: form.description,
        createdBy: user?.uid || 'system',
        creatorName: user?.displayName || 'Principal',
        timestamp: new Date().toISOString(),
      };

      const docId = await createDocument(COLLECTIONS.EVENTS, newEvent);
      
      const completeEvent: CollegeEvent = { ...newEvent, id: docId };
      setEvents(prev => [completeEvent, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));

      // Emit socket event to notify teacher and mentor dashboards
      const socket = getSocket();
      socket.emit(SOCKET_EVENTS.PRINCIPAL_CREATE_EVENT, {
        id: docId,
        title: form.title,
        description: form.description,
        startDate: form.date,
        endDate: form.date,
        type: form.type,
        targetRoles: ['teacher', 'mentor'], // Send to both
        createdBy: user?.uid || 'system',
        createdByName: user?.displayName || 'Principal',
        timestamp: Date.now(),
      });

      toast.success('Event created and synchronized successfully!');
      setIsModalOpen(false);
      setForm({ title: '', type: 'event', date: '', description: '' });
    } catch (error) {
      toast.error('Failed to create event. Please try again.');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'holiday': return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
      case 'exam': return 'bg-red-500/10 text-red-600 border-red-500/20';
      case 'meeting': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      default: return 'bg-primary/10 text-primary border-primary/20';
    }
  };

  return (
    <DashboardLayout role="principal" userName="Principal" userEmail="principal@collegedost.com">
      <div className="space-y-6 pb-8">
        <PageHeader title="Calendar" description="Academic calendar with Indian holidays & local events">
          <Button onClick={() => setIsModalOpen(true)} className="gap-2 rounded-xl gradient-primary border-0 text-white shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all">
            <Plus className="h-4 w-4" />
            Add Event
          </Button>
        </PageHeader>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="lg:col-span-3 space-y-6"
          >
            {/* Google Calendar Iframe */}
            <Card className="glass-card border-0 overflow-hidden">
              <CardContent className="p-0">
                <iframe
                  src={GOOGLE_CALENDAR_SRC}
                  width="100%"
                  height="450"
                  style={{ border: 0 }}
                  loading="lazy"
                  title="Google Calendar - Indian Holidays & Festivals"
                />
              </CardContent>
            </Card>

            {/* Local Events List */}
            <Card className="glass-card border-0">
              <CardHeader>
                <CardTitle>Local College Events & Holidays</CardTitle>
                <CardDescription>Events created by administration, synced to all staff.</CardDescription>
              </CardHeader>
              <CardContent>
                {events.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground">
                    <Calendar className="mx-auto h-10 w-10 opacity-20 mb-3" />
                    <p>No local events created yet.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {events.map((event) => (
                      <div key={event.id} className={`p-4 rounded-xl border ${getTypeColor(event.type)} bg-card/50`}>
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-semibold text-foreground">{event.title}</h4>
                          <span className="text-xs uppercase font-bold tracking-wider opacity-80">{event.type}</span>
                        </div>
                        <p className="text-sm font-medium opacity-90 mb-1">{new Date(event.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}</p>
                        {event.description && <p className="text-xs opacity-70 mt-2">{event.description}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="space-y-6"
          >
            <Card className="glass-card border-0">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Calendar className="h-4 w-4 text-primary" />
                  About
                </CardTitle>
                <CardDescription>Unified Calendar System</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-muted-foreground">
                <p>
                  This calendar combines standard Indian public holidays with local events specific to the college.
                </p>

                <div className="rounded-xl bg-muted/30 p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-[#0B8043]" />
                    <span className="text-xs font-medium">Indian Holidays (Google)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-emerald-500" />
                    <span className="text-xs font-medium">Local Holidays</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-blue-500" />
                    <span className="text-xs font-medium">Local Meetings/Events</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-semibold text-foreground">How to declare an event</p>
                  <ol className="list-decimal list-inside space-y-1 text-xs">
                    <li>Click <strong>Add Event</strong> to open the local modal</li>
                    <li>Select the Type (e.g., Holiday, Exam)</li>
                    <li>Fill in details and save</li>
                    <li>It will instantly sync to all Teacher and Mentor dashboards</li>
                  </ol>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New Event</DialogTitle>
            <DialogDescription>
              This event will be pushed in real-time to all teachers and mentors.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Event Title</Label>
              <Input
                id="title"
                placeholder="e.g., Diwali Break, Mid-Term Exams"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label>Event Type</Label>
              <Select
                value={form.type}
                onValueChange={(val: any) => setForm({ ...form, type: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="holiday">Holiday</SelectItem>
                  <SelectItem value="exam">Examination</SelectItem>
                  <SelectItem value="meeting">Meeting</SelectItem>
                  <SelectItem value="event">General Event</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="desc">Description (Optional)</Label>
              <Input
                id="desc"
                placeholder="Additional details..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={isSubmitting} className="gradient-primary text-white border-0">
              <Save className="mr-2 h-4 w-4" />
              {isSubmitting ? 'Saving...' : 'Save & Broadcast'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
