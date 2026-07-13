import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { apiFetch, getServerUrl } from "../lib/api";
import { Loader2, ChevronLeft, Pencil, Eye, Upload } from "lucide-react";
import avtar from "../public/default.jpg";
import { ImagePreview } from "../components/ImagePreview";
import { useToast } from "@/hooks/use-toast";

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

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const isViewMode = true;
  const { toast } = useToast();

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subscription_status: "free",
    is_admin: false,
    email_verified: false,
    app_version: "",
    profileImage: ""
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const uploadData = new FormData();
    uploadData.append("file", file);
    uploadData.append("image", file);

    try {
      const token = localStorage.getItem("admin_token") || localStorage.getItem("token");
      const headers: Record<string, string> = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      let resUrl = "";

      // Try /api/admin/upload first
      try {
        const response = await fetch(`${getServerUrl()}/api/admin/upload`, {
          method: "POST",
          headers,
          body: uploadData
        });
        if (response.ok) {
          const data = await response.json();
          resUrl = data.url || data.path || data.secure_url;
        }
      } catch (err) {
        console.warn("Failed to upload to /api/admin/upload, trying /api/upload...", err);
      }

      // Try /api/upload if the first one failed
      if (!resUrl) {
        const response = await fetch(`${getServerUrl()}/api/upload`, {
          method: "POST",
          headers,
          body: uploadData
        });
        if (response.ok) {
          const data = await response.json();
          resUrl = data.url || data.path || data.secure_url;
        } else {
          throw new Error(`Upload failed with status ${response.status}`);
        }
      }
      if (resUrl) {
        setFormData(prev => ({ ...prev, profileImage: resUrl }));
        toast({
          title: "Success",
          description: "Image uploaded successfully!",
        });
      } else {
        toast({
          title: "Error",
          description: "Upload failed: Invalid server response.",
          variant: "destructive"
        });
      }
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Error",
        description: "Failed to upload image: " + err.message,
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

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
        app_version: data.app_version || "",
        profileImage: data.profileImage || ""
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
      setFormData({
        name: updatedUser.name || "",
        email: updatedUser.email || "",
        subscription_status: updatedUser.subscription_status || "free",
        is_admin: !!updatedUser.is_admin,
        email_verified: !!updatedUser.email_verified,
        app_version: updatedUser.app_version || "",
        profileImage: updatedUser.profileImage || ""
      });
      toast({
        title: "Success",
        description: "User details updated successfully!",
      });
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Error",
        description: err.message || "Failed to update user details.",
        variant: "destructive"
      });
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
          <div className="flex items-center mb-4">
            <button
              onClick={() => navigate(-1)}
              className="text-[14px] bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg cursor-pointer flex items-center gap-1 transition-colors font-medium shadow-sm"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto">
        {isViewMode ? (
          <div className="bg-card shadow-sm rounded-xl border border-border px-6 pb-6 pt-20 mt-16 relative flex flex-col items-center w-full max-w-2xl mx-auto">
            {/* Overlapping Photo */}
            <div className="absolute -top-16">
              <ImagePreview src={getUserAvatar(user)} alt={user.name}>
                <img
                  src={getUserAvatar(user)}
                  alt={user.name}
                  className="w-32 h-32 rounded-full object-cover shadow-lg border-4 border-card bg-background"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = avtar;
                  }}
                />
              </ImagePreview>
            </div>

            {/* Title */}
            <div className="flex flex-col items-center w-full mb-6">
              <h1 className="text-3xl font-serif font-bold text-foreground text-center mb-2">
                {user.name || "Unknown"}
              </h1>
            </div>

            {/* Grid of details */}
            <div className="w-full border-t border-border pt-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <p className="text-xs text-muted-foreground">Full Name</p>
                <p className="font-medium text-foreground text-base mt-1">{user.name || "N/A"}</p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground">Email Address</p>
                <p className="font-medium text-foreground text-base mt-1 break-all">{user.email || "N/A"}</p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground">Subscription Plan</p>
                <span className="inline-block mt-1 px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-primary/10 text-primary">
                  {user.subscription_status || "free"}
                </span>
              </div>

              <div>
                <p className="text-xs text-muted-foreground">App Version</p>
                <p className="font-medium text-foreground text-base mt-1 font-mono">{user.app_version || "N/A"}</p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground">Email Verification Status</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`h-2.5 w-2.5 rounded-full ${user.email_verified ? "bg-emerald-500" : "bg-amber-400"}`} />
                  <span className="text-sm font-medium text-foreground">
                    {user.email_verified ? "Verified" : "Unverified"}
                  </span>
                </div>
              </div>

              <div>
                <p className="text-xs text-muted-foreground">Auth Provider</p>
                <p className="font-medium capitalize text-foreground mt-1">{user.auth_provider || "N/A"}</p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground">Registered At</p>
                <p className="font-medium text-foreground mt-1">
                  {new Date(user.created_at).toLocaleDateString()}
                </p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground">Babies Count</p>
                <p className="font-medium text-foreground mt-1">{user.babyCount || 0}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-card shadow-sm rounded-xl border border-border px-6 pb-6 pt-20 mt-16 relative flex flex-col items-center w-full max-w-2xl mx-auto">
            {/* Overlapping Photo */}
            <div className="absolute -top-16">
              <ImagePreview src={getUserAvatar(formData)} alt={formData.name}>
                <img
                  src={getUserAvatar(formData)}
                  alt={formData.name}
                  className="w-32 h-32 rounded-full object-cover shadow-lg border-4 border-card bg-background"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = avtar;
                  }}
                />
              </ImagePreview>
            </div>

            {/* Title & View Button */}
            <div className="flex flex-col items-center w-full mb-6">
              <h1 className="text-3xl font-serif font-bold text-foreground text-center mb-2">
                Edit {formData.name || "Profile"}
              </h1>
              <button
                type="button"
                onClick={() => navigate(`/users/${id}?mode=view`)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-400 hover:text-blue-500 bg-blue-400/10 hover:bg-blue-400/20 rounded-lg transition-colors cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
                View Details
              </button>
            </div>

            <form onSubmit={handleSave} className="w-full space-y-4">
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

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Profile Image</label>
                  <div className="flex flex-col gap-2">
                    <input
                      type="text"
                      name="profileImage"
                      placeholder="Paste Image URL..."
                      value={formData.profileImage}
                      onChange={handleChange}
                      className="w-full p-2 border border-border rounded-lg bg-background text-foreground text-sm"
                    />
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-1.5 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg font-medium text-xs cursor-pointer transition-colors border border-primary/20">
                        {uploading ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="w-3.5 h-3.5" />
                            Upload Image File
                          </>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          disabled={uploading}
                          className="hidden"
                        />
                      </label>
                      {formData.profileImage && (
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, profileImage: "" }))}
                          className="px-3 py-2 text-rose-500 hover:bg-rose-500/10 rounded-lg text-xs font-medium transition-colors border border-rose-500/20 cursor-pointer"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-4">
                  <input
                    type="checkbox"
                    id="email_verified"
                    name="email_verified"
                    checked={formData.email_verified}
                    onChange={handleChange}
                    className="h-4 w-4 rounded border-border bg-background text-primary focus:ring-primary cursor-pointer"
                  />
                  <label htmlFor="email_verified" className="text-sm font-medium text-foreground cursor-pointer select-none">
                    Email Verified
                  </label>
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 cursor-pointer"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
