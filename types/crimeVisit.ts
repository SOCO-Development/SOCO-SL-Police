// ─── Shared sub-types ─────────────────────────────────────────────────────────

export interface OfficerInfo {
    rank?: string;
    regNo?: string;
    name?: string;
}

export interface DateTimeEntry {
    date?: string;   // DD/MM/YY
    time?: string;   // HH:MM
    page?: string;
    para?: string;
}

export interface Expert {
    annex?: string;  // e.g. "Annex 20"
    name?: string;
    inTime?: string;
    outTime?: string;
}

// ─── Sections ────────────────────────────────────────────────────────────────

export interface SectionA {
    reportedToSocoLab?: DateTimeEntry;
    out?: DateTimeEntry;
    in?: DateTimeEntry;
    revisitOut?: DateTimeEntry;
    revisitIn?: DateTimeEntry;
}

export interface SectionB {
    socoOfficers?: {
        inCharge?: OfficerInfo;
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
    driver?: OfficerInfo;
    examinedBySocoOfficers?: { date?: string; timeIn?: string; timeOut?: string };
    reExaminedBySocoOfficers?: { date?: string; timeIn?: string; timeOut?: string };
    investigationOfficer?: OfficerInfo;
    reAssignedCaseOfficer?: OfficerInfo;
    sceneGuard?: OfficerInfo;
}

// ─── Draft additions (append-only layer) ─────────────────────────────────────

export interface DraftAdditions {
    experts?: Expert[];
}

// ─── Locked snapshot (read-only layer for draft editing) ─────────────────────

export interface LockedSnapshot {
    sectionA?: SectionA;
    sectionB?: SectionB;
    sectionC?: SectionC;
}

// ─── Root type ───────────────────────────────────────────────────────────────

export type CrimeVisitStatus = 'DRAFT' | 'SUBMITTED';

export interface CrimeVisit {
    id: string;
    referenceNo?: string;
    status: CrimeVisitStatus;
    createdAt: string;   // ISO
    updatedAt: string;   // ISO

    sectionA: SectionA;
    sectionB: SectionB;
    sectionC: SectionC;

    /** Snapshot of data at last save — rendered as read-only in draft editing */
    lockedSnapshot?: LockedSnapshot;

    /** New rows appended while editing a draft before the next save */
    draftAdditions?: DraftAdditions;
}

// ─── Form-local type (mirrors CrimeVisit but all fields optional for partial saves) ─

export type CrimeVisitFormData = Omit<CrimeVisit, 'id' | 'status' | 'createdAt' | 'updatedAt' | 'lockedSnapshot' | 'draftAdditions'>;
