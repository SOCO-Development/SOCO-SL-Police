'use client';

import { type ButtonHTMLAttributes, type ReactNode } from 'react';
import Button from './Button';

interface FilterPrimaryButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  className?: string;
}

/**
 * Primary action button used in filter sections (reports, dashboard).
 * Uses Button variant="success" with full-width layout.
 */
export default function FilterPrimaryButton({
  children,
  className = '',
  ...rest
}: FilterPrimaryButtonProps) {
  return (
    <Button
      variant="success"
      type="button"
      className={`w-full h-[42px] ${className}`.trim()}
      {...rest}
    >
      {children}
    </Button>
  );
}
