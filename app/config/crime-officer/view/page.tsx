'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { ANNEX_01_SOCO_LABS, ANNEX_12_RANK } from '@/lib/annexData';
import { MagnifyingGlass, Pencil, Trash, Eye, FunnelSimple, CaretUp, CaretDown } from 'phosphor-react';

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_OFFICERS = [
    { id: 1, photo: null, name: 'K.M. Perera', rank: 'SI', regNo: 'P12345', socoLab: 'Kandy', mobile: '071-1234567', presentRank: 'IP' },
    { id: 2, photo: null, name: 'R.P. Silva', rank: 'PC', regNo: 'P23456', socoLab: 'Colombo Central', mobile: '077-2345678', presentRank: 'PS' },
    { id: 3, photo: null, name: 'S.A. Fernando', rank: 'IP', regNo: 'P34567', socoLab: 'Galle', mobile: '076-3456789', presentRank: 'CI' },
    { id: 4, photo: null, name: 'N.D. Jayawardena', rank: 'PS', regNo: 'P45678', socoLab: 'Jaffna', mobile: '070-4567890', presentRank: 'SI' },
    { id: 5, photo: null, name: 'C.B. Gunasekara', rank: 'SI', regNo: 'P56789', socoLab: 'Matara', mobile: '072-5678901', presentRank: 'IP' },
    { id: 6, photo: null, name: 'A.T. Wickramasinghe', rank: 'PC', regNo: 'P67890', socoLab: 'Kurunegala', mobile: '075-6789012', presentRank: 'PS' },
    { id: 7, photo: null, name: 'D.R. Dissanayake', rank: 'IP', regNo: 'P78901', socoLab: 'Trincomalee', mobile: '071-7890123', presentRank: 'CI' },
];

type SortKey = 'name' | 'rank' | 'dateJoined';
type SortDir = 'asc' | 'desc';

const PAGE_SIZE = 5;

// ─── Avatar placeholder ───────────────────────────────────────────────────────

function OfficerAvatar({ name }: { name: string }) {
    const initials = name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
    return (
        <div className="w-10 h-12 rounded border border-gray-200 bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs shadow-sm">
            {initials}
        </div>
    );
}

// ─── Sort indicator ───────────────────────────────────────────────────────────

function SortIcon({ col, sortKey, sortDir }: { col: SortKey; sortKey: SortKey; sortDir: SortDir }) {
    if (col !== sortKey) return <span className="ml-1 text-gray-300 inline-flex flex-col leading-none"><CaretUp size={8} /><CaretDown size={8} /></span>;
    return sortDir === 'asc'
        ? <CaretUp size={11} className="ml-1 text-blue-500 inline" />
        : <CaretDown size={11} className="ml-1 text-blue-500 inline" />;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ViewOfficersPage() {
    const [search, setSearch] = useState('');
    const [filterLab, setFilterLab] = useState('');
    const [filterRank, setFilterRank] = useState('');
    const [sortKey, setSortKey] = useState<SortKey>('name');
    const [sortDir, setSortDir] = useState<SortDir>('asc');
    const [page, setPage] = useState(1);
    const [showFilters, setShowFilters] = useState(false);

    const handleSort = (key: SortKey) => {
        if (key === sortKey) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
        else { setSortKey(key); setSortDir('asc'); }
    };

    const filtered = useMemo(() => {
        let data = [...MOCK_OFFICERS];
        if (search.trim()) {
            const q = search.toLowerCase();
            data = data.filter((o) =>
                o.name.toLowerCase().includes(q) ||
                o.regNo.toLowerCase().includes(q) ||
                o.mobile.includes(q)
            );
        }
        if (filterLab) data = data.filter((o) => o.socoLab === filterLab);
        if (filterRank) data = data.filter((o) => o.rank === filterRank);
        data.sort((a, b) => {
            const av = a[sortKey as keyof typeof a] as string ?? '';
            const bv = b[sortKey as keyof typeof b] as string ?? '';
            return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
        });
        return data;
    }, [search, filterLab, filterRank, sortKey, sortDir]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    const handleDelete = (id: number) => {
        if (confirm('Are you sure you want to delete this officer record?')) {
            alert(`Officer ${id} deleted (mock).`);
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-white to-gray-50">
            <Header />
            <div className="flex flex-1 relative z-10 w-full pt-14">
                <main className="flex-1 overflow-x-hidden min-w-0 flex flex-col min-h-screen">
                    <div className="w-full px-4 sm:px-6 lg:px-8 py-8 flex-1">

                        {/* Breadcrumb */}
                        <nav className="mb-4 text-sm text-gray-500 flex items-center gap-2">
                            <Link href="/config" className="hover:text-blue-600 transition-colors">Configuration</Link>
                            <span>›</span>
                            <Link href="/config/crime-officer" className="hover:text-blue-600 transition-colors">Crime Officer Management</Link>
                            <span>›</span>
                            <span className="text-gray-800 font-medium">View Officers</span>
                        </nav>

                        <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">SOCO Officers</h2>
                                <p className="text-sm text-gray-500 mt-0.5">SOCO නිලධාරීන් — {filtered.length} records found</p>
                            </div>
                            <Link
                                href="/config/crime-officer/add"
                                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
                            >
                                + Add Officer
                            </Link>
                        </div>

                        {/* Search & Filters */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4">
                            <div className="flex gap-3 flex-wrap items-center">
                                {/* Search */}
                                <div className="flex-1 min-w-[200px] relative">
                                    <MagnifyingGlass size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        value={search}
                                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                                        placeholder="Search name, reg no, mobile..."
                                        className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors"
                                    />
                                </div>

                                {/* Filter toggle */}
                                <button
                                    type="button"
                                    onClick={() => setShowFilters((f) => !f)}
                                    className={`inline-flex items-center gap-2 px-3 py-2 text-sm font-medium border rounded-lg transition-colors ${showFilters ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-gray-50 border-gray-300 text-gray-600 hover:bg-gray-100'}`}
                                >
                                    <FunnelSimple size={15} />
                                    Filters
                                </button>
                            </div>

                            {showFilters && (
                                <div className="mt-3 flex gap-3 flex-wrap pt-3 border-t border-gray-100">
                                    <div className="flex-1 min-w-[180px]">
                                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Filter by SOCO Lab</label>
                                        <select
                                            value={filterLab}
                                            onChange={(e) => { setFilterLab(e.target.value); setPage(1); }}
                                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors"
                                        >
                                            <option value="">All Labs</option>
                                            {ANNEX_01_SOCO_LABS.map((l) => <option key={l} value={l}>{l}</option>)}
                                        </select>
                                    </div>
                                    <div className="flex-1 min-w-[140px]">
                                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Filter by Rank</label>
                                        <select
                                            value={filterRank}
                                            onChange={(e) => { setFilterRank(e.target.value); setPage(1); }}
                                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors"
                                        >
                                            <option value="">All Ranks</option>
                                            {ANNEX_12_RANK.map((r) => <option key={r} value={r}>{r}</option>)}
                                        </select>
                                    </div>
                                    {(filterLab || filterRank || search) && (
                                        <div className="flex items-end">
                                            <button
                                                type="button"
                                                onClick={() => { setFilterLab(''); setFilterRank(''); setSearch(''); setPage(1); }}
                                                className="px-3 py-2 text-xs font-medium text-red-500 hover:text-red-700 transition-colors"
                                            >
                                                Clear filters
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Table */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-gray-50 border-b border-gray-200">
                                            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide w-16">Photo</th>
                                            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide cursor-pointer hover:text-blue-600 transition-colors"
                                                onClick={() => handleSort('name')}>
                                                Name <SortIcon col="name" sortKey={sortKey} sortDir={sortDir} />
                                            </th>
                                            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide cursor-pointer hover:text-blue-600 transition-colors"
                                                onClick={() => handleSort('rank')}>
                                                Rank <SortIcon col="rank" sortKey={sortKey} sortDir={sortDir} />
                                            </th>
                                            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Reg. No</th>
                                            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">SOCO Lab</th>
                                            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Mobile</th>
                                            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Present Rank</th>
                                            <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {paginated.length === 0 ? (
                                            <tr>
                                                <td colSpan={8} className="px-4 py-12 text-center text-gray-400 text-sm">
                                                    No officers found matching your search criteria.
                                                </td>
                                            </tr>
                                        ) : (
                                            paginated.map((officer, idx) => (
                                                <tr
                                                    key={officer.id}
                                                    className={`border-b border-gray-100 last:border-0 hover:bg-blue-50/40 transition-colors ${idx % 2 === 0 ? '' : 'bg-gray-50/30'}`}
                                                >
                                                    <td className="px-4 py-3">
                                                        <OfficerAvatar name={officer.name} />
                                                    </td>
                                                    <td className="px-4 py-3 font-medium text-gray-800">{officer.name}</td>
                                                    <td className="px-4 py-3">
                                                        <span className="inline-block px-2 py-0.5 text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100 rounded">
                                                            {officer.rank}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-gray-600 font-mono text-xs">{officer.regNo}</td>
                                                    <td className="px-4 py-3 text-gray-600">{officer.socoLab}</td>
                                                    <td className="px-4 py-3 text-gray-600">{officer.mobile}</td>
                                                    <td className="px-4 py-3">
                                                        <span className="inline-block px-2 py-0.5 text-xs font-semibold bg-green-50 text-green-700 border border-green-100 rounded">
                                                            {officer.presentRank}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <button
                                                                type="button"
                                                                title="View"
                                                                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                                                onClick={() => alert(`View officer ${officer.name}`)}
                                                            >
                                                                <Eye size={15} />
                                                            </button>
                                                            <Link
                                                                href={`/config/crime-officer/add?edit=${officer.id}`}
                                                                title="Edit"
                                                                className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors"
                                                            >
                                                                <Pencil size={15} />
                                                            </Link>
                                                            <button
                                                                type="button"
                                                                title="Delete"
                                                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                                                onClick={() => handleDelete(officer.id)}
                                                            >
                                                                <Trash size={15} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50/50">
                                <p className="text-xs text-gray-500">
                                    Showing {filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} officers
                                </p>
                                <div className="flex gap-1">
                                    <button
                                        type="button"
                                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                                        disabled={page === 1}
                                        className="px-3 py-1 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                    >
                                        ← Prev
                                    </button>
                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                                        <button
                                            key={p}
                                            type="button"
                                            onClick={() => setPage(p)}
                                            className={`px-3 py-1 text-xs font-medium border rounded transition-colors ${p === page ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                                        >
                                            {p}
                                        </button>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                        disabled={page === totalPages}
                                        className="px-3 py-1 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                    >
                                        Next →
                                    </button>
                                </div>
                            </div>
                        </div>

                    </div>
                    <Footer />
                </main>
            </div>
        </div>
    );
}
