'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, ExternalLink, Plus } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const GOOGLE_CALENDAR_SRC = 'https://calendar.google.com/calendar/embed?height=600&wkst=1&ctz=Asia%2FKolkata&showPrint=0&showCalendars=0&showTabs=1&showTitle=0&src=ZW4uaW5kaWFuI2hvbGlkYXlAZ3JvdXAudi5jYWxlbmRhci5nb29nbGUuY29t&color=%230B8043';

export default function CalendarPage() {
  return (
    <DashboardLayout role="principal" userName="Principal" userEmail="principal@collegedost.com">
      <div className="space-y-6 pb-8">
        <PageHeader title="Calendar" description="Academic calendar with Indian holidays & festivals">
          <a
            href="https://calendar.google.com/calendar/u/0/r/eventedit"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button className="gap-2 rounded-xl gradient-primary border-0 text-white">
              <Plus className="h-4 w-4" />
              Add Event
            </Button>
          </a>
        </PageHeader>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="lg:col-span-3"
          >
            <Card className="glass-card border-0 overflow-hidden">
              <CardContent className="p-0">
                <iframe
                  src={GOOGLE_CALENDAR_SRC}
                  width="100%"
                  height="650"
                  style={{ border: 0 }}
                  loading="lazy"
                  title="Google Calendar - Indian Holidays & Festivals"
                />
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
                <CardDescription>Google Calendar integration</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-muted-foreground">
                <p>
                  This calendar shows Indian public holidays and festivals alongside your college events.
                </p>

                <div className="rounded-xl bg-muted/30 p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-[#0B8043]" />
                    <span className="text-xs font-medium">Indian Holidays</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-[#AD1457]" />
                    <span className="text-xs font-medium">Festivals & Observances</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-semibold text-foreground">How to declare holidays</p>
                  <ol className="list-decimal list-inside space-y-1 text-xs">
                    <li>Click <strong>Add Event</strong> to open Google Calendar</li>
                    <li>Sign in with your college Google account</li>
                    <li>Create an event with the holiday details</li>
                    <li>Set the date and add &quot;Holiday&quot; in the title</li>
                    <li>It will appear here automatically</li>
                  </ol>
                </div>

                <a
                  href="https://calendar.google.com/calendar/u/0/r"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <Button variant="outline" className="w-full gap-2 rounded-xl">
                    <ExternalLink className="h-4 w-4" />
                    Open Google Calendar
                  </Button>
                </a>
              </CardContent>
            </Card>

            <Card className="glass-card border-0">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Calendar className="h-4 w-4 text-primary" />
                  Quick Links
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {[
                  { label: 'Add Holiday', url: 'https://calendar.google.com/calendar/u/0/r/eventedit' },
                  { label: 'View Full Calendar', url: 'https://calendar.google.com/calendar/u/0/r/month' },
                  { label: 'Indian Holiday List 2026', url: 'https://www.india.gov.in/calendar' },
                ].map((link, i) => (
                  <a
                    key={i}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between rounded-xl bg-muted/30 p-3 hover:bg-muted/50 transition-colors"
                  >
                    <span className="text-sm font-medium">{link.label}</span>
                    <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                  </a>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
}
