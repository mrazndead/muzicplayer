export const EQ_PRESETS = [
  { name: "Flat", values: [0, 0, 0, 0, 0] },
  { name: "Bass Boost", values: [6, 4, 0, -1, -2] },
  { name: "Treble Boost", values: [-2, -1, 0, 3, 6] },
  { name: "Vocal", values: [-2, 0, 4, 3, -1] },
  { name: "Rock", values: [4, 2, -1, 2, 4] },
  { name: "Electronic", values: [4, 2, 0, 2, 5] },
];
export const DEFAULT_EQ_PRESET = EQ_PRESETS[3];

export function defaultEqualizerGain(index: number): number {
  return DEFAULT_EQ_PRESET.values[index] ?? 0;
}