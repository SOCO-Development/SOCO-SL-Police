'use client';

import Link from 'next/link';
import AppTable, { type AppTableColumn } from '@/components/layout/AppTable';
import Button from '@/components/buttons/Button';
import type { CrimeVisit } from '@/types/crimeVisit';
import { formatDateTimeDDMMYYYY } from '@/lib/dateUtils';
import { Clock, CheckCircle, Trash2, ExternalLink } from 'lucide-react';

interface CrimeVisitListProps {
    visits: CrimeVisit[];
    onDelete?: (id: string) => void;
    showStatusBadge?: boolean;
    draftDetailBasePath?: '/crime-visit-registry/drafts' | '/crime-visit-registry/crime-visits';
    sortKey?: keyof CrimeVisit | string | null;
    sortAsc?: boolean;
    onSort?: (key: keyof CrimeVisit | string) => void;
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
    draftDetailBasePath = '/crime-visit-registry/drafts',
    sortKey = null,
    sortAsc = true,
    onSort,
    emptyMessage = 'No records found.',
}: CrimeVisitListProps) {
    const baseColumns: AppTableColumn<CrimeVisit>[] = [
        {
            key: 'referenceNo',
            label: 'Reference No.',
            sortable: true,
            render: (_, row) => (
                <span className="font-mono text-xs text-blue-700 font-semibold">
                    {row.referenceNo ?? row.id}
                </span>
            ),
        },
        ...(showStatusBadge
            ? [
                {
                    key: 'status',
                    label: 'Status',
                    sortable: true,
                    render: (_, row) => statusBadge(row.status),
                } as AppTableColumn<CrimeVisit>,
            ]
            : []),
        {
            key: 'vehicleNo',
            label: 'Vehicle No.',
            sortable: true,
            render: (_, row) =>
                row.sectionC?.vehicleNo ?? <span className="text-gray-500">—</span>,
        },
        {
            key: 'reportedDate',
            label: 'Reported Date',
            sortable: true,
            render: (_, row) =>
                row.sectionA?.reportedToSocoLab?.date ?? <span className="text-gray-500">—</span>,
        },
        {
            key: 'createdAt',
            label: 'Created',
            sortable: true,
            render: (_, row) => (
                <span className="text-gray-700 text-xs">{formatDate(row.createdAt)}</span>
            ),
        },
        {
            key: 'updatedAt',
            label: 'Updated',
            sortable: true,
            render: (_, row) => (
                <span className="text-gray-700 text-xs">{formatDate(row.updatedAt)}</span>
            ),
        },
        {
            key: 'actions',
            label: 'Actions',
            sortable: false,
            align: 'right' as const,
            render: (_, row) => {
                const isDraft = row.status === 'DRAFT';
                const detailHref = isDraft
                    ? `${draftDetailBasePath}?id=${row.id}`
                    : `/crime-visit-registry/crime-visits?id=${row.id}`;
                return (
                    <div className="flex items-center justify-end gap-2">
                        <Link
                            href={detailHref}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200"
                        >
                            <ExternalLink className="w-3 h-3" />
                            {isDraft ? 'Continue' : 'View'}
                        </Link>
                        {onDelete && isDraft && (
                            <Button variant="danger" onClick={() => onDelete(row.id)} aria-label="Delete draft">
                                <Trash2 className="w-3 h-3" />
                            </Button>
                        )}
                    </div>
                );
            },
        },
    ];

    return (
        <AppTable<CrimeVisit>
            columns={baseColumns}
            data={visits}
            keyField="id"
            sortKey={sortKey}
            sortAsc={sortAsc}
            onSort={onSort}
            emptyMessage={emptyMessage}
            variant="card"
        />
    );
}
