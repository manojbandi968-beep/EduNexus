'use client';

// ============================================
// EduNexus — Login Landing Page
// ============================================

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useAuth } from '@/contexts/AuthContext';
import {
  GraduationCap,
  BookOpen,
  Users,
  Shield,
  Sun,
  Moon,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { signInWithGoogle, createSessionCookie } from '@/lib/firebase/auth';
import { toast } from 'sonner';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.3,
    },
  },
};

const itemVariants = {
  hidden: { y: 30, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: 'spring' as const,
      stiffness: 100,
      damping: 15,
    },
  },
};

const floatVariants = {
  animate: {
    y: [0, -8, 0],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: 'easeInOut' as const,
    },
  },
};

interface LoginCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  gradient: string;
  iconBg: string;
  onClick: () => void;
  loading?: boolean;
  delay?: number;
}

function LoginCard({
  icon,
  title,
  description,
  gradient,
  iconBg,
  onClick,
  loading,
}: LoginCardProps) {
  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ y: -6, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="group relative cursor-pointer"
      onClick={onClick}
    >
      {/* Glow effect */}
      <div
        className={`absolute -inset-0.5 rounded-2xl opacity-0 blur-lg transition-opacity duration-500 group-hover:opacity-60 ${gradient}`}
      />

      {/* Card */}
      <div className="glass-card relative flex flex-col items-center gap-4 rounded-2xl p-8 transition-all duration-300">
        {/* Icon */}
        <motion.div
          variants={floatVariants}
          animate="animate"
          className={`flex h-16 w-16 items-center justify-center rounded-2xl ${iconBg} shadow-lg`}
        >
          {icon}
        </motion.div>

        {/* Content */}
        <div className="text-center">
          <h3 className="text-lg font-bold text-foreground">{title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>

        {/* Action */}
        <Button
          className={`mt-2 w-full gap-2 ${gradient} border-0 text-white shadow-md transition-all duration-300 hover:shadow-lg`}
          disabled={loading}
        >
          {loading ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          ) : (
            <>
              Sign In
              <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </>
          )}
        </Button>
      </div>
    </motion.div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { user, loading } = useAuth();
  const [loadingRole, setLoadingRole] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user) {
      router.replace(user.role === 'principal' ? '/principal' : `/${user.role || 'teacher'}`);
    }
  }, [user, loading, router]);

  const handleGoogleLogin = async (role: 'teacher' | 'mentor') => {
    try {
      setLoadingRole(role);
      const user = await signInWithGoogle();
      
      // Create session cookie
      const success = await createSessionCookie();
      if (success) {
        toast.success(`Welcome back, ${user.displayName || 'User'}!`);
        router.push(`/${role}`);
      } else {
        toast.error('Failed to create session. Please try again.');
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      toast.error(errorMessage);
    } finally {
      setLoadingRole(null);
    }
  };

  return (
    <div className="auth-bg pattern-dots relative flex min-h-screen flex-col">
      {/* Theme Toggle */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
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

      {/* Decorative Elements */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          animate={{
            x: [0, 30, 0],
            y: [0, -20, 0],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -left-20 top-1/4 h-64 w-64 rounded-full bg-primary/5 blur-3xl"
        />
        <motion.div
          animate={{
            x: [0, -20, 0],
            y: [0, 30, 0],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -right-20 bottom-1/4 h-64 w-64 rounded-full bg-chart-2/5 blur-3xl"
        />
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 py-12">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="w-full max-w-4xl"
        >
          {/* Logo & Header */}
          <motion.div variants={itemVariants} className="mb-12 text-center">
            {/* Logo */}
            <motion.div
              className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary shadow-xl shadow-primary/25"
              whileHover={{ rotate: [0, -5, 5, 0], scale: 1.05 }}
              transition={{ duration: 0.5 }}
            >
              <GraduationCap className="h-10 w-10 text-primary-foreground" />
            </motion.div>

            {/* Brand Name */}
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              <span className="bg-gradient-to-r from-primary to-chart-5 bg-clip-text text-transparent">
                EduNexus
              </span>
            </h1>
            <p className="mt-2 text-base text-muted-foreground">
              Coaching Management Platform
            </p>

            {/* Quotes */}
            <div className="mx-auto mt-4 max-w-md space-y-1">
              <p className="text-sm italic text-muted-foreground/80">
                "No more WhatsApp groups."
              </p>
              <p className="text-sm font-medium text-primary">
                One Platform. Every Educator Connected.
              </p>
            </div>

            {/* Welcome Badge */}
            <motion.div
              variants={itemVariants}
              className="mx-auto mt-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Welcome to your Academic Hub
            </motion.div>
          </motion.div>

          {/* Login Cards Grid */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Teacher Login */}
            <LoginCard
              icon={<BookOpen className="h-8 w-8 text-white" />}
              title="Teacher Login"
              description="Access your timetable, mark attendance, and conduct quizzes"
              gradient="gradient-primary"
              iconBg="gradient-primary"
              onClick={() => handleGoogleLogin('teacher')}
              loading={loadingRole === 'teacher'}
            />

            {/* Mentor Login */}
            <LoginCard
              icon={<Users className="h-8 w-8 text-white" />}
              title="Mentor Login"
              description="Manage study hours, log sessions, and track student progress"
              gradient="gradient-success"
              iconBg="gradient-bipc"
              onClick={() => handleGoogleLogin('mentor')}
              loading={loadingRole === 'mentor'}
            />

            {/* Principal Login */}
            <LoginCard
              icon={<Shield className="h-8 w-8 text-white" />}
              title="Principal Login"
              description="Administrative dashboard with full platform control"
              gradient="gradient-warning"
              iconBg="gradient-cec"
              onClick={() => router.push('/principal-login')}
            />
          </div>

          {/* Registration Link */}
          <motion.div variants={itemVariants} className="mt-8 text-center">
            <p className="text-sm text-muted-foreground">
              New teacher or mentor?{' '}
              <button
                onClick={() => router.push('/register')}
                className="font-semibold text-primary underline-offset-4 hover:underline"
              >
                Register here
              </button>
            </p>
          </motion.div>

          {/* Stream Badges */}
          <motion.div
            variants={itemVariants}
            className="mt-8 flex flex-wrap items-center justify-center gap-3"
          >
            <div className="flex items-center gap-2 rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-600 dark:text-indigo-400">
              <span className="h-2 w-2 rounded-full bg-indigo-500" />
              MPC — IIT-JEE
            </div>
            <div className="flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              BiPC — NEET
            </div>
            <div className="flex items-center gap-2 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-600 dark:text-amber-400">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              CEC — Commerce
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="relative z-10 py-4 text-center text-xs text-muted-foreground"
      >
        © {new Date().getFullYear()} EduNexus. Secure & Reliable Education Management.
      </motion.footer>
    </div>
  );
}
