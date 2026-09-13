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

const TARGET = 60;

interface Result {
  id: string;
  title: string;
  channel: string;
  duration: number;
  thumbnail: string;
}

type Raw = Record<string, unknown>;

const asRecord = (v: unknown): Raw => (v && typeof v === "object" ? v as Raw : {});
const str = (v: unknown, fallback = "") => (typeof v === "string" ? v : fallback);
const num = (v: unknown) => (typeof v === "number" ? v : 0);

function fromPiped(items: unknown): Result[] {
  if (!Array.isArray(items)) return [];
  return items
    .map(asRecord)
    .filter((i) => str(i.url).includes("watch?v="))
    .map((i) => ({
      id: str(i.url).split("watch?v=")[1].split("&")[0],
      title: str(i.title, "Unknown"),
      channel: str(i.uploaderName, "Unknown"),
      duration: num(i.duration),
      thumbnail: str(i.thumbnail),
    }))
    .filter((r) => r.id && r.duration > 0);
}

function fromInvidious(items: unknown): Result[] {
  if (!Array.isArray(items)) return [];
  return items
    .map(asRecord)
    .filter((i) => i.type === "video" && str(i.videoId))
    .map((i) => {
      const thumbs = Array.isArray(i.videoThumbnails) ? i.videoThumbnails : [];
      const pick = thumbs.length ? asRecord(thumbs[Math.min(2, thumbs.length - 1)]) : {};
      const videoId = str(i.videoId);
      return {
        id: videoId,
        title: str(i.title, "Unknown"),
        channel: str(i.author, "Unknown"),
        duration: num(i.lengthSeconds),
        thumbnail: str(pick.url) || `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`,
      };
    })
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

    const seen = new Set<string>();
    const merged: Result[] = [];
    const add = (list: Result[]) => {
      for (const r of list) {
        if (seen.has(r.id)) continue;
        seen.add(r.id);
        merged.push(r);
      }
    };

    // Piped: songs + videos filters, plus a page-2 continuation when available.
    for (const host of PIPED_HOSTS) {
      if (merged.length >= TARGET) break;
      const pages = await Promise.all([
        tryFetch(`${host}/search?q=${encodeURIComponent(q)}&filter=music_songs`),
        tryFetch(`${host}/search?q=${encodeURIComponent(q)}&filter=videos`),
      ]);
      let nextpage: string | null = null;
      for (const data of pages) {
        add(fromPiped(asRecord(data).items ?? data));
        const np = asRecord(data).nextpage;
        if (!nextpage && typeof np === "string") nextpage = np;
      }
      if (merged.length < TARGET && nextpage) {
        const more = await tryFetch(
          `${host}/nextpage/search?nextpage=${encodeURIComponent(nextpage)}&q=${encodeURIComponent(q)}&filter=videos`,
        );
        add(fromPiped(asRecord(more).items ?? more));
      }
    }

    // Invidious: extra pages to top up the list.
    for (const host of INVIDIOUS_HOSTS) {
      if (merged.length >= TARGET) break;
      const pages = await Promise.all([
        tryFetch(`${host}/api/v1/search?q=${encodeURIComponent(q)}&type=video&page=1`),
        tryFetch(`${host}/api/v1/search?q=${encodeURIComponent(q)}&type=video&page=2`),
      ]);
      for (const data of pages) add(fromInvidious(data));
    }

    if (!merged.length) {
      return new Response(JSON.stringify({ results: [], error: "All search providers unavailable" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ results: merged.slice(0, TARGET) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ results: [], error: String(e) }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
