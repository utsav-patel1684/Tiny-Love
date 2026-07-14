import React, { useState, useEffect } from "react";
import { Trash2, X, Eye, Pencil } from "lucide-react";
import { Link } from "react-router-dom";
import { PaginationControls } from "../components/ui/PaginationControls";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { apiFetch, getServerUrl } from "../lib/api";
import avtar from "../public/default.jpg";
import { ImagePreview } from "../components/ImagePreview";
import { useToast } from "@/hooks/use-toast";
import { HeaderDropdown } from "../components/HeaderDropdown";

const getUserAvatar = (user: any) => {
  if (!user) return avtar;
  const img = user.profileImage || user.profile_image || user.profilePhoto || user.profile_photo || user.avatar;
  if (!img || img === "null" || img.trim() === "") {
    return avtar;
  }
  if (img.startsWith("http://") || img.startsWith("https://")) {
    return img;
  }
  return `${getServerUrl()}${img.startsWith("/") ? "" : "/"}${img}`;
};

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

export default function UsersPage() {
  const { toast } = useToast();

  const [users, setUsers] = useState<any[]>([]);
  const [selectedVerification, setSelectedVerification] = useState<string>("");
  const [selectedSubscription, setSelectedSubscription] = useState<string>("");
  const [selectedBabyRange, setSelectedBabyRange] = useState<string>("");
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>("");
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
      const hasActiveFilter = !!(selectedVerification || selectedSubscription || selectedBabyRange || selectedDateFilter);
      let url = "";
      if (hasActiveFilter) {
        url = "/admin/users?limit=1000";
      } else {
        url = `/admin/users?page=${page}&limit=10`;
      }
      
      const data = await apiFetch<any>(url);
      const fetchedUsers = data.data ?? [];
      
      let filtered = [...fetchedUsers];
      if (selectedVerification) {
        filtered = filtered.filter(u => ((u.email_verified !== undefined ? u.email_verified : u.emailVerified) ? "verified" : "pending") === selectedVerification);
      }
      if (selectedSubscription) {
        filtered = filtered.filter(u => (u.subscription_status || u.subscriptionStatus || "free").toLowerCase() === selectedSubscription.toLowerCase());
      }
      if (selectedBabyRange) {
        filtered = filtered.filter(u => {
          const count = Number(u.babyCount || 0);
          if (selectedBabyRange === "1-2") return count >= 1 && count <= 2;
          if (selectedBabyRange === "3-5") return count >= 3 && count <= 5;
          if (selectedBabyRange === "5+") return count > 5;
          return true;
        });
      }

      if (hasActiveFilter) {
        setTotalRecords(filtered.length);
        setTotalPages(Math.ceil(filtered.length / 10) || 1);
        const startIndex = (page - 1) * 10;
        setUsers(filtered.slice(startIndex, startIndex + 10));
      } else {
        setUsers(filtered);
        setTotalPages(data.totalPages ?? 1);
        setTotalRecords(data.total ?? 0);
      }
      
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
  }, [page, selectedVerification, selectedSubscription, selectedBabyRange, selectedDateFilter]);

  const handleVerificationFilterChange = (val: string) => {
    setSelectedVerification(val);
    setPage(1);
  };

  const handleSubscriptionFilterChange = (val: string) => {
    setSelectedSubscription(val);
    setPage(1);
  };

  const handleBabyRangeFilterChange = (val: string) => {
    setSelectedBabyRange(val);
    setPage(1);
  };

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
      toast({
        title: "Success",
        description: "User deleted successfully.",
      });
      fetchUsers(); // Refresh current page
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete user.",
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
      <div className="overflow-x-auto overflow-y-hidden w-full">
        <table className="w-full min-w-[800px] text-left text-sm whitespace-nowrap">
          <thead className="bg-background">
            <tr className="border-b border-border text-xs font-semibold uppercase tracking-wider">
              <th className="px-6 py-4 min-w-[280px]">User Details</th>
              <th className="px-6 py-4 min-w-[180px]">
                <div className="flex items-center gap-1 w-full">
                  <HeaderDropdown
                    value={selectedVerification}
                    onChange={handleVerificationFilterChange}
                    placeholder="All Statuses"
                    options={[
                      { value: "", label: "All Statuses" },
                      { value: "verified", label: "Verified" },
                      { value: "pending", label: "Pending" },
                    ]}
                  />
                  {selectedVerification && (
                    <button
                      onClick={() => handleVerificationFilterChange("")}
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
                    value={selectedSubscription}
                    onChange={handleSubscriptionFilterChange}
                    placeholder="All Preferences"
                    options={[
                      { value: "", label: "All Preferences" },
                      { value: "free", label: "Free" },
                      { value: "premium", label: "Premium" },
                    ]}
                  />
                  {selectedSubscription && (
                    <button
                      onClick={() => handleSubscriptionFilterChange("")}
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
                    value={selectedBabyRange}
                    onChange={handleBabyRangeFilterChange}
                    placeholder="All Ranges"
                    options={[
                      { value: "", label: "All Ranges" },
                      { value: "1-2", label: "1-2" },
                      { value: "3-5", label: "3-5" },
                      { value: "5+", label: "5+" },
                    ]}
                  />
                  {selectedBabyRange && (
                    <button
                      onClick={() => handleBabyRangeFilterChange("")}
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
                    placeholder="Registered At"
                    options={[
                      { value: "", label: "Registered At" },
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
                    <span className="text-white/60 text-sm font-medium tracking-wide animate-pulse">Loading users...</span>
                  </div>
                </td>
              </tr>
            ) : (
              <>
                {users.filter(u =>
                  u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  u.email?.toLowerCase().includes(searchQuery.toLowerCase())
                ).filter(u =>
                  isDateInRange(u.registered_at || u.created_at || u.createdAt, selectedDateFilter)
                ).map((u) => (
                  <tr key={u.id} className="hover:bg-muted/70 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <ImagePreview src={getUserAvatar(u)} alt={u.name || "User avatar"}>
                          <img
                            src={getUserAvatar(u)}
                            referrerPolicy="no-referrer"
                            alt={u.name || "User avatar"}
                            className="w-10 h-10 min-w-10 min-h-10 shrink-0 rounded-full object-cover border border-white/20"
                            onError={(event) => {
                              event.currentTarget.onerror = null;
                              event.currentTarget.src = avtar;
                            }}
                          />
                        </ImagePreview>

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
                          <span className={`h-2 w-2 rounded-full ${(u.email_verified !== undefined ? u.email_verified : u.emailVerified) ? "bg-emerald-500" : "bg-amber-400"}`} />
                          <span className="text-xs font-medium text-white/70">
                            {(u.email_verified !== undefined ? u.email_verified : u.emailVerified) ? "Verified" : "Pending "}
                          </span>
                        </div>
                        <span className="inline-block px-2 py-0.5 rounded text-[12px] font-bold  text-white">
                          {u.auth_provider || u.authProvider}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-white">
                      <div className="flex items-center gap-3">
                        <span><span className="inline-block px-1.5 py-0.5 rounded text-[12px] font-bold  text-white">{u.subscription_status || u.subscriptionStatus || "free"}</span></span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-white">
                      <div> <span className="font-semibold text-white">{u.babyCount}</span></div>
                    </td>
                    <td className="px-6 py-4 text-xs text-white">{formatDate(u.created_at || u.createdAt)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/users/${u.id}?mode=view`}
                          className="inline-flex items-center justify-center text-blue-400 hover:text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-colors cursor-pointer"
                          title="View User"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => deleteUser(u.id)}
                          className="inline-flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors cursor-pointer"
                          title="Delete User"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
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
