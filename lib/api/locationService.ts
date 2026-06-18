import { apiRequest } from './client';
import type {
  ApiDivision,
  ApiLocation,
  ApiProvince,
  InsertDivisionRequest,
  UpdateDivisionRequest,
  InsertNewSocoLabRequest,
  InsertNewSocoLabResponse,
} from './types';

export async function getAllLocations(): Promise<ApiLocation[]> {
  return apiRequest<ApiLocation[]>('Location/GetAllLocations');
}

export async function getAllProvinces(): Promise<ApiProvince[]> {
  return apiRequest<ApiProvince[]>('Location/GetAllProvinces');
}

export async function getAllDivisionsByProvince(provinceId: number): Promise<ApiDivision[]> {
  return apiRequest<ApiDivision[]>('Location/GetAllDivisionsByProvince', {
    params: { ProvinceId: provinceId },
  });
}

export async function getDivisionById(divisionId: number): Promise<ApiDivision[]> {
  return apiRequest<ApiDivision[]>('Location/GetDivisionById', {
    params: { divisionId },
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

export async function insertNewSocoLab(
  payload: InsertNewSocoLabRequest,
): Promise<InsertNewSocoLabResponse> {
  return apiRequest<InsertNewSocoLabResponse>('Location/InsertNewSocoLab', {
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
  let apiProvinces: ApiProvince[] = [];
  try {
    apiProvinces = await getAllProvinces();
  } catch (err) {
    console.error('Failed to load provinces from API', err);
  }

  const provinceList = apiProvinces.length > 0
    ? apiProvinces.map((p, idx) => ({
        id: p.PROVINCE_ID ? Number(p.PROVINCE_ID) : (idx + 1),
        name: p.PROVINCE_NAME,
      }))
    : Array.from({ length: MAX_PROVINCE_ID }, (_, i) => ({
        id: i + 1,
        name: `Province ${i + 1}`,
      }));

  const [apiLocations, divisionGroups] = await Promise.all([
    getAllLocations(),
    Promise.all(
      provinceList.map(async (prov) => {
        try {
          const divisions = await getAllDivisionsByProvince(prov.id);
          return { provinceId: prov.id, provinceName: prov.name, divisions };
        } catch {
          return { provinceId: prov.id, provinceName: prov.name, divisions: [] as ApiDivision[] };
        }
      }),
    ),
  ]);

  const provinces: ProvinceOption[] = [];
  const divisionById = new Map<string, { name: string; province: string; provinceId: string }>();

  for (const { provinceId, provinceName, divisions } of divisionGroups) {
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
