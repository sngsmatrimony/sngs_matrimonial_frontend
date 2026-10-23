import { pageMetadata } from '@/lib/seo';

// Title, description and share preview for this page (the page itself is a
// client component, which can't export metadata).
export const metadata = pageMetadata({
  title: "Register Free — Create Your Malayalee Matrimony Profile",
  description: "Create your free SNGS Matrimony profile in a few minutes: verify your mobile number, add your details and photos, and start meeting Malayalee matches in India and abroad.",
  path: "/register",
});

export default function Layout({ children }) {
  return children;
}
