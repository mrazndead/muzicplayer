import { motion } from "framer-motion";

interface EqualizerBarsProps {
  isPlaying: boolean;
  barCount?: number;
  className?: string;
}

export function EqualizerBars({ isPlaying, barCount = 4, className = "" }: EqualizerBarsProps) {
  const bars = Array.from({ length: barCount });

  return (
    <div className={`flex items-end gap-[2px] h-4 ${className}`}>
      {bars.map((_, i) => (
        <motion.div
          key={i}
          className="w-[3px] rounded-full bg-gradient-to-t from-primary to-accent"
          animate={
            isPlaying
              ? {
                  height: ["4px", `${10 + Math.random() * 6}px`, "6px", `${12 + Math.random() * 4}px`, "4px"],
                }
              : { height: "4px" }
          }
          transition={
            isPlaying
              ? {
                  duration: 0.8 + i * 0.15,
                  repeat: Infinity,
                  ease: "easeInOut",
                }
              : { duration: 0.3 }
          }
        />
      ))}
    </div>
  );
}
