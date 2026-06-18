"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Pencil, X } from "lucide-react";
import CustomSelect from "@/components/forms/CustomSelect";
import AppTable, { type AppTableColumn } from "@/components/layout/AppTable";
import { PageHeader, PageLayout, Button, UnderlineTab, TableIconButton } from "@/components/ui";
import {
  getLocationRegistry,
  insertNewDivision,
  updateDivision,
  insertNewSocoLab,
  getAllDivisionsByProvince,
  type LocationRow,
} from "@/lib/api/locationService";
import { getErrorMessage, showErrorAlert, showSuccessAlert } from "@/lib/alerts";

type SortField = "name" | "division" | "province";

export default function LocationConfigPage() {
  const [activeTab, setActiveTab] = useState<"all" | "addDivision" | "addSoco">("all");
  const [editingDivisionId, setEditingDivisionId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortField>("name");
  const [sortAsc, setSortAsc] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [locations, setLocations] = useState<LocationRow[]>([]);
  const [provinces, setProvinces] = useState<{ id: number; name: string }[]>([]);

  // Division Form State
  const [formData, setFormData] = useState({
    division: "",
    provinceId: "",
  });

  // SOCO Lab Form State
  const [socoFormData, setSocoFormData] = useState({
    provinceId: "",
    divisionId: "",
    socoLabName: "",
  });
  const [policeStations, setPoliceStations] = useState<string[]>([]);
  const [stationInput, setStationInput] = useState("");
  const [socoDivisions, setSocoDivisions] = useState<{ id: string; name: string }[]>([]);
  const [isSocoDivisionsLoading, setIsSocoDivisionsLoading] = useState(false);

  const loadData = useCallback(async (force = false) => {
    setIsLoading(true);
    try {
      const { locations: rows, provinces: provinceList } =
        await getLocationRegistry(force);
      setLocations(rows);
      setProvinces(provinceList);
    } catch (err) {
      showErrorAlert("Failed to Load Locations", getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const provinceOptions = provinces.map((p) => ({
    value: String(p.id),
    label: p.name,
  }));

  const handleSocoProvinceChange = async (provId: string) => {
    setSocoFormData(prev => ({ ...prev, provinceId: provId, divisionId: "" }));
    setSocoDivisions([]);
    if (!provId) return;

    setIsSocoDivisionsLoading(true);
    try {
      const apiDivs = await getAllDivisionsByProvince(Number(provId));
      setSocoDivisions(apiDivs.map(d => ({
        id: d.DIVISION_ID,
        name: d.DIVISION_NAME
      })));
    } catch {
      showErrorAlert("Error", "Failed to load divisions for this province.");
    } finally {
      setIsSocoDivisionsLoading(false);
    }
  };

  const handleStationKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const val = stationInput.trim();
      if (!val) return;
      if (policeStations.includes(val)) {
        showErrorAlert("Duplicate", "This police station is already added.");
        return;
      }
      setPoliceStations(prev => [...prev, val]);
      setStationInput("");
    }
  };

  const handleRemoveStation = (index: number) => {
    setPoliceStations(prev => prev.filter((_, i) => i !== index));
  };

  const socoDivisionOptions = socoDivisions.map((d) => ({
    value: d.id,
    label: d.name,
  }));

  const handleSort = (key: string) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else {
      setSortKey(key as SortField);
      setSortAsc(true);
    }
  };

  const filtered = locations
    .filter((loc) =>
      [loc.name, loc.division, loc.province].some((v) =>
        v.toLowerCase().includes(search.toLowerCase()),
      ),
    )
    .sort((a, b) => {
      const aVal = a[sortKey].toLowerCase();
      const bVal = b[sortKey].toLowerCase();
      return sortAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.division || !formData.provinceId) {
      showErrorAlert("Validation Error", "Police division and province are required.");
      return;
    }

    setIsSaving(true);
    try {
      if (editingDivisionId) {
        await updateDivision({
          divisionId: Number(editingDivisionId),
          provinceId: Number(formData.provinceId),
          divisionName: formData.division.trim(),
        });
        showSuccessAlert("Division Updated", "Police division has been updated successfully.");
      } else {
        await insertNewDivision({
          provinceId: Number(formData.provinceId),
          divisionName: formData.division.trim(),
        });
        showSuccessAlert("Division Added", "New police division has been saved successfully.");
      }

      setEditingDivisionId(null);
      setFormData({ division: "", provinceId: "" });
      setActiveTab("all");
      await loadData(true);
    } catch (err) {
      showErrorAlert("Save Failed", getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveSoco = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!socoFormData.provinceId || !socoFormData.divisionId || !socoFormData.socoLabName.trim()) {
      showErrorAlert("Validation Error", "Province, Police Division, and SOCO Lab Name are required.");
      return;
    }
    if (policeStations.length === 0) {
      showErrorAlert("Validation Error", "Please add at least one Police Station under this SOCO Lab.");
      return;
    }

    setIsSaving(true);
    try {
      await insertNewSocoLab({
        provinceId: Number(socoFormData.provinceId),
        divisionId: Number(socoFormData.divisionId),
        locationName: socoFormData.socoLabName.trim(),
        policeStations: policeStations.map(name => ({ stationName: name })),
      });

      showSuccessAlert("SOCO Lab Saved", "SOCO Lab and its Police Stations have been added successfully.");
      
      // Reset form
      setSocoFormData({ provinceId: "", divisionId: "", socoLabName: "" });
      setPoliceStations([]);
      setStationInput("");
      setActiveTab("all");
      await loadData(true);
    } catch (err) {
      showErrorAlert("Save Failed", getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (loc: LocationRow) => {
    if (!loc.provinceId) {
      showErrorAlert("Load Failed", "Province information is not available for this division.");
      return;
    }

    setEditingDivisionId(loc.divisionId);
    setFormData({
      division: loc.division,
      provinceId: loc.provinceId,
    });
    setActiveTab("addDivision");
  };

  const handleReset = () => {
    if (editingDivisionId) {
      setEditingDivisionId(null);
      setFormData({ division: "", provinceId: "" });
      setActiveTab("all");
    } else {
      setFormData({ division: "", provinceId: "" });
    }
  };

  const handleResetSoco = () => {
    setSocoFormData({ provinceId: "", divisionId: "", socoLabName: "" });
    setPoliceStations([]);
    setStationInput("");
  };

  const columns: AppTableColumn<LocationRow>[] = [
    {
      key: "name",
      label: "Location Name",
      sortable: true,
      render: (_, row) => (
        <span className="text-blue-600 font-semibold">{row.name}</span>
      ),
    },
    { key: "division", label: "Police Division", sortable: true },
    {
      key: "province",
      label: "Province",
      sortable: true,
      render: (_, row) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          {row.province}
        </span>
      ),
    },
    {
      key: "id",
      label: "Actions",
      align: "right",
      render: (_, row) => (
        <div className="flex items-center justify-end gap-1">
          <TableIconButton variant="edit" onClick={() => handleEdit(row)} title="Edit Division">
            <Pencil size={15} />
          </TableIconButton>
        </div>
      ),
    },
  ];

  return (
    <PageLayout>
      <PageHeader
        backHref="/system-config"
        title="Location Configuration"
        description="Manage SOCO locations and police divisions from the backend API."
        actions={
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                setEditingDivisionId(null);
                setFormData({ division: "", provinceId: "" });
                setActiveTab("addDivision");
              }}
            >
              <Plus size={16} />
              Add Division
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                handleResetSoco();
                setActiveTab("addSoco");
              }}
            >
              <Plus size={16} />
              Add SOCO Lab
            </Button>
          </div>
        }
      />

      <div className="flex items-center border-b border-gray-200 mb-6">
        <UnderlineTab active={activeTab === "all"} onClick={() => setActiveTab("all")} count={locations.length}>
          All Locations
        </UnderlineTab>
        <UnderlineTab
          active={activeTab === "addDivision"}
          onClick={() => {
            setEditingDivisionId(null);
            setFormData({ division: "", provinceId: "" });
            setActiveTab("addDivision");
          }}
        >
          {editingDivisionId ? "Edit Division" : "Add Division"}
        </UnderlineTab>
        <UnderlineTab active={activeTab === "addSoco"} onClick={() => setActiveTab("addSoco")}>
          Add SOCO Lab & Stations
        </UnderlineTab>
      </div>

      {activeTab === "all" && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <label className="text-sm font-medium text-gray-600">Search:</label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search locations..."
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:outline-none w-52 text-gray-800"
            />
          </div>
          <AppTable<LocationRow>
            columns={columns}
            data={filtered}
            keyField="id"
            sortKey={sortKey}
            sortAsc={sortAsc}
            onSort={handleSort}
            emptyMessage={isLoading ? "Loading locations..." : "No locations found."}
            variant="card"
          />
        </div>
      )}

      {activeTab === "addDivision" && (
        <form onSubmit={handleSave}>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-4">
            <h3 className="text-base font-bold text-gray-800 mb-1">
              {editingDivisionId ? "Edit Police Division" : "Add New Police Division"}
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              {editingDivisionId
                ? "Update the division details below."
                : "Enter division details and assign the province."}
            </p>

            <div className="border border-gray-200 rounded-xl p-5">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">
                Division Details
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Police Division <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.division}
                    onChange={(e) => setFormData({ ...formData, division: e.target.value })}
                    placeholder="e.g. Colombo South"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg text-gray-800 focus:ring-2 focus:ring-blue-200 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Province <span className="text-red-500">*</span>
                  </label>
                  <CustomSelect
                    value={formData.provinceId}
                    options={provinceOptions}
                    onChange={(val) => setFormData({ ...formData, provinceId: val })}
                    placeholder="Select Province"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="secondary" type="button" onClick={handleReset} disabled={isSaving}>
              {editingDivisionId ? "Cancel" : "Reset"}
            </Button>
            <Button variant="success" type="submit" disabled={isSaving}>
              {isSaving ? "Saving..." : editingDivisionId ? "Update Division" : "Save Division"}
            </Button>
          </div>
        </form>
      )}

      {activeTab === "addSoco" && (
        <form onSubmit={handleSaveSoco}>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-4">
            <h3 className="text-base font-bold text-gray-800 mb-1">Add New SOCO Lab & Police Stations</h3>
            <p className="text-sm text-gray-500 mb-6">
              Assign a new SOCO Lab to a Police Division and list the Police Stations under its jurisdiction.
            </p>

            <div className="border border-gray-200 rounded-xl p-5 mb-5">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">SOCO Lab Details</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Province <span className="text-red-500">*</span>
                  </label>
                  <CustomSelect
                    value={socoFormData.provinceId}
                    options={provinceOptions}
                    onChange={handleSocoProvinceChange}
                    placeholder="Select Province"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Police Division <span className="text-red-500">*</span>
                  </label>
                  <CustomSelect
                    value={socoFormData.divisionId}
                    options={socoDivisionOptions}
                    onChange={(val) => setSocoFormData({ ...socoFormData, divisionId: val })}
                    placeholder={socoFormData.provinceId ? "Select Division" : "Select Province First"}
                    disabled={!socoFormData.provinceId || isSocoDivisionsLoading}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    SOCO Lab Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={socoFormData.socoLabName}
                    onChange={(e) => setSocoFormData({ ...socoFormData, socoLabName: e.target.value })}
                    placeholder="e.g. Colombo South Lab"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg text-gray-800 focus:ring-2 focus:ring-blue-200 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="border border-gray-200 rounded-xl p-5">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Police Stations</p>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Add Police Station <span className="text-gray-400 font-normal">(Type name and press Enter)</span>
                  </label>
                  <input
                    type="text"
                    value={stationInput}
                    onChange={(e) => setStationInput(e.target.value)}
                    onKeyDown={handleStationKeyDown}
                    placeholder="e.g. Bambalapitiya Police Station"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg text-gray-800 focus:ring-2 focus:ring-blue-200 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    Added Stations Space
                  </label>
                  <div className="w-full min-h-[120px] p-4 bg-slate-50/50 border border-slate-200/80 rounded-xl transition-all duration-300">
                    {policeStations.length === 0 ? (
                      <div className="flex items-center justify-center h-[88px] text-sm text-slate-400 italic">
                        No police stations added yet. Type a name above and press Enter.
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2 animate-fadeIn">
                        {policeStations.map((station, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold bg-indigo-50/80 text-indigo-700 border border-indigo-100 hover:bg-indigo-100/80 transition-all duration-200"
                          >
                            {station}
                            <button
                              type="button"
                              onClick={() => handleRemoveStation(index)}
                              className="text-indigo-400 hover:text-indigo-600 transition-colors p-0.5 rounded-full hover:bg-indigo-200/50"
                            >
                              <X size={14} />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="secondary" type="button" onClick={handleResetSoco} disabled={isSaving}>
              Reset
            </Button>
            <Button variant="success" type="submit" disabled={isSaving || isSocoDivisionsLoading}>
              {isSaving ? "Saving..." : "Save SOCO Lab & Stations"}
            </Button>
          </div>
        </form>
      )}
    </PageLayout>
  );
}
