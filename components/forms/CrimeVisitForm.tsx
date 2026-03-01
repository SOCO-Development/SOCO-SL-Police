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
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</label>
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
            className={`w-full px-3 py-2 text-sm rounded-lg border ${isReadOnly
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
}
function OfficerRow({ label, value, isReadOnly = false, onChange }: OfficerRowProps) {
    return (
        <div className="grid grid-cols-[150px,1fr,1fr,2fr] gap-3 items-end">
            <div className="text-sm font-medium text-gray-700 pb-2 leading-tight">{label}</div>
            <FieldGroup label="Rank">
                <TextInput isReadOnly={isReadOnly} value={value.rank ?? ''} onChange={(e) => onChange({ ...value, rank: e.target.value })} placeholder="Rank" />
            </FieldGroup>
            <FieldGroup label="Reg. No.">
                <TextInput isReadOnly={isReadOnly} value={value.regNo ?? ''} onChange={(e) => onChange({ ...value, regNo: e.target.value })} placeholder="Reg. No." />
            </FieldGroup>
            <FieldGroup label="Name">
                <TextInput isReadOnly={isReadOnly} value={value.name ?? ''} onChange={(e) => onChange({ ...value, name: e.target.value })} placeholder="Full name" />
            </FieldGroup>
        </div>
    );
}

interface DateTimeRowProps {
    label: string;
    value: DateTimeEntry;
    isReadOnly?: boolean;
    onChange: (val: DateTimeEntry) => void;
}
function DateTimeRow({ label, value, isReadOnly = false, onChange }: DateTimeRowProps) {
    return (
        <div className="grid gap-3 items-end grid-cols-[150px,1fr,1fr]">
            <div className="text-sm font-medium text-gray-700 pb-2 leading-tight">{label}</div>
            <FieldGroup label="Date (DD/MM/YY)">
                <TextInput isReadOnly={isReadOnly} value={value.date ?? ''} onChange={(e) => onChange({ ...value, date: e.target.value })} placeholder="DD/MM/YY" />
            </FieldGroup>
            <FieldGroup label="Time">
                <TextInput type="time" isReadOnly={isReadOnly} value={value.time ?? ''} onChange={(e) => onChange({ ...value, time: e.target.value })} />
            </FieldGroup>
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
                        <tr className="bg-gray-50 border-b border-gray-200">
                            <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Visited Specialists</th>
                            <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Name</th>
                            <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">In Time</th>
                            <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Out Time</th>
                            {!isReadOnly && <th className="w-10" />}
                        </tr>
                    </thead>
                    <tbody>
                        {experts.map((exp, idx) => (
                            <tr key={idx} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50">
                                <td className="px-2 py-1.5">
                                    <select
                                        value={exp.annex ?? ''}
                                        disabled={isReadOnly}
                                        onChange={(e) => update(idx, 'annex', e.target.value)}
                                        className={`w-full px-3 py-2 text-sm rounded-lg border ${isReadOnly
                                            ? 'bg-gray-50 border-gray-200 text-gray-500 cursor-not-allowed'
                                            : 'bg-white border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-gray-400'
                                            } transition-colors`}
                                    >
                                        <option value="">Select specialist</option>
                                        {VISITED_SPECIALIST_OPTIONS.map((option) => (
                                            <option key={option} value={option}>
                                                {option}
                                            </option>
                                        ))}
                                    </select>
                                </td>
                                <td className="px-2 py-1.5">
                                    <TextInput isReadOnly={isReadOnly} value={exp.name ?? ''} onChange={(e) => update(idx, 'name', e.target.value)} placeholder="Expert name" />
                                </td>
                                <td className="px-2 py-1.5">
                                    <TextInput type="time" isReadOnly={isReadOnly} value={exp.inTime ?? ''} onChange={(e) => update(idx, 'inTime', e.target.value)} />
                                </td>
                                <td className="px-2 py-1.5">
                                    <TextInput type="time" isReadOnly={isReadOnly} value={exp.outTime ?? ''} onChange={(e) => update(idx, 'outTime', e.target.value)} />
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
                    <div key={row.id} className="grid grid-cols-[1.2fr,2fr,1.6fr,1.4fr,40px] gap-3 items-end">
                        <FieldGroup label="Role">
                            <select
                                value={row.role}
                                disabled={isReadOnly}
                                onChange={(e) => updateRow(row.id, { role: e.target.value as SupportRole })}
                                className={`w-full px-3 py-2 text-sm rounded-lg border ${isReadOnly
                                    ? 'bg-gray-50 border-gray-200 text-gray-500 cursor-not-allowed'
                                    : 'bg-white border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-gray-400'
                                    } transition-colors`}
                            >
                                {SUPPORT_ROLE_OPTIONS.map((option) => {
                                    const alreadyUsedByAnotherRow = rows.some((r) => r.id !== row.id && r.role === option.value);
                                    return (
                                        <option key={option.value} value={option.value} disabled={alreadyUsedByAnotherRow}>
                                            {option.label}
                                        </option>
                                    );
                                })}
                            </select>
                        </FieldGroup>
                        <FieldGroup label="Name">
                            <TextInput
                                isReadOnly={isReadOnly}
                                value={row.officer.name ?? ''}
                                onChange={(e) => updateRow(row.id, { officer: { ...row.officer, name: e.target.value } })}
                                placeholder="Full name"
                            />
                        </FieldGroup>
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
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col" style={{ minHeight: '520px' }}>

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
                                    : 'text-gray-500 border-transparent hover:text-gray-700 hover:bg-white/60'
                                }
                            `}
                        >
                            {/* Numbered bubble */}
                            <span className={`
                                flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full
                                text-xs font-bold transition-colors
                                ${active ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}
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
                    <div className="space-y-4 animate-fade-in">
                        <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-widest pb-2 border-b border-gray-100">
                            Details of Crime Scene Investigation
                        </h3>

                        <DateTimeRow
                            label="Reported to SOCO Lab"
                            value={sA.reportedToSocoLab ?? emptyDatetime()}
                            isReadOnly={locked}
                            onChange={(v) => updateA('reportedToSocoLab', v)}
                        />
                        {errors['sectionA.date'] && <p className="text-xs text-red-500">{errors['sectionA.date']}</p>}
                        {errors['sectionA.time'] && <p className="text-xs text-red-500">{errors['sectionA.time']}</p>}

                        <div className="pt-1 border-t border-gray-100" />

                        <DateTimeRow label="OUT" value={sA.out ?? emptyDatetime()} isReadOnly={locked} onChange={(v) => updateA('out', v)} />
                        <DateTimeRow label="IN" value={sA.in ?? emptyDatetime()} isReadOnly={locked} onChange={(v) => updateA('in', v)} />

                        <div className="pt-1 border-t border-gray-100" />

                        <DateTimeRow label="Re-visit OUT" value={sA.revisitOut ?? emptyDatetime()} isReadOnly={locked} onChange={(v) => updateA('revisitOut', v)} />
                        <DateTimeRow label="Re-visit IN" value={sA.revisitIn ?? emptyDatetime()} isReadOnly={locked} onChange={(v) => updateA('revisitIn', v)} />
                    </div>
                )}

                {/* ── PANEL 2: SOCO Officers & Experts ─────────────────────────── */}
                {activeTab === 2 && (
                    <div className="space-y-5 animate-fade-in">
                        <div>
                            <h4 className="text-sm font-semibold text-gray-600 uppercase tracking-widest pb-2 border-b border-gray-100 mb-4 flex items-center gap-2">
                                <span className="w-1.5 h-4 rounded-full bg-blue-500 inline-block flex-shrink-0" />
                                Officer in Charge
                            </h4>
                            <div className="grid grid-cols-3 gap-3 items-end">
                                <FieldGroup label="Name">
                                    <TextInput isReadOnly={locked} value={socoOfficers.inCharge?.name ?? ''} onChange={(e) => updateInCharge({ ...(socoOfficers.inCharge ?? emptyOfficer()), name: e.target.value })} placeholder="Full name" />
                                </FieldGroup>
                                <FieldGroup label="Reg. Number">
                                    <TextInput isReadOnly={locked} value={socoOfficers.inCharge?.regNo ?? ''} onChange={(e) => updateInCharge({ ...(socoOfficers.inCharge ?? emptyOfficer()), regNo: e.target.value })} placeholder="Reg. No." />
                                </FieldGroup>
                                <FieldGroup label="Rank">
                                    <TextInput isReadOnly={locked} value={socoOfficers.inCharge?.rank ?? ''} onChange={(e) => updateInCharge({ ...(socoOfficers.inCharge ?? emptyOfficer()), rank: e.target.value })} placeholder="Rank" />
                                </FieldGroup>
                            </div>
                        </div>

                        <div className="border-t border-gray-100 pt-4">
                            <h4 className="text-sm font-semibold text-gray-600 uppercase tracking-widest pb-2 mb-4 flex items-center gap-2">
                                <span className="w-1.5 h-4 rounded-full bg-indigo-500 inline-block flex-shrink-0" />
                                Support Officers
                            </h4>
                            <SupportOfficersEditor rows={supportRows} isReadOnly={locked} onChange={updateSupportRows} />
                        </div>

                        {errors['officer'] && <p className="text-xs text-red-500">{errors['officer']}</p>}

                        <div className="border-t border-gray-100 pt-4">
                            <h4 className="text-sm font-semibold text-gray-600 uppercase tracking-widest pb-2 mb-4 flex items-center gap-2">
                                <span className="w-1.5 h-4 rounded-full bg-teal-500 inline-block flex-shrink-0" />
                                Experts who visited / came to investigate
                            </h4>
                            <ExpertsTable experts={sB.experts ?? []} isReadOnly={locked} onChange={updateExperts} />

                            {appendMode && (
                                <div className="mt-5 pt-4 border-t border-amber-100">
                                    <div className="flex items-center gap-2 mb-3">
                                        <span className="w-1.5 h-4 rounded-full bg-amber-400 inline-block flex-shrink-0" />
                                        <p className="text-sm font-semibold text-amber-700">Add Additional Experts</p>
                                    </div>
                                    <ExpertsTable experts={appendExperts} isReadOnly={false} onChange={setAppendExperts} />
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ── PANEL 3: Vehicle / Driver / Officers ─────────────────────── */}
                {activeTab === 3 && (
                    <div className="space-y-4 animate-fade-in">
                        <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-widest pb-2 border-b border-gray-100">
                            Vehicle / Driver / Times / Officers
                        </h3>

                        {/* Vehicle No */}
                        <div className="grid grid-cols-[150px,280px] gap-3 items-end">
                            <div className="text-sm font-medium text-gray-700 pb-2">Vehicle No.</div>
                            <FieldGroup label="Vehicle Number">
                                <TextInput isReadOnly={ro} value={sC.vehicleNo ?? ''} onChange={(e) => updateC({ vehicleNo: e.target.value })} placeholder="e.g. CAB-1234" />
                            </FieldGroup>
                        </div>

                        <OfficerRow label="Driver" value={sC.driver ?? emptyOfficer()} isReadOnly={ro} onChange={(v) => updateC({ driver: v })} />

                        <div className="pt-1 border-t border-gray-100" />

                        {/* Examined */}
                        <div className="grid grid-cols-[150px,1fr,1fr,1fr] gap-3 items-end">
                            <div className="text-sm font-medium text-gray-700 pb-2 leading-tight">Examined by<br />SOCO officers</div>
                            <FieldGroup label="Date (DD/MM/YY)">
                                <TextInput isReadOnly={ro} value={sC.examinedBySocoOfficers?.date ?? ''} onChange={(e) => updateC({ examinedBySocoOfficers: { ...sC.examinedBySocoOfficers, date: e.target.value } })} placeholder="DD/MM/YY" />
                            </FieldGroup>
                            <FieldGroup label="Time In">
                                <TextInput type="time" isReadOnly={ro} value={sC.examinedBySocoOfficers?.timeIn ?? ''} onChange={(e) => updateC({ examinedBySocoOfficers: { ...sC.examinedBySocoOfficers, timeIn: e.target.value } })} />
                            </FieldGroup>
                            <FieldGroup label="Time Out">
                                <TextInput type="time" isReadOnly={ro} value={sC.examinedBySocoOfficers?.timeOut ?? ''} onChange={(e) => updateC({ examinedBySocoOfficers: { ...sC.examinedBySocoOfficers, timeOut: e.target.value } })} />
                            </FieldGroup>
                        </div>

                        {/* Re-examined */}
                        <div className="grid grid-cols-[150px,1fr,1fr,1fr] gap-3 items-end">
                            <div className="text-sm font-medium text-gray-700 pb-2 leading-tight">Re-examined by<br />SOCO officers</div>
                            <FieldGroup label="Date (DD/MM/YY)">
                                <TextInput isReadOnly={ro} value={sC.reExaminedBySocoOfficers?.date ?? ''} onChange={(e) => updateC({ reExaminedBySocoOfficers: { ...sC.reExaminedBySocoOfficers, date: e.target.value } })} placeholder="DD/MM/YY" />
                            </FieldGroup>
                            <FieldGroup label="Time In">
                                <TextInput type="time" isReadOnly={ro} value={sC.reExaminedBySocoOfficers?.timeIn ?? ''} onChange={(e) => updateC({ reExaminedBySocoOfficers: { ...sC.reExaminedBySocoOfficers, timeIn: e.target.value } })} />
                            </FieldGroup>
                            <FieldGroup label="Time Out">
                                <TextInput type="time" isReadOnly={ro} value={sC.reExaminedBySocoOfficers?.timeOut ?? ''} onChange={(e) => updateC({ reExaminedBySocoOfficers: { ...sC.reExaminedBySocoOfficers, timeOut: e.target.value } })} />
                            </FieldGroup>
                        </div>

                        <div className="pt-1 border-t border-gray-100" />

                        <OfficerRow label="Investigation Officer" value={sC.investigationOfficer ?? emptyOfficer()} isReadOnly={ro} onChange={(v) => updateC({ investigationOfficer: v })} />
                        {errors['officer'] && <p className="text-xs text-red-500">{errors['officer']}</p>}
                        <OfficerRow label="Re-Assigned Case" value={sC.reAssignedCaseOfficer ?? emptyOfficer()} isReadOnly={ro} onChange={(v) => updateC({ reAssignedCaseOfficer: v })} />
                        <OfficerRow label="Scene Guard" value={sC.sceneGuard ?? emptyOfficer()} isReadOnly={ro} onChange={(v) => updateC({ sceneGuard: v })} />
                    </div>
                )}
            </div>

            {/* ── Bottom action bar ────────────────────────────────────────────── */}
            <div className="flex-shrink-0 border-t border-gray-200 bg-gray-50/70 px-5 py-3 rounded-b-xl flex items-center justify-between gap-3">

                {/* Prev */}
                <button
                    type="button"
                    onClick={() => setActiveTab((t) => (t > 1 ? (t - 1) as TabId : t))}
                    disabled={activeTab === 1}
                    className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                    ← Prev
                </button>

                {/* Centre actions */}
                {!readOnlyAll ? (
                    <div className="flex items-center gap-2">
                        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors">
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleSaveDraft}
                            className="px-5 py-2 text-sm font-semibold text-amber-700 bg-amber-50 border border-amber-200 hover:bg-amber-100 rounded-lg transition-colors"
                        >
                            {appendMode ? 'Save Additions' : 'Save as Draft'}
                        </button>
                        {!appendMode && (
                            <button
                                type="button"
                                disabled={submitting}
                                onClick={handleSubmit}
                                className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 rounded-lg transition-colors shadow-sm"
                            >
                                Submit
                            </button>
                        )}
                    </div>
                ) : (
                    <span className="text-xs text-gray-400 italic">Read-only view</span>
                )}

                {/* Next */}
                <button
                    type="button"
                    onClick={() => setActiveTab((t) => (t < 3 ? (t + 1) as TabId : t))}
                    disabled={activeTab === 3}
                    className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                    Next →
                </button>
            </div>
        </div>
    );
}
