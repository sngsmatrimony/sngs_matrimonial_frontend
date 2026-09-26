'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image'; // Added Next.js Image component
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import {
  LogIn,
  Mail,
  Eye,
  EyeOff,
  ShieldCheck,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { FormAlert } from '@/components/ui/form-alert';
import { useAuthStore } from '@/store/authStore';
import { toastError, toastSuccess } from '@/lib/toast';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const form = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit(values) {
    setIsLoading(true);
    setError('');

    const result = await login(values.email, values.password);

    if (result.success) {
      toastSuccess('Sign in successful! Redirecting...');
      router.push('/');
    } else {
      const errMessage = result.error || 'Sign in failed. Please check your credentials.';
      setError(errMessage);
      toastError(errMessage);
    }

    setIsLoading(false);
  }

  return (
    <>
      {/* 1. FIXED BACKGROUND CONTAINER (behind everything, including portaled dropdowns) */}
      {/* This breaks out of layout padding and stays securely visible above the body tag */}
      <div className="fixed inset-0 w-full h-full -z-10 pointer-events-none">
        <Image
  src="/images/reception.png"
  alt="SNGS Matrimonial Login Background"
  fill
  priority
  sizes="100vw"
  quality={90}
  className="object-cover"
/>
        {/* Charcoal overlay with blur applied directly over the image[cite: 10] */}
        <div className="absolute inset-0 bg-[#1A1A1A]/50" />
      </div>
      
      {/* 2. CONTENT WRAPPER (z-10) */}
      {/* Keeps the card centered and floating above the fixed background */}
      <div className="relative z-10 flex items-center justify-center min-h-screen w-full p-4">
        <div className="w-full max-w-md">
          <Card className="border border-[#D4A843]/20 shadow-2xl bg-white w-full rounded-2xl overflow-hidden py-0 gap-0">
            
            {/* Header aligned with Sacred Modernity styling[cite: 10] */}
            <CardHeader className="pb-6 pt-8 px-6 sm:px-10 bg-gradient-to-br from-[#2C3E50] to-[#1A2733] relative overflow-hidden">
              <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#D4A843]/0 via-[#D4A843] to-[#D4A843]/0" />
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#F5E6C3] text-[#2C3E50] ring-1 ring-[#D4A843]/50 shrink-0">
                    <LogIn className="w-5 h-5" strokeWidth={1.75} />
                  </span>
                  <div>
                    <p className="font-sans text-[11px] tracking-[0.14em] uppercase text-[#D4A843] font-semibold mb-0.5">
                      Welcome Back
                    </p>
                    <CardTitle className="font-serif text-2xl text-white font-bold leading-tight">
                      Sign In
                    </CardTitle>
                  </div>
                </div>
                <div className="hidden sm:flex items-center gap-1.5 font-sans text-xs text-white/70 font-medium whitespace-nowrap">
                  <ShieldCheck className="w-4 h-4 text-[#D4A843]" strokeWidth={1.75} />
                  100% Verified
                </div>
              </div>
            </CardHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <CardContent className="px-6 sm:px-10">
                  <div className="space-y-6 py-8">
                    <FormAlert message={error} onDismiss={() => setError('')} />

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-sans text-[#1A1A1A] font-medium">Email Address</FormLabel>
                          <div className="relative">
                            <Mail className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#2C3E50]/50" strokeWidth={1.75} />
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
                          <FormMessage className="font-sans text-xs font-normal text-[#C75B39] mt-1" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-center justify-between">
                            <FormLabel className="font-sans text-[#1A1A1A] font-medium">Password</FormLabel>
                            <Link
                              href="/forgot-password"
                              className="font-sans text-xs text-[#2C3E50] hover:text-[#D4A843] font-medium hover:underline transition-colors"
                            >
                              Forgot password?
                            </Link>
                          </div>
                          <div className="relative">
                            <FormControl>
                              <Input
                                {...field}
                                type={showPassword ? 'text' : 'password'}
                                autoComplete="current-password"
                                placeholder="••••••••"
                                className="font-sans h-12 rounded-xl border-[#D4A843]/25 pr-11 focus-visible:ring-[#D4A843]/40 focus-visible:border-[#D4A843]/50"
                              />
                            </FormControl>
                            <button
                              type="button"
                              onClick={() => setShowPassword((prev) => !prev)}
                              aria-label={showPassword ? 'Hide password' : 'Show password'}
                              tabIndex={-1}
                              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#2C3E50]/50 hover:text-[#D4A843] transition-colors"
                            >
                              {showPassword ? (
                                <EyeOff className="w-4.5 h-4.5" strokeWidth={1.75} />
                              ) : (
                                <Eye className="w-4.5 h-4.5" strokeWidth={1.75} />
                              )}
                            </button>
                          </div>
                          <FormMessage className="font-sans text-xs font-normal text-[#C75B39] mt-1" />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>

                <div className="flex flex-col gap-4 px-6 sm:px-10 py-6 border-t border-[#D4A843]/20 bg-[#F5E6C3]/25">
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-[#D4A843] hover:bg-[#B8860B] text-[#1A1A1A] font-sans font-semibold h-12 rounded-xl shadow-sm disabled:opacity-50 transition-all duration-200"
                  >
                    {isLoading ? 'Signing in...' : 'Sign In'}
                  </Button>

                  <div className="font-sans text-center text-sm text-[#2C3E50]">
                    Don&apos;t have an account?
                    <Link
                      href="/register"
                      className="text-[#1A1A1A] hover:text-[#D4A843] font-semibold hover:underline transition-colors ml-1.5"
                    >
                      Sign up
                    </Link>
                  </div>
                </div>
              </form>
            </Form>
          </Card>
        </div>
      </div>
    </>
  );
}