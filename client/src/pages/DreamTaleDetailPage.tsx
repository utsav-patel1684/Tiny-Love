import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiFetch, getServerUrl } from "../lib/api";
import {
  ChevronLeft,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Star,
  Clock,
  BookOpen,
  User,
  Mic,
  Globe,
  Calendar,
  SkipBack,
  SkipForward,
} from "lucide-react";
import avtar from "../public/default.jpg";

const BabyIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 12h.01"/><path d="M15 12h.01"/><path d="M10 16c.5.3 1.2.5 2 .5s1.5-.2 2-.5"/>
    <path d="M19 6.3a9 9 0 0 1 1.8 3.9 2 2 0 0 1 0 3.6 9 9 0 0 1-17.6 0 2 2 0 0 1 0-3.6A9 9 0 0 1 12 3c2 0 3.5 1.1 3.5 2.5s-.9 2.5-2 2.5c-.8 0-1.5-.4-1.5-1"/>
  </svg>
);

export default function DreamTaleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [dreamTale, setDreamTale] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  // Audio player state
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [audioSrc, setAudioSrc] = useState<string | null>(null);

  useEffect(() => {
    fetchDreamTale();
  }, [id]);

  const fetchDreamTale = async () => {
    setLoading(true);
    try {
      const data = await apiFetch<any>(`/admin/dream-tales/${id}`);
      setDreamTale(data);
      const base64 = data.audio_base64 || data.audioBase64;
      if (base64) {
        setAudioSrc(`data:audio/mpeg;base64,${base64}`);
      }
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Failed to load Dream Tale data.");
    } finally {
      setLoading(false);
    }
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    audioRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) setAudioDuration(audioRef.current.duration);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = val;
      setCurrentTime(val);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (audioRef.current) audioRef.current.volume = val;
    setVolume(val);
    setIsMuted(val === 0);
  };

  const skip = (secs: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Math.min(
      Math.max(audioRef.current.currentTime + secs, 0),
      audioDuration
    );
  };

  const formatTime = (s: number) => {
    if (!s || isNaN(s)) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "long", day: "numeric", year: "numeric",
    });
  };

  const getCoverImage = (img: string) => {
    if (!img) return avtar;
    if (img.startsWith("http://") || img.startsWith("https://")) return img;
    return `${getServerUrl()}${img.startsWith("/") ? "" : "/"}${img}`;
  };

  const storyText = dreamTale?.story_text || dreamTale?.storyText || "";
  const wordCount = storyText.split(/\s+/).filter(Boolean).length;
  const truncated = storyText.split(/\s+/).slice(0, 80).join(" ") + (wordCount > 80 ? "…" : "");
  const progress = audioDuration > 0 ? (currentTime / audioDuration) * 100 : 0;

  const styleBadgeColor: Record<string, string> = {
    bedtime_calm: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
    adventure: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    magical: "bg-purple-500/20 text-purple-300 border-purple-500/30",
    educational: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="w-10 h-10 border-4 border-white/10 border-t-[#EBA545] rounded-full animate-spin" />
        <span className="text-white/60 text-sm animate-pulse">Loading dream tale…</span>
      </div>
    );
  }

  if (error || !dreamTale) {
    return (
      <div className="p-6 text-rose-400 bg-rose-500/10 border border-rose-500/30 rounded-xl">
        {error || "Dream Tale not found."}
      </div>
    );
  }

  const coverImg = getCoverImage(dreamTale.cover_image_url);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-sm font-medium text-white/70 hover:text-white transition-colors cursor-pointer group"
      >
        <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        Back to Dream Tales
      </button>

      {/* Hero Card */}
      <div className="relative rounded-2xl overflow-hidden border border-border shadow-2xl min-h-[200px]">
        <div
          className="absolute inset-0 bg-cover bg-center scale-110 blur-xl opacity-25"
          style={{ backgroundImage: `url(${coverImg})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/70 to-black/95" />

        <div className="relative z-10 p-6 md:p-8 flex flex-col md:flex-row gap-6 items-start md:items-start">
          {/* Cover Image */}
          <div className="relative shrink-0">
            <img
              src={coverImg}
              alt={dreamTale.title || "Cover"}
              className="w-32 h-32 md:w-40 md:h-40 rounded-2xl object-cover shadow-2xl border-2 border-white/20 hover:scale-105 transition-transform duration-300"
              onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = avtar; }}
            />
            {dreamTale.is_favorite && (
              <span className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-amber-400 flex items-center justify-center shadow-lg">
                <Star className="w-4 h-4 fill-amber-900 text-amber-900" />
              </span>
            )}
          </div>

          {/* Title, Meta & Player */}
          <div className="flex-1 min-w-0 w-full">
            <div className="flex flex-wrap gap-2 mb-2">
              {dreamTale.story_style && (
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border uppercase tracking-wider ${styleBadgeColor[dreamTale.story_style] || "bg-white/10 text-white/60 border-white/20"}`}>
                  {dreamTale.story_style.replace(/_/g, " ")}
                </span>
              )}
              {dreamTale.is_favorite && (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full border bg-amber-400/20 text-amber-300 border-amber-400/30 uppercase tracking-wider">
                  ★ Favorite
                </span>
              )}
            </div>

            <h1 className="text-2xl md:text-3xl font-bold text-white leading-tight mb-3 drop-shadow">
              {dreamTale.title || "Dream Tale"}
            </h1>

            <div className="flex flex-wrap gap-4 text-sm text-white/70 mb-5">
              {dreamTale.babyName && (
                <span className="flex items-center gap-1.5">
                  <span className="text-[#EBA545]"><BabyIcon /></span>
                  {dreamTale.babyName}
                </span>
              )}
              {dreamTale.userName && (
                <span className="flex items-center gap-1.5">
                  <User className="w-4 h-4 text-[#EBA545]" />
                  {dreamTale.userName}
                </span>
              )}
              {dreamTale.duration_seconds && (
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-[#EBA545]" />
                  {formatTime(dreamTale.duration_seconds)}
                </span>
              )}
              {dreamTale.voice_name && (
                <span className="flex items-center gap-1.5">
                  <Mic className="w-4 h-4 text-[#EBA545]" />
                  {dreamTale.voice_name}
                </span>
              )}
              {dreamTale.language && (
                <span className="flex items-center gap-1.5 capitalize">
                  <Globe className="w-4 h-4 text-[#EBA545]" />
                  {dreamTale.language}
                </span>
              )}
            </div>

            {/* Audio Player inline */}
            {audioSrc && (
              <div className="w-full">
                <audio
                  ref={audioRef}
                  src={audioSrc}
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={handleLoadedMetadata}
                  onEnded={() => setIsPlaying(false)}
                  preload="metadata"
                />

                {/* Seek Bar */}
                <div className="mb-3">
                  <div className="relative h-1.5 bg-white/20 rounded-full overflow-hidden">
                    <div
                      className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-[#EBA545] to-amber-300 transition-all duration-100"
                      style={{ width: `${progress}%` }}
                    />
                    <input
                      type="range"
                      min={0}
                      max={audioDuration || 0}
                      step={0.1}
                      value={currentTime}
                      onChange={handleSeek}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                  </div>
                  <div className="flex justify-between text-xs text-white/40 mt-1 tabular-nums">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(audioDuration)}</span>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button onClick={() => skip(-10)} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer" title="Back 10s">
                      <SkipBack className="w-4 h-4" />
                    </button>
                    <button onClick={togglePlay} className="w-11 h-11 rounded-full bg-[#EBA545] hover:bg-amber-400 flex items-center justify-center text-black shadow-lg transition-all active:scale-95 cursor-pointer">
                      {isPlaying ? <Pause className="w-5 h-5 fill-black" /> : <Play className="w-5 h-5 fill-black ml-0.5" />}
                    </button>
                    <button onClick={() => skip(10)} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer" title="Forward 10s">
                      <SkipForward className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button onClick={toggleMute} className="text-white/50 hover:text-white transition-colors cursor-pointer">
                      {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </button>
                    <div className="relative w-20 h-1.5 bg-white/20 rounded-full">
                      <div className="absolute left-0 top-0 h-full bg-[#EBA545] rounded-full" style={{ width: `${(isMuted ? 0 : volume) * 100}%` }} />
                      <input type="range" min={0} max={1} step={0.01} value={isMuted ? 0 : volume} onChange={handleVolumeChange} className="absolute inset-0 w-full opacity-0 cursor-pointer" />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>



      {/* Story */}
      {storyText && (
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-white/40 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#EBA545]" />
              Story
            </h2>
            {wordCount > 80 && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-xs font-semibold text-[#EBA545] hover:text-amber-300 transition-colors cursor-pointer"
              >
                {isExpanded ? "Read Less ↑" : "Read More ↓"}
              </button>
            )}
          </div>

          <div className="relative">
            <div
              className={`bg-background/50 rounded-xl p-5 border border-border text-white/80 text-sm leading-relaxed font-serif ${isExpanded ? "whitespace-pre-wrap" : "whitespace-normal"} ${!isExpanded && wordCount > 80 ? "line-clamp-6" : ""}`}
            >
              {isExpanded ? storyText : truncated}
            </div>
            {!isExpanded && wordCount > 80 && (
              <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-card to-transparent rounded-b-xl pointer-events-none" />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
