'use client';

// ============================================
// CollegeDost — Top Bar
// ============================================

import React from 'react';
import { useTheme } from 'next-themes';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  Sun,
  Moon,
  Bell,
  Search,
  Menu,
  User,
  LogOut,
  Settings,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { type UserRole } from '@/types';

interface TopBarProps {
  role: UserRole;
  userName?: string;
  userEmail?: string;
  userPhoto?: string;
  notificationCount?: number;
  onMenuToggle?: () => void;
  onLogout?: () => void;
}

export function TopBar({
  role,
  userName = 'User',
  userEmail = '',
  userPhoto,
  notificationCount = 0,
  onMenuToggle,
  onLogout,
}: TopBarProps) {
  const { theme, setTheme } = useTheme();
  const router = useRouter();

  const initials = userName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <motion.header
      initial={{ y: -10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur-md lg:px-6"
    >
      {/* Left: Menu + Search */}
      <div className="flex items-center gap-3">
        {/* Mobile Menu Toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 lg:hidden"
          onClick={onMenuToggle}
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Search */}
        <div className="hidden items-center gap-2 rounded-xl bg-muted/50 px-3 sm:flex">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search..."
            className="h-9 w-48 border-0 bg-transparent px-0 text-sm placeholder:text-muted-foreground/60 focus-visible:ring-0 lg:w-64"
          />
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="h-9 w-9 rounded-xl"
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-xl">
          <Bell className="h-4 w-4" />
          {notificationCount > 0 && (
            <Badge className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive p-0 text-[10px] text-white">
              {notificationCount > 99 ? '99+' : notificationCount}
            </Badge>
          )}
        </Button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger render={
            <Button variant="ghost" className="h-9 gap-2 rounded-xl px-2">
              <Avatar className="h-7 w-7">
                <AvatarImage src={userPhoto} alt={userName} />
                <AvatarFallback className="bg-primary/10 text-xs font-bold text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="hidden flex-col items-start md:flex">
                <span className="text-xs font-semibold">{userName}</span>
                <span className="text-[10px] capitalize text-muted-foreground">{role}</span>
              </div>
            </Button>
          } />
          <DropdownMenuContent align="end" className="w-56 rounded-xl">
            <DropdownMenuGroup>
              <DropdownMenuLabel>
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-semibold">{userName}</span>
                  <span className="text-xs font-normal text-muted-foreground">{userEmail}</span>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="gap-2 rounded-lg"
              onClick={() => router.push(`/${role}/profile`)}
            >
              <User className="h-4 w-4" />
              Profile
            </DropdownMenuItem>
            {role === 'principal' && (
              <DropdownMenuItem
                className="gap-2 rounded-lg"
                onClick={() => router.push('/principal/settings')}
              >
                <Settings className="h-4 w-4" />
                Settings
              </DropdownMenuItem>
            )}
            {(role === 'teacher' || role === 'both') && (
              <DropdownMenuItem
                className="gap-2 rounded-lg"
                onClick={() => router.push('/teacher/settings')}
              >
                <Settings className="h-4 w-4" />
                Settings
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="gap-2 rounded-lg text-destructive focus:text-destructive"
              onClick={onLogout}
            >
              <LogOut className="h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.header>
  );
}
