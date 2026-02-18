import { motion } from "framer-motion";
import { Play, Pause, Heart } from "lucide-react";
import { AudiusTrack, getArtworkUrl } from "@/lib/audius";

interface TrackListProps {
  tracks: AudiusTrack[];
  currentTrackId?: string;
  isPlaying: boolean;
  onPlay: (track: AudiusTrack, index: number) => void;
  title?: string;
  isFavorite?: (id: string) => boolean;
  onToggleFavorite?: (track: AudiusTrack) => void;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function TrackList({ tracks, currentTrackId, isPlaying, onPlay, title, isFavorite, onToggleFavorite }: TrackListProps) {
  if (!tracks.length) return null;

  return (
    <div>
      {title && (
        <h2 className="font-heading text-base font-semibold text-foreground mb-4">
          {title}
        </h2>
      )}
      <div className="space-y-0.5">
        {tracks.map((track, i) => {
          const isCurrent = track.id === currentTrackId;
          const liked = isFavorite?.(track.id) ?? false;
          return (
            <motion.div
              key={track.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.02 }}
              className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition-all duration-200 text-left group
                ${isCurrent
                  ? "bg-primary/10"
                  : "hover:bg-secondary/60"
                }`}
            >
              {/* Track number */}
              <span className="text-xs text-muted-foreground w-5 text-right font-medium tabular-nums flex-shrink-0">
                {String(i + 1).padStart(2, "0")}
              </span>

              <button
                onClick={() => onPlay(track, i)}
                className="relative w-11 h-11 rounded-xl overflow-hidden flex-shrink-0 bg-muted"
              >
                <img
                  src={getArtworkUrl(track, "150x150")}
                  alt={track.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div className={`absolute inset-0 bg-background/50 flex items-center justify-center transition-opacity
                  ${isCurrent ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
                  {isCurrent && isPlaying ? (
                    <Pause className="w-4 h-4 text-primary" />
                  ) : (
                    <Play className="w-4 h-4 text-primary ml-0.5" />
                  )}
                </div>
              </button>

              <button onClick={() => onPlay(track, i)} className="flex-1 min-w-0 text-left">
                <p className={`text-sm font-medium line-clamp-1 ${isCurrent ? "text-primary" : "text-foreground"}`}>
                  {track.title}
                </p>
                <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                  {track.user.name}
                </p>
              </button>

              {onToggleFavorite && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite(track);
                  }}
                  className="p-1.5 rounded-full transition-colors flex-shrink-0"
                >
                  <Heart
                    className={`w-4 h-4 transition-colors ${liked ? "fill-accent text-accent" : "text-muted-foreground/40 hover:text-muted-foreground"}`}
                  />
                </button>
              )}

              <span className="text-xs text-muted-foreground flex-shrink-0 tabular-nums">
                {formatDuration(track.duration)}
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
