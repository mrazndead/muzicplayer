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

/** Streams the converted MP3 back to the browser so the download never leaves the app. */
async function proxyFile(fileUrl: string, name: string): Promise<Response> {
  let target: URL;
  try {
    target = new URL(fileUrl);
  } catch {
    return json({ error: "Invalid file url" }, 400);
  }
  if (target.protocol !== "https:" || !/(^|\.)cnvmp3\.(com|online)$/i.test(target.hostname)) {
    return json({ error: "Unsupported file host" }, 400);
  }

  const upstream = await fetch(target.toString(), {
    headers: { "user-agent": UA, referer: "https://cnvmp3.com/", accept: "*/*" },
  });
  if (!upstream.ok || !upstream.body) return json({ error: "File is no longer available" }, 502);

  const filename = safeName(name.replace(/\.mp3$/i, ""));
  return new Response(upstream.body, {
    headers: {
      ...corsHeaders,
      "Content-Type": "audio/mpeg",
      "Content-Disposition": `attachment; filename="${filename.replace(/"/g, "")}"`,
      ...(upstream.headers.get("content-length")
        ? { "Content-Length": upstream.headers.get("content-length") as string }
        : {}),
      "Cache-Control": "no-store",
    },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Download proxy: /youtube-mp3?file=<converted url>&name=<filename>
    const reqUrl = new URL(req.url);
    const fileParam = reqUrl.searchParams.get("file");
    if (fileParam) {
      return await proxyFile(fileParam, reqUrl.searchParams.get("name") || "audio");
    }

    const body = await req.json().catch(() => ({}));
    const videoId = String((body as Record<string, unknown>).videoId ?? "").trim();
    const title = String((body as Record<string, unknown>).title ?? "").trim();
    if (!/^[A-Za-z0-9_-]{11}$/.test(videoId)) return json({ error: "Invalid video id" }, 400);

    const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;

    // 1. Already converted before? Reuse the cached file (several bitrate/format variants).
    for (const quality of [5, 4, 3, 2, 1, 0]) {
      const cached = await post("https://cnvmp3.com/check_database.php", {
        youtube_id: videoId,
        quality,
        formatValue: 1,
      }, 15000);
      const data = cached && typeof cached.data === "object" && cached.data
        ? (cached.data as Record<string, unknown>)
        : null;
      const serverPath = data && typeof data.server_path === "string" ? data.server_path : "";
      if (cached?.success && serverPath) {
        const cachedTitle = typeof data?.title === "string" ? data.title : title;
        return json({ url: encodeURI(serverPath), filename: safeName(cachedTitle || title) });
      }
    }

    // 2. Fresh conversion — retried, since the service intermittently rejects requests.
    let fresh: Record<string, unknown> | null = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      if (attempt) await new Promise((r) => setTimeout(r, 1200 * attempt));
      fresh = await post("https://cnvmp3.com/fetch.php", {
        url: watchUrl,
        downloadMode: "audio",
        filenameStyle: "basic",
        audioBitrate: "128",
      });
      if (fresh && typeof fresh.url === "string" && fresh.url) break;
    }
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
      return json({ error: message, code });
    }

    const filename = typeof fresh?.filename === "string" && fresh.filename
      ? safeName(fresh.filename.replace(/\.mp3$/i, ""))
      : safeName(title);

    return json({ url, filename });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
