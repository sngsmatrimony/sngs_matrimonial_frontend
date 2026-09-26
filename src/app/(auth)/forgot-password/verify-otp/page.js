'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { CheckCircle, ShieldCheck, Eye, EyeOff } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toastError, toastSuccess } from '@/lib/toast';
import client from '@/lib/api/client';

const resetSchema = z.object({
  otp: z.string().length(6, 'OTP must be 6 digits'),
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ["confirmPassword"],
});

export default function VerifyOTPPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [isRedirecting, setIsRedirecting] = useState(false);
  
  // UX Enhancement: Password visibility toggles
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    const storedEmail = sessionStorage.getItem('resetEmail');
    if (!storedEmail) {
      setIsRedirecting(true);
      router.push('/forgot-password');
    } else {
      setEmail(storedEmail);
    }
  }, [router]);

  const form = useForm({
    resolver: zodResolver(resetSchema),
    defaultValues: { otp: '', newPassword: '', confirmPassword: '' },
  });

  async function onSubmit(values) {
    setIsLoading(true);

    try {
      const response = await client.post('/api/auth/forgot-password/reset', {
        email,
        otp: values.otp,
        newPassword: values.newPassword
      });

      if (response.data.success) {
        toastSuccess('Password reset successful!');
        sessionStorage.removeItem('resetEmail');
        router.push('/login');
      }
    } catch (error) {
      toastError(error.response?.data?.message || 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  }

  if (isRedirecting) {
    return null;
  }

  return (
    <Card className="border border-[#D4A843]/20 shadow-[0_4px_30px_-10px_rgba(26,26,26,0.18)] bg-white w-full max-w-md mx-auto rounded-2xl overflow-hidden py-0 gap-0">
      {/* Header aligned with Sacred Modernity styling */}
      <CardHeader className="pb-6 pt-8 px-6 sm:px-10 bg-gradient-to-br from-[#2C3E50] to-[#1A2733] relative overflow-hidden">
        {/* Subtle gold hairline at the base of the header */}
        <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#D4A843]/0 via-[#D4A843] to-[#D4A843]/0" />
        
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#F5E6C3] text-[#2C3E50] ring-1 ring-[#D4A843]/50 shrink-0">
              <CheckCircle className="w-5 h-5" strokeWidth={1.75} />
            </span>
            <div>
              <p className="font-sans text-[11px] tracking-[0.14em] uppercase text-[#D4A843] font-semibold mb-0.5">
                Verification
              </p>
              <CardTitle className="font-serif text-2xl text-white font-bold leading-tight">
                Reset Password
              </CardTitle>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 font-sans text-xs text-white/70 font-medium whitespace-nowrap">
            <ShieldCheck className="w-4 h-4 text-[#D4A843]" strokeWidth={1.75} />
            Secure
          </div>
        </div>
        <p className="font-sans text-sm text-white/70 mt-2">
          {email ? `Enter the 6-digit OTP sent to ${email}` : 'Enter the OTP sent to your email.'}
        </p>
      </CardHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="px-6 sm:px-10">
            <div className="space-y-6 py-8">
              
              <FormField
                control={form.control}
                name="otp"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-sans text-[#2C3E50] font-medium">OTP</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="000000"
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        className="font-sans h-14 rounded-xl border-[#D4A843]/40 focus-visible:ring-[#D4A843]/40 text-center text-2xl tracking-[0.5em] bg-[#F5E6C3]/10"
                        onChange={(e) => {
                          const cleaned = e.target.value.replace(/\D/g, '').slice(0, 6);
                          field.onChange(cleaned);
                        }}
                        value={field.value}
                      />
                    </FormControl>
                    <FormMessage className="font-sans text-xs font-normal text-[#B3554F] mt-1 text-center" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-sans text-[#2C3E50] font-medium">New Password</FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Input
                          {...field}
                          type={showNewPassword ? 'text' : 'password'}
                          autoComplete="new-password"
                          placeholder="••••••••"
                          className="font-sans h-12 rounded-xl border-[#D4A843]/25 pr-11 focus-visible:ring-[#D4A843]/40 focus-visible:border-[#D4A843]/50"
                        />
                      </FormControl>
                      <button
                        type="button"
                        onClick={() => setShowNewPassword((prev) => !prev)}
                        aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                        tabIndex={-1}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#2C3E50]/40 hover:text-[#B8860B] transition-colors"
                      >
                        {showNewPassword ? (
                          <EyeOff className="w-4.5 h-4.5" strokeWidth={1.75} />
                        ) : (
                          <Eye className="w-4.5 h-4.5" strokeWidth={1.75} />
                        )}
                      </button>
                    </div>
                    <FormMessage className="font-sans text-xs font-normal text-[#B3554F] mt-1" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-sans text-[#2C3E50] font-medium">Confirm Password</FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Input
                          {...field}
                          type={showConfirmPassword ? 'text' : 'password'}
                          autoComplete="new-password"
                          placeholder="••••••••"
                          className="font-sans h-12 rounded-xl border-[#D4A843]/25 pr-11 focus-visible:ring-[#D4A843]/40 focus-visible:border-[#D4A843]/50"
                        />
                      </FormControl>
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((prev) => !prev)}
                        aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                        tabIndex={-1}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#2C3E50]/40 hover:text-[#B8860B] transition-colors"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="w-4.5 h-4.5" strokeWidth={1.75} />
                        ) : (
                          <Eye className="w-4.5 h-4.5" strokeWidth={1.75} />
                        )}
                      </button>
                    </div>
                    <FormMessage className="font-sans text-xs font-normal text-[#B3554F] mt-1" />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>

          {/* Bottom Action Section */}
          <div className="flex flex-col gap-4 px-6 sm:px-10 py-6 border-t border-[#D4A843]/20 bg-[#F5E6C3]/25">
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#D4A843] hover:bg-[#B8860B] text-[#1A1A1A] font-sans font-semibold h-12 rounded-xl shadow-sm disabled:opacity-50 transition-all duration-200"
            >
              {isLoading ? 'Resetting Password...' : 'Reset Password'}
            </Button>
          </div>
        </form>
      </Form>
    </Card>
  );
}