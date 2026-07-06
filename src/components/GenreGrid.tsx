import { motion } from "framer-motion";
import { DEFAULT_GENRES } from "@/lib/audius";

interface GenreGridProps {
  activeGenre: string | null;
  onSelectGenre: (genre: typeof DEFAULT_GENRES[number]) => void;
}

export function GenreGrid({ activeGenre, onSelectGenre }: GenreGridProps) {
  const midpoint = Math.ceil(DEFAULT_GENRES.length / 2);
  const firstRow = DEFAULT_GENRES.slice(0, midpoint);
  const secondRow = DEFAULT_GENRES.slice(midpoint);

  const renderGenre = (genre: typeof DEFAULT_GENRES[number], i: number) => {
    const isActive = activeGenre === genre.id;
    return (
      <motion.button
        key={genre.id}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: i * 0.02 }}
        onClick={() => onSelectGenre(genre)}
        className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[10px] font-medium transition-all duration-300 whitespace-nowrap
          ${isActive
            ? "gradient-primary text-primary-foreground shadow-lg glow-sm"
            : "glass-card text-muted-foreground hover:text-foreground"
          }`}
      >
        <span className="mr-1">{genre.emoji}</span>
        {genre.label}
      </motion.button>
    );
  };

  return (
    <div className="-mx-4 space-y-2">
      <div className="px-4 overflow-x-auto scrollbar-hide">
        <div className="flex gap-2 w-max">
          {firstRow.map((genre, i) => renderGenre(genre, i))}
        </div>
      </div>
      <div className="px-4 overflow-x-auto scrollbar-hide">
        <div className="flex gap-2 w-max">
          {secondRow.map((genre, i) => renderGenre(genre, i + midpoint))}
        </div>
      </div>
    </div>
  );
}

