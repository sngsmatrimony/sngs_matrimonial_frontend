import Link from 'next/link';
import JsonLd from '@/components/seo/JsonLd';
import { faqsFor } from '@/lib/faqContent';
import { AREAS_SERVED, breadcrumbJsonLd, faqJsonLd, pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata({
  title: 'NRI Malayalee Matrimony — Kerala Matches in the Gulf, USA, UK, Canada & Australia',
  description: 'Malayalee matrimony for NRIs and their families: search Kerala brides and grooms by country — UAE, Saudi Arabia, Qatar, Kuwait, Oman, Bahrain, USA, UK, Canada, Australia and more — with reviewed profiles and privacy-first matching.',
  path: '/nri-matrimony',
});

const REASONS = [
  ['Rooted in the community', 'Run by SNGS Pune and inspired by Sree Narayana Guru\'s message of one caste, one religion, one God — open to every Malayalee caste and community, wherever you live.'],
  ['Every profile reviewed', 'Members verify their mobile number, and the SNGS team approves each profile before it appears. Members who upload a government ID earn a Verified badge once it is checked.'],
  ['Search by country and state', 'Filter matches by where they live — Kerala, elsewhere in India or abroad — and see a match percentage that also considers native place.'],
  ['Privacy first', 'Names and photos stay masked and blurred until a member unlocks your profile, and your phone number is shown only after they unlock phone and chat.'],
  ['Keep the family involved', 'Share a clean, print-ready profile PDF with parents and relatives in Kerala. Phone numbers are never printed in it.'],
  ['Talk in the app', 'Once phone and chat are unlocked, message your match directly on the site — you are emailed when someone new messages you, so you never miss a first hello.'],
];

const STEPS = [
  ['Create your free profile', 'Verify your mobile number, add your details, photos and partner preferences. Your progress is saved after every step.'],
  ['Find your matches', 'Search by country, state, education, community and more, sorted by best match or most recently active.'],
  ['Connect with confidence', 'Unlock a profile to see the full details, then unlock phone and chat to talk directly.'],
];

const FAQS = faqsFor(['nri', 'about', 'privacy']);

export default function NriMatrimonyPage() {
  return (
    <div className="min-h-screen bg-[#FDF8F0]">
      <JsonLd data={[faqJsonLd(FAQS), breadcrumbJsonLd([['Home', '/'], ['NRI Matrimony', '/nri-matrimony']])]} />

      <section className="bg-gradient-to-br from-[#2C3E50] to-[#1A1A1A] text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <p className="font-sans text-sm font-semibold uppercase tracking-[0.2em] text-[#D4A843] mb-3">For NRIs &amp; families abroad</p>
          <h1 className="font-serif text-3xl sm:text-5xl font-bold leading-tight mb-5">Malayalee Matrimony for NRIs</h1>
          <p className="font-sans text-lg text-white/80 max-w-2xl mx-auto mb-8">
            Find a Malayalee life partner from Kerala, across India or abroad — in the Gulf, the USA, the UK, Canada,
            Australia and beyond — with your family involved at every step.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/register" className="bg-[#D4A843] hover:bg-[#B8860B] text-[#1A1A1A] px-8 py-3.5 rounded-lg font-sans font-semibold text-lg">Register Free</Link>
            <Link href="/faq" className="border-2 border-[#F5E6C3] text-[#F5E6C3] hover:bg-[#F5E6C3] hover:text-[#1A1A1A] px-8 py-3.5 rounded-lg font-sans font-semibold text-lg">Read the FAQ</Link>
          </div>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-16">
        <section aria-labelledby="where">
          <h2 id="where" className="font-serif text-2xl sm:text-3xl font-semibold text-[#1A1A1A] mb-3">Malayalees around the world</h2>
          <p className="font-sans text-[15px] text-[#2C3E50] leading-relaxed mb-5 max-w-3xl">
            Members tell us where they live, so you can search for matches in your own country — or back home in Kerala.
          </p>
          <ul className="flex flex-wrap gap-2">
            {AREAS_SERVED.map((c) => (
              <li key={c} className="font-sans text-sm px-3 py-1.5 rounded-full bg-white border border-[#D4A843]/30 text-[#1A1A1A]">{c}</li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="why">
          <h2 id="why" className="font-serif text-2xl sm:text-3xl font-semibold text-[#1A1A1A] mb-6">Why NRI families choose SNGS Matrimony</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {REASONS.map(([title, text]) => (
              <div key={title} className="bg-white rounded-xl border border-[#D4A843]/20 p-5">
                <h3 className="font-serif text-lg font-semibold text-[#1A1A1A] mb-1.5">{title}</h3>
                <p className="font-sans text-[15px] text-[#2C3E50] leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </section>

        <section aria-labelledby="how">
          <h2 id="how" className="font-serif text-2xl sm:text-3xl font-semibold text-[#1A1A1A] mb-6">How it works</h2>
          <ol className="grid sm:grid-cols-3 gap-4">
            {STEPS.map(([title, text], i) => (
              <li key={title} className="bg-white rounded-xl border border-[#D4A843]/20 p-5">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#F5E6C3] text-[#B8860B] font-serif font-bold mb-3">{i + 1}</span>
                <h3 className="font-serif text-lg font-semibold text-[#1A1A1A] mb-1.5">{title}</h3>
                <p className="font-sans text-[15px] text-[#2C3E50] leading-relaxed">{text}</p>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="nri-faq">
          <h2 id="nri-faq" className="font-serif text-2xl sm:text-3xl font-semibold text-[#1A1A1A] mb-5">Questions NRI families ask</h2>
          <div className="space-y-3">
            {FAQS.map(({ q, a }) => (
              <details key={q} className="group bg-white border border-[#D4A843]/20 rounded-xl px-5 py-4">
                <summary className="cursor-pointer list-none flex items-start justify-between gap-4 font-sans font-semibold text-[#1A1A1A] text-[15px]">
                  <span>{q}</span>
                  <span aria-hidden="true" className="text-[#B8860B] text-xl leading-none transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="font-sans text-[15px] text-[#2C3E50] leading-relaxed mt-3">{a}</p>
              </details>
            ))}
          </div>
          <p className="font-sans text-sm text-[#2C3E50]/70 mt-4">
            More answers on the <Link href="/faq" className="text-[#B8860B] underline underline-offset-2">FAQ page</Link>.
          </p>
        </section>

        <section className="rounded-2xl bg-gradient-to-br from-[#2C3E50] to-[#1A1A1A] p-8 text-center">
          <h2 className="font-serif text-2xl font-semibold text-white mb-2">Start your search today</h2>
          <p className="font-sans text-white/80 mb-6">Registration is free and takes a few minutes.</p>
          <Link href="/register" className="inline-block bg-[#D4A843] hover:bg-[#B8860B] text-[#1A1A1A] px-8 py-3.5 rounded-lg font-sans font-semibold">Create your profile</Link>
        </section>
      </div>
    </div>
  );
}
