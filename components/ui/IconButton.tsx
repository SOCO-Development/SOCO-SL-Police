'use client';

import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'ghost' | 'danger';
}

const variants = {
  ghost: 'text-gray-500 hover:text-gray-800 hover:bg-gray-100',
  danger: 'text-violet-400 hover:text-red-500',
};

export default function IconButton({
  children,
  variant = 'ghost',
  className,
  type = 'button',
  ...rest
}: IconButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center justify-center rounded-lg p-1 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 disabled:opacity-40',
        variants[variant],
        className
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
