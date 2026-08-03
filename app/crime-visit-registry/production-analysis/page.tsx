'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import CustomSelect from '@/components/forms/CustomSelect';
import Button from '@/components/buttons/Button';
import { crimeSceneService } from '@/lib/crimeSceneService';
import { crimeService, fileService, locationService } from '@/lib/api';
import { formatDateTimeDDMMYYYY, parseDateTimeParts } from '@/lib/dateUtils';
import type { CrimeScene } from '@/types/crimeScene';
import { PageHeader, PageLayout } from '@/components/ui';
import CourtProductionDetailsEditor from '@/app/crime-visit-registry/components/CourtProductionDetailsEditor';
import { validateSentToAnalysisSection } from '@/lib/courtDetailsValidation';
import { emptyCrimeSceneCourtDetails, type CrimeSceneCourtDetails } from '@/types/crimeScene';
import { showSuccessAlert, showErrorAlert } from '@/lib/alerts';

function visitTypeLabel(scene: CrimeScene) {
  return scene.visitType === 'REVISIT'
    ? 'Revisit'
    : scene.visitType === 'COURT_VISIT'
      ? 'Court visit'
      : 'New visit';
}

function productionStatusLabel(scene: CrimeScene) {
  return scene.courtDetails?.productionPR === 'Yes' ? 'Production available' : 'No production';
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

export default function ProductionAnalysisPage() {
  const router = useRouter();
  const [scenes, setScenes] = useState<CrimeScene[]>([]);
  const [selectedSceneId, setSelectedSceneId] = useState('');
  const [courtDetailsDraft, setCourtDetailsDraft] = useState<CrimeSceneCourtDetails>(() =>
    emptyCrimeSceneCourtDetails(),
  );
  const [courtDetailsError, setCourtDetailsError] = useState('');
  const [isEditingSentToAnalysis, setIsEditingSentToAnalysis] = useState(false);
  const [historyList, setHistoryList] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [scenesLoading, setScenesLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadScenes() {
      const localScenes = crimeSceneService.getAll();
      setScenes(localScenes);

      try {
        const locations = await locationService.getPrivilegedOrAllLocations();
        const results = await Promise.all(
          locations.map((loc) => crimeService.getVisitsByCvrLocationId(Number(loc.LOCATION_ID)).catch(() => [])),
        );
        const allBackendVisits = results.flat();

        const latestLocal = crimeSceneService.getAll();
        const mapped: CrimeScene[] = allBackendVisits.map((item: any, index) => {
          const localMatch = latestLocal.find(
            (s) =>
              (s.cvrId && String(s.cvrId) === String(item.CVR_ID)) ||
              (s.cvrNo && s.cvrNo === item.CVR_NO),
          );
          const visitKey = item.CVR_ID || item.VISIT_ID || item.INITIATE_CVR_ID || index;
          const reportedDt = parseDateTimeParts({ date: item.REPORTED_SOCO_DATE, time: item.REPORTED_SOCO_TIME });
          const createdTimestamp =
            item.CREATED_DTM ||
            localMatch?.createdAt ||
            (reportedDt ? reportedDt.toISOString() : null) ||
            localMatch?.updatedAt ||
            new Date().toISOString();

          return {
            id: `backend_visit_${visitKey}_${item.CVR_NO || index}`,
            cvrNo: item.CVR_NO,
            cvrId: Number(item.CVR_ID),
            visitId: item.VISIT_ID,
            visitType: item.VISIT_TYPE_ID === '1' ? ('NEW_VISIT' as const) : ('REVISIT' as const),
            policeStation: localMatch?.policeStation || '',
            reportedToPoliceStation: { date: item.REPORTED_SOCO_DATE, time: item.REPORTED_SOCO_TIME },
            reportedToSocoLab: { date: item.REPORTED_SOCO_DATE, time: item.REPORTED_SOCO_TIME },
            sceneInTime: item.SCENE_IN,
            sceneOutTime: item.SCENE_OUT,
            division: localMatch?.division || '',
            offence: localMatch?.offence || [],
            offenceType: item.OFFENCE_TYPE,
            placeOfCrimeScene: item.PLACE_DETAIL,
            createdAt: createdTimestamp,
            updatedAt: localMatch?.updatedAt || createdTimestamp,
            inChargeOfficer: localMatch?.inChargeOfficer || { name: '' },
            socoOfficers: localMatch?.socoOfficers || [],
            specialistTeams: localMatch?.specialistTeams || [],
            courtDetails: localMatch?.courtDetails || { sentToAnalysisRows: [], productionSentToCourtRows: [] },
            courtVisitUpdate: localMatch?.courtVisitUpdate,
            registryWorkflowUpdates: localMatch?.registryWorkflowUpdates,
            registryWorkflowUpdate: localMatch?.registryWorkflowUpdate,
            approval_status:
              item.approval_status || item.APPROVAL_STATUS || localMatch?.approval_status || 'In Progress',
          } as CrimeScene;
        });

        const backendIds = new Set(
          mapped
            .map((s) => String(s.cvrId ?? ''))
            .filter((id) => id !== '' && id !== 'undefined' && id !== '0' && id !== 'NaN'),
        );
        const backendCvrNos = new Set(mapped.map((s) => (s.cvrNo ?? '').trim().toLowerCase()).filter(Boolean));

        const uniqueLocal = latestLocal.filter((s) => {
          const localCvrId = String(s.cvrId ?? '').trim();
          const localCvrNo = (s.cvrNo ?? '').trim().toLowerCase();
          if (localCvrId && localCvrId !== '0' && localCvrId !== 'undefined' && backendIds.has(localCvrId)) {
            return false;
          }
          if (localCvrNo && backendCvrNos.has(localCvrNo)) return false;
          return true;
        });

        const seenSceneIds = new Set<string>();
        const combinedScenes: CrimeScene[] = [];
        for (const sc of [...mapped, ...uniqueLocal]) {
          if (seenSceneIds.has(sc.id)) continue;
          seenSceneIds.add(sc.id);
          combinedScenes.push(sc);
        }

        if (!cancelled) setScenes(combinedScenes);
      } catch (err) {
        console.error('Failed to load crime scenes from backend', err);
      } finally {
        if (!cancelled) setScenesLoading(false);
      }
    }

    loadScenes();
    return () => {
      cancelled = true;
    };
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

  useEffect(() => {
    if (!selectedSceneId) {
      setCourtDetailsDraft(emptyCrimeSceneCourtDetails());
      setIsEditingSentToAnalysis(false);
      setHistoryList([]);
      return;
    }
    const scene = scenes.find((s) => s.id === selectedSceneId);
    if (!scene) return;
    setCourtDetailsDraft(mergeCourtDetails(scene.courtDetails));
    setCourtDetailsError('');
    setIsEditingSentToAnalysis(false);
    setHistoryList([]);

    if (scene.cvrId) {
      crimeService.getProductionAnalysisByCvrId(Number(scene.cvrId))
        .then((backendRows) => {
          if (backendRows && backendRows.length > 0) {
            const mappedRows = backendRows.map((item) => {
              let resultReceived: 'Positive' | 'Negative' | '' = '';
              if (item.RESULT_RECIEVED_STATUS === 'True') {
                resultReceived = item.RESULT_STATUS === 'True' ? 'Positive' : 'Negative';
              }
              return {
                productionRef: item.PRODUCTION_ID,
                productionSentAnalysisId: Number(item.PRODUCTION_SENT_ANALYSIS_ID),
                sentToAnalysis: (item.SENT_STATUS === 'True' ? 'Yes' : 'No') as 'Yes' | 'No' | '',
                institution: item.INSTITUTION_NAME || '',
                institutionOtherDetail: '',
                date: item.SENT_DATE || '',
                refNo: item.REFERENCE_NO || '',
                resultReceived,
                attachmentFileName: item.RESULT_ATTACHEMENT_URL || '',
              };
            });
            setCourtDetailsDraft((prev) => ({
              ...prev,
              sentToAnalysisRows: mappedRows,
            }));
          }
        })
        .catch((err) => {
          console.error('Failed to load production analysis from backend', err);
        });

      // Fetch history log
      setHistoryLoading(true);
      crimeService.getProductionAnalysisHistoryByCvrId(Number(scene.cvrId))
        .then((data) => {
          if (data) setHistoryList(data);
        })
        .catch((err) => {
          console.error('Failed to load CVR production analysis history', err);
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
        document.getElementById('production-analysis-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }

  async function handleSaveCourtDetails() {
    if (!selectedSceneId || !selectedScene) {
      setCourtDetailsError('Select a crime scene first.');
      return;
    }
    const v = validateSentToAnalysisSection(courtDetailsDraft);
    if (v) {
      setCourtDetailsError(v);
      showErrorAlert('Validation Error', v);
      return;
    }

    const numericCvrId = Number(selectedScene.cvrId) || 11;
    const rows = (courtDetailsDraft.sentToAnalysisRows ?? []).filter(
      (row) => row.productionRef?.trim() && row.sentToAnalysis === 'Yes'
    );

    try {
      await Promise.all(
        rows.map(async (row) => {
          let attachmentUrl = row.attachmentFileName || 'string';

          if (row.attachmentFile) {
            const prodSentAnalysisId = row.productionSentAnalysisId || Number(row.productionRef) || 1;
            attachmentUrl = await fileService.uploadProductionAnalysisReport(row.attachmentFile, prodSentAnalysisId);
            
            row.attachmentFileName = attachmentUrl;
            row.attachmentDataUrl = '';
            row.attachmentFile = undefined;
          }

          return crimeService.updateProductionSentAnalysis({
            productionSentAnalysisId: row.productionSentAnalysisId || Number(row.productionRef) || 1,
            cvrId: numericCvrId,
            referenceNo: row.refNo || '',
            resultReceivedStatus: row.resultReceived === 'Positive' || row.resultReceived === 'Negative',
            resultStatus: row.resultReceived === 'Positive',
            resultAttachmentUrl: attachmentUrl,
          });
        })
      );
    } catch (err) {
      console.error('Failed to update production analysis in backend', err);
      const msg = err instanceof Error ? err.message : 'Backend API update failed.';
      setCourtDetailsError(msg);
      showErrorAlert('API Update Failed', msg);
      return;
    }

    const updated = crimeSceneService.updateCourtDetailsProduction(
      selectedSceneId,
      courtDetailsDraft,
      'production_analysis',
    );
    if (!updated) {
      const msg = 'Could not save. The visit record may have been removed.';
      setCourtDetailsError(msg);
      showErrorAlert('Save Failed', msg);
      return;
    }
    setScenes(crimeSceneService.getAll());
    setCourtDetailsDraft(mergeCourtDetails(updated.courtDetails));
    setCourtDetailsError('');
    setIsEditingSentToAnalysis(false);
    showSuccessAlert('Analysis Details Saved', 'Productions sent to analysis institutes have been saved successfully.');
    setTimeout(() => router.push('/crime-visit-registry'), 2500);
  }

  function handleCancelEdit() {
    if (!selectedSceneId) return;
    const scene = scenes.find((s) => s.id === selectedSceneId);
    if (!scene) return;
    setCourtDetailsDraft(mergeCourtDetails(scene.courtDetails));
    setCourtDetailsError('');
    setIsEditingSentToAnalysis(false);
  }

  return (
    <>
      <PageLayout>
        <PageHeader
          backHref="/crime-visit-registry"
          title="Update Production Analysis"
          //description="Choose a crime scene below, then click Edit to change Productions sent to analysis institutes and save. Saving applies to every visit record for the same CVR."
        />
        {/* <p className="text-sm text-gray-600 mb-6 -mt-2">
          Saved data appears under{' '}
          <Link
            href="/crime-visit-registry/submitted-crime-scenes"
            className="text-blue-600 font-medium hover:underline"
          >
            Submitted crime scenes
          </Link>
          .
        </p> */}

            {scenesLoading ? (
              <div className="flex items-center justify-center py-10">
                <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full" />
              </div>
            ) : scenes.length === 0 ? (
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
                  <p className="text-xs text-sky-900/75 -mt-1">
                    Pick a CVR number, then review the visit type and location before editing.
                  </p>
                  <FieldGroup label="Select crime scene">
                    <CustomSelect
                      value={selectedSceneId}
                      onChange={(id) => selectScene(id)}
                      options={[
                        { value: '', label: '— Select a crime scene —' },
                        ...sceneSelectOptions,
                      ]}
                      placeholder="Choose a visit to load the editor below"
                      searchable
                      searchPlaceholder="Search CVR, place, type, date…"
                    />
                  </FieldGroup>
                </div>

                <div
                  id="production-analysis-form"
                  className="mt-8 bg-white rounded-xl border border-gray-200 flex flex-col scroll-mt-24"
                  style={{ minHeight: selectedScene ? undefined : 'auto' }}
                >
                  <div className="flex-1 overflow-y-auto px-6 py-5">
                    <div className="animate-fade-in space-y-5">
                      <h3 className="text-base font-semibold text-gray-700 uppercase tracking-widest pb-2 border-b border-gray-200">
                        Update production analysis
                      </h3>

                      {!selectedScene ? (
                        <p className="text-sm text-gray-500 py-4">
                          Choose a crime scene in the <strong>Select crime scene</strong> dropdown above, then use{' '}
                          <strong>Edit</strong> to change sent-to-analysis production rows.
                        </p>
                      ) : (
                        <div className="p-4 sm:p-5 rounded-xl border border-amber-200 bg-amber-50/70 space-y-4">
                          <div className="flex flex-wrap items-start justify-between gap-3 pb-2 border-b border-amber-200/80">
                            <div className="min-w-0 flex-1 space-y-2">
                              <p className="text-sm text-gray-800">
                                <span className="font-semibold text-gray-900">CVR: </span>
                                <span className="font-mono">{(selectedScene.cvrNo ?? '').trim() || '—'}</span>
                                <span className="text-gray-500 mx-2">·</span>
                                <span className="text-gray-700">{visitTypeLabel(selectedScene)}</span>
                              </p>
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                                  Production status
                                </span>
                                <span
                                  className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                                    selectedScene.courtDetails?.productionPR === 'Yes'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'bg-red-100 text-red-800'
                                  }`}
                                >
                                  {productionStatusLabel(selectedScene)}
                                </span>
                              </div>
                              <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-2 min-w-0">
                                <span className="w-1.5 h-4 rounded-full bg-amber-500 inline-block flex-shrink-0" />
                                <span className="min-w-0">
                                  Production details — Productions sent to analysis institutes
                                </span>
                              </h4>
                            </div>
                            <div className="flex shrink-0 items-center gap-2 self-start">
                              {isEditingSentToAnalysis ? (
                                <Button
                                  variant="secondary"
                                  type="button"
                                  onClick={handleCancelEdit}
                                  className="!min-h-[40px] !px-3 !py-2 !text-sm"
                                >
                                  Cancel
                                </Button>
                              ) : (
                                <Button
                                  variant="primary"
                                  type="button"
                                  onClick={() => {
                                    setIsEditingSentToAnalysis(true);
                                    setCourtDetailsError('');
                                  }}
                                  className="!min-h-[40px] !px-3 !py-2 !text-sm"
                                >
                                  Edit
                                </Button>
                              )}
                            </div>
                          </div>
                          <p className="text-xs text-gray-600">
                            {isEditingSentToAnalysis ? (
                              <>
                                Only <strong>Productions sent to analysis institutes</strong> is editable here. Other
                                production fields are set in <strong>Update Court Details</strong> or{' '}
                                <strong>Create crime scene</strong>. If rows are disabled, set Production Availability and
                                types there first.
                              </>
                            ) : (
                              <>
                                Other production fields are set in <strong>Update Court Details</strong> or{' '}
                                <strong>Create crime scene</strong>.
                              </>
                            )}
                          </p>
                          <CourtProductionDetailsEditor
                            mode="sentToAnalysis"
                            courtDetails={courtDetailsDraft}
                            onChange={setCourtDetailsDraft}
                            readOnly={!isEditingSentToAnalysis}
                          />
                          {isEditingSentToAnalysis ? (
                            <>
                              {courtDetailsError ? <p className="text-sm text-red-600">{courtDetailsError}</p> : null}
                              <div className="flex justify-center">
                                <Button variant="success" type="button" onClick={handleSaveCourtDetails}>
                                  Save sent to analysis (production details)
                                </Button>
                              </div>
                            </>
                          ) : null}
                          {!isEditingSentToAnalysis && courtDetailsError ? (
                            <p className="text-sm text-red-600">{courtDetailsError}</p>
                          ) : null}

                          {/* Production Analysis History Section */}
                          <div className="mt-8 pt-6 border-t border-gray-200 space-y-4">
                            <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-2">
                              <span className="w-1.5 h-4 rounded-full bg-blue-600 inline-block flex-shrink-0" />
                              Production Analysis History Log
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
                                      <th className="px-4 py-2 text-left font-bold text-gray-500 uppercase tracking-wider">Analysis Row ID</th>
                                      <th className="px-4 py-2 text-left font-bold text-gray-500 uppercase tracking-wider">Updated By</th>
                                      <th className="px-4 py-2 text-left font-bold text-gray-500 uppercase tracking-wider">Date & Time</th>
                                    </tr>
                                  </thead>
                                  <tbody className="bg-white divide-y divide-gray-200">
                                    {historyList.map((hist, idx) => (
                                      <tr key={idx} className="hover:bg-gray-50">
                                        <td className="px-4 py-2 font-mono font-bold text-blue-700">{hist.ANALYSIS_HISTORY_ID}</td>
                                        <td className="px-4 py-2 font-mono">{hist.PRODUCTION_SENT_ANALYSIS_ID}</td>
                                        <td className="px-4 py-2 text-gray-700">{hist.CREATED_BY_NAME || hist.CREATED_BY || '—'}</td>
                                        <td className="px-4 py-2 text-gray-500 tabular-nums">{hist.CREATED_DTM}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            ) : (
                              <p className="text-xs text-gray-400">No production analysis history log entries found.</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
      </PageLayout>
          </>
  );
}
