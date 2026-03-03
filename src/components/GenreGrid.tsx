import { motion } from "framer-motion";
import { DEFAULT_GENRES } from "@/lib/audius";

interface GenreGridProps {
  activeGenre: string | null;
  onSelectGenre: (genre: typeof DEFAULT_GENRES[number]) => void;
}

export function GenreGrid({ activeGenre, onSelectGenre }: GenreGridProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-4 px-4">
      {DEFAULT_GENRES.map((genre, i) => {
        const isActive = activeGenre === genre.id;
        return (
          <motion.button
            key={genre.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.02 }}
            onClick={() => onSelectGenre(genre)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-medium transition-all duration-300 whitespace-nowrap
              ${isActive
                ? "gradient-primary text-primary-foreground shadow-lg glow-sm"
                : "glass-card text-muted-foreground hover:text-foreground"
              }`}
          >
            <span className="mr-1">{genre.emoji}</span>
            {genre.label}
          </motion.button>
        );
      })}
    </div>
  );
}
