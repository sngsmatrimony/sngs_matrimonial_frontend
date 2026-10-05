'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { client } from '@/lib/api/client';
import { toastSuccess, toastError } from '@/lib/toast';

const EMAIL_REGEX = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;

/**
 * Self-contained email-change flow: new address -> OTP sent to that address
 * to prove ownership -> applied on verify. Deliberately decoupled from the
 * rest of EditProfileForm's multi-step wizard and its own Save button — the
 * change takes effect the moment the OTP is verified, not when the wizard's
 * other fields are eventually saved.
 */
export default function EmailChangeDialog({ open, onOpenChange, currentEmail, onEmailChanged }) {
  const [step, setStep] = useState('input'); // 'input' | 'otp'
  const [newEmail, setNewEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Reset to a clean slate every time the dialog is reopened
  useEffect(() => {
    if (open) {
      setStep('input');
      setNewEmail('');
      setOtp('');
      setError('');
    }
  }, [open]);

  const handleSendOtp = async () => {
    setError('');
    const trimmed = newEmail.trim().toLowerCase();
    if (!EMAIL_REGEX.test(trimmed)) {
      setError('Please enter a valid email address');
      return;
    }
    if (trimmed === currentEmail?.toLowerCase()) {
      setError('This is already your current email address');
      return;
    }

    setIsLoading(true);
    try {
      await client.post('/api/profiles/change-email/request-otp', { newEmail: trimmed });
      toastSuccess('Verification code sent to your new email address');
      setStep('otp');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send verification code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setError('');
    if (otp.trim().length !== 6) {
      setError('Please enter the 6-digit code');
      return;
    }

    setIsLoading(true);
    try {
      const response = await client.post('/api/profiles/change-email/verify-otp', { otp: otp.trim() });
      toastSuccess(
        response.data.resubmittedForApproval
          ? 'Email updated. Your profile has been sent for re-approval.'
          : 'Email updated successfully.'
      );
      await onEmailChanged?.();
      onOpenChange(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to verify code');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-serif">Change Email Address</DialogTitle>
          <DialogDescription className="font-sans">
            {step === 'input'
              ? "We'll send a verification code to your new address to confirm it's really you. Once verified, your profile will be sent for re-approval — until then, it will be restricted the same way it was before your very first approval."
              : `Enter the 6-digit code we sent to ${newEmail}.`}
          </DialogDescription>
        </DialogHeader>

        <div className="py-2 space-y-4">
          {error && (
            <div className="bg-destructive/10 border border-destructive/30 text-destructive px-3 py-2 rounded-lg text-sm font-sans">
              {error}
            </div>
          )}

          {step === 'input' ? (
            <div>
              <label className="block text-sm font-medium font-sans text-[#2C3E50] mb-2">New Email Address</label>
              <Input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="you@example.com"
                className="font-sans"
                disabled={isLoading}
              />
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium font-sans text-[#2C3E50] mb-2">Verification Code</label>
              <Input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                className="font-sans tracking-[0.3em] text-center text-lg"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setStep('input')}
                disabled={isLoading}
                className="mt-2 text-xs font-sans text-[#D4A843] hover:text-[#B8860B] underline"
              >
                Use a different email address
              </button>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={step === 'input' ? handleSendOtp : handleVerifyOtp}
            disabled={isLoading}
            className="bg-[#D4A843] hover:bg-[#B8860B] text-[#1A1A1A]"
          >
            {isLoading ? 'Please wait...' : step === 'input' ? 'Send Verification Code' : 'Verify & Change Email'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
