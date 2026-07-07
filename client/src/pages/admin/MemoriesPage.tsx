import React, { useState, useEffect } from "react";
import { Trash2, ExternalLink, X, Eye, Pencil } from "lucide-react";
import { Link } from "react-router-dom";
import { PaginationControls } from "../../components/ui/PaginationControls";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { Skeleton } from "../../components/ui/skeleton";
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
      <div className="p-4 md:p-6 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
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
        <div className="text-xs text-white font-medium">
          {loading ? "" : `Total ${totalRecords} Records.`}
        </div>
      </div>
      {error && (
        <div className="p-4 md:p-6 text-rose-600 bg-rose-50 border-b border-rose-100 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-10 space-y-4 w-full">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-14 w-full rounded-md" />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto overflow-y-hidden w-full">
          <table className="w-full min-w-[800px] text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-border text-xs font-semibold uppercase tracking-wider">
                <th className="px-6 py-4">Memory Content</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Owner</th>
                <th className="px-6 py-4">Baby</th>
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
                      {m.caption || <span className="a text-white">No caption</span>}
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
                    <div className="flex flex-row ">
                      <span className="font-semibold text-white">{m.uploaderName || "Unknown"}</span>
                      {/* <span className="text-xs text-white/70 font-mono">{m.uploaderEmail}</span> */}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-semibold text-white">{m.babyName || "Unknown"}</span>
                  </td>
                  <td className="px-6 py-4 text-xs font-semibold text-white">
                    <div className="flex items-center gap-3">
                      <span>Comments: {m.commentCount}</span>
                      <span>Reactions: {m.reactionCount}</span>
                    </div>
                  </td>
                  {/* <td className="px-6 py-4 text-xs text-white/70">{formatDate(m.createdAt)}</td> */}
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        to={`/memories/${m.id}`}
                        className="inline-flex items-center justify-center text-blue-400 hover:text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-colors cursor-pointer"
                        title="View Memory"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                      <Link
                        to={`/memories/${m.id}`}
                        className="inline-flex items-center justify-center text-amber-500 hover:text-amber-700 hover:bg-amber-50 p-2 rounded-lg transition-colors cursor-pointer"
                        title="Edit Memory"
                      >
                        <Pencil className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => deleteMemory(m.id)}
                        className="inline-flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors cursor-pointer"
                        title="Delete Memory"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
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
