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

        {/* Tale Details Info */}
        <div className="md:col-span-2 bg-card shadow-sm rounded-xl border border-border p-6 space-y-4">
          <h3 className="font-semibold text-lg border-b border-border pb-2 text-foreground mb-4">Tale Configuration</h3>
          
          <div>
            <p className="text-xs text-muted-foreground">Title</p>
            <p className="font-medium text-foreground mt-1">{dreamTale.title || "N/A"}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Language</p>
              <p className="font-medium capitalize text-foreground mt-1">{dreamTale.language || "N/A"}</p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground">Story Style</p>
              <p className="font-medium capitalize text-foreground mt-1">{dreamTale.story_style || "N/A"}</p>
            </div>
          </div>

          <div>
            <p className="text-xs text-muted-foreground">Favorite Status</p>
            <span className={`inline-block mt-1 px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${dreamTale.is_favorite ? "bg-emerald-500/10 text-emerald-500" : "bg-muted text-muted-foreground"}`}>
              {dreamTale.is_favorite ? "Favorite" : "Standard"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
