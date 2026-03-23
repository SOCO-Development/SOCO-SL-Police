'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import DatePicker from '@/components/forms/DatePicker';
import TimePicker from '@/components/forms/TimePicker';
import CustomSelect from '@/components/forms/CustomSelect';
import MultiSelect from '@/components/forms/MultiSelect';
import Button from '@/components/buttons/Button';
import FilterPrimaryButton from '@/components/buttons/FilterPrimaryButton';
import FilterSection from '@/components/layout/FilterSection';
import ContentCard from '@/components/layout/ContentCard';
import TableToolbar from '@/components/layout/TableToolbar';
import AppTable, { type AppTableColumn } from '@/components/layout/AppTable';
import { FaArrowLeft } from 'react-icons/fa';

// Aggregate row: complaint category with counts per type
interface CategoryRow {
  no: number;
  complaintCategory: string;
  utr: number;
  citr: number;
  lostPhone: number;
  tellIgp: number;
  nhd118: number;
  narcotics: number;
  nhdPublic: number;
  total: number;
  complaintResolved: number;
  complaintPending: number;
}

// Sample aggregate data matching the UI reference
const sampleCategoryData: CategoryRow[] = [
  { no: 1, complaintCategory: 'Assault', utr: 423, citr: 0, lostPhone: 0, tellIgp: 0, nhd118: 0, narcotics: 0, nhdPublic: 0, total: 423, complaintResolved: 41, complaintPending: 382 },
  { no: 2, complaintCategory: 'Burglary', utr: 0, citr: 0, lostPhone: 0, tellIgp: 0, nhd118: 2, narcotics: 0, nhdPublic: 0, total: 2, complaintResolved: 1, complaintPending: 1 },
  { no: 3, complaintCategory: 'Cattle theft, transportation of cattle for slaughter', utr: 4, citr: 0, lostPhone: 0, tellIgp: 1, nhd118: 0, narcotics: 0, nhdPublic: 0, total: 5, complaintResolved: 0, complaintPending: 5 },
  { no: 4, complaintCategory: 'Causing damage by fire or explosion', utr: 0, citr: 0, lostPhone: 0, tellIgp: 0, nhd118: 1, narcotics: 0, nhdPublic: 0, total: 1, complaintResolved: 1, complaintPending: 0 },
  { no: 5, complaintCategory: 'Damage property', utr: 58, citr: 0, lostPhone: 0, tellIgp: 0, nhd118: 0, narcotics: 0, nhdPublic: 0, total: 58, complaintResolved: 4, complaintPending: 54 },
  { no: 6, complaintCategory: 'Explosives and Firearms', utr: 2, citr: 0, lostPhone: 0, tellIgp: 0, nhd118: 0, narcotics: 0, nhdPublic: 0, total: 2, complaintResolved: 0, complaintPending: 2 },
  { no: 7, complaintCategory: 'Forcibly gaining', utr: 11, citr: 0, lostPhone: 0, tellIgp: 0, nhd118: 0, narcotics: 0, nhdPublic: 0, total: 11, complaintResolved: 1, complaintPending: 10 },
  { no: 8, complaintCategory: 'Grievous hurt', utr: 0, citr: 0, lostPhone: 0, tellIgp: 0, nhd118: 1, narcotics: 0, nhdPublic: 0, total: 1, complaintResolved: 0, complaintPending: 1 },
  { no: 9, complaintCategory: 'kidnapping', utr: 7, citr: 0, lostPhone: 0, tellIgp: 0, nhd118: 0, narcotics: 0, nhdPublic: 0, total: 7, complaintResolved: 0, complaintPending: 7 },
  { no: 10, complaintCategory: 'Lost Phone', utr: 0, citr: 91, lostPhone: 0, tellIgp: 0, nhd118: 0, narcotics: 0, nhdPublic: 0, total: 91, complaintResolved: 3, complaintPending: 88 },
  { no: 11, complaintCategory: 'Mischief', utr: 15, citr: 0, lostPhone: 0, tellIgp: 0, nhd118: 0, narcotics: 0, nhdPublic: 0, total: 15, complaintResolved: 2, complaintPending: 13 },
  { no: 12, complaintCategory: 'Murder', utr: 3, citr: 0, lostPhone: 0, tellIgp: 0, nhd118: 0, narcotics: 0, nhdPublic: 0, total: 3, complaintResolved: 0, complaintPending: 3 },
  { no: 13, complaintCategory: 'Other', utr: 120, citr: 5, lostPhone: 2, tellIgp: 1, nhd118: 4, narcotics: 0, nhdPublic: 0, total: 132, complaintResolved: 18, complaintPending: 114 },
  { no: 14, complaintCategory: 'Robbery', utr: 22, citr: 0, lostPhone: 0, tellIgp: 0, nhd118: 0, narcotics: 0, nhdPublic: 0, total: 22, complaintResolved: 1, complaintPending: 21 },
  { no: 15, complaintCategory: 'Theft', utr: 85, citr: 2, lostPhone: 0, tellIgp: 1, nhd118: 3, narcotics: 0, nhdPublic: 0, total: 91, complaintResolved: 12, complaintPending: 79 },
  { no: 16, complaintCategory: 'Traffic offences', utr: 45, citr: 0, lostPhone: 0, tellIgp: 0, nhd118: 2, narcotics: 0, nhdPublic: 0, total: 47, complaintResolved: 8, complaintPending: 39 },
  { no: 17, complaintCategory: 'Violence and abuse against children and women', utr: 18, citr: 0, lostPhone: 0, tellIgp: 0, nhd118: 1, narcotics: 0, nhdPublic: 0, total: 19, complaintResolved: 2, complaintPending: 17 },
  { no: 18, complaintCategory: 'Wrongful restraint', utr: 5, citr: 0, lostPhone: 0, tellIgp: 0, nhd118: 0, narcotics: 0, nhdPublic: 0, total: 5, complaintResolved: 0, complaintPending: 5 },
  { no: 19, complaintCategory: 'Other institutions under the Ministry', utr: 0, citr: 0, lostPhone: 0, tellIgp: 0, nhd118: 0, narcotics: 0, nhdPublic: 1, total: 1, complaintResolved: 0, complaintPending: 1 },
];

const complaintTypeOptions = [
  { value: 'UTR', label: 'UTR' },
  { value: 'CITR', label: 'CITR' },
  { value: 'Lost Phone', label: 'Lost Phone' },
  { value: 'Tell IGP', label: 'Tell IGP' },
  { value: 'NHD 118', label: 'NHD 118' },
  { value: 'Narcotics', label: 'Narcotics' },
  { value: 'NHD - Public', label: 'NHD - Public' },
];

const centerOptions = [
  { value: 'apollo01', label: 'Appollo 01 Apollo Center' },
  { value: 'apollo02', label: 'Appollo 02 Apollo Center' },
  { value: 'apollo03', label: 'Appollo 03 Apollo Center' },
  { value: 'apollo04', label: 'Appollo 04 Apollo Center' },
  { value: 'apollo05', label: 'Appollo 05 Apollo Center' },
  { value: 'apollo06', label: 'Appollo 06 Apollo Center' },
  { value: 'apollo07', label: 'Appollo 07 Apollo Center' },
  { value: 'apollo08', label: 'Appollo 08 Apollo Center' },
  { value: 'apollo09', label: 'Appollo 09 Apollo Center' },
  { value: 'apollo10', label: 'Appollo 10 Apollo Center' },
  { value: 'apollo11', label: 'Appollo 11 Apollo Center' },
  { value: 'apollo12', label: 'Appollo 12 Apollo Center' },
  { value: 'apollo13', label: 'Appollo 13 Apollo Center' },
  { value: 'apollo14', label: 'Appollo 14 Apollo Center' },
  { value: 'apollo15', label: 'Appollo 15 Apollo Center' },
  { value: 'colombo', label: 'Colombo Emergency' },
  { value: 'kandy', label: 'Kandy Division' },
  { value: 'gampaha', label: 'Gampaha Division' },
];

const categoryOptions = [
  { value: 'Crimes', label: 'Crimes' },
  { value: 'Information', label: 'Information' },
  { value: 'Violence and abuse against children and women', label: 'Violence and abuse against children and women' },
  { value: 'Incidents', label: 'Incidents' },
  { value: 'Bribery and corruption scams', label: 'Bribery and corruption scams' },
  { value: 'Miscellaneous Complaints', label: 'Miscellaneous Complaints' },
  { value: 'Anti-corruption information', label: 'Anti-corruption information' },
  { value: 'Traffic offences', label: 'Traffic offences' },
  { value: 'Electoral and Political', label: 'Electoral and Political' },
  { value: 'Complaints against the police', label: 'Complaints against the police' },
  { value: 'Other institutions under the Ministry', label: 'Other institutions under the Ministry' },
];

const REPORT_COLUMNS: AppTableColumn<CategoryRow>[] = [
  { key: 'no', label: 'NO', sortable: true, align: 'right' },
  { key: 'complaintCategory', label: 'Complaint Category', sortable: true, className: 'text-gray-800 font-medium' },
  { key: 'utr', label: 'UTR', sortable: true, align: 'right' },
  { key: 'citr', label: 'CITR', sortable: true, align: 'right' },
  { key: 'lostPhone', label: 'Lost Phone', sortable: true, align: 'right' },
  { key: 'tellIgp', label: 'Tell IGP', sortable: true, align: 'right' },
  { key: 'nhd118', label: 'NHD 118', sortable: true, align: 'right' },
  { key: 'narcotics', label: 'Narcotics', sortable: true, align: 'right' },
  { key: 'nhdPublic', label: 'NHD - Public', sortable: true, align: 'right' },
  { key: 'total', label: 'Total', sortable: true, className: 'font-medium', align: 'right' },
  { key: 'complaintResolved', label: 'Complaint Resolved', sortable: true, align: 'right' },
  { key: 'complaintPending', label: 'Complaint Pending', sortable: true, align: 'right' },
];

export default function ComplaintReportPage() {
  const router = useRouter();
  const [dateFrom, setDateFrom] = useState('01-02-2026');
  const [timeFrom, setTimeFrom] = useState('12:18');
  const [dateTo, setDateTo] = useState('02-02-2026');
  const [timeTo, setTimeTo] = useState('13:18');
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedCenters, setSelectedCenters] = useState<string[]>([]);
  const [category, setCategory] = useState('Crimes');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState<keyof CategoryRow | string | null>(null);
  const [sortAsc, setSortAsc] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const entriesPerPage = 10;

  const filteredAndSorted = useMemo(() => {
    let rows = sampleCategoryData.filter(
      (r) =>
        !searchQuery.trim() ||
        r.complaintCategory.toLowerCase().includes(searchQuery.toLowerCase())
    );
    if (sortKey) {
      const key = sortKey as keyof CategoryRow;
      rows = [...rows].sort((a, b) => {
        const aVal = a[key];
        const bVal = b[key];
        const cmp = typeof aVal === 'string' && typeof bVal === 'string'
          ? aVal.localeCompare(bVal)
          : (Number(aVal) - Number(bVal));
        return sortAsc ? cmp : -cmp;
      });
    }
    return rows;
  }, [searchQuery, sortKey, sortAsc]);

  const totalEntries = filteredAndSorted.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / entriesPerPage));
  const startIndex = (currentPage - 1) * entriesPerPage;
  const paginatedRows = filteredAndSorted.slice(startIndex, startIndex + entriesPerPage);

  const handleSort = (key: keyof CategoryRow | string) => {
    if (sortKey === key) {
      setSortAsc((prev) => !prev);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
    setCurrentPage(1);
  };

  const exportToCsv = () => {
    const headers = ['NO', 'Complaint Category', 'UTR', 'CITR', 'Lost Phone', 'Tell IGP', 'NHD 118', 'Narcotics', 'NHD - Public', 'Total', 'Complaint Resolved', 'Complaint Pending'];
    const rows = filteredAndSorted.map((r) =>
      [r.no, r.complaintCategory, r.utr, r.citr, r.lostPhone, r.tellIgp, r.nhd118, r.narcotics, r.nhdPublic, r.total, r.complaintResolved, r.complaintPending].join(',')
    );
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `complaint-report-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const handleCopy = () => {
    const text = filteredAndSorted
      .map((r) =>
        [r.no, r.complaintCategory, r.utr, r.citr, r.lostPhone, r.tellIgp, r.nhd118, r.narcotics, r.nhdPublic, r.total, r.complaintResolved, r.complaintPending].join('\t')
      )
      .join('\n');
    void navigator.clipboard.writeText(text);
  };

  return (
    <div className="complaint-report-page min-h-screen flex flex-col bg-gray-50 print:bg-white">
      <Header />
      <div className="flex flex-1 w-full relative z-10 pt-14 print:pt-0">
        <main className="flex-1 overflow-x-hidden min-w-0 flex flex-col min-h-screen print:ml-0">
          <div className="w-full px-4 sm:px-6 lg:px-8 py-10 flex-1 print:py-4">
            <div className="flex items-center gap-4 mb-6 print:mb-4">
              <Button
                variant="secondary"
                onClick={() => router.push('/reports')}
                className="print:hidden"
              >
                <FaArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <h1 className="text-3xl font-bold text-gray-900">Complaint Report</h1>
            </div>

            {/* Filters - 4 Columns, 2 Rows (same as View Complaints / Dashboard) */}
            <FilterSection className="print:hidden">
              <div className="grid grid-cols-4 gap-4">
                {/* First Row - 4 Columns */}
                <DatePicker value={dateFrom} onChange={setDateFrom} className="w-full" />
                <TimePicker value={timeFrom} onChange={setTimeFrom} className="w-full" />
                <DatePicker value={dateTo} onChange={setDateTo} className="w-full" />
                <TimePicker value={timeTo} onChange={setTimeTo} className="w-full" />
                {/* Second Row - 4 Columns */}
                <MultiSelect
                  value={selectedTypes}
                  onChange={setSelectedTypes}
                  options={complaintTypeOptions}
                  placeholder="Nothing selected"
                  className="w-full"
                />
                <MultiSelect
                  value={selectedCenters}
                  onChange={setSelectedCenters}
                  options={centerOptions}
                  placeholder="Nothing selected"
                  className="w-full"
                />
                <CustomSelect
                  value={category}
                  onChange={setCategory}
                  options={categoryOptions}
                  className="w-full"
                />
                <FilterPrimaryButton>View Report</FilterPrimaryButton>
              </div>
            </FilterSection>

            {/* Main Content Area (same card as View Complaints) */}
            <ContentCard>
              <TableToolbar
                className="print:hidden"
                onCopy={handleCopy}
                onCsv={exportToCsv}
                onPrint={() => window.print()}
                searchValue={searchQuery}
                onSearchChange={(v) => {
                  setSearchQuery(v);
                  setCurrentPage(1);
                }}
              />

              <AppTable<CategoryRow>
                columns={REPORT_COLUMNS}
                data={paginatedRows}
                keyField="no"
                sortKey={sortKey}
                sortAsc={sortAsc}
                onSort={handleSort}
                emptyMessage="No complaints match the selected filters."
                variant="plain"
                pagination={{
                  currentPage,
                  totalPages,
                  totalEntries,
                  entriesPerPage,
                  onPageChange: setCurrentPage,
                }}
              />
            </ContentCard>
          </div>
          <Footer />
        </main>
      </div>
    </div>
  );
}
