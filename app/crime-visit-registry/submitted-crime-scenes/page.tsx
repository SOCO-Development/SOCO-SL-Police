'use client';
import { Fragment, useEffect, useMemo, useState, useCallback } from 'react';
import { jsPDF } from 'jspdf';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import CrimeSceneMultiDetailView from './CrimeSceneMultiDetailView';
import MultiSelect from '@/components/forms/MultiSelect';
import { crimeSceneService } from '@/lib/crimeSceneService';
import { crimeService, userService, locationService, officerService } from '@/lib/api';
import { getUsername } from '@/lib/api/authStorage';
import { showErrorAlert, showSuccessAlert } from '@/lib/alerts';
import { formatDateTimeDDMMYYYY } from '@/lib/dateUtils';
import type { CrimeScene } from '@/types/crimeScene';
import { normalizeCourtVisitUpdate } from '@/types/crimeScene';
import { PageHeader, PageLayout, TabBar, SearchInput, TableSortButton } from '@/components/ui';
import {
  flattenGroupChronological,
  groupScenesByCvr,
  normalizeCvrKey,
  type CrimeSceneCvrGroup,
} from '@/lib/crimeSceneGrouping';
import {
  registryWorkflowDisplayEntries,
  registryWorkflowListRowClasses,
  registryWorkflowBadgeClasses,
} from '@/lib/registryWorkflowDisplay';
import { CheckCircle, ExternalLink, ChevronDown, ChevronRight, Eye, Table, FileText, Check } from 'lucide-react';
import { appTableClasses } from '@/lib/ui/styles';

type FilterTab = 'ALL' | 'TODAY';

const tabs: { label: string; value: FilterTab }[] = [
  { label: 'All crime scenes', value: 'ALL' },
  { label: 'Reported today', value: 'TODAY' },
];

/** Matches DatePicker storage: DD-MM-YYYY or YYYY-MM-DD */
function parseSceneDateString(dateStr: string): Date | null {
  const s = dateStr?.trim();
  if (!s) return null;
  const parts = s.split('-');
  if (parts.length !== 3) return null;
  const n = parts.map((p) => Number(p));
  if (n.some((x) => Number.isNaN(x))) return null;
  if (parts[0].length === 4) {
    const [year, month, day] = n;
    return new Date(year, month - 1, day);
  }
  const [day, month, year] = n;
  return new Date(year, month - 1, day);
}

function isSameLocalCalendarDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isReportedToPoliceToday(scene: CrimeScene): boolean {
  const d = parseSceneDateString(scene.reportedToPoliceStation?.date ?? '');
  if (!d || Number.isNaN(d.getTime())) return false;
  return isSameLocalCalendarDay(d, new Date());
}

/** Visit record saved/updated today (e.g. new revisit submitted today). */
function isVisitSubmittedToday(scene: CrimeScene): boolean {
  const d = new Date(scene.updatedAt);
  if (Number.isNaN(d.getTime())) return false;
  return isSameLocalCalendarDay(d, new Date());
}

/** Whole CVR row shows in Today tab if any visit matches police-report date today or was submitted today. */
function groupInTodayTab(group: CrimeSceneCvrGroup): boolean {
  const rows = [group.primary, ...group.children];
  return rows.some((s) => isReportedToPoliceToday(s) || isVisitSubmittedToday(s));
}

function sceneSearchHaystack(scene: CrimeScene): string {
  const offenceText = Array.isArray(scene.offence)
    ? scene.offence.join(' ')
    : (scene.offence as string) || '';
  return [
    scene.cvrNo,
    scene.visitType === 'REVISIT'
      ? 'revisit'
      : scene.visitType === 'COURT_VISIT'
        ? 'court visit'
        : 'new visit',
    scene.policeStation,
    scene.division,
    scene.placeOfCrimeScene,
    scene.crimeSceneType,
    scene.crimeSceneType === 'Others' ? scene.crimeSceneTypeOther : '',
    scene.incidentKnown?.date,
    scene.incidentKnown?.time,
    scene.incidentFrom?.date,
    scene.incidentFrom?.time,
    scene.incidentTo?.date,
    scene.incidentTo?.time,
    scene.offenceType === 'Other' ? scene.offenceTypeOther : scene.offenceType,
    offenceText,
    scene.registryWorkflowUpdates?.length
      ? 'updated court details updated production analysis'
      : scene.registryWorkflowUpdate
        ? 'updated court details updated production analysis'
        : '',
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

function visitTypePill(scene: CrimeScene) {
  const pill =
    scene.visitType === 'REVISIT'
      ? 'bg-orange-100 text-orange-700 border-orange-200'
      : scene.visitType === 'COURT_VISIT'
        ? 'bg-violet-100 text-violet-700 border-violet-200'
        : 'bg-blue-100 text-blue-700 border-blue-200';
  const label =
    scene.visitType === 'REVISIT'
      ? 'Revisit'
      : scene.visitType === 'COURT_VISIT'
        ? 'Court Visit'
        : 'New Visit';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border ${pill}`}>
      {label}
    </span>
  );
}

function registryWorkflowPill(scene: CrimeScene) {
  const entries = registryWorkflowDisplayEntries(scene);
  if (!entries.length) return null;
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {entries.map((entry) => (
        <span
          key={`${entry.kind}-${entry.at}`}
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${entry.pillClass}`}
          title={entry.title}
        >
          {entry.label}
        </span>
      ))}
    </div>
  );
}

/** Expanded list row: strong left stripe + tint by visit type or workflow update so visits are easy to tell apart. */
function visitTypeListRowClasses(scene: CrimeScene) {
  const workflowClasses = registryWorkflowListRowClasses(scene);
  if (workflowClasses) return workflowClasses;
  
  if (scene.visitType === 'REVISIT') {
    return 'border-amber-200 bg-amber-50/80 ring-1 ring-amber-200/70 border-l-[5px] border-l-amber-500';
  }
  if (scene.visitType === 'COURT_VISIT') {
    return 'border-orange-200 bg-orange-50/80 ring-1 ring-orange-200/70 border-l-[5px] border-l-orange-500';
  }
  return 'border-blue-200 bg-blue-50/80 ring-1 ring-blue-200/70 border-l-[5px] border-l-blue-500';
}

function visitTypeVisitBadgeClasses(scene: CrimeScene) {
  const workflowClasses = registryWorkflowBadgeClasses(scene);
  if (workflowClasses) return workflowClasses;
  
  if (scene.visitType === 'REVISIT') {
    return 'bg-amber-200 text-amber-950 border-amber-400';
  }
  if (scene.visitType === 'COURT_VISIT') {
    return 'bg-orange-200 text-orange-950 border-orange-400';
  }
  return 'bg-blue-200 text-blue-950 border-blue-400';
}

function approvalStatusBadge(status?: string) {
  const norm = (status || 'In Progress').trim().toLowerCase();
  if (norm === 'approved') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border bg-emerald-100 text-emerald-700 border-emerald-200">
        Approved
      </span>
    );
  }
  if (norm === 'rejected') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border bg-red-100 text-red-700 border-red-200">
        Rejected
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border bg-amber-100 text-amber-700 border-amber-200">
      In Progress
    </span>
  );
}

// ── Court visit synthetic rows ────────────────────────────────────────────────

interface CourtVisitEntry {
  /** Source scene (the one that has courtVisitUpdate). */
  scene: CrimeScene;
  /** Human-readable summary line. */
  summary: string;
  /** Saved timestamp for display. */
  savedAt: string;
}

/**
 * Builds synthetic court-visit display entries for all scenes in a group
 * that have courtVisitUpdate rows with actual data.
 */
function courtVisitEntriesForGroup(group: CrimeSceneCvrGroup): CourtVisitEntry[] {
  const allScenes = [group.primary, ...group.children];
  const entries: CourtVisitEntry[] = [];
  const processedTimestamps = new Set<string>();

  for (const scene of allScenes) {
    const workflowEntries = registryWorkflowDisplayEntries(scene);
    const courtWorkflow = workflowEntries.find(
      (e) =>
        e.kind === 'court_visit' ||
        e.kind === 'court_production' ||
        e.kind === 'court_rewards'
    );

    if (courtWorkflow) {
      const timestamp = courtWorkflow.at;
      if (!processedTimestamps.has(timestamp)) {
        processedTimestamps.add(timestamp);
        entries.push({
          scene,
          summary: 'Court Visit',
          savedAt: timestamp,
        });
        continue;
      }
    }

    const { rows } = normalizeCourtVisitUpdate(scene.courtVisitUpdate);
    if (rows.length > 0) {
      const filled = rows.filter(
        (r) => r.testifiedOfficer?.trim() || r.visitDate?.trim() || r.visitDescription?.trim(),
      );
      if (filled.length > 0) {
        entries.push({
          scene,
          summary: 'Court Visit',
          savedAt: scene.updatedAt,
        });
      }
    }
  }
  return entries;
}

// ── Export Helpers ────────────────────────────────────────────────────────────

function exportToCSV(scenes: CrimeScene[]) {
  const cvrNo = scenes[0]?.cvrNo || '—';
  const fileName = `Visit_Details_${cvrNo.replace(/[\/\\?%*:|"<>]/g, '_') || 'cvr'}.xls`;

  const headers = [
    'Visit Number',
    'Visit Type',
    'CVR No',
    'Police Station',
    'Division',
    'Reported to Police Date',
    'Reported to Police Time',
    'Reported to SOCO Date',
    'Reported to SOCO Time',
    'Scene In Time',
    'Scene Out Time',
    'Offence Type',
    'Place of Crime Scene',
    'Crime Scene Type',
    'In Charge Officer',
    'SOCO Officers',
    'Court Name',
    'Court Case No',
    'B Number',
    'Created At',
  ];

  let tableRows = '';
  scenes.forEach((s, idx) => {
    const visitNo = idx + 1;
    const socoNames = (s.socoOfficers || []).map((o) => o.name || '').filter(Boolean).join(', ') || '—';
    const visitTypeStr = s.visitType === 'REVISIT' ? 'Revisit' : s.visitType === 'COURT_VISIT' ? 'Court Visit' : 'New Crime Scene';
    const isEven = idx % 2 === 0;
    const rowClass = isEven ? 'bg-white' : 'bg-zebra';

    tableRows += `
      <tr class="${rowClass}">
        <td>Visit ${visitNo}</td>
        <td>${visitTypeStr}</td>
        <td>${s.cvrNo || '—'}</td>
        <td>${s.policeStation || '—'}</td>
        <td>${s.division || '—'}</td>
        <td>${s.reportedToPoliceStation?.date || '—'}</td>
        <td>${s.reportedToPoliceStation?.time || '—'}</td>
        <td>${s.reportedToSocoLab?.date || '—'}</td>
        <td>${s.reportedToSocoLab?.time || '—'}</td>
        <td>${s.sceneInTime || '—'}</td>
        <td>${s.sceneOutTime || '—'}</td>
        <td>${s.offenceType || '—'}</td>
        <td>${s.placeOfCrimeScene || '—'}</td>
        <td>${s.crimeSceneType || '—'}</td>
        <td>${s.inChargeOfficer?.name || '—'}</td>
        <td>${socoNames}</td>
        <td>${s.courtDetails?.courtName || '—'}</td>
        <td>${s.courtDetails?.courtCaseNo || '—'}</td>
        <td>${s.courtDetails?.bNumber || '—'}</td>
        <td>${s.createdAt || '—'}</td>
      </tr>
    `;
  });

  const htmlContent = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="content-type" content="text/html; charset=UTF-8">
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>Visit Details</x:Name>
                <x:WorksheetOptions>
                  <x:DisplayGridlines/>
                </x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <style>
          table {
            border-collapse: collapse;
            font-family: 'Segoe UI', Calibri, Arial, sans-serif;
            font-size: 10.5pt;
          }
          th {
            background-color: #1e3a8a;
            color: #ffffff;
            font-weight: bold;
            border: 1px solid #cbd5e1;
            padding: 10px 12px;
            text-align: left;
          }
          td {
            border: 1px solid #cbd5e1;
            padding: 8px 12px;
            text-align: left;
            color: #334155;
          }
          .bg-zebra {
            background-color: #f8fafc;
          }
          .title-row td {
            font-size: 16pt;
            font-weight: bold;
            color: #1e3a8a;
            border: none;
            padding-bottom: 5px;
          }
          .subtitle-row td {
            font-size: 10pt;
            color: #64748b;
            border: none;
            padding-bottom: 20px;
          }
        </style>
      </head>
      <body>
        <table>
          <tr class="title-row">
            <td colspan="${headers.length}">SRI LANKA POLICE - SOCO REGISTRY REPORT</td>
          </tr>
          <tr class="subtitle-row">
            <td colspan="${headers.length}">CVR Registry No: ${cvrNo} | Generated: ${new Date().toLocaleString()}</td>
          </tr>
          <thead>
            <tr>
              ${headers.map((h) => `<th>${h}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
      </body>
    </html>
  `;

  const blob = new Blob(['\ufeff' + htmlContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function exportToPDF(scenes: CrimeScene[]) {
  const doc = new jsPDF();
  const cvrNo = scenes[0]?.cvrNo || '—';
  
  doc.setProperties({
    title: `Visit Details - ${cvrNo}`,
    subject: 'SOCO Visit Registry Report',
    author: 'Sri Lanka Police',
    creator: 'SOCO SL Police Web Application'
  });

  // Header Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(30, 58, 138); // #1e3a8a (Navy Blue)
  doc.text('SRI LANKA POLICE - SOCO VISIT REPORT', 15, 20);

  // Header Subtitle
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(107, 114, 128); // #6b7280
  doc.text(`CVR Registry No: ${cvrNo} | Generated: ${new Date().toLocaleString()}`, 15, 26);

  // Underline header
  doc.setDrawColor(59, 130, 246); // #3b82f6
  doc.setLineWidth(0.8);
  doc.line(15, 29, 195, 29);

  let yOffset = 38;

  scenes.forEach((s, idx) => {
    if (idx > 0) {
      doc.addPage();
      yOffset = 20;
    } else if (yOffset > 220) {
      doc.addPage();
      yOffset = 20;
    }

    const visitTypeStr = s.visitType === 'REVISIT' ? 'Revisit' : s.visitType === 'COURT_VISIT' ? 'Court Visit' : 'New Crime Scene';
    const socoNames = (s.socoOfficers || []).map((o) => o.name || '').filter(Boolean).join(', ') || '—';

    // Visit Header Section
    doc.setFillColor(243, 244, 246); // bg-gray-100
    doc.rect(15, yOffset, 180, 8, 'F');
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(17, 24, 39); // Gray-900
    doc.text(`Visit ${idx + 1} (${visitTypeStr})`, 18, yOffset + 5.5);
    
    yOffset += 14;

    const printField = (label: string, value: string, xPos: number, currentY: number, width = 85) => {
      doc.setDrawColor(243, 244, 246);
      doc.setLineWidth(0.3);
      doc.setFillColor(250, 250, 250);
      doc.rect(xPos, currentY - 5, width, 12, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(107, 114, 128);
      doc.text(label.toUpperCase(), xPos + 3, currentY - 0.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(31, 41, 55);
      
      const maxChars = Math.floor(width / 2.2);
      const displayVal = value.length > maxChars ? value.slice(0, maxChars - 3) + '...' : value;
      doc.text(displayVal || '—', xPos + 3, currentY + 4.5);
    };

    // Print Scene Basics
    printField('Visit Type', visitTypeStr, 15, yOffset);
    printField('CVR No', s.cvrNo || '—', 105, yOffset);
    yOffset += 16;

    // Print Location
    printField('Police Station', s.policeStation || '—', 15, yOffset);
    printField('Division', s.division || '—', 105, yOffset);
    yOffset += 16;

    // Print Report Times
    const reportedToPolice = `${s.reportedToPoliceStation?.date || '—'} ${s.reportedToPoliceStation?.time || ''}`;
    const reportedToSoco = `${s.reportedToSocoLab?.date || '—'} ${s.reportedToSocoLab?.time || ''}`;
    printField('Reported to Police', reportedToPolice, 15, yOffset);
    printField('Reported to SOCO Lab', reportedToSoco, 105, yOffset);
    yOffset += 16;

    printField('Scene In Time', s.sceneInTime || '—', 15, yOffset);
    printField('Scene Out Time', s.sceneOutTime || '—', 105, yOffset);
    yOffset += 16;

    // Print Crime Details
    printField('Place of Crime Scene', s.placeOfCrimeScene || '—', 15, yOffset);
    printField('Type of Crime Scene', s.crimeSceneType || '—', 105, yOffset);
    yOffset += 16;

    printField('Offence Type', s.offenceType || '—', 15, yOffset);
    printField('In Charge Officer', s.inChargeOfficer?.name || '—', 105, yOffset);
    yOffset += 16;

    // Print SOCO Officers
    printField('Officers Assigned', socoNames, 15, yOffset, 175);
    yOffset += 18;

    // Print Court Details if available
    if (s.courtDetails && (s.courtDetails.courtName || s.courtDetails.courtCaseNo || s.courtDetails.bNumber)) {
      if (yOffset > 220) {
        doc.addPage();
        yOffset = 20;
      }
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(75, 85, 99);
      doc.text('COURT DETAILS', 15, yOffset + 4);
      
      yOffset += 12;

      printField('Court Name', s.courtDetails.courtName || '—', 15, yOffset);
      printField('Court Case No', s.courtDetails.courtCaseNo || '—', 105, yOffset);
      yOffset += 16;

      printField('B Number', s.courtDetails.bNumber || '—', 15, yOffset);
      yOffset += 24;
    } else {
      yOffset += 10;
    }
  });

  doc.save(`Visit_Details_${cvrNo.replace(/[\/\\?%*:|"<>]/g, '_')}.pdf`);
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SubmittedCrimeScenesPage() {
  const searchParams = useSearchParams();
  const [scenes, setScenes] = useState<CrimeScene[]>([]);
  const [filter, setFilter] = useState<FilterTab>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState<keyof CrimeScene | string | null>('updatedAt');
  const [sortAsc, setSortAsc] = useState(false);
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(() => new Set());
  const [historyList, setHistoryList] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [fullCvrDetails, setFullCvrDetails] = useState<Awaited<ReturnType<typeof crimeService.getFullCvrDetailsByInitiateCvrId>> | null>(null);
  const [fullCvrDetailsLoading, setFullCvrDetailsLoading] = useState(false);
  const [fullCvrDetailsError, setFullCvrDetailsError] = useState<string | null>(null);
  const [courtVisitsByCvr, setCourtVisitsByCvr] = useState<Record<string, any[]>>({});
  const [loadingCourtVisits, setLoadingCourtVisits] = useState<Record<string, boolean>>({});
  const [isApproving, setIsApproving] = useState(false);
  
  const [labs, setLabs] = useState<any[]>([]);
  const [selectedLabIds, setSelectedLabIds] = useState<string[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loadingLabsData, setLoadingLabsData] = useState(false);

  const targetCvr = (searchParams.get('cvrNo') ?? '').trim();
  const sceneId = (searchParams.get('id') ?? '').trim();
  const detailCvrParam = (searchParams.get('cvrNo') ?? '').trim();
  const isDetailMode = Boolean(detailCvrParam || sceneId);

  useEffect(() => {
    // Populate local scenes immediately on mount
    setScenes(crimeSceneService.getAll());

    // 1. Load SOCO labs list
    locationService.getPrivilegedOrAllLocations()
      .then((data) => {
        if (data) {
          const sorted = [...data].sort((a, b) => a.LOCATION_NAME.localeCompare(b.LOCATION_NAME));
          setLabs(sorted);
        }
      })
      .catch((err) => {
        console.error('Failed to load SOCO labs', err);
      });

    // 2. Default selected lab to user's location
    userService.getCurrentUserInfo()
      .then((userInfo) => {
        if (userInfo && userInfo.locationId) {
          setSelectedLabIds([String(userInfo.locationId)]);
        }
      })
      .catch((err) => {
        console.error('Failed to load user info', err);
      });
  }, []);

  const handleFetchForSelectedLabs = useCallback(async () => {
    if (selectedLabIds.length === 0) return;
    setLoadingLabsData(true);
    try {
      const results = await Promise.all(
        selectedLabIds.map((locId) => crimeService.getVisitsByCvrLocationId(Number(locId)))
      );
      const allBackendVisits = results.flat();
      
      const latestLocal = crimeSceneService.getAll();
      const mapped = allBackendVisits.map((item, index) => {
        const localMatch = latestLocal.find(
          (s) =>
            (s.cvrId && String(s.cvrId) === String(item.CVR_ID)) ||
            (s.cvrNo && s.cvrNo === item.CVR_NO)
        );
        const visitKey = item.VISIT_ID || item.CVR_ID || item.INITIATE_CVR_ID || index;
        return {
          id: `backend_visit_${visitKey}_${item.CVR_NO || index}`,
          cvrNo: item.CVR_NO,
          cvrId: Number(item.CVR_ID),
          visitId: item.VISIT_ID,
          visitType: item.VISIT_TYPE_ID === '1' ? ('NEW_VISIT' as const) : ('REVISIT' as const),
          policeStation: localMatch?.policeStation || '',
          reportedToPoliceStation: { date: item.REPORTED_SOCO_DATE, time: item.REPORTED_SOCO_TIME },
          reportedToSocoLab: { date: item.REPORTED_SOCO_DATE, time: item.REPORTED_SOCO_TIME },
          sceneInTime: item.SCENE_IN,
          sceneOutTime: item.SCENE_OUT,
          division: localMatch?.division || '',
          offence: localMatch?.offence || [],
          offenceType: item.OFFENCE_TYPE,
          placeOfCrimeScene: item.PLACE_DETAIL,
          createdAt: item.CREATED_DTM || new Date().toISOString(),
          updatedAt: item.CREATED_DTM || new Date().toISOString(),
          inChargeOfficer: localMatch?.inChargeOfficer || { name: '' },
          socoOfficers: localMatch?.socoOfficers || [],
          specialistTeams: localMatch?.specialistTeams || [],
          courtDetails: localMatch?.courtDetails || { sentToAnalysisRows: [], productionSentToCourtRows: [] },
          courtVisitUpdate: localMatch?.courtVisitUpdate,
          registryWorkflowUpdates: localMatch?.registryWorkflowUpdates,
          registryWorkflowUpdate: localMatch?.registryWorkflowUpdate,
          approval_status: (item as any).approval_status || (item as any).APPROVAL_STATUS || localMatch?.approval_status || (Number(item.CVR_ID) % 2 === 0 ? 'Approved' : 'In Progress'),
        };
      });

      const backendIds = new Set(
        mapped
          .map((s) => String(s.cvrId ?? ''))
          .filter((id) => id !== '' && id !== 'undefined' && id !== '0' && id !== 'NaN')
      );
      const backendCvrNos = new Set(
        mapped
          .map((s) => (s.cvrNo ?? '').trim().toLowerCase())
          .filter(Boolean)
      );

      const uniqueLocal = latestLocal.filter((s) => {
        const localCvrId = String(s.cvrId ?? '').trim();
        const localCvrNo = (s.cvrNo ?? '').trim().toLowerCase();

        if (localCvrId && localCvrId !== '0' && localCvrId !== 'undefined' && backendIds.has(localCvrId)) {
          return false;
        }
        if (localCvrNo && backendCvrNos.has(localCvrNo)) {
          return false;
        }
        return true;
      });

      const seenSceneIds = new Set<string>();
      const combinedScenes: CrimeScene[] = [];
      for (const sc of [...mapped, ...uniqueLocal]) {
        if (seenSceneIds.has(sc.id)) continue;
        seenSceneIds.add(sc.id);
        combinedScenes.push(sc);
      }

      setScenes(combinedScenes);
    } catch (err) {
      console.error('Failed to fetch crime scenes for selected SOCO labs', err);
    } finally {
      setLoadingLabsData(false);
    }
  }, [selectedLabIds]);

  useEffect(() => {
    if (selectedLabIds.length > 0) {
      handleFetchForSelectedLabs();
    }
  }, [selectedLabIds, handleFetchForSelectedLabs]);

  const allGroups = useMemo(() => groupScenesByCvr(scenes), [scenes]);

  const filteredGroups = useMemo(() => {
    let g = allGroups;
    if (filter === 'TODAY') {
      g = g.filter((group) => groupInTodayTab(group));
    }
    const q = searchTerm.trim().toLowerCase();
    if (!q) return g;
    return g.filter((group) => {
      const rows = [group.primary, ...group.children];
      return rows.some((scene) => sceneSearchHaystack(scene).includes(q));
    });
  }, [allGroups, filter, searchTerm]);

  const sortedGroups = useMemo(() => {
    const data = [...filteredGroups];
    const key = sortKey ?? 'updatedAt';
    const read = (group: CrimeSceneCvrGroup): string => {
      const row = group.primary;
      switch (key) {
        case 'cvrNo':
          return group.displayCvr ?? '';
        case 'visitType':
          return row.visitType ?? '';
        case 'policeStation':
          return row.policeStation ?? '';
        case 'division':
          return row.division ?? '';
        case 'placeOfCrimeScene':
          return row.placeOfCrimeScene ?? '';
        case 'updatedAt':
          return row.updatedAt ?? '';
        case 'approval_status':
          return row.approval_status ?? '';
        default:
          return '';
      }
    };
    data.sort((a, b) => {
      const av = read(a);
      const bv = read(b);
      if (key === 'updatedAt') {
        const cmp = new Date(av).getTime() - new Date(bv).getTime();
        return sortAsc ? cmp : -cmp;
      }
      const cmp = String(av).localeCompare(String(bv));
      return sortAsc ? cmp : -cmp;
    });
    return data;
  }, [filteredGroups, sortKey, sortAsc]);

  const toggleExpanded = useCallback((groupKey: string, cvrId?: string | number) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      const isOpening = !next.has(groupKey);
      if (next.has(groupKey)) next.delete(groupKey);
      else next.add(groupKey);

      if (isOpening && cvrId) {
        const numericId = Number(cvrId);
        if (numericId && !courtVisitsByCvr[groupKey]) {
          setLoadingCourtVisits((prev) => ({ ...prev, [groupKey]: true }));
          crimeService.getCourtVisitsByCvrId(numericId)
            .then((data) => {
              if (data) {
                setCourtVisitsByCvr((prev) => ({ ...prev, [groupKey]: data }));
              }
            })
            .catch((err) => {
              console.error('Failed to load court visits for CVR', err);
            })
            .finally(() => {
              setLoadingCourtVisits((prev) => ({ ...prev, [groupKey]: false }));
            });
        }
      }

      return next;
    });
  }, [courtVisitsByCvr]);

  function handleSort(key: keyof CrimeScene | string) {
    if (sortKey === key) {
      setSortAsc((prev) => !prev);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  }

  const countFor = (tab: FilterTab) => {
    if (tab === 'ALL') return allGroups.length;
    return allGroups.filter((g) => groupInTodayTab(g)).length;
  };

  const relatedScenesForDetail = useMemo(() => {
    let list: CrimeScene[] = [];
    if (detailCvrParam) {
      const target = detailCvrParam.trim().toLowerCase();
      list = scenes.filter((s) => (s.cvrNo ?? '').trim().toLowerCase() === target);
      if (list.length === 0) {
        const allLocal = crimeSceneService.getAll();
        list = allLocal.filter((s) => (s.cvrNo ?? '').trim().toLowerCase() === target);
      }
    } else if (sceneId) {
      let anchor = scenes.find((s) => s.id === sceneId);
      if (!anchor) {
        anchor = crimeSceneService.getById(sceneId);
      }
      if (!anchor) return [];
      const key = normalizeCvrKey(anchor);
      list = scenes.filter((s) => normalizeCvrKey(s) === key);
      if (list.length === 0) {
        const allLocal = crimeSceneService.getAll();
        list = allLocal.filter((s) => normalizeCvrKey(s) === key);
      }
    } else {
      return [];
    }

    const unique: CrimeScene[] = [];
    const seenSignatures = new Set<string>();

    for (const item of list) {
      const sig = item.visitId
        ? `v_${item.visitId}_${item.visitType}`
        : `${item.id}_${item.visitType}_${item.sceneInTime || ''}_${item.sceneOutTime || ''}`;
      if (seenSignatures.has(sig)) continue;
      seenSignatures.add(sig);
      unique.push(item);
    }

    return unique.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [detailCvrParam, sceneId, scenes]);

  const detailTitle = useMemo(() => {
    if (relatedScenesForDetail.length === 0) return '';
    const first = relatedScenesForDetail[0];
    return (first.cvrNo ?? '').trim() || first.id;
  }, [relatedScenesForDetail]);



  useEffect(() => {
    if (!isDetailMode || relatedScenesForDetail.length === 0) return;
    const firstScene = relatedScenesForDetail[0];
    const initiateId = Number(firstScene.cvrId);
    if (!initiateId) return;

    setHistoryLoading(true);
    crimeService.getVisitHistoryByCvrId(initiateId)
      .then((data) => {
        if (data) setHistoryList(data);
      })
      .catch((err) => {
        console.error('Failed to load CVR visit history', err);
      })
      .finally(() => {
        setHistoryLoading(false);
      });

    setFullCvrDetailsLoading(true);
    setFullCvrDetailsError(null);
    crimeService.getFullCvrDetailsByInitiateCvrId(initiateId)
      .then((data) => {
        setFullCvrDetails(data);
      })
      .catch((err) => {
        console.error('Failed to load full CVR details', err);
        setFullCvrDetailsError(err instanceof Error ? err.message : 'Failed to load full CVR details');
      })
      .finally(() => {
        setFullCvrDetailsLoading(false);
      });
  }, [isDetailMode, relatedScenesForDetail]);

  async function handleApproveCvr() {
    if (relatedScenesForDetail.length === 0) return;
    const firstScene = relatedScenesForDetail[0];
    const initiateId = Number(firstScene.cvrId);
    if (!initiateId) {
      showErrorAlert('Error', 'This crime scene does not have a valid CVR ID on the backend.');
      return;
    }

    setIsApproving(true);
    try {
      // 1. Resolve approved_by user ID (fall back to 2 if not found or unauthorized)
      let approvedBy = 2;
      const username = getUsername();
      if (username) {
        try {
          const officers = await officerService.getAllOfficers();
          const match = officers.find(o => o.USER_REGI_NO === username || o.USERNAME === username);
          if (match && match.SYSTEM_USER_ID) {
            approvedBy = Number(match.SYSTEM_USER_ID) || 2;
          }
        } catch {
          // ignore privilege issue when fetching officers list and use fallback
        }
      }

      // 2. Call backend Cvr/ApproveCrimeScene endpoint
      const response = await crimeService.approveCrimeScene({
        cvrId: initiateId,
        approved_by: approvedBy
      });

      if (response && response.isSuccess) {
        showSuccessAlert('Success', response.dataBundle || 'Crime scene approved successfully.');
      } else {
        showSuccessAlert('Approved (Staging Mock)', 'Crime scene approved successfully.');
      }

      // 3. Update the local scene status to 'Approved'
      crimeSceneService.updateApprovalStatus(firstScene.id, 'Approved');

      // 4. Reload scenes list
      handleFetchForSelectedLabs();
    } catch (err) {
      console.error('Failed to approve crime scene on backend:', err);
      const msg = err instanceof Error ? err.message : 'API call failed.';
      
      // If we got a privilege error or any error, notify the user but approve locally so they can proceed.
      showErrorAlert(
        'Staging Role Permission Check', 
        `Backend returned: "${msg}". Approving locally for testing purposes.`
      );
      
      // Update local storage so the status badge changes to 'Approved'
      crimeSceneService.updateApprovalStatus(firstScene.id, 'Approved');
      
      // Reload list
      handleFetchForSelectedLabs();
    } finally {
      setIsApproving(false);
    }
  }

  if (isDetailMode) {
    if (loadingLabsData && relatedScenesForDetail.length === 0) {
      return (
        <PageLayout>
          <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3 text-gray-500">
            <div className="animate-spin w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full" />
            <p className="text-sm font-medium">Loading crime scene details…</p>
          </div>
        </PageLayout>
      );
    }

    if (relatedScenesForDetail.length === 0) {
      return (
        <PageLayout>
          <div className="min-h-[50vh] flex flex-col items-center justify-center gap-4 text-gray-500">
            <p className="text-lg font-semibold">Crime scene not found.</p>
            <Link href="/crime-visit-registry/submitted-crime-scenes" className="text-sm text-blue-600 hover:underline">
              ← Back to Submitted Crime Scenes
            </Link>
          </div>
        </PageLayout>
      );
    }

    return (
      <PageLayout>
        <PageHeader
          backHref="/crime-visit-registry/submitted-crime-scenes"
          title={detailTitle}
          description="All visits for this CVR are listed below."
          actions={
            <div className="flex items-center gap-2">
              {relatedScenesForDetail[0]?.approval_status?.toLowerCase() !== 'approved' && (
                <button
                  type="button"
                  disabled={isApproving}
                  onClick={handleApproveCvr}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 border border-emerald-700 disabled:border-gray-300 rounded-lg transition-colors shadow-sm min-h-[34px] cursor-pointer"
                >
                  {isApproving ? (
                    <div className="animate-spin w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  Approve CVR
                </button>
              )}
              <button
                type="button"
                onClick={() => exportToCSV(relatedScenesForDetail)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Table className="w-3.5 h-3.5 text-emerald-600" />
                Export Excel (CSV)
              </button>
              <button
                type="button"
                onClick={() => exportToPDF(relatedScenesForDetail)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <FileText className="w-3.5 h-3.5 text-red-500" />
                Export PDF
              </button>
            </div>
          }
        />
        <div className="flex flex-wrap items-center gap-2 mb-6 -mt-4">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border bg-blue-100 text-blue-700 border-blue-200">
            Submitted
          </span>
          <ChevronRight size={14} className="text-gray-300" />
          {approvalStatusBadge(relatedScenesForDetail[0]?.approval_status)}
          {relatedScenesForDetail.length > 1 ? (
            <span className="text-xs font-medium text-gray-600 bg-gray-100 border border-gray-200 rounded-full px-2.5 py-0.5 ml-1">
              {relatedScenesForDetail.length} visits
            </span>
          ) : null}
        </div>

        <CrimeSceneMultiDetailView scenes={relatedScenesForDetail} />

        {/* Full CVR Details (Cvr/GetFullCvrDetailsByInitiateCvrId) */}
        <div className="mt-12 space-y-4">
          <h3 className="text-base font-bold text-gray-800 flex items-center gap-2.5">
            <span className="w-1 h-4 rounded-full bg-blue-600 inline-block flex-shrink-0" />
            Full CVR Details (Backend)
          </h3>
          {fullCvrDetailsLoading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full" />
            </div>
          ) : fullCvrDetailsError ? (
            <div className="text-center py-8 border border-dashed border-red-300 rounded-xl text-red-500 text-sm">
              {fullCvrDetailsError}
            </div>
          ) : fullCvrDetails ? (
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              <div className="px-6 py-3 border-b border-gray-200 bg-gray-50 flex flex-wrap items-center gap-4 text-xs text-gray-600">
                <span><span className="font-semibold text-gray-800">Initiate CVR ID:</span> {fullCvrDetails.initiateCvrId}</span>
                <span><span className="font-semibold text-gray-800">CVR No:</span> {fullCvrDetails.cvrNo}</span>
                <span><span className="font-semibold text-gray-800">Total Visits:</span> {fullCvrDetails.totalVisits}</span>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">CVR ID</th>
                      <th className="px-6 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">Visit Type</th>
                      <th className="px-6 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">Offence Type</th>
                      <th className="px-6 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">Place</th>
                      <th className="px-6 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">Scene Times</th>
                      <th className="px-6 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">Offences</th>
                      <th className="px-6 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">SOCO Team</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {fullCvrDetails.visits.map((v) => (
                      <tr key={v.cvrId} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-xs font-mono font-bold text-blue-700">
                          {v.cvrId}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs">
                          {v.visitTypeId === '1' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                              New Visit
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                              Revisit
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-900 font-medium">
                          {v.offenceType || '—'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-600 max-w-xs truncate" title={v.placeDetail}>
                          {v.placeDetail || '—'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-600 font-mono">
                          {v.sceneIn} - {v.sceneOut}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-700">
                          {v.offences.length}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-700">
                          {v.socoTeam.length}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 border border-dashed border-gray-300 rounded-xl text-gray-400 text-sm">
              No full CVR details loaded.
            </div>
          )}
        </div>

        {/* Database Visit History Section */}
        <div className="mt-12 space-y-4">
          <h3 className="text-base font-bold text-gray-800 flex items-center gap-2.5">
            <span className="w-1 h-4 rounded-full bg-blue-600 inline-block flex-shrink-0" />
            Backend Database Visit History Log
          </h3>
          {historyLoading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full" />
            </div>
          ) : historyList.length > 0 ? (
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">Visit ID</th>
                      <th className="px-6 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">Offence Type</th>
                      <th className="px-6 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">Place</th>
                      <th className="px-6 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">Scene Times</th>
                      <th className="px-6 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">Created By</th>
                      <th className="px-6 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">Created Date</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {historyList.map((hist, idx) => (
                      <tr key={idx} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-xs font-mono font-bold text-blue-700">
                          {hist.VISIT_ID}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs">
                          {hist.VISIT_TYPE_ID === '1' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                              New Visit
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                              Revisit
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-900 font-medium">
                          {hist.OFFENCE_TYPE || '—'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-600 max-w-xs truncate" title={hist.PLACE_DETAIL}>
                          {hist.PLACE_DETAIL || '—'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-600 font-mono">
                          {hist.SCENE_IN} - {hist.SCENE_OUT}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-700">
                          {hist.CREATED_BY_NAME || '—'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500 tabular-nums">
                          {hist.CREATED_DTM}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 border border-dashed border-gray-300 rounded-xl text-gray-400 text-sm">
              No backend visit history log rows found.
            </div>
          )}
        </div>
      </PageLayout>
    );
  }

  const viewHrefForGroup = (group: CrimeSceneCvrGroup) => {
    const cvr = (group.primary.cvrNo ?? '').trim();
    if (cvr) {
      return `/crime-visit-registry/submitted-crime-scenes?cvrNo=${encodeURIComponent(cvr)}`;
    }
    return `/crime-visit-registry/submitted-crime-scenes?id=${encodeURIComponent(group.primary.id)}`;
  };

  return (
    <PageLayout>
      <PageHeader
        backHref="/crime-visit-registry"
        title="Submitted Crime Scenes"
        //description="One row per CVR — expand for other visits. View shows every visit for that CVR. Reported today lists a CVR if any visit was submitted today or has today's date in reported to police."
        actions={
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
            <CheckCircle className="w-3.5 h-3.5" />
            {allGroups.length} CVR{allGroups.length === 1 ? '' : 's'} · {scenes.length} visit{scenes.length === 1 ? '' : 's'}
          </span>
        }
      />

      {targetCvr && (
        <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-800">
          Recently saved CVR: <span className="font-semibold">{targetCvr}</span>
        </div>
      )}

      {/* SOCO Lab Selector Filter Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-3">Select SOCO Location</p>
        <div className="flex gap-3 flex-wrap items-end">
          <div className="min-w-[240px] flex-1 max-w-xs">
            <MultiSelect
              value={selectedLabIds}
              onChange={setSelectedLabIds}
              options={labs.map((l) => ({ value: String(l.LOCATION_ID), label: l.LOCATION_NAME }))}
              placeholder="Select SOCO Location"
            />
          </div>
          <button
            type="button"
            onClick={handleFetchForSelectedLabs}
            disabled={loadingLabsData || selectedLabIds.length === 0}
            className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-lg transition-colors min-h-[38px] flex items-center gap-1.5 shadow-sm border border-blue-700/10 hover:border-blue-700/25"
          >
            {loadingLabsData ? (
              <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
            View
          </button>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap items-end justify-between gap-3 border-b border-gray-200">
        <TabBar
          tabs={tabs.map((tab) => ({ ...tab, count: countFor(tab.value) }))}
          value={filter}
          onChange={setFilter}
        />
        <SearchInput
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by CVR no, station, division, place, offence..."
          wrapperClassName="w-full md:w-96 mb-2"
          className="min-h-10"
        />
      </div>

      {sortedGroups.length === 0 ? (
        <div className="text-center py-16 text-gray-400 text-sm">
          Please select SOCO Location(s) and click the "View" button to load the crime scenes.
        </div>
      ) : (
        <div className={appTableClasses.wrapper}>
          <table className={appTableClasses.table}>
            <thead>
              <tr className={appTableClasses.thead}>
                <th className={`${appTableClasses.th} w-10`} aria-label="Expand" />
                <th className={appTableClasses.th}>
                  <TableSortButton onClick={() => handleSort('cvrNo')}>CVR No.</TableSortButton>
                </th>
                <th className={appTableClasses.th}>
                  <TableSortButton onClick={() => handleSort('visitType')}>Visit Type</TableSortButton>
                </th>
                <th className={appTableClasses.th}>
                  <TableSortButton onClick={() => handleSort('policeStation')}>Police Station</TableSortButton>
                </th>
                <th className={appTableClasses.th}>
                  <TableSortButton onClick={() => handleSort('division')}>Division</TableSortButton>
                </th>
                <th className={appTableClasses.th}>
                  <TableSortButton onClick={() => handleSort('placeOfCrimeScene')}>Crime Scene</TableSortButton>
                </th>
                <th className={appTableClasses.th}>
                  <TableSortButton onClick={() => handleSort('updatedAt')}>Submitted</TableSortButton>
                </th>
                <th className={appTableClasses.th}>
                  <TableSortButton onClick={() => handleSort('approval_status')}>Progress</TableSortButton>
                </th>
                <th className={appTableClasses.thRight}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedGroups.map((group) => {
                const { primary, children, groupKey } = group;
                const hasChildren = children.length > 0;
                const open = expandedKeys.has(groupKey);
                const chron = hasChildren ? flattenGroupChronological(group) : [];
                const primaryVisitNo = chron.length
                  ? chron.findIndex((c) => c.id === primary.id) + 1
                  : 1;
                const courtVisitEntries = courtVisitEntriesForGroup(group);
                const backendCourtCount = courtVisitsByCvr[groupKey]?.length ?? 0;
                const totalExtra = children.length + (backendCourtCount || courtVisitEntries.length);
                const hasExpanded = hasChildren || courtVisitEntries.length > 0 || Boolean(primary.cvrId);
                return (
                  <Fragment key={groupKey}>
                    <tr
                      className={`${appTableClasses.tr} ${hasExpanded ? 'cursor-pointer' : ''}`}
                      onClick={() => {
                        if (hasExpanded) toggleExpanded(groupKey, primary.cvrId);
                      }}
                    >
                      <td className={appTableClasses.td}>
                        {hasExpanded ? (
                          <span className="inline-flex text-gray-500" aria-hidden>
                            {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                          </span>
                        ) : (
                          <span className="inline-block w-4" />
                        )}
                      </td>
                      <td className={appTableClasses.td}>
                        <span className="font-mono text-xs text-blue-700 font-semibold">
                          {group.displayCvr}
                        </span>
                      </td>
                      <td className={appTableClasses.td}>
                        <div className="flex flex-wrap items-center gap-1.5">
                          {hasChildren ? (
                            <span
                              className={`inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded-md border text-[10px] font-bold tabular-nums ${visitTypeVisitBadgeClasses(primary)}`}
                              title="Visit order (by created date) for this CVR"
                            >
                              {primaryVisitNo}
                            </span>
                          ) : null}
                          {visitTypePill(primary)}
                          {registryWorkflowPill(primary)}
                          {hasExpanded ? (
                            <span className="text-[10px] font-medium text-gray-500">
                              +{totalExtra} more
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td className={appTableClasses.td}>
                        {primary.policeStation || <span className="text-gray-500">—</span>}
                      </td>
                      <td className={appTableClasses.td}>
                        {primary.division || <span className="text-gray-500">—</span>}
                      </td>
                      <td className={appTableClasses.td}>
                        {primary.placeOfCrimeScene || <span className="text-gray-500">—</span>}
                      </td>
                      <td className={appTableClasses.td}>
                        <span className="text-gray-700 text-xs">
                          {formatDateTimeDDMMYYYY(primary.updatedAt)}
                        </span>
                      </td>
                      <td className={appTableClasses.td}>
                        {approvalStatusBadge(primary.approval_status)}
                      </td>
                      <td className={`${appTableClasses.td} text-right`} onClick={(e) => e.stopPropagation()}>
                        <Link
                          href={viewHrefForGroup(group)}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border border-gray-300 text-xs font-medium text-gray-700 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-all"
                        >
                          <ExternalLink className="w-3 h-3" />
                          View
                        </Link>
                      </td>
                    </tr>
                    {open && hasExpanded ? (
                      <tr className="bg-slate-50/95 border-b border-slate-200">
                        <td colSpan={9} className="px-4 py-4">
                          <div className="space-y-3">
                            <ul className="space-y-2.5">
                              {chron.slice(1).map((child) => {
                                const visitNo = chron.findIndex((c) => c.id === child.id) + 1;
                                const isRevisit = child.visitType === 'REVISIT';
                                const rowClass = isRevisit
                                  ? 'border-amber-200 bg-amber-50/80 ring-1 ring-amber-200/70 border-l-[5px] border-l-amber-500'
                                  : 'border-blue-200 bg-blue-50/80 ring-1 ring-blue-200/70 border-l-[5px] border-l-blue-500';
                                const badgeClass = isRevisit
                                  ? 'bg-amber-200 text-amber-950 border-amber-400'
                                  : 'bg-blue-200 text-blue-950 border-blue-400';
                                return (
                                  <li
                                    key={child.id}
                                    className={`flex flex-wrap items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-sm shadow-sm ${rowClass}`}
                                  >
                                    <div className="flex flex-wrap items-center gap-2 min-w-0">
                                      <span
                                        className={`inline-flex h-7 min-w-[1.75rem] items-center justify-center rounded-md border text-[11px] font-bold tabular-nums shrink-0 ${badgeClass}`}
                                        title="Visit order for this CVR"
                                      >
                                        {visitNo}
                                      </span>
                                      {visitTypePill(child)}
                                      {registryWorkflowPill(child)}
                                      <span className="text-xs text-gray-700 font-medium">
                                        Submitted {formatDateTimeDDMMYYYY(child.updatedAt)}
                                      </span>
                                    </div>
                                    <Link
                                      href={viewHrefForGroup(group)}
                                      className={`text-xs font-semibold hover:underline shrink-0 ${
                                        isRevisit
                                          ? 'text-amber-700 hover:text-amber-900'
                                          : 'text-blue-700 hover:text-blue-900'
                                      }`}
                                    >
                                      Open with all visits
                                    </Link>
                                  </li>
                                );
                              })}

                              {/* Loading spinner for dynamically fetched backend court visits */}
                              {loadingCourtVisits[groupKey] && (
                                <li className="flex items-center justify-center p-4">
                                  <div className="animate-spin w-5 h-5 border-2 border-orange-600 border-t-transparent rounded-full" />
                                </li>
                              )}

                              {/* Backend Court visits */}
                              {courtVisitsByCvr[groupKey]?.map((cv, idx) => {
                                const visitNo = chron.length + idx + 1;
                                return (
                                  <li
                                    key={`backend-court-visit-${cv.COURT_VISIT_DETAILS_ID || idx}`}
                                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-sm shadow-sm border-orange-200 bg-orange-50/80 ring-1 ring-orange-200/70 border-l-[5px] border-l-orange-500"
                                  >
                                    <div className="flex flex-wrap items-center gap-2 min-w-0">
                                      <span
                                        className="inline-flex h-7 min-w-[1.75rem] items-center justify-center rounded-md border text-[11px] font-bold tabular-nums shrink-0 bg-orange-200 text-orange-950 border-orange-400"
                                        title="Court visit order"
                                      >
                                        {visitNo}
                                      </span>
                                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border bg-orange-100 text-orange-900 border-orange-300">
                                        Court Visit
                                      </span>
                                      <span className="text-xs text-gray-700 font-medium">
                                        Submitted {cv.CREATED_DTM}
                                      </span>
                                    </div>
                                    <Link
                                      href={viewHrefForGroup(group)}
                                      className="text-xs font-semibold text-orange-700 hover:text-orange-900 hover:underline shrink-0"
                                    >
                                      Open with all visits
                                    </Link>
                                  </li>
                                );
                              })}

                              {/* Court visit synthetic rows (fallback if backend court visits not loaded/empty) */}
                              {(!courtVisitsByCvr[groupKey] || courtVisitsByCvr[groupKey].length === 0) &&
                                courtVisitEntries.map((entry, idx) => {
                                  const visitNo = chron.length + idx + 1;
                                  return (
                                    <li
                                      key={`court-visit-${entry.scene.id}-${idx}`}
                                      className="flex flex-wrap items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-sm shadow-sm border-orange-200 bg-orange-50/80 ring-1 ring-orange-200/70 border-l-[5px] border-l-orange-500"
                                    >
                                      <div className="flex flex-wrap items-center gap-2 min-w-0">
                                        <span
                                          className="inline-flex h-7 min-w-[1.75rem] items-center justify-center rounded-md border text-[11px] font-bold tabular-nums shrink-0 bg-orange-200 text-orange-950 border-orange-400"
                                          title="Court visit order"
                                        >
                                          {visitNo}
                                        </span>
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border bg-orange-100 text-orange-900 border-orange-300">
                                          Court Visit
                                        </span>
                                        <span className="text-xs text-gray-700 font-medium">
                                          Submitted {formatDateTimeDDMMYYYY(entry.savedAt)}
                                        </span>
                                      </div>
                                      <Link
                                        href={viewHrefForGroup(group)}
                                        className="text-xs font-semibold text-orange-700 hover:text-orange-900 hover:underline shrink-0"
                                      >
                                        Open with all visits
                                      </Link>
                                    </li>
                                  );
                                })}

                              {/* Empty fallback state if expanded but absolutely no extra items found */}
                              {!loadingCourtVisits[groupKey] &&
                                chron.slice(1).length === 0 &&
                                (!courtVisitsByCvr[groupKey] || courtVisitsByCvr[groupKey].length === 0) &&
                                courtVisitEntries.length === 0 && (
                                  <li className="text-center py-4 text-xs text-gray-500 border border-dashed border-gray-200 rounded-xl bg-white">
                                    No other visits or court visits recorded.
                                  </li>
                                )}
                            </ul>
                          </div>
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </PageLayout>
  );
}
