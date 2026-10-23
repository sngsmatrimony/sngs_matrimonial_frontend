import { pageMetadata } from '@/lib/seo';

// Title, description and share preview for this page (the page itself is a
// client component, which can't export metadata).
export const metadata = pageMetadata({
  title: "About SNGS Matrimony — A Malayalee Matrimony Rooted in Community",
  description: "SNGS Matrimony is run by SNGS Pune for Malayalee families in Kerala, across India and abroad — inspired by Sree Narayana Guru's message of one caste, one religion, one God, and open to every community.",
  path: "/about-us",
});

export default function Layout({ children }) {
  return children;
}
