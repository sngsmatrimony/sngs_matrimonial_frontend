import { pageMetadata } from '@/lib/seo';

// Title, description and share preview for this page (the page itself is a
// client component, which can't export metadata).
export const metadata = pageMetadata({
  title: "Sign In",
  description: "Sign in to SNGS Matrimony with your email and password or a mobile OTP.",
  path: "/login",
});

export default function Layout({ children }) {
  return children;
}
