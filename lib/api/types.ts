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
  currentRank: number;
  appointRank: number;
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

export interface UserDesignation {
  USER_DESIGNATION_ID: string;
  USER_DESIGNATION_NAME: string;
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

// ─── Get All Officers (SOCO_U12) ─────────────────────────────────────

export interface OfficerListItem {
  SYSTEM_USER_ID: string;
  USER_FULL_NAME: string;
  USER_CALLING_NAME?: string;
  USER_REGI_NO: string;
  USERNAME?: string;
  STATUS: string; // "ACTIVE" | "INACTIVE"
  LOCATION_ID: string;
  USER_DESIGNATION_ID?: string;
  RANK_ID?: string;
  CURRENT_RANK?: string;
  APPOINT_RANK?: string;
  PHONE_MOBILE?: string;
  USER_IMAGE_URL?: string;
}

// ─── Get Officer By ID (SOCO_U13) ────────────────────────────────────

export interface PersonalInfo {
  SYSTEM_USER_ID: string;
  USER_FULL_NAME: string;
  USER_CALLING_NAME: string;
  USER_REGI_NO: string;
  USERNAME: string;
  STATUS: string;
  LOCATION_ID: string;
  USER_DESIGNATION_ID: string;
  RANK_ID: string;
  USER_DOB?: string;
  PHONE_MOBILE?: string;
  PHONE_OFFICE?: string;
  PHONE_HOME?: string;
  USER_IMAGE_URL?: string;
  CIVIL_STATUS?: string;
  CURRENT_RANK?: string;
  APPOINT_RANK?: string;
  COURSE_NO?: string;
  SOCO_JOINED_DATE?: string;
}

export interface SpouseInfo {
  SPOUSE_ID: string;
  SYSTEM_USER_ID: string;
  SPOUSE_NAME: string;
  SPOUSE_DESIGNATION: string;
  SPOUSE_WORK_ADDRESS: string;
}

export interface ChildInfo {
  CHILD_ID: string;
  SYSTEM_USER_ID: string;
  CHILD_NAME: string;
  CHILD_DOB: string;
  CHILD_AGE: string;
  CHILD_STATUS_ID: string;
}

export interface PromotionInfo {
  USER_PROMOTION_ID: string;
  SYSTEM_USER_ID: string;
  PROMOTED_DATE: string;
  PROMOTED_RANK_ID: string;
}

export interface OLResultInfo {
  EDUCATION_RESULT_OL_ID: string;
  SYSTEM_USER_ID: string;
  SUBJECT_NAME: string;
  SUBJECT_RESULT: string;
}

export interface ALResultInfo {
  EDUCATION_RESULT_AL_ID: string;
  SYSTEM_USER_ID: string;
  STREAM: string;
  SUBJECT_NAME: string;
  SUBJECT_RESULT: string;
}

export interface HigherEducationInfo {
  HIGHER_EDUCATION_ID: string;
  SYSTEM_USER_ID: string;
  DONE_BEFORE_JOIN: string;
  SPONSORED: string;
  EDUCATION_TYPE: string;
  QUALIFICATION_NAME: string;
  INSTITUTE_NAME: string;
  FROM_YEAR: string;
  TO_YEAR: string;
}

export interface CourseInfo {
  RECORD_ID: string;
  SYSTEM_USER_ID: string;
  COURSE_TYPE_ID: string;
  COURSE_DONE_ID: string;
  CON_NO: string;
  POLICE_STATION: string;
  BRANCH: string;
  FROM_DATE: string;
  TO_DATE: string;
  DURATION: string;
  INSTITUTE: string;
  COUNTRY: string;
}

export interface DrivingCategoryDetailInfo {
  DRIVING_CATEGORY_DETAIL_ID: string;
  SYSTEM_USER_ID: string;
  DRIVING_LICENSE_NO: string;
  LICENCE_CATEGORY_ID: string;
}

export interface DrivingQualificationDetailInfo {
  DRIVING_UALIFICATION_DETAIL_ID: string;
  SYSTEM_USER_ID: string;
  QUALIFICATION_TYPE_ID: string;
}

export interface TransferInfo {
  TRANSFER_RECORD_ID: string;
  SYSTEM_USER_ID: string;
  LOCATION_ID: string;
  FROM_DATE: string;
  TO_DATE: string;
  DURATION: string;
  OFFICER_INCHARGE_USER_ID: string;
  REASON: string;
}

export interface SpecialDutyInfo {
  SPECIAL_DUTY_RECORD_ID: string;
  SYSTEM_USER_ID: string;
  LOCATION_ID: string;
  FROM_DATE: string;
  TO_DATE: string;
  DURATION: string;
  OFFICER_INCHARGE_USER_ID: string;
  REASON: string;
}

export interface DisciplinaryInquiryInfo {
  DISCIPLINARY_INQUIRIE_ID: string;
  SYSTEM_USER_ID: string;
  ORDERLY_ROOM_STATUS: string;
  ORDERLY_ROOM_RESULT: string;
  PRELIMINARY_INQUIRY_STATUS: string;
  PRELIMINARY_INQUIRY_RESULT: string;
  DISCIPLINARY_INQUIRY_STATUS: string;
  DISCIPLINARY_INQUIRY_RESULT: string;
}

export interface SpecialIllnessInfo {
  SPECIAL_ILLNESS_ID: string;
  SYSTEM_USER_ID: string;
  SPECIAL_ILLNESS_NOTE: string;
}

export interface SpecialNoteInfo {
  SPECIAL_NOTE_ID: string;
  SYSTEM_USER_ID: string;
  SPECIAL_NOTE: string;
}

export interface OfficerDetailBundle {
  personalInfo: PersonalInfo[];
  spouse: SpouseInfo[];
  children: ChildInfo[];
  promotions: PromotionInfo[];
  olResults: OLResultInfo[];
  alResults: ALResultInfo[];
  higherEducation: HigherEducationInfo[];
  courses: CourseInfo[];
  drivingCategoryDetails: DrivingCategoryDetailInfo[];
  drivingQualificationDetails: DrivingQualificationDetailInfo[];
  transfers: TransferInfo[];
  specialDuty: SpecialDutyInfo[];
  disciplinaryInquiries: DisciplinaryInquiryInfo[];
  specialIllnesses: SpecialIllnessInfo[];
  specialNotes: SpecialNoteInfo[];
}

// ─── Grant Login Access (SOCO_UP1) ───────────────────────────────────

export interface GrantLoginAccessRequest {
  systemUserId: number;
  userKey: string;
}

// ─── Update Personal Info (SOCO_U14) ────────────────────────────────

export interface UpdatePersonalInfoRequest {
  systemUserId: number;
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
  currentRank: number;
  appointRank: number;
  courseNo: string;
  socoJoinedDate: string;
  spouse?: SpouseData;
  children?: ChildData[];
}

// ─── Update User Designation ───────────────────────────────────────

export interface UpdateUserDesignationRequest {
  systemUserId: number;
  designationId: number;
}

