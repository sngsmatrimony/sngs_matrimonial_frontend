'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { TabsList } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

// Opaque version of the tab bar's bg-[#F5E6C3]/40 on a white card, so the
// fades can cover the tabs scrolling underneath them.
const BAR_BG = '#FBF5E7';

/**
 * A one-row tab bar that scrolls sideways on narrow screens — and shows it.
 * A hidden scrollbar alone gave no hint, so members on smaller phones missed
 * Horoscope, Partner Preferences and Photos. The edge hiding more tabs fades
 * out, a labelled "More" button scrolls to them, and a tapped tab that's cut
 * off slides fully into view. Nothing extra shows when every tab fits.
 */
export default function ScrollableTabsList({ className, children, ...props }) {
  const listRef = useRef(null);
  const [edges, setEdges] = useState({ left: false, right: false });

  useEffect(() => {
    const el = listRef.current;
    if (!el) return undefined;
    const update = () => {
      const left = el.scrollLeft > 4;
      const right = el.scrollLeft + el.clientWidth < el.scrollWidth - 4;
      setEdges((prev) => (prev.left === left && prev.right === right ? prev : { left, right }));
    };
    // A tab chosen on arrival (e.g. ?tab=horoscope) may sit off-screen:
    // start with it centred in view, without animation.
    const active = el.querySelector('[role="tab"][data-state="active"]');
    if (active && active.offsetLeft + active.offsetWidth > el.clientWidth) {
      el.scrollLeft = Math.max(0, active.offsetLeft - (el.clientWidth - active.offsetWidth) / 2);
    }
    // Reports once straight away (sets the first state), then on any size
    // change of the bar or its tabs (rotation, fonts loading).
    const observer = new ResizeObserver(update);
    observer.observe(el);
    Array.from(el.children).forEach((child) => observer.observe(child));
    el.addEventListener('scroll', update, { passive: true });
    return () => {
      observer.disconnect();
      el.removeEventListener('scroll', update);
    };
  }, []);

  const scrollTo = (left) => {
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    listRef.current?.scrollTo({ left, behavior: reduceMotion ? 'auto' : 'smooth' });
  };

  const showMore = () => {
    const el = listRef.current;
    if (el) scrollTo(el.scrollLeft + Math.max(120, el.clientWidth * 0.7));
  };

  // Keep a tapped / keyboard-focused tab fully visible (clear of the "More" button).
  const revealTab = (event) => {
    const el = listRef.current;
    const tab = event.target.closest?.('[role="tab"]');
    if (!el || !tab) return;
    const clearance = 72;
    if (tab.offsetLeft < el.scrollLeft) {
      scrollTo(tab.offsetLeft - 8);
    } else if (tab.offsetLeft + tab.offsetWidth > el.scrollLeft + el.clientWidth - clearance) {
      scrollTo(tab.offsetLeft + tab.offsetWidth - el.clientWidth + clearance);
    }
  };

  return (
    <div className="relative">
      <TabsList ref={listRef} onFocusCapture={revealTab} className={cn('relative', className)} {...props}>
        {children}
      </TabsList>
      <div
        aria-hidden="true"
        className={cn('pointer-events-none absolute inset-y-0 left-0 w-10 rounded-l-xl transition-opacity duration-200', edges.left ? 'opacity-100' : 'opacity-0')}
        style={{ background: `linear-gradient(to right, ${BAR_BG}, transparent)` }}
      />
      <div
        aria-hidden="true"
        className={cn('pointer-events-none absolute inset-y-0 right-0 w-28 rounded-r-xl transition-opacity duration-200', edges.right ? 'opacity-100' : 'opacity-0')}
        style={{ background: `linear-gradient(to left, ${BAR_BG} 45%, transparent)` }}
      />
      {edges.right && (
        <button
          type="button"
          onClick={showMore}
          aria-label="More sections"
          className="absolute right-1.5 top-1/2 -translate-y-1/2 inline-flex items-center gap-0.5 h-8 pl-2.5 pr-1.5 rounded-lg bg-white border border-[#D4A843]/45 text-[#8A6A1A] font-sans text-xs font-semibold shadow-sm hover:bg-[#F5E6C3]/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4A843]"
        >
          More
          <ChevronRight className="w-3.5 h-3.5" strokeWidth={2} />
        </button>
      )}
    </div>
  );
}
