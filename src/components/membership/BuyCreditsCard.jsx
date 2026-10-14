'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Coins, Lock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { client } from '@/lib/api/client';
import { toastError, toastInfo } from '@/lib/toast';
import { formatDate, formatRupees } from '@/lib/money';

/**
 * "Buy More Credits" — top-up packs for a member whose plan is active.
 * Credits are added to the current plan and expire with it; the price shown
 * includes the payment gateway charges (incl. GST), as quoted by the server.
 */
export default function BuyCreditsCard({ id = 'credits' }) {
  const router = useRouter();
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState('');
  const [buying, setBuying] = useState(false);

  useEffect(() => {
    let cancelled = false;
    client.get('/api/membership/credit-packs')
      .then((res) => {
        if (cancelled) return;
        const data = res.data.data;
        setInfo(data);
        if (data?.packs?.length) setSelected(String(data.packs[0].credits));
      })
      .catch(() => { if (!cancelled) toastError('Could not load credit packs'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  // Links like /membership/purchase#credits land here; the card renders
  // after its data loads, so scroll once it's actually on the page.
  useEffect(() => {
    if (loading || typeof window === 'undefined' || window.location.hash !== `#${id}`) return;
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [loading, id]);

  const pack = useMemo(
    () => info?.packs?.find((p) => String(p.credits) === selected) || null,
    [info, selected]
  );

  const handleBuy = async () => {
    if (!pack) return;
    setBuying(true);
    try {
      toastInfo('Creating payment order...');
      const res = await client.post('/api/membership/create-credit-order', { credits: pack.credits });
      router.push(`/payment/${res.data.data.orderId}`);
    } catch (error) {
      toastError(error.response?.data?.message || 'Could not start the payment. Please try again.');
      setBuying(false);
    }
  };

  if (loading) {
    return (
      <Card id={id} className="border-2 border-[#D4A843]/30">
        <CardContent className="py-10 flex justify-center">
          <Loader2 className="w-6 h-6 text-[#D4A843] animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (!info?.enabled || !info?.packs?.length) return null;

  return (
    <Card id={id} className="border-2 border-[#D4A843]/40 scroll-mt-28">
      <CardHeader>
        <CardTitle className="font-serif text-2xl text-[#1A1A1A] flex items-center gap-2">
          <Coins className="w-6 h-6 text-[#D4A843]" />
          Buy More Credits
        </CardTitle>
        <CardDescription className="font-sans text-[15px] text-[#2C3E50]/80 leading-relaxed">
          {info.canBuy
            ? info.expiryDate
              ? `Credits are added to your current plan and can be used until it ends on ${formatDate(info.expiryDate)}. Any credits left at that point expire with the plan.`
              : 'Credits are added to your current plan, which has no expiry date.'
            : 'Credit packs are available while you have an active plan. Choose a plan first.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <label htmlFor="credit-pack" className="block font-sans text-sm font-medium text-[#1A1A1A]">
            Number of credits
          </label>
          <Select value={selected} onValueChange={setSelected} disabled={!info.canBuy || buying}>
            <SelectTrigger id="credit-pack" className="h-12 rounded-xl font-sans text-[15px]">
              <SelectValue placeholder="Choose a pack" />
            </SelectTrigger>
            <SelectContent>
              {info.packs.map((p) => (
                <SelectItem key={p.credits} value={String(p.credits)} className="font-sans">
                  {p.credits} credits — {formatRupees(p.baseAmount)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {pack && (
          <dl className="rounded-xl bg-[#FDF8F0] border border-[#D4A843]/20 p-4 space-y-2 font-sans text-[15px]">
            <div className="flex justify-between">
              <dt className="text-[#2C3E50]">{pack.credits} credits</dt>
              <dd className="text-[#1A1A1A] tabular-nums">{formatRupees(pack.baseAmount)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[#2C3E50]">Payment gateway charges (incl. GST)</dt>
              <dd className="text-[#1A1A1A] tabular-nums">{formatRupees(pack.gatewayCharges)}</dd>
            </div>
            <div className="flex justify-between pt-2 border-t border-[#D4A843]/20 font-semibold">
              <dt className="text-[#1A1A1A]">You pay</dt>
              <dd className="text-[#1A1A1A] tabular-nums">{formatRupees(pack.totalAmount)}</dd>
            </div>
          </dl>
        )}

        <Button
          onClick={handleBuy}
          disabled={!info.canBuy || !pack || buying}
          className="w-full h-12 bg-[#D4A843] hover:bg-[#B8860B] text-[#1A1A1A] font-sans font-semibold text-base"
        >
          {buying ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Processing...</>
          ) : (
            <><Lock className="mr-2 h-4 w-4" />{pack ? `Buy ${pack.credits} Credits — ${formatRupees(pack.totalAmount)}` : 'Buy Credits'}</>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
