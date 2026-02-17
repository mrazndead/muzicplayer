import { useState, useEffect, useCallback } from "react";
import { AudiusTrack } from "@/lib/audius";

const STORAGE_KEY = "pulse_favorites";

function loadFavorites(): AudiusTrack[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveFavorites(tracks: AudiusTrack[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tracks));
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
