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

