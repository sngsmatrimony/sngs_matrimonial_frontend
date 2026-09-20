// src/components/layout/PromoBanner.jsx
"use client";
import { Sparkles, X } from 'lucide-react';
import { useState } from 'react';

export default function PromoBanner() {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="relative bg-gradient-to-r from-secondary to-[#1A2733] text-white px-4 py-3 shadow-sm z-50">
      {/* thin gold hairline along the base, consistent with the card headers */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-primary/0 via-primary/70 to-primary/0" />

      <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 text-sm md:text-base font-medium tracking-wide text-center">
        <Sparkles className="w-4 h-4 shrink-0 text-primary" strokeWidth={1.75} />
        <span className="font-telex">
          Special Offer: Register for{' '}
          <span className="text-primary font-semibold">free</span>{' '}
          until November 1st — premium charges apply thereafter.
        </span>
      </div>

      <button
        onClick={() => setIsVisible(false)}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-primary transition-colors"
        aria-label="Dismiss banner"
      >
        <X className="w-4.5 h-4.5" strokeWidth={1.75} />
      </button>
    </div>
  );
}
