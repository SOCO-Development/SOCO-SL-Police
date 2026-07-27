'use client';

import MultiSelect from '@/components/forms/MultiSelect';
import { Button } from '@/components/ui';
import { ShieldCheck } from 'lucide-react';

export interface PrivilegeOption {
    value: string;
    label: string;
}

export interface PrivilegeListProps {
    /** Flattened, grouped-by-type privilege options for the MultiSelect. */
    privilegeOptions: PrivilegeOption[];
    /** Currently selected privilege configuration IDs (as strings, to match MultiSelect). */
    selectedPrivilegeIds: string[];
    onChange: (ids: string[]) => void;
    userName?: string;
    isDirty?: boolean;
    isSaving?: boolean;
    onSave?: () => void;
    emptyMessage?: string;
}

function getInitials(name: string) {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function PrivilegeList({
    privilegeOptions,
    selectedPrivilegeIds,
    onChange,
    userName,
    isDirty = false,
    isSaving = false,
    onSave,
    emptyMessage = 'No privileges available.',
}: PrivilegeListProps) {
    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            {userName && (
                <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-gray-200">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="relative shrink-0">
                            <div className="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center font-semibold text-sm">
                                {getInitials(userName)}
                            </div>
                            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white" />
                        </div>
                        <div className="min-w-0">
                            <p className="font-semibold text-gray-900 truncate">{userName}</p>
                            <p className="text-sm text-gray-500 truncate">User privileges &amp; access control</p>
                        </div>
                    </div>
                    <div className="shrink-0 flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700">
                        <ShieldCheck className="w-4 h-4" aria-hidden />
                        {selectedPrivilegeIds.length}
                        <span className="hidden sm:inline">
                            {selectedPrivilegeIds.length === 1 ? 'privilege' : 'privileges'}
                        </span>
                    </div>
                </div>
            )}

            {privilegeOptions.length === 0 ? (
                <div className="p-8 text-center text-gray-400 text-sm">{emptyMessage}</div>
            ) : (
                <div className="p-5 flex flex-col gap-4">
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">
                            Privilege Categories
                        </label>
                        <MultiSelect
                            options={privilegeOptions}
                            value={selectedPrivilegeIds}
                            onChange={onChange}
                            placeholder="Select privileges"
                        />
                    </div>

                    <div className="flex items-center justify-end gap-2">
                        {isDirty && <span className="text-xs text-amber-600 mr-auto">Unsaved changes</span>}
                        <Button
                            type="button"
                            variant="success"
                            onClick={onSave}
                            disabled={!isDirty || isSaving}
                            className="!min-h-9 !py-2 !text-sm px-5"
                        >
                            {isSaving ? 'Saving…' : 'Save Privileges'}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
