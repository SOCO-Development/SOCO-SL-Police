'use client';

import { useState, useCallback } from 'react';
import type {
    SectionA,
    SectionB,
    SectionC,
    OfficerInfo,
    Expert,
    DateTimeEntry,
    CrimeVisitFormData,
} from '@/types/crimeVisit';
import DatePicker from '@/components/forms/DatePicker';
import TimePicker from '@/components/forms/TimePicker';
import CustomSelect from '@/components/forms/CustomSelect';
import Button from '@/components/buttons/Button';

// ─── Defaults ─────────────────────────────────────────────────────────────────

const emptyOfficer = (): OfficerInfo => ({ rank: '', regNo: '', name: '' });
const emptyDatetime = (): DateTimeEntry => ({ date: '', time: '', page: '', para: '' });
const emptyExpert = (): Expert => ({ annex: 'Annex 20', name: '', inTime: '', outTime: '' });

type SupportOfficerMap = NonNullable<NonNullable<SectionB['socoOfficers']>['support']>;
type SupportRole = keyof SupportOfficerMap;

interface SupportOfficerRow {
    id: number;
    role: SupportRole;
    officer: OfficerInfo;
}

const SUPPORT_ROLE_OPTIONS: { value: SupportRole; label: string }[] = [
    { value: 'photographer', label: 'Photographer' },
    { value: 'sketcher', label: 'Sketcher' },
    { value: 'evidenceCollector', label: 'Evidence Collector' },
    { value: 'otherOfficer', label: 'Other' },
];

const VISITED_SPECIALIST_OPTIONS = [
    'Magistrate',
    'GAD',
    'JMO',
    'Finger Print',
    'Kannel',
    'Foreign Investigation Officers',
    'Others',
] as const;

const VISITED_SPECIALIST_SELECT_OPTIONS = VISITED_SPECIALIST_OPTIONS.map((s) => ({ value: s, label: s }));

let supportOfficerRowSeed = 1;

const newSupportOfficerRow = (
    role: SupportRole = 'photographer',
    officer: OfficerInfo = emptyOfficer()
): SupportOfficerRow => ({
    id: supportOfficerRowSeed++,
    role,
    officer,
});

const hasOfficerValue = (officer?: OfficerInfo) =>
    !!(officer?.name?.trim() || officer?.regNo?.trim() || officer?.rank?.trim());

const supportToRows = (support?: SupportOfficerMap): SupportOfficerRow[] => {
    if (!support) return [];

    const rows: SupportOfficerRow[] = [];
    if (hasOfficerValue(support.photographer)) rows.push(newSupportOfficerRow('photographer', support.photographer ?? emptyOfficer()));
    if (hasOfficerValue(support.sketcher)) rows.push(newSupportOfficerRow('sketcher', support.sketcher ?? emptyOfficer()));
    if (hasOfficerValue(support.evidenceCollector)) rows.push(newSupportOfficerRow('evidenceCollector', support.evidenceCollector ?? emptyOfficer()));
    if (hasOfficerValue(support.otherOfficer)) rows.push(newSupportOfficerRow('otherOfficer', support.otherOfficer ?? emptyOfficer()));
    return rows;
};

const rowsToSupport = (rows: SupportOfficerRow[]): SupportOfficerMap => {
    const support: SupportOfficerMap = {};
    rows.forEach((row) => {
        support[row.role] = row.officer;
    });
    return support;
};

function defaultFormData(): CrimeVisitFormData {
    return {
        sectionA: {
            reportedToSocoLab: { date: '', time: '' },
            out: emptyDatetime(),
            in: emptyDatetime(),
            revisitOut: emptyDatetime(),
            revisitIn: emptyDatetime(),
        },
        sectionB: {
            socoOfficers: {
                inCharge: emptyOfficer(),
                support: {
                    photographer: emptyOfficer(),
                    sketcher: emptyOfficer(),
                    evidenceCollector: emptyOfficer(),
                    otherOfficer: emptyOfficer(),
                },
            },
            experts: Array.from({ length: 5 }, emptyExpert),
        },
        sectionC: {
            vehicleNo: '',
            driver: emptyOfficer(),
            examinedBySocoOfficers: { date: '', timeIn: '', timeOut: '' },
            reExaminedBySocoOfficers: { date: '', timeIn: '', timeOut: '' },
            investigationOfficer: emptyOfficer(),
            reAssignedCaseOfficer: emptyOfficer(),
            sceneGuard: emptyOfficer(),
        },
    };
}

// ─── Small UI helpers ─────────────────────────────────────────────────────────

interface FieldGroupProps { label: string; children: React.ReactNode; className?: string }
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
            className={`w-full min-h-10 px-3 py-2 text-sm rounded-lg border ${isReadOnly
                ? 'bg-gray-50 border-gray-200 text-gray-500 cursor-not-allowed'
                : 'bg-white border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-gray-400'
                } transition-colors ${className}`}
        />
    );
}

interface OfficerRowProps {
    label: string;
    value: OfficerInfo;
    isReadOnly?: boolean;
    onChange: (val: OfficerInfo) => void;
    /** When true, omit the label column (e.g. when used inside a card with its own title) */
    compact?: boolean;
}
function OfficerRow({ label, value, isReadOnly = false, onChange, compact = false }: OfficerRowProps) {
    return (
        <div className="space-y-3">
            {!compact && <div className="text-sm font-medium text-gray-700 pb-0.5 leading-tight">{label}</div>}
            <FieldGroup label="Name">
                <TextInput isReadOnly={isReadOnly} value={value.name ?? ''} onChange={(e) => onChange({ ...value, name: e.target.value })} placeholder="Full name" />
            </FieldGroup>
            <div className={compact ? 'grid grid-cols-1 sm:grid-cols-2 gap-3 items-end' : 'grid grid-cols-2 gap-3 items-end'}>
                <FieldGroup label="Reg. Number">
                    <TextInput isReadOnly={isReadOnly} value={value.regNo ?? ''} onChange={(e) => onChange({ ...value, regNo: e.target.value })} placeholder="Reg. No." />
                </FieldGroup>
                <FieldGroup label="Rank">
                    <TextInput isReadOnly={isReadOnly} value={value.rank ?? ''} onChange={(e) => onChange({ ...value, rank: e.target.value })} placeholder="Rank" />
                </FieldGroup>
            </div>
        </div>
    );
}

interface DateTimeRowProps {
    label: string;
    value: DateTimeEntry;
    isReadOnly?: boolean;
    onChange: (val: DateTimeEntry) => void;
    /** 'row' = label | date | time in one row; 'stack' = label on top, date/time below (for multi-column cards) */
    layout?: 'row' | 'stack';
}
function DateTimeRow({ label, value, isReadOnly = false, onChange, layout = 'row' }: DateTimeRowProps) {
    const fields = (
        <>
            <FieldGroup label="Date (DD-MM-YYYY)">
                {isReadOnly ? (
                    <div className="px-3 py-2 text-sm rounded-lg border bg-gray-50 border-gray-200 text-gray-500">{value.date || '—'}</div>
                ) : (
                    <DatePicker value={value.date ?? ''} onChange={(date) => onChange({ ...value, date })} />
                )}
            </FieldGroup>
            <FieldGroup label="Time">
                {isReadOnly ? (
                    <div className="px-3 py-2 text-sm rounded-lg border bg-gray-50 border-gray-200 text-gray-500">{value.time || '—'}</div>
                ) : (
                    <TimePicker value={value.time ?? ''} onChange={(time) => onChange({ ...value, time })} />
                )}
            </FieldGroup>
        </>
    );
    if (layout === 'stack') {
        return (
            <div className={label ? 'space-y-2' : ''}>
                {label && <div className="text-sm font-medium text-gray-700">{label}</div>}
                <div className="grid grid-cols-2 gap-2">
                    {fields}
                </div>
            </div>
        );
    }
    return (
        <div className="grid gap-3 items-end grid-cols-[150px,1fr,1fr]">
            <div className="text-sm font-medium text-gray-700 pb-2 leading-tight">{label}</div>
            {fields}
        </div>
    );
}

// ─── Experts table ────────────────────────────────────────────────────────────

interface ExpertsTableProps {
    experts: Expert[];
    isReadOnly?: boolean;
    onChange: (experts: Expert[]) => void;
}
function ExpertsTable({ experts, isReadOnly = false, onChange }: ExpertsTableProps) {
    const update = (idx: number, field: keyof Expert, val: string) =>
        onChange(experts.map((e, i) => (i === idx ? { ...e, [field]: val } : e)));
    const addRow = () => onChange([...experts, emptyExpert()]);
    const removeRow = (idx: number) => onChange(experts.filter((_, i) => i !== idx));

    return (
        <div>
            <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-gray-100 border-b border-gray-200">
                            <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-700 uppercase tracking-wide">Visited Specialists</th>
                            <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-700 uppercase tracking-wide">Name</th>
                            <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-700 uppercase tracking-wide">In Time</th>
                            <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-700 uppercase tracking-wide">Out Time</th>
                            {!isReadOnly && <th className="w-10" />}
                        </tr>
                    </thead>
                    <tbody>
                        {experts.map((exp, idx) => (
                            <tr key={idx} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50">
                                <td className="px-2 py-1.5">
                                    {isReadOnly ? (
                                        <div className="px-3 py-2 text-sm rounded-lg border bg-gray-50 border-gray-200 text-gray-500">{exp.annex || '—'}</div>
                                    ) : (
                                        <CustomSelect
                                            value={exp.annex ?? ''}
                                            onChange={(v) => update(idx, 'annex', v)}
                                            options={VISITED_SPECIALIST_SELECT_OPTIONS}
                                            placeholder="Select specialist"
                                        />
                                    )}
                                </td>
                                <td className="px-2 py-1.5">
                                    <TextInput isReadOnly={isReadOnly} value={exp.name ?? ''} onChange={(e) => update(idx, 'name', e.target.value)} placeholder="Expert name" />
                                </td>
                                <td className="px-2 py-1.5">
                                    {isReadOnly ? (
                                        <div className="px-3 py-2 text-sm rounded-lg border bg-gray-50 border-gray-200 text-gray-500">{exp.inTime ?? '—'}</div>
                                    ) : (
                                        <TimePicker value={exp.inTime ?? ''} onChange={(v) => update(idx, 'inTime', v)} />
                                    )}
                                </td>
                                <td className="px-2 py-1.5">
                                    {isReadOnly ? (
                                        <div className="px-3 py-2 text-sm rounded-lg border bg-gray-50 border-gray-200 text-gray-500">{exp.outTime ?? '—'}</div>
                                    ) : (
                                        <TimePicker value={exp.outTime ?? ''} onChange={(v) => update(idx, 'outTime', v)} />
                                    )}
                                </td>
                                {!isReadOnly && (
                                    <td className="px-2 py-1.5">
                                        {experts.length > 1 && (
                                            <button type="button" onClick={() => removeRow(idx)} className="text-red-400 hover:text-red-600 text-lg leading-none transition-colors" aria-label="Remove row">×</button>
                                        )}
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {!isReadOnly && (
                <button type="button" onClick={addRow} className="mt-2 text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 transition-colors">
                    <span className="text-base leading-none">+</span> Add Expert Row
                </button>
            )}
        </div>
    );
}

interface SupportOfficersEditorProps {
    rows: SupportOfficerRow[];
    isReadOnly?: boolean;
    onChange: (rows: SupportOfficerRow[]) => void;
}
function SupportOfficersEditor({ rows, isReadOnly = false, onChange }: SupportOfficersEditorProps) {
    const updateRow = (id: number, patch: Partial<SupportOfficerRow>) =>
        onChange(rows.map((row) => (row.id === id ? { ...row, ...patch } : row)));

    const addRow = () => {
        const usedRoles = new Set(rows.map((r) => r.role));
        const nextRole = SUPPORT_ROLE_OPTIONS.find((opt) => !usedRoles.has(opt.value))?.value ?? 'otherOfficer';
        onChange([...rows, newSupportOfficerRow(nextRole)]);
    };

    const removeRow = (id: number) => onChange(rows.filter((row) => row.id !== id));

    return (
        <div>
            <div className="space-y-3">
                {rows.map((row) => (
                    <div key={row.id} className="grid grid-cols-[1.2fr,2fr,1fr,40px] gap-3 items-end">
                        <FieldGroup label="Role">
                            {isReadOnly ? (
                                <div className="px-3 py-2 text-sm rounded-lg border bg-gray-50 border-gray-200 text-gray-500">
                                    {(SUPPORT_ROLE_OPTIONS.find((o) => o.value === row.role)?.label) ?? (row.role || '—')}
                                </div>
                            ) : (
                                <CustomSelect
                                    value={row.role}
                                    onChange={(v) => updateRow(row.id, { role: v as SupportRole })}
                                    options={SUPPORT_ROLE_OPTIONS.filter((opt) => opt.value === row.role || !rows.some((r) => r.id !== row.id && r.role === opt.value))}
                                    placeholder="Select role"
                                />
                            )}
                        </FieldGroup>
                        <FieldGroup label="Name">
                            <TextInput
                                isReadOnly={isReadOnly}
                                value={row.officer.name ?? ''}
                                onChange={(e) => updateRow(row.id, { officer: { ...row.officer, name: e.target.value } })}
                                placeholder="Full name"
                            />
                        </FieldGroup>
                        <div className="grid grid-cols-2 gap-2">
                            <FieldGroup label="Reg. Number">
                                <TextInput
                                    isReadOnly={isReadOnly}
                                    value={row.officer.regNo ?? ''}
                                    onChange={(e) => updateRow(row.id, { officer: { ...row.officer, regNo: e.target.value } })}
                                    placeholder="Reg. No."
                                />
                            </FieldGroup>
                            <FieldGroup label="Rank">
                                <TextInput
                                    isReadOnly={isReadOnly}
                                    value={row.officer.rank ?? ''}
                                    onChange={(e) => updateRow(row.id, { officer: { ...row.officer, rank: e.target.value } })}
                                    placeholder="Rank"
                                />
                            </FieldGroup>
                        </div>
                        {!isReadOnly ? (
                            <button
                                type="button"
                                onClick={() => removeRow(row.id)}
                                className="h-10 text-red-400 hover:text-red-600 text-lg leading-none transition-colors"
                                aria-label="Remove officer"
                            >
                                ×
                            </button>
                        ) : (
                            <div />
                        )}
                    </div>
                ))}
            </div>

            {!isReadOnly && (
                <button type="button" onClick={addRow} className="mt-3 text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 transition-colors">
                    <span className="text-base leading-none">+</span> Add Officer
                </button>
            )}
        </div>
    );
}

// ─── Tab types ────────────────────────────────────────────────────────────────

type TabId = 1 | 2 | 3;

const TAB_DEFS: { id: TabId; label: string; sublabel: string }[] = [
    { id: 1, label: 'Crime Scene Details', sublabel: 'Section 1' },
    { id: 2, label: 'Officers & Experts', sublabel: 'Section 2' },
    { id: 3, label: 'Vehicle & Officers', sublabel: 'Section 3' },
];

// ─── Form Props ───────────────────────────────────────────────────────────────

export interface CrimeVisitFormProps {
    initialData?: CrimeVisitFormData;
    lockedMode?: boolean;
    readOnlyAll?: boolean;
    onSaveDraft?: (data: CrimeVisitFormData) => void;
    onSubmit?: (data: CrimeVisitFormData) => void;
    onCancel?: () => void;
    appendMode?: boolean;
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function CrimeVisitForm({
    initialData,
    lockedMode = false,
    readOnlyAll = false,
    onSaveDraft,
    onSubmit,
    onCancel,
    appendMode = false,
}: CrimeVisitFormProps) {
    const [formData, setFormData] = useState<CrimeVisitFormData>(initialData ?? defaultFormData());
    const [appendExperts, setAppendExperts] = useState<Expert[]>([emptyExpert()]);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);
    const [activeTab, setActiveTab] = useState<TabId>(1);
    const [supportRows, setSupportRows] = useState<SupportOfficerRow[]>(() =>
        supportToRows((initialData ?? defaultFormData()).sectionB?.socoOfficers?.support)
    );

    // ── Helpers ────────────────────────────────────────────────────────────────
    const updateA = useCallback(
        (key: keyof SectionA, val: DateTimeEntry) =>
            setFormData((f) => ({ ...f, sectionA: { ...f.sectionA, [key]: val } })),
        []
    );

    const updateInCharge = useCallback(
        (val: OfficerInfo) =>
            setFormData((f) => ({
                ...f,
                sectionB: { ...f.sectionB, socoOfficers: { ...f.sectionB?.socoOfficers, inCharge: val } },
            })),
        []
    );

    const updateSupportRows = useCallback(
        (rows: SupportOfficerRow[]) => {
            setSupportRows(rows);
            setFormData((f) => ({
                ...f,
                sectionB: {
                    ...f.sectionB,
                    socoOfficers: {
                        ...f.sectionB?.socoOfficers,
                        support: rowsToSupport(rows),
                    },
                },
            }));
        },
        []
    );

    const updateExperts = useCallback(
        (experts: Expert[]) =>
            setFormData((f) => ({ ...f, sectionB: { ...f.sectionB, experts } })),
        []
    );

    const updateC = useCallback(
        (patch: Partial<SectionC>) =>
            setFormData((f) => ({ ...f, sectionC: { ...f.sectionC, ...patch } })),
        []
    );

    // ── Validation ─────────────────────────────────────────────────────────────
    function validate(forSubmit: boolean): boolean {
        const errs: Record<string, string> = {};
        if (forSubmit) {
            const la = formData.sectionA?.reportedToSocoLab;
            if (!la?.date) errs['sectionA.date'] = 'Reported date is required';
            if (!la?.time) errs['sectionA.time'] = 'Reported time is required';
            const hasOfficer =
                formData.sectionB?.socoOfficers?.inCharge?.name ||
                formData.sectionC?.investigationOfficer?.name;
            if (!hasOfficer) errs['officer'] = 'At least one officer (In Charge or Investigation Officer) is required';
        }
        setErrors(errs);
        return Object.keys(errs).length === 0;
    }

    const tabHasError = (id: TabId) => {
        if (id === 1) return !!(errors['sectionA.date'] || errors['sectionA.time']);
        if (id === 2) return !!errors['officer'];
        if (id === 3) return !!errors['officer'];
        return false;
    };

    function handleSaveDraft() {
        if (appendMode) {
            onSaveDraft?.({ ...formData, sectionB: { ...formData.sectionB, experts: appendExperts } });
            return;
        }
        onSaveDraft?.(formData);
    }

    function handleSubmit() {
        if (!validate(true)) return;
        setSubmitting(true);
        onSubmit?.(formData);
    }

    const ro = readOnlyAll;
    const locked = lockedMode || readOnlyAll;

    const sA = formData.sectionA ?? {};
    const sB = formData.sectionB ?? {};
    const sC = formData.sectionC ?? {};
    const socoOfficers = sB.socoOfficers ?? {};

    // ── Render ─────────────────────────────────────────────────────────────────
    return (
        <div className="bg-white rounded-xl border border-gray-200 flex flex-col" style={{ minHeight: '520px' }}>

            {/* ── Tab Bar ─────────────────────────────────────────────────────── */}
            <div className="flex border-b border-gray-200 bg-gray-50/60 rounded-t-xl overflow-hidden flex-shrink-0">
                {TAB_DEFS.map((tab) => {
                    const active = activeTab === tab.id;
                    const hasErr = tabHasError(tab.id);
                    return (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveTab(tab.id)}
                            className={`
                                relative flex-1 flex items-center justify-center gap-2.5 px-3 py-3.5
                                text-sm font-medium transition-all duration-200 focus:outline-none
                                border-b-2
                                ${active
                                    ? 'bg-white text-blue-700 border-blue-600 shadow-[inset_0_-1px_0_white]'
                                    : 'text-gray-600 border-transparent hover:text-gray-800 hover:bg-white/60'
                                }
                            `}
                        >
                            {/* Numbered bubble */}
                            <span className={`
                                flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full
                                text-xs font-bold transition-colors
                                ${active ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}
                            `}>
                                {tab.id}
                            </span>
                            <span className="hidden sm:block leading-tight text-left">
                                <span className="block">{tab.label}</span>
                            </span>
                            <span className="sm:hidden text-xs">{tab.sublabel}</span>
                            {/* Error indicator dot */}
                            {hasErr && (
                                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500 shadow-sm" />
                            )}
                        </button>
                    );
                })}
            </div>

            {/* ── Scrollable panel area ────────────────────────────────────────── */}
            <div className="flex-1 overflow-y-auto px-6 py-5">

                {/* ── PANEL 1: Crime Scene Details ─────────────────────────────── */}
                {activeTab === 1 && (
                    <div className="animate-fade-in">
                        <h3 className="text-base font-semibold text-gray-700 uppercase tracking-widest pb-2 border-b border-gray-200 mb-4">
                            Details of Crime Scene Investigation
                        </h3>

                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
                            <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/80 space-y-3">
                                <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide pb-2 flex items-center gap-2">
                                    <span className="w-1.5 h-4 rounded-full bg-blue-500 inline-block flex-shrink-0" />
                                    Reported to SOCO Lab
                                </h4>
                                <DateTimeRow
                                    label=""
                                    value={sA.reportedToSocoLab ?? emptyDatetime()}
                                    isReadOnly={locked}
                                    onChange={(v) => updateA('reportedToSocoLab', v)}
                                    layout="stack"
                                />
                                {errors['sectionA.date'] && <p className="text-xs text-red-600 font-medium">{errors['sectionA.date']}</p>}
                                {errors['sectionA.time'] && <p className="text-xs text-red-600 font-medium">{errors['sectionA.time']}</p>}
                            </div>

                            <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/80 space-y-3">
                                <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide pb-2 flex items-center gap-2">
                                    <span className="w-1.5 h-4 rounded-full bg-indigo-500 inline-block flex-shrink-0" />
                                    OUT & IN
                                </h4>
                                <DateTimeRow label="OUT" value={sA.out ?? emptyDatetime()} isReadOnly={locked} onChange={(v) => updateA('out', v)} layout="stack" />
                                <DateTimeRow label="IN" value={sA.in ?? emptyDatetime()} isReadOnly={locked} onChange={(v) => updateA('in', v)} layout="stack" />
                            </div>

                            <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/80 space-y-3 sm:col-span-2 xl:col-span-1">
                                <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide pb-2 flex items-center gap-2">
                                    <span className="w-1.5 h-4 rounded-full bg-teal-500 inline-block flex-shrink-0" />
                                    Re-visit OUT & IN
                                </h4>
                                <DateTimeRow label="Re-visit OUT" value={sA.revisitOut ?? emptyDatetime()} isReadOnly={locked} onChange={(v) => updateA('revisitOut', v)} layout="stack" />
                                <DateTimeRow label="Re-visit IN" value={sA.revisitIn ?? emptyDatetime()} isReadOnly={locked} onChange={(v) => updateA('revisitIn', v)} layout="stack" />
                            </div>
                        </div>
                    </div>
                )}

                {/* ── PANEL 2: SOCO Officers & Experts ─────────────────────────── */}
                {activeTab === 2 && (
                    <div className="animate-fade-in">
                        <h3 className="text-base font-semibold text-gray-700 uppercase tracking-widest pb-2 border-b border-gray-200 mb-4">
                            Officers & Experts
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                            <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/80">
                                <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide pb-2 mb-3 flex items-center gap-2">
                                    <span className="w-1.5 h-4 rounded-full bg-blue-500 inline-block flex-shrink-0" />
                                    Officer in Charge
                                </h4>
                                <div className="flex flex-col gap-3">
                                    <FieldGroup label="Name">
                                        <TextInput isReadOnly={locked} value={socoOfficers.inCharge?.name ?? ''} onChange={(e) => updateInCharge({ ...(socoOfficers.inCharge ?? emptyOfficer()), name: e.target.value })} placeholder="Full name" />
                                    </FieldGroup>
                                    <div className="grid grid-cols-2 gap-3">
                                        <FieldGroup label="Reg. Number">
                                            <TextInput isReadOnly={locked} value={socoOfficers.inCharge?.regNo ?? ''} onChange={(e) => updateInCharge({ ...(socoOfficers.inCharge ?? emptyOfficer()), regNo: e.target.value })} placeholder="Reg. No." />
                                        </FieldGroup>
                                        <FieldGroup label="Rank">
                                            <TextInput isReadOnly={locked} value={socoOfficers.inCharge?.rank ?? ''} onChange={(e) => updateInCharge({ ...(socoOfficers.inCharge ?? emptyOfficer()), rank: e.target.value })} placeholder="Rank" />
                                        </FieldGroup>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/80">
                                <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide pb-2 mb-3 flex items-center gap-2">
                                    <span className="w-1.5 h-4 rounded-full bg-indigo-500 inline-block flex-shrink-0" />
                                    Support Officers
                                </h4>
                                <SupportOfficersEditor rows={supportRows} isReadOnly={locked} onChange={updateSupportRows} />
                            </div>

                            <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/80 md:col-span-2">
                                <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide pb-2 mb-3 flex items-center gap-2">
                                    <span className="w-1.5 h-4 rounded-full bg-teal-500 inline-block flex-shrink-0" />
                                    Experts who visited / came to investigate
                                </h4>
                                {errors['officer'] && <p className="text-xs text-red-600 font-medium mb-2">{errors['officer']}</p>}
                                <ExpertsTable experts={sB.experts ?? []} isReadOnly={locked} onChange={updateExperts} />

                                {appendMode && (
                                    <div className="mt-5 pt-4 border-t border-amber-200">
                                        <div className="flex items-center gap-2 mb-3">
                                            <span className="w-1.5 h-4 rounded-full bg-amber-400 inline-block flex-shrink-0" />
                                            <p className="text-sm font-semibold text-amber-700">Add Additional Experts</p>
                                        </div>
                                        <ExpertsTable experts={appendExperts} isReadOnly={false} onChange={setAppendExperts} />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* ── PANEL 3: Vehicle / Driver / Officers ─────────────────────── */}
                {activeTab === 3 && (
                    <div className="animate-fade-in">
                        <h3 className="text-base font-semibold text-gray-700 uppercase tracking-widest pb-2 border-b border-gray-200 mb-4">
                            Vehicle / Driver / Times / Officers
                        </h3>

                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
                            {/* Vehicle & Driver */}
                            <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/80 space-y-3">
                                <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide pb-2 flex items-center gap-2">
                                    <span className="w-1.5 h-4 rounded-full bg-slate-500 inline-block flex-shrink-0" />
                                    Vehicle & Driver
                                </h4>
                                <FieldGroup label="Vehicle Number">
                                    <TextInput isReadOnly={ro} value={sC.vehicleNo ?? ''} onChange={(e) => updateC({ vehicleNo: e.target.value })} placeholder="e.g. CAB-1234" />
                                </FieldGroup>
                                <OfficerRow label="Driver" value={sC.driver ?? emptyOfficer()} isReadOnly={ro} onChange={(v) => updateC({ driver: v })} />
                            </div>

                            {/* Examined by SOCO officers */}
                            <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/80 space-y-3">
                                <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide pb-2 flex items-center gap-2">
                                    <span className="w-1.5 h-4 rounded-full bg-blue-500 inline-block flex-shrink-0" />
                                    Examined by SOCO officers
                                </h4>
                                <FieldGroup label="Date (DD-MM-YYYY)">
                                    {ro ? (
                                        <div className="px-3 py-2 text-sm rounded-lg border bg-gray-50 border-gray-200 text-gray-500">{sC.examinedBySocoOfficers?.date ?? '—'}</div>
                                    ) : (
                                        <DatePicker value={sC.examinedBySocoOfficers?.date ?? ''} onChange={(date) => updateC({ examinedBySocoOfficers: { ...sC.examinedBySocoOfficers, date } })} />
                                    )}
                                </FieldGroup>
                                <div className="grid grid-cols-2 gap-2">
                                    <FieldGroup label="Time In">
                                        {ro ? (
                                            <div className="px-3 py-2 text-sm rounded-lg border bg-gray-50 border-gray-200 text-gray-500">{sC.examinedBySocoOfficers?.timeIn ?? '—'}</div>
                                        ) : (
                                            <TimePicker value={sC.examinedBySocoOfficers?.timeIn ?? ''} onChange={(timeIn) => updateC({ examinedBySocoOfficers: { ...sC.examinedBySocoOfficers, timeIn } })} />
                                        )}
                                    </FieldGroup>
                                    <FieldGroup label="Time Out">
                                        {ro ? (
                                            <div className="px-3 py-2 text-sm rounded-lg border bg-gray-50 border-gray-200 text-gray-500">{sC.examinedBySocoOfficers?.timeOut ?? '—'}</div>
                                        ) : (
                                            <TimePicker value={sC.examinedBySocoOfficers?.timeOut ?? ''} onChange={(timeOut) => updateC({ examinedBySocoOfficers: { ...sC.examinedBySocoOfficers, timeOut } })} />
                                        )}
                                    </FieldGroup>
                                </div>
                            </div>

                            {/* Re-examined by SOCO officers */}
                            <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/80 space-y-3">
                                <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide pb-2 flex items-center gap-2">
                                    <span className="w-1.5 h-4 rounded-full bg-indigo-500 inline-block flex-shrink-0" />
                                    Re-examined by SOCO officers
                                </h4>
                                <FieldGroup label="Date (DD-MM-YYYY)">
                                    {ro ? (
                                        <div className="px-3 py-2 text-sm rounded-lg border bg-gray-50 border-gray-200 text-gray-500">{sC.reExaminedBySocoOfficers?.date ?? '—'}</div>
                                    ) : (
                                        <DatePicker value={sC.reExaminedBySocoOfficers?.date ?? ''} onChange={(date) => updateC({ reExaminedBySocoOfficers: { ...sC.reExaminedBySocoOfficers, date } })} />
                                    )}
                                </FieldGroup>
                                <div className="grid grid-cols-2 gap-2">
                                    <FieldGroup label="Time In">
                                        {ro ? (
                                            <div className="px-3 py-2 text-sm rounded-lg border bg-gray-50 border-gray-200 text-gray-500">{sC.reExaminedBySocoOfficers?.timeIn ?? '—'}</div>
                                        ) : (
                                            <TimePicker value={sC.reExaminedBySocoOfficers?.timeIn ?? ''} onChange={(timeIn) => updateC({ reExaminedBySocoOfficers: { ...sC.reExaminedBySocoOfficers, timeIn } })} />
                                        )}
                                    </FieldGroup>
                                    <FieldGroup label="Time Out">
                                        {ro ? (
                                            <div className="px-3 py-2 text-sm rounded-lg border bg-gray-50 border-gray-200 text-gray-500">{sC.reExaminedBySocoOfficers?.timeOut ?? '—'}</div>
                                        ) : (
                                            <TimePicker value={sC.reExaminedBySocoOfficers?.timeOut ?? ''} onChange={(timeOut) => updateC({ reExaminedBySocoOfficers: { ...sC.reExaminedBySocoOfficers, timeOut } })} />
                                        )}
                                    </FieldGroup>
                                </div>
                            </div>

                            {/* Investigation Officer */}
                            <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/80">
                                <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide pb-2 mb-3 flex items-center gap-2">
                                    <span className="w-1.5 h-4 rounded-full bg-teal-500 inline-block flex-shrink-0" />
                                    Investigation Officer
                                </h4>
                                <OfficerRow label="Investigation Officer" value={sC.investigationOfficer ?? emptyOfficer()} isReadOnly={ro} onChange={(v) => updateC({ investigationOfficer: v })} compact />
                                {errors['officer'] && <p className="text-xs text-red-600 font-medium mt-2">{errors['officer']}</p>}
                            </div>

                            {/* Re-Assigned Case */}
                            <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/80">
                                <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide pb-2 mb-3 flex items-center gap-2">
                                    <span className="w-1.5 h-4 rounded-full bg-amber-500 inline-block flex-shrink-0" />
                                    Re-Assigned Case
                                </h4>
                                <OfficerRow label="Re-Assigned Case" value={sC.reAssignedCaseOfficer ?? emptyOfficer()} isReadOnly={ro} onChange={(v) => updateC({ reAssignedCaseOfficer: v })} compact />
                            </div>

                            {/* Scene Guard */}
                            <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/80">
                                <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide pb-2 mb-3 flex items-center gap-2">
                                    <span className="w-1.5 h-4 rounded-full bg-emerald-500 inline-block flex-shrink-0" />
                                    Scene Guard
                                </h4>
                                <OfficerRow label="Scene Guard" value={sC.sceneGuard ?? emptyOfficer()} isReadOnly={ro} onChange={(v) => updateC({ sceneGuard: v })} compact />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Bottom action bar ────────────────────────────────────────────── */}
            <div className="flex-shrink-0 border-t border-gray-200 bg-gray-50/70 px-5 py-3 rounded-b-xl flex items-center justify-between gap-3">

                {/* Prev */}
                <Button
                    variant="secondary"
                    type="button"
                    onClick={() => setActiveTab((t) => (t > 1 ? (t - 1) as TabId : t))}
                    disabled={activeTab === 1}
                >
                    ← Prev
                </Button>

                {/* Centre actions */}
                {!readOnlyAll ? (
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" type="button" onClick={onCancel}>
                            Cancel
                        </Button>
                        <Button variant="amber" type="button" onClick={handleSaveDraft}>
                            {appendMode ? 'Save Additions' : 'Save as Draft'}
                        </Button>
                        {!appendMode && (
                            <Button variant="success" type="button" disabled={submitting} onClick={handleSubmit}>
                                Submit
                            </Button>
                        )}
                    </div>
                ) : (
                    <span className="text-xs text-gray-400 italic">Read-only view</span>
                )}

                {/* Next */}
                <Button
                    variant="secondary"
                    type="button"
                    onClick={() => setActiveTab((t) => (t < 3 ? (t + 1) as TabId : t))}
                    disabled={activeTab === 3}
                >
                    Next →
                </Button>
            </div>
        </div>
    );
}
