'use client';

import React, { useState } from 'react';
import { Mail, Plus, X, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface AdditionalEmail {
  email: string;
  password: string;
  saving: boolean;
  done: boolean;
}

interface EmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentEmail?: string;
  userId?: string;
  role?: string;
}

export function EmailDialog({ open, onOpenChange, currentEmail, userId, role }: EmailDialogProps) {
  const [primaryEmail, setPrimaryEmail] = useState(currentEmail || '');
  const [additional, setAdditional] = useState<AdditionalEmail[]>([{ email: '', password: '', saving: false, done: false }]);
  const [showPasswords, setShowPasswords] = useState<Record<number, boolean>>({});

  const addEmail = () => setAdditional(prev => [...prev, { email: '', password: '', saving: false, done: false }]);

  const removeEmail = (index: number) => {
    setAdditional(prev => prev.filter((_, i) => i !== index));
    setShowPasswords(prev => {
      const next = { ...prev };
      delete next[index];
      return next;
    });
  };

  const updateEmail = (index: number, value: string) => {
    setAdditional(prev => prev.map((n, i) => i === index ? { ...n, email: value } : n));
  };

  const updatePassword = (index: number, value: string) => {
    setAdditional(prev => prev.map((n, i) => i === index ? { ...n, password: value } : n));
  };

  const toggleShow = (index: number) => {
    setShowPasswords(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const handleSave = async () => {
    if (!primaryEmail) { toast.error('Primary email is required'); return; }

    const newEmails = additional.filter(a => a.email && a.password);
    const validNew = newEmails.every(a => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(a.email));
    if (!validNew) { toast.error('Please enter valid email addresses'); return; }

    for (const item of newEmails) {
      if (item.password.length < 6) {
        toast.error(`Password for ${item.email} must be at least 6 characters`);
        return;
      }
    }

    if (newEmails.length === 0) {
      toast.success('Email addresses updated');
      onOpenChange(false);
      return;
    }

    let allSuccess = true;
    for (const item of newEmails) {
      setAdditional(prev => prev.map((n, i) => n.email === item.email ? { ...n, saving: true } : n));

      try {
        const res = await fetch('/api/auth/add-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, email: item.email, password: item.password, role }),
        });

        const data = await res.json();

        if (!res.ok) {
          toast.error(data.error || `Failed to register ${item.email}`);
          allSuccess = false;
          setAdditional(prev => prev.map((n, i) => n.email === item.email ? { ...n, saving: false } : n));
        } else {
          setAdditional(prev => prev.map((n, i) => n.email === item.email ? { ...n, saving: false, done: true } : n));
        }
      } catch {
        toast.error(`Network error registering ${item.email}`);
        allSuccess = false;
        setAdditional(prev => prev.map((n, i) => n.email === item.email ? { ...n, saving: false } : n));
      }
    }

    if (allSuccess) {
      toast.success('All emails registered! You can now login with them.');
      setTimeout(() => onOpenChange(false), 1000);
    }
  };

  const allDone = additional.every(a => !a.email || a.done);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-primary" />
            {currentEmail ? 'Edit Email' : 'Add Email'}
          </DialogTitle>
          <DialogDescription>Manage your email addresses. Set a password for each new email to enable login.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
          <div className="space-y-2">
            <Label className="text-xs">Primary Email</Label>
            <Input
              value={primaryEmail}
              onChange={e => setPrimaryEmail(e.target.value)}
              placeholder="teacher@collegedost.com"
              className="rounded-xl bg-background/50 h-10"
              disabled
            />
            <p className="text-[10px] text-muted-foreground">Primary email cannot be changed here</p>
          </div>

          <div className="border-t border-border/50 pt-4">
            <p className="text-xs font-semibold text-muted-foreground mb-3">Add Login Emails</p>

            {additional.map((item, i) => (
              <div key={i} className="mb-3 rounded-xl border border-border/50 p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium">Email {i + 1}</Label>
                  <button
                    type="button"
                    onClick={() => removeEmail(i)}
                    className="text-muted-foreground hover:text-destructive"
                    disabled={item.saving}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <Input
                  value={item.email}
                  onChange={e => updateEmail(i, e.target.value)}
                  placeholder="newemail@example.com"
                  className="rounded-xl bg-background/50 h-10"
                  disabled={item.saving}
                />

                <div className="space-y-1">
                  <Label className="text-xs">Password</Label>
                  <div className="relative">
                    <Input
                      type={showPasswords[i] ? 'text' : 'password'}
                      value={item.password}
                      onChange={e => updatePassword(i, e.target.value)}
                      placeholder="Min 6 characters"
                      className="rounded-xl bg-background/50 h-10 pr-10"
                      disabled={item.saving || item.done}
                    />
                    <button
                      type="button"
                      onClick={() => toggleShow(i)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPasswords[i] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {item.saving && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <div className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    Registering...
                  </div>
                )}

                {item.done && (
                  <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 p-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                    <p className="text-xs text-emerald-600">Registered — you can now login with this email</p>
                  </div>
                )}
              </div>
            ))}

            {!allDone && (
              <Button
                variant="outline"
                size="sm"
                onClick={addEmail}
                className="w-full gap-2 rounded-xl"
              >
                <Plus className="h-4 w-4" />
                Add Another Email
              </Button>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl">Cancel</Button>
          <Button onClick={handleSave} disabled={!allDone && additional.some(a => a.saving)} className="rounded-xl gradient-primary border-0 text-white">
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
