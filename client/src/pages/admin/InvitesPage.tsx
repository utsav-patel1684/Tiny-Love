import React, { useState, useEffect } from "react";
import { Trash2, X } from "lucide-react";
import { PaginationControls } from "../../components/ui/PaginationControls";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { apiFetch } from "../../lib/api";

export default function InvitesPage() {

  const [invites, setInvites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Pagination state
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const fetchInvites = async () => {
    setLoading(true);

    try {
      const data = await apiFetch<any>(
        `/admin/invites?page=${page}&limit=10`
      );

      setInvites(data.data ?? []);
      setTotalPages(data.totalPages ?? 1);
      setTotalRecords(data.total ?? 0);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Failed to load invites data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvites();
  }, [page]);

  const revokeInvite = (inviteId: string) => {
    setConfirmingId(inviteId);
    setConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!confirmingId) return;
    try {
      await apiFetch(`/admin/invites/${confirmingId}`, {
        method: "DELETE",
      });
      alert("Invite revoked successfully.");
      fetchInvites();
    } catch {
      alert("Failed to revoke invite.");
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
            placeholder="Search invites..."
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
          <span className="text-sm font-medium">Loading invites...</span>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-muted/30 border-b border-border text-xs font-semibold uppercase tracking-wider">
                <th className="px-6 py-4">Token</th>
                <th className="px-6 py-4">Invited Family Role</th>
                <th className="px-6 py-4">Assigned Baby</th>
                <th className="px-6 py-4">Details</th>

                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {invites.filter(i =>
                i.invitedEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                i.role?.toLowerCase().includes(searchQuery.toLowerCase())
              ).map((i) => (
                <tr key={i.id} className="hover:bg-muted/70 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-mono text-xs text-white/70">{i.token}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white">{i.role}</span>
                      <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-white/10 text-white">
                        {i.canManageContent ? "Can Upload / Edit" : "Viewer Only"}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white">{i.babyName}</span>
                      <span className="text-xs text-white/70">| Parent: {i.parentName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {i.invitedEmail && <span className="text-xs font-mono text-white/70">Email: {i.invitedEmail}</span>}
                      <div className="flex items-center gap-1.5">
                        <span className={`h-2 w-2 rounded-full ${i.usedAt ? "bg-emerald-500" : "bg-amber-400"}`} />
                        <span className="text-xs font-semibold text-white/70">
                          {i.usedAt ? `Joined ${new Date(i.usedAt).toLocaleDateString()}` : "Pending"}
                        </span>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => revokeInvite(i.id)}
                      className="text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors cursor-pointer"
                      title="Revoke Invite"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {invites.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-white/70">
                    No invites found.
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
        title="Revoke Invite"
        description="Are you sure you want to revoke this invite?"
        confirmText="Revoke"
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
