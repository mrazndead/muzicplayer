import { AudiusTrack } from "@/lib/audius";
import { AnimatePresence } from "framer-motion";
import { useCallback, useState } from "react";
import { MiniPlayerUI } from "./MiniPlayerUI";
import { ExpandedPlayerUI } from "./ExpandedPlayerUI";

interface MusicPlayerProps {
  currentTrack: AudiusTrack | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  shuffle: boolean;
  repeat: "off" | "all" | "one";
  queue: AudiusTrack[];
  queueIndex: number;
  onTogglePlay: () => void;
  onSeek: (time: number) => void;
  onVolume: (vol: number) => void;
  onNext: () => void;
  onPrev: () => void;
  onToggleShuffle: () => void;
  onToggleRepeat: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  onPlayFromQueue?: (track: AudiusTrack, index: number) => void;
  // Sleep timer
  sleepTimerActive?: boolean;
  sleepTimerRemaining?: number;
  onStartSleepTimer?: (minutes: number) => void;
  onCancelSleepTimer?: () => void;
  // Equalizer
  audioContext?: AudioContext | null;
  eqFilters?: BiquadFilterNode[];
  onMoreByArtist?: () => void;
}

export function MusicPlayer({
  currentTrack,
  isPlaying,
  currentTime,
  duration,
  volume,
  shuffle,
  repeat,
  queue,
  queueIndex,
  onTogglePlay,
  onSeek,
  onVolume,
  onNext,
  onPrev,
  onToggleShuffle,
  onToggleRepeat,
  isFavorite,
  onToggleFavorite,
  onPlayFromQueue,
  sleepTimerActive,
  sleepTimerRemaining,
  onStartSleepTimer,
  onCancelSleepTimer,
  audioContext,
  eqFilters,
  onMoreByArtist,
}: MusicPlayerProps) {
  const [showVolume, setShowVolume] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [showQueue, setShowQueue] = useState(false);
  const [showSleepTimer, setShowSleepTimer] = useState(false);
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleSeek = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      onSeek(pct * duration);
    },
    [duration, onSeek]
  );

  return (
    <AnimatePresence>
      {currentTrack && (
        <>
          {/* Expanded Now Playing */}
          <AnimatePresence>
            {expanded && (
              <ExpandedPlayerUI
                currentTrack={currentTrack}
                isPlaying={isPlaying}
                currentTime={currentTime}
                duration={duration}
                progress={progress}
                shuffle={shuffle}
                repeat={repeat}
                queue={queue}
                queueIndex={queueIndex}
                onTogglePlay={onTogglePlay}
                onSeek={handleSeek}
                onNext={onNext}
                onPrev={onPrev}
                onToggleShuffle={onToggleShuffle}
                onToggleRepeat={onToggleRepeat}
                onClose={() => setExpanded(false)}
                isFavorite={isFavorite}
                onToggleFavorite={onToggleFavorite}
                onPlayFromQueue={onPlayFromQueue}
                sleepTimerActive={sleepTimerActive}
                sleepTimerRemaining={sleepTimerRemaining}
                onStartSleepTimer={onStartSleepTimer}
                onCancelSleepTimer={onCancelSleepTimer}
                audioContext={audioContext}
                eqFilters={eqFilters}
                onMoreByArtist={() => { onMoreByArtist?.(); setExpanded(false); }}
                showQueue={showQueue}
                setShowQueue={setShowQueue}
                showSleepTimer={showSleepTimer}
                setShowSleepTimer={setShowSleepTimer}
              />
            )}
          </AnimatePresence>

          {/* Mini player - now non-fixed and placed in flow */}
          <MiniPlayerUI
            currentTrack={currentTrack}
            isPlaying={isPlaying}
            progress={progress}
            volume={volume}
            showVolume={showVolume}
            onTogglePlay={onTogglePlay}
            onNext={onNext}
            onPrev={onPrev}
            onSeek={handleSeek}
            onVolume={onVolume}
            onToggleVolume={() => setShowVolume(!showVolume)}
            onExpand={() => setExpanded(true)}
            isFavorite={isFavorite}
            onToggleFavorite={onToggleFavorite}
          />
        </>
      )}
    </AnimatePresence>
  );
}