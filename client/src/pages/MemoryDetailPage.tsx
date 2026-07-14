import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { apiFetch, getServerUrl } from "../lib/api";
import { Loader2, ExternalLink, ChevronLeft } from "lucide-react";
import { ProtectedMedia } from "../components/ProtectedMedia";
import { ImagePreview } from "../components/ImagePreview";
import { useToast } from "@/hooks/use-toast";

export default function MemoryDetailPage() {
  const { toast } = useToast();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const isViewMode = true;

  const MediaRenderer = ({ formData, memory }: { formData: any; memory: any }) => {
    const hasMedia = !!formData.media_url;
    const hasThumb = !!formData.thumbnail_url;

    if (!hasMedia && !hasThumb) {
      return <p className="text-sm text-muted-foreground italic">No media attached.</p>;
    }

    const getFullUrl = (raw: string) => raw.startsWith('http') ? raw : `${getServerUrl()}${raw.startsWith('/') ? '' : '/'}${raw}`;

    const mediaUrl = hasMedia ? getFullUrl(formData.media_url) : "";
    const thumbUrl = hasThumb ? getFullUrl(formData.thumbnail_url) : "";

    if (hasMedia) {
      const type = memory?.type || "";
      const lowerUrl = mediaUrl.toLowerCase();
      const isVid = type === "video" || lowerUrl.match(/\.(mp4|webm|ogg|mov)$/i);
      const isAud = type === "voice" || type === "audio" || lowerUrl.match(/\.(mp3|wav|m4a|aac)$/i);
      const isImg = type === "photo" || type === "image" || lowerUrl.match(/\.(jpeg|jpg|gif|png|webp)$/i);

      if (isVid) {
        return (
          <ProtectedMedia
            mediaType="video"
            src={mediaUrl}
            poster={thumbUrl || undefined}
            className="w-full max-h-96 rounded border border-border bg-black/5 object-contain"
          />
        );
      } else if (isAud) {
        return (
          <div className="space-y-4">
            {thumbUrl && (
              <ImagePreview src={thumbUrl} alt="Thumbnail">
                <ProtectedMedia src={thumbUrl} alt="Thumbnail" className="w-full max-h-64 object-contain rounded border border-border bg-black/5" />
              </ImagePreview>
            )}
            <ProtectedMedia mediaType="audio" src={mediaUrl} className="w-full" />
          </div>
        );
      } else {
        // Default to photo/image for unknown types or when isImg is true
        return (
          <ImagePreview src={mediaUrl} alt="Media">
            <ProtectedMedia src={mediaUrl} alt="Media" className="w-full max-h-96 object-contain rounded border border-border bg-black/5" />
          </ImagePreview>
        );
      }
    }

    return (
      <ImagePreview src={thumbUrl} alt="Thumbnail">
        <ProtectedMedia src={thumbUrl} alt="Thumbnail" className="w-full max-h-96 object-contain rounded border border-border bg-black/5" />
      </ImagePreview>
    );
  };

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
      toast({
        title: "Success",
        description: "Memory updated successfully!",
      });
    } catch (err) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update memory.",
      });
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
          <div className="flex items-center mb-4">
            <button
              onClick={() => navigate(-1)}
              className="text-[14px] bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg cursor-pointer flex items-center gap-1 transition-colors font-medium shadow-sm"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>


          </div>
          <div className="flex items-center gap-4">
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column (Main Content) */}
        <div className="md:col-span-2">
          {isViewMode ? (
            <div className="bg-card shadow-sm rounded-xl border border-border p-6 h-fit space-y-4">
              <h3 className="font-semibold text-lg border-b border-border pb-2 text-foreground">Media</h3>
              <MediaRenderer formData={formData} memory={memory} />

              <div className="pt-4 border-border space-y-4">
                <div>

                  <p className="font-medium text-foreground mt-1 text-sm">
                    {formData.caption || <span className="italic text-muted-foreground"></span>}
                  </p>
                </div>
                <div className="flex items-center gap-6">
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
            </div>
          ) : (
            <div className="bg-card shadow-sm rounded-xl border border-border p-6 h-fit">
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
          )}
        </div>

        {/* Right Column (Stats) */}
        <div className="flex flex-col gap-6">
          {/* Stats & Info */}
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

            </div>

            <div>
              <p className="text-xs text-muted-foreground">Created At</p>
              <p className="font-medium text-foreground">
                {new Date(memory.created_at).toLocaleDateString()}
              </p>
            </div>

            {isViewMode && (
              <div className="pt-4 border-border space-y-4">

                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Category</p>
                    <p className="font-medium text-foreground capitalize text-sm">{formData.category}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Visibility</p>
                    <p className="font-medium text-foreground capitalize text-sm">{formData.visibility}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* If NOT in view mode, show Media Preview on the right */}
          {!isViewMode && (
            <div className="bg-card shadow-sm rounded-xl border border-border p-6 space-y-4 h-fit">
              <h3 className="font-semibold text-lg border-b border-border pb-2 text-foreground">Media</h3>
              <MediaRenderer formData={formData} memory={memory} />

              <div className="pt-4 border-t border-border flex items-center gap-6">
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
          )}
        </div>
      </div>
    </div>
  );
}