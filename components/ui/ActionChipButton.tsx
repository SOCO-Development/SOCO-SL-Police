'use client';

import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { actionChipBase, actionChipVariantClass } from '@/lib/ui/styles';

export type ActionChipVariant = keyof typeof actionChipVariantClass;

export interface ActionChipButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ActionChipVariant;
  icon?: ReactNode;
  children: ReactNode;
}

export default function ActionChipButton({
  variant = 'blue',
  icon,
  children,
  className,
  type = 'button',
  ...rest
}: ActionChipButtonProps) {
  return (
    <button
      type={type}
      className={cn(actionChipBase, actionChipVariantClass[variant], className)}
      {...rest}
    >
      {icon}
      {children}
    </button>
  );
}
