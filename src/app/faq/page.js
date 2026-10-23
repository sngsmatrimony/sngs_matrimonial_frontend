import Link from 'next/link';
import JsonLd from '@/components/seo/JsonLd';
import { FAQ_GROUPS, ALL_FAQS } from '@/lib/faqContent';
import { breadcrumbJsonLd, faqJsonLd, pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata({
  title: 'Frequently Asked Questions — Malayalee Matrimony Help',
  description: 'Answers about SNGS Matrimony: free registration, profile verification, privacy, plans and credits, payments and refunds, NRI members abroad, the SNGS Alliance Meet and support.',
  path: '/faq',
});

export default function FaqPage() {
  return (
    <div className="min-h-screen bg-[#FDF8F0]">
      <JsonLd data={[faqJsonLd(ALL_FAQS), breadcrumbJsonLd([['Home', '/'], ['FAQ', '/faq']])]} />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <p className="font-sans text-sm font-semibold uppercase tracking-[0.18em] text-[#B8860B] mb-2">Help centre</p>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#1A1A1A] mb-3">Frequently Asked Questions</h1>
        <p className="font-sans text-[15px] text-[#2C3E50] leading-relaxed mb-8 max-w-2xl">
          Everything families usually ask about SNGS Matrimony — registering, verification, privacy, plans and payments,
          and members living abroad. Can&apos;t find your answer? <Link href="/contact" className="text-[#B8860B] underline underline-offset-2">Contact us</Link>.
        </p>

        <nav aria-label="FAQ topics" className="flex flex-wrap gap-2 mb-10">
          {FAQ_GROUPS.map((g) => (
            <a key={g.id} href={`#${g.id}`} className="font-sans text-sm px-3 py-1.5 rounded-full border border-[#D4A843]/40 bg-white text-[#1A1A1A] hover:bg-[#F5E6C3]/50">
              {g.title}
            </a>
          ))}
        </nav>

        <div className="space-y-10">
          {FAQ_GROUPS.map((g) => (
            <section key={g.id} id={g.id} className="scroll-mt-28">
              <h2 className="font-serif text-2xl font-semibold text-[#1A1A1A] mb-4">{g.title}</h2>
              <div className="space-y-3">
                {g.items.map(({ q, a }) => (
                  <details key={q} className="group bg-white border border-[#D4A843]/20 rounded-xl px-5 py-4 open:shadow-sm">
                    <summary className="cursor-pointer list-none flex items-start justify-between gap-4 font-sans font-semibold text-[#1A1A1A] text-[15px]">
                      <span>{q}</span>
                      <span aria-hidden="true" className="text-[#B8860B] text-xl leading-none transition-transform group-open:rotate-45">+</span>
                    </summary>
                    <p className="font-sans text-[15px] text-[#2C3E50] leading-relaxed mt-3">{a}</p>
                  </details>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-14 rounded-2xl bg-gradient-to-br from-[#2C3E50] to-[#1A1A1A] p-8 text-center">
          <h2 className="font-serif text-2xl font-semibold text-white mb-2">Ready to begin?</h2>
          <p className="font-sans text-white/80 mb-6">Create your free profile in a few minutes.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/register" className="bg-[#D4A843] hover:bg-[#B8860B] text-[#1A1A1A] px-7 py-3 rounded-lg font-sans font-semibold">Register Free</Link>
            <Link href="/nri-matrimony" className="border-2 border-[#F5E6C3] text-[#F5E6C3] hover:bg-[#F5E6C3] hover:text-[#1A1A1A] px-7 py-3 rounded-lg font-sans font-semibold">For NRIs & families abroad</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
