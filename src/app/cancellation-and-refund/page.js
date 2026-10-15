import Link from 'next/link';
import LegalPage, { ContactBlock, List, Note, P, Section, Sub } from '@/components/legal/LegalPage';
import { CONTACT_EMAIL, SITE_NAME } from '@/lib/siteInfo';

export const metadata = {
  title: 'Cancellation & Refund Policy | SNGS Matrimony',
  description: 'Refund rules for SNGS Matrimony plans, credit packs and Alliance Meet registrations, and how to request a refund.',
};

const link = (href, text) => <Link href={href} className="text-[#B8860B] underline underline-offset-2">{text}</Link>;

export default function CancellationAndRefundPage() {
  return (
    <LegalPage title="Cancellation & Refund Policy" current="/cancellation-and-refund">
      <Section title="Introduction">
        <P>
          This policy explains when payments made on {SITE_NAME} can be refunded. It applies to membership plans, credit packs and
          Alliance Meet registrations, and forms part of our {link('/terms-and-conditions', 'Terms & Conditions')}.
        </P>
        <Note>
          <strong>In short:</strong> a plan or credit pack is refunded in full (excluding payment gateway charges) if you ask within 7 days
          of paying and have not used any of its credits. Payment gateway charges are not refundable, except when a payment is refunded
          automatically because it could not be applied. Alliance Meet fees are refunded only if we cancel the event.
        </Note>
      </Section>

      <Section title="1. Nothing to cancel">
        <P>
          All payments on {SITE_NAME} are one-time payments. Plans do not renew automatically and nothing is charged again, so there is no
          subscription to cancel. You can stop using the service at any time, and you can delete your account from Settings → Delete Account.
          Deleting your account does not by itself give you a refund — see below.
        </P>
      </Section>

      <Section title="2. Membership plans and credit packs">
        <Sub>Eligible for a refund</Sub>
        <List items={[
          'You ask for a refund within 7 days of the payment, and',
          'none of the credits from that purchase have been used (no profile, contact or download unlocked with them).',
        ]} />
        <P>The refund is the price of the plan or pack. Payment gateway charges are not refunded.</P>
        <Sub>Not eligible for a refund</Sub>
        <List items={[
          'Requests made more than 7 days after the payment',
          'Purchases where any of the credits have been used',
          'Credits that expired when the plan ended',
          'Accounts suspended or terminated for breaking our Terms & Conditions, or for giving false information',
        ]} />
        <Sub>Payment problems</Sub>
        <P>
          If a payment cannot be applied to your account — for example, a plan bought while another plan is already active — it is
          refunded automatically and in full, including payment gateway charges. You will see this on the payment screen.
        </P>
        <P>
          If you were charged twice for the same purchase, or your payment succeeded but the plan or credits were not added to your account,
          contact us. We will either add what you paid for or refund the payment (excluding payment gateway charges).
        </P>
        <P>When a plan or pack is refunded, the credits it added are removed from your account.</P>
      </Section>

      <Section title="3. Alliance Meet registrations">
        <List items={[
          'Alliance Meet registration fees are non-refundable.',
          'If we cancel the event, you will get a full refund of the registration fee (excluding payment gateway charges). If we move it to a new date, you can choose to keep your registration for the new date or take the refund.',
        ]} />
      </Section>

      <Section title="4. Payment gateway charges">
        <P>
          Payment gateway charges (the Razorpay fee plus GST on that fee — currently 2.36% of the amount charged) are paid to Razorpay when you
          pay. They are shown separately before every payment and are not refundable, except when a payment is refunded automatically
          because it could not be applied to your account.
        </P>
      </Section>

      <Section title="5. How to request a refund">
        <P>Email {CONTACT_EMAIL} or call us, and include:</P>
        <List items={[
          'Your registered mobile number or email address',
          'The Razorpay payment ID (shown on the receipt we emailed you)',
          'What you bought and why you are asking for a refund',
        ]} />
        <P>We aim to reply within 2 business days and to review the request within 5 business days.</P>
      </Section>

      <Section title="6. When you will receive it">
        <P>
          Approved refunds are made through Razorpay to the original payment method (card, UPI, net banking or wallet). The money usually
          reaches your account within 5–7 business days; the exact time depends on your bank. If the original payment method is no longer
          available, contact us to arrange another way.
        </P>
      </Section>

      <Section title="7. Changes to this policy">
        <P>
          We may update this policy. Changes apply to payments made after the new version is posted on this page.
        </P>
      </Section>

      <Section title="8. Contact us">
        <ContactBlock intro="For cancellation and refund questions, please contact us:" />
      </Section>
    </LegalPage>
  );
}
