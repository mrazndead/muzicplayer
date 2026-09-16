import { useState, useEffect, useCallback } from "react";
import { AudiusTrack } from "@/lib/audius";

const STORAGE_KEY = "pulse_favorites";

/** Blob URLs die with the page, so never persist them for uploaded tracks. */
function forStorage(track: AudiusTrack): AudiusTrack {
  if (track.isLocal || track.source === "local") {
    return { ...track, streamUrl: undefined };
  }
  return track;
}

function loadFavorites(): AudiusTrack[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    const parsed = data ? JSON.parse(data) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveFavorites(tracks: AudiusTrack[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tracks.map(forStorage)));
  } catch {
    /* storage full or unavailable — keep the in-memory list working */
  }
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<AudiusTrack[]>(loadFavorites);

  useEffect(() => {
    saveFavorites(favorites);
  }, [favorites]);

  const isFavorite = useCallback(
    (trackId: string) => favorites.some((t) => t.id === trackId),
    [favorites]
  );

  const toggleFavorite = useCallback((track: AudiusTrack) => {
    setFavorites((prev) => {
      const exists = prev.some((t) => t.id === track.id);
      if (exists) return prev.filter((t) => t.id !== track.id);
      return [track, ...prev];
    });
  }, []);

  return { favorites, isFavorite, toggleFavorite };
}
