import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AudiusTrack } from "@/lib/audius";

/**
 * Video id for a YouTube-sourced track, or null when the track isn't from YouTube.
 * AI DJ stores them as `yt:<id>`; the YouTube tab stores the bare id.
 */
export function getYouTubeVideoId(track: AudiusTrack): string | null {
  const isYouTube = track.source === "youtube" || track.id.startsWith("yt:");
  if (!isYouTube) return null;
  const fromId = track.id.startsWith("yt:") ? track.id.slice(3) : track.id;
  if (fromId && !fromId.includes(":")) return fromId;
  const fromPermalink = /v=([\w-]{6,})/.exec(track.permalink ?? "")?.[1];
  return fromPermalink ?? null;
}

/** Whether this song can be handed to the MP3 converter. */
export function isYouTubeTrack(track: AudiusTrack): boolean {
  return getYouTubeVideoId(track) !== null;
}

/**
 * Converts a YouTube video to MP3 in the background and saves it to the device
 * without leaving the app. Falls back to the converter site when conversion fails.
 */
export async function convertYouTubeToMp3(videoId: string, title: string) {
  const t = toast.loading("Converting to MP3…", { description: title });
  try {
    // Two attempts: the converter often rejects the first request of a session.
    let data: { url?: string; filename?: string; error?: string } | null = null;
    let lastErr: unknown = null;
    for (let attempt = 0; attempt < 2; attempt++) {
      if (attempt) {
        toast.loading("Still converting…", { id: t, description: title });
        await new Promise((r) => setTimeout(r, 1500));
      }
      const res = await supabase.functions.invoke("youtube-mp3", {
        body: { videoId, title },
      });
      if (!res.error && res.data?.url) {
        data = res.data;
        break;
      }
      lastErr = res.error ?? res.data?.error;
    }
    if (!data?.url) throw new Error(String(lastErr || "Conversion failed"));

    const filename: string = data.filename || `${title}.mp3`;
    toast.loading("Downloading MP3…", { id: t, description: filename });

    // The converter's own host blocks cross-origin reads, so stream it through our backend.
    const proxy =
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/youtube-mp3` +
      `?file=${encodeURIComponent(data.url)}&name=${encodeURIComponent(filename)}`;

    let href: string | null = null;
    let revoke: string | null = null;
    for (const src of [proxy, data.url as string]) {
      try {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 120000);
        try {
          const res = await fetch(src, {
            signal: ctrl.signal,
            headers: src === proxy ? { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY } : undefined,
          });
          if (!res.ok) throw new Error("download failed");
          const ctype = res.headers.get("content-type") || "";
          if (ctype.includes("json") || ctype.includes("html")) throw new Error("not audio");
          const blob = await res.blob();
          if (blob.size < 10000) throw new Error("empty file");
          // Reuse the blob directly when already typed, avoiding a second in-memory copy.
          href = URL.createObjectURL(blob.type === "audio/mpeg" ? blob : blob.slice(0, blob.size, "audio/mpeg"));
          revoke = href;
          break;
        } finally {
          clearTimeout(timer);
        }
      } catch {
        /* try the next source */
      }
    }

    if (!href) throw new Error("The converted MP3 could not be downloaded. Try again.");

    const a = document.createElement("a");
    a.href = href;
    a.download = filename;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
    if (revoke) setTimeout(() => URL.revokeObjectURL(revoke), 60000);

    toast.success("Saved as MP3", { id: t, description: filename });
  } catch (e) {
    console.error("MP3 conversion failed:", e);
    // Fallback: copy the link and open the converter so it's one paste away.
    const watch = `https://www.youtube.com/watch?v=${videoId}`;
    let copied = false;
    try {
      await navigator.clipboard.writeText(watch);
      copied = true;
    } catch {
      /* clipboard blocked — the user can still copy from the opened tab */
    }
    window.open("https://cnvmp3.com/v55", "_blank", "noopener,noreferrer");
    toast.info("Finish it on the converter tab", {
      id: t,
      description: copied ? "Link copied — just paste and press convert." : watch,
      duration: 8000,
    });
  }
}

/** Converts a YouTube-sourced song and saves it as an MP3. */
export async function downloadYouTubeTrack(track: AudiusTrack) {
  const videoId = getYouTubeVideoId(track);
  if (!videoId) {
    toast.error("This track can't be downloaded");
    return;
  }
  await convertYouTubeToMp3(videoId, track.title);
}
