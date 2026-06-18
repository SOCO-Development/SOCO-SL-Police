import type { CrimeVisit, DateTimeEntry } from '@/types/crimeVisit';

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
  const { sectionA, sectionC } = visit;

  const offenceList = Array.isArray(sectionA?.offence)
    ? sectionA.offence
    : sectionA?.offence
      ? [sectionA.offence as string]
      : [];

  return (
    <div className="space-y-5">
      <div className="p-5 rounded-xl border border-gray-200 bg-gray-50/70">
        <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide pb-2 mb-3 flex items-center gap-2">
          <span className="w-1.5 h-4 rounded-full bg-violet-500 inline-block flex-shrink-0" />
          Request Details
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <DisplayField label="Division" value={readValue(sectionA?.requestDivision)} />
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
    </div>
  );
}
