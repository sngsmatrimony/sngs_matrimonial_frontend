'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ShieldCheck, Globe2, Heart, Award, Sparkles, Quote, FileCheck, ClipboardCheck, UserCheck } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

// FAQ_ITEMS: sensible generic answers — please review and adjust wording/details before publishing.
const FAQ_ITEMS = [
  {
    question: 'Is SNGS Matrimony only for the Ezhava community?',
    answer:
      'Yes. SNGS Matrimony is built specifically for the Malayali Ezhava community, across Kerala, the rest of India, and the NRI diaspora (Gulf, US, UK, Australia). This focus lets us support community-specific details — sub-caste, family deity, Tharavadu, and Kerala horoscope fields — that generic platforms don’t.',
  },
  {
    question: 'How are profiles verified?',
    answer:
      'Every profile is reviewed by our team before it goes live — see the verification steps above. We check the information provided and flag anything that looks incomplete or inconsistent before approving a profile.',
  },
  {
    question: 'Is my contact information kept private?',
    answer:
      'Yes. Photos can be marked private, and contact details stay masked until there is mutual interest or an active membership, so you control what you share and with whom.',
  },
  {
    question: 'Do you support NRI members from the Gulf, US, UK, and Australia?',
    answer:
      'Yes. We support members across the diaspora with location-aware filters, and our chat experience is designed to work well across time zones so families abroad can stay connected without friction.',
  },
  {
    question: 'What happens after I express interest in a profile?',
    answer:
      'The other member is notified and can choose to respond. Once there is mutual interest, you can chat directly within the platform to get to know each other and involve family in the conversation when you’re ready.',
  },
];

const MILESTONES = [
  { year: '[TBD]', label: 'SNGS Matrimony founded' },
  { year: '[TBD]', label: '[TBD] successful alliances facilitated' },
  { year: '[TBD]', label: 'Expanded to serve the NRI diaspora' },
];

export default function AboutUsPage() {
  return (
    <div className="min-h-screen bg-[#FDF8F0] font-sans flex flex-col">
      <main className="flex-1">
        
        {/* 1. PAGE HERO: Premium Navy Background */}
        <section className="bg-[#2C3E50] py-20 lg:py-28 relative overflow-hidden">
          {/* Subtle gold hairline at the bottom */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[#D4A843]/0 via-[#D4A843] to-[#D4A843]/0" />
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <p className="font-sans text-[#D4A843] font-semibold text-sm uppercase tracking-[0.2em] mb-4 flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4" /> Our Story
            </p>
            <h1 className="font-serif text-4xl md:text-5xl lg:text-[56px] text-white font-bold leading-tight mb-6">
              Rooted in Tradition. <br className="hidden sm:block" />
              <span className="text-[#F5E6C3] font-medium">Built for Tomorrow.</span>
            </h1>
            <p className="font-sans text-lg text-[#F5E6C3] max-w-2xl mx-auto font-light leading-relaxed">
              We are a hyper-localized matrimonial platform dedicated exclusively to the Malayali Ezhava community, bridging deep family roots with modern digital convenience.
            </p>
          </div>
        </section>

        {/* 2. THE HERITAGE SECTION: Offline to Online */}
        <section className="py-20 lg:py-28 bg-[#FDF8F0]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col lg:flex-row items-center gap-16">
              
              <div className="lg:w-1/2 space-y-6">
                <h2 className="font-serif text-3xl md:text-4xl text-[#1A1A1A] font-bold leading-tight">
                  From Offline Alliances to a Global Community
                </h2>
                <div className="w-16 h-1 bg-[#D4A843]"></div>
                <div className="space-y-4 font-sans text-[#2C3E50] text-lg leading-relaxed">
                  <p>
                    For decades, marriages in our community were built on personal introductions, community gatherings, and deep family networks. Trust wasn&apos;t just a buzzword; it was the foundation of every alliance.
                  </p>
                  <p>
                    SNGS Matrimony was born to bring that exact level of trust into the digital age. We realized that generic national platforms treat everyone the same. They overlook the details that matter to us—from specific Tharavadu histories to Kerala-specific horoscope alignments like Nakshatra and Dosham.
                  </p>
                  <p>
                    Today, we combine our offline matchmaking heritage with a premium digital experience to help Ezhava families across India and the NRI diaspora find their perfect match.
                  </p>
                </div>
              </div>

              {/* Image Grid */}
              <div className="lg:w-1/2 grid grid-cols-2 gap-4 relative">
                <div className="aspect-[4/5] rounded-2xl overflow-hidden relative translate-y-8 shadow-sm">
                  <Image
                    src="/images/bg_3.jpg"
                    alt="Traditional Kerala wedding ceremony"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="aspect-[4/5] bg-[#2C3E50] rounded-2xl border border-[#D4A843]/20 relative overflow-hidden flex flex-col items-center justify-center p-6 text-center shadow-lg">
                   <Award className="w-12 h-12 text-[#D4A843] mb-4" />
                   <h3 className="font-serif text-white text-2xl font-bold mb-2">100%</h3>
                   <p className="text-[#F5E6C3] font-sans text-sm">Manually Verified Profiles</p>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* 3. CORE VALUES GRID */}
        <section className="py-20 bg-white border-y border-[#D4A843]/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="font-serif text-3xl md:text-4xl text-[#1A1A1A] font-bold mb-4">Why Families Trust Us</h2>
              <div className="w-16 h-1 bg-[#D4A843] mx-auto mb-6"></div>
              <p className="font-sans text-[#2C3E50] text-lg">
                We don&apos;t aim to be the biggest platform. We aim to be the most trusted.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              {/* Value 1: NRI Reach */}
              <div className="bg-[#FDF8F0] p-8 rounded-2xl border border-[#D4A843]/15 shadow-sm hover:shadow-md transition-shadow group">
                <div className="w-14 h-14 bg-white border border-[#D4A843]/30 rounded-full flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform duration-300">
                  <Globe2 className="w-6 h-6 text-[#D4A843]" />
                </div>
                <h3 className="font-serif text-xl font-bold text-[#1A1A1A] mb-3">The NRI Bridge</h3>
                <p className="font-sans text-[#2C3E50] leading-relaxed">
                  Connecting Ezhava families locally and globally. Whether you are in Kerala, Bengaluru, the Gulf, the US, or the UK, our platform bridges the distance.
                </p>
              </div>

              {/* Value 2: Privacy */}
              <div className="bg-[#FDF8F0] p-8 rounded-2xl border border-[#D4A843]/15 shadow-sm hover:shadow-md transition-shadow group">
                <div className="w-14 h-14 bg-white border border-[#D4A843]/30 rounded-full flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform duration-300">
                  <ShieldCheck className="w-6 h-6 text-[#D4A843]" />
                </div>
                <h3 className="font-serif text-xl font-bold text-[#1A1A1A] mb-3">Privacy & Consent</h3>
                <p className="font-sans text-[#2C3E50] leading-relaxed">
                  No dark patterns and no exposed phone numbers. Contact details and photos remain masked until there is mutual consent between families.
                </p>
              </div>

              {/* Value 3: Cultural Depth */}
              <div className="bg-[#FDF8F0] p-8 rounded-2xl border border-[#D4A843]/15 shadow-sm hover:shadow-md transition-shadow group">
                <div className="w-14 h-14 bg-white border border-[#D4A843]/30 rounded-full flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform duration-300">
                  <Heart className="w-6 h-6 text-[#D4A843]" />
                </div>
                <h3 className="font-serif text-xl font-bold text-[#1A1A1A] mb-3">Community Depth</h3>
                <p className="font-sans text-[#2C3E50] leading-relaxed">
                  We honor the nuances of our culture. Our profiles feature deep filters for Sub-caste, Family Deity, Nakshatra, and Rashi for perfect alignment.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 4. LEADERSHIP / FOUNDER'S NOTE — placeholder: swap in real founder photo, name, title, and quote */}
        <section className="py-20 bg-[#FDF8F0]">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-2xl border border-[#D4A843]/15 shadow-sm p-8 md:p-12 flex flex-col md:flex-row items-center gap-8">
              <div className="w-32 h-32 rounded-full bg-[#F5E6C3]/50 border-2 border-dashed border-[#D4A843]/40 flex items-center justify-center shrink-0">
                <UserCheck className="w-10 h-10 text-[#D4A843]/60" />
              </div>
              <div className="text-center md:text-left">
                <Quote className="w-8 h-8 text-[#D4A843]/40 mb-3 mx-auto md:mx-0" />
                <p className="font-serif text-xl text-[#1A1A1A] italic leading-relaxed mb-4">
                  &ldquo;[Placeholder — a short personal note from the founder on why SNGS Matrimony was started and what trust means to this community.]&rdquo;
                </p>
                <p className="font-sans text-sm font-semibold text-[#1A1A1A]">[Founder Name]</p>
                <p className="font-sans text-xs text-[#2C3E50]/60">[Title / Role] — SNGS Matrimony</p>
              </div>
            </div>
          </div>
        </section>

        {/* 5. MILESTONES TIMELINE — placeholder years/numbers marked [TBD], confirm before publishing */}
        <section className="py-20 bg-white border-y border-[#D4A843]/20">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <h2 className="font-serif text-3xl md:text-4xl text-[#1A1A1A] font-bold mb-4">Our Journey</h2>
              <div className="w-16 h-1 bg-[#D4A843] mx-auto" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {MILESTONES.map((m, idx) => (
                <div key={idx} className="text-center">
                  <div className="font-serif text-3xl font-bold text-[#D4A843] mb-2">{m.year}</div>
                  <p className="font-sans text-[#2C3E50] text-sm">{m.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 6. VERIFICATION PROCESS — written to match the actual admin approval flow */}
        <section className="py-20 bg-[#FDF8F0]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <h2 className="font-serif text-3xl md:text-4xl text-[#1A1A1A] font-bold mb-4">How We Verify Every Profile</h2>
              <p className="font-sans text-[#2C3E50] text-lg">
                Trust isn&apos;t just claimed here — it&apos;s built into how every profile reaches you.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-14 h-14 bg-white border border-[#D4A843]/30 rounded-full flex items-center justify-center mb-5 mx-auto shadow-sm">
                  <ClipboardCheck className="w-6 h-6 text-[#D4A843]" />
                </div>
                <h3 className="font-serif text-lg font-bold text-[#1A1A1A] mb-2">1. Profile Review</h3>
                <p className="font-sans text-sm text-[#2C3E50] leading-relaxed">
                  Our team reviews every new profile for completeness and consistency before it&apos;s visible to other members.
                </p>
              </div>
              <div className="text-center">
                <div className="w-14 h-14 bg-white border border-[#D4A843]/30 rounded-full flex items-center justify-center mb-5 mx-auto shadow-sm">
                  <FileCheck className="w-6 h-6 text-[#D4A843]" />
                </div>
                <h3 className="font-serif text-lg font-bold text-[#1A1A1A] mb-2">2. Document Verification</h3>
                <p className="font-sans text-sm text-[#2C3E50] leading-relaxed">
                  Photos and, where provided, horoscope documents are checked before approval.
                </p>
              </div>
              <div className="text-center">
                <div className="w-14 h-14 bg-white border border-[#D4A843]/30 rounded-full flex items-center justify-center mb-5 mx-auto shadow-sm">
                  <ShieldCheck className="w-6 h-6 text-[#D4A843]" />
                </div>
                <h3 className="font-serif text-lg font-bold text-[#1A1A1A] mb-2">3. Approval</h3>
                <p className="font-sans text-sm text-[#2C3E50] leading-relaxed">
                  Once approved, a member gets full access to browse and connect — with a visible verification badge on their profile.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 7. FAQ — generic but reasonable answers, please review before publishing */}
        <section className="py-20 bg-white">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="font-serif text-3xl md:text-4xl text-[#1A1A1A] font-bold mb-4">Frequently Asked Questions</h2>
            </div>
            <Accordion type="single" collapsible className="space-y-3">
              {FAQ_ITEMS.map((item, idx) => (
                <AccordionItem
                  key={idx}
                  value={`faq-${idx}`}
                  className="border border-[#D4A843]/15 rounded-xl px-5 bg-[#FDF8F0]/60"
                >
                  <AccordionTrigger className="font-serif text-base font-semibold text-[#1A1A1A] hover:no-underline text-left">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent className="font-sans text-sm text-[#2C3E50] leading-relaxed">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        {/* 8. THE DUAL AUDIENCE PROMISE (CTA) */}
        <section className="py-20 bg-[#2C3E50] text-center relative overflow-hidden">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <ShieldCheck className="w-12 h-12 text-[#D4A843] mx-auto mb-6" />
            <h2 className="font-serif text-3xl md:text-4xl text-white font-bold mb-8 leading-tight">
              A Platform Built for the Seeker, <br className="hidden sm:block" />
              Designed for the Family.
            </h2>
            <p className="font-sans text-lg text-[#F5E6C3] mb-10 leading-relaxed font-light">
              We know that finding a life partner is a shared journey. Our platform offers the modern design, quick filters, and direct chat that young professionals expect, paired with the printable PDFs, rich family backgrounds, and strict verification that parents demand.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link 
                href="/register" 
                className="w-full sm:w-auto bg-[#D4A843] hover:bg-[#B8860B] text-[#1A1A1A] px-8 py-3.5 rounded-lg font-sans font-bold transition-all duration-300 text-lg shadow-lg hover:-translate-y-0.5"
              >
                Join Our Community
              </Link>
              <Link 
                href="/contact" 
                className="w-full sm:w-auto border-2 border-[#F5E6C3] text-[#F5E6C3] hover:bg-[#F5E6C3] hover:text-[#1A1A1A] px-8 py-3.5 rounded-lg font-sans font-medium transition-all duration-300 text-lg"
              >
                Contact Our Team
              </Link>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}