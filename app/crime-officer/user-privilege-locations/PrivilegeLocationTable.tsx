'use client';

import { useState } from 'react';
import MultiSelect from '@/components/forms/MultiSelect';
import { Button } from '@/components/ui';

export interface PrivilegeLocationRow {
    privilegeId: number;
    privilegeTypeId: number;
    privilegeType: string;
    privilegeRole: string;
    /** Locations assignable to this privilege, as MultiSelect options. */
    locationOptions: { value: string; label: string }[];
    /** Currently assigned location IDs (as strings, to match MultiSelect) for this privilege. */
    locationIds: string[];
}

export interface PrivilegeLocationTableProps {
    rows: PrivilegeLocationRow[];
    onUpdate: (row: PrivilegeLocationRow, locationIds: string[]) => Promise<void>;
    emptyMessage?: string;
}

export default function PrivilegeLocationTable({
    rows,
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
            setDraftLocations((prev) => {
                const { [row.privilegeId]: _removed, ...rest } = prev;
                return rest;
            });
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
                            <th className="px-4 py-3">Privilege Category</th>
                            <th className="px-4 py-3">Authorization Role</th>
                            <th className="px-4 py-3 min-w-[240px]">Allowed Locations</th>
                            <th className="px-4 py-3">Update</th>
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
                                        <MultiSelect
                                            options={row.locationOptions}
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
