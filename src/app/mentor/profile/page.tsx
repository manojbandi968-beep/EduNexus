'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { User, Mail, Phone, Users, KeyRound, Pencil, Check, X } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { PasswordChangeDialog } from '@/components/profile/PasswordChangeDialog';
import { PhoneNumberDialog } from '@/components/profile/PhoneNumberDialog';
import { EmailDialog } from '@/components/profile/EmailDialog';
import { toast } from 'sonner';

export default function MentorProfilePage() {
  const { user: authUser, updateUserDisplayName } = useAuth();
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [phoneDialogOpen, setPhoneDialogOpen] = useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const phoneNumber = authUser?.phone || '+91 98765 43210';
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const email = authUser?.email || '';
  const displayName = authUser?.displayName || 'Mentor';
  const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const handleSaveName = async () => {
    const trimmed = nameInput.trim();
    if (!trimmed) {
      toast.error('Name cannot be empty');
      return;
    }
    try {
      await updateUserDisplayName(trimmed);
      setEditingName(false);
      toast.success('Name updated successfully');
    } catch {
      toast.error('Failed to update name');
    }
  };

  const handleStartEdit = () => {
    setNameInput(displayName);
    setEditingName(true);
  };

  return (
    <DashboardLayout role="mentor">
      <div className="flex flex-col gap-6">
        <PageHeader
          title="My Profile"
          description="Manage your account details and preferences"
        />

        <div className="grid gap-6 md:grid-cols-2">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 20 }}>
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  Personal Information
                </CardTitle>
                <CardDescription>Your basic profile details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4 rounded-xl bg-muted/50 p-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/20 text-xl font-bold text-primary">
                    {initials}
                  </div>
                  <div className="flex-1">
                    {editingName ? (
                      <div className="flex items-center gap-2">
                        <Input
                          value={nameInput}
                          onChange={e => setNameInput(e.target.value)}
                          className="h-8 rounded-lg text-sm"
                          autoFocus
                          onKeyDown={e => { if (e.key === 'Enter') handleSaveName(); if (e.key === 'Escape') setEditingName(false); }}
                        />
                        <button onClick={handleSaveName} className="text-emerald-500 hover:text-emerald-600"><Check className="h-4 w-4" /></button>
                        <button onClick={() => setEditingName(false)} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{displayName}</p>
                        <button onClick={handleStartEdit} className="text-muted-foreground hover:text-foreground"><Pencil className="h-3.5 w-3.5" /></button>
                      </div>
                    )}
                    <p className="text-sm text-muted-foreground capitalize">Mentor Role</p>
                  </div>
                </div>

                <div className="grid gap-2">
                  <button
                    onClick={() => setEmailDialogOpen(true)}
                    className="flex w-full items-center gap-3 rounded-lg border border-border/50 bg-background/50 p-3 text-left hover:bg-muted/50 transition-colors"
                  >
                    <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">Email Address</p>
                      <p className="text-sm font-medium">{email}</p>
                    </div>
                    <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>

                  <button
                    onClick={() => setPhoneDialogOpen(true)}
                    className="flex w-full items-center gap-3 rounded-lg border border-border/50 bg-background/50 p-3 text-left hover:bg-muted/50 transition-colors"
                  >
                    <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">Phone Number</p>
                      <p className="text-sm font-medium">{phoneNumber}</p>
                    </div>
                    <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>

                  <div className="flex items-center gap-3 rounded-lg border border-border/50 bg-background/50 p-3">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Assigned Students</p>
                      <p className="text-sm font-medium">24 Students</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 20 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <KeyRound className="h-5 w-5 text-primary" />
                  Account Security
                </CardTitle>
                <CardDescription>Manage your authentication methods</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border border-border/50 bg-background/50 p-4">
                  <div className="flex items-center gap-3">
                    <KeyRound className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Account Password</p>
                      <p className="text-xs text-muted-foreground">Last updated recently</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setPasswordDialogOpen(true)}
                    className="text-xs font-semibold text-primary hover:underline cursor-pointer"
                  >
                    Change
                  </button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      <PasswordChangeDialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen} userEmail={email} userPhone={phoneNumber} />
      <PhoneNumberDialog open={phoneDialogOpen} onOpenChange={setPhoneDialogOpen} currentNumber={phoneNumber} />
      <EmailDialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen} currentEmail={email} userId={authUser?.uid} role={authUser?.role} />
    </DashboardLayout>
  );
}
