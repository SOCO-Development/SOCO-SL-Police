'use client';

import CustomSelect from '@/components/forms/CustomSelect';
import DatePicker from '@/components/forms/DatePicker';
import MultiSelect from '@/components/forms/MultiSelect';
import { COURT_NAME_OPTIONS } from '@/lib/courtNames';
import {
  ANALYSIS_INSTITUTION_OPTIONS,
  analysisInstitutionIsOthers,
} from '@/lib/analysisInstitutions';
import {
  PRODUCTION_PR_OPTIONS,
  PRODUCTION_PR_OTHERS_VALUE,
  productionOptionsForSelection,
  productionPRHasOthersSelected,
} from '@/lib/productionPROptions';
import {
  emptyCrimeSceneCourtDetails,
  emptyProductionSentToCourtRow,
  emptySentToAnalysisRow,
  type CrimeSceneCourtDetails,
} from '@/types/crimeScene';

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
  const { className = '', ...rest } = props;
  return (
    <input
      {...rest}
      className={`w-full min-h-10 px-3 py-2 text-sm rounded-lg border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-gray-400 transition-colors ${className}`}
    />
  );
}

export type CourtProductionDetailsEditorMode = 'full' | 'productionSentToCourt' | 'sentToAnalysis';

export interface CourtProductionDetailsEditorProps {
  courtDetails: CrimeSceneCourtDetails;
  onChange: (next: CrimeSceneCourtDetails) => void;
  /** `full` — all court/production blocks. `productionSentToCourt` / `sentToAnalysis` — that section only (Update Court & Production Analysis flows). */
  mode?: CourtProductionDetailsEditorMode;
}

export default function CourtProductionDetailsEditor({
  courtDetails,
  onChange,
  mode = 'full',
}: CourtProductionDetailsEditorProps) {
  const patch = (partial: Partial<CrimeSceneCourtDetails>) => {
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FieldGroup label="Court name (optional)">
          <CustomSelect
            value={courtDetails.courtName ?? ''}
            onChange={(value) => patch({ courtName: value })}
            options={COURT_NAME_OPTIONS}
            placeholder="Select court"
            searchable
            searchPlaceholder="Search court…"
          />
        </FieldGroup>
        <FieldGroup label="Court case no. (optional)">
          <TextInput
            value={courtDetails.courtCaseNo ?? ''}
            onChange={(e) => patch({ courtCaseNo: e.target.value })}
            placeholder="Type case number if known"
          />
        </FieldGroup>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-start">
        <FieldGroup label="Production (P.R.)">
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
                options={PRODUCTION_PR_OPTIONS}
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
        </>
      ) : null}

      {showSentToCourt ? (
      <div className={`mt-2 pt-4 border-t border-gray-200${!showTopBlock ? ' border-0 pt-0 mt-0' : ''}`}>
        <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide pb-2 mb-3 flex items-center gap-2">
          <span className="w-1.5 h-4 rounded-full bg-teal-500 inline-block flex-shrink-0" />
          Production sent to court
        </h4>
        {!(courtDetails.productionPRTypes ?? []).length ? (
          <p className="text-xs text-gray-500 mb-2">
            Select production types under Production (P.R.) first, then add a row for each item sent to court.
          </p>
        ) : null}
        <div className="divide-y divide-gray-200">
          {(courtDetails.productionSentToCourtRows ?? []).map((row, index) => (
            <div
              key={`court-sent-${index}`}
              className="space-y-3 py-4 first:pt-0 border-b border-gray-100 last:border-b-0"
            >
              <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1.3fr)_auto_auto] md:items-end">
                <FieldGroup label="Production" className="min-w-0">
                  <CustomSelect
                    value={row.productionRef}
                    onChange={(value) => {
                      const rows = [...(courtDetails.productionSentToCourtRows ?? [])];
                      rows[index] = {
                        ...rows[index],
                        productionRef: value,
                        sentToCourt: '',
                        date: '',
                        courtCaseNo: '',
                      };
                      patch({ productionSentToCourtRows: rows });
                    }}
                    options={productionOptionsForSelection(courtDetails.productionPRTypes)}
                    placeholder={
                      (courtDetails.productionPRTypes ?? []).length
                        ? 'Select production'
                        : 'Select P.R. types first'
                    }
                    searchable
                    searchPlaceholder="Search…"
                  />
                </FieldGroup>
                <FieldGroup label="Sent to court?">
                  <div className="flex flex-wrap gap-4 min-h-10 items-center rounded-lg border border-gray-200 bg-white/80 px-3 py-2">
                    {(['Yes', 'No'] as const).map((opt) => (
                      <label key={opt} className="inline-flex items-center gap-2 text-sm text-gray-700">
                        <input
                          type="radio"
                          name={`update-court-sent-${index}`}
                          checked={(row.sentToCourt ?? '') === opt}
                          onChange={() => {
                            const rows = [...(courtDetails.productionSentToCourtRows ?? [])];
                            rows[index] =
                              opt === 'Yes'
                                ? { ...rows[index], sentToCourt: 'Yes' }
                                : {
                                    ...rows[index],
                                    sentToCourt: 'No',
                                    date: '',
                                    courtCaseNo: '',
                                  };
                            patch({ productionSentToCourtRows: rows });
                          }}
                          className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                        />
                        {opt}
                      </label>
                    ))}
                  </div>
                </FieldGroup>
                <div className="shrink-0 flex md:pb-0.5">
                  <button
                    type="button"
                    onClick={() =>
                      patch({
                        productionSentToCourtRows: (courtDetails.productionSentToCourtRows ?? []).filter(
                          (_, i) => i !== index,
                        ),
                      })
                    }
                    className="h-10 whitespace-nowrap rounded-lg border border-red-200 bg-red-50 px-3 text-red-600 hover:bg-red-100 text-xs font-semibold"
                    aria-label="Remove row"
                  >
                    Remove
                  </button>
                </div>
              </div>
              {row.sentToCourt === 'Yes' ? (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <FieldGroup label="Date (DD/MM/YY)">
                    <DatePicker
                      value={row.date ?? ''}
                      onChange={(value) => {
                        const rows = [...(courtDetails.productionSentToCourtRows ?? [])];
                        rows[index] = { ...rows[index], date: value };
                        patch({ productionSentToCourtRows: rows });
                      }}
                    />
                  </FieldGroup>
                  <FieldGroup label="Court case no.">
                    <TextInput
                      value={row.courtCaseNo ?? ''}
                      onChange={(e) => {
                        const rows = [...(courtDetails.productionSentToCourtRows ?? [])];
                        rows[index] = { ...rows[index], courtCaseNo: e.target.value };
                        patch({ productionSentToCourtRows: rows });
                      }}
                      placeholder="Case number"
                    />
                  </FieldGroup>
                </div>
              ) : null}
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() =>
            patch({
              productionSentToCourtRows: [
                ...(courtDetails.productionSentToCourtRows ?? []),
                emptyProductionSentToCourtRow(),
              ],
            })
          }
          disabled={!(courtDetails.productionPRTypes ?? []).length}
          className="mt-3 text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 transition-colors disabled:opacity-40 disabled:pointer-events-none"
        >
          <span className="text-base leading-none">+</span> Add production sent to court
        </button>
      </div>
      ) : null}

      {showSentToAnalysis ? (
      <div className={`mt-2 pt-4 border-t border-gray-200${mode === 'sentToAnalysis' ? ' border-0 pt-0 mt-0' : ''}`}>
        <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide pb-2 mb-3 flex items-center gap-2">
          <span className="w-1.5 h-4 rounded-full bg-sky-500 inline-block flex-shrink-0" />
          Sent to analysis institute
        </h4>
        {!(courtDetails.productionPRTypes ?? []).length ? (
          <p className="text-xs text-gray-500 mb-2">
            Select production types under Production (P.R.) first, then add analysis rows as needed.
          </p>
        ) : null}
        <div className="divide-y divide-gray-200">
          {(courtDetails.sentToAnalysisRows ?? []).map((row, index) => (
            <div
              key={`analysis-${index}`}
              className="space-y-3 py-4 first:pt-0 border-b border-gray-100 last:border-b-0"
            >
              <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1.2fr)_auto_auto] md:items-end">
                <FieldGroup label="Production" className="min-w-0">
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
                    options={productionOptionsForSelection(courtDetails.productionPRTypes)}
                    placeholder={
                      (courtDetails.productionPRTypes ?? []).length
                        ? 'Select production'
                        : 'Select P.R. types first'
                    }
                    searchable
                    searchPlaceholder="Search…"
                  />
                </FieldGroup>
                <FieldGroup label="Sent for analysis?">
                  <div className="flex flex-wrap gap-4 min-h-10 items-center rounded-lg border border-gray-200 bg-white/80 px-3 py-2">
                    {(['Yes', 'No'] as const).map((opt) => (
                      <label key={opt} className="inline-flex items-center gap-2 text-sm text-gray-700">
                        <input
                          type="radio"
                          name={`update-court-analysis-${index}`}
                          checked={(row.sentToAnalysis ?? '') === opt}
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
                          className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                        />
                        {opt}
                      </label>
                    ))}
                  </div>
                </FieldGroup>
                <div className="shrink-0 flex md:pb-0.5">
                  <button
                    type="button"
                    onClick={() =>
                      patch({
                        sentToAnalysisRows: (courtDetails.sentToAnalysisRows ?? []).filter(
                          (_, i) => i !== index,
                        ),
                      })
                    }
                    className="h-10 whitespace-nowrap rounded-lg border border-red-200 bg-red-50 px-3 text-red-600 hover:bg-red-100 text-xs font-semibold"
                    aria-label="Remove row"
                  >
                    Remove
                  </button>
                </div>
              </div>
              {row.sentToAnalysis === 'Yes' ? (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <FieldGroup label="Institution" className="min-w-0 md:col-span-2">
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
                        />
                      </div>
                      {analysisInstitutionIsOthers(row.institution) ? (
                        <TextInput
                          className="flex-1 min-w-0"
                          value={row.institutionOtherDetail ?? ''}
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
                    />
                  </FieldGroup>
                  <FieldGroup label="Ref. no.">
                    <TextInput
                      value={row.refNo ?? ''}
                      onChange={(e) => {
                        const rows = [...(courtDetails.sentToAnalysisRows ?? [])];
                        rows[index] = { ...rows[index], refNo: e.target.value };
                        patch({ sentToAnalysisRows: rows });
                      }}
                      placeholder="Reference number"
                    />
                  </FieldGroup>
                </div>
              ) : null}
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() =>
            patch({
              sentToAnalysisRows: [...(courtDetails.sentToAnalysisRows ?? []), emptySentToAnalysisRow()],
            })
          }
          disabled={!(courtDetails.productionPRTypes ?? []).length}
          className="mt-3 text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 transition-colors disabled:opacity-40 disabled:pointer-events-none"
        >
          <span className="text-base leading-none">+</span> Add analysis institute row
        </button>
      </div>
      ) : null}
    </div>
  );
}
