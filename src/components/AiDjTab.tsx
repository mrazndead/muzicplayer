import { useState, useRef, useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Sparkles, Send, Loader2, PlayCircle, Disc3, CalendarDays, Mic2, Heart, Headphones, ArrowUpRight } from "lucide-react";
import studioImage from "@/assets/ai-dj-studio.jpg";
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
const GROUP_ICONS = [CalendarDays, Mic2, Heart, Headphones];

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
  const reducedMotion = useReducedMotion();

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
    <div className="ai-dj-page space-y-6">
      <header className="ai-dj-cover relative -mx-4 overflow-hidden px-5 py-7 sm:mx-0 sm:px-8 sm:py-10">
        <img src={studioImage} width={1536} height={768} alt="DJ mixer and red vinyl in a music studio" className="ai-dj-cover-image absolute inset-0 h-full w-full object-cover" />
        <div className="yt-session-shade absolute inset-0" />
        <div className="relative flex min-h-28 items-end justify-between gap-4 sm:min-h-36">
          <div>
            <div className="mb-3 flex items-center gap-2 text-xs font-medium"><Sparkles className="h-4 w-4" /> PULSE / MIX STUDIO</div>
            <h2 className="ai-dj-title text-6xl font-heading sm:text-7xl">AI DJ</h2>
          </div>
          <Disc3 aria-hidden="true" className="mb-1 h-12 w-12 shrink-0 opacity-80 sm:h-16 sm:w-16" />
        </div>
      </header>

      <section aria-label="Create a mix" className="space-y-4">
        <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="ai-dj-composer relative rounded-lg border border-border bg-card p-3 transition-colors focus-within:border-primary sm:p-4">
          <label htmlFor="ai-dj-prompt" className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground"><Sparkles className="h-4 w-4 text-primary" /> Your mix</label>
          <textarea
            id="ai-dj-prompt"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
            rows={3}
            aria-label="Describe your playlist"
            placeholder="90s R&B slow jams, Prince deep cuts, songs for a rainy Sunday…"
            className="w-full resize-none bg-transparent pr-12 text-sm leading-relaxed text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          <Button size="icon" type="submit" disabled={!input.trim() || !!busy} aria-label="Send"
            className="absolute bottom-3 right-3 h-10 w-10 rounded-full sm:bottom-4 sm:right-4">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
        <div aria-live="polite" className="space-y-3 max-h-72 overflow-y-auto">
          {msgs.map((m, i) => (
            <motion.div key={i} initial={reducedMotion ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              className={`text-sm px-3 py-2 rounded-lg max-w-[90%] whitespace-pre-wrap break-words ${m.role === "user" ? "ml-auto bg-primary text-primary-foreground" : "border-l-2 border-primary bg-secondary/40 text-foreground"}`}>
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
      </section>

      <section aria-label="Mix ideas" className="space-y-3">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h3 className="text-xl font-heading text-foreground">Mix ideas</h3>
          <span className="text-xs text-muted-foreground">24 starting points</span>
        </div>
        <div role="tablist" aria-label="Playlist idea categories" className="grid grid-cols-2 gap-1 rounded-lg bg-muted/50 p-1 sm:grid-cols-4">
          {SUGGESTION_GROUPS.map((group, i) => {
            const Icon = GROUP_ICONS[i];
            return <Button key={group.name} role="tab" aria-selected={ideaGroup === i} aria-controls="ai-dj-ideas" id={`ai-dj-group-${i}`}
              variant={ideaGroup === i ? "default" : "ghost"} size="sm" onClick={() => setIdeaGroup(i)} className="min-w-0 gap-1.5 px-2 text-xs">
              <Icon className="h-3.5 w-3.5" /> {group.name}
            </Button>;
          })}
        </div>
        <div id="ai-dj-ideas" role="tabpanel" aria-labelledby={`ai-dj-group-${ideaGroup}`} className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {SUGGESTION_GROUPS[ideaGroup].ideas.map((s, i) => (
            <Button key={s} variant="outline" disabled={!!busy} onClick={() => send(s)}
              className="ai-dj-idea group flex h-auto min-h-28 min-w-0 flex-col items-start justify-between gap-3 rounded-lg border-border bg-card/70 p-3 text-left whitespace-normal sm:p-4">
              <span className="flex w-full items-center justify-between text-primary"><span className="font-mono text-[10px] text-muted-foreground">0{i + 1}</span><ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" /></span>
              <span className="w-full break-words text-xs font-medium leading-relaxed sm:text-sm">{s}</span>
            </Button>
          ))}
        </div>
      </section>

      {playlist && (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3 border-b border-border pb-3">
            <div className="min-w-0"><span className="text-xs text-muted-foreground">{playlist.tracks.length} tracks / Your playlist</span><h3 className="font-heading text-xl break-words text-foreground">{playlist.title}</h3></div>
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
