import React, { useState, useEffect } from "react";
import { Trash2, ExternalLink, X } from "lucide-react";
import { PaginationControls } from "../../components/ui/PaginationControls";
import { ConfirmDialog } from "../../components/ConfirmDialog";

const API_URL_STORAGE_KEY = "kinstory_admin_api_url";
const DEFAULT_API_URL = "http://localhost:5001/api";

export default function MemoriesPage() {
  const [apiUrl] = useState(() => localStorage.getItem(API_URL_STORAGE_KEY) || DEFAULT_API_URL);
  const [memories, setMemories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Pagination state
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const fetchMemories = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/admin/memories?page=${page}&limit=10`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setMemories(data.data);
      setTotalPages(data.totalPages);
      setTotalRecords(data.total);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Failed to load memories data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMemories();
  }, [apiUrl, page]);

  const deleteMemory = (memoryId: string) => {
    setConfirmingId(memoryId);
    setConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!confirmingId) return;
    try {
      const res = await fetch(`${apiUrl}/admin/memories/${confirmingId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      alert("Memory deleted successfully.");
      fetchMemories();
    } catch {
      alert("Failed to delete memory.");
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
          <span className="text-sm font-medium">Loading memories...</span>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-[#EBE6DA] text-xs font-semibold text-gray-400 uppercase tracking-wider">
                <th className="px-6 py-4">Memory Content</th>
                <th className="px-6 py-4">Attachment / Type</th>
                <th className="px-6 py-4">Owner & Baby</th>
                <th className="px-6 py-4">Engagement</th>
                {/* <th className="px-6 py-4">Created At</th> */}
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EBE6DA]">
              {memories.filter(m =>
                m.caption?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                m.uploaderEmail?.toLowerCase().includes(searchQuery.toLowerCase())
              ).map((m) => (
                <tr key={m.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 max-w-xs">
                    <div className="font-semibold text-gray-800 truncate" title={m.caption}>
                      {m.caption || <span className="a text-gray-400">No caption</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${m.type === "photo" ? "bg-blue-50 text-blue-700" :
                          m.type === "video" ? "bg-amber-50 text-amber-700" :
                            "bg-emerald-50 text-emerald-700"
                        }`}>
                        {m.type}
                      </span>
                      {m.mediaUrl && (
                        <a href={m.mediaUrl} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-gray-600 flex items-center gap-0.5 text-xs">
                          Link <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-800">Baby: {m.babyName || "Unknown"}</span>
                      <span className="text-xs text-gray-400">| By: {m.uploaderName} </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs font-semibold text-gray-500">
                    <div className="flex items-center gap-3">
                      <span>Comments: {m.commentCount}</span>
                      <span>Reactions: {m.reactionCount}</span>
                    </div>
                  </td>
                  {/* <td className="px-6 py-4 text-xs text-gray-400">{formatDate(m.createdAt)}</td> */}
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => deleteMemory(m.id)}
                      className="text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors cursor-pointer"
                      title="Delete Memory"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {memories.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                    No memories found.
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
        title="Delete Memory"
        description="Are you sure you want to delete this memory?"
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
