import React, { useState, useEffect } from "react";
import { Trash2, X, Eye } from "lucide-react";
import { Link } from "react-router-dom";
import { PaginationControls } from "../components/ui/PaginationControls";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { apiFetch } from "../lib/api";
import { useToast } from "@/hooks/use-toast";
import { HeaderDropdown } from "../components/HeaderDropdown";

export default function InvitesPage() {
  const { toast } = useToast();

  const [invites, setInvites] = useState<any[]>([]);
  const [roles, setRoles] = useState<string[]>([]);
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Pagination state
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const loadRoles = async () => {
    try {
      const data = await apiFetch<any>("/admin/invites?limit=1000");
      const uniqueRoles = Array.from(new Set((data.data ?? []).map((i: any) => i.role).filter(Boolean))) as string[];
      setRoles(uniqueRoles);
    } catch (err) {
      console.error("Failed to load roles", err);
    }
  };

  const fetchInvites = async () => {
    setLoading(true);

    try {
      const hasFilter = !!(selectedRole || selectedStatus);
      if (hasFilter) {
        const data = await apiFetch<any>("/admin/invites?limit=1000");
        let filtered = data.data ?? [];
        
        if (selectedRole) {
          filtered = filtered.filter((i: any) => i.role === selectedRole);
        }
        if (selectedStatus) {
          filtered = filtered.filter((i: any) => 
            selectedStatus === "joined" ? !!i.usedAt : !i.usedAt
          );
        }
        setTotalRecords(filtered.length);
        setTotalPages(Math.ceil(filtered.length / 10) || 1);
        const startIndex = (page - 1) * 10;
        setInvites(filtered.slice(startIndex, startIndex + 10));
      } else {
        const data = await apiFetch<any>(
          `/admin/invites?page=${page}&limit=10`
        );
        setInvites(data.data ?? []);
        setTotalPages(data.totalPages ?? 1);
        setTotalRecords(data.total ?? 0);
      }
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Failed to load invites data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoles();
  }, []);

  useEffect(() => {
    fetchInvites();
  }, [page, selectedRole, selectedStatus]);

  const handleRoleFilterChange = (val: string) => {
    setSelectedRole(val);
    setPage(1);
  };

  const handleStatusFilterChange = (val: string) => {
    setSelectedStatus(val);
    setPage(1);
  };

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
      toast({
        title: "Success",
        description: "Invite revoked successfully.",
      });
      fetchInvites();
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to revoke invite.",
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
              <th className="px-6 py-4 min-w-[150px]">Token</th>
              <th className="px-6 py-4 min-w-[180px]">
                <div className="flex items-center gap-1 w-full">
                  <HeaderDropdown
                    value={selectedRole}
                    onChange={handleRoleFilterChange}
                    placeholder="All Roles"
                    options={[
                      { value: "", label: "All Roles" },
                      ...roles.map((r) => ({ value: r, label: r })),
                    ]}
                  />
                  {selectedRole && (
                    <button
                      onClick={() => handleRoleFilterChange("")}
                      className="w-5 h-5 flex items-center justify-center cursor-pointer shrink-0 transition-transform hover:scale-125"
                      title="Reset filter"
                    >
                      <span className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.7)]" />
                    </button>
                  )}
                </div>
              </th>
              <th className="px-6 py-4 min-w-[180px]">Assigned Baby</th>
              <th className="px-6 py-4 min-w-[180px]">
                <div className="flex items-center gap-1 w-full">
                  <HeaderDropdown
                    value={selectedStatus}
                    onChange={handleStatusFilterChange}
                    placeholder="All Statuses"
                    options={[
                      { value: "", label: "All Statuses" },
                      { value: "pending", label: "Pending" },
                      { value: "joined", label: "Joined" },
                    ]}
                  />
                  {selectedStatus && (
                    <button
                      onClick={() => handleStatusFilterChange("")}
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
                    <span className="text-white/60 text-sm font-medium tracking-wide animate-pulse">Loading invites...</span>
                  </div>
                </td>
              </tr>
            ) : (
              <>
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
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/invites/${i.id}`}
                          className="inline-flex items-center justify-center text-blue-400 hover:text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-colors cursor-pointer"
                          title="View Invite"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => revokeInvite(i.id)}
                          className="inline-flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors cursor-pointer"
                          title="Revoke Invite"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {invites.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-white/70">
                      No invites found.
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
