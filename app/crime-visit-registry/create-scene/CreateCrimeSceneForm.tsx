'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
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
import type { CrimeVisit } from '@/types/crimeVisit';
import DatePicker from '@/components/forms/DatePicker';
import TimePicker from '@/components/forms/TimePicker';
import CustomSelect from '@/components/forms/CustomSelect';
import MultiSelect from '@/components/forms/MultiSelect';
import Button from '@/components/buttons/Button';
import { crimeVisitService } from '@/lib/crimeVisitService';
import { crimeSceneService } from '@/lib/crimeSceneService';
import {
  buildCrimeScenePayloadFromForm,
  crimeSceneToFormData,
  validateIncidentTimingSection,
} from '@/lib/crimeSceneFormMapping';
import { COURT_NAME_OPTIONS } from '@/lib/courtNames';
import {
  ANALYSIS_INSTITUTION_OPTIONS,
  analysisInstitutionIsOthers,
} from '@/lib/analysisInstitutions';
import {
  PRODUCTION_PR_OPTIONS,
  PRODUCTION_PR_OTHERS_VALUE,
  productionOptionsForSelection,
  productionPRHasOthersSelected,
} from '@/lib/productionPROptions';
import { formatDateTimeDDMMYYYY, formatIncidentDuration } from '@/lib/dateUtils';

interface CreateCrimeSceneFormProps {
  onSaved?: (payload: { cvrNo: string }) => void;
  onCancel?: () => void;
  /** Edit an existing submitted scene (requires amendment flow). */
  editSceneId?: string;
  /** When true with editSceneId, save calls submitRevisionForApproval. */
  amendmentMode?: boolean;
  /** Scroll to section after load (edit flows). */
  focusSection?: 'investigation' | 'court';
}

// ─── UI Helper Components ─────────────────────────────────────────────────────

interface FieldGroupProps {
  label: string;
  children: React.ReactNode;
  className?: string;
}
function FieldGroup({ label, children, className = '' }: FieldGroupProps) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">{label}</label>
      {children}
    </div>
  );
}

interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  isReadOnly?: boolean;
}
function TextInput({ isReadOnly, className = '', ...props }: TextInputProps) {
  return (
    <input
      {...props}
      readOnly={isReadOnly}
      className={`w-full min-h-10 px-3 py-2 text-sm rounded-lg border ${
        isReadOnly
          ? 'bg-gray-50 border-gray-200 text-gray-500 cursor-not-allowed'
          : 'bg-white border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-gray-400'
      } transition-colors ${className}`}
    />
  );
}

// ─── Constants ────────────────────────────────────────────────────────────────

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

const OFFENCE_TYPES = [
  { value: 'D', label: 'D' },
  { value: 'GCR', label: 'GCR' },
  { value: 'Other', label: 'Other' },
];

const VISIT_TYPES: { value: CrimeSceneVisitType; label: string }[] = [
  { value: 'NEW_VISIT', label: 'New Crime Scene' },
  { value: 'COURT_VISIT', label: 'Court Visit' },
  { value: 'REVISIT', label: 'Revisit' },
];

const SPECIALIST_ROLE_OPTIONS = [
  'Magistrate', 'GAD', 'JMO', 'Finger Print', 'Kannel',
  'Foreign Investigation Officers', 'Others',
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

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
    offence: [],
    offenceType: '',
    offenceTypeOther: '',
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
  if (diff < 0) diff += 24 * 60;
  return `${Math.floor(diff / 60)}h ${diff % 60}m`;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CreateCrimeSceneForm({
  onSaved,
  onCancel,
  editSceneId,
  amendmentMode = false,
  focusSection,
}: CreateCrimeSceneFormProps) {
  const [form, setForm] = useState<CrimeSceneFormData>(defaultForm());
  const [allVisits, setAllVisits] = useState<CrimeVisit[]>([]);
  const [existingCvrs, setExistingCvrs] = useState<string[]>([]);
  const [error, setError] = useState('');
  const isEditMode = Boolean(editSceneId);

  useEffect(() => {
    setAllVisits(crimeVisitService.getAll());
    const cvrs = Array.from(
      new Set(crimeSceneService.getAll().map((scene) => scene.cvrNo))
    ).filter(Boolean);
    setExistingCvrs(cvrs);
  }, []);

  useEffect(() => {
    if (!editSceneId) return;
    const scene = crimeSceneService.getById(editSceneId);
    if (scene) setForm(crimeSceneToFormData(scene));
  }, [editSceneId]);

  useEffect(() => {
    if (!focusSection || !editSceneId) return;
    const elId =
      focusSection === 'investigation' ? 'cvr-section-investigation' : 'cvr-section-court';
    const t = window.setTimeout(() => {
      document.getElementById(elId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 350);
    return () => window.clearTimeout(t);
  }, [focusSection, editSceneId, form.cvrNo]);

  const visitOptions = allVisits
    .slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .map((visit) => ({
      value: visit.id,
      label: `${visit.referenceNo ?? visit.id} - ${formatDateTimeDDMMYYYY(visit.createdAt)}`,
    }));

  const cvrOptions = existingCvrs.map((cvr) => ({ value: cvr, label: cvr }));
  const sceneDuration = formatDuration(form.sceneInTime, form.sceneOutTime);
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

  // ── Update helpers ────────────────────────────────────────────────────────

  const updateOfficer = useCallback((index: number, patch: Partial<CrimeSceneOfficer>) => {
    setForm((prev) => ({
      ...prev,
      socoOfficers: prev.socoOfficers.map((o, i) => (i === index ? { ...o, ...patch } : o)),
    }));
  }, []);

  const updateSceneGuard = useCallback((index: number, patch: Partial<CrimeSceneOfficer>) => {
    setForm((prev) => ({
      ...prev,
      sceneGuards: (prev.sceneGuards ?? []).map((g, i) => (i === index ? { ...g, ...patch } : g)),
    }));
  }, []);

  const updateInvestigationOfficer = useCallback((index: number, patch: Partial<CrimeSceneOfficer>) => {
    setForm((prev) => ({
      ...prev,
      investigationOfficers: (prev.investigationOfficers ?? []).map((o, i) =>
        i === index ? { ...o, ...patch } : o
      ),
    }));
  }, []);

  const updateSpecialist = useCallback((index: number, patch: Partial<CrimeSceneSpecialistTeam>) => {
    setForm((prev) => ({
      ...prev,
      specialistTeams: prev.specialistTeams.map((t, i) => (i === index ? { ...t, ...patch } : t)),
    }));
  }, []);

  const updateSpecialistMember = useCallback(
    (teamIndex: number, memberIndex: number, patch: Partial<{ name: string; role: string }>) => {
      setForm((prev) => {
        const teams = [...prev.specialistTeams];
        const team = { ...teams[teamIndex] };
        const members = [...(team.members || [])];
        members[memberIndex] = { ...members[memberIndex], ...patch };
        team.members = members;
        teams[teamIndex] = team;
        return { ...prev, specialistTeams: teams };
      });
    },
    []
  );

  const addSpecialistMember = useCallback((teamIndex: number) => {
    setForm((prev) => {
      const teams = [...prev.specialistTeams];
      const team = { ...teams[teamIndex] };
      team.members = [...(team.members || []), { name: '', role: 'Team Member' }];
      teams[teamIndex] = team;
      return { ...prev, specialistTeams: teams };
    });
  }, []);

  const removeSpecialistMember = useCallback((teamIndex: number, memberIndex: number) => {
    setForm((prev) => {
      const teams = [...prev.specialistTeams];
      const team = { ...teams[teamIndex] };
      const members = [...(team.members || [])];
      members.splice(memberIndex, 1);
      team.members = members;
      teams[teamIndex] = team;
      return { ...prev, specialistTeams: teams };
    });
  }, []);

  // ── Validation & Save ─────────────────────────────────────────────────────

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
    if (!form.reportedToPoliceStation.date || !form.reportedToPoliceStation.time)
      return 'Please add date and time reported to Police station.';
    if (!form.reportedToSocoLab.date || !form.reportedToSocoLab.time)
      return 'Please add date and time reported to SOCO lab.';
    if (!form.sceneInTime || !form.sceneOutTime) return 'Please provide scene in and out times.';
    if (!form.division) return 'Please select division.';
    if (!form.placeOfCrimeScene.trim()) return 'Please enter place of crime scene.';
    if (!form.crimeSceneType?.trim()) return 'Please select type of crime scene.';
    if (form.crimeSceneType === 'Others' && !form.crimeSceneTypeOther?.trim()) {
      return 'Please specify type of crime scene when “Others” is selected.';
    }
    const incidentErr = validateIncidentTimingSection(form);
    if (incidentErr) return incidentErr;

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
        if (!String(row.courtCaseNo ?? '').trim()) {
          return `Production sent to court (row ${i + 1}): enter the court case number.`;
        }
      }
    }

    const analysisRows = form.courtDetails?.sentToAnalysisRows ?? [];
    for (let i = 0; i < analysisRows.length; i++) {
      const row = analysisRows[i];
      if (!row.productionRef?.trim()) continue;
      if (row.sentToAnalysis !== 'Yes' && row.sentToAnalysis !== 'No') {
        return `Sent to analysis institute (row ${i + 1}): choose Yes or No.`;
      }
      if (row.sentToAnalysis === 'Yes') {
        if (!String(row.date ?? '').trim()) {
          return `Sent to analysis institute (row ${i + 1}): enter the date.`;
        }
        const inst = String(row.institution ?? '').trim();
        if (!inst) {
          return `Sent to analysis institute (row ${i + 1}): select an institution.`;
        }
        if (analysisInstitutionIsOthers(inst) && !String(row.institutionOtherDetail ?? '').trim()) {
          return `Sent to analysis institute (row ${i + 1}): specify the institution.`;
        }
        if (!String(row.refNo ?? '').trim()) {
          return `Sent to analysis institute (row ${i + 1}): enter the reference number.`;
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

    const payload = buildCrimeScenePayloadFromForm(form);

    if (editSceneId && amendmentMode) {
      const updated = crimeSceneService.submitRevisionForApproval(editSceneId, form);
      if (!updated) {
        setError(
          'Cannot submit for approval. You need an approved update request, and no revision may already be pending.',
        );
        return;
      }
      onSaved?.({ cvrNo: updated.cvrNo });
      setError('');
      return;
    }

    if (editSceneId) {
      setError('This screen is for submitting an amended CVR for approval.');
      return;
    }

    const created = crimeSceneService.create({ ...form, ...payload } as CrimeSceneFormData);
    onSaved?.({ cvrNo: created.cvrNo });
    setError('');
    setForm(defaultForm());
  };

  // ── Offence helpers ───────────────────────────────────────────────────────
  const offenceArray: string[] = Array.isArray(form.offence)
    ? form.offence
    : form.offence ? [form.offence] : [];

  const removeOffence = (idx: number) =>
    setForm((f) => ({ ...f, offence: offenceArray.filter((_, i) => i !== idx) }));

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="bg-white rounded-xl border border-gray-200 flex flex-col" style={{ minHeight: '600px' }}>
      <div className="flex-1 overflow-y-auto px-6 py-5">
        <div className="animate-fade-in space-y-5">

          <h3 className="text-base font-semibold text-gray-700 uppercase tracking-widest pb-2 border-b border-gray-200">
            {isEditMode
              ? amendmentMode
                ? 'Update crime scene (submit for approval)'
                : 'Edit crime scene'
              : 'Create Crime Scene'}
          </h3>

          {/* ── Scene Basics ── */}
          {isEditMode ? (
            <div className="p-4 sm:p-5 rounded-xl border border-violet-200 bg-violet-50/65">
              <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide pb-2 mb-3 flex items-center gap-2">
                <span className="w-1.5 h-4 rounded-full bg-violet-500 inline-block flex-shrink-0" />
                Visit reference (locked)
              </h4>
              <p className="text-sm text-gray-800">
                <span className="font-semibold text-gray-900">CVR: </span>
                <span className="font-mono">{(form.cvrNo || form.revisitCvrNo || '—').trim()}</span>
              </p>
              <p className="text-sm text-gray-700 mt-1">
                <span className="font-semibold">Visit type: </span>
                {VISIT_TYPES.find((v) => v.value === form.visitType)?.label ?? form.visitType}
              </p>
              <p className="text-xs text-gray-500 mt-2">
                CVR and visit type cannot be changed here. Use other registry actions for new visits.
              </p>
            </div>
          ) : (
            <div className="p-4 sm:p-5 rounded-xl border border-violet-200 bg-violet-50/65">
              <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide pb-2 mb-3 flex items-center gap-2">
                <span className="w-1.5 h-4 rounded-full bg-violet-500 inline-block flex-shrink-0" />
                Scene Basics
              </h4>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <FieldGroup label="Visit Type">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 min-h-10 rounded-lg border border-gray-200 bg-gray-50/70 p-2">
                    {VISIT_TYPES.map((option) => (
                      <label
                        key={option.value}
                        className="inline-flex items-center gap-2 text-sm text-gray-700"
                      >
                        <input
                          type="radio"
                          name="crimeSceneVisitType"
                          checked={form.visitType === option.value}
                          onChange={() =>
                            setForm((prev) => ({ ...prev, visitType: option.value as CrimeSceneVisitType }))
                          }
                          className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                        />
                        {option.label}
                      </label>
                    ))}
                  </div>
                </FieldGroup>

                {crimeSceneUsesNewVisitFields(form.visitType) ? (
                  <FieldGroup label="Visit ID with Date">
                    <CustomSelect
                      value={form.visitId}
                      onChange={(value) => setForm((prev) => ({ ...prev, visitId: value }))}
                      options={visitOptions}
                      placeholder={visitOptions.length ? 'Select initiated visit' : 'No visits found'}
                    />
                  </FieldGroup>
                ) : (
                  <FieldGroup label="CVR Number">
                    <CustomSelect
                      value={form.revisitCvrNo}
                      onChange={(value) => setForm((prev) => ({ ...prev, revisitCvrNo: value }))}
                      options={cvrOptions}
                      placeholder={cvrOptions.length ? 'Select existing CVR' : 'No CVR numbers found'}
                    />
                  </FieldGroup>
                )}
              </div>

              {crimeSceneUsesNewVisitFields(form.visitType) && (
                <div className="mt-3">
                  <FieldGroup label="CVR Number (Format: SOCO Lab Name/Number/Year e.g. Ampara/01/2026)">
                    <TextInput
                      value={form.cvrNo ?? ''}
                      onChange={(e) => setForm((prev) => ({ ...prev, cvrNo: e.target.value }))}
                      placeholder="Ampara/01/2026"
                    />
                  </FieldGroup>
                </div>
              )}
            </div>
          )}

          {/* ── Location ── */}
          <div className="p-4 sm:p-5 rounded-xl border border-indigo-200 bg-indigo-50/65">
            <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide pb-2 mb-3 flex items-center gap-2">
              <span className="w-1.5 h-4 rounded-full bg-indigo-500 inline-block flex-shrink-0" />
              Location
            </h4>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <FieldGroup label="Police Division">
                <CustomSelect
                  value={form.division}
                  onChange={(value) => setForm((prev) => ({ ...prev, division: value }))}
                  options={DIVISIONS}
                  placeholder="Select police division"
                />
              </FieldGroup>
              <FieldGroup label="Police Station">
                <CustomSelect
                  value={form.policeStation}
                  onChange={(value) => setForm((prev) => ({ ...prev, policeStation: value }))}
                  options={POLICE_STATIONS}
                  placeholder="Select police station"
                />
              </FieldGroup>
            </div>
          </div>

          {/* ── Reporting Times ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
            <div className="p-4 sm:p-5 rounded-xl border border-slate-200 bg-slate-50/80 space-y-3">
              <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide pb-2 flex items-center gap-2">
                <span className="w-1.5 h-4 rounded-full bg-slate-500 inline-block flex-shrink-0" />
                Reported to Police
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FieldGroup label="Date">
                  <DatePicker
                    value={form.reportedToPoliceStation.date}
                    onChange={(value) =>
                      setForm((prev) => ({ ...prev, reportedToPoliceStation: { ...prev.reportedToPoliceStation, date: value } }))
                    }
                  />
                </FieldGroup>
                <FieldGroup label="Time">
                  <TimePicker
                    value={form.reportedToPoliceStation.time}
                    onChange={(value) =>
                      setForm((prev) => ({ ...prev, reportedToPoliceStation: { ...prev.reportedToPoliceStation, time: value } }))
                    }
                  />
                </FieldGroup>
              </div>
            </div>

            <div className="p-4 sm:p-5 rounded-xl border border-sky-200 bg-sky-50/80 space-y-3">
              <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide pb-2 flex items-center gap-2">
                <span className="w-1.5 h-4 rounded-full bg-blue-500 inline-block flex-shrink-0" />
                Reported to SOCO Lab
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FieldGroup label="Date">
                  <DatePicker
                    value={form.reportedToSocoLab.date}
                    onChange={(value) =>
                      setForm((prev) => ({ ...prev, reportedToSocoLab: { ...prev.reportedToSocoLab, date: value } }))
                    }
                  />
                </FieldGroup>
                <FieldGroup label="Time">
                  <TimePicker
                    value={form.reportedToSocoLab.time}
                    onChange={(value) =>
                      setForm((prev) => ({ ...prev, reportedToSocoLab: { ...prev.reportedToSocoLab, time: value } }))
                    }
                  />
                </FieldGroup>
              </div>
            </div>
          </div>

          {/* ── Scene Times & Details ── */}
          <div className="p-4 sm:p-5 rounded-xl border border-cyan-200 bg-cyan-50/70 space-y-3">
            <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide pb-2 mb-3 flex items-center gap-2">
              <span className="w-1.5 h-4 rounded-full bg-cyan-500 inline-block flex-shrink-0" />
              Scene Times & Details
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FieldGroup label="Scene In Time">
                <TimePicker
                  value={form.sceneInTime}
                  onChange={(value) => setForm((prev) => ({ ...prev, sceneInTime: value }))}
                />
              </FieldGroup>
              <FieldGroup label="Scene Out Time">
                <TimePicker
                  value={form.sceneOutTime}
                  onChange={(value) => setForm((prev) => ({ ...prev, sceneOutTime: value }))}
                />
              </FieldGroup>
              <FieldGroup label="Scene Visit Duration">
                <div className="w-full min-h-10 px-3 py-2 text-sm rounded-lg border bg-blue-50 border-blue-200 text-blue-800">
                  {sceneDuration}
                </div>
              </FieldGroup>
            </div>

            {/* Offences */}
            <FieldGroup label="Offences">
              <MultiSelect
                value={offenceArray}
                onChange={(val) => setForm((f) => ({ ...f, offence: val }))}
                options={OFFENCE_OPTIONS}
                placeholder="Select one or more offences"
              />
            </FieldGroup>

            {/* Offence Type */}
            <FieldGroup label="Offence Type">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="grid grid-cols-3 gap-2 min-h-10 rounded-lg border border-gray-200 bg-gray-50/70 p-2 md:col-span-1">
                  {OFFENCE_TYPES.map((option) => (
                    <label key={option.value} className="inline-flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="radio"
                        name="crimeSceneOffenceType"
                        checked={(form.offenceType ?? '') === option.value}
                        onChange={() =>
                          setForm((prev) => ({
                            ...prev,
                            offenceType: option.value,
                            offenceTypeOther: option.value === 'Other' ? prev.offenceTypeOther : '',
                          }))
                        }
                        className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      {option.label}
                    </label>
                  ))}
                </div>
                {(form.offenceType ?? '') === 'Other' && (
                  <TextInput
                    className="md:col-span-2"
                    value={form.offenceTypeOther ?? ''}
                    onChange={(e) => setForm((prev) => ({ ...prev, offenceTypeOther: e.target.value }))}
                    placeholder="Specify offence type"
                  />
                )}
              </div>
            </FieldGroup>

            <FieldGroup label="Place of Crime Scene">
              <TextInput
                value={form.placeOfCrimeScene}
                onChange={(e) => setForm((prev) => ({ ...prev, placeOfCrimeScene: e.target.value }))}
                placeholder="Enter location details"
              />
            </FieldGroup>

            <FieldGroup label="Type of Crime Scene">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:items-end">
                <div className="min-w-0">
                  <CustomSelect
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
                    <TextInput
                      value={form.crimeSceneTypeOther ?? ''}
                      onChange={(e) => setForm((prev) => ({ ...prev, crimeSceneTypeOther: e.target.value }))}
                      placeholder="Specify type of crime scene"
                    />
                  ) : null}
                </div>
              </div>
            </FieldGroup>

            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FieldGroup label="Incident date (exactly known)?">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 min-h-10 rounded-lg border border-gray-200 bg-gray-50/70 p-2">
                    {(['Yes', 'No'] as const).map((opt) => (
                      <label key={opt} className="inline-flex items-center gap-2 text-sm text-gray-700">
                        <input
                          type="radio"
                          name="create-scene-incident-exactly-known"
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
                </FieldGroup>

                {showIncidentExact && (
                  <>
                    <FieldGroup label="Incident date (exactly known)">
                      <DatePicker
                        value={form.incidentKnown?.date ?? ''}
                        onChange={(value) =>
                          setForm((prev) => ({
                            ...prev,
                            incidentKnown: { ...(prev.incidentKnown ?? { date: '', time: '' }), date: value },
                          }))
                        }
                      />
                    </FieldGroup>
                    <FieldGroup label="Incident time (exactly known)">
                      <TimePicker
                        value={form.incidentKnown?.time ?? ''}
                        onChange={(value) =>
                          setForm((prev) => ({
                            ...prev,
                            incidentKnown: { ...(prev.incidentKnown ?? { date: '', time: '' }), time: value },
                          }))
                        }
                      />
                    </FieldGroup>
                  </>
                )}
              </div>

              {showIncidentDuration && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                  <FieldGroup label="Duration from — date">
                    <DatePicker
                      value={form.incidentFrom?.date ?? ''}
                      onChange={(value) =>
                        setForm((prev) => ({
                          ...prev,
                          incidentFrom: { ...(prev.incidentFrom ?? { date: '', time: '' }), date: value },
                        }))
                      }
                    />
                  </FieldGroup>
                  <FieldGroup label="Duration from — time">
                    <TimePicker
                      value={form.incidentFrom?.time ?? ''}
                      onChange={(value) =>
                        setForm((prev) => ({
                          ...prev,
                          incidentFrom: { ...(prev.incidentFrom ?? { date: '', time: '' }), time: value },
                        }))
                      }
                    />
                  </FieldGroup>
                  <FieldGroup label="Duration to — date">
                    <DatePicker
                      value={form.incidentTo?.date ?? ''}
                      onChange={(value) =>
                        setForm((prev) => ({
                          ...prev,
                          incidentTo: { ...(prev.incidentTo ?? { date: '', time: '' }), date: value },
                        }))
                      }
                    />
                  </FieldGroup>
                  <FieldGroup label="Duration to — time">
                    <TimePicker
                      value={form.incidentTo?.time ?? ''}
                      onChange={(value) =>
                        setForm((prev) => ({
                          ...prev,
                          incidentTo: { ...(prev.incidentTo ?? { date: '', time: '' }), time: value },
                        }))
                      }
                    />
                  </FieldGroup>
                  <FieldGroup label="Duration (from → to)">
                    <div className="w-full min-h-10 px-3 py-2 text-sm rounded-lg border bg-blue-50 border-blue-200 text-blue-800 flex items-center">
                      {incidentDuration}
                    </div>
                  </FieldGroup>
                </div>
              )}
            </div>

            {offenceArray.length > 0 && (
              <div className="p-3 rounded-xl border border-violet-200 bg-violet-50/65">
                <p className="text-[10px] font-bold text-violet-500 uppercase tracking-widest mb-2 px-1">
                  Selected Offences
                </p>
                <div className="flex flex-wrap gap-2">
                  {offenceArray.map((off, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 px-3 py-1.5 bg-white border border-violet-200 rounded-lg shadow-sm"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                      <span className="text-xs font-medium text-violet-900 leading-snug">{off}</span>
                      <button
                        type="button"
                        onClick={() => removeOffence(idx)}
                        className="ml-1 text-violet-400 hover:text-red-500 transition-colors"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── In-Charge Officer ── */}
          <div className="p-4 sm:p-5 rounded-xl border border-emerald-200 bg-emerald-50/70">
            <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide pb-2 mb-3 flex items-center gap-2">
              <span className="w-1.5 h-4 rounded-full bg-green-500 inline-block flex-shrink-0" />
                Team Leader
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FieldGroup label="Name">
                <TextInput
                  value={form.inChargeOfficer.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, inChargeOfficer: { ...prev.inChargeOfficer, name: e.target.value } }))}
                  placeholder="Full name"
                />
              </FieldGroup>
              <FieldGroup label="Reg. Number">
                <TextInput
                  value={form.inChargeOfficer.regNo}
                  onChange={(e) => setForm((prev) => ({ ...prev, inChargeOfficer: { ...prev.inChargeOfficer, regNo: e.target.value } }))}
                  placeholder="Reg. No"
                />
              </FieldGroup>
              <FieldGroup label="Rank">
                <TextInput
                  value={form.inChargeOfficer.rank}
                  onChange={(e) => setForm((prev) => ({ ...prev, inChargeOfficer: { ...prev.inChargeOfficer, rank: e.target.value } }))}
                  placeholder="Rank"
                />
              </FieldGroup>
            </div>
          </div>

          {/* ── Support Officers ── */}
          <div className="p-4 sm:p-5 rounded-xl border border-rose-200 bg-rose-50/65">
            <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide pb-2 mb-3 flex items-center gap-2">
              <span className="w-1.5 h-4 rounded-full bg-pink-500 inline-block flex-shrink-0" />
              Support Officers
            </h4>
            <div className="space-y-3">
              {form.socoOfficers.map((officer, index) => {
                return (
                  <div key={`officer-${index}`} className="grid grid-cols-1 gap-3 rounded-lg border border-gray-200 bg-white p-3">
                    <FieldGroup label="Team Role">
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
                            <TextInput
                              value={officer.teamRoleOther ?? ''}
                              onChange={(e) => updateOfficer(index, { teamRoleOther: e.target.value })}
                              placeholder="Specify team role"
                            />
                          ) : (
                            <div className="min-h-10" />
                          )}
                        </div>
                      </div>
                    </FieldGroup>

                    <div className="flex items-end gap-3">
                      <FieldGroup label="Name" className="flex-1">
                        <TextInput
                          value={officer.name}
                          onChange={(e) => updateOfficer(index, { name: e.target.value })}
                          placeholder="Full name"
                        />
                      </FieldGroup>
                      <FieldGroup label="Reg. No" className="flex-1">
                        <TextInput
                          value={officer.regNo}
                          onChange={(e) => updateOfficer(index, { regNo: e.target.value })}
                          placeholder="Reg. No"
                        />
                      </FieldGroup>
                      <FieldGroup label="Rank" className="flex-1">
                        <TextInput
                          value={officer.rank}
                          onChange={(e) => updateOfficer(index, { rank: e.target.value })}
                          placeholder="Rank"
                        />
                      </FieldGroup>
                      <div className="shrink-0">
                        <button
                          type="button"
                          onClick={() => setForm((prev) => ({ ...prev, socoOfficers: prev.socoOfficers.filter((_, i) => i !== index) }))}
                          className="h-10 self-end whitespace-nowrap rounded-lg border border-red-200 bg-red-50 px-3 text-red-600 hover:bg-red-100 hover:border-red-300 transition-colors text-xs font-semibold disabled:opacity-40"
                          disabled={form.socoOfficers.length <= 1}
                          aria-label="Remove officer"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <button
              type="button"
              onClick={() => setForm((prev) => ({ ...prev, socoOfficers: [...prev.socoOfficers, emptyOfficer()] }))}
              className="mt-3 text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 transition-colors"
            >
              <span className="text-base leading-none">+</span> Add Officer
            </button>
          </div>

          {/* ── Expert Teams ── */}
          <div className="p-4 sm:p-5 rounded-xl border border-orange-200 bg-orange-50/65">
            <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide pb-2 mb-3 flex items-center gap-2">
              <span className="w-1.5 h-4 rounded-full bg-orange-500 inline-block flex-shrink-0" />
              Expert Teams
            </h4>
            <div className="space-y-4">
              {form.specialistTeams.map((team, index) => (
                <div key={`specialist-${index}`} className="border border-gray-200 rounded-lg p-3 space-y-3 bg-white">
                  <div className="flex justify-between items-start">
                    <div className="text-sm font-medium text-gray-700">Expert Team {index + 1}</div>
                    <button
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, specialistTeams: prev.specialistTeams.filter((_, i) => i !== index) }))}
                      className="h-8 whitespace-nowrap rounded-lg border border-red-200 bg-red-50 px-2.5 text-red-600 hover:bg-red-100 hover:border-red-300 transition-colors text-xs font-semibold disabled:opacity-40"
                      disabled={form.specialistTeams.length <= 1}
                    >
                      Remove
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <FieldGroup label="Expert Role">
                      <CustomSelect
                        value={team.role}
                        onChange={(value) => updateSpecialist(index, { role: value })}
                        options={SPECIALIST_ROLE_OPTIONS}
                        placeholder="Select expert role"
                      />
                    </FieldGroup>
                    <FieldGroup label="In Time">
                      <TimePicker
                        value={team.inTime ?? ''}
                        onChange={(value) => updateSpecialist(index, { inTime: value })}
                      />
                    </FieldGroup>
                    <FieldGroup label="Out Time">
                      <TimePicker
                        value={team.outTime ?? ''}
                        onChange={(value) => updateSpecialist(index, { outTime: value })}
                      />
                    </FieldGroup>
                  </div>

                  <div className="pt-2 border-t border-gray-200 space-y-2">
                    <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide pb-2 mb-3 flex items-center gap-2">
                      Expert Team Members
                    </h4>
                    <div className="space-y-2">
                      {(team.members || []).map((member, mIndex) => (
                        <div key={`m-${mIndex}`} className="flex items-end gap-3">
                          <FieldGroup label={mIndex === 0 ? 'Team Leader' : `Member ${mIndex}`} className="mb-0 flex-1">
                            <TextInput
                              value={member.name}
                              onChange={(e) => updateSpecialistMember(index, mIndex, { name: e.target.value })}
                              placeholder={mIndex === 0 ? 'Team Leader Name' : 'Member Name'}
                            />
                          </FieldGroup>
                          {mIndex > 0 && (
                            <div className="shrink-0">
                              <button
                                type="button"
                                onClick={() => removeSpecialistMember(index, mIndex)}
                                className="h-10 whitespace-nowrap rounded-lg border border-red-200 bg-red-50 px-3 text-red-600 hover:bg-red-100 hover:border-red-300 transition-colors text-xs font-semibold"
                              >
                                Remove
                              </button>
                            </div>
                          )}
                          {mIndex === 0 && (
                            <div className="h-10 w-[74px] shrink-0" aria-hidden />
                          )}
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => addSpecialistMember(index)}
                      className="mt-2 text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 transition-colors"
                    >
                      <span className="text-base leading-none">+</span> Add Member
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setForm((prev) => ({ ...prev, specialistTeams: [...prev.specialistTeams, emptySpecialist()] }))}
              className="mt-3 text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 transition-colors"
            >
              <span className="text-base leading-none">+</span> Add Expert Team
            </button>
          </div>

          {/* ── Investigation Officers ── */}
          <div id="cvr-section-investigation" className="p-4 sm:p-5 rounded-xl border border-fuchsia-200 bg-fuchsia-50/65 scroll-mt-24">
            <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide pb-2 mb-3 flex items-center gap-2">
              <span className="w-1.5 h-4 rounded-full bg-fuchsia-500 inline-block flex-shrink-0" />
              Investigation Officer
            </h4>
            <div className="space-y-3">
              {(form.investigationOfficers ?? []).map((officer, index) => (
                <div key={`inv-officer-${index}`} className="flex items-end gap-3">
                  <FieldGroup label="Name" className="mb-0 flex-1">
                    <TextInput
                      value={officer.name}
                      onChange={(e) => updateInvestigationOfficer(index, { name: e.target.value })}
                      placeholder="Officer name"
                    />
                  </FieldGroup>
                  <FieldGroup label="Reg. Number" className="mb-0 flex-1">
                    <TextInput
                      value={officer.regNo ?? ''}
                      onChange={(e) => updateInvestigationOfficer(index, { regNo: e.target.value })}
                      placeholder="Reg. No"
                    />
                  </FieldGroup>
                  <FieldGroup label="Rank" className="mb-0 flex-1">
                    <TextInput
                      value={officer.rank ?? ''}
                      onChange={(e) => updateInvestigationOfficer(index, { rank: e.target.value })}
                      placeholder="Rank"
                    />
                  </FieldGroup>
                  <div className="shrink-0">
                    <button
                      type="button"
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          investigationOfficers: (prev.investigationOfficers ?? []).filter((_, i) => i !== index),
                        }))
                      }
                      className="h-10 whitespace-nowrap rounded-lg border border-red-200 bg-red-50 px-3 text-red-600 hover:bg-red-100 hover:border-red-300 transition-colors text-xs font-semibold disabled:opacity-40"
                      disabled={(form.investigationOfficers ?? []).length <= 1}
                      aria-label="Remove investigation officer"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() =>
                setForm((prev) => ({
                  ...prev,
                  investigationOfficers: [...(prev.investigationOfficers ?? []), emptyOfficer()],
                }))
              }
              className="mt-3 text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 transition-colors"
            >
              <span className="text-base leading-none">+</span> Add Investigation Officer
            </button>
          </div>

          {/* ── Scene Guards ── */}
          <div className="p-4 sm:p-5 rounded-xl border border-yellow-200 bg-yellow-50/70">
            <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide pb-2 mb-3 flex items-center gap-2">
              <span className="w-1.5 h-4 rounded-full bg-yellow-500 inline-block flex-shrink-0" />
              Scene Guard
            </h4>
            <div className="space-y-3">
              {(form.sceneGuards ?? []).map((guard, index) => (
                <div key={`snc-guard-${index}`} className="flex items-end gap-3">
                  <FieldGroup label="Name" className="mb-0 flex-1">
                    <TextInput
                      value={guard.name}
                      onChange={(e) => updateSceneGuard(index, { name: e.target.value })}
                      placeholder="Guard name"
                    />
                  </FieldGroup>
                  <FieldGroup label="Reg. Number" className="mb-0 flex-1">
                    <TextInput
                      value={guard.regNo ?? ''}
                      onChange={(e) => updateSceneGuard(index, { regNo: e.target.value })}
                      placeholder="Reg. No"
                    />
                  </FieldGroup>
                  <FieldGroup label="Rank" className="mb-0 flex-1">
                    <TextInput
                      value={guard.rank ?? ''}
                      onChange={(e) => updateSceneGuard(index, { rank: e.target.value })}
                      placeholder="Rank"
                    />
                  </FieldGroup>
                  <div className="shrink-0">
                    <button
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, sceneGuards: (prev.sceneGuards ?? []).filter((_, i) => i !== index) }))}
                      className="h-10 whitespace-nowrap rounded-lg border border-red-200 bg-red-50 px-3 text-red-600 hover:bg-red-100 hover:border-red-300 transition-colors text-xs font-semibold disabled:opacity-40"
                      disabled={(form.sceneGuards ?? []).length <= 1}
                      aria-label="Remove guard"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setForm((prev) => ({ ...prev, sceneGuards: [...(prev.sceneGuards ?? []), emptyOfficer()] }))}
              className="mt-3 text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 transition-colors"
            >
              <span className="text-base leading-none">+</span> Add Guard
            </button>
          </div>

          {/* ── Court details ── */}
          <div id="cvr-section-court" className="p-4 sm:p-5 rounded-xl border border-amber-200 bg-amber-50/70 scroll-mt-24">
            <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide pb-2 mb-3 flex items-center gap-2">
              <span className="w-1.5 h-4 rounded-full bg-amber-500 inline-block flex-shrink-0" />
              Court details
            </h4>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FieldGroup label="Court name (optional)">
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
                </FieldGroup>
                <FieldGroup label="Court case no. (optional)">
                  <TextInput
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
                </FieldGroup>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-start">
                <FieldGroup label="Production (P.R.)">
                  <div className="flex flex-wrap gap-4 min-h-10 items-center rounded-lg border border-gray-200 bg-white/80 px-3 py-2">
                    {(['Yes', 'No'] as const).map((opt) => (
                      <label key={opt} className="inline-flex items-center gap-2 text-sm text-gray-700">
                        <input
                          type="radio"
                          name="courtProductionPR"
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
                </FieldGroup>
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
                        onChange={(next) =>
                          setForm((prev) => {
                            const sel = new Set(next);
                            return {
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
                                sentToAnalysisRows: (prev.courtDetails?.sentToAnalysisRows ?? []).filter(
                                  (row) => sel.has(row.productionRef),
                                ),
                              },
                            };
                          })
                        }
                        options={PRODUCTION_PR_OPTIONS}
                        placeholder="Select one or more"
                      />
                    </div>
                    {productionPRHasOthersSelected(form.courtDetails?.productionPRTypes) ? (
                      <FieldGroup label={`${PRODUCTION_PR_OTHERS_VALUE} — specify`}>
                        <TextInput
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
                      </FieldGroup>
                    ) : null}
                  </>
                ) : null}
              </div>

              {/* ── Production sent to court (repeatable) ── */}
              <div className="mt-2 pt-4 border-t border-gray-200">
                <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide pb-2 mb-3 flex items-center gap-2">
                  <span className="w-1.5 h-4 rounded-full bg-teal-500 inline-block flex-shrink-0" />
                  Production sent to court
                </h4>
                {!(form.courtDetails?.productionPRTypes ?? []).length ? (
                  <p className="text-xs text-gray-500 mb-2">
                    Select production types under Production (P.R.) first, then add a row for each item sent to court.
                  </p>
                ) : null}
                <div className="divide-y divide-gray-200">
                  {(form.courtDetails?.productionSentToCourtRows ?? []).map((row, index) => (
                    <div key={`court-sent-${index}`} className="space-y-3 py-4 first:pt-0 border-b border-gray-100 last:border-b-0">
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1.3fr)_auto_auto] md:items-end">
                        <FieldGroup label="Production" className="min-w-0">
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
                            placeholder={
                              (form.courtDetails?.productionPRTypes ?? []).length
                                ? 'Select production'
                                : 'Select P.R. types first'
                            }
                            searchable
                            searchPlaceholder="Search…"
                          />
                        </FieldGroup>
                        <FieldGroup label="Sent to court?">
                          <div className="flex flex-wrap gap-4 min-h-10 items-center rounded-lg border border-gray-200 bg-white/80 px-3 py-2">
                            {(['Yes', 'No'] as const).map((opt) => (
                              <label key={opt} className="inline-flex items-center gap-2 text-sm text-gray-700">
                                <input
                                  type="radio"
                                  name={`production-sent-court-${index}`}
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
                        </FieldGroup>
                        <div className="shrink-0 flex md:pb-0.5">
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
                            className="h-10 whitespace-nowrap rounded-lg border border-red-200 bg-red-50 px-3 text-red-600 hover:bg-red-100 text-xs font-semibold"
                            aria-label="Remove row"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                      {row.sentToCourt === 'Yes' ? (
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                          <FieldGroup label="Date (DD/MM/YY)">
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
                          </FieldGroup>
                          <FieldGroup label="Court case no.">
                            <TextInput
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
                          </FieldGroup>
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
                <button
                  type="button"
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
                  disabled={!(form.courtDetails?.productionPRTypes ?? []).length}
                  className="mt-3 text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 transition-colors disabled:opacity-40 disabled:pointer-events-none"
                >
                  <span className="text-base leading-none">+</span> Add production sent to court
                </button>
              </div>

              {/* ── Sent to analysis institute (repeatable) ── */}
              <div className="mt-2 pt-4 border-t border-gray-200">
                <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide pb-2 mb-3 flex items-center gap-2">
                  <span className="w-1.5 h-4 rounded-full bg-sky-500 inline-block flex-shrink-0" />
                  Sent to analysis institute
                </h4>
                {!(form.courtDetails?.productionPRTypes ?? []).length ? (
                  <p className="text-xs text-gray-500 mb-2">
                    Select production types under Production (P.R.) first, then add analysis rows as needed.
                  </p>
                ) : null}
                <div className="divide-y divide-gray-200">
                  {(form.courtDetails?.sentToAnalysisRows ?? []).map((row, index) => (
                    <div key={`analysis-${index}`} className="space-y-3 py-4 first:pt-0 border-b border-gray-100 last:border-b-0">
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1.2fr)_auto_auto] md:items-end">
                        <FieldGroup label="Production" className="min-w-0">
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
                            placeholder={
                              (form.courtDetails?.productionPRTypes ?? []).length
                                ? 'Select production'
                                : 'Select P.R. types first'
                            }
                            searchable
                            searchPlaceholder="Search…"
                          />
                        </FieldGroup>
                        <FieldGroup label="Sent for analysis?">
                          <div className="flex flex-wrap gap-4 min-h-10 items-center rounded-lg border border-gray-200 bg-white/80 px-3 py-2">
                            {(['Yes', 'No'] as const).map((opt) => (
                              <label key={opt} className="inline-flex items-center gap-2 text-sm text-gray-700">
                                <input
                                  type="radio"
                                  name={`production-sent-analysis-${index}`}
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
                        </FieldGroup>
                        <div className="shrink-0 flex md:pb-0.5">
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
                            className="h-10 whitespace-nowrap rounded-lg border border-red-200 bg-red-50 px-3 text-red-600 hover:bg-red-100 text-xs font-semibold"
                            aria-label="Remove row"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                      {row.sentToAnalysis === 'Yes' ? (
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                          <FieldGroup label="Institution" className="min-w-0 md:col-span-2">
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
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
                                <TextInput
                                  className="flex-1 min-w-0"
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
                              ) : null}
                            </div>
                          </FieldGroup>
                          <FieldGroup label="Date (DD/MM/YY)">
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
                          </FieldGroup>
                          <FieldGroup label="Ref. no.">
                            <TextInput
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
                          </FieldGroup>
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
                <button
                  type="button"
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
                  disabled={!(form.courtDetails?.productionPRTypes ?? []).length}
                  className="mt-3 text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 transition-colors disabled:opacity-40 disabled:pointer-events-none"
                >
                  <span className="text-base leading-none">+</span> Add analysis institute row
                </button>
              </div>
            </div>
          </div>

          {/* ── Attachments ── */}
          <div className="p-4 sm:p-5 rounded-xl border border-red-200 bg-red-50/65">
            <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide pb-2 mb-3 flex items-center gap-2">
              <span className="w-1.5 h-4 rounded-full bg-red-500 inline-block flex-shrink-0" />
              Attachments
            </h4>
            <div className="space-y-3">
              {(['photoZipName', 'sketchFileName', 'reportFileName'] as const).map((field, i) => (
                <FieldGroup key={field} label={['Photo ZIP', 'Sketch', 'Report'][i]}>
                  <input
                    type="file"
                    accept={field === 'photoZipName' ? '.zip,application/zip' : undefined}
                    onChange={(e) => {
                      const fileName = e.target.files?.[0]?.name ?? '';
                      setForm((prev) => ({ ...prev, [field]: fileName }));
                    }}
                    className="w-full text-sm text-gray-700 file:mr-3 file:rounded-md file:border-0 file:bg-blue-50 file:text-blue-700 file:px-3 file:py-2 hover:file:bg-blue-100"
                  />
                  {form[field] && <p className="text-xs text-gray-500 mt-1">Selected: {form[field]}</p>}
                </FieldGroup>
              ))}
            </div>
          </div>

          {/* ── Error ── */}
          {error && (
            <div className="p-4 rounded-xl border border-red-200 bg-red-50">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

        </div>
      </div>

      {/* ── Bottom Action Bar ── */}
      <div className="flex-shrink-0 border-t border-gray-200 bg-gray-50/70 px-5 py-3 rounded-b-xl flex items-center justify-between gap-3">
        <div />
        <div className="flex items-center gap-2">
          <Button variant="secondary" type="button" onClick={onCancel}>Cancel</Button>
          <Button variant="success" type="button" onClick={handleSave}>
            {isEditMode && amendmentMode ? 'Submit for approval' : 'Save Crime Scene'}
          </Button>
        </div>
        <div />
      </div>
    </div>
  );
}