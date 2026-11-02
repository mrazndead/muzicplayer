import { describe, expect, it } from "vitest";
import { isConverterFileUrl } from "../../supabase/functions/youtube-mp3/validation";

describe("MP3 file proxy hosts", () => {
  it("accepts the converter's current download host", () => {
    expect(isConverterFileUrl("https://apio8dlp.cnvmp3.site/downloads/download.php?file=music.mp3")).toBe(true);
  });
  it("rejects unrelated and insecure hosts", () => {
    expect(isConverterFileUrl("https://cnvmp3.site.evil.example/audio.mp3")).toBe(false);
    expect(isConverterFileUrl("http://cnvmp3.site/audio.mp3")).toBe(false);
    expect(isConverterFileUrl("https://user:password@cnvmp3.site/audio.mp3")).toBe(false);
  });
});