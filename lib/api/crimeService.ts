import { apiRequest } from './client';
import type {
  AddVehicleRequest,
  AddVehicleResponse,
  GetVisitByIdResponse,
  OffenceItem,
  InitiateVisitRequest,
  InitiateVisitResponse,
  UpdateVisitInDetailsRequest,
  UpdateVisitInDetailsResponse,
} from './types';

/**
 * Add a new vehicle to the system
 */
export async function addVehicle(payload: AddVehicleRequest): Promise<AddVehicleResponse> {
  return apiRequest<AddVehicleResponse>('Crime/AddVehicle', {
    method: 'POST',
    body: payload,
  });
}

/**
 * Get visit details by ID
 */
export async function getVisitById(visitId: number): Promise<GetVisitByIdResponse> {
  return apiRequest<GetVisitByIdResponse>('Crime/GetVisitById', {
    method: 'GET',
    params: { visitId },
  });
}

/**
 * Get all offences
 */
export async function getAllOffences(): Promise<OffenceItem[]> {
  return apiRequest<OffenceItem[]>('Crime/GetAllOffences', {
    method: 'GET',
  });
}

/**
 * Update visit in details
 */
export async function updateVisitInDetails(
  payload: UpdateVisitInDetailsRequest,
): Promise<UpdateVisitInDetailsResponse> {
  return apiRequest<UpdateVisitInDetailsResponse>('Crime/UpdateVisitInDetails', {
    method: 'POST',
    body: payload,
  });
}

/**
 * Initiate a new visit
 */
export async function initiateVisit(
  payload: InitiateVisitRequest,
): Promise<InitiateVisitResponse> {
  return apiRequest<InitiateVisitResponse>('Crime/InitiateVisit', {
    method: 'POST',
    body: payload,
  });
}
