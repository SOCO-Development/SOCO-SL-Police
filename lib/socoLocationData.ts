import { DISTRICT_CVR_DATA, DEFAULT_DISTRICT_CVR, type DistrictCvrDatum } from '@/lib/districtCvrData';

export interface SocoLocation {
  /** SOCO location name, as used by the location registry. */
  name: string;
  /** Parent district — must match a key in DISTRICT_CVR_DATA / the geojson. */
  district: string;
  lat: number;
  lng: number;
}

export interface SocoLocationDatum extends DistrictCvrDatum {
  name: string;
  district: string;
  lat: number;
  lng: number;
}

interface LocationSeed extends SocoLocation {
  /** Relative share of the parent district's figures. Weights per district sum to 1. */
  weight: number;
}

// The 41 SOCO locations grouped under their district. Coordinates are the town
// centres — pins are indicative markers, not jurisdiction boundaries (we have
// no sub-district geometry, only the 25 district polygons).
const LOCATION_SEEDS: LocationSeed[] = [
  // Colombo
  { name: 'Colombo Central', district: 'Colombo', lat: 6.8850, lng: 79.8550, weight: 0.28 },
  { name: 'Colombo North', district: 'Colombo', lat: 6.9300, lng: 79.9200, weight: 0.2 },
  { name: 'Colombo South', district: 'Colombo', lat: 6.7850, lng: 79.8950, weight: 0.22 },
  { name: 'Mt. Lavinia', district: 'Colombo', lat: 6.8150, lng: 79.8700, weight: 0.14 },
  { name: 'Nugegoda', district: 'Colombo', lat: 6.8730, lng: 79.9300, weight: 0.16 },
  // Gampaha
  { name: 'Kelaniya', district: 'Gampaha', lat: 6.965, lng: 79.922, weight: 0.34 },
  { name: 'Gampaha', district: 'Gampaha', lat: 7.0917, lng: 79.9997, weight: 0.36 },
  { name: 'Negombo', district: 'Gampaha', lat: 7.2062, lng: 79.8404, weight: 0.3 },
  // Kalutara
  { name: 'Kaluthara', district: 'Kalutara', lat: 6.5854, lng: 79.9607, weight: 0.55 },
  { name: 'Panadura', district: 'Kalutara', lat: 6.6930, lng: 79.9364, weight: 0.45 },
  // Kandy
  { name: 'Kandy', district: 'Kandy', lat: 7.2906, lng: 80.6337, weight: 0.55 },
  { name: 'Gampola', district: 'Kandy', lat: 7.1835, lng: 80.5985, weight: 0.24 },
  { name: 'Teldeniya', district: 'Kandy', lat: 7.3057, lng: 80.7002, weight: 0.21 },
  // Matale
  { name: 'Matale', district: 'Matale', lat: 7.4675, lng: 80.6234, weight: 1 },
  // Nuwara Eliya
  { name: 'Nuwaraeliya', district: 'Nuwara Eliya', lat: 6.9497, lng: 80.7891, weight: 0.58 },
  { name: 'Hatton', district: 'Nuwara Eliya', lat: 6.8917, lng: 80.5956, weight: 0.42 },
  // Badulla
  { name: 'Badulla', district: 'Badulla', lat: 6.9895, lng: 81.055, weight: 0.6 },
  { name: 'Bandarawela', district: 'Badulla', lat: 6.83, lng: 80.987, weight: 0.4 },
  // Monaragala
  { name: 'Monaragala', district: 'Monaragala', lat: 6.8728, lng: 81.3509, weight: 1 },
  // Kurunegala
  { name: 'Kurunegala', district: 'Kurunegala', lat: 7.5076, lng: 80.3496, weight: 0.5 },
  { name: 'Kuliyapitiya', district: 'Kurunegala', lat: 7.47, lng: 80.04, weight: 0.28 },
  { name: 'Nikaweratiya', district: 'Kurunegala', lat: 7.75, lng: 80.115, weight: 0.22 },
  // Puttalam
  { name: 'Chilaw', district: 'Puttalam', lat: 7.5758, lng: 79.7953, weight: 0.48 },
  { name: 'Puttalam', district: 'Puttalam', lat: 8.0362, lng: 79.8283, weight: 0.52 },
  // Anuradhapura
  { name: 'Anuradhapura', district: 'Anuradhapura', lat: 8.3114, lng: 80.4037, weight: 0.52 },
  { name: 'Thambuththegama', district: 'Anuradhapura', lat: 8.1681, lng: 80.1773, weight: 0.26 },
  { name: 'Kebithigollewa', district: 'Anuradhapura', lat: 8.6408, lng: 80.6698, weight: 0.22 },
  // Polonnaruwa
  { name: 'Polonnaruwa', district: 'Polonnaruwa', lat: 7.9403, lng: 81.0188, weight: 1 },
  // Galle
  { name: 'Galle', district: 'Galle', lat: 6.0535, lng: 80.221, weight: 0.66 },
  { name: 'Elpitiya', district: 'Galle', lat: 6.2917, lng: 80.1653, weight: 0.34 },
  // Matara
  { name: 'Matara', district: 'Matara', lat: 5.9549, lng: 80.555, weight: 1 },
  // Hambantota
  { name: 'Tangalle', district: 'Hambantota', lat: 6.024, lng: 80.794, weight: 1 },
  // Ratnapura
  { name: 'Ratnapura', district: 'Ratnapura', lat: 6.6828, lng: 80.3992, weight: 0.62 },
  { name: 'Embilipitiya', district: 'Ratnapura', lat: 6.3433, lng: 80.85, weight: 0.38 },
  // Kegalle
  { name: 'Kegalle', district: 'Kegalle', lat: 7.2513, lng: 80.3464, weight: 0.58 },
  { name: 'Seethawakapura', district: 'Kegalle', lat: 6.9732, lng: 80.2419, weight: 0.42 },
  // Northern
  { name: 'Jaffna', district: 'Jaffna', lat: 9.6615, lng: 80.0255, weight: 1 },
  { name: 'Kilinochchi', district: 'Kilinochchi', lat: 9.3961, lng: 80.3982, weight: 1 },
  { name: 'Vavuniya', district: 'Vavuniya', lat: 8.7514, lng: 80.4971, weight: 1 },
  { name: 'Mullaitive', district: 'Mullaitivu', lat: 9.2671, lng: 80.8142, weight: 1 },
  { name: 'Mannar', district: 'Mannar', lat: 8.981, lng: 79.9044, weight: 1 },
  // Ampara
  { name: 'Ampara', district: 'Ampara', lat: 7.2975, lng: 81.6747, weight: 0.68 },
  { name: 'Dehiattakandiya', district: 'Ampara', lat: 7.6715, lng: 81.0409, weight: 0.32 },
  // Trincomalee
  { name: 'Trincomalee', district: 'Trincomalee', lat: 8.5874, lng: 81.2152, weight: 0.64 },
  { name: 'Kantale', district: 'Trincomalee', lat: 8.3667, lng: 81.0, weight: 0.36 },
  // Batticaloa
  { name: 'Batticaloa', district: 'Batticaloa', lat: 7.7102, lng: 81.6924, weight: 1 },
];

/**
 * Split an integer total across weights so the parts sum back to exactly the
 * total (largest-remainder). This is what keeps "district = sum of its
 * locations" true for every figure the detail panel shows.
 */
function splitInteger(total: number, weights: number[]): number[] {
  const raw = weights.map((w) => total * w);
  const parts = raw.map((value) => Math.floor(value));
  let remaining = total - parts.reduce((sum, value) => sum + value, 0);

  const order = raw
    .map((value, index) => ({ index, remainder: value - Math.floor(value) }))
    .sort((a, b) => b.remainder - a.remainder);

  for (let i = 0; remaining > 0; i = (i + 1) % order.length) {
    parts[order[i].index] += 1;
    remaining -= 1;
  }

  return parts;
}

function buildLocationData(): Record<string, SocoLocationDatum> {
  const byDistrict = new Map<string, LocationSeed[]>();
  for (const seed of LOCATION_SEEDS) {
    const list = byDistrict.get(seed.district) ?? [];
    list.push(seed);
    byDistrict.set(seed.district, list);
  }

  const result: Record<string, SocoLocationDatum> = {};

  for (const [district, seeds] of byDistrict) {
    const districtDatum = DISTRICT_CVR_DATA[district] ?? DEFAULT_DISTRICT_CVR;
    const weights = seeds.map((seed) => seed.weight);

    const totals = splitInteger(districtDatum.total, weights);
    const pending = splitInteger(districtDatum.pending, weights);
    const approved = splitInteger(districtDatum.approved, weights);
    const rejected = splitInteger(districtDatum.rejected, weights);
    const officers = splitInteger(districtDatum.officers, weights);
    const casesPerMonth = splitInteger(districtDatum.casesPerMonth, weights);
    const crimeSceneVisits = splitInteger(districtDatum.crimeSceneVisits, weights);
    const evidenceCollected = splitInteger(districtDatum.evidenceCollected, weights);
    const trendSplits = districtDatum.weeklyTrend.map((day) => splitInteger(day, weights));

    seeds.forEach((seed, index) => {
      // Response time is a rate, not a count, so it isn't split — each location
      // varies deterministically around its district's average instead.
      const jitter = seeds.length === 1 ? 0 : ((index % 3) - 1) * 2;

      result[seed.name] = {
        name: seed.name,
        district: seed.district,
        lat: seed.lat,
        lng: seed.lng,
        province: `${district} District`,
        total: totals[index],
        pending: pending[index],
        approved: approved[index],
        rejected: rejected[index],
        officers: officers[index],
        casesPerMonth: casesPerMonth[index],
        avgResponseTimeMin: Math.max(1, districtDatum.avgResponseTimeMin + jitter),
        crimeSceneVisits: crimeSceneVisits[index],
        evidenceCollected: evidenceCollected[index],
        weeklyTrend: trendSplits.map((day) => day[index]),
        recentActivity: districtDatum.recentActivity,
      };
    });
  }

  return result;
}

export const SOCO_LOCATIONS: SocoLocation[] = LOCATION_SEEDS.map(({ name, district, lat, lng }) => ({
  name,
  district,
  lat,
  lng,
}));

export const SOCO_LOCATION_DATA: Record<string, SocoLocationDatum> = buildLocationData();

export const LOCATIONS_BY_DISTRICT: Record<string, string[]> = LOCATION_SEEDS.reduce(
  (acc, seed) => {
    (acc[seed.district] ??= []).push(seed.name);
    return acc;
  },
  {} as Record<string, string[]>,
);
