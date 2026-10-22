import LegalPage, { ContactBlock, List, P, Section, Sub } from '@/components/legal/LegalPage';
import { OPERATOR, SITE_NAME, SITE_URL } from '@/lib/siteInfo';

export const metadata = {
  title: 'Privacy Policy | SNGS Matrimony',
  description: 'What personal information SNGS Matrimony collects, who can see it, which service providers process it, how long it is kept and your rights.',
};

export default function PrivacyPolicyPage() {
  return (
    <LegalPage title="Privacy Policy" current="/privacy-policy">
      <Section title="Introduction">
        <P>
          {SITE_NAME} ({SITE_URL}) is operated by {OPERATOR} (&quot;we&quot;, &quot;us&quot;). This policy explains what personal information we
          collect, why, who can see it, and how long we keep it. We handle your information in line with applicable Indian law, including the
          Digital Personal Data Protection Act, 2023.
        </P>
      </Section>

      <Section title="1. Information we collect">
        <Sub>Account and verification</Sub>
        <List items={[
          'Your name, mobile number and email address. Both are verified by one-time password (OTP).',
          'Your password, which is stored only in a scrambled (hashed) form that we cannot read.',
          'An ID proof, if you upload one, to verify your identity.',
        ]} />
        <Sub>Your profile</Sub>
        <List items={[
          'Personal details: date, time and place of birth, gender, height, weight, physical status, complexion, blood group, diet, marital status, mother tongue and languages.',
          'Community and horoscope details: religion, caste, nakshatra, raasi, shuddha jathakam, dosham and any horoscope document you upload.',
          'Education, employment, occupation and income.',
          "Family details: parents' names and occupations, family and residential status.",
          'Your present address and native place (Tharavadu).',
          'Partner preferences, interests and the description you write about yourself.',
          'Profile and gallery photos.',
        ]} />
        <Sub>Unfinished registrations</Sub>
        <List items={[
          'The details from the first registration step (name, date of birth, gender, place, mobile number and preferred partner age) are saved as soon as you complete that step, even if you do not finish registering, so our team can help you complete it.',
          'Details from later steps are saved as you go, so you can continue where you left off. Photos, documents and your password are not saved until you finish.',
        ]} />
        <Sub>Activity on the website</Sub>
        <List items={[
          'Profiles you like, shortlist, open, unlock or download, the messages you send, and when you were last active.',
          'Profile downloads are logged to help us prevent misuse.',
        ]} />
        <Sub>Payments</Sub>
        <List items={[
          'What you bought, the amount, the payment status, Razorpay order and payment IDs, and when you accepted the payment terms.',
          'Card, UPI and bank details are entered on and handled only by Razorpay. We never see or store them.',
        ]} />
        <Sub>Technical information</Sub>
        <List items={[
          'Your IP address and browser or device details, which appear in our server logs.',
          'Anonymous usage statistics (pages visited) from Vercel Analytics, which does not use cookies or identify you.',
          'Google reCAPTCHA checks your browser for automated activity when you verify a mobile number.',
        ]} />
      </Section>

      <Section title="2. How we use your information">
        <List items={[
          'To create your profile and show it to suitable members',
          'To review and approve profiles and verify ID proofs',
          'To suggest matches and calculate the match percentage shown on profiles',
          'To let members send each other messages',
          'To process payments, add credits and send receipts',
          'To send service emails: verification codes, approval updates, receipts, reminders about unread messages, and a reminder if you have not visited for a while',
          'To help you finish an incomplete registration',
          'To prevent fraud and misuse, and to meet legal obligations',
          'To improve the website',
        ]} />
        <P>We do not sell your personal information, and we do not show advertisements.</P>
      </Section>

      <Section title="3. Who can see your information">
        <Sub>Other members</Sub>
        <P>
          Your profile appears only to approved members looking for someone of your gender, and only after our team has approved it.
          While paid features are switched on, what a member sees depends on what they have unlocked with credits:
        </P>
        <List items={[
          'In search results, before a member unlocks your profile: a heavily blurred preview of your photo, the first letter of each part of your name (for example "A***** N***"), your age, state and country, education and a match percentage. Your photo, full name, city and occupation are shown once a member has unlocked your profile.',
          'Emails telling you that someone is interested in you, matched with you or messaged you show their name in the same masked form.',
          'On your full profile: the details you entered — including your photos, family details, horoscope details and your present and native addresses as you wrote them.',
          'Your phone number: only to members who have unlocked your contact details.',
          'Your horoscope document: only to members who have unlocked downloads for your profile.',
          'A downloaded profile (PDF) contains your profile details but never your phone number.',
        ]} />
        <P>
          When paid features are switched off — for example during a free promotional period — nothing is locked: every approved member who
          can see your profile can see your full name, phone number and horoscope document.
        </P>
        <P>Your ID proof, email address and password are never shown to other members.</P>
        <Sub>Our team</Sub>
        <P>
          Authorised members of our team can see account and profile details, including contact details and ID proofs, so they can review
          profiles, verify identities, handle payments and refunds, and support you.
        </P>
        <Sub>Service providers</Sub>
        <P>We use these providers to run the website. They process your information only to provide their service to us:</P>
        <List items={[
          'MongoDB Atlas — our main database',
          'Supabase — storage for photos and documents, nightly backup copies of member and payment records, and registration progress (some older photos are stored with Amazon Web Services)',
          'Razorpay — payment processing',
          'Google Firebase and reCAPTCHA — mobile number verification',
          'Resend — sending emails',
          'Vercel — website hosting and anonymous analytics',
          'Hostinger — server hosting',
        ]} />
        <P>We may also disclose information when required by law, a court order or a government authority.</P>
      </Section>

      <Section title="4. Security">
        <List items={[
          'All connections to the website are encrypted (HTTPS).',
          'Passwords are stored only in hashed form.',
          'Access to member data is limited to authorised team members.',
          'Payment card data is handled by Razorpay, which is PCI-DSS compliant.',
        ]} />
        <P>No online service can be completely secure, but we work to protect your information and will act promptly on any security issue.</P>
      </Section>

      <Section title="5. How long we keep your information">
        <List items={[
          'While your account is active, we keep your profile and account information.',
          'Messages are deleted automatically 30 days after they are sent.',
          'Activity logs (such as download records) are deleted after 90 days.',
          'Saved registration progress is deleted when you finish registering, or 30 days after it was last updated.',
          'When you delete your account, your profile is hidden immediately. After 30 days we permanently delete your account, photos, documents, conversations and backup copies.',
          'Payment records are kept even after an account is deleted, as required for accounting and tax purposes.',
        ]} />
      </Section>

      <Section title="6. Your rights and choices">
        <List items={[
          'View and correct your information at any time with Edit Profile.',
          'Delete your account from Settings → Delete Account.',
          'Ask us for a copy of your information, or to delete details from an unfinished registration.',
          'Withdraw your consent to us using your information by deleting your account. Some information may still be kept where the law requires it.',
        ]} />
        <P>To make a request, contact us using the details below.</P>
      </Section>

      <Section title="7. Cookies and browser storage">
        <P>
          We use your browser&apos;s local storage to keep you signed in and to remember small preferences, such as a banner you have closed.
          We do not use advertising or tracking cookies. Vercel Analytics does not use cookies. Google reCAPTCHA may set its own cookies when
          you verify a mobile number.
        </P>
      </Section>

      <Section title="8. Children">
        <P>{SITE_NAME} is only for people aged 18 and over. We do not knowingly collect information from anyone under 18.</P>
      </Section>

      <Section title="9. Changes to this policy">
        <P>
          We may update this policy. The updated version will be posted on this page with a new effective date.
        </P>
      </Section>

      <Section title="10. Contact and grievances">
        <ContactBlock intro="For privacy questions, requests or complaints, please contact us:" />
      </Section>
    </LegalPage>
  );
}
