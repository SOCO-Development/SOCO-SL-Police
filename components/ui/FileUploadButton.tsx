'use client';

import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { actionChipVariantClass } from '@/lib/ui/styles';

export type FileUploadButtonVariant = 'sky' | 'sky-block';

export interface FileUploadButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: FileUploadButtonVariant;
}

const variantClasses: Record<FileUploadButtonVariant, string> = {
  sky: cn(
    'text-sm font-semibold rounded-lg px-3 py-2 transition-colors border',
    actionChipVariantClass.sky
  ),
  'sky-block': cn(
    'w-full min-w-0 rounded-lg border border-sky-200/60 bg-sky-50/50 px-3 py-2.5 text-xs font-semibold text-sky-800',
    'transition-all duration-200 ease-out hover:border-sky-400 hover:bg-sky-100 hover:text-sky-900 hover:shadow-sm',
    'active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2'
  ),
};

export default function FileUploadButton({
  children,
  variant = 'sky',
  className,
  type = 'button',
  ...rest
}: FileUploadButtonProps) {
  return (
    <button type={type} className={cn(variantClasses[variant], className)} {...rest}>
      {children}
    </button>
  );
}
