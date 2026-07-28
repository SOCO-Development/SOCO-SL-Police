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
  locationId: string;
}

export interface PoliceStation {
  POLICE_STATION_ID: string;
  POLICE_STATION_NAME: string;
  DIVISION_ID: string;
  PROVINCE_ID: string;
  LOCATION_ID: string;
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
  courseName: string;
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
  designationId?: number;
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

// ─── Privilege Catalog / Set User Privileges ────────────────────────

export interface PrivilegeConfiguration {
  privilegeConfigurationId: number;
  privilegeRole: string;
}

export interface PrivilegeTypeGroup {
  privilegeTypeId: number;
  privilegeType: string;
  configurations: PrivilegeConfiguration[];
}

export interface SetUserPrivilegesRequest {
  systemUserId: number;
  privilegeConfigurationIds: number[];
}

/**
 * Configuration entry as returned by GetUserPrivileges: the full catalog entry
 * plus whether it's currently assigned to the queried user (isActive).
 */
export interface UserPrivilegeConfiguration {
  privilegeConfigurationId: number;
  privilegeRole: string;
  isActive: boolean;
  privilegeId: number | null;
}

/** GetUserPrivileges returns the full catalog grouped by type, annotated with isActive per config. */
export interface UserPrivilegeTypeGroup {
  privilegeTypeId: number;
  privilegeType: string;
  configurations: UserPrivilegeConfiguration[];
}

// ─── Set Privilege Locations ─────────────────────────────────────────

export interface SetPrivilegeLocationsRequest {
  systemUserId: number;
  privilegeId: number;
  locationIds: number[];
}

/** A single selectable location option for a privilege, as returned by GetUserPrivilegeLocations. */
export interface PrivilegeLocationOption {
  locationId: number;
  locationName: string;
}

/** One privilege entry within GetUserPrivilegeLocations, with its allowed location options. */
export interface UserPrivilegeLocationEntry {
  privilegeId: number;
  privilegeConfigurationId: number;
  privilegeRole: string;
  locations: PrivilegeLocationOption[];
}

/** GetUserPrivilegeLocations returns the full privilege catalog grouped by type,
 * each privilege annotated with its list of assignable locations. */
export interface UserPrivilegeLocationTypeGroup {
  privilegeTypeId: number;
  privilegeType: string;
  privileges: UserPrivilegeLocationEntry[];
}

/** GetUserPrivilegeMatrix returns assigned privilege roles and locations for a user. */
export interface UserPrivilegeMatrixItem {
  privilegeId: number;
  privilegeConfigurationId: number;
  privilegeRole: string;
  locations: PrivilegeLocationOption[];
}

// ─── Crime API Types ──────────────────────────────────────────────────

export interface AddVehicleRequest {
  locationId: number;
  vehicleRegistrationNo: string;
  vehicleBrand: string;
  vehicleModel: string;
  vehicleColor: string;
  vehicleType: string;
  vehicleYear: number;
  chassisNo: string;
  engineNo: string;
  fuelType: string;
}

export interface AddVehicleResponse {
  vehicleId?: number | string;
  message: string;
}

export interface GetVisitByIdResponse {
  visit: VisitRecord[];
}

export interface VisitRecord {
  VISIT_ID: string;
  VISIT_TYPE?: string;
  OUT_DATE: string;
  OUT_TIME: string;
  OUT_PAGE?: string;
  OUT_PARA?: string;
  IN_DATE: string | null;
  IN_TIME: string | null;
  IN_PAGE: string | null;
  IN_PARA: string | null;
  LOCATION_ID?: string;
  POLICE_STATION_ID?: string;
  [key: string]: unknown;
}

export interface OffenceItem {
  offenceId: string;
  offenceName: string;
  offenceCode: string;
  OFFENCE_ID?: string;
  OFFENCE_NAME?: string;
  [key: string]: unknown;
}

export interface CourtItem {
  courtId?: string;
  courtName?: string;
  COURT_ID?: string;
  COURT_NAME?: string;
  [key: string]: unknown;
}

export interface ProductionItem {
  productionId?: string | number;
  productionName?: string;
  PRODUCTION_ID?: string | number;
  PRODUCTION_NAME?: string;
  [key: string]: unknown;
}

export interface InitiateVisitRequest {
  locationId: number;
  policeStationId: number;
  offenceIds: number[];
  offenceType: string;
  outDate: string;
  outTime: string;
  outPage: number;
  outPara: number;
  vehicleId: number;
  driverId: number;
  [key: string]: unknown;
}

export interface InitiateVisitResponse {
  visitId: string;
  message: string;
}

export interface UpdateVisitInDetailsRequest {
  visitId: number;
  inDate: string;
  inTime: string;
  inPage: number;
  inPara: number;
  [key: string]: unknown;
}

export type UpdateVisitInDetailsResponse = string;

export interface UpdateVehicleRequest {
  vehicleId: number;
  locationId: number;
  vehicleRegistrationNo: string;
  vehicleBrand: string;
  vehicleModel: string;
  vehicleColor: string;
  vehicleType: string;
  vehicleYear: number;
  chassisNo: string;
  engineNo: string;
  fuelType: string;
}

export interface ApiVehicle {
  VEHICLE_ID: string;
  LOCATION_ID: string;
  VEHICLE_REGISTRATION_NO: string;
  VEHICLE_BRAND: string;
  VEHICLE_MODEL: string;
  VEHICLE_COLOR?: string;
  VEHICLE_TYPE?: string;
  VEHICLE_YEAR?: string | number;
  CHASSIS_NO?: string;
  ENGINE_NO?: string;
  FUEL_TYPE?: string;
  [key: string]: unknown;
}

export interface ApiVisit {
  VISIT_ID: string;
  OUT_DATE: string;
  OUT_TIME: string;
}

// ─── CVR Creation (SOCO_CVR1) ──────────────────────────────────────────

export interface SocoTeamMemberApi {
  systemUserId: number;
  teamRoleId: number;
}

export interface ExpertTeamMemberApi {
  expertTeamMemberName: string;
  expertTeamMemberRole: string;
}

export interface ExpertTeamApi {
  expertTeamRole: string;
  members: ExpertTeamMemberApi[];
}

export interface InvestigationOfficerApi {
  investigationOfficerName: string;
  investigationOfficerRank: string;
  investigationOfficerRegiNo: number;
}

export interface SceneGuardApi {
  sceneGuardName: string;
  sceneGuardRank: string;
  sceneGuardRegiNo: number;
}

export interface ProductionSentAnalysisApi {
  productionId: number;
  sentStatus: boolean;
  institutionName: string;
  sentDate: string;
  referenceNo: string;
}

export interface CourtDetailApi {
  courtId: number;
  courtCaseNo: string;
  bNumber: string;
}

export interface CreateCvrRequest {
  cvrNo: string;
  initiateCvrId?: number;
  visitId: number;
  visitTypeId: number;
  locationId: number;
  policeStationId: number;
  reportedPoliceDate: string;
  reportedPoliceTime: string;
  reportedSocoDate: string;
  reportedSocoTime: string;
  sceneIn: string;
  sceneOut: string;
  sceneDuration: string;
  offenceType: string;
  placeDetail: string;
  typeCrimeScene: string;
  isExactTime: boolean;
  incidentFromDate: string;
  incidentFromTime: string;
  incidentToDate: string;
  incidentToTime: string;
  offenceIds: number[];
  socoTeamMembers: SocoTeamMemberApi[];
  expertTeams: ExpertTeamApi[];
  investigationOfficers: InvestigationOfficerApi[];
  sceneGuards: SceneGuardApi[];
  productionStatus: boolean;
  productionsSentAnalysis: ProductionSentAnalysisApi[];
  courtDetails: CourtDetailApi[];
}

export interface CreateCvrResponse {
  isSuccess: boolean;
  errorShow: string | null;
  errorMessage: string | null;
  exceptionDetail: string | null;
  dataBundle?: {
    cvrId?: string | number;
    initiateCvrId?: string | number;
    message?: string;
  };
}

export interface UpdateProductionSentAnalysisRequest {
  productionSentAnalysisId: number;
  cvrId: number;
  referenceNo: string;
  resultReceivedStatus: boolean;
  resultStatus: boolean;
  resultAttachmentUrl: string;
}

export interface UpdateProductionSentAnalysisResponse {
  isSuccess: boolean;
  errorShow: string | null;
  errorMessage: string | null;
  exceptionDetail: string | null;
  dataBundle: string;
}

export interface ProductionSentCourtItemApi {
  productionId: number;
  sentStatus: boolean;
  courtName: string;
  sentDate: string;
  caseNo: string;
  affidavitAttachmentUrl: string;
  questionaireAttachmentUrl: string;
}

export interface AddProductionSentCourtRequest {
  cvrId: number;
  productionsSentCourt: ProductionSentCourtItemApi[];
}

export interface AddProductionSentCourtResponse {
  isSuccess: boolean;
  errorShow: string | null;
  errorMessage: string | null;
  exceptionDetail: string | null;
  dataBundle: string;
}

export interface ProductionAnalysisItemApi {
  PRODUCTION_SENT_ANALYSIS_ID: string;
  PRODUCTION_ID: string;
  SENT_STATUS: string;
  INSTITUTION_NAME: string;
  SENT_DATE: string;
  REFERENCE_NO: string;
  RESULT_RECIEVED_STATUS?: string;
  RESULT_STATUS?: string;
  RESULT_ATTACHEMENT_URL?: string;
}

export interface GetProductionAnalysisByCvrIdResponse {
  isSuccess: boolean;
  errorShow: string | null;
  errorMessage: string | null;
  exceptionDetail: string | null;
  dataBundle: ProductionAnalysisItemApi[];
}

export interface ProductionSentCourtItemGetResponseApi {
  PRODUCTION_SENT_COURT_ID: string;
  PRODUCTION_ID: string;
  SENT_STATUS: string;
  COURT_NAME: string;
  SENT_DATE: string;
  CASE_NO: string;
  AFFIDAVIT_ATTACHEMENT_URL?: string;
  QUESTIONAIRE_ATTACHEMENT_URL?: string;
}

export interface GetProductionSentCourtByCvrIdResponse {
  isSuccess: boolean;
  errorShow: string | null;
  errorMessage: string | null;
  exceptionDetail: string | null;
  dataBundle: ProductionSentCourtItemGetResponseApi[];
}

export interface LocationCvrItemApi {
  INITIATE_CVR_ID: string;
  CVR_NO: string;
}

export interface GetCvrsByLocationIdResponse {
  isSuccess: boolean;
  errorShow: string | null;
  errorMessage: string | null;
  exceptionDetail: string | null;
  dataBundle: LocationCvrItemApi[];
}

// ─── Get Full CVR Details By Initiate CVR Id ──────────────────────────

export interface FullCvrVisitAttachments {
  photoUrl: string;
  sketchUrl: string;
  reportUrl: string;
}

export interface FullCvrVisitItem {
  cvrId: number;
  visitTypeId: string;
  reportedPoliceDate: string;
  reportedPoliceTime: string;
  reportedSocoDate: string;
  reportedSocoTime: string;
  sceneIn: string;
  sceneOut: string;
  sceneDuration: string;
  offenceType: string;
  placeDetail: string;
  typeCrimeScene: string;
  isExactTime: string;
  incidentFromDate: string;
  incidentFromTime: string;
  incidentToDate: string;
  incidentToTime: string;
  locationId: string;
  policeStationId: string;
  attachments: FullCvrVisitAttachments;
  offences: Array<{ CVR_ID: string; OFFENCE_ID: string }>;
  socoTeam: Array<{ SCENE_SOCO_TEAM_ID: string; SYSTEM_USER_ID: string; TEAM_ROLE_ID: string }>;
  expertTeams: unknown[];
  investigationOfficers: unknown[];
  sceneGuards: unknown[];
  courtDetails: unknown[];
  productionDetails: Array<{ CVR_ID: string; PRODUCTION_STATUS: string }>;
  productionsSentAnalysis: unknown[];
  productionsSentCourt: unknown[];
  productionAnalysisHistory: unknown[];
  productionCourtHistory: unknown[];
}

export interface FullCvrDetails {
  initiateCvrId: number;
  cvrNo: string;
  totalVisits: number;
  visits: FullCvrVisitItem[];
  courtVisits: unknown[];
}

export interface AddCourtVisitRequest {
  initiateCvrId: number;
  courtId: number;
  testifiedOfficerName: string;
  officerId: number;
  visitDescription: string;
  courtVisitAttachmentUrl: string;
}

export interface AddCourtVisitResponse {
  isSuccess: boolean;
  errorShow: string | null;
  errorMessage: string | null;
  exceptionDetail: string | null;
  dataBundle: string;
}

export interface CrimeSceneByVisitItemApi {
  INITIATE_CVR_ID: string;
  CVR_NO: string;
  CVR_ID: string;
  VISIT_ID: string;
  VISIT_TYPE_ID: string;
  LOCATION_ID: string;
  OFFENCE_TYPE: string;
  PLACE_DETAIL: string;
  TYPE_CRIME_SCENE: string;
  SCENE_IN: string;
  SCENE_OUT: string;
  CREATED_DTM: string;
}

export interface GetCrimeScenesByVisitIdResponse {
  isSuccess: boolean;
  errorShow: string | null;
  errorMessage: string | null;
  exceptionDetail: string | null;
  dataBundle: CrimeSceneByVisitItemApi[];
}

export interface LocationVisitItemApi {
  INITIATE_CVR_ID: string;
  CVR_NO: string;
  CVR_ID: string;
  VISIT_ID: string;
  VISIT_TYPE_ID: string;
  REPORTED_SOCO_DATE: string;
  REPORTED_SOCO_TIME: string;
  OFFENCE_TYPE: string;
  PLACE_DETAIL: string;
  SCENE_IN: string;
  SCENE_OUT: string;
  CREATED_DTM?: string;
}

export interface GetVisitsByCvrLocationIdResponse {
  isSuccess: boolean;
  errorShow: string | null;
  errorMessage: string | null;
  exceptionDetail: string | null;
  dataBundle: LocationVisitItemApi[];
}

export interface VisitHistoryItemApi {
  INITIATE_CVR_ID: string;
  CVR_NO: string;
  CVR_ID: string;
  VISIT_ID: string;
  VISIT_TYPE_ID: string;
  OFFENCE_TYPE: string;
  PLACE_DETAIL: string;
  SCENE_IN: string;
  SCENE_OUT: string;
  CREATED_DTM: string;
  CREATED_BY_NAME?: string;
}

export interface GetVisitHistoryByCvrIdResponse {
  isSuccess: boolean;
  errorShow: string | null;
  errorMessage: string | null;
  exceptionDetail: string | null;
  dataBundle: VisitHistoryItemApi[];
}

export interface ProductionAnalysisHistoryItemApi {
  ANALYSIS_HISTORY_ID: string;
  PRODUCTION_SENT_ANALYSIS_ID: string;
  CVR_ID: string;
  CREATED_DTM: string;
  CREATED_BY: string;
  CREATED_BY_NAME?: string;
}

export interface GetProductionAnalysisHistoryByCvrIdResponse {
  isSuccess: boolean;
  errorShow: string | null;
  errorMessage: string | null;
  exceptionDetail: string | null;
  dataBundle: ProductionAnalysisHistoryItemApi[];
}

export interface ProductionCourtHistoryItemApi {
  COURT_HISTORY_ID: string;
  PRODUCTION_SENT_COURT_ID: string;
  CVR_ID: string;
  CREATED_DTM: string;
  CREATED_BY: string;
  CREATED_BY_NAME?: string;
}

export interface GetProductionCourtHistoryByCvrIdResponse {
  isSuccess: boolean;
  errorShow: string | null;
  errorMessage: string | null;
  exceptionDetail: string | null;
  dataBundle: ProductionCourtHistoryItemApi[];
}

export interface CourtVisitDetailItemApi {
  COURT_VISIT_DETAILS_ID: string;
  INITIATE_COURT_VISIT_ID: string;
  COURT_ID: string;
  TESTIFIED_OFFICER_NAME: string;
  OFFICER_ID: string;
  VISIT_DESCRIPTION: string;
  COURT_VISIT_ATTACHEMENT_URL: string;
  CREATED_DTM: string;
  CREATED_BY_NAME?: string;
}

export interface GetCourtVisitsByCvrIdResponse {
  isSuccess: boolean;
  errorShow: string | null;
  errorMessage: string | null;
  exceptionDetail: string | null;
  dataBundle: CourtVisitDetailItemApi[];
}

// ─── File Upload Types ────────────────────────────────────────────────

/** Response for uploading a production analysis report file. */
export type UploadProductionAnalysisReportResponse = string;

/** Response for uploading a production court affidavit or questionnaire. */
export type UploadProductionCourtAffidavitResponse = string;

/** Response for uploading a court visit report. */
export type UploadCourtVisitReportResponse = string;

/** Response for uploading a CVR photo file. */
export type UploadCvrPhotoResponse = string;

/** Response for uploading a CVR sketch file. */
export type UploadCvrSketchResponse = string;

/** Response for uploading a CVR report file. */
export type UploadCvrReportResponse = string;

export interface ApproveCrimeSceneRequest {
  cvrId: number;
  approved_by: number;
}

export interface ApproveCrimeSceneResponse {
  isSuccess: boolean;
  errorShow: string | null;
  errorMessage: string | null;
  exceptionDetail: string | null;
  dataBundle: string;
}

/** Field names unconfirmed against a real payload — backend has only returned an empty array so far. */
export interface PendingCvrApprovalItemApi {
  CVR_ID?: string;
  CVR_NO?: string;
  INITIATE_CVR_ID?: string;
  VISIT_TYPE_ID?: string;
  CREATED_DTM?: string;
  [key: string]: unknown;
}

export interface GetPendingApprovalsByUserIdResponse {
  isSuccess: boolean;
  errorShow: string | null;
  errorMessage: string | null;
  exceptionDetail: string | null;
  dataBundle: PendingCvrApprovalItemApi[];
}

/** Field names unconfirmed against a real payload — backend has only returned an empty array so far. */
export interface ApprovedCrimeSceneItemApi {
  CVR_ID?: string;
  CVR_NO?: string;
  INITIATE_CVR_ID?: string;
  VISIT_TYPE_ID?: string;
  CREATED_DTM?: string;
  [key: string]: unknown;
}

export interface GetApprovedCrimeScenesByUserIdResponse {
  isSuccess: boolean;
  errorShow: string | null;
  errorMessage: string | null;
  exceptionDetail: string | null;
  dataBundle: ApprovedCrimeSceneItemApi[];
}












