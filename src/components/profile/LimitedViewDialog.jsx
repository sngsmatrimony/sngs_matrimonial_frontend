'use client';

import { Eye, Sparkles, Lock } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

// [what, examples] — the examples are the fields the limited view really
// shows (or keeps locked), so members know exactly what they'll get.
const SHOWN = [
  ['About', 'In their own words'],
  ['Personal details', 'Age, height, religion, caste, mother tongue, diet'],
  ['Education', 'Highest qualification, e.g. B.Tech, MBA'],
  ['Horoscope', 'Nakshatra, raasi, birth details, dosham'],
  ['Partner preferences', 'Preferred age range, what they look for, interests'],
];
const LOCKED = [
  ['Name and photos', 'Full name, clear photos'],
  ['Family', 'Parents, their occupations, family status'],
  ['Career', 'Job, employment type, income'],
  ['Location', 'City, address, native place'],
  ['Contact & chat', 'Phone number, starting a chat'],
];

const DetailList = ({ items }) => (
  <ul className="mt-1.5 space-y-1.5 sm:space-y-2">
    {items.map(([what, examples]) => (
      <li key={what} className="font-sans leading-snug">
        <span className="block text-sm font-medium text-[#1A1A1A]">{what}</span>
        <span className="block text-xs text-[#2C3E50]/70">{examples}</span>
      </li>
    ))}
  </ul>
);

/**
 * Opening a profile that isn't unlocked, without a plan (paid features on):
 * "you can see only limited details" — Continue to the free limited view, or
 * upgrade to a plan.
 */
export default function LimitedViewDialog({ open, onContinue, onUpgrade, onCancel, upgradeLabel = 'Upgrade Plan' }) {
  return (
    <AlertDialog open={open} onOpenChange={(next) => { if (!next) onCancel(); }}>
      {/* On short phone screens only the two lists scroll: the title and the
          Continue / Upgrade buttons always stay in view. */}
      <AlertDialogContent className="font-sans flex flex-col overflow-hidden gap-3 sm:gap-4 p-5 sm:p-6">
        <AlertDialogHeader className="shrink-0">
          <AlertDialogTitle className="font-serif text-xl text-[#1A1A1A]">You can see limited details</AlertDialogTitle>
          <AlertDialogDescription className="font-sans text-[15px] text-[#2C3E50] leading-relaxed">
            Without a plan you can see only some of this profile, for free. Choose a plan to see everything.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="min-h-0 overflow-y-auto overscroll-contain grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="rounded-xl border border-[#2E7D32]/25 bg-[#2E7D32]/5 p-3">
            <p className="flex items-center gap-1.5 font-sans text-xs font-semibold uppercase tracking-wide text-[#2E7D32]">
              <Eye size={13} aria-hidden="true" />
              Free
            </p>
            <DetailList items={SHOWN} />
          </div>
          <div className="rounded-xl border border-[#D4A843]/35 bg-[#F5E6C3]/35 p-3">
            <p className="flex items-center gap-1.5 font-sans text-xs font-semibold uppercase tracking-wide text-[#B8860B]">
              <Lock size={13} aria-hidden="true" />
              With a plan
            </p>
            <DetailList items={LOCKED} />
          </div>
        </div>
        <AlertDialogFooter className="shrink-0 gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onContinue}
            className="h-11 border-2 border-[#D4A843] text-[#1A1A1A] bg-transparent hover:bg-[#F5E6C3]/40 font-sans font-semibold"
          >
            <Eye className="w-4 h-4 mr-2" aria-hidden="true" />
            Continue
          </Button>
          <Button
            type="button"
            onClick={onUpgrade}
            className="h-11 bg-[#D4A843] hover:bg-[#B8860B] text-[#1A1A1A] font-sans font-semibold"
          >
            <Sparkles className="w-4 h-4 mr-2" aria-hidden="true" />
            {upgradeLabel}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
