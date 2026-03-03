import { motion } from "framer-motion";
import { DEFAULT_MOODS } from "@/lib/audius";

interface MoodGridProps {
  activeMood: string | null;
  onSelectMood: (mood: typeof DEFAULT_MOODS[number]) => void;
}

export function MoodGrid({ activeMood, onSelectMood }: MoodGridProps) {
  return (
    <div>
      <h2 className="font-heading text-sm font-semibold text-foreground mb-3 tracking-wide uppercase opacity-70">Moods</h2>
      <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
        {DEFAULT_MOODS.map((mood, i) => {
          const isActive = activeMood === mood.id;
          return (
            <motion.button
              key={mood.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.03 }}
              onClick={() => onSelectMood(mood)}
              className={`flex-shrink-0 flex flex-col items-center justify-center gap-1.5 w-20 h-20 rounded-2xl transition-all duration-300 card-hover ${
                isActive
                  ? "gradient-primary text-primary-foreground ring-2 ring-primary/30 glow-border"
                  : "glass-card text-foreground hover:bg-secondary/40"
              }`}
            >
              <span className="text-2xl">{mood.emoji}</span>
              <span className="text-[10px] font-medium leading-none">{mood.label}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
