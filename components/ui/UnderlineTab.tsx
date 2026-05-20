'use client';

import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { underlineTabActiveClass, underlineTabInactiveClass } from '@/lib/ui/styles';

export interface UnderlineTabProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type'> {
  active: boolean;
  children: ReactNode;
  count?: number;
}

export default function UnderlineTab({
  active,
  children,
  count,
  className,
  ...rest
}: UnderlineTabProps) {
  return (
    <button
      type="button"
      className={cn(
        'flex items-center gap-1.5 px-1 pb-3 mr-6 text-sm font-medium border-b-2 -mb-px transition-colors',
        active ? underlineTabActiveClass : underlineTabInactiveClass,
        className
      )}
      {...rest}
    >
      {children}
      {count !== undefined ? (
        <span className={cn('text-sm font-semibold', active ? 'text-blue-600' : 'text-gray-500')}>
          {count}
        </span>
      ) : null}
    </button>
  );
}
