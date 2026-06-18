import type { CrimeScene } from '@/types/crimeScene';

export interface CrimeSceneCvrGroup {
  /** Stable key for React / expand state (normalized CVR or fallback). */
  groupKey: string;
  displayCvr: string;
  primary: CrimeScene;
  /** Revisits, court visits, and any additional records for this CVR (not the primary row). */
  children: CrimeScene[];
}

export function normalizeCvrKey(scene: CrimeScene): string {
  const c = (scene.cvrNo ?? '').trim();
  return c || `__scene_${scene.id}`;
}

/** Earliest-created NEW_VISIT for the CVR, else earliest record overall. */
export function groupScenesByCvr(scenes: CrimeScene[]): CrimeSceneCvrGroup[] {
  const byKey = new Map<string, CrimeScene[]>();
  for (const s of scenes) {
    const key = normalizeCvrKey(s);
    if (!byKey.has(key)) byKey.set(key, []);
    byKey.get(key)!.push(s);
  }

  const groups: CrimeSceneCvrGroup[] = [];

  for (const [groupKey, list] of byKey) {
    const chron = [...list].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    const newVisits = chron.filter((s) => s.visitType === 'NEW_VISIT');
    const primary = newVisits[0] ?? chron[0];
    const children = chron
      .filter((s) => s.id !== primary.id)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    const displayCvr = (primary.cvrNo ?? '').trim() || '—';
    groups.push({ groupKey, displayCvr, primary, children });
  }

  return groups;
}

export function groupHasVisitType(group: CrimeSceneCvrGroup, type: CrimeScene['visitType']): boolean {
  return (
    group.primary.visitType === type || group.children.some((s) => s.visitType === type)
  );
}

/** All scenes in a group (primary first by createdAt, then children order). */
export function flattenGroupChronological(group: CrimeSceneCvrGroup): CrimeScene[] {
  return [group.primary, ...group.children].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
}
