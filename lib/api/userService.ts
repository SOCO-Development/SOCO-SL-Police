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
