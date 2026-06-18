import { apiRequest } from './client';
import type { UserRank } from './types';

/**
 * Fetch all user ranks from the system
 * Returns array of rank IDs and names
 */
export async function getUserRanks(): Promise<UserRank[]> {
  return apiRequest<UserRank[]>('User/GetUserRanks');
}
