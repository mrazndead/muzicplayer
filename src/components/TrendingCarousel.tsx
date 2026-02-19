import { useMemo } from "react";
import { motion } from "framer-motion";
import { AudiusTrack, getArtworkUrl } from "@/lib/audius";
import { Play } from "lucide-react";

interface TrendingCarouselProps {
  tracks: AudiusTrack[];
  onPlay: (track: AudiusTrack, index: number) => void;
  currentTrackId?: string;
}

export function TrendingCarousel({ tracks, onPlay, currentTrackId }: TrendingCarouselProps) {
  const heroIndex = useMemo(() => Math.floor(Math.random() * Math.min(Math.max(tracks.length, 1), 5)), [tracks]);

  if (!tracks.length) return null;

  const heroTrack = tracks[heroIndex];
  const restTracks = tracks.filter((_, i) => i !== heroIndex).slice(0, 9);

  return (
    <div className="space-y-5">
      {/* Hero featured track */}
      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={() => onPlay(heroTrack, 0)}
        className="w-full relative h-48 sm:h-56 rounded-3xl overflow-hidden group text-left"
      >
        <img
          src={getArtworkUrl(heroTrack, "1000x1000")}
          alt={heroTrack.title}
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 mix-blend-overlay" />
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <p className="text-xs font-medium text-primary uppercase tracking-widest mb-1">Featured</p>
          <h3 className="font-heading text-xl sm:text-2xl font-bold text-foreground line-clamp-1">
            {heroTrack.title}
          </h3>
          <p className="text-sm text-muted-foreground mt-0.5">{heroTrack.user.name}</p>
        </div>
        <div className="absolute top-4 right-4 w-10 h-10 rounded-full gradient-primary flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
          <Play className="w-5 h-5 text-primary-foreground ml-0.5" />
        </div>
      </motion.button>

      {/* Horizontal scroll */}
      <div>
        <h2 className="font-heading text-base font-semibold text-foreground mb-3">
          Trending Now
        </h2>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
          {restTracks.map((track, i) => {
            const isCurrent = track.id === currentTrackId;
            return (
              <motion.button
                key={track.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => onPlay(track, i + 1)}
                className="flex-shrink-0 w-32 sm:w-36 group text-left"
              >
                <div className={`relative w-32 h-32 sm:w-36 sm:h-36 rounded-2xl overflow-hidden mb-2 
                  ${isCurrent ? "ring-2 ring-primary glow-border" : ""}`}>
                  <img
                    src={getArtworkUrl(track, "480x480")}
                    alt={track.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="text-xs font-medium text-foreground line-clamp-1">{track.title}</p>
                <p className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">{track.user.name}</p>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
