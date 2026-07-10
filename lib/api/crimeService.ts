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
  CreateCvrRequest,
  CreateCvrResponse,
  UpdateProductionSentAnalysisRequest,
  UpdateProductionSentAnalysisResponse,
  AddProductionSentCourtRequest,
  AddProductionSentCourtResponse,
  ProductionAnalysisItemApi,
  LocationCvrItemApi,
  ProductionSentCourtItemGetResponseApi,
  AddCourtVisitRequest,
  AddCourtVisitResponse,
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

/**
 * Create a new CVR (Crime Visit Report) (SOCO_CVR1)
 */
export async function createCvr(
  payload: CreateCvrRequest,
): Promise<CreateCvrResponse> {
  return apiRequest<CreateCvrResponse>('Cvr/CreateCvr', {
    method: 'POST',
    body: payload,
  });
}

/**
 * Update production analysis details (result) on backend (SOCO_CVR2)
 */
export async function updateProductionSentAnalysis(
  payload: UpdateProductionSentAnalysisRequest,
): Promise<UpdateProductionSentAnalysisResponse> {
  return apiRequest<UpdateProductionSentAnalysisResponse>('Cvr/UpdateProductionSentAnalysis', {
    method: 'POST',
    body: payload,
  });
}

/**
 * Add productions sent to court (SOCO_CVR3)
 */
export async function addProductionSentCourt(
  payload: AddProductionSentCourtRequest,
): Promise<AddProductionSentCourtResponse> {
  return apiRequest<AddProductionSentCourtResponse>('Cvr/AddProductionSentCourt', {
    method: 'POST',
    body: payload,
  });
}

/**
 * Get production analysis list by CVR ID (SOCO_CVR4)
 */
export async function getProductionAnalysisByCvrId(
  cvrId: number,
): Promise<ProductionAnalysisItemApi[]> {
  return apiRequest<ProductionAnalysisItemApi[]>('Cvr/GetProductionAnalysisByCvrId', {
    method: 'GET',
    params: { cvrId },
  });
}

/**
 * Get production sent to court list by CVR ID (SOCO_CVR5)
 */
export async function getProductionSentCourtByCvrId(
  cvrId: number,
): Promise<ProductionSentCourtItemGetResponseApi[]> {
  return apiRequest<ProductionSentCourtItemGetResponseApi[]>('Cvr/GetProductionSentCourtByCvrId', {
    method: 'GET',
    params: { cvrId },
  });
}

/**
 * Get CVRs list by location ID (SOCO_CVR8)
 */
export async function getCvrsByLocationId(
  locationId: number,
): Promise<LocationCvrItemApi[]> {
  return apiRequest<LocationCvrItemApi[]>('Cvr/GetCvrsByLocationId', {
    method: 'GET',
    params: { locationId },
  });
}

/**
 * Add court visit details (SOCO_CVR6)
 */
export async function addCourtVisit(
  payload: AddCourtVisitRequest,
): Promise<AddCourtVisitResponse> {
  return apiRequest<AddCourtVisitResponse>('Cvr/AddCourtVisit', {
    method: 'POST',
    body: payload,
  });
}
