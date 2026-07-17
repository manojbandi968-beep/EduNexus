'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { Shield, BookOpen, Users, ArrowLeft, Sun, Moon, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const roles = [
  {
    title: 'Principal Login',
    description: 'Access institution-wide analytics and manage all operations.',
    icon: Shield,
    href: '/principal-login',
    color: 'amber',
    gradient: 'from-amber-500 to-amber-600',
    bg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    border: 'hover:border-amber-500/50',
  },
  {
    title: 'Teacher Login',
    description: 'Manage attendance, quizzes, and monitor student progress.',
    icon: BookOpen,
    href: '/teacher-login',
    color: 'indigo',
    gradient: 'from-indigo-500 to-indigo-600',
    bg: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
    border: 'hover:border-indigo-500/50',
  },
  {
    title: 'Mentor Login',
    description: 'Track study hours and manage student accountability.',
    icon: Users,
    href: '/mentor-login',
    color: 'emerald',
    gradient: 'from-emerald-500 to-emerald-600',
    bg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    border: 'hover:border-emerald-500/50',
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
} as const;

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: 'spring' as const,
      stiffness: 100,
      damping: 15,
    },
  },
} as const;

export default function LoginPage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12 bg-background">
      {/* Animated Background from Landing Page */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            x: [0, 50, 0],
            y: [0, -30, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -left-40 top-1/4 h-96 w-96 rounded-full bg-primary/10 blur-3xl"
        />
        <motion.div
          animate={{
            x: [0, -40, 0],
            y: [0, 40, 0],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -right-40 bottom-1/4 h-96 w-96 rounded-full bg-chart-2/10 blur-3xl"
        />
        <div className="absolute inset-0 pattern-dots opacity-30" />
      </div>

      {/* Floating decorative elements */}
      <motion.div
        animate={{
          y: [0, -15, 0],
          x: [0, 10, 0],
        }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-20 left-10 w-32 h-32 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 blur-xl pointer-events-none"
      />
      <motion.div
        animate={{
          y: [0, 15, 0],
          x: [0, -10, 0],
        }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        className="absolute bottom-20 right-10 w-24 h-24 rounded-2xl bg-gradient-to-br from-chart-2/20 to-chart-2/5 border border-chart-2/20 blur-xl pointer-events-none"
      />

      {/* Theme Toggle */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="absolute right-4 top-4 z-50"
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="glass h-10 w-10 rounded-xl"
        >
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>
      </motion.div>

      {/* Back Button */}
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3 }}
        className="absolute left-4 top-4 z-50"
      >
        <Button
          variant="ghost"
          onClick={() => router.push('/')}
          className="glass gap-2 rounded-xl"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Button>
      </motion.div>

      {/* Decorative Blurs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          animate={{ x: [0, 20, 0], y: [0, -15, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -right-20 top-1/3 h-72 w-72 rounded-full bg-primary/10 blur-3xl"
        />
        <motion.div
          animate={{ x: [0, -15, 0], y: [0, 20, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -left-20 bottom-1/3 h-72 w-72 rounded-full bg-chart-2/10 blur-3xl"
        />
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-4xl z-10"
      >
        <div className="text-center mb-10">
          <motion.h1 variants={itemVariants} className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Welcome back to <span className="bg-gradient-to-r from-primary to-chart-5 bg-clip-text text-transparent">EduNexus</span>
          </motion.h1>
          <motion.p variants={itemVariants} className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Select your role to continue to your personalized dashboard
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {roles.map((role) => (
            <motion.div key={role.title} variants={itemVariants} whileHover={{ y: -5 }}>
              <Card 
                className={cn(
                  "glass-card h-full cursor-pointer transition-all duration-300 border-border/50",
                  role.border,
                  "hover:shadow-xl hover:shadow-" + role.color + "-500/10"
                )}
                onClick={() => router.push(role.href)}
              >
                <CardHeader>
                  <div className={cn('flex h-14 w-14 items-center justify-center rounded-2xl mb-4', role.bg)}>
                    <role.icon className="h-7 w-7" />
                  </div>
                  <CardTitle className="text-xl">{role.title}</CardTitle>
                  <CardDescription className="text-sm mt-2">{role.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center text-sm font-medium text-muted-foreground mt-4 group-hover:text-foreground transition-colors">
                    Continue <ArrowRight className="ml-2 h-4 w-4" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
