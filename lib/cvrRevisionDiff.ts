import type { CrimeScene } from '@/types/crimeScene';

const META_KEYS = new Set(['id', 'createdAt', 'updatedAt', 'cvrAmendment']);

/** Flatten nested objects/arrays to dot paths for readable diff rows. */
export function flattenForDiff(obj: unknown, prefix = ''): Record<string, string> {
  if (obj === null || obj === undefined) {
    return prefix ? { [prefix]: '' } : {};
  }
  if (typeof obj !== 'object') {
    return { [prefix]: String(obj) };
  }
  if (Array.isArray(obj)) {
    if (obj.length === 0) return { [prefix]: '[]' };
    const out: Record<string, string> = {};
    obj.forEach((item, i) => {
      const p = prefix ? `${prefix}[${i}]` : `[${i}]`;
      Object.assign(out, flattenForDiff(item, p));
    });
    return out;
  }
  const o = obj as Record<string, unknown>;
  const keys = Object.keys(o).filter((k) => !META_KEYS.has(k));
  if (keys.length === 0) return {};
  const out: Record<string, string> = {};
  for (const k of keys) {
    const p = prefix ? `${prefix}.${k}` : k;
    const v = o[k];
    if (v !== null && typeof v === 'object' && !Array.isArray(v) && Object.keys(v as object).length === 0) {
      out[p] = '{}';
    } else if (v !== null && typeof v === 'object') {
      Object.assign(out, flattenForDiff(v, p));
    } else {
      out[p] = v === undefined || v === null ? '' : String(v);
    }
  }
  return out;
}

export interface DiffRow {
  path: string;
  before: string;
  after: string;
}

export function diffCrimeScenes(before: CrimeScene, after: CrimeScene): DiffRow[] {
  const a = flattenForDiff(before);
  const b = flattenForDiff(after);
  const paths = new Set([...Object.keys(a), ...Object.keys(b)]);
  const rows: DiffRow[] = [];
  for (const path of Array.from(paths).sort()) {
    const av = a[path] ?? '';
    const bv = b[path] ?? '';
    if (av !== bv) {
      rows.push({ path, before: av, after: bv });
    }
  }
  return rows;
}
