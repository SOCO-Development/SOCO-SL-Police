'use client';

import { useId, useMemo } from 'react';
import type { CourtRewardCategoryKey, CourtRewardsUpdateDetails } from '@/types/crimeScene';
import { normalizeCourtRewardsUpdate } from '@/types/crimeScene';
import {
  COURT_REWARD_CATEGORY_LABELS,
  getCourtRewardTypesForCategory,
  sanitizeCourtRewardsUpdate,
} from '@/lib/courtRewardUtils';

const CATEGORY_KEYS: CourtRewardCategoryKey[] = ['police', 'dcrd', 'division'];

interface FieldGroupProps {
  label: string;
  children: React.ReactNode;
  className?: string;
}

function FieldGroup({ label, children, className = '' }: FieldGroupProps) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">{label}</label>
      {children}
    </div>
  );
}

function YesNoButtons({
  name,
  value,
  onChange,
  disabled = false,
}: {
  name: string;
  value: '' | 'Yes' | 'No';
  onChange: (v: 'Yes' | 'No') => void;
  disabled?: boolean;
}) {
  const current = value === 'Yes' || value === 'No' ? value : '';

  return (
    <div className="flex flex-wrap gap-3">
      {(['Yes', 'No'] as const).map((opt) => {
        const isYes = opt === 'Yes';
        const isSelected = current === opt;
        const base =
          'min-h-10 flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg border transition-colors';
        const yesStyle = isSelected
          ? 'bg-green-50 border-green-300 text-green-800 font-medium'
          : 'bg-white border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-600';
        const noStyle = isSelected
          ? 'bg-red-50 border-red-300 text-red-800 font-medium'
          : 'bg-white border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-600';
        return (
          <label
            key={opt}
            className={`${base} ${isYes ? yesStyle : noStyle} ${
              disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
            }`}
          >
            <input
              type="radio"
              name={name}
              value={opt}
              checked={isSelected}
              disabled={disabled}
              onChange={() => onChange(opt)}
              className={isYes ? 'accent-green-600' : 'accent-red-600'}
            />
            {opt}
          </label>
        );
      })}
    </div>
  );
}

function YesNoFieldRow({
  label,
  name,
  value,
  onChange,
  disabled = false,
}: {
  label: string;
  name: string;
  value: '' | 'Yes' | 'No';
  onChange: (v: 'Yes' | 'No') => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide shrink-0">{label}</span>
      <YesNoButtons name={name} value={value} onChange={onChange} disabled={disabled} />
    </div>
  );
}

interface CourtRewardsEditorProps {
  value: CourtRewardsUpdateDetails;
  onChange: (next: CourtRewardsUpdateDetails) => void;
  readOnly?: boolean;
}

export default function CourtRewardsEditor({
  value,
  onChange,
  readOnly = false,
}: CourtRewardsEditorProps) {
  const applicableGroupId = useId();
  const safeValue = useMemo(() => sanitizeCourtRewardsUpdate(normalizeCourtRewardsUpdate(value)), [value]);
  const rewardsActive = safeValue.rewardsEnabled === 'Yes';

  function patchCategory(
    key: CourtRewardCategoryKey,
    partial: Partial<CourtRewardsUpdateDetails['categories'][CourtRewardCategoryKey]>,
  ) {
    if (readOnly) return;
    onChange({
      ...safeValue,
      categories: {
        ...safeValue.categories,
        [key]: { ...safeValue.categories[key], ...partial },
      },
    });
  }

  function toggleRewardType(key: CourtRewardCategoryKey, typeId: string) {
    if (readOnly) return;
    const cat = safeValue.categories[key];
    if (!cat?.enabled || !rewardsActive) return;
    const starredIds = cat.starredIds ?? [];
    const next = starredIds.includes(typeId)
      ? starredIds.filter((id) => id !== typeId)
      : [...starredIds, typeId];
    patchCategory(key, { starredIds: next });
  }

  return (
    <div className="space-y-4">
      <YesNoFieldRow
        label="Rewards applicable"
        name={`court-rewards-applicable-${applicableGroupId}`}
        value={safeValue.rewardsEnabled}
        disabled={readOnly}
        onChange={(v) =>
          onChange({
            ...safeValue,
            rewardsEnabled: v,
            ...(v === 'No'
              ? {
                  categories: {
                    police: { ...safeValue.categories.police, starredIds: [] },
                    dcrd: { ...safeValue.categories.dcrd, starredIds: [] },
                    division: { ...safeValue.categories.division, starredIds: [] },
                  },
                }
              : {}),
          })
        }
      />

      {rewardsActive ? (
        <>
          <p className="text-xs text-gray-600">
            Select reward types for each category. Enable a category first, then tick the applicable reward types.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {CATEGORY_KEYS.map((key) => {
              const cat = safeValue.categories[key] ?? { enabled: true, starredIds: [] };
              const inactive = !cat.enabled;
              const rewardTypes = getCourtRewardTypesForCategory(key);
              const starredIds = cat.starredIds ?? [];

              return (
                <div
                  key={key}
                  className={`rounded-lg border bg-white p-4 shadow-sm space-y-3 ${
                    inactive ? 'border-gray-200 opacity-80' : 'border-teal-200/90'
                  }`}
                >
                  <h5 className="text-sm font-semibold text-gray-800 uppercase tracking-wide flex items-center gap-2">
                    <span
                      className={`w-1.5 h-4 rounded-full inline-block flex-shrink-0 ${
                        inactive ? 'bg-gray-400' : 'bg-teal-600'
                      }`}
                    />
                    {COURT_REWARD_CATEGORY_LABELS[key]}
                  </h5>

                  <YesNoFieldRow
                    label="Include category"
                    name={`court-rewards-cat-${key}`}
                    value={cat.enabled ? 'Yes' : 'No'}
                    disabled={readOnly}
                    onChange={(v) =>
                      patchCategory(key, {
                        enabled: v === 'Yes',
                        ...(v === 'No' ? { starredIds: [] } : {}),
                      })
                    }
                  />

                  <FieldGroup label="Reward types">
                    <div
                      className={`rounded-lg border divide-y divide-gray-100 ${
                        inactive || readOnly
                          ? 'border-gray-200 bg-gray-50/80'
                          : 'border-gray-200 bg-white'
                      }`}
                    >
                      {rewardTypes.map((type) => {
                        const checked = starredIds.includes(type.id);
                        const itemDisabled = readOnly || inactive;
                        return (
                          <label
                            key={`${key}-${type.id}`}
                            className={`flex items-center gap-2.5 px-3 py-2.5 text-sm ${
                              itemDisabled
                                ? 'cursor-default text-gray-400'
                                : 'cursor-pointer text-gray-800 hover:bg-gray-50'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              disabled={itemDisabled}
                              onChange={() => toggleRewardType(key, type.id)}
                              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-60 disabled:cursor-not-allowed"
                            />
                            <span className="leading-snug font-noto-sinhala">{type.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </FieldGroup>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <p className="text-sm text-gray-500">
          Choose <strong>Yes</strong> above to record court rewards for Police, D/CRD, and Division.
        </p>
      )}
    </div>
  );
}
