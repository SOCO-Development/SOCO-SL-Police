'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Button from '@/components/buttons/Button';
import { crimeSceneService } from '@/lib/crimeSceneService';
import { formatDateTimeDDMMYYYY } from '@/lib/dateUtils';
import type { CrimeScene } from '@/types/crimeScene';
import CrimeSceneRevisionDiff from '@/components/cvr/CrimeSceneRevisionDiff';
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react';

export default function PendingCvrApprovalsPage() {
  const [requests, setRequests] = useState<CrimeScene[]>([]);
  const [revisions, setRevisions] = useState<CrimeScene[]>([]);

  function reload() {
    setRequests(crimeSceneService.getPendingAmendmentRequests());
    setRevisions(crimeSceneService.getPendingRevisionApprovals());
  }

  useEffect(() => {
    reload();
  }, []);

  function baselineScene(row: CrimeScene): CrimeScene | null {
    const raw = row.cvrAmendment?.baselineJson;
    if (!raw) return null;
    try {
      return JSON.parse(raw) as CrimeScene;
    } catch {
      return null;
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-1 relative z-10 w-full pt-14">
        <main className="flex-1 overflow-x-hidden min-w-0 flex flex-col min-h-screen">
          <div className="w-full px-4 sm:px-6 lg:px-8 py-8 flex-1 max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <Link
                href="/crime-visit-registry"
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Back"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Pending CVR Approvals</h2>
                <p className="text-sm text-gray-600 mt-0.5">
                  Approve or reject update requests first; then review amended records. New values appear in green in
                  the comparison.
                </p>
              </div>
            </div>

            <section className="mb-10">
              <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wide mb-3">
                Permission to edit (pending)
              </h3>
              {requests.length === 0 ? (
                <p className="text-sm text-gray-500 py-4 border border-dashed border-gray-200 rounded-xl px-4">
                  No pending update requests.
                </p>
              ) : (
                <ul className="space-y-4">
                  {requests.map((row) => (
                    <li key={row.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="font-mono font-semibold text-blue-800">{row.cvrNo}</p>
                          <p className="text-xs text-gray-500">Submitted {formatDateTimeDDMMYYYY(row.updatedAt)}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="success"
                            type="button"
                            className="text-xs"
                            onClick={() => {
                              crimeSceneService.approveAmendmentRequest(row.id);
                              reload();
                            }}
                          >
                            <CheckCircle className="w-3.5 h-3.5 inline mr-1" />
                            Approve edit access
                          </Button>
                          <Button
                            variant="secondary"
                            type="button"
                            className="text-xs border-red-200 text-red-700 hover:bg-red-50"
                            onClick={() => {
                              crimeSceneService.rejectAmendmentRequest(row.id);
                              reload();
                            }}
                          >
                            <XCircle className="w-3.5 h-3.5 inline mr-1" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section>
              <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wide mb-3">
                Revised CVR (pending approval)
              </h3>
              {revisions.length === 0 ? (
                <p className="text-sm text-gray-500 py-4 border border-dashed border-gray-200 rounded-xl px-4">
                  No amended records waiting for approval.
                </p>
              ) : (
                <ul className="space-y-8">
                  {revisions.map((row) => {
                    const before = baselineScene(row);
                    return (
                      <li key={row.id} className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
                        <div className="px-4 py-3 border-b border-gray-100 flex flex-wrap items-center justify-between gap-2 bg-slate-50">
                          <div>
                            <p className="font-mono font-semibold text-gray-900">{row.cvrNo}</p>
                            <p className="text-xs text-gray-500">Compare previous vs proposed below</p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="success"
                              type="button"
                              className="text-xs"
                              onClick={() => {
                                crimeSceneService.approveRevision(row.id);
                                reload();
                              }}
                            >
                              Approve changes
                            </Button>
                            <Button
                              variant="secondary"
                              type="button"
                              className="text-xs border-red-200 text-red-700 hover:bg-red-50"
                              onClick={() => {
                                crimeSceneService.rejectRevision(row.id);
                                reload();
                              }}
                            >
                              Reject &amp; restore
                            </Button>
                          </div>
                        </div>
                        <div className="p-4">
                          {before ? (
                            <CrimeSceneRevisionDiff before={before} after={row} />
                          ) : (
                            <p className="text-sm text-amber-800">Baseline snapshot missing — cannot diff.</p>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </div>
          <Footer />
        </main>
      </div>
    </div>
  );
}
