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
