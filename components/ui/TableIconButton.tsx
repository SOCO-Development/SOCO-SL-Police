'use client';

import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type TableIconButtonVariant = 'edit' | 'delete';

const variantClass: Record<TableIconButtonVariant, string> = {
  edit: 'text-gray-400 hover:text-blue-600',
  delete: 'text-gray-400 hover:text-red-600',
};

export interface TableIconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant: TableIconButtonVariant;
  children: ReactNode;
}

export default function TableIconButton({
  variant,
  children,
  className,
  type = 'button',
  ...rest
}: TableIconButtonProps) {
  return (
    <button
      type={type}
      className={cn('transition-colors p-1', variantClass[variant], className)}
      {...rest}
    >
      {children}
    </button>
  );
}
