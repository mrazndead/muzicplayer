import { describe, expect, it, vi } from "vitest";
import { getYouTubeVideoId, isYouTubeTrack } from "./youtubeMp3";
import { AudiusTrack } from "@/lib/audius";

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { functions: { invoke: vi.fn() } },
}));

function track(over: Partial<AudiusTrack>): AudiusTrack {
  return {
    id: "a1",
    title: "Song",
    user: { name: "Artist", id: "artist" },
    duration: 180,
    genre: "Pop",
    play_count: 0,
    permalink: "",
    ...over,
  } as AudiusTrack;
}

describe("YouTube download detection", () => {
  it("reads the video id from an AI DJ track id", () => {
    const t = track({ id: "yt:dQw4w9WgXcQ", source: "youtube", permalink: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" });
    expect(getYouTubeVideoId(t)).toBe("dQw4w9WgXcQ");
    expect(isYouTubeTrack(t)).toBe(true);
  });

  it("reads the video id from a YouTube tab result", () => {
    const t = track({ id: "abc123", source: "youtube", permalink: "https://www.youtube.com/watch?v=abc123" });
    expect(getYouTubeVideoId(t)).toBe("abc123");
    expect(isYouTubeTrack(t)).toBe(true);
  });

  it("falls back to the permalink when the id carries no video", () => {
    const t = track({ id: "weird:id", source: "youtube", permalink: "https://www.youtube.com/watch?v=zz99qq" });
    expect(getYouTubeVideoId(t)).toBe("zz99qq");
  });

  it("does not treat free-source songs as YouTube", () => {
    expect(isYouTubeTrack(track({ id: "aud1", source: "audius" }))).toBe(false);
    expect(isYouTubeTrack(track({ id: "aud1", source: "audius", permalink: "https://example.com/v=abc" }))).toBe(false);
  });
});
