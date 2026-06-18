'use client';

import type { ReactNode } from 'react';
import Header, { type HeaderProps } from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { cn } from '@/lib/utils';

export interface PageLayoutProps {
  children: ReactNode;
  headerProps?: HeaderProps;
  showFooter?: boolean;
  contentClassName?: string;
  className?: string;
}

export default function PageLayout({
  children,
  headerProps,
  showFooter = true,
  contentClassName,
  className,
}: PageLayoutProps) {
  return (
    <div className={cn('min-h-screen flex flex-col', className)}>
      <Header {...headerProps} />
      <div className="flex flex-1 relative z-10 w-full pt-14">
        <main className="flex-1 overflow-x-hidden min-w-0 flex flex-col min-h-screen">
          <div className={cn('w-full px-4 sm:px-6 lg:px-8 py-8 flex-1', contentClassName)}>
            {children}
          </div>
          {showFooter ? <Footer /> : null}
        </main>
      </div>
    </div>
  );
}
