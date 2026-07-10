import React, { useState, useEffect } from 'react';
import { getServerUrl } from '../lib/api';

interface ProtectedMediaProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  mediaType?: 'photo' | 'video' | 'audio';
  src: string;
  poster?: string;
  controls?: boolean;
}

export function ProtectedMedia({ src, mediaType = 'photo', ...props }: ProtectedMediaProps) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (!src) return;

    // Skip Javascript fetching for all media. Native HTML tags will stream videos and load images progressively.
    // We only fetch via JS if it's explicitly required, but since the storage is public we can just use the URL directly.
    setObjectUrl(src);
    return;

    let localBlobUrl: string | null = null;

    const fetchMedia = async () => {
      try {
        const token = localStorage.getItem('admin_token') || localStorage.getItem('token');
        const headers: Record<string, string> = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const res = await fetch(src, { headers });
        if (!res.ok) throw new Error(`Failed to load media: ${res.status}`);
        const blob = await res.blob();
        if (active) {
          localBlobUrl = URL.createObjectURL(blob);
          setObjectUrl(localBlobUrl);
        }
      } catch (e) {
        console.error("Media load error", e);
        // Fallback to original src if fetch fails (e.g. CORS or already public)
        if (active) setObjectUrl(src);
      }
    };

    fetchMedia();

    return () => {
      active = false;
      if (localBlobUrl) {
        URL.revokeObjectURL(localBlobUrl);
      }
    };
  }, [src]);

  if (!objectUrl) {
    // Show a small loader or placeholder while fetching
    return <div className={`animate-pulse bg-muted flex items-center justify-center ${props.className || ''}`}>
      <span className="text-xs text-muted-foreground">Loading...</span>
    </div>;
  }

  if (mediaType === 'video') {
    return <video src={objectUrl} controls {...(props as any)} />;
  }

  if (mediaType === 'audio') {
    return <audio src={objectUrl} controls {...(props as any)} />;
  }

  return <img src={objectUrl} {...props} />;
}
