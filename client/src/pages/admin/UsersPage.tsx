import React, { useState, useEffect } from "react";
import { Trash2, X } from "lucide-react";
import { PaginationControls } from "../../components/ui/PaginationControls";

const API_URL_STORAGE_KEY = "kinstory_admin_api_url";
const DEFAULT_API_URL = "http://localhost:5001/api";

export default function UsersPage() {
  const [apiUrl] = useState(() => localStorage.getItem(API_URL_STORAGE_KEY) || DEFAULT_API_URL);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Pagination state
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/admin/users?page=${page}&limit=10`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
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
  }, [apiUrl, page]);

  const deleteUser = async (userId: string) => {
    if (!window.confirm("WARNING: Deleting this user will cascade-delete all their baby profiles, memories, invites, reactions, comments, and push tokens. Proceed?")) return;
    try {
      const res = await fetch(`${apiUrl}/admin/users/${userId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      alert("User deleted successfully.");
      fetchUsers(); // Refresh current page
    } catch {
      alert("Failed to delete user.");
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
      {/* Table search & filter header */}
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
          {loading ? "Loading..." : `Total ${totalRecords} entries in database`}
        </div>
      </div>

      {error && (
        <div className="p-6 text-rose-600 bg-rose-50 border-b border-rose-100 text-sm">
          {error}
        </div>
      )}

      {/* Table Area */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-gray-400">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-t-transparent border-[#5F7A68]"></div>
          <span className="text-sm font-medium">Loading users...</span>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-[#EBE6DA] text-xs font-semibold text-gray-400 uppercase tracking-wider">
                <th className="px-6 py-4">User Details</th>
                <th className="px-6 py-4">Status & Provider</th>
                <th className="px-6 py-4">Preferences</th>
                <th className="px-6 py-4">Stats</th>
                <th className="px-6 py-4">Registered At</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EBE6DA]">
              {users.filter(u =>
                u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                u.email?.toLowerCase().includes(searchQuery.toLowerCase())
              ).map((u) => (
                <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-800">{u.name}</span>
                      <span className="text-xs text-gray-400 font-mono">({u.email})</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className={`h-2 w-2 rounded-full ${u.emailVerified ? "bg-emerald-500" : "bg-amber-400"}`} />
                        <span className="text-xs font-medium text-gray-500">
                          {u.emailVerified ? "Verified" : "Pending Verification"}
                        </span>
                      </div>
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-gray-100 text-gray-600 uppercase">
                        {u.authProvider}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs font-medium text-gray-500">
                    <div className="flex items-center gap-3">
                      <span>Status: <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#C9AE7B]/20 text-[#5F7A68]">{u.subscriptionStatus || "free"}</span></span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-500">
                    <div>Babies Owned: <span className="font-semibold text-gray-700">{u.babyCount}</span></div>
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-400">{formatDate(u.createdAt)}</td>
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
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
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
    </div>
  );
}
