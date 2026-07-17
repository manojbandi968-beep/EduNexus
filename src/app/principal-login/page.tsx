'use client';

// ============================================
// CollegeDost — Principal Login Page
// ============================================

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useAuth } from '@/contexts/AuthContext';
import { Shield, Eye, EyeOff, Lock, Mail, KeyRound, ArrowLeft, Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { principalLoginSchema, type PrincipalLoginInput } from '@/lib/validations';
import { toast } from 'sonner';
import { signInWithGoogle, createSessionCookie } from '@/lib/firebase/auth';

export default function PrincipalLoginPage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { user, loading: authLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      router.replace('/principal');
    }
  }, [user, authLoading, router]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PrincipalLoginInput>({
    resolver: zodResolver(principalLoginSchema),
  });

  const onSubmit = async (data: PrincipalLoginInput) => {
    try {
      setLoading(true);

      const response = await fetch('/api/auth/principal-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          securityPin: data.securityPin,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast.success('Welcome, Principal!');
        router.push('/principal');
      } else {
        toast.error(result.error || 'Invalid credentials. This attempt has been logged.');
      }
    } catch {
      toast.error('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      const user = await signInWithGoogle();
      
      const success = await createSessionCookie();
      if (success) {
        toast.success(`Welcome back, ${user.displayName || 'Principal'}!`);
        router.push('/principal');
      } else {
        toast.error('Failed to create session. Please try again.');
      }
    } catch (error) {
      console.error(error);
      const msg = error instanceof Error ? error.message : 'Google Login failed.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-bg pattern-dots relative flex min-h-screen items-center justify-center px-4 py-12">
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
          Back
        </Button>
      </motion.div>

      {/* Decorative Blurs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          animate={{ x: [0, 20, 0], y: [0, -15, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -right-20 top-1/3 h-72 w-72 rounded-full bg-amber-500/10 blur-3xl"
        />
        <motion.div
          animate={{ x: [0, -15, 0], y: [0, 20, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -left-20 bottom-1/3 h-72 w-72 rounded-full bg-primary/10 blur-3xl"
        />
      </div>

      {/* Login Card */}
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 100, damping: 15 }}
        className="w-full max-w-lg"
      >
        <Card className="glass-card border-0 shadow-2xl">
          <CardHeader className="text-center">
            {/* Shield Icon */}
            <motion.div
              className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl gradient-cec shadow-lg shadow-amber-500/25"
              whileHover={{ rotate: [0, -5, 5, 0] }}
              transition={{ duration: 0.5 }}
            >
              <Shield className="h-8 w-8 text-white" />
            </motion.div>

            <CardTitle className="text-2xl font-bold">Principal Login</CardTitle>
            <CardDescription className="text-muted-foreground">
              Restricted access — All login attempts are monitored and logged
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2 text-sm font-medium">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="principal@college.edu"
                  {...register('email')}
                  className="h-11 rounded-xl bg-background/50"
                />
                {errors.email && (
                  <p className="text-xs text-destructive">{errors.email.message}</p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password" className="flex items-center gap-2 text-sm font-medium">
                  <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    {...register('password')}
                    className="h-11 rounded-xl bg-background/50 pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1 h-9 w-9 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                {errors.password && (
                  <p className="text-xs text-destructive">{errors.password.message}</p>
                )}
              </div>

              {/* Security PIN */}
              <div className="space-y-2">
                <Label
                  htmlFor="securityPin"
                  className="flex items-center gap-2 text-sm font-medium"
                >
                  <KeyRound className="h-3.5 w-3.5 text-muted-foreground" />
                  Security PIN
                </Label>
                <div className="relative">
                  <Input
                    id="securityPin"
                    type={showPin ? 'text' : 'password'}
                    placeholder="6-digit PIN"
                    maxLength={6}
                    {...register('securityPin')}
                    className="h-11 rounded-xl bg-background/50 pr-10 tracking-widest"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1 h-9 w-9 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPin(!showPin)}
                  >
                    {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                {errors.securityPin && (
                  <p className="text-xs text-destructive">{errors.securityPin.message}</p>
                )}
              </div>

              {/* Submit */}
              <Button
                type="submit"
                disabled={loading}
                className="h-12 w-full rounded-xl gradient-cec border-0 text-white shadow-lg shadow-amber-500/20 transition-all hover:shadow-xl"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Verifying...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Secure Login
                  </div>
                )}
              </Button>
            </form>

            <div className="mt-6 flex items-center justify-center gap-4">
              <div className="h-px bg-border flex-1" />
              <span className="text-xs text-muted-foreground">OR</span>
              <div className="h-px bg-border flex-1" />
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={handleGoogleLogin}
              className="mt-6 h-12 w-full rounded-xl border-border/50 bg-background/50 hover:bg-accent/50"
              disabled={loading}
            >
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              Login with Google
            </Button>

            {/* Security Notice */}
            <div className="mt-6 rounded-xl bg-destructive/5 p-3 text-center">
              <p className="text-xs text-muted-foreground">
                🔒 This login is monitored. Unauthorized access attempts are logged with IP,
                device, and timestamp information.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
