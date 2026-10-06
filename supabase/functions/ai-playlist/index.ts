// AI DJ: turns a free-form description into a list of search queries for a playlist.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM = `You are PULSE DJ, a music curator. The user describes the playlist they want (artist, year, decade, chart/top lists, genre, mood, activity, anything).
Return a playlist as concrete search queries for a free music catalog.
- For specific songs (top lists, artist catalogs, years) use "Artist - Song Title" queries, one per song, 15-25 songs.
- For vibes/genres/moods with no specific songs, give 8-12 short descriptive queries (e.g. "dark synthwave", "lofi rain study").
- Mix both when useful. Never repeat a query.
- "reply" is one or two short friendly sentences describing the mix. "title" is a short playlist name.
If the user is just chatting, still build a fitting playlist.`;

const schema = {
  type: "object",
  additionalProperties: false,
  required: ["title", "reply", "queries"],
  properties: {
    title: { type: "string" },
    reply: { type: "string" },
    queries: { type: "array", items: { type: "string" } },
  },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  try {
    const { messages } = await req.json();
    if (!Array.isArray(messages) || !messages.length) return json({ error: "Tell me what you want to hear." }, 400);
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) return json({ error: "AI is not configured." }, 500);

    const input = [
      { role: "system", content: SYSTEM },
      ...messages.slice(-10).map((m: { role: string; content: string }) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: String(m.content).slice(0, 4000),
      })),
    ];

    const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
      method: "POST",
      signal: req.signal,
      headers: { "Content-Type": "application/json", "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "fetch" },
      body: JSON.stringify({
        model: "openai/gpt-6-astra",
        input,
        stream: true,
        store: false,
        reasoning: { effort: "low" },
        text: { format: { type: "json_schema", name: "playlist", strict: true, schema } },
      }),
    });

    if (!res.ok || !res.body) {
      let msg = "The AI couldn't build a playlist right now.";
      try { const e = await res.json(); msg = e?.error?.message ?? e?.message ?? msg; } catch { /* ignore */ }
      if (res.status === 429) msg = "Too many requests — try again in a moment.";
      if (res.status === 402) msg = "AI credits are used up for this month.";
      return json({ error: msg }, res.status);
    }

    // Consume the SSE stream and collect the output text.
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let buf = "", text = "", failed = "";
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      let idx;
      while ((idx = buf.indexOf("\n")) >= 0) {
        const line = buf.slice(0, idx).trim();
        buf = buf.slice(idx + 1);
        if (!line.startsWith("data:")) continue;
        const data = line.slice(5).trim();
        if (!data || data === "[DONE]") continue;
        try {
          const ev = JSON.parse(data);
          if (ev.type === "response.output_text.delta") text += ev.delta ?? "";
          else if (ev.type === "response.failed" || ev.type === "error")
            failed = ev.response?.error?.message ?? ev.message ?? "AI request failed";
        } catch { /* partial line */ }
      }
    }
    if (failed && !text) return json({ error: failed }, 502);
    let parsed;
    try { parsed = JSON.parse(text); } catch { return json({ error: "The AI gave an unexpected answer. Try rephrasing." }, 502); }
    return json(parsed);
  } catch (e) {
    if (req.signal.aborted) return new Response(null, { status: 499 });
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
