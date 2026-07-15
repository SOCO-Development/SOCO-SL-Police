import { useEffect, useState } from 'react';
import type { AnalysisReportReceived, CrimeScene } from '@/types/crimeScene';
import {
  crimeSceneUsesRevisitFields,
  courtRewardsUpdateHasDisplayableData,
  courtVisitUpdateHasDisplayableData,
  normalizeCourtRewardsUpdate,
  normalizeCourtVisitUpdate,
} from '@/types/crimeScene';
import { formatIncidentDuration } from '@/lib/dateUtils';
import {
  getProductionPRDisplayLabel,
  loadProductionTypeOptions,
  productionPRHasOthersSelected,
  type ProductionOption,
} from '@/lib/productionPROptions';
import { formatAnalysisInstitutionDisplay } from '@/lib/analysisInstitutions';
import { COURT_REWARD_CATEGORY_LABELS, getCourtRewardTypesForCategory } from '@/lib/courtRewardUtils';
import { registryWorkflowDisplayEntries } from '@/lib/registryWorkflowDisplay';
import LinkedCrimeVisitPanel from './LinkedCrimeVisitPanel';

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
  const [productionTypes, setProductionTypes] = useState<ProductionOption[]>([]);

  useEffect(() => {
    let cancelled = false;
    loadProductionTypeOptions()
      .then((options) => {
        if (!cancelled) setProductionTypes(options);
      })
      .catch((error) => {
        console.error('Failed to load production types', error);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const offenceList = Array.isArray(scene.offence)
    ? scene.offence
    : scene.offence
      ? [scene.offence as string]
      : [];
  const hasCourtDetails = Boolean(
    scene.courtDetails?.courtName?.trim() ||
    scene.courtDetails?.courtCaseNo?.trim() ||
    scene.courtDetails?.bNumber?.trim(),
  );
  const workflowEntries = registryWorkflowDisplayEntries(scene);

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
          {crimeSceneUsesRevisitFields(scene.visitType) && scene.revisitCvrNo?.trim() ? (
            <DisplayField label="Existing CVR" value={readValue(scene.revisitCvrNo)} />
          ) : null}
        </div>
        {workflowEntries.length ? (
          <div className="mt-4 rounded-lg border border-slate-200 bg-white px-3 py-3">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Workflow updates</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {workflowEntries.map((entry) => (
                <span
                  key={`${entry.kind}-${entry.at}`}
                  className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${entry.pillClass}`}
                  title={entry.title}
                >
                  {entry.label}
                </span>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <LinkedCrimeVisitPanel visitId={scene.visitId} />

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
          {scene.incidentDateExactlyKnown === false ? (
            <>
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
            </>
          ) : scene.incidentDateExactlyKnown === true ? (
            <>
              <DisplayField
                label="Incident date (exactly known)"
                value={readValue(scene.incidentKnown?.date)}
              />
              <DisplayField
                label="Incident time (exactly known)"
                value={readValue(scene.incidentKnown?.time)}
              />
            </>
          ) : (
            <>
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
            </>
          )}
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

      {courtVisitUpdateHasDisplayableData(scene.courtVisitUpdate) ? (
        <div className="p-5 rounded-xl border border-gray-200 bg-gray-50/70 space-y-4">
          <SectionTitle stripeClass="bg-violet-600">Court visit (SOC officers)</SectionTitle>
          <p className="text-xs text-gray-500">
            Updated via <span className="font-medium text-gray-700">Update court details</span> → Court visit.
          </p>
          <div className="space-y-4">
            {normalizeCourtVisitUpdate(scene.courtVisitUpdate).rows.map((row, idx) => (
              <div
                key={`cv-${idx}-${row.officerKey}-${row.visitDate}`}
                className="rounded-lg border border-violet-200 bg-white p-4 shadow-sm space-y-3"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-violet-900">
                  Court visit {String(idx + 1).padStart(2, '0')}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <DisplayField label="Testified officer" value={readValue(row.testifiedOfficer)} />
                  <DisplayField label="Date" value={readValue(row.visitDate)} />
                  <DisplayField
                    label="Officer (visit record)"
                    value={readValue(
                      row.officerName?.trim()
                        ? `${row.officerName}${row.officerRegNo?.trim() ? ` (${row.officerRegNo.trim()})` : ''}${row.officerRoleLabel?.trim() ? ` — ${row.officerRoleLabel.trim()}` : ''
                        }`
                        : undefined,
                    )}
                  />
                  <DisplayField label="Next court date" value={readValue(row.nextCourtDate)} />
                </div>
                <div className="rounded-lg border border-gray-200 bg-gray-50/80 px-3 py-2.5">
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                    Description of the visit
                  </div>
                  <div className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">
                    {row.visitDescription?.trim() ? row.visitDescription : '—'}
                  </div>
                </div>
                {row.attachmentFileName?.trim() || row.attachmentDataUrl ? (
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="text-gray-600">Attachment:</span>
                    {row.attachmentDataUrl ? (
                      <a
                        href={row.attachmentDataUrl}
                        download={row.attachmentFileName || 'attachment'}
                        className="font-medium text-violet-700 hover:underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {row.attachmentFileName?.trim() || 'View file'}
                      </a>
                    ) : (
                      <span className="text-gray-900">{readValue(row.attachmentFileName)}</span>
                    )}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {courtRewardsUpdateHasDisplayableData(scene.courtRewardsUpdate) ? (
        <div className="p-5 rounded-xl border border-gray-200 bg-gray-50/70 space-y-4">
          <SectionTitle stripeClass="bg-teal-600">Court rewards</SectionTitle>
          <p className="text-xs text-gray-500">
            Updated via <span className="font-medium text-gray-700">Update court details</span> → Rewards.
          </p>
          <DisplayField
            label="Rewards applicable"
            value={readValue(normalizeCourtRewardsUpdate(scene.courtRewardsUpdate).rewardsEnabled)}
          />
          {normalizeCourtRewardsUpdate(scene.courtRewardsUpdate).rewardsEnabled === 'Yes' ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(['police', 'dcrd', 'division'] as const).map((key) => {
                const cat = normalizeCourtRewardsUpdate(scene.courtRewardsUpdate).categories[key];
                const selected = getCourtRewardTypesForCategory(key).filter((t) =>
                  cat.starredIds.includes(t.id),
                );
                return (
                  <div key={key} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-600 mb-2">
                      {COURT_REWARD_CATEGORY_LABELS[key]}
                      {!cat.enabled ? (
                        <span className="ml-2 font-normal normal-case text-gray-500">(not included)</span>
                      ) : null}
                    </p>
                    {selected.length > 0 ? (
                      <ul className="space-y-1.5 text-sm text-gray-900">
                        {selected.map((t) => (
                          <li key={`${key}-${t.id}`} className="font-noto-sinhala">{t.label}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-gray-500">No reward types selected.</p>
                    )}
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>
      ) : null}

      {hasCourtDetails ? (
        <div className="p-5 rounded-xl border border-gray-200 bg-gray-50/70">
          <SectionTitle stripeClass="bg-orange-500">Court details</SectionTitle>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <DisplayField label="Court name" value={readValue(scene.courtDetails?.courtName)} />
            <DisplayField label="Court case number" value={readValue(scene.courtDetails?.courtCaseNo)} />
            <DisplayField label="B number" value={readValue(scene.courtDetails?.bNumber)} />
          </div>
        </div>
      ) : null}

      <div className="p-5 rounded-xl border border-gray-200 bg-gray-50/70">
        <SectionTitle stripeClass="bg-amber-500">Production details</SectionTitle>
        <div className="mb-3">
          <DisplayField label="Production Availability" value={readValue(scene.courtDetails?.productionPR)} />
        </div>
        {scene.courtDetails?.productionPR === 'Yes' &&
          (scene.courtDetails?.productionPRTypes?.length ?? 0) > 0 ? (
          <div className="mb-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-600">
              Selected production types
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {(scene.courtDetails.productionPRTypes ?? []).map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-sm leading-snug font-medium text-amber-900"
                >
                  {getProductionPRDisplayLabel(t, productionTypes)}
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

        {(scene.courtDetails?.sentToAnalysisRows ?? []).length > 0 ? (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-600 mb-3">
              Productions sent to analysis institutes
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
                      value={readValue(getProductionPRDisplayLabel(row.productionRef, productionTypes))}
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
                    : String(row.date ?? '').trim() ||
                      String(row.courtCaseNo ?? '').trim() ||
                      String(row.courtName ?? '').trim()
                      ? 'Yes'
                      : '—';
                return (
                  <div
                    key={`psc-${idx}-${row.productionRef}`}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-2 py-4 first:pt-0"
                  >
                    <DisplayField
                      label="Production"
                      value={readValue(getProductionPRDisplayLabel(row.productionRef, productionTypes))}
                    />
                    <DisplayField label="Sent to court?" value={readValue(sent === '—' ? '' : sent)} />
                    <DisplayField
                      label="Date"
                      value={readValue(sent === 'Yes' ? row.date : '')}
                    />
                    <DisplayField
                      label="Court name"
                      value={readValue(sent === 'Yes' ? row.courtName : '')}
                    />
                    <DisplayField
                      label="Case no."
                      value={readValue(sent === 'Yes' ? row.courtCaseNo : '')}
                    />
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
