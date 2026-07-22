export interface DistrictActivityItem {
  label: string;
  timeAgo: string;
}

export interface DistrictCvrDatum {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  province: string;
  officers: number;
  casesPerMonth: number;
  avgResponseTimeMin: number;
  crimeSceneVisits: number;
  evidenceCollected: number;
  weeklyTrend: number[];
  recentActivity: DistrictActivityItem[];
}

export const DEFAULT_DISTRICT_CVR: DistrictCvrDatum = {
  total: 0,
  pending: 0,
  approved: 0,
  rejected: 0,
  province: 'Unknown Province',
  officers: 0,
  casesPerMonth: 0,
  avgResponseTimeMin: 0,
  crimeSceneVisits: 0,
  evidenceCollected: 0,
  weeklyTrend: [0, 0, 0, 0, 0, 0, 0],
  recentActivity: [],
};

const DEFAULT_ACTIVITY: DistrictActivityItem[] = [
  { label: 'CVR submitted', timeAgo: '2h ago' },
  { label: 'Evidence batch uploaded', timeAgo: '4h ago' },
  { label: 'Officer dispatched', timeAgo: '6h ago' },
  { label: 'CVR approved', timeAgo: '1d ago' },
];

function buildDistrict(
  total: number,
  pending: number,
  approved: number,
  rejected: number,
  province: string,
  officers: number,
  casesPerMonth: number,
  avgResponseTimeMin: number,
  crimeSceneVisits: number,
  evidenceCollected: number,
  weeklyTrend: number[],
): DistrictCvrDatum {
  return {
    total,
    pending,
    approved,
    rejected,
    province,
    officers,
    casesPerMonth,
    avgResponseTimeMin,
    crimeSceneVisits,
    evidenceCollected,
    weeklyTrend,
    recentActivity: DEFAULT_ACTIVITY,
  };
}

export const DISTRICT_CVR_DATA: Record<string, DistrictCvrDatum> = {
  Colombo: buildDistrict(1542, 245, 1234, 63, 'Western Province', 58, 128, 22, 210, 1840, [1180, 1340, 1250, 1420, 1300, 1460, 1430]),
  Gampaha: buildDistrict(1124, 180, 890, 54, 'Western Province', 44, 94, 24, 165, 1320, [820, 960, 880, 1010, 900, 1040, 1020]),
  Kalutara: buildDistrict(548, 90, 432, 26, 'Western Province', 26, 46, 27, 88, 650, [390, 460, 400, 480, 420, 500, 480]),
  Kandy: buildDistrict(785, 120, 620, 45, 'Central Province', 34, 65, 26, 118, 940, [560, 660, 590, 700, 610, 720, 685]),
  Matale: buildDistrict(312, 52, 245, 15, 'Central Province', 16, 26, 30, 52, 380, [210, 260, 225, 275, 235, 280, 265]),
  'Nuwara Eliya': buildDistrict(356, 58, 280, 18, 'Central Province', 18, 30, 29, 58, 420, [240, 300, 255, 315, 265, 320, 300]),
  Galle: buildDistrict(410, 66, 322, 22, 'Southern Province', 22, 34, 25, 68, 490, [280, 350, 295, 360, 305, 370, 348]),
  Matara: buildDistrict(345, 55, 272, 18, 'Southern Province', 19, 29, 26, 56, 410, [235, 290, 245, 300, 255, 305, 290]),
  Hambantota: buildDistrict(298, 48, 234, 16, 'Southern Province', 15, 25, 28, 48, 350, [200, 250, 210, 260, 220, 265, 250]),
  Jaffna: buildDistrict(298, 45, 238, 15, 'Northern Province', 13, 28, 35, 72, 368, [185, 245, 195, 255, 205, 260, 245]),
  Kilinochchi: buildDistrict(110, 18, 86, 6, 'Northern Province', 6, 11, 38, 26, 130, [65, 95, 72, 100, 78, 105, 93]),
  Mannar: buildDistrict(96, 16, 74, 6, 'Northern Province', 5, 9, 37, 22, 112, [58, 82, 64, 88, 68, 90, 81]),
  Vavuniya: buildDistrict(128, 20, 100, 8, 'Northern Province', 7, 12, 34, 30, 148, [78, 110, 86, 115, 92, 118, 105]),
  Mullaitivu: buildDistrict(88, 15, 67, 6, 'Northern Province', 5, 8, 39, 20, 100, [52, 74, 58, 79, 62, 82, 74]),
  Batticaloa: buildDistrict(262, 42, 205, 15, 'Eastern Province', 17, 24, 30, 46, 300, [165, 220, 178, 228, 188, 232, 218]),
  Ampara: buildDistrict(281, 45, 220, 16, 'Eastern Province', 18, 26, 29, 50, 320, [178, 235, 190, 242, 200, 248, 233]),
  Trincomalee: buildDistrict(222, 36, 173, 13, 'Eastern Province', 14, 20, 31, 40, 250, [138, 185, 148, 192, 156, 196, 184]),
  Kurunegala: buildDistrict(652, 100, 512, 40, 'North Western Province', 32, 58, 26, 100, 780, [420, 540, 450, 560, 470, 575, 558]),
  Puttalam: buildDistrict(305, 48, 240, 17, 'North Western Province', 20, 28, 27, 52, 360, [195, 250, 208, 260, 218, 265, 253]),
  Anuradhapura: buildDistrict(320, 50, 252, 18, 'North Central Province', 21, 30, 28, 55, 380, [205, 265, 218, 275, 228, 280, 266]),
  Polonnaruwa: buildDistrict(190, 30, 150, 10, 'North Central Province', 12, 17, 29, 32, 220, [118, 155, 128, 162, 135, 165, 160]),
  Badulla: buildDistrict(340, 54, 268, 18, 'Uva Province', 22, 31, 27, 58, 400, [215, 280, 230, 290, 240, 295, 282]),
  Monaragala: buildDistrict(172, 27, 136, 9, 'Uva Province', 11, 15, 30, 28, 200, [105, 140, 114, 146, 120, 150, 145]),
  Ratnapura: buildDistrict(370, 58, 292, 20, 'Sabaragamuwa Province', 24, 34, 27, 62, 440, [235, 305, 250, 315, 262, 320, 306]),
  Kegalle: buildDistrict(295, 46, 232, 17, 'Sabaragamuwa Province', 19, 27, 27, 50, 350, [185, 245, 198, 253, 208, 258, 243]),
};
