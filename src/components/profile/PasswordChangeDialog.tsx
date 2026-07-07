'use client';

import React, { useState } from 'react';
import { KeyRound, Eye, EyeOff, CheckCircle2, ArrowLeft, Mail, Phone, Send, ShieldCheck } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

type Step = 'form' | 'forgot' | 'otp' | 'reset';

interface PasswordChangeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PasswordChangeDialog({ open, onOpenChange }: PasswordChangeDialogProps) {
  const [step, setStep] = useState<Step>('form');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [verifyMethod, setVerifyMethod] = useState<'email' | 'phone'>('email');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);

  const handleClose = () => {
    setStep('form');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setOtp('');
    setOtpSent(false);
    setOtpVerified(false);
    setVerifyMethod('email');
    onOpenChange(false);
  };

  const handleSave = () => {
    if (!currentPassword) { toast.error('Please enter current password'); return; }
    if (!newPassword || newPassword.length < 6) { toast.error('New password must be at least 6 characters'); return; }
    if (newPassword !== confirmPassword) { toast.error('Passwords do not match'); return; }
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast.success('Password changed successfully');
      handleClose();
    }, 800);
  };

  const handleSendOtp = () => {
    const target = verifyMethod === 'email' ? 'teacher@collegedost.com' : '+91 9876543210';
    toast.success(`OTP sent to ${target}`);
    setOtpSent(true);
    setStep('otp');
  };

  const handleVerifyOtp = () => {
    if (!otp || otp.length < 4) { toast.error('Please enter a valid OTP'); return; }
    setOtpVerified(true);
    toast.success('Verified successfully');
    setStep('reset');
  };

  const handleResetPassword = () => {
    if (!newPassword || newPassword.length < 6) { toast.error('New password must be at least 6 characters'); return; }
    if (newPassword !== confirmPassword) { toast.error('Passwords do not match'); return; }
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast.success('Password reset successfully');
      handleClose();
    }, 800);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {step !== 'form' && (
              <button
                type="button"
                onClick={() => step === 'reset' ? setStep('otp') : setStep('form')}
                className="text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            )}
            <KeyRound className="h-4 w-4 text-primary" />
            {step === 'form' ? 'Change Password' : step === 'forgot' ? 'Forgot Password' : step === 'otp' ? 'Verify Identity' : 'Reset Password'}
          </DialogTitle>
          <DialogDescription>
            {step === 'form' && 'Update your account password'}
            {step === 'forgot' && 'Choose how to verify your identity'}
            {step === 'otp' && `Enter the OTP sent to your ${verifyMethod === 'email' ? 'email' : 'phone'}`}
            {step === 'reset' && 'Create a new password for your account'}
          </DialogDescription>
        </DialogHeader>

        {/* Step: Normal password change form */}
        {step === 'form' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs">Current Password</Label>
              <div className="relative">
                <Input
                  type={showCurrent ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="rounded-xl bg-background/50 h-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <button
                type="button"
                onClick={() => setStep('forgot')}
                className="text-xs text-primary hover:underline mt-1 cursor-pointer"
              >
                Forgot password?
              </button>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">New Password</Label>
              <div className="relative">
                <Input
                  type={showNew ? 'text' : 'password'}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="rounded-xl bg-background/50 h-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Confirm New Password</Label>
              <div className="relative">
                <Input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="rounded-xl bg-background/50 h-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {newPassword && confirmPassword && newPassword !== confirmPassword && (
              <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3">
                <p className="text-xs text-destructive">Passwords do not match</p>
              </div>
            )}

            {newPassword && newPassword.length >= 6 && confirmPassword === newPassword && (
              <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 p-3">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <p className="text-xs text-emerald-600">Passwords match</p>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={handleClose} className="rounded-xl">Cancel</Button>
              <Button onClick={handleSave} disabled={saving} className="rounded-xl gradient-primary border-0 text-white">
                {saving ? 'Saving...' : 'Change Password'}
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* Step: Forgot password - Choose verification method */}
        {step === 'forgot' && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              We'll send a verification code to your registered email or phone number.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setVerifyMethod('email')}
                className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-colors cursor-pointer ${
                  verifyMethod === 'email' ? 'border-primary bg-primary/5' : 'border-border/50 hover:border-primary/30'
                }`}
              >
                <Mail className={`h-6 w-6 ${verifyMethod === 'email' ? 'text-primary' : 'text-muted-foreground'}`} />
                <span className={`text-xs font-semibold ${verifyMethod === 'email' ? 'text-primary' : 'text-muted-foreground'}`}>Email</span>
                <span className="text-[10px] text-muted-foreground text-center">teacher@collegedost.com</span>
              </button>
              <button
                type="button"
                onClick={() => setVerifyMethod('phone')}
                className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-colors cursor-pointer ${
                  verifyMethod === 'phone' ? 'border-primary bg-primary/5' : 'border-border/50 hover:border-primary/30'
                }`}
              >
                <Phone className={`h-6 w-6 ${verifyMethod === 'phone' ? 'text-primary' : 'text-muted-foreground'}`} />
                <span className={`text-xs font-semibold ${verifyMethod === 'phone' ? 'text-primary' : 'text-muted-foreground'}`}>Phone</span>
                <span className="text-[10px] text-muted-foreground text-center">+91 9876543210</span>
              </button>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setStep('form')} className="rounded-xl">Back</Button>
              <Button onClick={handleSendOtp} className="rounded-xl gap-2 gradient-primary border-0 text-white">
                <Send className="h-4 w-4" />
                Send OTP
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* Step: OTP verification */}
        {step === 'otp' && (
          <div className="space-y-4">
            <div className="flex items-center justify-center py-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <ShieldCheck className="h-8 w-8 text-primary" />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Enter OTP</Label>
              <Input
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="Enter 6-digit OTP"
                className="rounded-xl bg-background/50 h-12 text-center text-lg tracking-[8px]"
                maxLength={6}
              />
              <p className="text-xs text-muted-foreground text-center">
                OTP sent to {verifyMethod === 'email' ? 'teacher@collegedost.com' : '+91 9876543210'}
              </p>
            </div>

            <div className="flex justify-center">
              <button
                type="button"
                onClick={handleSendOtp}
                className="text-xs text-primary hover:underline cursor-pointer"
              >
                Resend OTP
              </button>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setStep('forgot')} className="rounded-xl">Back</Button>
              <Button onClick={handleVerifyOtp} className="rounded-xl gradient-primary border-0 text-white">
                Verify
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* Step: Reset password after verification */}
        {step === 'reset' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 p-3">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              <p className="text-xs text-emerald-600">Identity verified — you can now set a new password</p>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">New Password</Label>
              <div className="relative">
                <Input
                  type={showNew ? 'text' : 'password'}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="rounded-xl bg-background/50 h-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Confirm New Password</Label>
              <div className="relative">
                <Input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="rounded-xl bg-background/50 h-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {newPassword && confirmPassword && newPassword !== confirmPassword && (
              <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3">
                <p className="text-xs text-destructive">Passwords do not match</p>
              </div>
            )}

            {newPassword && newPassword.length >= 6 && confirmPassword === newPassword && (
              <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 p-3">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <p className="text-xs text-emerald-600">Passwords match</p>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={handleClose} className="rounded-xl">Cancel</Button>
              <Button onClick={handleResetPassword} disabled={saving} className="rounded-xl gradient-primary border-0 text-white">
                {saving ? 'Resetting...' : 'Reset Password'}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
