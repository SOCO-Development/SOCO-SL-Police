'use client';
import { PageHeader, PageLayout } from '@/components/ui';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import CustomSelect from '@/components/forms/CustomSelect';
import Button from '@/components/buttons/Button';
import CourtRewardsEditor from '@/app/crime-visit-registry/components/CourtRewardsEditor';
import { crimeSceneService } from '@/lib/crimeSceneService';
import { sanitizeCourtRewardsUpdate } from '@/lib/courtRewardUtils';
import { formatDateTimeDDMMYYYY } from '@/lib/dateUtils';
import type { CrimeScene, CrimeSceneCourtDetails, CourtRewardsUpdateDetails } from '@/types/crimeScene';
import {
  emptyCrimeSceneCourtDetails,
  emptyCourtRewardsUpdate,
  normalizeCourtRewardsUpdate,
} from '@/types/crimeScene';
import ResultPopup, { useResultPopup } from '@/components/modals/ResultPopup';

function visitTypeLabel(scene: CrimeScene) {
  return scene.visitType === 'REVISIT'
    ? 'Revisit'
    : scene.visitType === 'COURT_VISIT'
      ? 'Court visit'
      : 'New visit';
}

function mergeCourtRewards(base: CourtRewardsUpdateDetails | undefined): CourtRewardsUpdateDetails {
  return sanitizeCourtRewardsUpdate(normalizeCourtRewardsUpdate(base));
}

function FieldGroup({ label, children, className = '' }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">{label}</label>
      {children}
    </div>
  );
}

export default function RewardsPage() {
  const router = useRouter();
  const [scenes, setScenes] = useState<CrimeScene[]>([]);
  const [selectedSceneId, setSelectedSceneId] = useState('');
  const [rewardsDraft, setRewardsDraft] = useState<CourtRewardsUpdateDetails>(() => emptyCourtRewardsUpdate());
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

  useEffect(() => {
    if (!selectedSceneId) {
      setRewardsDraft(emptyCourtRewardsUpdate());
      return;
    }
    const scene = scenes.find((s) => s.id === selectedSceneId);
    if (!scene) return;
    setRewardsDraft(mergeCourtRewards(scene.courtRewardsUpdate));
    setError('');
    setSavedOk(false);
  }, [selectedSceneId, scenes]);

  function selectScene(id: string) {
    setSelectedSceneId(id);
    if (id) {
      setTimeout(() => {
        document.getElementById('rewards-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }

  function handleCancelRewards() {
    if (!selectedSceneId) return;
    const scene = scenes.find((s) => s.id === selectedSceneId);
    if (!scene) return;
    setRewardsDraft(mergeCourtRewards(scene.courtRewardsUpdate));
    setError('');
    setSavedOk(false);
  }

  function handleSaveRewards() {
    if (!selectedSceneId) {
      showPopup('error', 'No Scene Selected', 'Select a crime scene first.');
      return;
    }
    if (rewardsDraft.rewardsEnabled !== 'Yes' && rewardsDraft.rewardsEnabled !== 'No') {
      showPopup('error', 'Validation Error', 'Select Yes or No for rewards.');
      return;
    }
    const updated = crimeSceneService.updateCourtRewardsDetails(selectedSceneId, rewardsDraft);
    if (!updated) {
      const msg = 'Could not save. The visit record may have been removed.';
      setError(msg);
      setSavedOk(false);
      showPopup('error', 'Save Failed', msg);
      return;
    }
    setScenes(crimeSceneService.getAll());
    setRewardsDraft(mergeCourtRewards(updated.courtRewardsUpdate));
    setError('');
    setSavedOk(true);
    showPopup('success', 'Rewards Saved', 'Court rewards have been saved successfully.');
    setTimeout(() => router.push('/crime-visit-registry'), 2500);
  }

  return (
    <>
      <PageLayout>
        <PageHeader
          backHref="/crime-visit-registry"
          title="Court Rewards"
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
              id="rewards-form"
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
                      id="court-update-rewards"
                      className="p-4 sm:p-5 rounded-xl border border-teal-200 bg-teal-50/65 space-y-4"
                    >
                      <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide pb-2 border-b border-teal-200/80 flex items-center gap-2">
                        <span className="w-1.5 h-4 rounded-full bg-teal-600 inline-block flex-shrink-0" />
                        Court rewards
                      </h4>
                      <p className="text-xs text-gray-600">
                        Record reward types granted by court for Police, D/CRD, and Division categories.
                      </p>

                      <CourtRewardsEditor
                        value={rewardsDraft}
                        onChange={setRewardsDraft}
                      />

                      <div className="mt-2 pt-4 border-t border-teal-200/80 space-y-3">
                        {error ? <p className="text-sm text-red-600">{error}</p> : null}
                        {savedOk ? (
                          <p className="text-sm text-green-700 font-medium">
                            Court rewards saved. View them on the submitted crime scene.
                          </p>
                        ) : null}
                        <div className="flex flex-wrap items-center justify-center gap-3">
                          <Button
                            variant="secondary"
                            type="button"
                            onClick={handleCancelRewards}
                          >
                            Cancel
                          </Button>
                          <Button
                            variant="success"
                            type="button"
                            onClick={handleSaveRewards}
                          >
                            Save rewards
                          </Button>
                        </div>
                      </div>
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
