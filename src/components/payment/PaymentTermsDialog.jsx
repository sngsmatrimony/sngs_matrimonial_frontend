'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Loader2, Lock, ShieldCheck } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { formatRupees } from '@/lib/money';

/**
 * Shown before every payment: what is being bought, the full price breakdown
 * (incl. payment gateway charges) and the key terms. Payment starts only
 * after the member ticks the agreement — the server checks it too
 * (`acceptTerms: true` on every create-order call).
 *
 * @param {boolean} open
 * @param {(open: boolean) => void} onOpenChange
 * @param {string} itemName      e.g. "Basic Plan — 500 credits, 180 days"
 * @param {{ baseAmount: number, gatewayCharges: number, totalAmount: number }} pricing
 * @param {string[]} [terms]     purchase-specific points shown first
 * @param {() => Promise<void>|void} onAgree  starts the payment
 * @param {boolean} [busy]
 */
export default function PaymentTermsDialog({ open, onOpenChange, itemName, pricing, terms = [], onAgree, busy = false }) {
  const [agreed, setAgreed] = useState(false);

  const handleOpenChange = (next) => {
    if (busy) return;
    if (!next) setAgreed(false);
    onOpenChange(next);
  };

  const total = Number(pricing?.totalAmount) || 0;
  const charges = Number(pricing?.gatewayCharges) || 0;
  const chargesPercent = total > 0 && charges > 0 ? `${((charges / total) * 100).toFixed(2)}%` : null;

  const allTerms = [
    ...terms,
    `Payment gateway charges${chargesPercent ? ` (${chargesPercent} — Razorpay fee + GST)` : ''} are added to the price and are not refundable (except automatic refunds of payments that could not be applied).`,
    'Refunds, if any, are handled as per our Cancellation & Refund Policy.',
    'Payments are processed securely by Razorpay. SNGS Matrimony never sees your card, UPI or bank details.',
  ];

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent className="font-sans max-h-[90vh] overflow-y-auto">
        <AlertDialogHeader>
          <AlertDialogTitle className="font-serif text-2xl text-[#1A1A1A]">Before you pay</AlertDialogTitle>
          <AlertDialogDescription className="text-[15px] text-[#2C3E50]">
            Please review your purchase and the payment terms.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <dl className="rounded-xl bg-[#FDF8F0] border border-[#D4A843]/25 p-4 space-y-2 text-[15px]">
          <div className="flex justify-between gap-4">
            <dt className="text-[#2C3E50]">{itemName}</dt>
            <dd className="text-[#1A1A1A] tabular-nums shrink-0">{formatRupees(pricing?.baseAmount)}</dd>
          </div>
          {charges > 0 && (
            <div className="flex justify-between gap-4">
              <dt className="text-[#2C3E50]">Payment gateway charges (incl. GST)</dt>
              <dd className="text-[#1A1A1A] tabular-nums shrink-0">{formatRupees(charges)}</dd>
            </div>
          )}
          <div className="flex justify-between gap-4 pt-2 border-t border-[#D4A843]/25 font-semibold">
            <dt className="text-[#1A1A1A]">Total to pay</dt>
            <dd className="text-[#1A1A1A] tabular-nums shrink-0">{formatRupees(total)}</dd>
          </div>
        </dl>

        <div>
          <h3 className="font-sans text-sm font-semibold text-[#1A1A1A] mb-2">Payment terms</h3>
          <ul className="space-y-1.5 text-sm leading-relaxed text-[#2C3E50] list-disc pl-5">
            {allTerms.map((t) => <li key={t}>{t}</li>)}
          </ul>
        </div>

        {/* Kept in view while the terms scroll on small screens. */}
        <div className="sticky -bottom-6 -mx-6 -mb-6 px-6 pt-3 pb-4 bg-white border-t border-[#D4A843]/20 space-y-3">
        <label className="flex items-start gap-3 rounded-xl border border-[#D4A843]/40 bg-white p-3 cursor-pointer">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            disabled={busy}
            className="mt-0.5 h-5 w-5 shrink-0 accent-[#B8860B] cursor-pointer"
          />
          <span className="text-sm leading-relaxed text-[#1A1A1A]">
            I have read and agree to the{' '}
            <Link href="/terms-and-conditions" target="_blank" className="font-medium text-[#B8860B] underline underline-offset-2">Terms &amp; Conditions</Link>,{' '}
            <Link href="/privacy-policy" target="_blank" className="font-medium text-[#B8860B] underline underline-offset-2">Privacy Policy</Link> and{' '}
            <Link href="/cancellation-and-refund" target="_blank" className="font-medium text-[#B8860B] underline underline-offset-2">Cancellation &amp; Refund Policy</Link>.
          </span>
        </label>

        <AlertDialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={busy}
            className="h-11 border-2 border-[#D4A843] text-[#1A1A1A] hover:bg-[#F5E6C3]/40"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={onAgree}
            disabled={!agreed || busy}
            className="h-11 bg-[#D4A843] hover:bg-[#B8860B] text-[#1A1A1A] font-semibold"
          >
            {busy
              ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Starting payment...</>
              : <><Lock className="mr-2 h-4 w-4" />Agree &amp; Pay {formatRupees(total)}</>}
          </Button>
        </AlertDialogFooter>
        <p className="flex items-center justify-center gap-1.5 text-xs text-[#2C3E50]/60">
          <ShieldCheck className="w-3.5 h-3.5" strokeWidth={1.75} /> Secured by Razorpay
        </p>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
