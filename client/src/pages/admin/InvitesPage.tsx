import React, { useState, useEffect } from "react";
import { Trash2, X } from "lucide-react";
import { PaginationControls } from "../../components/ui/PaginationControls";
import { ConfirmDialog } from "../../components/ConfirmDialog";

const API_URL_STORAGE_KEY = "kinstory_admin_api_url";
const DEFAULT_API_URL = "http://localhost:5001/api";

export default function InvitesPage() {
  const [apiUrl] = useState(() => localStorage.getItem(API_URL_STORAGE_KEY) || DEFAULT_API_URL);
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
      const res = await fetch(`${apiUrl}/admin/invites?page=${page}&limit=10`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setInvites(data.data);
      setTotalPages(data.totalPages);
      setTotalRecords(data.total);
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
  }, [apiUrl, page]);

  const revokeInvite = (inviteId: string) => {
    setConfirmingId(inviteId);
    setConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!confirmingId) return;
    try {
      const res = await fetch(`${apiUrl}/admin/invites/${confirmingId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
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
    <div className="bg-white rounded-xl border border-[#EBE6DA] shadow-sm overflow-hidden animate-fadeIn">
      <div className="p-6 border-b border-[#EBE6DA] flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-50/50">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search local page..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-4 pr-10 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#5F7A68] text-sm bg-white"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer p-1"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="text-xs text-gray-400 font-medium">
          {loading ? "" : `Total ${totalRecords} entries in database`}
        </div>
      </div>

      {error && (
        <div className="p-6 text-rose-600 bg-rose-50 border-b border-rose-100 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-gray-400">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-t-transparent border-[#5F7A68]"></div>
          <span className="text-sm font-medium">Loading invites...</span>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-[#EBE6DA] text-xs font-semibold text-gray-400 uppercase tracking-wider">
                <th className="px-6 py-4">Token</th>
                <th className="px-6 py-4">Invited Family Role</th>
                <th className="px-6 py-4">Assigned Baby</th>
                <th className="px-6 py-4">Details</th>
               
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EBE6DA]">
              {invites.filter(i =>
                i.invitedEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                i.role?.toLowerCase().includes(searchQuery.toLowerCase())
              ).map((i) => (
                <tr key={i.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-mono text-xs text-gray-600">{i.token}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-800">{i.role}</span>
                      <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700">
                        {i.canManageContent ? "Can Upload / Edit" : "Viewer Only"}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-800">{i.babyName}</span>
                      <span className="text-xs text-gray-400">| Parent: {i.parentName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {i.invitedEmail && <span className="text-xs font-mono text-gray-500">Email: {i.invitedEmail}</span>}
                      <div className="flex items-center gap-1.5">
                        <span className={`h-2 w-2 rounded-full ${i.usedAt ? "bg-emerald-500" : "bg-amber-400"}`} />
                        <span className="text-xs font-semibold text-gray-500">
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
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
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
