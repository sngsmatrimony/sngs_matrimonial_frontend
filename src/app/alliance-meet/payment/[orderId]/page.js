'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Script from 'next/script';
import { CheckCircle2, ArrowRight, Loader2 } from 'lucide-react';
import { client } from '@/lib/api/client';
import { useAuthStore } from '@/store/authStore';
import { toastSuccess, toastError } from '@/lib/toast';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

/**
 * Dedicated payment page for the Alliance Meet opt-in — mirrors
 * payment/[orderId]/page.js's flow exactly, just against the
 * /api/alliance-meet/* endpoints instead of /api/membership/*, since this is
 * a one-time event registration (Supabase-backed), not a recurring
 * credit-bundle purchase. Kept as its own page/route rather than
 * parameterizing the existing membership payment page, to avoid touching
 * that already-tested flow at all.
 */
export default function AllianceMeetPaymentPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuthStore();
  const [orderData, setOrderData] = useState(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState('loading'); // loading, processing, verifying, success, unconfirmed
  const [transactionData, setTransactionData] = useState(null);
  const checkoutOpenedRef = useRef(false);

  useEffect(() => {
    if (!params.orderId) return;

    const fetchOrderDetails = async () => {
      try {
        const res = await client.get(`/api/alliance-meet/order/${params.orderId}`);
        setOrderData(res.data.data);
      } catch (error) {
        console.error('Error fetching alliance meet order:', error);
        toastError('Failed to load payment details');
        setTimeout(() => {
          router.push('/settings');
        }, 1500);
      }
    };

    fetchOrderDetails();
  }, [params.orderId, router]);

  useEffect(() => {
    if (scriptLoaded) return;

    const checkInterval = setInterval(() => {
      if (window.Razorpay) {
        setScriptLoaded(true);
        clearInterval(checkInterval);
      }
    }, 100);

    const timeout = setTimeout(() => {
      clearInterval(checkInterval);
      if (!window.Razorpay) {
        console.error('[AllianceMeetPaymentPage] Razorpay failed to load after 5 seconds');
        toastError('Failed to load payment gateway');
      }
    }, 5000);

    return () => {
      clearInterval(checkInterval);
      clearTimeout(timeout);
    };
  }, [scriptLoaded]);

  // The member has already paid when this runs — a failed confirmation call
  // is retried, and never presented as a failed payment (the Razorpay
  // webhook also marks the registration paid in the background).
  const handlePaymentSuccess = useCallback(async (response) => {
    setPaymentStatus('verifying');
    setTransactionData({
      paymentId: response.razorpay_payment_id,
      orderId: response.razorpay_order_id,
      razorpayResponse: response,
    });

    const payload = {
      razorpay_order_id: response.razorpay_order_id,
      razorpay_payment_id: response.razorpay_payment_id,
      razorpay_signature: response.razorpay_signature,
    };
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        await client.post('/api/alliance-meet/verify-payment', payload);
        toastSuccess('Payment successful — you are registered for the Alliance Meet.');
        setPaymentStatus('success');
        return;
      } catch (error) {
        console.error('Alliance meet payment confirmation error:', error);
        const status = error.response?.status;
        if (status && status >= 400 && status < 500) break;
        await new Promise((resolve) => setTimeout(resolve, 1500 * (attempt + 1)));
      }
    }
    setPaymentStatus('unconfirmed');
  }, []);

  const handleCheckAgain = useCallback(() => {
    if (transactionData?.razorpayResponse) handlePaymentSuccess(transactionData.razorpayResponse);
  }, [transactionData, handlePaymentSuccess]);

  const handlePaymentDismiss = useCallback(() => {
    toastError('Payment cancelled');
    setTimeout(() => {
      router.push('/settings');
    }, 1500);
  }, [router]);

  const openRazorpayCheckout = useCallback(() => {
    setPaymentStatus('processing');

    if (!window.Razorpay) {
      console.error('Razorpay script not loaded');
      toastError('Payment gateway not loaded');
      return;
    }

    if (!orderData) {
      console.error('Order data not available');
      toastError('Order details not available');
      return;
    }

    const options = {
      key: orderData.keyId,
      amount: orderData.amount,
      currency: orderData.currency,
      name: 'SNGS Matrimonial',
      description: 'SNGS Alliance Meet Registration',
      order_id: orderData.orderId,
      handler: handlePaymentSuccess,
      prefill: {
        name: user?.fullName,
        email: user?.email,
        contact: user?.mobileNumber,
      },
      theme: {
        backdrop_color: '#000000',
      },
      modal: {
        ondismiss: handlePaymentDismiss,
        backdropclose: false,
        escape: true,
      },
    };

    try {
      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error('Error opening Razorpay modal:', error);
      toastError('Failed to open payment modal');
    }
  }, [orderData, user, handlePaymentSuccess, handlePaymentDismiss]);

  useEffect(() => {
    if (checkoutOpenedRef.current) return;

    if (scriptLoaded && orderData) {
      checkoutOpenedRef.current = true;
      openRazorpayCheckout();
    }
  }, [scriptLoaded, orderData, openRazorpayCheckout]);

  const handleGoToSettings = () => {
    router.push('/settings');
  };

  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        onLoad={() => setScriptLoaded(true)}
        onError={() => {
          console.error('[AllianceMeetPaymentPage] Script onError fired');
          toastError('Failed to load payment gateway');
          setTimeout(() => {
            router.push('/settings');
          }, 1500);
        }}
      />

      <div className="fixed inset-0 bg-black flex items-center justify-center p-4">
        {paymentStatus === 'loading' && (
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-[#D4A843] animate-spin mx-auto mb-4" />
            <p className="text-white font-sans text-lg">Loading payment gateway...</p>
          </div>
        )}

        {paymentStatus === 'processing' && <div className="text-center" />}

        {paymentStatus === 'verifying' && (
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-[#D4A843] animate-spin mx-auto mb-4" />
            <p className="text-white font-sans text-lg">Confirming your payment...</p>
          </div>
        )}

        {paymentStatus === 'unconfirmed' && (
          <Card className="max-w-md w-full border-2 border-[#D4A843] shadow-2xl">
            <CardContent className="pt-10 pb-8 text-center">
              <h1 className="font-serif text-2xl font-bold text-[#1A1A1A] mb-3">
                We&apos;re confirming your payment
              </h1>
              <p className="font-sans text-[#2C3E50]/80 mb-5 leading-relaxed">
                Your payment went through, but we couldn&apos;t confirm it just now. Your registration is
                confirmed automatically within a few minutes — please don&apos;t pay again.
              </p>
              {transactionData?.paymentId && (
                <p className="font-sans text-sm text-[#2C3E50]/70 mb-6">
                  Payment ID: <span className="font-mono text-xs text-[#1A1A1A] break-all">{transactionData.paymentId}</span>
                </p>
              )}
              <div className="flex flex-col gap-3">
                <Button
                  onClick={handleCheckAgain}
                  className="w-full h-12 bg-[#D4A843] hover:bg-[#B8860B] text-[#1A1A1A] font-sans font-semibold"
                >
                  Check Again
                </Button>
                <Button variant="outline" onClick={handleGoToSettings} className="w-full h-12 font-sans">
                  Back to Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {paymentStatus === 'success' && (
          <Card className="max-w-md w-full border-2 border-[#2E7D32] shadow-2xl">
            <CardContent className="pt-12 pb-8 text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#2E7D32]/10 mb-6">
                <CheckCircle2 className="w-12 h-12 text-[#2E7D32]" />
              </div>

              <h1 className="font-serif text-3xl font-bold text-[#1A1A1A] mb-3">
                Registration Confirmed
              </h1>

              <p className="font-sans text-[#2C3E50]/70 mb-6">
                You&apos;re registered for the SNGS Alliance Meet. We&apos;ll be in touch with event details.
              </p>

              {transactionData && (
                <div className="bg-[#FDF8F0] border border-[#D4A843]/15 rounded-lg p-4 mb-6 space-y-3 text-left">
                  <div className="flex justify-between text-sm">
                    <span className="font-sans text-[#2C3E50]/70">Transaction ID:</span>
                    <span className="font-mono text-xs text-[#1A1A1A] break-all ml-2">
                      {transactionData.paymentId}
                    </span>
                  </div>
                  <div className="border-t border-[#D4A843]/15 pt-3 flex justify-between text-sm">
                    <span className="font-sans text-[#2C3E50]/70">Order ID:</span>
                    <span className="font-mono text-xs text-[#1A1A1A] break-all ml-2">
                      {transactionData.orderId}
                    </span>
                  </div>
                </div>
              )}

              <Button
                onClick={handleGoToSettings}
                className="w-full h-12 bg-[#D4A843] hover:bg-[#B8860B] text-[#1A1A1A] font-sans font-semibold text-lg"
              >
                Back to Settings
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
