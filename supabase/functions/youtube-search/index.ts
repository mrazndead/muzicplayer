const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Public Piped / Invidious style instances (keyless YouTube search).
const PIPED_HOSTS = [
  "https://pipedapi.kavin.rocks",
  "https://pipedapi.adminforge.de",
  "https://api.piped.private.coffee",
  "https://pipedapi.reallyaweso.me",
];

const INVIDIOUS_HOSTS = [
  "https://inv.nadeko.net",
  "https://invidious.nerdvpn.de",
  "https://yewtu.be",
];

interface Result {
  id: string;
  title: string;
  channel: string;
  duration: number;
  thumbnail: string;
}

function fromPiped(items: unknown): Result[] {
  if (!Array.isArray(items)) return [];
  return items
    .filter((i: any) => i && typeof i.url === "string" && i.url.includes("watch?v="))
    .map((i: any) => ({
      id: String(i.url).split("watch?v=")[1].split("&")[0],
      title: i.title ?? "Unknown",
      channel: i.uploaderName ?? "Unknown",
      duration: typeof i.duration === "number" ? i.duration : 0,
      thumbnail: i.thumbnail ?? "",
    }))
    .filter((r) => r.id && r.duration > 0);
}

function fromInvidious(items: unknown): Result[] {
  if (!Array.isArray(items)) return [];
  return items
    .filter((i: any) => i && i.type === "video" && i.videoId)
    .map((i: any) => ({
      id: i.videoId,
      title: i.title ?? "Unknown",
      channel: i.author ?? "Unknown",
      duration: typeof i.lengthSeconds === "number" ? i.lengthSeconds : 0,
      thumbnail: Array.isArray(i.videoThumbnails) && i.videoThumbnails.length
        ? i.videoThumbnails[Math.min(2, i.videoThumbnails.length - 1)].url
        : `https://i.ytimg.com/vi/${i.videoId}/mqdefault.jpg`,
    }))
    .filter((r) => r.id && r.duration > 0);
}

async function tryFetch(url: string, timeoutMs = 7000): Promise<unknown | null> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers: { accept: "application/json" } });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { query } = await req.json().catch(() => ({ query: "" }));
    const q = String(query ?? "").trim();
    if (!q) {
      return new Response(JSON.stringify({ results: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    for (const host of PIPED_HOSTS) {
      const data = await tryFetch(`${host}/search?q=${encodeURIComponent(q)}&filter=music_songs`);
      const results = fromPiped((data as any)?.items ?? data);
      if (results.length) {
        return new Response(JSON.stringify({ results: results.slice(0, 30), source: "piped" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    for (const host of INVIDIOUS_HOSTS) {
      const data = await tryFetch(`${host}/api/v1/search?q=${encodeURIComponent(q)}&type=video`);
      const results = fromInvidious(data);
      if (results.length) {
        return new Response(JSON.stringify({ results: results.slice(0, 30), source: "invidious" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    return new Response(JSON.stringify({ results: [], error: "All search providers unavailable" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ results: [], error: String(e) }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
