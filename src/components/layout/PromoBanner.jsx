// src/components/layout/PromoBanner.jsx
"use client";
import { Sparkles, X } from 'lucide-react';
import { useState } from 'react';

export default function PromoBanner() {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="relative bg-gradient-to-r from-orange-500 to-rose-600 text-white px-4 py-3 shadow-md z-50 transition-all duration-300">
      <div className="max-w-7xl mx-auto flex items-center justify-center text-sm md:text-base font-medium tracking-wide">
        <Sparkles className="w-4 h-4 mr-2 animate-pulse" />
        <span>
          Special Offer: Register for <span className="font-bold underline decoration-white/50 underline-offset-2">free</span> until November 1st! Premium charges will apply thereafter.
        </span>
      </div>
      <button 
        onClick={() => setIsVisible(false)}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white transition-colors"
        aria-label="Dismiss banner"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );
}