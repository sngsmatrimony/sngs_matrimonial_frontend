'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { RefreshCw } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/authStore';
import { useEnforcementStatus } from '@/hooks/useEnforcementStatus';
import { isPlanLapsed } from '@/lib/membershipStatus';

/**
 * Shown once per browser session after a member's plan has ended, offering to
 * renew it. "Renew Plan" opens the plans page in renew mode (the old plan on
 * top, other plans below); "Not now" just closes it. Only while charging is on
 * — during a promotional period an expired plan changes nothing.
 */
export default function RenewPlanDialog() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, membership } = useAuthStore();
  const enforcementActive = useEnforcementStatus();
  const [open, setOpen] = useState(false);

  const planName = typeof membership?.planId === 'object' ? membership.planId?.name : null;
  const lapsed = isPlanLapsed(membership);
  // One prompt per lapse: a later plan that also ends gets its own prompt.
  const promptKey = `sngs-renew-prompt-${membership?.expiryDate || ''}`;

  useEffect(() => {
    if (!enforcementActive || !lapsed || !planName || user?.approvalStatus !== 'approved') return;
    if (pathname?.startsWith('/membership') || pathname?.startsWith('/payment')) return;
    try {
      if (sessionStorage.getItem(promptKey)) return;
      sessionStorage.setItem(promptKey, '1');
    } catch {
      // Storage blocked: still show it, just not remembered.
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- opens once based on sessionStorage, which isn't readable during render
    setOpen(true);
  }, [enforcementActive, lapsed, planName, user?.approvalStatus, pathname, promptKey]);

  if (!lapsed || !planName) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md bg-[#FDF8F0] border-[#D4A843]/30">
        <DialogHeader>
          <div className="w-14 h-14 mx-auto mb-2 rounded-full bg-[#F5E6C3] flex items-center justify-center ring-1 ring-[#D4A843]/40">
            <RefreshCw className="w-6 h-6 text-[#B8860B]" strokeWidth={1.75} />
          </div>
          <DialogTitle className="font-serif text-2xl text-center text-[#1A1A1A]">
            Your {planName} plan has ended
          </DialogTitle>
          <DialogDescription className="font-sans text-[15px] text-center text-[#2C3E50]/80 leading-relaxed">
            Its leftover credits have lapsed and the profiles you unlocked are locked for now.
            Renew and they all open again at no extra cost, with fresh credits for new matches.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col gap-3 sm:flex-col sm:space-x-0">
          <Button
            onClick={() => { setOpen(false); router.push('/membership/purchase'); }}
            className="w-full h-12 rounded-lg bg-[#D4A843] hover:bg-[#B8860B] text-[#1A1A1A] font-sans font-semibold"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Renew Plan
          </Button>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            className="w-full h-12 rounded-lg border-[#D4A843]/40 font-sans"
          >
            Not now
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
