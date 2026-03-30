export type CrimeSceneVisitType = 'NEW_VISIT' | 'REVISIT';

export interface CrimeSceneOfficer {
  name: string;
  regNo?: string;
  rank?: string;
}

export interface CrimeSceneSpecialistTeam {
  role: string;
  specialist: string;
  teamMembers: string;
}

export interface CrimeSceneDateTime {
  date: string;
  time: string;
}

export interface CrimeScene {
  id: string;
  cvrNo: string;
  visitType: CrimeSceneVisitType;
  visitId?: string;
  revisitCvrNo?: string;

  policeStation: string;
  reportedToPoliceStation: CrimeSceneDateTime;
  reportedToSocoLab: CrimeSceneDateTime;
  sceneInTime: string;
  sceneOutTime: string;
  division: string;
  offence: string;
  placeOfCrimeScene: string;

  inChargeOfficer: CrimeSceneOfficer;
  socoOfficers: CrimeSceneOfficer[];
  specialistTeams: CrimeSceneSpecialistTeam[];

  photoZipName?: string;
  sketchFileName?: string;
  reportFileName?: string;

  createdAt: string;
  updatedAt: string;
}

export interface CrimeSceneFormData extends Omit<CrimeScene, 'id' | 'createdAt' | 'updatedAt'> {
  cvrNo?: string;
}
