import { useCallback, useEffect, useRef, useState } from "react";
import { Search, Play, Pause, Youtube, Loader2, X, FileDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface YtResult {
  id: string;
  title: string;
  channel: string;
  duration: number;
  thumbnail: string;
}

function fmt(sec: number) {
  if (!sec || !isFinite(sec)) return "--:--";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/** Converts in the background and saves the MP3 straight to the device. */
async function convertToMp3(item: YtResult) {
  const t = toast.loading("Converting to MP3…", { description: item.title });
  try {
    // Two attempts: the converter often rejects the first request of a session.
    let data: { url?: string; filename?: string; error?: string } | null = null;
    let lastErr: unknown = null;
    for (let attempt = 0; attempt < 2; attempt++) {
      if (attempt) {
        toast.loading("Still converting…", { id: t, description: item.title });
        await new Promise((r) => setTimeout(r, 1500));
      }
      const res = await supabase.functions.invoke("youtube-mp3", {
        body: { videoId: item.id, title: item.title },
      });
      if (!res.error && res.data?.url) {
        data = res.data;
        break;
      }
      lastErr = res.error ?? res.data?.error;
    }
    if (!data?.url) throw new Error(String(lastErr || "Conversion failed"));

    const filename: string = data.filename || `${item.title}.mp3`;
    toast.loading("Downloading MP3…", { id: t, description: filename });

    // The converter's own host blocks cross-origin reads, so stream it through our backend.
    const proxy =
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/youtube-mp3` +
      `?file=${encodeURIComponent(data.url)}&name=${encodeURIComponent(filename)}`;

    let href = data.url as string;
    let revoke: string | null = null;
    for (const src of [proxy, data.url as string]) {
      try {
        const res = await fetch(src, {
          headers: src === proxy ? { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY } : undefined,
        });
        if (!res.ok) throw new Error("download failed");
        const blob = await res.blob();
        if (blob.size < 10000) throw new Error("empty file");
        href = URL.createObjectURL(new Blob([blob], { type: "audio/mpeg" }));
        revoke = href;
        break;
      } catch {
        /* try the next source */
      }
    }

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
    const watch = `https://www.youtube.com/watch?v=${item.id}`;
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

interface YouTubeTabProps {
  /** Called right before YouTube audio starts, so the main player can stop. */
  onBeforePlay?: () => void;
  /** Reports YouTube audio play/pause state to the parent. */
  onPlayingChange?: (playing: boolean) => void;
}

export function YouTubeTab({ onBeforePlay, onPlayingChange }: YouTubeTabProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<YtResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [current, setCurrent] = useState<YtResult | null>(null);
  const [playing, setPlaying] = useState(false);
  const [converting, setConverting] = useState<string | null>(null);

  const handleConvert = useCallback(async (item: YtResult) => {
    if (converting) return;
    setConverting(item.id);
    try {
      await convertToMp3(item);
    } finally {
      setConverting(null);
    }
  }, [converting]);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const post = useCallback((func: string) => {
    iframeRef.current?.contentWindow?.postMessage(
      JSON.stringify({ event: "command", func, args: [] }),
      "*"
    );
  }, []);

  const search = useCallback(async (raw: string) => {
    const q = raw.trim();
    if (!q) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("youtube-search", {
        body: { query: q },
      });
      if (error) throw error;
      const list: YtResult[] = data?.results ?? [];
      setResults(list);
      if (!list.length) toast.error(data?.error ? "YouTube search is unavailable right now" : "No results found");
    } catch (e) {
      console.error("YouTube search failed:", e);
      setResults([]);
      toast.error("YouTube search failed. Try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  const playItem = (item: YtResult) => {
    onBeforePlay?.();
    if (current?.id === item.id) {
      post(playing ? "pauseVideo" : "playVideo");
      setPlaying((p) => !p);
      return;
    }
    setCurrent(item);
    setPlaying(true);
  };

  useEffect(() => {
    onPlayingChange?.(playing && !!current);
  }, [playing, current, onPlayingChange]);

  // Keep media session-ish title updated
  useEffect(() => {
    if (current && "mediaSession" in navigator) {
      try {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: current.title,
          artist: current.channel,
          artwork: current.thumbnail ? [{ src: current.thumbnail, sizes: "320x180", type: "image/jpeg" }] : [],
        });
      } catch {
        /* ignore */
      }
    }
  }, [current]);

  return (
    <div className="space-y-5">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          search(query);
        }}
        className="relative"
      >
        <div className="relative rounded-2xl bg-white/[0.03] border border-white/[0.06] overflow-hidden focus-within:border-primary/40 focus-within:ring-1 focus-within:ring-primary/30 transition-all">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search YouTube for music…"
            className="w-full bg-transparent py-3 pl-11 pr-11 text-foreground placeholder:text-muted-foreground/70 outline-none font-body text-sm"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </form>

      {/* Audio-only player: the YouTube frame is required for playback but kept out of sight. */}
      {current && (
        <div className="rounded-2xl glass-heavy border border-white/10 p-3 flex items-center gap-3">
          <img
            src={current.thumbnail || `https://i.ytimg.com/vi/${current.id}/mqdefault.jpg`}
            alt=""
            className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
          />
          <div className="min-w-0 flex-1">
            <p className="text-sm text-foreground truncate">{current.title}</p>
            <p className="text-xs text-muted-foreground truncate">{current.channel}</p>
          </div>
          <button
            onClick={() => {
              post(playing ? "pauseVideo" : "playVideo");
              setPlaying((p) => !p);
            }}
            aria-label={playing ? "Pause" : "Play"}
            className="w-11 h-11 rounded-full gradient-primary flex items-center justify-center flex-shrink-0"
          >
            {playing ? (
              <Pause className="w-5 h-5 text-primary-foreground" />
            ) : (
              <Play className="w-5 h-5 text-primary-foreground ml-0.5" />
            )}
          </button>
          <button
            onClick={() => handleConvert(current)}
            disabled={converting === current.id}
            aria-label="Download as MP3"
            title="Download as MP3"
            className="w-11 h-11 rounded-full border border-white/10 bg-white/[0.04] flex items-center justify-center flex-shrink-0 text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors disabled:opacity-60"
          >
            {converting === current.id ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <FileDown className="w-5 h-5" />
            )}
          </button>
          <div className="sr-only" aria-hidden>
            <iframe
              key={current.id}
              ref={iframeRef}
              title="YouTube audio"
              width="1"
              height="1"
              src={`https://www.youtube-nocookie.com/embed/${current.id}?autoplay=1&enablejsapi=1&playsinline=1&controls=0&modestbranding=1&rel=0&origin=${encodeURIComponent(window.location.origin)}`}
              allow="autoplay; encrypted-media"
            />
          </div>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-10 text-muted-foreground gap-2 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" /> Searching YouTube…
        </div>
      )}

      {!loading && results.length === 0 && (
        <div className="text-center py-16">
          <Youtube className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-30" />
          <p className="text-muted-foreground text-sm">Search YouTube and play just the audio</p>
          <p className="text-muted-foreground/50 text-xs mt-1">Keep the app open — YouTube stops on screen lock</p>
        </div>
      )}

      <div className="space-y-1.5">
        {results.map((r) => {
          const isCurrent = current?.id === r.id;
          return (
            <div
              key={r.id}
              className={`w-full flex items-center gap-2 p-2 rounded-xl transition-colors ${
                isCurrent ? "bg-primary/10 border border-primary/30" : "hover:bg-white/[0.04] border border-transparent"
              }`}
            >
              <button
                onClick={() => playItem(r)}
                aria-label={isCurrent && playing ? `Pause ${r.title}` : `Play ${r.title}`}
                className="min-w-0 flex-1 flex items-center gap-3 text-left"
              >
                <img
                  src={r.thumbnail || `https://i.ytimg.com/vi/${r.id}/mqdefault.jpg`}
                  alt=""
                  loading="lazy"
                  className="w-16 h-11 rounded-lg object-cover flex-shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <p className={`text-sm truncate ${isCurrent ? "text-primary" : "text-foreground"}`}>{r.title}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {r.channel} · {fmt(r.duration)}
                  </p>
                </div>
                {isCurrent && playing ? (
                  <Pause className="w-4 h-4 text-primary flex-shrink-0" />
                ) : (
                  <Play className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                )}
              </button>
              <button
                onClick={() => handleConvert(r)}
                disabled={converting === r.id}
                aria-label={`Download ${r.title} as MP3`}
                title="Download as MP3"
                className="w-9 h-9 rounded-lg border border-white/10 bg-white/[0.04] flex items-center justify-center flex-shrink-0 text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors disabled:opacity-60"
              >
                {converting === r.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <FileDown className="w-4 h-4" />
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
