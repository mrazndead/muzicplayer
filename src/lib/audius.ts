import localCover1 from "@/assets/local-track-cover.jpg";
import localCover2 from "@/assets/local-cover-2.jpg";
import localCover3 from "@/assets/local-cover-3.jpg";
import localCover4 from "@/assets/local-cover-4.jpg";
import localCover5 from "@/assets/local-cover-5.jpg";
import localCover6 from "@/assets/local-cover-6.jpg";
import localCover7 from "@/assets/local-cover-7.jpg";
import localCover8 from "@/assets/local-cover-8.jpg";

const LOCAL_COVERS = [localCover1, localCover2, localCover3, localCover4, localCover5, localCover6, localCover7, localCover8];

function pickLocalCover(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return LOCAL_COVERS[h % LOCAL_COVERS.length];
}

const APP_NAME = "lovable_pulse";

let cachedHosts: string[] = [];
let currentHostIdx = 0;

async function fetchHosts(): Promise<string[]> {
  try {
    const res = await fetch("https://api.audius.co");
    const json = await res.json();
    return json.data || ["https://discoveryprovider.audius.co"];
  } catch {
    return ["https://discoveryprovider.audius.co", "https://api.audius.co"];
  }
}

async function getHost(): Promise<string> {
  if (cachedHosts.length === 0) {
    cachedHosts = await fetchHosts();
    currentHostIdx = Math.floor(Math.random() * cachedHosts.length);
  }
  return cachedHosts[currentHostIdx % cachedHosts.length];
}

function rotateHost() {
  if (cachedHosts.length > 1) {
    currentHostIdx = (currentHostIdx + 1) % cachedHosts.length;
  }
}

/** Public helper — rotates to the next Audius discovery host (used to recover from stream errors). */
export function rotateStreamHost() {
  rotateHost();
}

async function fetchWithRetry(url: string, retries = 2): Promise<Response> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url);
      if (res.ok) return res;
      // On 500/503, rotate host and retry
      if (res.status >= 500 && attempt < retries) {
        rotateHost();
        const host = cachedHosts[currentHostIdx % cachedHosts.length];
        const path = new URL(url).pathname + new URL(url).search;
        url = host + path;
        continue;
      }
      return res;
    } catch (err) {
      if (attempt < retries) {
        rotateHost();
        const host = cachedHosts[currentHostIdx % cachedHosts.length];
        const path = new URL(url).pathname + new URL(url).search;
        url = host + path;
        continue;
      }
      throw err;
    }
  }
  return fetch(url); // fallback
}

export type TrackSource = "audius" | "jamendo" | "archive" | "local";

export interface AudiusTrack {
  id: string;
  title: string;
  user: { name: string; id: string };
  artwork?: { "150x150"?: string; "480x480"?: string; "1000x1000"?: string };
  duration: number;
  genre: string;
  mood?: string;
  play_count: number;
  permalink: string;
  description?: string;
  /** Optional pre-resolved stream URL. When set, the player uses this directly (e.g. local files via blob URL). */
  streamUrl?: string;
  /** True when this is a user-uploaded local file. */
  isLocal?: boolean;
  /** Where this track was fetched from. Defaults to "audius" for backwards-compat. */
  source?: TrackSource;
}

async function searchAudiusOnly(query: string, limit = 20, offset = 0): Promise<AudiusTrack[]> {
  const host = await getHost();
  const sortOptions = ["relevant", "popular", "recent"] as const;
  const sort = sortOptions[Math.floor(Math.random() * sortOptions.length)];
  const url = `${host}/v1/tracks/search?query=${encodeURIComponent(query)}&limit=${limit}&offset=${offset}&sort_method=${sort}&app_name=${APP_NAME}`;
  const res = await fetchWithRetry(url);
  const json = await res.json();
  const tracks: AudiusTrack[] = json.data || [];
  return tracks.map((t) => ({ ...t, source: "audius" as const }));
}

function dedupeAndRank(tracks: AudiusTrack[]): AudiusTrack[] {
  const seen = new Set<string>();
  const combined: AudiusTrack[] = [];
  for (const t of tracks) {
    const key = t.id || `${t.title}|${t.user?.name}`.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    combined.push(t);
  }
  combined.sort((a, b) => (b.play_count || 0) - (a.play_count || 0));
  return combined;
}

/**
 * Federated search across Audius, Jamendo, and Internet Archive.
 * When offset > 0, pages Audius only (the other sources return finite result sets).
 */
export async function searchTracks(query: string, limit = 20, offset = 0): Promise<AudiusTrack[]> {
  if (offset > 0) return searchAudiusOnly(query, limit, offset);

  // Dynamic imports keep the Audius-only bundle path unchanged and avoid circular loads.
  const [{ searchJamendo }, { searchArchive }] = await Promise.all([
    import("@/lib/sources/jamendo"),
    import("@/lib/sources/archive"),
  ]);

  const results = await Promise.allSettled([
    searchAudiusOnly(query, limit, 0),
    searchJamendo(query, Math.min(30, Math.max(15, Math.floor(limit / 2)))),
    searchArchive(query, 10),
  ]);

  const merged: AudiusTrack[] = [];
  for (const r of results) if (r.status === "fulfilled") merged.push(...r.value);
  return dedupeAndRank(merged);
}

// Multi-query federated search: fans out several queries across all sources.
export async function searchTracksMulti(queries: string[], limitPerQuery = 15): Promise<AudiusTrack[]> {
  const shuffled = [...queries].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, 3);

  const results = await Promise.allSettled(selected.map((q) => searchTracks(q, limitPerQuery, 0)));

  const merged: AudiusTrack[] = [];
  for (const r of results) if (r.status === "fulfilled") merged.push(...r.value);
  return dedupeAndRank(merged);
}

/** Keywords used to verify a track really belongs to a genre (keeps results on-topic). */
export const GENRE_MATCH: Record<string, string[]> = {
  "soft-rock": ["soft rock", "rock", "ballad", "acoustic", "folk rock", "yacht"],
  jazz: ["jazz", "bebop", "bop", "swing", "saxophone", "sax", "big band", "lounge"],
  vietnamese: ["viet", "vpop", "v-pop", "saigon", "hanoi", "nhac", "việt"],
  korean: ["korean", "kpop", "k-pop", "korea", "hangul", "seoul"],
  trance: ["trance", "psy", "goa", "uplifting"],
  house: ["house", "deep house", "tech house", "disco house"],
  lofi: ["lofi", "lo-fi", "lo fi", "chillhop", "chill beat"],
  rnb: ["r&b", "rnb", "r and b", "soul", "slow jam", "neo soul"],
  classical: ["classical", "orchestra", "symphony", "sonata", "concerto", "baroque", "quartet", "piano", "violin", "cello", "opus", "mozart", "bach", "beethoven", "chopin"],
  hiphop: ["hip hop", "hip-hop", "hiphop", "rap", "trap", "boom bap", "drill", "freestyle"],
  ambient: ["ambient", "drone", "soundscape", "atmospheric", "ethereal", "meditation"],
  reggae: ["reggae", "dub", "dancehall", "ska", "roots", "rocksteady"],
  pop: ["pop", "synthpop", "synth pop", "electropop", "hyperpop"],
  edm: ["edm", "electronic", "electro", "dubstep", "drum and bass", "dnb", "bass", "hardstyle", "breakbeat", "dance"],
  latin: ["latin", "reggaeton", "salsa", "bachata", "cumbia", "samba", "tango", "bossa", "merengue", "dembow", "espanol", "español"],
  country: ["country", "bluegrass", "americana", "honky", "western", "banjo"],
  opera: ["opera", "aria", "soprano", "tenor", "operetta", "bel canto", "operatic"],
  funk: ["funk", "funky", "disco", "boogie", "groove"],
  japanese: ["japanese", "jpop", "j-pop", "japan", "anime", "city pop", "vocaloid", "tokyo"],
  french: ["french", "france", "francais", "français", "french touch", "chanson", "paris"],
  italian: ["italian", "italy", "italo", "italiano", "mediterranean"],
  "malt-shop": ["oldies", "50s", "1950", "rock and roll", "rock 'n' roll", "rockabilly", "jukebox", "vintage", "retro", "doo wop"],
  "doo-wop": ["doo wop", "doowop", "doo-wop", "harmony", "acappella", "a cappella", "vocal group", "oldies", "50s"],
  motown: ["motown", "soul", "detroit", "tamla", "northern soul", "60s"],
};

function genreHaystack(t: AudiusTrack): string {
  return `${t.genre ?? ""} ${t.mood ?? ""} ${t.title ?? ""} ${t.user?.name ?? ""} ${t.description ?? ""}`.toLowerCase();
}

function matchesGenre(t: AudiusTrack, keywords: string[]): boolean {
  const hay = genreHaystack(t);
  return keywords.some((k) => hay.includes(k));
}

export interface GenreDef {
  id: string;
  label: string;
  queries: string[];
  emoji: string;
}

/**
 * Genre-accurate, high-volume fetch. Fans out a rotating slice of the genre's
 * sub-queries across all sources, then ranks on-genre matches first so results
 * stay in the requested genre while still returning plenty of tracks.
 * `page` rotates through the query list so "load more" keeps surfacing new songs.
 */
export async function searchGenre(genre: GenreDef, page = 0, perQuery = 25): Promise<AudiusTrack[]> {
  const qs = genre.queries;
  const fan = 6;
  const start = (page * fan) % qs.length;
  const selected = Array.from({ length: fan }, (_, i) => qs[(start + i) % qs.length]);

  const results = await Promise.allSettled(selected.map((q) => searchTracks(q, perQuery, 0)));
  const merged: AudiusTrack[] = [];
  for (const r of results) if (r.status === "fulfilled") merged.push(...r.value);

  const keywords = GENRE_MATCH[genre.id] ?? [genre.label.toLowerCase()];
  const all = dedupeAndRank(merged);
  const onGenre = all.filter((t) => matchesGenre(t, keywords));
  const offGenre = all.filter((t) => !matchesGenre(t, keywords));

  // Keep it comprehensive: if strict matching is thin, top up with the rest.
  const topUp = onGenre.length >= 40 ? [] : offGenre.slice(0, 40 - onGenre.length);
  return [...onGenre, ...topUp];
}

export async function getTrendingTracks(genre?: string, limit = 20): Promise<AudiusTrack[]> {
  const host = await getHost();
  let url = `${host}/v1/tracks/trending?limit=${limit}&app_name=${APP_NAME}`;
  if (genre) url += `&genre=${encodeURIComponent(genre)}`;
  const res = await fetchWithRetry(url);
  const json = await res.json();
  const tracks: AudiusTrack[] = json.data || [];
  return tracks.map((t) => ({ ...t, source: "audius" as const }));
}


export async function getStreamUrl(trackId: string): Promise<string> {
  const host = await getHost();
  return `${host}/v1/tracks/${trackId}/stream?app_name=${APP_NAME}`;
}

export function getArtworkUrl(track: AudiusTrack, size: "150x150" | "480x480" | "1000x1000" = "480x480"): string {
  if (track.isLocal) return pickLocalCover(track.id);
  const art = track.artwork?.[size] || track.artwork?.["480x480"] || track.artwork?.["150x150"] || track.artwork?.["1000x1000"];
  return art || pickLocalCover(track.id);
}

export function formatPlayCount(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
  return String(count);
}

export const DEFAULT_GENRES = [
  { id: "soft-rock", label: "Soft Rock", queries: ["soft rock", "acoustic rock", "mellow rock", "indie rock chill", "classic rock ballads", "soft rock love songs", "90s soft rock", "easy rock", "gentle rock", "soft rock hits", "rock ballads classic", "folk rock mellow", "light rock", "relaxing rock", "adult contemporary rock", "yacht rock", "heartland rock", "arena rock ballads", "unplugged rock", "rock acoustic covers", "70s soft rock", "80s rock ballads", "power ballads rock", "rock love songs", "rock easy listening"], emoji: "🎸" },
  { id: "jazz", label: "Jazz", queries: ["jazz", "smooth jazz", "jazz piano", "jazz saxophone", "bebop jazz", "jazz fusion", "cool jazz", "latin jazz", "jazz trio", "modal jazz", "free jazz", "jazz vocals", "swing jazz", "acid jazz", "jazz lounge", "contemporary jazz", "jazz guitar", "hard bop", "jazz standards", "gypsy jazz", "big band jazz", "vocal jazz classics", "jazz trumpet", "post bop", "spiritual jazz"], emoji: "🎷" },
  { id: "vietnamese", label: "Vietnamese", queries: ["vietnamese", "vietnam", "vpop", "vietnamese pop", "vietnamese dance", "vietnamese electronic", "vietnamese beat", "vietnamese song", "viet", "viet music", "viet pop", "viet rap", "viet remix", "saigon music", "hanoi music", "vietnamese DJ", "vietnamese house", "vietnamese trap", "vietnamese edm", "vietnamese bass", "vietnamese vibes", "asian pop vietnamese", "southeast asian music", "vietnamese club", "vietnamese party"], emoji: "🇻🇳" },
  { id: "korean", label: "Korean", queries: ["korean", "kpop", "k-pop", "korean pop", "korean dance", "korean beat", "korean electronic", "korean song", "korea music", "korean DJ", "korean remix", "korean bass", "korean hip hop", "korean rap", "korean chill", "korean vibes", "korean club", "korean party", "korean wave", "korean r&b", "korean rock", "korean indie", "korean acoustic", "korean ballad", "asian pop korean"], emoji: "🇰🇷" },
  { id: "trance", label: "Trance", queries: ["trance", "uplifting trance", "progressive trance", "psytrance", "vocal trance", "goa trance", "tech trance", "classic trance", "dream trance", "euphoric trance", "trance music", "melodic trance", "epic trance", "trance DJ", "trance mix", "trance beat", "trance dance", "trance festival", "trance remix", "hard trance", "emotional trance", "trance vibes", "deep trance", "dark trance", "trance anthem"], emoji: "🌀" },
  { id: "house", label: "House", queries: ["house", "deep house", "tech house", "house music", "progressive house", "tropical house", "future house", "house beat", "house DJ", "house mix", "soulful house", "afro house", "melodic house", "funky house", "house dance", "house remix", "vocal house", "disco house", "house party", "organic house", "house groove", "minimal house", "acid house", "chicago house", "house vibes"], emoji: "🏠" },
  { id: "lofi", label: "Lo-Fi", queries: ["lofi", "lo-fi", "lofi beats", "lofi hip hop", "lofi chill", "chillhop", "lofi study", "lofi jazz", "lofi vibes", "lofi piano", "lofi guitar", "lofi ambient", "lofi sleep", "lofi relax", "lofi instrumental", "lofi music", "lofi mix", "lofi cafe", "lofi rain", "lofi coding", "lofi soul", "lofi beat", "chill beats", "study beats", "relaxing beats"], emoji: "🎧" },
  { id: "rnb", label: "R&B", queries: ["r&b", "rnb", "r and b", "soul", "neo soul", "r&b soul", "slow jams", "r&b love", "modern r&b", "90s r&b", "r&b groove", "r&b chill", "r&b vibes", "soul music", "contemporary r&b", "r&b beat", "r&b remix", "r&b party", "alternative r&b", "trap soul", "r&b hip hop", "classic soul", "r&b acoustic", "smooth r&b", "r&b instrumental"], emoji: "🎤" },
  { id: "classical", label: "Classical", queries: ["classical", "classical music", "classical piano", "orchestra", "symphony", "violin classical", "classical guitar", "chamber music", "cello", "piano sonata", "chopin", "mozart", "beethoven", "bach", "classical relaxing", "string quartet", "classical instrumental", "baroque", "classical ensemble", "classical flute", "vivaldi", "debussy", "classical study", "modern classical", "classical beautiful"], emoji: "🎻" },
  { id: "hiphop", label: "Hip Hop", queries: ["hip hop", "rap", "hip hop beats", "trap", "boom bap", "hip hop instrumental", "freestyle rap", "underground hip hop", "old school hip hop", "rap beat", "hip hop mix", "trap beat", "hip hop chill", "rap instrumental", "drill", "hip hop vibes", "east coast hip hop", "west coast hip hop", "lyrical rap", "hip hop remix", "cloud rap", "hip hop dance", "rap music", "hip hop classic", "hip hop new"], emoji: "🔥" },
  { id: "ambient", label: "Ambient", queries: ["ambient", "ambient music", "ambient chill", "ambient electronic", "ambient meditation", "ambient sleep", "dark ambient", "ambient nature", "space ambient", "ambient piano", "ambient soundscape", "ambient relax", "ambient drone", "cinematic ambient", "ambient vibes", "ambient mix", "healing ambient", "ambient rain", "ethereal", "ambient ocean", "ambient guitar", "ambient dub", "cosmic ambient", "ambient deep", "atmospheric"], emoji: "🌊" },
  { id: "reggae", label: "Reggae", queries: ["reggae", "reggae music", "dub", "dancehall", "reggae dub", "roots reggae", "reggae beat", "reggae vibes", "reggae remix", "reggae mix", "ska", "reggae love", "island reggae", "reggae dance", "reggae chill", "modern reggae", "reggae rock", "reggae instrumental", "reggae bass", "tropical reggae", "reggae groove", "reggae acoustic", "rocksteady", "reggae party", "reggae classic"], emoji: "🌴" },
  { id: "pop", label: "Pop", queries: ["pop", "pop music", "pop song", "indie pop", "synth pop", "electropop", "pop rock", "dance pop", "pop beat", "pop remix", "pop hit", "pop vibes", "dream pop", "pop dance", "pop chill", "pop acoustic", "pop ballad", "hyperpop", "pop electronic", "pop party", "pop love", "pop anthem", "pop mix", "modern pop", "pop instrumental"], emoji: "⭐" },
  { id: "edm", label: "EDM", queries: ["edm", "electronic", "electronic music", "dubstep", "drum and bass", "electro", "future bass", "bass music", "electronic dance", "edm mix", "edm beat", "edm remix", "edm drop", "edm festival", "melodic dubstep", "dnb", "breakbeat", "hardstyle", "bass house", "edm vibes", "electronic beat", "edm party", "edm chill", "big room", "electronic remix"], emoji: "⚡" },
  { id: "latin", label: "Latin", queries: ["latin", "latin music", "reggaeton", "salsa", "bachata", "cumbia", "latin beat", "latin pop", "latin dance", "latin remix", "latin vibes", "bossa nova", "latin jazz", "latin trap", "dembow", "latin party", "samba", "tango", "latin chill", "latin electronic", "latin groove", "merengue", "latin urban", "latin acoustic", "tropical latin"], emoji: "💃" },
  { id: "country", label: "Country", queries: ["country", "country music", "country song", "country rock", "bluegrass", "americana", "country pop", "country folk", "country acoustic", "country ballad", "country guitar", "country love", "country classic", "country modern", "country blues", "honky tonk", "country vibes", "country chill", "country party", "country remix", "country beat", "alt country", "country western", "country dance", "country hits"], emoji: "🤠" },
  { id: "opera", label: "Opera", queries: ["opera", "opera music", "opera vocal", "aria", "soprano", "tenor", "operatic", "opera classical", "opera sing", "classical vocal", "opera beautiful", "opera famous", "opera duet", "opera chorus", "opera instrumental", "opera dramatic", "opera love", "bel canto", "opera orchestra", "grand opera", "opera highlight", "opera classic", "opera best", "opera popular", "operetta"], emoji: "🎭" },
  { id: "funk", label: "Funk", queries: ["funk", "funk music", "funky", "funk groove", "funk soul", "funk bass", "disco funk", "funk beat", "funk remix", "electro funk", "funk dance", "jazz funk", "funk rock", "funk vibes", "future funk", "funk party", "nu funk", "funk instrumental", "funk mix", "synth funk", "g-funk", "funk chill", "70s funk", "80s funk", "boogie funk"], emoji: "🕺" },
  { id: "japanese", label: "Japanese", queries: ["japanese", "japan", "jpop", "j-pop", "japanese pop", "japanese rock", "japanese electronic", "japanese beat", "anime music", "japanese dance", "japanese DJ", "japanese remix", "japanese chill", "city pop", "japanese vibes", "japanese indie", "vocaloid", "japanese acoustic", "anime opening", "japanese lofi", "japanese r&b", "japanese hip hop", "japan music", "japanese club", "japanese wave"], emoji: "🇯🇵" },
  { id: "french", label: "French", queries: ["french", "french music", "french pop", "french electronic", "french house", "french beat", "french DJ", "french remix", "french chill", "french dance", "french vibes", "french rap", "french jazz", "french touch", "french indie", "french rock", "french acoustic", "french song", "france music", "french club", "french disco", "french soul", "french electro", "french lofi", "french hip hop"], emoji: "🇫🇷" },
  { id: "italian", label: "Italian", queries: ["italian", "italian music", "italian pop", "italian dance", "italian electronic", "italo disco", "italian beat", "italian DJ", "italian remix", "italian chill", "italian vibes", "italian rock", "italian jazz", "italian disco", "italian indie", "italian acoustic", "italian song", "italy music", "italian house", "italian rap", "italian club", "italian love", "mediterranean", "italian party", "italian hip hop"], emoji: "🇮🇹" },
  { id: "malt-shop", label: "Malt Shop", queries: ["oldies", "50s music", "rock and roll", "rockabilly", "50s rock", "jukebox", "50s pop", "retro 50s", "vintage rock", "classic oldies", "golden oldies", "early rock", "50s dance", "diner music", "50s hits", "retro music", "50s classic", "vintage pop", "old school rock", "50s love songs", "rockabilly beat", "twist dance", "50s party", "retro rock", "american oldies"], emoji: "🍦" },
  { id: "doo-wop", label: "Doo Wop", queries: ["doo wop", "doowop", "vocal harmony", "acappella", "50s vocal", "harmony group", "oldies vocal", "doo wop classic", "street corner", "retro vocal", "vintage harmony", "golden age vocal", "doo wop love", "vocal group", "50s harmony", "classic vocal", "doo wop hit", "retro doo wop", "oldies harmony", "doo wop dance", "vocal oldies", "smooth vocal", "doo wop best", "vocal music retro", "classic doo wop"], emoji: "🎶" },
  { id: "motown", label: "Motown", queries: ["motown", "motown music", "motown soul", "detroit soul", "motown classic", "motown hit", "motown groove", "motown dance", "motown love", "motown beat", "motown vibes", "soul classic", "motown party", "motown remix", "60s soul", "motown funk", "motown r&b", "classic soul motown", "motown best", "northern soul", "tamla motown", "motown vocal", "motown bass", "vintage soul", "retro soul"], emoji: "🎙️" },
];

export const DEFAULT_MOODS = [
  { id: "chill", label: "Chill", query: "chill vibes relaxing", emoji: "😌" },
  { id: "energetic", label: "Energetic", query: "energetic upbeat workout", emoji: "⚡" },
  { id: "melancholy", label: "Melancholy", query: "sad emotional melancholy", emoji: "🌧️" },
  { id: "romantic", label: "Romantic", query: "romantic love songs", emoji: "💕" },
  { id: "focus", label: "Focus", query: "focus concentration study", emoji: "🧠" },
  { id: "party", label: "Party", query: "party dance club", emoji: "🎉" },
  { id: "dreamy", label: "Dreamy", query: "dreamy ethereal ambient", emoji: "✨" },
  { id: "uplifting", label: "Uplifting", query: "uplifting happy positive", emoji: "☀️" },
];
