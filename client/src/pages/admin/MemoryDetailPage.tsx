import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiFetch } from "../../lib/api";
import { Loader2, ExternalLink } from "lucide-react";

export default function MemoryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [memory, setMemory] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    caption: "",
    category: "everyday",
    visibility: "family",
    thumbnail_url: "",
    media_url: ""
  });

  useEffect(() => {
    fetchMemory();
  }, [id]);

  const fetchMemory = async () => {
    setLoading(true);
    try {
      const data = await apiFetch<any>(`/admin/memories/${id}`);
      setMemory(data);
      setFormData({
        caption: data.caption || "",
        category: data.category || "everyday",
        visibility: data.visibility || "family",
        thumbnail_url: data.thumbnail_url || "",
        media_url: data.media_url || ""
      });
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Failed to load memory data.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updatedMemory = await apiFetch<any>(`/admin/memories/${id}`, {
        method: "PATCH",
        body: JSON.stringify(formData)
      });
      setMemory(updatedMemory);
      alert("Memory updated successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to update memory.");
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
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

  if (error || !memory) {
    return (
      <div className="p-6 text-rose-600 bg-rose-50 border border-rose-200 rounded-lg">
        {error || "Memory not found."}
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
            {memory.thumbnail_url && (
              <img 
                src={memory.thumbnail_url} 
                alt="Thumbnail" 
                className="w-16 h-16 rounded object-cover shadow-sm border border-border"
              />
            )}
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">Memory Details</h1>
              <p className="text-muted-foreground text-sm">
                ID: <span className="font-mono">{memory.id}</span>
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
            <p className="text-xs text-muted-foreground">Type</p>
            <p className="font-medium text-foreground uppercase text-sm">{memory.type || "Unknown"}</p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground">Baby</p>
            <p className="font-medium text-foreground">{memory.babyName || "Unknown"}</p>
          </div>
          
          <div>
            <p className="text-xs text-muted-foreground">Uploader</p>
            <p className="font-medium text-foreground">{memory.uploaderName || "Unknown"}</p>
            <p className="text-xs text-muted-foreground">{memory.uploaderEmail}</p>
          </div>
          
          <div>
            <p className="text-xs text-muted-foreground">Created At</p>
            <p className="font-medium text-foreground">
              {new Date(memory.created_at).toLocaleDateString()}
            </p>
          </div>
          
          <div className="flex items-center justify-between pt-2">
            <div>
              <p className="text-xs text-muted-foreground">Reactions</p>
              <p className="font-medium text-foreground">{memory.reactionCount || 0}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Comments</p>
              <p className="font-medium text-foreground">{memory.commentCount || 0}</p>
            </div>
          </div>
        </div>

        {/* Edit Form */}
        <div className="md:col-span-2 bg-card shadow-sm rounded-xl border border-border p-6">
          <form onSubmit={handleSave} className="space-y-4">
            <h3 className="font-semibold text-lg border-b border-border pb-2 text-foreground mb-4">Edit Memory</h3>
            
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-foreground">Caption</label>
                <textarea
                  name="caption"
                  value={formData.caption}
                  onChange={handleChange}
                  rows={3}
                  className="w-full p-2 border border-border rounded-lg bg-background text-foreground resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-foreground">Category</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full p-2 border border-border rounded-lg bg-background text-foreground"
                  >
                    <option value="everyday">Everyday</option>
                    <option value="milestone">Milestone</option>
                    <option value="special">Special</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-foreground">Visibility</label>
                  <select
                    name="visibility"
                    value={formData.visibility}
                    onChange={handleChange}
                    className="w-full p-2 border border-border rounded-lg bg-background text-foreground"
                  >
                    <option value="family">Family</option>
                    <option value="private">Private</option>
                    <option value="public">Public</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-foreground flex justify-between">
                  Thumbnail URL
                  {formData.thumbnail_url && (
                    <a href={formData.thumbnail_url} target="_blank" rel="noreferrer" className="text-primary hover:underline text-xs flex items-center gap-1">
                      View <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </label>
                <input
                  type="url"
                  name="thumbnail_url"
                  value={formData.thumbnail_url}
                  onChange={handleChange}
                  className="w-full p-2 border border-border rounded-lg bg-background text-foreground"
                  placeholder="https://..."
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-foreground flex justify-between">
                  Media URL
                  {formData.media_url && (
                    <a href={formData.media_url} target="_blank" rel="noreferrer" className="text-primary hover:underline text-xs flex items-center gap-1">
                      View <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </label>
                <input
                  type="url"
                  name="media_url"
                  value={formData.media_url}
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
