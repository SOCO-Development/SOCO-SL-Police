'use client';
import { useState, useEffect, useCallback } from 'react';
import type { CrimeSceneFormData, CrimeSceneOfficer, CrimeSceneSpecialistTeam, CrimeSceneVisitType } from '@/types/crimeScene';
import type { CrimeVisit } from '@/types/crimeVisit';
import DatePicker from '@/components/forms/DatePicker';
import TimePicker from '@/components/forms/TimePicker';
import CustomSelect from '@/components/forms/CustomSelect';
import MultiSelect from '@/components/forms/MultiSelect';
import Button from '@/components/buttons/Button';
import { crimeVisitService } from '@/lib/crimeVisitService';
import { crimeSceneService } from '@/lib/crimeSceneService';
import { formatDateTimeDDMMYYYY } from '@/lib/dateUtils';

interface CreateCrimeSceneFormProps {
  onSaved?: (payload: { cvrNo: string }) => void;
  onCancel?: () => void;
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
  { value: 'REVISIT', label: 'Revisit' },
];

const SPECIALIST_ROLE_OPTIONS = [
  'Magistrate', 'GAD', 'JMO', 'Finger Print', 'Kannel',
  'Foreign Investigation Officers', 'Others',
].map((value) => ({ value, label: value }));

const TEAM_ROLE_OPTIONS = [
  { value: 'Team Leader', label: 'Team Leader' },
  { value: 'Other SOCO Officer', label: 'Other SOCO Officer' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function emptyOfficer(): CrimeSceneOfficer {
  return { name: '', regNo: '', rank: '', teamRole: 'Other SOCO Officer', socoRole: 'Other' };
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
    placeOfCrimeScene: '',
    inChargeOfficer: emptyOfficer(),
    socoOfficers: [emptyOfficer()],
    specialistTeams: [emptySpecialist()],
    investigationOfficer: emptyOfficer(),
    sceneGuards: [emptyOfficer()],
    photoZipName: '',
    sketchFileName: '',
    reportFileName: '',
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

export default function CreateCrimeSceneForm({ onSaved, onCancel }: CreateCrimeSceneFormProps) {
  const [form, setForm] = useState<CrimeSceneFormData>(defaultForm());
  const [allVisits, setAllVisits] = useState<CrimeVisit[]>([]);
  const [existingCvrs, setExistingCvrs] = useState<string[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    setAllVisits(crimeVisitService.getAll());
    const cvrs = Array.from(
      new Set(crimeSceneService.getAll().map((scene) => scene.cvrNo))
    ).filter(Boolean);
    setExistingCvrs(cvrs);
  }, []);

  const visitOptions = allVisits
    .slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .map((visit) => ({
      value: visit.id,
      label: `${visit.referenceNo ?? visit.id} - ${formatDateTimeDDMMYYYY(visit.createdAt)}`,
    }));

  const cvrOptions = existingCvrs.map((cvr) => ({ value: cvr, label: cvr }));
  const sceneDuration = formatDuration(form.sceneInTime, form.sceneOutTime);

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
    if (form.visitType === 'NEW_VISIT' && !form.visitId) return 'Please select a Visit ID.';
    if (form.visitType === 'NEW_VISIT' && !form.cvrNo?.trim()) return 'Please enter a CVR number for the new visit.';
    if (form.visitType === 'REVISIT' && !form.revisitCvrNo) return 'Please select a CVR number for revisit.';
    if (!form.policeStation) return 'Please select a police station.';
    if (!form.reportedToPoliceStation.date || !form.reportedToPoliceStation.time)
      return 'Please add date and time reported to Police station.';
    if (!form.reportedToSocoLab.date || !form.reportedToSocoLab.time)
      return 'Please add date and time reported to SOCO lab.';
    if (!form.sceneInTime || !form.sceneOutTime) return 'Please provide scene in and out times.';
    if (!form.division) return 'Please select division.';
    if (!form.placeOfCrimeScene.trim()) return 'Please enter place of crime scene.';
    if (!form.inChargeOfficer.name.trim()) return 'Please enter the in-charge officer.';
    return '';
  };

  const handleSave = () => {
    const validation = validate();
    if (validation) { setError(validation); return; }

    const payload: CrimeSceneFormData = {
      ...form,
      cvrNo: form.visitType === 'NEW_VISIT' ? (form.cvrNo?.trim() ?? '') : form.revisitCvrNo,
      visitId: form.visitType === 'NEW_VISIT' ? form.visitId : '',
      revisitCvrNo: form.visitType === 'REVISIT' ? form.revisitCvrNo : '',
      socoOfficers: form.socoOfficers.filter((o) => o.name.trim()),
      specialistTeams: form.specialistTeams
        .map((t) => ({ ...t, members: (t.members || []).filter((m) => m.name.trim()) }))
        .filter((t) => t.role.trim() || (t.members && t.members.length > 0)),
      sceneGuards: (form.sceneGuards ?? []).filter((g) => g.name.trim()),
    };

    const created = crimeSceneService.create(payload);
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
            Create Crime Scene
          </h3>

          {/* ── Scene Basics ── */}
          <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/80">
            <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide pb-2 mb-3 flex items-center gap-2">
              <span className="w-1.5 h-4 rounded-full bg-violet-500 inline-block flex-shrink-0" />
              Scene Basics
            </h4>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <FieldGroup label="Visit Type">
                <CustomSelect
                  value={form.visitType}
                  onChange={(value) => setForm((prev) => ({ ...prev, visitType: value as CrimeSceneVisitType }))}
                  options={VISIT_TYPES}
                  placeholder="Select visit type"
                />
              </FieldGroup>

              {form.visitType === 'NEW_VISIT' ? (
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

            {form.visitType === 'NEW_VISIT' && (
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

          {/* ── Location ── */}
          <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/80">
            <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide pb-2 mb-3 flex items-center gap-2">
              <span className="w-1.5 h-4 rounded-full bg-indigo-500 inline-block flex-shrink-0" />
              Location
            </h4>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <FieldGroup label="Police Station">
                <CustomSelect
                  value={form.policeStation}
                  onChange={(value) => setForm((prev) => ({ ...prev, policeStation: value }))}
                  options={POLICE_STATIONS}
                  placeholder="Select police station"
                />
              </FieldGroup>
              <FieldGroup label="Police Division">
                <CustomSelect
                  value={form.division}
                  onChange={(value) => setForm((prev) => ({ ...prev, division: value }))}
                  options={DIVISIONS}
                  placeholder="Select police division"
                />
              </FieldGroup>
            </div>
          </div>

          {/* ── Reporting Times ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
            <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/80 space-y-3">
              <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide pb-2 flex items-center gap-2">
                <span className="w-1.5 h-4 rounded-full bg-slate-500 inline-block flex-shrink-0" />
                Reported to Police
              </h4>
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

            <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/80 space-y-3">
              <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide pb-2 flex items-center gap-2">
                <span className="w-1.5 h-4 rounded-full bg-blue-500 inline-block flex-shrink-0" />
                Reported to SOCO Lab
              </h4>
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

          {/* ── Scene Times & Details ── */}
          <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/80 space-y-3">
            <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide pb-2 mb-3 flex items-center gap-2">
              <span className="w-1.5 h-4 rounded-full bg-cyan-500 inline-block flex-shrink-0" />
              Scene Times & Details
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
            </div>

            <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-800">
              Scene Visit Duration: <span className="font-semibold">{sceneDuration}</span>
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

            {offenceArray.length > 0 && (
              <div className="p-3 rounded-xl border border-violet-200 bg-violet-50/50">
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

            {/* Offence Type */}
            <FieldGroup label="Offence Type">
              <CustomSelect
                value={form.offenceType ?? ''}
                onChange={(val) => setForm((f) => ({ ...f, offenceType: val }))}
                options={OFFENCE_TYPES}
                placeholder="D / GCR"
              />
            </FieldGroup>

            <FieldGroup label="Place of Crime Scene">
              <TextInput
                value={form.placeOfCrimeScene}
                onChange={(e) => setForm((prev) => ({ ...prev, placeOfCrimeScene: e.target.value }))}
                placeholder="Enter location details"
              />
            </FieldGroup>
          </div>

          {/* ── In-Charge Officer ── */}
          <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/80">
            <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide pb-2 mb-3 flex items-center gap-2">
              <span className="w-1.5 h-4 rounded-full bg-green-500 inline-block flex-shrink-0" />
                Team Leader
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
          <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/80">
            <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide pb-2 mb-3 flex items-center gap-2">
              <span className="w-1.5 h-4 rounded-full bg-pink-500 inline-block flex-shrink-0" />
              Support Officers
            </h4>
            <div className="space-y-3">
              {form.socoOfficers.map((officer, index) => {
                const hasOtherTeamLeader = form.socoOfficers.some(
                  (o, i) => i !== index && o.teamRole === 'Team Leader'
                );
                return (
                  <div key={`officer-${index}`} className="grid grid-cols-[1.2fr,2fr,1fr,40px] gap-3 items-end">
                    <FieldGroup label="Team Role">
                      <CustomSelect
                        value={officer.teamRole ?? 'Other SOCO Officer'}
                        onChange={(value) => updateOfficer(index, { teamRole: value })}
                        options={TEAM_ROLE_OPTIONS.filter(
                          (opt) => opt.value !== 'Team Leader' || !hasOtherTeamLeader
                        )}
                        placeholder="Select team role"
                      />
                    </FieldGroup>
                    <FieldGroup label="Name">
                      <TextInput
                        value={officer.name}
                        onChange={(e) => updateOfficer(index, { name: e.target.value })}
                        placeholder="Full name"
                      />
                    </FieldGroup>
                    <div className="grid grid-cols-2 gap-2">
                      <FieldGroup label="Reg. No">
                        <TextInput
                          value={officer.regNo}
                          onChange={(e) => updateOfficer(index, { regNo: e.target.value })}
                          placeholder="Reg. No"
                        />
                      </FieldGroup>
                      <FieldGroup label="Rank">
                        <TextInput
                          value={officer.rank}
                          onChange={(e) => updateOfficer(index, { rank: e.target.value })}
                          placeholder="Rank"
                        />
                      </FieldGroup>
                    </div>
                    <button
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, socoOfficers: prev.socoOfficers.filter((_, i) => i !== index) }))}
                      className="h-10 text-red-400 hover:text-red-600 text-lg leading-none transition-colors"
                      disabled={form.socoOfficers.length <= 1}
                      aria-label="Remove officer"
                    >
                      ×
                    </button>
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
          <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/80">
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
                      className="text-red-400 hover:text-red-600 text-lg leading-none disabled:opacity-40"
                      disabled={form.specialistTeams.length <= 1}
                    >
                      ×
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
                        <div key={`m-${mIndex}`} className="grid grid-cols-[1fr,40px] gap-2 items-end">
                          <FieldGroup label={mIndex === 0 ? 'Team Leader' : `Member ${mIndex}`} className="mb-0">
                            <TextInput
                              value={member.name}
                              onChange={(e) => updateSpecialistMember(index, mIndex, { name: e.target.value })}
                              placeholder={mIndex === 0 ? 'Team Leader Name' : 'Member Name'}
                            />
                          </FieldGroup>
                          {mIndex > 0 && (
                            <button
                              type="button"
                              onClick={() => removeSpecialistMember(index, mIndex)}
                              className="h-10 text-red-400 hover:text-red-600 text-lg leading-none"
                            >
                              ×
                            </button>
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

          {/* ── Investigation Officer ── */}
          <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/80">
            <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide pb-2 mb-3 flex items-center gap-2">
              <span className="w-1.5 h-4 rounded-full bg-fuchsia-500 inline-block flex-shrink-0" />
              Investigation Officer
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <FieldGroup label="Name">
                <TextInput
                  value={form.investigationOfficer?.name ?? ''}
                  onChange={(e) => setForm((prev) => ({ ...prev, investigationOfficer: { ...(prev.investigationOfficer || emptyOfficer()), name: e.target.value } }))}
                  placeholder="Full name"
                />
              </FieldGroup>
              <FieldGroup label="Reg. Number">
                <TextInput
                  value={form.investigationOfficer?.regNo ?? ''}
                  onChange={(e) => setForm((prev) => ({ ...prev, investigationOfficer: { ...(prev.investigationOfficer || emptyOfficer()), regNo: e.target.value } }))}
                  placeholder="Reg. No"
                />
              </FieldGroup>
              <FieldGroup label="Rank">
                <TextInput
                  value={form.investigationOfficer?.rank ?? ''}
                  onChange={(e) => setForm((prev) => ({ ...prev, investigationOfficer: { ...(prev.investigationOfficer || emptyOfficer()), rank: e.target.value } }))}
                  placeholder="Rank"
                />
              </FieldGroup>
            </div>
          </div>

          {/* ── Scene Guards ── */}
          <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/80">
            <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide pb-2 mb-3 flex items-center gap-2">
              <span className="w-1.5 h-4 rounded-full bg-yellow-500 inline-block flex-shrink-0" />
              Scene Guard
            </h4>
            <div className="space-y-3">
              {(form.sceneGuards ?? []).map((guard, index) => (
                <div key={`snc-guard-${index}`} className="grid grid-cols-[1fr,1fr,1.5fr,40px] gap-3 items-end">
                  <FieldGroup label={index === 0 ? 'Rank' : ''} className="mb-0">
                    <TextInput
                      value={guard.rank ?? ''}
                      onChange={(e) => updateSceneGuard(index, { rank: e.target.value })}
                      placeholder="Rank"
                    />
                  </FieldGroup>
                  <FieldGroup label={index === 0 ? 'Reg. No' : ''} className="mb-0">
                    <TextInput
                      value={guard.regNo ?? ''}
                      onChange={(e) => updateSceneGuard(index, { regNo: e.target.value })}
                      placeholder="Reg. No"
                    />
                  </FieldGroup>
                  <FieldGroup label={index === 0 ? 'Name' : ''} className="mb-0">
                    <TextInput
                      value={guard.name}
                      onChange={(e) => updateSceneGuard(index, { name: e.target.value })}
                      placeholder="Guard name"
                    />
                  </FieldGroup>
                  <button
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, sceneGuards: (prev.sceneGuards ?? []).filter((_, i) => i !== index) }))}
                    className="h-10 text-red-400 hover:text-red-600 text-lg leading-none"
                    disabled={(form.sceneGuards ?? []).length <= 1}
                    aria-label="Remove guard"
                  >
                    ×
                  </button>
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

          {/* ── Attachments ── */}
          <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/80">
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
          <Button variant="ghost" type="button" onClick={onCancel}>Cancel</Button>
          <Button variant="success" type="button" onClick={handleSave}>Save Crime Scene</Button>
        </div>
        <div />
      </div>
    </div>
  );
}