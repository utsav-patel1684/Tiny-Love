import React, { useState, useEffect } from "react";
import { Trash2, X } from "lucide-react";
import { PaginationControls } from "../../components/ui/PaginationControls";
import { ConfirmDialog } from "../../components/ConfirmDialog";

const API_URL_STORAGE_KEY = "kinstory_admin_api_url";
const DEFAULT_API_URL = "http://localhost:5001/api";

export default function DreamTalesPage() {
  const [apiUrl] = useState(() => localStorage.getItem(API_URL_STORAGE_KEY) || DEFAULT_API_URL);
  const [dreamTales, setDreamTales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Pagination state
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const fetchDreamTales = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/admin/dream-tales?page=${page}&limit=10`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setDreamTales(data.data);
      setTotalPages(data.totalPages);
      setTotalRecords(data.total);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Failed to load dream tales data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDreamTales();
  }, [apiUrl, page]);

  const deleteDreamTale = (dreamTaleId: string) => {
    setConfirmingId(dreamTaleId);
    setConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!confirmingId) return;
    try {
      const res = await fetch(`${apiUrl}/admin/dream-tales/${confirmingId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      alert("Dream Tale deleted successfully.");
      fetchDreamTales();
    } catch {
      alert("Failed to delete Dream Tale.");
    } finally {
      setConfirmOpen(false);
      setConfirmingId(null);
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
          {loading ? "" : `Total ${totalRecords} entries in database`}
        </div>
      </div>

      {error && (
        <div className="p-6 text-rose-600 bg-rose-50 border-b border-rose-100 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-gray-400">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-t-transparent border-[#5F7A68]"></div>
          <span className="text-sm font-medium">Loading dream tales...</span>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-[#EBE6DA] text-xs font-semibold text-gray-400 uppercase tracking-wider">
                <th className="px-6 py-4">Tale Details</th>
                <th className="px-6 py-4">Configuration</th>
                <th className="px-6 py-4">Associated Baby</th>
                <th className="px-6 py-4">Created By</th>
                <th className="px-6 py-4">Generated At</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EBE6DA]">
              {dreamTales.filter(d =>
                d.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                d.userName?.toLowerCase().includes(searchQuery.toLowerCase())
              ).map((d) => (
                <tr key={d.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-800">{d.title}</span>
                      <div className="flex items-center gap-2">
                        {d.isFavorite && <span className="text-amber-500 text-[10px] font-bold uppercase tracking-wider">★ Favorite</span>}
                        {d.durationSeconds && <span className="text-gray-400 text-xs">| {Math.floor(d.durationSeconds / 60)}m {d.durationSeconds % 60}s</span>}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-500">Style: <span className="font-medium text-gray-700">{d.storyStyle}</span></span>
                      <span className="text-xs text-gray-500">Voice: <span className="font-medium text-gray-700">{d.voiceName}</span></span>
                      <span className="text-xs text-gray-500">Language: <span className="font-medium text-gray-700">{d.language}</span></span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-800">{d.babyName}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-800">{d.userName}</span>
                      <span className="text-xs text-gray-400">({d.userEmail})</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-400">{formatDate(d.createdAt)}</td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => deleteDreamTale(d.id)}
                      className="text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors cursor-pointer"
                      title="Delete Dream Tale"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {dreamTales.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                    No dream tales found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <PaginationControls
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />
      
      <ConfirmDialog
        open={confirmOpen}
        title="Delete Dream Tale"
        description="Are you sure you want to delete this Dream Tale?"
        confirmText="Delete"
        cancelText="Cancel"
        isDestructive={true}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setConfirmOpen(false);
          setConfirmingId(null);
        }}
      />
    </div>
  );
}
