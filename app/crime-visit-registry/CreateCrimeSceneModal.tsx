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
import { formatDateTimeDDMMYYYY } from '@/lib/dateUtils';
import type { CrimeVisit } from '@/types/crimeVisit';
import type { CrimeSceneFormData, CrimeSceneOfficer, CrimeSceneSpecialistTeam, CrimeSceneVisitType } from '@/types/crimeScene';

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

function emptyOfficer(): CrimeSceneOfficer {
  return { name: '', regNo: '', rank: '' };
}

function emptySpecialist(): CrimeSceneSpecialistTeam {
  return { role: '', specialist: '', teamMembers: '' };
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
    offence: '',
    placeOfCrimeScene: '',
    inChargeOfficer: emptyOfficer(),
    socoOfficers: [emptyOfficer()],
    specialistTeams: [emptySpecialist()],
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

  if (!isOpen) return null;

  const updateOfficer = (index: number, patch: Partial<CrimeSceneOfficer>) => {
    setForm((prev) => ({
      ...prev,
      socoOfficers: prev.socoOfficers.map((officer, i) => (i === index ? { ...officer, ...patch } : officer)),
    }));
  };

  const updateSpecialist = (index: number, patch: Partial<CrimeSceneSpecialistTeam>) => {
    setForm((prev) => ({
      ...prev,
      specialistTeams: prev.specialistTeams.map((row, i) => (i === index ? { ...row, ...patch } : row)),
    }));
  };

  const validate = (): string => {
    if (form.visitType === 'NEW_VISIT' && !form.visitId) return 'Please select a Visit ID.';
    if (form.visitType === 'NEW_VISIT' && !form.cvrNo?.trim()) return 'Please enter a CVR number for the new visit.';
    if (form.visitType === 'REVISIT' && !form.revisitCvrNo) return 'Please select a CVR number for revisit.';
    if (!form.policeStation) return 'Please select a police station.';
    if (!form.reportedToPoliceStation.date || !form.reportedToPoliceStation.time) return 'Please add date and time reported to Police station.';
    if (!form.reportedToSocoLab.date || !form.reportedToSocoLab.time) return 'Please add date and time reported to SOCO lab.';
    if (!form.sceneInTime || !form.sceneOutTime) return 'Please provide scene in and out times.';
    if (!form.division) return 'Please select division.';
    if (!form.offence.trim()) return 'Please enter offence.';
    if (!form.placeOfCrimeScene.trim()) return 'Please enter place of crime scene.';
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
    const filteredSpecialists = form.specialistTeams.filter((row) => row.role.trim() || row.specialist.trim() || row.teamMembers.trim());

    const payload: CrimeSceneFormData = {
      ...form,
      cvrNo: form.visitType === 'NEW_VISIT' ? (form.cvrNo?.trim() ?? '') : form.revisitCvrNo,
      visitId: form.visitType === 'NEW_VISIT' ? form.visitId : '',
      revisitCvrNo: form.visitType === 'REVISIT' ? form.revisitCvrNo : '',
      socoOfficers: filteredOfficers,
      specialistTeams: filteredSpecialists,
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <CustomSelect
              label="Visit Type"
              value={form.visitType}
              onChange={(value) => setForm((prev) => ({ ...prev, visitType: value as CrimeSceneVisitType }))}
              options={VISIT_TYPES}
              placeholder="Select visit type"
            />

            {form.visitType === 'NEW_VISIT' ? (
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
              label="Police Station"
              value={form.policeStation}
              onChange={(value) => setForm((prev) => ({ ...prev, policeStation: value }))}
              options={POLICE_STATIONS}
              placeholder="Select police station"
            />
          </div>

          {form.visitType === 'NEW_VISIT' ? (
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
                <CustomSelect
                  label="Division"
                  value={form.division}
                  onChange={(value) => setForm((prev) => ({ ...prev, division: value }))}
                  options={DIVISIONS}
                  placeholder="Select division"
                />
                <CustomSelect
                  label="Offence"
                  value={form.offence}
                  onChange={(value) => setForm((prev) => ({ ...prev, offence: value }))}
                  options={OFFENCE_OPTIONS}
                  placeholder="Select offence"
                />
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

            <div className="space-y-3">
              {form.socoOfficers.map((officer, index) => (
                <div key={`officer-${index}`} className="grid grid-cols-1 md:grid-cols-[2fr,1fr,1fr,44px] gap-3 items-end">
                  <FormInput
                    label={`SOCO Officer ${index + 1}`}
                    value={officer.name}
                    onChange={(e) => updateOfficer(index, { name: e.target.value })}
                    placeholder="Officer name"
                  />
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
                  <button
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, socoOfficers: prev.socoOfficers.filter((_, i) => i !== index) }))}
                    className="h-10 text-red-500 hover:text-red-700 disabled:opacity-40"
                    disabled={form.socoOfficers.length <= 1}
                    aria-label="Remove officer"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <Button
              variant="secondary"
              onClick={() => setForm((prev) => ({ ...prev, socoOfficers: [...prev.socoOfficers, emptyOfficer()] }))}
            >
              Add SOCO Officer
            </Button>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
            <h3 className="text-sm font-semibold text-gray-800">Specialists with Teams</h3>
            <div className="space-y-3">
              {form.specialistTeams.map((row, index) => (
                <div key={`specialist-${index}`} className="grid grid-cols-1 md:grid-cols-[1.5fr,1.5fr,2fr,44px] gap-3 items-end">
                  <CustomSelect
                    label="Role"
                    value={row.role}
                    onChange={(value) => updateSpecialist(index, { role: value })}
                    options={SPECIALIST_ROLE_OPTIONS}
                    placeholder="Select role"
                  />
                  <FormInput
                    label={`Specialist ${index + 1} Name`}
                    value={row.specialist}
                    onChange={(e) => updateSpecialist(index, { specialist: e.target.value })}
                    placeholder="Specialist name"
                  />
                  <FormInput
                    label="Team Members Names"
                    value={row.teamMembers}
                    onChange={(e) => updateSpecialist(index, { teamMembers: e.target.value })}
                    placeholder="Member 1, Member 2"
                  />
                  <button
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, specialistTeams: prev.specialistTeams.filter((_, i) => i !== index) }))}
                    className="h-10 text-red-500 hover:text-red-700 disabled:opacity-40"
                    disabled={form.specialistTeams.length <= 1}
                    aria-label="Remove specialist"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <Button
              variant="secondary"
              onClick={() => setForm((prev) => ({ ...prev, specialistTeams: [...prev.specialistTeams, emptySpecialist()] }))}
            >
              Add Specialist
            </Button>
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
