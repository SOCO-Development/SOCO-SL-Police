'use client';

import { useState, useRef, useCallback, useId } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import { ArrowLeft } from 'lucide-react';
import Footer from '@/components/layout/Footer';
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
const CIVIL_STATUS_OPTIONS = ANNEX_06_CIVIL_STATUS.map((s) => ({ value: s, label: s }));
const SPOUSE_DESIGNATION_OPTIONS = ANNEX_07_SPOUSE_DESIGNATION.map((s) => ({ value: s, label: s }));

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChildRow {
    id: number;
    name: string;
    age: string;
    school: string;
}

interface PromotionRow {
    id: number;
    rank: string;
    date: string;
}

interface ServedLabRow {
    id: number;
    lab: string;
    from: string;
    to: string;
    oic: string;
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
    spouseNameAddress: string;
    children: ChildRow[];
    // Section 3
    dateJoinedPolice: string;
    appointedRank: string;
    presentRank: string;
    promotions: PromotionRow[];
    // Section 4
    servedLabs: ServedLabRow[];
    // Section 5
    preferredLab1: string;
    preferredLab2: string;
    preferredLab3: string;
    // Section 6
    disciplinaryNature: string;
    disciplinaryStation: string;
    disciplinaryDivision: string;
    disciplinaryYesNo: string;
    disciplinaryResult: string;
    // Section 7
    servedAdminUnit: string;
    servedAdminUnitYesNo: string;
    attachedUnit: string;
    attachedUnitYesNo: string;
    attachedDivision: string;
    attachedDivisionYesNo: string;
    branch: string;
    branchYesNo: string;
}

let rowSeed = 1;
const newId = () => rowSeed++;

function defaultForm(): FormData {
    return {
        socoLab: '', rankDropdown: '', regNo: '', fullName: '',
        reportedDate: '', dob: '', dateJoinedSoco: '',
        socoCourseNo: '', socoService: '',
        telOffice: '', telResidence: '', telMobile: '',
        photoUrl: '',
        civilStatus: '', spouseDesignation: '', spouseNameAddress: '',
        children: [{ id: newId(), name: '', age: '', school: '' }],
        dateJoinedPolice: '', appointedRank: '', presentRank: '',
        promotions: [{ id: newId(), rank: '', date: '' }],
        servedLabs: [{ id: newId(), lab: '', from: '', to: '', oic: '' }],
        preferredLab1: '', preferredLab2: '', preferredLab3: '',
        disciplinaryNature: '', disciplinaryStation: '', disciplinaryDivision: '',
        disciplinaryYesNo: 'No', disciplinaryResult: '',
        servedAdminUnit: '', servedAdminUnitYesNo: 'No',
        attachedUnit: '', attachedUnitYesNo: 'No',
        attachedDivision: '', attachedDivisionYesNo: 'No',
        branch: '', branchYesNo: 'No',
    };
}

// ─── Duration calculator ──────────────────────────────────────────────────────

function calcDuration(from: string, to: string): string {
    if (!from || !to) return '';
    const parseDate = (s: string) => {
        const sep = s.includes('-') ? '-' : '/';
        const parts = s.split(sep);
        if (!parts[0] || !parts[1] || !parts[2]) return null;
        const [a, b, c] = parts.map((p) => parseInt(p, 10));
        if (isNaN(a) || isNaN(b) || isNaN(c)) return null;
        if (parts[0].length === 4) {
            return new Date(a, b - 1, c);
        }
        const year = c <= 99 ? 2000 + c : c;
        return new Date(year, b - 1, a);
    };
    const f = parseDate(from);
    const t = parseDate(to);
    if (!f || !t || isNaN(f.getTime()) || isNaN(t.getTime())) return '';
    const diffMs = t.getTime() - f.getTime();
    if (diffMs < 0) return '';
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    return diffDays === 1 ? '1 day' : `${diffDays} days`;
}

// ─── Shared UI Components ─────────────────────────────────────────────────────

function SectionHeader({ tableRef, title, titleSi }: { tableRef?: string; title: string; titleSi?: string }) {
    return (
        <div className="flex items-start justify-between gap-3 mb-6 pb-3 border-b border-gray-200">
            <div>
                <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide">{title}</h3>
                {titleSi && <p className="text-xs text-gray-500 mt-1 font-noto-sinhala">{titleSi}</p>}
            </div>
            {tableRef && (
                <span className="text-[11px] font-semibold text-gray-500 bg-gray-100 border border-gray-200 px-2.5 py-1 rounded-full whitespace-nowrap">
                    {tableRef}
                </span>
            )}
        </div>
    );
}

function AnnexLabel({ children }: { children: React.ReactNode }) {
    return (
        <span className="inline-block text-[11px] text-gray-400 font-semibold mb-1 uppercase tracking-wide">{children}</span>
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
    value, onChange, placeholder, maxLength, readOnly, type = 'text'
}: {
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    maxLength?: number;
    readOnly?: boolean;
    type?: string;
}) {
    return (
        <input
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            maxLength={maxLength}
            readOnly={readOnly}
            className={`w-full min-h-10 px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-800
        focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500
        hover:border-gray-400 transition-colors
        ${readOnly ? 'cursor-default bg-gray-100 text-gray-500' : ''}`}
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
                    : 'bg-green-50/30 border-green-100 text-green-400 hover:border-green-200 hover:text-green-500';
                const noStyle = isSelected
                    ? 'bg-red-50 border-red-300 text-red-800 font-medium'
                    : 'bg-red-50/30 border-red-100 text-red-400 hover:border-red-200 hover:text-red-500';
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

function AddRowBtn({ onClick, label }: { onClick: () => void; label?: string }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="mt-3 text-sm text-blue-700 hover:text-blue-800 font-semibold flex items-center gap-1 transition-colors"
        >
            <span className="text-base leading-none">+</span> {label ?? 'Add Row'}
        </button>
    );
}

function RemoveBtn({ onClick }: { onClick: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="text-red-400 hover:text-red-600 text-lg leading-none transition-colors self-end pb-2"
            aria-label="Remove row"
        >
            ×
        </button>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AddOfficerPage() {
    const [form, setForm] = useState<FormData>(defaultForm);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const fileRef = useRef<HTMLInputElement>(null);
    const [submitted, setSubmitted] = useState(false);

    const set = useCallback(<K extends keyof FormData>(key: K, val: FormData[K]) => {
        setForm((f) => ({ ...f, [key]: val }));
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
        if (form.children.length >= 4) return;
        set('children', [...form.children, { id: newId(), name: '', age: '', school: '' }]);
    };
    const updateChild = (id: number, patch: Partial<ChildRow>) =>
        set('children', form.children.map((c) => c.id === id ? { ...c, ...patch } : c));
    const removeChild = (id: number) =>
        set('children', form.children.filter((c) => c.id !== id));

    // Promotions
    const addPromotion = () => {
        if (form.promotions.length >= 4) return;
        set('promotions', [...form.promotions, { id: newId(), rank: '', date: '' }]);
    };
    const updatePromotion = (id: number, patch: Partial<PromotionRow>) =>
        set('promotions', form.promotions.map((p) => p.id === id ? { ...p, ...patch } : p));
    const removePromotion = (id: number) =>
        set('promotions', form.promotions.filter((p) => p.id !== id));

    // Served labs
    const addServedLab = () =>
        set('servedLabs', [...form.servedLabs, { id: newId(), lab: '', from: '', to: '', oic: '' }]);
    const updateServedLab = (id: number, patch: Partial<ServedLabRow>) =>
        set('servedLabs', form.servedLabs.map((r) => r.id === id ? { ...r, ...patch } : r));
    const removeServedLab = (id: number) =>
        set('servedLabs', form.servedLabs.filter((r) => r.id !== id));

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitted(true);
        // Future: POST to API
        alert('Officer details saved successfully!');
    };

    return (
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-white to-gray-50">
            <Header />
            <div className="flex flex-1 relative z-10 w-full pt-14">
                <main className="flex-1 overflow-x-hidden min-w-0 flex flex-col min-h-screen">
                    <div className="w-full px-4 sm:px-6 lg:px-8 py-8 flex-1">
                        {/* Page header */}
                        <div className="flex items-center gap-3 mb-6">
                            <Link
                                href="/config/crime-officer"
                                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                                aria-label="Back"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </Link>
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">Add SOCO Officer</h2>
                                <p className="text-sm text-gray-600 mt-0.5">
                                    Complete all required details to register a new officer profile.
                                </p>
                                {submitted && (
                                    <p className="mt-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 inline-block">
                                        Officer details saved successfully.
                                    </p>
                                )}
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 flex flex-col overflow-hidden animate-fade-in" style={{ minHeight: '400px' }}>
                            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

                            {/* ─── SECTION 1: Personal Details ─────────────────────────────── */}
                            <div className="p-4 sm:p-5 rounded-xl border border-gray-200 bg-gray-50/80">
                                <SectionHeader
                                    tableRef="Table : 01"
                                    title="PERSONNEL DETAILS OF SCENE OF CRIME OFFICER"
                                    titleSi="අපරාධ ස්ථාන නිලධාරිගේ පුද්ගලික තොරතුරු"
                                />

                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 sm:gap-6">
                                    {/* SOCO Lab */}
                                    <div>
                                        <AnnexLabel>Annex . 01</AnnexLabel>
                                        <FieldLabel label="SOCO Lab" si="SOCO රසායනාගාරය" />
                                        <CustomSelect value={form.socoLab} onChange={(v) => set('socoLab', v)}
                                            options={SOCO_LABS_OPTIONS} placeholder="-- Select SOCO Lab --" />
                                    </div>

                                    {/* Rank & Reg No */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 xl:col-span-2">
                                        <div>
                                            <AnnexLabel>Annex . 12</AnnexLabel>
                                            <FieldLabel label="Rank" si="තනතුර" />
                                            <CustomSelect value={form.rankDropdown} onChange={(v) => set('rankDropdown', v)}
                                                options={RANK_OPTIONS} placeholder="-- Rank --" />
                                        </div>
                                        <div>
                                            <AnnexLabel>&nbsp;</AnnexLabel>
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
                                        <FieldLabel label="Date Joined SOCO Project / SOCO ව්‍යාපෘතියට එකතු වූ දිනය" />
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
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:col-span-2 xl:col-span-3">
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

                                {/* Photo upload — 2" x 2.5" */}
                                <div className="mt-6 flex items-start gap-6">
                                    <div>
                                        <FieldLabel label='Photo (2" × 2.5") / ඡායාරූපය' />
                                        <div
                                            className="w-[96px] h-[120px] border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 flex items-center justify-center overflow-hidden cursor-pointer hover:border-blue-400 transition-colors"
                                            onClick={() => fileRef.current?.click()}
                                        >
                                            {photoPreview
                                                ? <img src={photoPreview} alt="Photo" className="w-full h-full object-cover" />
                                                : <span className="text-xs text-gray-400 text-center px-1">Click to upload<br />2″ × 2.5″</span>
                                            }
                                        </div>
                                        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
                                        <button
                                            type="button"
                                            onClick={() => fileRef.current?.click()}
                                            className="mt-2 text-xs text-blue-700 hover:text-blue-800 font-semibold transition-colors"
                                        >
                                            Upload Photo
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* ─── SECTION 2: Family Details ───────────────────────────────── */}
                            <div className="p-4 sm:p-5 rounded-xl border border-gray-200 bg-gray-50/80">
                                <SectionHeader title="Family Details" titleSi="පවුල් තොරතුරු" />

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
                                    <div>
                                        <AnnexLabel>Annex . 06</AnnexLabel>
                                        <FieldLabel label="Civil Status / සිවිල් තත්වය" />
                                        <CustomSelect value={form.civilStatus} onChange={(v) => set('civilStatus', v)}
                                            options={CIVIL_STATUS_OPTIONS} placeholder="-- Select --" />
                                    </div>

                                    <div>
                                        <AnnexLabel>Annex . 07</AnnexLabel>
                                        <FieldLabel label="Spouse Designation / කලත්‍රයාගේ තනතුර" />
                                        <CustomSelect value={form.spouseDesignation} onChange={(v) => set('spouseDesignation', v)}
                                            options={SPOUSE_DESIGNATION_OPTIONS} placeholder="-- Select --" />
                                    </div>

                                    <div className="md:col-span-2">
                                        <FieldLabel label="Spouse Name & Address of Institute / කලත්‍රයාගේ නම හා ආයතනයේ ලිපිනය" />
                                        <GInput value={form.spouseNameAddress} onChange={(v) => set('spouseNameAddress', v)}
                                            placeholder="Name and institute address" />
                                    </div>
                                </div>

                                {/* Children table */}
                                <div className="mt-6">
                                    <FieldLabel label="Details of Children / දරුවන්ගේ තොරතුරු" />
                                    <div className="overflow-x-auto rounded-xl border border-gray-200 mt-2">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="bg-gray-50 border-b border-gray-200">
                                                    <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide font-noto-sinhala">Name of the Child / දරුවාගේ නම</th>
                                                    <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide w-28 font-noto-sinhala">Age / වයස</th>
                                                    <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide font-noto-sinhala">School / University / පාසල / විශ්ව.</th>
                                                    <th className="w-8" />
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {form.children.map((child) => (
                                                    <tr key={child.id} className="border-b border-gray-100 last:border-0">
                                                        <td className="px-2 py-1.5">
                                                            <GInput value={child.name} onChange={(v) => updateChild(child.id, { name: v })} placeholder="Child name" />
                                                        </td>
                                                        <td className="px-2 py-1.5">
                                                            <GInput value={child.age} onChange={(v) => updateChild(child.id, { age: v })} placeholder="Age" type="number" />
                                                        </td>
                                                        <td className="px-2 py-1.5">
                                                            <GInput value={child.school} onChange={(v) => updateChild(child.id, { school: v })} placeholder="School / University" />
                                                        </td>
                                                        <td className="px-2 py-1.5">
                                                            {form.children.length > 1 && <RemoveBtn onClick={() => removeChild(child.id)} />}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    {form.children.length < 4 && (
                                        <AddRowBtn onClick={addChild} label="Add Child" />
                                    )}
                                    {form.children.length >= 4 && (
                                        <p className="text-xs text-gray-400 mt-1">Maximum 4 children reached.</p>
                                    )}
                                </div>
                            </div>

                            {/* ─── SECTION 3: Official Information ─────────────────────────── */}
                            <div className="p-4 sm:p-5 rounded-xl border border-gray-200 bg-gray-50/80">
                                <SectionHeader title="Official Information" titleSi="නිල තොරතුරු" />

                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 sm:gap-6">
                                    <div>
                                        <FieldLabel label="Date Joined Police Dept. / පොලිස් දෙපාර්තමේන්තු" />
                                        <DatePicker value={form.dateJoinedPolice} onChange={(v) => set('dateJoinedPolice', v)} />
                                    </div>
                                    <div>
                                        <AnnexLabel>Annex . 12</AnnexLabel>
                                        <FieldLabel label="Appointed Rank / පත් කළ තනතුර" />
                                        <CustomSelect value={form.appointedRank} onChange={(v) => set('appointedRank', v)}
                                            options={RANK_OPTIONS} placeholder="-- Select --" />
                                    </div>
                                    <div>
                                        <AnnexLabel>Annex . 12</AnnexLabel>
                                        <FieldLabel label="Present Rank / වත්මන් තනතුර" />
                                        <CustomSelect value={form.presentRank} onChange={(v) => set('presentRank', v)}
                                            options={RANK_OPTIONS} placeholder="-- Select --" />
                                    </div>
                                </div>

                                {/* Promotions */}
                                <div className="mt-6">
                                    <FieldLabel label="Promotion Dates / උසස් කිරීමේ දිනය" />
                                    <div className="overflow-x-auto rounded-xl border border-gray-200 mt-2">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="bg-gray-50 border-b border-gray-200">
                                                    <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide w-48">
                                                        <span className="text-gray-400 text-xs">Annex . 12</span><br />
                                                        Rank / තනතුර
                                                    </th>
                                                    <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide font-noto-sinhala">Date / දිනය (DD/MM/YY)</th>
                                                    <th className="w-8" />
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {form.promotions.map((promo) => (
                                                    <tr key={promo.id} className="border-b border-gray-100 last:border-0">
                                                        <td className="px-2 py-1.5">
                                                            <CustomSelect value={promo.rank} onChange={(v) => updatePromotion(promo.id, { rank: v })}
                                                                options={RANK_OPTIONS} placeholder="-- Rank --" />
                                                        </td>
                                                        <td className="px-2 py-1.5">
                                                            <DatePicker value={promo.date} onChange={(v) => updatePromotion(promo.id, { date: v })} />
                                                        </td>
                                                        <td className="px-2 py-1.5">
                                                            {form.promotions.length > 1 && <RemoveBtn onClick={() => removePromotion(promo.id)} />}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    {form.promotions.length < 4 && (
                                        <AddRowBtn onClick={addPromotion} label="Add Promotion" />
                                    )}
                                    {form.promotions.length >= 4 && (
                                        <p className="text-xs text-gray-400 mt-1">Maximum 4 promotions reached.</p>
                                    )}
                                </div>
                            </div>

                            {/* ─── SECTION 4: Served SOCO Labs ─────────────────────────────── */}
                            <div className="p-4 sm:p-5 rounded-xl border border-gray-200 bg-gray-50/80">
                                <SectionHeader
                                    tableRef="Table : 04"
                                    title="SERVED SOCO LABS AFTER FOLLOWED THE SOCO COURSE"
                                    titleSi="SOCO පාඨමාලාවෙන් පසු සේවය කළ SOCO රසායනාගාර"
                                />

                                <div className="overflow-x-auto rounded-xl border border-gray-200">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="bg-gray-50 border-b border-gray-200">
                                                <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide w-40">
                                                    <span className="text-gray-400 text-xs block">Annex . 01</span>
                                                    SOCO Lab
                                                </th>
                                                <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide w-32">From (DD/MM/YY)</th>
                                                <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide w-32">To (DD/MM/YY)</th>
                                                <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide w-24">Duration</th>
                                                <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide w-36">OIC / A-OIC</th>
                                                <th className="w-8" />
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {form.servedLabs.map((row) => {
                                                const dur = calcDuration(row.from, row.to);
                                                return (
                                                    <tr key={row.id} className="border-b border-gray-100 last:border-0">
                                                        <td className="px-2 py-1.5">
                                                            <CustomSelect value={row.lab} onChange={(v) => updateServedLab(row.id, { lab: v })}
                                                                options={SOCO_LABS_OPTIONS} placeholder="-- Select Lab --" />
                                                        </td>
                                                        <td className="px-2 py-1.5">
                                                            <DatePicker value={row.from} onChange={(v) => updateServedLab(row.id, { from: v })} />
                                                        </td>
                                                        <td className="px-2 py-1.5">
                                                            <DatePicker value={row.to} onChange={(v) => updateServedLab(row.id, { to: v })} />
                                                        </td>
                                                        <td className="px-2 py-1.5">
                                                            <GInput value={dur} onChange={() => { }} readOnly placeholder="Auto" />
                                                        </td>
                                                        <td className="px-2 py-1.5">
                                                            <GInput value={row.oic} onChange={(v) => updateServedLab(row.id, { oic: v })} placeholder="OIC / A-OIC" />
                                                        </td>
                                                        <td className="px-2 py-1.5">
                                                            {form.servedLabs.length > 1 && <RemoveBtn onClick={() => removeServedLab(row.id)} />}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                                <AddRowBtn onClick={addServedLab} label="Add Lab" />
                            </div>

                            {/* ─── SECTION 5: Willing to Serve ─────────────────────────────── */}
                            <div className="p-4 sm:p-5 rounded-xl border border-gray-200 bg-gray-50/80">
                                <SectionHeader title="Willing to Serve SOCO Labs" titleSi="සේවය කිරීමට කැමති SOCO රසායනාගාර" />

                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 sm:gap-6">
                                    {([1, 2, 3] as const).map((n) => {
                                        const key = `preferredLab${n}` as keyof FormData;
                                        return (
                                            <div key={n}>
                                                <AnnexLabel>Annex . 01</AnnexLabel>
                                                <FieldLabel label={`${n}${n === 1 ? 'st' : n === 2 ? 'nd' : 'rd'} Preference / ${n} වන කැමැත්ත`} />
                                                <CustomSelect
                                                    value={form[key] as string}
                                                    onChange={(v) => set(key, v)}
                                                    options={SOCO_LABS_OPTIONS}
                                                    placeholder="-- Select Lab --"
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* ─── SECTION 6: Disciplinary Inquiries ───────────────────────── */}
                            <div className="p-4 sm:p-5 rounded-xl border border-gray-200 bg-gray-50/80">
                                <SectionHeader title="Disciplinary Inquiries" titleSi="විනය විමර්ශන" />

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
                                    <div>
                                        <FieldLabel label="Nature / ස්වභාවය" />
                                        <GInput value={form.disciplinaryNature} onChange={(v) => set('disciplinaryNature', v)} placeholder="Nature of inquiry" />
                                    </div>
                                    <div>
                                        <FieldLabel label="Police Station / පොලිස් ස්ථානය" />
                                        <GInput value={form.disciplinaryStation} onChange={(v) => set('disciplinaryStation', v)} placeholder="Police Station" />
                                    </div>
                                    <div>
                                        <FieldLabel label="Division / කොට්ඨාසය" />
                                        <GInput value={form.disciplinaryDivision} onChange={(v) => set('disciplinaryDivision', v)} placeholder="Division" />
                                    </div>
                                    <div>
                                        <FieldLabel label="Yes / No" />
                                        <YesNo value={form.disciplinaryYesNo} onChange={(v) => set('disciplinaryYesNo', v)} />
                                    </div>
                                    <div className="md:col-span-2">
                                        <FieldLabel label="Result / ප්‍රතිඵලය" />
                                        <textarea
                                            value={form.disciplinaryResult}
                                            onChange={(e) => set('disciplinaryResult', e.target.value)}
                                            rows={4}
                                            placeholder="Describe the result of the disciplinary inquiry..."
                                            className="w-full min-h-10 px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-800 
                        focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500
                        hover:border-gray-400 transition-colors resize-y"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* ─── SECTION 7: Transfer Details ─────────────────────────────── */}
                            <div className="p-4 sm:p-5 rounded-xl border border-gray-200 bg-gray-50/80">
                                <SectionHeader title="Transfer Details" titleSi="මාරුවීම් තොරතුරු" />

                                <div className="space-y-4">
                                    {[
                                        { label: 'Served in Administrative Unit / පරිපාලන ඒකකයේ සේවය', fieldKey: 'servedAdminUnit', ynKey: 'servedAdminUnitYesNo' },
                                        { label: 'Attached Unit / අමුණා ගත් ඒකකය', fieldKey: 'attachedUnit', ynKey: 'attachedUnitYesNo' },
                                        { label: 'Division / කොට්ඨාසය', fieldKey: 'attachedDivision', ynKey: 'attachedDivisionYesNo' },
                                        { label: 'Branch / ශාඛාව', fieldKey: 'branch', ynKey: 'branchYesNo' },
                                    ].map(({ label, fieldKey, ynKey }) => (
                                        <div key={fieldKey} className="flex flex-row gap-4 items-end">
                                            <div className="flex-shrink-0">
                                                <FieldLabel label="Yes / No" />
                                                <YesNo
                                                    value={form[ynKey as keyof FormData] as string}
                                                    onChange={(v) => set(ynKey as keyof FormData, v)}
                                                />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <FieldLabel label={label} />
                                                <GInput
                                                    value={form[fieldKey as keyof FormData] as string}
                                                    onChange={(v) => set(fieldKey as keyof FormData, v)}
                                                    placeholder="Details..."
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            </div>

                            {/* ─── Action Bar ───────────────────────────────────────────────── */}
                            <div className="flex-shrink-0 border-t border-gray-200 bg-gray-50/70 px-5 py-3 rounded-b-xl flex items-center justify-between gap-3">
                                <Link
                                    href="/config/crime-officer"
                                    className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
                                >
                                    Cancel
                                </Link>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        className="px-5 py-2 text-sm font-semibold text-amber-700 bg-amber-50 border border-amber-200 hover:bg-amber-100 rounded-lg transition-colors"
                                        onClick={() => alert('Draft saved!')}
                                    >
                                        Save as Draft
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 rounded-lg transition-colors"
                                    >
                                        Save Officer
                                    </button>
                                </div>
                            </div>

                        </form>
                    </div>
                    <Footer />
                </main>
            </div>
        </div>
    );
}
