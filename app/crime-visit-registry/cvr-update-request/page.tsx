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
import {
  sceneHasRevisionPending,
  sceneMayEditAmended,
  sceneMayRequestUpdate,
} from '@/lib/cvrWorkflow';
import { ArrowLeft, ExternalLink, CheckCircle, Clock, AlertCircle } from 'lucide-react';

function visitLabel(scene: CrimeScene): string {
  const vt =
    scene.visitType === 'REVISIT'
      ? 'Revisit'
      : scene.visitType === 'COURT_VISIT'
        ? 'Court'
        : 'New';
  return `${scene.cvrNo || scene.id} — ${vt} — ${formatDateTimeDDMMYYYY(scene.updatedAt)}`;
}

export default function CvrUpdateRequestPage() {
  const [scenes, setScenes] = useState<CrimeScene[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    setScenes(crimeSceneService.getAll());
  }, []);

  const options = useMemo(
    () =>
      [...scenes]
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .map((s) => ({ value: s.id, label: visitLabel(s) })),
    [scenes],
  );

  const selected = selectedId ? scenes.find((s) => s.id === selectedId) : undefined;

  const permitted = useMemo(
    () => scenes.filter((s) => sceneMayEditAmended(s)),
    [scenes],
  );

  const revisionWaiting = useMemo(
    () => scenes.filter((s) => sceneHasRevisionPending(s)),
    [scenes],
  );

  function refresh() {
    setScenes(crimeSceneService.getAll());
  }

  function requestUpdate() {
    setMsg(null);
    if (!selectedId) {
      setMsg({ type: 'err', text: 'Select a CVR / visit first.' });
      return;
    }
    const s = crimeSceneService.getById(selectedId);
    if (!s) {
      setMsg({ type: 'err', text: 'Record not found.' });
      return;
    }
    if (!sceneMayRequestUpdate(s)) {
      setMsg({
        type: 'err',
        text: 'Cannot request now (already pending request or a revision is awaiting approval).',
      });
      return;
    }
    const next = crimeSceneService.requestAmendmentPermission(selectedId);
    if (!next) {
      setMsg({ type: 'err', text: 'Request failed.' });
      return;
    }
    setMsg({ type: 'ok', text: 'Update request submitted. It will appear under Pending CVR Approvals for the approver.' });
    refresh();
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-1 relative z-10 w-full pt-14">
        <main className="flex-1 overflow-x-hidden min-w-0 flex flex-col min-h-screen">
          <div className="w-full px-4 sm:px-6 lg:px-8 py-8 flex-1 max-w-3xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <Link
                href="/crime-visit-registry"
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Back"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">CVR Update Request</h2>
                <p className="text-sm text-gray-600 mt-0.5">
                  Ask permission to change a submitted CVR. After approval, open the record, edit, and submit for
                  re-approval.
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-4 shadow-sm">
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Select visit (CVR)
              </label>
              <CustomSelect
                value={selectedId}
                onChange={setSelectedId}
                options={options}
                placeholder={options.length ? 'Choose CVR / visit…' : 'No crime scenes yet'}
                searchable
                searchPlaceholder="Search…"
              />
              {selected ? (
                <div className="text-xs text-gray-600 space-y-1">
                  <p>
                    Request status:{' '}
                    <span className="font-semibold">
                      {selected.cvrAmendment?.requestStatus === 'pending'
                        ? 'Pending permission'
                        : selected.cvrAmendment?.requestStatus === 'approved'
                          ? 'Approved to edit'
                          : selected.cvrAmendment?.requestStatus === 'rejected'
                            ? 'Rejected'
                            : 'None'}
                    </span>
                  </p>
                  {sceneHasRevisionPending(selected) ? (
                    <p className="text-amber-800 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> Revision waiting for approver.
                    </p>
                  ) : null}
                </div>
              ) : null}

              <Button variant="primary" type="button" onClick={requestUpdate} disabled={!selectedId}>
                Request update permission
              </Button>

              {msg ? (
                <div
                  className={`flex items-start gap-2 text-sm rounded-lg px-3 py-2 ${
                    msg.type === 'ok' ? 'bg-green-50 text-green-900 border border-green-200' : 'bg-red-50 text-red-900 border border-red-200'
                  }`}
                >
                  {msg.type === 'ok' ? (
                    <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  )}
                  {msg.text}
                </div>
              ) : null}
            </div>

            {revisionWaiting.length > 0 ? (
              <div className="mt-8 rounded-xl border border-amber-200 bg-amber-50/80 p-5">
                <h3 className="text-sm font-semibold text-amber-950 mb-2 flex items-center gap-2">
                  <Clock className="w-4 h-4" /> Awaiting approval (your revisions)
                </h3>
                <ul className="space-y-2">
                  {revisionWaiting.map((s) => (
                    <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                      <span className="font-mono text-amber-950">{s.cvrNo}</span>
                      <Link
                        href={`/crime-visit-registry/submitted-crime-scenes?cvrNo=${encodeURIComponent(s.cvrNo)}`}
                        className="text-amber-900 font-medium hover:underline inline-flex items-center gap-1"
                      >
                        View CVR <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="mt-8">
              <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" /> Approved to edit — open and amend
              </h3>
              {permitted.length === 0 ? (
                <p className="text-sm text-gray-500">No CVRs with edit permission yet.</p>
              ) : (
                <ul className="divide-y divide-gray-200 rounded-xl border border-gray-200 bg-white">
                  {permitted.map((s) => (
                    <li
                      key={s.id}
                      className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm"
                    >
                      <div>
                        <div className="font-mono font-semibold text-blue-800">{s.cvrNo}</div>
                        <div className="text-xs text-gray-500">{visitLabel(s)}</div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={`/crime-visit-registry/submitted-crime-scenes?cvrNo=${encodeURIComponent(s.cvrNo)}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 bg-gray-50 text-gray-800 text-xs font-semibold hover:bg-gray-100"
                        >
                          View all details <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                        <Link
                          href={`/crime-visit-registry/edit-crime-scene?id=${encodeURIComponent(s.id)}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-blue-200 bg-blue-50 text-blue-800 text-xs font-semibold hover:bg-blue-100"
                        >
                          Edit &amp; submit for approval
                        </Link>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          <Footer />
        </main>
      </div>
    </div>
  );
}
