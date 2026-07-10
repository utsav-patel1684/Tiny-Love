import React, { useState, useEffect } from "react";
import { Trash2, X } from "lucide-react";
import { PaginationControls } from "../components/ui/PaginationControls";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { apiFetch } from "../lib/api";

export default function ReactionsPage() {
  const [reactions, setReactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const fetchReactions = async () => {
    setLoading(true);
    try {
      const data = await apiFetch<any>(`/admin/reactions?page=${page}&limit=10`);
      setReactions(data.data ?? []);
      setTotalPages(data.totalPages ?? 1);
      setTotalRecords(data.total ?? 0);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Failed to load reactions data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReactions();
  }, [page]);

  const deleteReaction = (id: string) => {
    setConfirmingId(id);
    setConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!confirmingId) return;
    try {
      await apiFetch(`/admin/reactions/${confirmingId}`, { method: "DELETE" });
      alert("Reaction deleted successfully.");
      fetchReactions();
    } catch {
      alert("Failed to delete reaction.");
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
            placeholder="Search by Emoji..."
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
        <div className="flex flex-col items-center justify-center py-24 w-full gap-4">
          <div className="w-10 h-10 border-4 border-white/10 border-t-[#EBA545] rounded-full animate-spin" />
          <span className="text-white/60 text-sm font-medium tracking-wide animate-pulse">Loading reactions...</span>
        </div>
      ) : (
        <div className="overflow-x-auto overflow-y-hidden w-full">
          <table className="w-full min-w-[800px] text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-border text-xs font-semibold uppercase tracking-wider">
                <th className="px-6 py-4">ID</th>
                <th className="px-6 py-4">Memory ID</th>
                <th className="px-6 py-4">User ID</th>
                <th className="px-6 py-4">Emoji</th>
                <th className="px-6 py-4">Created At</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {reactions.filter(r =>
                r.emoji?.toLowerCase().includes(searchQuery.toLowerCase())
              ).map((r) => (
                <tr key={r.id} className="hover:bg-muted/70 transition-colors">
                  <td className="px-6 py-4">
                    <span className="font-mono text-xs text-white/70">{r.id?.slice(0,8)}...</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-mono text-xs text-white/70">{r.memory_id?.slice(0,8)}...</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-mono text-xs text-white/70">{r.user_id?.slice(0,8)}...</span>
                  </td>
                  <td className="px-6 py-4 text-xl">
                    {r.emoji || "❤️"}
                  </td>
                  <td className="px-6 py-4 text-xs text-white/70">
                    {formatDate(r.created_at)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => deleteReaction(r.id)}
                      className="text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors cursor-pointer"
                      title="Delete Reaction"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {reactions.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-white/70">
                    No reactions found.
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
        title="Delete Reaction"
        description="Are you sure you want to delete this reaction?"
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
