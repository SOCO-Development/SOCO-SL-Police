const KEYS = {
  accessToken: 'soco_accessToken',
  refreshToken: 'soco_refreshToken',
  expiresAt: 'soco_expiresAt',
  username: 'soco_username',
  isAuthenticated: 'isAuthenticated',
  authTimestamp: 'authTimestamp',
  userDisplayName: 'soco_userDisplayName',
  userDesignation: 'soco_userDesignation',
} as const;

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  username: string;
}

function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

export function getAccessToken(): string | null {
  if (!isBrowser()) return null;
  return localStorage.getItem(KEYS.accessToken);
}

export function getRefreshToken(): string | null {
  if (!isBrowser()) return null;
  return localStorage.getItem(KEYS.refreshToken);
}

export function getUsername(): string | null {
  if (!isBrowser()) return null;
  return localStorage.getItem(KEYS.username);
}

export function getExpiresAt(): string | null {
  if (!isBrowser()) return null;
  return localStorage.getItem(KEYS.expiresAt);
}

export function saveAuthSession(session: AuthSession): void {
  if (!isBrowser()) return;
  localStorage.setItem(KEYS.accessToken, session.accessToken);
  localStorage.setItem(KEYS.refreshToken, session.refreshToken);
  localStorage.setItem(KEYS.expiresAt, session.expiresAt);
  localStorage.setItem(KEYS.username, session.username);
  localStorage.setItem(KEYS.isAuthenticated, 'true');
  localStorage.setItem(KEYS.authTimestamp, Date.now().toString());
}

export function updateAccessToken(accessToken: string, expiresAt: string): void {
  if (!isBrowser()) return;
  localStorage.setItem(KEYS.accessToken, accessToken);
  localStorage.setItem(KEYS.expiresAt, expiresAt);
  localStorage.setItem(KEYS.authTimestamp, Date.now().toString());
}

export function clearAuthSession(): void {
  if (!isBrowser()) return;
  Object.values(KEYS).forEach((key) => localStorage.removeItem(key));
}

export function saveUserDisplayInfo(displayName: string, designation: string): void {
  if (!isBrowser()) return;
  localStorage.setItem(KEYS.userDisplayName, displayName);
  localStorage.setItem(KEYS.userDesignation, designation);
}

export function getUserDisplayName(): string | null {
  if (!isBrowser()) return null;
  return localStorage.getItem(KEYS.userDisplayName);
}

export function getUserDesignation(): string | null {
  if (!isBrowser()) return null;
  return localStorage.getItem(KEYS.userDesignation);
}

// Local session lifetime. We intentionally do NOT compare the backend's
// `expiresAt` against the browser clock here, because server/client clock skew
// can make a freshly issued token look already-expired and bounce the user back
// to login. Actual access-token expiry is enforced by the backend (401 → the
// API client refreshes the token). This window is measured from the local login
// (or last refresh) timestamp, so it is immune to clock differences.
const SESSION_MAX_AGE_MS = 12 * 60 * 60 * 1000; // 12 hours

export function isSessionExpired(): boolean {
  if (!isBrowser()) return true;
  const ts = localStorage.getItem(KEYS.authTimestamp);
  if (!ts) return true;
  const startedAt = parseInt(ts, 10);
  if (Number.isNaN(startedAt)) return true;
  return Date.now() - startedAt >= SESSION_MAX_AGE_MS;
}

export function isAuthenticated(): boolean {
  if (!isBrowser()) return false;
  const flag = localStorage.getItem(KEYS.isAuthenticated) === 'true';
  const username = getUsername();
  const token = getAccessToken();
  return Boolean(flag && username && username.trim() !== '' && token && !isSessionExpired());
}
