'use client';

import type { CrimeScene, CrimeSceneFormData, CrimeSceneOfficer } from '@/types/crimeScene';

const STORAGE_KEY = 'crime_scenes';

function now(): string {
  return new Date().toISOString();
}

function generateId(): string {
  return `cs_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
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
