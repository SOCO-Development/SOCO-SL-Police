'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

/**
 * Global centered loading spinner shown during route changes.
 *
 * App Router has no router events, so navigation is detected two ways:
 *  - in-app anchor clicks (capture phase) + popstate (back/forward) → shows
 *    the spinner immediately when navigation starts
 *  - watching pathname + search params → hides the spinner once the new
 *    page renders
 *
 * Note: we intentionally do NOT patch history.pushState. Next's router calls it
 * from inside a useInsertionEffect, and calling setState there triggers the
 * React warning "useInsertionEffect must not schedule updates."
 */
export default function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [visible, setVisible] = useState(false);
  const hideRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const start = () => {
      if (hideRef.current) {
        clearTimeout(hideRef.current);
        hideRef.current = null;
      }
      setVisible(true);
    };

    const handleClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const anchor = (e.target as HTMLElement)?.closest('a');
      if (!anchor) return;
      const href = anchor.getAttribute('href');
      const target = anchor.getAttribute('target');
      if (!href || href.startsWith('#') || (target && target !== '_self')) return;
      if (anchor.hasAttribute('download')) return;

      try {
        const dest = new URL(href, window.location.href);
        if (dest.origin !== window.location.origin) return;
        // Same URL → no navigation will happen.
        if (dest.pathname === window.location.pathname && dest.search === window.location.search) {
          return;
        }
      } catch {
        return;
      }
      start();
    };

    document.addEventListener('click', handleClick, true);
    window.addEventListener('popstate', start);

    return () => {
      document.removeEventListener('click', handleClick, true);
      window.removeEventListener('popstate', start);
      if (hideRef.current) clearTimeout(hideRef.current);
    };
  }, []);

  // New page has rendered for this route → hide the spinner.
  useEffect(() => {
    setVisible(false);
  }, [pathname, searchParams]);

  if (!visible) return null;

  return (
    <div
      aria-hidden
      className="fixed inset-0 z-[100000] flex items-center justify-center bg-white/40 backdrop-blur-[2px] animate-fade-in"
    >
      <div className="rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 px-7 py-6 flex flex-col items-center gap-3">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
        <span className="text-sm font-medium text-gray-600">Loading…</span>
      </div>
    </div>
  );
}
