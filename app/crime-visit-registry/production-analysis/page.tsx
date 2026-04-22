'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import AppTable, { type AppTableColumn } from '@/components/layout/AppTable';
import CustomSelect from '@/components/forms/CustomSelect';
import DatePicker from '@/components/forms/DatePicker';
import Button from '@/components/buttons/Button';
import { crimeSceneService } from '@/lib/crimeSceneService';
import { formatDateTimeDDMMYYYY } from '@/lib/dateUtils';
import type { AnalysisReportReceived, CrimeScene } from '@/types/crimeScene';
import { emptyAnalysisReportReceived } from '@/types/crimeScene';
import { registryBackLinkClass } from '@/app/crime-visit-registry/uiStyles';
import {
  ANALYSIS_REPORT_ANNEX_OPTIONS,
  ANALYSIS_REPORT_RESULT_OPTIONS,
  analysisResultIsOther,
} from '@/lib/analysisReportReceivedOptions';
import { ArrowLeft } from 'lucide-react';
import CourtProductionDetailsEditor from '@/app/crime-visit-registry/components/CourtProductionDetailsEditor';
import CourtDetailsReadOnlySummary from '@/app/crime-visit-registry/components/CourtDetailsReadOnlySummary';
import { validateSentToAnalysisSection } from '@/lib/courtDetailsValidation';
import { emptyCrimeSceneCourtDetails, type CrimeSceneCourtDetails } from '@/types/crimeScene';

function visitTypeLabel(scene: CrimeScene) {
  return scene.visitType === 'REVISIT'
    ? 'Revisit'
    : scene.visitType === 'COURT_VISIT'
      ? 'Court visit'
      : 'New visit';
}

function sceneTableHaystack(s: CrimeScene): string {
  const ar = s.analysisReportReceived;
  return [
    s.cvrNo,
    visitTypeLabel(s),
    formatDateTimeDDMMYYYY(s.updatedAt),
    s.placeOfCrimeScene,
    ar?.labReportReceived,
    ar?.annexRef,
    ar?.date,
    ar?.resultReceived,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

function mergeCourtDetails(base: CrimeSceneCourtDetails | undefined): CrimeSceneCourtDetails {
  return { ...emptyCrimeSceneCourtDetails(), ...base };
}

function mergeReport(base: AnalysisReportReceived | undefined): AnalysisReportReceived {
  const merged = { ...emptyAnalysisReportReceived(), ...base };
  if (
    merged.labReportReceived !== 'Yes' &&
    merged.labReportReceived !== 'No' &&
    (merged.annexRef?.trim() || merged.date?.trim() || merged.resultReceived)
  ) {
    merged.labReportReceived = 'Yes';
  }
  return merged;
}

function FieldGroup({ label, children, className = '' }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">{label}</label>
      {children}
    </div>
  );
}

export default function ProductionAnalysisPage() {
  const [scenes, setScenes] = useState<CrimeScene[]>([]);
  const [selectedSceneId, setSelectedSceneId] = useState('');
  const [form, setForm] = useState<AnalysisReportReceived>(() => emptyAnalysisReportReceived());
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState<keyof CrimeScene | string | null>('updatedAt');
  const [sortAsc, setSortAsc] = useState(false);
  const [error, setError] = useState('');
  const [savedOk, setSavedOk] = useState(false);
  const [courtDetailsDraft, setCourtDetailsDraft] = useState<CrimeSceneCourtDetails>(() =>
    emptyCrimeSceneCourtDetails(),
  );
  const [courtDetailsError, setCourtDetailsError] = useState('');
  const [courtDetailsSavedOk, setCourtDetailsSavedOk] = useState(false);

  useEffect(() => {
    setScenes(crimeSceneService.getAll());
  }, []);

  const filteredScenes = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return scenes.filter((s) => (q ? sceneTableHaystack(s).includes(q) : true));
  }, [scenes, searchTerm]);

  const sortedScenes = useMemo(() => {
    const data = [...filteredScenes];
    if (!sortKey) return data;
    data.sort((a, b) => {
      const av =
        sortKey === 'updatedAt'
          ? new Date(a.updatedAt).getTime()
          : String((a as unknown as Record<string, unknown>)[sortKey] ?? '')
              .toLowerCase();
      const bv =
        sortKey === 'updatedAt'
          ? new Date(b.updatedAt).getTime()
          : String((b as unknown as Record<string, unknown>)[sortKey] ?? '')
              .toLowerCase();
      if (av < bv) return sortAsc ? -1 : 1;
      if (av > bv) return sortAsc ? 1 : -1;
      return 0;
    });
    return data;
  }, [filteredScenes, sortKey, sortAsc]);

  const selectedScene = useMemo(
    () => (selectedSceneId ? scenes.find((s) => s.id === selectedSceneId) : undefined),
    [scenes, selectedSceneId],
  );

  useEffect(() => {
    if (!selectedSceneId) {
      setForm(emptyAnalysisReportReceived());
      setCourtDetailsDraft(emptyCrimeSceneCourtDetails());
      return;
    }
    const scene = scenes.find((s) => s.id === selectedSceneId);
    if (!scene) return;
    setForm(mergeReport(scene.analysisReportReceived));
    setCourtDetailsDraft(mergeCourtDetails(scene.courtDetails));
    setError('');
    setSavedOk(false);
    setCourtDetailsError('');
    setCourtDetailsSavedOk(false);
  }, [selectedSceneId, scenes]);

  function handleSort(key: keyof CrimeScene | string) {
    if (sortKey === key) setSortAsc((prev) => !prev);
    else {
      setSortKey(key);
      setSortAsc(true);
    }
  }

  function selectScene(id: string) {
    setSelectedSceneId(id);
    setTimeout(() => {
      document.getElementById('production-analysis-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }

  function validate(): string {
    if (!selectedSceneId) return 'Select a row in the table, then complete the form below.';
    if (form.labReportReceived !== 'Yes' && form.labReportReceived !== 'No') {
      return 'Select whether the laboratory analysis report has been received (Yes or No).';
    }
    if (form.labReportReceived === 'Yes') {
      if (!form.annexRef?.trim()) return 'Select analysis reports received (annex).';
      if (!form.date?.trim()) return 'Enter the date.';
      if (!form.resultReceived) return 'Select result received.';
      if (analysisResultIsOther(form.resultReceived) && !form.resultOtherDetail?.trim()) {
        return 'Describe the result when “Other” is selected.';
      }
    }
    return '';
  }

  function handleSave() {
    const v = validate();
    if (v) {
      setError(v);
      setSavedOk(false);
      return;
    }
    const payload: AnalysisReportReceived =
      form.labReportReceived === 'No'
        ? {
            labReportReceived: 'No',
            annexRef: '',
            date: '',
            resultReceived: '',
            resultOtherDetail: '',
          }
        : {
            labReportReceived: 'Yes',
            annexRef: form.annexRef.trim(),
            date: form.date.trim(),
            resultReceived: form.resultReceived as AnalysisReportReceived['resultReceived'],
            resultOtherDetail: analysisResultIsOther(form.resultReceived)
              ? form.resultOtherDetail?.trim()
              : '',
          };
    const updated = crimeSceneService.updateAnalysisReportReceived(selectedSceneId, payload);
    if (!updated) {
      setError('Could not save. The visit record may have been removed.');
      setSavedOk(false);
      return;
    }
    setScenes(crimeSceneService.getAll());
    setError('');
    setSavedOk(true);
  }

  function handleSaveCourtDetails() {
    if (!selectedSceneId) {
      setCourtDetailsError('Select a visit in the table first.');
      setCourtDetailsSavedOk(false);
      return;
    }
    const v = validateSentToAnalysisSection(courtDetailsDraft);
    if (v) {
      setCourtDetailsError(v);
      setCourtDetailsSavedOk(false);
      return;
    }
    const updated = crimeSceneService.updateCourtDetailsProduction(selectedSceneId, courtDetailsDraft);
    if (!updated) {
      setCourtDetailsError('Could not save. The visit record may have been removed.');
      setCourtDetailsSavedOk(false);
      return;
    }
    setScenes(crimeSceneService.getAll());
    setCourtDetailsDraft(mergeCourtDetails(updated.courtDetails));
    setCourtDetailsError('');
    setCourtDetailsSavedOk(true);
  }

  const columns: AppTableColumn<CrimeScene>[] = useMemo(
    () => [
      {
        key: 'cvrNo',
        label: 'CVR No.',
        sortable: true,
        render: (_, row) => (
          <span className="font-mono text-xs text-blue-700 font-semibold">{row.cvrNo ?? row.id}</span>
        ),
      },
      {
        key: 'visitType',
        label: 'Visit type',
        sortable: true,
        render: (_, row) => <span className="text-gray-700">{visitTypeLabel(row)}</span>,
      },
      {
        key: 'placeOfCrimeScene',
        label: 'Place',
        sortable: true,
        render: (_, row) => (
          <span className="text-gray-700 line-clamp-2 max-w-[14rem]" title={row.placeOfCrimeScene}>
            {row.placeOfCrimeScene?.trim() ? row.placeOfCrimeScene : '—'}
          </span>
        ),
      },
      {
        key: 'analysisReportReceived',
        label: 'Analysis (saved)',
        sortable: false,
        render: (_, row) => {
          const ar = row.analysisReportReceived;
          const lab = ar?.labReportReceived;
          if (lab === 'No') {
            return <span className="text-gray-700 text-xs">Report: No</span>;
          }
          if (lab === 'Yes' || (ar?.annexRef?.trim() && ar?.date?.trim())) {
            return (
              <span className="text-gray-700 text-xs">
                Report: Yes
                {[ar!.annexRef, ar!.date].filter(Boolean).length
                  ? ` · ${[ar!.annexRef, ar!.date].filter(Boolean).join(' · ')}`
                  : ''}
              </span>
            );
          }
          return <span className="text-gray-400 text-xs">—</span>;
        },
      },
      {
        key: 'updatedAt',
        label: 'Updated',
        sortable: true,
        render: (_, row) => (
          <span className="text-gray-700 text-xs tabular-nums">{formatDateTimeDDMMYYYY(row.updatedAt)}</span>
        ),
      },
      {
        key: 'actions',
        label: 'Actions',
        align: 'right',
        render: (_, row) => {
          const isSel = row.id === selectedSceneId;
          return (
            <button
              type="button"
              onClick={() => selectScene(row.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors border ${
                isSel
                  ? 'text-green-800 bg-green-50 border-green-200 cursor-default'
                  : 'text-blue-700 bg-blue-50 hover:bg-blue-100 border-blue-200'
              }`}
            >
              {isSel ? 'Selected' : 'Select'}
            </button>
          );
        },
      },
    ],
    [selectedSceneId],
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex flex-1 relative z-10 w-full pt-14">
        <main className="flex flex-1 overflow-x-hidden min-w-0 flex-col min-h-screen">
          <div className="w-full px-4 sm:px-6 lg:px-8 py-8 flex-1">
            <div className="flex items-center gap-3 mb-6">
              <Link href="/crime-visit-registry" className={registryBackLinkClass} aria-label="Back">
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </Link>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Production Analysis</h2>
                <p className="text-sm text-gray-600 mt-0.5">
                  Choose a visit in the table, then complete the form below. Saved data appears under{' '}
                  <Link
                    href="/crime-visit-registry/submitted-crime-scenes"
                    className="text-blue-600 font-medium hover:underline"
                  >
                    Submitted crime scenes
                  </Link>
                  .
                </p>
              </div>
            </div>

            {scenes.length === 0 ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
                No crime scenes yet. Create one from{' '}
                <Link href="/crime-visit-registry/create-scene" className="font-semibold underline">
                  Create crime scene
                </Link>
                .
              </div>
            ) : (
              <>
                <div className="mb-6 flex flex-wrap items-end justify-between gap-3 border-b border-gray-200">
                  <div className="px-4 py-2.5 text-sm font-medium rounded-t-lg border-b-2 border-blue-600 text-blue-700 bg-blue-50/50">
                    Crime scenes
                    <span className="ml-2 px-1.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                      {sortedScenes.length}
                    </span>
                  </div>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by CVR, visit type, place, analysis, or updated date…"
                    className="w-full md:w-96 min-h-10 mb-2 px-3 py-2 text-sm rounded-lg border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                  />
                </div>

                <AppTable<CrimeScene>
                  columns={columns}
                  data={sortedScenes}
                  keyField="id"
                  sortKey={sortKey}
                  sortAsc={sortAsc}
                  onSort={handleSort}
                  emptyMessage="No crime scenes match this search."
                  variant="card"
                />

                <div
                  id="production-analysis-form"
                  className="mt-8 bg-white rounded-xl border border-gray-200 flex flex-col scroll-mt-24"
                  style={{ minHeight: selectedScene ? undefined : 'auto' }}
                >
                  <div className="flex-1 overflow-y-auto px-6 py-5">
                    <div className="animate-fade-in space-y-5">
                      <h3 className="text-base font-semibold text-gray-700 uppercase tracking-widest pb-2 border-b border-gray-200">
                        Production analysis
                      </h3>

                      {!selectedScene ? (
                        <p className="text-sm text-gray-500 py-4">
                          Select a visit using <strong>Select</strong> in the table above to load and edit analysis
                          details.
                        </p>
                      ) : (
                        <div className="p-4 sm:p-5 rounded-xl border border-cyan-200 bg-cyan-50/65 space-y-5">
                          <p className="text-sm text-gray-800">
                            <span className="font-semibold text-gray-900">CVR: </span>
                            <span className="font-mono">{(selectedScene.cvrNo ?? '').trim() || '—'}</span>
                            <span className="text-gray-500 mx-2">·</span>
                            <span className="text-gray-700">{visitTypeLabel(selectedScene)}</span>
                          </p>

                          <div className="rounded-lg border border-slate-200 bg-slate-50/80 px-4 py-3 space-y-3">
                            <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-800">
                              Production details — Productions sent to analysis institutes
                            </h4>
                            <p className="text-xs text-gray-600">
                              Only <strong>Productions sent to analysis institutes</strong> is editable here. Other production fields
                              are set in <strong>Update Court Details</strong> or <strong>Create crime scene</strong>. If
                              rows are disabled, set Production Availability and types there first.
                            </p>
                            <CourtDetailsReadOnlySummary
                              courtDetails={selectedScene.courtDetails}
                              title="Production details (reference)"
                              scope="sentToAnalysis"
                              className="!bg-white/90"
                            />
                            <CourtProductionDetailsEditor
                              mode="sentToAnalysis"
                              courtDetails={courtDetailsDraft}
                              onChange={setCourtDetailsDraft}
                            />
                            {courtDetailsError ? <p className="text-sm text-red-600">{courtDetailsError}</p> : null}
                            {courtDetailsSavedOk ? (
                              <p className="text-sm text-green-700 font-medium">
                                Production details (sent to analysis) saved.
                              </p>
                            ) : null}
                            <Button variant="success" type="button" onClick={handleSaveCourtDetails}>
                              Save sent to analysis (production details)
                            </Button>
                          </div>

                          <div className="rounded-lg border border-cyan-300/80 bg-white/90 px-4 py-3">
                            <h4 className="text-xs font-semibold uppercase tracking-wide text-cyan-900 mb-3">
                              Laboratory analysis report
                            </h4>
                            <p className="text-xs text-gray-600 mb-3">
                              Below, record whether an analysis report has been returned for items sent from this visit.
                              If <strong>No</strong>, save without annex, date, or result. If <strong>Yes</strong>, complete
                              those fields.
                            </p>

                            <FieldGroup label="Laboratory analysis report received?">
                              <div className="flex flex-wrap gap-4 min-h-10 items-center rounded-lg border border-gray-200 bg-white px-3 py-2">
                                {(['Yes', 'No'] as const).map((opt) => (
                                  <label key={opt} className="inline-flex items-center gap-2 text-sm text-gray-700">
                                    <input
                                      type="radio"
                                      name="production-analysis-lab-received"
                                      checked={form.labReportReceived === opt}
                                      onChange={() =>
                                        setForm((f) =>
                                          opt === 'No'
                                            ? {
                                                ...f,
                                                labReportReceived: 'No',
                                                annexRef: '',
                                                date: '',
                                                resultReceived: '',
                                                resultOtherDetail: '',
                                              }
                                            : { ...f, labReportReceived: 'Yes' },
                                        )
                                      }
                                      className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                                    />
                                    {opt}
                                  </label>
                                ))}
                              </div>
                            </FieldGroup>
                          </div>

                          <div className="space-y-4">
                            {form.labReportReceived === 'Yes' ? (
                              <>
                                <FieldGroup label="Analysis reports received (annex)">
                                  <CustomSelect
                                    value={form.annexRef}
                                    onChange={(v) => setForm((f) => ({ ...f, annexRef: v }))}
                                    options={ANALYSIS_REPORT_ANNEX_OPTIONS}
                                    placeholder="Select annex…"
                                    searchable
                                    searchPlaceholder="Search annex…"
                                  />
                                </FieldGroup>

                                <FieldGroup label="Date (DD/MM/YY)">
                                  <DatePicker value={form.date} onChange={(v) => setForm((f) => ({ ...f, date: v }))} />
                                </FieldGroup>

                                <FieldGroup label="Result received">
                                  <div className="flex flex-wrap gap-4 min-h-10 items-center rounded-lg border border-gray-200 bg-white/80 px-3 py-2">
                                    {ANALYSIS_REPORT_RESULT_OPTIONS.map((opt) => (
                                      <label key={opt} className="inline-flex items-center gap-2 text-sm text-gray-700">
                                        <input
                                          type="radio"
                                          name="production-analysis-result"
                                          checked={form.resultReceived === opt}
                                          onChange={() =>
                                            setForm((f) => ({
                                              ...f,
                                              resultReceived: opt,
                                              ...(!analysisResultIsOther(opt) ? { resultOtherDetail: '' } : {}),
                                            }))
                                          }
                                          className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                                        />
                                        {opt}
                                      </label>
                                    ))}
                                  </div>
                                </FieldGroup>

                                {analysisResultIsOther(form.resultReceived) ? (
                                  <FieldGroup label="Other — specify">
                                    <textarea
                                      value={form.resultOtherDetail ?? ''}
                                      onChange={(e) => setForm((f) => ({ ...f, resultOtherDetail: e.target.value }))}
                                      rows={3}
                                      placeholder="යතුරු ලියනය කළ හැකි පරිදි සකස් කරන්න"
                                      className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-noto-sinhala placeholder:text-gray-400"
                                    />
                                  </FieldGroup>
                                ) : null}
                              </>
                            ) : form.labReportReceived === 'No' ? (
                              <p className="text-sm text-gray-600 rounded-lg border border-dashed border-gray-300 bg-white/70 px-3 py-2">
                                Saving will record that no laboratory report has been received yet. You can return here
                                later and choose <strong>Yes</strong> to add annex, date, and result.
                              </p>
                            ) : (
                              <p className="text-sm text-amber-900 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                                Choose <strong>Yes</strong> or <strong>No</strong> above to continue.
                              </p>
                            )}
                          </div>

                          <div className="mt-6 pt-4 border-t border-cyan-200/80 space-y-3">
                            {error ? <p className="text-sm text-red-600">{error}</p> : null}
                            {savedOk ? (
                              <p className="text-sm text-green-700 font-medium">
                                Saved. Open the scene in Submitted crime scenes to view the section.
                              </p>
                            ) : null}
                            <Button variant="success" type="button" onClick={handleSave}>
                              Save analysis details
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
          <Footer />
        </main>
      </div>
    </div>
  );
}
