import { SITE_ORIGIN, absoluteUrl } from '@/lib/seo';

// Members' pages, admin, payments and the API are never for search engines.
const PRIVATE = [
  '/admin', '/api/', '/browse', '/liked', '/messages', '/chat', '/profile', '/profiles/',
  '/settings', '/transactions', '/payment/', '/alliance-meet/payment/', '/forgot-password',
];

// AI assistants and answer engines that may read the public pages, so they
// can answer questions about SNGS Matrimony accurately (see /llms.txt).
const AI_CRAWLERS = [
  'GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-User', 'Claude-SearchBot',
  'PerplexityBot', 'Perplexity-User', 'Google-Extended', 'Applebot-Extended', 'Bingbot',
];

export default function robots() {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: PRIVATE },
      { userAgent: AI_CRAWLERS, allow: '/', disallow: PRIVATE },
    ],
    sitemap: absoluteUrl('/sitemap.xml'),
    host: SITE_ORIGIN,
  };
}
