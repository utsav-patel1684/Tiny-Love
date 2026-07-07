import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiFetch } from "../../lib/api";
import { Loader2 } from "lucide-react";

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subscription_status: "free",
    is_admin: false,
    email_verified: false,
    app_version: ""
  });

  useEffect(() => {
    fetchUser();
  }, [id]);

  const fetchUser = async () => {
    setLoading(true);
    try {
      const data = await apiFetch<any>(`/admin/users/${id}`);
      setUser(data);
      setFormData({
        name: data.name || "",
        email: data.email || "",
        subscription_status: data.subscription_status || "free",
        is_admin: !!data.is_admin,
        email_verified: !!data.email_verified,
        app_version: data.app_version || ""
      });
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Failed to load user data.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updatedUser = await apiFetch<any>(`/admin/users/${id}`, {
        method: "PATCH",
        body: JSON.stringify(formData)
      });
      setUser(updatedUser);
      alert("User updated successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to update user.");
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-primary w-8 h-8" />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="p-6 text-rose-600 bg-rose-50 border border-rose-200 rounded-lg">
        {error || "User not found."}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <button 
            onClick={() => navigate(-1)} 
            className="text-sm text-gray-500 hover:text-gray-900 mb-2 flex items-center gap-1 transition-colors"
          >
            &larr; Back
          </button>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">User Details</h1>
          <p className="text-muted-foreground text-sm">
            ID: <span className="font-mono">{user.id}</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Read Only Stats Panel */}
        <div className="bg-card shadow-sm rounded-xl border border-border p-6 space-y-4 h-fit">
          <h3 className="font-semibold text-lg border-b border-border pb-2 text-foreground">Stats & Info</h3>
          
          <div>
            <p className="text-xs text-muted-foreground">Auth Provider</p>
            <p className="font-medium capitalize text-foreground">{user.auth_provider || "N/A"}</p>
          </div>
          
          <div>
            <p className="text-xs text-muted-foreground">Registered At</p>
            <p className="font-medium text-foreground">
              {new Date(user.created_at).toLocaleDateString()}
            </p>
          </div>
          
          <div>
            <p className="text-xs text-muted-foreground">Babies Count</p>
            <p className="font-medium text-foreground">{user.babyCount || 0}</p>
          </div>
        </div>

        {/* Edit Form */}
        <div className="md:col-span-2 bg-card shadow-sm rounded-xl border border-border p-6">
          <form onSubmit={handleSave} className="space-y-4">
            <h3 className="font-semibold text-lg border-b border-border pb-2 text-foreground mb-4">Edit Details</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-foreground">Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full p-2 border border-border rounded-lg bg-background text-foreground"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-foreground">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full p-2 border border-border rounded-lg bg-background text-foreground"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-foreground">Subscription</label>
                <select
                  name="subscription_status"
                  value={formData.subscription_status}
                  onChange={handleChange}
                  className="w-full p-2 border border-border rounded-lg bg-background text-foreground"
                >
                  <option value="free">Free</option>
                  <option value="premium">Premium</option>
                  <option value="trial">Trial</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-foreground">App Version</label>
                <input
                  type="text"
                  name="app_version"
                  value={formData.app_version}
                  onChange={handleChange}
                  className="w-full p-2 border border-border rounded-lg bg-background text-foreground"
                />
              </div>
            </div>

            <div className="flex items-center gap-6 py-4">
              <label className="flex items-center gap-2 cursor-pointer text-foreground">
                <input
                  type="checkbox"
                  name="is_admin"
                  checked={formData.is_admin}
                  onChange={handleChange}
                  className="rounded border-border"
                />
                <span className="text-sm font-medium">Is Admin</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-foreground">
                <input
                  type="checkbox"
                  name="email_verified"
                  checked={formData.email_verified}
                  onChange={handleChange}
                  className="rounded border-border"
                />
                <span className="text-sm font-medium">Email Verified</span>
              </label>
            </div>

            <div className="pt-4 border-t border-border flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
