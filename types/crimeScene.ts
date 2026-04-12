export type CrimeSceneVisitType = 'NEW_VISIT' | 'REVISIT' | 'COURT_VISIT';

/** New crime scene only: initiated visit + new CVR text (not selecting an existing CVR). */
export function crimeSceneUsesNewVisitFields(visitType: CrimeSceneVisitType): boolean {
  return visitType === 'NEW_VISIT';
}

/** Revisit and court visit (for now): pick an existing CVR like revisit. */
export function crimeSceneUsesRevisitFields(visitType: CrimeSceneVisitType): boolean {
  return visitType === 'REVISIT' || visitType === 'COURT_VISIT';
}

export interface CrimeSceneOfficer {
  name: string;
  regNo?: string;
  rank?: string;
  teamRole?: string;
  teamRoleOther?: string;
  socoRole?: string;
}

export interface SpecialistTeamMember {
  name: string;
  role: string;
}

export interface CrimeSceneSpecialistTeam {
  role: string;
  specialist?: string;
  teamMembers?: string;
  inTime?: string;
  outTime?: string;
  members?: SpecialistTeamMember[];
}

export interface CrimeSceneDateTime {
  date: string;
  time: string;
}

/** One production item sent to court (repeatable). */
export interface ProductionSentToCourtRow {
  /** Value from Production (P.R.) selection. */
  productionRef: string;
  date?: string;
  courtCaseNo?: string;
}

/** One production sent to an analysis institute (repeatable). */
export interface SentToAnalysisRow {
  productionRef: string;
  institution?: string;
  /** When institution is Others — free text. */
  institutionOtherDetail?: string;
  date?: string;
  refNo?: string;
}

export function emptyProductionSentToCourtRow(): ProductionSentToCourtRow {
  return { productionRef: '', date: '', courtCaseNo: '' };
}

export function emptySentToAnalysisRow(): SentToAnalysisRow {
  return { productionRef: '', institution: '', institutionOtherDetail: '', date: '', refNo: '' };
}

/** Court / production tracking for samples from the scene (hair, blood, fingerprints, etc.). */
export interface CrimeSceneCourtDetails {
  /** Optional at initial submission — selected from court list. */
  courtName?: string;
  /** Optional at initial submission — typed case reference. */
  courtCaseNo?: string;
  productionPR?: '' | 'Yes' | 'No';
  /** When Production (P.R.) is Yes — multi-select item values. */
  productionPRTypes?: string[];
  /** Free text when “Others” is included in productionPRTypes. */
  productionPROtherDetail?: string;
  /** Per-production: sent to court with date & case no. */
  productionSentToCourtRows?: ProductionSentToCourtRow[];
  /** Per-production: analysis institute, date, ref. */
  sentToAnalysisRows?: SentToAnalysisRow[];
}

export function emptyCrimeSceneCourtDetails(): CrimeSceneCourtDetails {
  return {
    courtName: '',
    courtCaseNo: '',
    productionPR: '',
    productionPRTypes: [],
    productionPROtherDetail: '',
    productionSentToCourtRows: [],
    sentToAnalysisRows: [],
  };
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
  offence: {};
  offenceType: string;
  offenceTypeOther?: string;
  placeOfCrimeScene: string;
  /** House, Institutions, Buildings, Shop, Highway, Others — use crimeSceneTypeOther when Others. */
  crimeSceneType?: string;
  crimeSceneTypeOther?: string;
  /** Exactly known date & time when the incident occurred (single moment). */
  incidentKnown?: CrimeSceneDateTime;
  /** Duration / period — start (date & time). */
  incidentFrom?: CrimeSceneDateTime;
  /** Duration / period — end (date & time). */
  incidentTo?: CrimeSceneDateTime;

  inChargeOfficer: CrimeSceneOfficer;
  socoOfficers: CrimeSceneOfficer[];
  specialistTeams: CrimeSceneSpecialistTeam[];

  investigationOfficers?: CrimeSceneOfficer[];
  sceneGuards?: CrimeSceneOfficer[];

  photoZipName?: string;
  sketchFileName?: string;
  reportFileName?: string;

  courtDetails?: CrimeSceneCourtDetails;

  /**
   * CVR amendment workflow (client-side until backend; fields mirror expected API).
   * - requestStatus: officer asks to edit a submitted CVR; approver grants "approved".
   * - revisionPending: edited CVR submitted and awaits approval; baselineJson holds prior approved copy.
   */
  cvrAmendment?: CvrAmendmentState;

  createdAt: string;
  updatedAt: string;
}

export interface CvrAmendmentState {
  requestStatus: 'none' | 'pending' | 'approved' | 'rejected';
  revisionPending?: boolean;
  baselineJson?: string;
}

export interface CrimeSceneFormData extends Omit<CrimeScene, 'id' | 'createdAt' | 'updatedAt' | 'cvrNo' | 'cvrAmendment'> {
  cvrNo?: string;
}
