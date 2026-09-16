import { useState, useCallback, useEffect } from "react";
import { AudiusTrack } from "@/lib/audius";

const STORAGE_KEY = "pulse_recently_played";
const MAX_RECENT = 15;

/** Blob URLs die with the page, so never persist them for uploaded tracks. */
function forStorage(track: AudiusTrack): AudiusTrack {
  if (track.isLocal || track.source === "local") {
    return { ...track, streamUrl: undefined };
  }
  return track;
}

export function useRecentlyPlayed() {
  const [recentlyPlayed, setRecentlyPlayed] = useState<AudiusTrack[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const parsed = stored ? JSON.parse(stored) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(recentlyPlayed.map(forStorage)));
    } catch {
      /* storage full or unavailable — history is non-critical */
    }
  }, [recentlyPlayed]);

  const addToRecentlyPlayed = useCallback((track: AudiusTrack) => {
    setRecentlyPlayed((prev) => {
      const filtered = prev.filter((t) => t.id !== track.id);
      return [track, ...filtered].slice(0, MAX_RECENT);
    });
  }, []);

  return { recentlyPlayed, addToRecentlyPlayed };
}
