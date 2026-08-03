import type { CrimeScene } from '@/types/crimeScene';
import CrimeSceneDetailView from './CrimeSceneDetailView';
import { formatDateTimeDDMMYYYY, parseDateTimeParts } from '@/lib/dateUtils';
import { registryWorkflowDisplayEntries } from '@/lib/registryWorkflowDisplay';

function getVisitDisplayTimestamp(scene: CrimeScene): string {
  return formatDateTimeDDMMYYYY(scene.createdAt || scene.updatedAt);
}

function visitPresentation(scene: CrimeScene) {
  switch (scene.visitType) {
    case 'REVISIT':
      return {
        typeLabel: 'Revisit',
        section: 'border-gray-200 bg-white shadow-sm',
        header: 'bg-gray-50/80 border-b border-gray-200',
        badge: 'bg-blue-600 text-white',
        pill: 'bg-blue-100 text-blue-700 border-blue-200',
      };
    case 'COURT_VISIT':
      return {
        typeLabel: 'Court visit',
        section: 'border-gray-200 bg-white shadow-sm',
        header: 'bg-gray-50/80 border-b border-gray-200',
        badge: 'bg-blue-600 text-white',
        pill: 'bg-violet-100 text-violet-700 border-violet-200',
      };
    default:
      return {
        typeLabel: 'New crime scene',
        section: 'border-gray-200 bg-white shadow-sm',
        header: 'bg-gray-50/80 border-b border-gray-200',
        badge: 'bg-blue-600 text-white',
        pill: 'bg-blue-100 text-blue-700 border-blue-200',
      };
  }
}

export default function CrimeSceneMultiDetailView({ scenes }: { scenes: CrimeScene[] }) {
  const ordered = [...scenes].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  return (
    <div className="space-y-10">
      {ordered.map((scene, idx) => {
        const p = visitPresentation(scene);
        const workflowEntries = registryWorkflowDisplayEntries(scene);
        return (
          <section
            key={scene.id}
            className={`rounded-xl border overflow-hidden ${p.section}`}
          >
            <div className={p.header}>
              <div className="px-4 sm:px-5 py-3 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 min-w-0">
                  <span
                    className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold tabular-nums shrink-0 ${p.badge}`}
                    title="Visit order for this CVR"
                  >
                    {idx + 1}
                  </span>
                  <h3 className="text-sm font-semibold text-gray-900 truncate">
                    Visit {idx + 1}
                  </h3>
                  {p.typeLabel ? (
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border shrink-0 ${p.pill}`}
                    >
                      {p.typeLabel}
                    </span>
                  ) : null}
                  {workflowEntries.map((entry) => (
                    <span
                      key={`${entry.kind}-${entry.at}`}
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border shrink-0 ${entry.pillClass}`}
                      title={entry.title}
                    >
                      {entry.label}
                    </span>
                  ))}
                </div>
                <span className="text-xs text-gray-500 font-mono tabular-nums shrink-0">
                  Submitted: {getVisitDisplayTimestamp(scene)}
                </span>
              </div>
            </div>
            <div className="p-5 sm:p-6">
              <CrimeSceneDetailView scene={scene} />
            </div>
          </section>
        );
      })}
    </div>
  );
}
