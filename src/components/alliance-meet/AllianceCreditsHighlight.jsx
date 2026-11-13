'use client';

import { Gift, CheckCircle2 } from 'lucide-react';
import { useProfileDownloadsEnabled } from '@/hooks/useProfileDownloadsEnabled';

const ACTIONS = [
  ['profileView', 'Viewing a profile'],
  ['phoneAndChat', 'Unlocking phone number & chat'],
  ['profileDownload', 'Downloading a profile'],
];
const creditsText = (n) => (n > 0 ? `${n} credit${n === 1 ? '' : 's'}` : 'free');
// Downloading is listed only while profile downloads are switched on (admin).
const actionsFor = (downloads) => ACTIONS.filter(([key]) => downloads || key !== 'profileDownload');

/** Plain-text lines for the payment terms dialog. */
export function allianceCreditTerms(freeCredits, costs, { downloads = true } = {}) {
  if (!(freeCredits > 0)) return [];
  return [
    `Includes ${freeCredits} free credits — no plan needed. Each action uses: ${actionsFor(downloads).map(([k, label]) => `${label.toLowerCase()} ${creditsText(costs?.[k] ?? 0)}`).join('; ')}.`,
    'The free credits do not expire. Once they are used up, choose a membership plan to continue; if you buy a plan earlier, your leftover free credits are added to it.',
  ];
}

/**
 * "You get N free credits" — shown wherever the Alliance Meet is offered,
 * with what each action costs, so members know exactly what they get and
 * what happens when the credits run out. `compact` = one line (banner).
 */
export default function AllianceCreditsHighlight({ freeCredits, costs, compact = false, className = '' }) {
  const downloads = useProfileDownloadsEnabled();
  if (!(freeCredits > 0)) return null;
  const viewCost = costs?.profileView ?? 0;
  const views = viewCost > 0 ? Math.floor(freeCredits / viewCost) : null;

  if (compact) {
    return (
      <p className={`flex items-start gap-1.5 font-sans text-sm text-[#1A1A1A] ${className}`}>
        <Gift className="w-4 h-4 shrink-0 mt-0.5 text-[#B8860B]" strokeWidth={2} aria-hidden="true" />
        <span>
          <span className="font-semibold">Includes {freeCredits} free credits</span>
          {views ? ` — up to ${views} profile views` : ''}, no plan needed.
        </span>
      </p>
    );
  }

  return (
    <div className={`rounded-xl border-2 border-[#D4A843] bg-gradient-to-br from-[#FDF8F0] to-[#F5E6C3]/50 p-4 ${className}`}>
      <div className="flex items-start gap-3">
        <span className="shrink-0 w-10 h-10 rounded-full bg-[#D4A843] flex items-center justify-center">
          <Gift className="w-5 h-5 text-[#1A1A1A]" strokeWidth={2} aria-hidden="true" />
        </span>
        <div>
          <p className="font-serif text-lg font-semibold text-[#1A1A1A]">
            Includes {freeCredits} free credits
          </p>
          <p className="font-sans text-sm text-[#2C3E50]/80 leading-relaxed">
            Use them on matches right away — no plan needed{views ? ` (up to ${views} profile views)` : ''}.
          </p>
        </div>
      </div>
      <p className="mt-3 font-sans text-xs font-semibold uppercase tracking-wide text-[#2C3E50]/60">Each action uses</p>
      <ul className="mt-1.5 space-y-1.5">
        {actionsFor(downloads).map(([key, label]) => (
          <li key={key} className="flex items-start gap-2 font-sans text-sm text-[#1A1A1A]">
            <CheckCircle2 className="w-4 h-4 text-[#2E7D32] shrink-0 mt-0.5" aria-hidden="true" />
            <span>
              {label}: <span className="font-semibold">{creditsText(costs?.[key] ?? 0)}</span>
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-3 font-sans text-xs text-[#2C3E50]/75 leading-relaxed">
        Free credits never expire. When they&apos;re used up, choose a membership plan to continue — or buy one any time and your leftover credits are added to it.
      </p>
    </div>
  );
}
