"use client";

import { useState, useCallback } from "react";
import type {
  SectionA,
  SectionB,
  SectionC,
  OfficerInfo,
  Expert,
  DateTimeEntry,
  CrimeVisitFormData,
} from "@/types/crimeVisit";
import DatePicker from "@/components/forms/DatePicker";
import TimePicker from "@/components/forms/TimePicker";
import CustomSelect from "@/components/forms/CustomSelect";
import Button from "@/components/buttons/Button";
import { CrimeSceneFormData } from "@/types/crimeScene";
import MultiSelect from "@/components/forms/MultiSelect";

// ─── Defaults ─────────────────────────────────────────────────────────────────

const emptyOfficer = (): OfficerInfo => ({ rank: "", regNo: "", name: "" });
const emptyDatetime = (): DateTimeEntry => ({
  date: "",
  time: "",
  page: "",
  para: "",
});
const emptyExpert = (): Expert => ({
  annex: "Annex 20",
  name: "",
  inTime: "",
  outTime: "",
});

type SupportOfficerMap = NonNullable<
  NonNullable<SectionB["socoOfficers"]>["support"]
>;
type SupportRole = keyof SupportOfficerMap;

interface SupportOfficerRow {
  id: number;
  role: SupportRole;
  officer: OfficerInfo;
}

const SUPPORT_ROLE_OPTIONS: { value: SupportRole; label: string }[] = [
  { value: "photographer", label: "Photographer" },
  { value: "sketcher", label: "Sketcher" },
  { value: "evidenceCollector", label: "Evidence Collector" },
  { value: "otherOfficer", label: "Other" },
];

const REQUEST_STATION_OPTIONS = [
  {
    value: "Colombo Fort Police Station",
    label: "Colombo Fort Police Station",
  },
  { value: "Borella Police Station", label: "Borella Police Station" },
  { value: "Kandy Police Station", label: "Kandy Police Station" },
  { value: "Galle Police Station", label: "Galle Police Station" },
  { value: "Kurunegala Police Station", label: "Kurunegala Police Station" },
  { value: "Jaffna Police Station", label: "Jaffna Police Station" },
];

const REQUEST_DIVISION_OPTIONS = [
  { value: "Colombo Division", label: "Colombo Division" },
  { value: "Kandy Division", label: "Kandy Division" },
  { value: "Gampaha Division", label: "Gampaha Division" },
  { value: "Kalutara Division", label: "Kalutara Division" },
  { value: "Galle Division", label: "Galle Division" },
  { value: "Kurunegala Division", label: "Kurunegala Division" },
];

const OFFENCE_OPTIONS = [
  "මනුෂ්‍ය ඝාතනය",
  "මනුෂ්‍ය ඝාතනයට තැත්කිරීම හා සියදිවි නසා ගැනීමට අනුබල දීම",
  "කැමැත්තෙන්ම තුවාල සිදු කිරීම",
  "ස්ත්‍රී දූෂණය",
  "ව්‍යවස්ථාපිත ස්ත්‍රී දූෂණය හා ව්‍යභිචාරය",
  "ළමයින්ගෙන් අයුතු ලිංගික ප්‍රෙයා්ජන ගැනීම, බරපතල ලිංගික අපයෝජනය සහ අස්වාභාවික වැරදි",
  "ළමයින් අතහැර යාම, කෘෘරත්වයට භාජනය කිරීම සහ වහල් භාවට ගැනීම",
  "අපහරණය හා පැහැරගෙන යාම සම්බන්ධ වැරදි",
  "කුට්ඨනය කිරීම සහ තැනැත්තන් වෙළදාම සිදු කිරීම",
  "රාජකාරියට බාධා කිරීම",
  "කොල්ලකෑම",
  "අයුතු ඇතුල්වීම සහ ගෙවල් බිදිම",
  "සොරකම් කිරීම",
  "ගිණි තැබීම් හා අනර්ථය සිදු කිරීම",
  "බලෙන් ලබා ගැනීම ( මුදලක්, යම් දේපළක් හෝ වටිනා ඇපයක්, වටිනා ඇපයකට හැරවිය හැකි අත්සන් කරනු ලැබු යමක් )",
  "රු. 700000/- ක් හෝ ඊට වැඩි සාවද්‍ය පරිහරණය, සාපරාධි විශ්වාසය කඩ කිරීම, වංචා කිරීම සහ අනෙකෙකු ලෙස පෙනි සිට වංචා කිරීම",
  "රාජ්‍ය විරෝධී වැරදි",
  "නීති විරෝධි රැස්වීම / කැරළි කෝලාහල",
  "ව්‍යාජ මුදල් පිළිබද අපරාධ",
  "2007 අංක 24 දරණ පරිගණක අපරාධ පනත",
  "ගෙවීම් උපක්‍රම වංචා සංයුක්ත වන ක්‍රියා",
  "2006 අංක 05 දරණ මුදල් විශුද්ධීකරණය වැලැක්වීමේ පනත යටතේ ගැනෙන වැරදි",
  "පීඩාකාරි ආයුධ පනත",
  "ස්වයංක්‍රීය, ස්වයංපූරක ගිණි අවි හෝ රිපීටර් තුවක්කු සන්තකය",
  "2007 අංක 56 දරන සිවිල් හා දේශපාලන අයිතිවාසිකම් පිළිබද ජාත්‍යන්තර සම්මුතිය (ICCPR) පනත",
  "1984 අංක 13 සහ 2022 අංක 2022 අංක 41 පනත් වලින් සංශෝධිත විෂ වර්ග, අබිං සහ අන්තරාදායක ඖෂධ ආඥා පනත සහ 2008 අංක 01 දරන මාද ඖෂධ සහ මනෝවර්ථක නිතිවිරෝධි ලෙස ජාවාරම් කිරීමට එරෙහි සම්මුති පනත යටතේ වැරදි",
  "1979 අංක 48 දරන ත්‍රස්තවාදි වැලැක්වීම පනත යටතේ වැරදි",
  "2025 අංක 05 දරන අපරාධයකින් උත්පාදිත දේ පිළිබද පනත යටතේ සිදු කෙරෙන වැරදි",
  "1993 අංක 49 දරන පනතින් සංශෝධිත 1937 අංක 02 දරන වන සත්ත්ව හා වෘක්ෂලතා ආඥා පනත ( 2009 අංක 22 සංශෝධනය දක්වා සියළු සංශෝධන ඇතුලත් )",
].map((value) => ({ value, label: value }));

const OFFENCE_TYPES = [
  { value: "D", label: "D" },
  { value: "GCR", label: "GCR" },
  { value: "Other", label: "Other" },
];

let supportOfficerRowSeed = 1;

const newSupportOfficerRow = (
  role: SupportRole = "photographer",
  officer: OfficerInfo = emptyOfficer(),
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
  if (hasOfficerValue(support.photographer))
    rows.push(
      newSupportOfficerRow(
        "photographer",
        support.photographer ?? emptyOfficer(),
      ),
    );
  if (hasOfficerValue(support.sketcher))
    rows.push(
      newSupportOfficerRow("sketcher", support.sketcher ?? emptyOfficer()),
    );
  if (hasOfficerValue(support.evidenceCollector))
    rows.push(
      newSupportOfficerRow(
        "evidenceCollector",
        support.evidenceCollector ?? emptyOfficer(),
      ),
    );
  if (hasOfficerValue(support.otherOfficer))
    rows.push(
      newSupportOfficerRow(
        "otherOfficer",
        support.otherOfficer ?? emptyOfficer(),
      ),
    );
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
      requestFromStation: "",
      requestDivision: "",
      offence: "",
      offenceType: "",
      requestReason: "",
      reportedToSocoLab: { date: "", time: "" },
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
      vehicleNo: "",
      driver: emptyOfficer(),
      examinedBySocoOfficers: { date: "", timeIn: "", timeOut: "" },
      reExaminedBySocoOfficers: { date: "", timeIn: "", timeOut: "" },
      investigationOfficer: emptyOfficer(),
      reAssignedCaseOfficer: emptyOfficer(),
      sceneGuard: emptyOfficer(),
    },
  };
}

// ─── Small UI helpers ─────────────────────────────────────────────────────────

interface FieldGroupProps {
  label: string;
  children: React.ReactNode;
  className?: string;
}
function FieldGroup({ label, children, className = "" }: FieldGroupProps) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
        {label}
      </label>
      {children}
    </div>
  );
}

interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  isReadOnly?: boolean;
}
function TextInput({ isReadOnly, className = "", ...props }: TextInputProps) {
  return (
    <input
      {...props}
      readOnly={isReadOnly}
      className={`w-full min-h-10 px-3 py-2 text-sm rounded-lg border ${
        isReadOnly
          ? "bg-gray-50 border-gray-200 text-gray-500 cursor-not-allowed"
          : "bg-white border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-gray-400"
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
function OfficerRow({
  label,
  value,
  isReadOnly = false,
  onChange,
  compact = false,
}: OfficerRowProps) {
  return (
    <div className="space-y-2">
      {!compact && (
        <div className="text-sm font-medium text-gray-700 pb-0.5 leading-tight">
          {label}
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        <FieldGroup label="Name">
          <TextInput
            isReadOnly={isReadOnly}
            value={value.name ?? ""}
            onChange={(e) => onChange({ ...value, name: e.target.value })}
            placeholder="Full name"
          />
        </FieldGroup>

        <FieldGroup label="Reg. Number">
          <TextInput
            isReadOnly={isReadOnly}
            value={value.regNo ?? ""}
            onChange={(e) => onChange({ ...value, regNo: e.target.value })}
            placeholder="Reg. No."
          />
        </FieldGroup>

        <FieldGroup label="Rank">
          <TextInput
            isReadOnly={isReadOnly}
            value={value.rank ?? ""}
            onChange={(e) => onChange({ ...value, rank: e.target.value })}
            placeholder="Rank"
          />
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
  layout?: "row" | "stack";
}
function DateTimeRow({
  label,
  value,
  isReadOnly = false,
  onChange,
  layout = "row",
}: DateTimeRowProps) {
  const fields = (
    <>
      <FieldGroup label="Date (DD-MM-YYYY)">
        {isReadOnly ? (
          <div className="px-3 py-2 text-sm rounded-lg border bg-gray-50 border-gray-200 text-gray-500">
            {value.date || "—"}
          </div>
        ) : (
          <DatePicker
            value={value.date ?? ""}
            onChange={(date) => onChange({ ...value, date })}
          />
        )}
      </FieldGroup>
      <FieldGroup label="Time">
        {isReadOnly ? (
          <div className="px-3 py-2 text-sm rounded-lg border bg-gray-50 border-gray-200 text-gray-500">
            {value.time || "—"}
          </div>
        ) : (
          <TimePicker
            value={value.time ?? ""}
            onChange={(time) => onChange({ ...value, time })}
          />
        )}
      </FieldGroup>
      {/* Page and Para Fields */}
      <div className="grid grid-cols-2 gap-2">
        <FieldGroup label="Page">
          <TextInput
            isReadOnly={isReadOnly}
            value={value.page ?? ""}
            onChange={(e) => onChange({ ...value, page: e.target.value })}
            placeholder="No."
          />
        </FieldGroup>
        <FieldGroup label="Para">
          <TextInput
            isReadOnly={isReadOnly}
            value={value.para ?? ""}
            onChange={(e) => onChange({ ...value, para: e.target.value })}
            placeholder="Para"
          />
        </FieldGroup>
      </div>
    </>
  );

  if (layout === "stack") {
    return (
      <div className={label ? "space-y-2" : ""}>
        {label && (
          <div className="text-sm font-medium text-gray-700">{label}</div>
        )}
        {/* Adjusted to 3 columns: Date, Time, and (Page/Para) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">{fields}</div>
      </div>
    );
  }

  return (
    <div className="grid gap-3 items-end grid-cols-[120px,1fr,1fr,1fr]">
      <div className="text-sm font-medium text-gray-700 pb-2 leading-tight">
        {label}
      </div>
      {fields}
    </div>
  );
}

// ─── Experts table ────────────────────────────────────────────────────────────

interface SupportOfficersEditorProps {
  rows: SupportOfficerRow[];
  isReadOnly?: boolean;
  onChange: (rows: SupportOfficerRow[]) => void;
}
function SupportOfficersEditor({
  rows,
  isReadOnly = false,
  onChange,
}: SupportOfficersEditorProps) {
  const updateRow = (id: number, patch: Partial<SupportOfficerRow>) =>
    onChange(rows.map((row) => (row.id === id ? { ...row, ...patch } : row)));

  const addRow = () => {
    const usedRoles = new Set(rows.map((r) => r.role));
    const nextRole =
      SUPPORT_ROLE_OPTIONS.find((opt) => !usedRoles.has(opt.value))?.value ??
      "otherOfficer";
    onChange([...rows, newSupportOfficerRow(nextRole)]);
  };

  const removeRow = (id: number) =>
    onChange(rows.filter((row) => row.id !== id));

  return (
    <div>
      <div className="space-y-3">
        {rows.map((row) => (
          <div
            key={row.id}
            className="grid grid-cols-[1.2fr,2fr,1fr,40px] gap-3 items-end"
          >
            <FieldGroup label="Role">
              {isReadOnly ? (
                <div className="px-3 py-2 text-sm rounded-lg border bg-gray-50 border-gray-200 text-gray-500">
                  {SUPPORT_ROLE_OPTIONS.find((o) => o.value === row.role)
                    ?.label ??
                    (row.role || "—")}
                </div>
              ) : (
                <CustomSelect
                  value={row.role}
                  onChange={(v) =>
                    updateRow(row.id, { role: v as SupportRole })
                  }
                  options={SUPPORT_ROLE_OPTIONS.filter(
                    (opt) =>
                      opt.value === row.role ||
                      !rows.some(
                        (r) => r.id !== row.id && r.role === opt.value,
                      ),
                  )}
                  placeholder="Select role"
                />
              )}
            </FieldGroup>
            <FieldGroup label="Name">
              <TextInput
                isReadOnly={isReadOnly}
                value={row.officer.name ?? ""}
                onChange={(e) =>
                  updateRow(row.id, {
                    officer: { ...row.officer, name: e.target.value },
                  })
                }
                placeholder="Full name"
              />
            </FieldGroup>
            <div className="grid grid-cols-2 gap-2">
              <FieldGroup label="Reg. Number">
                <TextInput
                  isReadOnly={isReadOnly}
                  value={row.officer.regNo ?? ""}
                  onChange={(e) =>
                    updateRow(row.id, {
                      officer: { ...row.officer, regNo: e.target.value },
                    })
                  }
                  placeholder="Reg. No."
                />
              </FieldGroup>
              <FieldGroup label="Rank">
                <TextInput
                  isReadOnly={isReadOnly}
                  value={row.officer.rank ?? ""}
                  onChange={(e) =>
                    updateRow(row.id, {
                      officer: { ...row.officer, rank: e.target.value },
                    })
                  }
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
        <button
          type="button"
          onClick={addRow}
          className="mt-3 text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 transition-colors"
        >
          <span className="text-base leading-none">+</span> Add Officer
        </button>
      )}
    </div>
  );
}

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
  const [formData, setFormData] = useState<CrimeVisitFormData>(
    initialData ?? defaultFormData(),
  );
  const [supportRows, setSupportRows] = useState<SupportOfficerRow[]>(() =>
    supportToRows(
      (initialData ?? defaultFormData()).sectionB?.socoOfficers?.support,
    ),
  );

  // ── Helpers ────────────────────────────────────────────────────────────────
  const updateA = useCallback(
    (key: keyof SectionA, val: DateTimeEntry) =>
      setFormData((f) => ({ ...f, sectionA: { ...f.sectionA, [key]: val } })),
    [],
  );

  const updateInCharge = useCallback(
    (val: OfficerInfo) =>
      setFormData((f) => ({
        ...f,
        sectionB: {
          ...f.sectionB,
          socoOfficers: { ...f.sectionB?.socoOfficers, inCharge: val },
        },
      })),
    [],
  );

  const updateSupportRows = useCallback((rows: SupportOfficerRow[]) => {
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
  }, []);

  const updateC = useCallback(
    (patch: Partial<SectionC>) =>
      setFormData((f) => ({ ...f, sectionC: { ...f.sectionC, ...patch } })),
    [],
  );

  function handleSaveDraft() {
    onSaveDraft?.(formData);
  }

  const ro = readOnlyAll;
  const locked = lockedMode || readOnlyAll;

  const sA = formData.sectionA ?? {};
  const sB = formData.sectionB ?? {};
  const sC = formData.sectionC ?? {};
  const socoOfficers = sB.socoOfficers ?? {};

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div
      className="bg-white rounded-xl border border-gray-200 flex flex-col"
      style={{ minHeight: "520px" }}
    >
      <div className="flex-1 overflow-y-auto px-6 py-5">
        <div className="animate-fade-in space-y-5">
          <h3 className="text-base font-semibold text-gray-700 uppercase tracking-widest pb-2 border-b border-gray-200">
            Initiate Visit
          </h3>

          <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/80">
            <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide pb-2 mb-3 flex items-center gap-2">
              <span className="w-1.5 h-4 rounded-full bg-violet-500 inline-block flex-shrink-0" />
              Request Details
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              <FieldGroup label="Division">
                {locked ? (
                  <div className="px-3 py-2 text-sm rounded-lg border bg-gray-50 border-gray-200 text-gray-500">
                    {sA.requestDivision || "—"}
                  </div>
                ) : (
                  <CustomSelect
                    value={sA.requestDivision ?? ""}
                    onChange={(val) =>
                      setFormData((f) => ({
                        ...f,
                        sectionA: { ...f.sectionA, requestDivision: val },
                      }))
                    }
                    options={REQUEST_DIVISION_OPTIONS}
                    placeholder="Select division"
                  />
                )}
              </FieldGroup>

              <FieldGroup label="Police station">
                {locked ? (
                  <div className="px-3 py-2 text-sm rounded-lg border bg-gray-50 border-gray-200 text-gray-500">
                    {sA.requestFromStation || "—"}
                  </div>
                ) : (
                  <CustomSelect
                    value={sA.requestFromStation ?? ""}
                    onChange={(val) =>
                      setFormData((f) => ({
                        ...f,
                        sectionA: { ...f.sectionA, requestFromStation: val },
                      }))
                    }
                    options={REQUEST_STATION_OPTIONS}
                    placeholder="Select police station"
                  />
                )}
              </FieldGroup>

              <FieldGroup label="Offences">
                {locked ? (
                  <div className="flex flex-wrap gap-1.5 p-2 rounded-lg border bg-gray-50 border-gray-200 min-h-10">
                    {Array.isArray(sA.offence) && sA.offence.length > 0 ? (
                      sA.offence.map((off, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 bg-gray-200 text-gray-700 text-xs rounded-md border border-gray-300"
                        >
                          {off}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-400 text-sm italic">
                        No offences selected
                      </span>
                    )}
                  </div>
                ) : (
                  <MultiSelect
                    value={
                      Array.isArray(sA.offence)
                        ? sA.offence
                        : sA.offence
                          ? [sA.offence]
                          : []
                    }
                    onChange={(val) =>
                      setFormData((f) => ({
                        ...f,
                        sectionA: { ...f.sectionA, offence: val },
                      }))
                    }
                    options={OFFENCE_OPTIONS}
                    placeholder="Select one or more offences"
                  />
                )}
              </FieldGroup>

              {Array.isArray(sA.offence) && sA.offence.length > 0 && (
                <div className="md:col-span-2 lg:col-span-3 mt-1 animate-in fade-in slide-in-from-top-1">
                  <div className="p-3 rounded-xl border border-violet-200 bg-violet-50/50">
                    <p className="text-[10px] font-bold text-violet-500 uppercase tracking-widest mb-2 px-1">
                      Selected Offences
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {sA.offence.map((off, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2 px-3 py-1.5 bg-white border border-violet-200 rounded-lg shadow-sm"
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                          <span className="text-xs font-medium text-violet-900 leading-snug">
                            {off}
                          </span>
                          {!locked && (
                            <button
                              type="button"
                              onClick={() => {
                                const updated = (sA.offence as string[]).filter(
                                  (_, i) => i !== idx,
                                );
                                setFormData((f) => ({
                                  ...f,
                                  sectionA: { ...f.sectionA, offence: updated },
                                }));
                              }}
                              className="ml-1 text-violet-400 hover:text-red-500 transition-colors"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <FieldGroup label="Offence Type">
                {locked ? (
                  <div className="px-3 py-2 text-sm rounded-lg border bg-gray-50 border-gray-200 text-gray-500 font-medium">
                    {sA.offenceType || "—"}
                  </div>
                ) : (
                  <CustomSelect
                    value={sA.offenceType ?? ""}
                    onChange={(val) =>
                      setFormData((f) => ({
                        ...f,
                        sectionA: { ...f.sectionA, offenceType: val },
                      }))
                    }
                    options={OFFENCE_TYPES}
                    placeholder="D / GCR"
                  />
                )}
              </FieldGroup>

              {/* <FieldGroup
                label="Reason"
                className="md:col-span-2 lg:col-span-3"
              >
                <textarea
                  readOnly={locked}
                  value={sA.requestReason ?? ""}
                  onChange={(e) =>
                    setFormData((f) => ({
                      ...f,
                      sectionA: {
                        ...f.sectionA,
                        requestReason: e.target.value,
                      },
                    }))
                  }
                  rows={2}
                  placeholder="Enter additional details or reason"
                  className={`w-full px-3 py-2 text-sm rounded-lg border ${
                    locked
                      ? "bg-gray-50 border-gray-200 text-gray-500"
                      : "bg-white border-gray-300 text-gray-900"
                  } transition-colors resize-y`}
                />
              </FieldGroup> */}
            </div>
          </div>

          {/* OUT & IN Section */}
          <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/80 space-y-4">
            <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide pb-2 border-b border-gray-200 flex items-center gap-2">
              <span className="w-1.5 h-4 rounded-full bg-indigo-500 inline-block flex-shrink-0" />
              OUT & IN Details
            </h4>

            <div className="grid grid-cols-1 gap-6">
              <DateTimeRow
                label="OUT"
                value={sA.out ?? emptyDatetime()}
                isReadOnly={locked}
                onChange={(v) => updateA("out", v)}
                layout="stack"
              />

              <div className="border-t border-dashed border-gray-300 relative my-2">
                <span className="absolute left-4 -top-3 bg-gray-50 px-2 text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                  Return Details
                </span>
              </div>

              <DateTimeRow
                label="IN"
                value={sA.in ?? emptyDatetime()}
                isReadOnly={ro}
                onChange={(v) => updateA("in", v)}
                layout="stack"
              />
            </div>
          </div>

          <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/80 space-y-4">
            <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide pb-2 border-b border-gray-200 flex items-center gap-2">
              <span className="w-1.5 h-4 rounded-full bg-slate-500 inline-block flex-shrink-0" />
              Vehicle & Driver Details
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
              {/* Vehicle Number - Spans 1 column */}
              <div className="md:col-span-1">
                <FieldGroup label="Vehicle Number">
                  <TextInput
                    isReadOnly={ro}
                    value={sC.vehicleNo ?? ""}
                    onChange={(e) => updateC({ vehicleNo: e.target.value })}
                    placeholder="e.g. CAB-1234"
                  />
                </FieldGroup>
              </div>

              {/* Driver Details - Spans 2 columns */}
              <div className="md:col-span-2">
                <OfficerRow
                  label="Driver"
                  value={sC.driver ?? emptyOfficer()}
                  isReadOnly={ro}
                  onChange={(v) => updateC({ driver: v })}
                  compact
                />
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/80">
            <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide pb-2 mb-3 flex items-center gap-2">
              <span className="w-1.5 h-4 rounded-full bg-blue-500 inline-block flex-shrink-0" />
              Support Officers
            </h4>
            <SupportOfficersEditor
              rows={supportRows}
              isReadOnly={locked}
              onChange={updateSupportRows}
            />
          </div>
        </div>
      </div>

      {/* ── Bottom action bar ────────────────────────────────────────────── */}
      <div className="flex-shrink-0 border-t border-gray-200 bg-gray-50/70 px-5 py-3 rounded-b-xl flex items-center justify-between gap-3">
        <div />

        {/* Centre actions */}
        {!readOnlyAll ? (
          <div className="flex items-center gap-2">
            <Button variant="ghost" type="button" onClick={onCancel}>
              Cancel
            </Button>
            {!appendMode && (
              <Button variant="success" type="button" onClick={handleSaveDraft}>
                Save as Draft
              </Button>
            )}
            {/* {onSubmit && (
                            <Button variant="success" type="button" onClick={() => onSubmit(formData)}>
                                Submit
                            </Button>
                        )} */}
          </div>
        ) : (
          <span className="text-xs text-gray-400 italic">Read-only view</span>
        )}
        <div />
      </div>
    </div>
  );
}
