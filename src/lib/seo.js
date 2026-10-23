// Search-engine and answer-engine (AI assistant) details shared by page
// metadata, the sitemap, structured data (JSON-LD) and llms.txt.
// Only facts about the product belong here — no unverifiable claims.
import {
  CONTACT_EMAIL, CONTACT_PHONE_TEL, OFFICE_ADDRESS_LINES, OPERATOR, SITE_NAME,
} from '@/lib/siteInfo';

export const SITE_ORIGIN = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.sngsmatrimony.com').replace(/\/$/, '');
export const absoluteUrl = (path = '/') => `${SITE_ORIGIN}${path.startsWith('/') ? path : `/${path}`}`;

export const DEFAULT_TITLE = 'SNGS Matrimony — Malayalee & Kerala Matrimony for India and NRIs';
export const DEFAULT_DESCRIPTION =
  'Malayalee matrimony for families in Kerala, across India and abroad. Admin-approved profiles, phone-verified members, '
  + 'privacy-first matching and a community open to every caste. Register free with SNGS Matrimony.';

export const KEYWORDS = [
  'Malayalee matrimony', 'Malayali matrimony', 'Kerala matrimony', 'Kerala marriage site', 'NRI Malayalee matrimony',
  'NRI Kerala matrimony', 'Malayalee brides', 'Malayalee grooms', 'Kerala brides and grooms', 'Gulf Malayali matrimony',
  'Malayalee matrimony UAE', 'Malayalee matrimony USA', 'Malayalee matrimony UK', 'Pune Malayalee matrimony',
  'SNGS matrimony', 'Sree Narayana Guru', 'inter-caste matrimony Kerala',
];

// Countries members can list as where they live (subset of the form's list).
export const AREAS_SERVED = [
  'India', 'United Arab Emirates', 'Saudi Arabia', 'Qatar', 'Kuwait', 'Bahrain', 'Oman',
  'United States', 'United Kingdom', 'Canada', 'Australia', 'New Zealand', 'Singapore', 'Malaysia',
];

const LOGO = absoluteUrl('/logo_1.png');

export function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': absoluteUrl('/#organization'),
    name: SITE_NAME,
    alternateName: ['SNGS Matrimonial', 'sngsmatrimony.com'],
    url: SITE_ORIGIN,
    logo: LOGO,
    description: 'A matrimonial platform for the Malayalee community in India and abroad, run by SNGS Pune, open to every caste and community.',
    email: CONTACT_EMAIL,
    telephone: CONTACT_PHONE_TEL,
    address: {
      '@type': 'PostalAddress',
      streetAddress: OFFICE_ADDRESS_LINES.slice(1, 3).join(', '),
      addressLocality: 'Pimpri, Pune',
      addressRegion: 'Maharashtra',
      postalCode: '411017',
      addressCountry: 'IN',
    },
    parentOrganization: { '@type': 'Organization', name: OPERATOR },
    areaServed: AREAS_SERVED.map((name) => ({ '@type': 'Country', name })),
    contactPoint: [{
      '@type': 'ContactPoint',
      contactType: 'customer support',
      email: CONTACT_EMAIL,
      telephone: CONTACT_PHONE_TEL,
      areaServed: AREAS_SERVED,
      availableLanguage: ['English', 'Malayalam'],
      hoursAvailable: {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        opens: '09:00',
        closes: '18:00',
      },
    }],
  };
}

export function websiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': absoluteUrl('/#website'),
    name: SITE_NAME,
    alternateName: 'SNGS Matrimonial',
    url: SITE_ORIGIN,
    inLanguage: 'en',
    publisher: { '@id': absoluteUrl('/#organization') },
  };
}

/** FAQPage structured data from [{ q, a }] (plain-text answers). */
export function faqJsonLd(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  };
}

/** BreadcrumbList from [[name, path], …]. */
export function breadcrumbJsonLd(trail) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map(([name, path], i) => ({
      '@type': 'ListItem', position: i + 1, name, item: absoluteUrl(path),
    })),
  };
}

// The generated preview image (app/opengraph-image.js). Set explicitly on
// each page: a page's own openGraph block replaces the inherited one.
const SHARE_IMAGE = { url: '/opengraph-image', width: 1200, height: 630, alt: 'SNGS Matrimony — Malayalee & Kerala matrimony for India and NRIs' };

/** Page metadata with canonical URL + Open Graph / Twitter copies. */
export function pageMetadata({ title, description, path, noindex = false }) {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { title, description, url: path, siteName: SITE_NAME, type: 'website', locale: 'en_IN', images: [SHARE_IMAGE] },
    twitter: { card: 'summary_large_image', title, description, images: [SHARE_IMAGE.url] },
    ...(noindex && { robots: { index: false, follow: true } }),
  };
}
