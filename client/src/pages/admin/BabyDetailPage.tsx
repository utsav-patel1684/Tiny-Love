import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiFetch } from "../../lib/api";
import { Loader2 } from "lucide-react";

export default function BabyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [baby, setBaby] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    dob: "",
    profile_photo: ""
  });

  useEffect(() => {
    fetchBaby();
  }, [id]);

  const fetchBaby = async () => {
    setLoading(true);
    try {
      const data = await apiFetch<any>(`/admin/babies/${id}`);
      setBaby(data);
      setFormData({
        name: data.name || "",
        dob: data.dob ? data.dob.split("T")[0] : "",
        profile_photo: data.profile_photo || ""
      });
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Failed to load baby data.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updatedBaby = await apiFetch<any>(`/admin/babies/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          ...formData,
          dob: formData.dob ? new Date(formData.dob).toISOString() : null
        })
      });
      setBaby(updatedBaby);
      alert("Baby profile updated successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to update baby profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-primary w-8 h-8" />
      </div>
    );
  }

  if (error || !baby) {
    return (
      <div className="p-6 text-rose-600 bg-rose-50 border border-rose-200 rounded-lg">
        {error || "Baby not found."}
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
          <div className="flex items-center gap-4">
            {baby.profile_photo && (
              <img 
                src={baby.profile_photo} 
                alt={baby.name} 
                className="w-12 h-12 rounded-full object-cover shadow-sm border border-border"
              />
            )}
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">{baby.name || "Baby Details"}</h1>
              <p className="text-muted-foreground text-sm">
                ID: <span className="font-mono">{baby.id}</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Read Only Stats Panel */}
        <div className="bg-card shadow-sm rounded-xl border border-border p-6 space-y-4 h-fit">
          <h3 className="font-semibold text-lg border-b border-border pb-2 text-foreground">Stats & Info</h3>
          
          <div>
            <p className="text-xs text-muted-foreground">Parent Name</p>
            <p className="font-medium text-foreground">{baby.parentName || "Unknown"}</p>
          </div>
          
          <div>
            <p className="text-xs text-muted-foreground">Parent Email</p>
            <p className="font-medium text-foreground">{baby.parentEmail || "Unknown"}</p>
          </div>
          
          <div>
            <p className="text-xs text-muted-foreground">Created At</p>
            <p className="font-medium text-foreground">
              {new Date(baby.created_at).toLocaleDateString()}
            </p>
          </div>
          
          <div>
            <p className="text-xs text-muted-foreground">Total Memories</p>
            <p className="font-medium text-foreground">{baby.memoryCount || 0}</p>
          </div>
        </div>

        {/* Edit Form */}
        <div className="md:col-span-2 bg-card shadow-sm rounded-xl border border-border p-6">
          <form onSubmit={handleSave} className="space-y-4">
            <h3 className="font-semibold text-lg border-b border-border pb-2 text-foreground mb-4">Edit Profile</h3>
            
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
                <label className="text-sm font-medium text-foreground">Date of Birth</label>
                <input
                  type="date"
                  name="dob"
                  value={formData.dob}
                  onChange={handleChange}
                  className="w-full p-2 border border-border rounded-lg bg-background text-foreground"
                />
              </div>

              <div className="sm:col-span-2 space-y-1">
                <label className="text-sm font-medium text-foreground">Profile Photo URL</label>
                <input
                  type="url"
                  name="profile_photo"
                  value={formData.profile_photo}
                  onChange={handleChange}
                  className="w-full p-2 border border-border rounded-lg bg-background text-foreground"
                  placeholder="https://..."
                />
              </div>
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
