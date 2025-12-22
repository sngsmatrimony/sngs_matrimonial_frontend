'use client';

import { LogOut } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import HelpButton from './HelpButton';

export default function Header({ showLogout = false, isFixed = false }) {
  const { logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const headerClasses = isFixed
    ? 'border-b border-gray-100 fixed top-0 left-0 right-0 z-50 bg-white shadow-sm'
    : 'border-b border-gray-100';

  return (
    <header className={headerClasses}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Image
            src="/logo.jpeg"
            alt="SNGS Matrimonial Logo"
            width={48}
            height={48}
            className="w-auto h-12"
          />
          <h1 className="font-viga text-2xl text-accent">SNGS Matrimonial</h1>
        </div>

        <HelpButton />
        {showLogout && (
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors font-telex"
          >
            <LogOut size={18} />
            <span className="hidden sm:inline">Logout</span>
          </button>
        )}
      </div>
    </header>
  );
}
