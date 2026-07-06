import React, { useState, useEffect } from "react";
import { Trash2, ExternalLink, X } from "lucide-react";
import { PaginationControls } from "../../components/ui/PaginationControls";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { apiFetch } from "../../lib/api";
export default function MemoriesPage() {

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
      const data = await apiFetch<any>(
        `/admin/memories?page=${page}&limit=10`
      );

      setMemories(data.data ?? []);
      setTotalPages(data.totalPages ?? 1);
      setTotalRecords(data.total ?? 0);
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
  }, [page]);

  const deleteMemory = (memoryId: string) => {
    setConfirmingId(memoryId);
    setConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!confirmingId) return;
    try {
      await apiFetch(`/admin/memories/${confirmingId}`, {
        method: "DELETE",
      });
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
    <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden animate-fadeIn">
      <div className="p-6 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-4 bg-muted/50">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search memories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-4 pr-10 py-2 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary text-sm bg-background text-foreground"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white cursor-pointer p-1"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="text-xs text-white/70 font-medium">
          {loading ? "" : `Total ${totalRecords} entries in database`}
        </div>
      </div>

      {error && (
        <div className="p-6 text-rose-600 bg-rose-50 border-b border-rose-100 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-white/70">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-t-transparent border-[#5F7A68]"></div>
          <span className="text-sm font-medium">Loading memories...</span>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-muted/30 border-b border-border text-xs font-semibold uppercase tracking-wider">
                <th className="px-6 py-4">Memory Content</th>
                <th className="px-6 py-4">Attachment / Type</th>
                <th className="px-6 py-4">Owner & Baby</th>
                <th className="px-6 py-4">Engagement</th>
                {/* <th className="px-6 py-4">Created At</th> */}
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {memories.filter(m =>
                m.caption?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                m.uploaderEmail?.toLowerCase().includes(searchQuery.toLowerCase())
              ).map((m) => (
                <tr key={m.id} className="hover:bg-muted/70 transition-colors">
                  <td className="px-6 py-4 max-w-xs">
                    <div className="font-semibold text-white truncate" title={m.caption}>
                      {m.caption || <span className="a text-white/70">No caption</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${m.type === "photo" ? "bg-white/10 text-white" :
                        m.type === "video" ? "bg-white/10 text-white" :
                          "bg-white/10 text-white"
                        }`}>
                        {m.type}
                      </span>
                      {m.mediaUrl && (
                        <a href={m.mediaUrl} target="_blank" rel="noreferrer" className="text-white/70 hover:text-white flex items-center gap-0.5 text-xs">
                          Link <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white">Baby: {m.babyName || "Unknown"}</span>
                      <span className="text-xs text-white/70">| By: {m.uploaderName} </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs font-semibold text-white/70">
                    <div className="flex items-center gap-3">
                      <span>Comments: {m.commentCount}</span>
                      <span>Reactions: {m.reactionCount}</span>
                    </div>
                  </td>
                  {/* <td className="px-6 py-4 text-xs text-white/70">{formatDate(m.createdAt)}</td> */}
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
                  <td colSpan={6} className="px-6 py-8 text-center text-white/70">
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
