import { API_BASE_URL } from './config';
import {
  clearAuthSession,
  getAccessToken,
  getRefreshToken,
  getUsername,
  updateAccessToken,
} from './authStorage';
import type { ApiResponse, RefreshData } from './types';

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly apiResponse?: ApiResponse<unknown>,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  params?: Record<string, string | number | boolean | undefined | null>;
  auth?: boolean;
  /** Internal flag to avoid infinite refresh loops. */
  _retried?: boolean;
  /** Send body as FormData (skips JSON stringify and Content-Type header). */
  formData?: boolean;
};

function buildUrl(path: string, params?: RequestOptions['params']): string {
  const normalizedPath = path.startsWith('/') ? path.slice(1) : path;
  const base = API_BASE_URL.replace(/\/+$/, '');

  let url: string;
  if (base.startsWith('http://') || base.startsWith('https://')) {
    url = `${base}/${normalizedPath}`;
  } else {
    const prefix = base.startsWith('/') ? base : `/${base}`;
    url = `${prefix}/${normalizedPath}`;
  }

  if (params) {
    const search = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        search.set(key, String(value));
      }
    });
    const qs = search.toString();
    if (qs) url += `?${qs}`;
  }

  return url;
}

function getErrorMessage<T>(response: ApiResponse<T>): string {
  return (
    response.errorMessage ??
    response.errorShow ??
    response.exceptionDetail ??
    'Request failed'
  );
}

async function refreshAccessToken(): Promise<boolean> {
  const username = getUsername();
  const refreshToken = getRefreshToken();
  if (!username || !refreshToken) return false;

  try {
    const res = await fetch(buildUrl('Auth/Refresh'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, refreshToken }),
    });

    const json = (await res.json()) as ApiResponse<RefreshData>;
    if (!res.ok || !json.isSuccess || !json.dataBundle?.accessToken) {
      return false;
    }

    updateAccessToken(json.dataBundle.accessToken, json.dataBundle.expiresAt);
    return true;
  } catch {
    return false;
  }
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { method = 'GET', body, params, auth = true, _retried = false, formData = false } = options;

  const headers: Record<string, string> = {};
  if (!formData) {
    headers['Content-Type'] = 'application/json';
  }

  if (auth) {
    const token = getAccessToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(buildUrl(path, params), {
    method,
    headers,
    body: formData ? (body as FormData) : body !== undefined ? JSON.stringify(body) : undefined,
  });

  let json: ApiResponse<T>;
  try {
    json = (await res.json()) as ApiResponse<T>;
  } catch {
    throw new ApiError(`Invalid response from server (${res.status})`, res.status);
  }

  if (res.status === 401 && auth && !_retried) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      return apiRequest<T>(path, { ...options, _retried: true });
    }
    clearAuthSession();
    throw new ApiError('Session expired. Please log in again.', 401, json);
  }

  if (!res.ok || !json.isSuccess) {
    console.error(`API Error [${res.status}] ${path}:`, JSON.stringify(json, null, 2));
    throw new ApiError(getErrorMessage(json), res.status, json);
  }

  return json.dataBundle;
}
