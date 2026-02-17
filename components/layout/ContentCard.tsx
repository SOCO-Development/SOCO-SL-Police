'use client';

import { type ReactNode } from 'react';

interface ContentCardProps {
  children: ReactNode;
  /** Use "p-8" for dashboard-style pages, default "p-6" for table pages */
  className?: string;
}

/**
 * Standard white content card below filters (tables, export toolbar, etc.).
 * Same UI everywhere: white/90, blur, rounded, shadow, border.
 */
export default function ContentCard({ children, className = '' }: ContentCardProps) {
  return (
    <div
      className={`backdrop-blur-sm rounded-xl shadow-lg p-6 relative z-0 ${className}`}
      style={{
        backgroundColor: 'var(--content-card-bg)',
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: 'var(--content-card-border)',
      }}
    >
      {children}
    </div>
  );
}
