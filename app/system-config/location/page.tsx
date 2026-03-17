"use client";

import { useState } from "react";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { ArrowLeft, MapPin, Plus, Trash2 } from "lucide-react";
import CustomSelect from "@/components/forms/CustomSelect";

// --- Types ---
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

export default function LocationConfigPage() {
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

  const handleAddLocation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.division || !formData.province) return;

    const newEntry: LocationEntry = {
      id: Math.random().toString(36).substr(2, 9),
      ...formData,
    };

    setLocations([...locations, newEntry]);
    setFormData({ name: "", division: "", province: "" });
  };

  const removeLocation = (id: string) => {
    setLocations(locations.filter((loc) => loc.id !== id));
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-white to-gray-50">
      <Header />
      <div className="flex flex-1 relative z-10 w-full pt-14">
        <main className="flex-1 overflow-x-hidden min-w-0 flex flex-col min-h-screen">
          <div className="w-full px-4 sm:px-6 lg:px-8 py-8 flex-1">
            {/* Header Section */}
            <div className="flex items-center gap-3 mb-8">
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
                <p className="text-sm text-gray-500 mt-0.5 font-noto-sinhala">
                  ස්ථාන වින්‍යාස කිරීම
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              {/* --- Left Column: Add New Location Form --- */}
              <div className="xl:col-span-1">
                <form
                  onSubmit={handleAddLocation}
                  className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 sticky top-24"
                >
                  <div className="flex items-center gap-2 mb-6">
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <MapPin size={20} className="text-blue-600" />
                    </div>
                    <h3 className="font-bold text-gray-800">
                      Add New Location
                    </h3>
                  </div>

                  <div className="space-y-5">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                        Location Name / ස්ථානයේ නම
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        placeholder="e.g. Borella Station"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg text-black focus:ring-2 focus:ring-blue-200 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                        Police Division / පොලිස් කොට්ඨාශය
                      </label>
                      <input
                        type="text"
                        value={formData.division}
                        onChange={(e) =>
                          setFormData({ ...formData, division: e.target.value })
                        }
                        placeholder="e.g. Colombo South"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg text-black focus:ring-2 focus:ring-blue-200 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                        Province / පළාත
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

                    <button
                      type="submit"
                      className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm"
                    >
                      <Plus size={18} />
                      Save Location
                    </button>
                  </div>
                </form>
              </div>

              {/* --- Right Column: View Locations Table --- */}
              <div className="xl:col-span-2">
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                    <h3 className="font-bold text-gray-800">
                      Existing Locations
                    </h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-gray-50/80 border-b border-gray-200">
                          <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">
                            Location Name
                          </th>
                          <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">
                            Police Division
                          </th>
                          <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">
                            Province
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {locations.length > 0 ? (
                          locations.map((loc) => (
                            <tr
                              key={loc.id}
                              className="hover:bg-gray-50/50 transition-colors"
                            >
                              <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                {loc.name}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-600">
                                {loc.division}
                              </td>
                              <td className="px-6 py-4">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  {loc.province}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <button
                                  onClick={() => removeLocation(loc.id)}
                                  className="text-gray-400 hover:text-red-600 transition-colors p-1"
                                >
                                  <Trash2 size={18} />
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td
                              colSpan={4}
                              className="px-6 py-12 text-center text-gray-400 text-sm"
                            >
                              No locations configured yet.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <Footer />
        </main>
      </div>
    </div>
  );
}
