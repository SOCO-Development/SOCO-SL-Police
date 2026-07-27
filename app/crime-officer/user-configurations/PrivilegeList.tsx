'use client';

import CustomSelect from '@/components/forms/CustomSelect';
import { TableIconButton, Button } from '@/components/ui';
import { Trash2, Users2, ShieldCheck } from 'lucide-react';

export interface PrivilegeCategoryOption {
    value: string;
    label: string;
}

export interface UserPrivilege {
    id: string;
    categoryId: string;
}

export interface PrivilegeListProps {
    privileges: UserPrivilege[];
    categoryOptions: PrivilegeCategoryOption[];
    userName?: string;
    /** IDs of rows with an unsaved category selection, used to enable/highlight the row's Update action. */
    dirtyIds?: Set<string>;
    onCategoryChange?: (privilegeId: string, categoryId: string) => void;
    onUpdate?: (privilege: UserPrivilege) => void;
    onDelete?: (privilege: UserPrivilege) => void;
    emptyMessage?: string;
}

function getInitials(name: string) {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function PrivilegeList({
    privileges,
    categoryOptions,
    userName,
    dirtyIds,
    onCategoryChange,
    onUpdate,
    onDelete,
    emptyMessage = 'No privileges found.',
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
                        {privileges.length}
                        <span className="hidden sm:inline">{privileges.length === 1 ? 'privilege' : 'privileges'}</span>
                    </div>
                </div>
            )}

            {privileges.length === 0 ? (
                <div className="p-8 text-center text-gray-400 text-sm">{emptyMessage}</div>
            ) : (
                <>
                    <div className="hidden sm:flex items-center gap-4 px-5 py-2.5 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        <span className="w-6 shrink-0" />
                        <span className="w-9 shrink-0" />
                        <span className="flex-1">Privilege Category</span>
                        <span className="shrink-0">Actions</span>
                    </div>

                    <div className="divide-y divide-gray-100">
                        {privileges.map((row, index) => {
                            const isDirty = dirtyIds?.has(row.id) ?? false;
                            return (
                                <div
                                    key={row.id}
                                    className={`flex flex-wrap sm:flex-nowrap items-center gap-4 px-5 py-3.5 transition-colors ${
                                        isDirty ? 'bg-amber-50/60' : 'hover:bg-gray-50/70'
                                    }`}
                                >
                                    <span className="w-6 shrink-0 text-xs font-mono text-gray-400">
                                        {String(index + 1).padStart(2, '0')}
                                    </span>
                                    <span className="w-9 h-9 shrink-0 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                                        <Users2 className="w-4 h-4" aria-hidden />
                                    </span>

                                    <div className="flex-1 min-w-[200px] flex items-center gap-2">
                                        <div className="flex-1">
                                            <CustomSelect
                                                options={categoryOptions}
                                                value={row.categoryId}
                                                onChange={(val) => onCategoryChange?.(row.id, val)}
                                                placeholder="Select category"
                                            />
                                        </div>
                                        {isDirty && (
                                            <span
                                                className="w-2 h-2 rounded-full bg-amber-400 shrink-0"
                                                title="Unsaved change"
                                                aria-label="Unsaved change"
                                            />
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0">
                                        {onUpdate && (
                                            <Button
                                                type="button"
                                                variant="success"
                                                onClick={() => onUpdate(row)}
                                                disabled={!isDirty}
                                                title={isDirty ? 'Save the selected category' : 'No changes to save'}
                                                className="!min-h-8 !py-1.5 !text-xs px-4"
                                            >
                                                Update
                                            </Button>
                                        )}
                                        {onDelete && (
                                            <TableIconButton
                                                variant="delete"
                                                onClick={() => onDelete(row)}
                                                title="Delete privilege"
                                                aria-label="Delete privilege"
                                            >
                                                <Trash2 size={15} />
                                            </TableIconButton>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </>
            )}
        </div>
    );
}
