import { useState, useRef, useCallback, useEffect } from "react";
import { AudiusTrack, getStreamUrl } from "@/lib/audius";

export interface PlayerState {
  currentTrack: AudiusTrack | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  queue: AudiusTrack[];
  queueIndex: number;
}

export function useAudioPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [state, setState] = useState<PlayerState>({
    currentTrack: null,
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 0.7,
    queue: [],
    queueIndex: -1,
  });

  useEffect(() => {
    const audio = new Audio();
    audio.volume = 0.7;
    audioRef.current = audio;

    audio.addEventListener("timeupdate", () => {
      setState((s) => ({ ...s, currentTime: audio.currentTime }));
    });
    audio.addEventListener("loadedmetadata", () => {
      setState((s) => ({ ...s, duration: audio.duration }));
    });
    audio.addEventListener("ended", () => {
      nextTrack();
    });
    audio.addEventListener("pause", () => {
      setState((s) => ({ ...s, isPlaying: false }));
    });
    audio.addEventListener("play", () => {
      setState((s) => ({ ...s, isPlaying: true }));
    });

    return () => {
      audio.pause();
      audio.src = "";
    };
  }, []);

  const playTrack = useCallback(async (track: AudiusTrack, queue?: AudiusTrack[], index?: number) => {
    const audio = audioRef.current;
    if (!audio) return;

    const url = await getStreamUrl(track.id);
    audio.src = url;
    audio.play().catch(console.error);

    setState((s) => ({
      ...s,
      currentTrack: track,
      isPlaying: true,
      currentTime: 0,
      queue: queue || s.queue,
      queueIndex: index ?? s.queueIndex,
    }));
  }, []);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !state.currentTrack) return;
    if (audio.paused) {
      audio.play().catch(console.error);
    } else {
      audio.pause();
    }
  }, [state.currentTrack]);

  const seek = useCallback((time: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = time;
  }, []);

  const setVolume = useCallback((vol: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = vol;
    setState((s) => ({ ...s, volume: vol }));
  }, []);

  const nextTrack = useCallback(() => {
    setState((s) => {
      const nextIdx = s.queueIndex + 1;
      if (nextIdx < s.queue.length) {
        const track = s.queue[nextIdx];
        getStreamUrl(track.id).then((url) => {
          const audio = audioRef.current;
          if (audio) {
            audio.src = url;
            audio.play().catch(console.error);
          }
        });
        return { ...s, currentTrack: track, queueIndex: nextIdx, currentTime: 0 };
      }
      return { ...s, isPlaying: false };
    });
  }, []);

  const prevTrack = useCallback(() => {
    setState((s) => {
      const prevIdx = s.queueIndex - 1;
      if (prevIdx >= 0) {
        const track = s.queue[prevIdx];
        getStreamUrl(track.id).then((url) => {
          const audio = audioRef.current;
          if (audio) {
            audio.src = url;
            audio.play().catch(console.error);
          }
        });
        return { ...s, currentTrack: track, queueIndex: prevIdx, currentTime: 0 };
      }
      return s;
    });
  }, []);

  return {
    ...state,
    playTrack,
    togglePlay,
    seek,
    setVolume,
    nextTrack,
    prevTrack,
  };
}
