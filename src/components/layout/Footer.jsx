'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Heart, Mail, MapPin, Phone } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const LINK_COLUMNS = [
  {
    title: 'Explore',
    links: [
      { label: 'Home', href: '/' },
      { label: 'Search Matches', href: '/browse' },
      { label: 'Membership Plans', href: '/membership/purchase' },
      { label: 'About Us', href: '/about-us' },
      { label: 'Contact', href: '/contact' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy Policy', href: '/privacy-policy' },
      { label: 'Terms & Conditions', href: '/terms-and-conditions' },
      { label: 'Shipping & Delivery', href: '/shipping-and-delivery' },
      { label: 'Cancellation & Refund', href: '/cancellation-and-refund' },
    ],
  },
];

const CONTACT_ITEMS = [
  { icon: Mail, text: 'contact@sngsmatrimony.com' },
  { icon: MapPin, text: 'Kerala, India' },
];

// Admin portal has its own dedicated shell; app/dashboard routes have their
// own tab bar + mobile bottom nav, so the marketing footer stays out of the
// way there too (mirrors Header.js's same route gating). Auth pages use a
// fixed full-viewport background image the footer would visually clash with.
const HIDDEN_ROUTE_PREFIXES = ['/admin', '/browse', '/liked', '/messages', '/profile', '/settings', '/chat', '/profiles', '/membership', '/payment', '/login', '/register', '/forgot-password'];

export default function Footer() {
  const pathname = usePathname();
  const isHidden = HIDDEN_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname?.startsWith(`${prefix}/`)
  );

  if (isHidden) return null;

  return (
    <footer className="bg-[#1A1A1A] text-white/80 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Desktop: 4-column layout */}
        <div className="hidden md:grid md:grid-cols-4 gap-10">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Heart className="w-5 h-5 text-[#D4A843]" strokeWidth={1.75} />
              <span className="font-serif text-xl font-bold text-white">SNGS Matrimonial</span>
            </div>
            <p className="text-sm leading-relaxed text-white/60">
              A hyper-local matrimonial platform for the Malayali Ezhava community, connecting families across India and the NRI diaspora.
            </p>
          </div>

          {LINK_COLUMNS.map((col) => (
            <div key={col.title}>
              <h3 className="font-sans text-sm font-semibold text-white uppercase tracking-wide mb-4">
                {col.title}
              </h3>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm text-white/60 hover:text-[#D4A843] transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <h3 className="font-sans text-sm font-semibold text-white uppercase tracking-wide mb-4">
              Get in Touch
            </h3>
            <ul className="space-y-2.5">
              {CONTACT_ITEMS.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-2 text-sm text-white/60">
                  <Icon className="w-4 h-4 text-[#D4A843] shrink-0" strokeWidth={1.75} />
                  {text}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Mobile: collapsible accordion */}
        <div className="md:hidden">
          <div className="flex items-center gap-2 mb-2">
            <Heart className="w-5 h-5 text-[#D4A843]" strokeWidth={1.75} />
            <span className="font-serif text-xl font-bold text-white">SNGS Matrimonial</span>
          </div>
          <p className="text-sm leading-relaxed text-white/60 mb-2">
            Connecting the Malayali Ezhava community across India and the NRI diaspora.
          </p>

          <Accordion type="single" collapsible className="w-full">
            {LINK_COLUMNS.map((col) => (
              <AccordionItem key={col.title} value={col.title} className="border-white/10">
                <AccordionTrigger className="text-white text-sm font-semibold hover:no-underline">
                  {col.title}
                </AccordionTrigger>
                <AccordionContent>
                  <ul className="space-y-2.5">
                    {col.links.map((link) => (
                      <li key={link.href}>
                        <Link href={link.href} className="text-sm text-white/60 hover:text-[#D4A843] transition-colors">
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            ))}
            <AccordionItem value="contact" className="border-white/10">
              <AccordionTrigger className="text-white text-sm font-semibold hover:no-underline">
                Get in Touch
              </AccordionTrigger>
              <AccordionContent>
                <ul className="space-y-2.5">
                  {CONTACT_ITEMS.map(({ icon: Icon, text }) => (
                    <li key={text} className="flex items-center gap-2 text-sm text-white/60">
                      <Icon className="w-4 h-4 text-[#D4A843] shrink-0" strokeWidth={1.75} />
                      {text}
                    </li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-white/40">
          <p>&copy; {new Date().getFullYear()} SNGS Matrimonial. All rights reserved.</p>
          <p className="flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5" strokeWidth={1.75} />
            Serving the Malayali Ezhava community since inception
          </p>
        </div>
      </div>
    </footer>
  );
}
