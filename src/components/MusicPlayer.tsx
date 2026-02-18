import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Shuffle, Repeat, Repeat1, Heart, ChevronDown } from "lucide-react";
import { getArtworkUrl, AudiusTrack } from "@/lib/audius";
import { motion, AnimatePresence } from "framer-motion";
import { useCallback, useState } from "react";

interface MusicPlayerProps {
  currentTrack: AudiusTrack | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  shuffle: boolean;
  repeat: "off" | "all" | "one";
  onTogglePlay: () => void;
  onSeek: (time: number) => void;
  onVolume: (vol: number) => void;
  onNext: () => void;
  onPrev: () => void;
  onToggleShuffle: () => void;
  onToggleRepeat: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
}

function formatTime(s: number): string {
  if (!s || isNaN(s)) return "0:00";
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
  shuffle,
  repeat,
  onTogglePlay,
  onSeek,
  onVolume,
  onNext,
  onPrev,
  onToggleShuffle,
  onToggleRepeat,
  isFavorite,
  onToggleFavorite,
}: MusicPlayerProps) {
  const [showVolume, setShowVolume] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleSeek = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      onSeek(pct * duration);
    },
    [duration, onSeek]
  );

  const RepeatIcon = repeat === "one" ? Repeat1 : Repeat;

  return (
    <AnimatePresence>
      {currentTrack && (
        <>
          {/* Expanded Now Playing */}
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ opacity: 0, y: "100%" }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: "100%" }}
                transition={{ type: "spring", damping: 30, stiffness: 300 }}
                className="fixed inset-0 z-[60] flex flex-col overflow-hidden"
              >
                {/* Blurred background image */}
                <div className="absolute inset-0">
                  <img
                    src={getArtworkUrl(currentTrack, "1000x1000")}
                    alt=""
                    className="w-full h-full object-cover scale-110 blur-[60px] opacity-40"
                  />
                  <div className="absolute inset-0 bg-background/80" />
                </div>

                <div className="relative z-10 flex flex-col h-full">
                  {/* Header */}
                  <div className="flex items-center justify-between p-5">
                    <button onClick={() => setExpanded(false)} className="p-2 text-muted-foreground hover:text-foreground transition-colors">
                      <ChevronDown className="w-6 h-6" />
                    </button>
                    <span className="font-heading text-xs tracking-wider text-muted-foreground uppercase">Now Playing</span>
                    <div className="w-10" />
                  </div>

                  <div className="flex-1 flex flex-col items-center justify-center px-8 gap-8">
                    {/* Circular artwork with glow ring */}
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.1 }}
                      className="w-56 h-56 sm:w-72 sm:h-72 rounded-full overflow-hidden artwork-ring"
                    >
                      <img
                        src={getArtworkUrl(currentTrack, "1000x1000")}
                        alt={currentTrack.title}
                        className={`w-full h-full object-cover ${isPlaying ? "animate-[spin_20s_linear_infinite]" : ""}`}
                      />
                    </motion.div>

                    {/* Track info */}
                    <div className="text-center max-w-xs">
                      <h3 className="font-heading text-xl font-bold text-foreground line-clamp-2">
                        {currentTrack.title}
                      </h3>
                      <p className="text-muted-foreground text-sm mt-1">{currentTrack.user.name}</p>
                    </div>

                    {/* Progress */}
                    <div className="w-full max-w-xs space-y-2">
                      <div className="h-1 w-full bg-muted/50 rounded-full cursor-pointer group relative" onClick={handleSeek}>
                        <div className="absolute inset-y-0 left-0 gradient-primary rounded-full transition-[width] duration-150" style={{ width: `${progress}%` }} />
                        <div
                          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-foreground rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                          style={{ left: `${progress}%`, transform: `translateX(-50%) translateY(-50%)` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground tabular-nums">
                        <span>{formatTime(currentTime)}</span>
                        <span>{formatTime(duration)}</span>
                      </div>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center gap-7">
                      <button onClick={onToggleShuffle} className={`p-2 transition-colors ${shuffle ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}>
                        <Shuffle className="w-5 h-5" />
                      </button>
                      <button onClick={onPrev} className="p-2 text-foreground hover:text-primary transition-colors">
                        <SkipBack className="w-7 h-7" />
                      </button>
                      <button
                        onClick={onTogglePlay}
                        className="w-16 h-16 gradient-primary text-primary-foreground rounded-full flex items-center justify-center hover:opacity-90 transition-opacity glow-sm"
                      >
                        {isPlaying ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7 ml-0.5" />}
                      </button>
                      <button onClick={onNext} className="p-2 text-foreground hover:text-primary transition-colors">
                        <SkipForward className="w-7 h-7" />
                      </button>
                      <button onClick={onToggleRepeat} className={`p-2 transition-colors ${repeat !== "off" ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}>
                        <RepeatIcon className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Favorite */}
                    {onToggleFavorite && (
                      <button onClick={onToggleFavorite} className="p-2">
                        <Heart className={`w-6 h-6 transition-colors ${isFavorite ? "fill-accent text-accent" : "text-muted-foreground hover:text-foreground"}`} />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Mini player */}
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-0 left-0 right-0 z-50 glass-heavy border-t border-border/50"
          >
            {/* Progress bar */}
            <div className="h-0.5 w-full cursor-pointer group relative" onClick={handleSeek}>
              <div className="absolute inset-0 bg-muted/30" />
              <div
                className="absolute inset-y-0 left-0 gradient-primary transition-[width] duration-200"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 max-w-screen-xl mx-auto">
              {/* Track info - clickable to expand */}
              <button onClick={() => setExpanded(true)} className="flex items-center gap-3 flex-1 min-w-0 text-left">
                <img
                  src={getArtworkUrl(currentTrack, "150x150")}
                  alt={currentTrack.title}
                  className="w-11 h-11 rounded-xl object-cover flex-shrink-0"
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground line-clamp-1">{currentTrack.title}</p>
                  <p className="text-xs text-muted-foreground line-clamp-1">{currentTrack.user.name}</p>
                </div>
              </button>

              {/* Favorite */}
              {onToggleFavorite && (
                <button onClick={onToggleFavorite} className="p-1.5 flex-shrink-0 hidden sm:block">
                  <Heart className={`w-4 h-4 transition-colors ${isFavorite ? "fill-accent text-accent" : "text-muted-foreground hover:text-foreground"}`} />
                </button>
              )}

              {/* Controls */}
              <div className="flex items-center gap-0.5">
                <button onClick={onPrev} className="p-2 text-muted-foreground hover:text-foreground transition-colors">
                  <SkipBack className="w-4 h-4" />
                </button>
                <button
                  onClick={onTogglePlay}
                  className="p-2.5 gradient-primary text-primary-foreground rounded-full hover:opacity-90 transition-opacity"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                </button>
                <button onClick={onNext} className="p-2 text-muted-foreground hover:text-foreground transition-colors">
                  <SkipForward className="w-4 h-4" />
                </button>
              </div>

              {/* Volume */}
              <div className="relative hidden md:block flex-shrink-0">
                <button
                  onClick={() => setShowVolume(!showVolume)}
                  className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
                {showVolume && (
                  <div className="absolute bottom-full right-0 mb-2 p-3 glass rounded-xl">
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
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
