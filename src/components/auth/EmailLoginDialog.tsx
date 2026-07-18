'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Mail, Lock, LogIn } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { signInWithEmail, createSessionCookie } from '@/lib/firebase/auth';

interface EmailLoginDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expectedRole: 'teacher' | 'mentor';
}

export function EmailLoginDialog({ open, onOpenChange, expectedRole }: EmailLoginDialogProps) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter both email and password');
      return;
    }

    try {
      setLoading(true);
      const user = await signInWithEmail(email, password);
      
      const success = await createSessionCookie(rememberMe);
      if (success) {
        toast.success(`Welcome back, ${user.displayName || 'User'}!`);
        onOpenChange(false);
        router.push(`/${expectedRole}`);
      } else {
        toast.error('Failed to create session. Please try again.');
      }
    } catch (error) {
      console.error(error);
      const msg = error instanceof Error ? error.message : 'Login failed. Check your credentials.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LogIn className="h-5 w-5 text-primary" />
            {expectedRole === 'teacher' ? 'Teacher Login' : 'Mentor Login'}
          </DialogTitle>
          <DialogDescription>
            Enter your email and password to access your dashboard
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleLogin} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label className="text-xs flex items-center gap-2">
              <Mail className="h-3.5 w-3.5" /> Email
            </Label>
            <Input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="rounded-xl bg-background/50 h-11"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs flex items-center gap-2">
              <Lock className="h-3.5 w-3.5" /> Password
            </Label>
            <Input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="rounded-xl bg-background/50 h-11"
              disabled={loading}
            />
          </div>

          <div className="flex items-center space-x-2 pt-1">
            <input
              type="checkbox"
              id="dialogRememberMe"
              checked={rememberMe}
              onChange={e => setRememberMe(e.target.checked)}
              className="h-4 w-4 rounded border-input bg-transparent text-primary focus:ring-primary"
            />
            <Label
              htmlFor="dialogRememberMe"
              className="text-xs font-medium leading-none"
            >
              Remember me
            </Label>
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !email || !password}
              className="rounded-xl gap-2 gradient-primary border-0 text-white shadow-lg shadow-primary/20"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
              Sign In
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
