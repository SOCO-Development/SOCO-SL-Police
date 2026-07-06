import { useState, useEffect, useCallback } from 'react';
import { userService } from '@/lib/api';
import type { UserRank } from '@/lib/api/types';
import { ANNEX_12_RANK } from '@/lib/annexData';

const MAX_RANK_ID = 20;

async function fetchRanksById(): Promise<{ id: string; name: string }[]> {
  const ids = Array.from({ length: MAX_RANK_ID }, (_, i) => String(i + 1));
  const results = await Promise.allSettled(
    ids.map((id) => userService.getUserRankById(id)),
  );
  const ranks: { id: string; name: string }[] = [];
  results.forEach((res) => {
    if (res.status === 'fulfilled' && res.value) {
      ranks.push({ id: res.value.RANK_ID, name: res.value.RANK_NAME });
    }
  });
  return ranks;
}

function buildMaps(ranks: { id: string; name: string }[]) {
  const nameToId = new Map<string, string>();
  const idToName = new Map<string, string>();
  ranks.forEach((r) => {
    nameToId.set(r.name, r.id);
    idToName.set(r.id, r.name);
  });
  return { nameToId, idToName };
}

export interface UserData {
  ranks: { id: string; name: string }[];
  rankNameToId: Map<string, string>;
  rankIdToName: Map<string, string>;
  loading: boolean;
  error: string | null;
}

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

      let ranks: { id: string; name: string }[];
      if (apiRanks.length > 0) {
        ranks = apiRanks.map((rank) => ({ id: rank.RANK_ID, name: rank.RANK_NAME }));
      } else {
        const byId = await fetchRanksById();
        ranks = byId.length > 0
          ? byId
          : ANNEX_12_RANK.map((name, idx) => ({ id: String(idx + 1), name }));
      }

      const { nameToId, idToName } = buildMaps(ranks);
      setData({ ranks, rankNameToId: nameToId, rankIdToName: idToName, loading: false, error: null });
    } catch {
      const byId = await fetchRanksById();
      const ranks = byId.length > 0
        ? byId
        : ANNEX_12_RANK.map((name, idx) => ({ id: String(idx + 1), name }));
      const { nameToId, idToName } = buildMaps(ranks);
      setData({ ranks, rankNameToId: nameToId, rankIdToName: idToName, loading: false, error: null });
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return data;
}
