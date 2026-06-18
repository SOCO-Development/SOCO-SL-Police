'use client';

import Button from '@/components/buttons/Button';
import { cn } from '@/lib/utils';

export interface PaginationControlsProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export default function PaginationControls({
  page,
  totalPages,
  onPageChange,
  className,
}: PaginationControlsProps) {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1
  );

  return (
    <div className={cn('flex items-center justify-center gap-2 flex-wrap', className)}>
      <Button
        type="button"
        variant="secondary"
        onClick={() => onPageChange(Math.max(1, page - 1))}
        disabled={page <= 1}
        className="!min-h-9 !px-3"
        aria-label="Previous page"
      >
        Previous
      </Button>
      {pages.map((p, i, arr) => {
        const prev = arr[i - 1];
        const showEllipsis = prev !== undefined && p - prev > 1;
        return (
          <span key={p} className="flex items-center gap-2">
            {showEllipsis ? <span className="text-gray-400 px-1">…</span> : null}
            <Button
              type="button"
              variant={p === page ? 'primary' : 'secondary'}
              onClick={() => onPageChange(p)}
              className="!min-h-9 !min-w-9 !px-2"
              aria-label={`Page ${p}`}
              aria-current={p === page ? 'page' : undefined}
            >
              {p}
            </Button>
          </span>
        );
      })}
      <Button
        type="button"
        variant="secondary"
        onClick={() => onPageChange(Math.min(totalPages, page + 1))}
        disabled={page >= totalPages}
        className="!min-h-9 !px-3"
        aria-label="Next page"
      >
        Next
      </Button>
    </div>
  );
}

