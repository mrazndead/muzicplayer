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
  shuffle: boolean;
  repeat: "off" | "all" | "one";
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
    shuffle: false,
    repeat: "off",
  });

  // Store state ref for use in callbacks
  const stateRef = useRef(state);
  stateRef.current = state;

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
      handleTrackEnd();
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

  const playAudioForTrack = useCallback(async (track: AudiusTrack) => {
    const audio = audioRef.current;
    if (!audio) return;
    const url = await getStreamUrl(track.id);
    audio.src = url;
    audio.play().catch(console.error);
  }, []);

  const handleTrackEnd = useCallback(() => {
    const s = stateRef.current;
    if (s.repeat === "one") {
      const audio = audioRef.current;
      if (audio) {
        audio.currentTime = 0;
        audio.play().catch(console.error);
      }
      return;
    }

    let nextIdx: number;
    if (s.shuffle) {
      nextIdx = Math.floor(Math.random() * s.queue.length);
    } else {
      nextIdx = s.queueIndex + 1;
    }

    if (nextIdx < s.queue.length) {
      const track = s.queue[nextIdx];
      playAudioForTrack(track);
      setState((prev) => ({ ...prev, currentTrack: track, queueIndex: nextIdx, currentTime: 0 }));
    } else if (s.repeat === "all" && s.queue.length > 0) {
      const track = s.queue[0];
      playAudioForTrack(track);
      setState((prev) => ({ ...prev, currentTrack: track, queueIndex: 0, currentTime: 0 }));
    } else {
      setState((prev) => ({ ...prev, isPlaying: false }));
    }
  }, [playAudioForTrack]);

  const playTrack = useCallback(async (track: AudiusTrack, queue?: AudiusTrack[], index?: number) => {
    await playAudioForTrack(track);
    setState((s) => ({
      ...s,
      currentTrack: track,
      isPlaying: true,
      currentTime: 0,
      queue: queue || s.queue,
      queueIndex: index ?? s.queueIndex,
    }));
  }, [playAudioForTrack]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !stateRef.current.currentTrack) return;
    if (audio.paused) {
      audio.play().catch(console.error);
    } else {
      audio.pause();
    }
  }, []);

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
    const s = stateRef.current;
    let nextIdx: number;
    if (s.shuffle) {
      nextIdx = Math.floor(Math.random() * s.queue.length);
    } else {
      nextIdx = s.queueIndex + 1;
    }
    if (nextIdx < s.queue.length) {
      const track = s.queue[nextIdx];
      playAudioForTrack(track);
      setState((prev) => ({ ...prev, currentTrack: track, queueIndex: nextIdx, currentTime: 0 }));
    }
  }, [playAudioForTrack]);

  const prevTrack = useCallback(() => {
    const s = stateRef.current;
    // If more than 3 seconds in, restart current track
    if (s.currentTime > 3) {
      const audio = audioRef.current;
      if (audio) audio.currentTime = 0;
      return;
    }
    const prevIdx = s.queueIndex - 1;
    if (prevIdx >= 0) {
      const track = s.queue[prevIdx];
      playAudioForTrack(track);
      setState((prev) => ({ ...prev, currentTrack: track, queueIndex: prevIdx, currentTime: 0 }));
    }
  }, [playAudioForTrack]);

  const toggleShuffle = useCallback(() => {
    setState((s) => ({ ...s, shuffle: !s.shuffle }));
  }, []);

  const toggleRepeat = useCallback(() => {
    setState((s) => ({
      ...s,
      repeat: s.repeat === "off" ? "all" : s.repeat === "all" ? "one" : "off",
    }));
  }, []);

  return {
    ...state,
    playTrack,
    togglePlay,
    seek,
    setVolume,
    nextTrack,
    prevTrack,
    toggleShuffle,
    toggleRepeat,
  };
}
