export type CrimeSceneVisitType = 'NEW_VISIT' | 'REVISIT' | 'COURT_VISIT';

/** Saved from Update Court Details or Production Analysis (shared CVR data), for Submitted list highlighting. */
export type RegistryWorkflowUpdateKind =
  | 'court_production'
  | 'court_visit'
  | 'court_rewards'
  | 'production_analysis';

export interface RegistryWorkflowUpdate {
  kind: RegistryWorkflowUpdateKind;
  /** ISO timestamp when the workflow save occurred. */
  at: string;
}

export interface RegistryWorkflowDisplayEntry extends RegistryWorkflowUpdate {
  label: string;
  title: string;
  pillClass: string;
}

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

/** Laboratory / annex analysis outcome (update investigation details). */
export type AnalysisReportResult =
  | 'Positive'
  | 'Negative'
  | 'Insufficient'
  | 'Destruction of Evidence'
  | 'Other';

/** Analysis report received for a visit record (editable via Production analysis). */
export interface AnalysisReportReceived {
  /** Whether the laboratory has returned an analysis report for items sent from this visit. */
  labReportReceived?: '' | 'Yes' | 'No';
  annexRef: string;
  /** Date (DD/MM/YY) from date picker. */
  date: string;
  resultReceived: AnalysisReportResult | '';
  /** When result is Other. */
  resultOtherDetail?: string;
}

export function emptyAnalysisReportReceived(): AnalysisReportReceived {
  return { labReportReceived: '', annexRef: '', date: '', resultReceived: '', resultOtherDetail: '' };
}

/**
 * One court attendance row — SOC officer court visit (repeatable) from Update court details → Court visit.
 */
export interface CourtVisitOfficerDetailRow {
  /** Officer who testified (free text). */
  testifiedOfficer: string;
  /** Date of this court visit (DD/MM/YY from date picker). */
  visitDate: string;
  /** Stable key from officer dropdown (JSON with role, name, reg). */
  officerKey: string;
  officerName?: string;
  officerRegNo?: string;
  officerRoleLabel?: string;
  /** Narrative for this visit. */
  visitDescription: string;
  nextCourtDate?: string;
  attachmentFileName?: string;
  /** Data URL for client-side persistence (optional; may be large). */
  attachmentDataUrl?: string;
}

export function emptyCourtVisitOfficerDetailRow(): CourtVisitOfficerDetailRow {
  return {
    testifiedOfficer: '',
    visitDate: '',
    officerKey: '',
    officerName: '',
    officerRegNo: '',
    officerRoleLabel: '',
    visitDescription: '',
    nextCourtDate: '',
    attachmentFileName: '',
    attachmentDataUrl: '',
  };
}

/** Court visit book — multiple officer visit rows. */
export interface CourtVisitUpdateDetails {
  rows: CourtVisitOfficerDetailRow[];
}

export type CourtRewardCategoryKey = 'police' | 'dcrd' | 'division';

export interface CourtRewardCategoryState {
  enabled: boolean;
  /** Reward type ids starred for this category (money, salary_increment, commendation). */
  starredIds: string[];
}

/** Court rewards — maintained from Update court details → Rewards. */
export interface CourtRewardsUpdateDetails {
  rewardsEnabled: '' | 'Yes' | 'No';
  categories: Record<CourtRewardCategoryKey, CourtRewardCategoryState>;
}

export function emptyCourtRewardsUpdate(): CourtRewardsUpdateDetails {
  return {
    rewardsEnabled: '',
    categories: {
      police: { enabled: true, starredIds: [] },
      dcrd: { enabled: true, starredIds: [] },
      division: { enabled: true, starredIds: [] },
    },
  };
}

function toRewardTypeIdArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string');
}

function normalizeRewardCategory(
  raw: CourtRewardCategoryState | undefined,
): CourtRewardCategoryState {
  return {
    enabled: raw?.enabled !== false,
    starredIds: toRewardTypeIdArray(raw?.starredIds),
  };
}

export function normalizeCourtRewardsUpdate(
  raw: CourtRewardsUpdateDetails | undefined | null,
): CourtRewardsUpdateDetails {
  if (!raw) return emptyCourtRewardsUpdate();
  return {
    rewardsEnabled: raw.rewardsEnabled === 'Yes' || raw.rewardsEnabled === 'No' ? raw.rewardsEnabled : '',
    categories: {
      police: normalizeRewardCategory(raw.categories?.police),
      dcrd: normalizeRewardCategory(raw.categories?.dcrd),
      division: normalizeRewardCategory(raw.categories?.division),
    },
  };
}

export function courtRewardsUpdateHasDisplayableData(
  raw: CourtRewardsUpdateDetails | undefined | null,
): boolean {
  const data = normalizeCourtRewardsUpdate(raw);
  if (data.rewardsEnabled === 'Yes' || data.rewardsEnabled === 'No') return true;
  return Object.values(data.categories).some((c) => c.starredIds.length > 0);
}

/** @internal Legacy single-record shape before rows[] (kept for migration from stored JSON). */
export type LegacyCourtVisitUpdateDetails = {
  officerKey?: string;
  officerName?: string;
  officerRegNo?: string;
  officerRoleLabel?: string;
  visitDate?: string;
  resultReceived?: AnalysisReportResult | '';
  resultOtherDetail?: string;
};

function formatLegacyResultLine(r: LegacyCourtVisitUpdateDetails): string {
  const res = r.resultReceived?.trim();
  if (!res) return '';
  if (res === 'Other' && r.resultOtherDetail?.trim()) {
    return `Result: Other — ${r.resultOtherDetail.trim()}`;
  }
  return `Result: ${res}`;
}

/** Map stored data (new `rows` or legacy single form) to `{ rows }`. */
export function normalizeCourtVisitUpdate(
  raw: CourtVisitUpdateDetails | LegacyCourtVisitUpdateDetails | undefined | null,
): CourtVisitUpdateDetails {
  if (!raw) return { rows: [] };
  if ('rows' in raw && Array.isArray((raw as CourtVisitUpdateDetails).rows)) {
    const list = (raw as CourtVisitUpdateDetails).rows;
    return {
      rows: (list ?? []).map((r) => ({
        ...emptyCourtVisitOfficerDetailRow(),
        ...r,
      })),
    };
  }
  const legacy = raw as LegacyCourtVisitUpdateDetails;
  const hasLegacy = Boolean(
    legacy.officerKey?.trim() ||
      legacy.visitDate?.trim() ||
      legacy.resultReceived ||
      legacy.officerName?.trim() ||
      legacy.resultOtherDetail?.trim(),
  );
  if (!hasLegacy) return { rows: [] };
  const desc = formatLegacyResultLine(legacy);
  return {
    rows: [
      {
        ...emptyCourtVisitOfficerDetailRow(),
        visitDate: legacy.visitDate ?? '',
        officerKey: legacy.officerKey ?? '',
        officerName: legacy.officerName,
        officerRegNo: legacy.officerRegNo,
        officerRoleLabel: legacy.officerRoleLabel,
        visitDescription: desc || '— Migrated from previous court visit record —',
      },
    ],
  };
}

export function emptyCourtVisitUpdate(): CourtVisitUpdateDetails {
  return { rows: [] };
}

/** True if any row has data worth showing (after normalization / migration). */
export function courtVisitUpdateHasDisplayableData(
  raw: CourtVisitUpdateDetails | LegacyCourtVisitUpdateDetails | undefined | null,
): boolean {
  const { rows } = normalizeCourtVisitUpdate(raw);
  return rows.some(
    (r) =>
      r.testifiedOfficer?.trim() ||
      r.visitDate?.trim() ||
      r.officerKey?.trim() ||
      r.visitDescription?.trim() ||
      r.nextCourtDate?.trim() ||
      r.attachmentFileName?.trim() ||
      r.officerName?.trim(),
  );
}

/** One production item sent to court (repeatable). */
export interface ProductionSentToCourtRow {
  /** Value from Production Availability selection. */
  productionRef: string;
  productionSentCourtId?: number;
  /** Whether this production was sent to court; if Yes, date is required; court name and case no. are optional. */
  sentToCourt?: '' | 'Yes' | 'No';
  date?: string;
  /** Optional — from court list when sent to court is Yes. */
  courtName?: string;
  /** Optional case reference when sent to court is Yes. */
  courtCaseNo?: string;
  /** Attachment: දිවුරුම් ප්‍රකාශය (Sworn Statement) */
  divurumaFileName?: string;
  divurumaDataUrl?: string;
  /** Attachment: ප්‍රශ්ණාවලිය (Questionnaire) */
  prashnavalyaFileName?: string;
  prashnavalyaDataUrl?: string;
}

/** One production sent to an analysis institute (repeatable). */
export interface SentToAnalysisRow {
  productionRef: string;
  productionSentAnalysisId?: number;
  /** Whether this production was sent for analysis; if Yes, institute, date, etc. apply. */
  sentToAnalysis?: '' | 'Yes' | 'No';
  institution?: string;
  /** When institution is Others — free text. */
  institutionOtherDetail?: string;
  date?: string;
  refNo?: string;
  /** Result received from the analysis institute. */
  resultReceived?: 'Positive' | 'Negative' | '';
  /** Reason when resultReceived is Negative. */
  resultNegativeReason?: 'Insufficient' | 'Destruction of Evidence' | 'Other' | '';
  /** Free text when resultNegativeReason is Other. */
  resultNegativeOtherDetail?: string;
  /** Attachment file name for this production's analysis result. */
  attachmentFileName?: string;
  /** Data URL for client-side persistence. */
  attachmentDataUrl?: string;
}

export function emptyProductionSentToCourtRow(): ProductionSentToCourtRow {
  return {
    productionRef: '',
    sentToCourt: '',
    date: '',
    courtName: '',
    courtCaseNo: '',
    divurumaFileName: '',
    divurumaDataUrl: '',
    prashnavalyaFileName: '',
    prashnavalyaDataUrl: '',
  };
}

export function emptySentToAnalysisRow(): SentToAnalysisRow {
  return {
    productionRef: '',
    sentToAnalysis: '',
    institution: '',
    institutionOtherDetail: '',
    date: '',
    refNo: '',
    resultReceived: '',
    resultNegativeReason: '',
    resultNegativeOtherDetail: '',
    attachmentFileName: '',
    attachmentDataUrl: '',
  };
}

/** Court / production tracking for samples from the scene (hair, blood, fingerprints, etc.). */
export interface CrimeSceneCourtDetails {
  /** Optional at initial submission — selected from court list. */
  courtName?: string;
  /** Optional at initial submission — typed case reference. */
  courtCaseNo?: string;
  /** Optional at initial submission — typed B number. */
  bNumber?: string;
  productionPR?: '' | 'Yes' | 'No';
  /** When Production Availability is Yes — multi-select item values. */
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
    bNumber: '',
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
  cvrId?: string | number;
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
  /** House, Institutions, Buildings, Shop, Highway, Beach, Ground, Forest, Canal, Vehicles, Aircraft, Ships, Train, Mines, Others — use crimeSceneTypeOther when Others. */
  crimeSceneType?: string;
  crimeSceneTypeOther?: string;
  /** If true, only incidentKnown is used; if false, only From/To range; omit for legacy records (both used). */
  incidentDateExactlyKnown?: boolean;
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

  /** Analysis reports received (annex, date, result) — maintained from Production analysis. */
  analysisReportReceived?: AnalysisReportReceived;

  /** Court visit attendance / outcome — maintained from Update court details → Court visit. */
  courtVisitUpdate?: CourtVisitUpdateDetails;

  /** Court rewards nominations — maintained from Update court details → Rewards. */
  courtRewardsUpdate?: CourtRewardsUpdateDetails;

  courtDetails?: CrimeSceneCourtDetails;

  /**
   * CVR amendment workflow (client-side until backend; fields mirror expected API).
   * - requestStatus: officer asks to edit a submitted CVR; approver grants "approved".
   * - revisionPending: edited CVR submitted and awaits approval; baselineJson holds prior approved copy.
   */
  cvrAmendment?: CvrAmendmentState;

  /** Last registry workflow save touching this visit row (same CVR rows are updated together). */
  registryWorkflowUpdate?: RegistryWorkflowUpdate;

  /** All registry workflow saves touching this visit row (same CVR rows are updated together). */
  registryWorkflowUpdates?: RegistryWorkflowUpdate[];

  approval_status?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CvrAmendmentState {
  requestStatus: 'none' | 'pending' | 'approved' | 'rejected';
  revisionPending?: boolean;
  baselineJson?: string;
}

export interface CrimeSceneFormData extends Omit<
  CrimeScene,
  'id' | 'createdAt' | 'updatedAt' | 'cvrNo' | 'cvrAmendment' | 'incidentDateExactlyKnown'
> {
  cvrNo?: string;
  /** true = exact moment only; false = duration range only; null = legacy (show & validate both). */
  incidentDateExactlyKnown?: boolean | null;
}
