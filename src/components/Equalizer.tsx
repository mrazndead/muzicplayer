import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SlidersHorizontal, X } from "lucide-react";
import { EQ_PRESETS, DEFAULT_EQ_PRESET } from "@/lib/equalizer";

const BAND_LABELS = ["60Hz", "230Hz", "910Hz", "3.6kHz", "14kHz"];

interface EqualizerProps {
  audioContext: AudioContext | null;
  filters: BiquadFilterNode[];
}

export function Equalizer({ audioContext, filters }: EqualizerProps) {
  const [open, setOpen] = useState(false);
  const [activePreset, setActivePreset] = useState(() =>
    filters.length > 0 ? EQ_PRESETS.find(p => p.values.every((v, i) => v === filters[i]?.gain.value))?.name ?? "" : DEFAULT_EQ_PRESET.name
  );
  const [gains, setGains] = useState<number[]>(() =>
    filters.length > 0 ? filters.map(f => f.gain.value) : [...DEFAULT_EQ_PRESET.values]
  );

  const applyGain = (index: number, value: number) => {
    const newGains = [...gains];
    newGains[index] = value;
    setGains(newGains);
    setActivePreset("");
    if (filters[index]) {
      filters[index].gain.value = value;
    }
  };

  const applyPreset = (preset: typeof EQ_PRESETS[number]) => {
    setActivePreset(preset.name);
    setGains([...preset.values]);
    preset.values.forEach((val, i) => {
      if (filters[i]) filters[i].gain.value = val;
    });
  };

  return (
    <>
      <button
        aria-label="Equalizer"
        onClick={() => setOpen(!open)}
        className={`p-2 transition-colors ${open ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
      >
        <SlidersHorizontal className="w-5 h-5" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mx-5 mb-4 p-4 glass rounded-2xl"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-foreground">Equalizer</span>
              <button onClick={() => setOpen(false)} className="p-1 text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Presets */}
            <div className="flex flex-wrap gap-1.5 mb-4">
              {EQ_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  aria-pressed={activePreset === preset.name}
                  onClick={() => applyPreset(preset)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-full transition-colors ${
                    activePreset === preset.name
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {preset.name}
                </button>
              ))}
            </div>

            {/* Sliders */}
            <div className="flex items-end justify-between gap-2 h-32">
              {BAND_LABELS.map((label, i) => (
                <div key={label} className="flex flex-col items-center gap-1 flex-1">
                  <span className="text-[10px] text-primary font-medium tabular-nums">
                    {gains[i] > 0 ? "+" : ""}{gains[i]}dB
                  </span>
                  <div className="relative h-20 w-full flex justify-center">
                    <input
                      type="range"
                      min={-12}
                      max={12}
                      step={1}
                      value={gains[i]}
                      onChange={(e) => applyGain(i, Number(e.target.value))}
                      className="absolute w-20 accent-primary"
                      style={{
                        transform: "rotate(-90deg)",
                        transformOrigin: "center",
                      }}
                    />
                  </div>
                  <span className="text-[9px] text-muted-foreground">{label}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
