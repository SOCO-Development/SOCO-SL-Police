'use client';

import type { ButtonHTMLAttributes } from 'react';
import { addRowButtonClass } from '@/lib/ui/styles';
import { cn } from '@/lib/utils';

export type AddRowButtonVariant = 'default' | 'fuchsia';

const variantClass: Record<AddRowButtonVariant, string> = {
  default: addRowButtonClass,
  fuchsia:
    'text-sm text-fuchsia-800 hover:text-fuchsia-950 font-medium inline-flex items-center gap-1 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-500 focus-visible:ring-offset-1 rounded',
};

export interface AddRowButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type' | 'children'> {
  children: string;
  variant?: AddRowButtonVariant;
}

export default function AddRowButton({
  children,
  variant = 'default',
  className,
  ...rest
}: AddRowButtonProps) {
  return (
    <button type="button" className={cn(variantClass[variant], className)} {...rest}>
      <span className="text-base leading-none" aria-hidden>
        +
      </span>
      {children}
    </button>
  );
}
