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
      <div className="flex flex-wrap justify-center gap-2">
        {DEFAULT_MOODS.map((mood, i) => {
          const isActive = activeMood === mood.id;
          return (
            <motion.button
              key={mood.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.03 }}
              onClick={() => onSelectMood(mood)}
              className={`px-4 py-2 rounded-full text-xs font-medium transition-all duration-300
                ${isActive
                  ? "gradient-primary text-primary-foreground shadow-lg glow-sm"
                  : "glass-card text-muted-foreground hover:text-foreground"
                }`}
            >
              <span className="mr-1">{mood.emoji}</span>
              {mood.label}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}