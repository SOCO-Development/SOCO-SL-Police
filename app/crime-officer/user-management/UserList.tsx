'use client';

import { useMemo } from 'react';
import AppTable, { type AppTableColumn } from '@/components/layout/AppTable';
import { TableIconButton } from '@/components/ui';
import { Pencil, Trash2 } from 'lucide-react';

/** Privilege options for the multi-select dropdown. */
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
    privileges: string[];
}

export interface UserListProps {
    users: ManagedUser[];
    sortKey?: keyof ManagedUser | string | null;
    sortAsc?: boolean;
    onSort?: (key: keyof ManagedUser | string) => void;
    emptyMessage?: string;
    onEdit?: (user: ManagedUser) => void;
    onDelete?: (user: ManagedUser) => void;
}

export default function UserList({
    users,
    sortKey = null,
    sortAsc = true,
    onSort,
    emptyMessage = 'No users found.',
    onEdit,
    onDelete,
}: UserListProps) {
    const columns: AppTableColumn<ManagedUser>[] = useMemo(
        () => [
            { key: 'fullName', label: 'Full Name', sortable: true, className: 'font-semibold text-gray-800' },
            { key: 'mobileNumber', label: 'Mobile Number', sortable: true, className: 'font-mono text-xs text-gray-600' },
            { key: 'locationName', label: 'SOCO Location', sortable: true },
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
        [onEdit, onDelete],
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
