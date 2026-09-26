'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAdminAuthStore } from '@/store/adminAuthStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toastError, toastSuccess } from '@/lib/toast';
import { Lock, Mail } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const { login, isLoading } = useAdminAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      toastError('Please enter email and password');
      return;
    }

    const result = await login(email, password);

    if (result.success) {
      toastSuccess('Admin login successful!');
      router.push('/admin');
    } else {
      toastError(result.error || 'Login failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-[#FDF8F0]">
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md border-[#D4A843]/15">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-2">
            <Image
              src="/logo_1.png"
              alt="SNGS Matrimonial Logo"
              width={64}
              height={64}
              priority
              className="h-16 w-auto rounded-lg shadow-sm"
              style={{ width: 'auto', height: '64px' }}
            />
          </div>
          <CardTitle className="text-2xl font-bold font-serif text-center text-[#1A1A1A]">Admin Login</CardTitle>
          <CardDescription className="text-center font-sans text-[#2C3E50]/70">
            Access the admin portal
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium font-sans text-[#2C3E50] mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 text-[#2C3E50]/40" size={18} />
                <Input
                  type="email"
                  name="email"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="username"
                  className="pl-10 font-sans"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium font-sans text-[#2C3E50]">
                  Password
                </label>
                <Link href="/admin/forgot-password" className="font-sans text-sm text-[#1A1A1A] font-semibold hover:text-[#D4A843] hover:underline">
                  Forgot?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-[#2C3E50]/40" size={18} />
                <Input
                  type="password"
                  name="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  className="pl-10 font-sans"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-[#D4A843] hover:bg-[#B8860B] text-[#1A1A1A] font-sans font-semibold"
              disabled={isLoading}
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </Button>
          </form>

          <p className="text-center text-sm font-sans text-[#2C3E50]/60 mt-4">
            Don&apos;t have admin access? Contact the system administrator.
          </p>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
