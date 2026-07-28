'use client';

import { FormEvent, useEffect, useMemo, useState, useCallback } from 'react';
import { X } from 'lucide-react';
import { MagnifyingGlass, FileXls, FilePdf } from 'phosphor-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import FormInput from '@/components/forms/FormInput';
import CustomSelect from '@/components/forms/CustomSelect';
import MultiSelect from '@/components/forms/MultiSelect';
import UserList, { type ManagedUser, type PrivilegeType, type UserRole } from './UserList';
import { PageHeader, PageLayout, Button, SearchInput, PaginationControls } from '@/components/ui';
import { officerService, userService, ApiError } from '@/lib/api';
import { useLocationData } from '@/lib/hooks/useLocationData';
import { useUserData } from '@/lib/hooks/useUserData';
import ResultPopup, { useResultPopup } from '@/components/modals/ResultPopup';

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50, 100].map((n) => ({ value: String(n), label: `${n} per page` }));

export default function UserManagementPage() {
    const { locations } = useLocationData();
    const { rankIdToName } = useUserData();
    const [popup, showPopup, closePopup] = useResultPopup();

    // ── Filter state ──────────────────────────────────────────────────
    const [filterLocations, setFilterLocations] = useState<string[]>([]);
    const [filterDesignations, setFilterDesignations] = useState<string[]>([]);
    const [appliedLocations, setAppliedLocations] = useState<string[]>([]);
    const [appliedDesignations, setAppliedDesignations] = useState<string[]>([]);
    const [search, setSearch] = useState('');
    const [hasSearched, setHasSearched] = useState(false);

    // ── Data state ────────────────────────────────────────────────────
    const [users, setUsers] = useState<ManagedUser[]>([]);
    const [loading, setLoading] = useState(false);
    const [sortKey, setSortKey] = useState<keyof ManagedUser | string | null>('fullName');
    const [sortAsc, setSortAsc] = useState(true);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    // ── Designations ──────────────────────────────────────────────────
    const [designations, setDesignations] = useState<{ id: string; name: string }[]>([
        { id: '1', name: 'OIC' },
        { id: '5', name: 'Acting OIC' },
        { id: '6', name: 'SOCO Officer' },
        { id: '7', name: 'SOCO Admin' },
        { id: '8', name: 'System Admin' },
    ]);

    // ── Derived data ──────────────────────────────────────────────────
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

    // ── Location options for the Add/Edit modal ───────────────────────
    const modalLocationOptions = useMemo(() => {
        return [{ value: '', label: 'Select Location' }, ...locationOptions];
    }, [locationOptions]);

    // ── Load designations from API ────────────────────────────────────
    useEffect(() => {
        const loadDesignations = async () => {
            try {
                const apiRes = await userService.getAllDesignations();
                if (apiRes && apiRes.length > 0) {
                    setDesignations(apiRes.map((d) => ({ id: d.USER_DESIGNATION_ID, name: d.USER_DESIGNATION_NAME })));
                }
            } catch (err) {
                console.error('Failed to load designations:', err);
            }
        };
        loadDesignations();
    }, []);

    // ── Fetch officers from API ───────────────────────────────────────
    const fetchOfficers = useCallback(
        async (signal?: { cancelled: boolean }) => {
            setLoading(true);
            try {
                const locationIds = appliedLocations.map((id) => parseInt(id, 10)).filter((id) => !isNaN(id));
                const designationIds = appliedDesignations.map((val) => parseInt(val, 10)).filter((id) => !isNaN(id));

                const raw = await officerService.getAllOfficers({ locationIds, designationIds });
                if (signal?.cancelled) return;

                const rows: ManagedUser[] = await Promise.all(raw.map(async (o) => {
                    let privTypes = '-';
                    let authRoles = '-';
                    try {
                        const privs = await officerService.getUserPrivileges(Number(o.SYSTEM_USER_ID));
                        const activeTypes = new Set<string>();
                        const activeRoles = new Set<string>();
                        (privs || []).forEach(g => {
                            let hasActive = false;
                            g.configurations?.forEach(c => {
                                if (c.isActive) {
                                    activeRoles.add(c.privilegeRole);
                                    hasActive = true;
                                }
                            });
                            if (hasActive) {
                                activeTypes.add(g.privilegeType);
                            }
                        });
                        if (activeTypes.size > 0) privTypes = Array.from(activeTypes).join(', ');
                        if (activeRoles.size > 0) authRoles = Array.from(activeRoles).join(', ');
                    } catch (e) {
                        console.error(`Failed to load privileges for user ${o.SYSTEM_USER_ID}`, e);
                    }

                    let privLocs = '-';
                    try {
                        const locs = await officerService.getUserPrivilegeLocations(Number(o.SYSTEM_USER_ID));
                        const locationNames = new Set<string>();
                        (locs || []).forEach(g => {
                            (g.privileges || []).forEach(p => {
                                (p.locations || []).forEach(l => locationNames.add(l.locationName));
                            });
                        });
                        if (locationNames.size > 0) privLocs = Array.from(locationNames).join(', ');
                    } catch (e) {
                        console.error(`Failed to load privilege locations for user ${o.SYSTEM_USER_ID}`, e);
                    }

                    return {
                        id: o.SYSTEM_USER_ID,
                        fullName: o.USER_FULL_NAME,
                        regNo: o.USER_REGI_NO || '',
                        mobileNumber: o.PHONE_MOBILE || '',
                        locationId: o.LOCATION_ID,
                        locationName: locationIdToName.get(o.LOCATION_ID) || `Location #${o.LOCATION_ID}`,
                        role: authRoles,
                        privileges: privTypes,
                        privilegeLocations: privLocs,
                    };
                }));
                setUsers(rows);
            } catch (err) {
                if (signal?.cancelled) return;
                const apiError = err instanceof ApiError ? err : new ApiError('Failed to load users');
                showPopup('error', 'Error', apiError.message || 'Failed to load users.');
            } finally {
                if (!signal?.cancelled) setLoading(false);
            }
        },
        [locationIdToName, designationMap, appliedLocations, appliedDesignations, showPopup],
    );

    useEffect(() => {
        if (!hasSearched) {
            setLoading(false);
            return;
        }
        let cancelled = false;
        fetchOfficers({ cancelled });
        return () => {
            cancelled = true;
        };
    }, [fetchOfficers, hasSearched]);

    // ── Filtering, sorting & pagination ───────────────────────────────
    const filteredUsers = useMemo(() => {
        let list = [...users];

        // Text search
        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(
                (u) => u.fullName.toLowerCase().includes(q) || u.mobileNumber.includes(q) || (u.regNo || '').toLowerCase().includes(q),
            );
        }

        // Sort
        const key = String(sortKey ?? 'fullName');
        list.sort((a, b) => {
            const aVal = String((a as unknown as Record<string, string>)[key] ?? '').toLowerCase();
            const bVal = String((b as unknown as Record<string, string>)[key] ?? '').toLowerCase();
            const cmp = aVal.localeCompare(bVal);
            return sortAsc ? cmp : -cmp;
        });

        return list;
    }, [users, search, sortKey, sortAsc]);

    const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
    const effectivePage = Math.min(page, totalPages);
    const paginated = filteredUsers.slice((effectivePage - 1) * pageSize, effectivePage * pageSize);

    // ── Handlers ──────────────────────────────────────────────────────
    const handleSort = (key: keyof ManagedUser | string) => {
        if (sortKey === key) {
            setSortAsc((prev) => !prev);
        } else {
            setSortKey(key);
            setSortAsc(true);
        }
    };

    const handleView = () => {
        if (filterLocations.length === 0 || filterDesignations.length === 0) {
            showPopup('error', 'Error', 'Please select both SOCO Location and Designation to view the records.');
            return;
        }
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
        setPage(1);
    };

    const handleExportExcel = () => {
        if (filteredUsers.length === 0) return;

        const headers = ['Full Name', 'Reg. No', 'Mobile No.', 'SOCO Lab', 'Privilege Type', 'Authorization Role', 'Privilege Locations'];
        const data = filteredUsers.map((u) => ({
            'Full Name': u.fullName || '-',
            'Reg. No': u.regNo || '-',
            'Mobile No.': u.mobileNumber || '-',
            'SOCO Lab': u.locationName || '-',
            'Privilege Type': u.privileges || '-',
            'Authorization Role': u.role || '-',
            'Privilege Locations': u.privilegeLocations || '-',
        }));

        const worksheet = XLSX.utils.json_to_sheet(data, { header: headers });

        // Auto-size columns based on header length and content
        const colWidths = headers.map(header => {
            const maxContentLength = Math.max(
                header.length,
                ...data.map(row => (row[header as keyof typeof row] || '').toString().length)
            );
            return { wch: Math.min(maxContentLength + 2, 50) }; // cap width at 50
        });
        worksheet['!cols'] = colWidths;

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'User Summary');

        XLSX.writeFile(workbook, `SOCO_Users_Export_${new Date().toISOString().slice(0, 10)}.xlsx`);
    };

    const handleExportPDF = () => {
        if (filteredUsers.length === 0) return;

        const doc = new jsPDF();
        
        doc.setProperties({
            title: 'SOCO User Management Report',
            subject: 'User Summary',
            author: 'Sri Lanka Police',
            creator: 'SOCO SL Police Web Application'
        });

        // Header Title
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.setTextColor(30, 58, 138);
        doc.text('SRI LANKA POLICE - SOCO USERS REPORT', 14, 20);

        // Header Subtitle
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(107, 114, 128);
        doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 26);

        // Underline header
        doc.setDrawColor(59, 130, 246);
        doc.setLineWidth(0.8);
        doc.line(14, 29, 196, 29);

        autoTable(doc, {
            startY: 35,
            head: [['Full Name', 'Reg. No', 'Mobile No.', 'SOCO Lab', 'Privilege Type', 'Authorization Role', 'Privilege Locations']],
            body: filteredUsers.map((u) => [
                u.fullName || '-',
                u.regNo || '-',
                u.mobileNumber || '-',
                u.locationName || '-',
                u.privileges || '-',
                u.role || '-',
                u.privilegeLocations || '-'
            ]),
            theme: 'grid',
            headStyles: { fillColor: [30, 58, 138], textColor: 255, fontStyle: 'bold' },
            styles: { fontSize: 8, cellPadding: 3 },
            alternateRowStyles: { fillColor: [243, 244, 246] },
        });

        doc.save(`SOCO_Users_Export_${new Date().toISOString().slice(0, 10)}.pdf`);
    };

    return (
        <>
            <PageLayout>
                <PageHeader
                    backHref="/reports"
                    title="User Management"
                    description={
                        hasSearched
                            ? `Manage SOCO system users — ${filteredUsers.length} records found`
                            : 'Manage SOCO system users, roles and access permissions.'
                    }
                />

                {/* ── Filter Bar ──────────────────────────────────────────── */}
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

                    </div>

                    {/* Search input and Export — only enabled after a search */}
                    {hasSearched && (
                        <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
                            <div className="w-full max-w-md">
                                <SearchInput
                                    value={search}
                                    onChange={(e) => {
                                        setSearch(e.target.value);
                                        setPage(1);
                                    }}
                                    placeholder="Search name, mobile..."
                                    wrapperClassName="w-full"
                                    icon={<MagnifyingGlass size={15} />}
                                />
                            </div>
                            
                            <div className="flex items-center gap-2">
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={handleExportExcel}
                                    className="!min-h-[38px] !py-2 !text-sm px-3 flex items-center gap-2"
                                >
                                    <FileXls size={18} className="text-green-600" />
                                    Export Excel
                                </Button>
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={handleExportPDF}
                                    className="!min-h-[38px] !py-2 !text-sm px-3 flex items-center gap-2"
                                >
                                    <FilePdf size={18} className="text-red-500" />
                                    Export PDF
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Content Area ────────────────────────────────────────── */}
                <div className="animate-fade-in">
                    {!hasSearched ? (
                        <div className="flex flex-col items-center justify-center py-16 px-4 bg-white border border-gray-200 rounded-xl shadow-sm animate-fade-in">
                            <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 mb-4 ring-8 ring-blue-50/50">
                                <MagnifyingGlass size={32} className="text-blue-600" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-800 mb-1">User Management</h3>
                            <p className="text-sm text-gray-500 text-center max-w-md">
                                Please select a <span className="font-semibold text-gray-700">SOCO Location</span> and a{' '}
                                <span className="font-semibold text-gray-700">Designation</span> using the filters above, then click
                                the <span className="font-semibold text-gray-700">View</span> button to display records.
                            </p>
                        </div>
                    ) : loading ? (
                        <div className="text-center py-12 text-gray-400">Loading users...</div>
                    ) : (
                        <>
                            <UserList
                                users={paginated}
                                sortKey={sortKey}
                                sortAsc={sortAsc}
                                onSort={handleSort}
                                emptyMessage="No users found for the selected SOCO location."
                            />

                            {filteredUsers.length > 0 && (
                                <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-4 border-t border-gray-200">
                                    <p className="text-sm text-gray-600">
                                        Showing {filteredUsers.length === 0 ? 0 : (effectivePage - 1) * pageSize + 1} to{' '}
                                        {Math.min(effectivePage * pageSize, filteredUsers.length)} of {filteredUsers.length} users
                                    </p>
                                    <div className="flex items-center gap-4">
                                        <div className="w-36">
                                            <CustomSelect
                                                value={String(pageSize)}
                                                onChange={(v) => {
                                                    setPageSize(Number(v));
                                                    setPage(1);
                                                }}
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



            <ResultPopup {...popup} onClose={closePopup} />
        </>
    );
}
