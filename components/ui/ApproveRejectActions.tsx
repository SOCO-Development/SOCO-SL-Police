'use client';

import { CheckCircle, XCircle } from 'lucide-react';
import ActionChipButton from './ActionChipButton';
import { cn } from '@/lib/utils';

export interface ApproveRejectActionsProps {
  onApprove: () => void;
  onReject: () => void;
  approveLabel?: string;
  rejectLabel?: string;
  showIcons?: boolean;
  className?: string;
  disabled?: boolean;
}

export default function ApproveRejectActions({
  onApprove,
  onReject,
  approveLabel = 'Approve',
  rejectLabel = 'Reject',
  showIcons = true,
  className,
  disabled,
}: ApproveRejectActionsProps) {
  return (
    <div className={cn('flex items-center gap-2 flex-wrap', className)}>
      <ActionChipButton
        variant="green"
        onClick={onApprove}
        disabled={disabled}
        icon={showIcons ? <CheckCircle className="w-3.5 h-3.5" /> : undefined}
      >
        {approveLabel}
      </ActionChipButton>
      <ActionChipButton
        variant="red"
        onClick={onReject}
        disabled={disabled}
        icon={showIcons ? <XCircle className="w-3.5 h-3.5" /> : undefined}
      >
        {rejectLabel}
      </ActionChipButton>
    </div>
  );
}

