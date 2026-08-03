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
import { getUsername } from "@/lib/api/authStorage";
import { FileText, Clock, Car } from "lucide-react";

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
  required?: boolean;
}
function FieldGroup({ label, children, className = "", required = false }: FieldGroupProps) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
        {label}
        {required && <span className="text-red-600 text-base leading-none align-middle ml-1">*</span>}
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

interface SectionAccent {
  border: string;
  dot: string;
  bg: string;
}
interface SectionCardProps {
  title: string;
  accent: SectionAccent;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  children: React.ReactNode;
}
function SectionCard({ title, accent, icon: Icon, children }: SectionCardProps) {
  return (
    <section
      className={`${accent.bg} rounded-xl border border-[var(--border-subtle)] border-l-4 ${accent.border} shadow-sm`}
    >
      <div className="px-4 sm:px-5 pt-4 pb-3 border-b border-black/5 flex items-center gap-2.5">
        <Icon size={15} className={accent.dot} />
        <h4 className="text-sm font-bold text-[var(--card-foreground)] uppercase tracking-wide">{title}</h4>
      </div>
      <div className="px-4 sm:px-5 py-5 space-y-4">{children}</div>
    </section>
  );
}

interface SegmentedOptionProps {
  name: string;
  label: string;
  checked: boolean;
  onChange: () => void;
}
/** Toggle-button style radio — used where selection needs to be unmistakable at a glance (e.g. Offence Type). */
function SegmentedOption({ name, label, checked, onChange }: SegmentedOptionProps) {
  return (
    <label
      className={`inline-flex items-center justify-center gap-1.5 min-w-0 px-3 py-1.5 rounded-lg border text-sm font-semibold cursor-pointer select-none transition-colors ${
        checked
          ? "border-[var(--primary)] bg-[var(--primary)] text-white shadow-sm"
          : "border-gray-300 bg-white text-gray-700 hover:border-[var(--primary)]/50 hover:bg-[var(--primary)]/5"
      }`}
    >
      <input type="radio" name={name} checked={checked} onChange={onChange} className="sr-only" />
      <span className="truncate">{label}</span>
    </label>
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
  /** Marks the Date/Time fields (not Page/Para) as required. */
  required?: boolean;
}
function DateTimeRow({
  label,
  value,
  isReadOnly = false,
  onChange,
  layout = "row",
  required = false,
}: DateTimeRowProps) {
  const fields = (
    <>
      <FieldGroup label="Date (DD-MM-YYYY)" required={required}>
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
      <FieldGroup label="Time" required={required}>
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
  const [locationMap, setLocationMap] = useState<Map<string, string>>(new Map());
  const [stations, setStations] = useState<{ value: string; label: string }[]>(FALLBACK_STATIONS);
  const [offenceOptions, setOffenceOptions] = useState<{ value: string; label: string }[]>([]);
  const [stationsLoading, setStationsLoading] = useState(false);
  const [stationMap, setStationMap] = useState<Map<string, string>>(new Map());
  const [vehicleOptions, setVehicleOptions] = useState<{ value: string; label: string }[]>([]);
  const [vehicleMap, setVehicleMap] = useState<Map<string, string>>(new Map());
  const [driverOptions, setDriverOptions] = useState<{ value: string; label: string }[]>([]);
  const [driverMapping, setDriverMapping] = useState<Map<string, { name: string; regNo: string; rank: string; userId: string }>>(new Map());
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // 1. Get current user info & username
      let userInfo: any = null;
      try {
        userInfo = await userService.getCurrentUserInfo();
      } catch (err) {
        console.error("Failed to load user info", err);
      }

      const activeUsername = getUsername() ?? "";

      // 2. Resolve current logged-in user's SYSTEM_USER_ID from officers list
      let currentSystemUserId = 0;
      try {
        const allOfficers = await officerService.getAllOfficers();
        if (Array.isArray(allOfficers) && allOfficers.length > 0) {
          const match = allOfficers.find((o) => {
            const regiNoMatch = activeUsername && String(o.USER_REGI_NO ?? '').trim().toLowerCase() === activeUsername.trim().toLowerCase();
            const callingNameMatch = userInfo?.callingName && String(o.USER_CALLING_NAME ?? '').trim().toLowerCase() === userInfo.callingName.trim().toLowerCase();
            const fullNameMatch = userInfo?.callingName && String(o.USER_FULL_NAME ?? '').trim().toLowerCase() === userInfo.callingName.trim().toLowerCase();
            return regiNoMatch || callingNameMatch || fullNameMatch;
          });
          if (match && match.SYSTEM_USER_ID) {
            currentSystemUserId = Number(match.SYSTEM_USER_ID);
          }
        }
      } catch (err) {
        console.error("Failed to resolve SYSTEM_USER_ID for current user", err);
      }

      // 3. Get locations specifically assigned to user's "Lodge visits" / "Lodge CVR" privilege
      let locations: any[] = [];
      if (currentSystemUserId > 0) {
        try {
          const privGroups = await officerService.getUserPrivilegeLocations(currentSystemUserId);
          if (Array.isArray(privGroups) && privGroups.length > 0) {
            const lodgeLocationsMap = new Map<string, { LOCATION_ID: string; LOCATION_NAME: string }>();

            privGroups.forEach((g) => {
              (g.privileges || []).forEach((p) => {
                const roleLower = (p.privilegeRole || '').toLowerCase().trim();
                const isLodgeRole = roleLower === 'lodge visits' || roleLower === 'lodge cvr' || roleLower.includes('lodge visit') || roleLower.includes('lodge cvr');
                if (isLodgeRole) {
                  (p.locations || []).forEach((loc) => {
                    lodgeLocationsMap.set(String(loc.locationId), {
                      LOCATION_ID: String(loc.locationId),
                      LOCATION_NAME: loc.locationName,
                    });
                  });
                }
              });
            });

            if (lodgeLocationsMap.size > 0) {
              locations = Array.from(lodgeLocationsMap.values());
            }
          }
        } catch (err) {
          console.error("Failed to load privilege locations for lodge visits", err);
        }
      }

      // Fallback to getPrivilegedOrAllLocations if no specific lodge privilege locations found
      if (locations.length === 0) {
        try {
          locations = await locationService.getPrivilegedOrAllLocations();
        } catch (err) {
          console.error("Failed to load locations", err);
        }
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

        if (!cancelled && Array.isArray(locations) && locations.length > 0) {
          // Populate socoLabs options with ALL allowed/privileged locations for the user
          const labOptions = locations.map((l) => ({
            value: String(l.LOCATION_NAME),
            label: String(l.LOCATION_NAME),
          }));
          setSocoLabs(labOptions);

          const locMap = new Map<string, string>(
            locations.map((l) => [String(l.LOCATION_NAME), String(l.LOCATION_ID)]),
          );
          setLocationMap(locMap);

          // Select matching user location or first allowed location
          const matchingLab = locations.find((l) => String(l.LOCATION_ID) === String(userLocId)) || locations[0];
          const activeLocId = String(matchingLab.LOCATION_ID);

          setFormData((f) => ({
            ...f,
            sectionA: {
              ...f.sectionA,
              requestDivision: f.sectionA?.requestDivision || matchingLab.LOCATION_NAME,
              locationId: f.sectionA?.locationId || activeLocId,
            },
          }));

          setStationsLoading(true);
          try {
            const ps = await locationService.getPoliceStationsBySocoLab(activeLocId);
            if (!cancelled && Array.isArray(ps)) {
              setStations(ps.map((s) => ({ value: s.POLICE_STATION_NAME, label: s.POLICE_STATION_NAME })));
              setStationMap(new Map(ps.map((s) => [s.POLICE_STATION_NAME, s.POLICE_STATION_ID])));
            }
          } catch (err) {
            console.error("Failed to load police stations", err);
          } finally {
            if (!cancelled) setStationsLoading(false);
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

  function validate(): string {
    const a = formData.sectionA ?? {};
    const c = formData.sectionC ?? {};
    if (!a.requestDivision) return "Please select a SOCO Lab.";
    if (!a.requestFromStation) return "Please select a police station.";
    const offences = Array.isArray(a.offence) ? a.offence : a.offence ? [a.offence] : [];
    if (offences.length === 0) return "Please select at least one offence.";
    if (!a.offenceType) return "Please select an offence type.";
    if (a.offenceType === "Other" && !(a.offenceTypeOther ?? offenceTypeOther)?.trim()) {
      return "Please specify the offence type.";
    }
    if (!a.out?.date || !a.out?.time) return "Please provide the OUT date and time.";
    if (!c.vehicleNo) return "Please select a vehicle.";
    if (!c.driver?.regNo) return "Please select a driver.";
    return "";
  }

  function handleSubmitClick() {
    const validation = validate();
    if (validation) {
      setError(validation);
      return;
    }
    setError("");
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
    <div
      className="bg-[var(--card)] rounded-xl border border-[var(--border-subtle)] flex flex-col"
      style={{ minHeight: "520px" }}
    >
      <div className="flex-1 overflow-y-auto px-6 py-5">
        <div className="animate-fade-in space-y-5">
          <h3 className="text-base font-semibold text-gray-700 uppercase tracking-widest pb-2 border-b border-gray-200">
            Initiate Visit
          </h3>

          <SectionCard title="Request Details" accent={{ border: "border-l-violet-500", dot: "text-violet-600", bg: "bg-violet-50" }} icon={FileText}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <FieldGroup label="SOCO Lab" required>
                {locked ? (
                  <div className="px-3 py-2 text-sm rounded-lg border bg-gray-50 border-gray-200 text-gray-500">
                    {sA.requestDivision || "—"}
                  </div>
                ) : (
                  <CustomSelect
                    value={sA.requestDivision ?? ""}
                    onChange={async (val) => {
                      const selectedLocId = locationMap.get(val) ?? "";
                      setFormData((f) => ({
                        ...f,
                        sectionA: {
                          ...f.sectionA,
                          requestDivision: val,
                          locationId: selectedLocId,
                          requestFromStation: "",
                          policeStationId: "",
                        },
                      }));
                      if (selectedLocId) {
                        setStationsLoading(true);
                        try {
                          const ps = await locationService.getPoliceStationsBySocoLab(selectedLocId);
                          if (Array.isArray(ps)) {
                            setStations(ps.map((s) => ({ value: s.POLICE_STATION_NAME, label: s.POLICE_STATION_NAME })));
                            setStationMap(new Map(ps.map((s) => [s.POLICE_STATION_NAME, s.POLICE_STATION_ID])));
                          }
                        } catch (err) {
                          console.error("Failed to load police stations for selected location", err);
                        } finally {
                          setStationsLoading(false);
                        }
                      }
                    }}
                    options={socoLabs}
                    placeholder="Select SOCO lab"
                  />
                )}
              </FieldGroup>

              <FieldGroup label="Police station" required>
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

              <FieldGroup label="Offences" required>
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
                  <div className="bg-[var(--muted)]/50 rounded-xl p-4">
                    <p className="text-[10px] font-bold text-violet-500 uppercase tracking-widest mb-2 px-1">
                      Selected Offences
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {sA.offence.map((off, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2 px-3 py-1.5 bg-[var(--card)] border border-violet-200 rounded-lg shadow-sm"
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

              <FieldGroup label="Offence Type" required>
                {locked ? (
                  <div className="px-3 py-2 text-sm rounded-lg border bg-gray-50 border-gray-200 text-gray-500">
                    {sA.offenceType === "Other"
                      ? sA.offenceTypeOther || offenceTypeOther || "Other"
                      : sA.offenceType || "—"}
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center gap-2 min-h-10 rounded-lg border border-gray-200 bg-gray-50/70 p-2">
                    {OFFENCE_TYPES.map((option) => (
                      <SegmentedOption
                        key={option.value}
                        name="offenceType"
                        label={option.label}
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
                      />
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
          </SectionCard>

          {/* OUT & IN Section */}
          <SectionCard title="OUT Details" accent={{ border: "border-l-indigo-500", dot: "text-indigo-600", bg: "bg-indigo-50" }} icon={Clock}>
            <DateTimeRow
              label="OUT"
              value={sA.out ?? emptyDatetime()}
              isReadOnly={locked}
              onChange={(v) => updateA("out", v)}
              layout="stack"
              required
            />
          </SectionCard>

          <SectionCard title="Vehicle & Driver Details" accent={{ border: "border-l-emerald-500", dot: "text-emerald-600", bg: "bg-emerald-50" }} icon={Car}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
              <FieldGroup label="Vehicle Number" required>
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
              <FieldGroup label="Select Driver" required>
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
          </SectionCard>

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

          {/* ── Error ── */}
          {error && (
            <div className="p-4 rounded-xl border border-red-200 bg-red-50">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Bottom action bar ────────────────────────────────────────────── */}
      <div className="flex-shrink-0 border-t border-[var(--border-subtle)] bg-[var(--card)]/95 backdrop-blur px-5 py-3 rounded-b-xl flex items-center justify-between gap-3 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
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
              <Button variant="success" type="button" onClick={handleSubmitClick}>
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
