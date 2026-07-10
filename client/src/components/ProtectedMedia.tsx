import React, { useState, useEffect, useRef } from 'react';
import { getServerUrl } from '../lib/api';
import { Loader2 } from 'lucide-react';

interface ProtectedMediaProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  mediaType?: 'photo' | 'video' | 'audio';
  src: string;
  poster?: string;
  controls?: boolean;
}

const isHEIC = async (blob: Blob): Promise<boolean> => {
  if (blob.type === 'image/heic' || blob.type === 'image/heif') return true;
  try {
    const headerBytes = new Uint8Array(await blob.slice(0, 12).arrayBuffer());
    const hasFtyp = headerBytes[4] === 102 && headerBytes[5] === 116 && headerBytes[6] === 121 && headerBytes[7] === 112;
    if (!hasFtyp) return false;
    const brand = String.fromCharCode(...headerBytes.slice(8, 12)).toLowerCase();
    return ['heic', 'heix', 'hevc', 'hevx', 'mif1', 'msf1'].includes(brand);
  } catch {
    return false;
  }
};

// Chrome/Firefox/Edge have no built-in HEIC decoder - there is no way to show raw HEIC
// bytes in an <img> there. Safari/WebKit can. So probe the real blob against this browser's
// actual decoder first, and only pay the heic-to conversion cost when native decode fails.
const canDecodeNatively = (url: string, timeoutMs = 4000): Promise<boolean> => {
  return new Promise((resolve) => {
    const testImg = new Image();
    const timer = setTimeout(() => resolve(false), timeoutMs);
    testImg.onload = () => { clearTimeout(timer); resolve(true); };
    testImg.onerror = () => { clearTimeout(timer); resolve(false); };
    testImg.src = url;
  });
};

// Camera HEIC files are commonly 12MP+. Encoding the full-resolution frame to JPEG is the
// slow part of the conversion (canvas toBlob cost scales with pixel count), but this app
// only ever displays these at a few hundred px. Decode via bitmap, downscale, then encode
// the small canvas instead - same decode cost, far less encode cost.
const MAX_CONVERTED_DIMENSION = 1280;

const heicBlobToResizedJpeg = async (blob: Blob, quality = 0.82): Promise<Blob> => {
  const { heicTo } = await import('heic-to');
  const bitmap = (await heicTo({ blob, type: 'bitmap' })) as ImageBitmap;
  try {
    const scale = Math.min(1, MAX_CONVERTED_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context unavailable');
    ctx.drawImage(bitmap, 0, 0, width, height);

    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (out) => (out ? resolve(out) : reject(new Error("Can't convert canvas to blob."))),
        'image/jpeg',
        quality
      );
    });
  } finally {
    bitmap.close();
  }
};

// Cache the final displayable blob per src so the same photo is never re-fetched or
// re-decoded across remounts (grid thumbnail + detail page, React strict-mode double effect, etc).
const mediaCache = new Map<string, Promise<Blob>>();

const FETCH_TIMEOUT_MS = 20000;

export function ProtectedMedia({ src, mediaType = 'photo', ...props }: ProtectedMediaProps) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // We use references instead of 'let' to safely track active states and cleanup actions across rendering lifecycles
  const activeRef = useRef(true);
  const localBlobUrlRef = useRef<string | null>(null);

  useEffect(() => {
    activeRef.current = true;
    if (!src) return;

    // If it's an external URL (not our server), just use it
    if (src.startsWith('http') && !src.includes(getServerUrl())) {
      setObjectUrl(src);
      return;
    }

    const loadRawBlob = async (): Promise<Blob> => {
      const token = localStorage.getItem('admin_token') || localStorage.getItem('token');
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
      
      try {
        const res = await fetch(src, { headers, signal: controller.signal });
        if (!res.ok) throw new Error(`Failed to load media: ${res.status}`);
        return await res.blob();
      } catch (fetchErr: any) {
        if (fetchErr?.name === 'AbortError') {
          throw new Error(`Timed out loading media after ${FETCH_TIMEOUT_MS / 1000}s`);
        }
        throw fetchErr;
      } finally {
        clearTimeout(timeoutId);
      }
    };

    // Resolves to the final blob this component should display: original bytes for
    // non-HEIC/natively-decodable media, or a downscaled JPEG for HEIC on browsers that
    // can't render it. Cached by src so repeat mounts skip the fetch + decode entirely.
    const resolveDisplayBlob = async (): Promise<Blob> => {
      const blob = await loadRawBlob();
      if (mediaType !== 'photo' || !(await isHEIC(blob))) return blob;

      const nativeUrl = URL.createObjectURL(blob);
      const nativelySupported = await canDecodeNatively(nativeUrl);
      URL.revokeObjectURL(nativeUrl);
      if (nativelySupported) {
        console.log("⚡ [ProtectedMedia]: HEIC detected, browser can decode it natively - serving original bytes, no conversion.");
        return blob;
      }

      console.log("⚡ [ProtectedMedia]: HEIC detected, no native decoder - converting to a downscaled JPEG via heic-to.");
      return heicBlobToResizedJpeg(blob);
    };

    const fetchMedia = async () => {
      try {
        if (!mediaCache.has(src)) {
          mediaCache.set(src, resolveDisplayBlob());
        }
        const finalBlob = await mediaCache.get(src)!;

        if (activeRef.current) {
          localBlobUrlRef.current = URL.createObjectURL(finalBlob);
          setObjectUrl(localBlobUrlRef.current);
        }
      } catch (e: any) {
        mediaCache.delete(src);
        console.error("Media load error", e);
        if (activeRef.current) {
          setError(e.message || String(e));
          // Fallback to original src if fetch fails (e.g. CORS or already public)
          setObjectUrl(src);
        }
      }
    };

    fetchMedia();

    return () => {
      activeRef.current = false;
      if (localBlobUrlRef.current) {
        URL.revokeObjectURL(localBlobUrlRef.current);
        localBlobUrlRef.current = null;
      }
    };
  }, [src]);

  if (error) {
    return (
      <div className={`p-4 border border-rose-200 bg-rose-50 text-rose-600 rounded text-xs ${props.className || ''}`}>
        Media Error: {error}
      </div>
    );
  }

  if (!objectUrl) {
    return (
      <div className={`flex flex-col items-center justify-center bg-muted/40 backdrop-blur-sm gap-2 min-h-[120px] ${props.className || ''}`}>
        <Loader2 className="w-5 h-5 text-primary animate-spin" />
        <span className="text-[10px] font-medium text-muted-foreground tracking-wide">Loading Media...</span>
      </div>
    );
  }

  if (mediaType === 'video') {
    return <video src={objectUrl} controls {...(props as any)} />;
  }

  if (mediaType === 'audio') {
    return <audio src={objectUrl} controls {...(props as any)} />;
  }

  return <img src={objectUrl} {...props} />;
}
