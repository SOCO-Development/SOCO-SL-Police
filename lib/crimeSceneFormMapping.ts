import type {
  CrimeScene,
  CrimeSceneCourtDetails,
  CrimeSceneFormData,
  CrimeSceneOfficer,
  CrimeSceneSpecialistTeam,
} from '@/types/crimeScene';
import {
  crimeSceneUsesNewVisitFields,
  crimeSceneUsesRevisitFields,
  emptyCrimeSceneCourtDetails,
} from '@/types/crimeScene';
import { parseDateTimeParts } from '@/lib/dateUtils';
import type { FullCvrVisitItem } from '@/lib/api/types';
import type { StationDivisionLookup } from '@/app/crime-visit-registry/submitted-crime-scenes/CvrVisitsExpandPanel';

function emptyOfficer(): CrimeSceneOfficer {
  return { name: '', regNo: '', rank: '', teamRole: 'Other', teamRoleOther: '', socoRole: 'Other' };
}

function emptySpecialist(): CrimeSceneSpecialistTeam {
  return { role: '', inTime: '', outTime: '', members: [{ name: '', role: 'Team Leader' }] };
}

/** Normalized payload matching Create Crime Scene save semantics. */
/** Validates incident date/time or duration range based on incidentDateExactlyKnown. */
export function validateIncidentTimingSection(form: CrimeSceneFormData): string {
  const mode = form.incidentDateExactlyKnown;
  const known = form.incidentKnown ?? { date: '', time: '' };
  const incFrom = form.incidentFrom ?? { date: '', time: '' };
  const incTo = form.incidentTo ?? { date: '', time: '' };

  const hasAnyLegacyData =
    Boolean(known.date?.trim() || known.time?.trim() || incFrom.date?.trim() || incFrom.time?.trim() || incTo.date?.trim() || incTo.time?.trim());

  if (mode !== true && mode !== false && !hasAnyLegacyData) {
    return 'Please select whether the incident date is exactly known (Yes/No).';
  }

  if (mode === false) {
    if (!incFrom.date?.trim() || !incFrom.time?.trim()) {
      return 'Please enter duration start: date and time (from).';
    }
    if (!incTo.date?.trim() || !incTo.time?.trim()) {
      return 'Please enter duration end: date and time (to).';
    }
    const fromD = parseDateTimeParts(incFrom);
    const toD = parseDateTimeParts(incTo);
    if (!fromD || !toD) return 'Invalid incidence date or time.';
    if (toD.getTime() < fromD.getTime()) {
      return 'Incidence end date and time must be the same as or after the start.';
    }
    return '';
  }

  if (mode === true) {
    if (!known.date?.trim() || !known.time?.trim()) {
      return 'Please enter the exactly known date and time of the incident.';
    }
    if (!parseDateTimeParts(known)) return 'Invalid date or time for the incident.';
    return '';
  }

  if (!known.date?.trim() || !known.time?.trim()) {
    return 'Please enter the exactly known date and time of the incident.';
  }
  if (!parseDateTimeParts(known)) return 'Invalid date or time for the incident.';
  if (!incFrom.date?.trim() || !incFrom.time?.trim()) {
    return 'Please enter duration start: date and time (from).';
  }
  if (!incTo.date?.trim() || !incTo.time?.trim()) {
    return 'Please enter duration end: date and time (to).';
  }
  const fromD = parseDateTimeParts(incFrom);
  const toD = parseDateTimeParts(incTo);
  if (!fromD || !toD) return 'Invalid incidence date or time.';
  if (toD.getTime() < fromD.getTime()) {
    return 'Incidence end date and time must be the same as or after the start.';
  }
  return '';
}

export function buildCrimeScenePayloadFromForm(
  form: CrimeSceneFormData,
): Omit<CrimeScene, 'id' | 'createdAt' | 'updatedAt' | 'cvrAmendment'> {
  const cvrNo = crimeSceneUsesNewVisitFields(form.visitType)
    ? (form.cvrNo?.trim() ?? '')
    : (form.revisitCvrNo ?? '');
  const inv = (form.investigationOfficers ?? []).filter(
    (o) => o.name?.trim() || o.regNo?.trim() || o.rank?.trim(),
  );
  const incidentDateExactlyKnown =
    form.incidentDateExactlyKnown === null ? undefined : form.incidentDateExactlyKnown;
  return {
    ...form,
    cvrNo,
    incidentDateExactlyKnown,
    visitId: form.visitId,
    revisitCvrNo: crimeSceneUsesRevisitFields(form.visitType) ? form.revisitCvrNo : '',
    socoOfficers: form.socoOfficers.filter((o) => o.name.trim()),
    specialistTeams: form.specialistTeams
      .map((t) => ({ ...t, members: (t.members || []).filter((m) => m.name.trim()) }))
      .filter((t) => t.role.trim() || (t.members && t.members.length > 0)),
    sceneGuards: (form.sceneGuards ?? []).filter((g) => g.name.trim()),
    investigationOfficers: inv.length ? inv : undefined,
  };
}

export function crimeSceneToFormData(scene: CrimeScene): CrimeSceneFormData {
  const offenceRaw = scene.offence;
  const offenceArr = Array.isArray(offenceRaw)
    ? offenceRaw
    : offenceRaw
      ? [String(offenceRaw)]
      : [];
  return {
    visitType: scene.visitType,
    visitId: scene.visitId ?? '',
    cvrNo: scene.cvrNo,
    revisitCvrNo: scene.revisitCvrNo ?? '',
    policeStation: scene.policeStation,
    reportedToPoliceStation: scene.reportedToPoliceStation,
    reportedToSocoLab: scene.reportedToSocoLab,
    sceneInTime: scene.sceneInTime,
    sceneOutTime: scene.sceneOutTime,
    division: scene.division,
    offence: offenceArr,
    offenceType: scene.offenceType,
    offenceTypeOther: scene.offenceTypeOther,
    placeOfCrimeScene: scene.placeOfCrimeScene,
    crimeSceneType: scene.crimeSceneType,
    crimeSceneTypeOther: scene.crimeSceneTypeOther,
    incidentDateExactlyKnown:
      scene.incidentDateExactlyKnown === undefined ? null : scene.incidentDateExactlyKnown,
    incidentKnown: scene.incidentKnown ?? { date: '', time: '' },
    incidentFrom: scene.incidentFrom ?? { date: '', time: '' },
    incidentTo: scene.incidentTo ?? { date: '', time: '' },
    inChargeOfficer: scene.inChargeOfficer,
    socoOfficers: scene.socoOfficers?.length ? scene.socoOfficers : [emptyOfficer()],
    specialistTeams: scene.specialistTeams?.length ? scene.specialistTeams : [emptySpecialist()],
    investigationOfficers: scene.investigationOfficers?.length ? scene.investigationOfficers : [emptyOfficer()],
    sceneGuards: scene.sceneGuards?.length ? scene.sceneGuards : [emptyOfficer()],
    photoZipName: scene.photoZipName ?? '',
    sketchFileName: scene.sketchFileName ?? '',
    reportFileName: scene.reportFileName ?? '',
    analysisReportReceived: scene.analysisReportReceived,
    courtVisitUpdate: scene.courtVisitUpdate,
    courtDetails: scene.courtDetails ?? emptyCrimeSceneCourtDetails(),
  };
}

export function applyPayloadToScene(
  scene: CrimeScene,
  payload: Omit<CrimeScene, 'id' | 'createdAt' | 'updatedAt' | 'cvrAmendment'>,
): CrimeScene {
  return {
    ...scene,
    ...payload,
    id: scene.id,
    createdAt: scene.createdAt,
  };
}

/**
 * Maps a single visit from the live GetFullCvrDetailsByInitiateCvrId payload
 * into the CrimeScene shape CrimeSceneDetailView already knows how to render —
 * so the "View" / "View all" detail pages show real backend data (team leader,
 * investigation officers, production details, station/division names, etc.)
 * instead of relying on stale localStorage matches.
 */
export function fullCvrVisitItemToCrimeScene(
  visit: FullCvrVisitItem,
  cvrNo: string,
  lookup: StationDivisionLookup,
): CrimeScene {
  const isRevisit = visit.visitTypeId !== '1';
  const submittedAt = `${visit.reportedSocoDate}T${visit.reportedSocoTime || '00:00:00'}`;

  // Team leader = expert team member with role "Team Leader"; fall back to first entry.
  const teamLeaderEntry =
    visit.expertTeams.find((t) => t.EXPERT_TEAM_MEMBER_ROLE === 'Team Leader') ?? visit.expertTeams[0];

  const investigationOfficers = visit.investigationOfficers.map((io) => ({
    name: io.INVESTIGATION_OFFICER_NAME || '',
    regNo: io.INVESTIGATION_OFFICER_REGINO || '',
    rank: io.INVESTIGATION_OFFICER_RANK || '',
  }));

  const sceneGuards = visit.sceneGuards.map((g) => ({
    name: g.SCENE_GUARD_NAME || '',
    regNo: g.SCENE_GUARD_REGINO || '',
    rank: g.SCENE_GUARD_RANK || '',
  }));

  const courtDetail = visit.courtDetails[0];
  const productionAvailable = visit.productionDetails.some((p) => p.PRODUCTION_STATUS === 'True');

  const courtDetails: CrimeSceneCourtDetails = {
    courtName: '',
    courtCaseNo: courtDetail?.COURT_CASE_NO || '',
    bNumber: courtDetail?.B_NUMBER || '',
    productionPR: productionAvailable ? 'Yes' : visit.productionDetails.length ? 'No' : '',
    productionPRTypes: [],
    productionSentToCourtRows: [],
    sentToAnalysisRows: [],
  };

  return {
    id: `full_cvr_visit_${visit.cvrId}`,
    cvrNo,
    cvrId: visit.cvrId,
    visitType: isRevisit ? 'REVISIT' : 'NEW_VISIT',
    policeStation: lookup.stationName(visit.policeStationId),
    reportedToPoliceStation: { date: visit.reportedPoliceDate, time: visit.reportedPoliceTime },
    reportedToSocoLab: { date: visit.reportedSocoDate, time: visit.reportedSocoTime },
    sceneInTime: visit.sceneIn,
    sceneOutTime: visit.sceneOut,
    division: lookup.divisionName(visit.policeStationId),
    offence: visit.offences.map((o) => o.OFFENCE_ID),
    offenceType: visit.offenceType,
    placeOfCrimeScene: visit.placeDetail,
    crimeSceneType: visit.typeCrimeScene,
    incidentDateExactlyKnown: visit.isExactTime === 'True',
    incidentFrom: { date: visit.incidentFromDate, time: visit.incidentFromTime },
    incidentTo: { date: visit.incidentToDate, time: visit.incidentToTime },
    inChargeOfficer: {
      name: teamLeaderEntry?.EXPERT_TEAM_MEMBER_NAME || '',
      rank: '',
      regNo: '',
    },
    socoOfficers: [],
    specialistTeams: visit.expertTeams.map((t) => ({
      role: t.EXPERT_TEAM_ROLE || '',
      specialist: t.EXPERT_TEAM_MEMBER_NAME || '',
      teamMembers: t.EXPERT_TEAM_MEMBER_ROLE || '',
    })),
    investigationOfficers,
    sceneGuards,
    courtDetails,
    approval_status: visit.approvalStatus || 'In Progress',
    createdAt: submittedAt,
    updatedAt: submittedAt,
  };
}
