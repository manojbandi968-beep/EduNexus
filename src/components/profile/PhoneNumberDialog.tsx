'use client';

import React, { useState } from 'react';
import { Phone, Plus, X } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface PhoneNumberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentNumber?: string;
}

export function PhoneNumberDialog({ open, onOpenChange, currentNumber }: PhoneNumberDialogProps) {
  const [primaryNumber, setPrimaryNumber] = useState(currentNumber || '');
  const [additionalNumbers, setAdditionalNumbers] = useState<string[]>(['']);

  const addNumber = () => setAdditionalNumbers(prev => [...prev, '']);
  const removeNumber = (index: number) => setAdditionalNumbers(prev => prev.filter((_, i) => i !== index));
  const updateAdditional = (index: number, value: string) => {
    setAdditionalNumbers(prev => prev.map((n, i) => i === index ? value : n));
  };

  const handleSave = () => {
    if (!primaryNumber) { toast.error('Primary phone number is required'); return; }
    const allNumbers = [primaryNumber, ...additionalNumbers.filter(Boolean)];
    const valid = allNumbers.every(n => /^\+?[\d\s-]{8,15}$/.test(n));
    if (!valid) { toast.error('Please enter valid phone numbers'); return; }
    toast.success('Phone numbers updated successfully');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-primary" />
            {currentNumber ? 'Edit Phone Number' : 'Add Phone Number'}
          </DialogTitle>
          <DialogDescription>Manage your contact numbers</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs">Primary Number *</Label>
            <Input
              value={primaryNumber}
              onChange={e => setPrimaryNumber(e.target.value)}
              placeholder="+91 9876543210"
              className="rounded-xl bg-background/50 h-10"
            />
          </div>

          {additionalNumbers.map((num, i) => (
            <div key={i} className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Additional Number {i + 1}</Label>
                <button
                  type="button"
                  onClick={() => removeNumber(i)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <Input
                value={num}
                onChange={e => updateAdditional(i, e.target.value)}
                placeholder="+91 9876543211"
                className="rounded-xl bg-background/50 h-10"
              />
            </div>
          ))}

          <Button
            variant="outline"
            size="sm"
            onClick={addNumber}
            className="w-full gap-2 rounded-xl"
          >
            <Plus className="h-4 w-4" />
            Add Another Number
          </Button>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl">Cancel</Button>
          <Button onClick={handleSave} className="rounded-xl gradient-primary border-0 text-white">Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
