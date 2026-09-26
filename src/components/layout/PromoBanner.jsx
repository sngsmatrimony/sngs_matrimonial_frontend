// src/components/layout/PromoBanner.jsx
"use client";
import { Sparkles, X } from 'lucide-react';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

export default function PromoBanner() {
  const [isVisible, setIsVisible] = useState(true);
  const { token, user } = useAuthStore();
  const pathname = usePathname();
  const isAdminRoute = pathname === '/admin' || pathname?.startsWith('/admin/');

  // "Register free" has no purpose once someone is already registered and
  // logged in, and the admin portal should never show marketing chrome.
  if (!isVisible || (token && user) || isAdminRoute) return null;

  return (
    <div className="relative bg-[#2C3E50] text-[#F5E6C3] px-4 py-2 shadow-sm z-50">
      {/* Thin gold hairline along the base */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-[#D4A843]/0 via-[#D4A843]/70 to-[#D4A843]/0" />

      <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 text-sm md:text-[15px] font-sans font-medium tracking-wide text-center pr-12 sm:pr-16">
        <Sparkles className="w-4 h-4 shrink-0 text-[#D4A843]" strokeWidth={2} />
        <span>
          <span className="text-[#D4A843] mr-1">Special Offer:</span>
          Register for <span className="text-white font-semibold">free</span> until November 1st — premium charges apply thereafter.
        </span>
      </div>

      <button
        onClick={() => setIsVisible(false)}
        className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[#F5E6C3]/70 hover:text-[#D4A843] transition-colors"
      >
        <X className="w-5 h-5" strokeWidth={2} />
        <span className="hidden sm:inline font-sans text-xs">Dismiss</span>
      </button>
    </div>
  );
}