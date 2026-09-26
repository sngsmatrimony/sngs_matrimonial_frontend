'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Mail, KeyRound, ChevronLeft, ShieldCheck } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toastError, toastSuccess } from '@/lib/toast';
import client from '@/lib/api/client';

const emailSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: '' },
  });

  async function onSubmit(values) {
    setIsLoading(true);

    try {
      const response = await client.post('/api/auth/forgot-password/send-otp', values);

      if (response.data.success) {
        toastSuccess('OTP sent to your email address');
        // Store email in sessionStorage for next step
        sessionStorage.setItem('resetEmail', values.email);
        router.push('/forgot-password/verify-otp');
      }
    } catch (error) {
      toastError(error.response?.data?.message || 'Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="border border-[#D4A843]/20 shadow-[0_4px_30px_-10px_rgba(26,26,26,0.18)] bg-white w-full max-w-md mx-auto rounded-2xl overflow-hidden py-0 gap-0">
      {/* Header matching Register & Login "Sacred Modernity" style */}
      <CardHeader className="pb-6 pt-8 px-6 sm:px-10 bg-gradient-to-br from-[#2C3E50] to-[#1A2733] relative overflow-hidden">
        {/* Subtle gold hairline at the base of the header */}
        <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#D4A843]/0 via-[#D4A843] to-[#D4A843]/0" />
        
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#F5E6C3] text-[#2C3E50] ring-1 ring-[#D4A843]/50 shrink-0">
              <KeyRound className="w-5 h-5" strokeWidth={1.75} />
            </span>
            <div>
              <p className="font-sans text-[11px] tracking-[0.14em] uppercase text-[#D4A843] font-semibold mb-0.5">
                Account Recovery
              </p>
              <CardTitle className="font-serif text-2xl text-white font-bold leading-tight">
                Forgot Password
              </CardTitle>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 font-sans text-xs text-white/70 font-medium whitespace-nowrap">
            <ShieldCheck className="w-4 h-4 text-[#D4A843]" strokeWidth={1.75} />
            Secure
          </div>
        </div>
        <p className="font-sans text-sm text-white/70 mt-2">
          Enter your registered email address, and we&apos;ll send you an OTP to reset your password.
        </p>
      </CardHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="px-6 sm:px-10">
            <div className="space-y-6 py-8">
              {/* Email Field with Left Icon */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-sans text-[#2C3E50] font-medium">Email Address</FormLabel>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#2C3E50]/40" strokeWidth={1.75} />
                      <FormControl>
                        <Input
                          {...field}
                          type="email"
                          autoComplete="username"
                          placeholder="your@email.com"
                          className="font-sans pl-10 h-12 rounded-xl border-[#D4A843]/25 focus-visible:ring-[#D4A843]/40 focus-visible:border-[#D4A843]/50"
                          suppressHydrationWarning
                        />
                      </FormControl>
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
              {isLoading ? 'Sending OTP...' : 'Send OTP'}
            </Button>

            <Link
              href="/login"
              className="flex items-center justify-center gap-2 font-sans text-sm text-[#2C3E50] hover:text-[#B8860B] font-medium transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to Login
            </Link>
          </div>
        </form>
      </Form>
    </Card>
  );
}