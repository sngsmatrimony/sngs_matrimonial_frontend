'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import ReceiptDownloadButton from '@/components/payment/ReceiptDownloadButton';
import Script from 'next/script';
import { CheckCircle2, ArrowRight, Loader2 } from 'lucide-react';
import { client } from '@/lib/api/client';
import { useAuthStore } from '@/store/authStore';
import { toastSuccess, toastError, toastInfo } from '@/lib/toast';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function PaymentPage() {
  const router = useRouter();
  const params = useParams();
  const { user, refreshMembership } = useAuthStore();
  const [orderData, setOrderData] = useState(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState('loading'); // loading, processing, verifying, success, refunded, unconfirmed
  const [transactionData, setTransactionData] = useState(null);
  const checkoutOpenedRef = useRef(false);
  // Horoscope fee: everything returns to that member's profile, not plans.
  const isHoroscope = orderData?.type === 'horoscope';
  const horoscopeProfileHref = orderData?.horoscopeProfileId ? `/profiles/${orderData.horoscopeProfileId}?tab=horoscope` : '/browse';
  const backHref = isHoroscope ? horoscopeProfileHref : '/membership/purchase';

  // Fetch order details on mount
  useEffect(() => {
    // Guard: Only fetch if orderId is available
    if (!params.orderId) {
      console.warn('Order ID not available yet');
      return;
    }

    const fetchOrderDetails = async () => {
      try {
        const res = await client.get(`/api/membership/order/${params.orderId}`);
        setOrderData(res.data.data);
      } catch (error) {
        console.error('Error fetching order:', error);
        toastError('Failed to load payment details');
        setTimeout(() => {
          router.push('/membership/purchase');
        }, 1500);
      }
    };

    fetchOrderDetails();
  }, [params.orderId, router]);

  // Check if Razorpay script is loaded (handles cached scripts)
  useEffect(() => {
    // If already loaded via state, skip
    if (scriptLoaded) return;

    // Poll for Razorpay (in case onLoad doesn't fire for cached scripts)
    const checkInterval = setInterval(() => {
      if (window.Razorpay) {
        setScriptLoaded(true);
        clearInterval(checkInterval);
      }
    }, 100); // Check every 100ms

    // Cleanup interval after 5 seconds
    const timeout = setTimeout(() => {
      clearInterval(checkInterval);
      if (!window.Razorpay) {
        console.error('[PaymentPage] Razorpay failed to load after 5 seconds');
        toastError('Failed to load payment gateway');
      }
    }, 5000);

    return () => {
      clearInterval(checkInterval);
      clearTimeout(timeout);
    };
  }, [scriptLoaded]);

  // Handler: Payment Success — the member has already paid at this point,
  // so a failed confirmation call must never look like a failed payment.
  // Network/server errors are retried; if confirmation still can't be
  // reached, the member sees their payment ID and a "Check again" button
  // (the Razorpay webhook also credits the order in the background).
  const confirmPayment = useCallback(async (response) => {
    const payload = {
      razorpay_order_id: response.razorpay_order_id,
      razorpay_payment_id: response.razorpay_payment_id,
      razorpay_signature: response.razorpay_signature,
    };
    let lastError;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const res = await client.post('/api/membership/verify-payment', payload);
        return { ok: true, data: res.data?.data, refunded: !!res.data?.refunded, message: res.data?.message };
      } catch (error) {
        lastError = error;
        const status = error.response?.status;
        if (status && status >= 400 && status < 500) break; // rejected, retrying won't help
        await new Promise((resolve) => setTimeout(resolve, 1500 * (attempt + 1)));
      }
    }
    return { ok: false, error: lastError };
  }, []);

  const handlePaymentSuccess = useCallback(async (response) => {
    setPaymentStatus('verifying');
    setTransactionData({
      paymentId: response.razorpay_payment_id,
      orderId: response.razorpay_order_id,
      razorpayResponse: response,
    });

    const result = await confirmPayment(response);
    if (result.ok && result.refunded) {
      // The purchase couldn't be applied (e.g. a plan is already active) —
      // the server refunded it automatically.
      await refreshMembership();
      setTransactionData((prev) => ({ ...prev, refundMessage: result.message }));
      setPaymentStatus('refunded');
      return;
    }
    if (result.ok && result.data?.type === 'horoscope') {
      toastSuccess('Payment successful — horoscope unlocked.');
      setTransactionData((prev) => ({ ...prev, type: 'horoscope' }));
      setPaymentStatus('success');
      return;
    }
    if (result.ok) {
      const isPack = result.data?.type === 'credits';
      toastSuccess(isPack ? 'Payment successful — credits added.' : 'Payment successful — membership activated.');
      await refreshMembership();
      setTransactionData((prev) => ({
        ...prev,
        type: result.data?.type,
        creditsAdded: result.data?.creditsAdded,
        credits: result.data?.credits,
        expiryDate: result.data?.expiryDate,
      }));
      setPaymentStatus('success');
      return;
    }

    console.error('Payment confirmation error:', result.error);
    setPaymentStatus('unconfirmed');
  }, [confirmPayment, refreshMembership]);

  const handleCheckAgain = useCallback(async () => {
    if (!transactionData?.razorpayResponse) return;
    await handlePaymentSuccess(transactionData.razorpayResponse);
  }, [transactionData, handlePaymentSuccess]);

  // Handler: Payment Dismissed
  const handlePaymentDismiss = useCallback(() => {
    toastError('Payment cancelled');
    // Back to where the purchase started (plans page, or the horoscope's profile).
    setTimeout(() => {
      router.push(backHref);
    }, 1500);
  }, [router, backHref]);

  // Handler: Open Razorpay Checkout
  const openRazorpayCheckout = useCallback(() => {
    // Set status at the start of opening checkout
    setPaymentStatus('processing');

    // Safety checks
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
      description: orderData.planName,
      order_id: orderData.orderId,
      handler: handlePaymentSuccess,
      prefill: {
        name: user?.fullName,
        email: user?.email,
        contact: user?.mobileNumber,
      },
      theme: {
        // razorpay gateway theme
        // color: '#FFE100',
        backdrop_color: '#000000', // Black backdrop
      },
      modal: {
        ondismiss: handlePaymentDismiss,
        backdropclose: false, // Prevent closing by clicking backdrop
        escape: true, // Allow ESC key
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

  // Auto-open Razorpay when script loads and order is fetched
  useEffect(() => {
    // Prevent opening checkout multiple times
    if (checkoutOpenedRef.current) {
      return;
    }

    if (scriptLoaded && orderData) {
      checkoutOpenedRef.current = true;
      // Safe: ref guard prevents duplicate opens, state update is intentional and controlled
      openRazorpayCheckout();
    }
  }, [scriptLoaded, orderData, openRazorpayCheckout]);

  const handleGoHome = () => {
    router.push('/browse');
  };

  return (
    <>
      {/* Razorpay Checkout Script */}
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        onLoad={() => {
          setScriptLoaded(true);
        }}
        onError={() => {
          console.error('[PaymentPage] Script onError fired');
          toastError('Failed to load payment gateway');
          setTimeout(() => {
            router.push('/membership/purchase');
          }, 1500);
        }}
      />

      {/* Full-screen Black Background */}
      <div className="fixed inset-0 bg-black flex items-center justify-center p-4">

        {/* Loading State */}
        {paymentStatus === 'loading' && (
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-[#D4A843] animate-spin mx-auto mb-4" />
            <p className="text-white font-sans text-lg">Loading payment gateway...</p>
          </div>
        )}

        {/* Processing State - Just black screen while Razorpay modal is visible */}
        {paymentStatus === 'processing' && (
          <div className="text-center">
            {/* Empty div - Razorpay modal will be displayed on top */}
          </div>
        )}

        {paymentStatus === 'verifying' && (
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-[#D4A843] animate-spin mx-auto mb-4" />
            <p className="text-white font-sans text-lg">Confirming your payment...</p>
          </div>
        )}

        {/* Paid, but confirmation couldn't be reached — never send the
            member back to the plans page (they might pay twice). */}
        {paymentStatus === 'refunded' && (
          <Card className="max-w-md w-full border-2 border-[#D4A843] shadow-2xl">
            <CardContent className="pt-10 pb-8 text-center">
              <h1 className="font-serif text-2xl font-bold text-[#1A1A1A] mb-3">
                Payment refunded
              </h1>
              <p className="font-sans text-[#2C3E50]/80 mb-5 leading-relaxed">
                {transactionData?.refundMessage || 'This payment could not be applied to your account, so it has been refunded.'}
              </p>
              <p className="font-sans text-sm text-[#2C3E50]/70 mb-6">
                Refunds usually reach your account within 5–7 working days.
                {transactionData?.paymentId && (
                  <> Payment ID: <span className="font-mono text-xs text-[#1A1A1A] break-all">{transactionData.paymentId}</span></>
                )}
              </p>
              <Button
                onClick={() => router.push(backHref)}
                className="w-full h-12 bg-[#D4A843] hover:bg-[#B8860B] text-[#1A1A1A] font-sans font-semibold"
              >
                {isHoroscope ? 'Back to Profile' : 'Go to My Membership'}
              </Button>
            </CardContent>
          </Card>
        )}

        {paymentStatus === 'unconfirmed' && (
          <Card className="max-w-md w-full border-2 border-[#D4A843] shadow-2xl">
            <CardContent className="pt-10 pb-8 text-center">
              <h1 className="font-serif text-2xl font-bold text-[#1A1A1A] mb-3">
                We&apos;re confirming your payment
              </h1>
              <p className="font-sans text-[#2C3E50]/80 mb-5 leading-relaxed">
                Your payment went through, but we couldn&apos;t confirm it just now.{' '}
                {isHoroscope ? 'The horoscope is unlocked' : 'Your credits are added'} automatically within a few minutes — please don&apos;t pay again.
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
                <Button
                  variant="outline"
                  onClick={() => router.push(isHoroscope ? horoscopeProfileHref : '/settings')}
                  className="w-full h-12 font-sans"
                >
                  {isHoroscope ? 'Back to Profile' : 'Go to My Membership'}
                </Button>
              </div>
              <p className="font-sans text-xs text-[#2C3E50]/60 mt-4">
                Still not showing after 10 minutes? Contact support with the payment ID above.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Success State - Show transaction details */}
        {paymentStatus === 'success' && (
          <Card className="max-w-md w-full border-2 border-[#2E7D32] shadow-2xl">
            <CardContent className="pt-12 pb-8 text-center">
              {/* Success Icon */}
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#2E7D32]/10 mb-6">
                <CheckCircle2 className="w-12 h-12 text-[#2E7D32]" />
              </div>

              {/* Success Message */}
              <h1 className="font-serif text-3xl font-bold text-[#1A1A1A] mb-3">
                {transactionData?.type === 'horoscope' ? 'Horoscope Unlocked' : transactionData?.type === 'credits' ? 'Credits Added' : 'Payment Successful'}
              </h1>

              <p className="font-sans text-[#2C3E50]/70 mb-6">
                {transactionData?.type === 'horoscope'
                  ? 'You can now view and download this horoscope any time from the member’s profile.'
                  : transactionData?.type === 'credits'
                    ? `${transactionData.creditsAdded} credits have been added to your current plan.`
                    : 'Your membership has been activated.'}
                {' '}A receipt has been sent to your email.
              </p>
              <ReceiptDownloadButton orderId={params.orderId} className="w-full mb-6" />

              {typeof transactionData?.credits === 'number' && (
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="rounded-lg bg-[#F5E6C3]/50 border border-[#D4A843]/30 p-3">
                    <p className="font-sans text-xs text-[#2C3E50]/70">Credits available</p>
                    <p className="font-sans text-2xl font-bold text-[#1A1A1A] tabular-nums">{transactionData.credits}</p>
                  </div>
                  <div className="rounded-lg bg-[#F5E6C3]/50 border border-[#D4A843]/30 p-3">
                    <p className="font-sans text-xs text-[#2C3E50]/70">Valid until</p>
                    <p className="font-sans text-base font-semibold text-[#1A1A1A] mt-1">
                      {transactionData.expiryDate
                        ? new Date(transactionData.expiryDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                        : 'No expiry'}
                    </p>
                  </div>
                </div>
              )}

              {/* Transaction Details */}
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

              {/* Next step: the horoscope itself, or back to searching */}
              <Button
                onClick={transactionData?.type === 'horoscope' ? () => router.push(horoscopeProfileHref) : handleGoHome}
                className="w-full h-12 bg-[#D4A843] hover:bg-[#B8860B] text-[#1A1A1A] font-sans font-semibold text-lg"
              >
                {transactionData?.type === 'horoscope' ? 'View Horoscope' : 'Start Searching Matches'}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </CardContent>
          </Card>
        )}

      </div>
    </>
  );
}
