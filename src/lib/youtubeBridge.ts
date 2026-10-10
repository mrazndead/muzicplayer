// Hidden YouTube iframe bridge: plays YouTube audio-only inside the main player.
// Uses the embed's postMessage API (no API key needed).

let iframe: HTMLIFrameElement | null = null;
let currentVideoId: string | null = null;
let onEnded: (() => void) | null = null;
let onState: ((playing: boolean) => void) | null = null;
let listening = false;

let volume = 70;

function post(func: string, args: unknown[] = []) {
  iframe?.contentWindow?.postMessage(
    JSON.stringify({ event: "command", func, args }),
    "*",
  );
}

export function setYouTubeVolume(v: number) {
  volume = Math.round(Math.max(0, Math.min(1, v)) * 100);
  post("setVolume", [volume]);
}

function handleMessage(e: MessageEvent) {
  if (typeof e.data !== "string" || !e.origin.includes("youtube")) return;
  try {
    const msg = JSON.parse(e.data);
    if (msg.event !== "onStateChange") return;
    const state = msg.info;
    if (state === 0) onEnded?.(); // ended
    else if (state === 1) onState?.(true); // playing
    else if (state === 2) onState?.(false); // paused
  } catch {
    /* not a player message */
  }
}

function ensureListener() {
  if (listening) return;
  listening = true;
  window.addEventListener("message", handleMessage);
}

export function setYouTubeBridgeCallbacks(cbs: {
  onEnded?: () => void;
  onState?: (playing: boolean) => void;
}) {
  onEnded = cbs.onEnded ?? null;
  onState = cbs.onState ?? null;
}

export function playYouTube(videoId: string) {
  ensureListener();
  if (iframe && currentVideoId === videoId) {
    post("playVideo");
    return;
  }
  stopYouTube();
  currentVideoId = videoId;
  iframe = document.createElement("iframe");
  iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&enablejsapi=1&playsinline=1`;
  iframe.allow = "autoplay; encrypted-media";
  iframe.style.cssText =
    "position:fixed;bottom:0;right:0;width:1px;height:1px;opacity:0.01;pointer-events:none;border:0;";
  iframe.setAttribute("aria-hidden", "true");
  iframe.title = "YouTube audio";
  document.body.appendChild(iframe);
  // Subscribe to state events once the embed is up.
  setTimeout(() => {
    iframe?.contentWindow?.postMessage(JSON.stringify({ event: "listening" }), "*");
  }, 1200);
}

export function pauseYouTube() {
  post("pauseVideo");
}

export function resumeYouTube() {
  post("playVideo");
}

export function stopYouTube() {
  if (iframe) {
    iframe.remove();
    iframe = null;
  }
  currentVideoId = null;
}

export function isYouTubeTrack(id?: string | null): boolean {
  return !!id && id.startsWith("yt:");
}

export function youTubeVideoId(id: string): string {
  return id.slice(3);
}
