const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

const headers = {
  "content-type": "application/json",
  accept: "application/json",
  "user-agent": UA,
  origin: "https://cnvmp3.com",
  referer: "https://cnvmp3.com/v55",
};

const safeName = (s: string) =>
  (s || "audio").replace(/[\\/:*?"<>|]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 120) + ".mp3";

async function post(url: string, body: unknown, timeoutMs = 90000): Promise<Record<string, unknown> | null> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { method: "POST", headers, body: JSON.stringify(body), signal: ctrl.signal });
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
    const body = await req.json().catch(() => ({}));
    const videoId = String((body as Record<string, unknown>).videoId ?? "").trim();
    const title = String((body as Record<string, unknown>).title ?? "").trim();
    if (!/^[A-Za-z0-9_-]{11}$/.test(videoId)) return json({ error: "Invalid video id" }, 400);

    const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;

    // 1. Already converted before? Reuse the cached file.
    const cached = await post("https://cnvmp3.com/check_database.php", {
      youtube_id: videoId,
      quality: 5,
      formatValue: 1,
    }, 20000);
    const data = cached && typeof cached.data === "object" && cached.data
      ? (cached.data as Record<string, unknown>)
      : null;
    const serverPath = data && typeof data.server_path === "string" ? data.server_path : "";
    if (cached?.success && serverPath) {
      const cachedTitle = typeof data?.title === "string" ? data.title : title;
      return json({ url: encodeURI(serverPath), filename: safeName(cachedTitle || title) });
    }

    // 2. Fresh conversion.
    const fresh = await post("https://cnvmp3.com/fetch.php", {
      url: watchUrl,
      downloadMode: "audio",
      filenameStyle: "basic",
      audioBitrate: "128",
    });
    const url = fresh && typeof fresh.url === "string" ? fresh.url : "";
    if (!url) {
      const errObj = fresh && typeof fresh.error === "object" && fresh.error
        ? (fresh.error as Record<string, unknown>)
        : null;
      const code = errObj && typeof errObj.code === "string" ? errObj.code : "";
      const message = code.includes("login") || code.includes("content")
        ? "This video is restricted and can't be converted."
        : code.includes("live")
        ? "Live streams can't be converted."
        : "Conversion service is busy. Try again in a moment.";
      return json({ error: message, code }, 502);
    }

    const filename = typeof fresh?.filename === "string" && fresh.filename
      ? safeName(fresh.filename.replace(/\.mp3$/i, ""))
      : safeName(title);

    return json({ url, filename });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
