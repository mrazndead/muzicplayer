import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Play, Pause, Heart, Headphones, Share2 } from "lucide-react";
import { AudiusTrack, getArtworkUrl, formatPlayCount } from "@/lib/audius";
import { EqualizerBars } from "./EqualizerBars";
import { toast } from "sonner";

interface TrackListProps {
  tracks: AudiusTrack[];
  currentTrackId?: string;
  isPlaying: boolean;
  onPlay: (track: AudiusTrack, index: number) => void;
  title?: string;
  isFavorite?: (id: string) => boolean;
  onToggleFavorite?: (track: AudiusTrack) => void;
  onLoadMore?: () => void;
  isLoadingMore?: boolean;
  hasMore?: boolean;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function shareTrack(track: AudiusTrack) {
  const url = `https://audius.co${track.permalink}`;
  if (navigator.share) {
    navigator.share({ title: track.title, text: `${track.title} by ${track.user.name}`, url }).catch(() => {});
  } else {
    navigator.clipboard.writeText(url).then(() => toast.success("Link copied!")).catch(() => {});
  }
}

export function TrackList({ tracks, currentTrackId, isPlaying, onPlay, title, isFavorite, onToggleFavorite, onLoadMore, isLoadingMore, hasMore }: TrackListProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Infinite scroll via IntersectionObserver
  useEffect(() => {
    if (!onLoadMore || !hasMore || isLoadingMore) return;
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          onLoadMore();
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [onLoadMore, hasMore, isLoadingMore]);

  if (!tracks.length) return null;

  return (
    <div>
      {title && (
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading text-sm font-semibold text-foreground tracking-wide uppercase opacity-70">
            {title}
          </h2>
          <span className="text-[10px] text-muted-foreground font-medium tracking-wider uppercase">{tracks.length} tracks</span>
        </div>
      )}
      <div className="space-y-1">
        {tracks.map((track, i) => {
          const isCurrent = track.id === currentTrackId;
          const liked = isFavorite?.(track.id) ?? false;
          return (
            <motion.div
              key={track.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: Math.min(i * 0.02, 0.5) }}
              className={`w-full flex items-center gap-3 p-2.5 rounded-2xl transition-all duration-200 text-left group
                ${isCurrent
                  ? "glass-card ring-1 ring-primary/30"
                  : "hover:bg-secondary/40"
                }`}
            >
              {/* Track number or equalizer */}
              <span className="text-xs text-muted-foreground w-5 flex items-center justify-end font-medium tabular-nums flex-shrink-0">
                {isCurrent ? <EqualizerBars isPlaying={isPlaying} barCount={3} /> : String(i + 1).padStart(2, "0")}
              </span>

              <button
                onClick={() => onPlay(track, i)}
                className="relative w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-muted"
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
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {track.user.name}
                  </p>
                  {track.play_count > 0 && (
                    <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground/60 flex-shrink-0">
                      <Headphones className="w-2.5 h-2.5" />
                      {formatPlayCount(track.play_count)}
                    </span>
                  )}
                </div>
              </button>

              {/* Share */}
              <button
                onClick={(e) => { e.stopPropagation(); shareTrack(track); }}
                className="p-1.5 rounded-full transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100"
              >
                <Share2 className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
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

      {/* Load More */}
      {onLoadMore && hasMore && (
        <div className="flex justify-center mt-6">
          <button
            onClick={onLoadMore}
            disabled={isLoadingMore}
            className="px-8 py-2.5 rounded-full glass-card text-foreground text-sm font-medium hover:bg-secondary/40 transition-colors disabled:opacity-50 neon-border"
          >
            {isLoadingMore ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                Loading...
              </span>
            ) : (
              "Load More"
            )}
          </button>
        </div>
      )}
    </div>
  );
}
