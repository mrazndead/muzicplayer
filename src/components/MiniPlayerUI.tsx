import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Heart } from "lucide-react";
import { getArtworkUrl, AudiusTrack } from "@/lib/audius";
import { motion } from "framer-motion";
import { EqualizerBars } from "./EqualizerBars";

interface MiniPlayerUIProps {
  currentTrack: AudiusTrack;
  isPlaying: boolean;
  progress: number;
  volume: number;
  showVolume: boolean;
  onTogglePlay: () => void;
  onNext: () => void;
  onPrev: () => void;
  onSeek: (e: React.MouseEvent<HTMLDivElement>) => void;
  onVolume: (vol: number) => void;
  onToggleVolume: () => void;
  onExpand: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
}

export function MiniPlayerUI({
  currentTrack,
  isPlaying,
  progress,
  volume,
  showVolume,
  onTogglePlay,
  onNext,
  onPrev,
  onSeek,
  onVolume,
  onToggleVolume,
  onExpand,
  isFavorite,
  onToggleFavorite,
}: MiniPlayerUIProps) {
  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 20, opacity: 0 }}
      className="w-full glass-card neon-border overflow-hidden mt-4"
    >
      {/* Progress bar */}
      <div className="h-1 w-full cursor-pointer group relative" onClick={onSeek}>
        <div className="absolute inset-0 bg-muted/30" />
        <div
          className="absolute inset-y-0 left-0 gradient-primary transition-[width] duration-200"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-3">
        {/* Track info - clickable to expand */}
        <button onClick={onExpand} className="flex items-center gap-3 flex-1 min-w-0 text-left">
          <img
            src={getArtworkUrl(currentTrack, "150x150")}
            alt={currentTrack.title}
            className="w-12 h-12 rounded-xl object-cover flex-shrink-0 shadow-lg"
          />
          <div className="flex items-center gap-2 min-w-0">
            <EqualizerBars isPlaying={isPlaying} barCount={3} className="h-3.5 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-bold text-foreground line-clamp-1">{currentTrack.title}</p>
              <p className="text-xs text-muted-foreground line-clamp-1">{currentTrack.user.name}</p>
            </div>
          </div>
        </button>

        {/* Favorite */}
        {onToggleFavorite && (
          <button onClick={onToggleFavorite} className="p-1.5 flex-shrink-0 hidden sm:block">
            <Heart className={`w-4.5 h-4.5 transition-colors ${isFavorite ? "fill-accent text-accent" : "text-muted-foreground hover:text-foreground"}`} />
          </button>
        )}

        {/* Controls */}
        <div className="flex items-center gap-1">
          <button onClick={onPrev} className="p-2 text-muted-foreground hover:text-foreground transition-colors">
            <SkipBack className="w-4.5 h-4.5" />
          </button>
          <button
            onClick={onTogglePlay}
            className="p-3 gradient-primary text-primary-foreground rounded-full hover:opacity-90 transition-opacity glow-sm shadow-lg"
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
          </button>
          <button onClick={onNext} className="p-2 text-muted-foreground hover:text-foreground transition-colors">
            <SkipForward className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Volume */}
        <div className="relative hidden md:block flex-shrink-0">
          <button
            onClick={onToggleVolume}
            className="p-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {volume === 0 ? <VolumeX className="w-4.5 h-4.5" /> : <Volume2 className="w-4.5 h-4.5" />}
          </button>
          {showVolume && (
            <div className="absolute bottom-full right-0 mb-3 p-3 glass-card shadow-2xl z-50">
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={volume}
                onChange={(e) => onVolume(parseFloat(e.target.value))}
                className="w-24 accent-primary cursor-pointer"
              />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}