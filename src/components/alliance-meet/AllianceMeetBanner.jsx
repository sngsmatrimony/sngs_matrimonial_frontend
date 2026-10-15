'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { CalendarHeart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { client } from '@/lib/api/client';
import { toastError } from '@/lib/toast';

const DISMISS_KEY = 'allianceMeetBannerDismissedAt';
const DISMISS_DAYS = 7;

function dismissedRecently() {
  try {
    const at = Number(localStorage.getItem(DISMISS_KEY));
    return !!at && Date.now() - at < DISMISS_DAYS * 864e5;
  } catch {
    return false;
  }
}

/**
 * Alliance Meet invitation shown on Search Matches, where members spend most
 * of their time (the full card also lives in Settings). Only shown while the
 * admin has registration open and the member hasn't registered; "Not now"
 * hides it on this device for a week.
 */
export default function AllianceMeetBanner() {
  const router = useRouter();
  const [dismissed, setDismissed] = useState(dismissedRecently);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);

  // Same query keys as the Settings card, so both share one cache entry.
  const { data: settings } = useQuery({
    queryKey: ['allianceMeetPublicSettings'],
    queryFn: async () => (await client.get('/api/alliance-meet/settings')).data.data,
    enabled: !dismissed,
  });
  const { data: myRegistration, isLoading: isLoadingRegistration } = useQuery({
    queryKey: ['allianceMeetMyRegistration'],
    queryFn: async () => (await client.get('/api/alliance-meet/my-registration')).data.data,
    enabled: !dismissed && !!settings?.isEnabled,
  });

  if (dismissed || !settings?.isEnabled || isLoadingRegistration || myRegistration?.registered !== false) {
    return null;
  }

  const handleDismiss = () => {
    try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch { /* per-device convenience only */ }
    setDismissed(true);
  };

  const handleRegister = async () => {
    setIsCreatingOrder(true);
    try {
      const res = await client.post('/api/alliance-meet/create-order');
      router.push(`/alliance-meet/payment/${res.data.data.orderId}`);
    } catch (error) {
      toastError(error.response?.data?.message || 'Failed to start registration. Please try again.');
      setIsCreatingOrder(false);
    }
  };

  return (
    <section
      aria-label="SNGS Alliance Meet"
      className="mb-6 rounded-xl border border-[#D4A843]/40 bg-white shadow-sm overflow-hidden"
    >
      <div className="flex flex-col md:flex-row md:items-center gap-4 p-4 sm:p-5 border-l-4 border-l-[#D4A843]">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <span className="shrink-0 w-11 h-11 rounded-full bg-[#F5E6C3] flex items-center justify-center">
            <CalendarHeart className="w-5 h-5 text-[#B8860B]" strokeWidth={1.75} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h3 className="font-serif text-lg sm:text-xl font-semibold text-[#1A1A1A]">
              Join the SNGS Alliance Meet
            </h3>
            <p className="font-sans text-[15px] leading-relaxed text-[#2C3E50]/80 mt-0.5">
              Meet families from the community in person. Registration is open —{' '}
              <span className="font-semibold text-[#1A1A1A]">₹{Number(settings.priceAmount || 0).toLocaleString('en-IN')}</span> per registration.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            type="button"
            variant="ghost"
            onClick={handleDismiss}
            className="h-11 px-4 font-sans text-[#2C3E50] hover:bg-[#FDF8F0]"
          >
            Not now
          </Button>
          <Button
            type="button"
            onClick={handleRegister}
            disabled={isCreatingOrder}
            className="h-11 px-5 font-sans font-semibold bg-[#D4A843] hover:bg-[#B8860B] text-[#1A1A1A]"
          >
            {isCreatingOrder ? 'Starting...' : 'Register Now'}
          </Button>
        </div>
      </div>
    </section>
  );
}
