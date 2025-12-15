'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAdminAuthStore } from '@/store/adminAuthStore';
import {
  BarChart3,
  Users,
  LogOut,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AdminLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { admin, isLoading, logout, initializeAuth } = useAdminAuthStore();

  // Don't protect login route
  const isLoginRoute = pathname === '/admin/login';

  // Initialize auth and determine authorization
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    if (!isLoading && !isLoginRoute) {
      if (!admin) {
        router.push('/admin/login');
      }
    }
  }, [admin, isLoading, router, isLoginRoute]);

  const handleLogout = () => {
    logout();
    router.push('/admin/login');
  };

  // For login page, just render the content without the admin layout
  if (isLoginRoute) {
    return children;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-secondary">Loading admin portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {/* Top Header - Similar to Dashboard */}
        <header className="border-b border-gray-100 bg-white shadow-sm">
          <div className="px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="font-viga text-2xl text-accent">
                SNGS Admin
              </h1>
            </div>

            {/* Welcome Message */}
            <div className="hidden md:flex items-center gap-2">
              <span className="font-maven text-gray-600">Welcome,</span>
              <span className="font-viga text-secondary">{admin?.email?.split('@')[0]}</span>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors font-telex"
            >
              <LogOut size={18} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>

        {/* Navigation Tabs */}
        <div className="bg-black border-b border-gray-900">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-8 overflow-x-auto">
              <Link
                href="/admin"
                className={`py-4 font-telex font-semibold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
                  pathname === '/admin'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-white hover:text-gray-300'
                }`}
              >
                <BarChart3 size={20} />
                <span className="hidden sm:inline">Dashboard</span>
              </Link>
              <Link
                href="/admin/users"
                className={`py-4 font-telex font-semibold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
                  pathname.startsWith('/admin/users')
                    ? 'border-primary text-primary'
                    : 'border-transparent text-white hover:text-gray-300'
                }`}
              >
                <Users size={20} />
                <span className="hidden sm:inline">Users</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div className="flex-1 p-6 overflow-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
