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

export interface PromotionRecord {
  promotedDate: string; // Format: YYYY-MM-DD
  promotedRankId: number;
}

export interface InsertPromotionsRequest {
  systemUserId: number;
  promotions: PromotionRecord[];
}

export interface InsertPromotionsData {
  message: string; // "Promotions saved successfully"
}

// ─── Current User Info Types ──────────────────────────────────────────

export interface CurrentUserInfo {
  callingName: string;
  designationName: string;
  userImageUrl: string;
}

// ─── Update Promotions (SOCO_U4) ──────────────────────────────────────

export interface UpdatePromotionsRequest {
  systemUserId: number;
  promotions: PromotionRecord[];
}

export interface UpdatePromotionsData {
  message: string;
}

// ─── Update Education (SOCO_U5) ───────────────────────────────────────

export interface OLResultData {
  subjectName: string;
  subjectResult: string;
}

export interface ALResultData {
  stream: string;
  subjectName: string;
  subjectResult: string;
}

export interface HigherEducationData {
  doneBeforeJoin: string; // "Yes" | "No"
  sponsored: string; // "Yes" | "No"
  educationType: string;
  qualificationName: string;
  instituteName: string;
  fromYear: number;
  toYear: number;
}

export interface UpdateEducationRequest {
  systemUserId: number;
  olResults: OLResultData[];
  alResults: ALResultData[];
  higherEducations: HigherEducationData[];
}

export interface UpdateEducationData {
  message: string;
}

// ─── Update Courses (SOCO_U6) ─────────────────────────────────────────

export interface CourseUpdateData {
  courseTypeId: number; // 1=Local, 2=Foreign
  courseDoneId: number; // 1=Before, 2=After
  conNo: string;
  policeStation: string;
  branch: string;
  fromDate: string;
  toDate: string;
  duration: string;
  institute: string;
  country: string;
}

export interface UpdateCoursesRequest {
  systemUserId: number;
  courses: CourseUpdateData[];
}

export interface UpdateCoursesData {
  message: string;
}

// ─── Update Driving License (SOCO_U7) ─────────────────────────────────

export interface CategoryDetailData {
  drivingLicenseNo: string;
  licenceCategoryId: number;
}

export interface QualificationDetailData {
  qualificationTypeId: number; // 1=Heavy, 2=Light, 3=Motorcycle
}

export interface UpdateDrivingRequest {
  systemUserId: number;
  categoryDetails: CategoryDetailData[];
  qualificationDetails: QualificationDetailData[];
}

export interface UpdateDrivingData {
  message: string;
}

// ─── Update Transfers (SOCO_U8) ───────────────────────────────────────

export interface TransferData {
  locationId: number;
  fromDate: string;
  toDate: string;
  duration: string;
  officerInchargeUserId: number;
  reason: string;
}

export interface UpdateTransfersRequest {
  systemUserId: number;
  transfers: TransferData[];
}

export interface UpdateTransfersData {
  message: string;
}

// ─── Update Special Duty (SOCO_U9) ────────────────────────────────────

export interface SpecialDutyData {
  locationId: number;
  fromDate: string;
  toDate: string;
  duration: string;
  officerInchargeUserId: number;
  reason: string;
}

export interface UpdateSpecialDutyRequest {
  systemUserId: number;
  specialDuties: SpecialDutyData[];
}

export interface UpdateSpecialDutyData {
  message: string;
}

// ─── Update Disciplinary Inquiries (SOCO_U10) ─────────────────────────

export interface DisciplinaryInquiryData {
  orderlyRoomStatus: string; // "Yes" | "No"
  orderlyRoomResult: string;
  preliminaryInquiryStatus: string; // "Yes" | "No"
  preliminaryInquiryResult: string;
  disciplinaryInquiryStatus: string; // "Yes" | "No"
  disciplinaryInquiryResult: string;
}

export interface UpdateDisciplinaryInquiriesRequest {
  systemUserId: number;
  disciplinaryInquiries: DisciplinaryInquiryData[];
}

export interface UpdateDisciplinaryInquiriesData {
  message: string;
}

// ─── Update Special Illnesses & Notes (SOCO_U11) ──────────────────────

export interface SpecialIllnessNote {
  specialIllnessNote: string;
}

export interface SpecialNote {
  specialNote: string;
}

export interface UpdateSpecialIllnessesNotesRequest {
  systemUserId: number;
  specialIllnesses: SpecialIllnessNote[];
  specialNotes: SpecialNote[];
}

export interface UpdateSpecialIllnessesNotesData {
  message: string;
}

