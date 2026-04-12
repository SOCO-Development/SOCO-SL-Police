'use client';

import type {
  CrimeScene,
  CrimeSceneCourtDetails,
  CrimeSceneFormData,
  CrimeSceneOfficer,
  ProductionSentToCourtRow,
  SentToAnalysisRow,
} from '@/types/crimeScene';

const STORAGE_KEY = 'crime_scenes';

function now(): string {
  return new Date().toISOString();
}

function generateId(): string {
  return `cs_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

type LegacyCourtDetails = CrimeSceneCourtDetails &
  Record<string, unknown> & {
    productionSentToCourt?: string;
    productionSentToCourtDate?: string;
    productionSentToCourtCaseNo?: string;
    sentToAnalysisInstitute?: string;
    sentToAnalysisInstituteDate?: string;
    analysisRefNo?: string;
  };

/** Migrate flat “sent to court / analysis” fields into repeatable rows. */
function normalizeCourtDetails(cd: CrimeSceneCourtDetails | undefined): CrimeSceneCourtDetails | undefined {
  if (!cd) return undefined;
  const r = cd as LegacyCourtDetails;
  let out: CrimeSceneCourtDetails = { ...cd };

  if (!Array.isArray(r.productionSentToCourtRows)) {
    const rows: ProductionSentToCourtRow[] = [];
    const types = (r.productionPRTypes as string[] | undefined) ?? [];
    const legacyDate = String(r.productionSentToCourtDate ?? '').trim();
    const legacyCase = String(r.productionSentToCourtCaseNo ?? '').trim();
    const hadYes = r.productionSentToCourt === 'Yes';
    if (hadYes || legacyDate || legacyCase) {
      rows.push({
        productionRef: types[0] ?? '',
        date: legacyDate,
        courtCaseNo: legacyCase,
      });
    }
    out = { ...out, productionSentToCourtRows: rows };
  }

  if (!Array.isArray(r.sentToAnalysisRows)) {
    const rows: SentToAnalysisRow[] = [];
    const types = (r.productionPRTypes as string[] | undefined) ?? [];
    const legacyDate = String(r.sentToAnalysisInstituteDate ?? '').trim();
    const legacyRef = String(r.analysisRefNo ?? '').trim();
    const hadYes = r.sentToAnalysisInstitute === 'Yes';
    if (hadYes || legacyDate || legacyRef) {
      rows.push({
        productionRef: types[0] ?? '',
        institution: '',
        institutionOtherDetail: '',
        date: legacyDate,
        refNo: legacyRef,
      });
    }
    out = { ...out, sentToAnalysisRows: rows };
  }

  return out;
}

/** Legacy records used `investigationOfficer`; normalize to `investigationOfficers`. */
function normalizeScene(raw: CrimeScene & { investigationOfficer?: CrimeSceneOfficer }): CrimeScene {
  const { investigationOfficer: legacy, ...rest } = raw;
  const list = raw.investigationOfficers?.length
    ? raw.investigationOfficers
    : legacy?.name?.trim() || legacy?.regNo?.trim() || legacy?.rank?.trim()
      ? [legacy]
      : [];
  return {
    ...rest,
    investigationOfficers: list.length ? list : undefined,
    courtDetails: normalizeCourtDetails(rest.courtDetails),
  };
}

function loadAll(): CrimeScene[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as (CrimeScene & { investigationOfficer?: CrimeSceneOfficer })[];
    return Array.isArray(parsed) ? parsed.map((row) => normalizeScene(row)) : [];
  } catch {
    return [];
  }
}

function saveAll(scenes: CrimeScene[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(scenes));
}

export const crimeSceneService = {
  getAll(): CrimeScene[] {
    return loadAll();
  },

  getById(id: string): CrimeScene | undefined {
    return loadAll().find((scene) => scene.id === id);
  },

  create(data: CrimeSceneFormData): CrimeScene {
    const all = loadAll();
    const id = generateId();
    const cvrNo =
      data.visitType === 'REVISIT' || data.visitType === 'COURT_VISIT'
        ? (data.revisitCvrNo || data.cvrNo || '')
        : (data.cvrNo || '');

    const inv = (data.investigationOfficers ?? []).filter(
      (o) => o.name?.trim() || o.regNo?.trim() || o.rank?.trim()
    );

    const created: CrimeScene = {
      ...data,
      investigationOfficers: inv.length ? inv : undefined,
      id,
      cvrNo,
      createdAt: now(),
      updatedAt: now(),
    };

    all.push(created);
    saveAll(all);
    return created;
  },
};
