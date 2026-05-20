'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { backLinkClass } from '@/lib/ui/styles';
import { cn } from '@/lib/utils';

export interface BackLinkProps {
  href: string;
  label?: string;
  className?: string;
  'aria-label'?: string;
}

export default function BackLink({
  href,
  label = 'Back',
  className,
  'aria-label': ariaLabel = 'Back',
}: BackLinkProps) {
  return (
    <Link href={href} className={cn(backLinkClass, className)} aria-label={ariaLabel}>
      <ArrowLeft className="w-4 h-4 shrink-0" />
      <span>{label}</span>
    </Link>
  );
}
