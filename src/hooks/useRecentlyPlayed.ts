import { useState, useCallback, useEffect } from "react";
import { AudiusTrack } from "@/lib/audius";

const STORAGE_KEY = "pulse_recently_played";
const MAX_RECENT = 15;

export function useRecentlyPlayed() {
  const [recentlyPlayed, setRecentlyPlayed] = useState<AudiusTrack[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(recentlyPlayed));
    } catch {}
  }, [recentlyPlayed]);

  const addToRecentlyPlayed = useCallback((track: AudiusTrack) => {
    setRecentlyPlayed((prev) => {
      const filtered = prev.filter((t) => t.id !== track.id);
      return [track, ...filtered].slice(0, MAX_RECENT);
    });
  }, []);

  return { recentlyPlayed, addToRecentlyPlayed };
}
