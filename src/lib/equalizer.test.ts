import { describe, expect, it } from "vitest";
import { DEFAULT_EQ_PRESET, defaultEqualizerGain } from "./equalizer";

describe("default equalizer", () => {
  it("selects Vocal with the actual Vocal gains rather than Flat", () => {
    expect(DEFAULT_EQ_PRESET.name).toBe("Vocal");
    expect([0, 1, 2, 3, 4].map(defaultEqualizerGain)).toEqual([-2, 0, 4, 3, -1]);
  });
});