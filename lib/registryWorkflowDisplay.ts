import type { CrimeScene, RegistryWorkflowDisplayEntry, RegistryWorkflowUpdateKind } from '@/types/crimeScene';
import { formatDateTimeDDMMYYYY } from '@/lib/dateUtils';

function workflowEntryForKind(kind: RegistryWorkflowUpdateKind, at: string): RegistryWorkflowDisplayEntry {
  const when = formatDateTimeDDMMYYYY(at);
  switch (kind) {
    case 'court_production':
    case 'court_visit':
    case 'court_rewards':
      return {
        kind,
        at,
        label: 'Updated Court Details',
        title:
          kind === 'court_rewards'
            ? `Court rewards updated ${when} via Update Court Details`
            : kind === 'court_visit'
              ? `Court visit book updated ${when} via Update Court Details`
              : `Production sent to court updated ${when} via Update Court Details`,
        pillClass: 'bg-orange-100 text-orange-900 border-orange-400',
      };
    case 'production_analysis':
      return {
        kind,
        at,
        label: 'Updated Production Analysis',
        title: `Production sent to analysis updated ${when} via Update Production Analysis`,
        pillClass: 'bg-emerald-100 text-emerald-900 border-emerald-400',
      };
  }
}

export function registryWorkflowDisplayEntries(scene: CrimeScene): RegistryWorkflowDisplayEntry[] {
  const updates = scene.registryWorkflowUpdates?.length
    ? scene.registryWorkflowUpdates
    : scene.registryWorkflowUpdate
      ? [scene.registryWorkflowUpdate]
      : [];

  const deduped = updates.reduce<{ kind: RegistryWorkflowUpdateKind; at: string }[]>((acc, update) => {
    if (!update?.kind || !update?.at) return acc;
    const idx = acc.findIndex((item) => item.kind === update.kind);
    if (idx >= 0) {
      acc[idx] = update;
    } else {
      acc.push(update);
    }
    return acc;
  }, []);

  return deduped
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .map((update) => workflowEntryForKind(update.kind, update.at));
}

/** Back-compat helper for older single-badge callers. */
export function registryWorkflowFollowUpDisplay(scene: CrimeScene): RegistryWorkflowDisplayEntry | null {
  return registryWorkflowDisplayEntries(scene)[0] ?? null;
}

/** Row background and border classes for workflow updates. */
export function registryWorkflowListRowClasses(scene: CrimeScene): string | null {
  const d = registryWorkflowDisplayEntries(scene)[0];
  if (!d?.kind) return null;
  switch (d.kind) {
    case 'court_production':
    case 'court_visit':
    case 'court_rewards':
      return 'border-orange-200 bg-orange-50/80 ring-1 ring-orange-200/70 border-l-[5px] border-l-orange-500';
    case 'production_analysis':
      return 'border-emerald-200 bg-emerald-50/80 ring-1 ring-emerald-200/70 border-l-[5px] border-l-emerald-500';
    default:
      return null;
  }
}

/** Badge classes (number circle) for workflow updates. */
export function registryWorkflowBadgeClasses(scene: CrimeScene): string | null {
  const d = registryWorkflowDisplayEntries(scene)[0];
  if (!d?.kind) return null;
  switch (d.kind) {
    case 'court_production':
    case 'court_visit':
    case 'court_rewards':
      return 'bg-orange-200 text-orange-950 border-orange-400';
    case 'production_analysis':
      return 'bg-emerald-200 text-emerald-950 border-emerald-400';
    default:
      return null;
  }
}
