import { motion } from "framer-motion";
import { AudiusTrack, getArtworkUrl } from "@/lib/audius";

interface TrendingCarouselProps {
  tracks: AudiusTrack[];
  onPlay: (track: AudiusTrack, index: number) => void;
  currentTrackId?: string;
}

export function TrendingCarousel({ tracks, onPlay, currentTrackId }: TrendingCarouselProps) {
  if (!tracks.length) return null;

  return (
    <div>
      <h2 className="font-heading text-lg font-semibold text-foreground mb-4 tracking-wide">
        🔥 Trending Now
      </h2>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
        {tracks.slice(0, 12).map((track, i) => {
          const isCurrent = track.id === currentTrackId;
          return (
            <motion.button
              key={track.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.04 }}
              onClick={() => onPlay(track, i)}
              className={`flex-shrink-0 w-36 sm:w-40 group text-left ${isCurrent ? "" : ""}`}
            >
              <div className={`relative w-36 h-36 sm:w-40 sm:h-40 rounded-xl overflow-hidden mb-2 
                ${isCurrent ? "ring-2 ring-primary glow-border" : ""}`}>
                <img
                  src={getArtworkUrl(track, "480x480")}
                  alt={track.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
                <div className="absolute bottom-2 left-2 right-2">
                  <p className="text-xs font-medium text-foreground line-clamp-1">{track.title}</p>
                  <p className="text-[10px] text-muted-foreground line-clamp-1">{track.user.name}</p>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
