'use client';

import { type ButtonHTMLAttributes, type ReactNode } from 'react';

interface FilterPrimaryButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  className?: string;
}

/**
 * Primary action button used in filter sections across report and complaint pages.
 * Same UI everywhere: green, centered text, consistent height.
 */
export default function FilterPrimaryButton({
  children,
  className = '',
  type = 'button',
  ...rest
}: FilterPrimaryButtonProps) {
  return (
    <button
      type={type}
      className={`filter-primary-btn flex items-center justify-center text-white px-4 py-2.5 rounded-lg transition-colors whitespace-nowrap w-full h-[42px] border border-transparent ${className}`}
      {...rest}
    >
      <span>{children}</span>
    </button>
  );
}
