import { apiRequest } from './client';
import type {
  InsertNewOfficerRequest,
  InsertNewOfficerResponse,
  CheckRegiNoAvailableResponse,
  InsertPromotionsRequest,
  InsertPromotionsData,
  UpdatePromotionsRequest,
  UpdatePromotionsData,
  UpdateEducationRequest,
  UpdateEducationData,
  UpdateCoursesRequest,
  UpdateCoursesData,
  UpdateDrivingRequest,
  UpdateDrivingData,
  UpdateTransfersRequest,
  UpdateTransfersData,
  UpdateSpecialDutyRequest,
  UpdateSpecialDutyData,
  UpdateDisciplinaryInquiriesRequest,
  UpdateDisciplinaryInquiriesData,
  UpdateSpecialIllnessesNotesRequest,
  UpdateSpecialIllnessesNotesData,
  UpdatePersonalInfoRequest,
  UpdateUserDesignationRequest,
  OfficerListItem,
  OfficerDetailBundle,
  GrantLoginAccessRequest,
  PrivilegeTypeGroup,
  SetUserPrivilegesRequest,
  UserPrivilegeTypeGroup,
  SetPrivilegeLocationsRequest,
  UserPrivilegeLocationTypeGroup,
  UserPrivilegeMatrixItem,
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
 * Check if a registration number already exists (SOCO_U2)
 * isAvailable: true means the Regi No is ALREADY in use
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

/**
 * Update promotions (SOCO_U4 - UpdatePromotions)
 */
export async function updatePromotions(
  payload: UpdatePromotionsRequest,
): Promise<UpdatePromotionsData> {
  return apiRequest<UpdatePromotionsData>('User/UpdatePromotions', {
    method: 'POST',
    body: payload,
  });
}

/**
 * Update education details (SOCO_U5)
 */
export async function updateEducation(
  payload: UpdateEducationRequest,
): Promise<UpdateEducationData> {
  return apiRequest<UpdateEducationData>('User/UpdateEducation', {
    method: 'POST',
    body: payload,
  });
}

/**
 * Update courses (SOCO_U6)
 */
export async function updateCourses(
  payload: UpdateCoursesRequest,
): Promise<UpdateCoursesData> {
  return apiRequest<UpdateCoursesData>('User/UpdateCourses', {
    method: 'POST',
    body: payload,
  });
}

/**
 * Update driving license (SOCO_U7)
 */
export async function updateDriving(
  payload: UpdateDrivingRequest,
): Promise<UpdateDrivingData> {
  return apiRequest<UpdateDrivingData>('User/UpdateDriving', {
    method: 'POST',
    body: payload,
  });
}

/**
 * Update transfers (SOCO_U8)
 */
export async function updateTransfers(
  payload: UpdateTransfersRequest,
): Promise<UpdateTransfersData> {
  return apiRequest<UpdateTransfersData>('User/UpdateTransfers', {
    method: 'POST',
    body: payload,
  });
}

/**
 * Update special duty (SOCO_U9)
 */
export async function updateSpecialDuty(
  payload: UpdateSpecialDutyRequest,
): Promise<UpdateSpecialDutyData> {
  return apiRequest<UpdateSpecialDutyData>('User/UpdateSpecialDuty', {
    method: 'POST',
    body: payload,
  });
}

/**
 * Update disciplinary inquiries (SOCO_U10)
 */
export async function updateDisciplinaryInquiries(
  payload: UpdateDisciplinaryInquiriesRequest,
): Promise<UpdateDisciplinaryInquiriesData> {
  return apiRequest<UpdateDisciplinaryInquiriesData>('User/UpdateDisciplinaryInquiries', {
    method: 'POST',
    body: payload,
  });
}

/**
 * Update special illnesses & notes (SOCO_U11)
 */
export async function updateSpecialIllnessesNotes(
  payload: UpdateSpecialIllnessesNotesRequest,
): Promise<UpdateSpecialIllnessesNotesData> {
  return apiRequest<UpdateSpecialIllnessesNotesData>('User/UpdateSpecialIllnessesNotes', {
    method: 'POST',
    body: payload,
  });
}

/**
 * Get all officers (SOCO_U12)
 */
export async function getAllOfficers(payload?: {
  locationIds?: number[];
  designationIds?: number[];
}): Promise<OfficerListItem[]> {
  const res = await apiRequest<OfficerListItem[]>('User/GetAllOfficers', {
    method: 'POST',
    body: payload || { locationIds: [], designationIds: [] },
  });
  return res;
}

/**
 * Get officer by ID (SOCO_U13)
 */
export async function getOfficerById(
  systemUserId: number,
): Promise<OfficerDetailBundle> {
  const res = await apiRequest<OfficerDetailBundle>('User/GetOfficerById', {
    params: { systemUserId },
  });
  return res;
}

/**
 * Grant login access / change password (SOCO_UP1)
 */
export async function grantLoginAccess(
  payload: GrantLoginAccessRequest,
): Promise<string> {
  const res = await apiRequest<string>('UserPrivilege/GrantLoginAccess', {
    method: 'POST',
    body: payload,
  });
  return res;
}

/**
 * Upload profile image (SOCO_UC3)
 */
export async function uploadProfileImage(
  regiNo: string,
  file: File,
): Promise<string> {
  const formData = new FormData();
  formData.append('ImageFile', file);
  formData.append('UserRegiNo', regiNo);

  const res = await apiRequest<string>('User/UploadProfileImage', {
    method: 'POST',
    body: formData,
    formData: true,
  });
  return res;
}

/**
 * Update personal & family info (SOCO_U14)
 */
export async function updatePersonalInfo(
  payload: UpdatePersonalInfoRequest,
): Promise<string> {
  return apiRequest<string>('User/UpdatePersonalInfo', {
    method: 'POST',
    body: payload,
  });
}

/**
 * Update user designation (Privilege)
 */
export async function updateUserDesignation(
  payload: UpdateUserDesignationRequest,
): Promise<string> {
  return apiRequest<string>('UserPrivilege/UpdateDesignation', {
    method: 'POST',
    body: payload,
  });
}

/**
 * Get the full catalog of privilege types and their configurations,
 * used to populate the privilege selection dropdown.
 */
export async function getPrivilegeCatalog(): Promise<PrivilegeTypeGroup[]> {
  return apiRequest<PrivilegeTypeGroup[]>('UserPrivilege/GetPrivilegeCatalog');
}

/**
 * Replace a user's full set of privileges with the given configuration IDs.
 */
export async function setUserPrivileges(
  payload: SetUserPrivilegesRequest,
): Promise<string> {
  return apiRequest<string>('UserPrivilege/SetUserPrivileges', {
    method: 'POST',
    body: payload,
  });
}

/**
 * Get the full privilege catalog for a user, annotated with which
 * configurations are currently active (assigned) for them.
 */
export async function getUserPrivileges(systemUserId: number): Promise<UserPrivilegeTypeGroup[]> {
  return apiRequest<UserPrivilegeTypeGroup[]>('UserPrivilege/GetUserPrivileges', {
    params: { systemUserId },
  });
}

/**
 * Get the full privilege catalog for a user, each privilege annotated with
 * the list of locations assignable/assigned to it.
 */
export async function getUserPrivilegeLocations(
  systemUserId: number,
): Promise<UserPrivilegeLocationTypeGroup[]> {
  return apiRequest<UserPrivilegeLocationTypeGroup[]>('UserPrivilege/GetUserPrivilegeLocations', {
    params: { systemUserId },
  });
}

/**
 * Set the location(s) a specific privilege is scoped to, for a given user.
 */
export async function setPrivilegeLocations(
  payload: SetPrivilegeLocationsRequest,
): Promise<string> {
  return apiRequest<string>('UserPrivilege/SetPrivilegeLocations', {
    method: 'POST',
    body: payload,
  });
}

/**
 * Get user privilege matrix by systemUserId.
 */
export async function getUserPrivilegeMatrix(
  systemUserId: number,
): Promise<UserPrivilegeMatrixItem[]> {
  return apiRequest<UserPrivilegeMatrixItem[]>('UserPrivilege/GetUserPrivilegeMatrix', {
    params: { systemUserId },
  });
}
