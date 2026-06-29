'use client';

import { useMemo } from 'react';
import AppTable, { type AppTableColumn } from '@/components/layout/AppTable';
import type { VehicleRecord } from './types';
import { TableIconButton } from '@/components/ui';
import { Pencil } from 'lucide-react';

export interface VehicleListProps {
    vehicles: VehicleRecord[];
    sortKey?: keyof VehicleRecord | string | null;
    sortAsc?: boolean;
    onSort?: (key: keyof VehicleRecord | string) => void;
    emptyMessage?: string;
    onEdit?: (vehicle: VehicleRecord) => void;
}

export default function VehicleList({
    vehicles,
    sortKey = null,
    sortAsc = true,
    onSort,
    emptyMessage = 'No vehicles found.',
    onEdit,
}: VehicleListProps) {
    const columns: AppTableColumn<VehicleRecord>[] = useMemo(
        () => [
            { key: 'vehicleNumber', label: 'Vehicle No.', sortable: true, className: 'font-mono text-xs text-blue-700 font-semibold' },
            { key: 'model', label: 'Model', sortable: true },
            { key: 'make', label: 'Brand', sortable: true },
            { key: 'year', label: 'Year', sortable: true },
            { key: 'assignedLocation', label: 'Assigned Location', sortable: true },
            {
                key: 'id',
                label: 'Actions',
                align: 'right' as const,
                render: (_, row) => (
                    <div className="flex items-center justify-end gap-1">
                        {onEdit && (
                            <TableIconButton variant="edit" onClick={() => onEdit(row)} title="Edit Vehicle">
                                <Pencil size={15} />
                            </TableIconButton>
                        )}
                    </div>
                ),
            },
        ],
        [onEdit],
    );

    return (
        <AppTable<VehicleRecord>
            columns={columns}
            data={vehicles}
            keyField="id"
            sortKey={sortKey}
            sortAsc={sortAsc}
            onSort={onSort}
            emptyMessage={emptyMessage}
            variant="card"
        />
    );
}
