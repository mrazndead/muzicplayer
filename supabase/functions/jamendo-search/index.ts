// Jamendo search proxy — keeps CLIENT_ID server-side.
// Returns tracks normalized to the app's AudiusTrack shape.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const clientId = Deno.env.get("JAMENDO_CLIENT_ID");
  if (!clientId) {
    return new Response(JSON.stringify({ data: [], reason: "no_client_id" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const query = String(body?.query ?? "").slice(0, 200);
    const limit = Math.min(50, Math.max(1, Number(body?.limit ?? 20)));
    const offset = Math.max(0, Number(body?.offset ?? 0));

    if (!query.trim()) {
      return new Response(JSON.stringify({ data: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = new URL("https://api.jamendo.com/v3.0/tracks/");
    url.searchParams.set("client_id", clientId);
    url.searchParams.set("format", "json");
    url.searchParams.set("limit", String(limit));
    url.searchParams.set("offset", String(offset));
    url.searchParams.set("search", query);
    url.searchParams.set("audioformat", "mp32");
    url.searchParams.set("include", "musicinfo");
    url.searchParams.set("order", "popularity_total_desc");

    const res = await fetch(url.toString());
    if (!res.ok) {
      const text = await res.text();
      return new Response(JSON.stringify({ data: [], error: text }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const json = await res.json();
    const results = (json?.results ?? []) as Array<Record<string, unknown>>;

    const tracks = results
      .filter((t) => typeof t.audio === "string" && (t.audio as string).length > 0)
      .map((t) => {
        const image = (t.album_image as string) || (t.image as string) || undefined;
        return {
          id: `jam-${t.id}`,
          title: String(t.name ?? "Untitled"),
          user: { name: String(t.artist_name ?? "Unknown"), id: `jam-artist-${t.artist_id ?? ""}` },
          artwork: image
            ? { "150x150": image, "480x480": image, "1000x1000": image }
            : undefined,
          duration: Number(t.duration ?? 0),
          genre: String(
            (Array.isArray((t as any)?.musicinfo?.tags?.genres) &&
              (t as any).musicinfo.tags.genres[0]) ||
              "Jamendo",
          ),
          play_count: 0,
          permalink: String(t.shareurl ?? ""),
          streamUrl: String(t.audio),
          source: "jamendo",
        };
      });

    return new Response(JSON.stringify({ data: tracks }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ data: [], error: String(e) }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
