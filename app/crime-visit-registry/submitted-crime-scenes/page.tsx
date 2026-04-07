'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { crimeSceneService } from '@/lib/crimeSceneService';
import { formatDateTimeDDMMYYYY } from '@/lib/dateUtils';
import type { CrimeScene } from '@/types/crimeScene';
import { ArrowLeft, CheckCircle, ChevronDown, ChevronRight, MapPin, RefreshCw } from 'lucide-react';

interface GroupedScene {
  cvrNo: string;
  original: CrimeScene | null;
  revisits: CrimeScene[];
}

function groupScenes(scenes: CrimeScene[]): GroupedScene[] {
  const map = new Map<string, GroupedScene>();

  scenes.forEach((scene) => {
    if (scene.visitType === 'NEW_VISIT') {
      if (!map.has(scene.cvrNo)) {
        map.set(scene.cvrNo, { cvrNo: scene.cvrNo, original: scene, revisits: [] });
      } else {
        map.get(scene.cvrNo)!.original = scene;
      }
    }
  });

  scenes.forEach((scene) => {
    if (scene.visitType === 'REVISIT') {
      if (!map.has(scene.cvrNo)) {
        map.set(scene.cvrNo, { cvrNo: scene.cvrNo, original: null, revisits: [scene] });
      } else {
        map.get(scene.cvrNo)!.revisits.push(scene);
      }
    }
  });

  return Array.from(map.values()).sort((a, b) => {
    const aTime = a.original?.updatedAt ?? a.revisits[0]?.updatedAt ?? '';
    const bTime = b.original?.updatedAt ?? b.revisits[0]?.updatedAt ?? '';
    return new Date(bTime).getTime() - new Date(aTime).getTime();
  });
}

// ── Table Header ──────────────────────────────────────────────────────────────

function TableHeader() {
  return (
    <div className="grid grid-cols-[2fr,2fr,2fr,3fr,1.5fr,1fr] gap-4 px-4 py-2 bg-gray-100 text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200 rounded-t-xl">
      <span>CVR No / Type</span>
      <span>Police Station</span>
      <span>Division</span>
      <span>Crime Scene</span>
      <span>Submitted</span>
      <span>Visit Type</span>
    </div>
  );
}

// ── Scene Row ─────────────────────────────────────────────────────────────────

function SceneRow({ scene, isRevisit = false }: { scene: CrimeScene; isRevisit?: boolean }) {
  const offenceDisplay: string = Array.isArray(scene.offence)
    ? scene.offence.length > 0 ? scene.offence.join(', ') : '—'
    : (scene.offence as string) || '—';

  return (
    <div
      className={`px-4 py-4 border-b border-gray-100 last:border-b-0 transition-colors ${
        isRevisit ? 'bg-amber-50/50 hover:bg-amber-50' : 'bg-white hover:bg-gray-50'
      }`}
    >
      {/* Row title */}
      <div className="flex items-center gap-2 mb-3">
        {isRevisit ? (
          <RefreshCw className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
        ) : (
          <MapPin className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
        )}
        <span className={`font-mono text-xs font-bold ${isRevisit ? 'text-amber-700' : 'text-blue-700'}`}>
          {scene.cvrNo || '—'}
        </span>
        <span
          className={`ml-auto inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
            isRevisit
              ? 'bg-amber-100 text-amber-700 border border-amber-200'
              : 'bg-blue-100 text-blue-700 border border-blue-200'
          }`}
        >
          {isRevisit ? 'Revisit' : 'New Visit'}
        </span>
      </div>

      {/* Vertical fields */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Police Station</p>
          <p className="text-sm text-gray-800">{scene.policeStation || '—'}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Division</p>
          <p className="text-sm text-gray-700">{scene.division || '—'}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Crime Scene</p>
          <p className="text-sm text-gray-800">{scene.placeOfCrimeScene || '—'}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Submitted</p>
          <p className="text-sm text-gray-600">{formatDateTimeDDMMYYYY(scene.updatedAt)}</p>
        </div>
        <div className="col-span-2 md:col-span-4">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Offence</p>
          <p className="text-sm text-gray-700 leading-relaxed">{offenceDisplay}</p>
        </div>
      </div>
    </div>
  );
}
// ── Grouped Card ──────────────────────────────────────────────────────────────

function GroupedSceneCard({ group }: { group: GroupedScene }) {
  const [expanded, setExpanded] = useState(false);
  const hasRevisits = group.revisits.length > 0;

  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden shadow-sm">
      {/* CVR group header */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-lg">
            {group.cvrNo || '—'}
          </span>
          {hasRevisits && (
            <span className="text-xs text-gray-500">
              {group.revisits.length} revisit{group.revisits.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {hasRevisits && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border transition-colors
              text-amber-700 bg-amber-50 border-amber-200 hover:bg-amber-100"
          >
            {expanded ? (
              <><ChevronDown className="w-3.5 h-3.5" /> Hide Revisits</>
            ) : (
              <><ChevronRight className="w-3.5 h-3.5" /> Show Revisits</>
            )}
          </button>
        )}
      </div>

      {/* Column headers */}
      {/* <div className="grid grid-cols-[2fr,2fr,2fr,3fr,1.5fr,1fr] gap-4 px-4 py-2 bg-gray-100/70 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-200">
        <span>CVR No</span>
        <span>Police Station</span>
        <span>Division</span>
        <span>Crime Scene / Offence</span>
        <span>Submitted</span>
        <span>Type</span>
      </div> */}

      {/* Original visit row */}
      {group.original
        ? <SceneRow scene={group.original} />
        : (
          <div className="px-4 py-3 text-sm text-gray-400 italic bg-white border-b border-gray-100">
            No original visit record.
          </div>
        )
      }

      {/* Revisit rows */}
      {hasRevisits && expanded && (
        <div className="border-t border-dashed border-amber-200">
          {group.revisits
            .sort((a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime())
            .map((revisit) => (
              <SceneRow key={revisit.id} scene={revisit} isRevisit />
            ))}
        </div>
      )}

      {/* Collapsed revisit hint */}
      {hasRevisits && !expanded && (
        <div
          className="px-4 py-2 bg-amber-50/40 border-t border-dashed border-amber-100 cursor-pointer hover:bg-amber-50 transition-colors"
          onClick={() => setExpanded(true)}
        >
          <span className="text-xs text-amber-600 font-medium flex items-center gap-1.5">
            <ChevronRight className="w-3.5 h-3.5" />
            {group.revisits.length} revisit{group.revisits.length !== 1 ? 's' : ''} — click to expand
          </span>
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SubmittedCrimeScenesPage() {
  const [scenes, setScenes] = useState<CrimeScene[]>([]);

  useEffect(() => {
    setScenes(crimeSceneService.getAll());
  }, []);

  const grouped = useMemo(() => groupScenes(scenes), [scenes]);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-white to-gray-50">
      <Header />
      <div className="flex flex-1 relative z-10 w-full pt-14">
        <main className="flex-1 overflow-x-hidden min-w-0 flex flex-col min-h-screen">
          <div className="w-full px-4 sm:px-6 lg:px-8 py-8 flex-1">

            {/* Page header */}
            <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
              <div className="flex items-center gap-3">
                <Link
                  href="/crime-visit-registry"
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  aria-label="Back"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Submitted Crime Scenes</h2>
                  <p className="text-sm text-gray-500 mt-0.5">
                    Grouped by CVR number — expand rows to view revisits.
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
                <CheckCircle className="w-3.5 h-3.5" />
                {scenes.length} submitted
              </span>
            </div>

            {/* Table */}
            {grouped.length === 0 ? (
              <div className="text-center py-16 text-gray-400 text-sm">
                No submitted crime scenes found.
              </div>
            ) : (
              <div className="space-y-4">
                {grouped.map((group) => (
                  <GroupedSceneCard key={group.cvrNo} group={group} />
                ))}
              </div>
            )}

          </div>
          <Footer />
        </main>
      </div>
    </div>
  );
}