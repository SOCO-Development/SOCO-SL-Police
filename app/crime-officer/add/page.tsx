'use client';

import { useState, useRef, useCallback, useId, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Trash2, Eye, EyeOff, CheckCircle2, XCircle } from 'lucide-react';
import { AddRowButton, RemoveRowButton, PageHeader, PageLayout, Button, FileUploadButton, ToggleChip } from '@/components/ui';
import CustomSelect from '@/components/forms/CustomSelect';
import DatePicker from '@/components/forms/DatePicker';
import MultiSelect from '@/components/forms/MultiSelect';
import { officerService, userService, ApiError } from '@/lib/api';
import { useLocationData } from '@/lib/hooks/useLocationData';
import { useUserData } from '@/lib/hooks/useUserData';
import type { InsertNewOfficerRequest, ChildData } from '@/lib/api/types';
import {
    validateRegNo,
    validateFullName,
    validatePhone,
    validateDateNotFuture,
    validateYear,
    validateRequired,
    validateDateRange,
} from '@/lib/validation';
import { showSuccessAlert, showErrorAlert } from '@/lib/alerts';
import {
    ANNEX_01_SOCO_LABS,
    ANNEX_06_CIVIL_STATUS,
    ANNEX_07_SPOUSE_DESIGNATION,
    ANNEX_12_RANK,
} from '@/lib/annexData';

// Constants that don't depend on API data
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

const CATEGORY_NAME_TO_ID: Record<string, number> = {
    A1: 1, A: 2, B1: 3, B2: 4, B: 5,
    C1: 6, C: 7, CE: 8, D1: 9, D: 10,
    DE: 11, G1: 12, G: 13, J: 14, H: 15,
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChildRow {
    id: number;
    name: string;
    nic: string;
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
    recordId?: string;
    conNo: string;
    policeStation: string;
    branch: string;
    from: string;
    to: string;
    institute: string;
}

interface CourseAfterRow {
    id: number;
    recordId?: string;
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

type QualificationType = 'Degree' | 'Diploma' | 'Certificate' | 'Postgraduate' | 'Doctorate' | 'Other' | '';

const QUALIFICATION_TYPE_OPTIONS = [
    { value: 'Degree', label: 'Degree' },
    { value: 'Diploma', label: 'Diploma' },
    { value: 'Certificate', label: 'Certificate' },
    { value: 'Postgraduate', label: 'Postgraduate' },
    { value: 'Doctorate', label: 'Doctorate' },
    { value: 'Other', label: 'Other' },
];

interface DegreeRow {
    id: number;
    degree: string;
    university: string;
    yearFrom: string;
    yearTo: string;
    timing: 'before' | 'after' | '';
    qualificationType: QualificationType;
    qualificationTypeOther: string;
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
    socoLabId: string; // Store the ID for API submission
    rankDropdown: string;
    rankDesignationId: string; // Store the designation ID for API submission (NEW)
    regNo: string;
    fullName: string;
    nicNumber: string;
    callingName: string;
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
    password: string;
    confirmPassword: string;
    systemAccessLocations: string[];
    civilStatus: string;
    spouseDesignation: string;
    spouseDesignationOther: string;
    spouseName: string;
    spouseAddressOfInstitute: string;
    spouseNic: string;
    children: ChildRow[];
    // Section 3
    dateJoinedPolice: string;
    appointedRank: string;
    appointedRankId: string; // Store the ID (NEW)
    presentRank: string;
    presentRankId: string; // Store the ID (NEW)
    promotions: PromotionRow[];
    // Section 4 – Education
    olMandatorySubjects: OLSubjectResult[];
    olOptionalSubjects: OLOptionalSubject[];
    alStream: ALStream;
    alSubjects: ALSubjectRow[];
    alGeneralEnglish: string;
    alGeneralKnowledge: string;
    degrees: DegreeRow[];
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
        socoLab: '', socoLabId: '', rankDropdown: '', rankDesignationId: '', regNo: '', fullName: '', nicNumber: '', callingName: '',
        reportedDate: '', dob: '', dateJoinedSoco: '',
        socoCourseNo: '', socoService: '',
        telOffice: '', telResidence: '', telMobile: '',
        photoUrl: '',
        password: '', confirmPassword: '', systemAccessLocations: [],
        civilStatus: '', spouseDesignation: '', spouseDesignationOther: '', spouseName: '', spouseAddressOfInstitute: '', spouseNic: '',
        children: [{ id: newId(), name: '', nic: '', birthday: '', status: '' }],
        dateJoinedPolice: '', appointedRank: '', appointedRankId: '', presentRank: '', presentRankId: '',
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
        ],
        alGeneralEnglish: '',
        alGeneralKnowledge: '',
        degrees: [{ id: newId(), degree: '', university: '', yearFrom: '', yearTo: '', timing: '' as const, qualificationType: '' as QualificationType, qualificationTypeOther: '' }],
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

function SubSectionTitle({ title, titleSi }: { title: string; titleSi?: string }) {
    return (
        <div className="mb-4 mt-6 first:mt-0 pb-2 border-b border-slate-200/70">
            <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wide">{title}</h4>
            {titleSi && <p className="text-xs text-gray-500 mt-0.5 font-noto-sinhala">{titleSi}</p>}
        </div>
    );
}

function SectionActions({
    showEdit = false,
    isEditingSection,
    onEdit,
    onSave,
    saving = false,
    saveLabel = 'Save',
}: {
    showEdit?: boolean;
    isEditingSection: boolean;
    onEdit?: () => void;
    onSave: () => void;
    saving?: boolean;
    saveLabel?: string;
}) {
    return (
        <div className="flex items-center justify-end gap-2 mt-6 pt-4 border-t border-slate-200/80">
            {showEdit && !isEditingSection && onEdit && (
                <Button variant="secondary" type="button" onClick={onEdit}>
                    Edit
                </Button>
            )}
            {(!showEdit || isEditingSection) && (
                <Button variant="success" type="button" onClick={onSave} disabled={saving}>
                    {saving ? 'Saving...' : saveLabel}
                </Button>
            )}
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
    value, onChange, placeholder, maxLength, readOnly, disabled, type = 'text', min, max, inputMode
}: {
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    maxLength?: number;
    readOnly?: boolean;
    disabled?: boolean;
    type?: string;
    min?: number;
    max?: number;
    inputMode?: 'text' | 'numeric' | 'tel' | 'email' | 'url' | 'decimal' | 'search' | 'none';
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
            inputMode={inputMode}
            readOnly={readOnly}
            disabled={disabled}
            className={`w-full min-h-10 px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-800
        focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500
        hover:border-gray-400 transition-colors
        disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500 disabled:hover:border-gray-300
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
    const searchParams = useSearchParams();
    const editId = searchParams.get('edit');
    const isEditing = !!editId;

    // Convert dd-mm-yyyy → yyyy-mm-dd for the API
    const toApiDate = (d: string): string => {
        if (!d) return '';
        const parts = d.split('-');
        if (parts.length !== 3) return d;
        if (parts[0].length === 4) return d; // already yyyy-mm-dd
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
    };
    const { locations, loading: locationsLoading, error: locationsError, locationNameToId } = useLocationData();
    const { ranks, loading: ranksLoading, error: ranksError, rankNameToId, rankIdToName } = useUserData();
    const [form, setForm] = useState<FormData>(defaultForm);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const fileRef = useRef<HTMLInputElement>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [personalFamilyEditing, setPersonalFamilyEditing] = useState(!isEditing);
    const [sectionSaving, setSectionSaving] = useState<string | null>(null);
    const civilStatusRadioName = useId();
    const showSpouseAndChildren = form.civilStatus === 'Married';

    // Create dynamic SOCO Lab options from API data
    const SOCO_LABS_OPTIONS = locations.length > 0
        ? locations.map((loc) => ({ value: loc.name, label: loc.name }))
        : ANNEX_01_SOCO_LABS.map((s) => ({ value: s, label: s })); // Fallback to hardcoded data
    
    // Create dynamic Rank options from API data
    const RANK_OPTIONS = ranks.length > 0
        ? ranks.map((rank) => ({ value: rank.name, label: rank.name }))
        : ANNEX_12_RANK.map((s) => ({ value: s, label: s })); // Fallback to hardcoded data
    
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

    const locationIdToName = useMemo(() => {
        const map = new Map<string, string>();
        locations.forEach((loc) => map.set(loc.id, loc.name));
        return map;
    }, [locations]);

    // Load officer data when editing
    useEffect(() => {
        if (!isEditing || !editId) return;
        let cancelled = false;
        const load = async () => {
            try {
                const data = await officerService.getOfficerById(parseInt(editId, 10));
                if (cancelled || !data.personalInfo?.length) return;
                const p = data.personalInfo[0];

                setForm({
                    ...defaultForm(),
                    // Section 1
                    socoLab: locationIdToName.get(p.LOCATION_ID) || '',
                    socoLabId: p.LOCATION_ID,
                    rankDropdown: rankIdToName.get(p.RANK_ID || p.CURRENT_RANK || '') || '',
                    rankDesignationId: p.RANK_ID || p.CURRENT_RANK || '',
                    regNo: p.USER_REGI_NO || '',
                    fullName: p.USER_FULL_NAME || '',
                    nicNumber: p.NIC_NUMBER || (p as unknown as Record<string, unknown>).USER_NIC as string || (p as unknown as Record<string, unknown>).NIC_NO as string || '',
                    callingName: p.USER_CALLING_NAME || '',
                    reportedDate: '',
                    dob: p.USER_DOB || '',
                    dateJoinedSoco: p.SOCO_JOINED_DATE || '',
                    socoCourseNo: p.COURSE_NO || '',
                    socoService: '',
                    telOffice: p.PHONE_OFFICE || '',
                    telResidence: p.PHONE_HOME || '',
                    telMobile: p.PHONE_MOBILE || '',
                    photoUrl: p.USER_IMAGE_URL || '',
                    // Section 2
                    civilStatus: p.CIVIL_STATUS || '',
                    spouseName: data.spouse?.[0]?.SPOUSE_NAME || '',
                    spouseDesignation: data.spouse?.[0]?.SPOUSE_DESIGNATION || '',
                    spouseDesignationOther: '',
                    spouseAddressOfInstitute: data.spouse?.[0]?.SPOUSE_WORK_ADDRESS || '',
                    spouseNic: data.spouse?.[0]?.SPOUSE_NIC || (data.spouse?.[0] as unknown as Record<string, unknown>)?.SPOUSE_NIC_NUMBER as string || '',
                    children: (data.children?.length
                        ? data.children.map((c) => ({
                            id: newId(),
                            name: c.CHILD_NAME || '',
                            nic: c.CHILD_NIC || (c as unknown as Record<string, unknown>)?.CHILD_NIC_NUMBER as string || '',
                            birthday: c.CHILD_DOB || '',
                            status: '',
                        }))
                        : [{ id: newId(), name: '', nic: '', birthday: '', status: '' }]
                    ),
                    // Section 3
                    dateJoinedPolice: '',
                    appointedRank: rankIdToName.get(p.APPOINT_RANK || '') || '',
                    appointedRankId: p.APPOINT_RANK || '',
                    presentRank: rankIdToName.get(p.CURRENT_RANK || '') || '',
                    presentRankId: p.CURRENT_RANK || '',
                    promotions: (data.promotions?.length
                        ? data.promotions.map((pr) => ({
                            id: newId(),
                            rank: rankIdToName.get(pr.PROMOTED_RANK_ID) || '',
                            date: pr.PROMOTED_DATE || '',
                        }))
                        : [{ id: newId(), rank: '', date: '' }]
                    ),
                    // Section 4 – Education
                    olMandatorySubjects: [
                        { subject: 'First Language (Sinhala / Tamil)', grade: (data.olResults || []).find((r) => {
                            const n = (r.SUBJECT_NAME || '').trim().toLowerCase();
                            return ['sinhala', 'tamil', 'first language (sinhala / tamil)'].includes(n);
                        })?.SUBJECT_RESULT || '' },
                        { subject: 'English (Second Language)', grade: (data.olResults || []).find((r) => {
                            const n = (r.SUBJECT_NAME || '').trim().toLowerCase();
                            return ['english', 'english (second language)'].includes(n);
                        })?.SUBJECT_RESULT || '' },
                        { subject: 'Mathematics', grade: (data.olResults || []).find((r) => (r.SUBJECT_NAME || '').trim().toLowerCase() === 'mathematics')?.SUBJECT_RESULT || '' },
                        { subject: 'Science', grade: (data.olResults || []).find((r) => (r.SUBJECT_NAME || '').trim().toLowerCase() === 'science')?.SUBJECT_RESULT || '' },
                        { subject: 'History', grade: (data.olResults || []).find((r) => (r.SUBJECT_NAME || '').trim().toLowerCase() === 'history')?.SUBJECT_RESULT || '' },
                        { subject: 'Religion', grade: (data.olResults || []).find((r) => (r.SUBJECT_NAME || '').trim().toLowerCase() === 'religion')?.SUBJECT_RESULT || '' },
                    ].filter(Boolean) as OLSubjectResult[],
                    olOptionalSubjects: (data.olResults || [])
                        .filter((r) => {
                            const name = (r.SUBJECT_NAME || '').trim().toLowerCase();
                            const excluded = ['sinhala', 'tamil', 'english', 'mathematics', 'science', 'history', 'religion',
                                'first language (sinhala / tamil)', 'english (second language)'];
                            return !excluded.includes(name);
                        })
                        .map((r) => ({ id: newId(), subject: r.SUBJECT_NAME, grade: r.SUBJECT_RESULT as OLGrade })),
                    alStream: (data.alResults?.[0]?.STREAM || '') as ALStream,
                    alSubjects: (() => {
                        const fromApi = (data.alResults || [])
                            .filter((r) => {
                                const n = (r.SUBJECT_NAME || '').trim().toLowerCase();
                                return !['general english', 'general english language', 'general knowledge', 'general knowledge test'].includes(n);
                            })
                            .map((r) => ({ id: newId(), subject: r.SUBJECT_NAME, grade: r.SUBJECT_RESULT }));
                        const fixed = fromApi.slice(0, 2);
                        while (fixed.length < 2) {
                            fixed.push({ id: newId(), subject: '', grade: '' });
                        }
                        return fixed;
                    })(),
                    alGeneralEnglish: (data.alResults || []).find((r) => {
                        const n = (r.SUBJECT_NAME || '').trim().toLowerCase();
                        return ['general english', 'general english language', 'english'].includes(n);
                    })?.SUBJECT_RESULT || '',
                    alGeneralKnowledge: (data.alResults || []).find((r) => {
                        const n = (r.SUBJECT_NAME || '').trim().toLowerCase();
                        return ['general knowledge', 'general knowledge test', 'knowledge'].includes(n);
                    })?.SUBJECT_RESULT || '',
                    degrees: (data.higherEducation || []).length > 0
                        ? (data.higherEducation || []).map((h) => ({
                            id: newId(),
                            degree: h.QUALIFICATION_NAME || '',
                            university: h.INSTITUTE_NAME || '',
                            yearFrom: h.FROM_YEAR || '',
                            yearTo: h.TO_YEAR || '',
                            timing: (h.DONE_BEFORE_JOIN === 'Yes' ? 'before' : 'after') as 'before' | 'after',
                            qualificationType: (h.EDUCATION_TYPE || '') as QualificationType,
                            qualificationTypeOther: '',
                        }))
                        : [{ id: newId(), degree: '', university: '', yearFrom: '', yearTo: '', timing: '' as const, qualificationType: '' as QualificationType, qualificationTypeOther: '' }],
                    // Sections 5/6 – Courses
                    localBeforeCourses: (data.courses || [])
                        .filter((c) => c.COURSE_DONE_ID === '1' && c.COURSE_TYPE_ID === '1')
                        .map((c) => ({
                            id: newId(),
                            recordId: c.RECORD_ID,
                            conNo: c.CON_NO || '',
                            policeStation: c.POLICE_STATION || '',
                            branch: c.BRANCH || '',
                            from: c.FROM_DATE || '',
                            to: c.TO_DATE || '',
                            institute: c.INSTITUTE || '',
                        })),
                    foreignBeforeCourses: (data.courses || [])
                        .filter((c) => c.COURSE_DONE_ID === '1' && c.COURSE_TYPE_ID === '2')
                        .map((c) => ({
                            id: newId(),
                            recordId: c.RECORD_ID,
                            conNo: c.CON_NO || '',
                            policeStation: c.POLICE_STATION || '',
                            branch: c.BRANCH || '',
                            from: c.FROM_DATE || '',
                            to: c.TO_DATE || '',
                            institute: c.COUNTRY || c.INSTITUTE || '',
                        })),
                    localAfterCourses: (data.courses || [])
                        .filter((c) => c.COURSE_DONE_ID === '2' && c.COURSE_TYPE_ID === '1')
                        .map((c) => ({
                            id: newId(),
                            recordId: c.RECORD_ID,
                            courseName: c.CON_NO || '',
                            from: c.FROM_DATE || '',
                            to: c.TO_DATE || '',
                            time: c.DURATION || '',
                            institute: c.INSTITUTE || '',
                        })),
                    foreignAfterCourses: (data.courses || [])
                        .filter((c) => c.COURSE_DONE_ID === '2' && c.COURSE_TYPE_ID === '2')
                        .map((c) => ({
                            id: newId(),
                            recordId: c.RECORD_ID,
                            courseName: c.CON_NO || '',
                            from: c.FROM_DATE || '',
                            to: c.TO_DATE || '',
                            time: c.DURATION || '',
                            institute: c.COUNTRY || c.INSTITUTE || '',
                        })),
                    // Section 7 – Driving License
                    drivingLicenseNo: data.drivingCategoryDetails?.[0]?.DRIVING_LICENSE_NO || '',
                    vehicleCategories: (data.drivingCategoryDetails || []).map((d) =>
                        Object.entries(CATEGORY_NAME_TO_ID).find(([, id]) => id === parseInt(d.LICENCE_CATEGORY_ID))?.[0] || ''
                    ).filter(Boolean),
                    heavyVehicleQualified: (data.drivingQualificationDetails || []).some((d) => d.QUALIFICATION_TYPE_ID === '1') ? 'Yes' : '',
                    lightVehicleQualified: (data.drivingQualificationDetails || []).some((d) => d.QUALIFICATION_TYPE_ID === '2') ? 'Yes' : '',
                    motorcycleQualified: (data.drivingQualificationDetails || []).some((d) => d.QUALIFICATION_TYPE_ID === '3') ? 'Yes' : '',
                    // Section 8 – Transfer
                    transferDraft: createAssignmentRow(),
                    transferHistory: (data.transfers || []).map((t) => ({
                        id: newId(),
                        socoLab: locationIdToName.get(t.LOCATION_ID) || '',
                        from: t.FROM_DATE || '',
                        to: t.TO_DATE || '',
                        duration: t.DURATION || '',
                        oic: '',
                        reason: t.REASON || '',
                        reasonOther: '',
                    })),
                    // Section 9 – Special Duty
                    specialDutyDraft: createAssignmentRow(),
                    specialDutyHistory: (data.specialDuty || []).map((d) => ({
                        id: newId(),
                        socoLab: locationIdToName.get(d.LOCATION_ID) || '',
                        from: d.FROM_DATE || '',
                        to: d.TO_DATE || '',
                        duration: d.DURATION || '',
                        oic: '',
                        reason: d.REASON || '',
                        reasonOther: '',
                    })),
                    // Section 10 – Disciplinary Inquiries
                    orderlyRoomStatus: (data.disciplinaryInquiries?.[0]?.ORDERLY_ROOM_STATUS || '') as ToggleChoice,
                    orderlyRoomResult: data.disciplinaryInquiries?.[0]?.ORDERLY_ROOM_RESULT || '',
                    preliminaryInquiryStatus: (data.disciplinaryInquiries?.[0]?.PRELIMINARY_INQUIRY_STATUS || '') as ToggleChoice,
                    preliminaryInquiryResult: data.disciplinaryInquiries?.[0]?.PRELIMINARY_INQUIRY_RESULT || '',
                    disciplinaryInquiryStatus: (data.disciplinaryInquiries?.[0]?.DISCIPLINARY_INQUIRY_STATUS || '') as ToggleChoice,
                    disciplinaryInquiryResult: data.disciplinaryInquiries?.[0]?.DISCIPLINARY_INQUIRY_RESULT || '',
                    // Section 11 – Special Illnesses & Notes
                    specialIllnesses: data.specialIllnesses?.map((s) => s.SPECIAL_ILLNESS_NOTE).join('\n') || '',
                    specialNotes: data.specialNotes?.map((s) => s.SPECIAL_NOTE).join('\n') || '',
                });

                if (p.USER_IMAGE_URL && (p.USER_IMAGE_URL.startsWith('http://') || p.USER_IMAGE_URL.startsWith('https://') || p.USER_IMAGE_URL.startsWith('/'))) {
                    setPhotoPreview(p.USER_IMAGE_URL);
                } else if (p.USER_REGI_NO) {
                    userService.getProfileImage(p.USER_REGI_NO).then((dataUrl) => {
                        if (dataUrl && !cancelled) {
                            setPhotoPreview(dataUrl);
                            setForm((f) => ({ ...f, photoUrl: dataUrl }));
                        }
                    });
                }
            } catch (err) {
                const apiError = err instanceof ApiError ? err : new ApiError('Failed to load officer data');
                showErrorAlert('Error', apiError.message || 'An error occurred while loading officer data.');
                console.error('Load officer data error:', err);
            }
        };
        load();
        return () => { cancelled = true; };
    }, [isEditing, editId, locationIdToName, rankNameToId, rankIdToName]);

    const set = useCallback(<K extends keyof FormData>(key: K, val: FormData[K]) => {
        setForm((f) => ({ ...f, [key]: val }));
    }, []);

    // Handler for SOCO Lab selection - maps name to ID
    const handleSocoLabChange = useCallback((labName: string) => {
        const labId = locationNameToId.get(labName) || '';
        setForm((f) => ({
            ...f,
            socoLab: labName,
            socoLabId: labId,
        }));
    }, [locationNameToId]);

    // Handler for Rank selection - maps name to ID
    const handleRankChange = useCallback((rankName: string, rankIdField: 'rankDesignationId' | 'appointedRankId' | 'presentRankId') => {
        const rankId = rankNameToId.get(rankName) || '';
        
        if (rankIdField === 'rankDesignationId') {
            setForm((f) => ({
                ...f,
                rankDropdown: rankName,
                rankDesignationId: rankId,
            }));
        } else if (rankIdField === 'appointedRankId') {
            setForm((f) => ({
                ...f,
                appointedRank: rankName,
                appointedRankId: rankId,
            }));
        } else if (rankIdField === 'presentRankId') {
            setForm((f) => ({
                ...f,
                presentRank: rankName,
                presentRankId: rankId,
            }));
        }
    }, [rankNameToId]);

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
        setPhotoFile(file);
        const url = URL.createObjectURL(file);
        setPhotoPreview(url);
        set('photoUrl', url);
    };

    // Children rows
    const addChild = () => {
        set('children', [...form.children, { id: newId(), name: '', nic: '', birthday: '', status: '' }]);
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

    const updateOLMandatorySubject = (index: number, subject: string) => {
        const updated = form.olMandatorySubjects.map((s, i) => i === index ? { ...s, subject } : s);
        set('olMandatorySubjects', updated);
    };

    const updateOLOptional = (id: number, patch: Partial<OLOptionalSubject>) => {
        set('olOptionalSubjects', form.olOptionalSubjects.map((s) => s.id === id ? { ...s, ...patch } : s));
    };

    const addOLOptional = () => {
        set('olOptionalSubjects', [...form.olOptionalSubjects, { id: newId(), subject: '', grade: '' }]);
    };

    const removeOLOptional = (id: number) => {
        set('olOptionalSubjects', form.olOptionalSubjects.filter((s) => s.id !== id));
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

    const updateDegree = (id: number, patch: Partial<DegreeRow>) => {
        set('degrees', form.degrees.map((d) => d.id === id ? { ...d, ...patch } : d));
    };

    const addDegree = () => {
        if (form.degrees.length >= 12) return;
        set('degrees', [...form.degrees, { id: newId(), degree: '', university: '', yearFrom: '', yearTo: '', timing: '' as const, qualificationType: '' as QualificationType, qualificationTypeOther: '' }]);
    };

    const removeDegree = (id: number) => {
        if (form.degrees.length <= 1) return;
        set('degrees', form.degrees.filter((d) => d.id !== id));
    };

    const buildChildrenData = (): ChildData[] =>
        form.children
            .filter((c) => c.name.trim())
            .map((c) => ({
                childName: c.name,
                childNic: c.nic,
                childDob: toApiDate(c.birthday),
                childAge: c.birthday ? new Date().getFullYear() - new Date(c.birthday.split('-').reverse().join('-')).getFullYear() : 0,
                childStatusId: 2,
            }));

    const buildPersonalFamilyPayload = (): InsertNewOfficerRequest => {
        const childrenData = buildChildrenData();
        return {
            username: form.regNo,
            userFullName: form.fullName,
            userCallingName: form.callingName || form.fullName.split(' ')[0],
            nicNumber: form.nicNumber,
            locationId: form.socoLabId ? parseInt(form.socoLabId, 10) : 1,
            userDesignationId: 1, // Safe fallback — API designations differ from rank IDs
            userDob: toApiDate(form.dob),
            phoneMobile: form.telMobile,
            phoneOffice: form.telOffice,
            phoneHome: form.telResidence,
            userImageUrl: form.photoUrl || '',
            civilStatus: form.civilStatus,
            userRegiNo: form.regNo,
            currentRank: form.presentRankId ? parseInt(form.presentRankId, 10) : 1,
            appointRank: form.appointedRankId ? parseInt(form.appointedRankId, 10) : 1,
            courseNo: form.socoCourseNo,
            socoJoinedDate: toApiDate(form.dateJoinedSoco),
            ...(form.civilStatus === 'Married' && {
                spouse: {
                    spouseName: form.spouseName,
                    spouseDesignation: form.spouseDesignation === 'Other' ? form.spouseDesignationOther : form.spouseDesignation,
                    spouseWorkAddress: form.spouseAddressOfInstitute,
                    spouseNic: form.spouseNic,
                },
                children: childrenData.length > 0 ? childrenData : [],
            }),
        };
    };

    const savePersonalFamilySection = async () => {

        const regNoErr = validateRegNo(form.regNo);
        const nameErr = validateFullName(form.fullName);
        const dobErr = validateDateNotFuture(form.dob, 'Date of birth');
        const mobileErr = validatePhone(form.telMobile);
        const officeErr = form.telOffice.trim() ? validatePhone(form.telOffice) : null;
        const residenceErr = form.telResidence.trim() ? validatePhone(form.telResidence) : null;

        if (form.password || form.confirmPassword) {
            if (form.password !== form.confirmPassword) {
                showErrorAlert('Error', 'Passwords do not match. Please ensure both password fields match.');
                return;
            }
        }

        const firstErr = regNoErr || nameErr || dobErr || mobileErr || officeErr || residenceErr;
        if (firstErr) {
            showErrorAlert('Error', firstErr);
            return;
        }
        setSectionSaving('personal-family');

        try {
            if (!isEditing) {
                const regiNoCheck = await officerService.checkRegiNoAvailable(form.regNo);
if (regiNoCheck.isAvailable) {
                    showErrorAlert('Error', `Registration number ${form.regNo} is already in use. Please use a different one.`);
                    return;
                }

                // Upload profile photo if a file was selected
                let imageUrl = '';
                if (photoFile) {
                    try {
                        imageUrl = await officerService.uploadProfileImage(form.regNo, photoFile);
                    } catch (uploadErr) {
                        showErrorAlert('Error', 'Failed to upload profile image. Please try again.');
                        return;
                    }
                }

                const payload = buildPersonalFamilyPayload();
                if (imageUrl) payload.userImageUrl = imageUrl;
                console.log('InsertNewOfficer payload:', JSON.stringify(payload, null, 2));
                const result = await officerService.insertNewOfficer(payload);
                showSuccessAlert('Officer Added', `Officer ${result.message} (ID: ${result.systemUserId})`);
                router.push(`/crime-officer/add?edit=${result.systemUserId}`);
            } else {
                let imageUrl = form.photoUrl || '';
                if (photoFile) {
                    try {
                        imageUrl = await officerService.uploadProfileImage(form.regNo, photoFile);
                    } catch (uploadErr) {
                        showErrorAlert('Error', 'Failed to upload profile image. Please try again.');
                        return;
                    }
                }

                const childrenData = buildChildrenData();
                await officerService.updatePersonalInfo({
                    systemUserId: parseInt(editId!, 10),
                    userFullName: form.fullName,
                    userCallingName: form.callingName || form.fullName.split(' ')[0],
                    locationId: form.socoLabId ? parseInt(form.socoLabId, 10) : 1,
                    userDesignationId: 1,
                    userDob: toApiDate(form.dob),
                    phoneMobile: form.telMobile,
                    phoneOffice: form.telOffice,
                    phoneHome: form.telResidence,
                    userImageUrl: imageUrl,
                    civilStatus: form.civilStatus,
                    currentRank: form.presentRankId ? parseInt(form.presentRankId, 10) : 1,
                    appointRank: form.appointedRankId ? parseInt(form.appointedRankId, 10) : 1,
                    courseNo: form.socoCourseNo,
                    socoJoinedDate: toApiDate(form.dateJoinedSoco),
                    ...(form.civilStatus === 'Married' && {
                        spouse: {
                            spouseName: form.spouseName,
                            spouseDesignation: form.spouseDesignation === 'Other' ? form.spouseDesignationOther : form.spouseDesignation,
                            spouseWorkAddress: form.spouseAddressOfInstitute,
                        },
                        children: childrenData.length > 0 ? childrenData : [],
                    }),
                });
            }

            setPersonalFamilyEditing(false);
        } catch (err) {
            const apiError = err instanceof ApiError ? err : new ApiError('Failed to save personal and family details');
            showErrorAlert('Error', apiError.message || 'An error occurred while saving.');
            console.error('Save personal/family error:', err);
        } finally {
            setSectionSaving(null);
        }
    };

    const saveSystemAccessSection = async () => {
        if (form.password || form.confirmPassword) {
            if (form.password !== form.confirmPassword) {
                showErrorAlert('Error', 'Passwords do not match. Please ensure Password and Re-enter Password match.');
                return;
            }
        }

        if (!editId) {
            showErrorAlert('Notice', 'Please save the officer personal details first before updating system access privileges.');
            return;
        }

        setSectionSaving('system-access');
        try {
            const systemUserId = parseInt(editId, 10);
            const locationIds = form.systemAccessLocations
                .map((locName) => {
                    const idStr = locationNameToId.get(locName);
                    return idStr ? parseInt(idStr, 10) : NaN;
                })
                .filter((id) => !isNaN(id));

            await officerService.grantLoginAccess({
                systemUserId,
                userKey: form.password.trim(),
                designationId: form.rankDesignationId ? parseInt(form.rankDesignationId, 10) : undefined,
                locationIds,
            });

            showSuccessAlert('System Access Saved', 'Login access and system privileges updated successfully.');
            setForm((f) => ({ ...f, password: '', confirmPassword: '' }));
        } catch (err) {
            const apiError = err instanceof ApiError ? err : new ApiError('Failed to save system access');
            showErrorAlert('Error', apiError.message || 'An error occurred while saving system access privileges.');
            console.error('Save system access error:', err);
        } finally {
            setSectionSaving(null);
        }
    };

    const savePromotionsSection = async () => {
        setSectionSaving('promotions');
        try {
            if (isEditing && editId) {
                const promotions = form.promotions
                    .filter((p) => p.rank.trim() && p.date.trim())
                    .map((p) => ({
                        promotedDate: toApiDate(p.date),
                        promotedRankId: rankNameToId.get(p.rank) ? parseInt(rankNameToId.get(p.rank)!, 10) : 1,
                    }));

                if (promotions.length > 0) {
                    await officerService.updatePromotions({
                        systemUserId: parseInt(editId, 10),
                        promotions,
                    });
                }
            }

        } catch (err) {
            const apiError = err instanceof ApiError ? err : new ApiError('Failed to save promotions');
            showErrorAlert('Error', apiError.message || 'An error occurred while saving promotions.');
            console.error('Save promotions error:', err);
        } finally {
            setSectionSaving(null);
        }
    };

    const saveEducation = async () => {
        setSectionSaving('Education');

        try {
            if (isEditing && editId) {
                for (const d of form.degrees.filter((d) => d.degree.trim() || d.university.trim())) {
                    const fromErr = validateYear(d.yearFrom, 'From year', 1950, new Date().getFullYear() + 10);
                    if (fromErr) { showErrorAlert('Error', `${d.degree || 'Degree'}: ${fromErr}`); setSectionSaving(null); return; }
                    const toErr = validateYear(d.yearTo, 'To year', 1950, new Date().getFullYear() + 10);
                    if (toErr) { showErrorAlert('Error', `${d.degree || 'Degree'}: ${toErr}`); setSectionSaving(null); return; }
                    if (d.yearFrom && d.yearTo && parseInt(d.yearFrom) > parseInt(d.yearTo)) {
                        showErrorAlert('Error', `${d.degree || 'Degree'}: From year cannot be after To year`);
                        setSectionSaving(null); return;
                    }
                }
                const olResults = [
                    ...form.olMandatorySubjects.filter((s) => s.grade).map((s) => ({
                        subjectName: s.subject,
                        subjectResult: s.grade,
                    })),
                    ...form.olOptionalSubjects.filter((s) => s.subject.trim() && s.grade).map((s) => ({
                        subjectName: s.subject,
                        subjectResult: s.grade,
                    })),
                ];

                const alResults = [
                    ...form.alSubjects
                        .filter((s) => s.subject.trim() && s.grade)
                        .map((s) => ({
                            stream: form.alStream || '',
                            subjectName: s.subject,
                            subjectResult: s.grade,
                        })),
                    ...(form.alGeneralEnglish.trim() ? [{
                        stream: form.alStream || '',
                        subjectName: 'General English',
                        subjectResult: form.alGeneralEnglish,
                    }] : []),
                    ...(form.alGeneralKnowledge.trim() ? [{
                        stream: form.alStream || '',
                        subjectName: 'General Knowledge',
                        subjectResult: form.alGeneralKnowledge,
                    }] : []),
                ];

                const higherEducations = form.degrees
                    .filter((d) => d.degree.trim() || d.university.trim())
                    .map((d) => ({
                        doneBeforeJoin: (d.timing === 'before' ? 'Yes' : 'No') as 'Yes' | 'No',
                        sponsored: (d.timing === 'after' ? 'Yes' : 'No') as 'Yes' | 'No',
                        educationType: d.qualificationType === 'Other' ? d.qualificationTypeOther : (d.qualificationType || 'Degree'),
                        qualificationName: d.degree,
                        instituteName: d.university,
                        fromYear: parseInt(d.yearFrom) || 0,
                        toYear: parseInt(d.yearTo) || 0,
                    }));

                await officerService.updateEducation({
                    systemUserId: parseInt(editId, 10),
                    olResults,
                    alResults,
                    higherEducations,
                });
            }

        } catch (err) {
            const apiError = err instanceof ApiError ? err : new ApiError('Failed to save education');
            showErrorAlert('Error', apiError.message || 'An error occurred while saving education.');
            console.error('Save education error:', err);
        } finally {
            setSectionSaving(null);
        }
    };

    const saveCourses = async (sectionLabel: string, courseDoneId: number) => {
        setSectionSaving(sectionLabel);

        try {
            if (isEditing && editId) {
                let courses: {
                    courseTypeId: number;
                    courseDoneId: number;
                    conNo: string;
                    courseName: string;
                    policeStation: string;
                    branch: string;
                    fromDate: string;
                    toDate: string;
                    duration: string;
                    institute: string;
                    country: string;
                }[] = [];

                if (courseDoneId === 1) {
                    courses = [
                        ...form.localBeforeCourses
                            .filter((c) => !c.recordId)
                            .map((c) => ({
                                courseTypeId: 1,
                                courseDoneId,
                                conNo: c.conNo || '',
                                courseName: c.conNo || '',
                                policeStation: c.policeStation || '',
                                branch: c.branch || '',
                                fromDate: toApiDate(c.from),
                                toDate: toApiDate(c.to),
                                duration: '',
                                institute: c.institute || '',
                                country: '',
                            })),
                        ...form.foreignBeforeCourses
                            .filter((c) => !c.recordId)
                            .map((c) => ({
                                courseTypeId: 2,
                                courseDoneId,
                                conNo: c.conNo || '',
                                courseName: c.conNo || '',
                                policeStation: c.policeStation || '',
                                branch: c.branch || '',
                                fromDate: toApiDate(c.from),
                                toDate: toApiDate(c.to),
                                duration: '',
                                institute: c.institute || '',
                                country: c.institute || '',
                            })),
                    ];
                } else {
                    courses = [
                        ...form.localAfterCourses
                            .filter((c) => !c.recordId)
                            .map((c) => ({
                                courseTypeId: 1,
                                courseDoneId,
                                conNo: c.courseName || '',
                                courseName: c.courseName || '',
                                policeStation: '',
                                branch: '',
                                fromDate: toApiDate(c.from),
                                toDate: toApiDate(c.to),
                                duration: c.time || '',
                                institute: c.institute || '',
                                country: '',
                            })),
                        ...form.foreignAfterCourses
                            .filter((c) => !c.recordId)
                            .map((c) => ({
                                courseTypeId: 2,
                                courseDoneId,
                                conNo: c.courseName || '',
                                courseName: c.courseName || '',
                                policeStation: '',
                                branch: '',
                                fromDate: toApiDate(c.from),
                                toDate: toApiDate(c.to),
                                duration: c.time || '',
                                institute: c.institute || '',
                                country: c.institute || '',
                            })),
                    ];
                }

                await officerService.updateCourses({
                    systemUserId: parseInt(editId, 10),
                    courses,
                });
            }

        } catch (err) {
            const apiError = err instanceof ApiError ? err : new ApiError(`Failed to save ${sectionLabel}`);
            showErrorAlert('Error', apiError.message || `An error occurred while saving ${sectionLabel}.`);
            console.error(`Save ${sectionLabel} error:`, err);
        } finally {
            setSectionSaving(null);
        }
    };

    const saveDrivingLicense = async () => {
        setSectionSaving('Driving License');

        try {
            if (isEditing && editId) {
                if (form.vehicleCategories.length > 0 && !form.drivingLicenseNo.trim()) {
                    showErrorAlert('Error', 'Driving license number is required when selecting vehicle categories');
                    setSectionSaving(null); return;
                }
                if (form.drivingLicenseNo.trim() && form.drivingLicenseNo.trim().length < 5) {
                    showErrorAlert('Error', 'Driving license number is too short');
                    setSectionSaving(null); return;
                }
                const categoryDetails = form.vehicleCategories
                    .filter((cat) => CATEGORY_NAME_TO_ID[cat])
                    .map((cat) => ({
                        drivingLicenseNo: form.drivingLicenseNo,
                        licenceCategoryId: CATEGORY_NAME_TO_ID[cat],
                    }));

                const qualificationDetails: { qualificationTypeId: number }[] = [];
                if (form.heavyVehicleQualified === 'Yes') qualificationDetails.push({ qualificationTypeId: 1 });
                if (form.lightVehicleQualified === 'Yes') qualificationDetails.push({ qualificationTypeId: 2 });
                if (form.motorcycleQualified === 'Yes') qualificationDetails.push({ qualificationTypeId: 3 });

                await officerService.updateDriving({
                    systemUserId: parseInt(editId, 10),
                    categoryDetails,
                    qualificationDetails,
                });
            }

        } catch (err) {
            const apiError = err instanceof ApiError ? err : new ApiError('Failed to save driving license');
            showErrorAlert('Error', apiError.message || 'An error occurred while saving driving license.');
            console.error('Save driving license error:', err);
        } finally {
            setSectionSaving(null);
        }
    };

    const saveTransfers = async () => {
        setSectionSaving('Transfer');

        try {
            if (isEditing && editId) {
                const validTransfers = form.transferHistory.filter((t) => t.socoLab && t.from && t.to);
                for (const t of validTransfers) {
                    const rangeErr = validateDateRange(t.from, t.to, 'Transfer');
                    if (rangeErr) { showErrorAlert('Error', rangeErr); setSectionSaving(null); return; }
                }
                const transfers = validTransfers
                    .map((t) => {
                        const locId = locationNameToId.get(t.socoLab);
                        return {
                            locationId: locId ? parseInt(locId, 10) : 1,
                            fromDate: toApiDate(t.from),
                            toDate: toApiDate(t.to),
                            duration: t.duration || '',
                            officerInchargeUserId: 1,
                            reason: t.reason === 'Other' ? t.reasonOther : (t.reason || ''),
                        };
                    });

                await officerService.updateTransfers({
                    systemUserId: parseInt(editId, 10),
                    transfers,
                });
            }

        } catch (err) {
            const apiError = err instanceof ApiError ? err : new ApiError('Failed to save transfers');
            showErrorAlert('Error', apiError.message || 'An error occurred while saving transfers.');
            console.error('Save transfers error:', err);
        } finally {
            setSectionSaving(null);
        }
    };

    const saveSpecialDuty = async () => {
        setSectionSaving('Special Duty');

        try {
            if (isEditing && editId) {
                const validDuties = form.specialDutyHistory.filter((d) => d.socoLab && d.from && d.to);
                for (const d of validDuties) {
                    const rangeErr = validateDateRange(d.from, d.to, 'Special duty');
                    if (rangeErr) { showErrorAlert('Error', rangeErr); setSectionSaving(null); return; }
                }
                const specialDuties = validDuties
                    .map((d) => {
                        const locId = locationNameToId.get(d.socoLab);
                        return {
                            locationId: locId ? parseInt(locId, 10) : 1,
                            fromDate: toApiDate(d.from),
                            toDate: toApiDate(d.to),
                            duration: d.duration || '',
                            officerInchargeUserId: 1,
                            reason: d.reason === 'Other' ? d.reasonOther : (d.reason || ''),
                        };
                    });

                await officerService.updateSpecialDuty({
                    systemUserId: parseInt(editId, 10),
                    specialDuties,
                });
            }

        } catch (err) {
            const apiError = err instanceof ApiError ? err : new ApiError('Failed to save special duty');
            showErrorAlert('Error', apiError.message || 'An error occurred while saving special duty.');
            console.error('Save special duty error:', err);
        } finally {
            setSectionSaving(null);
        }
    };

    const saveDisciplinaryInquiries = async () => {
        setSectionSaving('Disciplinary Inquiries');

        try {
            if (isEditing && editId) {
                await officerService.updateDisciplinaryInquiries({
                    systemUserId: parseInt(editId, 10),
                    disciplinaryInquiries: [
                        {
                            orderlyRoomStatus: form.orderlyRoomStatus || '',
                            orderlyRoomResult: form.orderlyRoomResult,
                            preliminaryInquiryStatus: form.preliminaryInquiryStatus || '',
                            preliminaryInquiryResult: form.preliminaryInquiryResult,
                            disciplinaryInquiryStatus: form.disciplinaryInquiryStatus || '',
                            disciplinaryInquiryResult: form.disciplinaryInquiryResult,
                        },
                    ],
                });
            }

        } catch (err) {
            const apiError = err instanceof ApiError ? err : new ApiError('Failed to save disciplinary inquiries');
            showErrorAlert('Error', apiError.message || 'An error occurred while saving disciplinary inquiries.');
            console.error('Save disciplinary inquiries error:', err);
        } finally {
            setSectionSaving(null);
        }
    };

    const saveSpecialIllnessesNotes = async () => {
        setSectionSaving('Special Illnesses & Notes');

        try {
            if (isEditing && editId) {
                await officerService.updateSpecialIllnessesNotes({
                    systemUserId: parseInt(editId, 10),
                    specialIllnesses: form.specialIllnesses.trim()
                        ? [{ specialIllnessNote: form.specialIllnesses }]
                        : [],
                    specialNotes: form.specialNotes.trim()
                        ? [{ specialNote: form.specialNotes }]
                        : [],
                });
            }

        } catch (err) {
            const apiError = err instanceof ApiError ? err : new ApiError('Failed to save special illnesses & notes');
            showErrorAlert('Error', apiError.message || 'An error occurred while saving special illnesses & notes.');
            console.error('Save special illnesses & notes error:', err);
        } finally {
            setSectionSaving(null);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const regNoErr = validateRegNo(form.regNo);
        const nameErr = validateFullName(form.fullName);
        const dobErr = validateDateNotFuture(form.dob, 'Date of birth');
        const mobileErr = form.telMobile.trim() ? validatePhone(form.telMobile) : null;
        const firstErr = regNoErr || nameErr || dobErr || mobileErr;
        if (firstErr) { showErrorAlert('Error', firstErr); return; }

        if (form.password || form.confirmPassword) {
            if (form.password !== form.confirmPassword) {
                showErrorAlert('Error', 'Passwords do not match. Please ensure both password fields match.');
                return;
            }
        }
        setLoading(true);

        try {
            // Check if regNo is already in use
            const regiNoCheck = await officerService.checkRegiNoAvailable(form.regNo);
            if (regiNoCheck.isAvailable) {
                showErrorAlert('Error', `Registration number ${form.regNo} is already in use. Please use a different one.`);
                setLoading(false);
                return;
            }

            // Upload profile photo if a file was selected
            let imageUrl = form.photoUrl;
            if (photoFile) {
                try {
                    imageUrl = await officerService.uploadProfileImage(form.regNo, photoFile);
                } catch (uploadErr) {
                    showErrorAlert('Error', 'Failed to upload profile image. Please try again.');
                    setLoading(false);
                    return;
                }
            }

            // Build children data
            const childrenData: ChildData[] = form.children
                .filter((c) => c.name.trim()) // Only include non-empty children
                .map((c) => ({
                    childName: c.name,
                    childNic: c.nic,
                    childDob: toApiDate(c.birthday),
                    childAge: c.birthday ? new Date().getFullYear() - new Date(c.birthday.split('-').reverse().join('-')).getFullYear() : 0,
                    childStatusId: 2, // Default status ID
                }));

            // Build the API request
            const payload: InsertNewOfficerRequest = {
                username: form.regNo, // Using regNo as username
                userFullName: form.fullName,
                userCallingName: form.callingName || form.fullName.split(' ')[0], // Use first name as calling name
                nicNumber: form.nicNumber,
                locationId: form.socoLabId ? parseInt(form.socoLabId, 10) : 1, // Use mapped location ID
                userDesignationId: 1, // Safe fallback — API designations differ from rank IDs
                userDob: toApiDate(form.dob),
                phoneMobile: form.telMobile,
                phoneOffice: form.telOffice,
                phoneHome: form.telResidence,
                userImageUrl: imageUrl || '',
                civilStatus: form.civilStatus,
                userRegiNo: form.regNo,
                currentRank: form.presentRankId ? parseInt(form.presentRankId, 10) : 1,
                appointRank: form.appointedRankId ? parseInt(form.appointedRankId, 10) : 1,
                courseNo: form.socoCourseNo,
                socoJoinedDate: toApiDate(form.dateJoinedSoco),
                ...(form.civilStatus === 'Married' && {
                    spouse: {
                        spouseName: form.spouseName,
                        spouseDesignation: form.spouseDesignation === 'Other' ? form.spouseDesignationOther : form.spouseDesignation,
                        spouseWorkAddress: form.spouseAddressOfInstitute,
                        spouseNic: form.spouseNic,
                    },
                    children: childrenData.length > 0 ? childrenData : [],
                }),
            };

            // Submit to API
            const result = await officerService.insertNewOfficer(payload);

            showSuccessAlert('Officer Added', `Officer ${result.message} (ID: ${result.systemUserId})`);
            router.push('/crime-officer');
        } catch (err) {
            const apiError = err instanceof ApiError ? err : new ApiError('Failed to save officer');
            showErrorAlert('Error', apiError.message || 'An error occurred while saving the officer.');
            console.error('Submit error:', err);
        } finally {
            setLoading(false);
        }
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
        {isEditing ? <PageHeader
                backHref="/crime-officer"
                title="Edit SOCO Officer"
                description="Complete all required details to register a new officer profile."
            /> : 
                <PageHeader
                backHref="/crime-officer"
                title="Add SOCO Officer"
                description="Complete all required details to register a new officer profile."
            /> } 
            <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden animate-fade-in" style={{ minHeight: '400px' }}>
                            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

                            {/* ─── SECTION 1: Personal & Family Details ───────────────────── */}
                            <div className="p-4 sm:p-5 rounded-xl border border-sky-200 bg-sky-50/80">
                                <SectionHeader
                                    sectionNo={1}
                                    title="PERSONAL DETAILS OF SCENE OF CRIME OFFICER"
                                    titleSi="අපරාධ ස්ථාන නිලධාරිගේ පුද්ගලික තොරතුරු"
                                />

                                <fieldset disabled={!personalFamilyEditing} className="min-w-0 border-0 p-0 m-0 disabled:opacity-90">
                                    <SubSectionTitle
                                        title="Personal Details"
                                        titleSi="පුද්ගලික තොරතුරු"
                                    />

                                    <div className="flex flex-col xl:flex-row xl:items-start gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                            {/* SOCO Lab */}
                                             <div>
                                                 <FieldLabel label="SOCO Lab" si="SOCO රසායනාගාරය" />
                                                 <CustomSelect 
                                                     value={form.socoLab} 
                                                     onChange={handleSocoLabChange}
                                                     options={SOCO_LABS_OPTIONS} 
                                                     placeholder={locationsLoading ? "Loading..." : "Select SOCO Lab"}
                                                     disabled={locationsLoading || !personalFamilyEditing}
                                                 />
                                                 {locationsError && (
                                                     <p className="text-xs text-red-600 mt-1">{locationsError}</p>
                                                 )}
                                             </div>

                                            {/* Present Rank & Reg No */}
                                             <div>
                                                 <FieldLabel label="Present Rank / වත්මන් තනතුර" />
                                                 <CustomSelect 
                                                     value={form.rankDropdown} 
                                                     onChange={(v) => handleRankChange(v, 'rankDesignationId')}
                                                     options={RANK_OPTIONS} 
                                                     placeholder={ranksLoading ? "Loading..." : "Rank"}
                                                     disabled={ranksLoading || !personalFamilyEditing}
                                                 />
                                                 {ranksError && (
                                                     <p className="text-xs text-red-600 mt-1">{ranksError}</p>
                                                 )}
                                             </div>
                                             <div>
                                                 <FieldLabel label="Reg. No" si="රෙජි. අංකය" />
                                                 <GInput value={form.regNo} onChange={(v) => set('regNo', v)} placeholder="Register Number" />
                                             </div>

                                            {/* Full Name */}
                                            <div className="md:col-span-2 xl:col-span-2">
                                                <FieldLabel label="Full Name" si="සම්පූර්ණ නම (max 50)" />
                                                <GInput value={form.fullName} onChange={(v) => set('fullName', v)}
                                                    placeholder="Full name" maxLength={50} />
                                                <p className="text-xs text-gray-400 mt-1">{form.fullName.length}/50</p>
                                            </div>

                                            {/* NIC Number */}
                                            <div className="md:col-span-1 xl:col-span-1">
                                                <FieldLabel label="NIC Number" si="ජාතික හැඳුනුම්පත් අංකය" />
                                                <GInput value={form.nicNumber} onChange={(v) => set('nicNumber', v)}
                                                    placeholder="NIC Number" maxLength={12} />
                                            </div>

                                            {/* Calling Name */}
                                            <div className="md:col-span-2 xl:col-span-3">
                                                <FieldLabel label="Calling Name" si="ඇමතුම් නම" />
                                                <GInput value={form.callingName} onChange={(v) => set('callingName', v)}
                                                    placeholder="Calling name" maxLength={50} />
                                            </div>

                                            {/* Dates Row 1 */}
                                            <div>
                                                <FieldLabel label="Date of Birth / උපන් දිනය" />
                                                <DatePicker value={form.dob} onChange={(v) => set('dob', v)} />
                                            </div>
                                            <div>
                                                <FieldLabel label="Reported Date / වාර්තා දිනය" />
                                                <DatePicker value={form.reportedDate} onChange={(v) => set('reportedDate', v)} />
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

                                            {/* Date Joined Police & Appointed Rank */}
                                            <div>
                                                <FieldLabel label="Date Joined Police Dept. / පොලිස් දෙපාර්තමේන්තු" />
                                                <DatePicker value={form.dateJoinedPolice} onChange={(v) => set('dateJoinedPolice', v)} />
                                            </div>
                                            <div>
                                                <FieldLabel label="Appointed Rank / පත් කළ තනතුර" />
                                                <CustomSelect value={form.appointedRank} onChange={(v) => set('appointedRank', v)}
                                                    options={RANK_OPTIONS} placeholder="Select" />
                                            </div>

                                            {/* Telephone */}
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:col-span-2 xl:col-span-3" style={{ padding: 0, margin: 0 }}>
                                                <div>
                                                    <FieldLabel label="Office Tel. / කාර්යාල දුරකථන අංකය" />
                                                    <GInput value={form.telOffice} onChange={(v) => set('telOffice', v.replace(/\D/g, ''))} placeholder="0XX-XXXXXXX" type="tel" inputMode="numeric" />
                                                </div>
                                                <div>
                                                    <FieldLabel label="Residence Tel. / නිවාස දුරකථනය අංකය" />
                                                    <GInput value={form.telResidence} onChange={(v) => set('telResidence', v.replace(/\D/g, ''))} placeholder="0XX-XXXXXXX" type="tel" inputMode="numeric" />
                                                </div>
                                                <div>
                                                    <FieldLabel label="Mobile / ජංගම දුරකථනය අංකය" />
                                                    <GInput value={form.telMobile} onChange={(v) => set('telMobile', v.replace(/\D/g, ''))} placeholder="07X-XXXXXXX" type="tel" inputMode="numeric" />
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
                                                    onClick={() => {
                                                        if (personalFamilyEditing) fileRef.current?.click();
                                                    }}
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
                                                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} disabled={!personalFamilyEditing} />
                                                <FileUploadButton variant="sky-block" type="button" onClick={() => fileRef.current?.click()} disabled={!personalFamilyEditing}>Upload Photo</FileUploadButton>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                    <SubSectionTitle
                                        title="Family Details"
                                        titleSi="පවුල් තොරතුරු"
                                    />

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
                                                                    spouseName: '',
                                                                    spouseAddressOfInstitute: '',
                                                                    spouseNic: '',
                                                                    children: [
                                                                        {
                                                                            id: newId(),
                                                                            name: '',
                                                                            nic: '',
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
                                            <div className="md:col-span-3 min-w-0 grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div>
                                                    <FieldLabel label="Spouse Name / කලත්‍රයාගේ නම" />
                                                    <GInput
                                                        value={form.spouseName}
                                                        onChange={(v) => set('spouseName', v)}
                                                        placeholder="Full name of spouse"
                                                    />
                                                </div>
                                                <div>
                                                    <FieldLabel label="Address of Institute / ආයතනයේ ලිපිනය" />
                                                    <GInput
                                                        value={form.spouseAddressOfInstitute}
                                                        onChange={(v) => set('spouseAddressOfInstitute', v)}
                                                        placeholder="Spouse's workplace address"
                                                    />
                                                </div>
                                                <div>
                                                    <FieldLabel label="NIC Number / ජාතික හැඳුනුම්පත් අංකය" />
                                                    <GInput
                                                        value={form.spouseNic}
                                                        onChange={(v) => set('spouseNic', v)}
                                                        placeholder="Spouse's NIC Number"
                                                        maxLength={12}
                                                    />
                                                </div>
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
                                                    <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide w-44 font-noto-sinhala">NIC Number / ජා.හැ. අංකය</th>
                                                    <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide w-44 font-noto-sinhala">Birthday / උපන්දිනය</th>
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
                                                            <GInput value={child.nic} onChange={(v) => updateChild(child.id, { nic: v })} placeholder="NIC Number" maxLength={12} />
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
                                </fieldset>

                                {isEditing && <SectionActions
                                    showEdit
                                    isEditingSection={personalFamilyEditing}
                                    onEdit={() => setPersonalFamilyEditing(true)}
                                    onSave={savePersonalFamilySection}
                                    saving={sectionSaving === 'personal-family'}
                                    saveLabel="Save"
                                /> }
                            </div>

                            {/* ─── SECTION 2: System Access ─────────────────────────────────── */}
                            <div className="p-4 sm:p-5 rounded-xl border border-sky-200 bg-sky-50/80">
                                <SectionHeader
                                    sectionNo={2}
                                    title="System Access"
                                    titleSi="පද්ධති ප්‍රවේශය"
                                />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <FieldLabel label="Username" si="පරිශීලක නාමය" />
                                        <GInput
                                            value={form.regNo || ''}
                                            onChange={() => {}}
                                            readOnly
                                            disabled
                                            placeholder="Registration Number"
                                        />
                                        <p className="text-xs text-blue-500 mt-1">(Registration number used as login username)</p>
                                    </div>

                                    <div>
                                        <FieldLabel label="System Access Location" si="පද්ධති ප්‍රවේශ සේවාස්ථානය" />
                                        <MultiSelect
                                            value={form.systemAccessLocations}
                                            onChange={(selected) => set('systemAccessLocations', selected)}
                                            options={SOCO_LABS_OPTIONS}
                                            placeholder={locationsLoading ? 'Loading locations...' : 'Select access location(s)'}
                                        />
                                    </div>

                                    <div>
                                        <FieldLabel label="Password" si="මුරපදය" />
                                        <div className="relative">
                                            <GInput
                                                type={showPassword ? 'text' : 'password'}
                                                value={form.password}
                                                onChange={(v) => set('password', v)}
                                                placeholder="Enter password"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                                            >
                                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <FieldLabel label="Re-enter Password" si="මුරපදය නැවත ඇතුළත් කරන්න" />
                                        <div className="relative">
                                            <GInput
                                                type={showConfirmPassword ? 'text' : 'password'}
                                                value={form.confirmPassword}
                                                onChange={(v) => set('confirmPassword', v)}
                                                placeholder="Re-enter password"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                                            >
                                                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                        {form.confirmPassword ? (
                                            form.password === form.confirmPassword ? (
                                                <p className="text-xs font-medium text-emerald-600 mt-1.5 flex items-center gap-1">
                                                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> Passwords match
                                                </p>
                                            ) : (
                                                <p className="text-xs font-medium text-red-600 mt-1.5 flex items-center gap-1">
                                                    <XCircle className="w-3.5 h-3.5 shrink-0" /> Passwords do not match
                                                </p>
                                            )
                                        ) : null}
                                    </div>
                                </div>

                                <SectionActions
                                    isEditingSection
                                    onSave={saveSystemAccessSection}
                                    saving={sectionSaving === 'system-access'}
                                    saveLabel="Save System Access"
                                />
                            </div>

                            {/* ─── SECTION 3: Official Information ─────────────────────────── */}
                            {isEditing && <div className="p-4 sm:p-5 rounded-xl border border-indigo-200 bg-indigo-50/65">
                                <SectionHeader sectionNo={3} title="Promotions  " titleSi="උසස්වීම්" />

                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                    <div>
                                        <FieldLabel label="Date Joined Police Dept. / පොලිස් දෙපාර්තමේන්තු" />
                                        <DatePicker value={form.dateJoinedPolice} onChange={(v) => set('dateJoinedPolice', v)} />
                                    </div>
                                    <div>
                                         <FieldLabel label="Appointed Rank / පත් කළ තනතුර" />
                                         <CustomSelect 
                                             value={form.appointedRank} 
                                             onChange={(v) => handleRankChange(v, 'appointedRankId')}
                                             options={RANK_OPTIONS} 
                                             placeholder={ranksLoading ? "Loading..." : "Select"}
                                             disabled={ranksLoading}
                                         />
                                         {ranksError && (
                                             <p className="text-xs text-red-600 mt-1">{ranksError}</p>
                                         )}
                                     </div>
                                     <div>
                                         <FieldLabel label="Present Rank / වත්මන් තනතුර" />
                                         <CustomSelect 
                                             value={form.presentRank} 
                                             onChange={(v) => handleRankChange(v, 'presentRankId')}
                                             options={RANK_OPTIONS} 
                                             placeholder={ranksLoading ? "Loading..." : "Select"}
                                             disabled={ranksLoading}
                                         />
                                         {ranksError && (
                                             <p className="text-xs text-red-600 mt-1">{ranksError}</p>
                                         )}
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

                                <SectionActions
                                    isEditingSection
                                    onSave={savePromotionsSection}
                                    saving={sectionSaving === 'promotions'}
                                />
                            </div> }

                            {/* ─── SECTION 4: Education ────────────────────────────────────── */}
                            {isEditing && <div className="p-4 sm:p-5 rounded-xl border border-violet-200 bg-violet-50/60">
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
                                                    <tr key={idx} className="border-b border-violet-50 last:border-0 odd:bg-white even:bg-violet-50/20">
                                                        <td className="px-2 py-1.5">
                                                            <GInput
                                                                value={row.subject}
                                                                onChange={(v) => updateOLMandatorySubject(idx, v)}
                                                                placeholder="Subject name"
                                                            />
                                                        </td>
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
                                                    <th className="w-10"></th>
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
                                                        <td className="px-1 py-1.5">
                                                            <RemoveRowButton onClick={() => removeOLOptional(row.id)} size="sm" />
                                                        </td>
                                                    </tr>
                                                ))}
                                                </tbody>
                                            </table>
                                        </div>
                                        <div className="flex items-center gap-2 mt-2">
                                            <AddRowButton onClick={addOLOptional}>Add Subject</AddRowButton>
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

                                    <div className={`rounded-xl border border-violet-100 overflow-hidden transition-all duration-200 ${
                                        !form.alStream ? 'opacity-50 pointer-events-none select-none bg-gray-50/50' : ''
                                    }`}>
                                        <div className="px-4 py-2.5 bg-violet-50/70 border-b border-violet-100">
                                            <span className="text-xs font-bold text-violet-800 uppercase tracking-wide">
                                                {form.alStream ? `${form.alStream} Stream — Subjects` : 'Subjects (Select Stream to edit)'}
                                            </span>
                                        </div>
                                        <div className="overflow-x-auto">
                                            <table className="data-grid-table data-grid-table--compact w-full text-sm text-gray-900">
                                                <thead>
                                                    <tr className="bg-gray-50 border-b border-gray-200">
                                                        <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">#</th>
                                                        <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Subject Name</th>
                                                        <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide w-32">Grade</th>
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
                                                                    disabled={!form.alStream}
                                                                />
                                                            </td>
                                                            <td className="px-2 py-1.5">
                                                                <GInput
                                                                    value={row.grade}
                                                                    onChange={(v) => updateALSubject(row.id, { grade: v })}
                                                                    placeholder="e.g. A, B, C"
                                                                    maxLength={3}
                                                                    disabled={!form.alStream}
                                                                />
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
                                                                disabled={!form.alStream}
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
                                                                disabled={!form.alStream}
                                                            />
                                                        </td>
                                                        <td />
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>

                                {/* ── Degrees ─────────────────────────────────────────────── */}
                                <div className="mb-5">
                                    <div className="rounded-xl border border-violet-100 bg-white overflow-hidden shadow-sm">
                                        <div className="px-4 py-3 border-b border-violet-100 bg-violet-50/60">
                                            <h4 className="text-sm font-bold text-violet-900 uppercase tracking-wide">
                                                Degrees / Qualifications
                                            </h4>
                                            <p className="text-xs text-violet-700 mt-0.5">
                                                Record qualifications obtained before or after joining the Police Department
                                            </p>
                                        </div>
                                        <div className="p-4 space-y-3">
                                            {form.degrees.map((row, idx) => (
                                                <div key={row.id} className="rounded-lg border border-gray-200 bg-gray-50/50 p-3 space-y-3">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Entry {idx + 1}</span>
                                                        {form.degrees.length > 1 && (
                                                            <RemoveRowButton onClick={() => removeDegree(row.id)} size="sm" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <FieldLabel label="University / Institute" />
                                                        <GInput value={row.university} onChange={(v) => updateDegree(row.id, { university: v })} placeholder="University or Institute name" />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Timing</p>
                                                        <div className="flex flex-wrap gap-2">
                                                            {(['before', 'after'] as const).map((val) => {
                                                                const label = val === 'before' ? 'Before Joining Police' : 'After Joining Police (Sponsored)';
                                                                const isSelected = row.timing === val;
                                                                return (
                                                                    <label key={val} className={`min-h-10 flex items-center gap-1.5 cursor-pointer text-sm px-3 py-2 rounded-lg border transition-colors ${
                                                                        isSelected
                                                                            ? 'bg-violet-50 border-violet-300 text-violet-800 font-medium'
                                                                            : 'bg-white border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-600'
                                                                    }`}>
                                                                        <input
                                                                            type="radio"
                                                                            name={`degree-timing-${row.id}`}
                                                                            value={val}
                                                                            checked={isSelected}
                                                                            onChange={() => updateDegree(row.id, { timing: val })}
                                                                            className="accent-violet-600"
                                                                        />
                                                                        {label}
                                                                    </label>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                        <div>
                                                            <FieldLabel label="Qualification Type" />
                                                            <CustomSelect
                                                                value={row.qualificationType}
                                                                onChange={(v) => {
                                                                    updateDegree(row.id, {
                                                                        qualificationType: v as QualificationType,
                                                                        qualificationTypeOther: v === 'Other' ? row.qualificationTypeOther : '',
                                                                    });
                                                                }}
                                                                options={QUALIFICATION_TYPE_OPTIONS}
                                                                placeholder="Select type"
                                                            />
                                                        </div>
                                                        <div>
                                                            <FieldLabel label="Degree / Qualification Name" />
                                                            <GInput value={row.degree} onChange={(v) => updateDegree(row.id, { degree: v })} placeholder="e.g. BSc Computer Science" />
                                                        </div>
                                                    </div>
                                                    {row.qualificationType === 'Other' && (
                                                        <div>
                                                            <FieldLabel label="Specify Qualification Type" />
                                                            <GInput
                                                                value={row.qualificationTypeOther}
                                                                onChange={(v) => updateDegree(row.id, { qualificationTypeOther: v })}
                                                                placeholder="Enter qualification type"
                                                            />
                                                        </div>
                                                    )}
                                                    <div className="flex gap-2">
                                                        <div className="w-32">
                                                            <FieldLabel label="From" />
                                                            <GInput value={row.yearFrom} onChange={(v) => updateDegree(row.id, { yearFrom: v })} placeholder="YYYY" maxLength={4} />
                                                        </div>
                                                        <div className="w-32">
                                                            <FieldLabel label="To" />
                                                            <GInput value={row.yearTo} onChange={(v) => updateDegree(row.id, { yearTo: v })} placeholder="YYYY" maxLength={4} />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        {form.degrees.length < 12 && (
                                            <div className="px-4 pb-4"><AddRowButton onClick={addDegree}>Add Qualification</AddRowButton></div>
                                        )}
                                    </div>
                                </div>

                                <SectionActions
                                    isEditingSection
                                    onSave={saveEducation}
                                    saving={sectionSaving === 'Education'}
                                />
                            </div>}

                            {/* ─── SECTION 5: Courses Before SOCO ──────────────────────────── */}
                            {isEditing && <div className="p-5 sm:p-6 rounded-2xl border border-amber-200 bg-amber-50/70">
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

                                <SectionActions
                                    isEditingSection
                                    onSave={() => saveCourses('Courses Before SOCO', 1)}
                                    saving={sectionSaving === 'Courses Before SOCO'}
                                />
                            </div>}

                            {/* ─── SECTION 6: Courses After SOCO ───────────────────────────── */}
                            {isEditing && <div className="p-5 sm:p-6 rounded-2xl border border-cyan-200 bg-cyan-50/70">
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

                                <SectionActions
                                    isEditingSection
                                    onSave={() => saveCourses('Courses After SOCO', 2)}
                                    saving={sectionSaving === 'Courses After SOCO'}
                                />
                            </div>}

                            {/* ─── SECTION 7: Driving License ──────────────────────────────── */}
                            {isEditing && <div className="p-5 sm:p-6 rounded-2xl border border-rose-200 bg-rose-50/70">
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

                                <SectionActions
                                    isEditingSection
                                    onSave={saveDrivingLicense}
                                    saving={sectionSaving === 'Driving License'}
                                />
                            </div>}

                            {/* ─── SECTION 8: Transfer ─────────────────────────────────────── */}
                            {isEditing && <div className="p-5 sm:p-6 rounded-2xl border border-fuchsia-200 bg-fuchsia-50/70">
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

                                <SectionActions
                                    isEditingSection
                                    onSave={saveTransfers}
                                    saving={sectionSaving === 'Transfer'}
                                />
                            </div>}

                            {/* ─── SECTION 9: Special Duty ─────────────────────────────────── */}
                            {isEditing && <div className="p-5 sm:p-6 rounded-2xl border border-amber-200 bg-amber-50/70">
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

                                <SectionActions
                                    isEditingSection
                                    onSave={saveSpecialDuty}
                                    saving={sectionSaving === 'Special Duty'}
                                />
                            </div>}

                            {/* ─── SECTION 10: Disciplinary Inquiries ──────────────────────── */}
                            {isEditing && <div className="p-5 sm:p-6 rounded-2xl border border-emerald-200 bg-emerald-50/70">
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

                                <SectionActions
                                    isEditingSection
                                    onSave={saveDisciplinaryInquiries}
                                    saving={sectionSaving === 'Disciplinary Inquiries'}
                                />
                            </div>}

                            {/* ─── SECTION 11: Special Illnesses & Notes ───────────────────── */}
                            {isEditing && <div className="p-5 sm:p-6 rounded-2xl border border-sky-200 bg-sky-50/70">
                                <SectionHeader
                                    sectionNo={10}
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

                                <SectionActions
                                    isEditingSection
                                    onSave={saveSpecialIllnessesNotes}
                                    saving={sectionSaving === 'Special Illnesses & Notes'}
                                />
                            </div>}

                            </div>

                            {/* ─── Action Bar ──────────────────────────────────────────────── */}
                            {!isEditing && <div className="flex-shrink-0 border-t border-gray-200 bg-gray-50/70 px-5 py-3 rounded-b-xl flex items-center justify-between gap-3">
                                <div />
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="secondary"
                                        type="button"
                                        onClick={() => router.push('/crime-officer')}
                                        className="min-h-[42px] px-4 py-2.5 text-sm font-medium"
                                        disabled={loading}
                                    >
                                        Cancel
                                    </Button>
                                    {/* <Button 
                                        variant="amber" 
                                        type="button" 
                                        onClick={() => alert('Draft saved!')}
                                        disabled={loading}
                                    >
                                        Save as Draft
                                    </Button> */}
                                    <Button 
                                        variant="primary" 
                                        type="submit"
                                        disabled={loading}
                                    >
                                        {loading ? 'Saving...' : 'Save Officer'}
                                    </Button>
                                </div>
                                <div />
                            </div> }

                        </form>
        </PageLayout>
    );
}
