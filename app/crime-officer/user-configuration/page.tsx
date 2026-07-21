'use client';

import { useMemo, useState } from 'react';
import CustomSelect from '@/components/forms/CustomSelect';
import MultiSelect from '@/components/forms/MultiSelect';
import AppTable, { type AppTableColumn } from '@/components/layout/AppTable';
import { PageHeader, PageLayout, Button } from '@/components/ui';
import { showErrorAlert, showSuccessAlert } from '@/lib/alerts';

interface OfficerOption {
    id: string;
    label: string;
    locationId: string;
}

interface PrivilegeRow {
    id: string;
    category: string;
    role: string;
    allowedLocations: string[];
}

// Dummy SOCO locations.
const DUMMY_LOCATIONS: { value: string; label: string }[] = [
    { value: 'LOC-1', label: 'Nugegoda' },
    { value: 'LOC-2', label: 'Colombo Central' },
    { value: 'LOC-3', label: 'Kandy' },
    { value: 'LOC-4', label: 'Galle' },
    { value: 'LOC-5', label: 'Kurunegala' },
];

// Dummy users, a few per SOCO location.
const DUMMY_OFFICERS: OfficerOption[] = [
    { id: 'USR-1001', label: 'Aruni Perera', locationId: 'LOC-1' },
    { id: 'USR-1002', label: 'Nadeesha Rajapaksha', locationId: 'LOC-1' },
    { id: 'USR-1003', label: 'Kasun Wickramasinghe', locationId: 'LOC-2' },
    { id: 'USR-1004', label: 'Sampath Fernando', locationId: 'LOC-2' },
    { id: 'USR-1005', label: 'Dilani Rathnayake', locationId: 'LOC-3' },
    { id: 'USR-1006', label: 'Nimali Gunawardena', locationId: 'LOC-4' },
    { id: 'USR-1007', label: 'Chamara Jayasuriya', locationId: 'LOC-5' },
];

// Dummy privilege categories / roles.
const INITIAL_PRIVILEGE_ROWS: Omit<PrivilegeRow, 'allowedLocations'>[] = [
    { id: 'adding-users', category: 'Adding Users', role: 'Admin' },
    { id: 'view-access', category: 'View Access', role: 'Users' },
    { id: 'edit-access', category: 'Edit Access', role: 'Users' },
];

export default function UserConfigurationPage() {
    const [premisesId, setPremisesId] = useState('');
    const [selectedUserId, setSelectedUserId] = useState('');
    const [hasViewed, setHasViewed] = useState(false);
    const [rows, setRows] = useState<PrivilegeRow[]>([]);

    const officerOptions = useMemo(
        () => DUMMY_OFFICERS.filter((o) => o.locationId === premisesId),
        [premisesId],
    );

    const handlePremisesChange = (value: string) => {
        setPremisesId(value);
        setSelectedUserId('');
    };

    const handleView = () => {
        if (!premisesId || !selectedUserId) {
            showErrorAlert('Error', 'Please select both a SOCO location and a user before viewing.');
            return;
        }
        setRows(INITIAL_PRIVILEGE_ROWS.map((row) => ({ ...row, allowedLocations: [] })));
        setHasViewed(true);
    };

    const handleAllowedLocationsChange = (rowId: string, values: string[]) => {
        setRows((prev) => prev.map((row) => (row.id === rowId ? { ...row, allowedLocations: values } : row)));
    };

    const handleRoleChange = (rowId: string, role: string) => {
        setRows((prev) => prev.map((row) => (row.id === rowId ? { ...row, role } : row)));
    };

    const handleUpdate = (row: PrivilegeRow) => {
        const selectedUser = officerOptions.find((o) => o.id === selectedUserId);
        showSuccessAlert(
            'Updated',
            `${row.role} has been updated for ${selectedUser?.label ?? 'the selected user'}.`,
        );
    };

    const columns: AppTableColumn<PrivilegeRow>[] = useMemo(
        () => [
            { key: 'category', label: 'Privilege Category', className: 'font-medium text-gray-800' },
            {
                key: 'role',
                label: 'Role',
                render: (_, row) => (
                    <div className="min-w-[140px]">
                        <CustomSelect
                            options={[
                                { value: 'Admin', label: 'Admin' },
                                { value: 'Users', label: 'Users' },
                            ]}
                            value={row.role}
                            onChange={(value) => handleRoleChange(row.id, value)}
                        />
                    </div>
                ),
            },
            {
                key: 'allowedLocations',
                label: 'Allowed Locations',
                render: (_, row) => (
                    <div className="min-w-[220px]">
                        <MultiSelect
                            options={DUMMY_LOCATIONS}
                            value={row.allowedLocations}
                            onChange={(values) => handleAllowedLocationsChange(row.id, values)}
                            placeholder="Nothing selected"
                        />
                    </div>
                ),
            },
            {
                key: 'id',
                label: 'Update',
                align: 'right' as const,
                render: (_, row) => (
                    <Button
                        type="button"
                        variant="success"
                        onClick={() => handleUpdate(row)}
                        className="!min-h-0 !py-1.5 !px-4 !text-xs"
                    >
                        UPDATE
                    </Button>
                ),
            },
        ],
        [],
    );

    return (
        <PageLayout>
            <PageHeader
                backHref="/crime-officer"
                title="User Configuration"
                description="Manage user privileges, authorization roles and allowed locations."
            />

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4 animate-fade-in">
                <div className="flex gap-3 flex-wrap items-end">
                    <div className="min-w-[220px] flex-1 max-w-xs">
                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">SOCO Location</label>
                        <CustomSelect
                            options={DUMMY_LOCATIONS}
                            value={premisesId}
                            onChange={handlePremisesChange}
                            placeholder="Select SOCO Location"
                        />
                    </div>
                    <div className="min-w-[220px] flex-1 max-w-xs">
                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Users</label>
                        <CustomSelect
                            options={officerOptions.map((o) => ({ value: o.id, label: o.label }))}
                            value={selectedUserId}
                            onChange={setSelectedUserId}
                            placeholder={premisesId ? 'Select User' : 'Select SOCO Location first'}
                            disabled={!premisesId}
                        />
                    </div>
                    <div className="shrink-0">
                        <Button
                            type="button"
                            variant="primary"
                            onClick={handleView}
                            className="!min-h-[38px] !py-2 !text-sm px-5"
                        >
                            View Users
                        </Button>
                    </div>
                </div>
            </div>

            {!hasViewed ? (
                <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">
                    Select a SOCO location and a user, then click View Users to see their privileges.
                </div>
            ) : (
                <AppTable<PrivilegeRow>
                    columns={columns}
                    data={rows}
                    keyField="id"
                    emptyMessage="No privileges found for the selected user."
                    variant="card"
                />
            )}
        </PageLayout>
    );
}
