import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import PromoBanner from '@/components/layout/PromoBanner';
import Header from '@/components/layout/Header'; // <-- Restored Global Header
import MobileBottomNav from '@/components/layout/MobileBottomNav';
import Preloader from '@/components/layout/Preloader';


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
  description: "Find your perfect match within the Malayali Ezhava Community.",
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
          <Header isFixed={true} />
          
          {/* Main Page Content */}
          <main className="flex-1 pb-16 md:pb-0 relative z-0">
            {/* The pb-16 ensures content doesn't hide behind the 64px mobile bottom nav */}
            {children}
          </main>

          {/* Mobile Bottom Nav (app routes, logged-in users only) */}
          <MobileBottomNav />

        </Providers>
      </body>
    </html>
  );
}