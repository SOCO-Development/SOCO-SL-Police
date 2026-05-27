'use client';

import { useState, useRef, useCallback, useId } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { AddRowButton, RemoveRowButton, PageHeader, PageLayout, Button, FileUploadButton, ToggleChip } from '@/components/ui';
import CustomSelect from '@/components/forms/CustomSelect';
import DatePicker from '@/components/forms/DatePicker';
import {
    ANNEX_01_SOCO_LABS,
    ANNEX_06_CIVIL_STATUS,
    ANNEX_07_SPOUSE_DESIGNATION,
    ANNEX_12_RANK,
} from '@/lib/annexData';

const SOCO_LABS_OPTIONS = ANNEX_01_SOCO_LABS.map((s) => ({ value: s, label: s }));
const RANK_OPTIONS = ANNEX_12_RANK.map((s) => ({ value: s, label: s }));
const SPOUSE_DESIGNATION_OPTIONS = ANNEX_07_SPOUSE_DESIGNATION.map((s) => ({ value: s, label: s }));
const CHILD_STATUS_OPTIONS = [
    'Toddler',
    'Student',
    'Unmarried Employed',
    'Unmarried Unemployed',
    'Married',
].map((s) => ({ value: s, label: s }));
const ANNEX_13_CATEGORY_OPTIONS = [
    'A1',
    'A',
    'B1',
    'B2',
    'B',
    'C1',
    'C',
    'CE',
    'D1',
    'D',
    'DE',
    'G1',
    'G',
    'J',
    'H',
].map((s) => ({ value: s, label: s }));

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChildRow {
    id: number;
    name: string;
    birthday: string;
    status: string;
}

interface PromotionRow {
    id: number;
    rank: string;
    date: string;
}

interface CourseBeforeRow {
    id: number;
    conNo: string;
    policeStation: string;
    branch: string;
    from: string;
    to: string;
    institute: string;
}

interface CourseAfterRow {
    id: number;
    courseName: string;
    from: string;
    to: string;
    time: string;
    institute: string;
}

// ─── Education Types ──────────────────────────────────────────────────────────

type OLGrade = 'A' | 'B' | 'C' | 'S' | 'F' | '';

interface OLSubjectResult {
    subject: string;
    grade: OLGrade;
}

interface OLOptionalSubject {
    id: number;
    subject: string;
    grade: OLGrade;
}

type ALStream = 'Science' | 'Commerce' | 'Arts' | 'Technology' | '';

interface ALSubjectRow {
    id: number;
    subject: string;
    grade: string;
}

interface DegreeRow {
    id: number;
    degree: string;
    university: string;
    yearFrom: string;
    yearTo: string;
}

type ToggleChoice = 'Yes' | 'No' | '';

interface AssignmentRow {
    id: number;
    socoLab: string;
    from: string;
    to: string;
    duration: string;
    oic: string;
    reason: string;
    reasonOther: string;
}

interface FormData {
    // Section 1
    socoLab: string;
    rankDropdown: string;
    regNo: string;
    fullName: string;
    reportedDate: string;
    dob: string;
    dateJoinedSoco: string;
    socoCourseNo: string;
    socoService: string;
    telOffice: string;
    telResidence: string;
    telMobile: string;
    photoUrl: string;
    // Section 2
    civilStatus: string;
    spouseDesignation: string;
    spouseDesignationOther: string;
    spouseNameAddress: string;
    children: ChildRow[];
    // Section 3
    dateJoinedPolice: string;
    appointedRank: string;
    presentRank: string;
    promotions: PromotionRow[];
    // Section 4 – Education
    olMandatorySubjects: OLSubjectResult[];
    olOptionalSubjects: OLOptionalSubject[];
    alStream: ALStream;
    alSubjects: ALSubjectRow[];
    alGeneralEnglish: string;
    alGeneralKnowledge: string;
    degreesBefore: DegreeRow[];
    degreesAfter: DegreeRow[];
    // Section 5
    localBeforeCourses: CourseBeforeRow[];
    foreignBeforeCourses: CourseBeforeRow[];
    // Section 6
    localAfterCourses: CourseAfterRow[];
    foreignAfterCourses: CourseAfterRow[];
    // Section 7
    drivingLicenseNo: string;
    vehicleCategories: string[];
    heavyVehicleQualified: string;
    lightVehicleQualified: string;
    motorcycleQualified: string;
    // Section 8
    transferDraft: AssignmentRow;
    transferHistory: AssignmentRow[];
    // Section 9
    specialDutyDraft: AssignmentRow;
    specialDutyHistory: AssignmentRow[];
    // Section 10
    orderlyRoomStatus: ToggleChoice;
    orderlyRoomResult: string;
    preliminaryInquiryStatus: ToggleChoice;
    preliminaryInquiryResult: string;
    disciplinaryInquiryStatus: ToggleChoice;
    disciplinaryInquiryResult: string;
    // Section 11
    specialIllnesses: string;
    specialNotes: string;
}

let rowSeed = 1;
const newId = () => rowSeed++;

function createAssignmentRow(): AssignmentRow {
    return {
        id: newId(),
        socoLab: '',
        from: '',
        to: '',
        duration: '',
        oic: '',
        reason: '',
        reasonOther: '',
    };
}

function parseFormDate(value: string): Date | null {
    if (!value) return null;
    const parts = value.split('-');
    if (parts.length !== 3) return null;

    const numbers = parts.map(Number);
    if (numbers.some(Number.isNaN)) return null;

    if (parts[0].length === 4) {
        const [year, month, day] = numbers;
        return new Date(year, month - 1, day);
    }

    const [day, month, year] = numbers;
    return new Date(year, month - 1, day);
}

function formatAssignmentDuration(from: string, to: string): string {
    const fromDate = parseFormDate(from);
    const toDate = parseFormDate(to);

    if (!fromDate || !toDate || Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime()) || toDate < fromDate) {
        return '';
    }

    let months =
        (toDate.getFullYear() - fromDate.getFullYear()) * 12 +
        (toDate.getMonth() - fromDate.getMonth());

    if (toDate.getDate() < fromDate.getDate()) {
        months -= 1;
    }

    if (months <= 0) {
        const dayDiff = Math.max(0, Math.round((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24)));
        return `${dayDiff} Day${dayDiff === 1 ? '' : 's'}`;
    }

    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    const parts: string[] = [];

    if (years > 0) parts.push(`${years} Year${years === 1 ? '' : 's'}`);
    if (remainingMonths > 0) parts.push(`${remainingMonths} Month${remainingMonths === 1 ? '' : 's'}`);

    return parts.join(' ');
}

function defaultForm(): FormData {
    return {
        socoLab: '', rankDropdown: '', regNo: '', fullName: '',
        reportedDate: '', dob: '', dateJoinedSoco: '',
        socoCourseNo: '', socoService: '',
        telOffice: '', telResidence: '', telMobile: '',
        photoUrl: '',
        civilStatus: '', spouseDesignation: '', spouseDesignationOther: '', spouseNameAddress: '',
        children: [{ id: newId(), name: '', birthday: '', status: '' }],
        dateJoinedPolice: '', appointedRank: '', presentRank: '',
        promotions: [{ id: newId(), rank: '', date: '' }],
        // Education
        olMandatorySubjects: [
            { subject: 'First Language (Sinhala / Tamil)', grade: '' },
            { subject: 'English (Second Language)', grade: '' },
            { subject: 'Mathematics', grade: '' },
            { subject: 'Science', grade: '' },
            { subject: 'History', grade: '' },
            { subject: 'Religion', grade: '' },
        ],
        olOptionalSubjects: [
            { id: newId(), subject: '', grade: '' },
            { id: newId(), subject: '', grade: '' },
            { id: newId(), subject: '', grade: '' },
        ],
        alStream: '',
        alSubjects: [
            { id: newId(), subject: '', grade: '' },
            { id: newId(), subject: '', grade: '' },
            { id: newId(), subject: '', grade: '' },
        ],
        alGeneralEnglish: '',
        alGeneralKnowledge: '',
        degreesBefore: [{ id: newId(), degree: '', university: '', yearFrom: '', yearTo: '' }],
        degreesAfter: [{ id: newId(), degree: '', university: '', yearFrom: '', yearTo: '' }],
        localBeforeCourses: [
            { id: newId(), conNo: '', policeStation: '', branch: '', from: '', to: '', institute: '' },
        ],
        foreignBeforeCourses: [
            { id: newId(), conNo: '', policeStation: '', branch: '', from: '', to: '', institute: '' },
        ],
        localAfterCourses: [
            { id: newId(), courseName: '', from: '', to: '', time: '', institute: '' },
        ],
        foreignAfterCourses: [
            { id: newId(), courseName: '', from: '', to: '', time: '', institute: '' },
        ],
        drivingLicenseNo: '',
        vehicleCategories: [],
        heavyVehicleQualified: '',
        lightVehicleQualified: '',
        motorcycleQualified: '',
        transferDraft: createAssignmentRow(),
        transferHistory: [],
        specialDutyDraft: createAssignmentRow(),
        specialDutyHistory: [],
        orderlyRoomStatus: '',
        orderlyRoomResult: '',
        preliminaryInquiryStatus: '',
        preliminaryInquiryResult: '',
        disciplinaryInquiryStatus: '',
        disciplinaryInquiryResult: '',
        specialIllnesses: '',
        specialNotes: '',
    };
}

// ─── Education Constants ──────────────────────────────────────────────────────

const OL_GRADES: OLGrade[] = ['A', 'B', 'C', 'S', 'F'];

const AL_STREAMS: { value: ALStream; label: string }[] = [
    { value: 'Science', label: 'Science Stream' },
    { value: 'Commerce', label: 'Commerce Stream' },
    { value: 'Arts', label: 'Arts / Humanities Stream' },
    { value: 'Technology', label: 'Technology Stream' },
];

const ASSIGNMENT_REASON_OPTIONS = [
    'Administrative Requirement',
    'Operational Requirement',
    'Temporary Attachment',
    'Training / Course',
    'Relief Duty',
    'Other',
].map((label) => ({ value: label, label }));

// ─── Shared UI Components ─────────────────────────────────────────────────────

function SectionHeader({ sectionNo, title, titleSi }: { sectionNo: number; title: string; titleSi?: string }) {
    return (
        <div className="flex items-start gap-3 mb-6 pb-3 border-b border-slate-200">
            <span className="h-8 w-8 shrink-0 rounded-full border border-blue-200 bg-blue-50 text-blue-700 text-xs font-bold flex items-center justify-center shadow-sm">
                {sectionNo}
            </span>
            <div className="pt-0.5">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">{title}</h3>
                {titleSi && <p className="text-xs text-gray-500 mt-1 font-noto-sinhala">{titleSi}</p>}
            </div>
        </div>
    );
}

function FieldLabel({ label, si }: { label: string; si?: string }) {
    return (
        <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide leading-tight">
            {label}{si && <span className="text-gray-400 normal-case tracking-normal ml-1 font-noto-sinhala">/ {si}</span>}
        </label>
    );
}

function GInput({
    value, onChange, placeholder, maxLength, readOnly, type = 'text', min, max
}: {
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    maxLength?: number;
    readOnly?: boolean;
    type?: string;
    min?: number;
    max?: number;
}) {
    return (
        <input
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            maxLength={maxLength}
            min={min}
            max={max}
            readOnly={readOnly}
            className={`w-full min-h-10 px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-800
        focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500
        hover:border-gray-400 transition-colors
        ${readOnly ? 'cursor-default bg-gray-100 text-gray-500' : ''}`}
        />
    );
}

function GTextarea({
    value,
    onChange,
    placeholder,
    className = '',
}: {
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    className?: string;
}) {
    return (
        <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className={`w-full min-h-[124px] rounded-xl border border-gray-300 bg-white px-3 py-3 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 hover:border-gray-400 transition-colors resize-y ${className}`}
        />
    );
}

function YesNo({ value, onChange }: { value: string; onChange: (v: string) => void }) {
    const groupId = useId();

    return (
        <div className="flex gap-3">
            {(['Yes', 'No'] as const).map((opt) => {
                const isYes = opt === 'Yes';
                const isSelected = value === opt;
                const base = 'min-h-10 flex items-center gap-1.5 cursor-pointer text-sm px-3 py-2 rounded-lg border transition-colors';
                const yesStyle = isSelected
                    ? 'bg-green-50 border-green-300 text-green-800 font-medium'
                    : 'bg-white border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-600';
                const noStyle = isSelected
                    ? 'bg-red-50 border-red-300 text-red-800 font-medium'
                    : 'bg-white border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-600';
                return (
                    <label key={opt} className={`${base} ${isYes ? yesStyle : noStyle}`}>
                        <input
                            type="radio"
                            name={`yn-${groupId}`}
                            value={opt}
                            checked={isSelected}
                            onChange={() => onChange(opt)}
                            className={isYes ? 'accent-green-600' : 'accent-red-600'}
                        />
                        {opt}
                    </label>
                );
            })}
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AddOfficerPage() {
    const router = useRouter();
    const [form, setForm] = useState<FormData>(defaultForm);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const fileRef = useRef<HTMLInputElement>(null);
    const [submitted, setSubmitted] = useState(false);
    const civilStatusRadioName = useId();
    const showSpouseAndChildren = form.civilStatus === 'Married';

    const set = useCallback(<K extends keyof FormData>(key: K, val: FormData[K]) => {
        setForm((f) => ({ ...f, [key]: val }));
    }, []);

    const toggleVehicleCategory = useCallback((value: string) => {
        setForm((f) => {
            const cur = f.vehicleCategories;
            const has = cur.includes(value);
            return {
                ...f,
                vehicleCategories: has ? cur.filter((v) => v !== value) : [...cur, value],
            };
        });
    }, []);

    // Photo upload
    const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const url = URL.createObjectURL(file);
        setPhotoPreview(url);
        set('photoUrl', url);
    };

    // Children rows
    const addChild = () => {
        set('children', [...form.children, { id: newId(), name: '', birthday: '', status: '' }]);
    };
    const updateChild = (id: number, patch: Partial<ChildRow>) =>
        set('children', form.children.map((c) => c.id === id ? { ...c, ...patch } : c));
    const removeChild = (id: number) =>
        set('children', form.children.filter((c) => c.id !== id));

    // Promotions
    const addPromotion = () => {
        set('promotions', [...form.promotions, { id: newId(), rank: '', date: '' }]);
    };
    const updatePromotion = (id: number, patch: Partial<PromotionRow>) =>
        set('promotions', form.promotions.map((p) => p.id === id ? { ...p, ...patch } : p));
    const removePromotion = (id: number) =>
        set('promotions', form.promotions.filter((p) => p.id !== id));

    const updateBeforeCourse = (
        section: 'localBeforeCourses' | 'foreignBeforeCourses',
        id: number,
        patch: Partial<CourseBeforeRow>
    ) => {
        set(section, form[section].map((row) => (row.id === id ? { ...row, ...patch } : row)));
    };

    const addBeforeCourse = (section: 'localBeforeCourses' | 'foreignBeforeCourses') => {
        setForm((f) => ({
            ...f,
            [section]: [
                ...f[section],
                { id: newId(), conNo: '', policeStation: '', branch: '', from: '', to: '', institute: '' },
            ],
        }));
    };

    const removeBeforeCourse = (section: 'localBeforeCourses' | 'foreignBeforeCourses', id: number) => {
        if (form[section].length <= 1) return;
        set(section, form[section].filter((r) => r.id !== id));
    };

    const updateAfterCourse = (
        section: 'localAfterCourses' | 'foreignAfterCourses',
        id: number,
        patch: Partial<CourseAfterRow>
    ) => {
        set(section, form[section].map((row) => (row.id === id ? { ...row, ...patch } : row)));
    };

    const addAfterCourse = (section: 'localAfterCourses' | 'foreignAfterCourses') => {
        setForm((f) => ({
            ...f,
            [section]: [
                ...f[section],
                { id: newId(), courseName: '', from: '', to: '', time: '', institute: '' },
            ],
        }));
    };

    const removeAfterCourse = (section: 'localAfterCourses' | 'foreignAfterCourses', id: number) => {
        if (form[section].length <= 1) return;
        set(section, form[section].filter((r) => r.id !== id));
    };

    const updateAssignmentDraft = (section: 'transfer' | 'specialDuty', patch: Partial<AssignmentRow>) => {
        setForm((f) => {
            const currentDraft = section === 'transfer' ? f.transferDraft : f.specialDutyDraft;
            const nextDraft = { ...currentDraft, ...patch };

            if (patch.from !== undefined || patch.to !== undefined) {
                nextDraft.duration = formatAssignmentDuration(nextDraft.from, nextDraft.to);
            }

            return section === 'transfer'
                ? { ...f, transferDraft: nextDraft }
                : { ...f, specialDutyDraft: nextDraft };
        });
    };

    const addAssignmentRecord = (section: 'transfer' | 'specialDuty') => {
        setForm((f) => {
            const draft = section === 'transfer' ? f.transferDraft : f.specialDutyDraft;
            const duration = draft.duration || formatAssignmentDuration(draft.from, draft.to);
            const reasonValid = draft.reason === 'Other'
                ? Boolean(draft.reasonOther.trim())
                : Boolean(draft.reason);
            const isComplete = Boolean(draft.socoLab && draft.from && draft.to && reasonValid && duration);

            if (!isComplete) return f;

            const nextRow = { ...draft, id: newId(), duration };

            return section === 'transfer'
                ? {
                      ...f,
                      transferHistory: [...f.transferHistory, nextRow],
                      transferDraft: createAssignmentRow(),
                  }
                : {
                      ...f,
                      specialDutyHistory: [...f.specialDutyHistory, nextRow],
                      specialDutyDraft: createAssignmentRow(),
                  };
        });
    };

    const removeAssignmentRecord = (section: 'transfer' | 'specialDuty', id: number) => {
        setForm((f) =>
            section === 'transfer'
                ? { ...f, transferHistory: f.transferHistory.filter((row) => row.id !== id) }
                : { ...f, specialDutyHistory: f.specialDutyHistory.filter((row) => row.id !== id) },
        );
    };

    // ── Education handlers ────────────────────────────────────────────────────

    const updateOLMandatory = (index: number, grade: OLGrade) => {
        const updated = form.olMandatorySubjects.map((s, i) => i === index ? { ...s, grade } : s);
        set('olMandatorySubjects', updated);
    };

    const updateOLOptional = (id: number, patch: Partial<OLOptionalSubject>) => {
        set('olOptionalSubjects', form.olOptionalSubjects.map((s) => s.id === id ? { ...s, ...patch } : s));
    };

    const updateALSubject = (id: number, patch: Partial<ALSubjectRow>) => {
        set('alSubjects', form.alSubjects.map((s) => s.id === id ? { ...s, ...patch } : s));
    };

    const addALSubject = () => {
        if (form.alSubjects.length >= 5) return;
        set('alSubjects', [...form.alSubjects, { id: newId(), subject: '', grade: '' }]);
    };

    const removeALSubject = (id: number) => {
        if (form.alSubjects.length <= 3) return;
        set('alSubjects', form.alSubjects.filter((s) => s.id !== id));
    };

    const updateDegree = (section: 'degreesBefore' | 'degreesAfter', id: number, patch: Partial<DegreeRow>) => {
        set(section, form[section].map((d) => d.id === id ? { ...d, ...patch } : d));
    };

    const addDegree = (section: 'degreesBefore' | 'degreesAfter') => {
        if (form[section].length >= 6) return;
        set(section, [...form[section], { id: newId(), degree: '', university: '', yearFrom: '', yearTo: '' }]);
    };

    const removeDegree = (section: 'degreesBefore' | 'degreesAfter', id: number) => {
        if (form[section].length <= 1) return;
        set(section, form[section].filter((d) => d.id !== id));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (form.alSubjects.length < 3) {
            alert('Please keep at least 3 A/L subject rows.');
            return;
        }
        setSubmitted(true);
        // Future: POST to API
        alert('Officer details saved successfully!');
    };

    const canConfirmTransfer = Boolean(
        form.transferDraft.socoLab &&
        form.transferDraft.from &&
        form.transferDraft.to &&
        form.transferDraft.duration &&
        form.transferDraft.reason &&
        (form.transferDraft.reason !== 'Other' || form.transferDraft.reasonOther.trim()),
    );

    const canConfirmSpecialDuty = Boolean(
        form.specialDutyDraft.socoLab &&
        form.specialDutyDraft.from &&
        form.specialDutyDraft.to &&
        form.specialDutyDraft.duration &&
        form.specialDutyDraft.reason &&
        (form.specialDutyDraft.reason !== 'Other' || form.specialDutyDraft.reasonOther.trim()),
    );

    return (
        <PageLayout>
            <PageHeader
                backHref="/crime-officer"
                title="Add SOCO Officer"
                description="Complete all required details to register a new officer profile."
            />
            {submitted && (
                <p className="mb-6 -mt-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 inline-block">
                    Officer details saved successfully.
                </p>
            )}

            <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden animate-fade-in" style={{ minHeight: '400px' }}>
                            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

                            {/* ─── SECTION 1: Personal Details ─────────────────────────────── */}
                            <div className="p-4 sm:p-5 rounded-xl border border-sky-200 bg-sky-50/80">
                                <SectionHeader
                                    sectionNo={1}
                                    title="PERSONNEL DETAILS OF SCENE OF CRIME OFFICER"
                                    titleSi="අපරාධ ස්ථාන නිලධාරිගේ පුද්ගලික තොරතුරු"
                                />

                                <div className="flex flex-col xl:flex-row xl:items-start gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                            {/* SOCO Lab */}
                                            <div>
                                                <FieldLabel label="SOCO Lab" si="SOCO රසායනාගාරය" />
                                                <CustomSelect value={form.socoLab} onChange={(v) => set('socoLab', v)}
                                                    options={SOCO_LABS_OPTIONS} placeholder="Select SOCO Lab" />
                                            </div>

                                            {/* Rank & Reg No */}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 xl:col-span-2">
                                                <div>
                                                    <FieldLabel label="Rank" si="තනතුර" />
                                                    <CustomSelect value={form.rankDropdown} onChange={(v) => set('rankDropdown', v)}
                                                        options={RANK_OPTIONS} placeholder="Rank" />
                                                </div>
                                                <div>
                                                    <FieldLabel label="Reg. No" si="රෙජි. අංකය" />
                                                    <GInput value={form.regNo} onChange={(v) => set('regNo', v)} placeholder="Register Number" />
                                                </div>
                                            </div>

                                            {/* Full Name */}
                                            <div className="md:col-span-2 xl:col-span-3">
                                                <FieldLabel label="Full Name" si="සම්පූර්ණ නම (max 50)" />
                                                <GInput value={form.fullName} onChange={(v) => set('fullName', v)}
                                                    placeholder="Full name" maxLength={50} />
                                                <p className="text-xs text-gray-400 mt-1">{form.fullName.length}/50</p>
                                            </div>

                                            {/* Dates */}
                                            <div>
                                                <FieldLabel label="Reported Date / වාර්තා දිනය" />
                                                <DatePicker value={form.reportedDate} onChange={(v) => set('reportedDate', v)} />
                                            </div>
                                            <div>
                                                <FieldLabel label="Date of Birth / උපන් දිනය" />
                                                <DatePicker value={form.dob} onChange={(v) => set('dob', v)} />
                                            </div>
                                            <div>
                                                <FieldLabel label="Date Joined SOCO Project / ව්‍යාපෘතියට එකතු වූ දිනය" />
                                                <DatePicker value={form.dateJoinedSoco} onChange={(v) => set('dateJoinedSoco', v)} />
                                            </div>

                                            {/* Course & Service */}
                                            <div>
                                                <FieldLabel label="SOCO Course Number / SOCO පාඨමාලා අංකය" />
                                                <GInput value={form.socoCourseNo} onChange={(v) => set('socoCourseNo', v)} placeholder="Course Number" />
                                            </div>
                                            <div>
                                                <FieldLabel label="SOCO Service / SOCO සේවය" />
                                                <GInput value={form.socoService} onChange={(v) => set('socoService', v)} placeholder="Service details" />
                                            </div>

                                            {/* Telephone */}
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:col-span-2 xl:col-span-3">
                                                <div>
                                                    <FieldLabel label="Office Tel. / කාර්යාල දුරකථනය" />
                                                    <GInput value={form.telOffice} onChange={(v) => set('telOffice', v)} placeholder="0XX-XXXXXXX" type="tel" />
                                                </div>
                                                <div>
                                                    <FieldLabel label="Residence Tel. / නිවාස දුරකථනය" />
                                                    <GInput value={form.telResidence} onChange={(v) => set('telResidence', v)} placeholder="0XX-XXXXXXX" type="tel" />
                                                </div>
                                                <div>
                                                    <FieldLabel label="Mobile / ජංගම දුරකථනය" />
                                                    <GInput value={form.telMobile} onChange={(v) => set('telMobile', v)} placeholder="07X-XXXXXXX" type="tel" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Photo upload — top right */}
                                    <div className="shrink-0 w-full xl:w-auto flex flex-col items-center">
                                        <div className="w-full max-w-[calc(2in+2.5rem)] mx-auto flex flex-col items-center">
                                            <label className="block w-full text-center text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide leading-snug font-noto-sinhala">
                                                Photo (2&quot; × 2.5&quot;) / ඡායාරූපය
                                            </label>
                                            <div className="rounded-xl border border-sky-200 bg-white pt-3 px-4 pb-4 xl:sticky xl:top-24 shadow-sm w-full flex flex-col items-stretch gap-4 transition-shadow duration-200 hover:shadow-md hover:border-sky-300/80">
                                                <div
                                                    role="button"
                                                    tabIndex={0}
                                                    className="group relative border-2 border-dashed border-gray-300 rounded-xl bg-gray-50/80 flex items-center justify-center overflow-hidden cursor-pointer box-border max-w-full mx-auto
                                                        transition-all duration-200 ease-out
                                                        hover:border-sky-500 hover:bg-sky-50 hover:shadow-md hover:ring-2 hover:ring-sky-200/70
                                                        active:scale-[0.99]
                                                        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2"
                                                    style={{
                                                        width: 'min(2in, 100%)',
                                                        aspectRatio: '2 / 2.5',
                                                        height: 'auto',
                                                        boxSizing: 'border-box',
                                                    }}
                                                    onClick={() => fileRef.current?.click()}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter' || e.key === ' ') {
                                                            e.preventDefault();
                                                            fileRef.current?.click();
                                                        }
                                                    }}
                                                >
                                                    {photoPreview
                                                        ? <img src={photoPreview} alt="Photo" className="w-full h-full min-h-0 object-cover" />
                                                        : (
                                                            <div className="flex h-full w-full min-h-0 flex-col items-center justify-center gap-1.5 px-3 py-2 text-center pointer-events-none">
                                                                <span className="text-xs font-medium text-gray-500 group-hover:text-sky-800 transition-colors duration-200">
                                                                    Click to upload
                                                                </span>
                                                                <span className="text-[11px] text-gray-400 group-hover:text-sky-700/90 transition-colors duration-200 font-noto-sinhala">
                                                                    2″ × 2.5″
                                                                </span>
                                                            </div>
                                                        )}
                                                </div>
                                                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
                                                <FileUploadButton variant="sky-block" type="button" onClick={() => fileRef.current?.click()}>Upload Photo</FileUploadButton>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* ─── SECTION 2: Family Details ───────────────────────────────── */}
                            <div className="p-4 sm:p-5 rounded-xl border border-emerald-200 bg-emerald-50/70">
                                <SectionHeader sectionNo={2} title="Family Details" titleSi="පවුල් තොරතුරු" />

                                <div
                                    className={`grid grid-cols-1 gap-4 ${
                                        showSpouseAndChildren ? 'md:grid-cols-3' : 'md:grid-cols-1'
                                    }`}
                                >
                                    <div className="min-w-0">
                                        <FieldLabel label="Civil Status / සිවිල් තත්වය" />
                                        <div className="grid grid-cols-2 gap-2 min-h-10 rounded-lg border border-gray-200 bg-gray-50/70 p-2">
                                            {ANNEX_06_CIVIL_STATUS.map((option) => (
                                                <label
                                                    key={option}
                                                    className="inline-flex items-center gap-2 text-sm text-gray-700 cursor-pointer"
                                                >
                                                    <input
                                                        type="radio"
                                                        name={civilStatusRadioName}
                                                        value={option}
                                                        checked={form.civilStatus === option}
                                                        onChange={() => {
                                                            if (option === 'Unmarried') {
                                                                setForm((f) => ({
                                                                    ...f,
                                                                    civilStatus: 'Unmarried',
                                                                    spouseDesignation: '',
                                                                    spouseDesignationOther: '',
                                                                    spouseNameAddress: '',
                                                                    children: [
                                                                        {
                                                                            id: newId(),
                                                                            name: '',
                                                                            birthday: '',
                                                                            status: '',
                                                                        },
                                                                    ],
                                                                }));
                                                            } else {
                                                                set('civilStatus', option);
                                                            }
                                                        }}
                                                        className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500 shrink-0"
                                                    />
                                                    {option}
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    {showSpouseAndChildren ? (
                                        <>
                                            <div className="min-w-0">
                                                <FieldLabel label="Spouse Designation / කලත්‍රයාගේ තනතුර" />
                                                <CustomSelect
                                                    value={form.spouseDesignation}
                                                    onChange={(v) => {
                                                        set('spouseDesignation', v);
                                                        if (v !== 'Other') set('spouseDesignationOther', '');
                                                    }}
                                                    options={SPOUSE_DESIGNATION_OPTIONS}
                                                    placeholder="Select"
                                                />
                                            </div>

                                            <div
                                                className={`min-w-0 ${
                                                    form.spouseDesignation === 'Other' ? '' : 'hidden md:block'
                                                }`}
                                            >
                                                {form.spouseDesignation === 'Other' ? (
                                                    <>
                                                        <FieldLabel label="Specify designation / තනතුර දක්වන්න" />
                                                        <GInput
                                                            value={form.spouseDesignationOther}
                                                            onChange={(v) => set('spouseDesignationOther', v)}
                                                            placeholder="Enter designation"
                                                        />
                                                    </>
                                                ) : null}
                                            </div>

                                            <div className="md:col-span-3 min-w-0">
                                                <FieldLabel label="Spouse Name & Address of Institute / කලත්‍රයාගේ නම හා ආයතනයේ ලිපිනය" />
                                                <GInput
                                                    value={form.spouseNameAddress}
                                                    onChange={(v) => set('spouseNameAddress', v)}
                                                    placeholder="Name and institute address"
                                                />
                                            </div>
                                        </>
                                    ) : null}
                                </div>

                                {/* Children table */}
                                {showSpouseAndChildren ? (
                                <div className="mt-6">
                                    <FieldLabel label="Details of Children / දරුවන්ගේ තොරතුරු" />
                                    <div className="overflow-x-auto rounded-xl border border-gray-200 mt-2">
                                        <table className="data-grid-table data-grid-table--compact w-full text-sm text-gray-900">
                                            <thead>
                                                <tr className="bg-gray-50 border-b border-gray-200">
                                                    <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide font-noto-sinhala">Name of the Child / දරුවාගේ නම</th>
                                                    <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide w-48 font-noto-sinhala">Birthday / උපන්දිනය</th>
                                                    <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide font-noto-sinhala">Status / තත්වය</th>
                                                    <th className="px-2 py-2.5 text-right w-px whitespace-nowrap">
                                                        <span className="sr-only">Actions</span>
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {form.children.map((child) => (
                                                    <tr key={child.id} className="border-b border-gray-100 last:border-0">
                                                        <td className="px-2 py-1.5">
                                                            <GInput value={child.name} onChange={(v) => updateChild(child.id, { name: v })} placeholder="Child name" />
                                                        </td>
                                                        <td className="px-2 py-1.5">
                                                            <DatePicker
                                                                value={child.birthday}
                                                                onChange={(v) => updateChild(child.id, { birthday: v })}
                                                            />
                                                        </td>
                                                        <td className="px-2 py-1.5">
                                                            <CustomSelect
                                                                value={child.status}
                                                                onChange={(v) => updateChild(child.id, { status: v })}
                                                                options={CHILD_STATUS_OPTIONS}
                                                                placeholder="Select status"
                                                            />
                                                        </td>
                                                        <td className="px-2 py-1.5 align-middle text-right whitespace-nowrap w-px">
                                                            {form.children.length > 1 ? (
                                                                <RemoveRowButton onClick={() => removeChild(child.id)} />
                                                            ) : null}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <AddRowButton onClick={addChild}>Add Child</AddRowButton>
                                </div>
                                ) : null}
                            </div>

                            {/* ─── SECTION 3: Official Information ─────────────────────────── */}
                            <div className="p-4 sm:p-5 rounded-xl border border-indigo-200 bg-indigo-50/65">
                                <SectionHeader sectionNo={3} title="Official Information" titleSi="නිල තොරතුරු" />

                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                    <div>
                                        <FieldLabel label="Date Joined Police Dept. / පොලිස් දෙපාර්තමේන්තු" />
                                        <DatePicker value={form.dateJoinedPolice} onChange={(v) => set('dateJoinedPolice', v)} />
                                    </div>
                                    <div>
                                        <FieldLabel label="Appointed Rank / පත් කළ තනතුර" />
                                        <CustomSelect value={form.appointedRank} onChange={(v) => set('appointedRank', v)}
                                            options={RANK_OPTIONS} placeholder="Select" />
                                    </div>
                                    <div>
                                        <FieldLabel label="Present Rank / වත්මන් තනතුර" />
                                        <CustomSelect value={form.presentRank} onChange={(v) => set('presentRank', v)}
                                            options={RANK_OPTIONS} placeholder="Select" />
                                    </div>
                                </div>

                                {/* Promotions */}
                                <div className="mt-6">
                                    <FieldLabel label="Promotion Dates / උසස් කිරීමේ දිනය" />
                                    <div className="overflow-x-auto rounded-xl border border-gray-200 mt-2">
                                        <table className="data-grid-table data-grid-table--compact w-full text-sm text-gray-900">
                                            <thead>
                                                <tr className="bg-gray-50 border-b border-gray-200">
                                                    <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide w-48">
                                                        Rank / තනතුර
                                                    </th>
                                                    <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide font-noto-sinhala">Date / දිනය (DD-MM-YYYY)</th>
                                                    <th className="px-2 py-2.5 text-right w-px whitespace-nowrap">
                                                        <span className="sr-only">Actions</span>
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {form.promotions.map((promo) => (
                                                    <tr key={promo.id} className="border-b border-gray-100 last:border-0">
                                                        <td className="px-2 py-1.5">
                                                            <CustomSelect value={promo.rank} onChange={(v) => updatePromotion(promo.id, { rank: v })}
                                                                options={RANK_OPTIONS} placeholder="Rank" />
                                                        </td>
                                                        <td className="px-2 py-1.5">
                                                            <DatePicker value={promo.date} onChange={(v) => updatePromotion(promo.id, { date: v })} />
                                                        </td>
                                                        <td className="px-2 py-1.5 align-middle text-right whitespace-nowrap w-px">
                                                            {form.promotions.length > 1 ? (
                                                                <RemoveRowButton onClick={() => removePromotion(promo.id)} />
                                                            ) : null}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <AddRowButton onClick={addPromotion}>Add Promotion</AddRowButton>
                                </div>
                            </div>

                            {/* ─── SECTION 4: Education ────────────────────────────────────── */}
                            <div className="p-4 sm:p-5 rounded-xl border border-violet-200 bg-violet-50/60">
                                <SectionHeader sectionNo={4} title="Education" titleSi="අධ්‍යාපන සුදුසුකම්" />

                                {/* ── O/L Results ─────────────────────────────────────────── */}
                                <div className="mb-6">
                                    <h4 className="text-sm font-bold text-violet-900 uppercase tracking-wide mb-3">
                                        Ordinary Level (O/L) Results
                                    </h4>

                                    {/* Mandatory subjects */}
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Mandatory Subjects</p>
                                    <div className="overflow-x-auto rounded-xl border border-violet-100 mb-4">
                                        <table className="data-grid-table data-grid-table--compact w-full text-sm text-gray-900">
                                            <thead>
                                                <tr className="bg-violet-50 border-b border-violet-100">
                                                    <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Subject</th>
                                                    <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide w-56">Grade</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {form.olMandatorySubjects.map((row, idx) => (
                                                    <tr key={row.subject} className="border-b border-violet-50 last:border-0 odd:bg-white even:bg-violet-50/20">
                                                        <td className="px-3 py-2 text-sm text-gray-800 font-medium">{row.subject}</td>
                                                        <td className="px-2 py-1.5">
                                                            <div className="flex gap-1.5 flex-wrap">
                                                                {OL_GRADES.map((g) => (
                                                                    <ToggleChip key={g} size="grade" active={row.grade === g} activeVariant={g === 'F' ? 'danger' : 'violet'} onClick={() => updateOLMandatory(idx, g)}>{g}</ToggleChip>
                                                                ))}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Optional subjects */}
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Optional Subjects</p>
                                    <div className="overflow-x-auto rounded-xl border border-violet-100">
                                        <table className="data-grid-table data-grid-table--compact w-full text-sm text-gray-900">
                                            <thead>
                                                <tr className="bg-violet-50 border-b border-violet-100">
                                                    <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide w-8">#</th>
                                                    <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Subject</th>
                                                    <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide w-56">Grade</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {form.olOptionalSubjects.map((row, idx) => (
                                                    <tr key={row.id} className="border-b border-violet-50 last:border-0 odd:bg-white even:bg-violet-50/20">
                                                        <td className="px-3 py-2 text-xs text-gray-400 font-semibold">{idx + 1}</td>
                                                        <td className="px-2 py-1.5">
                                                            <GInput
                                                                value={row.subject}
                                                                onChange={(v) => updateOLOptional(row.id, { subject: v })}
                                                                placeholder="Subject name"
                                                            />
                                                        </td>
                                                        <td className="px-2 py-1.5">
                                                            <div className="flex gap-1.5 flex-wrap">
                                                                {OL_GRADES.map((g) => (
                                                                    <ToggleChip key={g} size="grade" active={row.grade === g} activeVariant={g === 'F' ? 'danger' : 'violet'} onClick={() => updateOLOptional(row.id, { grade: g })}>{g}</ToggleChip>
                                                                ))}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* ── A/L Results ─────────────────────────────────────────── */}
                                <div className="mb-6">
                                    <h4 className="text-sm font-bold text-violet-900 uppercase tracking-wide mb-3">
                                        Advanced Level (A/L) Results
                                    </h4>

                                    <div className="mb-4">
                                        <FieldLabel label="Stream / ධාරාව" />
                                        <div className="flex flex-wrap gap-2">
                                            {AL_STREAMS.map((s) => (
                                                <ToggleChip key={s.value} active={form.alStream === s.value} onClick={() => set('alStream', s.value)}>{s.label}</ToggleChip>
                                            ))}
                                        </div>
                                    </div>

                                    {form.alStream && (
                                        <div className="rounded-xl border border-violet-100 overflow-hidden">
                                            <div className="px-4 py-2.5 bg-violet-50/70 border-b border-violet-100">
                                                <span className="text-xs font-bold text-violet-800 uppercase tracking-wide">{form.alStream} Stream — Subjects</span>
                                            </div>
                                            <div className="overflow-x-auto">
                                                <table className="data-grid-table data-grid-table--compact w-full text-sm text-gray-900">
                                                    <thead>
                                                        <tr className="bg-gray-50 border-b border-gray-200">
                                                            <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">#</th>
                                                            <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Subject Name</th>
                                                            <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide w-32">Grade</th>
                                                            <th className="px-2 py-2.5 w-px whitespace-nowrap"><span className="sr-only">Actions</span></th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {form.alSubjects.map((row, idx) => (
                                                            <tr key={row.id} className="border-b border-gray-100 last:border-0">
                                                                <td className="px-3 py-1.5 text-xs text-gray-400 font-semibold">{idx + 1}</td>
                                                                <td className="px-2 py-1.5">
                                                                    <GInput
                                                                        value={row.subject}
                                                                        onChange={(v) => updateALSubject(row.id, { subject: v })}
                                                                        placeholder="Subject name"
                                                                    />
                                                                </td>
                                                                <td className="px-2 py-1.5">
                                                                    <GInput
                                                                        value={row.grade}
                                                                        onChange={(v) => updateALSubject(row.id, { grade: v })}
                                                                        placeholder="e.g. A, B, C"
                                                                        maxLength={3}
                                                                    />
                                                                </td>
                                                                <td className="px-2 py-1.5 text-right whitespace-nowrap w-px">
                                                                    {form.alSubjects.length > 3 && (
                                                                        <RemoveRowButton onClick={() => removeALSubject(row.id)} />
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                        {/* General English */}
                                                        <tr className="border-b border-gray-100 bg-violet-50/30">
                                                            <td className="px-3 py-1.5 text-xs text-gray-400 font-semibold">GE</td>
                                                            <td className="px-3 py-2 text-sm font-medium text-gray-700">General English</td>
                                                            <td className="px-2 py-1.5">
                                                                <GInput
                                                                    value={form.alGeneralEnglish}
                                                                    onChange={(v) => set('alGeneralEnglish', v)}
                                                                    placeholder="e.g. A, B, C"
                                                                    maxLength={3}
                                                                />
                                                            </td>
                                                            <td />
                                                        </tr>
                                                        {/* General Knowledge */}
                                                        <tr className="bg-violet-50/30">
                                                            <td className="px-3 py-1.5 text-xs text-gray-400 font-semibold">GK</td>
                                                            <td className="px-3 py-2 text-sm font-medium text-gray-700">General Knowledge</td>
                                                            <td className="px-2 py-1.5">
                                                                <GInput
                                                                    value={form.alGeneralKnowledge}
                                                                    onChange={(v) => set('alGeneralKnowledge', v)}
                                                                    placeholder="e.g. A, B, C"
                                                                    maxLength={3}
                                                                />
                                                            </td>
                                                            <td />
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </div>
                                            {form.alSubjects.length < 5 && (
                                                <div className="px-4 pb-3">
                                                    <AddRowButton onClick={addALSubject}>Add Subject</AddRowButton>
                                                </div>
                                            )}
                                            {form.alSubjects.length >= 5 && (
                                                <p className="px-4 pb-3 text-xs text-gray-400">Maximum 5 subjects reached.</p>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* ── Degrees ─────────────────────────────────────────────── */}
                                <div className="grid grid-cols-1 gap-5">
                                    {/* Before joining police */}
                                    <div className="rounded-xl border border-violet-100 bg-white overflow-hidden shadow-sm">
                                        <div className="px-4 py-3 border-b border-violet-100 bg-violet-50/60">
                                            <h4 className="text-sm font-bold text-violet-900 uppercase tracking-wide">Degrees / Qualifications Before Joining Police</h4>
                                            <p className="text-xs text-violet-700 mt-0.5">Obtained prior to joining the Police Department</p>
                                        </div>
                                        <div className="p-4 space-y-3">
                                            {form.degreesBefore.map((row, idx) => (
                                                <div key={row.id} className="rounded-lg border border-gray-200 bg-gray-50/50 p-3 space-y-2">
                                                    <div className="flex items-center justify-between gap-2 mb-1">
                                                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Entry {idx + 1}</span>
                                                        {form.degreesBefore.length > 1 && (
                                                            <RemoveRowButton onClick={() => removeDegree('degreesBefore', row.id)} size="sm" />
                                                        )}
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                        <div>
                                                            <FieldLabel label="Degree / Qualification" />
                                                            <GInput value={row.degree} onChange={(v) => updateDegree('degreesBefore', row.id, { degree: v })} placeholder="e.g. BSc Computer Science" />
                                                        </div>
                                                        <div>
                                                            <FieldLabel label="University / Institute" />
                                                            <GInput value={row.university} onChange={(v) => updateDegree('degreesBefore', row.id, { university: v })} placeholder="University or Institute name" />
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <div className="w-32">
                                                            <FieldLabel label="From" />
                                                            <GInput value={row.yearFrom} onChange={(v) => updateDegree('degreesBefore', row.id, { yearFrom: v })} placeholder="YYYY" maxLength={4} />
                                                        </div>
                                                        <div className="w-32">
                                                            <FieldLabel label="To" />
                                                            <GInput value={row.yearTo} onChange={(v) => updateDegree('degreesBefore', row.id, { yearTo: v })} placeholder="YYYY" maxLength={4} />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        {form.degreesBefore.length < 6 && (
                                            <div className="px-4 pb-4"><AddRowButton onClick={() => addDegree('degreesBefore')}>Add Qualification</AddRowButton></div>
                                        )}
                                    </div>

                                    {/* After joining police (sponsored) */}
                                    <div className="rounded-xl border border-violet-100 bg-white overflow-hidden shadow-sm">
                                        <div className="px-4 py-3 border-b border-violet-100 bg-violet-50/60">
                                            <h4 className="text-sm font-bold text-violet-900 uppercase tracking-wide">Degrees / Qualifications After Joining Police (Sponsored)</h4>
                                            <p className="text-xs text-violet-700 mt-0.5">Sponsored degrees obtained after joining the Police Department</p>
                                        </div>
                                        <div className="p-4 space-y-3">
                                            {form.degreesAfter.map((row, idx) => (
                                                <div key={row.id} className="rounded-lg border border-gray-200 bg-gray-50/50 p-3 space-y-2">
                                                    <div className="flex items-center justify-between gap-2 mb-1">
                                                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Entry {idx + 1}</span>
                                                        {form.degreesAfter.length > 1 && (
                                                            <RemoveRowButton onClick={() => removeDegree('degreesAfter', row.id)} size="sm" />
                                                        )}
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                        <div>
                                                            <FieldLabel label="Degree / Qualification" />
                                                            <GInput value={row.degree} onChange={(v) => updateDegree('degreesAfter', row.id, { degree: v })} placeholder="e.g. LLB" />
                                                        </div>
                                                        <div>
                                                            <FieldLabel label="University / Institute" />
                                                            <GInput value={row.university} onChange={(v) => updateDegree('degreesAfter', row.id, { university: v })} placeholder="University or Institute name" />
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <div className="w-32">
                                                            <FieldLabel label="From" />
                                                            <GInput value={row.yearFrom} onChange={(v) => updateDegree('degreesAfter', row.id, { yearFrom: v })} placeholder="YYYY" maxLength={4} />
                                                        </div>
                                                        <div className="w-32">
                                                            <FieldLabel label="To" />
                                                            <GInput value={row.yearTo} onChange={(v) => updateDegree('degreesAfter', row.id, { yearTo: v })} placeholder="YYYY" maxLength={4} />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        {form.degreesAfter.length < 6 && (
                                            <div className="px-4 pb-4"><AddRowButton onClick={() => addDegree('degreesAfter')}>Add Qualification</AddRowButton></div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* ─── SECTION 5: Courses Before SOCO ──────────────────────────── */}
                            <div className="p-5 sm:p-6 rounded-2xl border border-amber-200 bg-amber-50/70">
                                <SectionHeader
                                    sectionNo={5}
                                    title="DETAILS OF COURSES (BEFORE JOINED THE SOCO PROJECT)"
                                />
                                <p className="text-sm text-amber-900/80 mb-4">
                                    Capture departmental and external training completed before joining the SOCO project.
                                </p>

                                <div className="grid grid-cols-1 gap-5">
                                    <div className="rounded-xl border border-amber-100 bg-white shadow-sm overflow-hidden">
                                        <div className="px-4 py-3 border-b border-amber-100 bg-amber-50/60">
                                            <h4 className="text-sm font-bold text-amber-900 uppercase tracking-wide">Local</h4>
                                            <p className="text-xs text-amber-700">Department & Others</p>
                                        </div>
                                        <div className="overflow-x-auto">
                                            <table className="data-grid-table data-grid-table--compact min-w-[760px] w-full text-sm text-gray-900">
                                                <thead>
                                                    <tr className="bg-gray-50 border-b border-gray-200">
                                                        <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Con. No.</th>
                                                        <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Police Station</th>
                                                        <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Branch</th>
                                                        <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">From</th>
                                                        <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">To</th>
                                                        <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Institute</th>
                                                        <th className="px-2 py-2 text-right w-px whitespace-nowrap">
                                                            <span className="sr-only">Actions</span>
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {form.localBeforeCourses.map((row) => (
                                                        <tr key={row.id} className="border-b border-gray-100 odd:bg-white even:bg-amber-50/20 last:border-0">
                                                            <td className="px-2 py-1.5"><GInput value={row.conNo} onChange={(v) => updateBeforeCourse('localBeforeCourses', row.id, { conNo: v })} /></td>
                                                            <td className="px-2 py-1.5"><GInput value={row.policeStation} onChange={(v) => updateBeforeCourse('localBeforeCourses', row.id, { policeStation: v })} /></td>
                                                            <td className="px-2 py-1.5"><GInput value={row.branch} onChange={(v) => updateBeforeCourse('localBeforeCourses', row.id, { branch: v })} /></td>
                                                            <td className="px-2 py-1.5"><DatePicker value={row.from} onChange={(v) => updateBeforeCourse('localBeforeCourses', row.id, { from: v })} /></td>
                                                            <td className="px-2 py-1.5"><DatePicker value={row.to} onChange={(v) => updateBeforeCourse('localBeforeCourses', row.id, { to: v })} /></td>
                                                            <td className="px-2 py-1.5"><GInput value={row.institute} onChange={(v) => updateBeforeCourse('localBeforeCourses', row.id, { institute: v })} /></td>
                                                            <td className="px-2 py-1.5 align-middle text-right whitespace-nowrap w-px">
                                                                {form.localBeforeCourses.length > 1 ? (
                                                                    <RemoveRowButton onClick={() => removeBeforeCourse('localBeforeCourses', row.id)} />
                                                                ) : null}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                        <div className="px-4 pb-3">
                                            <AddRowButton onClick={() => addBeforeCourse('localBeforeCourses')}>Add row</AddRowButton>
                                        </div>
                                    </div>

                                    <div className="rounded-xl border border-amber-100 bg-white shadow-sm overflow-hidden">
                                        <div className="px-4 py-3 border-b border-amber-100 bg-amber-50/60">
                                            <h4 className="text-sm font-bold text-amber-900 uppercase tracking-wide">Foreign</h4>
                                            <p className="text-xs text-amber-700">Department & Others</p>
                                        </div>
                                        <div className="overflow-x-auto">
                                            <table className="data-grid-table data-grid-table--compact min-w-[760px] w-full text-sm text-gray-900">
                                                <thead>
                                                    <tr className="bg-gray-50 border-b border-gray-200">
                                                        <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Con. No.</th>
                                                        <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Police Station</th>
                                                        <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Branch</th>
                                                        <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">From</th>
                                                        <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">To</th>
                                                        <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Country & Institute</th>
                                                        <th className="px-2 py-2 text-right w-px whitespace-nowrap">
                                                            <span className="sr-only">Actions</span>
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {form.foreignBeforeCourses.map((row) => (
                                                        <tr key={row.id} className="border-b border-gray-100 odd:bg-white even:bg-amber-50/20 last:border-0">
                                                            <td className="px-2 py-1.5"><GInput value={row.conNo} onChange={(v) => updateBeforeCourse('foreignBeforeCourses', row.id, { conNo: v })} /></td>
                                                            <td className="px-2 py-1.5"><GInput value={row.policeStation} onChange={(v) => updateBeforeCourse('foreignBeforeCourses', row.id, { policeStation: v })} /></td>
                                                            <td className="px-2 py-1.5"><GInput value={row.branch} onChange={(v) => updateBeforeCourse('foreignBeforeCourses', row.id, { branch: v })} /></td>
                                                            <td className="px-2 py-1.5"><DatePicker value={row.from} onChange={(v) => updateBeforeCourse('foreignBeforeCourses', row.id, { from: v })} /></td>
                                                            <td className="px-2 py-1.5"><DatePicker value={row.to} onChange={(v) => updateBeforeCourse('foreignBeforeCourses', row.id, { to: v })} /></td>
                                                            <td className="px-2 py-1.5"><GInput value={row.institute} onChange={(v) => updateBeforeCourse('foreignBeforeCourses', row.id, { institute: v })} /></td>
                                                            <td className="px-2 py-1.5 align-middle text-right whitespace-nowrap w-px">
                                                                {form.foreignBeforeCourses.length > 1 ? (
                                                                    <RemoveRowButton onClick={() => removeBeforeCourse('foreignBeforeCourses', row.id)} />
                                                                ) : null}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                        <div className="px-4 pb-3">
                                            <AddRowButton onClick={() => addBeforeCourse('foreignBeforeCourses')}>Add row</AddRowButton>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* ─── SECTION 6: Courses After SOCO ───────────────────────────── */}
                            <div className="p-5 sm:p-6 rounded-2xl border border-cyan-200 bg-cyan-50/70">
                                <SectionHeader
                                    sectionNo={6}
                                    title="DETAILS OF COURSE (AFTER JOINED THE SOCO PROJECT)"
                                />
                                <p className="text-sm text-cyan-900/80 mb-4">
                                    Record advanced courses and certifications completed after joining the SOCO project.
                                </p>

                                <div className="grid grid-cols-1 gap-5">
                                    <div className="rounded-xl border border-cyan-100 bg-white shadow-sm overflow-hidden">
                                        <div className="px-4 py-3 border-b border-cyan-100 bg-cyan-50/60">
                                            <h4 className="text-sm font-bold text-cyan-900 uppercase tracking-wide">Local</h4>
                                            <p className="text-xs text-cyan-700">Department & Others</p>
                                        </div>
                                        <div className="overflow-x-auto">
                                            <table className="data-grid-table data-grid-table--compact min-w-[760px] w-full text-sm text-gray-900">
                                                <thead>
                                                    <tr className="bg-gray-50 border-b border-gray-200">
                                                        <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Course Name</th>
                                                        <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">From</th>
                                                        <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">To</th>
                                                        <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Time</th>
                                                        <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Department or Institute</th>
                                                        <th className="px-2 py-2 text-right w-px whitespace-nowrap">
                                                            <span className="sr-only">Actions</span>
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {form.localAfterCourses.map((row) => (
                                                        <tr key={row.id} className="border-b border-gray-100 odd:bg-white even:bg-cyan-50/20 last:border-0">
                                                            <td className="px-2 py-1.5"><GInput value={row.courseName} onChange={(v) => updateAfterCourse('localAfterCourses', row.id, { courseName: v })} /></td>
                                                            <td className="px-2 py-1.5"><DatePicker value={row.from} onChange={(v) => updateAfterCourse('localAfterCourses', row.id, { from: v })} /></td>
                                                            <td className="px-2 py-1.5"><DatePicker value={row.to} onChange={(v) => updateAfterCourse('localAfterCourses', row.id, { to: v })} /></td>
                                                            <td className="px-2 py-1.5"><GInput value={row.time} onChange={(v) => updateAfterCourse('localAfterCourses', row.id, { time: v })} placeholder="e.g. 3 Months" /></td>
                                                            <td className="px-2 py-1.5"><GInput value={row.institute} onChange={(v) => updateAfterCourse('localAfterCourses', row.id, { institute: v })} /></td>
                                                            <td className="px-2 py-1.5 align-middle text-right whitespace-nowrap w-px">
                                                                {form.localAfterCourses.length > 1 ? (
                                                                    <RemoveRowButton onClick={() => removeAfterCourse('localAfterCourses', row.id)} />
                                                                ) : null}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                        <div className="px-4 pb-3">
                                            <AddRowButton onClick={() => addAfterCourse('localAfterCourses')}>Add row</AddRowButton>
                                        </div>
                                    </div>

                                    <div className="rounded-xl border border-cyan-100 bg-white shadow-sm overflow-hidden">
                                        <div className="px-4 py-3 border-b border-cyan-100 bg-cyan-50/60">
                                            <h4 className="text-sm font-bold text-cyan-900 uppercase tracking-wide">Foreign</h4>
                                            <p className="text-xs text-cyan-700">Department & Others</p>
                                        </div>
                                        <div className="overflow-x-auto">
                                            <table className="data-grid-table data-grid-table--compact min-w-[760px] w-full text-sm text-gray-900">
                                                <thead>
                                                    <tr className="bg-gray-50 border-b border-gray-200">
                                                        <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Course Name</th>
                                                        <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">From</th>
                                                        <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">To</th>
                                                        <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Time</th>
                                                        <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Country & Institute</th>
                                                        <th className="px-2 py-2 text-right w-px whitespace-nowrap">
                                                            <span className="sr-only">Actions</span>
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {form.foreignAfterCourses.map((row) => (
                                                        <tr key={row.id} className="border-b border-gray-100 odd:bg-white even:bg-cyan-50/20 last:border-0">
                                                            <td className="px-2 py-1.5"><GInput value={row.courseName} onChange={(v) => updateAfterCourse('foreignAfterCourses', row.id, { courseName: v })} /></td>
                                                            <td className="px-2 py-1.5"><DatePicker value={row.from} onChange={(v) => updateAfterCourse('foreignAfterCourses', row.id, { from: v })} /></td>
                                                            <td className="px-2 py-1.5"><DatePicker value={row.to} onChange={(v) => updateAfterCourse('foreignAfterCourses', row.id, { to: v })} /></td>
                                                            <td className="px-2 py-1.5"><GInput value={row.time} onChange={(v) => updateAfterCourse('foreignAfterCourses', row.id, { time: v })} placeholder="e.g. 3 Months" /></td>
                                                            <td className="px-2 py-1.5"><GInput value={row.institute} onChange={(v) => updateAfterCourse('foreignAfterCourses', row.id, { institute: v })} /></td>
                                                            <td className="px-2 py-1.5 align-middle text-right whitespace-nowrap w-px">
                                                                {form.foreignAfterCourses.length > 1 ? (
                                                                    <RemoveRowButton onClick={() => removeAfterCourse('foreignAfterCourses', row.id)} />
                                                                ) : null}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                        <div className="px-4 pb-3">
                                            <AddRowButton onClick={() => addAfterCourse('foreignAfterCourses')}>Add row</AddRowButton>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* ─── SECTION 7: Driving License ──────────────────────────────── */}
                            <div className="p-5 sm:p-6 rounded-2xl border border-rose-200 bg-rose-50/70">
                                <SectionHeader sectionNo={7} title="Driving License Details" />

                                <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
                                    <div className="rounded-xl border border-rose-100 bg-white shadow-sm p-4 xl:col-span-2">
                                        <h4 className="text-sm font-bold text-rose-900 uppercase tracking-wide mb-3">License Information</h4>
                                        <div className="space-y-4">
                                            <div>
                                                <FieldLabel label="Driving License No" />
                                                <GInput
                                                    value={form.drivingLicenseNo}
                                                    onChange={(v) => set('drivingLicenseNo', v)}
                                                    placeholder="Enter driving license number"
                                                />
                                            </div>
                                            <div>
                                                <FieldLabel label="Categories of Vehicles" />
                                                <p className="text-sm text-gray-500 mb-2">Select all categories that apply.</p>
                                                <div
                                                    className="grid grid-cols-3 sm:grid-cols-5 gap-2"
                                                    role="group"
                                                    aria-label="Vehicle categories (multi-select)"
                                                >
                                                    {ANNEX_13_CATEGORY_OPTIONS.map((opt) => {
                                                        const selected = form.vehicleCategories.includes(opt.value);
                                                        return (
                                                            <label
                                                                key={opt.value}
                                                                className={`flex flex-row items-center justify-between gap-2 rounded-lg border px-3 py-2.5 cursor-pointer transition-colors min-h-11 ${
                                                                    selected
                                                                        ? 'border-rose-500 bg-rose-50 ring-2 ring-rose-200/80'
                                                                        : 'border-gray-200 bg-white hover:border-rose-200'
                                                                }`}
                                                            >
                                                                <span className="text-sm font-semibold text-gray-800 leading-snug text-left min-w-0 pr-1">
                                                                    {opt.label}
                                                                </span>
                                                                <input
                                                                    type="checkbox"
                                                                    name="officer-vehicle-categories"
                                                                    value={opt.value}
                                                                    checked={selected}
                                                                    onChange={() => toggleVehicleCategory(opt.value)}
                                                                    className="h-4 w-4 sm:h-5 sm:w-5 shrink-0 rounded border-gray-300 text-rose-600 focus:ring-rose-500"
                                                                />
                                                            </label>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="rounded-xl border border-rose-100 bg-white shadow-sm p-4 xl:col-span-1">
                                        <h4 className="text-sm font-bold text-rose-900 uppercase tracking-wide">Police Driving / Riding Qualified</h4>
                                        <p className="text-xs text-rose-700 mt-1 mb-4">Select only Yes or No for each vehicle type.</p>

                                        <div className="space-y-3">
                                            <div className="rounded-lg border border-gray-200 bg-gray-50/70 px-3 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                                <span className="text-sm font-semibold text-gray-800">Heavy Vehicle</span>
                                                <YesNo value={form.heavyVehicleQualified} onChange={(v) => set('heavyVehicleQualified', v)} />
                                            </div>
                                            <div className="rounded-lg border border-gray-200 bg-gray-50/70 px-3 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                                <span className="text-sm font-semibold text-gray-800">Light Vehicle</span>
                                                <YesNo value={form.lightVehicleQualified} onChange={(v) => set('lightVehicleQualified', v)} />
                                            </div>
                                            <div className="rounded-lg border border-gray-200 bg-gray-50/70 px-3 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                                <span className="text-sm font-semibold text-gray-800">Motor Cycle</span>
                                                <YesNo value={form.motorcycleQualified} onChange={(v) => set('motorcycleQualified', v)} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* ─── SECTION 8: Transfer ─────────────────────────────────────── */}
                            <div className="p-5 sm:p-6 rounded-2xl border border-fuchsia-200 bg-fuchsia-50/70">
                                <SectionHeader sectionNo={8} title="Transfer" titleSi="මාරු" />

                                <div className="rounded-2xl border border-fuchsia-200 bg-fuchsia-50/80 p-4 sm:p-5 shadow-sm">
                                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                                        <div className="lg:col-span-3">
                                            <FieldLabel label="SOCO LAB" si="SOCO සේවාස්ථානය" />
                                            <CustomSelect
                                                value={form.transferDraft.socoLab}
                                                onChange={(v) => updateAssignmentDraft('transfer', { socoLab: v })}
                                                options={SOCO_LABS_OPTIONS}
                                                placeholder="Select SOCO LAB"
                                            />
                                        </div>
                                        <div className="lg:col-span-3">
                                            <FieldLabel label="From" />
                                            <DatePicker
                                                value={form.transferDraft.from}
                                                onChange={(v) => updateAssignmentDraft('transfer', { from: v })}
                                            />
                                        </div>
                                        <div className="lg:col-span-3">
                                            <FieldLabel label="To" />
                                            <DatePicker
                                                value={form.transferDraft.to}
                                                onChange={(v) => updateAssignmentDraft('transfer', { to: v })}
                                            />
                                        </div>
                                        <div className="lg:col-span-3">
                                            <FieldLabel label="Duration" />
                                            <GInput
                                                value={form.transferDraft.duration}
                                                onChange={() => undefined}
                                                placeholder="Auto-calculated"
                                                readOnly
                                            />
                                        </div>

                                        <div className="lg:col-span-3">
                                            <FieldLabel label="OIC, A/OIC" />
                                            <GInput
                                                value={form.transferDraft.oic}
                                                onChange={(v) => updateAssignmentDraft('transfer', { oic: v })}
                                                placeholder="Officer in charge"
                                            />
                                        </div>

                                        {/* ── Reason + Other text box ── */}
                                        <div className="lg:col-span-6 space-y-2">
                                            <div>
                                                <FieldLabel label="Reason" si="හේතුව" />
                                                <CustomSelect
                                                    value={form.transferDraft.reason}
                                                    onChange={(v) =>
                                                        updateAssignmentDraft('transfer', { reason: v, reasonOther: '' })
                                                    }
                                                    options={ASSIGNMENT_REASON_OPTIONS}
                                                    placeholder="Select Reason"
                                                />
                                            </div>
                                            {form.transferDraft.reason === 'Other' && (
                                                <div>
                                                    <FieldLabel label="Specify Reason" si="හේතුව සඳහන් කරන්න" />
                                                    <GInput
                                                        value={form.transferDraft.reasonOther}
                                                        onChange={(v) =>
                                                            updateAssignmentDraft('transfer', { reasonOther: v })
                                                        }
                                                        placeholder="Enter specific reason"
                                                    />
                                                </div>
                                            )}
                                        </div>

                                        <div className="lg:col-span-3 flex items-end">
                                            <AddRowButton onClick={() => addAssignmentRecord('transfer')}>Add transfer record</AddRowButton>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-5 overflow-x-auto rounded-2xl border border-fuchsia-200 bg-white shadow-sm">
                                    <table className="data-grid-table data-grid-table--compact w-full text-sm text-gray-900">
                                        <thead>
                                            <tr className="border-b border-fuchsia-100 bg-fuchsia-50/80">
                                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">SOCO LAB</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">From</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">To</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Duration</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">OIC, A/OIC</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Reason</th>
                                                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {form.transferHistory.length > 0 ? (
                                                form.transferHistory.map((row) => (
                                                    <tr key={row.id} className="border-b border-fuchsia-50 last:border-0">
                                                        <td className="px-4 py-3 text-gray-800">{row.socoLab}</td>
                                                        <td className="px-4 py-3 text-gray-700">{row.from}</td>
                                                        <td className="px-4 py-3 text-gray-700">{row.to}</td>
                                                        <td className="px-4 py-3 font-medium text-gray-800">{row.duration}</td>
                                                        <td className="px-4 py-3 text-gray-700">{row.oic || '-'}</td>
                                                        <td className="px-4 py-3 text-gray-700">
                                                            {row.reason === 'Other' && row.reasonOther
                                                                ? `Other: ${row.reasonOther}`
                                                                : row.reason}
                                                        </td>
                                                        <td className="px-4 py-3 text-right">
                                                            <RemoveRowButton onClick={() => removeAssignmentRecord('transfer', row.id)}>
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                                Delete
                                                            </RemoveRowButton>
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-400">
                                                        No transfer records added yet.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* ─── SECTION 9: Special Duty ─────────────────────────────────── */}
                            <div className="p-5 sm:p-6 rounded-2xl border border-amber-200 bg-amber-50/70">
                                <SectionHeader sectionNo={9} title="Special Duty" titleSi="විශේෂ රාජකාරි" />

                                <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 sm:p-5 shadow-sm">
                                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                                        <div className="lg:col-span-3">
                                            <FieldLabel label="SOCO LAB" si="SOCO සේවාස්ථානය" />
                                            <CustomSelect
                                                value={form.specialDutyDraft.socoLab}
                                                onChange={(v) => updateAssignmentDraft('specialDuty', { socoLab: v })}
                                                options={SOCO_LABS_OPTIONS}
                                                placeholder="Select SOCO LAB"
                                            />
                                        </div>
                                        <div className="lg:col-span-3">
                                            <FieldLabel label="From" />
                                            <DatePicker
                                                value={form.specialDutyDraft.from}
                                                onChange={(v) => updateAssignmentDraft('specialDuty', { from: v })}
                                            />
                                        </div>
                                        <div className="lg:col-span-3">
                                            <FieldLabel label="To" />
                                            <DatePicker
                                                value={form.specialDutyDraft.to}
                                                onChange={(v) => updateAssignmentDraft('specialDuty', { to: v })}
                                            />
                                        </div>
                                        <div className="lg:col-span-3">
                                            <FieldLabel label="Duration" />
                                            <GInput
                                                value={form.specialDutyDraft.duration}
                                                onChange={() => undefined}
                                                placeholder="Auto-calculated"
                                                readOnly
                                            />
                                        </div>

                                        <div className="lg:col-span-3">
                                            <FieldLabel label="OIC, A/OIC" />
                                            <GInput
                                                value={form.specialDutyDraft.oic}
                                                onChange={(v) => updateAssignmentDraft('specialDuty', { oic: v })}
                                                placeholder="Officer in charge"
                                            />
                                        </div>

                                        {/* ── Reason + Other text box ── */}
                                        <div className="lg:col-span-6 space-y-2">
                                            <div>
                                                <FieldLabel label="Reason" si="හේතුව" />
                                                <CustomSelect
                                                    value={form.specialDutyDraft.reason}
                                                    onChange={(v) =>
                                                        updateAssignmentDraft('specialDuty', { reason: v, reasonOther: '' })
                                                    }
                                                    options={ASSIGNMENT_REASON_OPTIONS}
                                                    placeholder="Select Reason"
                                                />
                                            </div>
                                            {form.specialDutyDraft.reason === 'Other' && (
                                                <div>
                                                    <FieldLabel label="Specify Reason" si="හේතුව සඳහන් කරන්න" />
                                                    <GInput
                                                        value={form.specialDutyDraft.reasonOther}
                                                        onChange={(v) =>
                                                            updateAssignmentDraft('specialDuty', { reasonOther: v })
                                                        }
                                                        placeholder="Enter specific reason"
                                                    />
                                                </div>
                                            )}
                                        </div>

                                        <div className="lg:col-span-3 flex items-end">
                                            <AddRowButton onClick={() => addAssignmentRecord('specialDuty')}>Add special duty record</AddRowButton>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-5 overflow-x-auto rounded-2xl border border-amber-200 bg-white shadow-sm">
                                    <table className="data-grid-table data-grid-table--compact w-full text-sm text-gray-900">
                                        <thead>
                                            <tr className="border-b border-amber-100 bg-amber-50/80">
                                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">SOCO LAB</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">From</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">To</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Duration</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">OIC, A/OIC</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Reason</th>
                                                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {form.specialDutyHistory.length > 0 ? (
                                                form.specialDutyHistory.map((row) => (
                                                    <tr key={row.id} className="border-b border-amber-50 last:border-0">
                                                        <td className="px-4 py-3 text-gray-800">{row.socoLab}</td>
                                                        <td className="px-4 py-3 text-gray-700">{row.from}</td>
                                                        <td className="px-4 py-3 text-gray-700">{row.to}</td>
                                                        <td className="px-4 py-3 font-medium text-gray-800">{row.duration}</td>
                                                        <td className="px-4 py-3 text-gray-700">{row.oic || '-'}</td>
                                                        <td className="px-4 py-3 text-gray-700">
                                                            {row.reason === 'Other' && row.reasonOther
                                                                ? `Other: ${row.reasonOther}`
                                                                : row.reason}
                                                        </td>
                                                        <td className="px-4 py-3 text-right">
                                                            <RemoveRowButton onClick={() => removeAssignmentRecord('specialDuty', row.id)}>
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                                Delete
                                                            </RemoveRowButton>
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-400">
                                                        No special duty records added yet.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* ─── SECTION 10: Disciplinary Inquiries ──────────────────────── */}
                            <div className="p-5 sm:p-6 rounded-2xl border border-emerald-200 bg-emerald-50/70">
                                <SectionHeader sectionNo={10} title="Disciplinary Inquiries" titleSi="විනය විමර්ශන" />
                                <p className="text-sm text-emerald-900/80 mb-4">
                                    Record current inquiry status and any relevant findings for each disciplinary category.
                                </p>

                                <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
                                    <div className="rounded-xl border border-emerald-100 bg-white shadow-sm p-4">
                                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
                                            <h4 className="text-sm font-bold text-emerald-900 uppercase tracking-wide">Orderly Room</h4>
                                            <YesNo value={form.orderlyRoomStatus} onChange={(v) => set('orderlyRoomStatus', v as ToggleChoice)} />
                                        </div>
                                        <div>
                                            <FieldLabel label="Result / විස්තර" />
                                            <GTextarea
                                                value={form.orderlyRoomResult}
                                                onChange={(v) => set('orderlyRoomResult', v)}
                                                placeholder="Enter orderly room result or remarks"
                                                className="min-h-[140px]"
                                            />
                                        </div>
                                    </div>

                                    <div className="rounded-xl border border-emerald-100 bg-white shadow-sm p-4">
                                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
                                            <h4 className="text-sm font-bold text-emerald-900 uppercase tracking-wide">Preliminary Inquiry</h4>
                                            <YesNo value={form.preliminaryInquiryStatus} onChange={(v) => set('preliminaryInquiryStatus', v as ToggleChoice)} />
                                        </div>
                                        <div>
                                            <FieldLabel label="Result / විස්තර" />
                                            <GTextarea
                                                value={form.preliminaryInquiryResult}
                                                onChange={(v) => set('preliminaryInquiryResult', v)}
                                                placeholder="Enter preliminary inquiry result or remarks"
                                                className="min-h-[140px]"
                                            />
                                        </div>
                                    </div>

                                    <div className="rounded-xl border border-emerald-100 bg-white shadow-sm p-4">
                                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
                                            <h4 className="text-sm font-bold text-emerald-900 uppercase tracking-wide">Disciplinary Inquiry</h4>
                                            <YesNo value={form.disciplinaryInquiryStatus} onChange={(v) => set('disciplinaryInquiryStatus', v as ToggleChoice)} />
                                        </div>
                                        <div>
                                            <FieldLabel label="Result / විස්තර" />
                                            <GTextarea
                                                value={form.disciplinaryInquiryResult}
                                                onChange={(v) => set('disciplinaryInquiryResult', v)}
                                                placeholder="Enter disciplinary inquiry result or remarks"
                                                className="min-h-[140px]"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* ─── SECTION 11: Special Illnesses & Notes ───────────────────── */}
                            <div className="p-5 sm:p-6 rounded-2xl border border-sky-200 bg-sky-50/70">
                                <SectionHeader
                                    sectionNo={11}
                                    title="Special Illnesses & Special Notes"
                                    titleSi="විශේෂ රෝග හා විශේෂ සටහන්"
                                />
                                <p className="text-sm text-sky-900/80 mb-4">
                                    Record any known medical conditions and additional notes relevant to this officer.
                                </p>

                                <div className="grid grid-cols-1 gap-5">
                                    <div className="rounded-xl border border-sky-100 bg-white shadow-sm p-4">
                                        <h4 className="text-sm font-bold text-sky-900 uppercase tracking-wide mb-3">
                                            Special Illnesses
                                        </h4>
                                        <FieldLabel label="Known Medical Conditions / විශේෂ රෝග" />
                                        <GTextarea
                                            value={form.specialIllnesses}
                                            onChange={(v) => set('specialIllnesses', v)}
                                            placeholder="Enter any known illnesses or medical conditions..."
                                            className="min-h-[160px]"
                                        />
                                    </div>

                                    <div className="rounded-xl border border-sky-100 bg-white shadow-sm p-4">
                                        <h4 className="text-sm font-bold text-sky-900 uppercase tracking-wide mb-3">
                                            Special Notes
                                        </h4>
                                        <FieldLabel label="Additional Notes / විශේෂ සටහන්" />
                                        <GTextarea
                                            value={form.specialNotes}
                                            onChange={(v) => set('specialNotes', v)}
                                            placeholder="Enter any additional remarks or special notes..."
                                            className="min-h-[160px]"
                                        />
                                    </div>
                                </div>
                            </div>
                            </div>

                            {/* ─── Action Bar ──────────────────────────────────────────────── */}
                            <div className="flex-shrink-0 border-t border-gray-200 bg-gray-50/70 px-5 py-3 rounded-b-xl flex items-center justify-between gap-3">
                                <div />
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="secondary"
                                        type="button"
                                        onClick={() => router.push('/crime-officer')}
                                        className="min-h-[42px] px-4 py-2.5 text-sm font-medium"
                                    >
                                        Cancel
                                    </Button>
                                    <Button variant="amber" type="button" onClick={() => alert('Draft saved!')}>
                                        Save as Draft
                                    </Button>
                                    <Button variant="primary" type="submit">
                                        Save Officer
                                    </Button>
                                </div>
                                <div />
                            </div>

                        </form>
        </PageLayout>
    );
}
