'use client';

import type { ReactNode } from 'react';
import BackLink from '@/components/ui/BackLink';

export interface PageHeaderProps {
  backHref?: string;
  backLabel?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}

export default function PageHeader({
  backHref,
  backLabel,
  title,
  description,
  actions,
}: PageHeaderProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
      <div className="flex items-center gap-3 min-w-0">
        {backHref ? <BackLink href={backHref} label={backLabel} /> : null}
        <div className="min-w-0">
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
          {description ? (
            <p className="text-sm text-gray-600 mt-0.5">{description}</p>
          ) : null}
        </div>
      </div>
      {actions ? <div className="flex items-center gap-2 shrink-0">{actions}</div> : null}
    </div>
  );
}
