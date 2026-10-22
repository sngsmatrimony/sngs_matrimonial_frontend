'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalendarHeart, Loader2, CheckCircle2 } from 'lucide-react';
import { client } from '@/lib/api/client';
import { toastError, toastInfo } from '@/lib/toast';
import { formatRupees } from '@/lib/money';
import PaymentTermsDialog from '@/components/payment/PaymentTermsDialog';
import { useAuthStore } from '@/store/authStore';

const ALLIANCE_MEET_TERMS = [
  'A one-time registration for the upcoming SNGS Alliance Meet. Our team will share the event details with you.',
  'The registration fee is non-refundable, unless SNGS cancels the event.',
];

/**
 * Opt-in card for the SNGS Alliance Meet, shown below MembershipSection on
 * the Settings page — a one-time paid event registration, separate from the
 * recurring membership-credit system. Hidden entirely if the admin has
 * closed registration (see admin Settings > Alliance Meet toggle).
 */
export default function AllianceMeetSection() {
  const router = useRouter();
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  // Registration is paid, so it opens once the profile is approved (the
  // backend refuses the order before that too).
  const user = useAuthStore((s) => s.user);
  const awaitingApproval = !!user && user.approvalStatus !== 'approved';

  const { data: settings, isLoading } = useQuery({
    queryKey: ['allianceMeetPublicSettings'],
    queryFn: async () => {
      const response = await client.get('/api/alliance-meet/settings');
      return response.data.data;
    },
  });

  const { data: myRegistration } = useQuery({
    queryKey: ['allianceMeetMyRegistration'],
    queryFn: async () => {
      const response = await client.get('/api/alliance-meet/my-registration');
      return response.data.data;
    },
  });

  // Register first shows the payment terms; the order is created only after
  // the member agrees.
  const handleRegister = () => setShowTerms(true);

  const startPayment = async () => {
    setIsCreatingOrder(true);
    try {
      toastInfo('Creating payment order...');
      const res = await client.post('/api/alliance-meet/create-order', { acceptTerms: true });
      const { orderId } = res.data.data;
      router.push(`/alliance-meet/payment/${orderId}`);
    } catch (error) {
      toastError(error.response?.data?.message || 'Failed to start registration. Please try again.');
      setIsCreatingOrder(false);
      setShowTerms(false);
    }
  };

  const pricing = settings?.pricing || { baseAmount: settings?.priceAmount, gatewayCharges: 0, totalAmount: settings?.priceAmount };

  if (isLoading || !settings?.isEnabled) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-serif flex items-center gap-2 text-[#1A1A1A]">
          <CalendarHeart size={20} className="text-[#D4A843]" />
          SNGS Alliance Meet
        </CardTitle>
        <CardDescription className="font-sans text-[#2C3E50]/70">
          Opt in for the upcoming SNGS Alliance Meet — a chance to meet the community in person.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 bg-[#FDF8F0] border border-[#D4A843]/20 rounded-lg">
          <div>
            <p className="font-serif text-2xl text-[#1A1A1A]">{formatRupees(settings.priceAmount)}</p>
            <p className="font-sans text-xs text-[#2C3E50]/60 mt-0.5">
              Per registration
              {pricing.gatewayCharges > 0 && ` · + ${formatRupees(pricing.gatewayCharges)} payment gateway charges (incl. GST)`}
            </p>
          </div>
          {awaitingApproval && !myRegistration?.registered ? (
            <Button disabled className="font-sans font-semibold" title="Available once your profile is approved">
              <CalendarHeart className="mr-2 h-4 w-4" />
              Available after approval
            </Button>
          ) : myRegistration?.registered ? (
            <div className="flex items-center gap-2 px-4 h-11 rounded-lg bg-green-50 border border-green-200 text-[#2E7D32] font-sans font-semibold text-sm">
              <CheckCircle2 className="h-4 w-4" />
              You&apos;re registered
            </div>
          ) : (
            <Button
              onClick={handleRegister}
              disabled={isCreatingOrder}
              className="bg-[#D4A843] hover:bg-[#B8860B] text-[#1A1A1A] font-sans font-semibold"
            >
              {isCreatingOrder ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CalendarHeart className="mr-2 h-4 w-4" />}
              {isCreatingOrder ? 'Starting...' : 'Register Now'}
            </Button>
          )}
        </div>
      </CardContent>
      <PaymentTermsDialog
        open={showTerms}
        onOpenChange={setShowTerms}
        itemName="SNGS Alliance Meet registration"
        pricing={pricing}
        terms={ALLIANCE_MEET_TERMS}
        busy={isCreatingOrder}
        onAgree={startPayment}
      />
    </Card>
  );
}
