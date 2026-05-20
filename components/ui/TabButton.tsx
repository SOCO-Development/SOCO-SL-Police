'use client';

import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { tabButtonActiveClass, tabButtonInactiveClass } from '@/lib/ui/styles';

export interface TabButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type'> {
  active: boolean;
  children: ReactNode;
  count?: number;
}

export default function TabButton({
  active,
  children,
  count,
  className,
  ...rest
}: TabButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        'px-4 py-2.5 text-sm font-medium rounded-t-lg border-b-2 transition-colors',
        active ? tabButtonActiveClass : tabButtonInactiveClass,
        className
      )}
      {...rest}
    >
      {children}
      {count !== undefined ? (
        <span
          className={cn(
            'ml-2 px-1.5 py-0.5 rounded-full text-xs font-semibold',
            active ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
          )}
        >
          {count}
        </span>
      ) : null}
    </button>
  );
}
