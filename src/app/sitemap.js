import { absoluteUrl } from '@/lib/seo';

// Public pages only — member, admin and payment pages need a login and are
// kept out of search (see robots.js).
const PAGES = [
  ['/', 1.0, 'weekly'],
  ['/nri-matrimony', 0.9, 'monthly'],
  ['/faq', 0.8, 'monthly'],
  ['/register', 0.8, 'monthly'],
  ['/membership/purchase', 0.7, 'monthly'],
  ['/about-us', 0.7, 'monthly'],
  ['/contact', 0.6, 'yearly'],
  ['/login', 0.4, 'yearly'],
  ['/terms-and-conditions', 0.3, 'yearly'],
  ['/privacy-policy', 0.3, 'yearly'],
  ['/cancellation-and-refund', 0.3, 'yearly'],
  ['/shipping-and-delivery', 0.3, 'yearly'],
];

export default function sitemap() {
  const lastModified = new Date();
  return PAGES.map(([path, priority, changeFrequency]) => ({
    url: absoluteUrl(path), lastModified, changeFrequency, priority,
  }));
}
