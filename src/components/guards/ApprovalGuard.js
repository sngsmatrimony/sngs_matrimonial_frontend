'use client';

import { useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { toastWarning } from '@/lib/toast';

// Routes that stay accessible regardless of approval status. Everything else
// under the guarded layout is blocked by default until approved.
export const ALWAYS_ALLOWED_PATHS = ['/profile', '/settings'];

/**
 * ApprovalGuard - Protects routes that require approved status.
 * Applied once around the whole dashboard layout so every route is blocked
 * by default unless it's in ALWAYS_ALLOWED_PATHS or the user is approved.
 * Redirects unapproved users to /profile with a toast notification.
 */
export default function ApprovalGuard({ children }) {
  const { canAccessFullApp, isPending, isRejected, user } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const isAlwaysAllowed = ALWAYS_ALLOWED_PATHS.some(
    (path) => pathname === path || pathname?.startsWith(`${path}/`)
  );

  // The access check itself is synchronous (derived from already-loaded auth
  // state), so it's computed directly at render time rather than stored in
  // state — only the navigation/toast side effects belong in an effect.
  const hasAccess = isAlwaysAllowed || (user ? canAccessFullApp() : false);
  const isWaitingForUser = !isAlwaysAllowed && !user;

  // Guards against the toast/redirect firing twice for the same denial — e.g. React
  // Strict Mode's dev-only double effect invocation, or `user` being replaced by a
  // fresh-but-equivalent object from a refetch.
  const hasNotifiedRef = useRef(false);

  useEffect(() => {
    if (isAlwaysAllowed || !user || canAccessFullApp()) {
      return;
    }
    if (hasNotifiedRef.current) {
      return;
    }
    hasNotifiedRef.current = true;

    // Show appropriate message based on status
    if (isPending()) {
      toastWarning('Your profile is under review. You can access this feature once approved.');
    } else if (isRejected()) {
      toastWarning('Please update your profile to regain access to this feature.');
    } else {
      toastWarning('Access restricted. Please complete your profile verification.');
    }

    router.replace('/profile');
  }, [user, canAccessFullApp, isPending, isRejected, router, isAlwaysAllowed]);

  // Show loading spinner while waiting for user data to load, or while a
  // denied user's redirect to /profile is in flight.
  if (isWaitingForUser || !hasAccess) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-4 border-[#F5E6C3] border-t-[#D4A843] animate-spin"></div>
          <p className="font-sans text-[#2C3E50] text-sm">Verifying access...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
