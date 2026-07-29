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
    designation: string;
    mobileNumber: string;
    locationId: string;
    locationName: string;
    role: string[];
    privileges: string[];
    privilegeLocations: string[];
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
            { key: 'fullName', label: 'Full Name', sortable: true, className: 'font-semibold text-gray-800 !align-top' },
            { 
                key: 'regNo', 
                label: 'Reg. No', 
                sortable: true, 
                className: '!align-top',
                render: (_, row) => <span className="font-mono text-xs text-blue-700 font-semibold">{row.regNo || '-'}</span> 
            },
            {
                key: 'designation',
                label: 'Designation',
                sortable: true,
                className: '!align-top',
                render: (_, row) => <span className="text-gray-700">{row.designation || '-'}</span>
            },
            { key: 'mobileNumber', label: 'Mobile No.', sortable: true, className: 'font-mono text-xs text-gray-600 !align-top' },
            { key: 'locationName', label: 'SOCO Lab', sortable: true, className: '!align-top' },
            {
                key: 'privileges',
                label: 'Privilege Type',
                sortable: true,
                className: '!align-top',
                render: (_, row) => (
                    <div className="flex flex-col gap-1">
                        {row.privileges?.length > 0 ? row.privileges.map((p, i) => (
                            <span key={i} className="text-gray-700 whitespace-nowrap">{p}</span>
                        )) : <span className="text-gray-700">-</span>}
                    </div>
                ),
            },
            {
                key: 'role',
                label: 'Authorization Role',
                sortable: true,
                className: '!align-top',
                render: (_, row) => (
                    <div className="flex flex-col gap-1">
                        {row.role?.length > 0 ? row.role.map((r, i) => (
                            <span key={i} className="text-gray-700 whitespace-nowrap">{r}</span>
                        )) : <span className="text-gray-700">-</span>}
                    </div>
                ),
            },
            {
                key: 'privilegeLocations',
                label: 'Privilege Locations',
                sortable: true,
                className: '!align-top',
                render: (_, row) => (
                    <div className="flex flex-col gap-1">
                        {row.privilegeLocations?.length > 0 ? row.privilegeLocations.map((l, i) => (
                            <span key={i} className="text-gray-700 whitespace-nowrap">{l}</span>
                        )) : <span className="text-gray-700">-</span>}
                    </div>
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
