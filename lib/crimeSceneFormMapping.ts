import type { CrimeScene, CrimeSceneFormData, CrimeSceneOfficer, CrimeSceneSpecialistTeam } from '@/types/crimeScene';
import {
  crimeSceneUsesNewVisitFields,
  crimeSceneUsesRevisitFields,
  emptyCrimeSceneCourtDetails,
} from '@/types/crimeScene';
import { parseDateTimeParts } from '@/lib/dateUtils';

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
