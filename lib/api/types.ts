/** Standard SOCO API envelope. */
export interface ApiResponse<T> {
  isSuccess: boolean;
  errorShow: string | null;
  errorMessage: string | null;
  exceptionDetail: string | null;
  dataBundle: T;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginData {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
}

export interface RefreshRequest {
  username: string;
  refreshToken: string;
}

export interface RefreshData {
  accessToken: string;
  expiresAt: string;
}

export interface LogoutRequest {
  username: string;
}

export interface ApiLocation {
  LOCATION_ID: string;
  LOCATION_NAME: string;
  DIVISION_ID: string;
  CREATED_DTM?: string;
  CREATED_BY?: string;
  CREATED_BY_NAME?: string;
  END_DTM?: string;
  ENDED_BY?: string;
  ENDED_BY_NAME?: string;
}

export interface ApiProvince {
  PROVINCE_ID?: string | number;
  PROVINCE_NAME: string;
}

export interface ApiDivision {
  DIVISION_ID: string;
  DIVISION_NAME: string;
  PROVINCE_ID: string;
  PROVINCE_NAME?: string;
  CREATED_DTM?: string;
  CREATED_BY?: string;
  CREATED_BY_NAME?: string;
  END_DTM?: string;
  ENDED_BY?: string;
  ENDED_BY_NAME?: string;
}

export interface InsertDivisionRequest {
  provinceId: number;
  divisionName: string;
}

export interface UpdateDivisionRequest {
  divisionId: number;
  provinceId: number;
  divisionName: string;
}

export interface InsertNewSocoLabRequest {
  provinceId: number;
  divisionId: number;
  locationName: string;
  policeStations: { stationName: string }[];
}

export interface InsertNewSocoLabResponse {
  locationId: string;
  locationName: string;
  policeStations: unknown[];
  message: string;
}

// ─── Officer API Types ────────────────────────────────────────────────

export interface SpouseData {
  spouseName: string;
  spouseDesignation: string;
  spouseWorkAddress: string;
}

export interface ChildData {
  childName: string;
  childDob: string;
  childAge: number;
  childStatusId: number;
}

export interface InsertNewOfficerRequest {
  username: string;
  userFullName: string;
  userCallingName: string;
  locationId: number;
  userDesignationId: number;
  userDob: string;
  phoneMobile: string;
  phoneOffice: string;
  phoneHome: string;
  userImageUrl: string;
  civilStatus: string;
  userRegiNo: string;
  currentRank: string;
  appointRank: string;
  courseNo: string;
  socoJoinedDate: string;
  spouse?: SpouseData;
  children?: ChildData[];
}

export interface InsertNewOfficerResponse {
  systemUserId: string;
  message: string;
}

export interface CheckRegiNoAvailableResponse {
  isAvailable: boolean;
}

// ─── User Rank Types ──────────────────────────────────────────────────

export interface UserRank {
  RANK_ID: string;
  RANK_NAME: string;
}

// ─── Promotion Types (SOCO_U4) ────────────────────────────────────────

export interface PromotionRecord {
  promotedDate: string;
  promotedRankId: number;
}

export interface InsertPromotionsRequest {
  systemUserId: number;
  promotions: PromotionRecord[];
}

export interface InsertPromotionsData {
  message: string;
}

// ─── Current User Info Types (SOCO_U3) ────────────────────────────────

export interface CurrentUserInfo {
  callingName: string;
  designationName: string;
  userImageUrl: string;
}

// ─── Promotion Types ──────────────────────────────────────────────────

export interface PromotionRecord {
  promotedDate: string; // Format: YYYY-MM-DD
  promotedRankId: number;
}

export interface InsertPromotionsRequest {
  systemUserId: number;
  promotions: PromotionRecord[];
}

export interface InsertPromotionsResponse {
  message: string; // "Promotions saved successfully"
}

// ─── Current User Info Types ──────────────────────────────────────────

export interface CurrentUserInfo {
  callingName: string;
  designationName: string;
  userImageUrl: string;
}

