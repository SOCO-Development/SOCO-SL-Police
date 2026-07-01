import { crimeService } from '@/lib/api';
import type { ProductionItem } from '@/lib/api/types';

/** Option value for “Others” — when selected, a free-text field is shown. */
export const PRODUCTION_PR_OTHERS_VALUE = 'Others';

export type ProductionOption = { value: string; label: string };

export function mapProductionItemsToOptions(items: ProductionItem[] | undefined | null): ProductionOption[] {
  return (items ?? [])
    .map((item) => ({
      value: String(item.PRODUCTION_ID ?? item.productionId ?? '').trim(),
      label: String(item.PRODUCTION_NAME ?? item.productionName ?? '').trim(),
    }))
    .filter((item) => item.value && item.label);
}

export async function loadProductionTypeOptions(): Promise<ProductionOption[]> {
  const response = await crimeService.getAllProductions();
  return mapProductionItemsToOptions(response);
}

export function productionPRHasOthersSelected(types: string[] | undefined): boolean {
  return (types ?? []).includes(PRODUCTION_PR_OTHERS_VALUE);
}

/** Resolve stored value to a display label using API-loaded options. */
export function getProductionPRDisplayLabel(
  storedValue: string,
  options: ProductionOption[] = [],
): string {
  if (storedValue === PRODUCTION_PR_OTHERS_VALUE) return 'Others';
  const opt = options.find((o) => o.value === storedValue);
  return opt?.label ?? storedValue;
}

/** Dropdown options limited to items selected under Production Availability. */
export function productionOptionsForSelection(
  selected: string[] | undefined,
  options: ProductionOption[] = [],
): { value: string; label: string }[] {
  if (!selected?.length || !options.length) return [];
  const allowed = new Set(selected);
  return options.filter((o) => allowed.has(o.value));
}
