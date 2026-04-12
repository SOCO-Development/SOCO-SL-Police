'use client';

import { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import CustomSelect from '@/components/forms/CustomSelect';
import DatePicker from '@/components/forms/DatePicker';
import TimePicker from '@/components/forms/TimePicker';
import FormInput from '@/components/forms/FormInput';
import Button from '@/components/buttons/Button';
import { crimeVisitService } from '@/lib/crimeVisitService';
import { crimeSceneService } from '@/lib/crimeSceneService';
import { COURT_NAME_OPTIONS } from '@/lib/courtNames';
import {
  ANALYSIS_INSTITUTION_OPTIONS,
  analysisInstitutionIsOthers,
} from '@/lib/analysisInstitutions';
import MultiSelect from '@/components/forms/MultiSelect';
import {
  PRODUCTION_PR_OPTIONS,
  PRODUCTION_PR_OTHERS_VALUE,
  productionOptionsForSelection,
  productionPRHasOthersSelected,
} from '@/lib/productionPROptions';
import { formatDateTimeDDMMYYYY, formatIncidentDuration, parseDateTimeParts } from '@/lib/dateUtils';
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

const POLICE_STATIONS = [
  'Colombo Fort Police Station',
  'Borella Police Station',
  'Kandy Police Station',
  'Galle Police Station',
  'Kurunegala Police Station',
  'Jaffna Police Station',
].map((v) => ({ value: v, label: v }));

const DIVISIONS = [
  'Colombo Division',
  'Kandy Division',
  'Gampaha Division',
  'Kalutara Division',
  'Galle Division',
  'Kurunegala Division',
].map((v) => ({ value: v, label: v }));

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
  { value: 'COURT_VISIT', label: 'Court Visit' },
  { value: 'REVISIT', label: 'Revisit' },
];

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
    if (crimeSceneUsesNewVisitFields(form.visitType) && !form.visitId) return 'Please select a Visit ID.';
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
    const known = form.incidentKnown ?? { date: '', time: '' };
    if (!known.date?.trim() || !known.time?.trim()) {
      return 'Please enter the exactly known date and time of the incident.';
    }
    if (!parseDateTimeParts(known)) return 'Invalid date or time for the incident.';
    const incFrom = form.incidentFrom ?? { date: '', time: '' };
    const incTo = form.incidentTo ?? { date: '', time: '' };
    if (!incFrom.date?.trim() || !incFrom.time?.trim()) {
      return 'Please enter duration start: date and time (from).';
    }
    if (!incTo.date?.trim() || !incTo.time?.trim()) {
      return 'Please enter duration end: date and time (to).';
    }
    const fromD = parseDateTimeParts(incFrom);
    const toD = parseDateTimeParts(incTo);
    if (!fromD || !toD) return 'Invalid incidence date or time.';
    if (toD.getTime() < fromD.getTime()) {
      return 'Incidence end date and time must be the same as or after the start.';
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
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Create Crime Scene</h2>
            <p className="text-xs text-gray-600 mt-0.5">Attach scenes to morning visits and save each scene with a CVR.</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 p-1 rounded transition-colors" aria-label="Close modal">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <CustomSelect
              label="Visit Type"
              value={form.visitType}
              onChange={(value) => setForm((prev) => ({ ...prev, visitType: value as CrimeSceneVisitType }))}
              options={VISIT_TYPES}
              placeholder="Select visit type"
            />

            {crimeSceneUsesNewVisitFields(form.visitType) ? (
              <CustomSelect
                label="Visit ID with Date"
                value={form.visitId}
                onChange={(value) => setForm((prev) => ({ ...prev, visitId: value }))}
                options={visitOptions}
                placeholder={visitOptions.length ? 'Select initiated visit' : 'No visits found'}
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

            <CustomSelect
              label="Police Division"
              value={form.division}
              onChange={(value) => setForm((prev) => ({ ...prev, division: value }))}
              options={DIVISIONS}
              placeholder="Select police division"
            />

            <CustomSelect
              label="Requested Police Station"
              value={form.policeStation}
              onChange={(value) => setForm((prev) => ({ ...prev, policeStation: value }))}
              options={POLICE_STATIONS}
              placeholder="Select police station"
            />
          </div>

          {crimeSceneUsesNewVisitFields(form.visitType) ? (
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
              <FormInput
                label="CVR Number (Format: SOCO Lab Name/Number/Year e.g. Ampara/01/2026)"
                value={form.cvrNo ?? ''}
                onChange={(e) => setForm((prev) => ({ ...prev, cvrNo: e.target.value }))}
                placeholder="Ampara/01/2026"
              />
            </div>
          ) : null}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 space-y-4">
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

            <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 space-y-4">
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
                <div className="grid grid-cols-2 gap-3">
                  <DatePicker
                    label="Incident date (known)"
                    value={form.incidentKnown?.date ?? ''}
                    onChange={(value) =>
                      setForm((prev) => ({
                        ...prev,
                        incidentKnown: { ...(prev.incidentKnown ?? { date: '', time: '' }), date: value },
                      }))
                    }
                  />
                  <TimePicker
                    label="Incident time (known)"
                    value={form.incidentKnown?.time ?? ''}
                    onChange={(value) =>
                      setForm((prev) => ({
                        ...prev,
                        incidentKnown: { ...(prev.incidentKnown ?? { date: '', time: '' }), time: value },
                      }))
                    }
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
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
                </div>
                <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-800">
                  Duration (from → to): <span className="font-semibold font-mono tabular-nums">{incidentDuration}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
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
                <div key={`officer-${index}`} className="flex flex-col gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
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
                    <button
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, socoOfficers: prev.socoOfficers.filter((_, i) => i !== index) }))}
                      className="h-10 w-full flex items-center justify-center text-red-500 hover:text-red-700 disabled:opacity-40"
                      disabled={form.socoOfficers.length <= 1}
                      aria-label="Remove officer"
                    >
                      ×
                    </button>
                  </div>
                </div>
              )})}
            </div>
            <Button
              variant="secondary"
              onClick={() => setForm((prev) => ({ ...prev, socoOfficers: [...prev.socoOfficers, emptyOfficer()] }))}
            >
              Add SOCO Officer
            </Button>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
            <h3 className="text-sm font-semibold text-gray-800">Expert Assistant</h3>
            <div className="space-y-4">
              {form.specialistTeams.map((team, index) => (
                <div key={`specialist-${index}`} className="p-4 bg-gray-50 border border-gray-100 rounded-xl space-y-3">
                  <div className="flex justify-between items-start">
                    <h4 className="text-sm font-medium text-gray-700">Team {index + 1}</h4>
                    <button
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, specialistTeams: prev.specialistTeams.filter((_, i) => i !== index) }))}
                      className="text-red-500 hover:text-red-700 disabled:opacity-40"
                      disabled={form.specialistTeams.length <= 1}
                    >
                      Remove Team
                    </button>
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
                          <button
                            type="button"
                            onClick={() => removeSpecialistMember(index, mIndex)}
                            className="h-10 text-red-500 hover:text-red-700 disabled:opacity-40"
                            disabled={(team.members || []).length <= 1}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => addSpecialistMember(index)}
                      className="mt-2 text-xs text-blue-600 font-medium hover:text-blue-800"
                    >
                      + Add Member
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <Button
              variant="secondary"
              onClick={() => setForm((prev) => ({ ...prev, specialistTeams: [...prev.specialistTeams, emptySpecialist()] }))}
            >
              Add Specialist Team
            </Button>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-semibold text-gray-800">Investigation Officer</h3>
            </div>
            <div className="space-y-3">
              {(form.investigationOfficers ?? []).map((officer, index) => (
                <div key={`inv-officer-${index}`} className="grid grid-cols-1 md:grid-cols-[1fr,44px] gap-3 items-end p-3 bg-gray-50 rounded-lg border border-gray-100">
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
                  <button
                    type="button"
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        investigationOfficers: (prev.investigationOfficers ?? []).filter((_, i) => i !== index),
                      }))
                    }
                    className="h-10 text-red-500 hover:text-red-700 disabled:opacity-40"
                    disabled={(form.investigationOfficers ?? []).length <= 1}
                    aria-label="Remove investigation officer"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <Button
              variant="secondary"
              onClick={() =>
                setForm((prev) => ({
                  ...prev,
                  investigationOfficers: [...(prev.investigationOfficers ?? []), emptyOfficer()],
                }))
              }
            >
              Add Investigation Officer
            </Button>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-semibold text-gray-800">Scene Guard</h3>
            </div>
            <div className="space-y-3">
              {(form.sceneGuards ?? []).map((guard, index) => (
                <div key={`snc-guard-${index}`} className="grid grid-cols-1 md:grid-cols-[1fr,44px] gap-3 items-end p-3 bg-gray-50 rounded-lg border border-gray-100">
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
                  <button
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, sceneGuards: (prev.sceneGuards ?? []).filter((_, i) => i !== index) }))}
                    className="h-10 text-red-500 hover:text-red-700 disabled:opacity-40"
                    disabled={(form.sceneGuards ?? []).length <= 1}
                    aria-label="Remove guard"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <Button
              variant="secondary"
              onClick={() => setForm((prev) => ({ ...prev, sceneGuards: [...(prev.sceneGuards ?? []), emptyOfficer()] }))}
            >
              Add Scene Guard
            </Button>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
            <h3 className="text-sm font-semibold text-gray-800">Court details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <span className="block text-sm font-semibold text-gray-700 mb-2">Court name (optional)</span>
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
                  options={COURT_NAME_OPTIONS}
                  placeholder="Select court"
                  searchable
                  searchPlaceholder="Search court…"
                />
              </div>
              <FormInput
                label="Court case no. (optional)"
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
                placeholder="Type case number if known"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-start">
              <div>
                <span className="block text-sm font-semibold text-gray-700 mb-2">Production (P.R.)</span>
                <div className="flex flex-wrap gap-4 items-center rounded-lg border border-gray-200 bg-gray-50/80 px-3 py-2">
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
            <div className="space-y-3 pt-2 border-t border-gray-100">
              <h3 className="text-sm font-semibold text-gray-800">Production sent to court</h3>
              {!(form.courtDetails?.productionPRTypes ?? []).length ? (
                <p className="text-xs text-gray-500">Select production types under Production (P.R.) first.</p>
              ) : null}
              <div className="divide-y divide-gray-200">
                {(form.courtDetails?.productionSentToCourtRows ?? []).map((row, index) => (
                  <div
                    key={`m-court-${index}`}
                    className="grid grid-cols-1 gap-3 py-4 first:pt-0 md:grid-cols-[1fr_1fr_1fr_auto] md:items-end"
                  >
                    <div>
                      <span className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Production</span>
                      <CustomSelect
                        value={row.productionRef}
                        onChange={(value) =>
                          setForm((prev) => {
                            const rows = [...(prev.courtDetails?.productionSentToCourtRows ?? [])];
                            rows[index] = { ...rows[index], productionRef: value };
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
                      <span className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Date (DD/MM/YY)</span>
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
                    <FormInput
                      label="Court case no."
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
                    <button
                      type="button"
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
                      className="h-10 rounded-lg border border-red-200 bg-red-50 px-3 text-red-600 text-xs font-semibold self-end"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
              <Button
                variant="secondary"
                type="button"
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
                + Add production sent to court
              </Button>
            </div>

            <div className="space-y-3 pt-2 border-t border-gray-100">
              <h3 className="text-sm font-semibold text-gray-800">Sent to analysis institute</h3>
              {!(form.courtDetails?.productionPRTypes ?? []).length ? (
                <p className="text-xs text-gray-500">Select production types under Production (P.R.) first.</p>
              ) : null}
              <div className="divide-y divide-gray-200">
                {(form.courtDetails?.sentToAnalysisRows ?? []).map((row, index) => (
                  <div
                    key={`m-an-${index}`}
                    className="grid grid-cols-1 gap-3 py-4 first:pt-0 md:grid-cols-[1fr_1fr_1fr_1fr_auto] md:items-end"
                  >
                    <div>
                      <span className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Production</span>
                      <CustomSelect
                        value={row.productionRef}
                        onChange={(value) =>
                          setForm((prev) => {
                            const rows = [...(prev.courtDetails?.sentToAnalysisRows ?? [])];
                            rows[index] = { ...rows[index], productionRef: value };
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
                    <div>
                      <span className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Date (DD/MM/YY)</span>
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
                    <button
                      type="button"
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
                      className="h-10 rounded-lg border border-red-200 bg-red-50 px-3 text-red-600 text-xs font-semibold self-end"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
              <Button
                variant="secondary"
                type="button"
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
                + Add analysis institute row
              </Button>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-2">
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

        <div className="border-t border-gray-200 bg-gray-50 px-6 py-4 flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="success" onClick={handleSave}>Save Crime Scene</Button>
        </div>
      </div>
    </div>
  );
}
