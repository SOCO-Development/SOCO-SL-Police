'use client';

import { cloneElement, isValidElement, type ButtonHTMLAttributes, type ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'ghost' | 'amber';

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'min-h-[42px] px-4 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-60 rounded-lg transition-colors shadow-sm',
  secondary:
    'min-h-[42px] px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-amber-50 hover:text-amber-800 hover:border-amber-200 active:bg-amber-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors',
  success:
    'min-h-[42px] px-4 py-2.5 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 active:bg-green-800 disabled:opacity-60 rounded-lg transition-colors shadow-sm',
  danger:
    'min-h-[36px] px-2.5 py-1.5 text-xs font-medium text-red-600 bg-transparent hover:bg-red-50 hover:text-red-700 active:bg-red-100 rounded-lg transition-colors border border-transparent hover:border-red-200',
  ghost:
    'min-h-[42px] px-4 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-50 active:bg-gray-100 rounded-lg transition-colors',
  amber:
    'min-h-[42px] px-5 py-2.5 text-sm font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 hover:border-amber-300 active:bg-amber-200 transition-colors',
};

const baseClasses =
  'inline-flex items-center justify-center gap-2 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 disabled:cursor-not-allowed';

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className'> {
  children: ReactNode;
  variant?: ButtonVariant;
  className?: string;
  /** When true, merges button styles onto the child element (e.g. Link) */
  asChild?: boolean;
}

export default function Button({
  children,
  variant = 'primary',
  className = '',
  asChild = false,
  type = 'button',
  ...rest
}: ButtonProps) {
  const combinedClass = `${baseClasses} ${variantClasses[variant]} ${className}`.trim();

  if (asChild && isValidElement(children)) {
    const child = children as React.ReactElement<{ className?: string }>;
    return cloneElement(child, {
      className: `${child.props.className ?? ''} ${combinedClass}`.trim(),
    });
  }

  return (
    <button type={type} className={combinedClass} {...rest}>
      {children}
    </button>
  );
}
