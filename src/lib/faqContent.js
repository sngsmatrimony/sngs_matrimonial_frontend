// Frequently asked questions — the single source for the /faq page, its
// FAQPage structured data, the NRI page and /llms.txt. Answers describe how
// the platform actually works today; keep them in step with the product and
// the policy pages. Plain text only (structured data must match the page).
import { CONTACT_EMAIL, CONTACT_PHONE_DISPLAY, OFFICE_ADDRESS, SUPPORT_HOURS } from '@/lib/siteInfo';

export const FAQ_GROUPS = [
  {
    id: 'about',
    title: 'About SNGS Matrimony',
    items: [
      {
        q: 'What is SNGS Matrimony?',
        a: 'SNGS Matrimony (sngsmatrimony.com) is a matrimonial website for Malayalee families in Kerala, across India and abroad. It is run by SNGS Pune and inspired by Sree Narayana Guru\'s message of "one caste, one religion, one God", so it is open to every caste and community.',
      },
      {
        q: 'Who can register on SNGS Matrimony?',
        a: 'Anyone aged 18 or over who is looking for a life partner and has a connection to the Malayalee community, wherever they live. Members of every caste and community are welcome.',
      },
      {
        q: 'Is it free to register?',
        a: 'Yes. Creating a profile and browsing matches is free. Viewing a full profile, unlocking a member\'s phone number and chat, and downloading a profile use credits from a membership plan.',
      },
    ],
  },
  {
    id: 'profiles',
    title: 'Profiles & Verification',
    items: [
      {
        q: 'How are profiles verified?',
        a: 'Every new member verifies their mobile number with a one-time code, and the SNGS team reviews and approves each profile before it appears in search. Members can also upload a government ID such as Aadhaar, passport, driving licence or voter ID; once the team checks it, the profile shows a Verified badge.',
      },
      {
        q: 'How long does registration take?',
        a: 'A few minutes. Registration has seven short steps — starting with your name, age, place, partner age range and mobile number — and your answers are saved after each step for 30 days, so you can stop and continue later.',
      },
      {
        q: 'Who can see my horoscope document?',
        a: 'Your horoscope document is never shown openly. Our admin team can see it, and you always see your own. Other members can see it only when SNGS has horoscope sharing switched on, and then only after paying a one-time fee for your horoscope. Your Nakshatra, Raasi and birth details are shown on your profile as usual.',
      },
      {
        q: 'Can I include horoscope details?',
        a: 'Yes. Members can add their Nakshatra, Raasi, horoscope details and a horoscope document. Nakshatra and Raasi are required for Hindu members and optional for everyone else, and Hindu members see a basic Raasi compatibility check on profiles.',
      },
      {
        q: 'How does the match percentage work?',
        a: 'Each profile shows a compatibility percentage based on shared interests, both members\' preferred age ranges, location (current or native place), religion, marital status, mother tongue, caste and, for Hindu members, basic horoscope compatibility. The score is the same from both sides.',
      },
    ],
  },
  {
    id: 'privacy',
    title: 'Privacy & Safety',
    items: [
      {
        q: 'Who can see my photos and contact details?',
        a: 'Until another member unlocks your profile, they see only a heavily blurred preview of your photo, the first letter of each part of your name, your age, state, country and education. Your full name, photos, city and job are shown only after they unlock your profile, and your phone number only after they unlock phone and chat. Phone numbers are never included in downloaded profile PDFs.',
      },
      {
        q: 'Is my ID proof shown to other members?',
        a: 'No. Your government ID is seen only by the SNGS team for verification — never by other members.',
      },
      {
        q: 'How do I stay safe while talking to matches?',
        a: 'Never share bank details or one-time codes, and verify a person\'s identity before meeting. A safety reminder appears in every chat, and you can contact the SNGS team about any member who behaves inappropriately.',
      },
    ],
  },
  {
    id: 'plans',
    title: 'Plans, Credits & Payments',
    items: [
      {
        q: 'How do membership plans and credits work?',
        a: 'A membership plan gives you a number of credits for a set period. Viewing a full profile, unlocking phone and chat, and downloading a profile each use the number of credits shown for your plan — the cost and your remaining balance are always shown before you confirm. Re-opening anything you have already unlocked is free while you have an active plan.',
      },
      {
        q: 'Can I buy more credits?',
        a: 'Yes. While a plan is active you can buy extra credit packs. They are added to your current plan and can be used until it ends.',
      },
      {
        q: 'What happens when my plan ends?',
        a: 'Any credits left over lapse and the profiles you unlocked are locked until you renew. When you buy a new plan, every profile you unlocked before opens again at no extra cost.',
      },
      {
        q: 'How can I pay, and are there extra charges?',
        a: 'Payments are processed securely by Razorpay using UPI, debit or credit cards, or net banking. A payment gateway charge of about 2.36% (including GST) is added and shown, with the total, before you pay. You receive a PDF receipt on screen and by email, and every receipt can be downloaded later from your profile.',
      },
      {
        q: 'What is the refund policy?',
        a: 'A plan or credit pack is refunded in full, excluding payment gateway charges, if you ask within 7 days of the payment and none of its credits have been used. Payments the platform cannot apply are refunded automatically. See the Cancellation & Refund policy for details.',
      },
    ],
  },
  {
    id: 'nri',
    title: 'For NRIs & Families Abroad',
    items: [
      {
        q: 'Is SNGS Matrimony for NRIs and Malayalees living abroad?',
        a: 'Yes. Members and their families live in Kerala, elsewhere in India and abroad — including the Gulf countries (UAE, Saudi Arabia, Qatar, Kuwait, Bahrain and Oman), the USA, the UK, Canada, Australia, New Zealand, Singapore and Malaysia — and you can search matches by country and state.',
      },
      {
        q: 'Can my family in Kerala see a profile I am interested in?',
        a: 'Yes. You can download a clean, print-ready "Share with Family" PDF of a profile you have unlocked to share with parents and relatives. Phone numbers are never included in it.',
      },
    ],
  },
  {
    id: 'alliance-meet',
    title: 'SNGS Alliance Meet',
    items: [
      {
        q: 'What is the SNGS Alliance Meet?',
        a: 'The SNGS Alliance Meet is an in-person event where families from the community meet. When registration is open, approved members can register and pay online from their Settings page and receive a PDF receipt.',
      },
    ],
  },
  {
    id: 'account',
    title: 'Account & Support',
    items: [
      {
        q: 'Can I delete my account?',
        a: 'Yes, from Settings. Your profile is hidden immediately and your account, photos, documents and messages are permanently deleted after 30 days.',
      },
      {
        q: 'How do I contact SNGS Matrimony?',
        a: `Email ${CONTACT_EMAIL} or call ${CONTACT_PHONE_DISPLAY} (${SUPPORT_HOURS}). Office: ${OFFICE_ADDRESS}.`,
      },
    ],
  },
];

export const ALL_FAQS = FAQ_GROUPS.flatMap((g) => g.items);
export const faqsFor = (groupIds) => FAQ_GROUPS.filter((g) => groupIds.includes(g.id)).flatMap((g) => g.items);
