'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { User, Mail, Shield, KeyRound, Phone, Pencil } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { PasswordChangeDialog } from '@/components/profile/PasswordChangeDialog';
import { PhoneNumberDialog } from '@/components/profile/PhoneNumberDialog';
import { EmailDialog } from '@/components/profile/EmailDialog';

export default function PrincipalProfilePage() {
  const { user: authUser } = useAuth();
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [phoneDialogOpen, setPhoneDialogOpen] = useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('principal@collegedost.com');

  return (
    <DashboardLayout role="principal">
      <div className="flex flex-col gap-6">
      <PageHeader
        title="My Profile"
        description="Manage your account details and security settings"
      />

      <div className="grid gap-6 md:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
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
                  PR
                </div>
                <div>
                  <p className="font-medium">Principal</p>
                  <p className="text-sm text-muted-foreground capitalize">Administrator Role</p>
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
                    <p className="text-sm font-medium">{phoneNumber || 'Not added yet'}</p>
                  </div>
                  <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Security
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

              <div className="flex items-center justify-between rounded-lg border border-border/50 bg-background/50 p-4">
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Security PIN</p>
                    <p className="text-xs text-muted-foreground">Used for sensitive actions</p>
                  </div>
                </div>
                <button className="text-xs font-semibold text-primary hover:underline cursor-pointer">
                  Change
                </button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>

      <PasswordChangeDialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen} />
      <PhoneNumberDialog open={phoneDialogOpen} onOpenChange={setPhoneDialogOpen} currentNumber={phoneNumber} />
      <EmailDialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen} currentEmail={email} userId={authUser?.uid} role={authUser?.role} />
    </DashboardLayout>
  );
}
