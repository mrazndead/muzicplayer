import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TrackList } from "./TrackList";

vi.mock("@/lib/audius", () => ({
  getDownloadUrl: vi.fn().mockRejectedValue(new Error("Source unavailable")),
  canDownload: () => true,
  getArtworkUrl: () => "cover.jpg",
  getShareUrl: () => "https://example.com/track",
  formatPlayCount: () => "0",
}));
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

describe("track downloads", () => {
  it("allows retry when resolving the download URL fails", async () => {
    render(<TrackList tracks={[{ id: "test", title: "Test song", user: { name: "Artist", id: "artist" }, duration: 180, genre: "Pop", play_count: 0, permalink: "" }]}
      isPlaying={false} onPlay={() => {}} />);
    const download = screen.getByRole("button", { name: "Download Test song as MP3" });
    fireEvent.click(download);
    expect(download).toBeDisabled();
    await waitFor(() => expect(download).toBeEnabled());
  });
});