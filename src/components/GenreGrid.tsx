import { motion } from "framer-motion";
import { DEFAULT_GENRES } from "@/lib/audius";

interface GenreGridProps {
  activeGenre: string | null;
  onSelectGenre: (genre: typeof DEFAULT_GENRES[number]) => void;
}

const genreGradients: Record<string, string> = {
  "soft-rock": "from-rose-600 to-orange-500",
  jazz: "from-amber-600 to-yellow-500",
  vietnamese: "from-emerald-600 to-teal-400",
  korean: "from-pink-600 to-fuchsia-400",
  trance: "from-violet-600 to-blue-500",
  house: "from-indigo-600 to-purple-400",
  lofi: "from-sky-600 to-cyan-400",
  rnb: "from-red-600 to-pink-400",
  classical: "from-slate-600 to-zinc-400",
  hiphop: "from-orange-600 to-red-500",
  ambient: "from-teal-600 to-emerald-400",
  reggae: "from-green-600 to-lime-400",
};

export function GenreGrid({ activeGenre, onSelectGenre }: GenreGridProps) {
  return (
    <div className="flex flex-wrap gap-2.5">
      {DEFAULT_GENRES.map((genre, i) => {
        const isActive = activeGenre === genre.id;
        return (
          <motion.button
            key={genre.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.04 }}
            onClick={() => onSelectGenre(genre)}
            className={`flex-shrink-0 px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 
              ${isActive 
                ? `bg-gradient-to-r ${genreGradients[genre.id] || "gradient-primary"} text-white shadow-lg` 
                : "bg-secondary text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
          >
            <span className="mr-1.5">{genre.emoji}</span>
            {genre.label}
          </motion.button>
        );
      })}
    </div>
  );
}
