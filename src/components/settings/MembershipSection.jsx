'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CreditCard, ShoppingBag, CheckCircle2, Receipt } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useEnforcementStatus } from '@/hooks/useEnforcementStatus';

// Same semantics as membership/purchase/page.js's buildFeatureBullets, but
// phrased for a plan the member already has rather than one they're
// considering — see creditCost.service.js for what each activity cost
// actually gates.
function costLine(label, entry) {
  if (!entry || entry.unlimited || !entry.cost) return `${label}: free, unlimited`;
  return `${label}: ${entry.cost} credit${entry.cost === 1 ? '' : 's'} per use`;
}

function buildActivePerks(plan) {
  const costs = plan?.costs || {};
  const perks = [
    costLine('Viewing a profile', costs.profileView),
    costLine('Phone number & chat', costs.phoneAndChat),
    costLine('Downloading a profile', costs.profileDownload),
  ];
  return perks;
}

export default function MembershipSection() {
  const router = useRouter();
  const { membership, refreshMembership } = useAuthStore();
  const enforcementActive = useEnforcementStatus();
  const isPromotional = !enforcementActive;
  const [loading, setLoading] = useState(true);

  // The store's `membership` may only hold the lightweight shape set at
  // login (a bare planId, no name/features) — refetch here so the plan's
  // name and feature toggles are always populated when this section mounts.
  useEffect(() => {
    refreshMembership().finally(() => setLoading(false));
  }, [refreshMembership]);

  const plan = membership?.planId;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-serif flex items-center gap-2 text-[#1A1A1A]">
          <CreditCard size={20} className="text-[#D4A843]" />
          Membership &amp; Credits
        </CardTitle>
        <CardDescription className="font-sans text-[#2C3E50]/70">
          Manage your subscription and credits
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {loading ? (
          <div className="py-8 text-center font-sans text-sm text-[#2C3E50]/60">Loading membership details...</div>
        ) : isPromotional ? (
          <div className="text-center py-8">
            <Badge className="bg-[#2E7D32] text-white font-sans text-sm px-4 py-1 mb-4">Promotional Period</Badge>
            <h3 className="font-serif text-xl text-[#1A1A1A] mb-2">
              All Features Are Free!
            </h3>
            <p className="font-sans text-[#2C3E50]/70">
              Enjoy unlimited access to all profiles during our promotional period.
            </p>
          </div>
        ) : membership?.isActive && !membership?.isExpired ? (
          <>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="font-serif text-lg font-semibold text-[#1A1A1A]">
                {plan?.name || 'Your Plan'}
              </h3>
              <Badge className="bg-[#2E7D32] text-white font-sans">Active</Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border border-[#D4A843]/20 rounded-lg">
                <p className="font-sans text-sm text-[#2C3E50]/70 mb-1">Credits Remaining</p>
                <p className="font-serif text-3xl text-[#1A1A1A]">{membership?.credits}</p>
              </div>
              <div className="p-4 border border-[#D4A843]/20 rounded-lg">
                <p className="font-sans text-sm text-[#2C3E50]/70 mb-1">Expiry Date</p>
                <p className="font-sans text-lg text-[#1A1A1A]">
                  {membership?.expiryDate ? new Date(membership.expiryDate).toLocaleDateString() : 'Never expires'}
                </p>
              </div>
            </div>

            {/* What this plan actually costs per activity — mirrors the
                admin's own Credit Costs panel for this plan, so a member can
                see exactly what they're entitled to, not just a credit count. */}
            <div className="p-4 bg-[#FDF8F0] border border-[#D4A843]/20 rounded-lg space-y-2">
              <p className="font-sans text-xs font-semibold uppercase tracking-wide text-[#2C3E50]/60">
                What your plan includes
              </p>
              {buildActivePerks(plan).map((perk) => (
                <div key={perk} className="flex items-start gap-2 font-sans text-sm text-[#1A1A1A]">
                  <CheckCircle2 className="w-4 h-4 text-[#2E7D32] shrink-0 mt-0.5" />
                  <span>{perk}</span>
                </div>
              ))}
            </div>

            <p className="font-sans text-sm text-[#2C3E50]/80 leading-relaxed">
              {membership?.expiryDate
                ? `Running low? Buy more credits any time before ${new Date(membership.expiryDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} — they're added to this plan and expire with it. When the plan ends, unused credits and unlocked profiles reset.`
                : 'Running low? Buy more credits any time — they are added to this plan.'}
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={() => router.push('/membership/purchase#credits')}
                className="w-full sm:w-auto h-12 bg-[#D4A843] hover:bg-[#B8860B] text-[#1A1A1A] font-sans font-semibold"
              >
                <ShoppingBag className="mr-2 h-4 w-4" />
                Buy More Credits
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push('/transactions')}
                className="w-full sm:w-auto h-12 border-[#2C3E50]/20 text-[#1A1A1A] font-sans font-semibold"
              >
                <Receipt className="mr-2 h-4 w-4" />
                View Purchase History
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <CreditCard className="w-16 h-16 text-[#2C3E50]/30 mx-auto mb-4" />
            <h3 className="font-serif text-xl text-[#1A1A1A] mb-2">
              {membership?.isExpired ? 'Membership Expired' : 'No Active Membership'}
            </h3>
            <p className="font-sans text-[#2C3E50]/70 mb-4">
              {membership?.isExpired
                ? 'Your plan has ended, so its credits and unlocked profiles have reset. Choose a plan to continue viewing full profiles.'
                : 'Searching is free. Choose a plan to view full profiles, contact matches and chat.'}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={() => router.push('/membership/purchase')}
                className="bg-[#D4A843] hover:bg-[#B8860B] text-[#1A1A1A] font-sans font-semibold"
              >
                View Membership Plans
              </Button>
              {membership?.isExpired && (
                <Button
                  variant="outline"
                  onClick={() => router.push('/transactions')}
                  className="border-[#2C3E50]/20 text-[#1A1A1A] font-sans font-semibold"
                >
                  <Receipt className="mr-2 h-4 w-4" />
                  View Purchase History
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
