import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiFetch } from "../lib/api";
import { Loader2, ExternalLink } from "lucide-react";

export default function DreamTaleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [dreamTale, setDreamTale] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    is_favorite: false,
    cover_image_url: "",
    language: "english",
    story_style: "adventure"
  });

  useEffect(() => {
    fetchDreamTale();
  }, [id]);

  const fetchDreamTale = async () => {
    setLoading(true);
    try {
      const data = await apiFetch<any>(`/admin/dream-tales/${id}`);
      setDreamTale(data);
      setFormData({
        title: data.title || "",
        is_favorite: !!data.is_favorite,
        cover_image_url: data.cover_image_url || "",
        language: data.language || "english",
        story_style: data.story_style || "adventure"
      });
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Failed to load Dream Tale data.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updatedTale = await apiFetch<any>(`/admin/dream-tales/${id}`, {
        method: "PATCH",
        body: JSON.stringify(formData)
      });
      setDreamTale(updatedTale);
      alert("Dream Tale updated successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to update Dream Tale.");
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

  const formatDuration = (seconds: number) => {
    if (!seconds) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-primary w-8 h-8" />
      </div>
    );
  }

  if (error || !dreamTale) {
    return (
      <div className="p-6 text-rose-600 bg-rose-50 border border-rose-200 rounded-lg">
        {error || "Dream Tale not found."}
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
            {dreamTale.cover_image_url && (
              <img 
                src={dreamTale.cover_image_url} 
                alt="Cover" 
                className="w-16 h-16 rounded object-cover shadow-sm border border-border"
              />
            )}
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">{dreamTale.title || "Dream Tale Details"}</h1>
              <p className="text-muted-foreground text-sm">
                ID: <span className="font-mono">{dreamTale.id}</span>
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
            <p className="text-xs text-muted-foreground">Voice</p>
            <p className="font-medium capitalize text-foreground">{dreamTale.voice_name || "Unknown"}</p>
          </div>
          
          <div>
            <p className="text-xs text-muted-foreground">Duration</p>
            <p className="font-medium text-foreground">{formatDuration(dreamTale.duration_seconds)}</p>
          </div>
          
          <div>
            <p className="text-xs text-muted-foreground">Baby Name</p>
            <p className="font-medium text-foreground">{dreamTale.babyName || "Unknown"}</p>
          </div>
          
          <div>
            <p className="text-xs text-muted-foreground">Creator</p>
            <p className="font-medium text-foreground">{dreamTale.userName || "Unknown"}</p>
            <p className="text-xs text-muted-foreground">{dreamTale.userEmail}</p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground">Created At</p>
            <p className="font-medium text-foreground">
              {new Date(dreamTale.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Edit Form */}
        <div className="md:col-span-2 bg-card shadow-sm rounded-xl border border-border p-6">
          <form onSubmit={handleSave} className="space-y-4">
            <h3 className="font-semibold text-lg border-b border-border pb-2 text-foreground mb-4">Edit Tale</h3>
            
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">Title</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="w-full p-2 border border-border rounded-lg bg-background text-foreground"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-foreground">Language</label>
                <select
                  name="language"
                  value={formData.language}
                  onChange={handleChange}
                  className="w-full p-2 border border-border rounded-lg bg-background text-foreground"
                >
                  <option value="english">English</option>
                  <option value="hindi">Hindi</option>
                  <option value="gujarati">Gujarati</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-foreground">Story Style</label>
                <select
                  name="story_style"
                  value={formData.story_style}
                  onChange={handleChange}
                  className="w-full p-2 border border-border rounded-lg bg-background text-foreground"
                >
                  <option value="adventure">Adventure</option>
                  <option value="lullaby">Lullaby</option>
                  <option value="educational">Educational</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground flex justify-between">
                Cover Image URL
                {formData.cover_image_url && (
                  <a href={formData.cover_image_url} target="_blank" rel="noreferrer" className="text-primary hover:underline text-xs flex items-center gap-1">
                    View <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </label>
              <input
                type="url"
                name="cover_image_url"
                value={formData.cover_image_url}
                onChange={handleChange}
                className="w-full p-2 border border-border rounded-lg bg-background text-foreground"
                placeholder="https://..."
              />
            </div>

            <div className="pt-2">
              <label className="flex items-center gap-2 cursor-pointer text-foreground">
                <input
                  type="checkbox"
                  name="is_favorite"
                  checked={formData.is_favorite}
                  onChange={handleChange}
                  className="rounded border-border"
                />
                <span className="text-sm font-medium">Is Favorite</span>
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
