import type { CrimeScene } from '@/types/crimeScene';

interface CrimeSceneDetailViewProps {
  scene: CrimeScene;
}

function readValue(value?: string) {
  return value?.trim() ? value : '—';
}

function DisplayField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2.5">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">{label}</div>
      <div className="mt-1 text-sm text-gray-900">{value}</div>
    </div>
  );
}

export default function CrimeSceneDetailView({ scene }: CrimeSceneDetailViewProps) {
  const offenceList = Array.isArray(scene.offence)
    ? scene.offence
    : scene.offence
      ? [scene.offence as string]
      : [];

  return (
    <div className="space-y-5">
      <div className="p-5 rounded-xl border border-gray-200 bg-gray-50/70">
        <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide pb-2 mb-3">Scene Basics</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <DisplayField
            label="Visit Type"
            value={scene.visitType === 'REVISIT' ? 'Revisit' : 'New Crime Scene'}
          />
          <DisplayField label="CVR No" value={readValue(scene.cvrNo)} />
          <DisplayField label="Police Station" value={readValue(scene.policeStation)} />
          <DisplayField label="Division" value={readValue(scene.division)} />
        </div>
      </div>

      <div className="p-5 rounded-xl border border-gray-200 bg-gray-50/70">
        <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide pb-2 mb-3">
          Reporting & Scene Times
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <DisplayField label="Reported to Police Date" value={readValue(scene.reportedToPoliceStation?.date)} />
          <DisplayField label="Reported to Police Time" value={readValue(scene.reportedToPoliceStation?.time)} />
          <DisplayField label="Reported to SOCO Date" value={readValue(scene.reportedToSocoLab?.date)} />
          <DisplayField label="Reported to SOCO Time" value={readValue(scene.reportedToSocoLab?.time)} />
          <DisplayField label="Scene In Time" value={readValue(scene.sceneInTime)} />
          <DisplayField label="Scene Out Time" value={readValue(scene.sceneOutTime)} />
          <DisplayField label="Place of Crime Scene" value={readValue(scene.placeOfCrimeScene)} />
          <DisplayField
            label="Offence Type"
            value={scene.offenceType === 'Other' ? readValue(scene.offenceTypeOther) : readValue(scene.offenceType)}
          />
        </div>
        <div className="mt-3 rounded-lg border border-gray-200 bg-white px-3 py-2.5">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Offences</div>
          {offenceList.length ? (
            <div className="mt-2 flex flex-wrap gap-2">
              {offenceList.map((off, idx) => (
                <span
                  key={`${off}-${idx}`}
                  className="inline-flex items-center rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-800"
                >
                  {off}
                </span>
              ))}
            </div>
          ) : (
            <div className="mt-1 text-sm text-gray-500">—</div>
          )}
        </div>
      </div>

      <div className="p-5 rounded-xl border border-gray-200 bg-gray-50/70">
        <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide pb-2 mb-3">Officers</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <DisplayField label="Team Leader Name" value={readValue(scene.inChargeOfficer?.name)} />
          <DisplayField label="Team Leader Reg. Number" value={readValue(scene.inChargeOfficer?.regNo)} />
          <DisplayField label="Team Leader Rank" value={readValue(scene.inChargeOfficer?.rank)} />
          <DisplayField label="Investigation Officer Name" value={readValue(scene.investigationOfficer?.name)} />
          <DisplayField label="Investigation Officer Reg. Number" value={readValue(scene.investigationOfficer?.regNo)} />
          <DisplayField label="Investigation Officer Rank" value={readValue(scene.investigationOfficer?.rank)} />
        </div>
      </div>
    </div>
  );
}

