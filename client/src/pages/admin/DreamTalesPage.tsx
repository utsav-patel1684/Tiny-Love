import React, { useState, useEffect } from "react";
import { Trash2, X } from "lucide-react";
import { PaginationControls } from "../../components/ui/PaginationControls";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { apiFetch, getServerUrl } from "../../lib/api";

export default function DreamTalesPage() {

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
      const data = await apiFetch<any>(
        `/dream-tales?page=${page}&limit=10`
      );

      setDreamTales(data.data ?? []);
      setTotalPages(data.totalPages ?? 1);
      setTotalRecords(data.total ?? 0);
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
  }, [page]);

  const deleteDreamTale = (dreamTaleId: string) => {
    setConfirmingId(dreamTaleId);
    setConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!confirmingId) return;
    try {
      await apiFetch(`/dream-tales/${confirmingId}`, {
        method: "DELETE",
      });
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
    <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden animate-fadeIn">
      <div className="p-6 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-4 bg-muted/50">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search dream tales..."
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
          <span className="text-sm font-medium">Loading dream tales...</span>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-muted/30 border-b border-border text-xs font-semibold uppercase tracking-wider">
                <th className="px-6 py-4">Tale Details</th>
                <th className="px-6 py-4">Configuration</th>
                <th className="px-6 py-4">Associated Baby</th>
                <th className="px-6 py-4">Created By</th>
                <th className="px-6 py-4">Generated At</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {dreamTales.filter(d =>
                d.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                d.userName?.toLowerCase().includes(searchQuery.toLowerCase())
              ).map((d) => (
                <tr key={d.id} className="hover:bg-muted/70 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <img
                        src={`${getServerUrl()}${d.coverImageUrl}`}
                        alt={d.title}
                        className="w-16 h-16 rounded-lg object-cover border border-border shrink-0"
                        onError={(e) => {
                          e.currentTarget.src = "/placeholder-image.png";
                        }}
                      />

                      <div className="min-w-0">
                        <div className="font-semibold text-white line-clamp-2">
                          {d.title}
                        </div>

                        <div className="mt-1 flex items-center gap-2 text-xs text-white/70">
                          {d.isFavorite && (
                            <span className="text-amber-400 font-semibold">
                              ★ Favorite
                            </span>
                          )}

                          {d.durationSeconds && (
                            <span>
                              {Math.floor(d.durationSeconds / 60)}m{" "}
                              {d.durationSeconds % 60}s
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-white/70">Style: <span className="font-medium text-white">{d.storyStyle}</span></span>
                      <span className="text-xs text-white/70">Voice: <span className="font-medium text-white">{d.voiceName}</span></span>
                      <span className="text-xs text-white/70">Language: <span className="font-medium text-white">{d.language}</span></span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-white">{d.babyName}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white">{d.userName}</span>
                      <span className="text-xs text-white/70">({d.userEmail})</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs text-white/70">{formatDate(d.createdAt)}</td>
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
                  <td colSpan={6} className="px-6 py-8 text-center text-white/70">
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
