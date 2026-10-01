'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toastError, toastSuccess } from '@/lib/toast';
import adminClient from '@/lib/api/adminClient';
import { Eye, EyeOff } from 'lucide-react';

const resetSchema = z.object({
  otp: z.string().length(6, 'OTP must be 6 digits'),
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Must contain uppercase, lowercase, and number'),
  confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export default function AdminVerifyOTPPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    const storedEmail = sessionStorage.getItem('adminResetEmail');
    if (!storedEmail) {
      setIsRedirecting(true);
      router.push('/admin/forgot-password');
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
      const response = await adminClient.post('/api/admin-auth/forgot-password/reset', {
        email,
        otp: values.otp,
        newPassword: values.newPassword
      });

      if (response.data.success) {
        toastSuccess('Admin password reset successful!');
        sessionStorage.removeItem('adminResetEmail');
        router.push('/admin/login');
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
    <div className="min-h-screen bg-gray-50">
      <div className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <Card className="border-0 shadow-lg bg-white">
            <CardHeader className="space-y-2 pb-6">
              <CardTitle className="font-serif text-3xl text-center text-primary">
                Reset Admin Password
              </CardTitle>
              <CardDescription className="font-sans text-center text-secondary">
                {email && `Enter the OTP sent to ${email}`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                  <FormField
                    control={form.control}
                    name="otp"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-sans text-secondary font-semibold">
                          OTP
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="123456"
                            type="text"
                            maxLength={6}
                            className="border-2 border-gray-200 focus:border-primary text-center text-2xl tracking-widest font-sans"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-destructive font-sans" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-sans text-secondary font-semibold">
                          New Password
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              placeholder="••••••••"
                              type={showNewPassword ? 'text' : 'password'}
                              autoComplete="new-password"
                              className="border-2 border-gray-200 focus:border-primary font-sans pr-10"
                              {...field}
                            />
                            <button
                              type="button"
                              onClick={() => setShowNewPassword((prev) => !prev)}
                              aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                              tabIndex={-1}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors"
                            >
                              {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage className="text-destructive font-sans text-xs" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-sans text-secondary font-semibold">
                          Confirm Password
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              placeholder="••••••••"
                              type={showConfirmPassword ? 'text' : 'password'}
                              autoComplete="new-password"
                              className="border-2 border-gray-200 focus:border-primary font-sans pr-10"
                              {...field}
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirmPassword((prev) => !prev)}
                              aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                              tabIndex={-1}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors"
                            >
                              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage className="text-destructive font-sans" />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="font-sans w-full bg-primary hover:bg-primary/90 h-12 text-lg font-semibold text-black"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Resetting Password...' : 'Reset Password'}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
