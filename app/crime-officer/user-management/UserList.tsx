'use client';

import { useMemo } from 'react';
import AppTable, { type AppTableColumn } from '@/components/layout/AppTable';

/** Privilege options for the multi-select dropdown/badge display. */
export const PRIVILEGE_OPTIONS: { value: string; label: string }[] = [
    { value: 'ADDING_USERS', label: 'Adding Users' },
    { value: 'VIEW_ACCESS', label: 'View Access' },
    { value: 'EDIT_ACCESS', label: 'Edit Access' },
];

export interface ManagedUser {
    id: string;
    fullName: string;
    mobileNumber: string;
    locationId: string;
    locationName: string;
    privilegeLocations: string[];
    privileges: string[];
}

export interface UserListProps {
    users: ManagedUser[];
    sortKey?: keyof ManagedUser | string | null;
    sortAsc?: boolean;
    onSort?: (key: keyof ManagedUser | string) => void;
    emptyMessage?: string;
}

export default function UserList({
    users,
    sortKey = null,
    sortAsc = true,
    onSort,
    emptyMessage = 'No users found.',
}: UserListProps) {
    const columns: AppTableColumn<ManagedUser>[] = useMemo(
        () => [
            { key: 'fullName', label: 'Full Name', sortable: true, className: 'font-semibold text-gray-800' },
            { key: 'mobileNumber', label: 'Mobile Number', sortable: true, className: 'font-mono text-xs text-gray-600' },
            { key: 'locationName', label: 'SOCO Location', sortable: true },
            {
                key: 'privilegeLocations',
                label: 'Privilege Locations',
                render: (_, row) => (
                    <div className="flex flex-wrap gap-1 min-w-[160px]">
                        {row.privilegeLocations.length > 0 ? (
                            row.privilegeLocations.map((locName) => (
                                <span
                                    key={locName}
                                    className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200"
                                >
                                    {locName}
                                </span>
                            ))
                        ) : (
                            <span className="text-xs text-gray-400">—</span>
                        )}
                    </div>
                ),
            },
            {
                key: 'privileges',
                label: 'Privileges',
                render: (_, row) => (
                    <div className="flex flex-wrap gap-1 min-w-[160px]">
                        {row.privileges.length > 0 ? (
                            row.privileges.map((priv) => {
                                const label = PRIVILEGE_OPTIONS.find((o) => o.value === priv)?.label ?? priv;
                                return (
                                    <span
                                        key={priv}
                                        className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200"
                                    >
                                        {label}
                                    </span>
                                );
                            })
                        ) : (
                            <span className="text-xs text-gray-400">—</span>
                        )}
                    </div>
                ),
            },
        ],
        [],
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
