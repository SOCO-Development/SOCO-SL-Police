import { useEffect, useState } from 'react';
import type { CrimeVisit, DateTimeEntry } from '@/types/crimeVisit';
import { crimeService } from '@/lib/api';
import type { CrimeSceneByVisitItemApi } from '@/lib/api/types';

interface CrimeVisitDetailViewProps {
  visit: CrimeVisit;
}

function readValue(value?: string) {
  return value?.trim() ? value : '—';
}

function formatDateTime(entry?: DateTimeEntry) {
  return {
    date: readValue(entry?.date),
    time: readValue(entry?.time),
    page: readValue(entry?.page),
    para: readValue(entry?.para),
  };
}

function DisplayField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2.5">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">{label}</div>
      <div className="mt-1 text-sm text-gray-900">
        {value}
      </div>
    </div>
  );
}

function DateTimeSummary({ label, entry }: { label: string; entry?: DateTimeEntry }) {
  const value = formatDateTime(entry);
  return (
    <div className="space-y-2 min-w-0">
      <div className="text-sm font-semibold text-gray-800 uppercase tracking-wide">{label}</div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <DisplayField label="Date (DD-MM-YYYY)" value={value.date} />
        <DisplayField label="Time" value={value.time} />
        <DisplayField label="Page" value={value.page} />
        <DisplayField label="Para" value={value.para} />
      </div>
    </div>
  );
}

export default function CrimeVisitDetailView({ visit }: CrimeVisitDetailViewProps) {
  const { sectionA, sectionB, sectionC } = visit;

  const offenceList = Array.isArray(sectionA?.offence)
    ? sectionA.offence
    : sectionA?.offence
      ? [sectionA.offence as string]
      : [];

  const [cvrList, setCvrList] = useState<CrimeSceneByVisitItemApi[]>([]);
  const [cvrLoading, setCvrLoading] = useState(false);

  useEffect(() => {
    if (!visit.id) return;
    setCvrLoading(true);
    crimeService.getCrimeScenesByVisitId(Number(visit.id))
      .then((data) => {
        if (data) setCvrList(data);
      })
      .catch((err) => {
        console.error('Failed to load associated CVRs', err);
      })
      .finally(() => {
        setCvrLoading(false);
      });
  }, [visit.id]);

  return (
    <div className="space-y-5">
      <div className="p-5 rounded-xl border border-gray-200 bg-gray-50/70">
        <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide pb-2 mb-3 flex items-center gap-2">
          <span className="w-1.5 h-4 rounded-full bg-violet-500 inline-block flex-shrink-0" />
          Request Details
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <DisplayField label="SOCO Lab" value={readValue(sectionA?.requestDivision)} />
          <DisplayField label="Police station" value={readValue(sectionA?.requestFromStation)} />
          <DisplayField
            label="Offence Type"
            value={
              sectionA?.offenceType === 'Other'
                ? readValue(sectionA?.offenceTypeOther)
                : readValue(sectionA?.offenceType)
            }
          />
          <div className="md:col-span-2 lg:col-span-3 rounded-lg border border-gray-200 bg-white px-3 py-2.5">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              Offences
            </div>
            {offenceList.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {offenceList.map((offence, idx) => (
                  <span
                    key={`${offence}-${idx}`}
                    className="inline-flex items-center rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-800"
                  >
                    {offence}
                  </span>
                ))}
              </div>
            ) : (
              <div className="mt-1 text-sm text-gray-500">—</div>
            )}
          </div>
        </div>
      </div>

      <div className="p-5 rounded-xl border border-gray-200 bg-gray-50/70">
        <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide pb-2 mb-3 flex items-center gap-2">
          <span className="w-1.5 h-4 rounded-full bg-blue-500 inline-block flex-shrink-0" />
          Reported to SOCO Lab
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <DisplayField label="Date" value={readValue(sectionA?.reportedToSocoLab?.date)} />
          <DisplayField label="Time" value={readValue(sectionA?.reportedToSocoLab?.time)} />
        </div>
      </div>

      <div className="p-5 rounded-xl border border-gray-200 bg-gray-50/70 space-y-4">
        <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide pb-2 border-b border-gray-200 flex items-center gap-2">
          <span className="w-1.5 h-4 rounded-full bg-indigo-500 inline-block flex-shrink-0" />
          OUT & IN Details
        </h4>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 lg:items-start">
          <DateTimeSummary label="OUT" entry={sectionA?.out} />
          <div className="min-w-0 border-t border-dashed border-gray-300 pt-6 mt-2 lg:border-t-0 lg:pt-0 lg:mt-0 relative">
            <span className="lg:hidden absolute left-0 -top-2.5 text-[10px] text-gray-400 font-bold uppercase tracking-widest bg-gray-50/70 pr-2">
              Return Details
            </span>
            <DateTimeSummary label="IN" entry={sectionA?.in} />
          </div>
        </div>
      </div>

      {sectionB?.socoOfficers?.inCharge &&
      (sectionB.socoOfficers.inCharge.name?.trim() ||
        sectionB.socoOfficers.inCharge.regNo?.trim() ||
        sectionB.socoOfficers.inCharge.rank?.trim()) ? (
        <div className="p-5 rounded-xl border border-gray-200 bg-gray-50/70">
          <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide pb-2 mb-3 flex items-center gap-2">
            <span className="w-1.5 h-4 rounded-full bg-green-500 inline-block flex-shrink-0" />
            In-Charge Officer
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <DisplayField label="Name" value={readValue(sectionB.socoOfficers.inCharge.name)} />
            <DisplayField label="Reg. Number" value={readValue(sectionB.socoOfficers.inCharge.regNo)} />
            <DisplayField label="Rank" value={readValue(sectionB.socoOfficers.inCharge.rank)} />
          </div>
        </div>
      ) : null}

      {(sectionB?.experts ?? []).some(
        (e) => e.name?.trim() || e.inTime?.trim() || e.outTime?.trim() || e.annex?.trim(),
      ) ? (
        <div className="p-5 rounded-xl border border-gray-200 bg-gray-50/70">
          <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide pb-2 mb-3 flex items-center gap-2">
            <span className="w-1.5 h-4 rounded-full bg-fuchsia-500 inline-block flex-shrink-0" />
            Experts
          </h4>
          <div className="space-y-3">
            {(sectionB?.experts ?? [])
              .filter(
                (e) => e.name?.trim() || e.inTime?.trim() || e.outTime?.trim() || e.annex?.trim(),
              )
              .map((expert, idx) => (
                <div
                  key={`expert-${idx}-${expert.name}`}
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 rounded-lg border border-gray-100 bg-white px-3 py-2"
                >
                  <DisplayField label="Annex" value={readValue(expert.annex)} />
                  <DisplayField label="Name" value={readValue(expert.name)} />
                  <DisplayField label="In time" value={readValue(expert.inTime)} />
                  <DisplayField label="Out time" value={readValue(expert.outTime)} />
                </div>
              ))}
          </div>
        </div>
      ) : null}

      <div className="p-5 rounded-xl border border-gray-200 bg-gray-50/70">
        <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide pb-2 mb-3 flex items-center gap-2">
          <span className="w-1.5 h-4 rounded-full bg-slate-500 inline-block flex-shrink-0" />
          Vehicle & Driver Details
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <DisplayField label="Vehicle Number" value={readValue(sectionC?.vehicleNo)} />
          <DisplayField label="Driver Name" value={readValue(sectionC?.driver?.name)} />
          <DisplayField
            label="Driver Reg. Number"
            value={readValue(sectionC?.driver?.regNo)}
          />
          <DisplayField label="Driver Rank" value={readValue(sectionC?.driver?.rank)} />
        </div>
      </div>

      {cvrLoading ? (
        <div className="p-5 flex items-center justify-center">
          <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full" />
        </div>
      ) : cvrList.length > 0 ? (
        <div className="p-5 rounded-xl border border-violet-200 bg-violet-50/50 space-y-3">
          <h4 className="text-sm font-semibold text-violet-950 uppercase tracking-wide pb-2 border-b border-violet-200 flex items-center gap-2">
            <span className="w-1.5 h-4 rounded-full bg-violet-600 inline-block flex-shrink-0" />
            Associated CVRs (Crime Scenes)
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {cvrList.map((cvr) => (
              <div key={cvr.CVR_ID} className="p-4 rounded-xl border border-gray-200 bg-white shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 border border-blue-100 rounded px-1.5 py-0.5">
                    {cvr.CVR_NO}
                  </span>
                  <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wide">
                    ID: {cvr.CVR_ID}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-gray-500 font-semibold">Offence:</span> {cvr.OFFENCE_TYPE || '—'}
                  </div>
                  <div>
                    <span className="text-gray-500 font-semibold">Type:</span> {cvr.TYPE_CRIME_SCENE || '—'}
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-500 font-semibold">Place:</span> {cvr.PLACE_DETAIL || '—'}
                  </div>
                  <div>
                    <span className="text-gray-500 font-semibold">In Time:</span> {cvr.SCENE_IN || '—'}
                  </div>
                  <div>
                    <span className="text-gray-500 font-semibold">Out Time:</span> {cvr.SCENE_OUT || '—'}
                  </div>
                  <div className="col-span-2 text-[10px] text-gray-400">
                    Created: {cvr.CREATED_DTM}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
