import { useState, useEffect, useCallback } from 'react';
import { getLocationRegistry, type LocationRegistry } from '@/lib/api/locationService';

export interface LocationData {
  locations: { id: string; name: string }[];
  provinces: { id: number; name: string }[];
  divisions: { id: string; name: string }[];
  locationNameToId: Map<string, string>;
  loading: boolean;
  error: string | null;
}

/**
 * Hook to fetch and manage location data from the API
 * Caches results to avoid repeated API calls
 */
export function useLocationData() {
  const [data, setData] = useState<LocationData>({
    locations: [],
    provinces: [],
    divisions: [],
    locationNameToId: new Map(),
    loading: true,
    error: null,
  });

  const fetchData = useCallback(async () => {
    try {
      setData((prev) => ({ ...prev, loading: true, error: null }));
      const registry = await getLocationRegistry();

      // Create a map of location names to their IDs
      const nameToId = new Map<string, string>();
      registry.locations.forEach((loc) => {
        nameToId.set(loc.name, loc.id);
      });

      setData({
        locations: registry.locations.map((loc) => ({ id: loc.id, name: loc.name })),
        provinces: registry.provinces,
        divisions: [],
        locationNameToId: nameToId,
        loading: false,
        error: null,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load location data';
      setData((prev) => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return data;
}
