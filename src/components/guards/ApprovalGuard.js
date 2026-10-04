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
 * Rejected users are redirected to /profile with a toast notification (they
 * have something to act on there). Pending users stay put and see an inline
 * "under review" message instead, since there's nothing for them to do yet.
 */
export default function ApprovalGuard({ children }) {
  const { canAccessFullApp, isPending, isRejected, user, authInitError, initializeAuth } = useAuthStore();
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

    // Pending users have nothing to act on — redirecting them to /profile
    // just swaps one wait screen for another, and the toast is easy to miss
    // before the redirect fires. Show the inline "under review" message in
    // place instead (see render below) rather than bouncing them away.
    if (isPending()) {
      return;
    }

    if (hasNotifiedRef.current) {
      return;
    }
    hasNotifiedRef.current = true;

    if (isRejected()) {
      toastWarning('Please update your profile to regain access to this feature.');
    } else {
      toastWarning('Access restricted. Please complete your profile verification.');
    }

    router.replace('/profile');
  }, [user, canAccessFullApp, isPending, isRejected, router, isAlwaysAllowed]);

  // A stored token exists but the user fetch failed (network/timeout) even
  // after initializeAuth's own retry — this is the state that used to leave
  // mobile users stuck on the spinner below forever, since isWaitingForUser
  // never resolves on its own. Give them a real way out.
  if (isWaitingForUser && authInitError) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center px-4">
        <div className="flex flex-col items-center gap-4 text-center max-w-xs">
          <p className="font-sans text-[#2C3E50] text-sm">
            We couldn&apos;t load your account. Please check your connection and try again.
          </p>
          <button
            type="button"
            onClick={() => initializeAuth()}
            className="font-sans text-sm font-semibold text-[#1A1A1A] bg-[#D4A843] hover:bg-[#B8860B] px-5 py-2.5 rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // A loaded, pending-approval user hitting a guarded route — shown in place
  // instead of redirecting away, so the status is explained rather than
  // leaving a generic "Verifying access..." spinner that reads as stuck.
  if (user && !hasAccess && isPending()) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center px-4">
        <div className="flex flex-col items-center gap-3 text-center max-w-sm">
          <p className="font-serif text-lg text-[#1A1A1A] font-semibold">
            Profile Under Review
          </p>
          <p className="font-sans text-[#2C3E50] text-sm leading-relaxed">
            Your profile has not been verified by our approval team yet. Please check back later — you&apos;ll be notified by email as soon as your account is approved.
          </p>
        </div>
      </div>
    );
  }

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
