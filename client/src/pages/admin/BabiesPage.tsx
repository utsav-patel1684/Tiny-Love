import React, { useState, useEffect } from "react";
import { Trash2, X } from "lucide-react";
import { PaginationControls } from "../../components/ui/PaginationControls";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { apiFetch } from "../../lib/api";

export default function BabiesPage() {

  const [babies, setBabies] = useState<any[]>([]);
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
    setLoading(true);

    try {
      const data = await apiFetch<any>(
        `/admin/babies?page=${page}&limit=10`
      );

      setBabies(data.data ?? []);
      setTotalPages(data.totalPages ?? 1);
      setTotalRecords(data.total ?? 0);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Failed to load babies data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBabies();
  }, [page]);

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
      alert("Baby profile deleted successfully.");
      fetchBabies();
    } catch {
      alert("Failed to delete baby profile.");
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
      <div className="p-6 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-4 bg-muted/50">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search babies..."
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
        <div className="p-6 text-destructive-foreground bg-destructive/10 border-b border-destructive/20 text-sm">
          {error}
        </div>
      )}

      {/* Table Area */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-muted-foreground">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-t-transparent border-primary"></div>
          <span className="text-sm font-medium">Loading babies...</span>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-muted/30 border-b border-border text-xs font-semibold uppercase tracking-wider">
                <th className="px-6 py-4">Photo</th>
                <th className="px-6 py-4">Baby Details</th>
                <th className="px-6 py-4">Birth Date</th>
                <th className="px-6 py-4">Parent Details</th>
                <th className="px-6 py-4">Memories count</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {babies.filter(b =>
                b.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                b.parentEmail?.toLowerCase().includes(searchQuery.toLowerCase())
              ).map((b) => (
                <tr key={b.id} className="hover:bg-muted/70 transition-colors">
                  <td className="px-6 py-4">
                    <img
                      src={b.profilePhoto}
                      alt={b.name}
                      width={48}
                      height={48}
                      style={{
                        borderRadius: "50%",
                        objectFit: "cover",
                        border: "1px solid #e5e7eb"
                      }}
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white">{b.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs font-semibold text-white/80">
                    {b.dob ? new Date(b.dob).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "-"}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white">{b.parentName || "Unknown parent"}</span>
                      <span className="text-xs text-white/70 font-mono">({b.parentEmail})</span>
                    </div>
                  </td>
                  <td className=" py-4 font-semibold text-white/80 px-8">{b.memoryCount}</td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => deleteBaby(b.id)}
                      className="text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors cursor-pointer"
                      title="Delete Profile"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {babies.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-white/70">
                    No babies found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

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
