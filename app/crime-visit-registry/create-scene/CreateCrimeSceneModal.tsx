'use client';

import { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import CustomSelect from '@/components/forms/CustomSelect';
import DatePicker from '@/components/forms/DatePicker';
import TimePicker from '@/components/forms/TimePicker';
import FormInput from '@/components/forms/FormInput';
import { AddRowButton, RemoveRowButton, Button, IconButton } from '@/components/ui';
import { crimeVisitService } from '@/lib/crimeVisitService';
import { crimeSceneService } from '@/lib/crimeSceneService';
import {
  ANALYSIS_INSTITUTION_OPTIONS,
  analysisInstitutionIsOthers,
} from '@/lib/analysisInstitutions';
import { COURT_NAME_OPTIONAL_SELECT_OPTIONS } from '@/lib/courtNames';
import MultiSelect from '@/components/forms/MultiSelect';
import {
  getProductionPRDisplayLabel,
  PRODUCTION_PR_OPTIONS,
  PRODUCTION_PR_OTHERS_VALUE,
  productionOptionsForSelection,
  productionPRHasOthersSelected,
} from '@/lib/productionPROptions';
import { formatDateTimeDDMMYYYY, formatIncidentDuration } from '@/lib/dateUtils';
import { getLocationRegistry } from '@/lib/api/locationService';
import { validateIncidentTimingSection } from '@/lib/crimeSceneFormMapping';
import type { CrimeVisit } from '@/types/crimeVisit';
import {
  crimeSceneUsesNewVisitFields,
  crimeSceneUsesRevisitFields,
  emptyCrimeSceneCourtDetails,
  emptyProductionSentToCourtRow,
  emptySentToAnalysisRow,
  type CrimeSceneFormData,
  type CrimeSceneOfficer,
  type CrimeSceneSpecialistTeam,
  type CrimeSceneVisitType,
} from '@/types/crimeScene';

interface CreateCrimeSceneModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: (payload: { cvrNo: string }) => void;
}

const FALLBACK_STATIONS = [
  { value: 'Colombo Fort Police Station', label: 'Colombo Fort Police Station', division: 'Colombo Division' },
  { value: 'Borella Police Station', label: 'Borella Police Station', division: 'Colombo Division' },
  { value: 'Kandy Police Station', label: 'Kandy Police Station', division: 'Kandy Division' },
  { value: 'Galle Police Station', label: 'Galle Police Station', division: 'Galle Division' },
  { value: 'Kurunegala Police Station', label: 'Kurunegala Police Station', division: 'Kurunegala Division' },
  { value: 'Jaffna Police Station', label: 'Jaffna Police Station', division: 'Jaffna Division' },
];

const FALLBACK_DIVISIONS = [
  { value: 'Colombo Division', label: 'Colombo Division' },
  { value: 'Kandy Division', label: 'Kandy Division' },
  { value: 'Gampaha Division', label: 'Gampaha Division' },
  { value: 'Kalutara Division', label: 'Kalutara Division' },
  { value: 'Galle Division', label: 'Galle Division' },
  { value: 'Kurunegala Division', label: 'Kurunegala Division' },
];

const OFFENCE_OPTIONS = [
  'මනුෂ්‍ය ඝාතනය',
  'මනුෂ්‍ය ඝාතනයට තැත්කිරීම හා සියදිවි නසා ගැනීමට අනුබල දීම',
  'කැමැත්තෙන්ම තුවාල සිදු කිරීම',
  'ස්ත්‍රී දූෂණය',
  'ව්‍යවස්ථාපිත ස්ත්‍රී දූෂණය හා ව්‍යභිචාරය',
  'ළමයින්ගෙන් අයුතු ලිංගික ප්‍රෙයා්ජන ගැනීම, බරපතල ලිංගික අපයෝජනය සහ අස්වාභාවික වැරදි',
  'ළමයින් අතහැර යාම, කෘෘරත්වයට භාජනය කිරීම සහ වහල් භාවට ගැනීම',
  'අපහරණය හා පැහැරගෙන යාම සම්බන්ධ වැරදි',
  'කුට්ඨනය කිරීම සහ තැනැත්තන් වෙළදාම සිදු කිරීම',
  'රාජකාරියට බාධා කිරීම',
  'කොල්ලකෑම',
  'අයුතු ඇතුල්වීම සහ ගෙවල් බිදිම',
  'සොරකම් කිරීම',
  'ගිණි තැබීම් හා අනර්ථය සිදු කිරීම',
  'බලෙන් ලබා ගැනීම ( මුදලක්, යම් දේපළක් හෝ වටිනා ඇපයක්, වටිනා ඇපයකට හැරවිය හැකි අත්සන් කරනු ලැබු යමක් )',
  'රු. 700000/- ක් හෝ ඊට වැඩි සාවද්‍ය පරිහරණය, සාපරාධි විශ්වාසය කඩ කිරීම, වංචා කිරීම සහ අනෙකෙකු ලෙස පෙනි සිට වංචා කිරීම',
  'රාජ්‍ය විරෝධී වැරදි',
  'නීති විරෝධි රැස්වීම / කැරළි කෝලාහල',
  'ව්‍යාජ මුදල් පිළිබද අපරාධ',
  '2007 අංක 24 දරණ පරිගණක අපරාධ පනත',
  'ගෙවීම් උපක්‍රම වංචා සංයුක්ත වන ක්‍රියා',
  '2006 අංක 05 දරණ මුදල් විශුද්ධීකරණය වැලැක්වීමේ පනත යටතේ ගැනෙන වැරදි',
  'පීඩාකාරි ආයුධ පනත',
  'ස්වයංක්‍රීය, ස්වයංපූරක ගිණි අවි හෝ රිපීටර් තුවක්කු සන්තකය',
  '2007 අංක 56 දරන සිවිල් හා දේශපාලන අයිතිවාසිකම් පිළිබද ජාත්‍යන්තර සම්මුතිය (ICCPR) පනත',
  '1984 අංක 13 සහ 2022 අංක 2022 අංක 41 පනත් වලින් සංශෝධිත විෂ වර්ග, අබිං සහ අන්තරාදායක ඖෂධ ආඥා පනත සහ 2008 අංක 01 දරන මාද ඖෂධ සහ මනෝවර්ථක නිතිවිරෝධි ලෙස ජාවාරම් කිරීමට එරෙහි සම්මුති පනත යටතේ වැරදි',
  '1979 අංක 48 දරන ත්‍රස්තවාදි වැලැක්වීම පනත යටතේ වැරදි',
  '2025 අංක 05 දරන අපරාධයකින් උත්පාදිත දේ පිළිබද පනත යටතේ සිදු කෙරෙන වැරදි',
  '1993 අංක 49 දරන පනතින් සංශෝධිත 1937 අංක 02 දරන වන සත්ත්ව හා වෘක්ෂලතා ආඥා පනත ( 2009 අංක 22 සංශෝධනය දක්වා සියළු සංශෝධන ඇතුලත් )',
].map((value) => ({ value, label: value }));

const VISIT_TYPES: { value: CrimeSceneVisitType; label: string }[] = [
  { value: 'NEW_VISIT', label: 'New Visit' },
  { value: 'REVISIT', label: 'Revisit' },
];

const COURT_DETAILS_NAME_OPTIONS = [
  'Vavuniya High Court',
  'Vavuniya MC',
  'WALAPANE MC',
  'WALASMULLA MC',
  'WARAKAPOLA  MC',
  'Warakapola MC',
  'WARIYAPOLA MC',
  'WELISARA MC',
  'Wellawaya MC',
]
  .filter((value, index, arr) => arr.indexOf(value) === index)
  .map((value) => ({ value, label: value }));

const SPECIALIST_ROLE_OPTIONS = [
  'Magistrate',
  'GAD',
  'JMO',
  'Finger Print',
  'Kannel',
  'Foreign Investigation Officers',
  'Others',
].map((value) => ({ value, label: value }));

const TEAM_ROLE_OPTIONS = [
  { value: 'Photographer', label: 'Photographer' },
  { value: 'Sketcher', label: 'Sketcher' },
  { value: 'Evidence Collector', label: 'Evidence Collector' },
  { value: 'Other', label: 'Other' },
];

const CRIME_SCENE_TYPE_OPTIONS = [
  { value: 'House', label: 'House' },
  { value: 'Institutions', label: 'Institutions' },
  { value: 'Buildings', label: 'Buildings' },
  { value: 'Shop', label: 'Shop' },
  { value: 'Highway', label: 'Highway' },
  { value: 'Others', label: 'Others' },
];

const SOCO_ROLE_OPTIONS = [
  { value: 'Photographer', label: 'Photographer' },
  { value: 'Sketcher', label: 'Sketcher' },
  { value: 'Evidence Collector', label: 'Evidence Collector' },
  { value: 'Other', label: 'Other' },
];

const SPECIALIST_MEMBER_ROLE_OPTIONS = [
  { value: 'Team Leader', label: 'Team Leader' },
  { value: 'Team Member', label: 'Team Member' },
];

function emptyOfficer(): CrimeSceneOfficer {
  return { name: '', regNo: '', rank: '', teamRole: 'Other', teamRoleOther: '', socoRole: 'Other' };
}

function emptySpecialist(): CrimeSceneSpecialistTeam {
  return { role: '', inTime: '', outTime: '', members: [{ name: '', role: 'Team Leader' }] };
}

function defaultForm(): CrimeSceneFormData {
  return {
    visitType: 'NEW_VISIT',
    cvrNo: '',
    visitId: '',
    revisitCvrNo: '',
    policeStation: '',
    reportedToPoliceStation: { date: '', time: '' },
    reportedToSocoLab: { date: '', time: '' },
    sceneInTime: '',
    sceneOutTime: '',
    division: '',
    offence: {},
    offenceType: '',
    placeOfCrimeScene: '',
    crimeSceneType: '',
    crimeSceneTypeOther: '',
    incidentDateExactlyKnown: true,
    incidentKnown: { date: '', time: '' },
    incidentFrom: { date: '', time: '' },
    incidentTo: { date: '', time: '' },
    inChargeOfficer: emptyOfficer(),
    socoOfficers: [emptyOfficer()],
    specialistTeams: [emptySpecialist()],
    investigationOfficers: [emptyOfficer()],
    sceneGuards: [emptyOfficer()],
    photoZipName: '',
    sketchFileName: '',
    reportFileName: '',
    courtDetails: emptyCrimeSceneCourtDetails(),
  };
}

function toMinutes(time: string): number | null {
  if (!time) return null;
  const [h, m] = time.split(':').map((v) => Number(v));
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
}

function formatDuration(inTime: string, outTime: string): string {
  const inMinutes = toMinutes(inTime);
  const outMinutes = toMinutes(outTime);
  if (inMinutes == null || outMinutes == null) return '--';

  let diff = outMinutes - inMinutes;
  if (diff < 0) {
    diff += 24 * 60;
  }

  const hours = Math.floor(diff / 60);
  const minutes = diff % 60;
  return `${hours}h ${minutes}m`;
}

export default function CreateCrimeSceneModal({ isOpen, onClose, onSaved }: CreateCrimeSceneModalProps) {
  const [form, setForm] = useState<CrimeSceneFormData>(defaultForm());
  const [divisions, setDivisions] = useState<{ value: string; label: string }[]>(FALLBACK_DIVISIONS);
  const [stations, setStations] = useState<{ value: string; label: string; division: string }[]>(FALLBACK_STATIONS);

  useEffect(() => {
    if (!isOpen) return;
    getLocationRegistry().then(({ locations }) => {
      if (!locations || locations.length === 0) return;
      const uniqueDivisionsMap = new Map<string, string>();
      locations.forEach(loc => {
        if (loc.division) {
          uniqueDivisionsMap.set(loc.division, loc.division);
        }
      });
      const divisionOpts = Array.from(uniqueDivisionsMap.keys()).map(name => ({
        value: name,
        label: name,
      })).sort((a, b) => a.label.localeCompare(b.label));

      const stationOpts = locations.map(loc => ({
        value: loc.name,
        label: loc.name,
        division: loc.division,
      })).sort((a, b) => a.label.localeCompare(b.label));

      setDivisions(divisionOpts);
      setStations(stationOpts);
    }).catch(err => {
      console.error("Failed to load locations for form dropdowns", err);
    });
  }, [isOpen]);

  const filteredStationOptions = useMemo(() => {
    if (!form.division) return stations;
    return stations.filter(s => s.division === form.division);
  }, [stations, form.division]);

  const [allVisits, setAllVisits] = useState<CrimeVisit[]>([]);
  const [existingCvrs, setExistingCvrs] = useState<string[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    const visits = crimeVisitService.getAll();
    setAllVisits(visits);

    const cvrs = Array.from(new Set(crimeSceneService.getAll().map((scene) => scene.cvrNo))).filter(Boolean);
    setExistingCvrs(cvrs);
  }, [isOpen]);

  const visitOptions = useMemo(
    () => allVisits
      .slice()
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map((visit) => ({
        value: visit.id,
        label: `${visit.referenceNo ?? visit.id} - ${formatDateTimeDDMMYYYY(visit.createdAt)}`,
      })),
    [allVisits]
  );

  const cvrOptions = useMemo(
    () => existingCvrs.map((cvr) => ({ value: cvr, label: cvr })),
    [existingCvrs]
  );

  const sceneDuration = useMemo(
    () => formatDuration(form.sceneInTime, form.sceneOutTime),
    [form.sceneInTime, form.sceneOutTime]
  );

  const incidentDuration = useMemo(
    () =>
      formatIncidentDuration(
        form.incidentFrom ?? { date: '', time: '' },
        form.incidentTo ?? { date: '', time: '' },
      ),
    [form.incidentFrom, form.incidentTo],
  );
  const incidentMode = form.incidentDateExactlyKnown;
  const showIncidentExact = incidentMode === true || incidentMode === null;
  const showIncidentDuration = incidentMode === false || incidentMode === null;

  if (!isOpen) return null;

  const updateOfficer = (index: number, patch: Partial<CrimeSceneOfficer>) => {
    setForm((prev) => ({
      ...prev,
      socoOfficers: prev.socoOfficers.map((officer, i) => (i === index ? { ...officer, ...patch } : officer)),
    }));
  };

  const updateSceneGuard = (index: number, patch: Partial<CrimeSceneOfficer>) => {
    setForm((prev) => ({
      ...prev,
      sceneGuards: (prev.sceneGuards ?? []).map((guard, i) => (i === index ? { ...guard, ...patch } : guard)),
    }));
  };

  const updateInvestigationOfficer = (index: number, patch: Partial<CrimeSceneOfficer>) => {
    setForm((prev) => ({
      ...prev,
      investigationOfficers: (prev.investigationOfficers ?? []).map((o, i) =>
        i === index ? { ...o, ...patch } : o
      ),
    }));
  };

  const updateSpecialist = (index: number, patch: Partial<CrimeSceneSpecialistTeam>) => {
    setForm((prev) => ({
      ...prev,
      specialistTeams: prev.specialistTeams.map((row, i) => (i === index ? { ...row, ...patch } : row)),
    }));
  };

  const updateSpecialistMember = (teamIndex: number, memberIndex: number, patch: Partial<{ name: string; role: string }>) => {
    setForm((prev) => {
      const teams = [...prev.specialistTeams];
      const team = { ...teams[teamIndex] };
      const members = [...(team.members || [])];
      members[memberIndex] = { ...members[memberIndex], ...patch };
      team.members = members;
      teams[teamIndex] = team;
      return { ...prev, specialistTeams: teams };
    });
  };

  const addSpecialistMember = (teamIndex: number) => {
    setForm((prev) => {
      const teams = [...prev.specialistTeams];
      const team = { ...teams[teamIndex] };
      team.members = [...(team.members || []), { name: '', role: 'Team Member' }];
      teams[teamIndex] = team;
      return { ...prev, specialistTeams: teams };
    });
  };

  const removeSpecialistMember = (teamIndex: number, memberIndex: number) => {
    setForm((prev) => {
      const teams = [...prev.specialistTeams];
      const team = { ...teams[teamIndex] };
      const members = [...(team.members || [])];
      members.splice(memberIndex, 1);
      team.members = members;
      teams[teamIndex] = team;
      return { ...prev, specialistTeams: teams };
    });
  };

  const validate = (): string => {
    if ((crimeSceneUsesNewVisitFields(form.visitType) || crimeSceneUsesRevisitFields(form.visitType)) && !form.visitId)
      return 'Please select a Visit ID.';
    if (crimeSceneUsesNewVisitFields(form.visitType) && !form.cvrNo?.trim())
      return 'Please enter a CVR number for the new visit.';
    if (crimeSceneUsesRevisitFields(form.visitType) && !form.revisitCvrNo) {
      return form.visitType === 'COURT_VISIT'
        ? 'Please select a CVR number for court visit.'
        : 'Please select a CVR number for revisit.';
    }
    if (!form.policeStation) return 'Please select a police station.';
    if (!form.reportedToPoliceStation.date || !form.reportedToPoliceStation.time) return 'Please add date and time reported to Police station.';
    if (!form.reportedToSocoLab.date || !form.reportedToSocoLab.time) return 'Please add date and time reported to SOCO lab.';
    if (!form.sceneInTime || !form.sceneOutTime) return 'Please provide scene in and out times.';
    if (!form.division) return 'Please select division.';
    if (!form.placeOfCrimeScene.trim()) return 'Please enter place of crime scene.';
    if (!form.crimeSceneType?.trim()) return 'Please select type of crime scene.';
    if (form.crimeSceneType === 'Others' && !form.crimeSceneTypeOther?.trim()) {
      return 'Please specify type of crime scene when “Others” is selected.';
    }
    const incidentErr = validateIncidentTimingSection(form);
    if (incidentErr) return incidentErr;

    const analysisRows = form.courtDetails?.sentToAnalysisRows ?? [];
    for (let i = 0; i < analysisRows.length; i++) {
      const row = analysisRows[i];
      if (!row.productionRef?.trim()) continue;
      if (row.sentToAnalysis !== 'Yes' && row.sentToAnalysis !== 'No') {
        return `Productions sent to analysis institutes (row ${i + 1}): choose Yes or No.`;
      }
      if (row.sentToAnalysis === 'Yes') {
        if (!String(row.date ?? '').trim()) {
          return `Productions sent to analysis institutes (row ${i + 1}): enter the date.`;
        }
        const inst = String(row.institution ?? '').trim();
        if (!inst) {
          return `Productions sent to analysis institutes (row ${i + 1}): select an institution.`;
        }
        if (analysisInstitutionIsOthers(inst) && !String(row.institutionOtherDetail ?? '').trim()) {
          return `Productions sent to analysis institutes (row ${i + 1}): specify the institution.`;
        }
        if (!String(row.refNo ?? '').trim()) {
          return `Productions sent to analysis institutes (row ${i + 1}): enter the reference number.`;
        }
      }
    }

    const courtRows = form.courtDetails?.productionSentToCourtRows ?? [];
    for (let i = 0; i < courtRows.length; i++) {
      const row = courtRows[i];
      if (!row.productionRef?.trim()) continue;
      if (row.sentToCourt !== 'Yes' && row.sentToCourt !== 'No') {
        return `Production sent to court (row ${i + 1}): choose Yes or No for whether this production was sent to court.`;
      }
      if (row.sentToCourt === 'Yes') {
        if (!String(row.date ?? '').trim()) {
          return `Production sent to court (row ${i + 1}): enter the date sent to court.`;
        }
      }
    }

    if (!form.inChargeOfficer.name.trim()) return 'Please enter the in-charge officer.';
    return '';
  };

  const handleSave = () => {
    const validation = validate();
    if (validation) {
      setError(validation);
      return;
    }

    const filteredOfficers = form.socoOfficers.filter((officer) => officer.name.trim());
    const filteredSpecialists = form.specialistTeams.map((team) => ({
      ...team,
      members: (team.members || []).filter((m) => m.name.trim()),
    })).filter((team) => team.role.trim() || (team.members && team.members.length > 0));
    const filteredSceneGuards = (form.sceneGuards ?? []).filter((guard) => guard.name.trim());
    const filteredInvestigationOfficers = (form.investigationOfficers ?? []).filter((o) =>
      o.name.trim()
    );

    const payload: CrimeSceneFormData = {
      ...form,
      cvrNo: crimeSceneUsesNewVisitFields(form.visitType) ? (form.cvrNo?.trim() ?? '') : form.revisitCvrNo,
      visitId: crimeSceneUsesNewVisitFields(form.visitType) ? form.visitId : '',
      revisitCvrNo: crimeSceneUsesRevisitFields(form.visitType) ? form.revisitCvrNo : '',
      socoOfficers: filteredOfficers,
      specialistTeams: filteredSpecialists,
      sceneGuards: filteredSceneGuards,
      investigationOfficers: filteredInvestigationOfficers,
    };

    const created = crimeSceneService.create(payload);
    onSaved?.({ cvrNo: created.cvrNo });
    setError('');
    setForm(defaultForm());
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[92vh] overflow-hidden border border-gray-200 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-sky-50 border-b border-sky-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Create Crime Scene</h2>
            <p className="text-xs text-gray-600 mt-0.5">Attach scenes to morning visits and save each scene with a CVR.</p>
          </div>
          <IconButton onClick={onClose} aria-label="Close modal">
            <X className="w-5 h-5" />
          </IconButton>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <CustomSelect
              label="Visit ID with Date"
              value={form.visitId}
              onChange={(value) => setForm((prev) => ({ ...prev, visitId: value }))}
              options={visitOptions}
              placeholder={visitOptions.length ? 'Select initiated visit' : 'No visits found'}
            />

            <CustomSelect
              label="Visit Type"
              value={form.visitType}
              onChange={(value) => setForm((prev) => ({ ...prev, visitType: value as CrimeSceneVisitType }))}
              options={VISIT_TYPES}
              placeholder="Select visit type"
            />

            <CustomSelect
              label="Police Division"
              value={form.division}
              onChange={(value) => setForm((prev) => {
                const currentStation = prev.policeStation;
                const matches = stations.find(s => s.value === currentStation && s.division === value);
                return {
                  ...prev,
                  division: value,
                  policeStation: matches ? currentStation : '',
                };
              })}
              options={divisions}
              placeholder="Select police division"
            />

            <CustomSelect
              label="Requested Police Station"
              value={form.policeStation}
              onChange={(value) => setForm((prev) => {
                const matchingStation = stations.find(s => s.value === value);
                const newDivision = matchingStation && matchingStation.division
                  ? matchingStation.division
                  : prev.division;
                return {
                  ...prev,
                  policeStation: value,
                  division: newDivision,
                };
              })}
              options={filteredStationOptions}
              placeholder="Select police station"
            />
          </div>

          <div className="bg-violet-50/65 rounded-xl border border-violet-200 p-4 sm:p-5">
            {crimeSceneUsesNewVisitFields(form.visitType) ? (
              <FormInput
                label="CVR Number (Format: SOCO Lab Name/Number/Year e.g. Ampara/01/2026)"
                value={form.cvrNo ?? ''}
                onChange={(e) => setForm((prev) => ({ ...prev, cvrNo: e.target.value }))}
                placeholder="Ampara/01/2026"
              />
            ) : (
              <CustomSelect
                label="CVR Number"
                value={form.revisitCvrNo}
                onChange={(value) => setForm((prev) => ({ ...prev, revisitCvrNo: value }))}
                options={cvrOptions}
                placeholder={cvrOptions.length ? 'Select existing CVR' : 'No CVR numbers found'}
              />
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-slate-50/80 rounded-xl border border-slate-200 p-4 sm:p-5 space-y-4">
              <h3 className="text-sm font-semibold text-gray-800">Reporting Times</h3>
              <div className="grid grid-cols-2 gap-3">
                <DatePicker
                  label="Reported to Police Station - Date"
                  value={form.reportedToPoliceStation.date}
                  onChange={(value) => setForm((prev) => ({ ...prev, reportedToPoliceStation: { ...prev.reportedToPoliceStation, date: value } }))}
                />
                <TimePicker
                  label="Reported to Police Station - Time"
                  value={form.reportedToPoliceStation.time}
                  onChange={(value) => setForm((prev) => ({ ...prev, reportedToPoliceStation: { ...prev.reportedToPoliceStation, time: value } }))}
                />
                <DatePicker
                  label="Reported to SOCO Lab - Date"
                  value={form.reportedToSocoLab.date}
                  onChange={(value) => setForm((prev) => ({ ...prev, reportedToSocoLab: { ...prev.reportedToSocoLab, date: value } }))}
                />
                <TimePicker
                  label="Reported to SOCO Lab - Time"
                  value={form.reportedToSocoLab.time}
                  onChange={(value) => setForm((prev) => ({ ...prev, reportedToSocoLab: { ...prev.reportedToSocoLab, time: value } }))}
                />
              </div>
            </div>

            <div className="bg-cyan-50/70 rounded-xl border border-cyan-200 p-4 sm:p-5 space-y-4">
              <h3 className="text-sm font-semibold text-gray-800">Scene Details</h3>
              <div className="grid grid-cols-2 gap-3">
                <TimePicker
                  label="Scene In Time"
                  value={form.sceneInTime}
                  onChange={(value) => setForm((prev) => ({ ...prev, sceneInTime: value }))}
                />
                <TimePicker
                  label="Scene Out Time"
                  value={form.sceneOutTime}
                  onChange={(value) => setForm((prev) => ({ ...prev, sceneOutTime: value }))}
                />
                {/* <CustomSelect
                  label="Offence"
                  value={form.offence}
                  onChange={(value) => setForm((prev) => ({ ...prev, offence: value }))}
                  options={OFFENCE_OPTIONS}
                  placeholder="Select offence"
                /> */}
              </div>
              <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-800">
                Scene Visit Duration: <span className="font-semibold">{sceneDuration}</span>
              </div>
              <FormInput
                label="Place of Crime Scene"
                value={form.placeOfCrimeScene}
                onChange={(e) => setForm((prev) => ({ ...prev, placeOfCrimeScene: e.target.value }))}
                placeholder="Enter location details"
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:items-end">
                <div className="min-w-0">
                  <CustomSelect
                    label="Type of Crime Scene"
                    value={form.crimeSceneType ?? ''}
                    onChange={(value) =>
                      setForm((prev) => ({
                        ...prev,
                        crimeSceneType: value,
                        crimeSceneTypeOther: value === 'Others' ? prev.crimeSceneTypeOther : '',
                      }))
                    }
                    options={CRIME_SCENE_TYPE_OPTIONS}
                    placeholder="Select type"
                    className="w-full"
                  />
                </div>
                <div className="min-w-0">
                  {(form.crimeSceneType ?? '') === 'Others' ? (
                    <FormInput
                      label="Specify type"
                      value={form.crimeSceneTypeOther ?? ''}
                      onChange={(e) => setForm((prev) => ({ ...prev, crimeSceneTypeOther: e.target.value }))}
                      placeholder="Specify type of crime scene"
                    />
                  ) : null}
                </div>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                      Incident date (exactly known)?
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 min-h-10 rounded-lg border border-gray-200 bg-gray-50/70 p-2">
                      {(['Yes', 'No'] as const).map((opt) => (
                        <label key={opt} className="inline-flex items-center gap-2 text-sm text-gray-700">
                          <input
                            type="radio"
                            name="modalIncidentDateExactlyKnown"
                            checked={
                              opt === 'Yes'
                                ? form.incidentDateExactlyKnown === true
                                : form.incidentDateExactlyKnown === false
                            }
                            onChange={() =>
                              setForm((prev) =>
                                opt === 'Yes'
                                  ? {
                                      ...prev,
                                      incidentDateExactlyKnown: true,
                                      incidentFrom: { date: '', time: '' },
                                      incidentTo: { date: '', time: '' },
                                    }
                                  : {
                                      ...prev,
                                      incidentDateExactlyKnown: false,
                                      incidentKnown: { date: '', time: '' },
                                    },
                              )
                            }
                            className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                          />
                          {opt}
                        </label>
                      ))}
                    </div>
                    {form.incidentDateExactlyKnown === null && (
                      <p className="text-xs text-gray-500 mt-1.5">
                        This record uses both exact and duration fields. Choose Yes or No to use one set only.
                      </p>
                    )}
                  </div>

                  {showIncidentExact && (
                    <>
                      <DatePicker
                        label="Incident date (exactly known)"
                        value={form.incidentKnown?.date ?? ''}
                        onChange={(value) =>
                          setForm((prev) => ({
                            ...prev,
                            incidentKnown: { ...(prev.incidentKnown ?? { date: '', time: '' }), date: value },
                          }))
                        }
                      />
                      <TimePicker
                        label="Incident time (exactly known)"
                        value={form.incidentKnown?.time ?? ''}
                        onChange={(value) =>
                          setForm((prev) => ({
                            ...prev,
                            incidentKnown: { ...(prev.incidentKnown ?? { date: '', time: '' }), time: value },
                          }))
                        }
                      />
                    </>
                  )}
                </div>

                {showIncidentDuration && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                    <DatePicker
                      label="Duration from — date"
                      value={form.incidentFrom?.date ?? ''}
                      onChange={(value) =>
                        setForm((prev) => ({
                          ...prev,
                          incidentFrom: { ...(prev.incidentFrom ?? { date: '', time: '' }), date: value },
                        }))
                      }
                    />
                    <TimePicker
                      label="Duration from — time"
                      value={form.incidentFrom?.time ?? ''}
                      onChange={(value) =>
                        setForm((prev) => ({
                          ...prev,
                          incidentFrom: { ...(prev.incidentFrom ?? { date: '', time: '' }), time: value },
                        }))
                      }
                    />
                    <DatePicker
                      label="Duration to — date"
                      value={form.incidentTo?.date ?? ''}
                      onChange={(value) =>
                        setForm((prev) => ({
                          ...prev,
                          incidentTo: { ...(prev.incidentTo ?? { date: '', time: '' }), date: value },
                        }))
                      }
                    />
                    <TimePicker
                      label="Duration to — time"
                      value={form.incidentTo?.time ?? ''}
                      onChange={(value) =>
                        setForm((prev) => ({
                          ...prev,
                          incidentTo: { ...(prev.incidentTo ?? { date: '', time: '' }), time: value },
                        }))
                      }
                    />
                    <div className="flex flex-col gap-1 min-w-0">
                      <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                        Duration (from → to)
                      </span>
                      <div className="min-h-10 flex items-center rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-800">
                        <span className="font-semibold font-mono tabular-nums">{incidentDuration}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-emerald-50/70 rounded-xl border border-emerald-200 p-4 sm:p-5 space-y-4">
            <h3 className="text-sm font-semibold text-gray-800">SOCO Officers</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <FormInput
                label="In-Charge Officer Name"
                value={form.inChargeOfficer.name}
                onChange={(e) => setForm((prev) => ({ ...prev, inChargeOfficer: { ...prev.inChargeOfficer, name: e.target.value } }))}
                placeholder="Name"
              />
              <FormInput
                label="In-Charge Reg. No"
                value={form.inChargeOfficer.regNo}
                onChange={(e) => setForm((prev) => ({ ...prev, inChargeOfficer: { ...prev.inChargeOfficer, regNo: e.target.value } }))}
                placeholder="Reg. No"
              />
              <FormInput
                label="In-Charge Rank"
                value={form.inChargeOfficer.rank}
                onChange={(e) => setForm((prev) => ({ ...prev, inChargeOfficer: { ...prev.inChargeOfficer, rank: e.target.value } }))}
                placeholder="Rank"
              />
            </div>

            <div className="space-y-4">
              {form.socoOfficers.map((officer, index) => {
                return (
                <div key={`officer-${index}`} className="flex flex-col gap-3 p-3 bg-rose-50/50 rounded-lg border border-rose-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Team Role</label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:items-end">
                        <div className="min-w-0">
                          <div className="grid w-full grid-cols-4 gap-x-2 sm:gap-x-3 min-h-10 items-center rounded-lg border border-gray-200 bg-gray-50/70 p-2">
                            {TEAM_ROLE_OPTIONS.map((option) => (
                              <label
                                key={option.value}
                                className="flex min-w-0 w-full items-center gap-2 text-sm text-gray-700 cursor-pointer"
                              >
                                <input
                                  type="radio"
                                  name={`team-role-${index}`}
                                  checked={(officer.teamRole ?? 'Other') === option.value}
                                  onChange={() =>
                                    updateOfficer(index, {
                                      teamRole: option.value,
                                      teamRoleOther: option.value === 'Other' ? (officer.teamRoleOther ?? '') : '',
                                    })
                                  }
                                  className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                                />
                                {option.label}
                              </label>
                            ))}
                          </div>
                        </div>
                        <div className="min-w-0 w-full">
                          {(officer.teamRole ?? 'Other') === 'Other' ? (
                            <FormInput
                              label="Other Team Role"
                              value={officer.teamRoleOther ?? ''}
                              onChange={(e) => updateOfficer(index, { teamRoleOther: e.target.value })}
                              placeholder="Specify team role"
                            />
                          ) : (
                            <div className="min-h-10" />
                          )}
                        </div>
                      </div>
                    </div>
                    <CustomSelect
                      label="SOCO Role"
                      value={officer.socoRole ?? 'Other'}
                      onChange={(value) => updateOfficer(index, { socoRole: value })}
                      options={SOCO_ROLE_OPTIONS}
                      placeholder="Select SOCO duty"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-[2fr,1fr,44px] gap-3 items-end">
                    <FormInput
                      label={`SOCO Officer Name`}
                      value={officer.name}
                      onChange={(e) => updateOfficer(index, { name: e.target.value })}
                      placeholder="Officer name"
                    />
                    <div className="grid grid-cols-2 gap-3 md:min-w-[280px]">
                      <FormInput
                        label="Reg. No"
                        value={officer.regNo}
                        onChange={(e) => updateOfficer(index, { regNo: e.target.value })}
                        placeholder="Reg. No"
                      />
                      <FormInput
                        label="Rank"
                        value={officer.rank}
                        onChange={(e) => updateOfficer(index, { rank: e.target.value })}
                        placeholder="Rank"
                      />
                    </div>
                    <IconButton
                      variant="danger"
                      onClick={() => setForm((prev) => ({ ...prev, socoOfficers: prev.socoOfficers.filter((_, i) => i !== index) }))}
                      disabled={form.socoOfficers.length <= 1}
                      className="h-10 w-full"
                      aria-label="Remove officer"
                    >
                      ×
                    </IconButton>
                  </div>
                </div>
              )})}
            </div>
            <AddRowButton onClick={() => setForm((prev) => ({ ...prev, socoOfficers: [...prev.socoOfficers, emptyOfficer()] }))}>
              Add SOCO Officer
            </AddRowButton>
          </div>

          <div className="bg-orange-50/65 rounded-xl border border-orange-200 p-4 sm:p-5 space-y-4">
            <h3 className="text-sm font-semibold text-gray-800">Expert Assistant</h3>
            <div className="space-y-4">
              {form.specialistTeams.map((team, index) => (
                <div key={`specialist-${index}`} className="p-4 bg-orange-50/50 border border-orange-200 rounded-xl space-y-3">
                  <div className="flex justify-between items-start">
                    <h4 className="text-sm font-medium text-gray-700">Team {index + 1}</h4>
                    <RemoveRowButton
                      onClick={() => setForm((prev) => ({ ...prev, specialistTeams: prev.specialistTeams.filter((_, i) => i !== index) }))}
                      disabled={form.specialistTeams.length <= 1}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <CustomSelect
                      label="Team Role"
                      value={team.role}
                      onChange={(value) => updateSpecialist(index, { role: value })}
                      options={SPECIALIST_ROLE_OPTIONS}
                      placeholder="Select role"
                    />
                    <TimePicker
                      label="In Time"
                      value={team.inTime ?? ''}
                      onChange={(value) => updateSpecialist(index, { inTime: value })}
                    />
                    <TimePicker
                      label="Out Time"
                      value={team.outTime ?? ''}
                      onChange={(value) => updateSpecialist(index, { outTime: value })}
                    />
                  </div>
                  
                  <div className="pt-2">
                    <h5 className="text-xs font-semibold text-gray-600 mb-2">Team Members</h5>
                    <div className="space-y-2">
                      {(team.members || []).map((member, mIndex) => (
                        <div key={`m-${mIndex}`} className="grid grid-cols-1 md:grid-cols-[1fr,2fr,44px] gap-2 items-end">
                          <CustomSelect
                            label={mIndex === 0 ? "Role" : ""}
                            value={member.role}
                            onChange={(value) => updateSpecialistMember(index, mIndex, { role: value })}
                            options={SPECIALIST_MEMBER_ROLE_OPTIONS}
                            placeholder="Role"
                          />
                          <FormInput
                            label={mIndex === 0 ? "Member Name" : ""}
                            value={member.name}
                            onChange={(e) => updateSpecialistMember(index, mIndex, { name: e.target.value })}
                            placeholder="Member name"
                          />
                          <IconButton
                            variant="danger"
                            onClick={() => removeSpecialistMember(index, mIndex)}
                            disabled={(team.members || []).length <= 1}
                            className="h-10"
                          >
                            ×
                          </IconButton>
                        </div>
                      ))}
                    </div>
                    <AddRowButton onClick={() => addSpecialistMember(index)} className="mt-2">
                      Add Member
                    </AddRowButton>
                  </div>
                </div>
              ))}
            </div>
            <AddRowButton
              onClick={() => setForm((prev) => ({ ...prev, specialistTeams: [...prev.specialistTeams, emptySpecialist()] }))}
            >
              Add Specialist Team
            </AddRowButton>
          </div>

          <div className="bg-fuchsia-50/65 rounded-xl border border-fuchsia-200 p-4 sm:p-5 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-semibold text-gray-800">Investigation Officer</h3>
            </div>
            <div className="space-y-3">
              {(form.investigationOfficers ?? []).map((officer, index) => (
                <div key={`inv-officer-${index}`} className="grid grid-cols-1 md:grid-cols-[1fr,44px] gap-3 items-end p-3 bg-white/70 rounded-lg border border-fuchsia-200">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <FormInput
                      label="Rank"
                      value={officer.rank ?? ''}
                      onChange={(e) => updateInvestigationOfficer(index, { rank: e.target.value })}
                      placeholder="Rank"
                    />
                    <FormInput
                      label="Reg. Number"
                      value={officer.regNo ?? ''}
                      onChange={(e) => updateInvestigationOfficer(index, { regNo: e.target.value })}
                      placeholder="Reg. No"
                    />
                    <FormInput
                      label="Name"
                      value={officer.name}
                      onChange={(e) => updateInvestigationOfficer(index, { name: e.target.value })}
                      placeholder="Officer name"
                    />
                  </div>
                  <RemoveRowButton
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        investigationOfficers: (prev.investigationOfficers ?? []).filter((_, i) => i !== index),
                      }))
                    }
                    disabled={(form.investigationOfficers ?? []).length <= 1}
                    aria-label="Remove investigation officer"
                  />
                </div>
              ))}
            </div>
            <AddRowButton
              onClick={() =>
                setForm((prev) => ({
                  ...prev,
                  investigationOfficers: [...(prev.investigationOfficers ?? []), emptyOfficer()],
                }))
              }
            >
              Add Investigation Officer
            </AddRowButton>
          </div>

          <div className="bg-yellow-50/70 rounded-xl border border-yellow-200 p-4 sm:p-5 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-semibold text-gray-800">Scene Guard</h3>
            </div>
            <div className="space-y-3">
              {(form.sceneGuards ?? []).map((guard, index) => (
                <div key={`snc-guard-${index}`} className="grid grid-cols-1 md:grid-cols-[1fr,44px] gap-3 items-end p-3 bg-white/70 rounded-lg border border-yellow-200">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <FormInput
                      label="Rank"
                      value={guard.rank ?? ''}
                      onChange={(e) => updateSceneGuard(index, { rank: e.target.value })}
                      placeholder="Rank"
                    />
                    <FormInput
                      label="Reg. Number"
                      value={guard.regNo ?? ''}
                      onChange={(e) => updateSceneGuard(index, { regNo: e.target.value })}
                      placeholder="Reg. No"
                    />
                    <FormInput
                      label="Name"
                      value={guard.name}
                      onChange={(e) => updateSceneGuard(index, { name: e.target.value })}
                      placeholder="Guard name"
                    />
                  </div>
                  <RemoveRowButton
                    onClick={() => setForm((prev) => ({ ...prev, sceneGuards: (prev.sceneGuards ?? []).filter((_, i) => i !== index) }))}
                    disabled={(form.sceneGuards ?? []).length <= 1}
                    aria-label="Remove guard"
                  />
                </div>
              ))}
            </div>
            <AddRowButton
              onClick={() => setForm((prev) => ({ ...prev, sceneGuards: [...(prev.sceneGuards ?? []), emptyOfficer()] }))}
            >
              Add Scene Guard
            </AddRowButton>
          </div>

          <div className="bg-orange-50/70 rounded-xl border border-orange-200 p-4 sm:p-5 space-y-4">
            <h3 className="text-sm font-semibold text-gray-800">Court Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="min-w-0">
                <span className="block text-sm font-semibold text-gray-700 mb-2">Court name</span>
                <CustomSelect
                  value={form.courtDetails?.courtName ?? ''}
                  onChange={(value) =>
                    setForm((prev) => ({
                      ...prev,
                      courtDetails: {
                        ...emptyCrimeSceneCourtDetails(),
                        ...prev.courtDetails,
                        courtName: value,
                      },
                    }))
                  }
                  options={[{ value: '', label: 'Select court name' }, ...COURT_DETAILS_NAME_OPTIONS]}
                  placeholder="Select court name"
                  searchable
                  searchPlaceholder="Search court name"
                />
              </div>
              <div className="min-w-0">
                <FormInput
                  label="Court case number"
                  value={form.courtDetails?.courtCaseNo ?? ''}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      courtDetails: {
                        ...emptyCrimeSceneCourtDetails(),
                        ...prev.courtDetails,
                        courtCaseNo: e.target.value,
                      },
                    }))
                  }
                  placeholder="Enter court case number"
                />
              </div>
              <div className="min-w-0">
                <FormInput
                  label="B number"
                  value={form.courtDetails?.bNumber ?? ''}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      courtDetails: {
                        ...emptyCrimeSceneCourtDetails(),
                        ...prev.courtDetails,
                        bNumber: e.target.value,
                      },
                    }))
                  }
                  placeholder="Enter B number"
                />
              </div>
            </div>
          </div>

          <div className="bg-amber-50/70 rounded-xl border border-amber-200 p-4 sm:p-5 space-y-4">
            <h3 className="text-sm font-semibold text-gray-800">Production details</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-start">
              <div>
                <span className="block text-sm font-semibold text-gray-700 mb-2">Production Availability</span>
                <div className="flex flex-wrap gap-4 items-center rounded-lg border border-amber-200 bg-amber-50/70 px-3 py-2">
                  {(['Yes', 'No'] as const).map((opt) => (
                    <label key={opt} className="inline-flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="radio"
                        name="modalCourtProductionPR"
                        checked={(form.courtDetails?.productionPR ?? '') === opt}
                        onChange={() =>
                          setForm((prev) => ({
                            ...prev,
                            courtDetails: {
                              ...emptyCrimeSceneCourtDetails(),
                              ...prev.courtDetails,
                              productionPR: opt,
                              ...(opt === 'No'
                                ? {
                                    productionPRTypes: [],
                                    productionPROtherDetail: '',
                                    productionSentToCourtRows: [],
                                    sentToAnalysisRows: [],
                                  }
                                : {}),
                            },
                          }))
                        }
                        className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      {opt}
                    </label>
                  ))}
                </div>
              </div>
              {form.courtDetails?.productionPR === 'Yes' ? (
                <>
                  <div
                    className={
                      productionPRHasOthersSelected(form.courtDetails?.productionPRTypes)
                        ? ''
                        : 'md:col-span-2'
                    }
                  >
                    <MultiSelect
                      label="Production types"
                      labelClassName="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1"
                      optionRowClassName="text-[15px] leading-relaxed text-gray-800"
                      value={form.courtDetails?.productionPRTypes ?? []}
                      onChange={(next) => {
                        const sel = new Set(next);
                        setForm((prev) => ({
                          ...prev,
                          courtDetails: {
                            ...emptyCrimeSceneCourtDetails(),
                            ...prev.courtDetails,
                            productionPRTypes: next,
                            ...(!next.includes(PRODUCTION_PR_OTHERS_VALUE)
                              ? { productionPROtherDetail: '' }
                              : {}),
                            productionSentToCourtRows: (
                              prev.courtDetails?.productionSentToCourtRows ?? []
                            ).filter((row) => sel.has(row.productionRef)),
                            sentToAnalysisRows: (prev.courtDetails?.sentToAnalysisRows ?? []).filter((row) =>
                              sel.has(row.productionRef),
                            ),
                          },
                        }));
                      }}
                      options={PRODUCTION_PR_OPTIONS}
                      placeholder="Select one or more"
                    />
                  </div>
                  {productionPRHasOthersSelected(form.courtDetails?.productionPRTypes) ? (
                    <FormInput
                      label={`${PRODUCTION_PR_OTHERS_VALUE} — specify`}
                      value={form.courtDetails?.productionPROtherDetail ?? ''}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          courtDetails: {
                            ...emptyCrimeSceneCourtDetails(),
                            ...prev.courtDetails,
                            productionPROtherDetail: e.target.value,
                          },
                        }))
                      }
                      placeholder="Describe other items"
                    />
                  ) : null}
                </>
              ) : null}
            </div>
            {form.courtDetails?.productionPR === 'Yes' && (form.courtDetails?.productionPRTypes ?? []).length > 0 ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50/60 px-3 py-2.5">
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Selected production types</p>
                <div className="flex flex-wrap gap-1.5">
                  {(form.courtDetails?.productionPRTypes ?? []).map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center rounded-full border border-amber-200 bg-white px-2.5 py-0.5 text-xs font-medium text-amber-900"
                    >
                      {getProductionPRDisplayLabel(t)}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
            <div className="space-y-3 pt-2 border-t border-gray-100">
              <h3 className="text-sm font-semibold text-gray-800">Productions sent to analysis institutes</h3>
              {!(form.courtDetails?.productionPRTypes ?? []).length ? (
                <p className="text-xs text-gray-500">Select production types under Production Availability first.</p>
              ) : null}
              <div className="space-y-4">
                {(form.courtDetails?.sentToAnalysisRows ?? []).map((row, index) => (
                  <div
                    key={`m-an-${index}`}
                    className="rounded-lg border border-sky-200 bg-white p-4 shadow-sm space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-sky-100 pb-3 min-h-10">
                      <p className="text-sm font-semibold text-sky-900">
                        Production {String(index + 1).padStart(2, '0')}
                      </p>
                      <RemoveRowButton
                        onClick={() =>
                          setForm((prev) => ({
                            ...prev,
                            courtDetails: {
                              ...emptyCrimeSceneCourtDetails(),
                              ...prev.courtDetails,
                              sentToAnalysisRows: (prev.courtDetails?.sentToAnalysisRows ?? []).filter(
                                (_, i) => i !== index,
                              ),
                            },
                          }))
                        }
                        className="h-9 shrink-0 px-3 text-xs"
                        aria-label={`Remove Production ${String(index + 1).padStart(2, '0')}`}
                      />
                    </div>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1.2fr)_auto] md:items-end">
                      <div className="min-w-0">
                        <span className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                          Production type
                        </span>
                        <CustomSelect
                          value={row.productionRef}
                          onChange={(value) =>
                            setForm((prev) => {
                              const rows = [...(prev.courtDetails?.sentToAnalysisRows ?? [])];
                              rows[index] = {
                                ...rows[index],
                                productionRef: value,
                                sentToAnalysis: '',
                                institution: '',
                                institutionOtherDetail: '',
                                date: '',
                                refNo: '',
                              };
                              return {
                                ...prev,
                                courtDetails: {
                                  ...emptyCrimeSceneCourtDetails(),
                                  ...prev.courtDetails,
                                  sentToAnalysisRows: rows,
                                },
                              };
                            })
                          }
                          options={productionOptionsForSelection(form.courtDetails?.productionPRTypes)}
                          placeholder="Select production"
                          searchable
                          searchPlaceholder="Search…"
                        />
                      </div>
                      <div>
                        <span className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                          Sent for analysis?
                        </span>
                        <div className="flex flex-wrap gap-3 min-h-10 items-center rounded-lg border border-gray-200 bg-white px-3 py-2">
                          {(['Yes', 'No'] as const).map((opt) => (
                            <label key={opt} className="inline-flex items-center gap-2 text-sm text-gray-700">
                              <input
                                type="radio"
                                name={`m-production-sent-analysis-${index}`}
                                checked={(row.sentToAnalysis ?? '') === opt}
                                onChange={() =>
                                  setForm((prev) => {
                                    const rows = [...(prev.courtDetails?.sentToAnalysisRows ?? [])];
                                    rows[index] =
                                      opt === 'Yes'
                                        ? { ...rows[index], sentToAnalysis: 'Yes' }
                                        : {
                                            ...rows[index],
                                            sentToAnalysis: 'No',
                                            institution: '',
                                            institutionOtherDetail: '',
                                            date: '',
                                            refNo: '',
                                          };
                                    return {
                                      ...prev,
                                      courtDetails: {
                                        ...emptyCrimeSceneCourtDetails(),
                                        ...prev.courtDetails,
                                        sentToAnalysisRows: rows,
                                      },
                                    };
                                  })
                                }
                                className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                              />
                              {opt}
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                    {row.sentToAnalysis === 'Yes' ? (
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-3 md:items-start">
                        <div className="min-w-0">
                          <span className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                            Institution
                          </span>
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                            <div className="min-w-0 flex-1">
                              <CustomSelect
                                value={row.institution ?? ''}
                                onChange={(value) =>
                                  setForm((prev) => {
                                    const rows = [...(prev.courtDetails?.sentToAnalysisRows ?? [])];
                                    rows[index] = {
                                      ...rows[index],
                                      institution: value,
                                      institutionOtherDetail: analysisInstitutionIsOthers(value)
                                        ? rows[index].institutionOtherDetail
                                        : '',
                                    };
                                    return {
                                      ...prev,
                                      courtDetails: {
                                        ...emptyCrimeSceneCourtDetails(),
                                        ...prev.courtDetails,
                                        sentToAnalysisRows: rows,
                                      },
                                    };
                                  })
                                }
                                options={ANALYSIS_INSTITUTION_OPTIONS}
                                placeholder="Select institute"
                                searchable
                                searchPlaceholder="Search…"
                              />
                            </div>
                            {analysisInstitutionIsOthers(row.institution) ? (
                              <div className="min-w-0 flex-1">
                                <FormInput
                                  label=""
                                  value={row.institutionOtherDetail ?? ''}
                                  onChange={(e) =>
                                    setForm((prev) => {
                                      const rows = [...(prev.courtDetails?.sentToAnalysisRows ?? [])];
                                      rows[index] = { ...rows[index], institutionOtherDetail: e.target.value };
                                      return {
                                        ...prev,
                                        courtDetails: {
                                          ...emptyCrimeSceneCourtDetails(),
                                          ...prev.courtDetails,
                                          sentToAnalysisRows: rows,
                                        },
                                      };
                                    })
                                  }
                                  placeholder="Specify institute"
                                  aria-label="Institution (other)"
                                />
                              </div>
                            ) : null}
                          </div>
                        </div>
                        <div className="min-w-0">
                          <span className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                            Date (DD/MM/YY)
                          </span>
                          <DatePicker
                            value={row.date ?? ''}
                            onChange={(value) =>
                              setForm((prev) => {
                                const rows = [...(prev.courtDetails?.sentToAnalysisRows ?? [])];
                                rows[index] = { ...rows[index], date: value };
                                return {
                                  ...prev,
                                  courtDetails: {
                                    ...emptyCrimeSceneCourtDetails(),
                                    ...prev.courtDetails,
                                    sentToAnalysisRows: rows,
                                  },
                                };
                              })
                            }
                          />
                        </div>
                        <div className="min-w-0">
                          <FormInput
                            label="Ref. no."
                            value={row.refNo ?? ''}
                            onChange={(e) =>
                              setForm((prev) => {
                                const rows = [...(prev.courtDetails?.sentToAnalysisRows ?? [])];
                                rows[index] = { ...rows[index], refNo: e.target.value };
                                return {
                                  ...prev,
                                  courtDetails: {
                                    ...emptyCrimeSceneCourtDetails(),
                                    ...prev.courtDetails,
                                    sentToAnalysisRows: rows,
                                  },
                                };
                              })
                            }
                            placeholder="Reference number"
                          />
                        </div>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
              <Button
                variant="teal-outline"
                disabled={!(form.courtDetails?.productionPRTypes ?? []).length}
                onClick={() =>
                  setForm((prev) => ({
                    ...prev,
                    courtDetails: {
                      ...emptyCrimeSceneCourtDetails(),
                      ...prev.courtDetails,
                      sentToAnalysisRows: [
                        ...(prev.courtDetails?.sentToAnalysisRows ?? []),
                        emptySentToAnalysisRow(),
                      ],
                    },
                  }))
                }
              >
                Add analysis institute row
              </Button>
            </div>
          </div>

            <div className="space-y-3 pt-2 border-t border-gray-100">
              <h3 className="text-sm font-semibold text-gray-800">Production sent to court</h3>
              {!(form.courtDetails?.productionPRTypes ?? []).length ? (
                <p className="text-xs text-gray-500">Select production types under Production Availability first.</p>
              ) : null}
              <div className="space-y-4">
                {(form.courtDetails?.productionSentToCourtRows ?? []).map((row, index) => (
                  <div
                    key={`m-court-${index}`}
                    className="rounded-lg border border-teal-200 bg-white p-4 shadow-sm space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-teal-100 pb-3 min-h-10">
                      <p className="text-sm font-semibold text-teal-900">
                        Production {String(index + 1).padStart(2, '0')}
                      </p>
                      <RemoveRowButton
                        onClick={() =>
                          setForm((prev) => ({
                            ...prev,
                            courtDetails: {
                              ...emptyCrimeSceneCourtDetails(),
                              ...prev.courtDetails,
                              productionSentToCourtRows: (prev.courtDetails?.productionSentToCourtRows ?? []).filter(
                                (_, i) => i !== index,
                              ),
                            },
                          }))
                        }
                        className="h-9 shrink-0 px-3 text-xs"
                        aria-label={`Remove Production ${String(index + 1).padStart(2, '0')}`}
                      />
                    </div>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1.2fr)_auto] md:items-end">
                      <div className="min-w-0">
                        <span className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                          Production type
                        </span>
                        <CustomSelect
                          value={row.productionRef}
                          onChange={(value) =>
                            setForm((prev) => {
                              const rows = [...(prev.courtDetails?.productionSentToCourtRows ?? [])];
                              rows[index] = {
                                ...rows[index],
                                productionRef: value,
                                sentToCourt: '',
                                date: '',
                                courtName: '',
                                courtCaseNo: '',
                              };
                              return {
                                ...prev,
                                courtDetails: {
                                  ...emptyCrimeSceneCourtDetails(),
                                  ...prev.courtDetails,
                                  productionSentToCourtRows: rows,
                                },
                              };
                            })
                          }
                          options={productionOptionsForSelection(form.courtDetails?.productionPRTypes)}
                          placeholder="Select production"
                          searchable
                          searchPlaceholder="Search…"
                        />
                      </div>
                      <div>
                        <span className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                          Sent to court?
                        </span>
                        <div className="flex flex-wrap gap-3 min-h-10 items-center rounded-lg border border-gray-200 bg-white px-3 py-2">
                          {(['Yes', 'No'] as const).map((opt) => (
                            <label key={opt} className="inline-flex items-center gap-2 text-sm text-gray-700">
                              <input
                                type="radio"
                                name={`m-production-sent-court-${index}`}
                                checked={(row.sentToCourt ?? '') === opt}
                                onChange={() =>
                                  setForm((prev) => {
                                    const rows = [...(prev.courtDetails?.productionSentToCourtRows ?? [])];
                                    rows[index] =
                                      opt === 'Yes'
                                        ? { ...rows[index], sentToCourt: 'Yes' }
                                        : {
                                            ...rows[index],
                                            sentToCourt: 'No',
                                            date: '',
                                            courtName: '',
                                            courtCaseNo: '',
                                          };
                                    return {
                                      ...prev,
                                      courtDetails: {
                                        ...emptyCrimeSceneCourtDetails(),
                                        ...prev.courtDetails,
                                        productionSentToCourtRows: rows,
                                      },
                                    };
                                  })
                                }
                                className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                              />
                              {opt}
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                    {row.sentToCourt === 'Yes' ? (
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-3 md:items-start">
                        <div>
                          <span className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                            Date (DD/MM/YY)
                          </span>
                          <DatePicker
                            value={row.date ?? ''}
                            onChange={(value) =>
                              setForm((prev) => {
                                const rows = [...(prev.courtDetails?.productionSentToCourtRows ?? [])];
                                rows[index] = { ...rows[index], date: value };
                                return {
                                  ...prev,
                                  courtDetails: {
                                    ...emptyCrimeSceneCourtDetails(),
                                    ...prev.courtDetails,
                                    productionSentToCourtRows: rows,
                                  },
                                };
                              })
                            }
                          />
                        </div>
                        <div className="min-w-0">
                          <span className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                            Court name (optional)
                          </span>
                          <CustomSelect
                            value={row.courtName ?? ''}
                            onChange={(value) =>
                              setForm((prev) => {
                                const rows = [...(prev.courtDetails?.productionSentToCourtRows ?? [])];
                                rows[index] = { ...rows[index], courtName: value };
                                return {
                                  ...prev,
                                  courtDetails: {
                                    ...emptyCrimeSceneCourtDetails(),
                                    ...prev.courtDetails,
                                    productionSentToCourtRows: rows,
                                  },
                                };
                              })
                            }
                            options={COURT_NAME_OPTIONAL_SELECT_OPTIONS}
                            placeholder="Select court (optional)"
                            searchable
                            searchPlaceholder="Search…"
                          />
                        </div>
                        <FormInput
                          label="Case no. (optional)"
                          value={row.courtCaseNo ?? ''}
                          onChange={(e) =>
                            setForm((prev) => {
                              const rows = [...(prev.courtDetails?.productionSentToCourtRows ?? [])];
                              rows[index] = { ...rows[index], courtCaseNo: e.target.value };
                              return {
                                ...prev,
                                courtDetails: {
                                  ...emptyCrimeSceneCourtDetails(),
                                  ...prev.courtDetails,
                                  productionSentToCourtRows: rows,
                                },
                              };
                            })
                          }
                          placeholder="Case number"
                        />
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
              <Button
                variant="teal-outline"
                disabled={!(form.courtDetails?.productionPRTypes ?? []).length}
                onClick={() =>
                  setForm((prev) => ({
                    ...prev,
                    courtDetails: {
                      ...emptyCrimeSceneCourtDetails(),
                      ...prev.courtDetails,
                      productionSentToCourtRows: [
                        ...(prev.courtDetails?.productionSentToCourtRows ?? []),
                        emptyProductionSentToCourtRow(),
                      ],
                    },
                  }))
                }
              >
                Add production sent to court
              </Button>
            </div>

          <div className="bg-red-50/65 rounded-xl border border-red-200 p-4 sm:p-5 space-y-2">
            <h3 className="text-sm font-semibold text-gray-800">Photo ZIP Attachment</h3>
            <input
              type="file"
              accept=".zip,application/zip,application/x-zip-compressed"
              onChange={(e) => {
                const fileName = e.target.files?.[0]?.name ?? '';
                setForm((prev) => ({ ...prev, photoZipName: fileName }));
              }}
              className="w-full text-sm text-gray-700 file:mr-3 file:rounded-md file:border-0 file:bg-blue-50 file:text-blue-700 file:px-3 file:py-2 hover:file:bg-blue-100"
            />
            {form.photoZipName ? <p className="text-xs text-gray-500">Selected: {form.photoZipName}</p> : null}

            <div className="pt-2">
              <h4 className="text-sm font-semibold text-gray-800 mb-2">Sketch Upload</h4>
              <input
                type="file"
                onChange={(e) => {
                  const fileName = e.target.files?.[0]?.name ?? '';
                  setForm((prev) => ({ ...prev, sketchFileName: fileName }));
                }}
                className="w-full text-sm text-gray-700 file:mr-3 file:rounded-md file:border-0 file:bg-blue-50 file:text-blue-700 file:px-3 file:py-2 hover:file:bg-blue-100"
              />
              {form.sketchFileName ? <p className="text-xs text-gray-500">Selected: {form.sketchFileName}</p> : null}
            </div>

            <div className="pt-2">
              <h4 className="text-sm font-semibold text-gray-800 mb-2">Report Upload</h4>
              <input
                type="file"
                onChange={(e) => {
                  const fileName = e.target.files?.[0]?.name ?? '';
                  setForm((prev) => ({ ...prev, reportFileName: fileName }));
                }}
                className="w-full text-sm text-gray-700 file:mr-3 file:rounded-md file:border-0 file:bg-blue-50 file:text-blue-700 file:px-3 file:py-2 hover:file:bg-blue-100"
              />
              {form.reportFileName ? <p className="text-xs text-gray-500">Selected: {form.reportFileName}</p> : null}
            </div>
          </div>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}
        </div>

        <div className="border-t border-gray-200 bg-gray-50/70 px-6 py-4 flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="success" onClick={handleSave}>Save Crime Scene</Button>
        </div>
      </div>
    </div>
  );
}
