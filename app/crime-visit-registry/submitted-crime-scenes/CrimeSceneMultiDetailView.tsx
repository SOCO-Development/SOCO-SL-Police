import type { CrimeScene } from '@/types/crimeScene';
import CrimeSceneDetailView from './CrimeSceneDetailView';
import { formatDateTimeDDMMYYYY } from '@/lib/dateUtils';
import { registryWorkflowDisplayEntries } from '@/lib/registryWorkflowDisplay';

function visitPresentation(scene: CrimeScene) {
  switch (scene.visitType) {
    case 'REVISIT':
      return {
        typeLabel: 'Revisit',
        section:
          'border-amber-300 bg-gradient-to-br from-amber-50/90 to-white shadow-md shadow-amber-900/5',
        header:
          'bg-amber-100/80 border-b border-amber-200',
        stripe: 'bg-amber-500',
        badge: 'bg-amber-200 text-amber-950 border border-amber-400/80',
        pill: 'bg-amber-100 text-amber-900 border-amber-300',
      };
    case 'COURT_VISIT':
      return {
        typeLabel: 'Court visit',
        section:
          'border-violet-300 bg-gradient-to-br from-violet-50/90 to-white shadow-md shadow-violet-900/5',
        header:
          'bg-violet-100/80 border-b border-violet-200',
        stripe: 'bg-violet-500',
        badge: 'bg-violet-200 text-violet-950 border border-violet-400/80',
        pill: 'bg-violet-100 text-violet-900 border-violet-300',
      };
    default:
      return {
        typeLabel: 'New crime scene',
        section:
          'border-blue-300 bg-gradient-to-br from-blue-50/90 to-white shadow-md shadow-blue-900/5',
        header:
          'bg-blue-100/80 border-b border-blue-200',
        stripe: 'bg-blue-500',
        badge: 'bg-blue-200 text-blue-950 border border-blue-400/80',
        pill: 'bg-blue-100 text-blue-900 border-blue-300',
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
            className={`relative rounded-2xl border-2 overflow-hidden ${p.section}`}
          >
            <div
              className={`absolute left-0 top-0 bottom-0 w-1.5 ${p.stripe}`}
              aria-hidden
            />
            <div className={`pl-3 sm:pl-4 ${p.header}`}>
              <div className="px-3 sm:px-4 py-3.5 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 min-w-0">
                  <span
                    className={`inline-flex h-8 min-w-[2rem] items-center justify-center rounded-lg text-xs font-bold tabular-nums shrink-0 ${p.badge}`}
                    title="Visit order for this CVR"
                  >
                    {idx + 1}
                  </span>
                  <h3 className="text-sm sm:text-base font-semibold text-gray-900 truncate">
                    Visit {idx + 1}
                  </h3>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border shrink-0 ${p.pill}`}
                  >
                    {p.typeLabel}
                  </span>
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
                <span className="text-xs text-gray-600 tabular-nums shrink-0">
                  Submitted {formatDateTimeDDMMYYYY(scene.updatedAt)}
                </span>
              </div>
            </div>
            <div className="p-5 sm:p-6 bg-white/40">
              <CrimeSceneDetailView scene={scene} />
            </div>
          </section>
        );
      })}
    </div>
  );
}
