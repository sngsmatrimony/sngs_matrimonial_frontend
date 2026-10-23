import Link from 'next/link';
import LegalPage, { ContactBlock, List, Note, P, Section, Sub } from '@/components/legal/LegalPage';
import { JURISDICTION, OPERATOR, SITE_NAME, SITE_URL } from '@/lib/siteInfo';

export const metadata = {
  title: 'Terms & Conditions',
  alternates: { canonical: '/terms-and-conditions' },
  description: 'The terms for using SNGS Matrimony: eligibility, profile approval, credits and payments, member conduct and account deletion.',
};

const link = (href, text) => <Link href={href} className="text-[#B8860B] underline underline-offset-2">{text}</Link>;

export default function TermsAndConditionsPage() {
  return (
    <LegalPage title="Terms & Conditions" current="/terms-and-conditions">
      <Section title="Introduction">
        <P>
          These Terms &amp; Conditions govern your use of {SITE_NAME} ({SITE_URL}), a matrimonial platform operated by {OPERATOR} (&quot;we&quot;, &quot;us&quot;).
          {' '}{SITE_NAME} is open to members of every Malayalee community, in India and abroad. By registering or using the website you agree to these Terms,
          our {link('/privacy-policy', 'Privacy Policy')} and our {link('/cancellation-and-refund', 'Cancellation & Refund Policy')}.
          If you do not agree, please do not use the service.
        </P>
      </Section>

      <Section title="1. Eligibility">
        <List items={[
          'You must be at least 18 years old and legally eligible to marry under the laws that apply to you.',
          'You must honestly declare your marital status (Never Married, Divorced, Widowed or Awaiting Divorce). If you are awaiting divorce, you must not marry again until the divorce is legally final.',
          'You must be able to enter into a binding agreement and must not be barred by law from using matrimonial services.',
        ]} />
      </Section>

      <Section title="2. Registration, verification and approval">
        <List items={[
          'Your mobile number and email address are verified by one-time password (OTP) when you register. One account is allowed per person and per mobile number.',
          'You must give accurate, current and complete information and keep your password confidential. Tell us immediately if you suspect someone else is using your account.',
          'Every new profile is reviewed by our team before other members can see it. We may approve it, ask you to correct it, or reject it. Changing certain details (such as your name) sends the profile back for review.',
          'We may ask you to upload a government-issued ID proof. A "Verified" badge appears on your profile only after our team has checked it. ID proofs are seen only by our team, never by other members.',
          'If you leave registration part-way, the details you entered are saved against your verified mobile number for up to 30 days so you can continue later, and our team may contact you to help you finish.',
          'Approval and ID verification confirm only what our team checked. They are not a guarantee of everything a member says about themselves.',
        ]} />
      </Section>

      <Section title="3. Membership, credits and payments">
        <P>
          Creating a profile and browsing matches is free. Some actions use <strong>credits</strong>: opening a member&apos;s full profile,
          unlocking their phone number and chat, and downloading their profile or horoscope. The number of credits each action uses depends
          on your plan (some plans include an action at no credit cost) and is always shown before credits are used. Once you have unlocked a
          profile, opening it again is free whenever you have an active plan, including after you renew.
        </P>
        <Sub>Plans</Sub>
        <List items={[
          <>A plan gives you a number of credits for a fixed period (for example 180 days). Current plans and prices are shown on the {link('/membership/purchase', 'Membership page')}.</>,
          'A new plan can be bought when you do not have an active plan.',
          'Plans are one-time purchases. They do not renew automatically.',
        ]} />
        <Sub>Credit packs</Sub>
        <List items={[
          'While a plan is active you can buy extra credits in packs. Credits from a pack can be used only until your current plan ends.',
        ]} />
        <Sub>When a plan ends</Sub>
        <List items={[
          'Any credits left at the end of your plan expire and cannot be carried forward or refunded.',
          'Profiles, contact details and downloads you unlocked stay linked to your account but are locked while you have no active plan. When you buy a new plan, they open again at no extra cost.',
        ]} />
        <Sub>Prices and payment</Sub>
        <List items={[
          'Prices are in Indian Rupees (INR). Payment gateway charges (the Razorpay fee plus GST on that fee — currently 2.36% of the amount charged) are added at checkout and shown before you pay.',
          'Before every payment you are asked to review and accept these Terms; the payment starts only after you agree.',
          'All payments are processed by Razorpay. After each successful payment a receipt is emailed to your registered email address (with a PDF copy), and you can download the PDF again any time from My Profile → Payment receipts.',
          'We may change prices or credit costs at any time. Changes apply to future purchases, not to plans or packs you have already paid for.',
          'From time to time we may offer features free for a limited period (for example, free registration during a launch offer). We will announce on the website before charges begin.',
        ]} />
      </Section>

      <Section title="4. Alliance Meet and other events">
        <P>
          We may organise in-person community events such as the SNGS Alliance Meet. Registration for a paid event is a one-time payment of the
          registration fee plus payment gateway charges. Our team shares the event details by email or phone. You must behave respectfully at
          events and follow the organisers&apos; instructions. Refunds for event registrations are covered in our {link('/cancellation-and-refund', 'Cancellation & Refund Policy')}.
        </P>
      </Section>

      <Section title="5. Contact details and members' information">
        <List items={[
          "A member's phone number is shown only after it has been unlocked (or to every approved member while paid features are switched off, for example during a free promotional period). Use it only to discuss a possible marriage alliance, and stop contacting a member who says they are not interested.",
          'Profiles you download are for your and your family’s personal use in considering a match. They must not be shared publicly or used for any other purpose.',
          'Never ask other members for money, and never share bank details, passwords or OTPs with anyone — our team will never ask for them.',
        ]} />
      </Section>

      <Section title="6. Conduct and prohibited activities">
        <P>You agree not to:</P>
        <List items={[
          'Give false, misleading or fraudulent information, or impersonate any person',
          'Harass, abuse, threaten or intimidate other members',
          'Send spam, advertisements or unsolicited messages',
          'Upload content that is obscene, offensive, illegal or that you do not have the right to share',
          'Use bots, scripts or other automated tools to collect, scrape or bulk-download profiles, photos or contact details',
          'Copy, resell or redistribute member profiles or photos, including for offline matchmaking or brokering services',
          'Ask other members for money or financial help',
          'Create profiles for commercial or non-matrimonial purposes',
          'Try to hack, overload or interfere with the website',
        ]} />
        <P>Breaking these rules may lead to immediate suspension or termination of your account without refund, in addition to any other legal remedies available to us.</P>
      </Section>

      <Section title="7. Photos and content">
        <List items={[
          'Profile photos must be recent, clear photos of you. Blurry, dark or heavily filtered photos may delay approval.',
          'Photos and text must not contain nudity, violence or offensive material, and must not infringe anyone else’s rights.',
          'You keep ownership of what you upload, but allow us to display it on the website to other members and to use it to run the service.',
          'We may remove any content that breaks these rules without notice.',
        ]} />
      </Section>

      <Section title="8. Messages">
        <P>
          Members can send each other messages on the website. Messages are stored on our servers so they can be delivered and are deleted
          automatically after 30 days. Do not share sensitive information such as bank details or passwords in chat.
        </P>
      </Section>

      <Section title="9. Intellectual property">
        <P>
          The website, its design, logos, text and software belong to {OPERATOR}. You may not copy, modify or reuse them without our written permission.
        </P>
      </Section>

      <Section title="10. Your safety and our liability">
        <Note>
          {SITE_NAME} is a platform for members and families to find and contact each other. Before taking any decision, please verify
          a member&apos;s details yourself — family, background, horoscope and any other information that matters to you.
        </Note>
        <List items={[
          'We do not guarantee the accuracy of information given by members, or that you will find a match.',
          'We are not responsible for conversations, meetings or dealings between members, on or off the website.',
          'To the maximum extent permitted by law, we are not liable for any indirect, incidental, special, consequential or punitive damages arising from your use of the service.',
        ]} />
      </Section>

      <Section title="11. Deleting your account and termination">
        <List items={[
          'You can delete your account at any time from Settings → Delete Account. Your profile is hidden immediately and your data is permanently deleted after 30 days, as described in our Privacy Policy.',
          'Deleting your account does not by itself entitle you to a refund. Unused credits are lost when the account is deleted.',
          'We may suspend or terminate an account that breaks these Terms, gives false information, receives repeated genuine complaints, or where required by law.',
        ]} />
      </Section>

      <Section title="12. Governing law and disputes">
        <P>
          These Terms are governed by the laws of India. Please contact us first so we can try to resolve any concern. If a dispute cannot be
          resolved within 30 days, it will be subject to the exclusive jurisdiction of the courts at {JURISDICTION}.
        </P>
      </Section>

      <Section title="13. Changes to these Terms">
        <P>
          We may update these Terms. The updated version will be posted on this page with a new effective date. If you continue to use the
          service after a change, you accept the updated Terms.
        </P>
      </Section>

      <Section title="14. Contact us">
        <ContactBlock intro="For any questions about these Terms, please contact us:" />
      </Section>
    </LegalPage>
  );
}
