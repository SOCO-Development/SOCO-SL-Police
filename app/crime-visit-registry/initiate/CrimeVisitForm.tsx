"use client";

import { useState, useCallback, useEffect } from "react";
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
import { IconButton } from "@/components/ui";
import { locationService, userService, crimeService, officerService } from "@/lib/api";

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

/* Initiate Visit: support officers UI removed — uncomment block + SupportOfficersEditor + state + JSX below to restore.
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
*/

const FALLBACK_STATIONS: { value: string; label: string }[] = [];

const FALLBACK_SOCO_LABS: { value: string; label: string }[] = [];

// OFFENCE_OPTIONS array removed in favor of dynamic API loading

const OFFENCE_TYPES = [
  { value: "D", label: "D" },
  { value: "GCR", label: "GCR" },
  { value: "Other", label: "Other" },
];
const OFFENCE_TYPE_PRESETS = OFFENCE_TYPES.map((item) => item.value);

/* let supportOfficerRowSeed = 1;

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
*/

function defaultFormData(): CrimeVisitFormData {
  return {
    sectionA: {
      requestFromStation: "",
      requestDivision: "",
      locationId: "",
      policeStationId: "",
      offence: "",
      offenceType: "",
      offenceTypeOther: "",
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
      vehicleId: "",
      driver: emptyOfficer(),
      driverId: "",
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
    </>
  );

  if (layout === "stack") {
    return (
      <div className={label ? "space-y-2" : ""}>
        {label && (
          <div className="text-sm font-semibold text-gray-800 uppercase tracking-wide">
            {label}
          </div>
        )}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {fields}
        </div>
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

// ─── Support officers editor (commented out — Initiate Visit) ─────────────────

/* interface SupportOfficersEditorProps {
  rows: SupportOfficerRow[];
  isReadOnly?: boolean;
  otherRoleLabel: string;
  onOtherRoleLabelChange: (value: string) => void;
  onChange: (rows: SupportOfficerRow[]) => void;
}
function SupportOfficersEditor({
  rows,
  isReadOnly = false,
  otherRoleLabel,
  onOtherRoleLabelChange,
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
            className="grid grid-cols-1 gap-3 rounded-lg border border-gray-200 bg-white p-3"
          >
            <FieldGroup label="Team Role">
              {isReadOnly ? (
                <div className="px-3 py-2 text-sm rounded-lg border bg-gray-50 border-gray-200 text-gray-500">
                  {SUPPORT_ROLE_OPTIONS.find((o) => o.value === row.role)?.label ??
                    (row.role || "—")}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:items-end">
                  <div className="min-w-0">
                    <div className="grid w-full grid-cols-4 gap-x-2 sm:gap-x-3 min-h-10 items-center rounded-lg border border-gray-200 bg-gray-50/70 p-2">
                      {SUPPORT_ROLE_OPTIONS.map((opt) => (
                        <label
                          key={opt.value}
                          className="flex min-w-0 w-full items-center gap-2 text-sm text-gray-700 cursor-pointer"
                        >
                          <input
                            type="radio"
                            name={`support-role-${row.id}`}
                            checked={row.role === opt.value}
                            onChange={() => {
                              const nextRole = opt.value as SupportRole;
                              updateRow(row.id, { role: nextRole });
                              if (nextRole !== "otherOfficer") {
                                onOtherRoleLabelChange("");
                              }
                            }}
                            className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                          />
                          {opt.label}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="min-w-0 w-full">
                    {row.role === "otherOfficer" ? (
                      <TextInput
                        isReadOnly={isReadOnly}
                        value={otherRoleLabel}
                        onChange={(e) => onOtherRoleLabelChange(e.target.value)}
                        placeholder="Specify team role"
                      />
                    ) : (
                      <div className="min-h-10" />
                    )}
                  </div>
                </div>
              )}
            </FieldGroup>

            <div className="flex items-end gap-3">
              <FieldGroup label="Name" className="mb-0 flex-1">
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
              <FieldGroup label="Reg. No" className="mb-0 flex-1">
                <TextInput
                  isReadOnly={isReadOnly}
                  value={row.officer.regNo ?? ""}
                  onChange={(e) =>
                    updateRow(row.id, {
                      officer: { ...row.officer, regNo: e.target.value },
                    })
                  }
                  placeholder="Reg. No"
                />
              </FieldGroup>
              <FieldGroup label="Rank" className="mb-0 flex-1">
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
              {!isReadOnly ? (
                <div className="shrink-0">
                  <button
                    type="button"
                    onClick={() => removeRow(row.id)}
                    className="h-10 self-end whitespace-nowrap rounded-lg border border-red-200 bg-red-50 px-3 text-red-600 hover:bg-red-100 hover:border-red-300 transition-colors text-xs font-semibold"
                    aria-label="Remove officer"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div />
              )}
            </div>
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
} */

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
  const [socoLabs, setSocoLabs] = useState<{ value: string; label: string }[]>(FALLBACK_SOCO_LABS);
  const [stations, setStations] = useState<{ value: string; label: string }[]>(FALLBACK_STATIONS);
  const [offenceOptions, setOffenceOptions] = useState<{ value: string; label: string }[]>([]);
  const [stationsLoading, setStationsLoading] = useState(false);
  const [stationMap, setStationMap] = useState<Map<string, string>>(new Map());
  const [vehicleOptions, setVehicleOptions] = useState<{ value: string; label: string }[]>([]);
  const [vehicleMap, setVehicleMap] = useState<Map<string, string>>(new Map());
  const [driverOptions, setDriverOptions] = useState<{ value: string; label: string }[]>([]);
  const [driverMapping, setDriverMapping] = useState<Map<string, { name: string; regNo: string; rank: string; userId: string }>>(new Map());

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // 1. Get current user info
      let userInfo: any = null;
      try {
        userInfo = await userService.getCurrentUserInfo();
      } catch (err) {
        console.error("Failed to load user info", err);
      }

      // 2. Get locations
      let locations: any[] = [];
      try {
        locations = await locationService.getAllLocations();
      } catch (err) {
        console.error("Failed to load locations", err);
      }

      // 3. Get offences
      try {
        const offences = await crimeService.getAllOffences();
        if (!cancelled && Array.isArray(offences)) {
          const mappedOffences = offences.map((off) => ({
            value: String(off.OFFENCE_ID ?? off.offenceId ?? ''),
            label: String(off.OFFENCE_NAME ?? off.offenceName ?? ''),
          }));
          setOffenceOptions(mappedOffences);
        }
      } catch (err) {
        console.error("Failed to load offences", err);
      }

      // 4. Get vehicles
      let vehicles: any[] = [];
      try {
        const userLocId = userInfo?.locationId;
        const locIds = userLocId 
          ? [Number(userLocId)] 
          : locations.map((l) => Number(l.LOCATION_ID)).filter(Boolean);

        if (locIds.length > 0) {
          vehicles = await crimeService.getAllVehicles({ locationIds: locIds });
        }
      } catch (err) {
        console.error("Failed to load vehicles", err);
      }

      if (cancelled) return;

      // 5. Load dependent options if user info loaded successfully
      if (userInfo && userInfo.locationId) {
        const userLocId = userInfo.locationId;
        
        try {
          const officers = await officerService.getAllOfficers({ locationIds: [Number(userLocId)] });
          if (!cancelled && Array.isArray(officers)) {
            const locOfficers = officers.filter(o => String(o.LOCATION_ID) === String(userLocId));
            setDriverOptions(
              locOfficers.map(o => ({ value: o.USER_REGI_NO, label: `${o.USER_FULL_NAME} (${o.USER_REGI_NO})` })),
            );
            setDriverMapping(new Map(
              locOfficers.map(o => [o.USER_REGI_NO, { name: o.USER_FULL_NAME, regNo: o.USER_REGI_NO, rank: o.CURRENT_RANK ?? '', userId: o.SYSTEM_USER_ID }]),
            ));
          }
        } catch (err) {
          console.error("Failed to load officers for driver select", err);
        }

        if (!cancelled && Array.isArray(vehicles)) {
          console.log("[SOCO] All vehicles loaded:", vehicles);
          console.log("[SOCO] Filtering vehicles with userLocId:", userLocId);
          
          const filteredVehicles = vehicles.filter(v => {
            const locId = v.LOCATION_ID ?? v.locationId ?? v.location_id;
            return String(locId) === String(userLocId);
          });

          console.log("[SOCO] Filtered vehicles list:", filteredVehicles);

          setVehicleOptions(
            filteredVehicles.map(v => {
              const regNo = v.VEHICLE_REGISTRATION_NO ?? v.vehicleRegistrationNo ?? v.vehicleNo ?? v.vehicle_registration_no ?? '';
              return { value: String(regNo), label: String(regNo) };
            })
          );
          setVehicleMap(new Map(
            filteredVehicles.map(v => {
              const regNo = v.VEHICLE_REGISTRATION_NO ?? v.vehicleRegistrationNo ?? v.vehicleNo ?? v.vehicle_registration_no ?? '';
              const vId = v.VEHICLE_ID ?? v.vehicleId ?? v.vehicle_id ?? '';
              return [String(regNo), String(vId)];
            })
          ));
        }

        if (!cancelled && Array.isArray(locations)) {
          const matchingLab = locations.find(l => String(l.LOCATION_ID) === String(userLocId));
          if (matchingLab) {
            setSocoLabs([{ value: matchingLab.LOCATION_NAME, label: matchingLab.LOCATION_NAME }]);
            setFormData((f) => ({
              ...f,
              sectionA: {
                ...f.sectionA,
                requestDivision: matchingLab.LOCATION_NAME,
                locationId: matchingLab.LOCATION_ID,
              },
            }));
            setStationsLoading(true);
            try {
              const ps = await locationService.getPoliceStationsBySocoLab(userLocId);
              if (!cancelled && Array.isArray(ps)) {
                setStations(ps.map(s => ({ value: s.POLICE_STATION_NAME, label: s.POLICE_STATION_NAME })));
                setStationMap(new Map(ps.map(s => [s.POLICE_STATION_NAME, s.POLICE_STATION_ID])));
              }
            } catch (err) {
              console.error("Failed to load police stations", err);
            } finally {
              if (!cancelled) setStationsLoading(false);
            }
          }
        }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const [offenceTypeOther, setOffenceTypeOther] = useState<string>(() => {
    const defaults = initialData ?? defaultFormData();
    const value = defaults.sectionA?.offenceType ?? "";
    return defaults.sectionA?.offenceTypeOther ?? (OFFENCE_TYPE_PRESETS.includes(value) ? "" : value);
  });
  /* Initiate Visit: support officers — uncomment with SupportOfficersEditor + types/helpers above
  const [supportOtherRole, setSupportOtherRole] = useState<string>(
    () => (initialData ?? defaultFormData()).sectionB?.socoOfficers?.supportOtherRole ?? "",
  );
  const [supportRows, setSupportRows] = useState<SupportOfficerRow[]>(() =>
    supportToRows(
      (initialData ?? defaultFormData()).sectionB?.socoOfficers?.support,
    ),
  );
  */

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

  /* const updateSupportRows = useCallback((rows: SupportOfficerRow[]) => {
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
  }, []); */

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

          <div className="p-4 sm:p-5 rounded-xl border border-violet-200 bg-violet-50/65">
            <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide pb-2 mb-3 flex items-center gap-2">
              <span className="w-1.5 h-4 rounded-full bg-violet-500 inline-block flex-shrink-0" />
              Request Details
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <FieldGroup label="SOCO Lab">
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
                    options={socoLabs}
                    placeholder="Select SOCO lab"
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
                        sectionA: {
                          ...f.sectionA,
                          requestFromStation: val,
                          policeStationId: stationMap.get(val) ?? "",
                        },
                      }))
                    }
                    options={stations}
                    placeholder={stationsLoading ? "Loading stations..." : "Select police station"}
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
                    className="[&>div>button]:min-h-10 [&>div>button]:px-3 [&>div>button]:py-2"
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
                    options={offenceOptions}
                    placeholder="Select one or more offences"
                  />
                )}
              </FieldGroup>

              {Array.isArray(sA.offence) && sA.offence.length > 0 && (
                <div className="md:col-span-2 lg:col-span-3 mt-1 animate-in fade-in slide-in-from-top-1">
                  <div className="p-3 rounded-xl border border-violet-200 bg-violet-50/65">
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
                            {offenceOptions.find((opt) => opt.value === off)?.label ?? off}
                          </span>
                          {!locked && (
                            <IconButton variant="danger" className="ml-1" aria-label="Remove offence" onClick={() => { const updated = (sA.offence as string[]).filter((_, i) => i !== idx); setFormData((f) => ({ ...f, sectionA: { ...f.sectionA, offence: updated } })); }}>×</IconButton>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <FieldGroup label="Offence Type">
                {locked ? (
                  <div className="px-3 py-2 text-sm rounded-lg border bg-gray-50 border-gray-200 text-gray-500">
                    {sA.offenceType === "Other"
                      ? sA.offenceTypeOther || offenceTypeOther || "Other"
                      : sA.offenceType || "—"}
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2 min-h-10 rounded-lg border border-gray-200 bg-gray-50/70 p-2">
                    {OFFENCE_TYPES.map((option) => (
                      <label
                        key={option.value}
                        className="inline-flex items-center gap-2 text-sm text-gray-700"
                      >
                        <input
                          type="radio"
                          name="offenceType"
                          checked={(sA.offenceType ?? "") === option.value}
                          onChange={() =>
                            setFormData((f) => ({
                              ...f,
                              sectionA: {
                                ...f.sectionA,
                                offenceType: option.value,
                                offenceTypeOther:
                                  option.value === "Other"
                                    ? f.sectionA.offenceTypeOther
                                    : "",
                              },
                            }))
                          }
                          className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                        />
                        {option.label}
                      </label>
                    ))}
                  </div>
                )}
              </FieldGroup>

              {(sA.offenceType ?? "") === "Other" && (
                <FieldGroup
                  label="Other Offence Type"
                  className="md:col-start-2 lg:col-start-2"
                >
                  <TextInput
                    isReadOnly={locked}
                    value={sA.offenceTypeOther ?? offenceTypeOther}
                    onChange={(e) => {
                      const next = e.target.value;
                      setOffenceTypeOther(next);
                      setFormData((f) => ({
                        ...f,
                        sectionA: {
                          ...f.sectionA,
                          offenceType: "Other",
                          offenceTypeOther: next,
                        },
                      }));
                    }}
                    placeholder="Specify offence type"
                  />
                </FieldGroup>
              )}

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
          <div className="p-4 sm:p-5 rounded-xl border border-indigo-200 bg-indigo-50/65 space-y-4">
            <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide pb-2 border-b border-gray-200 flex items-center gap-2">
              <span className="w-1.5 h-4 rounded-full bg-indigo-500 inline-block flex-shrink-0" />
              OUT Details
            </h4>

            <DateTimeRow
              label="OUT"
              value={sA.out ?? emptyDatetime()}
              isReadOnly={locked}
              onChange={(v) => updateA("out", v)}
              layout="stack"
            />
          </div>

          <div className="p-4 sm:p-5 rounded-xl border border-slate-200 bg-slate-50/80 space-y-4">
            <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide pb-2 border-b border-gray-200 flex items-center gap-2">
              <span className="w-1.5 h-4 rounded-full bg-slate-500 inline-block flex-shrink-0" />
              Vehicle & Driver Details
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
              <FieldGroup label="Vehicle Number">
                {ro ? (
                  <div className="px-3 py-2 text-sm rounded-lg border bg-gray-50 border-gray-200 text-gray-500">
                    {sC.vehicleNo || "—"}
                  </div>
                ) : (
                  <CustomSelect
                    value={sC.vehicleNo ?? ""}
                    onChange={(val) => {
                      const vId = vehicleMap.get(val) ?? "";
                      updateC({ vehicleNo: val, vehicleId: vId });
                    }}
                    options={vehicleOptions}
                    placeholder="Select vehicle"
                  />
                )}
              </FieldGroup>
              <FieldGroup label="Select Driver">
                {ro ? (
                  <div className="px-3 py-2 text-sm rounded-lg border bg-gray-50 border-gray-200 text-gray-500">
                    {sC.driver?.name ? `${sC.driver.name} (${sC.driver.regNo})` : "—"}
                  </div>
                ) : (
                  <CustomSelect
                    value={sC.driver?.regNo ?? ""}
                    onChange={(val) => {
                      const info = driverMapping.get(val) ?? { name: '', regNo: '', rank: '', userId: '' };
                      updateC({ driver: { name: info.name, regNo: info.regNo, rank: info.rank }, driverId: info.userId });
                    }}
                    options={driverOptions}
                    placeholder="Select driver"
                    searchable
                    searchPlaceholder="Search officer..."
                  />
                )}
              </FieldGroup>
              <FieldGroup label="Driver Reg. Number">
                <TextInput
                  isReadOnly
                  value={sC.driver?.regNo ?? ""}
                  placeholder="Reg. Number"
                />
              </FieldGroup>
              <FieldGroup label="Driver Rank">
                <TextInput
                  isReadOnly
                  value={sC.driver?.rank ?? ""}
                  placeholder="Rank"
                />
              </FieldGroup>
            </div>
          </div>

          {/* Initiate Visit: Support Officers section — uncomment with state + SupportOfficersEditor above
          <div className="p-4 sm:p-5 rounded-xl border border-rose-200 bg-rose-50/65">
            <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide pb-2 mb-3 flex items-center gap-2">
              <span className="w-1.5 h-4 rounded-full bg-pink-500 inline-block flex-shrink-0" />
              Support Officers
            </h4>
            <SupportOfficersEditor
              rows={supportRows}
              isReadOnly={locked}
              otherRoleLabel={supportOtherRole}
              onOtherRoleLabelChange={(next) => {
                setSupportOtherRole(next);
                setFormData((f) => ({
                  ...f,
                  sectionB: {
                    ...f.sectionB,
                    socoOfficers: {
                      ...f.sectionB?.socoOfficers,
                      supportOtherRole: next,
                    },
                  },
                }));
              }}
              onChange={updateSupportRows}
            />
          </div>
          */}
        </div>
      </div>

      {/* ── Bottom action bar ────────────────────────────────────────────── */}
      <div className="flex-shrink-0 border-t border-gray-200 bg-gray-50/70 px-5 py-3 rounded-b-xl flex items-center justify-between gap-3">
        <div />

        {/* Centre actions */}
        {!readOnlyAll ? (
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              type="button"
              onClick={onCancel}
              className="min-h-[42px] px-4 py-2.5 text-sm font-medium"
            >
              Cancel
            </Button>
            {onSubmit && (
              <Button variant="success" type="button" onClick={() => onSubmit(formData)}>
                Submit Visit
              </Button>
            )}
          </div>
        ) : (
          <span className="text-xs text-gray-400 italic">Read-only view</span>
        )}
        <div />
      </div>
    </div>
  );
}
