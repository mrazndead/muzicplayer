import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Music, Disc3, TrendingUp } from "lucide-react";
import { SearchBar } from "@/components/SearchBar";
import { GenreGrid } from "@/components/GenreGrid";
import { TrackList } from "@/components/TrackList";
import { MusicPlayer } from "@/components/MusicPlayer";
import { TrendingCarousel } from "@/components/TrendingCarousel";
import { BottomTabs, TabId } from "@/components/BottomTabs";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import { useFavorites } from "@/hooks/useFavorites";
import { searchTracks, getTrendingTracks, AudiusTrack, DEFAULT_GENRES } from "@/lib/audius";

const Index = () => {
  const player = useAudioPlayer();
  const { favorites, isFavorite, toggleFavorite } = useFavorites();
  const [tracks, setTracks] = useState<AudiusTrack[]>([]);
  const [trendingTracks, setTrendingTracks] = useState<AudiusTrack[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeGenre, setActiveGenre] = useState<string | null>(null);
  const [searchLabel, setSearchLabel] = useState<string>("");
  const [hasSearched, setHasSearched] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>("home");
  const abortRef = useRef<AbortController | null>(null);
  const trendingLoaded = useRef(false);

  // Load trending on mount
  useEffect(() => {
    if (trendingLoaded.current) return;
    trendingLoaded.current = true;
    getTrendingTracks(undefined, 12).then(setTrendingTracks).catch(console.error);
  }, []);

  const fetchTracks = useCallback(async (query: string, label: string, genreId?: string) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setSearchLabel(label);
    setActiveGenre(genreId || null);
    setHasSearched(true);
    setActiveTab("home");

    try {
      const results = await searchTracks(query, 30);
      if (!controller.signal.aborted) {
        setTracks(results);
      }
    } catch (err) {
      if (!controller.signal.aborted) console.error("Failed to fetch tracks:", err);
    } finally {
      if (!controller.signal.aborted) setLoading(false);
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

  const handlePlayTrending = useCallback((track: AudiusTrack, index: number) => {
    if (track.id === player.currentTrack?.id) {
      player.togglePlay();
    } else {
      player.playTrack(track, trendingTracks, index);
    }
  }, [player, trendingTracks]);

  const handlePlayFavorite = useCallback((track: AudiusTrack, index: number) => {
    if (track.id === player.currentTrack?.id) {
      player.togglePlay();
    } else {
      player.playTrack(track, favorites, index);
    }
  }, [player, favorites]);

  const playerPadding = player.currentTrack ? "pb-32 sm:pb-28" : "pb-16";

  return (
    <div className={`min-h-screen bg-background ${playerPadding}`}>
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
        <AnimatePresence mode="wait">
          {/* HOME TAB */}
          {activeTab === "home" && (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              {/* Hero */}
              <div className="text-center space-y-4">
                <h2 className="font-heading text-2xl sm:text-3xl font-bold text-foreground tracking-wide">
                  Free Music, <span className="text-primary glow-text">No Limits</span>
                </h2>
                <p className="text-muted-foreground text-sm max-w-md mx-auto">
                  Stream ad-free music from independent artists worldwide
                </p>
                <SearchBar onSearch={handleSearch} isLoading={loading} />
              </div>

              {/* Genres */}
              <section>
                <h3 className="font-heading text-xs font-semibold text-muted-foreground tracking-widest uppercase mb-3">
                  Explore Genres
                </h3>
                <GenreGrid activeGenre={activeGenre} onSelectGenre={handleGenreSelect} />
              </section>

              {/* Trending carousel */}
              {!hasSearched && trendingTracks.length > 0 && (
                <TrendingCarousel
                  tracks={trendingTracks}
                  onPlay={handlePlayTrending}
                  currentTrackId={player.currentTrack?.id}
                />
              )}

              {/* Search results */}
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
                  isFavorite={isFavorite}
                  onToggleFavorite={toggleFavorite}
                />
              )}

              {!loading && hasSearched && tracks.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No tracks found. Try a different search!</p>
                </div>
              )}
            </motion.div>
          )}

          {/* SEARCH TAB */}
          {activeTab === "search" && (
            <motion.div
              key="search"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="text-center space-y-4">
                <h2 className="font-heading text-xl font-bold text-foreground tracking-wide">
                  Find Your Sound
                </h2>
                <SearchBar onSearch={handleSearch} isLoading={loading} />
              </div>

              <GenreGrid activeGenre={activeGenre} onSelectGenre={handleGenreSelect} />

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
                  isFavorite={isFavorite}
                  onToggleFavorite={toggleFavorite}
                />
              )}
            </motion.div>
          )}

          {/* FAVORITES TAB */}
          {activeTab === "favorites" && (
            <motion.div
              key="favorites"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="text-center">
                <h2 className="font-heading text-xl font-bold text-foreground tracking-wide">
                  ❤️ Your Liked Tracks
                </h2>
                <p className="text-muted-foreground text-sm mt-1">
                  {favorites.length} {favorites.length === 1 ? "track" : "tracks"} saved
                </p>
              </div>

              {favorites.length > 0 ? (
                <TrackList
                  tracks={favorites}
                  currentTrackId={player.currentTrack?.id}
                  isPlaying={player.isPlaying}
                  onPlay={handlePlayFavorite}
                  isFavorite={isFavorite}
                  onToggleFavorite={toggleFavorite}
                />
              ) : (
                <div className="text-center py-16">
                  <Music className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No liked tracks yet</p>
                  <p className="text-muted-foreground text-sm mt-1">Tap the ❤️ on any track to save it here</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom tabs */}
      <BottomTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        favCount={favorites.length}
        hasPlayer={!!player.currentTrack}
      />

      {/* Player */}
      <MusicPlayer
        currentTrack={player.currentTrack}
        isPlaying={player.isPlaying}
        currentTime={player.currentTime}
        duration={player.duration}
        volume={player.volume}
        shuffle={player.shuffle}
        repeat={player.repeat}
        onTogglePlay={player.togglePlay}
        onSeek={player.seek}
        onVolume={player.setVolume}
        onNext={player.nextTrack}
        onPrev={player.prevTrack}
        onToggleShuffle={player.toggleShuffle}
        onToggleRepeat={player.toggleRepeat}
        isFavorite={player.currentTrack ? isFavorite(player.currentTrack.id) : false}
        onToggleFavorite={player.currentTrack ? () => toggleFavorite(player.currentTrack!) : undefined}
      />
    </div>
  );
};

export default Index;
