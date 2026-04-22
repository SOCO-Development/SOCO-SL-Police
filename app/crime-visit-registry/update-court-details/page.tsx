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
import { validateProductionSentToCourtSection } from '@/lib/courtDetailsValidation';
import type { CrimeScene, CrimeSceneCourtDetails, CourtVisitOfficerDetailRow, CourtVisitUpdateDetails } from '@/types/crimeScene';
import {
  emptyCourtVisitOfficerDetailRow,
  emptyCourtVisitUpdate,
  emptyCrimeSceneCourtDetails,
  normalizeCourtVisitUpdate,
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

function mergeCourtDetails(base: CrimeSceneCourtDetails | undefined): CrimeSceneCourtDetails {
  return { ...emptyCrimeSceneCourtDetails(), ...base };
}

function mergeCourtVisit(base: CourtVisitUpdateDetails | undefined): CourtVisitUpdateDetails {
  return normalizeCourtVisitUpdate(base);
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

function parseOfficerKey(key: string): Pick<CourtVisitOfficerDetailRow, 'officerName' | 'officerRegNo' | 'officerRoleLabel'> {
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

const MAX_COURT_VISIT_ATTACHMENT_BYTES = Math.floor(1.5 * 1024 * 1024);

function isCourtVisitRowNonEmpty(r: CourtVisitOfficerDetailRow): boolean {
  return Boolean(
    r.testifiedOfficer?.trim() ||
      r.visitDate?.trim() ||
      r.officerKey?.trim() ||
      r.visitDescription?.trim() ||
      r.nextCourtDate?.trim() ||
      r.attachmentFileName?.trim() ||
      r.attachmentDataUrl?.trim(),
  );
}

function validateCourtVisitRows(rows: CourtVisitOfficerDetailRow[]): string {
  if (rows.length === 0) {
    return 'Add at least one court visit detail (use “Add court visit detail”) and complete the required fields.';
  }
  for (let i = 0; i < rows.length; i += 1) {
    const r = rows[i];
    const n = `Court visit ${String(i + 1).padStart(2, '0')}`;
    if (!r.testifiedOfficer?.trim()) return `${n}: enter testified officer.`;
    if (!r.visitDate?.trim()) return `${n}: enter date.`;
    if (!r.officerKey?.trim()) return `${n}: select an officer from this visit.`;
    if (!r.visitDescription?.trim()) return `${n}: enter a description of the visit.`;
  }
  return '';
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(String(fr.result));
    fr.onerror = () => reject(new Error('Failed to read file'));
    fr.readAsDataURL(file);
  });
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
  const [flowMode, setFlowMode] = useState<FlowMode>('production_sent');
  const [courtDraft, setCourtDraft] = useState<CrimeSceneCourtDetails>(() => emptyCrimeSceneCourtDetails());
  const [courtVisitDraft, setCourtVisitDraft] = useState<CourtVisitUpdateDetails>(() => emptyCourtVisitUpdate());
  const [error, setError] = useState('');
  const [savedOk, setSavedOk] = useState(false);
  const [isEditingProductionSentToCourt, setIsEditingProductionSentToCourt] = useState(false);

  useEffect(() => {
    setScenes(crimeSceneService.getAll());
  }, []);

  const sortedScenes = useMemo(() => {
    const data = [...scenes];
    data.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    return data;
  }, [scenes]);

  const sceneSelectOptions = useMemo(
    () =>
      sortedScenes.map((s) => {
        const place = (s.placeOfCrimeScene ?? '').trim();
        const placeShort = place.length > 48 ? `${place.slice(0, 48)}…` : place;
        return {
          value: s.id,
          label: `${(s.cvrNo ?? '').trim() || s.id} · ${visitTypeLabel(s)}${placeShort ? ` · ${placeShort}` : ''} · ${formatDateTimeDDMMYYYY(s.updatedAt)}`,
        };
      }),
    [sortedScenes],
  );

  const selectedScene = useMemo(
    () => (selectedSceneId ? scenes.find((s) => s.id === selectedSceneId) : undefined),
    [scenes, selectedSceneId],
  );

  useEffect(() => {
    if (!selectedSceneId) return;
    if (!sortedScenes.some((s) => s.id === selectedSceneId)) {
      setSelectedSceneId('');
    }
  }, [sortedScenes, selectedSceneId]);

  const officerOptions = useMemo(
    () => (selectedScene ? buildOfficerOptions(selectedScene) : []),
    [selectedScene],
  );

  function patchCourtVisitRow(index: number, partial: Partial<CourtVisitOfficerDetailRow>) {
    setCourtVisitDraft((d) => ({
      rows: d.rows.map((r, i) => (i === index ? { ...r, ...partial } : r)),
    }));
  }

  async function handleCourtVisitAttachment(index: number, file: File | null) {
    if (!file) {
      patchCourtVisitRow(index, { attachmentFileName: '', attachmentDataUrl: '' });
      return;
    }
    if (file.size > MAX_COURT_VISIT_ATTACHMENT_BYTES) {
      setError(
        `Attachment is too large (max ${Math.round(MAX_COURT_VISIT_ATTACHMENT_BYTES / 1024 / 1024)} MB).`,
      );
      return;
    }
    setError('');
    try {
      const dataUrl = await readFileAsDataUrl(file);
      patchCourtVisitRow(index, { attachmentFileName: file.name, attachmentDataUrl: dataUrl });
    } catch {
      setError('Could not read the attachment.');
    }
  }

  useEffect(() => {
    if (!selectedSceneId) {
      setCourtDraft(emptyCrimeSceneCourtDetails());
      setCourtVisitDraft(emptyCourtVisitUpdate());
      setIsEditingProductionSentToCourt(false);
      return;
    }
    const scene = scenes.find((s) => s.id === selectedSceneId);
    if (!scene) return;
    setCourtDraft(mergeCourtDetails(scene.courtDetails));
    setCourtVisitDraft(mergeCourtVisit(scene.courtVisitUpdate));
    setError('');
    setSavedOk(false);
    setIsEditingProductionSentToCourt(false);
  }, [selectedSceneId, scenes]);

  useEffect(() => {
    setIsEditingProductionSentToCourt(false);
    setError('');
    setSavedOk(false);
  }, [flowMode]);

  function selectScene(id: string) {
    setSelectedSceneId(id);
    if (id) {
      setTimeout(() => {
        document.getElementById('court-update-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }

  function validateCourtVisit(): string {
    if (!selectedSceneId) return 'Select a crime scene above, then complete the form below.';
    const filled = courtVisitDraft.rows.filter(isCourtVisitRowNonEmpty);
    return validateCourtVisitRows(filled);
  }

  function handleSaveProduction() {
    if (!selectedSceneId) {
      setError('Select a crime scene first.');
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
    setIsEditingProductionSentToCourt(false);
  }

  function handleCancelEditProductionSentToCourt() {
    if (!selectedSceneId) return;
    const scene = scenes.find((s) => s.id === selectedSceneId);
    if (!scene) return;
    setCourtDraft(mergeCourtDetails(scene.courtDetails));
    setError('');
    setSavedOk(false);
    setIsEditingProductionSentToCourt(false);
  }

  function handleSaveCourtVisit() {
    if (!selectedSceneId) {
      setError('Select a crime scene first.');
      setSavedOk(false);
      return;
    }
    const v = validateCourtVisit();
    if (v) {
      setError(v);
      setSavedOk(false);
      return;
    }
    const filled = courtVisitDraft.rows
      .filter(isCourtVisitRowNonEmpty)
      .map((row) => {
        const p = parseOfficerKey(row.officerKey);
        return {
          ...row,
          officerName: p.officerName || row.officerName,
          officerRegNo: p.officerRegNo || row.officerRegNo,
          officerRoleLabel: p.officerRoleLabel || row.officerRoleLabel,
        };
      });
    const payload: CourtVisitUpdateDetails = { rows: filled };
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
                  Choose a crime scene below, then pick <strong>Production sent to court</strong> (use <strong>Edit</strong>{' '}
                  to change rows) or <strong>Court visit</strong> and save. Updates appear under{' '}
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
                <div className="mb-6 rounded-xl border border-gray-200 bg-gray-50/90 p-4 sm:p-5 space-y-4">
                  <p className="text-sm font-medium text-gray-800">
                    Crime scenes
                    <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                      {sortedScenes.length}
                    </span>
                  </p>
                  <FieldGroup label="Select crime scene">
                    <CustomSelect
                      value={selectedSceneId}
                      onChange={(id) => selectScene(id)}
                      options={[
                        { value: '', label: '— Select a crime scene —' },
                        ...sceneSelectOptions,
                      ]}
                      placeholder="Choose a visit to load the form below"
                      searchable
                      searchPlaceholder="Search CVR, place, type, date…"
                    />
                  </FieldGroup>
                </div>

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
                          Choose a crime scene in the <strong>Select crime scene</strong> dropdown above, then choose
                          what to update.
                        </p>
                      ) : (
                        <>
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
                              className="p-4 sm:p-5 rounded-xl border border-amber-200 bg-amber-50/70 scroll-mt-24 space-y-4"
                            >
                              <div className="flex flex-wrap items-start justify-between gap-3 pb-2 border-b border-amber-200/80">
                                <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-2 min-w-0 flex-1">
                                  <span className="w-1.5 h-4 rounded-full bg-amber-500 inline-block flex-shrink-0" />
                                  <span className="min-w-0">Production details — Production sent to court</span>
                                </h4>
                                <div className="flex flex-wrap items-center gap-2 shrink-0 ml-auto">
                                  {isEditingProductionSentToCourt ? (
                                    <Button
                                      variant="secondary"
                                      type="button"
                                      onClick={handleCancelEditProductionSentToCourt}
                                      className="!min-h-[40px] !px-3 !py-2 !text-sm"
                                    >
                                      Cancel
                                    </Button>
                                  ) : (
                                    <Button
                                      variant="primary"
                                      type="button"
                                      onClick={() => {
                                        setIsEditingProductionSentToCourt(true);
                                        setError('');
                                        setSavedOk(false);
                                      }}
                                      className="!min-h-[40px] !px-3 !py-2 !text-sm"
                                    >
                                      Edit
                                    </Button>
                                  )}
                                </div>
                              </div>
                              <p className="text-xs text-gray-600">
                                {isEditingProductionSentToCourt ? (
                                  <>
                                    Edit <strong>Production sent to court</strong> only. Use{' '}
                                    <strong>Create crime scene</strong> or a full update elsewhere for other production
                                    fields. If rows are disabled, set Production Availability and types there first.
                                  </>
                                ) : (
                                  <>
                                    Other production fields are set in <strong>Create crime scene</strong> or other
                                    updates.
                                  </>
                                )}
                              </p>
                              <CourtProductionDetailsEditor
                                mode="productionSentToCourt"
                                courtDetails={courtDraft}
                                onChange={setCourtDraft}
                                readOnly={!isEditingProductionSentToCourt}
                              />
                              {isEditingProductionSentToCourt ? (
                                <>
                                  {error ? <p className="text-sm text-red-600">{error}</p> : null}
                                  {savedOk ? (
                                    <p className="text-sm text-green-700 font-medium">
                                      Production details saved. View them under Production details on the submitted
                                      scene.
                                    </p>
                                  ) : null}
                                  <div className="flex justify-center">
                                    <Button variant="success" type="button" onClick={handleSaveProduction}>
                                      Save production details
                                    </Button>
                                  </div>
                                </>
                              ) : null}
                              {!isEditingProductionSentToCourt && error ? (
                                <p className="text-sm text-red-600">{error}</p>
                              ) : null}
                              {!isEditingProductionSentToCourt && savedOk ? (
                                <p className="text-sm text-green-700 font-medium">
                                  Production details saved. View them under Production details on the submitted scene.
                                </p>
                              ) : null}
                            </div>
                          ) : (
                            <div
                              id="court-update-visit"
                              className="p-4 sm:p-5 rounded-xl border border-fuchsia-200 bg-fuchsia-50/65 scroll-mt-24 space-y-4"
                            >
                              <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide pb-2 border-b border-fuchsia-200/80 flex items-center gap-2">
                                <span className="w-1.5 h-4 rounded-full bg-fuchsia-500 inline-block flex-shrink-0" />
                                Court visit — SOCO officer details
                              </h4>
                              <p className="text-xs text-gray-600">
                                Add one or more rows for officers on this visit. The officer list comes from the crime
                                scene (team leader, SOCO, investigation) with their roles.
                              </p>

                              {officerOptions.length === 0 ? (
                                <p className="text-sm text-amber-900 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                                  No officers on this visit record. Add officers on the crime scene first.
                                </p>
                              ) : (
                                <>
                                  <div className="space-y-4">
                                    {courtVisitDraft.rows.map((row, index) => (
                                      <div
                                        key={index}
                                        className="rounded-lg border border-fuchsia-200/90 bg-white p-4 shadow-sm space-y-3"
                                      >
                                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-fuchsia-100 pb-2">
                                          <p className="text-sm font-semibold text-fuchsia-950">
                                            Court visit {String(index + 1).padStart(2, '0')}
                                          </p>
                                          <button
                                            type="button"
                                            onClick={() =>
                                              setCourtVisitDraft((d) => ({
                                                rows: d.rows.filter((_, i) => i !== index),
                                              }))
                                            }
                                            className="h-9 rounded-lg border border-red-200 bg-red-50 px-3 text-red-600 text-xs font-semibold hover:bg-red-100"
                                            aria-label={`Remove court visit row ${String(index + 1).padStart(2, '0')}`}
                                          >
                                            Remove
                                          </button>
                                        </div>
                                        <FieldGroup label="Testified officer">
                                          <input
                                            type="text"
                                            value={row.testifiedOfficer}
                                            onChange={(e) => patchCourtVisitRow(index, { testifiedOfficer: e.target.value })}
                                            placeholder="Name of the officer who testified"
                                            className="w-full min-h-10 px-3 py-2 text-sm rounded-lg border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/40 focus:border-fuchsia-500"
                                          />
                                        </FieldGroup>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                          <FieldGroup label="Date (DD/MM/YY)">
                                            <DatePicker
                                              value={row.visitDate}
                                              onChange={(v) => patchCourtVisitRow(index, { visitDate: v })}
                                            />
                                          </FieldGroup>
                                          <FieldGroup label="Officer (on this visit)">
                                            <CustomSelect
                                              value={row.officerKey}
                                              onChange={(key) => {
                                                const p = parseOfficerKey(key);
                                                patchCourtVisitRow(index, {
                                                  officerKey: key,
                                                  officerName: p.officerName,
                                                  officerRegNo: p.officerRegNo,
                                                  officerRoleLabel: p.officerRoleLabel,
                                                });
                                              }}
                                              options={officerOptions}
                                              placeholder="Select officer & role"
                                              searchable
                                              searchPlaceholder="Search name, role…"
                                            />
                                          </FieldGroup>
                                        </div>
                                        <FieldGroup label="Description of the visit">
                                          <textarea
                                            value={row.visitDescription}
                                            onChange={(e) => patchCourtVisitRow(index, { visitDescription: e.target.value })}
                                            rows={4}
                                            placeholder="What happened at court for this visit…"
                                            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/40 focus:border-fuchsia-500 placeholder:text-gray-400"
                                          />
                                        </FieldGroup>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                          <FieldGroup label="Next court date (optional)">
                                            <DatePicker
                                              value={row.nextCourtDate ?? ''}
                                              onChange={(v) => patchCourtVisitRow(index, { nextCourtDate: v })}
                                            />
                                          </FieldGroup>
                                          <FieldGroup label="Attachment (optional)">
                                            <div className="space-y-2">
                                              <input
                                                type="file"
                                                className="block w-full min-h-10 text-sm text-gray-600 file:mr-3 file:h-10 file:min-h-10 file:rounded-lg file:border file:border-fuchsia-200 file:bg-fuchsia-50 file:px-3 file:py-0 file:text-sm file:font-medium file:leading-none file:text-fuchsia-900 file:inline-flex file:items-center"
                                                onChange={(e) => {
                                                  const f = e.target.files?.[0] ?? null;
                                                  void handleCourtVisitAttachment(index, f);
                                                  e.currentTarget.value = '';
                                                }}
                                              />
                                              {row.attachmentFileName ? (
                                                <div className="flex flex-wrap items-center gap-2 text-xs text-gray-700">
                                                  <span className="font-medium">{row.attachmentFileName}</span>
                                                  <button
                                                    type="button"
                                                    onClick={() =>
                                                      patchCourtVisitRow(index, {
                                                        attachmentFileName: '',
                                                        attachmentDataUrl: '',
                                                      })
                                                    }
                                                    className="text-red-600 font-semibold hover:underline"
                                                  >
                                                    Remove file
                                                  </button>
                                                </div>
                                              ) : null}
                                            </div>
                                          </FieldGroup>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setCourtVisitDraft((d) => ({
                                        rows: [...d.rows, emptyCourtVisitOfficerDetailRow()],
                                      }))
                                    }
                                    className="text-sm text-fuchsia-800 hover:text-fuchsia-950 font-medium flex items-center gap-1"
                                  >
                                    <span className="text-base leading-none">+</span> Add court visit detail
                                  </button>
                                </>
                              )}

                              <div className="mt-2 pt-4 border-t border-fuchsia-200/80 space-y-3">
                                {error ? <p className="text-sm text-red-600">{error}</p> : null}
                                {savedOk ? (
                                  <p className="text-sm text-green-700 font-medium">
                                    Court visit details saved. View them on the submitted crime scene.
                                  </p>
                                ) : null}
                                <div className="flex justify-center">
                                  <Button
                                    variant="success"
                                    type="button"
                                    onClick={handleSaveCourtVisit}
                                    disabled={officerOptions.length === 0}
                                  >
                                    Save court visit
                                  </Button>
                                </div>
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
