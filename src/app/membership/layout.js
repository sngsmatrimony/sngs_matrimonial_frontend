import { pageMetadata } from '@/lib/seo';

// Title, description and share preview for this page (the page itself is a
// client component, which can't export metadata).
export const metadata = pageMetadata({
  title: "Membership Plans & Pricing",
  description: "Compare SNGS Matrimony membership plans: credits for viewing profiles, unlocking phone & chat and downloading profiles, with all charges shown before you pay. Registration and browsing are free.",
  path: "/membership/purchase",
});

export default function Layout({ children }) {
  return children;
}
