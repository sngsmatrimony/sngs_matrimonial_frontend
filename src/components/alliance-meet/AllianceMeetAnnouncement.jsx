'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { CalendarHeart, LogIn, UserPlus } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { client } from '@/lib/api/client';
import { useAuthStore } from '@/store/authStore';
import { formatEventDate, isUpcomingEvent } from '@/lib/allianceEvent';
import { formatRupees } from '@/lib/money';
import AllianceCreditsHighlight from '@/components/alliance-meet/AllianceCreditsHighlight';

// Pages where the popup would get in the way (signing in / registering
// already, payments) or doesn't belong (admin).
const HIDDEN_ON = ['/login', '/register', '/forgot-password', '/admin', '/alliance-meet', '/payment', '/membership'];

/**
 * Announces the SNGS Marriage Alliance Meet to visitors who aren't signed in,
 * when the admin switches it on (Settings → Alliance Meet). Shown once per
 * browser session, and no longer after the event day.
 */
export default function AllianceMeetAnnouncement() {
  const pathname = usePathname() || '/';
  const { token, user } = useAuthStore();
  const [open, setOpen] = useState(false);

  const signedIn = !!(token || user);
  const hiddenHere = HIDDEN_ON.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  const { data: settings } = useQuery({
    queryKey: ['allianceMeetPublicSettings'],
    queryFn: async () => (await client.get('/api/alliance-meet/settings')).data.data,
    enabled: !signedIn,
    staleTime: 5 * 60 * 1000,
  });

  const eventDate = settings?.eventDate;
  const show = !!settings?.announcementEnabled && isUpcomingEvent(eventDate);
  const seenKey = `sngs-alliance-announcement-${eventDate || ''}`;

  useEffect(() => {
    if (!show || signedIn || hiddenHere) return undefined;
    try {
      if (localStorage.getItem('authToken') || sessionStorage.getItem(seenKey)) return undefined;
    } catch {
      // Storage blocked: still show it, just not remembered.
    }
    // A moment after the page appears, so it doesn't cover the page as it loads.
    const timer = setTimeout(() => {
      try { sessionStorage.setItem(seenKey, '1'); } catch { /* not remembered */ }
      setOpen(true);
    }, 1200);
    return () => clearTimeout(timer);
  }, [show, signedIn, hiddenHere, seenKey]);

  // Signing in from another tab, or moving to a page where it doesn't belong.
  useEffect(() => {
    if (signedIn || hiddenHere) setOpen(false); // eslint-disable-line react-hooks/set-state-in-effect -- closes it when the page/session changes
  }, [signedIn, hiddenHere]);

  if (!show || signedIn) return null;

  const dateText = formatEventDate(eventDate);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {/* Only the middle scrolls on short phone screens: "Not now" (the only
          way to close it) always stays in view at the bottom. */}
      <DialogContent showCloseButton={false} className="sm:max-w-lg p-0 overflow-hidden bg-[#FDF8F0] border-[#D4A843]/40 gap-0 max-h-[92dvh] flex flex-col outline-none"
        // Focus the popup itself, not its first button: otherwise "Not now"
        // opens highlighted and draws the eye away from registering.
        onOpenAutoFocus={(e) => { e.preventDefault(); e.currentTarget?.focus?.({ preventScroll: true }); }}
      >
        <div className="min-h-0 overflow-y-auto overscroll-contain">
        <div className="bg-gradient-to-br from-[#2C3E50] to-[#1A1A1A] px-6 pt-6 pb-5 sm:pt-7 sm:pb-6 text-center">
          <span className="mx-auto mb-3 flex w-12 h-12 items-center justify-center rounded-full bg-[#D4A843]">
            <CalendarHeart className="w-6 h-6 text-[#1A1A1A]" strokeWidth={1.75} aria-hidden="true" />
          </span>
          <p className="font-sans text-xs font-semibold uppercase tracking-[0.18em] text-[#D4A843]">You&apos;re invited</p>
          <DialogTitle className="mt-1 font-serif text-2xl sm:text-[28px] leading-tight font-semibold text-white">
            SNGS Marriage Alliance Meet
          </DialogTitle>
          <p className="mt-3 inline-block rounded-full border border-[#D4A843]/60 px-4 py-1.5 font-sans text-[15px] font-semibold text-[#F5E6C3]">
            Scheduled on {dateText}
          </p>
        </div>

        <div className="px-6 py-5 space-y-4">
          <DialogDescription className="font-sans text-[15px] leading-relaxed text-[#2C3E50] text-center">
            Meet families from the community in person. To apply for the Alliance Meet, you need an SNGS Matrimony account.
            {settings?.isEnabled && settings?.priceAmount ? ` Registration fee: ${formatRupees(settings.priceAmount)}.` : ''}
          </DialogDescription>

          <AllianceCreditsHighlight compact freeCredits={settings?.freeCredits} costs={settings?.costs} className="justify-center" />

          <div className="space-y-3 rounded-xl border border-[#D4A843]/25 bg-white p-4">
            <div>
              <p className="font-sans text-sm font-semibold text-[#1A1A1A]">New to SNGS Matrimony?</p>
              <p className="font-sans text-sm text-[#2C3E50]/75">Register an account. Once your profile is approved, apply from Search Matches or Settings.</p>
              <Button asChild className="mt-2 w-full h-11 font-sans font-semibold bg-[#D4A843] hover:bg-[#B8860B] text-[#1A1A1A]">
                <Link href="/register" onClick={() => setOpen(false)}>
                  <UserPlus className="w-4 h-4 mr-2" aria-hidden="true" />
                  Register an Account
                </Link>
              </Button>
            </div>
            <div className="border-t border-[#D4A843]/20 pt-3">
              <p className="font-sans text-sm font-semibold text-[#1A1A1A]">Already registered?</p>
              <p className="font-sans text-sm text-[#2C3E50]/75">Log in and apply for the Alliance Meet.</p>
              <Button asChild variant="outline" className="mt-2 w-full h-11 font-sans font-semibold border-2 border-[#D4A843] text-[#1A1A1A] bg-transparent hover:bg-[#F5E6C3]/50">
                <Link href="/login" onClick={() => setOpen(false)}>
                  <LogIn className="w-4 h-4 mr-2" aria-hidden="true" />
                  Log In &amp; Apply
                </Link>
              </Button>
            </div>
          </div>
        </div>
        </div>

        <div className="shrink-0 border-t border-[#D4A843]/20 px-6 py-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setOpen(false)}
            className="w-full h-11 font-sans text-[#2C3E50] hover:bg-[#F5E6C3]/40"
          >
            Not now
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
