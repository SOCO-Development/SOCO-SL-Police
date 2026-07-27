'use client';

import { useState } from 'react';
import MultiSelect from '@/components/forms/MultiSelect';
import { Button } from '@/components/ui';

export interface PrivilegeLocationRow {
    privilegeId: number;
    privilegeTypeId: number;
    privilegeType: string;
    privilegeRole: string;
    isActive: boolean;
    /** Currently assigned location IDs (as strings, to match MultiSelect) for this privilege. */
    locationIds: string[];
}

export interface PrivilegeLocationTableProps {
    rows: PrivilegeLocationRow[];
    locationOptions: { value: string; label: string }[];
    onUpdate: (row: PrivilegeLocationRow, locationIds: string[]) => Promise<void>;
    emptyMessage?: string;
}

export default function PrivilegeLocationTable({
    rows,
    locationOptions,
    onUpdate,
    emptyMessage = 'No privileges available for this user.',
}: PrivilegeLocationTableProps) {
    const [draftLocations, setDraftLocations] = useState<Record<number, string[]>>({});
    const [updatingId, setUpdatingId] = useState<number | null>(null);

    const getLocations = (row: PrivilegeLocationRow) =>
        draftLocations[row.privilegeId] ?? row.locationIds;

    const handleLocationsChange = (row: PrivilegeLocationRow, vals: string[]) => {
        setDraftLocations((prev) => ({ ...prev, [row.privilegeId]: vals }));
    };

    const handleUpdate = async (row: PrivilegeLocationRow) => {
        setUpdatingId(row.privilegeId);
        try {
            await onUpdate(row, getLocations(row));
        } finally {
            setUpdatingId(null);
        }
    };

    if (rows.length === 0) {
        return (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center text-gray-400 text-sm">
                {emptyMessage}
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-200 text-left text-xs font-semibold text-gray-500 uppercase">
                            <th className="px-4 py-3">Privilege Type</th>
                            <th className="px-4 py-3">Privilege Role</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3 min-w-[240px]">Privilege Location</th>
                            <th className="px-4 py-3">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row) => {
                            const locations = getLocations(row);
                            const isDirty =
                                locations.length !== row.locationIds.length ||
                                locations.some((id) => !row.locationIds.includes(id));
                            return (
                                <tr key={row.privilegeId} className="border-b border-gray-100 last:border-0">
                                    <td className="px-4 py-3 text-gray-700">{row.privilegeType}</td>
                                    <td className="px-4 py-3 text-gray-900 font-medium">{row.privilegeRole.trim()}</td>
                                    <td className="px-4 py-3">
                                        <span
                                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                                                row.isActive
                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                    : 'bg-gray-100 text-gray-500 border border-gray-200'
                                            }`}
                                        >
                                            {row.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <MultiSelect
                                            options={locationOptions}
                                            value={locations}
                                            onChange={(vals) => handleLocationsChange(row, vals)}
                                            placeholder="Select location(s)"
                                        />
                                    </td>
                                    <td className="px-4 py-3">
                                        <Button
                                            type="button"
                                            variant="primary"
                                            onClick={() => handleUpdate(row)}
                                            disabled={!isDirty || updatingId === row.privilegeId}
                                            className="!min-h-8 !py-1.5 !text-xs px-4"
                                        >
                                            {updatingId === row.privilegeId ? 'Updating…' : 'Update'}
                                        </Button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
