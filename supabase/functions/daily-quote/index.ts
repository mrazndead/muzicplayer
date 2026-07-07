// Returns a fresh music-related quote via Lovable AI Gateway.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const key = Deno.env.get("LOVABLE_API_KEY");
  if (!key) {
    return new Response(JSON.stringify({ error: "Missing LOVABLE_API_KEY" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const seed = Math.random().toString(36).slice(2, 8);
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": key,
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content:
              "You return ONE original short inspiring quote about music (max 22 words). Reply as strict JSON: {\"text\":\"...\",\"author\":\"...\"}. Author may be a real famous person known for music-related sayings, or 'Unknown'. No preamble, no markdown.",
          },
          { role: "user", content: `Give me a fresh music quote. Seed: ${seed}` },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return new Response(JSON.stringify({ error: "AI request failed", detail: errText }), {
        status: res.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content ?? "{}";
    let parsed: { text?: string; author?: string } = {};
    try {
      parsed = JSON.parse(content);
    } catch {
      parsed = { text: String(content).slice(0, 200), author: "Unknown" };
    }

    return new Response(
      JSON.stringify({
        text: parsed.text || "Music is the shorthand of emotion.",
        author: parsed.author || "Unknown",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
