import { getNextBasePath } from '@/lib/publicAsset';

/**
 * Must use a direct `process.env.NEXT_PUBLIC_*` reference so Next.js
 * inlines the value into the client bundle at build/dev time.
 *
 * Use a relative path (e.g. /soco-api) so the browser calls the same origin;
 * the dev proxy or IIS forwards to the real backend (avoids CORS).
 */
const raw = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();

const DEV_DEFAULT = '/soco-api';

if (!raw) {
  if (process.env.NODE_ENV !== 'production') {
    console.warn(
      `[SOCO] NEXT_PUBLIC_API_BASE_URL is not set — using ${DEV_DEFAULT}. Copy .env.example to .env.local.`,
    );
  } else {
    throw new Error(
      'NEXT_PUBLIC_API_BASE_URL is not set. Copy .env.example to .env.local and configure the API base URL.',
    );
  }
}

const basePath = getNextBasePath() ?? '';
const normalized = (raw || DEV_DEFAULT).replace(/\/+$/, '');

/** SOCO API path used by the browser (no trailing slash). */
export const API_BASE_URL =
  normalized.startsWith('http://') || normalized.startsWith('https://')
    ? normalized
    : `${basePath}${normalized.startsWith('/') ? normalized : `/${normalized}`}`.replace(/\/+$/, '') || normalized;
