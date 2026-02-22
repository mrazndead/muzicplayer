import { motion } from "framer-motion";
import { DEFAULT_MOODS } from "@/lib/audius";

interface MoodGridProps {
  activeMood: string | null;
  onSelectMood: (mood: typeof DEFAULT_MOODS[number]) => void;
}

export function MoodGrid({ activeMood, onSelectMood }: MoodGridProps) {
  return (
    <div>
      <h2 className="font-heading text-base font-semibold text-foreground mb-3">Moods</h2>
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
              className={`flex-shrink-0 flex flex-col items-center justify-center gap-1.5 w-20 h-20 rounded-2xl transition-all duration-200 ${
                isActive
                  ? "gradient-primary text-primary-foreground ring-2 ring-primary/50 glow-border"
                  : "bg-secondary/60 hover:bg-secondary text-foreground"
              }`}
            >
              <span className="text-2xl">{mood.emoji}</span>
              <span className="text-[11px] font-medium leading-none">{mood.label}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
