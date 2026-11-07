import { useCallback, useEffect, useRef, useState } from "react";
import { Search, Play, Pause, Youtube, Loader2, X, FileDown, ArrowUpRight, Headphones, Disc3, Radio, Sparkles, AudioLines } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Artwork } from "./Artwork";
import { Button } from "./ui/button";
import { EqualizerBars } from "./EqualizerBars";
import sessionImage from "@/assets/youtube-session.jpg";

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
        } finally { clearTimeout(timer); }
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
  const startupRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const clearStartup = () => clearTimeout(startupRef.current);
  const armStartup = () => {
    clearStartup();
    startupRef.current = setTimeout(() => setPlaying(false), 15000);
  };
  useEffect(() => () => clearTimeout(startupRef.current), []);

  const post = useCallback((func: string, args: unknown[] = []) => {
    iframeRef.current?.contentWindow?.postMessage(
      JSON.stringify({ event: "command", func, args }),
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
      const willPlay = !playing;
      post(willPlay ? "playVideo" : "pauseVideo");
      setPlaying(willPlay);
      if (willPlay) armStartup(); else clearStartup();
      return;
    }
    setCurrent(item);
    setPlaying(true);
    armStartup();
  };

  useEffect(() => {
    onPlayingChange?.(playing && !!current);
  }, [playing, current, onPlayingChange]);

  // Playback state comes from the player itself, so a track that ends, pauses or
  // fails to start stops the header equalizer instead of animating forever.
  const readyRef = useRef(false);
  useEffect(() => {
    const frame = iframeRef.current;
    if (!frame || !current) return;
    const YT_ORIGIN = "https://www.youtube.com";
    readyRef.current = false;
    const onMessage = (e: MessageEvent) => {
      if (e.source !== frame.contentWindow || e.origin !== YT_ORIGIN) return;
      try {
        const msg = typeof e.data === "string" ? JSON.parse(e.data) : e.data;
        if (!msg || typeof msg !== "object") return;
        if (msg.event === "onReady" || (!readyRef.current && msg.event === "infoDelivery")) {
          readyRef.current = true;
          clearInterval(handshake);
          post("addEventListener", ["onStateChange"]);
          post("addEventListener", ["onError"]);
        }
        if (msg.event === "onError") {
          setPlaying(false);
          return;
        }
        const state = msg.event === "onStateChange"
          ? msg.info
          : msg.event === "infoDelivery" ? msg.info?.playerState : undefined;
        if (state === 1) { clearStartup(); setPlaying(true); }
        else if (state === 0 || state === 2 || state === 5 || state === -1) setPlaying(false);
      } catch { /* Ignore non-player messages. */ }
    };
    window.addEventListener("message", onMessage);
    const subscribe = () => {
      frame.contentWindow?.postMessage(JSON.stringify({ event: "listening", id: "pulse-yt-tab" }), YT_ORIGIN);
    };
    subscribe();
    const handshake = setInterval(subscribe, 500);
    return () => {
      window.removeEventListener("message", onMessage);
      clearInterval(handshake);
    };
  }, [current, post]);

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
    <div className="youtube-page space-y-6">
      <section className="yt-session relative isolate overflow-hidden" aria-label="YouTube Music">
        <img src={sessionImage} alt="Red headphones on a silver turntable" width={1536} height={768} className="yt-session-image absolute inset-0 h-full w-full object-cover" />
        <div className="yt-session-shade absolute inset-0" />
        <div className="relative flex min-h-[190px] flex-col justify-between p-5 sm:min-h-[230px] sm:p-7">
          <div className="flex items-center gap-2 text-xs font-medium">
            <Youtube className="h-5 w-5" />
            <span>YouTube Music</span>
          </div>
          <div>
            <h1 className="yt-session-title text-4xl sm:text-5xl leading-none">Your next obsession.</h1>
            <div className="mt-3 flex items-center gap-2 text-xs">
              <Headphones className="h-3.5 w-3.5" />
              <span>Deep cuts. Big hits. All yours.</span>
            </div>
          </div>
        </div>
        <div className="yt-session-stamp absolute bottom-5 right-5 hidden sm:flex h-10 w-10 items-center justify-center rounded-full"><Disc3 className="h-5 w-5" /></div>
      </section>

      <form onSubmit={(e) => { e.preventDefault(); search(query); }} className="relative">
        <div className="flex items-center gap-2 rounded-lg bg-card border border-border p-1.5 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/30 transition-all">
          <Search className="ml-2 h-4 w-4 shrink-0 text-primary" />
          <input aria-label="Search YouTube music" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Artists, songs, or a whole mood…" className="min-w-0 flex-1 bg-transparent py-2 text-foreground placeholder:text-muted-foreground outline-none font-body text-sm" />
          {query && <Button type="button" variant="ghost" size="icon" onClick={() => setQuery("")} aria-label="Clear search" title="Clear search" className="h-8 w-8 shrink-0"><X /></Button>}
          <Button type="submit" size="icon" disabled={loading} aria-label="Search" title="Search" className="h-10 w-10 shrink-0">{loading ? <Loader2 className="animate-spin" /> : <ArrowUpRight />}</Button>
        </div>
      </form>

      {current && (
        <section aria-label="Now playing" className="yt-deck border-y border-primary/30 py-4">
          <div className="mb-3 flex items-center justify-between text-[10px] font-semibold uppercase text-muted-foreground">
            <span className="flex items-center gap-2"><span className={`h-1.5 w-1.5 rounded-full ${playing ? "bg-primary" : "bg-muted-foreground"}`} />{playing ? "On air" : "Paused"}</span>
            <EqualizerBars isPlaying={playing} barCount={12} />
          </div>
          <div className="flex items-center gap-3">
            <Artwork track={{ id: `yt:${current.id}`, title: current.title, source: "youtube", artwork: { "480x480": current.thumbnail } }} alt="" shape="wide" className="h-16 w-16 rounded-lg object-cover shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 text-sm font-semibold text-foreground">{current.title}</p>
              <p className="mt-1 truncate text-xs text-muted-foreground">{current.channel}</p>
            </div>
            <Button onClick={() => { const willPlay = !playing; post(willPlay ? "playVideo" : "pauseVideo"); setPlaying(willPlay); if (willPlay) armStartup(); else clearStartup(); }} aria-label={playing ? "Pause" : "Play"} title={playing ? "Pause" : "Play"} size="icon" className="h-11 w-11 rounded-full shrink-0">{playing ? <Pause /> : <Play />}</Button>
            <Button onClick={() => handleConvert(current)} disabled={converting === current.id} aria-label="Download as MP3" title="Download as MP3" variant="ghost" size="icon" className="shrink-0 text-muted-foreground">{converting === current.id ? <Loader2 className="animate-spin" /> : <FileDown />}</Button>
          </div>
          <div className="sr-only" aria-hidden>
            <iframe key={current.id} ref={iframeRef} title="YouTube audio" width="1" height="1" src={`https://www.youtube-nocookie.com/embed/${current.id}?autoplay=1&enablejsapi=1&playsinline=1&controls=0&modestbranding=1&rel=0&origin=${encodeURIComponent(window.location.origin)}`} allow="autoplay; encrypted-media" />
          </div>
        </section>
      )}

      {!results.length && !loading && (
        <section aria-label="Explore music">
          <div className="mb-4 flex items-center justify-between"><h2 className="text-xl text-foreground">Find your frequency</h2><Sparkles className="h-4 w-4 text-primary" /></div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "After hours", detail: "Late-night R&B", query: "late night R&B songs", icon: Headphones },
              { label: "On repeat", detail: "Today's biggest hits", query: "top hits music 2026", icon: Disc3 },
              { label: "Time machine", detail: "90s & 00s essentials", query: "90s 2000s classic hits", icon: Radio },
              { label: "Deep focus", detail: "Lo-fi & instrumentals", query: "lofi instrumental beats", icon: AudioLines },
            ].map((idea) => (
              <Button key={idea.label} variant="outline" onClick={() => { setQuery(idea.query); search(idea.query); }} className="yt-discovery h-auto min-h-[120px] flex-col items-start justify-between whitespace-normal bg-card p-4 text-left">
                <div className="flex w-full items-center justify-between text-primary"><idea.icon className="h-5 w-5" /><ArrowUpRight className="h-3.5 w-3.5" /></div>
                <div className="mt-4"><span className="block text-sm font-semibold text-foreground">{idea.label}</span><span className="mt-1 block text-[11px] font-normal text-muted-foreground">{idea.detail}</span></div>
              </Button>
            ))}
          </div>
        </section>
      )}

      {loading && <div role="status" className="flex items-center justify-center gap-3 py-10 text-sm text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin text-primary" />Finding your next favorite…</div>}

      {results.length > 0 && (
        <section aria-label="Search results" className={loading ? "opacity-50" : ""}>
          <div className="mb-3 flex items-center justify-between border-b border-border pb-3"><h2 className="text-xl text-foreground">In the mix</h2><span className="text-xs text-muted-foreground">{results.length} tracks</span></div>
          <div className="space-y-1">
            {results.map((r, index) => {
              const isCurrent = current?.id === r.id;
              return (
                <div key={r.id} className={`yt-track flex w-full items-center gap-1 rounded-lg border p-2 transition-colors sm:gap-3 ${isCurrent ? "border-primary/30 bg-primary/10" : "border-transparent hover:bg-muted/60"}`}>
                  <span className={`hidden w-5 shrink-0 text-center text-[11px] tabular-nums sm:block ${isCurrent ? "text-primary" : "text-muted-foreground"}`}>{String(index + 1).padStart(2, "0")}</span>
                  <Button variant="ghost" onClick={() => playItem(r)} aria-label={isCurrent && playing ? `Pause ${r.title}` : `Play ${r.title}`} className="h-auto min-w-0 flex-1 justify-start gap-3 whitespace-normal p-0 text-left hover:bg-transparent hover:text-foreground">
                    <div className="relative shrink-0"><Artwork track={{ id: `yt:${r.id}`, title: r.title, source: "youtube", artwork: { "480x480": r.thumbnail } }} alt="" shape="wide" className="h-12 w-16 rounded-md object-cover" />{isCurrent && <span className="absolute inset-0 flex items-center justify-center rounded-md bg-background/70">{playing ? <Pause className="text-primary" /> : <Play className="text-primary" />}</span>}</div>
                    <div className="min-w-0 flex-1"><p className={`line-clamp-2 text-sm leading-snug ${isCurrent ? "text-primary" : "text-foreground"}`}>{r.title}</p><p className="mt-1 truncate text-xs font-normal text-muted-foreground">{r.channel} · {fmt(r.duration)}</p></div>
                  </Button>
                  <Button onClick={() => handleConvert(r)} disabled={converting === r.id} aria-label={`Download ${r.title} as MP3`} title="Download as MP3" variant="ghost" size="icon" className="h-9 w-9 shrink-0 text-muted-foreground hover:text-primary">{converting === r.id ? <Loader2 className="animate-spin" /> : <FileDown />}</Button>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
