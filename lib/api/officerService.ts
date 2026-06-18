import { apiRequest } from './client';
import type {
  InsertNewOfficerRequest,
  InsertNewOfficerResponse,
  CheckRegiNoAvailableResponse,
} from './types';

/**
 * Insert a new SOCO officer
 */
export async function insertNewOfficer(
  payload: InsertNewOfficerRequest,
): Promise<InsertNewOfficerResponse> {
  return apiRequest<InsertNewOfficerResponse>('User/InsertNewOfficer', {
    method: 'POST',
    body: payload,
  });
}

/**
 * Check if a registration number is available
 * Returns { isAvailable: true } if available (not in use)
 * Returns { isAvailable: false } if already exists
 */
export async function checkRegiNoAvailable(
  regiNo: string,
): Promise<CheckRegiNoAvailableResponse> {
  return apiRequest<CheckRegiNoAvailableResponse>('User/CheckRegiNoAvailable', {
    params: { regiNo },
  });
}
