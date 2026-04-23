'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CustomSelect from '@/components/forms/CustomSelect';
import Button from '@/components/buttons/Button';
import { crimeSceneService } from '@/lib/crimeSceneService';
import { formatDateTimeDDMMYYYY } from '@/lib/dateUtils';
import type { CrimeScene } from '@/types/crimeScene';
import { registryBackLinkClass } from '@/app/crime-visit-registry/uiStyles';
import { ArrowLeft } from 'lucide-react';
import CourtProductionDetailsEditor from '@/app/crime-visit-registry/components/CourtProductionDetailsEditor';
import { validateSentToAnalysisSection } from '@/lib/courtDetailsValidation';
import { emptyCrimeSceneCourtDetails, type CrimeSceneCourtDetails } from '@/types/crimeScene';

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

export default function ProductionAnalysisPage() {
  const [scenes, setScenes] = useState<CrimeScene[]>([]);
  const [selectedSceneId, setSelectedSceneId] = useState('');
  const [courtDetailsDraft, setCourtDetailsDraft] = useState<CrimeSceneCourtDetails>(() =>
    emptyCrimeSceneCourtDetails(),
  );
  const [courtDetailsError, setCourtDetailsError] = useState('');
  const [courtDetailsSavedOk, setCourtDetailsSavedOk] = useState(false);
  const [isEditingSentToAnalysis, setIsEditingSentToAnalysis] = useState(false);

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

  useEffect(() => {
    if (!selectedSceneId) {
      setCourtDetailsDraft(emptyCrimeSceneCourtDetails());
      setIsEditingSentToAnalysis(false);
      return;
    }
    const scene = scenes.find((s) => s.id === selectedSceneId);
    if (!scene) return;
    setCourtDetailsDraft(mergeCourtDetails(scene.courtDetails));
    setCourtDetailsError('');
    setCourtDetailsSavedOk(false);
    setIsEditingSentToAnalysis(false);
  }, [selectedSceneId, scenes]);

  function selectScene(id: string) {
    setSelectedSceneId(id);
    if (id) {
      setTimeout(() => {
        document.getElementById('production-analysis-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }

  function handleSaveCourtDetails() {
    if (!selectedSceneId) {
      setCourtDetailsError('Select a crime scene first.');
      setCourtDetailsSavedOk(false);
      return;
    }
    const v = validateSentToAnalysisSection(courtDetailsDraft);
    if (v) {
      setCourtDetailsError(v);
      setCourtDetailsSavedOk(false);
      return;
    }
    const updated = crimeSceneService.updateCourtDetailsProduction(
      selectedSceneId,
      courtDetailsDraft,
      'production_analysis',
    );
    if (!updated) {
      setCourtDetailsError('Could not save. The visit record may have been removed.');
      setCourtDetailsSavedOk(false);
      return;
    }
    setScenes(crimeSceneService.getAll());
    setCourtDetailsDraft(mergeCourtDetails(updated.courtDetails));
    setCourtDetailsError('');
    setCourtDetailsSavedOk(true);
    setIsEditingSentToAnalysis(false);
  }

  function handleCancelEdit() {
    if (!selectedSceneId) return;
    const scene = scenes.find((s) => s.id === selectedSceneId);
    if (!scene) return;
    setCourtDetailsDraft(mergeCourtDetails(scene.courtDetails));
    setCourtDetailsError('');
    setCourtDetailsSavedOk(false);
    setIsEditingSentToAnalysis(false);
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
                <h2 className="text-2xl font-bold text-gray-900">Update Production Analysis</h2>
                <p className="text-sm text-gray-600 mt-0.5">
                  Choose a crime scene below, then click <strong>Edit</strong> to change{' '}
                  <strong>Productions sent to analysis institutes</strong> and save. Saving applies to{' '}
                  <strong>every visit record for the same CVR</strong>. Saved data appears under{' '}
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
                                    setCourtDetailsSavedOk(false);
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
                              {courtDetailsSavedOk ? (
                                <p className="text-sm text-green-700 font-medium">
                                  Production details (sent to analysis) saved.
                                </p>
                              ) : null}
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
                          {!isEditingSentToAnalysis && courtDetailsSavedOk ? (
                            <p className="text-sm text-green-700 font-medium">
                              Production details (sent to analysis) saved.
                            </p>
                          ) : null}
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
