import React, { useState, useEffect } from "react";
import { Trash2, X } from "lucide-react";
import { PaginationControls } from "../../components/ui/PaginationControls";

const API_URL_STORAGE_KEY = "kinstory_admin_api_url";
const DEFAULT_API_URL = "http://localhost:5001/api";

export default function BabiesPage() {
  const [apiUrl] = useState(() => localStorage.getItem(API_URL_STORAGE_KEY) || DEFAULT_API_URL);
  const [babies, setBabies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Pagination state
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  const fetchBabies = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/admin/babies?page=${page}&limit=10`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setBabies(data.data);
      setTotalPages(data.totalPages);
      setTotalRecords(data.total);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Failed to load babies data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBabies();
  }, [apiUrl, page]);

  const deleteBaby = async (babyId: string) => {
    if (!window.confirm("WARNING: Deleting this baby profile will cascade-delete all their memories, family members, dream tales, and highlights. Proceed?")) return;
    try {
      const res = await fetch(`${apiUrl}/admin/babies/${babyId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      alert("Baby profile deleted successfully.");
      fetchBabies();
    } catch {
      alert("Failed to delete baby profile.");
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit",
    });
  };

  return (
    <div className="bg-white rounded-xl border border-[#EBE6DA] shadow-sm overflow-hidden animate-fadeIn">
      {/* Table search & filter header */}
      <div className="p-6 border-b border-[#EBE6DA] flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-50/50">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search local page..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-4 pr-10 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#5F7A68] text-sm bg-white"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer p-1"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="text-xs text-gray-400 font-medium">
          {loading ? "Loading..." : `Total ${totalRecords} entries in database`}
        </div>
      </div>

      {error && (
        <div className="p-6 text-rose-600 bg-rose-50 border-b border-rose-100 text-sm">
          {error}
        </div>
      )}

      {/* Table Area */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-gray-400">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-t-transparent border-[#5F7A68]"></div>
          <span className="text-sm font-medium">Loading babies...</span>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-[#EBE6DA] text-xs font-semibold text-gray-400 uppercase tracking-wider">
                <th className="px-6 py-4">Photo</th>
                <th className="px-6 py-4">Baby Details</th>
                <th className="px-6 py-4">Birth Date</th>
                <th className="px-6 py-4">Parent Details</th>
                <th className="px-6 py-4">Memories count</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EBE6DA]">
              {babies.filter(b =>
                b.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                b.parentEmail?.toLowerCase().includes(searchQuery.toLowerCase())
              ).map((b) => (
                <tr key={b.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <img 
                      src={b.profilePhoto}
                      alt={b.name}
                      width={48}
                      height={48}
                      style={{
                        borderRadius: "50%",
                        objectFit: "cover",
                        border: "1px solid #e5e7eb"
                      }}
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-800">{b.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs font-semibold text-gray-600">
                    {b.dob ? new Date(b.dob).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "-"}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-700">{b.parentName || "Unknown parent"}</span>
                      <span className="text-xs text-gray-400 font-mono">({b.parentEmail})</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-semibold text-gray-600 px-8">{b.memoryCount}</td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => deleteBaby(b.id)}
                      className="text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors cursor-pointer"
                      title="Delete Profile"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {babies.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                    No babies found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Controls */}
      <PaginationControls
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />
    </div>
  );
}
