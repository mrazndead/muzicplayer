import { useMemo } from "react";
import { motion } from "framer-motion";
import { AudiusTrack, getArtworkUrl } from "@/lib/audius";
import { Play, TrendingUp } from "lucide-react";

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
    <div className="space-y-6">
      {/* Hero featured track */}
      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={() => onPlay(heroTrack, 0)}
        className="w-full relative h-56 sm:h-64 rounded-3xl overflow-hidden group text-left neon-border"
      >
        <img
          src={getArtworkUrl(heroTrack, "1000x1000")}
          alt={heroTrack.title}
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/15 to-accent/15 mix-blend-overlay" />
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <p className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] mb-1.5">✦ Featured</p>
          <h3 className="font-heading text-2xl sm:text-3xl font-bold text-foreground line-clamp-1">
            {heroTrack.title}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">{heroTrack.user.name}</p>
        </div>
        <div className="absolute top-5 right-5 w-12 h-12 rounded-full gradient-primary flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-lg glow-sm">
          <Play className="w-5 h-5 text-primary-foreground ml-0.5" />
        </div>
      </motion.button>

      {/* Horizontal scroll */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-primary" />
          <h2 className="font-heading text-sm font-semibold text-foreground tracking-wide uppercase opacity-70">
            Trending Now
          </h2>
        </div>
        <div className="flex gap-3.5 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
          {restTracks.map((track, i) => {
            const isCurrent = track.id === currentTrackId;
            return (
              <motion.button
                key={track.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => onPlay(track, i + 1)}
                className="flex-shrink-0 w-36 sm:w-40 group text-left"
              >
                <div className={`relative w-36 h-36 sm:w-40 sm:h-40 rounded-2xl overflow-hidden mb-2.5 card-hover
                  ${isCurrent ? "ring-2 ring-primary glow-border" : ""}`}>
                  <img
                    src={getArtworkUrl(track, "480x480")}
                    alt={track.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="absolute bottom-2 right-2 w-9 h-9 rounded-full gradient-primary flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 glow-sm">
                    <Play className="w-4 h-4 text-primary-foreground ml-0.5" />
                  </div>
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
