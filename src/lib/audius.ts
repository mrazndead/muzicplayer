const APP_NAME = "lovable_pulse";

let cachedHost: string | null = null;

async function getHost(): Promise<string> {
  if (cachedHost) return cachedHost;
  try {
    const res = await fetch("https://api.audius.co");
    const json = await res.json();
    const hosts: string[] = json.data;
    cachedHost = hosts[Math.floor(Math.random() * hosts.length)];
    return cachedHost!;
  } catch {
    cachedHost = "https://discoveryprovider.audius.co";
    return cachedHost;
  }
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
  const res = await fetch(
    `${host}/v1/tracks/search?query=${encodeURIComponent(query)}&limit=${limit}&offset=${offset}&sort_method=${sort}&app_name=${APP_NAME}`
  );
  const json = await res.json();
  return json.data || [];
}

export async function getTrendingTracks(genre?: string, limit = 20): Promise<AudiusTrack[]> {
  const host = await getHost();
  let url = `${host}/v1/tracks/trending?limit=${limit}&app_name=${APP_NAME}`;
  if (genre) url += `&genre=${encodeURIComponent(genre)}`;
  const res = await fetch(url);
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

export const DEFAULT_GENRES = [
  { id: "soft-rock", label: "Soft Rock", query: "soft rock", emoji: "🎸" },
  { id: "jazz", label: "Jazz", query: "jazz", emoji: "🎷" },
  { id: "vietnamese", label: "Vietnamese", query: "vietnamese music", emoji: "🇻🇳" },
  { id: "korean", label: "Korean", query: "korean kpop", emoji: "🇰🇷" },
  { id: "trance", label: "Trance", query: "epic trance", emoji: "🌀" },
  { id: "house", label: "House", query: "house music", emoji: "🏠" },
  { id: "lofi", label: "Lo-Fi", query: "lofi chill beats", emoji: "🎧" },
  { id: "rnb", label: "R&B", query: "r&b soul", emoji: "🎤" },
  { id: "classical", label: "Classical", query: "classical orchestra", emoji: "🎻" },
  { id: "hiphop", label: "Hip Hop", query: "hip hop rap", emoji: "🔥" },
  { id: "ambient", label: "Ambient", query: "ambient chillout", emoji: "🌊" },
  { id: "reggae", label: "Reggae", query: "reggae dub", emoji: "🌴" },
  { id: "pop", label: "Pop", query: "pop music", emoji: "⭐" },
  { id: "edm", label: "EDM", query: "edm electronic", emoji: "⚡" },
  { id: "latin", label: "Latin", query: "latin reggaeton", emoji: "💃" },
  { id: "country", label: "Country", query: "country music", emoji: "🤠" },
  { id: "opera", label: "Opera", query: "opera", emoji: "🎭" },
  { id: "funk", label: "Funk", query: "funk groove", emoji: "🕺" },
  { id: "japanese", label: "Japanese", query: "japanese", emoji: "🇯🇵" },
  { id: "french", label: "French", query: "french", emoji: "🇫🇷" },
  { id: "italian", label: "Italian", query: "italian music", emoji: "🇮🇹" },
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
