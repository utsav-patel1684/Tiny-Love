import React, { useState, useEffect } from "react";
import { Trash2, ExternalLink, X, Eye, Pencil } from "lucide-react";
import { Link } from "react-router-dom";
import { PaginationControls } from "../components/ui/PaginationControls";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { apiFetch, getServerUrl } from "../lib/api";
import { useToast } from "@/hooks/use-toast";
import { ImagePreview } from "../components/ImagePreview";
import { HeaderDropdown } from "../components/HeaderDropdown";

export default function MemoriesPage() {
  const { toast } = useToast();
  const [memories, setMemories] = useState<any[]>([]);
  const [babies, setBabies] = useState<any[]>([]);
  const [selectedBabyId, setSelectedBabyId] = useState<string>("");
  const [selectedType, setSelectedType] = useState<string>("");
  const [selectedDateRange, setSelectedDateRange] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Pagination state
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const fetchBabies = async () => {
    try {
      const data = await apiFetch<any>("/admin/babies?limit=1000");
      setBabies(data.data ?? []);
    } catch (err) {
      console.error("Failed to load babies for filter:", err);
    }
  };

  const fetchMemories = async () => {
    setLoading(true);

    try {
      const hasActiveFilter = !!(selectedBabyId || selectedType || selectedDateRange);

      if (hasActiveFilter) {
        // Fetch all memories to filter client-side (since the backend does not support filtering natively on this route)
        const data = await apiFetch<any>("/admin/memories?limit=1000");
        let filtered = data.data ?? [];

        // Filter memories for the selected baby
        if (selectedBabyId) {
          filtered = filtered.filter((m: any) =>
            String(m.babyId || m.baby_id) === String(selectedBabyId)
          );
        }

        // Filter memories for the selected type
        if (selectedType) {
          filtered = filtered.filter((m: any) =>
            String(m.type).toLowerCase() === selectedType.toLowerCase()
          );
        }

        // Filter memories for the selected date range
        if (selectedDateRange) {
          const now = new Date();
          let cutoffDate: Date | null = null;

          if (selectedDateRange === "week") {
            cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          } else if (selectedDateRange === "month") {
            cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          }

          if (cutoffDate) {
            filtered = filtered.filter((m: any) => {
              const createdStr = m.created_at || m.createdAt;
              if (!createdStr) return false;
              const createdDate = new Date(createdStr);
              return createdDate >= cutoffDate!;
            });
          }
        }

        setTotalRecords(filtered.length);
        setTotalPages(Math.ceil(filtered.length / 10) || 1);

        // Slice for the current page
        const startIndex = (page - 1) * 10;
        setMemories(filtered.slice(startIndex, startIndex + 10));
      } else {
        // Default paginated fetch
        const data = await apiFetch<any>(
          `/admin/memories?page=${page}&limit=10`
        );
        setMemories(data.data ?? []);
        setTotalPages(data.totalPages ?? 1);
        setTotalRecords(data.total ?? 0);
      }
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Failed to load memories data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBabies();
  }, []);

  useEffect(() => {
    fetchMemories();
  }, [page, selectedBabyId, selectedType, selectedDateRange]);

  const handleBabyFilterChange = (babyId: string) => {
    setSelectedBabyId(babyId);
    setPage(1);
  };

  const handleTypeFilterChange = (type: string) => {
    setSelectedType(type);
    setPage(1);
  };

  const handleDateRangeFilterChange = (range: string) => {
    setSelectedDateRange(range);
    setPage(1);
  };

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
      toast({
        title: "Success",
        description: "Memory deleted successfully.",
      });
      fetchMemories();
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete memory.",
        variant: "destructive"
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

      <div className="overflow-x-auto overflow-y-hidden w-full">
        <table className="w-full min-w-[800px] text-left border-collapse text-sm">
          <thead className="bg-background">
            <tr className="border-b border-border text-xs font-semibold uppercase tracking-wider">
              <th className="px-6 py-4 min-w-[280px]">Memory Description</th>
              <th className="px-6 py-4 min-w-[150px]">
                <div className="flex items-center gap-1 w-full">
                  <HeaderDropdown
                    value={selectedType}
                    onChange={handleTypeFilterChange}
                    placeholder="All Types"
                    options={[
                      { value: "", label: "All Types" },
                      { value: "photo", label: "Photo" },
                      { value: "video", label: "Video" },
                      { value: "audio", label: "Audio" },
                      { value: "text", label: "Text" },
                    ]}
                  />
                  {selectedType && (
                    <button
                      onClick={() => handleTypeFilterChange("")}
                      className="w-5 h-5 flex items-center justify-center cursor-pointer shrink-0 transition-transform hover:scale-125"
                      title="Reset filter"
                    >
                      <span className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.7)]" />
                    </button>
                  )}
                </div>
              </th>
              <th className="px-6 py-4 min-w-[150px]">Owner</th>
              <th className="px-6 py-4 min-w-[150px]">
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
              <th className="px-6 py-4 min-w-[180px]">
                <div className="flex items-center gap-1 w-full">
                  <HeaderDropdown
                    value={selectedDateRange}
                    onChange={handleDateRangeFilterChange}
                    placeholder="Created At"
                    options={[
                      { value: "", label: "Created At " },
                      { value: "week", label: "Last Week" },
                      { value: "month", label: "Last Month" },
                    ]}
                  />
                  {selectedDateRange && (
                    <button
                      onClick={() => handleDateRangeFilterChange("")}
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
                    <span className="text-white/60 text-sm font-medium tracking-wide animate-pulse">Loading memories...</span>
                  </div>
                </td>
              </tr>
            ) : (
              <>
                {memories.filter(m =>
                  m.caption?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  m.uploaderEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  m.uploaderName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  m.babyName?.toLowerCase().includes(searchQuery.toLowerCase())
                ).map((m) => (
                  <tr key={m.id} className="hover:bg-muted/70 transition-colors">
                    <td className="px-6 py-4 max-w-xs">
                      <div className="font-semibold text-white truncate" title={m.caption}>
                        {m.caption || <span className="a text-white">No caption</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className={`inline-block px-2 py-0.5 rounded text-[13px] font-bold ${m.type === "photo" ? "bg-white/10 text-white" :
                          m.type === "video" ? "bg-white/10 text-white" :
                            "bg-white/10 text-white"
                          }`}>
                          {m.type}
                        </span>
                        {m.mediaUrl && (
                          <div className="mt-2 flex items-center gap-2">
                            {(() => {
                              const rawUrl = m.mediaUrl;
                              const url = rawUrl.startsWith('http') ? rawUrl : `${getServerUrl()}${rawUrl.startsWith('/') ? '' : '/'}${rawUrl}`;
                              const type = m.type || "";
                              const lowerUrl = url.toLowerCase();

                              const isVid = type === "video" || lowerUrl.match(/\.(mp4|webm|ogg|mov)$/i);
                              const isAud = type === "audio" || lowerUrl.match(/\.(mp3|wav|m4a)$/i);
                              const isImg = type === "photo" || type === "image" || lowerUrl.match(/\.(jpeg|jpg|gif|png|webp)$/i);

                              if (isVid) {
                                return <video src={url} controls className="w-32 rounded bg-black/20" preload="none" />;
                              } else if (isAud) {
                                return <audio src={url} controls className="w-32 h-8" preload="none" />;
                              } else if (isImg) {
                                return (
                                  <ImagePreview src={url} alt="memory preview">
                                    <img src={url} alt="memory preview" className="w-12 h-12 object-cover rounded border border-white/20" />
                                  </ImagePreview>
                                );
                              } else {
                                return <video src={url} controls className="w-32 rounded bg-black/20" preload="none" />;
                              }
                            })()}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-row ">
                        <span className="font-semibold text-white">{m.uploaderName || "Unknown"}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-white">{m.babyName || "Unknown"}</span>
                    </td>
                    <td className="px-6 py-4 text-xs text-white">{formatDate(m.created_at || m.createdAt)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/memories/${m.id}?mode=view`}
                          className="inline-flex items-center justify-center text-blue-400 hover:text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-colors cursor-pointer"
                          title="View Memory"
                        >
                          <Eye className="h-4 w-4" />
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
