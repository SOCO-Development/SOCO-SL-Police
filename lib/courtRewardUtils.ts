import type { CourtRewardCategoryKey, CourtRewardsUpdateDetails } from '@/types/crimeScene';
import { normalizeCourtRewardsUpdate } from '@/types/crimeScene';

export type CourtRewardTypeId = 'money' | 'salary_increment' | 'commendation';

export interface CourtRewardType {
  id: CourtRewardTypeId;
  label: string;
}

export const COURT_REWARD_CATEGORY_LABELS: Record<CourtRewardCategoryKey, string> = {
  police: 'POLICE',
  dcrd: 'D/CRD',
  division: 'DIVISION',
};

export const COURT_REWARD_TYPES_BY_CATEGORY: Record<CourtRewardCategoryKey, CourtRewardType[]> = {
  police: [
    { id: 'money', label: 'මුදල්' },
    { id: 'salary_increment', label: 'වැටුප් වර්ධක' },
    { id: 'commendation', label: 'ප්‍රශංසා' },
  ],
  dcrd: [
    { id: 'money', label: 'මුදල්' },
    { id: 'commendation', label: 'ප්‍රශංසා' },
  ],
  division: [
    { id: 'money', label: 'මුදල්' },
    { id: 'commendation', label: 'ප්‍රශංසා' },
  ],
};

export function getCourtRewardTypesForCategory(key: CourtRewardCategoryKey): CourtRewardType[] {
  return COURT_REWARD_TYPES_BY_CATEGORY[key];
}

export function filterValidRewardTypeIds(category: CourtRewardCategoryKey, ids: string[]): string[] {
  const valid = new Set(COURT_REWARD_TYPES_BY_CATEGORY[category].map((t) => t.id));
  return ids.filter((id) => valid.has(id as CourtRewardTypeId));
}

export function sanitizeCourtRewardsUpdate(data: CourtRewardsUpdateDetails): CourtRewardsUpdateDetails {
  const base = normalizeCourtRewardsUpdate(data);
  return {
    ...base,
    categories: {
      police: {
        ...base.categories.police,
        starredIds: filterValidRewardTypeIds('police', base.categories.police.starredIds),
      },
      dcrd: {
        ...base.categories.dcrd,
        starredIds: filterValidRewardTypeIds('dcrd', base.categories.dcrd.starredIds),
      },
      division: {
        ...base.categories.division,
        starredIds: filterValidRewardTypeIds('division', base.categories.division.starredIds),
      },
    },
  };
}
