import { pageMetadata } from '@/lib/seo';

// Title, description and share preview for this page (the page itself is a
// client component, which can't export metadata).
export const metadata = pageMetadata({
  title: "Reset Your Password",
  description: "Reset your SNGS Matrimony password with a one-time code sent to your email.",
  path: "/forgot-password",
  noindex: true,
});

export default function Layout({ children }) {
  return children;
}
