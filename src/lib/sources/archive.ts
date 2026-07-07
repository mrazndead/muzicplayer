// Internet Archive audio source.
// Uses the advanced search API for discovery and per-item metadata to resolve MP3 URLs.
import type { AudiusTrack } from "@/lib/audius";

interface ArchiveSearchDoc {
  identifier: string;
  title?: string | string[];
  creator?: string | string[];
  downloads?: number;
  subject?: string | string[];
  runtime?: string;
}

interface ArchiveFile {
  name: string;
  format?: string;
  length?: string;
  size?: string;
}

function pickMp3(files: ArchiveFile[]): ArchiveFile | undefined {
  // Prefer VBR MP3, then any MP3.
  return (
    files.find((f) => f.format === "VBR MP3" && f.name?.endsWith(".mp3")) ||
    files.find((f) => f.format === "MP3" && f.name?.endsWith(".mp3")) ||
    files.find((f) => (f.name || "").toLowerCase().endsWith(".mp3"))
  );
}

function parseRuntime(runtime?: string, length?: string): number {
  const src = length || runtime || "";
  if (!src) return 0;
  // Formats: "H:MM:SS", "MM:SS", or seconds ("123.4")
  if (src.includes(":")) {
    const parts = src.split(":").map((p) => parseFloat(p) || 0);
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    if (parts.length === 2) return parts[0] * 60 + parts[1];
  }
  const n = parseFloat(src);
  return Number.isFinite(n) ? n : 0;
}

function firstStr(v?: string | string[]): string {
  if (!v) return "";
  return Array.isArray(v) ? v[0] || "" : v;
}

async function resolveItem(doc: ArchiveSearchDoc): Promise<AudiusTrack | null> {
  try {
    const res = await fetch(`https://archive.org/metadata/${encodeURIComponent(doc.identifier)}`);
    if (!res.ok) return null;
    const json = await res.json();
    const files: ArchiveFile[] = json?.files ?? [];
    const mp3 = pickMp3(files);
    if (!mp3?.name) return null;

    const streamUrl = `https://archive.org/download/${encodeURIComponent(doc.identifier)}/${encodeURIComponent(mp3.name)}`;
    const cover = `https://archive.org/services/img/${encodeURIComponent(doc.identifier)}`;
    const title = firstStr(doc.title) || mp3.name.replace(/\.mp3$/i, "");
    const artist = firstStr(doc.creator) || "Internet Archive";
    const duration = parseRuntime(doc.runtime, mp3.length);

    return {
      id: `ia-${doc.identifier}`,
      title,
      user: { name: artist, id: `ia-${artist}` },
      artwork: { "150x150": cover, "480x480": cover, "1000x1000": cover },
      duration,
      genre: firstStr(doc.subject) || "Archive",
      play_count: doc.downloads ?? 0,
      permalink: `https://archive.org/details/${doc.identifier}`,
      streamUrl,
      source: "archive",
    } as AudiusTrack;
  } catch {
    return null;
  }
}

export async function searchArchive(query: string, limit = 12): Promise<AudiusTrack[]> {
  try {
    const q = `(${query}) AND mediatype:(audio) AND format:(MP3)`;
    const url = new URL("https://archive.org/advancedsearch.php");
    url.searchParams.set("q", q);
    ["identifier", "title", "creator", "downloads", "subject", "runtime"].forEach((f) =>
      url.searchParams.append("fl[]", f),
    );
    url.searchParams.set("sort[]", "downloads desc");
    url.searchParams.set("rows", String(limit));
    url.searchParams.set("page", "1");
    url.searchParams.set("output", "json");

    const res = await fetch(url.toString());
    if (!res.ok) return [];
    const json = await res.json();
    const docs: ArchiveSearchDoc[] = json?.response?.docs ?? [];

    const resolved = await Promise.allSettled(docs.map(resolveItem));
    return resolved
      .filter((r): r is PromiseFulfilledResult<AudiusTrack | null> => r.status === "fulfilled")
      .map((r) => r.value)
      .filter((t): t is AudiusTrack => !!t);
  } catch {
    return [];
  }
}
