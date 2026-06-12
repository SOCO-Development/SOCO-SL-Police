"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Pencil } from "lucide-react";
import CustomSelect from "@/components/forms/CustomSelect";
import AppTable, { type AppTableColumn } from "@/components/layout/AppTable";
import { PageHeader, PageLayout, Button, UnderlineTab, TableIconButton } from "@/components/ui";
import {
  getLocationRegistry,
  insertNewDivision,
  updateDivision,
  type LocationRow,
} from "@/lib/api/locationService";
import { getErrorMessage, showErrorAlert, showSuccessAlert } from "@/lib/alerts";

type SortField = "name" | "division" | "province";

export default function LocationConfigPage() {
  const [activeTab, setActiveTab] = useState<"all" | "addNew">("all");
  const [editingDivisionId, setEditingDivisionId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortField>("name");
  const [sortAsc, setSortAsc] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [locations, setLocations] = useState<LocationRow[]>([]);
  const [provinces, setProvinces] = useState<{ id: number; name: string }[]>([]);

  const [formData, setFormData] = useState({
    division: "",
    provinceId: "",
  });

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
    setActiveTab("addNew");
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

  const openAddNew = () => {
    setEditingDivisionId(null);
    setFormData({ division: "", provinceId: "" });
    setActiveTab("addNew");
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
          <Button variant="primary" onClick={openAddNew}>
            <Plus size={16} />
            Add New Division
          </Button>
        }
      />

      <div className="flex items-center border-b border-gray-200 mb-6">
        <UnderlineTab active={activeTab === "all"} onClick={() => setActiveTab("all")} count={locations.length}>
          All
        </UnderlineTab>
        <UnderlineTab active={activeTab === "addNew"} onClick={openAddNew}>
          Add New
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

      {activeTab === "addNew" && (
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
    </PageLayout>
  );
}
