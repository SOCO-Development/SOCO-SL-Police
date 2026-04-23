import type { CrimeScene } from '@/types/crimeScene';
import { formatDateTimeDDMMYYYY } from '@/lib/dateUtils';

/** Teal/cyan/emerald “Revisit” badge next to visit type when court/production workflow pages saved shared CVR data. */
export function registryWorkflowFollowUpDisplay(scene: CrimeScene): {
  label: string;
  title: string;
  pillClass: string;
} | null {
  const u = scene.registryWorkflowUpdate;
  if (!u?.kind) return null;
  const when = formatDateTimeDDMMYYYY(u.at);
  switch (u.kind) {
    case 'court_production':
      return {
        label: 'Revisit',
        title: `Court/production (sent to court) updated ${when} via Update Court Details`,
        pillClass: 'bg-teal-100 text-teal-900 border-teal-400',
      };
    case 'court_visit':
      return {
        label: 'Revisit',
        title: `Court visit book updated ${when} via Update Court Details`,
        pillClass: 'bg-cyan-100 text-cyan-950 border-cyan-400',
      };
    case 'production_analysis':
      return {
        label: 'Revisit',
        title: `Production (sent to analysis) updated ${when} via Production Analysis`,
        pillClass: 'bg-emerald-100 text-emerald-950 border-emerald-400',
      };
    default:
      return null;
  }
}
