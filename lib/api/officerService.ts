import { apiRequest } from './client';
import type {
  InsertNewOfficerRequest,
  InsertNewOfficerResponse,
  CheckRegiNoAvailableResponse,
  InsertPromotionsRequest,
  InsertPromotionsData,
} from './types';

/**
 * Insert a new SOCO officer (SOCO_U1)
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
 * Check if a registration number is available (SOCO_U2)
 * isAvailable: true means the Regi No is FREE to use
 */
export async function checkRegiNoAvailable(
  regiNo: string,
): Promise<CheckRegiNoAvailableResponse> {
  return apiRequest<CheckRegiNoAvailableResponse>('User/CheckRegiNoAvailable', {
    params: { regiNo },
  });
}

/**
 * Save promotion history for an officer (SOCO_U4)
 * Called after InsertNewOfficer succeeds to attach promotions
 */
export async function insertPromotions(
  payload: InsertPromotionsRequest,
): Promise<InsertPromotionsData> {
  return apiRequest<InsertPromotionsData>('User/InsertPromotions', {
    method: 'POST',
    body: payload,
  });
}
