'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ConfigPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/config/crime-officer');
  }, [router]);
  return null;
}

