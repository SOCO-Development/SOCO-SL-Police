'use client';

import { AddRowButton, RemoveRowButton, FileUploadButton, FileAttachmentSlot } from '@/components/ui';
import { useEffect, useRef, useState } from 'react';
import CustomSelect from '@/components/forms/CustomSelect';
import DatePicker from '@/components/forms/DatePicker';
import MultiSelect from '@/components/forms/MultiSelect';
import {
  ANALYSIS_INSTITUTION_OPTIONS,
  analysisInstitutionIsOthers,
} from '@/lib/analysisInstitutions';
import { COURT_NAME_OPTIONAL_SELECT_OPTIONS } from '@/lib/courtNames';
import {
  getProductionPRDisplayLabel,
  PRODUCTION_PR_OTHERS_VALUE,
  loadProductionTypeOptions,
  productionOptionsForSelection,
  productionPRHasOthersSelected,
  type ProductionOption,
} from '@/lib/productionPROptions';
import {
  emptyCrimeSceneCourtDetails,
  emptyProductionSentToCourtRow,
  emptySentToAnalysisRow,
  type CrimeSceneCourtDetails,
} from '@/types/crimeScene';
import { Download, X, Paperclip } from 'lucide-react';
import { API_BASE_URL } from '@/lib/api';

interface AnalysisAttachmentProps {
  index: number;
  row: import('@/types/crimeScene').SentToAnalysisRow;
  readOnly: boolean;
  onUpdate: (patch: Partial<import('@/types/crimeScene').SentToAnalysisRow>) => void;
}

interface FieldGroupProps {
  label: string;
  children: React.ReactNode;
  className?: string;
}
function FieldGroup({ label, children, className = '' }: FieldGroupProps) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">{label}</label>
      {children}
    </div>
  );
}

function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const { className = '', readOnly, ...rest } = props;
  return (
    <input
      readOnly={readOnly}
      {...rest}
      className={`w-full min-h-10 px-3 py-2 text-sm rounded-lg border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${readOnly
        ? 'bg-gray-50 border-gray-200 cursor-default hover:border-gray-200'
        : 'bg-white hover:border-gray-400'
        } ${className}`}
    />
  );
}

// ─── Attachment helper ────────────────────────────────────────────────────────

/** Converts a backend absolute Windows path or relative path into a full download URL. */
function getAttachmentDownloadUrl(fileNameOrUrl: string): string {
  if (!fileNameOrUrl) return '';
  if (
    fileNameOrUrl.startsWith('http://') ||
    fileNameOrUrl.startsWith('https://') ||
    fileNameOrUrl.startsWith('data:')
  ) {
    return fileNameOrUrl;
  }
  const base = API_BASE_URL.replace(/\/+$/, '');
  // Strip absolute Windows server path prefix like "E:/Soco_CVR_System/" or "E:\Soco_CVR_System\"
  const withoutDrive = fileNameOrUrl.replace(/^[A-Za-z]:[/\\][^/\\]+[/\\]/, '/');
  const normalized = withoutDrive.replace(/\\/g, '/');
  const path = normalized.startsWith('/') ? normalized : `/${normalized}`;
  return `${base}${path}`;
}

function AnalysisAttachment({ index, row, readOnly, onUpdate }: AnalysisAttachmentProps) {
  const [fileErrors, setFileErrors] = useState<Record<string, string>>({});

  const handleFileChange = (file: File, field: 'photoZipName' | 'sketchFileName' | 'reportFileName') => {
    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
    let isValid = true;
    let errorMsg = '';

    if (field === 'photoZipName') {
      if (ext !== 'zip') {
        isValid = false;
        errorMsg = 'Invalid file type. Only .zip files are allowed.';
      }
    } else if (field === 'sketchFileName') {
      if (!['doc', 'docx', 'xls', 'xlsx', 'pdf'].includes(ext)) {
        isValid = false;
        errorMsg = 'Invalid file type. Only .doc, .docx, .xls, .xlsx, or .pdf files are allowed.';
      }
    } else if (field === 'reportFileName') {
      if (ext !== 'pdf') {
        isValid = false;
        errorMsg = 'Invalid file type. Only .pdf files are allowed.';
      }
    }

    if (!isValid) {
      setFileErrors((prev) => ({ ...prev, [field]: errorMsg }));
      return;
    }

    setFileErrors({});
    const reader = new FileReader();
    reader.onload = () => {
      onUpdate({
        attachmentFileName: file.name,
        attachmentDataUrl: reader.result as string,
        attachmentFile: file,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleRemove = () => {
    onUpdate({ attachmentFileName: '', attachmentDataUrl: '', attachmentFile: undefined });
    setFileErrors({});
  };

  // Resolve download URL
  const downloadHref = row.attachmentDataUrl || getAttachmentDownloadUrl(row.attachmentFileName ?? '');
  const displayName = row.attachmentFileName
    ? row.attachmentFileName.replace(/\\/g, '/').split('/').pop() ?? row.attachmentFileName
    : '';

  const hasFile = Boolean(
    row.attachmentFileName &&
    row.attachmentFileName.trim() !== '' &&
    row.attachmentFileName.toLowerCase() !== 'string'
  );

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50/50 p-4 space-y-4">
      <div className="flex items-center gap-1.5 pb-2 border-b border-gray-100">
        <Paperclip className="h-3.5 w-3.5 shrink-0 text-teal-600" strokeWidth={2} />
        <span className="text-xs font-bold text-gray-700 uppercase tracking-wide leading-snug">Attachment</span>
      </div>

      {hasFile ? (
        <div className="flex items-center gap-3 flex-wrap">
          <a
            href={downloadHref}
            download={displayName}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm text-blue-700 font-semibold hover:underline truncate max-w-[20rem]"
            title={row.attachmentFileName}
          >
            <Download className="h-4 w-4 shrink-0 text-blue-600" strokeWidth={2.5} />
            <span className="truncate">{displayName}</span>
          </a>
          {!readOnly && (
            <button
              type="button"
              onClick={handleRemove}
              aria-label="Remove attachment"
              className="ml-auto flex items-center gap-1.5 rounded-md border border-red-200 bg-red-50 px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-100 hover:border-red-300 transition-colors"
            >
              <X className="h-3 w-3" strokeWidth={2.5} />
              Remove
            </button>
          )}
        </div>
      ) : readOnly ? (
        <p className="text-xs text-gray-400 italic">No attachment</p>
      ) : (
        <div className="divide-y divide-gray-200/60">
          {(
            [
              {
                field: 'photoZipName',
                label: 'Photo / GIF',
                accept: '.zip,application/zip,application/x-zip-compressed',
                hint: '(Accepts .zip containing .jpg, .jpeg, .png, .gif only)',
              },
              {
                field: 'sketchFileName',
                label: 'Sketch',
                accept: '.doc,.docx,.xls,.xlsx,.pdf,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                hint: '(Accepts .doc, .docx, .xls, .xlsx, and .pdf only)',
              },
              {
                field: 'reportFileName',
                label: 'Report',
                accept: '.pdf,application/pdf',
                hint: '(Accepts .pdf only)',
              },
            ] as const
          ).map(({ field, label, accept, hint }) => (
            <div key={field} className="flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0">
              <label className="w-28 flex-shrink-0 text-xs font-semibold text-gray-600 uppercase tracking-wide">
                {label}
              </label>
              <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <Paperclip size={13} />
                Choose File
                <input
                  type="file"
                  accept={accept}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleFileChange(file, field);
                    }
                  }}
                  className="sr-only"
                  aria-label={label}
                />
              </label>
              <span className="text-xs italic text-gray-500">
                No file chosen
              </span>
              {fileErrors[field] && (
                <span className="text-xs text-red-600 font-medium w-full pl-[7.5rem] mt-0.5 block">
                  {fileErrors[field]}
                </span>
              )}
              <span className="text-xs text-gray-400 w-full pl-[7.5rem] mt-0.5 block">
                {hint}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── File helper ─────────────────────────────────────────────────────────────

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

export type CourtProductionDetailsEditorMode = 'full' | 'productionSentToCourt' | 'sentToAnalysis';

export interface CourtProductionDetailsEditorProps {
  courtDetails: CrimeSceneCourtDetails;
  onChange: (next: CrimeSceneCourtDetails) => void;
  /** `full` — all court/production blocks. `productionSentToCourt` / `sentToAnalysis` — that section only (Update Court & Production Analysis flows). */
  mode?: CourtProductionDetailsEditorMode;
  /**
   * Same form UI with fields non-editable when `true` and `mode` is `sentToAnalysis` (Production Analysis) or
   * `productionSentToCourt` (Update Court Details — production sent) before the user clicks Edit.
   */
  readOnly?: boolean;
}

export default function CourtProductionDetailsEditor({
  courtDetails,
  onChange,
  mode = 'full',
  readOnly = false,
}: CourtProductionDetailsEditorProps) {
  const [productionTypes, setProductionTypes] = useState<ProductionOption[]>([]);

  useEffect(() => {
    let cancelled = false;
    loadProductionTypeOptions()
      .then((options) => {
        if (!cancelled) setProductionTypes(options);
      })
      .catch((error) => {
        console.error('Failed to load production types', error);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const patch = (partial: Partial<CrimeSceneCourtDetails>) => {
    if (readOnly) return;
    onChange({
      ...emptyCrimeSceneCourtDetails(),
      ...courtDetails,
      ...partial,
    });
  };

  const showTopBlock = mode === 'full';
  const showSentToCourt = mode === 'full' || mode === 'productionSentToCourt';
  const showSentToAnalysis = mode === 'full' || mode === 'sentToAnalysis';

  return (
    <div className="space-y-4">
      {showTopBlock ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-start">
            <FieldGroup label="Production Availability">
              <div className="flex flex-wrap gap-4 min-h-10 items-center rounded-lg border border-gray-200 bg-white/80 px-3 py-2">
                {(['Yes', 'No'] as const).map((opt) => (
                  <label key={opt} className="inline-flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="radio"
                      name="update-court-production-pr"
                      checked={(courtDetails.productionPR ?? '') === opt}
                      onChange={() =>
                        patch({
                          productionPR: opt,
                          ...(opt === 'No'
                            ? {
                              productionPRTypes: [],
                              productionPROtherDetail: '',
                              productionSentToCourtRows: [],
                              sentToAnalysisRows: [],
                            }
                            : {}),
                        })
                      }
                      className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    {opt}
                  </label>
                ))}
              </div>
            </FieldGroup>
            {courtDetails.productionPR === 'Yes' ? (
              <>
                <div
                  className={
                    productionPRHasOthersSelected(courtDetails.productionPRTypes) ? '' : 'md:col-span-2'
                  }
                >
                  <MultiSelect
                    label="Production types"
                    labelClassName="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1"
                    optionRowClassName="text-[15px] leading-relaxed text-gray-800"
                    value={courtDetails.productionPRTypes ?? []}
                    onChange={(next) => {
                      const sel = new Set(next);
                      patch({
                        productionPRTypes: next,
                        ...(!next.includes(PRODUCTION_PR_OTHERS_VALUE) ? { productionPROtherDetail: '' } : {}),
                        productionSentToCourtRows: (courtDetails.productionSentToCourtRows ?? []).filter((row) =>
                          sel.has(row.productionRef),
                        ),
                        sentToAnalysisRows: (courtDetails.sentToAnalysisRows ?? []).filter((row) =>
                          sel.has(row.productionRef),
                        ),
                      });
                    }}
                    options={productionTypes}
                    placeholder="Select one or more"
                  />
                </div>
                {productionPRHasOthersSelected(courtDetails.productionPRTypes) ? (
                  <FieldGroup label={`${PRODUCTION_PR_OTHERS_VALUE} — specify`}>
                    <TextInput
                      value={courtDetails.productionPROtherDetail ?? ''}
                      onChange={(e) => patch({ productionPROtherDetail: e.target.value })}
                      placeholder="Describe other items"
                    />
                  </FieldGroup>
                ) : null}
              </>
            ) : null}
          </div>
          {courtDetails.productionPR === 'Yes' && (courtDetails.productionPRTypes ?? []).length > 0 ? (
            <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50/60 px-3 py-2.5">
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Selected production types</p>
              <div className="flex flex-wrap gap-1.5">
                {(courtDetails.productionPRTypes ?? []).map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center rounded-full border border-amber-200 bg-white px-2.5 py-0.5 text-xs font-medium text-amber-900"
                  >
                    {getProductionPRDisplayLabel(t, productionTypes)}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </>
      ) : null}

      {showSentToAnalysis ? (
        <div
          className={`mt-2 pt-4 border-t border-gray-200${mode === 'sentToAnalysis' ? ' border-0 pt-0 mt-0' : ''}`}
        >
          <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide pb-2 mb-3 flex items-center gap-2">
            <span className="w-1.5 h-4 rounded-full bg-sky-500 inline-block flex-shrink-0" />
            Productions sent to analysis institutes
          </h4>
          {!(courtDetails.productionPRTypes ?? []).length ? (
            <p className="text-xs text-gray-500 mb-2">
              Select production types under Production Availability first, then add analysis rows as needed.
            </p>
          ) : null}
          <div className="space-y-4">
            {(courtDetails.sentToAnalysisRows ?? []).map((row, index) => (
              <div
                key={`analysis-${index}`}
                className="rounded-lg border border-sky-200 bg-white p-4 shadow-sm space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-sky-100 pb-3 min-h-10">
                  <p className="text-sm font-semibold text-sky-900">
                    Production {String(index + 1).padStart(2, '0')}
                  </p>
                  {readOnly ? (
                    <span
                      className="h-9 w-[4.5rem] shrink-0 inline-block"
                      aria-hidden
                    />
                  ) : (
                    <RemoveRowButton size="md" className="h-9 shrink-0 px-3" onClick={() => patch({
                      sentToAnalysisRows: (courtDetails.sentToAnalysisRows ?? []).filter(
                        (_, i) => i !== index,
                      ),
                    })} />
                  )}
                </div>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1.2fr)_auto] md:items-end">
                  <FieldGroup label="Production type" className="min-w-0">
                    <CustomSelect
                      value={row.productionRef}
                      onChange={(value) => {
                        const rows = [...(courtDetails.sentToAnalysisRows ?? [])];
                        rows[index] = {
                          ...rows[index],
                          productionRef: value,
                          sentToAnalysis: '',
                          institution: '',
                          institutionOtherDetail: '',
                          date: '',
                          refNo: '',
                        };
                        patch({ sentToAnalysisRows: rows });
                      }}
                      options={productionOptionsForSelection(courtDetails.productionPRTypes, productionTypes)}
                      placeholder={
                        (courtDetails.productionPRTypes ?? []).length
                          ? 'Select production'
                          : 'Select P.R. types first'
                      }
                      searchable
                      searchPlaceholder="Search…"
                      disabled={readOnly}
                    />
                  </FieldGroup>
                  <FieldGroup label="Sent for analysis?">
                    <div
                      className={`flex flex-wrap gap-4 min-h-10 items-center rounded-lg border border-gray-200 bg-white/80 px-3 py-2 ${readOnly ? 'bg-gray-50/90' : ''
                        }`}
                    >
                      {(['Yes', 'No'] as const).map((opt) => (
                        <label
                          key={opt}
                          className={`inline-flex items-center gap-2 text-sm text-gray-700 ${readOnly ? 'cursor-default' : 'cursor-pointer'
                            }`}
                        >
                          <input
                            type="radio"
                            name={`update-court-analysis-${index}`}
                            checked={(row.sentToAnalysis ?? '') === opt}
                            disabled={readOnly}
                            onChange={() => {
                              const rows = [...(courtDetails.sentToAnalysisRows ?? [])];
                              rows[index] =
                                opt === 'Yes'
                                  ? { ...rows[index], sentToAnalysis: 'Yes' }
                                  : {
                                    ...rows[index],
                                    sentToAnalysis: 'No',
                                    institution: '',
                                    institutionOtherDetail: '',
                                    date: '',
                                    refNo: '',
                                  };
                              patch({ sentToAnalysisRows: rows });
                            }}
                            className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500 disabled:opacity-60 disabled:cursor-not-allowed"
                          />
                          {opt}
                        </label>
                      ))}
                    </div>
                  </FieldGroup>
                </div>
                {row.sentToAnalysis === 'Yes' ? (
                  <div className="space-y-3">
                    {/* Institution / Date / Ref */}
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-3 md:items-start">
                      <FieldGroup label="Institution" className="min-w-0">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                          <div className="min-w-0 flex-1">
                            <CustomSelect
                              value={row.institution ?? ''}
                              onChange={(value) => {
                                const rows = [...(courtDetails.sentToAnalysisRows ?? [])];
                                rows[index] = {
                                  ...rows[index],
                                  institution: value,
                                  institutionOtherDetail: analysisInstitutionIsOthers(value)
                                    ? rows[index].institutionOtherDetail
                                    : '',
                                };
                                patch({ sentToAnalysisRows: rows });
                              }}
                              options={ANALYSIS_INSTITUTION_OPTIONS}
                              placeholder="Select institute"
                              searchable
                              searchPlaceholder="Search…"
                              disabled={readOnly}
                            />
                          </div>
                          {analysisInstitutionIsOthers(row.institution) ? (
                            <TextInput
                              className="flex-1 min-w-0"
                              value={row.institutionOtherDetail ?? ''}
                              readOnly={readOnly}
                              onChange={(e) => {
                                const rows = [...(courtDetails.sentToAnalysisRows ?? [])];
                                rows[index] = { ...rows[index], institutionOtherDetail: e.target.value };
                                patch({ sentToAnalysisRows: rows });
                              }}
                              placeholder="Specify institute"
                              aria-label="Institution (other)"
                            />
                          ) : null}
                        </div>
                      </FieldGroup>
                      <FieldGroup label="Date (DD/MM/YY)">
                        <DatePicker
                          value={row.date ?? ''}
                          onChange={(value) => {
                            const rows = [...(courtDetails.sentToAnalysisRows ?? [])];
                            rows[index] = { ...rows[index], date: value };
                            patch({ sentToAnalysisRows: rows });
                          }}
                          disabled={readOnly}
                        />
                      </FieldGroup>
                      <FieldGroup label="Ref. no.">
                        <TextInput
                          value={row.refNo ?? ''}
                          readOnly={readOnly}
                          onChange={(e) => {
                            const rows = [...(courtDetails.sentToAnalysisRows ?? [])];
                            rows[index] = { ...rows[index], refNo: e.target.value };
                            patch({ sentToAnalysisRows: rows });
                          }}
                          placeholder="Reference number"
                        />
                      </FieldGroup>
                    </div>

                    {/* Result Received */}
                    <div className="rounded-lg border border-sky-100 bg-sky-50/40 p-3 space-y-3">
                      <p className="text-xs font-bold text-sky-800 uppercase tracking-wide">Result Received</p>
                      <div className="flex flex-wrap gap-3">
                        {(['Positive', 'Negative'] as const).map((opt) => {
                          const isSelected = (row.resultReceived ?? '') === opt;
                          return (
                            <label
                              key={opt}
                              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-semibold cursor-pointer transition-colors ${readOnly ? 'cursor-default' : ''
                                } ${isSelected
                                  ? opt === 'Positive'
                                    ? 'bg-emerald-600 border-emerald-600 text-white'
                                    : 'bg-red-500 border-red-500 text-white'
                                  : 'bg-white border-gray-200 text-gray-600 hover:border-sky-300'
                                }`}
                            >
                              <input
                                type="radio"
                                name={`result-received-${index}`}
                                checked={isSelected}
                                disabled={readOnly}
                                onChange={() => {
                                  const rows = [...(courtDetails.sentToAnalysisRows ?? [])];
                                  rows[index] = {
                                    ...rows[index],
                                    resultReceived: opt,
                                    ...(opt === 'Positive'
                                      ? { resultNegativeReason: '', resultNegativeOtherDetail: '' }
                                      : {}),
                                  };
                                  patch({ sentToAnalysisRows: rows });
                                }}
                                className="sr-only"
                              />
                              {opt}
                            </label>
                          );
                        })}
                      </div>

                      {/* Negative reason */}
                      {row.resultReceived === 'Negative' && (
                        <div className="space-y-2 pt-1">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Reason</p>
                          <div className="flex flex-wrap gap-2">
                            {(['Insufficient', 'Destruction of Evidence', 'Other'] as const).map((reason) => {
                              const isSelected = (row.resultNegativeReason ?? '') === reason;
                              return (
                                <label
                                  key={reason}
                                  className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm cursor-pointer transition-colors ${readOnly ? 'cursor-default' : ''
                                    } ${isSelected
                                      ? 'bg-red-50 border-red-400 text-red-800 font-semibold'
                                      : 'bg-white border-gray-200 text-gray-600 hover:border-red-200'
                                    }`}
                                >
                                  <input
                                    type="radio"
                                    name={`result-negative-reason-${index}`}
                                    checked={isSelected}
                                    disabled={readOnly}
                                    onChange={() => {
                                      const rows = [...(courtDetails.sentToAnalysisRows ?? [])];
                                      rows[index] = {
                                        ...rows[index],
                                        resultNegativeReason: reason,
                                        ...(reason !== 'Other' ? { resultNegativeOtherDetail: '' } : {}),
                                      };
                                      patch({ sentToAnalysisRows: rows });
                                    }}
                                    className="sr-only"
                                  />
                                  {reason}
                                </label>
                              );
                            })}
                          </div>
                          {row.resultNegativeReason === 'Other' && (
                            <TextInput
                              value={row.resultNegativeOtherDetail ?? ''}
                              readOnly={readOnly}
                              onChange={(e) => {
                                const rows = [...(courtDetails.sentToAnalysisRows ?? [])];
                                rows[index] = { ...rows[index], resultNegativeOtherDetail: e.target.value };
                                patch({ sentToAnalysisRows: rows });
                              }}
                              placeholder="Specify reason"
                            />
                          )}
                        </div>
                      )}
                    </div>

                    {/* Attachment */}
                    <AnalysisAttachment
                      index={index}
                      row={row}
                      readOnly={readOnly}
                      onUpdate={(patch_) => {
                        const rows = [...(courtDetails.sentToAnalysisRows ?? [])];
                        rows[index] = { ...rows[index], ...patch_ };
                        patch({ sentToAnalysisRows: rows });
                      }}
                    />
                  </div>
                ) : null}
              </div>
            ))}
          </div>
          {readOnly ? null : (
            <AddRowButton
              onClick={() =>
                patch({
                  sentToAnalysisRows: [...(courtDetails.sentToAnalysisRows ?? []), emptySentToAnalysisRow()],
                })
              }
              disabled={!(courtDetails.productionPRTypes ?? []).length}
              className="disabled:opacity-40 disabled:pointer-events-none"
            >
              Add analysis institute row
            </AddRowButton>
          )}
        </div>
      ) : null}

      {showSentToCourt ? (
        <div className={`mt-2 pt-4 border-t border-gray-200${!showTopBlock && mode === 'productionSentToCourt' ? ' border-0 pt-0 mt-0' : ''}`}>
          <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide pb-2 mb-3 flex items-center gap-2">
            <span className="w-1.5 h-4 rounded-full bg-teal-500 inline-block flex-shrink-0" />
            Production sent to court
          </h4>
          {!(courtDetails.productionPRTypes ?? []).length ? (
            <p className="text-xs text-gray-500 mb-2">
              Select production types under Production Availability first, then add a row for each item sent to court.
            </p>
          ) : null}
          <div className="space-y-4">
            {(courtDetails.productionSentToCourtRows ?? []).map((row, index) => (
              <div
                key={`court-sent-${index}`}
                className="rounded-lg border border-teal-200 bg-white p-4 shadow-sm space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-teal-100 pb-3 min-h-10">
                  <p className="text-sm font-semibold text-teal-900">
                    Production {String(index + 1).padStart(2, '0')}
                  </p>
                  {readOnly ? (
                    <span className="h-9 w-[4.5rem] shrink-0 inline-block" aria-hidden />
                  ) : (
                    <RemoveRowButton
                      size="md"
                      className="h-9 shrink-0 px-3"
                      onClick={() =>
                        patch({
                          productionSentToCourtRows: (courtDetails.productionSentToCourtRows ?? []).filter(
                            (_, i) => i !== index,
                          ),
                        })
                      }
                    />
                  )}
                </div>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1.2fr)_auto] md:items-end">
                  <FieldGroup label="Production type" className="min-w-0">
                    <CustomSelect
                      value={row.productionRef}
                      onChange={(value) => {
                        const rows = [...(courtDetails.productionSentToCourtRows ?? [])];
                        rows[index] = {
                          ...rows[index],
                          productionRef: value,
                          sentToCourt: '',
                          date: '',
                          courtName: '',
                          courtCaseNo: '',
                        };
                        patch({ productionSentToCourtRows: rows });
                      }}
                      options={productionOptionsForSelection(courtDetails.productionPRTypes, productionTypes)}
                      placeholder={
                        (courtDetails.productionPRTypes ?? []).length
                          ? 'Select production'
                          : 'Select P.R. types first'
                      }
                      searchable
                      searchPlaceholder="Search…"
                      disabled={readOnly}
                    />
                  </FieldGroup>
                  <FieldGroup label="Sent to court?">
                    <div
                      className={`flex flex-wrap gap-4 min-h-10 items-center rounded-lg border border-gray-200 bg-white/80 px-3 py-2 ${readOnly ? 'bg-gray-50/90' : ''
                        }`}
                    >
                      {(['Yes', 'No'] as const).map((opt) => (
                        <label
                          key={opt}
                          className={`inline-flex items-center gap-2 text-sm text-gray-700 ${readOnly ? 'cursor-default' : 'cursor-pointer'
                            }`}
                        >
                          <input
                            type="radio"
                            name={`update-court-sent-${index}`}
                            checked={(row.sentToCourt ?? '') === opt}
                            disabled={readOnly}
                            onChange={() => {
                              const rows = [...(courtDetails.productionSentToCourtRows ?? [])];
                              rows[index] =
                                opt === 'Yes'
                                  ? { ...rows[index], sentToCourt: 'Yes' }
                                  : {
                                    ...rows[index],
                                    sentToCourt: 'No',
                                    date: '',
                                    courtName: '',
                                    courtCaseNo: '',
                                  };
                              patch({ productionSentToCourtRows: rows });
                            }}
                            className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500 disabled:opacity-60 disabled:cursor-not-allowed"
                          />
                          {opt}
                        </label>
                      ))}
                    </div>
                  </FieldGroup>
                </div>
                {row.sentToCourt === 'Yes' ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-3 md:items-start">
                      <FieldGroup label="Date (DD/MM/YY)">
                        <DatePicker
                          value={row.date ?? ''}
                          onChange={(value) => {
                            const rows = [...(courtDetails.productionSentToCourtRows ?? [])];
                            rows[index] = { ...rows[index], date: value };
                            patch({ productionSentToCourtRows: rows });
                          }}
                          disabled={readOnly}
                        />
                      </FieldGroup>
                      <FieldGroup label="Court name (optional)" className="min-w-0">
                        <CustomSelect
                          value={row.courtName ?? ''}
                          onChange={(value) => {
                            const rows = [...(courtDetails.productionSentToCourtRows ?? [])];
                            rows[index] = { ...rows[index], courtName: value };
                            patch({ productionSentToCourtRows: rows });
                          }}
                          options={COURT_NAME_OPTIONAL_SELECT_OPTIONS}
                          placeholder="Select court (optional)"
                          searchable
                          searchPlaceholder="Search…"
                          disabled={readOnly}
                        />
                      </FieldGroup>
                      <FieldGroup label="Case no. (optional)">
                        <TextInput
                          value={row.courtCaseNo ?? ''}
                          readOnly={readOnly}
                          onChange={(e) => {
                            const rows = [...(courtDetails.productionSentToCourtRows ?? [])];
                            rows[index] = { ...rows[index], courtCaseNo: e.target.value };
                            patch({ productionSentToCourtRows: rows });
                          }}
                          placeholder="Case number"
                        />
                      </FieldGroup>
                    </div>

                    {/* Attachments */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <FileAttachmentSlot
                        label="Affidavit"
                        labelSi="දිවුරුම් ප්‍රකාශය"
                        fileName={row.divurumaFileName}
                        dataUrl={row.divurumaDataUrl}
                        readOnly={readOnly}
                        onFile={async (file) => {
                          const url = await readFileAsDataUrl(file);
                          const rows = [...(courtDetails.productionSentToCourtRows ?? [])];
                          rows[index] = { ...rows[index], divurumaFileName: file.name, divurumaDataUrl: url, divurumaFile: file };
                          patch({ productionSentToCourtRows: rows });
                        }}
                        onRemove={() => {
                          const rows = [...(courtDetails.productionSentToCourtRows ?? [])];
                          rows[index] = { ...rows[index], divurumaFileName: '', divurumaDataUrl: '', divurumaFile: undefined };
                          patch({ productionSentToCourtRows: rows });
                        }}
                      />
                      <FileAttachmentSlot
                        label="Questionnaire"
                        labelSi="ප්‍රශ්ණාවලිය"
                        fileName={row.prashnavalyaFileName}
                        dataUrl={row.prashnavalyaDataUrl}
                        readOnly={readOnly}
                        onFile={async (file) => {
                          const url = await readFileAsDataUrl(file);
                          const rows = [...(courtDetails.productionSentToCourtRows ?? [])];
                          rows[index] = { ...rows[index], prashnavalyaFileName: file.name, prashnavalyaDataUrl: url, prashnavalyaFile: file };
                          patch({ productionSentToCourtRows: rows });
                        }}
                        onRemove={() => {
                          const rows = [...(courtDetails.productionSentToCourtRows ?? [])];
                          rows[index] = { ...rows[index], prashnavalyaFileName: '', prashnavalyaDataUrl: '', prashnavalyaFile: undefined };
                          patch({ productionSentToCourtRows: rows });
                        }}
                      />
                    </div>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
          {readOnly ? null : (
            <AddRowButton
              onClick={() =>
                patch({
                  productionSentToCourtRows: [
                    ...(courtDetails.productionSentToCourtRows ?? []),
                    emptyProductionSentToCourtRow(),
                  ],
                })
              }
              disabled={!(courtDetails.productionPRTypes ?? []).length}
              className="disabled:opacity-40 disabled:pointer-events-none"
            >
              Add production sent to court
            </AddRowButton>
          )}
        </div>
      ) : null}
    </div>
  );
}
