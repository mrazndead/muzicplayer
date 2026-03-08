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
}

export async function searchTracks(query: string, limit = 20, offset = 0): Promise<AudiusTrack[]> {
  const host = await getHost();
  const sortOptions = ["relevant", "popular", "recent"] as const;
  const sort = sortOptions[Math.floor(Math.random() * sortOptions.length)];
  const url = `${host}/v1/tracks/search?query=${encodeURIComponent(query)}&limit=${limit}&offset=${offset}&sort_method=${sort}&app_name=${APP_NAME}`;
  const res = await fetchWithRetry(url);
  const json = await res.json();
  return json.data || [];
}

// Multi-query search: runs several queries in parallel, deduplicates, and returns combined results
export async function searchTracksMulti(queries: string[], limitPerQuery = 15): Promise<AudiusTrack[]> {
  // Pick 3 random queries for variety without hammering the API
  const shuffled = [...queries].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, 3);

  const results = await Promise.allSettled(
    selected.map(q => searchTracks(q, limitPerQuery))
  );

  const seen = new Set<string>();
  const combined: AudiusTrack[] = [];

  for (const result of results) {
    if (result.status === "fulfilled") {
      for (const track of result.value) {
        if (!seen.has(track.id)) {
          seen.add(track.id);
          combined.push(track);
        }
      }
    }
  }

  // Sort by play_count descending for quality results
  combined.sort((a, b) => (b.play_count || 0) - (a.play_count || 0));
  return combined;
}

export async function getTrendingTracks(genre?: string, limit = 20): Promise<AudiusTrack[]> {
  const host = await getHost();
  let url = `${host}/v1/tracks/trending?limit=${limit}&app_name=${APP_NAME}`;
  if (genre) url += `&genre=${encodeURIComponent(genre)}`;
  const res = await fetchWithRetry(url);
  const json = await res.json();
  return json.data || [];
}

export async function getStreamUrl(trackId: string): Promise<string> {
  const host = await getHost();
  return `${host}/v1/tracks/${trackId}/stream?app_name=${APP_NAME}`;
}

export function getArtworkUrl(track: AudiusTrack, size: "150x150" | "480x480" | "1000x1000" = "480x480"): string {
  return track.artwork?.[size] || track.artwork?.["150x150"] || "/placeholder.svg";
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
