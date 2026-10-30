'use client';

import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ScrollText } from 'lucide-react';
import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { adminApi } from '@/lib/api/admin';
import { toastError, toastSuccess } from '@/lib/toast';

/**
 * Admin Settings → "Horoscope Documents". Off: members never see another
 * member's horoscope document (admins always can). On: members can view and
 * download a member's horoscope after paying this one-time fee per profile
 * (plus payment-gateway charges, like every payment).
 */
export default function HoroscopeSettingsSection() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['adminHoroscopeSettings'],
    queryFn: async () => (await adminApi.getHoroscopeSettings()).data.data,
  });

  const [visible, setVisible] = useState(false);
  const [fee, setFee] = useState('99');

  useEffect(() => {
    if (!data) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- seeding editable form state from server data
    setVisible(!!data.visibleToMembers);
    setFee(String(data.feeAmount ?? 99));
  }, [data]);

  const save = useMutation({
    mutationFn: (payload) => adminApi.updateHoroscopeSettings(payload),
    onSuccess: (_res, payload) => {
      queryClient.invalidateQueries({ queryKey: ['adminHoroscopeSettings'] });
      toastSuccess(payload.visibleToMembers === undefined
        ? 'Horoscope fee saved'
        : payload.visibleToMembers ? 'Members can now buy access to horoscopes' : 'Horoscopes are now hidden from members');
    },
    onError: (error) => {
      toastError(error.response?.data?.message || 'Failed to save horoscope settings');
      queryClient.invalidateQueries({ queryKey: ['adminHoroscopeSettings'] });
    },
  });

  const toggle = () => {
    const next = !visible;
    setVisible(next);
    save.mutate({ visibleToMembers: next });
  };

  const saveFee = () => {
    const amount = Number(fee);
    if (!Number.isFinite(amount) || amount < 1) {
      toastError('The fee must be at least ₹1 (Razorpay’s minimum).');
      return;
    }
    save.mutate({ feeAmount: amount });
  };

  return (
    <AccordionItem value="horoscope" className="border rounded-lg bg-white shadow-sm">
      <AccordionTrigger className="px-6 py-4 hover:no-underline">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
            <ScrollText size={20} className="text-primary" />
          </div>
          <div className="text-left">
            <h3 className="font-serif text-lg text-secondary">Horoscope Documents</h3>
            <p className="font-sans text-sm text-gray-500">Let members view &amp; download horoscopes for a one-time fee</p>
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-6 pb-6">
        {isLoading ? (
          <p className="font-sans text-sm text-gray-500">Loading...</p>
        ) : (
          <>
            <div className="flex items-start justify-between gap-6 p-4 rounded-lg border border-[#D4A843]/15 bg-gradient-to-br from-[#FDF8F0] to-[#F5E6C3]/30 mb-4">
              <div>
                <Label className="font-sans text-[#1A1A1A]">
                  {visible ? 'Visible to members (paid)' : 'Hidden from members'}
                </Label>
                <p className="text-xs text-[#2C3E50]/60 font-sans mt-1 max-w-md leading-relaxed">
                  {visible
                    ? 'Members see that a horoscope is available and can view and download it after paying the one-time fee below for that profile.'
                    : 'Members cannot see other members’ horoscope documents. Admins always can, and members always see their own. Members who already paid keep their access.'}
                  {' '}Nakshatra, Raasi and birth details are always shown.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={visible}
                aria-label="Horoscope documents visible to members"
                onClick={toggle}
                disabled={save.isPending}
                className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 ${
                  visible ? 'bg-[#D4A843]' : 'bg-[#2C3E50]/20'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                    visible ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="space-y-2">
              <Label htmlFor="horoscope-fee" className="font-sans text-sm">One-time fee per horoscope (₹)</Label>
              <div className="flex gap-2">
                <Input
                  id="horoscope-fee"
                  type="number"
                  min="1"
                  value={fee}
                  onChange={(e) => setFee(e.target.value)}
                  className="font-sans max-w-40"
                />
                <Button
                  type="button"
                  onClick={saveFee}
                  disabled={save.isPending}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-sans"
                >
                  Save Fee
                </Button>
              </div>
              <p className="text-xs text-[#2C3E50]/60 font-sans">
                Payment-gateway charges are added on top, as for plans and credit packs. The member pays once per profile.
              </p>
            </div>
          </>
        )}
      </AccordionContent>
    </AccordionItem>
  );
}
