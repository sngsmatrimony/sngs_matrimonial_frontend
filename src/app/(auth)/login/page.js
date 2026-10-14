'use client';

import { useEffect, useState } from 'react';
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
  Phone,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { FormAlert } from '@/components/ui/form-alert';
import { useAuthStore } from '@/store/authStore';
import { useFirebasePhoneAuth } from '@/hooks/useFirebasePhoneAuth';
import { toastError, toastSuccess } from '@/lib/toast';
import { noPasteHandlers } from '@/lib/noPasteHandlers';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export default function LoginPage() {
  const router = useRouter();
  const { login, loginWithMobileOtp } = useAuthStore();
  const [loginMethod, setLoginMethod] = useState('email'); // 'email' | 'mobile'
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  // Mobile OTP login — separate container id from registration's so the two
  // pages' invisible reCAPTCHA widgets never collide (they're different
  // routes, so this never actually happens simultaneously, but the hook is
  // built to require a distinct id per mount point regardless).
  const [mobileNumberInput, setMobileNumberInput] = useState('');
  const {
    mobileVerificationStep,
    mobileOtpValue,
    setMobileOtpValue,
    mobileOtpLoading,
    mobileVerified,
    mobileIdToken,
    mobileResendTimer,
    sendMobileOTP,
    verifyMobileOTP,
    resendMobileOTP,
    resetMobileVerification,
  } = useFirebasePhoneAuth('recaptcha-container-login');

  const form = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // Guard against a stale error carrying over from a previous failed attempt
  // (e.g. the browser restoring this page from cache on back/forward nav).
  useEffect(() => {
    setError('');
  }, []);

  const email = form.watch('email');
  const password = form.watch('password');
  useEffect(() => {
    setError('');
  }, [email, password]);

  async function onSubmit(values) {
    setIsLoading(true);
    setError('');

    const result = await login(values.email, values.password);

    if (result.success) {
      toastSuccess('Signed in successfully. Redirecting...');
      router.push('/');
    } else {
      const errMessage = result.error || 'Sign in failed. Please check your credentials.';
      setError(errMessage);
      toastError(errMessage);
    }

    setIsLoading(false);
  }

  async function handleMobileLogin() {
    setIsLoading(true);
    setError('');

    const result = await loginWithMobileOtp(mobileNumberInput, mobileIdToken);

    if (result.success) {
      toastSuccess('Signed in successfully. Redirecting...');
      router.push('/');
    } else {
      const errMessage = result.error || 'Sign in failed. Please try again.';
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
      {/* h-full (not min-h-screen) so this fills exactly whatever vertical
          space <main> actually has left after the header/promo banner —
          forcing a full extra 100vh here was pushing the card below the
          visible center whenever that chrome was present. */}
      <div className="relative z-10 flex items-center justify-center h-full min-h-[calc(100dvh-72px)] w-full p-4">
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

            {/* Email / Mobile OTP toggle */}
            <div className="flex px-6 sm:px-10 pt-6 gap-2">
              <button
                type="button"
                onClick={() => { setLoginMethod('email'); setError(''); }}
                className={`flex-1 flex items-center justify-center gap-2 h-11 rounded-xl font-sans font-semibold text-sm transition-all duration-200 ${
                  loginMethod === 'email'
                    ? 'bg-[#D4A843] text-[#1A1A1A] shadow-sm'
                    : 'bg-[#F5E6C3]/40 text-[#2C3E50] hover:bg-[#F5E6C3]/70'
                }`}
              >
                <Mail className="w-4 h-4" strokeWidth={1.75} />
                Email
              </button>
              <button
                type="button"
                onClick={() => { setLoginMethod('mobile'); setError(''); }}
                className={`flex-1 flex items-center justify-center gap-2 h-11 rounded-xl font-sans font-semibold text-sm transition-all duration-200 ${
                  loginMethod === 'mobile'
                    ? 'bg-[#D4A843] text-[#1A1A1A] shadow-sm'
                    : 'bg-[#F5E6C3]/40 text-[#2C3E50] hover:bg-[#F5E6C3]/70'
                }`}
              >
                <Phone className="w-4 h-4" strokeWidth={1.75} />
                Mobile OTP
              </button>
            </div>

            {loginMethod === 'email' ? (
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
                                  {...noPasteHandlers}
                                  type={showPassword ? 'text' : 'password'}
                                  autoComplete="current-password"
                                  placeholder="Enter your password"
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
            ) : (
              <>
                <CardContent className="px-6 sm:px-10">
                  <div className="space-y-6 py-8">
                    <FormAlert message={error} onDismiss={() => setError('')} />

                    {/* Invisible Firebase reCAPTCHA widget required before an SMS can be
                        sent — renders nothing visible (size: 'invisible'), see useFirebasePhoneAuth. */}
                    <div id="recaptcha-container-login" />

                    <div>
                      <label className="font-sans text-[#1A1A1A] font-medium block mb-2">Mobile Number</label>
                      <div className="flex gap-2.5">
                        <div className="flex flex-1">
                          <div className="w-16 flex items-center justify-center border border-r-0 border-[#D4A843]/25 rounded-l-xl bg-[#F5E6C3]/50 font-sans text-sm text-[#2C3E50] font-medium">
                            +91
                          </div>
                          <Input
                            type="tel"
                            value={mobileNumberInput}
                            placeholder="9876543210"
                            maxLength={10}
                            pattern="[0-9]*"
                            disabled={mobileVerified}
                            className="font-sans flex-1 h-12 rounded-l-none rounded-r-xl border-[#D4A843]/25 focus-visible:ring-[#D4A843]/40 focus-visible:border-[#D4A843]/50"
                            onChange={(e) => {
                              setMobileNumberInput(e.target.value.replace(/\D/g, '').slice(0, 10));
                              if (mobileVerified) resetMobileVerification();
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                if (!mobileOtpLoading && /^[6-9]\d{9}$/.test(mobileNumberInput)) {
                                  sendMobileOTP(mobileNumberInput);
                                }
                              }
                            }}
                          />
                        </div>
                        {!mobileVerified && (
                          <Button
                            type="button"
                            onClick={() => sendMobileOTP(mobileNumberInput)}
                            disabled={mobileOtpLoading || !/^[6-9]\d{9}$/.test(mobileNumberInput)}
                            className="bg-[#D4A843] hover:bg-[#B8860B] text-[#1A1A1A] font-sans font-semibold whitespace-nowrap h-12 px-5 rounded-xl shadow-sm"
                          >
                            {mobileOtpLoading ? 'Sending...' : 'Send OTP'}
                          </Button>
                        )}
                        {mobileVerified && (
                          <div className="flex items-center gap-2 px-4 h-12 bg-green-50 text-green-700 rounded-xl border border-green-200">
                            <ShieldCheck className="w-4.5 h-4.5 shrink-0" strokeWidth={1.75} />
                            <span className="font-sans font-semibold text-sm whitespace-nowrap">Verified</span>
                          </div>
                        )}
                      </div>
                      <p className="font-sans text-[11px] text-[#2C3E50]/50 mt-1.5">
                        This site is protected by reCAPTCHA and the Google{' '}
                        <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="underline hover:text-[#2C3E50]/70">
                          Privacy Policy
                        </a>{' '}
                        and{' '}
                        <a href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer" className="underline hover:text-[#2C3E50]/70">
                          Terms of Service
                        </a>{' '}
                        apply.
                      </p>
                    </div>

                    {mobileVerificationStep === 'otp' && !mobileVerified && (
                      <div className="space-y-4 p-5 bg-[#F5E6C3]/40 rounded-xl border border-[#D4A843]/30 border-l-4 border-l-[#D4A843]">
                        <p className="font-sans text-sm text-[#2C3E50]">
                          Enter the 6-digit code sent to <strong className="text-[#1A1A1A]">+91 {mobileNumberInput}</strong>
                        </p>
                        <Input
                          type="text"
                          inputMode="numeric"
                          placeholder="000000"
                          maxLength={6}
                          value={mobileOtpValue}
                          onChange={(e) => {
                            const cleaned = e.target.value.replace(/\D/g, '').slice(0, 6);
                            setMobileOtpValue(cleaned);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              if (!mobileOtpLoading && mobileOtpValue.length === 6) {
                                verifyMobileOTP();
                              }
                            }
                          }}
                          className="text-center text-2xl tracking-[0.5em] font-sans h-14 rounded-xl bg-white border-[#D4A843]/40 focus-visible:ring-[#D4A843]/40"
                        />
                        <div className="flex gap-2.5">
                          <Button
                            type="button"
                            onClick={verifyMobileOTP}
                            disabled={mobileOtpLoading || !mobileOtpValue || mobileOtpValue.length !== 6}
                            className="flex-1 bg-[#D4A843] hover:bg-[#B8860B] text-[#1A1A1A] font-sans font-semibold h-11 rounded-xl shadow-sm"
                          >
                            {mobileOtpLoading ? 'Verifying...' : 'Verify OTP'}
                          </Button>
                          <Button
                            type="button"
                            onClick={resendMobileOTP}
                            disabled={mobileResendTimer > 0}
                            variant="outline"
                            className="font-sans h-11 rounded-xl border-[#D4A843]/40 text-[#2C3E50] hover:bg-[#F5E6C3]/30"
                          >
                            {mobileResendTimer > 0 ? `Resend (${mobileResendTimer}s)` : 'Resend OTP'}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>

                <div className="flex flex-col gap-4 px-6 sm:px-10 py-6 border-t border-[#D4A843]/20 bg-[#F5E6C3]/25">
                  <Button
                    type="button"
                    onClick={handleMobileLogin}
                    disabled={isLoading || !mobileVerified}
                    className="w-full bg-[#D4A843] hover:bg-[#B8860B] text-[#1A1A1A] font-sans font-semibold h-12 rounded-xl shadow-sm disabled:opacity-50 transition-all duration-200"
                  >
                    {!mobileVerified ? 'Verify Mobile to Continue' : isLoading ? 'Signing in...' : 'Sign In'}
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
              </>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
