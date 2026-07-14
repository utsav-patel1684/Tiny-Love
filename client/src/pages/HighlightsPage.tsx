import React, { useState, useEffect } from "react";
import { Trash2, X, ExternalLink } from "lucide-react";
import { PaginationControls } from "../components/ui/PaginationControls";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { apiFetch, getServerUrl } from "../lib/api";
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

export default function HighlightsPage() {
  const { toast } = useToast();
  const [highlights, setHighlights] = useState<any[]>([]);
  const [babies, setBabies] = useState<any[]>([]);
  const [selectedBabyId, setSelectedBabyId] = useState<string>("");
  const [selectedMemoryRange, setSelectedMemoryRange] = useState<string>("");
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const fetchBabies = async () => {
    try {
      const res = await apiFetch<any>("/admin/babies?limit=1000");
      if (res && res.data) {
        setBabies(res.data);
      }
    } catch (err: any) {
      console.error("Error fetching babies:", err);
    }
  };

  const fetchHighlights = async () => {
    setLoading(true);
    setError(null);
    try {
      const hasActiveFilter = !!(selectedBabyId || selectedMemoryRange || selectedDateFilter);
      let url = "";
      if (hasActiveFilter) {
        url = "/admin/highlights?limit=1000";
      } else {
        url = `/admin/highlights?page=${page}&limit=10`;
      }
      const res = await apiFetch<any>(url);
      if (res && res.data) {
        let filtered = [...res.data];
        if (selectedBabyId) {
          filtered = filtered.filter((h: any) => String(h.baby_id || h.babyId) === String(selectedBabyId));
        }
        if (selectedMemoryRange) {
          filtered = filtered.filter((h: any) => {
            const count = h.itemCount || 0;
            if (selectedMemoryRange === "1-2") return count >= 1 && count <= 2;
            if (selectedMemoryRange === "3-5") return count >= 3 && count <= 5;
            if (selectedMemoryRange === "5+") return count >= 5;
            return true;
          });
        }

        if (hasActiveFilter) {
          setTotalRecords(filtered.length);
          setTotalPages(Math.ceil(filtered.length / 10) || 1);
          const startIndex = (page - 1) * 10;
          setHighlights(filtered.slice(startIndex, startIndex + 10));
        } else {
          setHighlights(filtered);
          setTotalPages(res.totalPages || 1);
          setTotalRecords(res.total || 0);
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch highlights");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBabies();
  }, []);

  useEffect(() => {
    fetchHighlights();
  }, [page, selectedBabyId, selectedMemoryRange, selectedDateFilter]);

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
      await apiFetch<any>(`/admin/highlights/${confirmingId}`, { method: "DELETE" });
      toast({
        title: "Success",
        description: "Highlight deleted successfully",
      });
      fetchHighlights();
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "Failed to delete highlight.",
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
            placeholder="Search highlights..."
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
          <thead className="bg-background">
            <tr className="border-b border-border text-xs font-semibold uppercase tracking-wider">
              <th className="px-6 py-4 min-w-[200px]">Name</th>
              <th className="px-6 py-4 min-w-[180px]">
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
              <th className="px-6 py-4 min-w-[160px]">
                <div className="flex items-center gap-1 w-full">
                  <HeaderDropdown
                    value={selectedMemoryRange}
                    onChange={(val) => {
                      setSelectedMemoryRange(val);
                      setPage(1);
                    }}
                    placeholder="All Ranges"
                    options={[
                      { value: "", label: "All Ranges" },
                      { value: "1-2", label: "1-2" },
                      { value: "3-5", label: "3-5" },
                      { value: "5+", label: "5+" },
                    ]}
                  />
                  {selectedMemoryRange && (
                    <button
                      onClick={() => {
                        setSelectedMemoryRange("");
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
              <th className="px-6 py-4 min-w-[120px]">Cover</th>
              <th className="px-6 py-4 min-w-[200px]">
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
                  h.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  h.babyName?.toLowerCase().includes(searchQuery.toLowerCase())
                ).filter(h => {
                  if (!selectedMemoryRange) return true;
                  const count = h.itemCount || 0;
                  if (selectedMemoryRange === "1-2") return count >= 1 && count <= 2;
                  if (selectedMemoryRange === "3-5") return count >= 3 && count <= 5;
                  if (selectedMemoryRange === "5+") return count >= 5;
                  return true;
                }).filter(h =>
                  isDateInRange(h.created_at || h.createdAt, selectedDateFilter)
                ).map((h) => (
                  <tr key={h.id} className="hover:bg-muted/70 transition-colors">
                    <td className="px-6 py-4 font-semibold text-white">
                      {h.name}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-white">{h.babyName || "Unknown"}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-white/90">{h.itemCount || 0}</span>
                    </td>
                    <td className="px-6 py-4">
                      {h.cover_url ? (
                        <div className="relative group cursor-pointer w-10 h-10 rounded-lg overflow-hidden border border-border bg-black/10">
                          <img
                            src={`${getServerUrl()}${h.cover_url.startsWith("/") ? "" : "/"}${h.cover_url}`}
                            alt={h.name}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                            onClick={() => {
                              window.open(`${getServerUrl()}${h.cover_url.startsWith("/") ? "" : "/"}${h.cover_url}`, "_blank");
                            }}
                          />
                        </div>
                      ) : (
                        <span className="text-white/50 text-xs">No Cover</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs text-white">
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
