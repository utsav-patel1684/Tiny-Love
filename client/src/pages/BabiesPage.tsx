import React, { useState, useEffect } from "react";
import { Trash2, X, Eye, Pencil } from "lucide-react";
import { Link } from "react-router-dom";
import { PaginationControls } from "../components/ui/PaginationControls";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { apiFetch } from "../lib/api";
import avtar from "../public/default.jpg";
import { ImagePreview } from "../components/ImagePreview";
import { useToast } from "@/hooks/use-toast";
import { HeaderDropdown } from "../components/HeaderDropdown";

export default function BabiesPage() {
  const { toast } = useToast();

  const [babies, setBabies] = useState<any[]>([]);
  const [parents, setParents] = useState<any[]>([]);
  const [selectedParentId, setSelectedParentId] = useState<string>("");
  const [selectedMemoryRange, setSelectedMemoryRange] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Pagination state
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const loadParents = async () => {
    try {
      const data = await apiFetch<any>("/admin/users?limit=1000");
      setParents(data.data ?? []);
    } catch (err) {
      console.error("Failed to load users for filter", err);
    }
  };

  const fetchBabies = async () => {
    setLoading(true);

    try {
      const hasActiveFilter = !!(selectedParentId || selectedMemoryRange);

      if (hasActiveFilter) {
        const data = await apiFetch<any>("/admin/babies?limit=1000");
        const allBabies = data.data ?? [];
        
        let filtered = allBabies;
        if (selectedParentId) {
          filtered = filtered.filter((b: any) => String(b.userId || b.user_id) === String(selectedParentId));
        }

        if (selectedMemoryRange) {
          filtered = filtered.filter((b: any) => {
            const count = Number(b.memoryCount || 0);
            if (selectedMemoryRange === "1-5") {
              return count >= 1 && count <= 5;
            } else if (selectedMemoryRange === "6-10") {
              return count >= 6 && count <= 10;
            } else if (selectedMemoryRange === "11-20") {
              return count >= 11 && count <= 20;
            } else if (selectedMemoryRange === "20+") {
              return count > 20;
            }
            return true;
          });
        }

        setTotalRecords(filtered.length);
        setTotalPages(Math.ceil(filtered.length / 10) || 1);
        const startIndex = (page - 1) * 10;
        setBabies(filtered.slice(startIndex, startIndex + 10));
      } else {
        const data = await apiFetch<any>(
          `/admin/babies?page=${page}&limit=10`
        );
        setBabies(data.data ?? []);
        setTotalPages(data.totalPages ?? 1);
        setTotalRecords(data.total ?? 0);
      }
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Failed to load babies data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadParents();
  }, []);

  useEffect(() => {
    fetchBabies();
  }, [page, selectedParentId, selectedMemoryRange]);

  const handleParentFilterChange = (val: string) => {
    setSelectedParentId(val);
    setPage(1);
  };

  const handleMemoryRangeFilterChange = (val: string) => {
    setSelectedMemoryRange(val);
    setPage(1);
  };

  const deleteBaby = (babyId: string) => {
    setConfirmingId(babyId);
    setConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!confirmingId) return;
    try {
      await apiFetch(`/admin/babies/${confirmingId}`, {
        method: "DELETE",
      });
      toast({
        title: "Success",
        description: "Baby profile deleted successfully.",
      });
      fetchBabies();
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete baby profile.",
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
      {/* Table search & filter header */}
      <div className="p-4 md:p-6 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative text-white flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search babies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-4 pr-10 py-2 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary text-sm bg-background text-white"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white hover:text-white cursor-pointer p-1"
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
        <div className="p-6 text-destructive-foreground bg-destructive/10 border-b border-destructive/20 text-sm">
          {error}
        </div>
      )}

      {/* Table Area */}
      <div className="overflow-x-auto overflow-y-hidden w-full">
        <table className="w-full min-w-[800px] text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-border text-xs font-semibold uppercase tracking-wider">
              <th className="px-6 py-4 min-w-[280px]">Baby Details</th>
              <th className="px-6 py-4 min-w-[180px]">Birth Date</th>
              <th className="px-6 py-4 min-w-[180px]">
                <div className="flex items-center gap-1 w-full">
                  <HeaderDropdown
                    value={selectedParentId}
                    onChange={handleParentFilterChange}
                    placeholder="All Parents"
                    options={[
                      { value: "", label: "All Parents" },
                      ...parents.map((p) => ({ value: String(p.id), label: p.name || p.email })),
                    ]}
                  />
                  {selectedParentId && (
                    <button
                      onClick={() => handleParentFilterChange("")}
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
                    onChange={handleMemoryRangeFilterChange}
                    placeholder="All Ranges"
                    options={[
                      { value: "", label: "All Ranges" },
                      { value: "1-5", label: "1-5" },
                      { value: "6-10", label: "6-10" },
                      { value: "11-20", label: "11-20" },
                      { value: "20+", label: "20+" },
                    ]}
                  />
                  {selectedMemoryRange && (
                    <button
                      onClick={() => handleMemoryRangeFilterChange("")}
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
                    <span className="text-white/60 text-sm font-medium tracking-wide animate-pulse">Loading babies...</span>
                  </div>
                </td>
              </tr>
            ) : (
              <>
                {babies.filter(b =>
                  b.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  b.parentEmail?.toLowerCase().includes(searchQuery.toLowerCase())
                ).map((b) => (
                  <tr key={b.id} className="hover:bg-muted/70 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <ImagePreview src={b.profilePhoto?.trim() || avtar} alt={b.name || "Baby avatar"}>
                          <img
                            src={b.profilePhoto?.trim() || avtar}
                            alt={b.name || "Baby avatar"}
                            className="w-10 h-10 rounded-full object-cover border border-white/20 shrink-0"
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = avtar;
                            }}
                          />
                        </ImagePreview>
                        <div className="flex flex-col">
                          <span className="font-semibold text-white">{b.name}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-semibold text-white/80">
                      {b.dob ? new Date(b.dob).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "-"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white">{b.parentName || "Unknown parent"}</span>
                      </div>
                    </td>
                    <td className=" py-4 font-semibold text-white/80 px-8">{b.memoryCount}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/babies/${b.id}?mode=view`}
                          className="inline-flex items-center justify-center text-blue-400 hover:text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-colors cursor-pointer"
                          title="View Baby"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => deleteBaby(b.id)}
                          className="inline-flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors cursor-pointer"
                          title="Delete Baby"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {babies.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-white/70">
                      No babies found.
                    </td>
                  </tr>
                )}
              </>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <PaginationControls
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />

      <ConfirmDialog
        open={confirmOpen}
        title="Delete Baby Profile"
        description="WARNING: Deleting this baby profile will cascade-delete all their memories, family members, dream tales, and highlights. Proceed?"
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
