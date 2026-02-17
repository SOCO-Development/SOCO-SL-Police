'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    // Clear authentication data immediately
    if (typeof window !== 'undefined') {
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('username');
      localStorage.removeItem('authTimestamp');
      // Redirect to login page immediately
      router.replace('/login');
    }
  }, [router]);

  // Return null to avoid showing any content
  return null;
}

