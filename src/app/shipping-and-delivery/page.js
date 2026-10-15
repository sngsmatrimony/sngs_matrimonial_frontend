import LegalPage, { ContactBlock, List, Note, P, Section, Sub } from '@/components/legal/LegalPage';
import { SITE_NAME } from '@/lib/siteInfo';

export const metadata = {
  title: 'Shipping & Delivery Policy | SNGS Matrimony',
  description: 'SNGS Matrimony is a digital service: how plans, credits, downloads and Alliance Meet registrations are delivered.',
};

export default function ShippingAndDeliveryPage() {
  return (
    <LegalPage title="Shipping & Delivery Policy" current="/shipping-and-delivery">
      <Section title="Introduction">
        <Note>
          {SITE_NAME} is an online service. We do not sell or ship physical products, so there are no shipping charges, delivery addresses or
          tracking numbers. This policy explains how what you buy is delivered.
        </Note>
      </Section>

      <Section title="1. What we provide">
        <List items={[
          'Free registration, profile creation and match browsing',
          'Credits (through membership plans and credit packs) to open full profiles, unlock contact details and chat, and download profiles and horoscopes',
          'Messaging between members',
          'Registration for community events such as the SNGS Alliance Meet',
        ]} />
      </Section>

      <Section title="2. How each service is delivered">
        <Sub>Your profile</Sub>
        <P>
          Your account is created as soon as you finish registering. Your profile becomes visible to other members after our team has
          reviewed and approved it.
        </P>
        <Sub>Membership plans and credit packs</Sub>
        <P>
          Credits are added to your account as soon as Razorpay confirms your payment — usually within a few seconds. A receipt showing the
          price, the payment gateway charges and the total is emailed to your registered email address with a PDF copy attached; you can also download it from the payment screen, the Transactions page or My Profile → Payment receipts. If the credits do not appear within
          30 minutes of a successful payment, please contact us.
        </P>
        <Sub>Downloads</Sub>
        <P>Profile and horoscope downloads are generated and downloaded in your browser straight away.</P>
        <Sub>Alliance Meet</Sub>
        <P>
          Your registration is confirmed on screen and by email as soon as the payment succeeds. The event itself takes place in person; our
          team shares the date, venue and other details by email or phone.
        </P>
      </Section>

      <Section title="3. What you need">
        <List items={[
          'A phone, tablet or computer with an internet connection',
          'An up-to-date web browser (Chrome, Safari, Firefox or Edge) with JavaScript enabled',
          'A mobile number and email address that can receive verification codes',
        ]} />
      </Section>

      <Section title="4. Availability">
        <P>
          The website is available 24 hours a day, from India and abroad. It may occasionally be unavailable for maintenance or for reasons
          beyond our control; we try to keep any interruption short.
        </P>
      </Section>

      <Section title="5. Changes to this policy">
        <P>We may update this policy. The updated version will be posted on this page with a new effective date.</P>
      </Section>

      <Section title="6. Contact us">
        <ContactBlock intro="If something you paid for has not reached your account, please contact us:" />
      </Section>
    </LegalPage>
  );
}
