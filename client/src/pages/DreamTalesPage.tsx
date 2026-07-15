import React, { useState, useEffect } from "react";
import { Trash2, X, Eye } from "lucide-react";
import { Link } from "react-router-dom";
import { PaginationControls } from "../components/ui/PaginationControls";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { apiFetch, getServerUrl } from "../lib/api";
import avtar from "../public/default.jpg";
import { ImagePreview } from "../components/ImagePreview";
import { useToast } from "@/hooks/use-toast";
import { HeaderDropdown } from "../components/HeaderDropdown";

const isDateInRange = (dateStr: string, range: string) => {
  if (!range) return true;
  if (!dateStr) return false;

  const date = new Date(dateStr);
  const now = new Date();

  const diffTime = now.getTime() - date.getTime();
  const diffDays = diffTime / (1000 * 60 * 60 * 24);

  if (range === "Today") {
    return date.toDateString() === now.toDateString();
  }
  if (range === "Yesterday") {
    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    return date.toDateString() === yesterday.toDateString();
  }
  if (range === "Last 7 Days") {
    return diffDays >= 0 && diffDays <= 7;
  }
  if (range === "Last 30 Days") {
    return diffDays >= 0 && diffDays <= 30;
  }
  return true;
};

export default function DreamTalesPage() {
  const { toast } = useToast();

  const [dreamTales, setDreamTales] = useState<any[]>([]);
  const [babies, setBabies] = useState<any[]>([]);
  const [selectedBabyId, setSelectedBabyId] = useState<string>("");
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Pagination state
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

  const fetchDreamTales = async () => {
    setLoading(true);

    try {
      const hasActiveFilter = !!(selectedBabyId || selectedDateFilter);
      let url = "";
      if (hasActiveFilter) {
        url = "/admin/dream-tales?limit=1000";
      } else {
        url = `/admin/dream-tales?page=${page}&limit=10`;
      }

      const data = await apiFetch<any>(url);
      const fetchedTales = data.data ?? [];

      let filtered = [...fetchedTales];
      if (selectedBabyId) {
        filtered = filtered.filter((d: any) => String(d.babyId || d.baby_id) === String(selectedBabyId));
      }

      if (hasActiveFilter) {
        setTotalRecords(filtered.length);
        setTotalPages(Math.ceil(filtered.length / 10) || 1);
        const startIndex = (page - 1) * 10;
        setDreamTales(filtered.slice(startIndex, startIndex + 10));
      } else {
        setDreamTales(filtered);
        setTotalPages(data.totalPages ?? 1);
        setTotalRecords(data.total ?? 0);
      }
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Failed to load dream tales data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBabies();
  }, []);

  useEffect(() => {
    fetchDreamTales();
  }, [page, selectedBabyId, selectedDateFilter]);

  const handleBabyFilterChange = (val: string) => {
    setSelectedBabyId(val);
    setPage(1);
  };

  const deleteDreamTale = (dreamTaleId: string) => {
    setConfirmingId(dreamTaleId);
    setConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!confirmingId) return;
    try {
      await apiFetch(`/admin/dream-tales/${confirmingId}`, {
        method: "DELETE",
      });
      toast({
        title: "Success",
        description: "Dream Tale deleted successfully.",
      });
      fetchDreamTales();
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete Dream Tale.",
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
        <table className="w-full text-left border-collapse text-sm">
          <thead className="bg-background">
            <tr className="border-b border-border text-xs font-semibold uppercase tracking-wider">
              <th className="px-4 py-4 min-w-[240px]">Tale Details</th>
              <th className="px-4 py-4 min-w-[160px]">Configuration</th>
              <th className="px-4 py-4 min-w-[140px]">
                <div className="flex items-center gap-1 w-full">
                  <HeaderDropdown
                    value={selectedBabyId}
                    onChange={handleBabyFilterChange}
                    placeholder="All Babies"
                    options={[
                      { value: "", label: "All Babies" },
                      ...babies.map((b) => ({ value: String(b.id), label: b.name })),
                    ]}
                  />
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
              </th>
              <th className="px-4 py-4 min-w-[160px]">
                <div className="flex items-center gap-1 w-full">
                  <HeaderDropdown
                    value={selectedDateFilter}
                    onChange={(val) => {
                      setSelectedDateFilter(val);
                      setPage(1);
                    }}
                    placeholder="Created At"
                    options={[
                      { value: "", label: "Created At" },
                      { value: "Today", label: "Today" },
                      { value: "Yesterday", label: "Yesterday" },
                      { value: "Last 7 Days", label: "Last 7 Days" },
                      { value: "Last 30 Days", label: "Last 30 Days" },
                    ]}
                  />
                  {selectedDateFilter && (
                    <button
                      onClick={() => {
                        setSelectedDateFilter("");
                        setPage(1);
                      }}
                      className="w-5 h-5 flex items-center justify-center cursor-pointer shrink-0 transition-transform hover:scale-125"
                      title="Reset filter"
                    >
                      <span className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.7)]" />
                    </button>
                  )}
                </div>
              </th>
              <th className="px-4 py-4 text-right w-[90px]">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-24">
                  <div className="flex flex-col items-center justify-center w-full gap-4">
                    <div className="w-10 h-10 border-4 border-white/10 border-t-[#EBA545] rounded-full animate-spin" />
                    <span className="text-white/60 text-sm font-medium tracking-wide animate-pulse">Loading dream tales...</span>
                  </div>
                </td>
              </tr>
            ) : (
              <>
                {dreamTales.filter(d =>
                  d.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  d.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  d.babyName?.toLowerCase().includes(searchQuery.toLowerCase())
                ).filter(d =>
                  isDateInRange(d.created_at || d.createdAt, selectedDateFilter)
                ).map((d) => (
                  <tr key={d.id} className="hover:bg-muted/70 transition-colors">
                    {/* Tale Details + Creator merged */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <ImagePreview src={d.coverImageUrl ? `${getServerUrl()}${d.coverImageUrl}` : avtar} alt={d.title || "Dream Tale"}>
                          <img
                            src={d.coverImageUrl ? `${getServerUrl()}${d.coverImageUrl}` : avtar}
                            alt={d.title || "Dream Tale"}
                            className="w-12 h-12 rounded-lg object-cover border border-border shrink-0"
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = avtar;
                            }}
                          />
                        </ImagePreview>

                        <div className="min-w-0">
                          <div className="font-semibold text-white line-clamp-1">
                            {d.title}
                          </div>
                          <div className="mt-0.5 flex items-center flex-wrap gap-2 text-xs text-white">
                            {d.userName && <span>{d.userName}</span>}
                            {d.isFavorite && <span className="text-amber-400 font-semibold">★</span>}
                            {d.durationSeconds && (
                              <span>{Math.floor(d.durationSeconds / 60)}m {d.durationSeconds % 60}s</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Configuration */}
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1 text-xs text-white">
                        {d.storyStyle && <span>Style: <span className="text-white font-medium">{d.storyStyle}</span></span>}
                        {d.voiceName && <span>Voice: <span className="text-white font-medium">{d.voiceName}</span></span>}
                        {d.language && <span>Lang: <span className="text-white font-medium">{d.language}</span></span>}
                      </div>
                    </td>

                    {/* Baby */}
                    <td className="px-4 py-3">
                      <div className="font-medium text-white text-sm">{d.babyName || "—"}</div>
                    </td>

                    {/* Generated At */}
                    <td className="px-4 py-3 text-xs text-white">{formatDate(d.created_at || d.createdAt)}</td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          to={`/dream-tales/${d.id}`}
                          className="inline-flex items-center justify-center text-blue-400 hover:text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-colors cursor-pointer"
                          title="View Dream Tale"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => deleteDreamTale(d.id)}
                          className="inline-flex items-center justify-center text-red-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors cursor-pointer"
                          title="Delete Dream Tale"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {dreamTales.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-white">
                      No dream tales found.
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
