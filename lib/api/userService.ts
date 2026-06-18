import { apiRequest } from './client';
import type { UserRank, CurrentUserInfo } from './types';

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
 * Get current logged-in user info (SOCO_U3)
 * Returns calling name, designation name, and profile image URL
 */
export async function getCurrentUserInfo(): Promise<CurrentUserInfo> {
  return apiRequest<CurrentUserInfo>('User/GetCurrentUserInfo');
}
