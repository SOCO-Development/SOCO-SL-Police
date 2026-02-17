'use client';

import { type ReactNode } from 'react';

interface FilterSectionProps {
  children: ReactNode;
  /** Extra class names (e.g. "print:hidden" for report pages) */
  className?: string;
}

/**
 * Standard filter bar used on report and complaint pages.
 * Same UI everywhere: teal/blue gradient, rounded border, padding.
 */
export default function FilterSection({ children, className = '' }: FilterSectionProps) {
  return (
    <div
      className={`rounded-xl p-6 mb-6 shadow-md backdrop-blur-sm relative z-10 border ${className}`}
      style={{
        background: `linear-gradient(to right, var(--filter-bar-from), var(--filter-bar-via), var(--filter-bar-to))`,
        borderColor: 'var(--filter-bar-border)',
      }}
    >
      {children}
    </div>
  );
}
