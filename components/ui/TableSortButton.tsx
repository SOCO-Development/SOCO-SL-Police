'use client';

import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface TableSortButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
}

export default function TableSortButton({ children, className, type = 'button', ...rest }: TableSortButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'flex items-center gap-1.5 cursor-pointer hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded',
        className
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
