'use client';

import { useEffect, useId, useState } from 'react';
import CustomSelect from '@/components/forms/CustomSelect';
import MultiSelect from '@/components/forms/MultiSelect';
import PrivilegeList, { type UserPrivilege } from './PrivilegeList';
import { PageHeader, PageLayout, Button } from '@/components/ui';
import { locationService, officerService } from '@/lib/api';
import { getErrorMessage, showErrorAlert, showSuccessAlert } from '@/lib/alerts';
import { ShieldCheck } from 'lucide-react';

const PRIVILEGE_CATEGORY_OPTIONS = [
    { value: 'ADDING_USERS', label: 'Adding Users' },
    { value: 'VIEW_ACCESS', label: 'View Access' },
    { value: 'EDIT_ACCESS', label: 'Edit Access' },
];

function getDummyPrivileges(userId: string): UserPrivilege[] {
    return PRIVILEGE_CATEGORY_OPTIONS.map((cat, idx) => ({
        id: `${userId}-PRIV-${idx}`,
        categoryId: cat.value,
    }));
}

export default function UserConfigurationPage() {
    const locationFieldId = useId();
    const userFieldId = useId();

    const [isLoadingLocations, setIsLoadingLocations] = useState(false);
    const [locationOptions, setLocationOptions] = useState<Array<{ value: string; label: string }>>([
        { value: '', label: 'Select Location' },
    ]);

    const [socoLocations, setSocoLocations] = useState<string[]>([]);
    const [isLoadingUsers, setIsLoadingUsers] = useState(false);
    const [userOptions, setUserOptions] = useState<Array<{ value: string; label: string }>>([]);
    const [selectedUser, setSelectedUser] = useState('');

    const [privileges, setPrivileges] = useState<UserPrivilege[]>([]);
    const [hasViewed, setHasViewed] = useState(false);
    const [pendingCategoryChanges, setPendingCategoryChanges] = useState<Record<string, string>>({});

    useEffect(() => {
        const loadLocations = async () => {
            setIsLoadingLocations(true);
            try {
                const locations = await locationService.getAllLocations();
                const options = locations.map((loc) => ({
                    value: String(loc.LOCATION_ID),
                    label: loc.LOCATION_NAME,
                }));
                setLocationOptions([{ value: '', label: 'Select Location' }, ...options]);
            } catch (err) {
                console.error('Failed to load locations:', err);
                showErrorAlert('Error', getErrorMessage(err, 'Failed to load SOCO locations.'));
            } finally {
                setIsLoadingLocations(false);
            }
        };

        loadLocations();
    }, []);

    useEffect(() => {
        if (socoLocations.length === 0) {
            setUserOptions([]);
            setSelectedUser('');
            return;
        }

        let cancelled = false;

        const loadUsers = async () => {
            setIsLoadingUsers(true);
            try {
                const officers = await officerService.getAllOfficers({
                    locationIds: socoLocations.map((id) => Number(id)),
                });
                if (cancelled) return;
                const options = officers.map((officer) => ({
                    value: officer.USER_REGI_NO,
                    label: officer.USER_CALLING_NAME || officer.USER_FULL_NAME,
                }));
                setUserOptions(options);
                setSelectedUser((prev) => (options.some((o) => o.value === prev) ? prev : ''));
            } catch (err) {
                if (cancelled) return;
                console.error('Failed to load users for selected locations:', err);
                showErrorAlert('Error', getErrorMessage(err, 'Failed to load users for the selected locations.'));
                setUserOptions([]);
                setSelectedUser('');
            } finally {
                if (!cancelled) setIsLoadingUsers(false);
            }
        };

        loadUsers();

        return () => {
            cancelled = true;
        };
    }, [socoLocations]);

    const handleViewPrivileges = () => {
        if (!selectedUser) return;
        setPrivileges(getDummyPrivileges(selectedUser));
        setPendingCategoryChanges({});
        setHasViewed(true);
    };

    const handleCategoryChange = (privilegeId: string, categoryId: string) => {
        const current = privileges.find((p) => p.id === privilegeId)?.categoryId;
        setPendingCategoryChanges((prev) => {
            const next = { ...prev };
            if (categoryId === current) {
                delete next[privilegeId];
            } else {
                next[privilegeId] = categoryId;
            }
            return next;
        });
    };

    const handleUpdate = (privilege: UserPrivilege) => {
        const newCategoryId = pendingCategoryChanges[privilege.id];
        if (!newCategoryId) return;
        setPrivileges((prev) =>
            prev.map((p) => (p.id === privilege.id ? { ...p, categoryId: newCategoryId } : p))
        );
        setPendingCategoryChanges((prev) => {
            const next = { ...prev };
            delete next[privilege.id];
            return next;
        });
        showSuccessAlert('Success', 'Privilege has been updated successfully.');
    };

    const handleDelete = (privilege: UserPrivilege) => {
        setPrivileges((prev) => prev.filter((p) => p.id !== privilege.id));
        setPendingCategoryChanges((prev) => {
            const next = { ...prev };
            delete next[privilege.id];
            return next;
        });
        showErrorAlert('Deleted', 'Privilege has been removed.');
    };

    return (
        <PageLayout>
            <PageHeader
                backHref="/crime-officer"
                title="User Configuration"
                description="Manage user privileges, authorization roles and allowed locations."
            />

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4 animate-fade-in">
                <div className="flex gap-4 flex-wrap items-end">
                    <div className="min-w-[220px] flex-1 max-w-xs" id={locationFieldId}>
                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">
                            SOCO Location
                        </label>
                        <MultiSelect
                            options={locationOptions.filter((o) => o.value !== '')}
                            value={socoLocations}
                            onChange={(vals) => {
                                setSocoLocations(vals);
                                setHasViewed(false);
                            }}
                            placeholder={isLoadingLocations ? 'Loading locations…' : 'Select location(s)'}
                        />
                    </div>
                    <div className="min-w-[220px] flex-1 max-w-xs" id={userFieldId}>
                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">
                            User
                        </label>
                        <CustomSelect
                            options={userOptions}
                            value={selectedUser}
                            onChange={(val) => {
                                setSelectedUser(val);
                                setHasViewed(false);
                            }}
                            disabled={socoLocations.length === 0 || isLoadingUsers}
                            placeholder={
                                socoLocations.length === 0
                                    ? 'Select a location first'
                                    : isLoadingUsers
                                      ? 'Loading users…'
                                      : 'Select user'
                            }
                        />
                    </div>
                    <div className="shrink-0">
                        <Button
                            type="button"
                            variant="primary"
                            onClick={handleViewPrivileges}
                            disabled={!selectedUser}
                            title={!selectedUser ? 'Select a location and user first' : undefined}
                            className="!min-h-[38px] !py-2 !text-sm px-4"
                        >
                            View Privileges
                        </Button>
                    </div>
                </div>
            </div>

            {!hasViewed ? (
                <div className="bg-white rounded-xl border border-dashed border-gray-300 p-10 flex flex-col items-center text-center gap-2">
                    <ShieldCheck className="w-9 h-9 text-gray-300" aria-hidden />
                    <p className="text-sm font-medium text-gray-500">No privileges loaded yet</p>
                    <p className="text-sm text-gray-400 max-w-sm">
                        Select a SOCO location and a user above, then click <span className="font-medium text-gray-500">View Privileges</span> to see and manage their access.
                    </p>
                </div>
            ) : (
                <PrivilegeList
                    privileges={privileges.map((p) =>
                        pendingCategoryChanges[p.id] !== undefined
                            ? { ...p, categoryId: pendingCategoryChanges[p.id] }
                            : p
                    )}
                    categoryOptions={PRIVILEGE_CATEGORY_OPTIONS}
                    userName={userOptions.find((u) => u.value === selectedUser)?.label}
                    dirtyIds={new Set(Object.keys(pendingCategoryChanges))}
                    onCategoryChange={handleCategoryChange}
                    onUpdate={handleUpdate}
                    onDelete={handleDelete}
                    emptyMessage="No privileges assigned to this user yet."
                />
            )}
        </PageLayout>
    );
}
