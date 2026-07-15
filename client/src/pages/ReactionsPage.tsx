import React, { useState, useEffect } from "react";
import { Trash2, X, Eye, Loader2 } from "lucide-react";
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

export default function ReactionsPage() {
  const { toast } = useToast();
  const [reactions, setReactions] = useState<any[]>([]);
  const [allReactions, setAllReactions] = useState<any[]>([]);
  const [selectedLikeRange, setSelectedLikeRange] = useState<string>("");
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  // Memory Detail Modal States
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedMemory, setSelectedMemory] = useState<any>(null);
  const [selectedMemoryId, setSelectedMemoryId] = useState<string | null>(null);

  const handleViewDetails = async (reaction: any) => {
    setSelectedMemoryId(reaction.memory_id);
    setSelectedMemory(null);
    setDetailLoading(true);
    setDetailModalOpen(true);
    try {
      const data = await apiFetch<any>(`/admin/memories/${reaction.memory_id}`);
      setSelectedMemory(data);
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "Failed to load memory details.",
      });
      setDetailModalOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const loadAllReactions = async () => {
    try {
      const data = await apiFetch<any>("/admin/reactions?limit=1000");
      const allData = data.data ?? [];
      setAllReactions(allData);
    } catch (err) {
      console.error("Failed to load all reactions", err);
    }
  };

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
    loadAllReactions();
  }, []);

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
      toast({
        title: "Success",
        description: "Reaction deleted successfully.",
      });
      fetchReactions();
      loadAllReactions();
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete reaction.",
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

      <div className="overflow-x-auto overflow-y-hidden w-full">
        <table className="w-full min-w-[800px] text-left border-collapse text-sm">
          <thead className="bg-background">
            <tr className="border-b border-border text-xs font-semibold uppercase tracking-wider">
              <th className="px-6 py-4 min-w-[280px]">Memory Caption</th>
              <th className="px-6 py-4 min-w-[220px]">Reacted By</th>
              <th className="px-6 py-4 min-w-[160px]">
                <div className="flex items-center gap-1 w-full">
                  <HeaderDropdown
                    value={selectedLikeRange}
                    onChange={(val) => {
                      setSelectedLikeRange(val);
                      setPage(1);
                    }}
                    placeholder="Likes"
                    options={[
                      { value: "", label: "Likes" },
                      { value: "1-2", label: "1-2" },
                      { value: "3-5", label: "3-5" },
                      { value: "5+", label: "5+" },
                    ]}
                  />
                  {selectedLikeRange && (
                    <button
                      onClick={() => {
                        setSelectedLikeRange("");
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
                <td colSpan={5} className="px-6 py-24">
                  <div className="flex flex-col items-center justify-center w-full gap-4">
                    <div className="w-10 h-10 border-4 border-white/10 border-t-[#EBA545] rounded-full animate-spin" />
                    <span className="text-white/60 text-sm font-medium tracking-wide animate-pulse">Loading reactions...</span>
                  </div>
                </td>
              </tr>
            ) : (
              <>
                {(() => {
                  const filteredList = reactions.filter(r =>
                  (r.emoji?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    r.memoryCaption?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    r.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    r.userEmail?.toLowerCase().includes(searchQuery.toLowerCase()))
                  );

                  const seenMemoryIds = new Set<string>();
                  const uniquePageReactions = filteredList.filter(r => {
                    if (!r.memory_id) return true;
                    if (seenMemoryIds.has(r.memory_id)) return false;
                    seenMemoryIds.add(r.memory_id);
                    return true;
                  });

                  const rangeFilteredReactions = uniquePageReactions.filter(r => {
                    if (!selectedLikeRange) return true;
                    const memoryReactions = allReactions.filter(x => x.memory_id === r.memory_id);
                    const count = memoryReactions.length;
                    if (selectedLikeRange === "1-2") return count >= 1 && count <= 2;
                    if (selectedLikeRange === "3-5") return count >= 3 && count <= 5;
                    if (selectedLikeRange === "5+") return count >= 5;
                    return true;
                  });

                  const dateFilteredReactions = rangeFilteredReactions.filter(r => {
                    return isDateInRange(r.created_at, selectedDateFilter);
                  });

                  return dateFilteredReactions.map((r) => {
                    const memoryReactions = allReactions.filter(x => x.memory_id === r.memory_id);
                    const reactionCount = memoryReactions.length || 1;

                    let reactedByText = r.userName || "Unknown";
                    if (reactionCount > 1) {
                      const otherNames = Array.from(new Set(memoryReactions.map(x => x.userName).filter(Boolean))) as string[];
                      if (otherNames.length > 1) {
                        reactedByText = `${otherNames[0]} and ${otherNames.length - 1} other${otherNames.length - 1 > 1 ? "s" : ""}`;
                      } else {
                        reactedByText = `${r.userName || "Unknown"} and ${reactionCount - 1} other${reactionCount - 1 > 1 ? "s" : ""}`;
                      }
                    }

                    return (
                      <tr key={r.id} className="hover:bg-muted/70 transition-colors">
                        <td className="px-6 py-4 max-w-xs">
                          <div className="font-semibold text-white truncate" title={r.memoryCaption}>
                            {r.memoryCaption || <span className="text-white/40 italic">No caption</span>}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-semibold text-white">{reactedByText}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center justify-center px-2 py-0.5 rounded text-[13px] font-bold bg-[#EBA545] text-white">
                            {reactionCount}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs text-white">
                          {formatDate(r.created_at)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleViewDetails(r)}
                              className="text-blue-400 hover:text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-colors cursor-pointer"
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => deleteReaction(r.id)}
                              className="text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors cursor-pointer"
                              title="Delete Reaction"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  });
                })()}
                {reactions.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-white/70">
                      No reactions found.
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

      {/* Memory Details Modal */}
      {detailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-card border border-border w-full max-w-lg rounded-xl shadow-2xl overflow-hidden animate-scaleUp">
            {/* Header */}
            <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-background">
              <h3 className="text-base font-semibold text-white">Memory Details & Reactions</h3>
              <button
                onClick={() => setDetailModalOpen(false)}
                className="text-white/60 hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto dropdown-scrollbar">
              {detailLoading ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <Loader2 className="h-8 w-8 text-[#EBA545] animate-spin" />
                  <span className="text-sm text-white/60 font-medium">Fetching details...</span>
                </div>
              ) : selectedMemory ? (
                <div className="space-y-4">
                  {/* Media */}
                  {(selectedMemory.media_url || selectedMemory.thumbnail_url) && (
                    <div className="relative rounded-lg overflow-hidden border border-border bg-black/10 flex justify-center items-center p-2">
                      {(() => {
                        const getFullUrl = (raw: string) => raw.startsWith('http') ? raw : `${getServerUrl()}${raw.startsWith('/') ? '' : '/'}${raw}`;
                        const mediaUrl = selectedMemory.media_url ? getFullUrl(selectedMemory.media_url) : "";
                        const thumbUrl = selectedMemory.thumbnail_url ? getFullUrl(selectedMemory.thumbnail_url) : "";
                        const type = selectedMemory.type || "";
                        const lowerUrl = mediaUrl.toLowerCase();

                        const isVid = type === "video" || lowerUrl.match(/\.(mp4|webm|ogg|mov)$/i);
                        const isAud = type === "voice" || type === "audio" || lowerUrl.match(/\.(mp3|wav|m4a|aac)$/i);

                        if (isVid) {
                          return <video src={mediaUrl} poster={thumbUrl || undefined} controls className="w-full max-h-56 object-contain rounded" />;
                        } else if (isAud) {
                          return <audio src={mediaUrl} controls className="w-full" />;
                        } else {
                          return <img src={mediaUrl || thumbUrl} alt="Memory attachment" className="w-full max-h-56 object-contain rounded" />;
                        }
                      })()}
                    </div>
                  )}

                  {/* Caption & Metadata */}
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-white/90">
                      {selectedMemory.caption || <span className="text-white/40 italic">No caption</span>}
                    </p>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="bg-white/5 border border-border px-2 py-0.5 rounded-full text-white/60">
                        Baby: <span className="text-white font-medium">{selectedMemory.babyName || "Unknown"}</span>
                      </span>
                      <span className="bg-white/5 border border-border px-2 py-0.5 rounded-full text-white/60">
                        Category: <span className="text-white font-medium capitalize">{selectedMemory.category || "everyday"}</span>
                      </span>
                      <span className="bg-white/5 border border-border px-2 py-0.5 rounded-full text-white/60">
                        Visibility: <span className="text-white font-medium capitalize">{selectedMemory.visibility || "family"}</span>
                      </span>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="h-px bg-border my-4" />

                  {/* Reactions List */}
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-white/50 mb-2">
                      Reactions ({allReactions.filter(x => x.memory_id === selectedMemoryId).length})
                    </h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto dropdown-scrollbar pr-1">
                      {allReactions
                        .filter(x => x.memory_id === selectedMemoryId)
                        .map((mr) => (
                          <div
                            key={mr.id}
                            className="flex items-center justify-between p-3 rounded-lg bg-background border border-border"
                          >
                            <div className="flex flex-col">
                              <span className="text-sm font-semibold text-white">{mr.userName || "Unknown"}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-[11px] text-white/50">{formatDate(mr.created_at)}</span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-sm text-white/50">
                  Failed to load memory details.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
