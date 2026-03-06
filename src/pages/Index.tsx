import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Music, Disc3, Clock, PlayCircle, Sparkles } from "lucide-react";
import { useAppTheme, APP_THEMES } from "@/contexts/AppThemeContext";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { MusicVisualizer } from "@/components/MusicVisualizer";
import { SearchBar } from "@/components/SearchBar";
import { GenreGrid } from "@/components/GenreGrid";
import { TrackList } from "@/components/TrackList";
import { MusicPlayer } from "@/components/MusicPlayer";
import { TrendingCarousel } from "@/components/TrendingCarousel";
import { MoodGrid } from "@/components/MoodGrid";
import { BottomTabs, TabId } from "@/components/BottomTabs";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import { useFavorites } from "@/hooks/useFavorites";
import { useRecentlyPlayed } from "@/hooks/useRecentlyPlayed";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useSleepTimer } from "@/hooks/useSleepTimer";
import { searchTracks, getTrendingTracks, AudiusTrack, DEFAULT_GENRES, DEFAULT_MOODS } from "@/lib/audius";

const TRACKS_PER_PAGE = 50;

const Index = () => {
  const player = useAudioPlayer();
  const { favorites, isFavorite, toggleFavorite } = useFavorites();
  const { recentlyPlayed, addToRecentlyPlayed } = useRecentlyPlayed();
  const [tracks, setTracks] = useState<AudiusTrack[]>([]);
  const [trendingTracks, setTrendingTracks] = useState<AudiusTrack[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [activeGenre, setActiveGenre] = useState<string | null>(null);
  const [searchLabel, setSearchLabel] = useState<string>("");
  const [activeMood, setActiveMood] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>("home");
  const [currentQuery, setCurrentQuery] = useState<string>("");
  const [hasMore, setHasMore] = useState(true);
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
    setCurrentQuery(query);
    setHasMore(true);
    try {
      const results = await searchTracks(query, TRACKS_PER_PAGE);
      if (!controller.signal.aborted) {
        setTracks(results);
        setHasMore(results.length >= TRACKS_PER_PAGE);
      }
    } catch (err) {
      if (!controller.signal.aborted) console.error("Failed to fetch tracks:", err);
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, []);

  const loadMoreTracks = useCallback(async () => {
    if (loadingMore || !currentQuery) return;
    setLoadingMore(true);
    try {
      const results = await searchTracks(currentQuery, TRACKS_PER_PAGE, tracks.length);
      const existingIds = new Set(tracks.map(t => t.id));
      const newTracks = results.filter(t => !existingIds.has(t.id));
      setTracks(prev => [...prev, ...newTracks]);
      setHasMore(results.length >= TRACKS_PER_PAGE);
    } catch (err) {
      console.error("Failed to load more:", err);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, currentQuery, tracks]);

  const handleSearch = useCallback((query: string) => {
    fetchTracks(query, `Results for "${query}"`);
  }, [fetchTracks]);

  const handleGenreSelect = useCallback((genre: typeof DEFAULT_GENRES[number]) => {
    setActiveMood(null);
    const query = genre.queries[Math.floor(Math.random() * genre.queries.length)];
    fetchTracks(query, `${genre.emoji} ${genre.label}`, genre.id);
  }, [fetchTracks]);

  const handleMoodSelect = useCallback((mood: typeof DEFAULT_MOODS[number]) => {
    setActiveMood(mood.id);
    setActiveGenre(null);
    fetchTracks(mood.query, `${mood.emoji} ${mood.label}`);
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

  const handleMoreByArtist = useCallback(() => {
    if (!player.currentTrack) return;
    const artistName = player.currentTrack.user.name;
    fetchTracks(artistName, `🎤 More by ${artistName}`);
  }, [player.currentTrack, fetchTracks]);

  const playerPadding = player.currentTrack ? "pt-16 pb-24" : "pb-24";

  return (
    <div className={`min-h-screen ${playerPadding}`}>
      {/* Ambient background */}
      <div className="app-bg" />

      {/* Header */}
      <header className="sticky top-0 z-40 glass-heavy border-b border-border/20">
        <div className="max-w-screen-xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl gradient-primary flex items-center justify-center glow-sm">
              <Disc3 className="w-4.5 h-4.5 text-primary-foreground" />
            </div>
            <h1 className="font-heading text-xl font-bold gradient-text tracking-tight">
              Pulse
            </h1>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <ThemeSwitcher />
          </div>
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-4 py-5 space-y-6">
        <AnimatePresence mode="wait">
          {/* HOME TAB */}
          {activeTab === "home" && (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-7"
            >
              {/* Welcome text */}

              <SearchBar onSearch={handleSearch} isLoading={loading} />
              <GenreGrid activeGenre={activeGenre} onSelectGenre={handleGenreSelect} />
              <MoodGrid activeMood={activeMood} onSelectMood={handleMoodSelect} />

              <MusicVisualizer isPlaying={player.isPlaying} />

              {/* Mini player inline under visualizer */}
              {player.currentTrack && (
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
                  audioContext={player.audioContext}
                  eqFilters={player.eqFilters}
                  onMoreByArtist={handleMoreByArtist}
                  inline
                />
              )

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
                  <div className="flex items-center gap-2 mb-4">
                    <Clock className="w-4 h-4 text-primary" />
                    <h2 className="font-heading text-sm font-semibold text-foreground tracking-wide uppercase opacity-70">Recently Played</h2>
                  </div>
                  <div className="flex gap-3.5 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
                    {recentlyPlayed.slice(0, 10).map((track, i) => {
                      const isCurrent = track.id === player.currentTrack?.id;
                      return (
                        <motion.button
                          key={track.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.04 }}
                          onClick={() => handlePlayRecent(track, i)}
                          className="flex-shrink-0 w-32 group text-left"
                        >
                          <div className={`relative w-32 h-32 rounded-2xl overflow-hidden mb-2 card-hover ${isCurrent ? "ring-2 ring-primary glow-border" : ""}`}>
                            <img
                              src={track.artwork?.["480x480"] || track.artwork?.["150x150"] || "/placeholder.svg"}
                              alt={track.title}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
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
                <div className="flex items-center justify-center py-20">
                  <div className="w-12 h-12 rounded-full gradient-primary animate-pulse glow-sm" />
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
                  onLoadMore={loadMoreTracks}
                  isLoadingMore={loadingMore}
                  hasMore={hasMore}
                />
              )}

              {!loading && hasSearched && tracks.length === 0 && (
                <div className="text-center py-20">
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
              <h2 className="font-heading text-2xl font-bold gradient-text">Discover</h2>
              <SearchBar onSearch={handleSearch} isLoading={loading} />
              <GenreGrid activeGenre={activeGenre} onSelectGenre={handleGenreSelect} />

              {loading && (
                <div className="flex items-center justify-center py-16">
                  <div className="w-12 h-12 rounded-full gradient-primary animate-pulse glow-sm" />
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
                  onLoadMore={loadMoreTracks}
                  isLoadingMore={loadingMore}
                  hasMore={hasMore}
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
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-heading text-2xl font-bold gradient-text">Liked Tracks</h2>
                  <p className="text-muted-foreground text-xs mt-1 uppercase tracking-wider">
                    {favorites.length} {favorites.length === 1 ? "track" : "tracks"}
                  </p>
                </div>
                {favorites.length > 0 && (
                  <button
                    onClick={() => handlePlayFavorite(favorites[0], 0)}
                    className="flex items-center gap-2 px-5 py-2.5 gradient-primary text-primary-foreground rounded-full text-sm font-medium hover:opacity-90 transition-opacity glow-sm"
                  >
                    <PlayCircle className="w-4 h-4" />
                    Play All
                  </button>
                )}
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
                  <Music className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-30" />
                  <p className="text-muted-foreground text-sm">No liked tracks yet</p>
                  <p className="text-muted-foreground/50 text-xs mt-1">Tap the ❤️ on any track to save it</p>
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
        audioContext={player.audioContext}
        eqFilters={player.eqFilters}
        onMoreByArtist={handleMoreByArtist}
      />
    </div>
  );
};

export default Index;
