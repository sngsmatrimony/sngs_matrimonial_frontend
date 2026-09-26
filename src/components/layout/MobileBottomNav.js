'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Home, Search, MessageCircle, User, Menu as MenuIcon, Heart, Settings, LogOut, HelpCircle } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import useChatStore from '@/store/chatStore';
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from '@/components/ui/sheet';

// /profiles/[id] deliberately excluded: it has its own sticky action bar
// (Express Interest/Chat/Share) — showing this generic nav there too would
// stack two bottom bars on mobile.
const APP_ROUTE_PREFIXES = ['/browse', '/liked', '/messages', '/profile', '/settings', '/chat'];

/**
 * Fixed mobile bottom nav for logged-in users on app routes. Mirrors the
 * dashboard's own tab bar but in a touch-friendly, always-visible position,
 * per the design brief (5 labeled icons: Home, Search, Messages, Profile, Menu).
 */
export default function MobileBottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const { token, user, logout } = useAuthStore();
  const conversations = useChatStore((state) => state.conversations);

  const isAppRoute = APP_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname?.startsWith(`${prefix}/`)
  );

  if (!token || !user || !isAppRoute) {
    return null;
  }

  const unreadTotal = (conversations || []).reduce((sum, c) => sum + (c.unreadCount || 0), 0);

  const isActive = (path) => pathname === path || pathname?.startsWith(`${path}/`);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const navItemClass = (active) =>
    `flex flex-col items-center justify-center gap-0.5 flex-1 h-full font-sans text-[11px] font-medium transition-colors ${
      active ? 'text-[#D4A843]' : 'text-[#2C3E50]/60'
    }`;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white border-t border-[#D4A843]/20 shadow-[0_-4px_16px_-8px_rgba(0,0,0,0.1)]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex items-stretch h-16">
        <Link href="/browse" className={navItemClass(isActive('/browse'))}>
          <Home size={22} strokeWidth={isActive('/browse') ? 2.25 : 1.75} />
          Home
        </Link>

        <Link href="/browse" className={navItemClass(false)}>
          <Search size={22} strokeWidth={1.75} />
          Search
        </Link>

        <Link href="/messages" className={`${navItemClass(isActive('/messages') || isActive('/chat'))} relative`}>
          <span className="relative">
            <MessageCircle size={22} strokeWidth={isActive('/messages') || isActive('/chat') ? 2.25 : 1.75} />
            {unreadTotal > 0 && (
              <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-[#C75B39] text-white text-[9px] font-semibold flex items-center justify-center">
                {unreadTotal > 9 ? '9+' : unreadTotal}
              </span>
            )}
          </span>
          Messages
        </Link>

        <Link href="/profile" className={navItemClass(isActive('/profile'))}>
          <User size={22} strokeWidth={isActive('/profile') ? 2.25 : 1.75} />
          Profile
        </Link>

        <Sheet>
          <SheetTrigger asChild>
            <button type="button" className={navItemClass(false)}>
              <MenuIcon size={22} strokeWidth={1.75} />
              Menu
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="pb-8">
            <SheetHeader>
              <SheetTitle>Menu</SheetTitle>
            </SheetHeader>
            <div className="flex flex-col gap-1 px-4 pt-2">
              <SheetClose asChild>
                <Link
                  href="/liked"
                  className="flex items-center gap-3 px-3 py-3 rounded-xl font-sans text-[#1A1A1A] hover:bg-[#F5E6C3]/40 transition-colors"
                >
                  <Heart size={20} className="text-[#D4A843]" strokeWidth={1.75} />
                  Liked Profiles
                </Link>
              </SheetClose>
              <SheetClose asChild>
                <Link
                  href="/settings"
                  className="flex items-center gap-3 px-3 py-3 rounded-xl font-sans text-[#1A1A1A] hover:bg-[#F5E6C3]/40 transition-colors"
                >
                  <Settings size={20} className="text-[#D4A843]" strokeWidth={1.75} />
                  Settings
                </Link>
              </SheetClose>
              <SheetClose asChild>
                <Link
                  href="/contact"
                  className="flex items-center gap-3 px-3 py-3 rounded-xl font-sans text-[#1A1A1A] hover:bg-[#F5E6C3]/40 transition-colors"
                >
                  <HelpCircle size={20} className="text-[#D4A843]" strokeWidth={1.75} />
                  Help & Contact
                </Link>
              </SheetClose>
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-3 px-3 py-3 rounded-xl font-sans text-[#C75B39] hover:bg-[#FBEAE5] transition-colors text-left"
              >
                <LogOut size={20} strokeWidth={1.75} />
                Logout
              </button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}
