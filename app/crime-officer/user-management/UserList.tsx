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
    mobileNumber: string;
    locationId: string;
    locationName: string;
    role: UserRole;
    privileges: PrivilegeType[];
}

const DUMMY_NAMES: Array<{ fullName: string; mobileNumber: string; role: UserRole; privileges: PrivilegeType[] }> = [
    { fullName: 'Kasun Perera', mobileNumber: '0771234567', role: 'Admin', privileges: ['ADDING_USERS', 'VIEW_ACCESS', 'EDIT_ACCESS'] },
    { fullName: 'Nimali Fernando', mobileNumber: '0712345678', role: 'Officer', privileges: ['VIEW_ACCESS'] },
    { fullName: 'Sampath Wickramasinghe', mobileNumber: '0763456789', role: 'Officer', privileges: ['VIEW_ACCESS'] },
    { fullName: 'Dilani Rathnayake', mobileNumber: '0754567890', role: 'Officer', privileges: ['VIEW_ACCESS', 'EDIT_ACCESS'] },
];

/** Sample users for a location, used to demo the list before real data is wired up. */
export function getDummyUsers(locationId: string, locationName: string): ManagedUser[] {
    return DUMMY_NAMES.map((u, idx) => ({
        id: `DUMMY-${locationId}-${idx}`,
        fullName: u.fullName,
        mobileNumber: u.mobileNumber,
        locationId,
        locationName,
        role: u.role,
        privileges: u.privileges,
    }));
}

export interface UserListProps {
    users: ManagedUser[];
    sortKey?: keyof ManagedUser | string | null;
    sortAsc?: boolean;
    onSort?: (key: keyof ManagedUser | string) => void;
    emptyMessage?: string;
    onEdit?: (user: ManagedUser) => void;
    onDelete?: (user: ManagedUser) => void;
    onRoleChange?: (userId: string, role: UserRole) => void;
    onPrivilegesChange?: (userId: string, privileges: PrivilegeType[]) => void;
}

export default function UserList({
    users,
    sortKey = null,
    sortAsc = true,
    onSort,
    emptyMessage = 'No users found.',
    onEdit,
    onDelete,
    onRoleChange,
    onPrivilegesChange,
}: UserListProps) {
    const columns: AppTableColumn<ManagedUser>[] = useMemo(
        () => [
            { key: 'fullName', label: 'Full Name', sortable: true, className: 'font-semibold text-gray-800' },
            { key: 'mobileNumber', label: 'Mobile Number', sortable: true, className: 'font-mono text-xs text-gray-600' },
            { key: 'locationName', label: 'SOCO Location', sortable: true },
            {
                key: 'role',
                label: 'Role',
                sortable: true,
                render: (_, row) => (
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
                ),
            },
            {
                key: 'privileges',
                label: 'Privileges',
                render: (_, row) => (
                    <div className="min-w-[220px]">
                        <MultiSelect
                            options={PRIVILEGE_OPTIONS}
                            value={row.privileges}
                            onChange={(val) => onPrivilegesChange?.(row.id, val as PrivilegeType[])}
                            placeholder="Select privileges"
                        />
                    </div>
                ),
            },
            {
                key: 'id',
                label: 'Actions',
                align: 'right' as const,
                render: (_, row) => (
                    <div className="flex items-center justify-end gap-1">
                        {onEdit && (
                            <TableIconButton variant="edit" onClick={() => onEdit(row)} title="Edit User">
                                <Pencil size={15} />
                            </TableIconButton>
                        )}
                        {onDelete && (
                            <TableIconButton variant="delete" onClick={() => onDelete(row)} title="Delete User">
                                <Trash2 size={15} />
                            </TableIconButton>
                        )}
                    </div>
                ),
            },
        ],
        [onEdit, onDelete, onRoleChange, onPrivilegesChange],
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
