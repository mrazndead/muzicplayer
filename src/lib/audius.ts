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
  { id: "vietnamese", label: "Vietnamese", queries: ["vietnamese music", "nhac viet", "vpop", "vietnamese bolero", "nhac tre", "nhac vang", "vietnamese ballad", "vietnamese rap", "vietnamese indie", "nhac trinh", "vietnamese acoustic", "vietnamese edm", "nhac do", "vietnamese pop dance", "vietnamese love songs", "vietnamese remix", "vietnamese hip hop", "nhac sen", "vietnamese r&b", "vietnamese folk", "vietnamese chill", "vietnamese karaoke hits", "vietnamese underground", "nhac phim viet", "vietnamese lofi"], emoji: "🇻🇳" },
  { id: "korean", label: "Korean", queries: ["korean kpop", "kpop", "korean r&b", "korean indie", "korean ballad", "k-pop dance", "korean hip hop", "korean ost", "korean acoustic", "kpop boy group", "kpop girl group", "korean rock", "korean jazz", "korean electronic", "k-drama ost", "korean chill", "trot music", "korean rap", "korean city pop", "korean retro", "kpop solo", "korean lofi", "korean r&b chill", "korean underground", "korean folk"], emoji: "🇰🇷" },
  { id: "trance", label: "Trance", queries: ["epic trance", "uplifting trance", "progressive trance", "psytrance", "vocal trance", "goa trance", "tech trance", "hard trance", "classic trance", "dream trance", "euphoric trance", "trance anthems", "melodic trance", "acid trance", "balearic trance", "full on psytrance", "dark psytrance", "anjunabeats trance", "trance 2024", "ibiza trance", "trance classics 2000s", "emotional trance", "orchestral trance", "tribal trance", "minimal trance"], emoji: "🌀" },
  { id: "house", label: "House", queries: ["house music", "deep house", "tech house", "progressive house", "tropical house", "future house", "acid house", "soulful house", "afro house", "melodic house", "minimal house", "funky house", "chicago house", "vocal house", "organic house", "lo-fi house", "jackin house", "electro house classic", "microhouse", "disco house", "french house", "tribal house", "latin house", "piano house", "uk garage house"], emoji: "🏠" },
  { id: "lofi", label: "Lo-Fi", queries: ["lofi chill beats", "lofi hip hop", "lofi study", "chillhop", "lofi jazz", "lofi rain", "lofi sleep", "lofi piano", "lofi guitar", "lofi ambient", "lofi cafe", "lofi vibes", "lofi beats relax", "lofi coding", "lofi morning", "lofi aesthetic", "lofi instrumental", "lofi soul", "lofi summer", "lofi anime", "lofi city", "lofi sunset", "lofi acoustic", "lofi christmas", "lofi late night"], emoji: "🎧" },
  { id: "rnb", label: "R&B", queries: ["r&b soul", "rnb", "neo soul", "contemporary r&b", "r&b slow jams", "soul music", "90s r&b", "r&b love", "alternative r&b", "r&b groove", "classic soul", "modern r&b", "r&b hip hop", "quiet storm", "new jack swing", "r&b acoustic", "motown soul", "r&b party", "80s r&b", "r&b duets", "r&b anthems", "r&b chill", "uk r&b", "r&b workout", "trap soul"], emoji: "🎤" },
  { id: "classical", label: "Classical", queries: ["classical orchestra", "classical piano", "symphony", "violin classical", "baroque", "classical guitar", "romantic era classical", "chamber music", "cello classical", "chopin", "mozart", "beethoven", "debussy", "classical flute", "opera classical", "minimalist classical", "modern classical", "classical ensemble", "rachmaninoff", "vivaldi", "bach", "classical harp", "classical relaxation", "classical for study", "string quartet"], emoji: "🎻" },
  { id: "hiphop", label: "Hip Hop", queries: ["hip hop rap", "hip hop beats", "rap freestyle", "trap beats", "boom bap", "underground hip hop", "old school hip hop", "conscious rap", "gangsta rap", "hip hop instrumental", "east coast rap", "west coast rap", "southern rap", "mumble rap", "lyrical hip hop", "rap battle", "hip hop chill", "lo-fi rap", "uk grime", "drill rap", "cloud rap", "emo rap", "jazz rap", "abstract hip hop", "chopped and screwed"], emoji: "🔥" },
  { id: "ambient", label: "Ambient", queries: ["ambient chillout", "ambient electronic", "ambient meditation", "dark ambient", "ambient nature", "space ambient", "drone ambient", "ambient sleep", "ethereal ambient", "ambient piano", "ambient soundscape", "cinematic ambient", "new age ambient", "ambient rain", "ambient forest", "healing ambient", "ambient ocean", "arctic ambient", "ambient guitar", "tribal ambient", "ambient dub", "cosmic ambient", "ambient tape loops", "generative ambient", "post rock ambient"], emoji: "🌊" },
  { id: "reggae", label: "Reggae", queries: ["reggae dub", "reggae roots", "dancehall", "ska reggae", "reggae love songs", "modern reggae", "reggae rock", "digital reggae", "one drop reggae", "reggae remix", "lovers rock", "ragga", "reggae acoustic", "reggae instrumental", "steppas dub", "reggae revival", "rocksteady", "dub techno reggae", "reggae hip hop", "island reggae", "reggae covers", "roots dub", "conscious reggae", "reggae jazz", "tropical reggae"], emoji: "🌴" },
  { id: "pop", label: "Pop", queries: ["pop music", "indie pop", "synth pop", "electropop", "pop rock", "dream pop", "dance pop", "chamber pop", "art pop", "bubblegum pop", "pop punk", "power pop", "twee pop", "baroque pop", "hyperpop", "pop ballad", "europop", "sophisti-pop", "citypop", "k-pop crossover", "latin pop", "pop acoustic", "2000s pop", "90s pop", "pop anthems"], emoji: "⭐" },
  { id: "edm", label: "EDM", queries: ["edm electronic", "dubstep", "drum and bass", "hardstyle", "electro house", "future bass", "big room", "melodic dubstep", "liquid dnb", "riddim", "garage", "breakbeat", "happy hardcore", "midtempo bass", "uk bass", "complextro", "glitch hop", "bass house", "neurofunk", "jungle dnb", "rawstyle", "wave music", "color bass", "experimental bass", "festival edm"], emoji: "⚡" },
  { id: "latin", label: "Latin", queries: ["latin reggaeton", "salsa", "bachata", "cumbia", "latin trap", "bossa nova", "merengue", "latin jazz", "son cubano", "latin pop", "corridos", "norteño", "vallenato", "latin acoustic", "dembow", "tango", "latin folk", "samba", "perreo", "reggaeton old school", "latin urban", "champeta", "latin indie", "bolero", "latin electronic"], emoji: "💃" },
  { id: "country", label: "Country", queries: ["country music", "country folk", "country rock", "bluegrass", "americana", "country pop", "outlaw country", "country ballad", "country blues", "honky tonk", "country gospel", "red dirt country", "alt country", "country acoustic", "western swing", "country fiddle", "bro country", "classic country", "country rap", "texas country", "progressive bluegrass", "country duets", "country love songs", "new country", "country covers"], emoji: "🤠" },
  { id: "opera", label: "Opera", queries: ["opera", "opera aria", "classical vocal", "operatic", "soprano opera", "tenor opera", "opera duet", "baroque opera", "verdi opera", "puccini", "opera chorus", "mezzo soprano", "opera overture", "comic opera", "grand opera", "wagner opera", "opera highlights", "rossini opera", "modern opera", "opera for beginners", "opera love duets", "opera tragic arias", "bel canto", "opera buffa", "operetta"], emoji: "🎭" },
  { id: "funk", label: "Funk", queries: ["funk groove", "funk soul", "disco funk", "funk bass", "electro funk", "p-funk", "jazz funk", "funk rock", "boogie funk", "nu funk", "deep funk", "psychedelic funk", "funk instrumental", "slap bass funk", "g-funk", "future funk", "afrobeat funk", "funk carioca", "synth funk", "funk breaks", "funk workout", "70s funk", "80s funk", "funky disco", "funk jam"], emoji: "🕺" },
  { id: "japanese", label: "Japanese", queries: ["japanese", "jpop", "japanese rock", "city pop", "japanese electronic", "anime music", "visual kei", "japanese indie", "enka", "japanese jazz", "j-rap", "japanese ambient", "shibuya kei", "japanese folk", "anime opening", "vocaloid", "japanese lo-fi", "japanese math rock", "japanese r&b", "future funk japan", "japanese shoegaze", "j-metal", "japanese acoustic", "anime ending", "japanese city pop 80s"], emoji: "🇯🇵" },
  { id: "french", label: "French", queries: ["french", "french pop", "chanson francaise", "french house", "french electronic", "french rap", "french jazz", "french indie", "variete francaise", "french touch", "french acoustic", "french r&b", "french rock", "french folk", "musette", "french disco", "french new wave", "french soul", "french electro", "chanson d'amour", "french hip hop", "french reggae", "french blues", "french bossa", "french chill"], emoji: "🇫🇷" },
  { id: "italian", label: "Italian", queries: ["italian music", "italian pop", "canzone italiana", "italian jazz", "italian disco", "italian rock", "italian rap", "san remo", "italian indie", "italo disco", "italian folk", "italian acoustic", "neapolitan songs", "italian electronic", "italian love songs", "italian opera pop", "italian hip hop", "italian summer", "italian classics", "italian reggae", "italian blues", "italian acoustic covers", "cantautori", "italian dance", "mediterranean music"], emoji: "🇮🇹" },
  { id: "malt-shop", label: "Malt Shop", queries: ["malt shop oldies", "50s rock and roll", "diner jukebox", "bobby sox", "50s pop hits", "american bandstand", "teen idol 50s", "50s love songs", "rockabilly classic", "50s dance", "sock hop", "50s ballads", "early rock and roll", "50s vocal group", "jukebox classics", "50s romantic", "golden oldies 50s", "buddy holly", "50s crooner", "patti page", "50s novelty songs", "classic 50s", "malt shop memories", "50s slow dance", "american graffiti"], emoji: "🍦" },
  { id: "doo-wop", label: "Doo Wop", queries: ["doo wop", "doo wop classics", "doo wop vocal harmony", "street corner harmony", "50s doo wop", "doo wop love songs", "doo wop group", "acappella doo wop", "doo wop ballad", "doo wop dance", "platters", "drifters", "doo wop revival", "60s doo wop", "italian doo wop", "doo wop slow", "doo wop uptempo", "vocal group harmony", "doo wop serenade", "classic doo wop hits", "doo wop golden", "doo wop romantic", "bronx doo wop", "doo wop street", "neo doo wop"], emoji: "🎶" },
  { id: "motown", label: "Motown", queries: ["motown", "motown classics", "motown soul", "motown hits", "temptations", "supremes", "motown love songs", "motown dance", "motown groove", "detroit soul", "motown r&b", "tamla motown", "four tops", "motown ballad", "marvin gaye", "stevie wonder motown", "jackson 5", "motown party", "motown girl group", "northern soul motown", "motown funk", "smokey robinson", "motown 60s", "motown 70s", "classic motown hits"], emoji: "🎙️" },
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
