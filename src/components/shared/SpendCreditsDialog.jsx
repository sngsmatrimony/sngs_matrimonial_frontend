'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Coins } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

/**
 * Confirms a credit spend before a metered activity (view a profile, unlock
 * contact & chat, download a profile) actually runs — so a member always
 * knows exactly how many credits an action costs before committing to it,
 * never finds out only after the fact.
 *
 * @param {boolean} open
 * @param {number} cost - credits this specific activity will spend
 * @param {string} activityLabel - e.g. "View this profile", "Unlock phone & chat"
 * @param {() => void} onConfirm
 * @param {() => void} onCancel
 * @param {boolean} [isLoading]
 */
export default function SpendCreditsDialog({ open, cost, activityLabel, onConfirm, onCancel, isLoading = false }) {
  const router = useRouter();
  const refreshMembership = useAuthStore((state) => state.refreshMembership);
  const [balance, setBalance] = useState(null);

  // Fresh balance every time the dialog opens — spends elsewhere (another
  // tab, an unlock on this page) would otherwise leave a stale number.
  useEffect(() => {
    if (!open) return undefined;
    let cancelled = false;
    refreshMembership()
      .then((m) => { if (!cancelled) setBalance(typeof m?.credits === 'number' ? m.credits : null); })
      .catch(() => {});
    return () => {
      cancelled = true;
      setBalance(null); // next opening waits for a fresh number again
    };
  }, [open, refreshMembership]);

  // Only the freshly fetched balance — the stored one can be stale right
  // after another unlock on the same page.
  const credits = balance;
  const notEnough = typeof credits === 'number' && credits < cost;

  return (
    <AlertDialog open={open} onOpenChange={(next) => { if (!next) onCancel(); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="font-serif flex items-center gap-2 text-[#1A1A1A]">
            <Coins className="w-5 h-5 text-[#D4A843]" />
            {notEnough ? 'Not enough credits' : 'Use credits?'}
          </AlertDialogTitle>
          <AlertDialogDescription className="font-sans">
            {activityLabel} will use{' '}
            <span className="font-semibold text-[#1A1A1A]">
              {cost} credit{cost === 1 ? '' : 's'}
            </span>
            {notEnough ? '.' : '. Continue?'}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {typeof credits === 'number' && (
          <p className="font-sans text-sm text-[#2C3E50]">
            {notEnough
              ? <>You have <span className="font-semibold">{credits}</span> credit{credits === 1 ? '' : 's'}. Buy more credits to continue.</>
              : <>You have <span className="font-semibold">{credits}</span> credit{credits === 1 ? '' : 's'}; <span className="font-semibold">{credits - cost}</span> will remain.</>}
          </p>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel} disabled={isLoading} className="font-sans">
            Cancel
          </AlertDialogCancel>
          {notEnough ? (
            <AlertDialogAction
              onClick={() => router.push('/membership/purchase')}
              className="bg-[#D4A843] hover:bg-[#B8860B] text-[#1A1A1A] font-sans"
            >
              Buy Credits
            </AlertDialogAction>
          ) : (
            <AlertDialogAction
              onClick={onConfirm}
              disabled={isLoading}
              className="bg-[#D4A843] hover:bg-[#B8860B] text-[#1A1A1A] font-sans"
            >
              {isLoading ? 'Please wait...' : 'Continue'}
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
