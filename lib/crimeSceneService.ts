'use client';

import type {
  AnalysisReportReceived,
  CourtVisitUpdateDetails,
  CrimeScene,
  CrimeSceneCourtDetails,
  CrimeSceneFormData,
  CrimeSceneOfficer,
  CvrAmendmentState,
  ProductionSentToCourtRow,
  RegistryWorkflowUpdateKind,
  SentToAnalysisRow,
} from '@/types/crimeScene';
import {
  applyPayloadToScene,
  buildCrimeScenePayloadFromForm,
} from '@/lib/crimeSceneFormMapping';
import { normalizeCvrKey } from '@/lib/crimeSceneGrouping';

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

function inferSentToCourtFlag(row: ProductionSentToCourtRow): '' | 'Yes' | 'No' {
  const s = row.sentToCourt;
  if (s === 'Yes' || s === 'No') return s;
  if (
    String(row.date ?? '').trim() ||
    String(row.courtCaseNo ?? '').trim() ||
    String(row.courtName ?? '').trim()
  ) {
    return 'Yes';
  }
  return '';
}

function inferSentToAnalysisFlag(row: SentToAnalysisRow): '' | 'Yes' | 'No' {
  const s = row.sentToAnalysis;
  if (s === 'Yes' || s === 'No') return s;
  if (
    String(row.date ?? '').trim() ||
    String(row.refNo ?? '').trim() ||
    String(row.institution ?? '').trim() ||
    String(row.institutionOtherDetail ?? '').trim()
  ) {
    return 'Yes';
  }
  return '';
}

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
        sentToCourt: hadYes || legacyDate || legacyCase ? 'Yes' : '',
        date: legacyDate,
        courtName: '',
        courtCaseNo: legacyCase,
      });
    }
    out = { ...out, productionSentToCourtRows: rows };
  } else {
    out = {
      ...out,
      productionSentToCourtRows: (out.productionSentToCourtRows ?? []).map((row) => ({
        ...row,
        sentToCourt: inferSentToCourtFlag(row),
      })),
    };
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
        sentToAnalysis: hadYes || legacyDate || legacyRef ? 'Yes' : '',
        institution: '',
        institutionOtherDetail: '',
        date: legacyDate,
        refNo: legacyRef,
      });
    }
    out = { ...out, sentToAnalysisRows: rows };
  } else {
    out = {
      ...out,
      sentToAnalysisRows: (out.sentToAnalysisRows ?? []).map((row) => ({
        ...row,
        sentToAnalysis: inferSentToAnalysisFlag(row),
      })),
    };
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

function applyRegistryWorkflowUpdateToCvrGroup(
  all: CrimeScene[],
  sceneId: string,
  kind: RegistryWorkflowUpdateKind,
  at: string,
): void {
  const idx = all.findIndex((s) => s.id === sceneId);
  if (idx === -1) return;
  const groupKey = normalizeCvrKey(all[idx]);
  for (let i = 0; i < all.length; i += 1) {
    if (normalizeCvrKey(all[i]) !== groupKey) continue;
    all[i] = { ...all[i], registryWorkflowUpdate: { kind, at } };
  }
}

/** Snapshot for diff / reject-restore — strip nested baseline to avoid bloat. */
function cloneBaselineSnapshot(scene: CrimeScene): CrimeScene {
  const a = scene.cvrAmendment;
  const amendment: CvrAmendmentState | undefined = a
    ? {
        requestStatus: a.requestStatus,
        revisionPending: false,
        baselineJson: undefined,
      }
    : undefined;
  return JSON.parse(JSON.stringify({ ...scene, cvrAmendment: amendment })) as CrimeScene;
}

export const crimeSceneService = {
  getAll(): CrimeScene[] {
    return loadAll();
  },

  getById(id: string): CrimeScene | undefined {
    return loadAll().find((scene) => scene.id === id);
  },

  /** Update analysis report fields for a submitted crime scene (by visit record id). */
  updateAnalysisReportReceived(sceneId: string, data: AnalysisReportReceived): CrimeScene | null {
    const all = loadAll();
    const idx = all.findIndex((s) => s.id === sceneId);
    if (idx === -1) return null;
    const scene = all[idx];
    const groupKey = normalizeCvrKey(scene);
    const ts = now();
    const payload = { ...data };
    let updated: CrimeScene | null = null;
    for (let i = 0; i < all.length; i += 1) {
      if (normalizeCvrKey(all[i]) !== groupKey) continue;
      const s = all[i];
      const next: CrimeScene = {
        ...s,
        analysisReportReceived: payload,
        updatedAt: ts,
        registryWorkflowUpdate: { kind: 'production_analysis', at: ts },
      };
      all[i] = next;
      if (s.id === sceneId) updated = next;
    }
    saveAll(all);
    return updated;
  },

  /**
   * Replace court / production details (same structure as create crime scene court section).
   * @param workflowKind — drives Submitted Crime Scenes “follow-up” pill (court vs analysis editor).
   */
  updateCourtDetailsProduction(
    sceneId: string,
    courtDetails: CrimeSceneCourtDetails,
    workflowKind: 'court_production' | 'production_analysis' = 'court_production',
  ): CrimeScene | null {
    const all = loadAll();
    const idx = all.findIndex((s) => s.id === sceneId);
    if (idx === -1) return null;
    const scene = all[idx];
    const normalized = normalizeCourtDetails(courtDetails) ?? courtDetails;
    const groupKey = normalizeCvrKey(scene);
    const ts = now();
    let updated: CrimeScene | null = null;
    applyRegistryWorkflowUpdateToCvrGroup(all, sceneId, workflowKind, ts);
    for (let i = 0; i < all.length; i += 1) {
      if (normalizeCvrKey(all[i]) !== groupKey) continue;
      const s = all[i];
      const next: CrimeScene = {
        ...s,
        courtDetails: normalized,
        updatedAt: ts,
      };
      all[i] = next;
      if (s.id === sceneId) updated = next;
    }
    saveAll(all);
    return updated;
  },

  /** Court visit: attending officer, date, results. */
  updateCourtVisitDetails(sceneId: string, data: CourtVisitUpdateDetails): CrimeScene | null {
    const all = loadAll();
    const idx = all.findIndex((s) => s.id === sceneId);
    if (idx === -1) return null;
    const scene = all[idx];
    const groupKey = normalizeCvrKey(scene);
    const ts = now();
    const payload = { ...data };
    let updated: CrimeScene | null = null;
    applyRegistryWorkflowUpdateToCvrGroup(all, sceneId, 'court_visit', ts);
    for (let i = 0; i < all.length; i += 1) {
      if (normalizeCvrKey(all[i]) !== groupKey) continue;
      const s = all[i];
      const next: CrimeScene = {
        ...s,
        courtVisitUpdate: payload,
        updatedAt: ts,
      };
      all[i] = next;
      if (s.id === sceneId) updated = next;
    }
    saveAll(all);
    return updated;
  },

  /** Crime scenes with a pending “may I edit?” request. */
  getPendingAmendmentRequests(): CrimeScene[] {
    return loadAll().filter((s) => s.cvrAmendment?.requestStatus === 'pending');
  },

  /** Crime scenes with submitted edits awaiting approval. */
  getPendingRevisionApprovals(): CrimeScene[] {
    return loadAll().filter((s) => s.cvrAmendment?.revisionPending === true);
  },

  /** Officer asks to amend a submitted CVR (backend will mirror). */
  requestAmendmentPermission(sceneId: string): CrimeScene | null {
    const all = loadAll();
    const idx = all.findIndex((s) => s.id === sceneId);
    if (idx === -1) return null;
    const scene = all[idx];
    if (scene.cvrAmendment?.revisionPending) return null;
    const next: CrimeScene = {
      ...scene,
      updatedAt: now(),
      cvrAmendment: {
        ...scene.cvrAmendment,
        requestStatus: 'pending',
        revisionPending: false,
        baselineJson: undefined,
      },
    };
    all[idx] = next;
    saveAll(all);
    return next;
  },

  approveAmendmentRequest(sceneId: string): CrimeScene | null {
    const all = loadAll();
    const idx = all.findIndex((s) => s.id === sceneId);
    if (idx === -1) return null;
    const scene = all[idx];
    if (scene.cvrAmendment?.requestStatus !== 'pending') return null;
    const next: CrimeScene = {
      ...scene,
      updatedAt: now(),
      cvrAmendment: {
        ...scene.cvrAmendment,
        requestStatus: 'approved',
        revisionPending: false,
        baselineJson: undefined,
      },
    };
    all[idx] = next;
    saveAll(all);
    return next;
  },

  rejectAmendmentRequest(sceneId: string): CrimeScene | null {
    const all = loadAll();
    const idx = all.findIndex((s) => s.id === sceneId);
    if (idx === -1) return null;
    const scene = all[idx];
    if (scene.cvrAmendment?.requestStatus !== 'pending') return null;
    const next: CrimeScene = {
      ...scene,
      updatedAt: now(),
      cvrAmendment: {
        ...scene.cvrAmendment,
        requestStatus: 'rejected',
        revisionPending: false,
        baselineJson: undefined,
      },
    };
    all[idx] = next;
    saveAll(all);
    return next;
  },

  /**
   * Save amended CVR and send for re-approval (stores baseline for diff).
   */
  submitRevisionForApproval(sceneId: string, form: CrimeSceneFormData): CrimeScene | null {
    const all = loadAll();
    const idx = all.findIndex((s) => s.id === sceneId);
    if (idx === -1) return null;
    const scene = all[idx];
    if (scene.cvrAmendment?.requestStatus !== 'approved' || scene.cvrAmendment.revisionPending) {
      return null;
    }
    const baselineJson = JSON.stringify(cloneBaselineSnapshot(scene));
    const payload = buildCrimeScenePayloadFromForm(form);
    const merged = applyPayloadToScene(scene, payload);
    const next: CrimeScene = {
      ...merged,
      updatedAt: now(),
      cvrAmendment: {
        requestStatus: 'approved',
        revisionPending: true,
        baselineJson,
      },
    };
    all[idx] = next;
    saveAll(all);
    return next;
  },

  approveRevision(sceneId: string): CrimeScene | null {
    const all = loadAll();
    const idx = all.findIndex((s) => s.id === sceneId);
    if (idx === -1) return null;
    const scene = all[idx];
    if (!scene.cvrAmendment?.revisionPending) return null;
    const next: CrimeScene = {
      ...scene,
      updatedAt: now(),
      cvrAmendment: {
        requestStatus: 'none',
        revisionPending: false,
        baselineJson: undefined,
      },
    };
    all[idx] = next;
    saveAll(all);
    return next;
  },

  rejectRevision(sceneId: string): CrimeScene | null {
    const all = loadAll();
    const idx = all.findIndex((s) => s.id === sceneId);
    if (idx === -1) return null;
    const scene = all[idx];
    const raw = scene.cvrAmendment?.baselineJson;
    if (!scene.cvrAmendment?.revisionPending || !raw) return null;
    const restored = JSON.parse(raw) as CrimeScene;
    const next: CrimeScene = {
      ...restored,
      id: scene.id,
      createdAt: scene.createdAt,
      updatedAt: now(),
      cvrAmendment: {
        requestStatus: 'approved',
        revisionPending: false,
        baselineJson: undefined,
      },
    };
    all[idx] = next;
    saveAll(all);
    return next;
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
      incidentDateExactlyKnown:
        data.incidentDateExactlyKnown === null ? undefined : data.incidentDateExactlyKnown,
    };

    all.push(created);
    saveAll(all);
    return created;
  },
};
