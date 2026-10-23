'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle2, LogOut, Lock, Shield } from 'lucide-react';
import { client } from '@/lib/api/client';
import { useAuthStore } from '@/store/authStore';
import { toastSuccess, toastError, toastInfo } from '@/lib/toast';
import { buildPlanDescription } from '@/lib/planDescription';
import BuyCreditsCard from '@/components/membership/BuyCreditsCard';
import PaymentTermsDialog from '@/components/payment/PaymentTermsDialog';
import { formatDate, formatRupees } from '@/lib/money';
import { isPlanLapsed, planIdOf } from '@/lib/membershipStatus';

// Real, plan-specific cost bullets — describes exactly what each of the 3
// metered activities (profileView, phoneAndChat, profileDownload) costs on
// THIS plan, or whether it's free/unlimited, instead of a generic claim.
// Shared phrasing between the purchase-candidate card (here) and a plan the
// member already owns (buildOwnedPlanPerks below).
function costLine(label, entry) {
  if (!entry || entry.unlimited || !entry.cost) return `${label}: free, unlimited`;
  return `${label}: ${entry.cost} credit${entry.cost === 1 ? '' : 's'} per use`;
}

function buildFeatureBullets(plan) {
  const costs = plan.costs || {};
  const bullets = [
    `${plan.credits} credits included`,
    costLine('Viewing a profile', costs.profileView),
    costLine('Phone number & chat', costs.phoneAndChat),
    costLine('Downloading a profile', costs.profileDownload),
  ];
  return bullets;
}

// What a plan the member already owns actually costs — same semantics as
// buildFeatureBullets above, phrased for an existing plan rather than one
// being considered for purchase.
function buildCurrentPlanPerks(plan) {
  const costs = plan?.costs || {};
  const perks = [
    costLine('Viewing a profile', costs.profileView),
    costLine('Phone number & chat', costs.phoneAndChat),
    costLine('Downloading a profile', costs.profileDownload),
  ];
  return perks;
}

export default function PurchaseMembershipPage() {
  const router = useRouter();
  const { user, membership, refreshMembership, logout } = useAuthStore();
  const [plans, setPlans] = useState([]);
  const [planLoading, setPlanLoading] = useState(true);
  const [processingPlanId, setProcessingPlanId] = useState(null);
  // Plan waiting for the member to accept the payment terms.
  const [termsPlan, setTermsPlan] = useState(null);
  const [showSkip, setShowSkip] = useState(false);
  // Plans can only be bought once the profile is approved — validity starts at
  // payment, so paying while the profile is in review would waste plan days
  // (the backend refuses the order too).
  const awaitingApproval = !!user && user.approvalStatus !== 'approved';

  // Fetch all membership plans from backend
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await client.get('/api/membership/plans');
        if (res.data.data && res.data.data.length > 0) {
          // Set all active plans, sorted by price
          const sortedPlans = res.data.data.sort((a, b) => a.price.amount - b.price.amount);
          setPlans(sortedPlans);
        }
      } catch (error) {
        console.error('Error fetching membership plans:', error);
        toastError('Failed to load membership plans');
      } finally {
        setPlanLoading(false);
      }
    };

    fetchPlans();
  }, []);

  // This page's `membership` otherwise comes from whatever was last set in
  // the store (e.g. the lightweight shape from login, with a bare planId and
  // no name/features) — refetch the fully-populated version so the current
  // plan's name and perks below are actually accurate, not stale or blank.
  useEffect(() => {
    // Fresh approval status too (a member approved while this tab was open
    // must not still see "Available after approval"). In this order:
    // refreshUser also writes the lightweight membership, which the
    // populated one from refreshMembership must then replace.
    (async () => {
      await useAuthStore.getState().refreshUser?.();
      await refreshMembership();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Check if user just registered
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const justRegistered = sessionStorage.getItem('justRegistered');
      if (justRegistered) {
        setShowSkip(true);
        sessionStorage.removeItem('justRegistered');
      }
    }
  }, []);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  // Buy Now first shows the payment terms; the order is created only after
  // the member agrees.
  const handlePurchase = (plan) => setTermsPlan(plan);

  const startPurchase = async (plan) => {
    setProcessingPlanId(plan._id);

    try {
      toastInfo('Creating payment order...');

      // Create Razorpay order
      const orderRes = await client.post('/api/membership/create-order', {
        planId: plan._id,
        acceptTerms: true,
      });

      const { orderId } = orderRes.data.data;

      // Redirect to dedicated payment page
      router.push(`/payment/${orderId}`);

    } catch (error) {
      console.error('Order creation error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to create order. Please try again.';

      // Provide better error message for international card restriction
      if (error.response?.data?.hasActivePlan) {
        toastError(errorMessage);
        refreshMembership();
      } else if (errorMessage.toLowerCase().includes('international')) {
        toastError('International cards are not supported. Please use a domestic Indian card or contact support.');
      } else {
        toastError(errorMessage);
      }
      setProcessingPlanId(null);
      setTermsPlan(null);
    }
  };

  // Renew mode: a member whose plan ended sees that plan first (if it is
  // still offered), with every other plan below it.
  const lapsed = isPlanLapsed(membership);
  const renewPlan = lapsed ? plans.find((p) => String(p._id) === String(planIdOf(membership))) || null : null;
  const gridPlans = renewPlan ? plans.filter((p) => p._id !== renewPlan._id) : plans;

  const renderPlanCard = (plan, renew = false) => (
    <Card
      key={plan._id}
      className={`h-full flex flex-col border-2 transition-all hover:shadow-xl ${
        plan.isDefault
          ? 'border-[#D4A843] shadow-2xl relative'
          : 'border-[#D4A843]/15 hover:border-[#D4A843]/50'
      }`}
    >
      {plan.isDefault && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <Badge className="bg-[#D4A843] text-[#1A1A1A] font-sans font-semibold px-3 py-1">
            Most Popular
          </Badge>
        </div>
      )}

      <CardHeader className="text-center pb-4">
        <CardTitle className="font-serif text-2xl font-bold text-[#1A1A1A] mb-2">
          {plan.name}
        </CardTitle>
        <CardDescription className="font-sans text-sm text-[#2C3E50]/80 leading-relaxed">
          {buildPlanDescription(plan)}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col space-y-6">
        {/* Pricing */}
        <div className="text-center py-4 bg-[#F5E6C3]/40 rounded-lg">
          <div className="font-serif text-5xl font-bold text-[#1A1A1A] mb-1">
            ₹{plan.price.amount.toLocaleString('en-IN')}
          </div>
          {plan.pricing?.gatewayCharges > 0 && (
            <p className="font-sans text-xs text-[#2C3E50]/70">
              + {formatRupees(plan.pricing.gatewayCharges)} payment gateway charges (incl. GST) ·{' '}
              <span className="font-semibold text-[#1A1A1A]">You pay {formatRupees(plan.pricing.totalAmount)}</span>
            </p>
          )}
          <p className="font-sans text-sm text-[#2C3E50]/70">
            {plan.credits} Credits
          </p>
          <p className="font-sans text-xs text-[#2C3E50]/50 mt-1">
            {plan.validityDays === null || plan.validityDays === undefined
              ? 'Unlimited validity'
              : `Valid for ${plan.validityDays} days`}
            {' · '}
            {`₹${(plan.price.amount / plan.credits).toFixed(2)}/credit`}
          </p>
        </div>

        {/* Key Features */}
        <div className="space-y-2">
          {buildFeatureBullets(plan).map((bullet) => (
            <div key={bullet} className="flex items-center gap-2 font-sans text-sm text-[#1A1A1A]">
              <CheckCircle2 className="w-4 h-4 text-[#2E7D32] shrink-0" />
              <span>{bullet}</span>
            </div>
          ))}
        </div>

        {/* Purchase Button */}
        <Button
          onClick={() => handlePurchase(plan)}
          disabled={processingPlanId !== null || awaitingApproval}
          className={`w-full h-12 font-sans font-semibold transition-all mt-auto ${
            plan.isDefault
              ? 'bg-[#D4A843] hover:bg-[#B8860B] text-[#1A1A1A] shadow-lg'
              : 'bg-[#2C3E50] hover:bg-[#1A1A1A] text-white'
          }`}
        >
          {processingPlanId === plan._id ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Lock className="mr-2 h-4 w-4" />
              {awaitingApproval
                ? 'Available after approval'
                : renew
                  ? `Renew ${plan.name}`
                  : 'Buy Now'}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );

  return (
    <>
      {/* Fixed Header */}
      <header className="border-b border-[#D4A843]/20 fixed top-0 left-0 right-0 z-50 bg-[#FDF8F0]/95 backdrop-blur-md shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          {/* Logo + Title */}
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer">
            <Image
              src="/logo_1.png"
              alt="SNGS Matrimonial Logo"
              width={48}
              height={48}
              className="h-12 w-auto rounded shadow-sm"
              style={{ width: 'auto', height: 'auto' }}
            />
            <p className="font-serif text-2xl font-bold text-[#1A1A1A] hidden sm:block">
              SNGS Matrimonial
            </p>
          </Link>

          {/* Welcome Message - Center */}
          <div className="hidden md:flex items-center gap-2 flex-1 justify-center">
            <span className="font-sans text-[#2C3E50]/70 text-sm">Welcome,</span>
            <span className="font-serif font-semibold text-[#1A1A1A]">{user?.fullName}</span>
          </div>

          {/* Credit Badge (if active) */}
          {membership?.isActive && !membership?.isExpired && (
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#F5E6C3]/70 border border-[#D4A843]/30">
              <span className="font-sans font-semibold text-sm text-[#1A1A1A]">
                {membership?.credits} credits
              </span>
            </div>
          )}

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 mx-2 rounded-lg bg-[#FBEAE5] text-[#C75B39] hover:bg-[#F5DDD5] transition-colors font-sans font-medium text-sm"
          >
            <LogOut size={18} />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* Main Content - Add pt-24 for fixed header spacing */}
      <div className="min-h-screen bg-[#FDF8F0] pt-24 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8 pt-4">
            <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-[#1A1A1A]">{renewPlan ? 'Renew Your Membership' : 'Choose Your Membership'}</h1>
            <div className="w-16 h-[3px] bg-[#D4A843] mx-auto mt-4" />
          </div>

          {/* Your Current Plan — shown regardless of active/expired/none, so
              this page always answers "what do I already have?" before
              asking the member to buy anything else. */}
          {membership?.isActive && !membership?.isExpired ? (
            <div className="max-w-xl mx-auto mb-8">
              <div className="p-4 bg-[#2E7D32]/10 border border-[#2E7D32]/30 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-5 h-5 text-[#2E7D32] shrink-0" />
                  <p className="font-sans text-sm text-[#2C3E50]">
                    <span className="font-semibold">{membership.planId?.name || 'Your plan'}</span> — {membership.credits} credits remaining
                    {membership.expiryDate ? ` (expires ${new Date(membership.expiryDate).toLocaleDateString()})` : ' (never expires)'}
                  </p>
                </div>
                {membership.planId?.costs && (
                  <ul className="pl-7 space-y-1">
                    {buildCurrentPlanPerks(membership.planId).map((perk) => (
                      <li key={perk} className="font-sans text-xs text-[#2C3E50]/70">{perk}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ) : lapsed ? (
            // Lapsed: either not yet reset (isActive + past expiry) or already
            // reset by the expiry job (isActive false, planId kept).
            <div className="max-w-xl mx-auto mb-8">
              <div className="flex items-center justify-center gap-2 p-3 bg-[#C75B39]/10 border border-[#C75B39]/30 rounded-lg">
                <Lock className="w-5 h-5 text-[#C75B39] shrink-0" />
                <p className="font-sans text-sm text-[#2C3E50]">
                  Your <span className="font-semibold">{membership.planId?.name || 'membership'}</span> plan has expired, so its leftover credits have lapsed and your unlocked profiles are locked for now.{' '}
                  {planLoading
                    ? ''
                    : renewPlan
                      ? 'Renew it below — or choose another plan — and every profile you unlocked opens again at no extra cost.'
                      : 'That plan is no longer offered — choose one of the plans below and every profile you unlocked opens again at no extra cost.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="max-w-xl mx-auto mb-8">
              <div className="flex items-center justify-center gap-2 p-3 bg-[#F5E6C3]/40 border border-[#D4A843]/20 rounded-lg">
                <p className="font-sans text-sm text-[#2C3E50]/70">
                  You don&apos;t have an active plan yet — choose one below to get started.
                </p>
              </div>
            </div>
          )}

          {awaitingApproval && (
            <div className="max-w-xl mx-auto mb-8" role="status">
              <div className="flex items-start gap-2 p-4 bg-[#2C3E50]/5 border border-[#2C3E50]/20 rounded-lg">
                <Lock className="w-5 h-5 text-[#2C3E50] shrink-0 mt-0.5" />
                <p className="font-sans text-sm text-[#2C3E50]">
                  {user.approvalStatus === 'rejected'
                    ? 'Your profile needs changes before it can be approved. Please update it from My Profile — plans can be bought once it is approved.'
                    : 'Your profile is being reviewed by our team. You can buy a plan as soon as it is approved, so none of your plan days are used up while you wait.'}
                </p>
              </div>
            </div>
          )}

          {/* Simple Value Proposition */}
          <div className="text-center mb-12">
            <p className="font-sans text-[#2C3E50]/70">
              Credits are spent on viewing a profile, unlocking phone &amp; chat, or downloading a profile —
              each plan below sets its own cost per activity. Anything you unlock stays yours: re-opening it is always free while you have an active plan — including after you renew.
            </p>
          </div>

          {/* While a plan is active, members top up with credit packs (which
              expire with the plan); new plans unlock once it ends. */}
          {membership?.isActive && !membership?.isExpired ? (
            <div className="max-w-xl mx-auto mb-16 space-y-4">
              <BuyCreditsCard />
              <p className="font-sans text-sm text-center text-[#2C3E50]/70">
                {membership.expiryDate
                  ? `New plans can be bought after your current plan ends on ${formatDate(membership.expiryDate)}.`
                  : 'Your current plan has no expiry date.'}
              </p>
            </div>
          ) : planLoading ? (
            <div className="max-w-5xl mx-auto mb-16">
              <div className="flex flex-col items-center justify-center gap-4 py-12">
                <Loader2 className="w-8 h-8 text-[#D4A843] animate-spin" />
                <p className="font-sans text-[#2C3E50]/70">Loading membership plans...</p>
              </div>
            </div>
          ) : plans.length > 0 ? (
            <div className="max-w-6xl mx-auto mb-16">
              {renewPlan && (
                <section aria-labelledby="renew-heading" className="mb-10">
                  <h2 id="renew-heading" className="font-serif text-3xl font-semibold text-center text-[#1A1A1A] mb-6">
                    Renew your plan
                  </h2>
                  <div className="max-w-sm mx-auto">{renderPlanCard(renewPlan, true)}</div>
                </section>
              )}
              {renewPlan && gridPlans.length > 0 && (
                <div className="flex items-center gap-4 max-w-3xl mx-auto mb-8">
                  <div className="h-px flex-1 bg-[#D4A843]/30" />
                  <h2 className="font-serif text-xl font-semibold text-[#1A1A1A]">Or check other plans</h2>
                  <div className="h-px flex-1 bg-[#D4A843]/30" />
                </div>
              )}
              {/* Column count follows the number of plans so 1–2 plans sit centred
                  instead of leaving empty columns on the right. */}
              <div className={`grid grid-cols-1 gap-6 mx-auto ${
                gridPlans.length === 1
                  ? 'max-w-sm'
                  : gridPlans.length === 2
                    ? 'md:grid-cols-2 max-w-3xl'
                    : 'md:grid-cols-2 lg:grid-cols-3'
              }`}>
                {gridPlans.map((plan) => renderPlanCard(plan))}
              </div>

              {/* Security Badge */}
              <div className="mt-8 flex items-center justify-center gap-2 text-[#2C3E50]/70">
                <Shield className="w-4 h-4" />
                <span className="font-sans text-sm">Secured by Razorpay • 256-bit SSL Encryption</span>
              </div>
            </div>
          ) : (
            <div className="max-w-xl mx-auto mb-16">
              <Card className="border-2 border-[#D4A843]/15">
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center justify-center gap-4 py-12">
                    <p className="font-sans text-[#2C3E50]/70 text-center">
                      No membership plans available at the moment. Please check back later.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Skip for Now - Only shown after registration */}
          {showSkip && (
            <div className="max-w-4xl mx-auto text-center pb-8 md:pb-0">
              <p className="font-sans text-[#2C3E50]/70 mb-3">
                Not ready to purchase? You can explore the platform first.
              </p>
              <Button
                onClick={() => {
                  router.push('/');
                }}
                className="font-sans font-semibold bg-[#1A1A1A] hover:bg-[#2C3E50] text-white rounded-full px-8 py-2"
              >
                Skip for Now
              </Button>
            </div>
          )}

        </div>
      </div>

      {termsPlan && (
        <PaymentTermsDialog
          open
          onOpenChange={(open) => { if (!open) setTermsPlan(null); }}
          itemName={`${termsPlan.name} — ${termsPlan.credits} credits${termsPlan.validityDays ? `, ${termsPlan.validityDays} days` : ''}`}
          pricing={termsPlan.pricing || { baseAmount: termsPlan.price?.amount, gatewayCharges: 0, totalAmount: termsPlan.price?.amount }}
          terms={[
            termsPlan.validityDays
              ? `The plan is valid for ${termsPlan.validityDays} days from payment. Credits can be used only while it is active — any left when it ends expire with it.`
              : 'Credits can be used only while the plan is active.',
            'Profile views, contact unlocks and downloads use credits as shown on each action, and are not refundable once used.',
          ]}
          busy={processingPlanId === termsPlan._id}
          onAgree={() => startPurchase(termsPlan)}
        />
      )}
    </>
  );
}
