import type { CrimeVisit, DateTimeEntry, OfficerInfo, Expert } from '@/types/crimeVisit';
import { Clock, Users, Car, FileText } from 'lucide-react';

interface CrimeVisitDetailViewProps {
  visit: CrimeVisit;
}

function formatDateTime(entry?: DateTimeEntry) {
  if (!entry) return { main: '—', meta: '' };
  const date = entry.date || '';
  const time = entry.time || '';
  const main = [date, time].filter(Boolean).join(' · ') || '—';
  const metaParts = [];
  if (entry.page) metaParts.push(`Page ${entry.page}`);
  if (entry.para) metaParts.push(`Para ${entry.para}`);
  const meta = metaParts.join(' · ');
  return { main, meta };
}

function formatOfficer(officer?: OfficerInfo): string {
  if (!officer) return '';
  const parts = [officer.rank, officer.regNo, officer.name].filter(Boolean);
  return parts.join(' · ') || '';
}

function hasExpert(expert?: Expert) {
  return !!(expert?.name || expert?.inTime || expert?.outTime);
}

function FieldBlock({
  label,
  hint,
  value,
  meta,
  icon: Icon,
}: {
  label: string;
  hint?: string;
  value: React.ReactNode;
  meta?: string;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        {Icon && <Icon className="w-3.5 h-3.5 text-gray-400" />}
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</p>
      </div>
      {hint && <p className="text-[11px] text-gray-400">{hint}</p>}
      <p className="text-gray-900 font-medium">{value}</p>
      {meta && <p className="text-xs text-gray-500">{meta}</p>}
    </div>
  );
}

function OfficerBlock({ label, officer }: { label: string; officer?: OfficerInfo }) {
  const text = formatOfficer(officer);
  const display = text ? (
    <span>{text}</span>
  ) : (
    <span className="text-gray-400 italic">Not recorded</span>
  );
  return <FieldBlock label={label} value={display} icon={Users} />;
}

export default function CrimeVisitDetailView({ visit }: CrimeVisitDetailViewProps) {
  const { sectionA, sectionB, sectionC } = visit;

  const reported = formatDateTime(sectionA?.reportedToSocoLab);
  const out = formatDateTime(sectionA?.out);
  const backIn = formatDateTime(sectionA?.in);
  const revisitOut = formatDateTime(sectionA?.revisitOut);
  const revisitIn = formatDateTime(sectionA?.revisitIn);

  const experts = (sectionB?.experts || []).filter(hasExpert);

  return (
    <div className="space-y-8">
      {/* Section 1 – Scene Timeline */}
      <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <header className="px-5 py-4 bg-gray-50 border-b border-gray-200 flex items-center gap-3">
          <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-100 text-blue-700 font-bold text-sm">
            1
          </span>
          <div>
            <h3 className="text-base font-semibold text-gray-900">
              Scene Attendance Timeline
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              When SOCO was notified and when officers departed to and returned from the crime scene
            </p>
          </div>
          <Clock className="w-5 h-5 text-gray-400 ml-auto" />
        </header>
        <div className="px-5 py-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-5">
              <FieldBlock
                label="Reported to SOCO Lab"
                hint="When the case was first reported to the SOCO laboratory"
                value={reported.main}
                meta={reported.meta || undefined}
                icon={Clock}
              />
              <div className="border-l-2 border-blue-100 pl-4 space-y-4">
                <FieldBlock
                  label="First visit – departed to scene"
                  hint="Out = left for the crime scene"
                  value={out.main}
                  meta={out.meta || undefined}
                  icon={Clock}
                />
                <FieldBlock
                  label="First visit – returned from scene"
                  hint="In = came back from the crime scene"
                  value={backIn.main}
                  meta={backIn.meta || undefined}
                  icon={Clock}
                />
              </div>
            </div>
            <div className="space-y-5">
              <div className="border-l-2 border-amber-100 pl-4 space-y-4">
                <FieldBlock
                  label="Revisit – departed to scene"
                  hint="If SOCO returned to the scene a second time"
                  value={revisitOut.main}
                  meta={revisitOut.meta || undefined}
                  icon={Clock}
                />
                <FieldBlock
                  label="Revisit – returned from scene"
                  hint="Return time from the second visit"
                  value={revisitIn.main}
                  meta={revisitIn.meta || undefined}
                  icon={Clock}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2 – Officers & Experts */}
      <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <header className="px-5 py-4 bg-gray-50 border-b border-gray-200 flex items-center gap-3">
          <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 font-bold text-sm">
            2
          </span>
          <div>
            <h3 className="text-base font-semibold text-gray-900">
              Officers & Specialists at Scene
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              SOCO officers in charge, support roles (photographer, sketcher, etc.), and external experts who attended
            </p>
          </div>
          <Users className="w-5 h-5 text-gray-400 ml-auto" />
        </header>
        <div className="px-5 py-5 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <OfficerBlock
              label="Officer in charge"
              officer={sectionB?.socoOfficers?.inCharge}
            />
            <OfficerBlock
              label="Scene guard"
              officer={sectionC?.sceneGuard}
            />
          </div>

          <div className="rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Support SOCO Officers
              </p>
              <p className="text-[11px] text-gray-500 mt-0.5">
                Photographer, sketcher, evidence collector, and other assigned roles
              </p>
            </div>
            <div className="divide-y divide-gray-100">
              {(['photographer', 'sketcher', 'evidenceCollector', 'otherOfficer'] as const).map(
                (roleKey) => {
                  const labelMap: Record<typeof roleKey, string> = {
                    photographer: 'Photographer',
                    sketcher: 'Sketcher',
                    evidenceCollector: 'Evidence Collector',
                    otherOfficer: 'Other Officer',
                  };
                  const officer =
                    sectionB?.socoOfficers?.support &&
                    sectionB.socoOfficers.support[roleKey];
                  const text = formatOfficer(officer);
                  if (!text) return null;
                  return (
                    <div
                      key={roleKey}
                      className="px-4 py-3 flex items-center justify-between gap-4"
                    >
                      <span className="text-sm text-gray-600">{labelMap[roleKey]}</span>
                      <span className="text-sm text-gray-900 font-medium text-right">{text}</span>
                    </div>
                  );
                }
              )}
              {!(formatOfficer(sectionB?.socoOfficers?.support?.photographer) ||
                formatOfficer(sectionB?.socoOfficers?.support?.sketcher) ||
                formatOfficer(sectionB?.socoOfficers?.support?.evidenceCollector) ||
                formatOfficer(sectionB?.socoOfficers?.support?.otherOfficer)) && (
                <div className="px-4 py-3 text-sm text-gray-400 italic">No support officers recorded</div>
              )}
            </div>
          </div>

          {experts.length > 0 ? (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                External experts who visited the scene
              </p>
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600">Annex</th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600">Expert name</th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600">Time in</th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600">Time out</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {experts.map((expert, idx) => (
                      <tr key={idx}>
                        <td className="px-4 py-2.5 text-gray-900">{expert.annex || '—'}</td>
                        <td className="px-4 py-2.5 text-gray-900 font-medium">{expert.name || '—'}</td>
                        <td className="px-4 py-2.5 text-gray-700">{expert.inTime || '—'}</td>
                        <td className="px-4 py-2.5 text-gray-700">{expert.outTime || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-400 italic">No external experts recorded</p>
          )}
        </div>
      </section>

      {/* Section 3 – Vehicle & Investigators */}
      <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <header className="px-5 py-4 bg-gray-50 border-b border-gray-200 flex items-center gap-3">
          <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-amber-100 text-amber-700 font-bold text-sm">
            3
          </span>
          <div>
            <h3 className="text-base font-semibold text-gray-900">
              Transport & Investigation Officers
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Vehicle used for the visit, driver, examination dates, and officers leading the investigation
            </p>
          </div>
          <Car className="w-5 h-5 text-gray-400 ml-auto" />
        </header>
        <div className="px-5 py-5 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FieldBlock
              label="Vehicle number"
              hint="Vehicle used to travel to the crime scene"
              value={sectionC?.vehicleNo || '—'}
              icon={Car}
            />
            <OfficerBlock label="Driver" officer={sectionC?.driver} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FieldBlock
              label="Examined by SOCO officers"
              hint="Date and time SOCO officers examined the scene"
              value={
                sectionC?.examinedBySocoOfficers?.date ? (
                  <span>
                    {sectionC.examinedBySocoOfficers.date}
                    <span className="text-gray-500 font-normal ml-2">
                      (In: {sectionC.examinedBySocoOfficers.timeIn || '—'} · Out: {sectionC.examinedBySocoOfficers.timeOut || '—'})
                    </span>
                  </span>
                ) : (
                  '—'
                )
              }
              icon={FileText}
            />
            <FieldBlock
              label="Re-examined by SOCO officers"
              hint="If the scene was examined again on a later date"
              value={
                sectionC?.reExaminedBySocoOfficers?.date ? (
                  <span>
                    {sectionC.reExaminedBySocoOfficers.date}
                    <span className="text-gray-500 font-normal ml-2">
                      (In: {sectionC.reExaminedBySocoOfficers.timeIn || '—'} · Out: {sectionC.reExaminedBySocoOfficers.timeOut || '—'})
                    </span>
                  </span>
                ) : (
                  '—'
                )
              }
              icon={FileText}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-gray-100">
            <OfficerBlock
              label="Investigation officer"
              officer={sectionC?.investigationOfficer}
            />
            <OfficerBlock
              label="Re-assigned case officer"
              officer={sectionC?.reAssignedCaseOfficer}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
