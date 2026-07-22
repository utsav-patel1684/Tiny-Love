import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation, Link } from "react-router-dom";
import { apiFetch, getServerUrl } from "../lib/api";
import { Loader2, ChevronLeft, ExternalLink, Camera, Video, Volume2, FolderHeart, Trophy, Images } from "lucide-react";
import { ProtectedMedia } from "../components/ProtectedMedia";
import { ImagePreview } from "../components/ImagePreview";
import { useToast } from "@/hooks/use-toast";

export default function BabyDetailPage() {
  const { toast } = useToast();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const isViewMode = true;

  const [baby, setBaby] = useState<any>(null);
  const [parentPhoto, setParentPhoto] = useState<string | null>(null);
  const [memories, setMemories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeCategory, setActiveCategory] = useState<"all" | "photo" | "video" | "voice" | "milestone">("all");
  const [error, setError] = useState<string | null>(null);
  const [profileImageError, setProfileImageError] = useState(false);

  const getMemoryCategory = (m: any) => {
    if (m.type === "milestone") return "milestone";
    const rawUrl = m.mediaUrl || m.media_url || m.thumbnailUrl || m.thumbnail_url;
    let url = "";
    if (rawUrl) {
      url = rawUrl.startsWith('http') ? rawUrl : `${getServerUrl()}${rawUrl.startsWith('/') ? '' : '/'}${rawUrl}`;
    }
    const isVid = m.type === "video" || (url && url.toLowerCase().match(/\.(mp4|webm|ogg|mov)$/i));
    const isAud = m.type === "voice" || m.type === "audio" || (url && url.toLowerCase().match(/\.(mp3|wav|m4a|aac)$/i));

    if (isVid) return "video";
    if (isAud) return "voice";
    return "photo";
  };

  const getFullUrl = (path: string | undefined | null) => {
    if (!path) return "";
    let cleanPath = path;
    if (typeof cleanPath === 'string' && cleanPath.includes(',')) {
      cleanPath = cleanPath.split(',')[0].trim();
    }
    return cleanPath.startsWith('http') ? cleanPath : `${getServerUrl()}${cleanPath.startsWith('/') ? '' : '/'}${cleanPath}`;
  };

  const totalCount = memories.length;
  const photosCount = memories.filter(m => getMemoryCategory(m) === "photo").length;
  const videosCount = memories.filter(m => getMemoryCategory(m) === "video").length;
  const voiceCount = memories.filter(m => getMemoryCategory(m) === "voice").length;
  const milestoneCount = memories.filter(m => getMemoryCategory(m) === "milestone").length;

  const filteredMemories = memories.filter(m => {
    const cat = getMemoryCategory(m);
    if (activeCategory === "photo") return cat === "photo";
    if (activeCategory === "video") return cat === "video";
    if (activeCategory === "voice") return cat === "voice";
    if (activeCategory === "milestone") return cat === "milestone";
    return true;
  });

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

      // Attempt to fetch memories for this baby
      if (isViewMode) {
        try {
          const memsData = await apiFetch<any>(`/admin/memories?limit=1000`);
          const filteredMems = (memsData.data || []).filter((m: any) => String(m.babyId) === String(id) || String(m.baby_id) === String(id));
          setMemories(filteredMems);
        } catch (err) {
          console.error("Failed to fetch baby memories", err);
        }
      }

      // Attempt to fetch parent photo
      try {
        const parentId = data.user_id || data.userId;
        if (parentId) {
          const parentData = await apiFetch<any>(`/admin/users/${parentId}`);
          setParentPhoto(parentData.profileImage || null);
        } else if (data.parentEmail) {
          const usersData = await apiFetch<any>(`/admin/users?limit=100`);
          const parent = usersData.data?.find((u: any) => u.email === data.parentEmail);
          if (parent) setParentPhoto(parent.profileImage || null);
        }
      } catch (err) {
        console.error("Failed to fetch parent photo", err);
      }
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
      toast({
        title: "Success",
        description: "Baby profile updated successfully!",
      });
    } catch (err) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update baby profile.",
      });
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
          <>
            <div className="bg-card shadow-sm rounded-xl border border-border px-6 pb-6 pt-20 mt-16 relative flex flex-col items-center w-full max-w-lg mx-auto">
              {/* Overlapping Photo */}
              <div className="absolute -top-16">
                {baby.profile_photo && !profileImageError ? (
                  <ImagePreview src={getFullUrl(baby.profile_photo)} alt={baby.name}>
                    <img
                      src={getFullUrl(baby.profile_photo)}
                      alt={baby.name}
                      className="w-32 h-32 rounded-full object-cover shadow-lg bg-background"
                      onError={() => setProfileImageError(true)}
                    />
                  </ImagePreview>
                ) : (
                  <div className="w-32 h-32 rounded-full bg-muted flex items-center justify-center shadow-lg border-4 border-background">
                    <span className="text-3xl text-muted-foreground font-bold">
                      {baby.name ? baby.name.charAt(0).toUpperCase() : "B"}
                    </span>
                  </div>
                )}
              </div>

              {/* Name */}
              <h1 className="text-3xl font-serif font-bold text-foreground mb-8">
                {baby.name || "Unknown"}
              </h1>

              <div className="w-full  border-border pt-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <p className="text-xs text-foreground">Date of Birth</p>
                  <p className="font-medium text-foreground">
                    {baby.dob ? new Date(baby.dob).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "-"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-foreground mb-1">Parent Name</p>
                  <div className="flex items-center gap-3">


                    <p className="font-medium text-foreground">{baby.parentName || "Unknown"}</p>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-foreground">Created At</p>
                  <p className="font-medium text-foreground">
                    {new Date(baby.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-foreground">Total Memories</p>
                  <p className="font-medium text-foreground">{baby.memoryCount || 0}</p>
                </div>
              </div>
            </div>

            {/* Memories Section */}
            <div className="mt-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <h2 className="text-xl font-serif font-bold text-foreground">
                  Memories ({memories.length})
                </h2>

                {/* Tabs */}
                {memories.length > 0 && (
                  <div className="flex flex-wrap gap-2 bg-background/50 p-1 rounded-xl border border-border">
                    <button
                      onClick={() => setActiveCategory("all")}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${activeCategory === "all"
                        ? "bg-[#EBA545] text-black shadow-sm"
                        : "text-foreground/75 hover:bg-white/5 hover:text-foreground"
                        }`}
                    >
                      <FolderHeart className="w-3.5 h-3.5" />
                      All ({totalCount})
                    </button>
                    <button
                      onClick={() => setActiveCategory("photo")}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${activeCategory === "photo"
                        ? "bg-[#EBA545] text-black shadow-sm"
                        : "text-foreground/75 hover:bg-white/5 hover:text-foreground"
                        }`}
                    >
                      <Camera className="w-3.5 h-3.5" />
                      Photo ({photosCount})
                    </button>
                    <button
                      onClick={() => setActiveCategory("video")}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${activeCategory === "video"
                        ? "bg-[#EBA545] text-black shadow-sm"
                        : "text-foreground/75 hover:bg-white/5 hover:text-foreground"
                        }`}
                    >
                      <Video className="w-3.5 h-3.5" />
                      Video ({videosCount})
                    </button>
                    <button
                      onClick={() => setActiveCategory("voice")}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${activeCategory === "voice"
                        ? "bg-[#EBA545] text-black shadow-sm"
                        : "text-foreground/75 hover:bg-white/5 hover:text-foreground"
                        }`}
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      Voice ({voiceCount})
                    </button>
                    <button
                      onClick={() => setActiveCategory("milestone")}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${activeCategory === "milestone"
                        ? "bg-[#EBA545] text-black shadow-sm"
                        : "text-foreground/75 hover:bg-white/5 hover:text-foreground"
                        }`}
                    >
                      <Trophy className="w-3.5 h-3.5" />
                      Milestone ({milestoneCount})
                    </button>
                  </div>
                )}
              </div>

              {filteredMemories.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                  {filteredMemories.flatMap(m => {
                    const rawUrl = m.mediaUrl || m.media_url || m.thumbnailUrl || m.thumbnail_url || "";
                    if (typeof rawUrl === 'string' && rawUrl.includes(',')) {
                      const urls = rawUrl.split(',');
                      const rawThumb = m.thumbnailUrl || m.thumbnail_url || "";
                      const thumbs = typeof rawThumb === 'string' ? rawThumb.split(',') : [];

                      return urls.map((u, i) => ({
                        ...m,
                        renderId: `${m.id}-${i}`,
                        originalId: m.id,
                        renderMediaUrl: u.trim(),
                        renderThumbUrl: thumbs[i]?.trim() || thumbs[0]?.trim() || "",
                        mediaIndex: i,
                        mediaCount: urls.length
                      }));
                    }
                    return [{
                      ...m,
                      renderId: m.id,
                      originalId: m.id,
                      renderMediaUrl: rawUrl,
                      renderThumbUrl: m.thumbnailUrl || m.thumbnail_url || "",
                      mediaIndex: 0,
                      mediaCount: 1
                    }];
                  }).map(m => {
                    let url = "";
                    if (m.renderMediaUrl) {
                      url = m.renderMediaUrl.startsWith('http') ? m.renderMediaUrl : `${getServerUrl()}${m.renderMediaUrl.startsWith('/') ? '' : '/'}${m.renderMediaUrl}`;
                    }

                    let thumbUrl = "";
                    if (m.renderThumbUrl) {
                      thumbUrl = m.renderThumbUrl.startsWith('http') ? m.renderThumbUrl : `${getServerUrl()}${m.renderThumbUrl.startsWith('/') ? '' : '/'}${m.renderThumbUrl}`;
                    }

                    const isVid = m.type === "video" || (url && url.toLowerCase().match(/\.(mp4|webm|ogg|mov)$/i));
                    const isAud = m.type === "voice" || m.type === "audio" || (url && url.toLowerCase().match(/\.(mp3|wav|m4a|aac)$/i));
                    const mediaCount = m.mediaCount;

                    return (
                      <div key={m.renderId} className="aspect-square bg-muted rounded-xl border border-border overflow-hidden relative group">
                        {/* Top Right Link to Detail Page */}
                        <Link
                          to={`/memories/${m.originalId}?mode=view`}
                          className="absolute top-2 right-2 bg-black/40 hover:bg-black/70 text-white p-1.5 rounded-full z-30 backdrop-blur-sm transition-colors"
                          title="View Details"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>

                        {/* Fallback Text underneath */}
                        <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground z-0">
                          No Media
                        </div>

                        {/* Media Layer */}
                        {url && (
                          isVid ? (
                            <ProtectedMedia
                              mediaType="video"
                              src={url}
                              poster={thumbUrl || undefined}
                              controls
                              className="absolute inset-0 w-full h-full object-contain group-hover:scale-105 transition-transform duration-300 z-10 bg-black/5"
                            />
                          ) : isAud ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted z-10 group-hover:scale-105 transition-transform duration-300 gap-3">
                              <span className="text-sm font-medium text-muted-foreground">Voice Note</span>
                              <ProtectedMedia
                                mediaType="audio"
                                src={url}
                                controls
                                className="w-[90%] h-8 opacity-90"
                              />
                            </div>
                          ) : (
                            <ImagePreview src={url} alt={m.caption || "Memory photo"}>
                              <ProtectedMedia
                                mediaType="photo"
                                src={url}
                                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 z-10 bg-muted"
                              />
                            </ImagePreview>
                          )
                        )}

                        {/* Caption Layer */}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 pt-6 z-20 pointer-events-none">
                          <p className="text-white text-xs font-medium truncate">{m.caption || m.type}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="bg-card border border-border rounded-xl p-8 text-center">
                  <p className="text-muted-foreground text-sm">No memories found in this category.</p>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="bg-card shadow-sm rounded-xl border border-border px-6 pb-6 pt-20 mt-16 relative flex flex-col items-center w-full">
            {/* Overlapping Photo */}
            <div className="absolute -top-16">
              {baby.profile_photo && !profileImageError ? (
                <ImagePreview src={getFullUrl(baby.profile_photo)} alt={baby.name}>
                  <img
                    src={getFullUrl(baby.profile_photo)}
                    alt={baby.name}
                    className="w-32 h-32 rounded-full object-cover shadow-lg bg-background"
                    onError={() => setProfileImageError(true)}
                  />
                </ImagePreview>
              ) : (
                <div className="w-32 h-32 rounded-full bg-muted flex items-center justify-center shadow-lg border-4 border-background">
                  <span className="text-3xl text-muted-foreground font-bold">
                    {baby.name ? baby.name.charAt(0).toUpperCase() : "B"}
                  </span>
                </div>
              )}
            </div>

            {/* Title */}
            <h1 className="text-3xl font-serif font-bold text-foreground mb-8">
              Edit {baby.name || "Profile"}
            </h1>

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
                  <label className="text-sm font-medium text-foreground">Date of Birth</label>
                  <input
                    type="date"
                    name="dob"
                    value={formData.dob}
                    onChange={handleChange}
                    className="w-full p-2 border border-border rounded-lg bg-background text-foreground"
                  />
                </div>
              </div>
              <div className="pt-4 flex justify-end">
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
    </div>
  );
} 
