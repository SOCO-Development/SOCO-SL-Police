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
  UpdateVehicleRequest,
  ApiVehicle,
  ApiVisit,
  CourtItem,
  ProductionItem,
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
 * Update an existing vehicle in the system
 */
export async function updateVehicle(payload: UpdateVehicleRequest): Promise<string> {
  return apiRequest<string>('Crime/UpdateVehicle', {
    method: 'POST',
    body: payload,
  });
}

/**
 * Get all vehicles in the system
 */
export async function getAllVehicles(): Promise<ApiVehicle[]> {
  return apiRequest<ApiVehicle[]>('Crime/GetAllVehicles', {
    method: 'GET',
  });
}

/**
 * Get vehicle details by ID
 */
export async function getVehicleById(vehicleId: number): Promise<ApiVehicle[]> {
  return apiRequest<ApiVehicle[]>('Crime/GetVehicleById', {
    method: 'GET',
    params: { vehicleId },
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
 * Get all courts
 */
export async function getAllCourts(): Promise<CourtItem[]> {
  return apiRequest<CourtItem[]>('Crime/GetAllCourts', {
    method: 'GET',
  });
}

/**
 * Get all production types
 */
export async function getAllProductions(): Promise<ProductionItem[]> {
  return apiRequest<ProductionItem[]>('Crime/GetAllProductions', {
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

/**
 * Get all visits
 */
export async function getAllVisits(): Promise<ApiVisit[]> {
  return apiRequest<ApiVisit[]>('Crime/GetAllVisits', {
    method: 'GET',
  });
}
