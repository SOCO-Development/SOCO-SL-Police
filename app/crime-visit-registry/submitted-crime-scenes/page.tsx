'use client';
import { Fragment, useEffect, useMemo, useState, useCallback } from 'react';
import { jsPDF } from 'jspdf';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import CrimeSceneMultiDetailView from './CrimeSceneMultiDetailView';
import CvrVisitsExpandPanel from './CvrVisitsExpandPanel';
import { fullCvrVisitItemToCrimeScene } from '@/lib/crimeSceneFormMapping';
import MultiSelect from '@/components/forms/MultiSelect';
import { crimeSceneService } from '@/lib/crimeSceneService';
import { crimeService, locationService, officerService } from '@/lib/api';
import { getUsername } from '@/lib/api/authStorage';
import { showErrorAlert, showSuccessAlert } from '@/lib/alerts';
import { formatDateTimeDDMMYYYY, parseDateTimeParts } from '@/lib/dateUtils';
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
  const router = useRouter();
  const [scenes, setScenes] = useState<CrimeScene[]>([]);
  const [filter, setFilter] = useState<FilterTab>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState<keyof CrimeScene | string | null>('updatedAt');
  const [sortAsc, setSortAsc] = useState(false);
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(() => new Set());
  const [courtVisitsByCvr, setCourtVisitsByCvr] = useState<Record<string, any[]>>({});
  const [loadingCourtVisits, setLoadingCourtVisits] = useState<Record<string, boolean>>({});
  const [isApproving, setIsApproving] = useState(false);
  
  const [labs, setLabs] = useState<any[]>([]);
  const [selectedLabIds, setSelectedLabIds] = useState<string[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loadingLabsData, setLoadingLabsData] = useState(false);

  // Police Station / Division ID → name lookups (live from backend, keyed by
  // POLICE_STATION_ID since visits only carry policeStationId, not names).
  const [stationById, setStationById] = useState<Record<string, { name: string; divisionId: string }>>({});
  const [divisionById, setDivisionById] = useState<Record<string, string>>({});

  const newlySavedLocationId = (searchParams.get('locationId') ?? '').trim();
  const sceneId = (searchParams.get('id') ?? '').trim();
  const detailCvrParam = (searchParams.get('cvrNo') ?? '').trim();
  /** Set when "View" was clicked on a single visit row — scopes the detail page to that one visit only. */
  const visitCvrIdParam = (searchParams.get('visitCvrId') ?? '').trim();
  const isDetailMode = Boolean(detailCvrParam || sceneId);

  useEffect(() => {
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

    // 2. Pre-select the location of a just-created crime scene so it shows immediately;
    // otherwise no default location is selected, per requirements.
    if (newlySavedLocationId) {
      setSelectedLabIds([newlySavedLocationId]);
    }
  }, [newlySavedLocationId]);

  useEffect(() => {
    // Load Division reference data once (all provinces) so DIVISION_ID → name
    // resolves for any station, regardless of which SOCO lab is selected.
    locationService.getAllProvinces()
      .then(async (provinces) => {
        const lists = await Promise.all(
          (provinces || []).map((p) =>
            locationService
              .getAllDivisionsByProvince(Number(p.PROVINCE_ID))
              .catch(() => [])
          )
        );
        const map: Record<string, string> = {};
        lists.flat().forEach((d) => {
          map[d.DIVISION_ID] = d.DIVISION_NAME;
        });
        setDivisionById(map);
      })
      .catch((err) => console.error('Failed to load divisions', err));
  }, []);

  useEffect(() => {
    // Load Police Station reference data for the selected SOCO labs so
    // POLICE_STATION_ID → name/division resolves for visits in those labs.
    if (selectedLabIds.length === 0) return;
    Promise.all(selectedLabIds.map((id) => locationService.getPoliceStationsBySocoLab(id).catch(() => [])))
      .then((lists) => {
        const map: Record<string, { name: string; divisionId: string }> = {};
        lists.flat().forEach((s) => {
          map[s.POLICE_STATION_ID] = { name: s.POLICE_STATION_NAME, divisionId: s.DIVISION_ID };
        });
        setStationById((prev) => ({ ...prev, ...map }));
      })
      .catch((err) => console.error('Failed to load police stations', err));
  }, [selectedLabIds]);

  const stationDivisionLookup = useMemo(() => ({
    stationName: (policeStationId: string) => stationById[policeStationId]?.name || '',
    divisionName: (policeStationId: string) => {
      const divId = stationById[policeStationId]?.divisionId;
      return divId ? divisionById[divId] || '' : '';
    },
  }), [stationById, divisionById]);

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
        const visitKey = item.CVR_ID || item.VISIT_ID || item.INITIATE_CVR_ID || index;
        const reportedDt = parseDateTimeParts({ date: item.REPORTED_SOCO_DATE, time: item.REPORTED_SOCO_TIME });
        const createdTimestamp =
          item.CREATED_DTM ||
          localMatch?.createdAt ||
          (reportedDt ? reportedDt.toISOString() : null) ||
          localMatch?.updatedAt ||
          new Date().toISOString();

        return {
          id: `backend_visit_${visitKey}_${item.CVR_NO || index}`,
          cvrNo: item.CVR_NO,
          cvrId: Number(item.CVR_ID),
          initiateCvrId: item.INITIATE_CVR_ID ? Number(item.INITIATE_CVR_ID) : undefined,
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
          createdAt: createdTimestamp,
          updatedAt: localMatch?.updatedAt || createdTimestamp,
          inChargeOfficer: localMatch?.inChargeOfficer || { name: '' },
          socoOfficers: localMatch?.socoOfficers || [],
          specialistTeams: localMatch?.specialistTeams || [],
          courtDetails: localMatch?.courtDetails || { sentToAnalysisRows: [], productionSentToCourtRows: [] },
          courtVisitUpdate: localMatch?.courtVisitUpdate,
          registryWorkflowUpdates: localMatch?.registryWorkflowUpdates,
          registryWorkflowUpdate: localMatch?.registryWorkflowUpdate,
          approval_status: (item as any).approval_status || (item as any).APPROVAL_STATUS || localMatch?.approval_status || 'In Progress',
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
    // Clear existing results when the selected location changes
    // Require the user to click View again to load the new data
    setScenes([]);
  }, [selectedLabIds]);

  useEffect(() => {
    // Auto-load when arriving here right after creating a crime scene,
    // so the newly saved CVR shows up without an extra manual "View" click.
    if (newlySavedLocationId && selectedLabIds.length === 1 && selectedLabIds[0] === newlySavedLocationId) {
      handleFetchForSelectedLabs();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newlySavedLocationId, selectedLabIds]);

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
      const sig = item.id;
      if (seenSignatures.has(sig)) continue;
      seenSignatures.add(sig);
      unique.push(item);
    }

    const sorted = unique.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    // Per-visit "View" scopes the page to that single visit's data only.
    if (visitCvrIdParam) {
      return sorted.filter((s) => String(s.cvrId ?? '') === visitCvrIdParam);
    }
    return sorted;
  }, [detailCvrParam, sceneId, scenes, visitCvrIdParam]);

  const detailTitle = useMemo(() => {
    if (relatedScenesForDetail.length === 0) return '';
    const first = relatedScenesForDetail[0];
    return (first.cvrNo ?? '').trim() || first.id;
  }, [relatedScenesForDetail]);

  // Live CVR detail data (station/division names, team leader, investigation
  // officers, production details, etc.) — sourced from the same backend API
  // as the expand panel, instead of the stale localStorage-merged `scenes`.
  const initiateCvrIdForDetail = relatedScenesForDetail[0]?.initiateCvrId;
  const [liveDetailScenes, setLiveDetailScenes] = useState<CrimeScene[] | null>(null);
  const [liveDetailLoading, setLiveDetailLoading] = useState(false);

  useEffect(() => {
    if (!initiateCvrIdForDetail) {
      setLiveDetailScenes(null);
      return;
    }
    let cancelled = false;
    setLiveDetailLoading(true);
    crimeService
      .getFullCvrDetailsByInitiateCvrId(initiateCvrIdForDetail)
      .then((result) => {
        if (cancelled) return;
        const mapped = result.visits.map((v) =>
          fullCvrVisitItemToCrimeScene(v, result.cvrNo, stationDivisionLookup),
        );
        setLiveDetailScenes(mapped);
      })
      .catch((err) => {
        console.error('Failed to load live full CVR details for detail view', err);
        if (!cancelled) setLiveDetailScenes(null);
      })
      .finally(() => {
        if (!cancelled) setLiveDetailLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initiateCvrIdForDetail]);

  // Prefer live backend data; fall back to the localStorage-merged list when
  // no initiateCvrId is available (e.g. purely local/unsynced records).
  const detailScenesToRender = useMemo(() => {
    if (liveDetailScenes) {
      return visitCvrIdParam
        ? liveDetailScenes.filter((s) => String(s.cvrId ?? '') === visitCvrIdParam)
        : liveDetailScenes;
    }
    return relatedScenesForDetail;
  }, [liveDetailScenes, relatedScenesForDetail, visitCvrIdParam]);

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
        approvedBy: approvedBy
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

    if (liveDetailLoading && !liveDetailScenes) {
      return (
        <PageLayout>
          <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3 text-gray-500">
            <div className="animate-spin w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full" />
            <p className="text-sm font-medium">Loading visit details…</p>
          </div>
        </PageLayout>
      );
    }

    return (
      <PageLayout>
        <PageHeader
          backHref="/crime-visit-registry/submitted-crime-scenes"
          title={detailTitle}
          description={
            visitCvrIdParam ? 'This visit only.' : 'All visits for this CVR are listed below.'
          }
          actions={
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => exportToCSV(detailScenesToRender)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Table className="w-3.5 h-3.5 text-emerald-600" />
                Export Excel (CSV)
              </button>
              <button
                type="button"
                onClick={() => exportToPDF(detailScenesToRender)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <FileText className="w-3.5 h-3.5 text-red-500" />
                Export PDF
              </button>
            </div>
          }
        />
        <CrimeSceneMultiDetailView scenes={detailScenesToRender} />
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

  /** Per-visit "View" — scopes the detail page to just this one visit (by backend cvrId). */
  const viewHrefForVisit = (group: CrimeSceneCvrGroup, visitCvrId: number) => {
    const base = viewHrefForGroup(group);
    return `${base}&visitCvrId=${encodeURIComponent(visitCvrId)}`;
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
                <th className={appTableClasses.th}>Visits</th>
                <th className={appTableClasses.thRight}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedGroups.map((group) => {
                const { primary, children, groupKey } = group;
                const nonCourtChildren = children.filter((s) => s.visitType !== 'COURT_VISIT');
                const chron = flattenGroupChronological(group).filter((s) => s.visitType !== 'COURT_VISIT');
                const hasExpanded = chron.length > 0;
                const open = expandedKeys.has(groupKey);
                const initiateCvrId = primary.initiateCvrId ?? Number(primary.cvrId);

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
                        <Link
                          href={viewHrefForGroup(group)}
                          className="font-mono text-sm text-blue-700 font-bold hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {group.displayCvr}
                        </Link>
                      </td>
                      <td className={appTableClasses.td}>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#EEF2FF] text-[#3B5BDB]">
                            New Visit
                          </span>
                          {nonCourtChildren.length > 0 ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#CCFBF1] text-[#0F766E]">
                              {nonCourtChildren.length} Revisit{nonCourtChildren.length > 1 ? 's' : ''}
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td className={`${appTableClasses.td} text-right`} onClick={(e) => e.stopPropagation()}>
                        <Link
                          href={viewHrefForGroup(group)}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border border-gray-300 text-xs font-medium text-gray-700 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-all"
                        >
                          <ExternalLink className="w-3 h-3" />
                          View all
                        </Link>
                      </td>
                    </tr>
                    {open && hasExpanded ? (
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <td colSpan={4} className="pt-3 pb-0">
                          {initiateCvrId ? (
                            <CvrVisitsExpandPanel
                              key={initiateCvrId}
                              initiateCvrId={initiateCvrId}
                              lookup={stationDivisionLookup}
                              onViewVisit={(visit) => router.push(viewHrefForVisit(group, visit.cvrId))}
                            />
                          ) : (
                            <div className="mx-4 mb-3 py-6 text-center text-sm text-gray-400">
                              No backend CVR reference available for this group.
                            </div>
                          )}
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
