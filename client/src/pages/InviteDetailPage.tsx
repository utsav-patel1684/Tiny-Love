import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiFetch } from "../lib/api";
import { Loader2, Mail, ChevronLeft } from "lucide-react";

export default function InviteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [invite, setInvite] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchInvite();
  }, [id]);

  const fetchInvite = async () => {
    setLoading(true);
    try {
      const data = await apiFetch<any>(`/admin/invites/${id}`);
      setInvite(data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Failed to load invite data.");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-primary w-8 h-8" />
      </div>
    );
  }

  if (error || !invite) {
    return (
      <div className="p-6 text-rose-600 bg-rose-50 border border-rose-200 rounded-lg">
        {error || "Invite not found."}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-sm font-medium bg-[#EBA545] hover:bg-[#d9973f] text-white px-5 py-2 rounded-full cursor-pointer transition-colors shadow-sm mb-3"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
              <Mail className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">Invite Details</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-card shadow-sm rounded-xl border border-border p-6 max-w-2xl">
        <h3 className="font-semibold text-lg border-b border-border pb-2 text-foreground mb-4">Invite Info</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Token</p>
            <p className="font-mono font-medium text-foreground bg-muted inline-block px-2 py-1 rounded mt-1">{invite.token || "Unknown"}</p>
          </div>

          <div>
            <p className="text-sm font-medium text-muted-foreground">Baby Name</p>
            <p className="font-medium text-foreground mt-1">{invite.babyName || "Unknown"}</p>
          </div>

          <div>
            <p className="text-sm font-medium text-muted-foreground">Invited Email</p>
            <p className="font-medium text-foreground mt-1">{invite.invited_email || "Unknown"}</p>
          </div>

          <div>
            <p className="text-sm font-medium text-muted-foreground">Role</p>
            <p className="font-medium text-foreground capitalize mt-1">{invite.role || "viewer"}</p>
          </div>

          <div>
            <p className="text-sm font-medium text-muted-foreground">Can Manage Content</p>
            <p className="font-medium text-foreground mt-1">{invite.can_manage_content ? "Yes" : "No"}</p>
          </div>

          <div>
            <p className="text-sm font-medium text-muted-foreground">Created At</p>
            <p className="font-medium text-foreground mt-1">{formatDate(invite.created_at)}</p>
          </div>

          <div>
            <p className="text-sm font-medium text-muted-foreground">Expires At</p>
            <p className="font-medium text-foreground mt-1 text-amber-600">{formatDate(invite.expires_at)}</p>
          </div>

          <div>
            <p className="text-sm font-medium text-muted-foreground">Used At</p>
            <p className="font-medium text-foreground mt-1text-amber-600">{formatDate(invite.used_at)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
