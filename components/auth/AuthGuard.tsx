'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface AuthGuardProps {
  children: React.ReactNode;
}

// Helper function to check authentication synchronously
function checkAuth(): boolean {
  if (typeof window === 'undefined') return false;
  
  const authStatus = localStorage.getItem('isAuthenticated');
  const username = localStorage.getItem('username');
  const authTimestamp = localStorage.getItem('authTimestamp');
  
  // Check if session is expired (24 hours)
  const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  const isSessionExpired = authTimestamp 
    ? (Date.now() - parseInt(authTimestamp)) > SESSION_DURATION
    : true;
  
  // Strict validation: both must exist, be valid, and session must not be expired
  const isAuth = Boolean(
    authStatus === 'true' && 
    username && 
    username.trim() !== '' &&
    !isSessionExpired
  );
  
  // If authentication data is incomplete, invalid, or expired, clear it
  if (authStatus === 'true' && (!username || username.trim() === '' || isSessionExpired)) {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('username');
    localStorage.removeItem('authTimestamp');
  }
  
  return isAuth;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  
  // Check if we're on login/logout page or root page immediately (synchronously)
  const isPublicPage = pathname === '/login' || pathname === '/logout' || pathname === '/';
  
  // Initialize state - always start with null for protected routes to avoid hydration issues
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(
    isPublicPage ? false : null
  );
  const [isChecking, setIsChecking] = useState(!isPublicPage);
  const [hasRedirected, setHasRedirected] = useState(false);

  useEffect(() => {
    // For login, logout, and root pages, skip authentication check
    if (isPublicPage) {
      setIsChecking(false);
      setIsAuthenticated(false);
      
      // Root page handles its own redirect in page.tsx
      if (pathname === '/') {
        return;
      }
      
      // For login page, don't redirect immediately - let the login page handle it
      // This ensures the login page always renders first
      if (pathname === '/login') {
        return;
      }
      
      return;
    }

    // For protected routes, verify authentication immediately
    if (typeof window !== 'undefined') {
      // Check authentication synchronously
      const isAuth = checkAuth();
      setIsAuthenticated(isAuth);
      setIsChecking(false);

      // If not authenticated and haven't redirected yet, redirect to login immediately
      if (!isAuth && !hasRedirected) {
        setHasRedirected(true);
        // Use replace to prevent back button from going to protected route
        router.replace('/login');
      }
    } else {
      // On server, assume not authenticated for protected routes
      setIsAuthenticated(false);
      setIsChecking(false);
    }
  }, [pathname, router, isPublicPage, hasRedirected]);

  // For login/logout/root pages, render immediately without loading screen
  if (isPublicPage) {
    return <>{children}</>;
  }

  // For protected routes, show loading screen while checking or if not authenticated
  if (isChecking || isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, show loading (redirect is happening)
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  // Render children only if authenticated
  return <>{children}</>;
}

