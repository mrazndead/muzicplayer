import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Upload, Music, Trash2, PlayCircle, Pause, ScanSearch, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AudiusTrack } from "@/lib/audius";

interface LocalLibraryProps {
  tracks: AudiusTrack[];
  loading: boolean;
  currentTrackId?: string;
  isPlaying: boolean;
  onAddFiles: (files: FileList) => void;
  onScanFiles: (files: File[]) => Promise<{ added: number; tooShort: number; dupes: number }>;
  onPlay: (track: AudiusTrack, index: number) => void;
  onRemove: (id: string) => void;
}

function formatDuration(s: number) {
  if (!s || !isFinite(s)) return "--:--";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export function LocalLibrary({
  tracks,
  loading,
  currentTrackId,
  isPlaying,
  onAddFiles,
  onScanFiles,
  onPlay,
  onRemove,
}: LocalLibraryProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const scanRef = useRef<HTMLInputElement>(null);
  const [scanning, setScanning] = useState(false);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-2xl font-bold gradient-text">Your Library</h2>
          <p className="text-muted-foreground text-xs mt-1 uppercase tracking-wider">
            {tracks.length} local {tracks.length === 1 ? "track" : "tracks"}
          </p>
        </div>
        <div className="flex items-center gap-2">
        <button
          onClick={() => scanRef.current?.click()}
          disabled={scanning}
          className="flex items-center gap-2 px-4 py-2.5 gradient-primary text-primary-foreground rounded-full text-sm font-medium hover:opacity-90 transition-opacity glow-sm disabled:opacity-60"
        >
          {scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <ScanSearch className="w-4 h-4" />}
          {scanning ? "Scanning…" : "Scan phone"}
        </button>
        <button
          onClick={() => inputRef.current?.click()}
          aria-label="Upload files"
          className="flex items-center justify-center w-10 h-10 glass-card rounded-full text-foreground hover:opacity-90"
        >
          <Upload className="w-4 h-4" />
        </button>
        </div>
        <input
          ref={scanRef}
          type="file"
          accept="audio/*,.mp3"
          multiple
          // @ts-expect-error non-standard folder picking attribute
          webkitdirectory=""
          className="hidden"
          onChange={async (e) => {
            const files = e.target.files;
            if (!files?.length) return;
            const mp3s = Array.from(files).filter((f) => /\.mp3$/i.test(f.name) || f.type === "audio/mpeg");
            e.target.value = "";
            if (!mp3s.length) { toast.error("No MP3 files found in that folder"); return; }
            setScanning(true);
            try {
              const r = await onScanFiles(mp3s);
              toast.success(`Added ${r.added} song${r.added === 1 ? "" : "s"}`, {
                description: `${r.tooShort} under 3 min skipped · ${r.dupes} already in library`,
              });
            } finally { setScanning(false); }
          }}
        />
        <input
          ref={inputRef}
          type="file"
          accept="audio/*,.mp3,.m4a,.wav,.ogg,.flac,.aac"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              onAddFiles(e.target.files);
              e.target.value = "";
            }
          }}
        />
      </div>

      {tracks.length > 0 && (
        <button
          onClick={() => onPlay(tracks[0], 0)}
          className="flex items-center gap-2 px-4 py-2 glass-card rounded-full text-xs font-medium hover:opacity-90 transition-opacity"
        >
          <PlayCircle className="w-4 h-4" />
          Play All
        </button>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-12 h-12 rounded-full gradient-primary animate-pulse glow-sm" />
        </div>
      ) : tracks.length === 0 ? (
        <div
          className="text-center py-16 px-6 glass-card rounded-2xl border-2 border-dashed border-border/40 cursor-pointer hover:border-primary/50 transition-colors"
          onClick={() => inputRef.current?.click()}
        >
          <Music className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-30" />
          <p className="text-foreground text-sm font-medium">Upload your MP3 files</p>
          <p className="text-muted-foreground/70 text-xs mt-1">
            Tap here or the Upload button to add songs from your phone
          </p>
          <p className="text-muted-foreground/50 text-[10px] mt-2">
            Supports MP3, M4A, WAV, OGG, FLAC, AAC
          </p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {tracks.map((track, i) => {
            const isCurrent = track.id === currentTrackId;
            return (
              <motion.div
                key={track.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.02 }}
                className={`flex items-center gap-3 p-2.5 rounded-xl group transition-colors ${
                  isCurrent ? "glass-card glow-border" : "hover:bg-white/5"
                }`}
              >
                <button
                  onClick={() => onPlay(track, i)}
                  className="flex-shrink-0 w-11 h-11 rounded-lg gradient-primary flex items-center justify-center"
                >
                  {isCurrent && isPlaying ? (
                    <Pause className="w-5 h-5 text-primary-foreground" />
                  ) : (
                    <PlayCircle className="w-5 h-5 text-primary-foreground" />
                  )}
                </button>
                <button
                  onClick={() => onPlay(track, i)}
                  className="flex-1 min-w-0 text-left"
                >
                  <p className={`text-sm font-medium line-clamp-1 ${isCurrent ? "text-primary" : "text-foreground"}`}>
                    {track.title}
                  </p>
                  <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                    {track.user.name} · {formatDuration(track.duration)}
                  </p>
                </button>
                <button
                  onClick={() => onRemove(track.id)}
                  className="flex-shrink-0 p-2 rounded-lg text-muted-foreground/60 hover:text-destructive hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100"
                  aria-label="Remove track"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
