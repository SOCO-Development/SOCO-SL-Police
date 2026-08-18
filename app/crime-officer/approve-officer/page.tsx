'use client';

import { useMemo, useState } from 'react';
import AppTable, { type AppTableColumn } from '@/components/layout/AppTable';
import MultiSelect from '@/components/forms/MultiSelect';
import DatePicker from '@/components/forms/DatePicker';
import { ApproveRejectActions, PageHeader, PageLayout, SearchInput } from '@/components/ui';
import { cn } from '@/lib/utils';
import { Eye } from 'lucide-react';

type FilterTab = 'PENDING' | 'APPROVED' | 'REJECTED';

const tabs: { label: string; value: FilterTab }[] = [
  { label: 'Pending Officers', value: 'PENDING' },
  { label: 'Approved Officers', value: 'APPROVED' },
  { label: 'Rejected Officers', value: 'REJECTED' },
];

// Placeholder row shape — to be replaced once the officer approval API is available.
interface OfficerApprovalRow {
  id: string;
  officerNo: string;
  name: string;
  rank: string;
  location: string;
  submittedAt: string;
}

export default function ApproveOfficerPage() {
  const [filter, setFilter] = useState<FilterTab>('PENDING');
  const [searchTerm, setSearchTerm] = useState('');

  const [locations, setLocations] = useState<{ value: string; label: string }[]>([]);
  const [selectedLocationIds, setSelectedLocationIds] = useState<string[]>([]);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const [hasLoaded, setHasLoaded] = useState(false);
  const [loading, setLoading] = useState(false);

  // No backend wiring yet — UI only. Data will be populated once the officer approval API is ready.
  const pendingOfficers: OfficerApprovalRow[] = [];
  const approvedOfficers: OfficerApprovalRow[] = [];
  const rejectedOfficers: OfficerApprovalRow[] = [];

  const dataForTab = useMemo(() => {
    if (filter === 'PENDING') return pendingOfficers;
    if (filter === 'APPROVED') return approvedOfficers;
    return rejectedOfficers;
  }, [filter]);

  const countFor = (tab: FilterTab) =>
    tab === 'PENDING' ? pendingOfficers.length : tab === 'APPROVED' ? approvedOfficers.length : rejectedOfficers.length;

  function handleView() {
    setLoading(true);
    // Placeholder — will call the officer approval API once available.
    setTimeout(() => {
      setLoading(false);
      setHasLoaded(true);
    }, 300);
  }

  const columns: AppTableColumn<OfficerApprovalRow>[] = [
    {
      key: 'officerNo',
      label: 'Officer No.',
      sortable: true,
      render: (_, row) => <span className="font-mono text-xs text-blue-700 font-semibold">{row.officerNo}</span>,
    },
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      render: (_, row) => <span className="text-gray-700">{row.name}</span>,
    },
    {
      key: 'rank',
      label: 'Rank',
      sortable: true,
      render: (_, row) => <span className="text-gray-700">{row.rank}</span>,
    },
    {
      key: 'location',
      label: 'Location',
      sortable: true,
      render: (_, row) => <span className="text-gray-700">{row.location}</span>,
    },
    {
      key: 'submittedAt',
      label: 'Submitted',
      sortable: true,
      render: (_, row) => <span className="text-gray-700 text-xs">{row.submittedAt}</span>,
    },
    ...(filter === 'PENDING'
      ? [
          {
            key: 'actions',
            label: 'Actions',
            align: 'right' as const,
            render: (_: unknown, row: OfficerApprovalRow) => (
              <ApproveRejectActions
                onApprove={() => {
                  // Placeholder — will call the officer approval API once available.
                }}
                onReject={() => {
                  // Placeholder — will call the officer approval API once available.
                }}
              />
            ),
          },
        ]
      : []),
  ];

  return (
    <PageLayout>
      <PageHeader backHref="/crime-officer" title="Approve Officer" />

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 mb-6">
        <div className="flex gap-3 flex-wrap items-end">
          <div className="min-w-[220px] flex-1 max-w-xs">
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
              Select SOCO Location
            </label>
            <MultiSelect
              value={selectedLocationIds}
              onChange={setSelectedLocationIds}
              options={locations}
              placeholder="Select SOCO Location"
            />
          </div>
          <div className="min-w-[170px]">
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">From</label>
            <DatePicker value={dateFrom} onChange={setDateFrom} />
          </div>
          <div className="min-w-[170px]">
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">To</label>
            <DatePicker value={dateTo} onChange={setDateTo} />
          </div>
          <button
            type="button"
            onClick={handleView}
            disabled={loading || selectedLocationIds.length === 0}
            className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-lg transition-colors min-h-[38px] flex items-center gap-1.5 shadow-sm border border-blue-700/10 hover:border-blue-700/25"
          >
            {loading ? (
              <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
            View
          </button>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 p-1">
          {tabs.map((tab) => {
            const active = filter === tab.value;
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => setFilter(tab.value)}
                className={cn(
                  'group inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1',
                  active
                    ? 'bg-white text-blue-700 shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                )}
              >
                {tab.label}
                <span
                  className={cn(
                    'rounded-full px-1.5 py-0.5 text-xs font-semibold',
                    active ? 'bg-blue-50 text-blue-700' : 'bg-gray-200 text-gray-600 group-hover:bg-gray-300'
                  )}
                >
                  {countFor(tab.value)}
                </span>
              </button>
            );
          })}
        </div>
        <SearchInput
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by officer no, name, or updated date..."
          wrapperClassName="w-full md:w-96 mb-2"
          className="min-h-10"
        />
      </div>

      {!hasLoaded ? (
        <div className="text-center py-16 text-gray-400 text-sm">
          Please select SOCO Location(s) and click the &quot;View&quot; button to load pending approvals.
        </div>
      ) : (
        <AppTable<OfficerApprovalRow>
          columns={columns}
          data={dataForTab}
          keyField="id"
          emptyMessage={
            filter === 'PENDING'
              ? 'No pending officers'
              : filter === 'APPROVED'
              ? 'No approved officers'
              : 'No rejected officers'
          }
          variant="card"
        />
      )}
    </PageLayout>
  );
}
