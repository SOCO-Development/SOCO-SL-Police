'use client';

import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { removeRowButtonClass } from '@/lib/ui/styles';
import { cn } from '@/lib/utils';

export type RemoveRowButtonSize = 'sm' | 'md';

export interface RemoveRowButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type' | 'children'> {
  children?: ReactNode;
  size?: RemoveRowButtonSize;
}

const sizeClasses: Record<RemoveRowButtonSize, string> = {
  sm: 'h-7',
  md: 'h-8',
};

export default function RemoveRowButton({
  children = 'Remove',
  size = 'sm',
  className,
  ...rest
}: RemoveRowButtonProps) {
  return (
    <button type="button" className={cn(removeRowButtonClass, sizeClasses[size], className)} {...rest}>
      {children}
    </button>
  );
}
