'use client';

import { useMemo } from 'react';
import AppTable, { type AppTableColumn } from '@/components/layout/AppTable';
import CustomSelect from '@/components/forms/CustomSelect';
import MultiSelect from '@/components/forms/MultiSelect';
import { TableIconButton } from '@/components/ui';
import { Pencil, Trash2 } from 'lucide-react';

export type UserRole = 'Admin' | 'Officer';

export type PrivilegeType = 'ADDING_USERS' | 'VIEW_ACCESS' | 'EDIT_ACCESS';

export const PRIVILEGE_OPTIONS: { value: PrivilegeType; label: string }[] = [
    { value: 'ADDING_USERS', label: 'Adding Users' },
    { value: 'VIEW_ACCESS', label: 'View Access' },
    { value: 'EDIT_ACCESS', label: 'Edit Access' },
];

export interface ManagedUser {
    id: string;
    fullName: string;
    regNo: string;
    mobileNumber: string;
    locationId: string;
    locationName: string;
    role: string;
    privileges: string;
    privilegeLocations: string;
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
            { 
                key: 'regNo', 
                label: 'Reg. No', 
                sortable: true, 
                render: (_, row) => <span className="font-mono text-xs text-blue-700 font-semibold">{row.regNo || '-'}</span> 
            },
            { key: 'mobileNumber', label: 'Mobile No.', sortable: true, className: 'font-mono text-xs text-gray-600' },
            { key: 'locationName', label: 'SOCO Lab', sortable: true },
            {
                key: 'privileges',
                label: 'Privilege Type',
                sortable: true,
                render: (_, row) => (
                    <span className="text-gray-700">{row.privileges || '-'}</span>
                ),
            },
            {
                key: 'role',
                label: 'Authorization Role',
                sortable: true,
                render: (_, row) => (
                    <span className="text-gray-700">{row.role || '-'}</span>
                ),
            },
            {
                key: 'privilegeLocations',
                label: 'Privilege Locations',
                sortable: true,
                render: (_, row) => (
                    <span className="text-gray-700">{row.privilegeLocations || '-'}</span>
                ),
            }
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
