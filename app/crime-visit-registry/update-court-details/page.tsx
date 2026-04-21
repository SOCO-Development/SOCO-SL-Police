'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CustomSelect from '@/components/forms/CustomSelect';
import DatePicker from '@/components/forms/DatePicker';
import Button from '@/components/buttons/Button';
import CourtProductionDetailsEditor from '@/app/crime-visit-registry/components/CourtProductionDetailsEditor';
import { crimeSceneService } from '@/lib/crimeSceneService';
import { formatDateTimeDDMMYYYY } from '@/lib/dateUtils';
import { validateCourtProductionDetails } from '@/lib/courtDetailsValidation';
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

function sceneSelectLabel(s: CrimeScene) {
  const vt =
    s.visitType === 'REVISIT' ? 'Revisit' : s.visitType === 'COURT_VISIT' ? 'Court visit' : 'New visit';
  return `${(s.cvrNo ?? '').trim() || '—'} — ${vt} — updated ${formatDateTimeDDMMYYYY(s.updatedAt)}`;
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

export default function UpdateCourtDetailsPage() {
  const [scenes, setScenes] = useState<CrimeScene[]>([]);
  const [selectedSceneId, setSelectedSceneId] = useState('');
  const [search, setSearch] = useState('');
  const [flowMode, setFlowMode] = useState<FlowMode>('production_sent');
  const [courtDraft, setCourtDraft] = useState<CrimeSceneCourtDetails>(() => emptyCrimeSceneCourtDetails());
  const [courtVisitDraft, setCourtVisitDraft] = useState<CourtVisitUpdateDetails>(() => emptyCourtVisitUpdate());
  const [error, setError] = useState('');
  const [savedOk, setSavedOk] = useState(false);

  useEffect(() => {
    setScenes(crimeSceneService.getAll());
  }, []);

  const sceneOptions = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = [...scenes].sort((a, b) => {
      const c = (a.cvrNo ?? '').localeCompare(b.cvrNo ?? '', undefined, { numeric: true });
      if (c !== 0) return c;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
    return list
      .filter((s) => (q ? sceneSelectLabel(s).toLowerCase().includes(q) : true))
      .map((s) => ({ value: s.id, label: sceneSelectLabel(s) }));
  }, [scenes, search]);

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

  function validateCourtVisit(): string {
    if (!selectedSceneId) return 'Select a CVR / visit from the list.';
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
      setError('Select a CVR / visit from the list.');
      setSavedOk(false);
      return;
    }
    const v = validateCourtProductionDetails(courtDraft);
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

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-1 relative z-10 w-full pt-14">
        <main className="flex-1 overflow-x-hidden min-w-0 flex flex-col min-h-screen">
          <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1">
            <div className="flex items-center gap-3 mb-6">
              <Link href="/crime-visit-registry" className={registryBackLinkClass} aria-label="Back">
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </Link>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Update court details</h2>
            <p className="text-sm text-gray-500 mt-1 mb-6">
              Select a CVR visit, then choose <strong>Production sent to court</strong> (production / P.R. details as in
              crime visit registry) or <strong>Court visit</strong> (officer, visit date, results). Updates appear under{' '}
              <Link
                href="/crime-visit-registry/submitted-crime-scenes"
                className="text-blue-600 font-medium hover:underline"
              >
                Submitted crime scenes
              </Link>
              .
            </p>

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
                <div className="mb-4">
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                    Filter list
                  </label>
                  <input
                    type="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by CVR, visit type, or date…"
                    className="w-full min-h-10 px-3 py-2 text-sm rounded-lg border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                  />
                </div>

                <div className="mb-6">
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                    CVR / visit
                  </label>
                  <CustomSelect
                    value={selectedSceneId}
                    onChange={(id) => setSelectedSceneId(id)}
                    options={sceneOptions}
                    placeholder="Select CVR and visit…"
                    searchable
                    searchPlaceholder="Search…"
                  />
                </div>

                {selectedScene ? (
                  <>
                    <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4">
                      <span className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">
                        What are you updating?
                      </span>
                      <div className="flex flex-wrap gap-4">
                        <label className="inline-flex items-center gap-2 text-sm text-gray-800">
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
                        <label className="inline-flex items-center gap-2 text-sm text-gray-800">
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
                    </div>

                    {flowMode === 'production_sent' ? (
                      <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-5 sm:p-6 space-y-4">
                        <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-amber-200/80 pb-3">
                          <h3 className="text-sm font-semibold text-gray-800">Production sent to court</h3>
                          <span className="text-xs text-gray-500 font-mono tabular-nums">
                            CVR {(selectedScene.cvrNo ?? '').trim() || '—'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600">
                          Same court / production fields as in Create crime scene. Pre-filled from this visit’s saved
                          court details.
                        </p>
                        <CourtProductionDetailsEditor courtDetails={courtDraft} onChange={setCourtDraft} />
                        {error ? <p className="text-sm text-red-600">{error}</p> : null}
                        {savedOk ? (
                          <p className="text-sm text-green-700 font-medium">
                            Production / court details saved. View them under Court details on the submitted scene.
                          </p>
                        ) : null}
                        <Button variant="success" type="button" onClick={handleSaveProduction}>
                          Save production / court details
                        </Button>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-violet-200 bg-violet-50/70 p-5 sm:p-6 space-y-5">
                        <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-violet-200/80 pb-3">
                          <h3 className="text-sm font-semibold text-gray-800">Court visit</h3>
                          <span className="text-xs text-gray-500 font-mono tabular-nums">
                            CVR {(selectedScene.cvrNo ?? '').trim() || '—'}
                          </span>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                            Officer
                          </label>
                          {officerOptions.length === 0 ? (
                            <p className="text-sm text-amber-800 bg-amber-100/80 border border-amber-200 rounded-lg px-3 py-2">
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
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                            Date of visit (DD/MM/YY)
                          </label>
                          <DatePicker
                            value={courtVisitDraft.visitDate}
                            onChange={(v) => setCourtVisitDraft((d) => ({ ...d, visitDate: v }))}
                          />
                        </div>

                        <div>
                          <span className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                            Results
                          </span>
                          <div className="flex flex-wrap gap-3 rounded-lg border border-gray-200 bg-white px-3 py-3">
                            {ANALYSIS_REPORT_RESULT_OPTIONS.map((opt) => (
                              <label key={opt} className="inline-flex items-center gap-2 text-sm text-gray-800">
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
                        </div>

                        {analysisResultIsOther(courtVisitDraft.resultReceived) ? (
                          <div>
                            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                              Other — specify
                            </label>
                            <textarea
                              value={courtVisitDraft.resultOtherDetail ?? ''}
                              onChange={(e) =>
                                setCourtVisitDraft((d) => ({ ...d, resultOtherDetail: e.target.value }))
                              }
                              rows={3}
                              placeholder="යතුරු ලියනය කළ හැකි පරිදි සකස් කරන්න"
                              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-noto-sinhala placeholder:text-gray-400"
                            />
                          </div>
                        ) : null}

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
                    )}
                  </>
                ) : null}
              </>
            )}
          </div>
          <Footer />
        </main>
      </div>
    </div>
  );
}
