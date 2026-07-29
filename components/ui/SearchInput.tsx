'use client';

import type { InputHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { inputClass } from '@/lib/ui/styles';

export interface SearchInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  icon?: ReactNode;
  wrapperClassName?: string;
}

export default function SearchInput({
  icon,
  className,
  wrapperClassName,
  ...props
}: SearchInputProps) {
  return (
    <div className={cn('relative', wrapperClassName)}>
      {icon ? (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
          {icon}
        </span>
      ) : null}
      <input
        type="search"
        autoComplete="off"
        className={cn(inputClass, 'py-2 text-sm', icon ? 'pl-9 pr-3' : undefined, className)}
        {...props}
      />
    </div>
  );
}

