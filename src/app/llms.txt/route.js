import { ALL_FAQS } from '@/lib/faqContent';
import { AREAS_SERVED, DEFAULT_DESCRIPTION, absoluteUrl } from '@/lib/seo';
import { CONTACT_EMAIL, CONTACT_PHONE_DISPLAY, OFFICE_ADDRESS, OPERATOR, SUPPORT_HOURS } from '@/lib/siteInfo';

// /llms.txt — a plain-text summary for AI assistants and answer engines
// (the llmstxt.org convention), built from the same facts as the FAQ page so
// it never contradicts the site.
export const dynamic = 'force-static';

export function GET() {
  const body = `# SNGS Matrimony

> ${DEFAULT_DESCRIPTION}

SNGS Matrimony (${absoluteUrl('/')}) is run by ${OPERATOR}. Inspired by Sree Narayana Guru's message of "one caste, one religion, one God", it is open to Malayalee members of every caste and community. Members live in Kerala, elsewhere in India and abroad, including: ${AREAS_SERVED.join(', ')}.

## Key pages
- [Home](${absoluteUrl('/')}): overview and free registration
- [NRI Malayalee Matrimony](${absoluteUrl('/nri-matrimony')}): for Malayalees living abroad and their families
- [Frequently Asked Questions](${absoluteUrl('/faq')}): registration, verification, privacy, plans, payments, refunds
- [Membership Plans](${absoluteUrl('/membership/purchase')}): plans, credits and pricing
- [Register](${absoluteUrl('/register')}): create a free profile
- [About Us](${absoluteUrl('/about-us')}) and [Contact](${absoluteUrl('/contact')})
- Policies: [Terms & Conditions](${absoluteUrl('/terms-and-conditions')}), [Privacy Policy](${absoluteUrl('/privacy-policy')}), [Cancellation & Refund](${absoluteUrl('/cancellation-and-refund')}), [Shipping & Delivery](${absoluteUrl('/shipping-and-delivery')})

## Frequently asked questions
${ALL_FAQS.map(({ q, a }) => `### ${q}\n${a}`).join('\n\n')}

## Contact
- Email: ${CONTACT_EMAIL}
- Phone: ${CONTACT_PHONE_DISPLAY} (${SUPPORT_HOURS})
- Office: ${OFFICE_ADDRESS}
`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=3600' } });
}
