import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Music, Disc3, Clock } from "lucide-react";
import { useAppTheme, APP_THEMES } from "@/contexts/AppThemeContext";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { MusicVisualizer } from "@/components/MusicVisualizer";
import { SearchBar } from "@/components/SearchBar";
import { GenreGrid } from "@/components/GenreGrid";
import { TrackList } from "@/components/TrackList";
import { MusicPlayer } from "@/components/MusicPlayer";
import { TrendingCarousel } from "@/components/TrendingCarousel";
import { BottomTabs, TabId } from "@/components/BottomTabs";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import { useFavorites } from "@/hooks/useFavorites";
import { useRecentlyPlayed } from "@/hooks/useRecentlyPlayed";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useSleepTimer } from "@/hooks/useSleepTimer";
import { searchTracks, getTrendingTracks, AudiusTrack, DEFAULT_GENRES } from "@/lib/audius";

const Index = () => {
  const player = useAudioPlayer();
  const { favorites, isFavorite, toggleFavorite } = useFavorites();
  const { recentlyPlayed, addToRecentlyPlayed } = useRecentlyPlayed();
  const [tracks, setTracks] = useState<AudiusTrack[]>([]);
  const [trendingTracks, setTrendingTracks] = useState<AudiusTrack[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeGenre, setActiveGenre] = useState<string | null>(null);
  const [searchLabel, setSearchLabel] = useState<string>("");
  const [hasSearched, setHasSearched] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>("home");
  const abortRef = useRef<AbortController | null>(null);
  const trendingLoaded = useRef(false);

  // Sleep timer pauses playback
  const sleepTimer = useSleepTimer(player.togglePlay);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onTogglePlay: player.togglePlay,
    onNext: player.nextTrack,
    onPrev: player.prevTrack,
    onVolumeUp: useCallback(() => player.setVolume(Math.min(1, player.volume + 0.1)), [player]),
    onVolumeDown: useCallback(() => player.setVolume(Math.max(0, player.volume - 0.1)), [player]),
    hasTrack: !!player.currentTrack,
  });

  // Track recently played
  const prevTrackId = useRef<string | null>(null);
  useEffect(() => {
    if (player.currentTrack && player.currentTrack.id !== prevTrackId.current) {
      prevTrackId.current = player.currentTrack.id;
      addToRecentlyPlayed(player.currentTrack);
    }
  }, [player.currentTrack, addToRecentlyPlayed]);

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

  const handlePlayRecent = useCallback((track: AudiusTrack, index: number) => {
    if (track.id === player.currentTrack?.id) {
      player.togglePlay();
    } else {
      player.playTrack(track, recentlyPlayed, index);
    }
  }, [player, recentlyPlayed]);

  const handlePlayFromQueue = useCallback((track: AudiusTrack, index: number) => {
    player.playTrack(track, player.queue, index);
  }, [player]);

  const playerPadding = player.currentTrack ? "pb-36 sm:pb-32" : "pb-20";

  return (
    <div className={`min-h-screen bg-background ${playerPadding}`}>
      {/* Header */}
      <header className="sticky top-0 z-40 glass-heavy border-b border-border/30">
        <div className="max-w-screen-xl mx-auto px-4 py-3.5 flex items-center gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl gradient-primary flex items-center justify-center">
              <Disc3 className="w-4 h-4 text-primary-foreground" />
            </div>
            <h1 className="font-heading text-lg font-bold text-foreground tracking-tight">
              Pulse
            </h1>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <ThemeSwitcher />
          </div>
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-4 py-6 space-y-6">
        <AnimatePresence mode="wait">
          {/* HOME TAB */}
          {activeTab === "home" && (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <SearchBar onSearch={handleSearch} isLoading={loading} />
              <GenreGrid activeGenre={activeGenre} onSelectGenre={handleGenreSelect} />

              <MusicVisualizer isPlaying={player.isPlaying} />

              {/* Trending */}
              {!hasSearched && trendingTracks.length > 0 && (
                <TrendingCarousel
                  tracks={trendingTracks}
                  onPlay={handlePlayTrending}
                  currentTrackId={player.currentTrack?.id}
                />
              )}

              {/* Recently Played */}
              {!hasSearched && recentlyPlayed.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <h2 className="font-heading text-base font-semibold text-foreground">Recently Played</h2>
                  </div>
                  <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
                    {recentlyPlayed.slice(0, 10).map((track, i) => {
                      const isCurrent = track.id === player.currentTrack?.id;
                      return (
                        <motion.button
                          key={track.id}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: i * 0.03 }}
                          onClick={() => handlePlayRecent(track, i)}
                          className="flex-shrink-0 w-28 group text-left"
                        >
                          <div className={`relative w-28 h-28 rounded-2xl overflow-hidden mb-2 ${isCurrent ? "ring-2 ring-primary glow-border" : ""}`}>
                            <img
                              src={track.artwork?.["480x480"] || track.artwork?.["150x150"] || "/placeholder.svg"}
                              alt={track.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              loading="lazy"
                            />
                          </div>
                          <p className="text-xs font-medium text-foreground line-clamp-1">{track.title}</p>
                          <p className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">{track.user.name}</p>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              )}

              {loading && (
                <div className="flex items-center justify-center py-16">
                  <div className="w-10 h-10 rounded-full gradient-primary animate-pulse" />
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
                <div className="text-center py-16">
                  <p className="text-muted-foreground text-sm">No tracks found. Try a different search!</p>
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
              <h2 className="font-heading text-xl font-bold text-foreground">Discover</h2>
              <SearchBar onSearch={handleSearch} isLoading={loading} />
              <GenreGrid activeGenre={activeGenre} onSelectGenre={handleGenreSelect} />

              {loading && (
                <div className="flex items-center justify-center py-16">
                  <div className="w-10 h-10 rounded-full gradient-primary animate-pulse" />
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
              <div>
                <h2 className="font-heading text-xl font-bold text-foreground">Liked Tracks</h2>
                <p className="text-muted-foreground text-sm mt-1">
                  {favorites.length} {favorites.length === 1 ? "track" : "tracks"}
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
                <div className="text-center py-20">
                  <Music className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
                  <p className="text-muted-foreground text-sm">No liked tracks yet</p>
                  <p className="text-muted-foreground/60 text-xs mt-1">Tap the ❤️ on any track to save it</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <BottomTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        favCount={favorites.length}
        hasPlayer={!!player.currentTrack}
      />

      <MusicPlayer
        currentTrack={player.currentTrack}
        isPlaying={player.isPlaying}
        currentTime={player.currentTime}
        duration={player.duration}
        volume={player.volume}
        shuffle={player.shuffle}
        repeat={player.repeat}
        queue={player.queue}
        queueIndex={player.queueIndex}
        onTogglePlay={player.togglePlay}
        onSeek={player.seek}
        onVolume={player.setVolume}
        onNext={player.nextTrack}
        onPrev={player.prevTrack}
        onToggleShuffle={player.toggleShuffle}
        onToggleRepeat={player.toggleRepeat}
        isFavorite={player.currentTrack ? isFavorite(player.currentTrack.id) : false}
        onToggleFavorite={player.currentTrack ? () => toggleFavorite(player.currentTrack!) : undefined}
        onPlayFromQueue={handlePlayFromQueue}
        sleepTimerActive={sleepTimer.isActive}
        sleepTimerRemaining={sleepTimer.remainingSeconds}
        onStartSleepTimer={sleepTimer.startTimer}
        onCancelSleepTimer={sleepTimer.cancelTimer}
      />
    </div>
  );
};

export default Index;
