'use client';

import { Button } from '@/components/ui';
import { ShieldCheck } from 'lucide-react';

export interface PrivilegeRow {
    privilegeConfigurationId: string;
    privilegeType: string;
    privilegeRole: string;
}

export interface PrivilegeListProps {
    rows: PrivilegeRow[];
    /** IDs currently toggled ON. */
    selectedPrivilegeIds: string[];
    onToggle: (id: string, nextValue: boolean) => void;
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

function ToggleSwitch({
    checked,
    onChange,
    label,
}: {
    checked: boolean;
    onChange: (next: boolean) => void;
    label: string;
}) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            aria-label={label}
            onClick={() => onChange(!checked)}
            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 ${
                checked ? 'bg-emerald-500' : 'bg-gray-300'
            }`}
        >
            <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${
                    checked ? 'translate-x-6' : 'translate-x-1'
                }`}
            />
        </button>
    );
}

export default function PrivilegeList({
    rows,
    selectedPrivilegeIds,
    onToggle,
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

            {rows.length === 0 ? (
                <div className="p-8 text-center text-gray-400 text-sm">{emptyMessage}</div>
            ) : (
                <>
                    <div className="hidden sm:flex items-center gap-4 px-5 py-2.5 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        <span className="flex-1">Privilege Type</span>
                        <span className="flex-1">Privilege Role</span>
                        <span className="w-11 shrink-0 text-right">Status</span>
                    </div>

                    <div className="divide-y divide-gray-100">
                        {rows.map((row) => {
                            const checked = selectedPrivilegeIds.includes(row.privilegeConfigurationId);
                            return (
                                <div
                                    key={row.privilegeConfigurationId}
                                    className="flex flex-wrap sm:flex-nowrap items-center gap-4 px-5 py-3.5 hover:bg-gray-50/70 transition-colors"
                                >
                                    <span className="flex-1 min-w-[140px] text-sm text-gray-700">{row.privilegeType}</span>
                                    <span className="flex-1 min-w-[140px] text-sm font-medium text-gray-900">{row.privilegeRole}</span>
                                    <span className="w-11 shrink-0 flex justify-end">
                                        <ToggleSwitch
                                            checked={checked}
                                            onChange={(next) => onToggle(row.privilegeConfigurationId, next)}
                                            label={`${row.privilegeType} — ${row.privilegeRole}`}
                                        />
                                    </span>
                                </div>
                            );
                        })}
                    </div>

                    <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-gray-100">
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
                </>
            )}
        </div>
    );
}
