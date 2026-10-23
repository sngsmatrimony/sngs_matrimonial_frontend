import { pageMetadata } from '@/lib/seo';

// Title, description and share preview for this page (the page itself is a
// client component, which can't export metadata).
export const metadata = pageMetadata({
  title: "Contact SNGS Matrimony — Office, Phone & Email",
  description: "Reach the SNGS Matrimony team at the SNGS Pune office in Pimpri, by phone on +91 97303 54904 or by email at sngsmatrimony@gmail.com, Monday to Saturday, 9 AM to 6 PM IST.",
  path: "/contact",
});

export default function Layout({ children }) {
  return children;
}
