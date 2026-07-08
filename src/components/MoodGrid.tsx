import { motion } from "framer-motion";
import { DEFAULT_MOODS } from "@/lib/audius";

// Per-mood accent glow (color tuned to emoji vibe)
const MOOD_ACCENT: Record<string, string> = {
  chill: "text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.55)]",
  energetic: "text-orange-400 drop-shadow-[0_0_10px_rgba(251,146,60,0.55)]",
  melancholy: "text-indigo-300 drop-shadow-[0_0_10px_rgba(165,180,252,0.5)]",
  romantic: "text-pink-400 drop-shadow-[0_0_10px_rgba(244,114,182,0.55)]",
  focus: "text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.55)]",
  party: "text-fuchsia-400 drop-shadow-[0_0_10px_rgba(232,121,249,0.55)]",
  dreamy: "text-violet-300 drop-shadow-[0_0_10px_rgba(196,181,253,0.55)]",
  uplifting: "text-yellow-300 drop-shadow-[0_0_10px_rgba(253,224,71,0.55)]",
};

export function MoodGrid({ activeMood, onSelectMood }: {
  activeMood: string | null;
  onSelectMood: (mood: typeof DEFAULT_MOODS[number]) => void;
}) {
  return (
    <div>
      <div className="grid grid-cols-4 gap-2.5">
        {DEFAULT_MOODS.map((mood, i) => {
          const isActive = activeMood === mood.id;
          const accent = MOOD_ACCENT[mood.id] ?? "text-primary drop-shadow-[0_0_10px_hsl(var(--primary)/0.55)]";
          return (
            <motion.button
              key={mood.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.025 }}
              onClick={() => onSelectMood(mood)}
              className={`h-16 rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all duration-200 ${
                isActive
                  ? "gradient-primary text-primary-foreground glow-sm ring-1 ring-primary/40"
                  : "bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] hover:border-white/10"
              }`}
            >
              <span className={`text-sm leading-none ${isActive ? "" : accent}`}>{mood.emoji}</span>
              <span className="text-[9px] font-bold uppercase tracking-tight leading-none">{mood.label}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
