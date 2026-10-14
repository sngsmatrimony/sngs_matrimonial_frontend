'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Coins, Plus, Trash2, Loader2, Save } from 'lucide-react';
import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { adminApi } from '@/lib/api/admin';
import { toastError, toastSuccess } from '@/lib/toast';
import { formatRupees } from '@/lib/money';

// Same formula as the backend's pricing.service.js — preview only; the
// server always computes the real amount charged.
function memberPays(price, feePercent, gstPercent) {
  const base = Number(price);
  if (!Number.isFinite(base) || base <= 0) return null;
  const rate = (Number(feePercent) / 100) * (1 + Number(gstPercent) / 100);
  if (!(rate >= 0 && rate < 1)) return null;
  return Math.ceil((Math.round(base * 100)) / (1 - rate)) / 100;
}

/**
 * Admin Settings → "Credit Packs & Gateway Charges". Packs are what an
 * active member can top up with (credits expire with their plan); the
 * gateway fee + GST is added to every plan and pack payment.
 */
export default function PaymentSettingsSection() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['adminPaymentSettings'],
    queryFn: async () => (await adminApi.getPaymentSettings()).data.data,
  });

  const [enabled, setEnabled] = useState(true);
  const [fee, setFee] = useState('2');
  const [gst, setGst] = useState('18');
  const [packs, setPacks] = useState([]);

  useEffect(() => {
    if (!data) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- seeding editable form state from server data
    setEnabled(!!data.creditPacksEnabled);
    setFee(String(data.gatewayFeePercent));
    setGst(String(data.gstOnFeePercent));
    setPacks(data.creditPacks.map((p) => ({ credits: String(p.credits), price: String(p.price) })));
  }, [data]);

  const save = useMutation({
    mutationFn: (payload) => adminApi.updatePaymentSettings(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminPaymentSettings'] });
      toastSuccess('Credit packs and charges saved');
    },
    onError: (error) => toastError(error.response?.data?.message || 'Failed to save'),
  });

  const exampleTotal = useMemo(() => memberPays(99, fee, gst), [fee, gst]);

  const updatePack = (index, field, value) => {
    setPacks((prev) => prev.map((p, i) => (i === index ? { ...p, [field]: value } : p)));
  };

  const handleSave = () => {
    save.mutate({
      creditPacksEnabled: enabled,
      gatewayFeePercent: Number(fee),
      gstOnFeePercent: Number(gst),
      creditPacks: packs.map((p) => ({ credits: Number(p.credits), price: Number(p.price) })),
    });
  };

  return (
    <AccordionItem value="payments" className="border rounded-lg bg-white shadow-sm">
      <AccordionTrigger className="px-6 py-4 hover:no-underline">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
            <Coins size={20} className="text-primary" />
          </div>
          <div className="text-left">
            <h3 className="font-serif text-lg text-secondary">Credit Packs &amp; Gateway Charges</h3>
            <p className="font-sans text-sm text-gray-500">Top-up packs for active members, and the payment charges added to every purchase</p>
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-6 pb-6">
        {isLoading ? (
          <p className="font-sans text-sm text-gray-500">Loading...</p>
        ) : (
          <div className="space-y-6">
            <div className="flex items-start justify-between gap-6 p-4 rounded-lg border border-[#D4A843]/15 bg-gradient-to-br from-[#FDF8F0] to-[#F5E6C3]/30">
              <div>
                <Label className="font-sans text-[#1A1A1A]">
                  {enabled ? 'Credit packs available' : 'Credit packs hidden'}
                </Label>
                <p className="text-xs text-[#2C3E50]/60 font-sans mt-1 max-w-md">
                  Only members with an active plan can buy packs. Pack credits are added to the
                  plan and expire with it; when the plan ends, unused credits reset.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={enabled}
                aria-label="Credit packs available"
                onClick={() => setEnabled((v) => !v)}
                className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors ${enabled ? 'bg-[#D4A843]' : 'bg-[#2C3E50]/20'}`}
              >
                <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>

            <div>
              <p className="font-sans text-sm font-semibold text-[#1A1A1A] mb-2">Payment gateway charges (paid by the member)</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="gateway-fee" className="font-sans text-sm">Gateway fee (%)</Label>
                  <Input id="gateway-fee" type="number" min="0" max="10" step="0.01" value={fee} onChange={(e) => setFee(e.target.value)} className="font-sans" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="gst-on-fee" className="font-sans text-sm">GST on the fee (%)</Label>
                  <Input id="gst-on-fee" type="number" min="0" max="50" step="0.01" value={gst} onChange={(e) => setGst(e.target.value)} className="font-sans" />
                </div>
              </div>
              {exampleTotal !== null && (
                <p className="font-sans text-xs text-[#2C3E50]/70 mt-2">
                  Example: a ₹99 purchase is charged {formatRupees(exampleTotal)}, so you receive ₹99 after Razorpay&apos;s fee and GST.
                </p>
              )}
            </div>

            <div>
              <p className="font-sans text-sm font-semibold text-[#1A1A1A] mb-2">Credit packs</p>
              <div className="rounded-lg border border-[#D4A843]/20 overflow-hidden">
                <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 px-3 py-2 bg-[#FDF8F0] font-sans text-xs font-semibold text-[#2C3E50]/70">
                  <span>Credits</span>
                  <span>Price (₹)</span>
                  <span>Member pays</span>
                  <span className="sr-only">Remove</span>
                </div>
                {packs.map((pack, index) => {
                  const total = memberPays(pack.price, fee, gst);
                  return (
                    <div key={index} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 px-3 py-2 items-center border-t border-[#D4A843]/10">
                      <Input
                        type="number"
                        min="1"
                        aria-label={`Credits in pack ${index + 1}`}
                        value={pack.credits}
                        onChange={(e) => updatePack(index, 'credits', e.target.value)}
                        className="font-sans h-9"
                      />
                      <Input
                        type="number"
                        min="1"
                        step="0.01"
                        aria-label={`Price of pack ${index + 1}`}
                        value={pack.price}
                        onChange={(e) => updatePack(index, 'price', e.target.value)}
                        className="font-sans h-9"
                      />
                      <span className="font-sans text-sm text-[#1A1A1A] tabular-nums">{total !== null ? formatRupees(total) : '—'}</span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setPacks((prev) => prev.filter((_, i) => i !== index))}
                        disabled={packs.length <= 1}
                        className="font-sans text-[#C75B39]"
                      >
                        <Trash2 size={14} className="mr-1" />
                        Remove
                      </Button>
                    </div>
                  );
                })}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-3 font-sans"
                disabled={packs.length >= 20}
                onClick={() => {
                  const last = packs[packs.length - 1];
                  const credits = (Number(last?.credits) || 0) + 100;
                  setPacks((prev) => [...prev, { credits: String(credits), price: String(credits - 1) }]);
                }}
              >
                <Plus size={14} className="mr-1" />
                Add Pack
              </Button>
            </div>

            <Button
              type="button"
              onClick={handleSave}
              disabled={save.isPending}
              className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground font-sans"
            >
              {save.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : <><Save className="mr-2 h-4 w-4" />Save Changes</>}
            </Button>
          </div>
        )}
      </AccordionContent>
    </AccordionItem>
  );
}
