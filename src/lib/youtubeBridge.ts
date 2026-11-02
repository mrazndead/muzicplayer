// YouTube's embed command protocol; playback state comes from the player, not timers.
let iframe: HTMLIFrameElement | null = null;
let currentVideoId: string | null = null;
let onEnded: (() => void) | null = null;
let onState: ((playing: boolean) => void) | null = null;
let onProgress: ((time: number, duration: number) => void) | null = null;
let onError: ((message: string) => void) | null = null;
let listening = false;
let ready = false;
let desiredPlaying = false;
let volume = 70;
let handshake: ReturnType<typeof setInterval> | undefined;
let startup: ReturnType<typeof setTimeout> | undefined;
const YOUTUBE_ORIGIN = "https://www.youtube.com";

function post(func: string, args: unknown[] = []) {
  iframe?.contentWindow?.postMessage(JSON.stringify({ event: "command", func, args }), YOUTUBE_ORIGIN);
}

function clearStartup() {
  clearTimeout(startup);
  startup = undefined;
}

function armStartup() {
  clearStartup();
  startup = setTimeout(() => {
    desiredPlaying = false;
    post("pauseVideo");
    onState?.(false);
    onError?.("YouTube couldn't start audio. Tap Play to try again; this video may block embedded playback.");
  }, 15000);
}

function applyPlayback() {
  post("setVolume", [volume]);
  post(volume === 0 ? "mute" : "unMute");
  post(desiredPlaying ? "playVideo" : "pauseVideo");
}

export function setYouTubeVolume(v: number) {
  volume = Math.round(Math.max(0, Math.min(1, v)) * 100);
  post("setVolume", [volume]);
  post(volume === 0 ? "mute" : "unMute");
}

function handleMessage(e: MessageEvent) {
  if (!iframe || e.source !== iframe.contentWindow || e.origin !== YOUTUBE_ORIGIN) return;
  try {
    const msg = typeof e.data === "string" ? JSON.parse(e.data) : e.data;
    if (!msg || typeof msg !== "object") return;
    if (msg.event === "onReady" || (!ready && msg.event === "infoDelivery")) {
      ready = true;
      clearInterval(handshake);
      post("addEventListener", ["onStateChange"]);
      post("addEventListener", ["onError"]);
      applyPlayback();
    }
    if (msg.event === "onError") {
      clearStartup();
      desiredPlaying = false;
      onState?.(false);
      onError?.("This YouTube video cannot play here. Try another track.");
      return;
    }
    const state = msg.event === "onStateChange" ? msg.info : msg.event === "infoDelivery" ? msg.info?.playerState : undefined;
    if (state === 0) { clearStartup(); onState?.(false); onEnded?.(); }
    else if (state === 1) { clearStartup(); onState?.(true); }
    else if (state === 2) onState?.(false);
    if (msg.event === "infoDelivery" && Number.isFinite(msg.info?.currentTime) && Number.isFinite(msg.info?.duration)) {
      onProgress?.(msg.info.currentTime, msg.info.duration);
    }
  } catch { /* Ignore non-player messages. */ }
}

export function setYouTubeBridgeCallbacks(cbs: {
  onEnded?: () => void;
  onState?: (playing: boolean) => void;
  onProgress?: (time: number, duration: number) => void;
  onError?: (message: string) => void;
}) {
  onEnded = cbs.onEnded ?? null;
  onState = cbs.onState ?? null;
  onProgress = cbs.onProgress ?? null;
  onError = cbs.onError ?? null;
}

export function playYouTube(videoId: string) {
  if (!listening) {
    listening = true;
    window.addEventListener("message", handleMessage);
  }
  if (iframe && currentVideoId === videoId) {
    resumeYouTube();
    return;
  }
  stopYouTube();
  currentVideoId = videoId;
  desiredPlaying = true;
  iframe = document.createElement("iframe");
  // Muted startup is permitted by more browsers. Unmuting may still require a fresh Play tap.
  const params = new URLSearchParams({ autoplay: "1", mute: "1", enablejsapi: "1", playsinline: "1", origin: window.location.origin });
  iframe.src = `${YOUTUBE_ORIGIN}/embed/${encodeURIComponent(videoId)}?${params}`;
  iframe.allow = "autoplay; encrypted-media";
  iframe.style.cssText = "position:fixed;bottom:0;right:0;width:1px;height:1px;opacity:0.01;pointer-events:none;border:0;";
  iframe.setAttribute("aria-hidden", "true");
  iframe.title = "YouTube audio";
  const frame = iframe;
  const subscribe = () => {
    if (iframe !== frame) return;
    frame.contentWindow?.postMessage(JSON.stringify({ event: "listening", id: "pulse-youtube" }), YOUTUBE_ORIGIN);
  };
  frame.addEventListener("load", subscribe);
  document.body.appendChild(frame);
  handshake = setInterval(subscribe, 500);
  armStartup();
}

export function pauseYouTube() {
  desiredPlaying = false;
  clearStartup();
  post("pauseVideo");
}

export function resumeYouTube() {
  desiredPlaying = true;
  armStartup();
  applyPlayback();
}

export function seekYouTube(time: number) {
  post("seekTo", [Math.max(0, time), true]);
}

export function stopYouTube() {
  clearInterval(handshake);
  clearStartup();
  iframe?.remove();
  iframe = null;
  currentVideoId = null;
  ready = false;
  desiredPlaying = false;
}

export function isYouTubeTrack(id?: string | null): boolean {
  return !!id && id.startsWith("yt:");
}

export function youTubeVideoId(id: string): string {
  return id.slice(3);
}