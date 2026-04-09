import type { CrimeScene } from '@/types/crimeScene';
import CrimeSceneDetailView from './CrimeSceneDetailView';
import { formatDateTimeDDMMYYYY } from '@/lib/dateUtils';

function visitHeading(scene: CrimeScene, index: number) {
  const typeLabel =
    scene.visitType === 'REVISIT'
      ? 'Revisit'
      : scene.visitType === 'COURT_VISIT'
        ? 'Court visit'
        : 'New crime scene';
  return `Visit ${index + 1} — ${typeLabel}`;
}

export default function CrimeSceneMultiDetailView({ scenes }: { scenes: CrimeScene[] }) {
  const ordered = [...scenes].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  return (
    <div className="space-y-8">
      {ordered.map((scene, idx) => (
        <section
          key={scene.id}
          className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden"
        >
          <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/90 flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-gray-800">{visitHeading(scene, idx)}</h3>
            <span className="text-xs text-gray-500">
              Submitted {formatDateTimeDDMMYYYY(scene.updatedAt)}
            </span>
          </div>
          <div className="p-5">
            <CrimeSceneDetailView scene={scene} />
          </div>
        </section>
      ))}
    </div>
  );
}
