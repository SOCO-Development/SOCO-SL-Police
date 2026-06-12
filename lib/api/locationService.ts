import { apiRequest } from './client';
import type {
  ApiDivision,
  ApiLocation,
  InsertDivisionRequest,
  UpdateDivisionRequest,
} from './types';

export async function getAllLocations(): Promise<ApiLocation[]> {
  return apiRequest<ApiLocation[]>('Location/GetAllLocations');
}

export async function getAllDivisionsByProvince(provinceId: number): Promise<ApiDivision[]> {
  return apiRequest<ApiDivision[]>('Location/GetAllDivisionsByProvince', {
    params: { ProvinceId: provinceId },
  });
}

export async function insertNewDivision(payload: InsertDivisionRequest): Promise<number> {
  return apiRequest<number>('Location/InsertNewDivision', {
    method: 'POST',
    body: payload,
  });
}

export async function updateDivision(payload: UpdateDivisionRequest): Promise<null> {
  return apiRequest<null>('Location/UpdateDivision', {
    method: 'POST',
    body: payload,
  });
}

export interface ProvinceOption {
  id: number;
  name: string;
}

export interface LocationRow {
  id: string;
  name: string;
  division: string;
  province: string;
  divisionId: string;
  provinceId: string;
}

export interface LocationRegistry {
  locations: LocationRow[];
  provinces: ProvinceOption[];
}

// Sri Lanka has 9 provinces. The deployed backend does not expose
// `GetAllProvinces` or `GetDivisionById` — province/division data comes
// from `GetAllDivisionsByProvince` only.
const MAX_PROVINCE_ID = 9;

let registryPromise: Promise<LocationRegistry> | null = null;

async function fetchLocationRegistry(): Promise<LocationRegistry> {
  const [apiLocations, divisionGroups] = await Promise.all([
    getAllLocations(),
    Promise.all(
      Array.from({ length: MAX_PROVINCE_ID }, (_, i) => i + 1).map(async (provinceId) => {
        try {
          const divisions = await getAllDivisionsByProvince(provinceId);
          return { provinceId, divisions };
        } catch {
          return { provinceId, divisions: [] as ApiDivision[] };
        }
      }),
    ),
  ]);

  const provinces: ProvinceOption[] = [];
  const divisionById = new Map<string, { name: string; province: string; provinceId: string }>();

  for (const { provinceId, divisions } of divisionGroups) {
    if (divisions.length === 0) continue;

    const provinceName = divisions[0].PROVINCE_NAME ?? `Province ${provinceId}`;
    provinces.push({ id: provinceId, name: provinceName });

    for (const division of divisions) {
      divisionById.set(division.DIVISION_ID, {
        name: division.DIVISION_NAME,
        province: division.PROVINCE_NAME ?? provinceName,
        provinceId: division.PROVINCE_ID ?? String(provinceId),
      });
    }
  }

  provinces.sort((a, b) => a.name.localeCompare(b.name));

  const locations: LocationRow[] = apiLocations.map((loc) => {
    const division = divisionById.get(loc.DIVISION_ID);
    return {
      id: loc.LOCATION_ID,
      name: loc.LOCATION_NAME,
      division: division?.name ?? `Division ${loc.DIVISION_ID}`,
      province: division?.province ?? '—',
      divisionId: loc.DIVISION_ID,
      provinceId: division?.provinceId ?? '',
    };
  });

  return { locations, provinces };
}

/** Load locations + provinces + divisions in one batched call (deduped). */
export async function getLocationRegistry(force = false): Promise<LocationRegistry> {
  if (force) registryPromise = null;

  if (!registryPromise) {
    registryPromise = fetchLocationRegistry().finally(() => {
      registryPromise = null;
    });
  }

  return registryPromise;
}
