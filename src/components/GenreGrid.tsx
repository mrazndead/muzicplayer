import { motion } from "framer-motion";
import { DEFAULT_GENRES } from "@/lib/audius";

interface GenreGridProps {
  activeGenre: string | null;
  onSelectGenre: (genre: typeof DEFAULT_GENRES[number]) => void;
}

const genreColors: Record<string, string> = {
  "soft-rock": "from-rose-500/20 to-orange-500/20 hover:from-rose-500/30 hover:to-orange-500/30",
  jazz: "from-amber-500/20 to-yellow-500/20 hover:from-amber-500/30 hover:to-yellow-500/30",
  vietnamese: "from-emerald-500/20 to-teal-500/20 hover:from-emerald-500/30 hover:to-teal-500/30",
  korean: "from-pink-500/20 to-fuchsia-500/20 hover:from-pink-500/30 hover:to-fuchsia-500/30",
  trance: "from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30",
  house: "from-violet-500/20 to-indigo-500/20 hover:from-violet-500/30 hover:to-indigo-500/30",
};

export function GenreGrid({ activeGenre, onSelectGenre }: GenreGridProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {DEFAULT_GENRES.map((genre, i) => (
        <motion.button
          key={genre.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          onClick={() => onSelectGenre(genre)}
          className={`relative p-4 rounded-xl bg-gradient-to-br ${genreColors[genre.id] || ""} 
            border transition-all duration-300 text-left group
            ${activeGenre === genre.id 
              ? "border-primary glow-border" 
              : "border-border hover:border-primary/40"
            }`}
        >
          <span className="text-2xl mb-2 block">{genre.emoji}</span>
          <span className="font-heading text-xs font-semibold text-foreground tracking-wider uppercase">
            {genre.label}
          </span>
          {activeGenre === genre.id && (
            <motion.div
              layoutId="activeGenre"
              className="absolute inset-0 rounded-xl border-2 border-primary pointer-events-none"
            />
          )}
        </motion.button>
      ))}
    </div>
  );
}
