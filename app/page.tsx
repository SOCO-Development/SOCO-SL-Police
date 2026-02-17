'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Always redirect to login first - let login page handle authentication check
    // This ensures login page always shows when accessing root URL
    if (typeof window !== 'undefined') {
      const timer = setTimeout(() => {
        router.replace('/login');
      }, 0);
      
      return () => clearTimeout(timer);
    }
  }, [router]);

  // Return null to avoid showing any content during redirect
  return null;
}
