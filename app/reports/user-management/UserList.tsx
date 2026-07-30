'use client';

import { useMemo } from 'react';
import AppTable, { type AppTableColumn } from '@/components/layout/AppTable';
import CustomSelect from '@/components/forms/CustomSelect';
import MultiSelect from '@/components/forms/MultiSelect';
import { TableIconButton } from '@/components/ui';
import { Pencil, Trash2 } from 'lucide-react';

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
        () => {
            const cols: AppTableColumn<ManagedUser>[] = [
                { key: 'fullName', label: 'Full Name', sortable: true, className: 'font-semibold text-gray-800 !align-top' },
                {
                    key: 'regNo',
                    label: 'Reg. No',
                    sortable: true,
                    className: '!align-top',
                    render: (_, row) => <span className="font-mono text-xs text-blue-700 font-semibold">{row.regNo || '-'}</span>,
                },
                {
                    key: 'designation',
                    label: 'Designation',
                    sortable: true,
                    className: '!align-top',
                    render: (_, row) => <span className="text-gray-700">{row.designation || '-'}</span>,
                },
                { key: 'mobileNumber', label: 'Mobile No.', sortable: true, className: 'font-mono text-xs text-gray-600 !align-top' },
                { key: 'locationName', label: 'SOCO Lab', sortable: true, className: '!align-top' },
                {
                    key: 'privileges',
                    label: 'Privilege Type',
                    sortable: true,
                    className: '!align-top',
                    render: (_, row) => {
                        const privs = Array.isArray(row.privileges) ? row.privileges : (row.privileges ? [row.privileges] : []);
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
                            <div className="flex flex-col gap-1">
                                {privs.length > 0 ? (
                                    privs.map((p, i) => (
                                        <span key={i} className="text-gray-700 whitespace-nowrap">{p}</span>
                                    ))
                                ) : (
                                    <span className="text-gray-700">-</span>
                                )}
                            </div>
                        );
                    },
                },
                {
                    key: 'role',
                    label: 'Authorization Role',
                    sortable: true,
                    className: '!align-top',
                    render: (_, row) => {
                        const roles = Array.isArray(row.role) ? row.role : (row.role ? [row.role] : []);
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
                            <div className="flex flex-col gap-1">
                                {roles.length > 0 ? (
                                    roles.map((r, i) => (
                                        <span key={i} className="text-gray-700 whitespace-nowrap">{r}</span>
                                    ))
                                ) : (
                                    <span className="text-gray-700">-</span>
                                )}
                            </div>
                        );
                    },
                },
                {
                    key: 'privilegeLocations',
                    label: 'Privilege Locations',
                    sortable: true,
                    className: '!align-top',
                    render: (_, row) => (
                        <div className="flex flex-col gap-1">
                            {row.privilegeLocations && row.privilegeLocations.length > 0 ? (
                                row.privilegeLocations.map((l, i) => (
                                    <span key={i} className="text-gray-700 whitespace-nowrap">{l}</span>
                                ))
                            ) : (
                                <span className="text-gray-700">-</span>
                            )}
                        </div>
                    ),
                },
            ];

            if (onEdit || onDelete) {
                cols.push({
                    key: 'id',
                    label: 'Actions',
                    align: 'right' as const,
                    className: '!align-top',
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
                });
            }

            return cols;
        },
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
