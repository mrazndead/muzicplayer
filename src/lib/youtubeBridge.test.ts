import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { pauseYouTube, playYouTube, resumeYouTube, seekYouTube, setYouTubeBridgeCallbacks, setYouTubeVolume, stopYouTube } from "./youtubeBridge";

function playerMessage(frame: HTMLIFrameElement, data: unknown, origin = "https://www.youtube.com") {
  window.dispatchEvent(new MessageEvent("message", { origin, source: frame.contentWindow, data: JSON.stringify(data) }));
}

function frameAndCommands() {
  const frame = document.querySelector("iframe");
  if (!frame?.contentWindow) throw new Error("Missing YouTube frame");
  const commands = vi.spyOn(frame.contentWindow, "postMessage");
  return { frame, commands, sent: () => commands.mock.calls.map(([value]) => JSON.parse(String(value))) };
}

describe("YouTube bridge", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => { stopYouTube(); setYouTubeBridgeCallbacks({}); vi.restoreAllMocks(); vi.useRealTimers(); });

  it("starts muted, waits for readiness, then restores audible volume", () => {
    setYouTubeVolume(0.4);
    playYouTube("test-video");
    const { frame, sent } = frameAndCommands();
    expect(new URL(frame.src).searchParams.get("mute")).toBe("1");
    playerMessage(frame, { event: "onReady" });
    expect(sent()).toContainEqual({ event: "command", func: "setVolume", args: [40] });
    expect(sent()).toContainEqual({ event: "command", func: "unMute", args: [] });
    expect(sent()).toContainEqual({ event: "command", func: "playVideo", args: [] });
  });

  it("reports actual state and progress only from the current trusted player", () => {
    const onState = vi.fn();
    const onProgress = vi.fn();
    setYouTubeBridgeCallbacks({ onState, onProgress });
    playYouTube("first");
    const old = frameAndCommands().frame;
    playYouTube("second");
    const { frame } = frameAndCommands();
    playerMessage(old, { event: "onStateChange", info: 1 });
    playerMessage(frame, { event: "onStateChange", info: 1 }, "https://youtube.evil.example");
    expect(onState).not.toHaveBeenCalled();
    playerMessage(frame, { event: "infoDelivery", info: { playerState: 1, currentTime: 12, duration: 180 } });
    expect(onState).toHaveBeenCalledWith(true);
    expect(onProgress).toHaveBeenCalledWith(12, 180);
  });

  it("does not resume a player paused before readiness", () => {
    playYouTube("test-video");
    const { frame, sent } = frameAndCommands();
    pauseYouTube();
    playerMessage(frame, { event: "onReady" });
    expect(sent().filter((c) => c.func === "playVideo")).toHaveLength(0);
    resumeYouTube();
    seekYouTube(20);
    expect(sent()).toContainEqual({ event: "command", func: "playVideo", args: [] });
    expect(sent()).toContainEqual({ event: "command", func: "seekTo", args: [20, true] });
  });

  it("clears stuck playback instead of pretending audio is playing", () => {
    const onError = vi.fn();
    const onState = vi.fn();
    setYouTubeBridgeCallbacks({ onError, onState });
    playYouTube("blocked-video");
    vi.advanceTimersByTime(15000);
    expect(onError).toHaveBeenCalledOnce();
    expect(onState).toHaveBeenCalledWith(false);
  });

  it("cancels stale startup timers when switching to non-YouTube playback", () => {
    const onError = vi.fn();
    setYouTubeBridgeCallbacks({ onError });
    playYouTube("test-video");
    stopYouTube();
    vi.advanceTimersByTime(20000);
    expect(onError).not.toHaveBeenCalled();
  });
});