'use client';
import { PageHeader, PageLayout } from '@/components/ui';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import CustomSelect from '@/components/forms/CustomSelect';
import Button from '@/components/buttons/Button';
import CourtProductionDetailsEditor from '@/app/crime-visit-registry/components/CourtProductionDetailsEditor';
import { crimeSceneService } from '@/lib/crimeSceneService';
import { crimeService } from '@/lib/api';
import { formatDateTimeDDMMYYYY } from '@/lib/dateUtils';
import { validateProductionSentToCourtSection } from '@/lib/courtDetailsValidation';
import type { CrimeScene, CrimeSceneCourtDetails } from '@/types/crimeScene';
import { emptyCrimeSceneCourtDetails } from '@/types/crimeScene';
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

function FieldGroup({ label, children, className = '' }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">{label}</label>
      {children}
    </div>
  );
}

export default function UpdateCourtDetailsPage() {
  const router = useRouter();
  const [scenes, setScenes] = useState<CrimeScene[]>([]);
  const [selectedSceneId, setSelectedSceneId] = useState('');
  const [courtDraft, setCourtDraft] = useState<CrimeSceneCourtDetails>(() => emptyCrimeSceneCourtDetails());
  const [error, setError] = useState('');
  const [savedOk, setSavedOk] = useState(false);
  const [isEditingProductionSentToCourt, setIsEditingProductionSentToCourt] = useState(false);
  const [historyList, setHistoryList] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
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

  function patchCourtDetails(partial: Partial<CrimeSceneCourtDetails>) {
    setCourtDraft((prev) => ({
      ...emptyCrimeSceneCourtDetails(),
      ...prev,
      ...partial,
    }));
  }

  useEffect(() => {
    if (!selectedSceneId) {
      setCourtDraft(emptyCrimeSceneCourtDetails());
      setIsEditingProductionSentToCourt(false);
      setHistoryList([]);
      return;
    }
    const scene = scenes.find((s) => s.id === selectedSceneId);
    if (!scene) return;
    setCourtDraft(mergeCourtDetails(scene.courtDetails));
    setError('');
    setSavedOk(false);
    setIsEditingProductionSentToCourt(false);
    setHistoryList([]);

    if (scene.cvrId) {
      crimeService.getProductionSentCourtByCvrId(Number(scene.cvrId))
        .then((backendRows) => {
          if (backendRows && backendRows.length > 0) {
            const mappedRows = backendRows.map((item) => ({
              productionRef: item.PRODUCTION_ID,
              productionSentCourtId: Number(item.PRODUCTION_SENT_COURT_ID),
              sentToCourt: (item.SENT_STATUS === 'True' ? 'Yes' : 'No') as 'Yes' | 'No' | '',
              courtName: item.COURT_NAME || '',
              date: item.SENT_DATE || '',
              courtCaseNo: item.CASE_NO || '',
              divurumaFileName: item.AFFIDAVIT_ATTACHEMENT_URL || '',
              prashnavalyaFileName: item.QUESTIONAIRE_ATTACHEMENT_URL || '',
            }));
            setCourtDraft((prev) => ({
              ...prev,
              productionSentToCourtRows: mappedRows,
            }));
          }
        })
        .catch((err) => {
          console.error('Failed to load production sent court from backend', err);
        });

      // Fetch history log
      setHistoryLoading(true);
      crimeService.getProductionCourtHistoryByCvrId(Number(scene.cvrId))
        .then((data) => {
          if (data) setHistoryList(data);
        })
        .catch((err) => {
          console.error('Failed to load CVR production court history', err);
        })
        .finally(() => {
          setHistoryLoading(false);
        });
    }
  }, [selectedSceneId, scenes]);

  function selectScene(id: string) {
    setSelectedSceneId(id);
    if (id) {
      setTimeout(() => {
        document.getElementById('court-update-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }

  const toApiDate = (dateStr: string): string => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    if (parts[0].length === 4) return dateStr;
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  };

  async function handleSaveProduction() {
    if (!selectedSceneId || !selectedScene) {
      setError('Select a crime scene first.');
      setSavedOk(false);
      showPopup('error', 'No Scene Selected', 'Select a crime scene first.');
      return;
    }
    const v = validateProductionSentToCourtSection(courtDraft);
    if (v) {
      setError(v);
      setSavedOk(false);
      showPopup('error', 'Validation Error', v);
      return;
    }

    const numericCvrId = Number(selectedScene.cvrId);
    if (!numericCvrId || isNaN(numericCvrId)) {
      setError('The selected crime scene does not have a valid CVR ID. Please ensure it has been submitted and synchronized first.');
      setSavedOk(false);
      showPopup('error', 'Invalid CVR ID', 'The selected crime scene does not have a valid CVR ID. Please ensure it has been submitted and synchronized first.');
      return;
    }
    const rows = (courtDraft.productionSentToCourtRows ?? []).filter(
      (row) => row.productionRef?.trim() && row.sentToCourt === 'Yes'
    );

    const productionsSentCourt = rows.map((row) => ({
      productionId: Number(row.productionRef) || 1,
      sentStatus: true,
      courtName: row.courtName || 'Colombo',
      sentDate: toApiDate(row.date || ''),
      caseNo: row.courtCaseNo || '',
      affidavitAttachmentUrl: row.divurumaFileName || 'string',
      questionaireAttachmentUrl: row.prashnavalyaFileName || 'string',
    }));

    try {
      await crimeService.addProductionSentCourt({
        cvrId: numericCvrId,
        productionsSentCourt,
      });
    } catch (err) {
      console.error('Failed to save productions to court in backend', err);
      const msg = err instanceof Error ? err.message : 'Backend API update failed.';
      setError(msg);
      setSavedOk(false);
      showPopup('error', 'API Save Failed', msg);
      return;
    }

    const updated = crimeSceneService.updateCourtDetailsProduction(selectedSceneId, courtDraft);
    if (!updated) {
      const msg = 'Could not save. The visit record may have been removed.';
      setError(msg);
      setSavedOk(false);
      showPopup('error', 'Save Failed', msg);
      return;
    }
    setScenes(crimeSceneService.getAll());
    setCourtDraft(mergeCourtDetails(updated.courtDetails));
    setError('');
    setSavedOk(true);
    setIsEditingProductionSentToCourt(false);
    showPopup('success', 'Production Details Saved', 'Production sent to court details have been saved successfully.');
    setTimeout(() => router.push('/crime-visit-registry'), 2500);
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

  return (
    <>
      <PageLayout>
        <PageHeader
          backHref="/crime-visit-registry"
          title="Update Court Details"
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
                      Choose a crime scene in the <strong>Select crime scene</strong> dropdown above.
                    </p>
                  ) : (
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
                      <FieldGroup label="B number">
                        <input
                          type="text"
                          value={courtDraft.bNumber ?? ''}
                          onChange={(e) => patchCourtDetails({ bNumber: e.target.value })}
                          readOnly={!isEditingProductionSentToCourt}
                          placeholder="Enter B number"
                          className={`w-full min-h-10 px-3 py-2 text-sm rounded-lg border text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 ${
                            isEditingProductionSentToCourt
                              ? 'bg-white border-gray-300'
                              : 'bg-gray-100 border-gray-200 cursor-default'
                          }`}
                        />
                      </FieldGroup>
                      <CourtProductionDetailsEditor
                        mode="productionSentToCourt"
                        courtDetails={courtDraft}
                        onChange={setCourtDraft}
                        readOnly={!isEditingProductionSentToCourt}
                      />
                      {isEditingProductionSentToCourt ? (
                        <>
                          <div className="flex justify-center">
                            <Button variant="success" type="button" onClick={handleSaveProduction}>
                              Save production sent to court (court details)
                              {savedOk && ' - Saved!'}
                            </Button>
                          </div>

                          {/* Production Court History Section */}
                          <div className="mt-8 pt-6 border-t border-gray-200 space-y-4">
                            <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-2">
                              <span className="w-1.5 h-4 rounded-full bg-blue-600 inline-block flex-shrink-0" />
                              Production Court History Log
                            </h4>
                            {historyLoading ? (
                              <div className="flex items-center justify-center p-4">
                                <div className="animate-spin w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full" />
                              </div>
                            ) : historyList.length > 0 ? (
                              <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
                                <table className="min-w-full divide-y divide-gray-200 text-xs">
                                  <thead className="bg-gray-50">
                                    <tr>
                                      <th className="px-4 py-2 text-left font-bold text-gray-500 uppercase tracking-wider">History ID</th>
                                      <th className="px-4 py-2 text-left font-bold text-gray-500 uppercase tracking-wider">Sent Court ID</th>
                                      <th className="px-4 py-2 text-left font-bold text-gray-500 uppercase tracking-wider">Updated By</th>
                                      <th className="px-4 py-2 text-left font-bold text-gray-500 uppercase tracking-wider">Date & Time</th>
                                    </tr>
                                  </thead>
                                  <tbody className="bg-white divide-y divide-gray-200">
                                    {historyList.map((hist, idx) => (
                                      <tr key={idx} className="hover:bg-gray-50">
                                        <td className="px-4 py-2 font-mono font-bold text-blue-700">{hist.COURT_HISTORY_ID}</td>
                                        <td className="px-4 py-2 font-mono">{hist.PRODUCTION_SENT_COURT_ID}</td>
                                        <td className="px-4 py-2 text-gray-700">{hist.CREATED_BY_NAME || hist.CREATED_BY || '—'}</td>
                                        <td className="px-4 py-2 text-gray-500 tabular-nums">{hist.CREATED_DTM}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            ) : (
                              <p className="text-xs text-gray-400">No production court history log entries found.</p>
                            )}
                          </div>
                        </>
                      ) : null}
                      {!isEditingProductionSentToCourt && error ? (
                        <p className="text-sm text-red-600">{error}</p>
                      ) : null}
                    </div>
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
