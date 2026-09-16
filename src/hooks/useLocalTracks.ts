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
  /** Real byte copy of the audio (never a File reference — those break after app restart). */
  blob: Blob;
  mimeType?: string;
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

/** Copy the bytes out of a File so the audio survives app restarts / file moves. */
async function toStoredBlob(file: Blob): Promise<Blob> {
  const buffer = await file.arrayBuffer();
  return new Blob([buffer], { type: file.type || "audio/mpeg" });
}

/** A stored File reference can survive in IndexedDB but be unreadable later. */
async function isReadable(blob: Blob): Promise<boolean> {
  try {
    await blob.slice(0, 1).arrayBuffer();
    return blob.size > 0;
  } catch {
    return false;
  }
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
    source: "local",
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

      const usable: LocalTrackRecord[] = [];
      for (const rec of records) {
        // Older versions stored the File itself; re-store a real byte copy once.
        if (rec.blob instanceof File) {
          try {
            const blob = await toStoredBlob(rec.blob);
            const healed = { ...rec, blob, mimeType: blob.type, size: blob.size };
            await putRecord(healed);
            usable.push(healed);
            continue;
          } catch {
            /* file is gone from disk — drop it below */
          }
        }
        if (await isReadable(rec.blob)) usable.push(rec);
      }

      setTracks(usable.map((r) => recordToTrack(r, urlMap)));
    } catch (err) {
      console.error("Failed to load local tracks:", err);
    } finally {
      setLoading(false);
    }
  }, [urlMap]);

  useEffect(() => {
    // Ask the browser to keep our storage so uploads survive restarts.
    if (navigator.storage?.persist) {
      navigator.storage
        .persisted()
        .then((already) => {
          if (!already) navigator.storage.persist().catch(() => {});
        })
        .catch(() => {});
    }
    refresh();
    // Blob URLs are intentionally kept for the page lifetime so playback never
    // breaks on re-render; they are revoked when a track is removed.
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
        const blob = await toStoredBlob(file);
        const id = `local-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
        const record: LocalTrackRecord = {
          id,
          title,
          artist,
          duration,
          size: blob.size,
          addedAt: Date.now(),
          blob,
          mimeType: blob.type,
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
