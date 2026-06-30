'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { isAuthenticated as checkIsAuthenticated } from '@/lib/api/authStorage';

interface AuthGuardProps {
  children: React.ReactNode;
}

const PUBLIC_PATHS = new Set(['/login', '/logout', '/']);

function FullScreenSpinner({ label }: { label: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-gray-50 animate-fade-in">
      <div className="text-center animate-fade-in">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-blue-200 border-t-blue-600"></div>
        <p className="mt-4 text-gray-600 text-sm">{label}</p>
      </div>
    </div>
  );
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const rawPathname = usePathname();
  // trailingSlash:true returns e.g. "/login/" - normalize before matching.
  const pathname = rawPathname !== '/' ? rawPathname.replace(/\/$/, '') : rawPathname;
  const isPublicPage = PUBLIC_PATHS.has(pathname);

  // Tracks the auth result for a specific path so we never show a stale
  // "Redirecting" state left over from a previous route.
  const [status, setStatus] = useState<{ path: string; authed: boolean } | null>(null);

  useEffect(() => {
    if (isPublicPage) return;

    const authed = checkIsAuthenticated();
    setStatus({ path: pathname, authed });

    if (!authed) {
      router.replace('/login');
    }
  }, [pathname, isPublicPage, router]);

  if (isPublicPage) {
    return <>{children}</>;
  }

  const checkedForThisPath = status?.path === pathname;

  if (!checkedForThisPath) {
    return <FullScreenSpinner label="Loading..." />;
  }

  if (!status.authed) {
    return <FullScreenSpinner label="Redirecting to login..." />;
  }

  return <>{children}</>;
}
