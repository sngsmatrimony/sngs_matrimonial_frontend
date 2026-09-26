import { redirect } from 'next/navigation';

// Unused (no links point here) — the actual payment success state is handled
// inline by /payment/[orderId], which shows transaction details right after
// Razorpay verification completes.
export default function LegacyPaymentSuccessRedirect() {
  redirect('/browse');
}
