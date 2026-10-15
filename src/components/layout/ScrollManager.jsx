'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

// Time of the last browser Back/Forward. Pages that restore their own scroll
// position (Search Matches) read it to tell "came back" from "opened fresh".
let lastBackForwardAt = 0;
if (typeof window !== 'undefined') {
  window.addEventListener('popstate', () => { lastBackForwardAt = Date.now(); });
}

/** True if the current page was reached with the browser's Back/Forward. */
export function cameBackOrForward(withinMs = 1500) {
  return Date.now() - lastBackForwardAt < withinMs;
}

/**
 * Opening a page from a link, tab or button starts it at the top (otherwise
 * the old page's scroll position carried over, e.g. Liked opened halfway
 * down). Back/Forward is left alone so the previous position can be kept.
 */
export default function ScrollManager() {
  const pathname = usePathname();
  const firstRender = useRef(true);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    if (cameBackOrForward()) return;
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);

  return null;
}
