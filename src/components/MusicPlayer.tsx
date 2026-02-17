import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX } from "lucide-react";
import { getArtworkUrl, AudiusTrack } from "@/lib/audius";
import { motion, AnimatePresence } from "framer-motion";
import { useCallback, useState } from "react";

interface MusicPlayerProps {
  currentTrack: AudiusTrack | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  onTogglePlay: () => void;
  onSeek: (time: number) => void;
  onVolume: (vol: number) => void;
  onNext: () => void;
  onPrev: () => void;
}

function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export function MusicPlayer({
  currentTrack,
  isPlaying,
  currentTime,
  duration,
  volume,
  onTogglePlay,
  onSeek,
  onVolume,
  onNext,
  onPrev,
}: MusicPlayerProps) {
  const [showVolume, setShowVolume] = useState(false);
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleSeek = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const pct = (e.clientX - rect.left) / rect.width;
      onSeek(pct * duration);
    },
    [duration, onSeek]
  );

  return (
    <AnimatePresence>
      {currentTrack && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-border"
        >
          {/* Progress bar */}
          <div
            className="h-1 w-full cursor-pointer group relative"
            onClick={handleSeek}
          >
            <div className="absolute inset-0 bg-muted" />
            <div
              className="absolute inset-y-0 left-0 bg-primary transition-[width] duration-200"
              style={{ width: `${progress}%` }}
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-primary rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ left: `${progress}%`, transform: `translateX(-50%) translateY(-50%)` }}
            />
          </div>

          <div className="flex items-center gap-3 px-4 py-2 max-w-screen-xl mx-auto">
            {/* Track info */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <img
                src={getArtworkUrl(currentTrack, "150x150")}
                alt={currentTrack.title}
                className="w-10 h-10 rounded-md object-cover flex-shrink-0"
              />
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground line-clamp-1">{currentTrack.title}</p>
                <p className="text-xs text-muted-foreground line-clamp-1">{currentTrack.user.name}</p>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2">
              <button onClick={onPrev} className="p-2 text-muted-foreground hover:text-foreground transition-colors">
                <SkipBack className="w-4 h-4" />
              </button>
              <button
                onClick={onTogglePlay}
                className="p-2 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors"
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
              </button>
              <button onClick={onNext} className="p-2 text-muted-foreground hover:text-foreground transition-colors">
                <SkipForward className="w-4 h-4" />
              </button>
            </div>

            {/* Time + Volume */}
            <div className="flex items-center gap-3 flex-1 justify-end">
              <span className="text-xs text-muted-foreground tabular-nums hidden sm:block">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
              <div className="relative hidden sm:block">
                <button
                  onClick={() => setShowVolume(!showVolume)}
                  className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
                {showVolume && (
                  <div className="absolute bottom-full right-0 mb-2 p-2 glass rounded-lg">
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.01}
                      value={volume}
                      onChange={(e) => onVolume(parseFloat(e.target.value))}
                      className="w-24 accent-primary"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
