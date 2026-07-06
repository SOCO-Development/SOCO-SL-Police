import { apiRequest } from './client';
import type { UserRank, UserDesignation, CurrentUserInfo } from './types';

/**
 * Fetch all user ranks from the system (SOCO_UC1)
 * Returns array of rank IDs and names
 */
export async function getUserRanks(): Promise<UserRank[]> {
  try {
    return await apiRequest<UserRank[]>('User/GetUserRanks');
  } catch {
    // Endpoint may not exist on backend — return empty array
    return [];
  }
}

/**
 * Fetch all user designations from the system (SOCO_UC2)
 * Returns array of designation IDs and names
 */
export async function getAllDesignations(): Promise<UserDesignation[]> {
  try {
    return await apiRequest<UserDesignation[]>('User/GetAllDesignations');
  } catch {
    // Return standard fallback designations if the API fails
    return [
      { USER_DESIGNATION_ID: '1', USER_DESIGNATION_NAME: 'OIC' },
      { USER_DESIGNATION_ID: '5', USER_DESIGNATION_NAME: 'Acting OIC' },
      { USER_DESIGNATION_ID: '6', USER_DESIGNATION_NAME: 'Soco Officer' },
      { USER_DESIGNATION_ID: '7', USER_DESIGNATION_NAME: 'Soco Admin' },
      { USER_DESIGNATION_ID: '8', USER_DESIGNATION_NAME: 'System Admin' },
    ];
  }
}

/**
 * Get current logged-in user info (SOCO_U3)
 * Returns calling name, designation name, and profile image URL
 */
export async function getCurrentUserInfo(): Promise<CurrentUserInfo> {
  return apiRequest<CurrentUserInfo>('User/GetCurrentUserInfo');
}

/**
 * Fetch a single rank by ID (User/GetUserRankById)
 * Returns the rank details or null if not found.
 */
export async function getUserRankById(rankId: string): Promise<UserRank | null> {
  try {
    const result = await apiRequest<unknown>(`User/GetUserRankById?rankId=${encodeURIComponent(rankId)}`);
    if (!result) {
      console.warn(`[getUserRankById] rankId=${rankId}: no result`);
      return null;
    }
    const items = Array.isArray(result) ? result : [result];
    for (const item of items) {
      if (!item || typeof item !== 'object') continue;
      const obj = item as Record<string, unknown>;
      const id = obj.RANK_ID ?? obj.rankId ?? obj.rank_id ?? obj.id ?? null;
      const name = obj.RANK_NAME ?? obj.rankName ?? obj.rank_name ?? obj.name ?? null;
      if (id && name) {
        console.log(`[getUserRankById] rankId=${rankId}: found id=${id}, name=${name}`);
        return { RANK_ID: String(id), RANK_NAME: String(name) };
      }
    }
    console.warn(`[getUserRankById] rankId=${rankId}: no matching fields in`, JSON.stringify(result).slice(0, 500));
    return null;
  } catch (err) {
    console.warn(`[getUserRankById] rankId=${rankId}: error`, err);
    return null;
  }
}

/**
 * Fetch profile image for a given registration number (File/GetProfileImage)
 * Returns a data URL (e.g. data:image/png;base64,...) or null if no image.
 */
export async function getProfileImage(regiNo: string): Promise<string | null> {
  try {
    const token = (await import('./authStorage')).getAccessToken();
    const base = (await import('./config')).API_BASE_URL;
    const url = `${base.replace(/\/+$/, '')}/File/GetProfileImage?userRegiNo=${encodeURIComponent(regiNo)}`;

    const res = await fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    if (!res.ok) return null;

    const blob = await res.blob();
    if (!blob.type.startsWith('image/')) return null;

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}
