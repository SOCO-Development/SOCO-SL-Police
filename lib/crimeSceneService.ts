'use client';

import type { CrimeScene, CrimeSceneFormData } from '@/types/crimeScene';

const STORAGE_KEY = 'crime_scenes';

function now(): string {
  return new Date().toISOString();
}

function generateId(): string {
  return `cs_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function loadAll(): CrimeScene[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CrimeScene[]) : [];
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
    const cvrNo = data.visitType === 'REVISIT'
      ? (data.revisitCvrNo || data.cvrNo || '')
      : (data.cvrNo || '');

    const created: CrimeScene = {
      ...data,
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
