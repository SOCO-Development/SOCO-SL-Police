import type { CrimeScene, CrimeSceneFormData, CrimeSceneOfficer, CrimeSceneSpecialistTeam } from '@/types/crimeScene';
import {
  crimeSceneUsesNewVisitFields,
  crimeSceneUsesRevisitFields,
  emptyCrimeSceneCourtDetails,
} from '@/types/crimeScene';

function emptyOfficer(): CrimeSceneOfficer {
  return { name: '', regNo: '', rank: '', teamRole: 'Other', teamRoleOther: '', socoRole: 'Other' };
}

function emptySpecialist(): CrimeSceneSpecialistTeam {
  return { role: '', inTime: '', outTime: '', members: [{ name: '', role: 'Team Leader' }] };
}

/** Normalized payload matching Create Crime Scene save semantics. */
export function buildCrimeScenePayloadFromForm(
  form: CrimeSceneFormData,
): Omit<CrimeScene, 'id' | 'createdAt' | 'updatedAt' | 'cvrAmendment'> {
  const cvrNo = crimeSceneUsesNewVisitFields(form.visitType)
    ? (form.cvrNo?.trim() ?? '')
    : (form.revisitCvrNo ?? '');
  const inv = (form.investigationOfficers ?? []).filter(
    (o) => o.name?.trim() || o.regNo?.trim() || o.rank?.trim(),
  );
  return {
    ...form,
    cvrNo,
    visitId: crimeSceneUsesNewVisitFields(form.visitType) ? form.visitId : '',
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
