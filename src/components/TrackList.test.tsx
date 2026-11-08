import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TrackList } from "./TrackList";
import { downloadYouTubeTrack } from "@/lib/youtubeMp3";

vi.mock("@/lib/audius", () => ({
  getDownloadUrl: vi.fn().mockRejectedValue(new Error("Source unavailable")),
  canDownload: () => true,
  getArtworkUrl: () => "cover.jpg",
  getShareUrl: () => "https://example.com/track",
  formatPlayCount: () => "0",
}));
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
vi.mock("@/lib/youtubeMp3", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/youtubeMp3")>();
  return { ...actual, downloadYouTubeTrack: vi.fn().mockResolvedValue(undefined) };
});

describe("track downloads", () => {
  it("allows retry when resolving the download URL fails", async () => {
    render(<TrackList tracks={[{ id: "test", title: "Test song", user: { name: "Artist", id: "artist" }, duration: 180, genre: "Pop", play_count: 0, permalink: "" }]}
      isPlaying={false} onPlay={() => {}} />);
    const download = screen.getByRole("button", { name: "Download Test song as MP3" });
    fireEvent.click(download);
    expect(download).toBeDisabled();
    await waitFor(() => expect(download).toBeEnabled());
  });

  it("offers an MP3 button that converts a YouTube song", async () => {
    const yt = { id: "yt:dQw4w9WgXcQ", title: "Tube song", user: { name: "Channel", id: "c" }, duration: 200, genre: "Pop", play_count: 0, permalink: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", source: "youtube" };
    render(<TrackList tracks={[yt]} isPlaying={false} onPlay={() => {}} />);
    const download = screen.getByRole("button", { name: "Download Tube song as MP3" });
    fireEvent.click(download);
    expect(downloadYouTubeTrack).toHaveBeenCalledWith(expect.objectContaining({ id: "yt:dQw4w9WgXcQ" }));
    await waitFor(() => expect(download).toBeEnabled());
  });
});