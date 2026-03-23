"use client";

import { useState } from "react";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { ArrowLeft, Plus, Trash2, Pencil } from "lucide-react";
import CustomSelect from "@/components/forms/CustomSelect";
import AppTable, { type AppTableColumn } from "@/components/layout/AppTable";

interface LocationEntry {
  id: string;
  name: string;
  division: string;
  province: string;
}

const PROVINCE_OPTIONS = [
  { value: "Central", label: "Central" },
  { value: "Eastern", label: "Eastern" },
  { value: "North Central", label: "North Central" },
  { value: "Northern", label: "Northern" },
  { value: "North Western", label: "North Western" },
  { value: "Sabaragamuwa", label: "Sabaragamuwa" },
  { value: "Southern", label: "Southern" },
  { value: "Uva", label: "Uva" },
  { value: "Western", label: "Western" },
];

type SortField = "name" | "division" | "province";

export default function LocationConfigPage() {
  const [activeTab, setActiveTab] = useState<"all" | "addNew">("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortField>("name");
  const [sortAsc, setSortAsc] = useState(true);

  const [locations, setLocations] = useState<LocationEntry[]>([
    {
      id: "1",
      name: "Colombo Central",
      division: "Colombo",
      province: "Western",
    },
    { id: "2", name: "Kandy Post", division: "Kandy", province: "Central" },
  ]);

  const [formData, setFormData] = useState({
    name: "",
    division: "",
    province: "",
  });

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

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.division || !formData.province) return;
    if (editingId) {
      setLocations(
        locations.map((loc) =>
          loc.id === editingId ? { ...loc, ...formData } : loc,
        ),
      );
      setEditingId(null);
    } else {
      setLocations([
        ...locations,
        { id: Math.random().toString(36).substr(2, 9), ...formData },
      ]);
    }
    setFormData({ name: "", division: "", province: "" });
    setActiveTab("all");
  };

  const handleEdit = (loc: LocationEntry) => {
    setEditingId(loc.id);
    setFormData({
      name: loc.name,
      division: loc.division,
      province: loc.province,
    });
    setActiveTab("addNew");
  };

  const handleReset = () => {
    if (editingId) {
      setEditingId(null);
      setFormData({ name: "", division: "", province: "" });
      setActiveTab("all");
    } else {
      setFormData({ name: "", division: "", province: "" });
    }
  };

  const removeLocation = (id: string) => {
    setLocations(locations.filter((loc) => loc.id !== id));
  };

  const openAddNew = () => {
    setEditingId(null);
    setFormData({ name: "", division: "", province: "" });
    setActiveTab("addNew");
  };

  const columns: AppTableColumn<LocationEntry>[] = [
    {
      key: "name",
      label: "Location Name",
      sortable: true,
      render: (_, row) => (
        <span className="text-blue-600 font-semibold cursor-pointer hover:underline">
          {row.name}
        </span>
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
          <button
            onClick={() => handleEdit(row)}
            className="text-gray-400 hover:text-blue-600 transition-colors p-1"
            title="Edit"
          >
            <Pencil size={15} />
          </button>
          <button
            onClick={() => removeLocation(row.id)}
            className="text-gray-400 hover:text-red-600 transition-colors p-1"
            title="Delete"
          >
            <Trash2 size={15} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-white to-gray-50">
      <Header />
      <div className="flex flex-1 relative z-10 w-full pt-14">
        <main className="flex-1 overflow-x-hidden min-w-0 flex flex-col min-h-screen">
          <div className="w-full px-4 sm:px-6 lg:px-8 py-8 flex-1">
            {/* Page Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Link
                  href="/system-config"
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  aria-label="Back"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Location Configuration
                  </h2>
                  <p className="text-sm text-gray-500 mt-0.5">
                    Manage SOCO locations — add and view location assignments.
                  </p>
                </div>
              </div>
              <button
                onClick={openAddNew}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2.5 rounded-lg text-sm transition-colors shadow-sm"
              >
                <Plus size={16} />
                Add New Location
              </button>
            </div>

            {/* Tabs */}
            <div className="flex items-center border-b border-gray-200 mb-6">
              <button
                onClick={() => setActiveTab("all")}
                className={`flex items-center gap-1.5 px-1 pb-3 mr-6 text-sm font-medium border-b-2 -mb-px transition-colors ${
                  activeTab === "all"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                All
                <span
                  className={`text-sm font-semibold ${activeTab === "all" ? "text-blue-600" : "text-gray-500"}`}
                >
                  {locations.length}
                </span>
              </button>
              <button
                onClick={openAddNew}
                className={`px-1 pb-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
                  activeTab === "addNew"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Add New
              </button>
            </div>

            {/* All Tab */}
            {activeTab === "all" && (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <label className="text-sm font-medium text-gray-600">
                    Search:
                  </label>
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search locations..."
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:outline-none w-52 text-gray-800"
                  />
                </div>
                <AppTable<LocationEntry>
                  columns={columns}
                  data={filtered}
                  keyField="id"
                  sortKey={sortKey}
                  sortAsc={sortAsc}
                  onSort={handleSort}
                  emptyMessage="No locations configured yet."
                  variant="card"
                />
              </div>
            )}

            {/* Add New / Edit Tab */}
            {activeTab === "addNew" && (
              <form onSubmit={handleSave}>
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-4">
                  <h3 className="text-base font-bold text-gray-800 mb-1">
                    {editingId ? "Edit Location" : "Add New Location"}
                  </h3>
                  <p className="text-sm text-gray-500 mb-6">
                    {editingId
                      ? "Update the location details below."
                      : "Enter location details and assign the division/province."}
                  </p>

                  {/* ── Single-row inputs ── */}
                  <div className="border border-gray-200 rounded-xl p-5">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">
                      Location Details
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {/* Location Name */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Location Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) =>
                            setFormData({ ...formData, name: e.target.value })
                          }
                          placeholder="e.g. Borella Station"
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg text-gray-800 focus:ring-2 focus:ring-blue-200 focus:outline-none"
                        />
                      </div>

                      {/* Police Division */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Police Division{" "}
                          <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.division}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              division: e.target.value,
                            })
                          }
                          placeholder="e.g. Colombo South"
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg text-gray-800 focus:ring-2 focus:ring-blue-200 focus:outline-none"
                        />
                      </div>

                      {/* Province */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Province <span className="text-red-500">*</span>
                        </label>
                        <CustomSelect
                          value={formData.province}
                          options={PROVINCE_OPTIONS}
                          onChange={(val) =>
                            setFormData({ ...formData, province: val })
                          }
                          placeholder="Select Province"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="px-5 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    {editingId ? "Cancel" : "Reset"}
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors shadow-sm"
                  >
                    {editingId ? "Update Location" : "Save Location"}
                  </button>
                </div>
              </form>
            )}
          </div>
          <Footer />
        </main>
      </div>
    </div>
  );
}
