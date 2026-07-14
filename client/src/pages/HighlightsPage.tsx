import React, { useState, useEffect } from "react";
import { Trash2, X, ExternalLink } from "lucide-react";
import { PaginationControls } from "../components/ui/PaginationControls";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { apiFetch } from "../lib/api";
import { useToast } from "@/hooks/use-toast";

export default function HighlightsPage() {
  const { toast } = useToast();
  const [highlights, setHighlights] = useState<any[]>([]);
  const [babies, setBabies] = useState<any[]>([]);
  const [selectedBabyId, setSelectedBabyId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const loadBabies = async () => {
    try {
      const data = await apiFetch<any>("/admin/babies?limit=1000");
      setBabies(data.data ?? []);
    } catch (err) {
      console.error("Failed to load babies for filter", err);
    }
  };

  const fetchHighlights = async () => {
    setLoading(true);
    try {
      if (selectedBabyId) {
        const data = await apiFetch<any>("/admin/highlights?limit=1000");
        const allHighlights = data.data ?? [];
        const filtered = allHighlights.filter((h: any) => String(h.baby_id || h.babyId) === String(selectedBabyId));
        setTotalRecords(filtered.length);
        setTotalPages(Math.ceil(filtered.length / 10) || 1);
        const startIndex = (page - 1) * 10;
        setHighlights(filtered.slice(startIndex, startIndex + 10));
      } else {
        const data = await apiFetch<any>(`/admin/highlights?page=${page}&limit=10`);
        setHighlights(data.data ?? []);
        setTotalPages(data.totalPages ?? 1);
        setTotalRecords(data.total ?? 0);
      }
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Failed to load highlights data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBabies();
  }, []);

  useEffect(() => {
    fetchHighlights();
  }, [page, selectedBabyId]);

  const handleBabyFilterChange = (val: string) => {
    setSelectedBabyId(val);
    setPage(1);
  };

  const deleteHighlight = (id: string) => {
    setConfirmingId(id);
    setConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!confirmingId) return;
    try {
      await apiFetch(`/admin/highlights/${confirmingId}`, { method: "DELETE" });
      toast({
        title: "Success",
        description: "Highlight deleted successfully.",
      });
      fetchHighlights();
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete highlight.",
      });
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
            placeholder="Search by Name..."
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

      <div className="overflow-x-auto overflow-y-hidden w-full">
        <table className="w-full min-w-[800px] text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-border text-xs font-semibold uppercase tracking-wider">
              <th className="px-6 py-4 min-w-[150px]">ID</th>
              <th className="px-6 py-4 min-w-[180px]">
                <div className="flex flex-col gap-1.5 w-full normal-case">
                  <span className="font-semibold uppercase tracking-wider">Baby ID</span>
                  <div className="flex items-center gap-1 w-full">
                    <select
                      value={selectedBabyId}
                      onChange={(e) => handleBabyFilterChange(e.target.value)}
                      className="block w-full bg-background text-white/90 border border-border rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-[#EBA545] cursor-pointer hover:border-[#EBA545]/50 transition-colors font-normal"
                    >
                      <option value="" className="bg-card">All Babies</option>
                      {babies.map((b) => (
                        <option key={b.id} value={b.id} className="bg-card">
                          {b.name}
                        </option>
                      ))}
                    </select>
                    {selectedBabyId && (
                      <button
                        onClick={() => handleBabyFilterChange("")}
                        className="w-5 h-5 flex items-center justify-center cursor-pointer shrink-0 transition-transform hover:scale-125"
                        title="Reset filter"
                      >
                        <span className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.7)]" />
                      </button>
                    )}
                  </div>
                </div>
              </th>
              <th className="px-6 py-4 min-w-[180px]">Name</th>
              <th className="px-6 py-4 min-w-[120px]">Cover</th>
              <th className="px-6 py-4 min-w-[180px]">Created At</th>
              <th className="px-6 py-4 text-right w-[100px]">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-24">
                  <div className="flex flex-col items-center justify-center w-full gap-4">
                    <div className="w-10 h-10 border-4 border-white/10 border-t-[#EBA545] rounded-full animate-spin" />
                    <span className="text-white/60 text-sm font-medium tracking-wide animate-pulse">Loading highlights...</span>
                  </div>
                </td>
              </tr>
            ) : (
              <>
                {highlights.filter(h =>
                  h.name?.toLowerCase().includes(searchQuery.toLowerCase())
                ).map((h) => (
                  <tr key={h.id} className="hover:bg-muted/70 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs text-white/70">{h.id?.slice(0,8)}...</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs text-white/70">{h.baby_id?.slice(0,8)}...</span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-white">
                      {h.name}
                    </td>
                    <td className="px-6 py-4">
                      {h.cover_url ? (
                        <a href={h.cover_url} target="_blank" rel="noreferrer" className="text-white/70 hover:text-white flex items-center gap-1 text-xs">
                          View <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        <span className="text-white/50 text-xs">No Cover</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs text-white/70">
                      {formatDate(h.created_at)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => deleteHighlight(h.id)}
                        className="text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors cursor-pointer"
                        title="Delete Highlight"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {highlights.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-white/70">
                      No highlights found.
                    </td>
                  </tr>
                )}
              </>
            )}
          </tbody>
        </table>
      </div>

      <PaginationControls
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />

      <ConfirmDialog
        open={confirmOpen}
        title="Delete Highlight"
        description="Are you sure you want to delete this highlight?"
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
