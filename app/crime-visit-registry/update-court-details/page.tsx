'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import AppTable, { type AppTableColumn } from '@/components/layout/AppTable';
import CustomSelect from '@/components/forms/CustomSelect';
import DatePicker from '@/components/forms/DatePicker';
import Button from '@/components/buttons/Button';
import CourtProductionDetailsEditor from '@/app/crime-visit-registry/components/CourtProductionDetailsEditor';
import CourtDetailsReadOnlySummary from '@/app/crime-visit-registry/components/CourtDetailsReadOnlySummary';
import { crimeSceneService } from '@/lib/crimeSceneService';
import { formatDateTimeDDMMYYYY } from '@/lib/dateUtils';
import { validateProductionSentToCourtSection } from '@/lib/courtDetailsValidation';
import {
  ANALYSIS_REPORT_RESULT_OPTIONS,
  analysisResultIsOther,
} from '@/lib/analysisReportReceivedOptions';
import type { CrimeScene, CrimeSceneCourtDetails, CourtVisitUpdateDetails } from '@/types/crimeScene';
import {
  emptyCourtVisitUpdate,
  emptyCrimeSceneCourtDetails,
} from '@/types/crimeScene';
import { registryBackLinkClass } from '@/app/crime-visit-registry/uiStyles';
import { ArrowLeft } from 'lucide-react';

type FlowMode = 'production_sent' | 'court_visit';

function visitTypeLabel(scene: CrimeScene) {
  return scene.visitType === 'REVISIT'
    ? 'Revisit'
    : scene.visitType === 'COURT_VISIT'
      ? 'Court visit'
      : 'New visit';
}

function courtTableHaystack(s: CrimeScene): string {
  const cd = s.courtDetails;
  const cv = s.courtVisitUpdate;
  return [
    s.cvrNo,
    visitTypeLabel(s),
    formatDateTimeDDMMYYYY(s.updatedAt),
    s.placeOfCrimeScene,
    cd?.courtName,
    cd?.productionPR,
    cd?.productionPRTypes?.join(' '),
    cv?.officerName,
    cv?.visitDate,
    cv?.resultReceived,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

function courtStatusHint(s: CrimeScene): string {
  const parts: string[] = [];
  const pr = s.courtDetails?.productionPR;
  if (pr === 'Yes') parts.push('P.R. Yes');
  else if (pr === 'No') parts.push('P.R. No');
  const rows = s.courtDetails?.productionSentToCourtRows?.length ?? 0;
  if (rows > 0) parts.push(`${rows} sent row${rows === 1 ? '' : 's'}`);
  if (s.courtVisitUpdate?.officerName?.trim()) parts.push('Visit saved');
  return parts.length ? parts.join(' · ') : '—';
}

function mergeCourtDetails(base: CrimeSceneCourtDetails | undefined): CrimeSceneCourtDetails {
  return { ...emptyCrimeSceneCourtDetails(), ...base };
}

function mergeCourtVisit(base: CourtVisitUpdateDetails | undefined): CourtVisitUpdateDetails {
  return { ...emptyCourtVisitUpdate(), ...base };
}

function buildOfficerOptions(scene: CrimeScene): { value: string; label: string }[] {
  const opts: { value: string; label: string }[] = [];
  const push = (role: string, o: { name?: string; regNo?: string }) => {
    const name = (o.name ?? '').trim();
    if (!name) return;
    const reg = (o.regNo ?? '').trim();
    const value = JSON.stringify({ role, name, regNo: reg });
    opts.push({
      value,
      label: `${name}${reg ? ` (${reg})` : ''} — ${role}`,
    });
  };
  push('Team leader', scene.inChargeOfficer);
  (scene.socoOfficers ?? []).forEach((o, i) => push(`SOCO officer ${i + 1}`, o));
  (scene.investigationOfficers ?? []).forEach((o, i) => push(`Investigation officer ${i + 1}`, o));
  return opts;
}

function parseOfficerKey(key: string): Pick<CourtVisitUpdateDetails, 'officerName' | 'officerRegNo' | 'officerRoleLabel'> {
  try {
    const o = JSON.parse(key) as { role?: string; name?: string; regNo?: string };
    return {
      officerRoleLabel: o.role ?? '',
      officerName: o.name ?? '',
      officerRegNo: o.regNo ?? '',
    };
  } catch {
    return { officerRoleLabel: '', officerName: '', officerRegNo: '' };
  }
}

function FieldGroup({ label, children, className = '' }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">{label}</label>
      {children}
    </div>
  );
}

export default function UpdateCourtDetailsPage() {
  const [scenes, setScenes] = useState<CrimeScene[]>([]);
  const [selectedSceneId, setSelectedSceneId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState<keyof CrimeScene | string | null>('updatedAt');
  const [sortAsc, setSortAsc] = useState(false);
  const [flowMode, setFlowMode] = useState<FlowMode>('production_sent');
  const [courtDraft, setCourtDraft] = useState<CrimeSceneCourtDetails>(() => emptyCrimeSceneCourtDetails());
  const [courtVisitDraft, setCourtVisitDraft] = useState<CourtVisitUpdateDetails>(() => emptyCourtVisitUpdate());
  const [error, setError] = useState('');
  const [savedOk, setSavedOk] = useState(false);

  useEffect(() => {
    setScenes(crimeSceneService.getAll());
  }, []);

  const filteredScenes = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return scenes.filter((s) => (q ? courtTableHaystack(s).includes(q) : true));
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

  const officerOptions = useMemo(
    () => (selectedScene ? buildOfficerOptions(selectedScene) : []),
    [selectedScene],
  );

  useEffect(() => {
    if (!selectedSceneId) {
      setCourtDraft(emptyCrimeSceneCourtDetails());
      setCourtVisitDraft(emptyCourtVisitUpdate());
      return;
    }
    const scene = scenes.find((s) => s.id === selectedSceneId);
    if (!scene) return;
    setCourtDraft(mergeCourtDetails(scene.courtDetails));
    setCourtVisitDraft(mergeCourtVisit(scene.courtVisitUpdate));
    setError('');
    setSavedOk(false);
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
      document.getElementById('court-update-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }

  function validateCourtVisit(): string {
    if (!selectedSceneId) return 'Select a row in the table, then complete the form below.';
    if (!courtVisitDraft.officerKey?.trim()) return 'Select the officer.';
    if (!courtVisitDraft.visitDate?.trim()) return 'Enter the date of visit.';
    if (!courtVisitDraft.resultReceived) return 'Select results.';
    if (analysisResultIsOther(courtVisitDraft.resultReceived) && !courtVisitDraft.resultOtherDetail?.trim()) {
      return 'Describe the result when “Other” is selected.';
    }
    return '';
  }

  function handleSaveProduction() {
    if (!selectedSceneId) {
      setError('Select a row in the table first.');
      setSavedOk(false);
      return;
    }
    const v = validateProductionSentToCourtSection(courtDraft);
    if (v) {
      setError(v);
      setSavedOk(false);
      return;
    }
    const updated = crimeSceneService.updateCourtDetailsProduction(selectedSceneId, courtDraft);
    if (!updated) {
      setError('Could not save. The visit record may have been removed.');
      setSavedOk(false);
      return;
    }
    setScenes(crimeSceneService.getAll());
    setCourtDraft(mergeCourtDetails(updated.courtDetails));
    setError('');
    setSavedOk(true);
  }

  function handleSaveCourtVisit() {
    const v = validateCourtVisit();
    if (v) {
      setError(v);
      setSavedOk(false);
      return;
    }
    const parsed = parseOfficerKey(courtVisitDraft.officerKey);
    const payload: CourtVisitUpdateDetails = {
      officerKey: courtVisitDraft.officerKey,
      officerName: parsed.officerName || courtVisitDraft.officerName,
      officerRegNo: parsed.officerRegNo || courtVisitDraft.officerRegNo,
      officerRoleLabel: parsed.officerRoleLabel || courtVisitDraft.officerRoleLabel,
      visitDate: courtVisitDraft.visitDate.trim(),
      resultReceived: courtVisitDraft.resultReceived as CourtVisitUpdateDetails['resultReceived'],
      resultOtherDetail: analysisResultIsOther(courtVisitDraft.resultReceived)
        ? courtVisitDraft.resultOtherDetail?.trim()
        : '',
    };
    const updated = crimeSceneService.updateCourtVisitDetails(selectedSceneId, payload);
    if (!updated) {
      setError('Could not save. The visit record may have been removed.');
      setSavedOk(false);
      return;
    }
    setScenes(crimeSceneService.getAll());
    setCourtVisitDraft(mergeCourtVisit(updated.courtVisitUpdate));
    setError('');
    setSavedOk(true);
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
          <span className="text-gray-700 line-clamp-2 max-w-[12rem]" title={row.placeOfCrimeScene}>
            {row.placeOfCrimeScene?.trim() ? row.placeOfCrimeScene : '—'}
          </span>
        ),
      },
      {
        key: 'courtHint',
        label: 'Court / production (saved)',
        sortable: false,
        render: (_, row) => (
          <span className="text-gray-700 text-xs">{courtStatusHint(row)}</span>
        ),
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
                <h2 className="text-2xl font-bold text-gray-900">Update Court Details</h2>
                <p className="text-sm text-gray-600 mt-0.5">
                  Choose a visit in the table, then pick <strong>Production sent to court</strong> or{' '}
                  <strong>Court visit</strong> and save. Updates appear under{' '}
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
                    placeholder="Search by CVR, visit type, place, court data, or updated date…"
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
                  id="court-update-form"
                  className="mt-8 bg-white rounded-xl border border-gray-200 flex flex-col scroll-mt-24"
                >
                  <div className="flex-1 overflow-y-auto px-6 py-5">
                    <div className="animate-fade-in space-y-5">
                      <h3 className="text-base font-semibold text-gray-700 uppercase tracking-widest pb-2 border-b border-gray-200">
                        Update Court Details
                      </h3>

                      {!selectedScene ? (
                        <p className="text-sm text-gray-500 py-4">
                          Select a visit using <strong>Select</strong> in the table above, then choose what to update.
                        </p>
                      ) : (
                        <>
                          <CourtDetailsReadOnlySummary
                            courtDetails={selectedScene.courtDetails}
                            title="Court & production saved with this visit (reference)"
                            scope="productionSentToCourt"
                          />
                          <p className="text-xs text-gray-600 -mt-2">
                            The editable section below starts from this data — change only what you need; you are not
                            re-entering the whole crime scene.
                          </p>

                          <div className="p-4 sm:p-5 rounded-xl border border-gray-200 bg-gray-50/80">
                            <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide pb-2 mb-3 flex items-center gap-2">
                              <span className="w-1.5 h-4 rounded-full bg-gray-500 inline-block flex-shrink-0" />
                              What are you updating?
                            </h4>
                            <FieldGroup label="Update type">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 min-h-10 rounded-lg border border-gray-200 bg-white/90 p-2">
                                <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                                  <input
                                    type="radio"
                                    name="court-update-flow"
                                    checked={flowMode === 'production_sent'}
                                    onChange={() => {
                                      setFlowMode('production_sent');
                                      setError('');
                                      setSavedOk(false);
                                    }}
                                    className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                                  />
                                  Production sent to court
                                </label>
                                <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                                  <input
                                    type="radio"
                                    name="court-update-flow"
                                    checked={flowMode === 'court_visit'}
                                    onChange={() => {
                                      setFlowMode('court_visit');
                                      setError('');
                                      setSavedOk(false);
                                    }}
                                    className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                                  />
                                  Court visit
                                </label>
                              </div>
                            </FieldGroup>
                            <p className="text-sm text-gray-800 mt-3">
                              <span className="font-semibold text-gray-900">CVR: </span>
                              <span className="font-mono">{(selectedScene.cvrNo ?? '').trim() || '—'}</span>
                              <span className="text-gray-500 mx-2">·</span>
                              <span className="text-gray-700">{visitTypeLabel(selectedScene)}</span>
                            </p>
                          </div>

                          {flowMode === 'production_sent' ? (
                            <div
                              id="court-update-production"
                              className="p-4 sm:p-5 rounded-xl border border-amber-200 bg-amber-50/70 scroll-mt-24"
                            >
                              <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide pb-2 mb-3 flex items-center gap-2">
                                <span className="w-1.5 h-4 rounded-full bg-amber-500 inline-block flex-shrink-0" />
                                Court details
                              </h4>
                              <p className="text-xs text-gray-600 mb-4">
                                Edit <strong>Production sent to court</strong> only. Use Create crime scene or a full
                                update elsewhere for other court and production fields.
                              </p>
                              <CourtProductionDetailsEditor
                                mode="productionSentToCourt"
                                courtDetails={courtDraft}
                                onChange={setCourtDraft}
                              />
                              <div className="mt-6 pt-4 border-t border-amber-200/80 space-y-3">
                                {error ? <p className="text-sm text-red-600">{error}</p> : null}
                                {savedOk ? (
                                  <p className="text-sm text-green-700 font-medium">
                                    Production / court details saved. View them under Court details on the submitted
                                    scene.
                                  </p>
                                ) : null}
                                <Button variant="success" type="button" onClick={handleSaveProduction}>
                                  Save production / court details
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div
                              id="court-update-visit"
                              className="p-4 sm:p-5 rounded-xl border border-fuchsia-200 bg-fuchsia-50/65 scroll-mt-24"
                            >
                              <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide pb-2 mb-3 flex items-center gap-2">
                                <span className="w-1.5 h-4 rounded-full bg-fuchsia-500 inline-block flex-shrink-0" />
                                Court visit
                              </h4>

                              <div className="space-y-4">
                                <FieldGroup label="Officer">
                                  {officerOptions.length === 0 ? (
                                    <p className="text-sm text-amber-900 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                                      No officers on this visit record. Add officers on the crime scene first.
                                    </p>
                                  ) : (
                                    <CustomSelect
                                      value={courtVisitDraft.officerKey}
                                      onChange={(key) => {
                                        const p = parseOfficerKey(key);
                                        setCourtVisitDraft((d) => ({
                                          ...d,
                                          officerKey: key,
                                          officerName: p.officerName,
                                          officerRegNo: p.officerRegNo,
                                          officerRoleLabel: p.officerRoleLabel,
                                        }));
                                      }}
                                      options={officerOptions}
                                      placeholder="Select officer…"
                                      searchable
                                      searchPlaceholder="Search…"
                                    />
                                  )}
                                </FieldGroup>

                                <FieldGroup label="Date of visit (DD/MM/YY)">
                                  <DatePicker
                                    value={courtVisitDraft.visitDate}
                                    onChange={(v) => setCourtVisitDraft((d) => ({ ...d, visitDate: v }))}
                                  />
                                </FieldGroup>

                                <FieldGroup label="Results">
                                  <div className="flex flex-wrap gap-4 min-h-10 items-center rounded-lg border border-gray-200 bg-white/80 px-3 py-2">
                                    {ANALYSIS_REPORT_RESULT_OPTIONS.map((opt) => (
                                      <label key={opt} className="inline-flex items-center gap-2 text-sm text-gray-700">
                                        <input
                                          type="radio"
                                          name="court-visit-results"
                                          checked={courtVisitDraft.resultReceived === opt}
                                          onChange={() =>
                                            setCourtVisitDraft((d) => ({
                                              ...d,
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

                                {analysisResultIsOther(courtVisitDraft.resultReceived) ? (
                                  <FieldGroup label="Other — specify">
                                    <textarea
                                      value={courtVisitDraft.resultOtherDetail ?? ''}
                                      onChange={(e) =>
                                        setCourtVisitDraft((d) => ({ ...d, resultOtherDetail: e.target.value }))
                                      }
                                      rows={3}
                                      placeholder="යතුරු ලියනය කළ හැකි පරිදි සකස් කරන්න"
                                      className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-noto-sinhala placeholder:text-gray-400"
                                    />
                                  </FieldGroup>
                                ) : null}
                              </div>

                              <div className="mt-6 pt-4 border-t border-fuchsia-200/80 space-y-3">
                                {error ? <p className="text-sm text-red-600">{error}</p> : null}
                                {savedOk ? (
                                  <p className="text-sm text-green-700 font-medium">
                                    Court visit saved. View it in the Court visit section on the submitted scene.
                                  </p>
                                ) : null}
                                <Button variant="success" type="button" onClick={handleSaveCourtVisit}>
                                  Save court visit
                                </Button>
                              </div>
                            </div>
                          )}
                        </>
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
