'use client';

import { useRef } from 'react';
import { Paperclip, X, Download } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FileAttachmentSlotProps {
  /** Primary label (English) */
  label: string;
  /** Optional secondary label — rendered as a suffix (e.g. Sinhala name) */
  labelSi?: string;
  /** Currently attached file name */
  fileName?: string;
  /** Base-64 data URL for client-side download preview */
  dataUrl?: string;
  /** When true, hides the upload/remove controls */
  readOnly?: boolean;
  /** Accepted MIME / extension list passed to the hidden <input> */
  accept?: string;
  /** Called with the selected File when the user picks one */
  onFile: (file: File) => void;
  /** Called when the user removes the current attachment */
  onRemove: () => void;
  className?: string;
}

/**
 * A self-contained file attachment slot.
 *
 * - Empty + editable  → shows an upload button
 * - Has file + editable → shows filename (as download link if dataUrl present) + Remove button
 * - Read-only          → shows filename / "No attachment"
 *
 * Usage:
 * ```tsx
 * <FileAttachmentSlot
 *   label="Sworn Statement"
 *   labelSi="දිවුරුම් ප්‍රකාශය"
 *   fileName={row.divurumaFileName}
 *   dataUrl={row.divurumaDataUrl}
 *   readOnly={readOnly}
 *   onFile={(file) => { ... }}
 *   onRemove={() => { ... }}
 * />
 * ```
 */
export default function FileAttachmentSlot({
  label,
  labelSi,
  fileName,
  dataUrl,
  readOnly = false,
  accept = '.pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.bmp,.webp',
  onFile,
  onRemove,
  className,
}: FileAttachmentSlotProps) {
  const fileRef = useRef<HTMLInputElement>(null);

  const hasFile = Boolean(fileName?.trim());

  return (
    <div
      className={cn(
        'rounded-lg border bg-white p-3 space-y-2 transition-colors',
        hasFile ? 'border-teal-200 bg-teal-50/20' : 'border-gray-200 bg-gray-50/40',
        className,
      )}
    >
      {/* Label row */}
      <div className="flex items-center gap-1.5">
        <Paperclip className="h-3.5 w-3.5 shrink-0 text-teal-600" strokeWidth={2} />
        <span className="text-xs font-bold text-gray-700 uppercase tracking-wide leading-snug">
          {label}
        </span>
        {labelSi && (
          <span className="text-xs text-gray-500 font-noto-sinhala normal-case tracking-normal">
            / {labelSi}
          </span>
        )}
      </div>

      {/* Content */}
      {hasFile ? (
        <div className="flex items-center gap-2 flex-wrap">
          {dataUrl ? (
            <a
              href={dataUrl}
              download={fileName}
              className="flex items-center gap-1 text-sm text-blue-700 font-medium hover:underline truncate max-w-[14rem]"
              title={fileName}
            >
              <Download className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
              <span className="truncate">{fileName}</span>
            </a>
          ) : (
            <span className="text-sm text-gray-700 truncate max-w-[14rem]" title={fileName}>
              {fileName}
            </span>
          )}

          {!readOnly && (
            <button
              type="button"
              onClick={onRemove}
              aria-label={`Remove ${label}`}
              className="ml-auto flex items-center gap-1 rounded-md border border-red-200 bg-red-50 px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-100 hover:border-red-300 transition-colors"
            >
              <X className="h-3 w-3" strokeWidth={2.5} />
              Remove
            </button>
          )}
        </div>
      ) : readOnly ? (
        <p className="text-xs text-gray-400 italic">No attachment</p>
      ) : (
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-1.5 rounded-lg border border-teal-300 bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-800 hover:bg-teal-100 hover:border-teal-400 transition-colors"
          >
            <Paperclip className="h-3.5 w-3.5" strokeWidth={2} />
            Choose file
          </button>
          <span className="text-xs text-gray-400">PDF, image, or document</span>
          <input
            ref={fileRef}
            type="file"
            accept={accept}
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onFile(file);
              e.currentTarget.value = '';
            }}
          />
        </div>
      )}
    </div>
  );
}
