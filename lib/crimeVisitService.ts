'use client';

import type { CrimeVisit, CrimeVisitFormData, LockedSnapshot, DraftAdditions } from '@/types/crimeVisit';

const STORAGE_KEY = 'crime_visits';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function generateId(): string {
    return `cv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function generateRef(id: string): string {
    const seq = id.split('_')[1] ?? Date.now().toString();
    return `${new Date().getFullYear()}-${seq.slice(-6)}`;
}

function now(): string {
    return new Date().toISOString();
}

function loadAll(): CrimeVisit[] {
    if (typeof window === 'undefined') return [];
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? (JSON.parse(raw) as CrimeVisit[]) : [];
    } catch {
        return [];
    }
}

function saveAll(visits: CrimeVisit[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(visits));
}

// ─── Public API ───────────────────────────────────────────────────────────────

export const crimeVisitService = {
    /** Retrieve all crime visits */
    getAll(): CrimeVisit[] {
        return loadAll();
    },

    /** Retrieve only drafts */
    getDrafts(): CrimeVisit[] {
        return loadAll().filter((v) => v.status === 'DRAFT');
    },

    /** Retrieve only submitted visits */
    getSubmitted(): CrimeVisit[] {
        return loadAll().filter((v) => v.status === 'SUBMITTED');
    },

    /** Retrieve by id */
    getById(id: string): CrimeVisit | undefined {
        return loadAll().find((v) => v.id === id);
    },

    /**
     * Create a brand-new draft.
     * Returns the created record.
     */
    createDraft(data: CrimeVisitFormData): CrimeVisit {
        const all = loadAll();
        const id = generateId();
        const visit: CrimeVisit = {
            ...data,
            id,
            referenceNo: generateRef(id),
            status: 'DRAFT',
            createdAt: now(),
            updatedAt: now(),
            lockedSnapshot: {
                sectionA: data.sectionA,
                sectionB: data.sectionB,
                sectionC: data.sectionC,
            },
            draftAdditions: {},
        };
        all.push(visit);
        saveAll(all);
        return visit;
    },

    /**
     * Update an existing draft (append-only semantics).
     * Merges draftAdditions into the record and refreshes lockedSnapshot.
     */
    updateDraft(id: string, additions: DraftAdditions): CrimeVisit | null {
        const all = loadAll();
        const idx = all.findIndex((v) => v.id === id);
        if (idx === -1) return null;

        const visit = all[idx];
        if (visit.status !== 'DRAFT') return null;

        // Merge draftAdditions experts into sectionB.experts
        const existingExperts = visit.sectionB?.experts ?? [];
        const newExperts = additions.experts ?? [];
        const mergedExperts = [...existingExperts, ...newExperts];

        const updated: CrimeVisit = {
            ...visit,
            sectionA: {
                ...visit.sectionA,
                ...(additions.in ? { in: additions.in } : {})
            },
            sectionB: {
                ...visit.sectionB,
                experts: mergedExperts,
            },
            updatedAt: now(),
            draftAdditions: {},
            lockedSnapshot: {
                sectionA: {
                    ...visit.sectionA,
                    ...(additions.in ? { in: additions.in } : {})
                },
                sectionB: { ...visit.sectionB, experts: mergedExperts },
                sectionC: visit.sectionC,
            },
        };

        all[idx] = updated;
        saveAll(all);
        return updated;
    },

    /**
     * Submit a draft → status becomes SUBMITTED (locked).
     */
    submit(id: string): CrimeVisit | null {
        const all = loadAll();
        const idx = all.findIndex((v) => v.id === id);
        if (idx === -1) return null;

        const visit = all[idx];
        const updated: CrimeVisit = {
            ...visit,
            status: 'SUBMITTED',
            updatedAt: now(),
        };
        all[idx] = updated;
        saveAll(all);
        return updated;
    },

    /**
     * Create a new visit directly with SUBMITTED status (no draft step).
     */
    createSubmitted(data: CrimeVisitFormData): CrimeVisit {
        const all = loadAll();
        const id = generateId();
        const visit: CrimeVisit = {
            ...data,
            id,
            referenceNo: generateRef(id),
            status: 'SUBMITTED',
            createdAt: now(),
            updatedAt: now(),
        };
        all.push(visit);
        saveAll(all);
        return visit;
    },

    /**
     * Save the IN time (and optionally OUT time) back to a visit record.
     * Works on both DRAFT and SUBMITTED visits.
     */
    updateVisitInOut(id: string, patch: { in?: import('@/types/crimeVisit').DateTimeEntry; out?: import('@/types/crimeVisit').DateTimeEntry }): CrimeVisit | null {
        const all = loadAll();
        const idx = all.findIndex((v) => v.id === id);
        if (idx === -1) return null;
        const visit = all[idx];
        const updated: CrimeVisit = {
            ...visit,
            sectionA: {
                ...visit.sectionA,
                ...(patch.in !== undefined ? { in: patch.in } : {}),
                ...(patch.out !== undefined ? { out: patch.out } : {}),
            },
            updatedAt: now(),
        };
        all[idx] = updated;
        saveAll(all);
        return updated;
    },

    /** Delete by id (drafts only in UI, but service allows any) */
    delete(id: string): boolean {        const all = loadAll();
        const next = all.filter((v) => v.id !== id);
        if (next.length === all.length) return false;
        saveAll(next);
        return true;
    },
};
