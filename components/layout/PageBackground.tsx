'use client';

import { usePathname } from 'next/navigation';

const SKIP_PATHS = new Set(['/', '/home', '/login']);

/**
 * Standard app shell: light blue → white → light gray (matches crime-visit-registry).
 * Skips routes that define their own full-page background.
 */
export default function PageBackground({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? '';

  if (SKIP_PATHS.has(pathname)) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen min-w-0 bg-gradient-to-br from-blue-50 via-white to-gray-50">
      {children}
    </div>
  );
}
