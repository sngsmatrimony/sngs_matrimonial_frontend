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

// Real, plan-specific feature bullets — matches exactly what each toggle in
// the admin membership-plans page actually grants (see checkMembership.js's
// hasPlanFeature), instead of the same 3 hardcoded claims on every plan.
function buildFeatureBullets(plan) {
  const features = plan.features || {};
  const bullets = [
    features.unlimitedProfileViews ? 'Unlimited profile views' : `View ${plan.credits} profiles`,
    'Re-view any profile anytime, free',
  ];
  if (features.unlimitedBrowsing) bullets.push('Full search results, no teaser limit');
  if (features.unlimitedContactAccess) bullets.push('See phone numbers directly, no approval needed');
  if (features.unlimitedChat) bullets.push('Start unlimited new chats');
  if (features.unlimitedHoroscopeDownload) bullets.push('Unlimited horoscope downloads');
  return bullets;
}

export default function PurchaseMembershipPage() {
  const router = useRouter();
  const { user, membership, refreshMembership, logout } = useAuthStore();
  const [plans, setPlans] = useState([]);
  const [planLoading, setPlanLoading] = useState(true);
  const [processingPlanId, setProcessingPlanId] = useState(null);
  const [showSkip, setShowSkip] = useState(false);

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

  const handlePurchase = async (plan) => {
    setProcessingPlanId(plan._id);

    try {
      toastInfo('Creating payment order...');

      // Create Razorpay order
      const orderRes = await client.post('/api/membership/create-order', {
        planId: plan._id,
      });

      const { orderId } = orderRes.data.data;

      // Redirect to dedicated payment page
      router.push(`/payment/${orderId}`);

    } catch (error) {
      console.error('Order creation error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to create order. Please try again.';

      // Provide better error message for international card restriction
      if (errorMessage.toLowerCase().includes('international')) {
        toastError('International cards are not supported. Please use a domestic Indian card or contact support.');
      } else {
        toastError(errorMessage);
      }
      setProcessingPlanId(null);
    }
  };

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
            <h1 className="font-serif text-2xl font-bold text-[#1A1A1A] hidden sm:block">
              SNGS Matrimonial
            </h1>
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
          {/* Active Membership Status - Subtle */}
          {membership?.isActive && !membership?.isExpired && (
            <div className="max-w-xl mx-auto mb-8">
              <div className="flex items-center justify-center gap-2 p-3 bg-[#2E7D32]/10 border border-[#2E7D32]/30 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-[#2E7D32]" />
                <p className="font-sans text-sm text-[#2C3E50]">
                  You have <span className="font-semibold">{membership.credits} credits</span> remaining {membership.expiryDate ? `(expires ${new Date(membership.expiryDate).toLocaleDateString()})` : '(never expires)'}
                </p>
              </div>
            </div>
          )}

          {/* Simple Value Proposition */}
          <div className="text-center mb-12">
            <p className="font-sans text-[#2C3E50]/70">
              1 credit = 1 profile view • Re-view any profile anytime, free
            </p>
          </div>

          {/* Membership Plans Grid */}
          {planLoading ? (
            <div className="max-w-5xl mx-auto mb-16">
              <div className="flex flex-col items-center justify-center gap-4 py-12">
                <Loader2 className="w-8 h-8 text-[#D4A843] animate-spin" />
                <p className="font-sans text-[#2C3E50]/70">Loading membership plans...</p>
              </div>
            </div>
          ) : plans.length > 0 ? (
            <div className="max-w-6xl mx-auto mb-16">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {plans.map((plan) => (
                  <Card
                    key={plan._id}
                    className={`border-2 transition-all hover:shadow-xl ${
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
                      <CardDescription className="font-sans text-sm text-[#2C3E50]/70">
                        {plan.description}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-6">
                      {/* Pricing */}
                      <div className="text-center py-4 bg-[#F5E6C3]/40 rounded-lg">
                        <div className="font-serif text-5xl font-bold text-[#1A1A1A] mb-1">
                          ₹{plan.price.amount.toLocaleString('en-IN')}
                        </div>
                        <p className="font-sans text-sm text-[#2C3E50]/70">
                          {plan.credits} Credits
                        </p>
                        <p className="font-sans text-xs text-[#2C3E50]/50 mt-1">
                          {plan.validityDays === null || plan.validityDays === undefined
                            ? 'Unlimited validity'
                            : `Valid for ${plan.validityDays} days`}
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
                        disabled={processingPlanId !== null}
                        className={`w-full h-12 font-sans font-semibold transition-all ${
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
                            Buy Now
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
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
    </>
  );
}
