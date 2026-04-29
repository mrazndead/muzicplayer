import { useState, useEffect, useCallback } from "react";
import { AudiusTrack } from "@/lib/audius";

const DB_NAME = "pulse_local_tracks";
const STORE = "tracks";
const DB_VERSION = 1;

export interface LocalTrackRecord {
  id: string;
  title: string;
  artist: string;
  duration: number;
  size: number;
  addedAt: number;
  blob: Blob;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function getAllRecords(): Promise<LocalTrackRecord[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => resolve((req.result as LocalTrackRecord[]) || []);
    req.onerror = () => reject(req.error);
  });
}

async function putRecord(record: LocalTrackRecord): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(record);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function deleteRecord(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

function readAudioDuration(blob: Blob): Promise<number> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(blob);
    const audio = document.createElement("audio");
    audio.preload = "metadata";
    audio.src = url;
    audio.onloadedmetadata = () => {
      const d = isFinite(audio.duration) ? audio.duration : 0;
      URL.revokeObjectURL(url);
      resolve(d);
    };
    audio.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(0);
    };
  });
}

function parseFilename(name: string): { title: string; artist: string } {
  const cleaned = name.replace(/\.[^.]+$/, "");
  // "Artist - Title" pattern
  const parts = cleaned.split(/\s*-\s*/);
  if (parts.length >= 2) {
    return { artist: parts[0].trim(), title: parts.slice(1).join(" - ").trim() };
  }
  return { title: cleaned, artist: "Unknown Artist" };
}

function recordToTrack(rec: LocalTrackRecord, urlMap: Map<string, string>): AudiusTrack {
  let url = urlMap.get(rec.id);
  if (!url) {
    url = URL.createObjectURL(rec.blob);
    urlMap.set(rec.id, url);
  }
  return {
    id: rec.id,
    title: rec.title,
    user: { name: rec.artist, id: "local" },
    artwork: undefined,
    duration: rec.duration,
    genre: "Local",
    play_count: 0,
    permalink: "",
    streamUrl: url,
    isLocal: true,
  };
}

export function useLocalTracks() {
  const [tracks, setTracks] = useState<AudiusTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [urlMap] = useState<Map<string, string>>(() => new Map());

  const refresh = useCallback(async () => {
    try {
      const records = await getAllRecords();
      records.sort((a, b) => b.addedAt - a.addedAt);
      setTracks(records.map((r) => recordToTrack(r, urlMap)));
    } catch (err) {
      console.error("Failed to load local tracks:", err);
    } finally {
      setLoading(false);
    }
  }, [urlMap]);

  useEffect(() => {
    // Request persistent storage so the browser doesn't evict IndexedDB on restart
    if (navigator.storage?.persist) {
      navigator.storage.persisted()
        .then((already) => {
          if (!already) {
            navigator.storage.persist().then((granted) => {
              console.log("[LocalTracks] Persistent storage:", granted ? "granted" : "denied");
            }).catch(() => {});
          }
        })
        .catch(() => {});
    }
    refresh();
    return () => {
      // Revoke all blob URLs on unmount
      urlMap.forEach((url) => URL.revokeObjectURL(url));
      urlMap.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addFiles = useCallback(
    async (files: FileList | File[]) => {
      const arr = Array.from(files);
      for (const file of arr) {
        if (!file.type.startsWith("audio/") && !file.name.match(/\.(mp3|m4a|wav|ogg|flac|aac)$/i)) {
          continue;
        }
        const { title, artist } = parseFilename(file.name);
        const duration = await readAudioDuration(file);
        const id = `local-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
        const record: LocalTrackRecord = {
          id,
          title,
          artist,
          duration,
          size: file.size,
          addedAt: Date.now(),
          blob: file,
        };
        await putRecord(record);
      }
      await refresh();
    },
    [refresh]
  );

  const removeTrack = useCallback(
    async (id: string) => {
      const url = urlMap.get(id);
      if (url) {
        URL.revokeObjectURL(url);
        urlMap.delete(id);
      }
      await deleteRecord(id);
      await refresh();
    },
    [refresh, urlMap]
  );

  return { tracks, loading, addFiles, removeTrack, refresh };
}
