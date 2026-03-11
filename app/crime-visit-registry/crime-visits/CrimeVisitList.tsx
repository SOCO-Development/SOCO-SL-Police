'use client';

import Link from 'next/link';
import type { CrimeVisit } from '@/types/crimeVisit';
import { formatDateTimeDDMMYYYY } from '@/lib/dateUtils';
import { FileText, Clock, CheckCircle, Trash2, ExternalLink } from 'lucide-react';

interface CrimeVisitListProps {
    visits: CrimeVisit[];
    onDelete?: (id: string) => void;
    showStatusBadge?: boolean;
    emptyMessage?: string;
}

function statusBadge(status: CrimeVisit['status']) {
    if (status === 'DRAFT') {
        return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                <Clock className="w-3 h-3" />
                Draft
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
            <CheckCircle className="w-3 h-3" />
            Submitted
        </span>
    );
}

function formatDate(iso: string) {
    try {
        return formatDateTimeDDMMYYYY(iso);
    } catch {
        return iso;
    }
}

export default function CrimeVisitList({
    visits,
    onDelete,
    showStatusBadge = true,
    emptyMessage = 'No records found.',
}: CrimeVisitListProps) {
    if (visits.length === 0) {
        return (
            <div className="text-center py-20 text-gray-400">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">{emptyMessage}</p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm bg-white">
            <table className="w-full text-sm">
                <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Reference No.</th>
                        {showStatusBadge && (
                            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                        )}
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Vehicle No.</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Reported Date</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Created</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Updated</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {visits.map((visit) => {
                        const isDraft = visit.status === 'DRAFT';
                        const detailHref = isDraft
                            ? `/crime-visit-registry/drafts?id=${visit.id}`
                            : `/crime-visit-registry/crime-visits?id=${visit.id}`;

                        return (
                            <tr
                                key={visit.id}
                                className="border-b border-gray-100 last:border-0 hover:bg-blue-50/30 transition-colors"
                            >
                                <td className="px-4 py-3 font-mono text-xs text-blue-700 font-semibold">
                                    {visit.referenceNo ?? visit.id}
                                </td>
                                {showStatusBadge && (
                                    <td className="px-4 py-3">{statusBadge(visit.status)}</td>
                                )}
                                <td className="px-4 py-3 text-gray-700">
                                    {visit.sectionC?.vehicleNo ?? <span className="text-gray-300">—</span>}
                                </td>
                                <td className="px-4 py-3 text-gray-600">
                                    {visit.sectionA?.reportedToSocoLab?.date ?? <span className="text-gray-300">—</span>}
                                </td>
                                <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(visit.createdAt)}</td>
                                <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(visit.updatedAt)}</td>
                                <td className="px-4 py-3">
                                    <div className="flex items-center justify-end gap-2">
                                        <Link
                                            href={detailHref}
                                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200"
                                        >
                                            <ExternalLink className="w-3 h-3" />
                                            {isDraft ? 'Continue' : 'View'}
                                        </Link>
                                        {onDelete && isDraft && (
                                            <button
                                                onClick={() => onDelete(visit.id)}
                                                className="flex items-center gap-1 px-2 py-1.5 text-xs text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                                                aria-label="Delete draft"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
