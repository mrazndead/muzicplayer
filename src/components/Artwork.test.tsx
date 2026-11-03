import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { Artwork } from "./Artwork";
import { getArtworkUrl, pickLocalCover } from "@/lib/audius";

const track = {
  id: "yt:dQw4w9WgXcQ", title: "Test track", source: "youtube" as const,
  artwork: { "480x480": "https://unavailable.example/thumbnail.jpg" },
};
const original = "https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg";

afterEach(cleanup);

describe("artwork recovery", () => {
  it("retries the original YouTube image then a local cover without looping", () => {
    render(<Artwork track={track} />);
    const image = screen.getByRole("img");
    fireEvent.error(image);
    expect(image).toHaveAttribute("src", original);
    fireEvent.error(image);
    expect(image).toHaveAttribute("src", pickLocalCover(track.id));
    fireEvent.error(image);
    expect(image).toHaveAttribute("src", pickLocalCover(track.id));
  });

  it("uses the original YouTube image when the provider supplies no artwork", () => {
    expect(getArtworkUrl({ ...track, artwork: undefined })).toBe(original);
  });

  it("resets to the new artwork when the track changes", () => {
    const { rerender } = render(<Artwork track={track} />);
    fireEvent.error(screen.getByRole("img"));
    rerender(<Artwork track={{ ...track, id: "yt:abcdefghijk", artwork: { "480x480": "https://example.com/new.jpg" } }} />);
    expect(screen.getByRole("img")).toHaveAttribute("src", "https://example.com/new.jpg");
  });
});