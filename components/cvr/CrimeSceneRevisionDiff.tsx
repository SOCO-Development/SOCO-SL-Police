'use client';

import type { CrimeScene } from '@/types/crimeScene';
import { diffCrimeScenes } from '@/lib/cvrRevisionDiff';

interface CrimeSceneRevisionDiffProps {
  before: CrimeScene;
  after: CrimeScene;
}

export default function CrimeSceneRevisionDiff({ before, after }: CrimeSceneRevisionDiffProps) {
  const rows = diffCrimeScenes(before, after);
  if (rows.length === 0) {
    return <p className="text-sm text-gray-500 py-2">No field-level differences detected.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-300">
      <table className="data-grid-table data-grid-table--compact w-full text-sm">
        <thead>
          <tr>
            <th>Field</th>
            <th>Previous</th>
            <th>Proposed</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.path} className="align-top">
              <td className="font-mono text-[11px] text-gray-600 whitespace-nowrap max-w-[200px] truncate">
                {row.path}
              </td>
              <td className="text-gray-700 break-all max-w-md">{row.before || '—'}</td>
              <td className="bg-emerald-50 text-emerald-950 font-medium break-all max-w-md">
                {row.after || '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-xs text-gray-500 px-3 py-2 bg-gray-50 border-t border-gray-100">
        Proposed values are highlighted in green for quick review.
      </p>
    </div>
  );
}
