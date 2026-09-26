'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

// Elegant, on-brand full-screen preloader shown while the app boots. Holds for a
// minimum duration (so it never flashes on fast loads) and waits for the window
// `load` event (fonts/images/scripts settled), then fades out and unmounts.
const MIN_VISIBLE_MS = 900;
const FADE_MS = 500;

export default function Preloader() {
  const [isReady, setIsReady] = useState(false);
  const [isMounted, setIsMounted] = useState(true);

  useEffect(() => {
    const start = Date.now();
    let fadeTimeout;

    const finish = () => {
      const elapsed = Date.now() - start;
      const remaining = Math.max(0, MIN_VISIBLE_MS - elapsed);
      setTimeout(() => {
        setIsReady(true);
        fadeTimeout = setTimeout(() => setIsMounted(false), FADE_MS);
      }, remaining);
    };

    if (document.readyState === 'complete') {
      finish();
    } else {
      window.addEventListener('load', finish, { once: true });
    }

    return () => {
      window.removeEventListener('load', finish);
      clearTimeout(fadeTimeout);
    };
  }, []);

  if (!isMounted) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gradient-to-br from-[#FDF8F0] via-[#FDF8F0] to-[#F5E6C3]/50 transition-opacity duration-500 ease-out ${
        isReady ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      role="status"
      aria-live="polite"
      aria-label="Loading SNGS Matrimonial"
    >
      {/* Subtle decorative gold texture, matching the radial-gradient motif used elsewhere */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.05] bg-[radial-gradient(circle_at_18%_22%,#D4A843_0%,transparent_45%),radial-gradient(circle_at_82%_78%,#D4A843_0%,transparent_45%)]" />

      <div className="relative flex flex-col items-center gap-6">
        {/* Logo badge: soft glow + slow rotating gold ring + white backdrop */}
        <div className="relative flex items-center justify-center w-36 h-36 sm:w-40 sm:h-40">
          <div className="absolute inset-0 rounded-full bg-[#D4A843]/25 blur-2xl animate-pulse" />
          <div
            className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-[#D4A843] border-r-[#D4A843]/40 animate-spin"
            style={{ animationDuration: '1.8s' }}
          />
          <div className="relative w-[104px] h-[104px] sm:w-[116px] sm:h-[116px] rounded-full bg-white shadow-[0_8px_30px_rgba(212,168,67,0.25)] ring-1 ring-[#D4A843]/20 flex items-center justify-center overflow-hidden">
            <Image
              src="/logo_1.png"
              alt="SNGS Matrimonial"
              width={88}
              height={66}
              priority
              className="object-contain w-[72%] h-[72%]"
            />
          </div>
        </div>

        {/* Wordmark */}
        <div className="text-center">
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#1A1A1A] tracking-tight">
            SNGS Matrimonial
          </h1>
          <p className="mt-1.5 font-sans text-[11px] sm:text-xs tracking-[0.2em] uppercase text-[#D4A843] font-semibold">
            Finding Your Perfect Match
          </p>
        </div>
      </div>
    </div>
  );
}
