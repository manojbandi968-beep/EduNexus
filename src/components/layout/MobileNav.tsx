'use client';

// ============================================
// CollegeDost — Mobile Bottom Navigation
// ============================================

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  ClipboardCheck,
  Calendar,
  FileQuestion,
  Megaphone,
  CalendarOff,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { type UserRole } from '@/types';

interface MobileNavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

const MOBILE_NAV: Record<string, MobileNavItem[]> = {
  principal: [
    { label: 'Home', href: '/principal', icon: LayoutDashboard },
    { label: 'Attendance', href: '/principal/attendance', icon: ClipboardCheck },
    { label: 'Timetable', href: '/principal/timetable', icon: Calendar },
    { label: 'Quizzes', href: '/principal/quizzes', icon: FileQuestion },
    { label: 'Alerts', href: '/principal/announcements', icon: Megaphone },
  ],
  teacher: [
    { label: 'Home', href: '/teacher', icon: LayoutDashboard },
    { label: 'Attendance', href: '/teacher/attendance', icon: ClipboardCheck },
    { label: 'Timetable', href: '/teacher/timetable', icon: Calendar },
    { label: 'Leave', href: '/teacher/leave', icon: CalendarOff },
    { label: 'Settings', href: '/teacher/settings', icon: Settings },
  ],
  mentor: [
    { label: 'Home', href: '/mentor', icon: LayoutDashboard },
    { label: 'Attendance', href: '/mentor/attendance', icon: ClipboardCheck },
    { label: 'Alerts', href: '/mentor/announcements', icon: Megaphone },
  ],
  both: [
    { label: 'Home', href: '/teacher', icon: LayoutDashboard },
    { label: 'Attendance', href: '/teacher/attendance', icon: ClipboardCheck },
    { label: 'Timetable', href: '/teacher/timetable', icon: Calendar },
    { label: 'Leave', href: '/teacher/leave', icon: CalendarOff },
    { label: 'Settings', href: '/teacher/settings', icon: Settings },
  ],
};

interface MobileNavProps {
  role: UserRole;
}

export function MobileNav({ role }: MobileNavProps) {
  const pathname = usePathname();
  const items = MOBILE_NAV[role] || MOBILE_NAV.teacher;

  const isActive = (href: string) => {
    const roleBase = `/${role === 'both' ? 'teacher' : role}`;
    if (href === roleBase) return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/95 backdrop-blur-md lg:hidden">
      <div className="mx-auto flex max-w-lg items-center justify-around px-2 py-1">
        {items.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'relative flex flex-col items-center gap-0.5 rounded-xl px-3 py-2 text-[10px] font-medium transition-colors',
                active
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {active && (
                <motion.div
                  layoutId="mobile-nav-indicator"
                  className="absolute -top-1 h-0.5 w-6 rounded-full bg-primary"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
              <Icon className={cn('h-5 w-5', active && 'text-primary')} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
      {/* Safe area for iOS */}
      <div className="h-safe-area-inset-bottom" />
    </nav>
  );
}
