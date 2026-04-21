import type { AnalysisReportReceived, CourtVisitUpdateDetails, CrimeScene } from '@/types/crimeScene';
import { crimeSceneUsesRevisitFields } from '@/types/crimeScene';
import { formatIncidentDuration } from '@/lib/dateUtils';
import { getProductionPRDisplayLabel, productionPRHasOthersSelected } from '@/lib/productionPROptions';
import { formatAnalysisInstitutionDisplay } from '@/lib/analysisInstitutions';

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

function formatAnalysisReportResultDisplay(r: AnalysisReportReceived): string {
  const res = r.resultReceived?.trim();
  if (!res) return '';
  if (res === 'Other' && r.resultOtherDetail?.trim()) {
    return `Other — ${r.resultOtherDetail.trim()}`;
  }
  return res;
}

function hasAnalysisReportData(r: AnalysisReportReceived | undefined): boolean {
  if (!r) return false;
  if (r.labReportReceived === 'Yes' || r.labReportReceived === 'No') return true;
  return Boolean(
    r.annexRef?.trim() ||
      r.date?.trim() ||
      r.resultReceived ||
      r.resultOtherDetail?.trim(),
  );
}

function formatCourtVisitResultDisplay(r: CourtVisitUpdateDetails): string {
  const res = r.resultReceived?.trim();
  if (!res) return '';
  if (res === 'Other' && r.resultOtherDetail?.trim()) {
    return `Other — ${r.resultOtherDetail.trim()}`;
  }
  return res;
}

function hasCourtVisitUpdateData(r: CourtVisitUpdateDetails | undefined): boolean {
  if (!r) return false;
  return Boolean(
    r.officerKey?.trim() ||
      r.officerName?.trim() ||
      r.visitDate?.trim() ||
      r.resultReceived ||
      r.resultOtherDetail?.trim(),
  );
}

/** Coloured stripe in section titles — matches Create Crime Scene form. */
function SectionTitle({ stripeClass, children }: { stripeClass: string; children: React.ReactNode }) {
  return (
    <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide pb-2 mb-3 flex items-center gap-2">
      <span className={`w-1.5 h-4 rounded-full inline-block flex-shrink-0 ${stripeClass}`} aria-hidden />
      {children}
    </h4>
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
        <SectionTitle stripeClass="bg-violet-500">Scene Basics</SectionTitle>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <DisplayField
            label="Visit Type"
            value={
              scene.visitType === 'REVISIT'
                ? 'Revisit'
                : scene.visitType === 'COURT_VISIT'
                  ? 'Court Visit'
                  : 'New Crime Scene'
            }
          />
          <DisplayField label="CVR No" value={readValue(scene.cvrNo)} />
          {scene.visitType === 'NEW_VISIT' && scene.visitId?.trim() ? (
            <DisplayField label="Initiated visit ID" value={readValue(scene.visitId)} />
          ) : null}
          {crimeSceneUsesRevisitFields(scene.visitType) && scene.revisitCvrNo?.trim() ? (
            <DisplayField label="Existing CVR" value={readValue(scene.revisitCvrNo)} />
          ) : null}
        </div>
      </div>

      <div className="p-5 rounded-xl border border-gray-200 bg-gray-50/70">
        <SectionTitle stripeClass="bg-indigo-500">Location</SectionTitle>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <DisplayField label="Police Station" value={readValue(scene.policeStation)} />
          <DisplayField label="Division" value={readValue(scene.division)} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
        <div className="p-5 rounded-xl border border-gray-200 bg-gray-50/70 space-y-3">
          <SectionTitle stripeClass="bg-slate-500">Reported to Police</SectionTitle>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <DisplayField label="Date" value={readValue(scene.reportedToPoliceStation?.date)} />
            <DisplayField label="Time" value={readValue(scene.reportedToPoliceStation?.time)} />
          </div>
        </div>
        <div className="p-5 rounded-xl border border-gray-200 bg-gray-50/70 space-y-3">
          <SectionTitle stripeClass="bg-blue-500">Reported to SOCO Lab</SectionTitle>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <DisplayField label="Date" value={readValue(scene.reportedToSocoLab?.date)} />
            <DisplayField label="Time" value={readValue(scene.reportedToSocoLab?.time)} />
          </div>
        </div>
      </div>

      <div className="p-5 rounded-xl border border-gray-200 bg-gray-50/70">
        <SectionTitle stripeClass="bg-cyan-500">Scene Times & Details</SectionTitle>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <DisplayField label="Scene In Time" value={readValue(scene.sceneInTime)} />
          <DisplayField label="Scene Out Time" value={readValue(scene.sceneOutTime)} />
          <DisplayField label="Place of Crime Scene" value={readValue(scene.placeOfCrimeScene)} />
          <DisplayField
            label="Type of Crime Scene"
            value={
              scene.crimeSceneType === 'Others'
                ? readValue(
                    scene.crimeSceneTypeOther?.trim()
                      ? `Others — ${scene.crimeSceneTypeOther.trim()}`
                      : 'Others',
                  )
                : readValue(scene.crimeSceneType)
            }
          />
          <DisplayField
            label="Date & time of incident (exactly known)"
            value={
              scene.incidentKnown?.date?.trim() && scene.incidentKnown?.time?.trim()
                ? `${readValue(scene.incidentKnown.date)} ${readValue(scene.incidentKnown.time)}`
                : '—'
            }
          />
          <DisplayField
            label="Duration — from (date & time)"
            value={
              scene.incidentFrom?.date?.trim() && scene.incidentFrom?.time?.trim()
                ? `${readValue(scene.incidentFrom.date)} ${readValue(scene.incidentFrom.time)}`
                : '—'
            }
          />
          <DisplayField
            label="Duration — to (date & time)"
            value={
              scene.incidentTo?.date?.trim() && scene.incidentTo?.time?.trim()
                ? `${readValue(scene.incidentTo.date)} ${readValue(scene.incidentTo.time)}`
                : '—'
            }
          />
          <DisplayField
            label="Duration (from → to)"
            value={
              scene.incidentFrom && scene.incidentTo
                ? formatIncidentDuration(scene.incidentFrom, scene.incidentTo)
                : '—'
            }
          />
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
        <SectionTitle stripeClass="bg-green-500">Team Leader</SectionTitle>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <DisplayField label="Team Leader Name" value={readValue(scene.inChargeOfficer?.name)} />
          <DisplayField label="Team Leader Reg. Number" value={readValue(scene.inChargeOfficer?.regNo)} />
          <DisplayField label="Team Leader Rank" value={readValue(scene.inChargeOfficer?.rank)} />
        </div>
      </div>

      <div className="p-5 rounded-xl border border-gray-200 bg-gray-50/70">
        <SectionTitle stripeClass="bg-fuchsia-500">Investigation Officer</SectionTitle>
        <div className="rounded-lg border border-gray-200 bg-white px-3 py-2.5">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
            Investigation Officers
          </div>
          {(scene.investigationOfficers ?? []).length > 0 ? (
            <div className="mt-3 space-y-3">
              {(scene.investigationOfficers ?? []).map((io, idx) => (
                <div
                  key={`io-${idx}-${io.name}`}
                  className="grid grid-cols-1 md:grid-cols-3 gap-3 rounded-lg border border-gray-100 bg-gray-50/80 px-3 py-2"
                >
                  <DisplayField label="Name" value={readValue(io.name)} />
                  <DisplayField label="Reg. Number" value={readValue(io.regNo)} />
                  <DisplayField label="Rank" value={readValue(io.rank)} />
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-1 text-sm text-gray-500">—</div>
          )}
        </div>
      </div>

      {hasAnalysisReportData(scene.analysisReportReceived) ? (
        <div className="p-5 rounded-xl border border-gray-200 bg-gray-50/70">
          <SectionTitle stripeClass="bg-cyan-600">Analysis reports received</SectionTitle>
          <p className="text-xs text-gray-500 mb-3">
            Updated via <span className="font-medium text-gray-700">Production Analysis</span>.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <DisplayField
              label="Laboratory analysis report received"
              value={readValue(
                scene.analysisReportReceived?.labReportReceived === 'Yes'
                  ? 'Yes'
                  : scene.analysisReportReceived?.labReportReceived === 'No'
                    ? 'No'
                    : scene.analysisReportReceived?.labReportReceived === ''
                      ? ''
                      : scene.analysisReportReceived?.annexRef || scene.analysisReportReceived?.date
                        ? 'Yes (legacy)'
                        : '',
              )}
            />
            {scene.analysisReportReceived?.labReportReceived === 'No' ? (
              <div className="md:col-span-2 rounded-lg border border-gray-200 bg-white px-3 py-2.5">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Details</div>
                <div className="mt-1 text-sm text-gray-600">
                  No laboratory report recorded yet. When a report is received, update this visit in Production Analysis
                  and choose Yes to add annex, date, and result.
                </div>
              </div>
            ) : (
              <>
                <DisplayField
                  label="Analysis reports received (annex)"
                  value={readValue(scene.analysisReportReceived?.annexRef)}
                />
                <DisplayField label="Date" value={readValue(scene.analysisReportReceived?.date)} />
                <div className="md:col-span-2">
                  <DisplayField
                    label="Result received"
                    value={readValue(formatAnalysisReportResultDisplay(scene.analysisReportReceived!))}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}

      {hasCourtVisitUpdateData(scene.courtVisitUpdate) ? (
        <div className="p-5 rounded-xl border border-gray-200 bg-gray-50/70">
          <SectionTitle stripeClass="bg-violet-600">Court visit</SectionTitle>
          <p className="text-xs text-gray-500 mb-3">
            Updated via <span className="font-medium text-gray-700">Update court details</span> → Court visit.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <DisplayField label="Officer" value={readValue(scene.courtVisitUpdate?.officerName)} />
            <DisplayField label="Reg. number" value={readValue(scene.courtVisitUpdate?.officerRegNo)} />
            <DisplayField label="Role" value={readValue(scene.courtVisitUpdate?.officerRoleLabel)} />
            <DisplayField label="Date of visit" value={readValue(scene.courtVisitUpdate?.visitDate)} />
            <div className="md:col-span-2">
              <DisplayField
                label="Results"
                value={readValue(formatCourtVisitResultDisplay(scene.courtVisitUpdate!))}
              />
            </div>
          </div>
        </div>
      ) : null}

      <div className="p-5 rounded-xl border border-gray-200 bg-gray-50/70">
        <SectionTitle stripeClass="bg-amber-500">Court details</SectionTitle>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
          <DisplayField label="Court name" value={readValue(scene.courtDetails?.courtName)} />
          <DisplayField label="Court case no." value={readValue(scene.courtDetails?.courtCaseNo)} />
        </div>
        {scene.courtDetails?.productionPR === 'Yes' &&
        (scene.courtDetails?.productionPRTypes?.length ?? 0) > 0 ? (
          <div className="mb-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-600">
              Production types (P.R.)
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {(scene.courtDetails.productionPRTypes ?? []).map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-sm leading-snug font-medium text-amber-900"
                >
                  {getProductionPRDisplayLabel(t)}
                </span>
              ))}
            </div>
            {productionPRHasOthersSelected(scene.courtDetails.productionPRTypes) &&
            scene.courtDetails.productionPROtherDetail?.trim() ? (
              <div className="mt-3">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                  Others — specify
                </div>
                <div className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">
                  {scene.courtDetails.productionPROtherDetail.trim()}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
        <DisplayField label="Production (P.R.)" value={readValue(scene.courtDetails?.productionPR)} />

        {(scene.courtDetails?.productionSentToCourtRows ?? []).length > 0 ? (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-600 mb-3">
              Production sent to court
            </div>
            <div className="divide-y divide-gray-200">
              {(scene.courtDetails?.productionSentToCourtRows ?? []).map((row, idx) => {
                const sent =
                  row.sentToCourt === 'Yes' || row.sentToCourt === 'No'
                    ? row.sentToCourt
                    : String(row.date ?? '').trim() || String(row.courtCaseNo ?? '').trim()
                      ? 'Yes'
                      : '—';
                return (
                  <div
                    key={`psc-${idx}-${row.productionRef}`}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 py-4 first:pt-0"
                  >
                    <DisplayField
                      label="Production"
                      value={readValue(getProductionPRDisplayLabel(row.productionRef))}
                    />
                    <DisplayField label="Sent to court?" value={readValue(sent === '—' ? '' : sent)} />
                    <DisplayField
                      label="Date"
                      value={readValue(sent === 'Yes' ? row.date : '')}
                    />
                    <DisplayField
                      label="Court case no."
                      value={readValue(sent === 'Yes' ? row.courtCaseNo : '')}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}

        {(scene.courtDetails?.sentToAnalysisRows ?? []).length > 0 ? (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-600 mb-3">
              Sent to analysis institute
            </div>
            <div className="divide-y divide-gray-200">
              {(scene.courtDetails?.sentToAnalysisRows ?? []).map((row, idx) => {
                const sent =
                  row.sentToAnalysis === 'Yes' || row.sentToAnalysis === 'No'
                    ? row.sentToAnalysis
                    : String(row.date ?? '').trim() ||
                        String(row.refNo ?? '').trim() ||
                        String(row.institution ?? '').trim()
                      ? 'Yes'
                      : '—';
                return (
                  <div
                    key={`sa-${idx}-${row.productionRef}-${row.institution}`}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-2 py-4 first:pt-0"
                  >
                    <DisplayField
                      label="Production"
                      value={readValue(getProductionPRDisplayLabel(row.productionRef))}
                    />
                    <DisplayField label="Sent for analysis?" value={readValue(sent === '—' ? '' : sent)} />
                    <DisplayField
                      label="Institution"
                      value={readValue(sent === 'Yes' ? formatAnalysisInstitutionDisplay(row) : '')}
                    />
                    <DisplayField label="Date" value={readValue(sent === 'Yes' ? row.date : '')} />
                    <DisplayField label="Ref. no." value={readValue(sent === 'Yes' ? row.refNo : '')} />
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
