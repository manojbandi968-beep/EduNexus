'use client';

// ============================================
// CollegeDost — Dashboard Layout Wrapper
// ============================================

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { X, GraduationCap } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { MobileNav } from './MobileNav';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { type UserRole } from '@/types';
import { signOut } from '@/lib/firebase/auth';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  PRINCIPAL_NAV_ITEMS,
  TEACHER_NAV_ITEMS,
  MENTOR_NAV_ITEMS,
} from '@/lib/constants';
interface DashboardLayoutProps {
  children: React.ReactNode;
  role: UserRole;
  userName?: string;
  userEmail?: string;
  userPhoto?: string;
}

export function DashboardLayout({
  children,
  role,
  userName: propUserName,
  userEmail: propUserEmail,
  userPhoto: propUserPhoto,
}: DashboardLayoutProps) {
  const router = useRouter();
  const { user: authUser } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const userName = authUser?.displayName || propUserName || 'User';
  const userEmail = authUser?.email || propUserEmail || '';
  const userPhoto = propUserPhoto || authUser?.photoURL || undefined;

  const handleLogout = useCallback(async () => {
    try {
      await signOut();
      window.location.href = '/';
    } catch {
      toast.error('Logout failed');
    }
  }, []);

  const navItems =
    role === 'principal'
      ? PRINCIPAL_NAV_ITEMS
      : role === 'teacher' || role === 'both'
        ? TEACHER_NAV_ITEMS
        : MENTOR_NAV_ITEMS;

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <Sidebar
        role={role}
        userName={userName}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        onLogout={handleLogout}
      />

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm lg:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed left-0 top-0 z-50 h-screen w-[280px] border-r border-border bg-sidebar lg:hidden"
            >
              <div className="flex h-16 items-center justify-between px-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
                    <GraduationCap className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <span className="text-sm font-bold">EduNexus</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setMobileMenuOpen(false)}
                  className="h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <ScrollArea className="h-[calc(100vh-4rem)] px-3 py-4">
                <nav className="space-y-1">
                  {navItems.map((item) => (
                    <a
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
                    >
                      {item.label}
                    </a>
                  ))}
                </nav>
              </ScrollArea>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div
        className={cn(
          'flex flex-1 flex-col transition-all duration-300',
          sidebarCollapsed ? 'lg:ml-[72px]' : 'lg:ml-[260px]'
        )}
      >
        <TopBar
          role={role}
          userName={userName}
          userEmail={userEmail}
          userPhoto={userPhoto}
          onMenuToggle={() => setMobileMenuOpen(true)}
          onLogout={handleLogout}
        />

        <main className="flex-1 overflow-auto">
          <div className="mx-auto max-w-7xl px-4 py-6 lg:px-6">{children}</div>
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <MobileNav role={role} />
    </div>
  );
}
