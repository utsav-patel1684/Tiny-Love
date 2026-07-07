import React, { useState, useEffect } from "react";
import { Trash2, X } from "lucide-react";
import { PaginationControls } from "../../components/ui/PaginationControls";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { Skeleton } from "../../components/ui/skeleton";
import { apiFetch } from "../../lib/api";
import avtar from "../../public/default.jpg";
export default function UsersPage() {

  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Pagination state
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await apiFetch<any>(
        `/admin/users?page=${page}&limit=10`
      );
      setUsers(data.data);
      setTotalPages(data.totalPages);
      setTotalRecords(data.total);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Failed to load users data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page]);

  const deleteUser = (userId: string) => {
    setConfirmingId(userId);
    setConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!confirmingId) return;
    try {
      await apiFetch(`/admin/users/${confirmingId}`, {
        method: "DELETE",
      });
      alert("User deleted successfully.");
      fetchUsers(); // Refresh current page
    } catch {
      alert("Failed to delete user.");
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
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search users..."
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

      {/* Table Area */}
      {loading ? (
        <div className="p-4 md:p-6 space-y-4 w-full">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-14 w-full rounded-md" />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto overflow-y-hidden w-full">
          <table className="w-full min-w-[800px] text-left text-sm whitespace-nowrap">
            <thead>
              <tr className="border-b border-border text-xs font-semibold uppercase tracking-wider">
                <th className="px-6 py-4">User Details</th>
                <th className="px-6 py-4">Status & Provider</th>
                <th className="px-6 py-4">Preferences</th>
                <th className="px-6 py-4">Baby Owned</th>
                <th className="px-6 py-4">Registered At</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.filter(u =>
                u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                u.email?.toLowerCase().includes(searchQuery.toLowerCase())
              ).map((u) => (
                <tr key={u.id} className="hover:bg-muted/70 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={u.profileImage?.trim() || avtar}
                        alt={u.name || "User avatar"}
                        className="w-10 h-10 rounded-full object-cover border border-white/20"
                        onError={(event) => {
                          event.currentTarget.onerror = null;
                          event.currentTarget.src = avtar;
                        }}
                      />

                      <div className="flex flex-col">
                        <span className="font-semibold text-white">{u.name}</span>
                        <span className="text-xs text-white/70 font-mono">
                          {u.email}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className={`h-2 w-2 rounded-full ${u.emailVerified ? "bg-emerald-500" : "bg-amber-400"}`} />
                        <span className="text-xs font-medium text-white/70">
                          {u.emailVerified ? "Verified" : "Pending "}
                        </span>
                      </div>
                      <span className="inline-block px-2 py-0.5 rounded text-[12px] font-bold  text-white">
                        {u.authProvider}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs font-medium text-white">
                    <div className="flex items-center gap-3">
                      <span><span className="inline-block px-1.5 py-0.5 rounded text-[12px] font-bold  text-white">{u.subscriptionStatus || "free"}</span></span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs text-white">
                    <div> <span className="font-semibold text-white">{u.babyCount}</span></div>
                  </td>
                  <td className="px-6 py-4 text-xs text-white">{formatDate(u.createdAt)}</td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button
                      onClick={() => deleteUser(u.id)}
                      className="text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors cursor-pointer"
                      title="Delete User"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-white/70">
                    No users found.
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
        title="Delete User"
        description="WARNING: Deleting this user will cascade-delete all their baby profiles, memories, invites, reactions, comments, and push tokens. Proceed?"
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
