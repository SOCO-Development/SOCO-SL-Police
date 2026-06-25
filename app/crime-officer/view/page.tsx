'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import CustomSelect from '@/components/forms/CustomSelect';
import MultiSelect from '@/components/forms/MultiSelect';
import AppTable, { type AppTableColumn } from '@/components/layout/AppTable';
import { PageHeader, PageLayout, Button, SearchInput, ActionChipButton, PaginationControls } from '@/components/ui';
import { ANNEX_12_RANK } from '@/lib/annexData';
import { officerService, userService, ApiError } from '@/lib/api';
import { useLocationData } from '@/lib/hooks/useLocationData';
import { useUserData } from '@/lib/hooks/useUserData';
import { MagnifyingGlass } from 'phosphor-react';
import { Plus, Eye, EyeOff, Pencil, Shield } from 'lucide-react';

const RANK_FILTER_OPTIONS = [{ value: '', label: 'All Ranks' }, ...ANNEX_12_RANK.map((r) => ({ value: r, label: r }))];

type SortKey = 'name' | 'regNo' | 'status' | 'socoLab' | 'mobile';

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50, 100].map((n) => ({ value: String(n), label: `${n} per page` }));

interface OfficerRow {
    id: string;
    name: string;
    regNo: string;
    status: string;
    locationId: string;
    rankId: string;
    mobile: string;
    socoLab: string;
    rank: string;
    designationId: string;
    designation: string;
}

function OfficerAvatar({ name, regNo }: { name: string; regNo?: string }) {
    const [imgSrc, setImgSrc] = useState<string | null>(null);
    const [loaded, setLoaded] = useState(false);
    const initials = name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();

    useEffect(() => {
        if (!regNo) return;
        let cancelled = false;
        userService.getProfileImage(regNo).then((dataUrl) => {
            if (!cancelled && dataUrl) {
                setImgSrc(dataUrl);
                setLoaded(true);
            }
        });
        return () => { cancelled = true; };
    }, [regNo]);

    if (imgSrc) {
        return (
            <img
                src={imgSrc}
                alt={name}
                className="w-10 h-12 rounded border border-gray-200 object-cover shadow-sm"
            />
        );
    }

    return (
        <div className="w-10 h-12 rounded border border-gray-200 bg-blue-50 flex items-center justify-center text-blue-700 font-bold text-xs shadow-sm">
            {initials}
        </div>
    );
}

export default function ViewOfficersPage() {
    const { locations } = useLocationData();
    const { rankIdToName } = useUserData();
    const [search, setSearch] = useState('');
    const [filterLocations, setFilterLocations] = useState<string[]>([]);
    const [filterDesignations, setFilterDesignations] = useState<string[]>([]);
    const [appliedLocations, setAppliedLocations] = useState<string[]>([]);
    const [appliedDesignations, setAppliedDesignations] = useState<string[]>([]);
    const [sortKey, setSortKey] = useState<SortKey>('name');
    const [sortAsc, setSortAsc] = useState(true);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [viewingOfficer, setViewingOfficer] = useState<OfficerRow | null>(null);
    const [privilegeOfficer, setPrivilegeOfficer] = useState<OfficerRow | null>(null);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [privilegeDesignationId, setPrivilegeDesignationId] = useState('');
    const [privilegeLoading, setPrivilegeLoading] = useState(false);
    const [privilegeError, setPrivilegeError] = useState<string | null>(null);
    const [privilegeSuccess, setPrivilegeSuccess] = useState<string | null>(null);
    const [showPrivilegePassword, setShowPrivilegePassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [officers, setOfficers] = useState<OfficerRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasSearched, setHasSearched] = useState(false);
    const [validationError, setValidationError] = useState<string | null>(null);
    const [designations, setDesignations] = useState<{ id: string; name: string }[]>([
        { id: '1', name: 'OIC' },
        { id: '5', name: 'Acting OIC' },
        { id: '6', name: 'SOCO Officer' },
        { id: '7', name: 'SOCO Admin' },
        { id: '8', name: 'System Admin' },
    ]);

    const locationIdToName = useMemo(() => {
        const map = new Map<string, string>();
        locations.forEach((loc) => map.set(loc.id, loc.name));
        return map;
    }, [locations]);

    const locationOptions = useMemo(() => {
        return locations.map((loc) => ({ value: loc.id, label: loc.name }));
    }, [locations]);

    const designationMap = useMemo(() => {
        const map = new Map<string, string>();
        designations.forEach((d) => map.set(d.id, d.name));
        return map;
    }, [designations]);

    const designationOptions = useMemo(() => {
        return designations.map((d) => ({ value: d.id, label: d.name }));
    }, [designations]);

    useEffect(() => {
        const loadDesignations = async () => {
            try {
                const apiRes = await userService.getAllDesignations();
                if (apiRes && apiRes.length > 0) {
                    setDesignations(apiRes.map(d => ({ id: d.USER_DESIGNATION_ID, name: d.USER_DESIGNATION_NAME })));
                }
            } catch (err) {
                console.error("Failed to load designations:", err);
            }
        };
        loadDesignations();
    }, []);

    const fetchOfficers = useCallback(async (signal?: { cancelled: boolean }) => {
        setLoading(true);
        setError(null);
        try {
            const locationIds = appliedLocations
                .map((id) => parseInt(id, 10))
                .filter((id) => !isNaN(id));

            const designationIds = appliedDesignations
                .map((val) => parseInt(val, 10))
                .filter((id) => !isNaN(id));

            const raw = await officerService.getAllOfficers({
                locationIds,
                designationIds,
            });
            if (signal?.cancelled) return;
            const rows: OfficerRow[] = raw.map((o) => ({
                id: o.SYSTEM_USER_ID,
                name: o.USER_FULL_NAME,
                regNo: o.USER_REGI_NO || '',
                status: o.STATUS,
                locationId: o.LOCATION_ID,
                rankId: o.RANK_ID || '',
                mobile: o.PHONE_MOBILE || '',
                socoLab: locationIdToName.get(o.LOCATION_ID) || `Lab #${o.LOCATION_ID}`,
                rank: rankIdToName.get(o.RANK_ID || '') || '',
                designationId: o.USER_DESIGNATION_ID || '',
                designation: o.USER_DESIGNATION_ID ? (designationMap.get(o.USER_DESIGNATION_ID) || o.USER_DESIGNATION_ID) : '',
            }));
            setOfficers(rows);
        } catch (err) {
            if (signal?.cancelled) return;
            const apiError = err instanceof ApiError ? err : new ApiError('Failed to load officers');
            setError(apiError.message || 'Failed to load officers');
        } finally {
            if (!signal?.cancelled) setLoading(false);
        }
    }, [locationIdToName, rankIdToName, appliedLocations, appliedDesignations, designations, designationMap]);

    useEffect(() => {
        if (!hasSearched) { setLoading(false); return; }
        let cancelled = false;
        fetchOfficers({ cancelled });
        return () => { cancelled = true; };
    }, [fetchOfficers, hasSearched]);

    const handleSort = (key: string) => {
        const k = key as SortKey;
        if (k === sortKey) setSortAsc((prev) => !prev);
        else {
            setSortKey(k);
            setSortAsc(true);
        }
    };

    const handleGrantPrivilege = async () => {
        if (!privilegeOfficer) return;
        if (newPassword.trim() && newPassword !== confirmPassword) {
            setPrivilegeError('Passwords do not match.');
            return;
        }
        setPrivilegeLoading(true);
        setPrivilegeError(null);
        setPrivilegeSuccess(null);
        try {
            const messages: string[] = [];
            const desId = privilegeDesignationId ? parseInt(privilegeDesignationId, 10) : undefined;

            if (newPassword.trim()) {
                await officerService.grantLoginAccess({
                    systemUserId: parseInt(privilegeOfficer.id, 10),
                    userKey: newPassword.trim(),
                    ...(desId !== undefined ? { designationId: desId } : {}),
                });
                messages.push('Login access granted successfully. Password updated.');
                if (desId !== undefined) messages.push('Designation updated.');
            } else if (desId !== undefined && desId !== parseInt(privilegeOfficer.designationId || '0', 10)) {
                const bundle = await officerService.getOfficerById(parseInt(privilegeOfficer.id, 10));
                const p = bundle.personalInfo[0];
                if (p) {
                    await officerService.updatePersonalInfo({
                        systemUserId: parseInt(privilegeOfficer.id, 10),
                        userFullName: p.USER_FULL_NAME || '',
                        userCallingName: p.USER_CALLING_NAME || '',
                        locationId: parseInt(p.LOCATION_ID, 10) || 1,
                        userDesignationId: desId,
                        userDob: p.USER_DOB || '',
                        phoneMobile: p.PHONE_MOBILE || '',
                        phoneOffice: p.PHONE_OFFICE || '',
                        phoneHome: p.PHONE_HOME || '',
                        userImageUrl: p.USER_IMAGE_URL || '',
                        civilStatus: p.CIVIL_STATUS || '',
                        currentRank: parseInt(p.CURRENT_RANK || '', 10) || 1,
                        appointRank: parseInt(p.APPOINT_RANK || '', 10) || 1,
                        courseNo: p.COURSE_NO || '',
                        socoJoinedDate: p.SOCO_JOINED_DATE || '',
                    });
                    messages.push('Designation updated.');
                }
            }

            setPrivilegeSuccess(messages.join(' ') || 'No changes made.');
            setNewPassword('');
            setConfirmPassword('');
            setPrivilegeDesignationId('');
            fetchOfficers({ cancelled: false });
        } catch (err) {
            const apiError = err instanceof ApiError ? err : new ApiError('Failed to grant login access');
            setPrivilegeError(apiError.message || 'An error occurred.');
        } finally {
            setPrivilegeLoading(false);
        }
    };

    const handleView = () => {
        if (filterLocations.length === 0 || filterDesignations.length === 0) {
            setValidationError('Please select both SOCO Location and Designation to view the records.');
            return;
        }
        setValidationError(null);
        setAppliedLocations(filterLocations);
        setAppliedDesignations(filterDesignations);
        setHasSearched(true);
        setPage(1);
    };

    const handleClearFilters = () => {
        setFilterLocations([]);
        setFilterDesignations([]);
        setAppliedLocations([]);
        setAppliedDesignations([]);
        setSearch('');
        setHasSearched(false);
        setValidationError(null);
        setPage(1);
    };

    const filtered = useMemo(() => {
        let data = [...officers];
        if (search.trim()) {
            const q = search.toLowerCase();
            data = data.filter((o) =>
                o.name.toLowerCase().includes(q) ||
                o.regNo.toLowerCase().includes(q) ||
                o.mobile.includes(q)
            );
        }
        if (appliedLocations.length > 0) {
            data = data.filter((o) => appliedLocations.includes(o.locationId));
        }
        if (appliedDesignations.length > 0) {
            data = data.filter((o) => appliedDesignations.includes(o.designationId));
        }
        data.sort((a, b) => {
            const av = String(a[sortKey] ?? '');
            const bv = String(b[sortKey] ?? '');
            const cmp = av.localeCompare(bv, undefined, { sensitivity: 'base' });
            return sortAsc ? cmp : -cmp;
        });
        return data;
    }, [search, appliedLocations, appliedDesignations, sortKey, sortAsc, officers]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    const effectivePage = Math.min(page, totalPages);
    const paginated = filtered.slice((effectivePage - 1) * pageSize, effectivePage * pageSize);

    const columns: AppTableColumn<OfficerRow>[] = useMemo(
        () => [
            {
                key: 'photo',
                label: 'Photo',
                sortable: false,
                render: (_, row) => <OfficerAvatar name={row.name} regNo={row.regNo} />,
            },
            {
                key: 'name',
                label: 'Name',
                sortable: true,
                render: (v) => <span className="font-medium text-gray-800">{String(v)}</span>,
            },
            {
                key: 'rank',
                label: 'Rank',
                sortable: true,
                render: (v) => (
                    <span className="inline-block px-2 py-0.5 text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 rounded">
                        {String(v) || '-'}
                    </span>
                ),
            },
            {
                key: 'regNo',
                label: 'Reg. No',
                sortable: true,
                render: (v) => <span className="text-gray-600 font-mono text-xs">{String(v)}</span>,
            },
            {
                key: 'socoLab',
                label: 'SOCO Lab',
                sortable: true,
                render: (v) => <span className="text-gray-700">{String(v)}</span>,
            },
            {
                key: 'status',
                label: 'Status',
                sortable: true,
                render: (v) => {
                    const active = String(v) === 'ACTIVE';
                    return (
                        <span className={`inline-block px-2 py-0.5 text-xs font-semibold rounded ${
                            active
                                ? 'bg-green-50 text-green-700 border border-green-200'
                                : 'bg-red-50 text-red-700 border border-red-200'
                        }`}>
                            {active ? 'Active' : 'Inactive'}
                        </span>
                    );
                },
            },
            {
                key: 'mobile',
                label: 'Mobile',
                sortable: true,
                render: (v) => <span className="text-gray-700">{String(v)}</span>,
            },
            {
                key: 'actions',
                label: 'Actions',
                sortable: false,
                align: 'right' as const,
                render: (_, row) => (
                    <div className="flex items-center justify-end gap-2 flex-wrap">
                        <ActionChipButton variant="blue" title="View" onClick={() => setViewingOfficer(row)}>
                            <Eye className="w-3 h-3" /> View
                        </ActionChipButton>
                        <Link
                            href={`/crime-officer/add?edit=${row.id}`}
                            title="Edit"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors border border-amber-200"
                        >
                            <Pencil className="w-3 h-3" />
                            Edit
                        </Link>
                        <ActionChipButton variant="fuchsia" title="Privilege" onClick={() => { setViewingOfficer(null); setPrivilegeOfficer(row); setPrivilegeError(null); setPrivilegeSuccess(null); setNewPassword(''); setConfirmPassword(''); setPrivilegeDesignationId(row.designationId || ''); }}>
                            <Shield className="w-3 h-3" /> Privilege
                        </ActionChipButton>
                    </div>
                ),
            },
        ],
        [],
    );

    return (
        <>
        <PageLayout>
            <PageHeader
                backHref="/crime-officer"
                title="View SOCO Officers"
                description={hasSearched ? `SOCO නිලධාරීන් — ${filtered.length} records found` : `SOCO නිලධාරීන්`}
                actions={
                    <Button variant="primary" asChild>
                        <Link href="/crime-officer/add">
                            <Plus className="w-4 h-4" /> Add Officer
                        </Link>
                    </Button>
                }
            />

            {error && (
                <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    {error}
                </div>
            )}

            {validationError && (
                <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 animate-fade-in flex items-center gap-2">
                    <span className="font-semibold">Error:</span> {validationError}
                </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4 animate-fade-in">
                <div className="flex gap-3 flex-wrap items-center justify-between">
                    <div className="flex gap-3 flex-wrap items-end flex-1 min-w-[200px]">
                        <div className="min-w-[200px] flex-1 max-w-xs">
                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Select SOCO Location</label>
                            <MultiSelect
                                value={filterLocations}
                                onChange={setFilterLocations}
                                options={locationOptions}
                                placeholder="Select SOCO Location"
                            />
                        </div>
                        <div className="min-w-[180px] flex-1 max-w-xs">
                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Select Designation</label>
                            <MultiSelect
                                value={filterDesignations}
                                onChange={setFilterDesignations}
                                options={designationOptions}
                                placeholder="Select Designation"
                            />
                        </div>
                        <div className="shrink-0 flex gap-2">
                            <Button
                                type="button"
                                variant="primary"
                                onClick={handleView}
                                className="!min-h-[38px] !py-2 !text-sm px-4"
                            >
                                View
                            </Button>
                            {(filterLocations.length > 0 || filterDesignations.length > 0 || appliedLocations.length > 0 || appliedDesignations.length > 0 || search) && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={handleClearFilters}
                                    className="!min-h-[38px] !px-3 !text-sm !text-red-500 hover:!text-red-700"
                                >
                                    Clear filters
                                </Button>
                            )}
                        </div>
                    </div>

                    <div className="max-w-md w-full">
                        <SearchInput
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                            placeholder="Search name, reg no, mobile..."
                            wrapperClassName="w-full"
                            icon={<MagnifyingGlass size={15} />}
                            disabled={!hasSearched}
                        />
                    </div>
                </div>
            </div>

            <div className="animate-fade-in">
                {!hasSearched ? (
                    <div className="flex flex-col items-center justify-center py-16 px-4 bg-white border border-gray-200 rounded-xl shadow-sm animate-fade-in">
                        <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 mb-4 ring-8 ring-blue-50/50">
                            <MagnifyingGlass size={32} className="text-blue-600" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-800 mb-1">View SOCO Officers</h3>
                        <p className="text-sm text-gray-500 text-center max-w-md">
                            Please select a <span className="font-semibold text-gray-700">SOCO Location</span> and a <span className="font-semibold text-gray-700">Designation</span> using the filters above, then click the <span className="font-semibold text-gray-700">View</span> button to display records.
                        </p>
                    </div>
                ) : loading ? (
                    <div className="text-center py-12 text-gray-400">Loading officers...</div>
                ) : (
                    <>
                        <AppTable<OfficerRow>
                            columns={columns}
                            data={paginated}
                            keyField="id"
                            sortKey={sortKey}
                            sortAsc={sortAsc}
                            onSort={handleSort}
                            emptyMessage="No officers found matching your search criteria."
                            variant="card"
                        />

                        {filtered.length > 0 && (
                            <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-4 border-t border-gray-200">
                                <p className="text-sm text-gray-600">
                                    Showing {filtered.length === 0 ? 0 : (effectivePage - 1) * pageSize + 1} to{' '}
                                    {Math.min(effectivePage * pageSize, filtered.length)} of {filtered.length} officers
                                </p>
                                <div className="flex items-center gap-4">
                                    <div className="w-36">
                                        <CustomSelect
                                            value={String(pageSize)}
                                            onChange={(v) => { setPageSize(Number(v)); setPage(1); }}
                                            options={PAGE_SIZE_OPTIONS}
                                            placeholder="Per page"
                                        />
                                    </div>
                                    <PaginationControls
                                        page={effectivePage}
                                        totalPages={totalPages}
                                        onPageChange={setPage}
                                    />
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

        </PageLayout>

            {viewingOfficer && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in"
                    onClick={() => setViewingOfficer(null)}
                >
                    <div
                        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden border border-gray-200 animate-fade-in flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50/80">
                            <h3 className="text-lg font-semibold text-gray-900">Officer Details</h3>
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setViewingOfficer(null)}
                                className="!min-h-9 !w-9 !p-2"
                                aria-label="Close"
                            >
                                <span className="text-xl leading-none">×</span>
                            </Button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            <div className="flex items-center gap-4">
                                <OfficerAvatar name={viewingOfficer.name} regNo={viewingOfficer.regNo} />
                                <div>
                                    <h4 className="text-xl font-bold text-gray-900">{viewingOfficer.name}</h4>
                                    <p className="text-sm text-gray-500 font-mono">{viewingOfficer.regNo}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="p-3 rounded-lg bg-gray-50 border border-gray-100">
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Rank</p>
                                    <p className="text-sm font-medium text-gray-900">{viewingOfficer.rank || '-'}</p>
                                </div>
                                <div className="p-3 rounded-lg bg-gray-50 border border-gray-100">
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Designation</p>
                                    <p className="text-sm font-medium text-gray-900">{viewingOfficer.designation || '-'}</p>
                                </div>
                                <div className="p-3 rounded-lg bg-gray-50 border border-gray-100">
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Status</p>
                                    <span className={`inline-block px-2 py-0.5 text-xs font-semibold rounded ${
                                        viewingOfficer.status === 'ACTIVE'
                                            ? 'bg-green-50 text-green-700 border border-green-200'
                                            : 'bg-red-50 text-red-700 border border-red-200'
                                    }`}>
                                        {viewingOfficer.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                                <div className="p-3 rounded-lg bg-gray-50 border border-gray-100">
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Mobile</p>
                                    <p className="text-sm font-medium text-gray-900">{viewingOfficer.mobile || '-'}</p>
                                </div>
                                <div className="p-3 rounded-lg bg-gray-50 border border-gray-100 sm:col-span-2">
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">SOCO Lab</p>
                                    <p className="text-sm font-medium text-gray-900">{viewingOfficer.socoLab}</p>
                                </div>
                            </div>
                        </div>
                        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50/50 flex justify-end gap-2">
                            <Link
                                href={`/crime-officer/add?edit=${viewingOfficer.id}`}
                                className="px-4 py-2 text-sm font-medium text-amber-700 bg-amber-50 border border-amber-200 hover:bg-amber-100 rounded-lg transition-colors"
                            >
                                Edit
                            </Link>
                            <Button type="button" variant="secondary" onClick={() => setViewingOfficer(null)}>
                                Close
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Privilege / Change Password Modal */}
            {privilegeOfficer && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in"
                    onClick={() => { setPrivilegeOfficer(null); setPrivilegeError(null); setPrivilegeSuccess(null); setNewPassword(''); setConfirmPassword(''); setPrivilegeDesignationId(''); }}
                >
                    <div
                        className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-200 animate-fade-in"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-fuchsia-50/80">
                            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                <Shield className="w-5 h-5 text-fuchsia-600" />
                                Grant Login Access
                            </h3>
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => { setPrivilegeOfficer(null); setPrivilegeError(null); setPrivilegeSuccess(null); setNewPassword(''); setConfirmPassword(''); setPrivilegeDesignationId(''); }}
                                className="!min-h-9 !w-9 !p-2"
                                aria-label="Close"
                            >
                                <span className="text-xl leading-none">×</span>
                            </Button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
                                <OfficerAvatar name={privilegeOfficer.name} regNo={privilegeOfficer.regNo} />
                                <div>
                                    <p className="font-semibold text-gray-900">{privilegeOfficer.name}</p>
                                    <p className="text-sm text-gray-500 font-mono">{privilegeOfficer.regNo}</p>
                                </div>
                            </div>

                            {privilegeSuccess && (
                                <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                                    {privilegeSuccess}
                                </div>
                            )}

                            {privilegeError && (
                                <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                                    {privilegeError}
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                                    New Password / User Key <span className="text-gray-400 normal-case">(optional)</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPrivilegePassword ? 'text' : 'password'}
                                        value={newPassword}
                                        onChange={(e) => {
                                            setNewPassword(e.target.value);
                                            setPrivilegeError(null);
                                        }}
                                        placeholder="Enter new password"
                                        className="w-full min-h-10 px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-fuchsia-200 focus:border-fuchsia-500 hover:border-gray-400 transition-colors pr-10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPrivilegePassword(!showPrivilegePassword)}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                        tabIndex={-1}
                                    >
                                        {showPrivilegePassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                                    Confirm New Password <span className="text-gray-400 normal-case">(optional)</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        value={confirmPassword}
                                        onChange={(e) => {
                                            setConfirmPassword(e.target.value);
                                            setPrivilegeError(null);
                                        }}
                                        placeholder="Re-enter new password"
                                        className="w-full min-h-10 px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-fuchsia-200 focus:border-fuchsia-500 hover:border-gray-400 transition-colors pr-10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                        tabIndex={-1}
                                    >
                                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                                    Designation
                                </label>
                                <CustomSelect
                                    value={privilegeDesignationId}
                                    onChange={(val) => setPrivilegeDesignationId(val)}
                                    options={[{ value: '', label: 'No change' }, ...designations.map((d) => ({ value: d.id, label: d.name }))]}
                                    placeholder="No change"
                                />
                            </div>
                        </div>
                        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50/50 flex justify-end gap-2">
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() => { setPrivilegeOfficer(null); setPrivilegeError(null); setPrivilegeSuccess(null); setNewPassword(''); setConfirmPassword(''); setPrivilegeDesignationId(''); }}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                variant="primary"
                                onClick={handleGrantPrivilege}
                                disabled={privilegeLoading || (newPassword.trim() !== '' && newPassword !== confirmPassword)}
                            >
                                {privilegeLoading ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
