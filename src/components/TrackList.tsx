import { motion } from "framer-motion";
import { Play, Pause } from "lucide-react";
import { AudiusTrack, getArtworkUrl } from "@/lib/audius";

interface TrackListProps {
  tracks: AudiusTrack[];
  currentTrackId?: string;
  isPlaying: boolean;
  onPlay: (track: AudiusTrack, index: number) => void;
  title?: string;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function TrackList({ tracks, currentTrackId, isPlaying, onPlay, title }: TrackListProps) {
  if (!tracks.length) return null;

  return (
    <div>
      {title && (
        <h2 className="font-heading text-lg font-semibold text-foreground mb-4 tracking-wide">
          {title}
        </h2>
      )}
      <div className="space-y-1">
        {tracks.map((track, i) => {
          const isCurrent = track.id === currentTrackId;
          return (
            <motion.button
              key={track.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.02 }}
              onClick={() => onPlay(track, i)}
              className={`w-full flex items-center gap-3 p-2 rounded-lg transition-all duration-200 text-left group
                ${isCurrent 
                  ? "bg-primary/10 border border-primary/20" 
                  : "hover:bg-secondary border border-transparent"
                }`}
            >
              <div className="relative w-10 h-10 rounded-md overflow-hidden flex-shrink-0 bg-muted">
                <img
                  src={getArtworkUrl(track, "150x150")}
                  alt={track.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div className={`absolute inset-0 bg-background/60 flex items-center justify-center transition-opacity
                  ${isCurrent ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
                  {isCurrent && isPlaying ? (
                    <Pause className="w-4 h-4 text-primary" />
                  ) : (
                    <Play className="w-4 h-4 text-primary" />
                  )}
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium line-clamp-1 ${isCurrent ? "text-primary" : "text-foreground"}`}>
                  {track.title}
                </p>
                <p className="text-xs text-muted-foreground line-clamp-1">
                  {track.user.name}
                </p>
              </div>

              <span className="text-xs text-muted-foreground flex-shrink-0 tabular-nums">
                {formatDuration(track.duration)}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
