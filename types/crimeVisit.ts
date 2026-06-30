export interface OfficerInfo {
  rank?: string;
  regNo?: string;
  name?: string;
}

export interface DateTimeEntry {
  date?: string;
  time?: string;
  page?: string;
  para?: string;
}

export interface Expert {
  annex?: string;
  name?: string;
  inTime?: string;
  outTime?: string;
}

export interface SectionA {
  requestFromStation?: string;
  requestDivision?: string;
  locationId?: string;
  policeStationId?: string;
  offence: {};
  offenceType: string;
  offenceTypeOther?: string;
  requestReason?: string;
  reportedToSocoLab?: DateTimeEntry;
  out?: DateTimeEntry;
  in?: DateTimeEntry;
  revisitOut?: DateTimeEntry;
  revisitIn?: DateTimeEntry;
}

export interface SectionB {
  socoOfficers?: {
    inCharge?: OfficerInfo;
    supportOtherRole?: string;
    support?: {
      photographer?: OfficerInfo;
      sketcher?: OfficerInfo;
      evidenceCollector?: OfficerInfo;
      otherOfficer?: OfficerInfo;
    };
  };
  experts?: Expert[];
}

export interface SectionC {
  vehicleNo?: string;
  vehicleId?: string;
  driver?: OfficerInfo;
  driverId?: string;
  examinedBySocoOfficers?: { date?: string; timeIn?: string; timeOut?: string };
  reExaminedBySocoOfficers?: { date?: string; timeIn?: string; timeOut?: string };
  investigationOfficer?: OfficerInfo;
  reAssignedCaseOfficer?: OfficerInfo;
  sceneGuard?: OfficerInfo;
}

export interface DraftAdditions {
  experts?: Expert[];
  in?: DateTimeEntry;
}

export interface LockedSnapshot {
  sectionA?: SectionA;
  sectionB?: SectionB;
  sectionC?: SectionC;
}

export type CrimeVisitStatus = 'DRAFT' | 'SUBMITTED';

export interface CrimeVisit {
  id: string;
  referenceNo?: string;
  status: CrimeVisitStatus;
  createdAt: string;
  updatedAt: string;
  sectionA: SectionA;
  sectionB: SectionB;
  sectionC: SectionC;
  lockedSnapshot?: LockedSnapshot;
  draftAdditions?: DraftAdditions;
}

export type CrimeVisitFormData = Omit<
  CrimeVisit,
  'id' | 'status' | 'createdAt' | 'updatedAt' | 'lockedSnapshot' | 'draftAdditions'
>;

