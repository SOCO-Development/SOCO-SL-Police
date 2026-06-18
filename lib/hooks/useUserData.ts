import { useState, useEffect, useCallback } from 'react';
import { userService } from '@/lib/api';
import type { UserRank } from '@/lib/api/types';

export interface UserData {
  ranks: { id: string; name: string }[];
  rankNameToId: Map<string, string>;
  rankIdToName: Map<string, string>;
  loading: boolean;
  error: string | null;
}

/**
 * Hook to fetch and manage user rank data from the API
 * Caches results to avoid repeated API calls
 * Provides name-to-ID and ID-to-name mappings
 */
export function useUserData() {
  const [data, setData] = useState<UserData>({
    ranks: [],
    rankNameToId: new Map(),
    rankIdToName: new Map(),
    loading: true,
    error: null,
  });

  const fetchData = useCallback(async () => {
    try {
      setData((prev) => ({ ...prev, loading: true, error: null }));
      const apiRanks = await userService.getUserRanks();

      // Create mappings for both directions
      const nameToId = new Map<string, string>();
      const idToName = new Map<string, string>();

      apiRanks.forEach((rank) => {
        nameToId.set(rank.RANK_NAME, rank.RANK_ID);
        idToName.set(rank.RANK_ID, rank.RANK_NAME);
      });

      setData({
        ranks: apiRanks.map((rank) => ({ id: rank.RANK_ID, name: rank.RANK_NAME })),
        rankNameToId: nameToId,
        rankIdToName: idToName,
        loading: false,
        error: null,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load user rank data';
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
