import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Sparkles, Send, Loader2, PlayCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AudiusTrack, searchTracks } from "@/lib/audius";
import { TrackList } from "./TrackList";
import { toast } from "sonner";
import { Button } from "./ui/button";

interface Msg { role: "user" | "assistant"; content: string }

interface Props {
  currentTrackId?: string;
  isPlaying: boolean;
  onPlayList: (tracks: AudiusTrack[], index: number) => void;
  isFavorite: (id: string) => boolean;
  onToggleFavorite: (t: AudiusTrack) => void;
  onStartRadio: (t: AudiusTrack) => void;
}

const SUGGESTION_GROUPS = [
  { name: "Years & charts", ideas: [
    "Top 20 hits of 1985", "Top 20 R&B hits of the 1990s", "Disco classics from 1977–1979",
    "Best pop songs of 2005", "1960s Motown essentials", "2000s indie rock favorites",
  ] },
  { name: "Artists", ideas: [
    "Best of Daft Punk and similar artists", "Prince deep cuts and fan favorites", "Sade and smooth soul classics",
    "Fleetwood Mac and 70s soft rock", "Kendrick Lamar and conscious hip hop", "Björk and adventurous electronic pop",
  ] },
  { name: "Moods", ideas: [
    "Chill lofi for late-night coding", "Dreamy songs for a rainy Sunday", "Feel-good soul to lift my mood",
    "Quiet piano for winding down", "Dark synthwave for a midnight drive", "Heartbreak songs with powerful vocals",
  ] },
  { name: "Genres & moments", ideas: [
    "High-energy workout hip hop", "Afrobeats and amapiano party mix", "Classic salsa and Latin dance favorites",
    "Jazz for a relaxed dinner", "Reggae for a sunny afternoon", "Epic film scores for focused work",
  ] },
];

interface YtResult { id: string; title: string; channel: string; duration: number; thumbnail: string }

async function youTubeTop(query: string): Promise<AudiusTrack | null> {
  try {
    const { data } = await supabase.functions.invoke("youtube-search", { body: { query } });
    const r: YtResult | undefined = (data?.results ?? []).find((x: YtResult) => x.duration > 60 && x.duration < 900);
    if (!r) return null;
    return {
      id: `yt:${r.id}`, title: r.title, user: { name: r.channel, id: r.channel },
      artwork: { "150x150": r.thumbnail, "480x480": r.thumbnail, "1000x1000": r.thumbnail },
      duration: r.duration, genre: "YouTube", play_count: 0,
      permalink: `https://www.youtube.com/watch?v=${r.id}`, source: "youtube",
    };
  } catch { return null; }
}

async function buildFromQueries(queries: string[]): Promise<AudiusTrack[]> {
  const list = queries.slice(0, 25);
  const [yt, results] = await Promise.all([
    Promise.all(list.slice(0, 15).map(youTubeTop)),
    Promise.allSettled(list.map((q) => searchTracks(q, 6, 0, { includeArchive: false, timeoutMs: 7000 }))),
  ]);
  const seen = new Set<string>();
  const out: AudiusTrack[] = [];
  const extras: AudiusTrack[] = [];
  results.forEach((r, qi) => {
    const y = yt[qi];
    if (y && !seen.has(y.id)) { seen.add(y.id); out.push(y); }
    if (r.status !== "fulfilled") return;
    r.value.forEach((t, i) => {
      if (seen.has(t.id)) return;
      seen.add(t.id);
      (i < 1 ? out : extras).push(t);
    });
  });
  return [...out, ...extras].slice(0, 60);
}

export function AiDjTab(p: Props) {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState<"" | "thinking" | "searching">("");
  const [playlist, setPlaylist] = useState<{ title: string; tracks: AudiusTrack[] } | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const requestInFlight = useRef(false);
  const [ideaGroup, setIdeaGroup] = useState(0);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }); }, [msgs, busy]);

  const send = async (text: string) => {
    const content = text.trim();
    if (!content || requestInFlight.current) return;
    requestInFlight.current = true;
    const next = [...msgs, { role: "user" as const, content }];
    setMsgs(next);
    setInput("");
    setBusy("thinking");
    try {
      const { data, error } = await supabase.functions.invoke("ai-playlist", { body: { messages: next } });
      if (error || data?.error) {
        let msg = data?.error;
        if (!msg && error && "context" in error) {
          try { msg = (await (error as { context: Response }).context.json())?.error; } catch { /* ignore */ }
        }
        throw new Error(msg || "The AI couldn't build a playlist.");
      }
      const queries: string[] = Array.isArray(data?.queries)
        ? data.queries.filter((q: unknown): q is string => typeof q === "string" && q.trim().length > 0)
        : [];
      if (!queries.length) throw new Error("The AI didn't return any searches. Try describing your mix again.");
      setMsgs((m) => [...m, { role: "assistant", content: data?.reply ?? "Here's your mix." }]);
      setBusy("searching");
      const tracks = await buildFromQueries(queries);
      if (!tracks.length) {
        setMsgs((m) => [...m, { role: "assistant", content: "I couldn't find those songs in the free catalogs. Try describing it differently." }]);
        return;
      }
      setPlaylist({ title: data?.title ?? "AI Mix", tracks });
      p.onPlayList(tracks, 0);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Something went wrong";
      toast.error(msg);
      setMsgs((m) => [...m, { role: "assistant", content: msg }]);
    } finally {
      requestInFlight.current = false;
      setBusy("");
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-3xl tracking-[0.05em] uppercase gradient-text flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-primary" /> AI DJ
        </h2>
      </div>

      <div className="glass-card rounded-3xl p-3 space-y-3">
        <details open={msgs.length === 0} className="space-y-3">
          <summary className="cursor-pointer text-sm font-medium text-foreground">Mix ideas</summary>
          <div role="tablist" aria-label="Playlist idea categories" className="grid grid-cols-2 gap-1 rounded-lg bg-background/50 p-1 sm:grid-cols-4">
            {SUGGESTION_GROUPS.map((group, i) => (
              <Button key={group.name} role="tab" aria-selected={ideaGroup === i} aria-controls="ai-dj-ideas" id={`ai-dj-group-${i}`}
                variant={ideaGroup === i ? "secondary" : "ghost"} size="sm" onClick={() => setIdeaGroup(i)} className="min-w-0 px-2 text-xs">
                {group.name}
              </Button>
            ))}
          </div>
          <div id="ai-dj-ideas" role="tabpanel" aria-labelledby={`ai-dj-group-${ideaGroup}`} className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {SUGGESTION_GROUPS[ideaGroup].ideas.map((s) => (
              <Button key={s} variant="secondary" disabled={!!busy} onClick={() => send(s)}
                className="h-auto min-h-10 justify-start whitespace-normal break-words px-3 py-2 text-left text-xs font-normal">
                <Sparkles className="shrink-0 text-primary" /> {s}
              </Button>
            ))}
          </div>
        </details>
        <div className="space-y-2 max-h-72 overflow-y-auto">
          {msgs.map((m, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              className={`text-sm px-3 py-2 rounded-2xl max-w-[85%] whitespace-pre-wrap ${m.role === "user" ? "ml-auto gradient-primary text-primary-foreground" : "bg-secondary/60 text-foreground"}`}>
              {m.content}
            </motion.div>
          ))}
          {busy && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground px-1">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
              {busy === "thinking" ? "Thinking up your playlist…" : "Finding the tracks…"}
            </div>
          )}
          <div ref={endRef} />
        </div>
        <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
            rows={2}
            aria-label="Describe your playlist"
            placeholder="e.g. 90s R&B slow jams, Prince deep cuts, songs for a rainy Sunday…"
            className="flex-1 resize-none bg-background/50 border border-border rounded-2xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <Button size="icon" type="submit" disabled={!input.trim() || !!busy} aria-label="Send"
            className="w-10 h-10 rounded-full gradient-primary text-primary-foreground flex items-center justify-center disabled:opacity-40">
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>

      {playlist && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-heading text-xl tracking-wide uppercase text-foreground">{playlist.title}</h3>
            <Button size="sm" onClick={() => p.onPlayList(playlist.tracks, 0)} className="shrink-0 flex items-center gap-1.5 px-4 py-2 gradient-primary text-primary-foreground rounded-full text-xs font-medium">
              <PlayCircle className="w-4 h-4" /> Play all
            </Button>
          </div>
          <TrackList
            tracks={playlist.tracks}
            currentTrackId={p.currentTrackId}
            isPlaying={p.isPlaying}
            onPlay={(_, i) => p.onPlayList(playlist.tracks, i)}
            isFavorite={p.isFavorite}
            onToggleFavorite={p.onToggleFavorite}
            onStartRadio={p.onStartRadio}
          />
        </div>
      )}
    </div>
  );
}
