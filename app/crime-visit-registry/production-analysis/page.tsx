'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CustomSelect from '@/components/forms/CustomSelect';
import DatePicker from '@/components/forms/DatePicker';
import Button from '@/components/buttons/Button';
import { crimeSceneService } from '@/lib/crimeSceneService';
import { formatDateTimeDDMMYYYY } from '@/lib/dateUtils';
import type { AnalysisReportReceived, CrimeScene } from '@/types/crimeScene';
import { emptyAnalysisReportReceived } from '@/types/crimeScene';
import { registryBackLinkClass } from '@/app/crime-visit-registry/uiStyles';
import {
  ANALYSIS_REPORT_ANNEX_OPTIONS,
  ANALYSIS_REPORT_RESULT_OPTIONS,
  analysisResultIsOther,
} from '@/lib/analysisReportReceivedOptions';
import { ArrowLeft } from 'lucide-react';

function sceneSelectLabel(s: CrimeScene) {
  const vt =
    s.visitType === 'REVISIT' ? 'Revisit' : s.visitType === 'COURT_VISIT' ? 'Court visit' : 'New visit';
  return `${(s.cvrNo ?? '').trim() || '—'} — ${vt} — updated ${formatDateTimeDDMMYYYY(s.updatedAt)}`;
}

function mergeReport(base: AnalysisReportReceived | undefined): AnalysisReportReceived {
  return { ...emptyAnalysisReportReceived(), ...base };
}

export default function ProductionAnalysisPage() {
  const [scenes, setScenes] = useState<CrimeScene[]>([]);
  const [selectedSceneId, setSelectedSceneId] = useState('');
  const [form, setForm] = useState<AnalysisReportReceived>(() => emptyAnalysisReportReceived());
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [savedOk, setSavedOk] = useState(false);

  useEffect(() => {
    setScenes(crimeSceneService.getAll());
  }, []);

  const sceneOptions = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = [...scenes].sort((a, b) => {
      const c = (a.cvrNo ?? '').localeCompare(b.cvrNo ?? '', undefined, { numeric: true });
      if (c !== 0) return c;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
    return list
      .filter((s) => (q ? sceneSelectLabel(s).toLowerCase().includes(q) : true))
      .map((s) => ({ value: s.id, label: sceneSelectLabel(s) }));
  }, [scenes, search]);

  const selectedScene = useMemo(
    () => (selectedSceneId ? scenes.find((s) => s.id === selectedSceneId) : undefined),
    [scenes, selectedSceneId],
  );

  useEffect(() => {
    if (!selectedSceneId) {
      setForm(emptyAnalysisReportReceived());
      return;
    }
    const scene = scenes.find((s) => s.id === selectedSceneId);
    setForm(mergeReport(scene?.analysisReportReceived));
    setError('');
    setSavedOk(false);
  }, [selectedSceneId, scenes]);

  function validate(): string {
    if (!selectedSceneId) return 'Select a CVR / visit from the list.';
    if (!form.annexRef?.trim()) return 'Select analysis reports received (annex).';
    if (!form.date?.trim()) return 'Enter the date.';
    if (!form.resultReceived) return 'Select result received.';
    if (analysisResultIsOther(form.resultReceived) && !form.resultOtherDetail?.trim()) {
      return 'Describe the result when “Other” is selected.';
    }
    return '';
  }

  function handleSave() {
    const v = validate();
    if (v) {
      setError(v);
      setSavedOk(false);
      return;
    }
    const payload: AnalysisReportReceived = {
      annexRef: form.annexRef.trim(),
      date: form.date.trim(),
      resultReceived: form.resultReceived as AnalysisReportReceived['resultReceived'],
      resultOtherDetail: analysisResultIsOther(form.resultReceived)
        ? form.resultOtherDetail?.trim()
        : '',
    };
    const updated = crimeSceneService.updateAnalysisReportReceived(selectedSceneId, payload);
    if (!updated) {
      setError('Could not save. The visit record may have been removed.');
      setSavedOk(false);
      return;
    }
    setScenes(crimeSceneService.getAll());
    setError('');
    setSavedOk(true);
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-1 relative z-10 w-full pt-14">
        <main className="flex-1 overflow-x-hidden min-w-0 flex flex-col min-h-screen">
          <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1">
            <div className="flex items-center gap-3 mb-6">
              <Link href="/crime-visit-registry" className={registryBackLinkClass} aria-label="Back">
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </Link>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Production analysis</h2>
            <p className="text-sm text-gray-500 mt-1 mb-6">
              Select the CVR visit, then record or update analysis reports received. Saved data appears under{' '}
              <Link
                href="/crime-visit-registry/submitted-crime-scenes"
                className="text-blue-600 font-medium hover:underline"
              >
                Submitted crime scenes
              </Link>
              .
            </p>

            {scenes.length === 0 ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
                No crime scenes yet. Create one from{' '}
                <Link href="/crime-visit-registry/create-scene" className="font-semibold underline">
                  Create crime scene
                </Link>
                .
              </div>
            ) : (
              <>
                <div className="mb-4">
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                    Filter list
                  </label>
                  <input
                    type="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by CVR, visit type, or date…"
                    className="w-full min-h-10 px-3 py-2 text-sm rounded-lg border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                  />
                </div>

                <div className="mb-6">
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                    CVR / visit
                  </label>
                  <CustomSelect
                    value={selectedSceneId}
                    onChange={(id) => setSelectedSceneId(id)}
                    options={sceneOptions}
                    placeholder="Select CVR and visit…"
                    searchable
                    searchPlaceholder="Search…"
                  />
                </div>

                {selectedScene ? (
                  <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-5 sm:p-6 space-y-5">
                    <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-slate-200 pb-3">
                      <h3 className="text-sm font-semibold text-gray-800">Analysis reports received</h3>
                      <span className="text-xs text-gray-500 font-mono tabular-nums">
                        CVR {(selectedScene.cvrNo ?? '').trim() || '—'}
                      </span>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                        Analysis reports received
                      </label>
                      <CustomSelect
                        value={form.annexRef}
                        onChange={(v) => setForm((f) => ({ ...f, annexRef: v }))}
                        options={ANALYSIS_REPORT_ANNEX_OPTIONS}
                        placeholder="Select annex…"
                        searchable
                        searchPlaceholder="Search annex…"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                        Date (DD/MM/YY)
                      </label>
                      <DatePicker value={form.date} onChange={(v) => setForm((f) => ({ ...f, date: v }))} />
                    </div>

                    <div>
                      <span className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                        Result received
                      </span>
                      <div className="flex flex-wrap gap-3 rounded-lg border border-gray-200 bg-white px-3 py-3">
                        {ANALYSIS_REPORT_RESULT_OPTIONS.map((opt) => (
                          <label key={opt} className="inline-flex items-center gap-2 text-sm text-gray-800">
                            <input
                              type="radio"
                              name="production-analysis-result"
                              checked={form.resultReceived === opt}
                              onChange={() =>
                                setForm((f) => ({
                                  ...f,
                                  resultReceived: opt,
                                  ...(!analysisResultIsOther(opt) ? { resultOtherDetail: '' } : {}),
                                }))
                              }
                              className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                            />
                            {opt}
                          </label>
                        ))}
                      </div>
                    </div>

                    {analysisResultIsOther(form.resultReceived) ? (
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                          Other — specify
                        </label>
                        <textarea
                          value={form.resultOtherDetail ?? ''}
                          onChange={(e) => setForm((f) => ({ ...f, resultOtherDetail: e.target.value }))}
                          rows={3}
                          placeholder="යතුරු ලියනය කළ හැකි පරිදි සකස් කරන්න"
                          className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-noto-sinhala placeholder:text-gray-400"
                        />
                      </div>
                    ) : null}

                    {error ? <p className="text-sm text-red-600">{error}</p> : null}
                    {savedOk ? (
                      <p className="text-sm text-green-700 font-medium">
                        Saved. Open the scene in Submitted crime scenes to view the section.
                      </p>
                    ) : null}

                    <div className="pt-2">
                      <Button variant="success" type="button" onClick={handleSave}>
                        Save analysis details
                      </Button>
                    </div>
                  </div>
                ) : null}
              </>
            )}
          </div>
          <Footer />
        </main>
      </div>
    </div>
  );
}
