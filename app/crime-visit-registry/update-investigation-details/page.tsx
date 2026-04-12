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
import { sceneMayEditAmended } from '@/lib/cvrWorkflow';
import { ArrowLeft } from 'lucide-react';

function label(scene: CrimeScene) {
  const vt =
    scene.visitType === 'REVISIT' ? 'Revisit' : scene.visitType === 'COURT_VISIT' ? 'Court' : 'New';
  return `${scene.cvrNo} — ${vt} — ${formatDateTimeDDMMYYYY(scene.updatedAt)}`;
}

export default function UpdateInvestigationDetailsPage() {
  const [scenes, setScenes] = useState<CrimeScene[]>([]);
  const [id, setId] = useState('');

  useEffect(() => {
    setScenes(crimeSceneService.getAll());
  }, []);

  const options = useMemo(
    () =>
      [...scenes]
        .filter((s) => sceneMayEditAmended(s))
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .map((s) => ({ value: s.id, label: label(s) })),
    [scenes],
  );

  const selected = id ? crimeSceneService.getById(id) : undefined;
  const href =
    selected && sceneMayEditAmended(selected)
      ? `/crime-visit-registry/edit-crime-scene?id=${encodeURIComponent(id)}&focus=investigation`
      : '';

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-1 relative z-10 w-full pt-14">
        <main className="flex-1 overflow-x-hidden min-w-0 flex flex-col min-h-screen">
          <div className="w-full px-4 sm:px-6 lg:px-8 py-8 flex-1 max-w-xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <Link
                href="/crime-visit-registry"
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Back"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Update Investigation Details</h2>
                <p className="text-sm text-gray-600 mt-0.5">
                  Only CVRs with approved edit access are listed. The form opens scrolled to investigation officers.
                </p>
              </div>
            </div>

            {options.length === 0 ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
                No eligible CVRs. Use{' '}
                <Link href="/crime-visit-registry/cvr-update-request" className="font-semibold underline">
                  CVR Update Request
                </Link>{' '}
                first, then return here after approval.
              </div>
            ) : (
              <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-4 shadow-sm">
                <CustomSelect
                  value={id}
                  onChange={setId}
                  options={options}
                  placeholder="Select CVR / visit…"
                  searchable
                  searchPlaceholder="Search…"
                />
                {href ? (
                  <Button variant="primary" className="w-full" asChild>
                    <Link href={href}>Continue to form</Link>
                  </Button>
                ) : (
                  <Button variant="primary" className="w-full opacity-50" disabled>
                    Continue to form
                  </Button>
                )}
              </div>
            )}
          </div>
          <Footer />
        </main>
      </div>
    </div>
  );
}
