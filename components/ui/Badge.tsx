'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type BadgeVariant = 'draft' | 'submitted' | 'success' | 'warning' | 'danger' | 'neutral';

const variantClasses: Record<BadgeVariant, string> = {
  draft: 'bg-amber-50 text-amber-700 border-amber-200',
  submitted: 'bg-green-50 text-green-700 border-green-200',
  success: 'bg-green-50 text-green-700 border-green-200',
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
  danger: 'bg-red-50 text-red-700 border-red-200',
  neutral: 'bg-gray-50 text-gray-700 border-gray-200',
};

export interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  icon?: ReactNode;
  className?: string;
}

export default function Badge({ children, variant = 'neutral', icon, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border',
        variantClasses[variant],
        className
      )}
    >
      {icon}
      {children}
    </span>
  );
}
