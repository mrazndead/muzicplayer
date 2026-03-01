import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { AudiusTrack, getStreamUrl, getArtworkUrl } from "@/lib/audius";

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

  const handleTrackEndRef = useRef<() => void>(() => {});
  const nextTrackRef = useRef<() => void>(() => {});
  const prevTrackRef = useRef<() => void>(() => {});

  const audioContextRef = useRef<AudioContext | null>(null);
  const filtersRef = useRef<BiquadFilterNode[]>([]);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);

  useEffect(() => {
    const audio = new Audio();
    audio.volume = 0.7;
    audio.crossOrigin = "anonymous";
    audioRef.current = audio;

    audio.addEventListener("timeupdate", () => {
      setState((s) => ({ ...s, currentTime: audio.currentTime }));
    });
    audio.addEventListener("loadedmetadata", () => {
      setState((s) => ({ ...s, duration: audio.duration }));
    });
    audio.addEventListener("ended", () => {
      handleTrackEndRef.current();
    });
    audio.addEventListener("pause", () => {
      setState((s) => ({ ...s, isPlaying: false }));
    });
    audio.addEventListener("play", () => {
      // Lazily create AudioContext + EQ filters on first play
      if (!audioContextRef.current) {
        const ctx = new AudioContext();
        audioContextRef.current = ctx;
        const source = ctx.createMediaElementSource(audio);
        sourceRef.current = source;

        const EQ_FREQS = [60, 230, 910, 3600, 14000];
        const filters = EQ_FREQS.map((freq, i) => {
          const f = ctx.createBiquadFilter();
          f.type = i === 0 ? "lowshelf" : i === EQ_FREQS.length - 1 ? "highshelf" : "peaking";
          f.frequency.value = freq;
          f.gain.value = 0;
          f.Q.value = 1;
          return f;
        });
        // Chain: source -> filters -> destination
        let prev: AudioNode = source;
        filters.forEach((f) => { prev.connect(f); prev = f; });
        prev.connect(ctx.destination);
        filtersRef.current = filters;
      }
      if (audioContextRef.current.state === "suspended") {
        audioContextRef.current.resume();
      }
      setState((s) => ({ ...s, isPlaying: true }));
    });

    return () => {
      audio.pause();
      audio.src = "";
    };
  }, []);

  const updateMediaSession = useCallback((track: AudiusTrack) => {
    if (!("mediaSession" in navigator)) return;
    const artwork = track.artwork;
    const artworkSources: MediaImage[] = [];
    if (artwork?.["150x150"]) artworkSources.push({ src: artwork["150x150"], sizes: "150x150", type: "image/jpeg" });
    if (artwork?.["480x480"]) artworkSources.push({ src: artwork["480x480"], sizes: "480x480", type: "image/jpeg" });
    if (artwork?.["1000x1000"]) artworkSources.push({ src: artwork["1000x1000"], sizes: "1000x1000", type: "image/jpeg" });

    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.title,
      artist: track.user.name,
      album: track.genre || "Pulse",
      artwork: artworkSources,
    });
  }, []);

  // Keep MediaSession action handlers in sync
  useEffect(() => {
    if (!("mediaSession" in navigator)) return;
    navigator.mediaSession.setActionHandler("play", () => audioRef.current?.play());
    navigator.mediaSession.setActionHandler("pause", () => audioRef.current?.pause());
    navigator.mediaSession.setActionHandler("previoustrack", () => handleTrackEndRef.current && prevTrackRef.current());
    navigator.mediaSession.setActionHandler("nexttrack", () => nextTrackRef.current());
    return () => {
      navigator.mediaSession.setActionHandler("play", null);
      navigator.mediaSession.setActionHandler("pause", null);
      navigator.mediaSession.setActionHandler("previoustrack", null);
      navigator.mediaSession.setActionHandler("nexttrack", null);
    };
  }, []);

  const playAudioForTrack = useCallback(async (track: AudiusTrack) => {
    const audio = audioRef.current;
    if (!audio) return;
    const url = await getStreamUrl(track.id);
    audio.src = url;
    audio.play().catch(console.error);
    updateMediaSession(track);
  }, [updateMediaSession]);

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

  // Keep refs in sync so listeners always call the latest version
  handleTrackEndRef.current = handleTrackEnd;

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

  // Sync refs for MediaSession handlers
  nextTrackRef.current = nextTrack;
  prevTrackRef.current = prevTrack;

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
    audioContext: audioContextRef.current,
    eqFilters: filtersRef.current,
  };
}
