'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle2, CreditCard, LogOut, Lock, User, MessageCircle, Shield } from 'lucide-react';
import { client } from '@/lib/api/client';
import { useAuthStore } from '@/store/authStore';
import { toastSuccess, toastError, toastInfo } from '@/lib/toast';

export default function PurchaseMembershipPage() {
  const router = useRouter();
  const { user, membership, refreshMembership, logout } = useAuthStore();
  const [plan, setPlan] = useState(null);
  const [planLoading, setPlanLoading] = useState(true);
  const [processingPlanId, setProcessingPlanId] = useState(null);
  const [showSkip, setShowSkip] = useState(false);

  // Fetch membership plan from backend
  useEffect(() => {
    const fetchPlan = async () => {
      try {
        const res = await client.get('/api/membership/plans');
        if (res.data.data && res.data.data.length > 0) {
          // Find default plan or use first available plan
          const defaultPlan = res.data.data.find(p => p.isDefault);
          setPlan(defaultPlan || res.data.data[0]);
        }
      } catch (error) {
        console.error('Error fetching membership plan:', error);
        toastError('Failed to load membership plan');
      } finally {
        setPlanLoading(false);
      }
    };

    fetchPlan();
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
      toastError(error.response?.data?.message || 'Failed to create order. Please try again.');
      setProcessingPlanId(null);
    }
  };

  return (
    <>
      {/* Fixed Header */}
      <header className="border-b border-gray-100 fixed top-0 left-0 right-0 z-50 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          {/* Logo + Title */}
          <div className="flex items-center gap-3">
            <Image
              src="/logo.jpeg"
              alt="SNGS Matrimonial Logo"
              width={48}
              height={48}
              className="w-auto h-12"
            />
            <h1 className="font-viga text-2xl text-accent hidden sm:block">
              SNGS Matrimonial
            </h1>
          </div>

          {/* Welcome Message - Center */}
          <div className="hidden md:flex items-center gap-2 flex-1 justify-center">
            <span className="font-maven text-gray-600">Welcome,</span>
            <span className="font-viga text-secondary">{user?.fullName}</span>
          </div>

          {/* Credit Badge (if active) */}
          {membership?.isActive && !membership?.isExpired && (
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
              <CreditCard className="w-4 h-4 text-primary" />
              <span className="font-telex font-semibold text-primary">
                {membership?.credits} credits
              </span>
            </div>
          )}

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors font-telex"
          >
            <LogOut size={18} />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* Main Content - Add pt-24 for fixed header spacing */}
      <div className="min-h-screen bg-gray-50 pt-24 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Page Title */}
          <div className="text-center mb-12">
            <h1 className="font-viga text-3xl sm:text-4xl lg:text-5xl text-secondary mb-4">
              Get Started with SNGS Matrimonial
            </h1>
          </div>

          {/* Active Membership Status - Subtle */}
          {membership?.isActive && !membership?.isExpired && (
            <div className="max-w-xl mx-auto mb-8">
              <div className="flex items-center justify-center gap-2 p-3 bg-success/10 border border-success/30 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-success" />
                <p className="font-maven text-sm text-success">
                  You have <span className="font-semibold">{membership.credits} credits</span> remaining (expires {new Date(membership.expiryDate).toLocaleDateString()})
                </p>
              </div>
            </div>
          )}

          {/* Hero Plan Card */}
          {planLoading ? (
            <div className="max-w-md mx-auto mb-16">
              <Card className="border-2 border-primary shadow-2xl">
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center justify-center gap-4 py-12">
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                    <p className="font-maven text-gray-600">Loading membership plan...</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : plan ? (
            <div className="max-w-md mx-auto mb-16">
              <Card className="border-2 border-primary shadow-2xl">
                <CardHeader className="text-center pb-4">
                  {/* Plan Name */}
                  <CardTitle className="font-viga text-3xl sm:text-4xl text-secondary mb-2">
                    {plan.name}
                </CardTitle>

                {/* Description */}
                <CardDescription className="font-maven text-base text-gray-600">
                  {plan.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-8">
                {/* Pricing */}
                <div className="text-center py-6 bg-gradient-to-br from-primary/5 to-accent/5 rounded-lg">
                  <div className="font-viga text-6xl sm:text-7xl text-secondary mb-2">
                    ₹{plan.price.amount.toLocaleString('en-IN')}
                  </div>
                  <p className="font-maven text-gray-600">
                    {plan.credits} Credits
                  </p>
                </div>

                {/* Features List */}
                <div className="space-y-4">
                  <div className="flex items-start gap-3 font-maven">
                    <CheckCircle2 className="w-6 h-6 text-success shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-secondary">View Detailed Profiles</p>
                      <p className="text-sm text-gray-600">Access full profile information including photos, bio, and contact details</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 font-maven">
                    <CheckCircle2 className="w-6 h-6 text-success flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-secondary">Unlimited Re-views</p>
                      <p className="text-sm text-gray-600">Revisit viewed profiles anytime without using additional credits</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 font-maven">
                    <CheckCircle2 className="w-6 h-6 text-success flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-secondary">Unlimited Messaging</p>
                      <p className="text-sm text-gray-600">Chat with all your connections without any restrictions</p>
                    </div>
                  </div>
                </div>

                {/* Payment Button */}
                <div className="pt-4">
                  <Button
                    onClick={() => handlePurchase(plan)}
                    disabled={processingPlanId !== null}
                    size="lg"
                    className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground font-telex text-lg shadow-lg hover:shadow-xl transition-all"
                  >
                    {processingPlanId ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Processing Payment...
                      </>
                    ) : (
                      <>
                        <Lock className="mr-2 h-5 w-5" />
                        Proceed to Secure Payment
                      </>
                    )}
                  </Button>

                  {/* Security Badge */}
                  <div className="mt-4 flex items-center justify-center gap-2 text-gray-600">
                    <Shield className="w-4 h-4" />
                    <span className="font-telex text-sm">Secured by Razorpay • 256-bit SSL Encryption</span>
                  </div>
                </div>
              </CardContent>
            </Card>
              </div>
            ) : (
              <div className="max-w-xl mx-auto mb-16">
                <Card className="border-2 border-primary shadow-2xl">
                  <CardContent className="pt-6">
                    <div className="flex flex-col items-center justify-center gap-4 py-12">
                      <p className="font-maven text-gray-600 text-center">Unable to load membership plan. Please try refreshing the page.</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

          {/* How It Works */}
          <div className="mt-16 max-w-4xl mx-auto mb-16">
            <h2 className="font-viga text-2xl text-secondary text-center mb-8">
              How It Works
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Step 1 */}
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                  <CreditCard className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-viga text-lg text-secondary mb-2">1. Purchase Credits</h3>
                <p className="font-maven text-sm text-gray-600">
                  Buy credits securely via Razorpay. Choose from UPI, cards, net banking, or wallets.
                </p>
              </div>

              {/* Step 2 */}
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent/10 mb-4">
                  <User className="w-8 h-8 text-accent" />
                </div>
                <h3 className="font-viga text-lg text-secondary mb-2">2. View Profiles</h3>
                <p className="font-maven text-sm text-gray-600">
                  Browse profiles and use 1 credit to unlock detailed information. Re-view anytime for free.
                </p>
              </div>

              {/* Step 3 */}
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-success/10 mb-4">
                  <MessageCircle className="w-8 h-8 text-success" />
                </div>
                <h3 className="font-viga text-lg text-secondary mb-2">3. Connect & Chat</h3>
                <p className="font-maven text-sm text-gray-600">
                  Send unlimited messages, access contact details, and take the next step toward your match.
                </p>
              </div>
            </div>
          </div>

          {/* Skip for Now - Only shown after registration */}
          {showSkip && (
            <div className="max-w-4xl mx-auto text-center pb-8 md:pb-0">
              <p className="font-maven text-gray-600 mb-3">
                Not ready to purchase? You can explore the platform first.
              </p>
              <Button
                onClick={() => {
                  router.push('/');
                }}
                variant="link"
                className="font-telex text-gray-500 text-sm underline-offset-4"
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
