import Link from 'next/link';
import {
  CONTACT_EMAIL,
  CONTACT_PHONE_DISPLAY,
  CONTACT_PHONE_TEL,
  OFFICE_ADDRESS_LINES,
  OPERATOR,
  POLICIES_EFFECTIVE_DATE,
  SITE_NAME,
  SUPPORT_HOURS,
} from '@/lib/siteInfo';

const POLICY_LINKS = [
  { href: '/terms-and-conditions', label: 'Terms & Conditions' },
  { href: '/privacy-policy', label: 'Privacy Policy' },
  { href: '/cancellation-and-refund', label: 'Cancellation & Refund' },
  { href: '/shipping-and-delivery', label: 'Shipping & Delivery' },
];

/** Shared layout for the policy pages (Terms, Privacy, Refund, Delivery). */
export default function LegalPage({ title, current, children }) {
  return (
    <div className="min-h-screen bg-[#FDF8F0]">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#1A1A1A] mb-2">{title}</h1>
        <p className="font-sans text-sm text-[#2C3E50]/60 mb-8">Effective date: {POLICIES_EFFECTIVE_DATE}</p>
        <div className="space-y-8">{children}</div>
      </main>
      <footer className="border-t border-[#D4A843]/15 py-8 mt-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="font-sans text-sm text-[#2C3E50]/60 text-center">Last updated: {POLICIES_EFFECTIVE_DATE}</p>
          <nav aria-label="Policies" className="flex flex-wrap justify-center gap-x-5 gap-y-2 mt-4">
            {POLICY_LINKS.filter((l) => l.href !== current).map((l) => (
              <Link key={l.href} href={l.href} className="font-sans text-sm text-[#2C3E50] hover:text-[#B8860B] underline-offset-4 hover:underline">
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
      </footer>
    </div>
  );
}

export function Section({ title, children }) {
  return (
    <section>
      <h2 className="font-serif text-xl font-semibold text-[#1A1A1A] mb-3">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

export function P({ children }) {
  return <p className="font-sans text-[15px] text-[#2C3E50] leading-relaxed">{children}</p>;
}

export function Sub({ children }) {
  return <h3 className="font-sans font-semibold text-[#1A1A1A] pt-1">{children}</h3>;
}

export function List({ items }) {
  return (
    <ul className="list-disc pl-6 font-sans text-[15px] text-[#2C3E50] leading-relaxed space-y-1.5">
      {items.map((item, i) => <li key={i}>{item}</li>)}
    </ul>
  );
}

export function Note({ children }) {
  return (
    <div className="rounded-xl border border-[#D4A843]/30 border-l-4 border-l-[#D4A843] bg-[#F5E6C3]/30 p-4 font-sans text-[15px] text-[#2C3E50] leading-relaxed">
      {children}
    </div>
  );
}

/** Contact details block used at the end of every policy page. */
export function ContactBlock({ intro }) {
  return (
    <>
      {intro && <P>{intro}</P>}
      <div className="rounded-xl bg-white border border-[#D4A843]/20 p-5 font-sans text-[15px] text-[#2C3E50] leading-relaxed space-y-1">
        <p className="font-semibold text-[#1A1A1A]">{SITE_NAME} (operated by {OPERATOR})</p>
        <p>
          Email:{' '}
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-[#B8860B] underline underline-offset-2">{CONTACT_EMAIL}</a>
        </p>
        <p>
          Phone:{' '}
          <a href={`tel:${CONTACT_PHONE_TEL}`} className="text-[#B8860B] underline underline-offset-2">{CONTACT_PHONE_DISPLAY}</a>
        </p>
        <p>Address: {OFFICE_ADDRESS_LINES.join(', ')}</p>
        <p>Support hours: {SUPPORT_HOURS}</p>
      </div>
    </>
  );
}
