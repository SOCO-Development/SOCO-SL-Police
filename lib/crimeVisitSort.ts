import type { CrimeVisit } from '@/types/crimeVisit';

/** Get sortable value from CrimeVisit for a given column key */
export function getCrimeVisitSortValue(v: CrimeVisit, key: string): string {
    switch (key) {
        case 'referenceNo':
            return (v.referenceNo ?? v.id ?? '').toLowerCase();
        case 'status':
            return (v.status ?? '').toLowerCase();
        case 'vehicleNo':
            return (v.sectionC?.vehicleNo ?? '').toLowerCase();
        case 'reportedDate':
            return (v.sectionA?.reportedToSocoLab?.date ?? '').toLowerCase();
        case 'createdAt':
            return (v.createdAt ?? '').toLowerCase();
        case 'updatedAt':
            return (v.updatedAt ?? '').toLowerCase();
        default:
            return String((v as Record<string, unknown>)[key] ?? '').toLowerCase();
    }
}

export function sortCrimeVisits(
    visits: CrimeVisit[],
    sortKey: string | null,
    sortAsc: boolean
): CrimeVisit[] {
    if (!sortKey) return visits;
    return [...visits].sort((a, b) => {
        const aVal = getCrimeVisitSortValue(a, sortKey);
        const bVal = getCrimeVisitSortValue(b, sortKey);
        const cmp = aVal.localeCompare(bVal);
        return sortAsc ? cmp : -cmp;
    });
}
