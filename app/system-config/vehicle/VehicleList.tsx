'use client';

import AppTable, { type AppTableColumn } from '@/components/layout/AppTable';
import type { VehicleRecord } from './types';

export interface VehicleListProps {
    vehicles: VehicleRecord[];
    sortKey?: keyof VehicleRecord | string | null;
    sortAsc?: boolean;
    onSort?: (key: keyof VehicleRecord | string) => void;
    emptyMessage?: string;
}

const COLUMNS: AppTableColumn<VehicleRecord>[] = [
    { key: 'vehicleNumber', label: 'Vehicle No.', sortable: true, className: 'font-mono text-xs text-blue-700 font-semibold' },
    { key: 'model', label: 'Model', sortable: true },
    { key: 'make', label: 'Make', sortable: true },
    { key: 'year', label: 'Year', sortable: true },
    { key: 'assignedLocation', label: 'Assigned Location', sortable: true },
    {
        key: 'assignedDriver',
        label: 'Assigned Driver',
        sortable: true,
        render: (value) =>
            value ? (
                <span className="text-gray-700">{String(value)}</span>
            ) : (
                <span className="text-gray-600 italic">Not assigned</span>
            ),
    },
];

export default function VehicleList({
    vehicles,
    sortKey = null,
    sortAsc = true,
    onSort,
    emptyMessage = 'No vehicles found.',
}: VehicleListProps) {
    return (
        <AppTable<VehicleRecord>
            columns={COLUMNS}
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
