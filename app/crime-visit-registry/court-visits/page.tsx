'use client';
import { AddRowButton, RemoveRowButton, PageHeader, PageLayout, ActionChipButton } from '@/components/ui';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import CustomSelect from '@/components/forms/CustomSelect';
import DatePicker from '@/components/forms/DatePicker';
import Button from '@/components/buttons/Button';
import { crimeSceneService } from '@/lib/crimeSceneService';
import { COURT_NAME_OPTIONAL_SELECT_OPTIONS } from '@/lib/courtNames';
import { formatDateTimeDDMMYYYY } from '@/lib/dateUtils';
import type { CrimeScene, CourtVisitOfficerDetailRow, CourtVisitUpdateDetails, CrimeSceneCourtDetails } from '@/types/crimeScene';
import {
  emptyCourtVisitOfficerDetailRow,
  emptyCourtVisitUpdate,
  emptyCrimeSceneCourtDetails,
  normalizeCourtVisitUpdate,
} from '@/types/crimeScene';
import ResultPopup, { useResultPopup } from '@/components/modals/ResultPopup';

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
    return 'Add at least one court visit detail (use "Add court visit detail") and complete the required fields.';
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

export default function CourtVisitsPage() {
  const router = useRouter();
  const [scenes, setScenes] = useState<CrimeScene[]>([]);
  const [selectedSceneId, setSelectedSceneId] = useState('');
  const [courtDraft, setCourtDraft] = useState<CrimeSceneCourtDetails>(() => emptyCrimeSceneCourtDetails());
  const [courtVisitDraft, setCourtVisitDraft] = useState<CourtVisitUpdateDetails>(() => emptyCourtVisitUpdate());
  const [error, setError] = useState('');
  const [savedOk, setSavedOk] = useState(false);
  const [popup, showPopup, closePopup] = useResultPopup();

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
          label: (s.cvrNo ?? '').trim() || s.id,
          description: `${visitTypeLabel(s)}${placeShort ? ` · ${placeShort}` : ''} · ${formatDateTimeDDMMYYYY(s.updatedAt)}`,
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

  function patchCourtDetails(partial: Partial<CrimeSceneCourtDetails>) {
    setCourtDraft((prev) => ({
      ...emptyCrimeSceneCourtDetails(),
      ...prev,
      ...partial,
    }));
  }

  async function handleCourtVisitAttachment(index: number, file: File | null) {
    if (!file) {
      patchCourtVisitRow(index, { attachmentFileName: '', attachmentDataUrl: '' });
      return;
    }
    if (file.size > MAX_COURT_VISIT_ATTACHMENT_BYTES) {
      showPopup('error', 'File Too Large', `Attachment is too large (max ${Math.round(MAX_COURT_VISIT_ATTACHMENT_BYTES / 1024 / 1024)} MB).`);
      return;
    }
    try {
      const dataUrl = await readFileAsDataUrl(file);
      patchCourtVisitRow(index, { attachmentFileName: file.name, attachmentDataUrl: dataUrl });
    } catch {
      showPopup('error', 'File Error', 'Could not read the attachment.');
    }
  }

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

  function selectScene(id: string) {
    setSelectedSceneId(id);
    if (id) {
      setTimeout(() => {
        document.getElementById('court-visit-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }

  function validateCourtVisit(): string {
    if (!selectedSceneId) return 'Select a crime scene above, then complete the form below.';
    const filled = courtVisitDraft.rows.filter(isCourtVisitRowNonEmpty);
    const hasCourtDetails = Boolean(
      (courtDraft.courtName ?? '').trim() ||
      (courtDraft.courtCaseNo ?? '').trim() ||
      (courtDraft.bNumber ?? '').trim(),
    );
    if (filled.length === 0) {
      return hasCourtDetails
        ? ''
        : 'Add at least one court visit detail (use "Add court visit detail") and complete the required fields, or provide court details.';
    }
    return validateCourtVisitRows(filled);
  }

  function handleSaveCourtVisit() {
    if (!selectedSceneId) {
      showPopup('error', 'No Scene Selected', 'Select a crime scene first.');
      return;
    }
    const v = validateCourtVisit();
    if (v) {
      setError(v);
      setSavedOk(false);
      showPopup('error', 'Validation Error', v);
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
    const updated = crimeSceneService.updateCourtVisitDetails(selectedSceneId, payload, courtDraft);
    if (!updated) {
      const msg = 'Could not save. The visit record may have been removed.';
      setError(msg);
      setSavedOk(false);
      showPopup('error', 'Save Failed', msg);
      return;
    }
    setScenes(crimeSceneService.getAll());
    setCourtDraft(mergeCourtDetails(updated.courtDetails));
    setCourtVisitDraft(mergeCourtVisit(updated.courtVisitUpdate));
    setError('');
    setSavedOk(true);
    showPopup('success', 'Court Visit Saved', 'Court visit details have been saved successfully.');
    setTimeout(() => router.push('/crime-visit-registry'), 2500);
  }

  return (
    <>
      <PageLayout>
        <PageHeader
          backHref="/crime-visit-registry"
          title="Court Visits"
        />

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
            <div className="mb-6 rounded-xl border border-sky-200 bg-sky-50/80 p-4 sm:p-5 space-y-4 shadow-sm">
              <p className="text-sm font-semibold text-sky-950 flex items-center gap-2">
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-sky-500" />
                Crime scenes
                <span className="ml-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-sky-200 text-sky-900 border border-sky-300">
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
              id="court-visit-form"
              className="mt-8 bg-white rounded-xl border border-gray-200 flex flex-col scroll-mt-24"
            >
              <div className="flex-1 overflow-y-auto px-6 py-5">
                <div className="animate-fade-in space-y-5">
                  <h3 className="text-base font-semibold text-gray-700 uppercase tracking-widest pb-2 border-b border-gray-200">
                    Update Court Details
                  </h3>

                  {!selectedScene ? (
                    <p className="text-sm text-gray-500 py-4">
                      Choose a crime scene in the <strong>Select crime scene</strong> dropdown above.
                    </p>
                  ) : (
                    <>
                      <div className="p-4 sm:p-5 rounded-xl border border-fuchsia-200 bg-fuchsia-50/65 space-y-4">
                        <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide pb-2 border-b border-fuchsia-200/80 flex items-center gap-2">
                          <span className="w-1.5 h-4 rounded-full bg-fuchsia-500 inline-block flex-shrink-0" />
                          Court visit — SOCO officer details
                        </h4>
                        <p className="text-xs text-gray-600">
                          Add one or more rows for officers on this visit. The officer list comes from the crime
                          scene (team leader, SOCO, investigation) with their roles.
                        </p>

                        <div className="p-4 rounded-xl border border-orange-200 bg-orange-50/70">
                          <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide pb-2 mb-3 flex items-center gap-2">
                            <span className="w-1.5 h-4 rounded-full bg-orange-500 inline-block flex-shrink-0" />
                            Court Details
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <FieldGroup label="Court name">
                              <CustomSelect
                                value={courtDraft.courtName ?? ''}
                                onChange={(value) => patchCourtDetails({ courtName: value })}
                                options={COURT_NAME_OPTIONAL_SELECT_OPTIONS}
                                placeholder="Select court name"
                                searchable
                                searchPlaceholder="Search court name"
                              />
                            </FieldGroup>
                            <FieldGroup label="Court case number">
                              <input
                                type="text"
                                value={courtDraft.courtCaseNo ?? ''}
                                onChange={(e) => patchCourtDetails({ courtCaseNo: e.target.value })}
                                placeholder="Enter court case number"
                                className="w-full min-h-10 px-3 py-2 text-sm rounded-lg border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500"
                              />
                            </FieldGroup>
                            <FieldGroup label="B number">
                              <input
                                type="text"
                                value={courtDraft.bNumber ?? ''}
                                onChange={(e) => patchCourtDetails({ bNumber: e.target.value })}
                                placeholder="Enter B number"
                                className="w-full min-h-10 px-3 py-2 text-sm rounded-lg border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500"
                              />
                            </FieldGroup>
                          </div>
                        </div>

                        {officerOptions.length === 0 ? (
                          <p className="text-sm text-amber-900 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                            No officers on this visit record. Add officers on the crime scene first. You can still
                            save court details.
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
                                    <RemoveRowButton size="md" onClick={() => setCourtVisitDraft((d) => ({ rows: d.rows.filter((_, i) => i !== index) }))} aria-label={`Remove court visit row ${String(index + 1).padStart(2, '0')}`} />
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
                                            <ActionChipButton variant="red" className="!border-transparent !bg-transparent !px-0 !py-0 hover:!underline" onClick={() => patchCourtVisitRow(index, { attachmentFileName: '', attachmentDataUrl: '' })}>Remove file</ActionChipButton>
                                          </div>
                                        ) : null}
                                      </div>
                                    </FieldGroup>
                                  </div>
                                </div>
                              ))}
                            </div>
                            <AddRowButton variant="fuchsia" onClick={() => setCourtVisitDraft((d) => ({ rows: [...d.rows, emptyCourtVisitOfficerDetailRow()] }))}>Add court visit detail</AddRowButton>
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
                              disabled={
                                officerOptions.length === 0 &&
                                !(
                                  (courtDraft.courtName ?? '').trim() ||
                                  (courtDraft.courtCaseNo ?? '').trim() ||
                                  (courtDraft.bNumber ?? '').trim()
                                )
                              }
                            >
                              Save court visit
                            </Button>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </PageLayout>

      <ResultPopup {...popup} onClose={closePopup} />
    </>
  );
}
