'use client';

import { LogOut, Coins } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';

// Routes where a Logout button should replace the default My Account/Sign-in CTA.
const LOGOUT_ROUTE_PREFIXES = ['/chat', '/profiles/'];

// App routes that have their own dedicated nav shell (the dashboard layout's
// header + tab bar, or — for /membership and /payment — their own minimal,
// distraction-free header). The global marketing header stays out of the way
// entirely for logged-in users, so there's only ever one nav on screen.
const APP_ROUTE_PREFIXES = ['/browse', '/liked', '/messages', '/profile', '/settings', '/chat', '/profiles', '/membership', '/payment'];

export default function Header({ showLogout = false, isFixed = false }) {
  const { logout, user, membership, token } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  const effectiveShowLogout = showLogout || LOGOUT_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname?.startsWith(prefix)
  );

  const isAppRoute = APP_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname?.startsWith(`${prefix}/`)
  );

  // The admin portal has its own dedicated header/nav and its own auth store
  // (useAdminAuthStore, not this one) — the marketing header must never show
  // there, regardless of whether a regular user session happens to exist.
  const isAdminRoute = pathname === '/admin' || pathname?.startsWith('/admin/');

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  // Add a scroll listener to dynamically increase the shadow when the user scrolls down
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (isAdminRoute) {
    return null;
  }

  // Logged-in users on app routes get the dashboard's own header + tab bar
  // instead — never show both at once.
  if (isAppRoute && token && user) {
    return null;
  }

  // "Transparent feeling" achieved via backdrop-blur-md and a translucent Cream background
  // Maintains the strict 72px fixed height required by the design system
  const headerClasses = isFixed
    ? `sticky top-0 left-0 right-0 z-40 h-[72px] w-full flex items-center transition-all duration-300 backdrop-blur-md bg-[#FDF8F0]/85 border-b border-[#D4A843]/20 ${
        scrolled ? 'shadow-[0_4px_20px_-10px_rgba(0,0,0,0.1)]' : 'shadow-none'
      }`
    : `h-[72px] w-full flex items-center bg-[#FDF8F0]/85 backdrop-blur-md border-b border-[#D4A843]/20 shadow-sm`;

  return (
    <header className={headerClasses}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between w-full h-full">
        
        {/* Logo Section */}
        <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer z-10 group">
          <Image
            src="/logo_1.png"
            alt="SNGS Matrimonial Logo"
            width={40}
            height={40}
            className="h-10 w-auto rounded shadow-sm group-hover:shadow transition-all"
            style={{ width: 'auto', height: 'auto' }}
          />
          {/* Changed color to Navy (#2C3E50) and enforced the Serif typography */}
          <h1 className="font-serif text-2xl font-bold text-[#2C3E50] hidden sm:block tracking-wide">
            SNGS Matrimonial
          </h1>
        </Link>

        {/* Desktop Navigation Links - Centered with animated Gold underlines */}
        <nav className="hidden lg:flex items-center gap-10 absolute left-1/2 -translate-x-1/2">
          {['Home', 'About Us', 'Contact'].map((item) => (
            <Link 
              key={item}
              href={item === 'Home' ? '/' : `/${item.toLowerCase().replace(' ', '-')}`} 
              className="font-sans text-[15px] font-medium text-[#2C3E50] hover:text-[#D4A843] transition-colors relative after:absolute after:bottom-[-4px] after:left-0 after:w-0 after:h-[2px] after:bg-[#D4A843] hover:after:w-full after:transition-all after:duration-300"
            >
              {item}
            </Link>
          ))}
          {user && token && user?.role !== 'admin' && (
            <Link 
              href="/browse" 
              className="font-sans text-[15px] font-medium text-[#2C3E50] hover:text-[#D4A843] transition-colors relative after:absolute after:bottom-[-4px] after:left-0 after:w-0 after:h-[2px] after:bg-[#D4A843] hover:after:w-full after:transition-all after:duration-300"
            >
              Search Matches
            </Link>
          )}
        </nav>

        {/* Actions Section */}
        <div className="flex items-center gap-4 z-10 ml-auto">
          {effectiveShowLogout ? (
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 sm:px-5 rounded-lg border border-[#D4A843]/50 text-[#1A1A1A] hover:bg-[#F5E6C3] transition-all duration-300 font-sans text-sm font-medium shadow-sm hover:shadow"
            >
              <LogOut size={16} className="text-[#C75B39]" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          ) : token && user ? (
            <Link 
              href="/profile" 
              className="hidden sm:inline-flex items-center justify-center font-sans text-sm font-medium text-[#1A1A1A] border border-[#D4A843]/30 px-5 py-2 rounded-lg hover:bg-[#F5E6C3] transition-all duration-300 shadow-sm hover:shadow"
            >
              My Account
            </Link>
          ) : (
            <div className="hidden sm:flex items-center gap-6 ml-2">
              <Link 
                href="/login" 
                className="font-sans text-sm font-medium text-[#2C3E50] hover:text-[#D4A843] transition-colors"
              >
                Sign In
              </Link>
              <Link 
                href="/register" 
                className="bg-[#D4A843] hover:bg-[#B8860B] text-[#1A1A1A] px-6 py-2.5 rounded-lg font-sans text-sm font-bold transition-all duration-300 shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}