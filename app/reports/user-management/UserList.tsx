'use client';

import { useMemo } from 'react';
import AppTable, { type AppTableColumn } from '@/components/layout/AppTable';
import CustomSelect from '@/components/forms/CustomSelect';
import MultiSelect from '@/components/forms/MultiSelect';

export type UserRole = 'Admin' | 'Officer' | string;

export type PrivilegeType = 'ADDING_USERS' | 'VIEW_ACCESS' | 'EDIT_ACCESS' | string;

export const PRIVILEGE_OPTIONS: { value: PrivilegeType; label: string }[] = [
    { value: 'ADDING_USERS', label: 'Adding Users' },
    { value: 'VIEW_ACCESS', label: 'View Access' },
    { value: 'EDIT_ACCESS', label: 'Edit Access' },
];

export interface ManagedUser {
    id: string;
    fullName: string;
    regNo?: string;
    designation?: string;
    mobileNumber: string;
    locationId: string;
    locationName: string;
    role?: string[] | UserRole;
    privileges?: string[] | PrivilegeType[];
    privilegeLocations?: string[];
}

export interface UserListProps {
    users: ManagedUser[];
    sortKey?: keyof ManagedUser | string | null;
    sortAsc?: boolean;
    onSort?: (key: keyof ManagedUser | string) => void;
    emptyMessage?: string;
    onRoleChange?: (userId: string, role: UserRole) => void;
    onPrivilegesChange?: (userId: string, privileges: PrivilegeType[]) => void;
}

export default function UserList({
    users,
    sortKey = null,
    sortAsc = true,
    onSort,
    emptyMessage = 'No users found.',
    onRoleChange,
    onPrivilegesChange,
}: UserListProps) {
    const columns: AppTableColumn<ManagedUser>[] = useMemo(
        () => {
            const cols: AppTableColumn<ManagedUser>[] = [
                {
                    key: 'fullName',
                    label: 'Full Name',
                    sortable: true,
                    className: 'font-semibold text-gray-800 !align-top min-w-[160px]',
                },
                {
                    key: 'regNo',
                    label: 'Reg. No',
                    sortable: true,
                    className: '!align-top min-w-[90px]',
                    render: (_, row) => (
                        <span className="font-mono text-xs text-blue-700 font-semibold">{row.regNo || '-'}</span>
                    ),
                },
                {
                    key: 'designation',
                    label: 'Designation',
                    sortable: true,
                    className: '!align-top min-w-[120px]',
                    render: (_, row) => <span className="text-gray-700 text-sm">{row.designation || '-'}</span>,
                },
                {
                    key: 'mobileNumber',
                    label: 'Mobile No.',
                    sortable: true,
                    className: 'font-mono text-xs text-gray-600 !align-top min-w-[110px]',
                    render: (_, row) => <span>{row.mobileNumber || '-'}</span>,
                },
                {
                    key: 'locationName',
                    label: 'SOCO Lab',
                    sortable: true,
                    className: '!align-top min-w-[130px]',
                    render: (_, row) => (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                            {row.locationName || '-'}
                        </span>
                    ),
                },
                {
                    key: 'privileges',
                    label: 'Privilege Type',
                    sortable: true,
                    className: '!align-top min-w-[180px]',
                    render: (_, row) => {
                        const privs = Array.isArray(row.privileges) ? row.privileges : row.privileges ? [row.privileges] : [];
                        if (onPrivilegesChange && typeof row.privileges !== 'object') {
                            return (
                                <div className="min-w-[220px]">
                                    <MultiSelect
                                        options={PRIVILEGE_OPTIONS}
                                        value={Array.isArray(row.privileges) ? (row.privileges as PrivilegeType[]) : []}
                                        onChange={(val) => onPrivilegesChange?.(row.id, val as PrivilegeType[])}
                                        placeholder="Select privileges"
                                    />
                                </div>
                            );
                        }
                        return (
                            <div className="flex flex-col items-start gap-1 max-w-[260px]">
                                {privs.length > 0 ? (
                                    privs.map((p, i) => (
                                        <span
                                            key={i}
                                            className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200/70"
                                        >
                                            {p}
                                        </span>
                                    ))
                                ) : (
                                    <span className="text-gray-400 text-xs">-</span>
                                )}
                            </div>
                        );
                    },
                },
                {
                    key: 'role',
                    label: 'Authorization Role',
                    sortable: true,
                    className: '!align-top min-w-[180px]',
                    render: (_, row) => {
                        const roles = Array.isArray(row.role) ? row.role : row.role ? [row.role] : [];
                        if (onRoleChange && typeof row.role === 'string') {
                            return (
                                <div className="min-w-[120px]">
                                    <CustomSelect
                                        options={[
                                            { value: 'Officer', label: 'Officer' },
                                            { value: 'Admin', label: 'Admin' },
                                        ]}
                                        value={row.role}
                                        onChange={(val) => onRoleChange?.(row.id, val as UserRole)}
                                    />
                                </div>
                            );
                        }
                        return (
                            <div className="flex flex-col items-start gap-1 max-w-[260px]">
                                {roles.length > 0 ? (
                                    roles.map((r, i) => (
                                        <span
                                            key={i}
                                            className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200/70"
                                        >
                                            {r}
                                        </span>
                                    ))
                                ) : (
                                    <span className="text-gray-400 text-xs">-</span>
                                )}
                            </div>
                        );
                    },
                },
                {
                    key: 'privilegeLocations',
                    label: 'Privilege Locations',
                    sortable: true,
                    className: '!align-top min-w-[200px]',
                    render: (_, row) => (
                        <div className="flex flex-col items-start gap-1 max-w-[280px]">
                            {row.privilegeLocations && row.privilegeLocations.length > 0 ? (
                                row.privilegeLocations.map((l, i) => (
                                    <span
                                        key={i}
                                        className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200/70"
                                    >
                                        {l}
                                    </span>
                                ))
                            ) : (
                                <span className="text-gray-400 text-xs">-</span>
                            )}
                        </div>
                    ),
                },
            ];

            return cols;
        },
        [onRoleChange, onPrivilegesChange],
    );

    return (
        <AppTable<ManagedUser>
            columns={columns}
            data={users}
            keyField="id"
            sortKey={sortKey}
            sortAsc={sortAsc}
            onSort={onSort}
            emptyMessage={emptyMessage}
            variant="card"
        />
    );
}
