import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import PromoBanner from '@/components/layout/PromoBanner';
import Header from '@/components/layout/Header'; // <-- Restored Global Header
import Footer from '@/components/layout/Footer';
import MobileBottomNav, { BottomNavSpacer } from '@/components/layout/MobileBottomNav';
import Preloader from '@/components/layout/Preloader';
import ScrollManager from '@/components/layout/ScrollManager';
import { Analytics } from "@vercel/analytics/next";
import JsonLd from "@/components/seo/JsonLd";
import { DEFAULT_DESCRIPTION, DEFAULT_TITLE, KEYWORDS, SITE_ORIGIN, organizationJsonLd, websiteJsonLd } from "@/lib/seo";


// Configure Inter for all standard UI and body text (sans-serif)
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

// Configure Playfair Display for premium headlines (serif)
const playfair = Playfair_Display({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-serif",
});

export const metadata = {
  metadataBase: new URL(SITE_ORIGIN),
  title: {
    default: DEFAULT_TITLE,
    template: '%s | SNGS Matrimony',
  },
  description: DEFAULT_DESCRIPTION,
  applicationName: 'SNGS Matrimony',
  keywords: KEYWORDS,
  category: 'Matrimony',
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    siteName: 'SNGS Matrimony',
    locale: 'en_IN',
    url: '/',
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
  },
  twitter: {
    card: 'summary_large_image',
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
  // Search Console / Bing Webmaster ownership codes, set in Vercel env vars.
  verification: {
    ...(process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION && { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION }),
    ...(process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION && { other: { 'msvalidate.01': process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION } }),
  },
  formatDetection: { telephone: false },
  icons: {
    icon: '/icon.png',
    apple: '/apple-icon.png',
  },
};

export const viewport = {
  themeColor: '#2C3E50',
};

export default function RootLayout({ children }) {
  return (
    /* Injecting the new Sacred Modernity font variables globally */
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body className="font-sans antialiased bg-[#FDF8F0] text-[#1A1A1A] flex flex-col min-h-screen">
        {/* Who we are, for search engines and AI assistants (every page). */}
        <JsonLd data={[organizationJsonLd(), websiteJsonLd()]} />
        <Preloader />
        <Providers>
          
          {/* Global Top Promo Banner */}
          <PromoBanner />

          {/* Global Header */}
          <ScrollManager />
          <Header isFixed={true} />
          
          {/* Main Page Content */}
          <main className="flex-1 relative z-0">
            {children}
          </main>

          {/* Global Footer (everywhere except the admin portal and the chat) */}
          <Footer />
          {/* Keeps the end of the page clear of the fixed mobile bottom nav */}
          <BottomNavSpacer />

          {/* Mobile Bottom Nav (app routes, logged-in users only) */}
          <MobileBottomNav />

        </Providers>

        {/* Vercel Web Analytics — page views only, no cookies */}
        <Analytics />
      </body>
    </html>
  );
}