'use client';

import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface ToggleChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active: boolean;
  children: React.ReactNode;
  /** Square grade-style chip (9x9) vs pill stream selector */
  size?: 'grade' | 'pill';
  activeVariant?: 'violet' | 'danger';
}

export default function ToggleChip({
  active,
  children,
  size = 'pill',
  activeVariant = 'violet',
  className,
  type = 'button',
  ...rest
}: ToggleChipProps) {
  const activeClass =
    activeVariant === 'danger' && active
      ? 'bg-red-500 border-red-500 text-white'
      : active
        ? 'bg-violet-600 border-violet-600 text-white shadow-sm'
        : 'bg-white border-gray-200 text-gray-600 hover:border-violet-300 hover:text-violet-700';

  return (
    <button
      type={type}
      className={cn(
        'rounded-lg border text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-1',
        size === 'grade' ? 'h-9 w-9 text-xs font-bold' : 'px-4 py-2',
        activeClass,
        className
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
