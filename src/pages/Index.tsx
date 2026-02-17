import { useState, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { Music, Disc3 } from "lucide-react";
import { SearchBar } from "@/components/SearchBar";
import { GenreGrid } from "@/components/GenreGrid";
import { TrackList } from "@/components/TrackList";
import { MusicPlayer } from "@/components/MusicPlayer";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import { searchTracks, getTrendingTracks, AudiusTrack, DEFAULT_GENRES } from "@/lib/audius";

const Index = () => {
  const player = useAudioPlayer();
  const [tracks, setTracks] = useState<AudiusTrack[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeGenre, setActiveGenre] = useState<string | null>(null);
  const [searchLabel, setSearchLabel] = useState<string>("");
  const [hasSearched, setHasSearched] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const fetchTracks = useCallback(async (query: string, label: string, genreId?: string) => {
    // Cancel any pending request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setSearchLabel(label);
    setActiveGenre(genreId || null);
    setHasSearched(true);

    try {
      const results = await searchTracks(query, 30);
      if (!controller.signal.aborted) {
        setTracks(results);
      }
    } catch (err) {
      if (!controller.signal.aborted) {
        console.error("Failed to fetch tracks:", err);
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, []);

  const handleSearch = useCallback((query: string) => {
    fetchTracks(query, `Results for "${query}"`);
  }, [fetchTracks]);

  const handleGenreSelect = useCallback((genre: typeof DEFAULT_GENRES[number]) => {
    fetchTracks(genre.query, `${genre.emoji} ${genre.label}`, genre.id);
  }, [fetchTracks]);

  const handlePlayTrack = useCallback((track: AudiusTrack, index: number) => {
    if (track.id === player.currentTrack?.id) {
      player.togglePlay();
    } else {
      player.playTrack(track, tracks, index);
    }
  }, [player, tracks]);

  return (
    <div className={`min-h-screen bg-background ${player.currentTrack ? "pb-24" : ""}`}>
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-border">
        <div className="max-w-screen-xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Disc3 className="w-7 h-7 text-primary animate-spin" style={{ animationDuration: "3s" }} />
            <h1 className="font-heading text-lg font-bold text-foreground tracking-widest glow-text">
              PULSE
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-4 py-6 space-y-8">
        {/* Hero area */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <h2 className="font-heading text-2xl sm:text-3xl font-bold text-foreground tracking-wide">
            Free Music, <span className="text-primary glow-text">No Limits</span>
          </h2>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            Stream ad-free music from independent artists worldwide
          </p>
          <SearchBar onSearch={handleSearch} isLoading={loading} />
        </motion.div>

        {/* Genre buttons */}
        <section>
          <h3 className="font-heading text-xs font-semibold text-muted-foreground tracking-widest uppercase mb-3">
            Explore Genres
          </h3>
          <GenreGrid activeGenre={activeGenre} onSelectGenre={handleGenreSelect} />
        </section>

        {/* Results */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Music className="w-8 h-8 text-primary animate-pulse" />
          </div>
        )}

        {!loading && hasSearched && (
          <TrackList
            tracks={tracks}
            currentTrackId={player.currentTrack?.id}
            isPlaying={player.isPlaying}
            onPlay={handlePlayTrack}
            title={searchLabel}
          />
        )}

        {!loading && hasSearched && tracks.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No tracks found. Try a different search!</p>
          </div>
        )}
      </main>

      {/* Player */}
      <MusicPlayer
        currentTrack={player.currentTrack}
        isPlaying={player.isPlaying}
        currentTime={player.currentTime}
        duration={player.duration}
        volume={player.volume}
        onTogglePlay={player.togglePlay}
        onSeek={player.seek}
        onVolume={player.setVolume}
        onNext={player.nextTrack}
        onPrev={player.prevTrack}
      />
    </div>
  );
};

export default Index;
