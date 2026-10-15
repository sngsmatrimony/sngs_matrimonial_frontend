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
  title: "SNGS Matrimonial",
  description: "Find your perfect match within the Malayalee Community.",
  icons: {
    icon: '/icon.png',
    apple: '/apple-icon.png',
  },
};

export default function RootLayout({ children }) {
  return (
    /* Injecting the new Sacred Modernity font variables globally */
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body className="font-sans antialiased bg-[#FDF8F0] text-[#1A1A1A] flex flex-col min-h-screen">
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