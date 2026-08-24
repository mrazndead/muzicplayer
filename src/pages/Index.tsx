import { useState, useCallback, useEffect, useRef, lazy, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Music, Disc3, Clock, PlayCircle, ArrowLeft } from "lucide-react";
import { DailyQuote } from "@/components/DailyQuote";
import { useAppTheme, APP_THEMES } from "@/contexts/AppThemeContext";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { SkinSwitcher } from "@/components/SkinSwitcher";
import { SearchBar } from "@/components/SearchBar";
import { GenreGrid } from "@/components/GenreGrid";
import { TrackList } from "@/components/TrackList";
import { MusicPlayer } from "@/components/MusicPlayer";
import { MoodGrid } from "@/components/MoodGrid";
import { BottomTabs, TabId } from "@/components/BottomTabs";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import { useFavorites } from "@/hooks/useFavorites";
import { useRecentlyPlayed } from "@/hooks/useRecentlyPlayed";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useSleepTimer } from "@/hooks/useSleepTimer";
import { useLocalTracks } from "@/hooks/useLocalTracks";
import { Artwork } from "@/components/Artwork";
import { searchTracks, searchGenre, getTrendingTracks, AudiusTrack, DEFAULT_GENRES, DEFAULT_MOODS } from "@/lib/audius";

// Lazy-load heavy visual / rarely-used components to speed up first paint.
const MusicVisualizer = lazy(() => import("@/components/MusicVisualizer").then(m => ({ default: m.MusicVisualizer })));
const TrendingCarousel = lazy(() => import("@/components/TrendingCarousel").then(m => ({ default: m.TrendingCarousel })));
const LocalLibrary = lazy(() => import("@/components/LocalLibrary").then(m => ({ default: m.LocalLibrary })));

const LazyFallback = () => (
  <div className="flex items-center justify-center py-10">
    <div className="w-8 h-8 rounded-full gradient-primary animate-pulse opacity-60" />
  </div>
);

const TRACKS_PER_PAGE = 50;

const Index = () => {
  const player = useAudioPlayer();
  const { favorites, isFavorite, toggleFavorite } = useFavorites();
  const { recentlyPlayed, addToRecentlyPlayed } = useRecentlyPlayed();
  const localLib = useLocalTracks();
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
  const genreRef = useRef<typeof DEFAULT_GENRES[number] | null>(null);
  const pageRef = useRef(0);


  // Sleep timer pauses playback
  const sleepTimer = useSleepTimer(player.pause);

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
    genreRef.current = null;
    pageRef.current = 0;
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
      if (!controller.signal.aborted) {
        console.error("Failed to fetch tracks:", err);
        setTracks([]);
        setHasMore(false);
        toast.error("Search failed", { description: "Check your connection and try again." });
      }
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, []);


  const loadMoreTracks = useCallback(async () => {
    if (loadingMore) return;
    const activeGenreDef = genreRef.current;
    if (!activeGenreDef && !currentQuery) return;
    setLoadingMore(true);
    try {
      pageRef.current += 1;
      const results = activeGenreDef
        ? await searchGenre(activeGenreDef, pageRef.current)
        : await searchTracks(currentQuery, TRACKS_PER_PAGE, pageRef.current * TRACKS_PER_PAGE);
      let added = 0;
      setTracks(prev => {
        const existing = new Set(prev.map(t => t.id));
        const newTracks = results.filter(t => !existing.has(t.id));
        added = newTracks.length;
        return [...prev, ...newTracks];
      });
      setHasMore(results.length > 0 && (activeGenreDef ? pageRef.current < 8 : added > 0));
    } catch (err) {
      console.error("Failed to load more:", err);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, currentQuery]);

  const handleSearch = useCallback((query: string) => {
    genreRef.current = null;
    pageRef.current = 0;
    fetchTracks(query, `Results for "${query}"`);
  }, [fetchTracks]);

  const handleGenreSelect = useCallback(async (genre: typeof DEFAULT_GENRES[number]) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    genreRef.current = genre;
    pageRef.current = 0;
    setActiveMood(null);
    setActiveGenre(genre.id);
    setLoading(true);
    setSearchLabel(`${genre.emoji} ${genre.label}`);
    setHasSearched(true);
    setActiveTab("home");
    setCurrentQuery("");
    setHasMore(true);
    try {
      const results = await searchGenre(genre, 0);
      if (!controller.signal.aborted) {
        setTracks(results);
        setHasMore(results.length > 0);
      }
    } catch (err) {
      if (!controller.signal.aborted) console.error("Failed to fetch genre tracks:", err);
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }

  }, []);

  const handleMoodSelect = useCallback((mood: typeof DEFAULT_MOODS[number]) => {
    setActiveMood(mood.id);
    setActiveGenre(null);
    fetchTracks(mood.query, `${mood.emoji} ${mood.label}`);
  }, [fetchTracks]);

  /** Return to the discovery view (Featured / Moods / Genres) from a result list. */
  const handleClearResults = useCallback(() => {
    abortRef.current?.abort();
    genreRef.current = null;
    pageRef.current = 0;
    setHasSearched(false);
    setTracks([]);
    setActiveGenre(null);
    setActiveMood(null);
    setSearchLabel("");
    setCurrentQuery("");
    setLoading(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

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

  const handlePlayLocal = useCallback((track: AudiusTrack, index: number) => {
    if (track.id === player.currentTrack?.id) {
      player.togglePlay();
    } else {
      player.playTrack(track, localLib.tracks, index);
    }
  }, [player, localLib.tracks]);

  const handlePlayFromQueue = useCallback((track: AudiusTrack, index: number) => {
    player.playTrack(track, player.queue, index);
  }, [player]);

  const handleMoreByArtist = useCallback(() => {
    if (!player.currentTrack) return;
    const artistName = player.currentTrack.user.name;
    fetchTracks(artistName, `🎤 More by ${artistName}`);
  }, [player.currentTrack, fetchTracks]);

  const randomBusy = useRef(false);
  const handleRandomPlay = useCallback(async () => {
    if (randomBusy.current) return;
    randomBusy.current = true;
    // Pick a random genre and play a random track from it
    const randomGenre = DEFAULT_GENRES[Math.floor(Math.random() * DEFAULT_GENRES.length)];
    const randomQuery = randomGenre.queries[Math.floor(Math.random() * randomGenre.queries.length)];
    const { toast } = await import("sonner");
    try {
      const results = await searchTracks(randomQuery, 20);
      if (results.length > 0) {
        const idx = Math.floor(Math.random() * results.length);
        player.playTrack(results[idx], results, idx);
        toast(`${randomGenre.emoji} ${randomGenre.label}`, { duration: 1400 });
      } else {
        toast("Nothing found — try again", { duration: 1400 });
      }
    } catch (err) {
      console.error("Failed to play random track:", err);
      toast("Couldn't load a random track", { duration: 1600 });
    } finally {
      randomBusy.current = false;
    }
  }, [player]);


  const handleToggleRepeat = useCallback(async () => {
    player.toggleRepeat();
    const next = player.repeat === "off" ? "Repeat all" : player.repeat === "all" ? "Repeat one" : "Repeat off";
    const { toast } = await import("sonner");
    toast(next, { duration: 1200 });
  }, [player]);

  const handleToggleShuffle = useCallback(async () => {
    player.toggleShuffle();
    const { toast } = await import("sonner");
    toast(player.shuffle ? "Shuffle off" : "Shuffle on", { duration: 1200 });
  }, [player]);

  // Extra bottom room so the floating nav never covers the last track row.
  const playerPadding = player.currentTrack ? "pb-44" : "pb-32";

  return (
    <div className={`min-h-screen ${playerPadding} relative`}>
      {/* Ambient background */}
      <div className="app-bg" />
      {/* Decorative indigo glows */}
      <div className="pointer-events-none fixed -top-24 -right-24 w-72 h-72 rounded-full bg-indigo-600/15 blur-[100px] -z-10" />
      <div className="pointer-events-none fixed top-1/3 -left-24 w-80 h-80 rounded-full bg-indigo-500/10 blur-[120px] -z-10" />

      {/* Header */}
      <header className="sticky top-0 z-40 glass-heavy border-b border-white/5">
        <div className="max-w-screen-xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={handleClearResults}
            className="flex items-center gap-2.5 group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/70 rounded-2xl"
            aria-label="Go home"
          >
            <div className="w-9 h-9 rounded-2xl gradient-primary flex items-center justify-center glow-sm group-active:scale-95 transition-transform">
              <Disc3 className="w-4.5 h-4.5 text-primary-foreground" />
            </div>
            <div className="flex flex-col leading-none text-left">
              <h1 className="font-heading text-2xl tracking-[0.05em] gradient-text uppercase">
                Pulse
              </h1>
            </div>
          </button>
          <DailyQuote />
          <div className="ml-auto flex items-center gap-1.5">
            <SkinSwitcher />
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
              className="space-y-8"
            >
              <SearchBar onSearch={handleSearch} isLoading={loading} />

              {/* Mini player inline */}
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
                  onToggleShuffle={handleToggleShuffle}
                  onToggleRepeat={handleToggleRepeat}
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
                  buffering={player.buffering}
                  inline
                />
              )}

              {/* Visualizer — reacts to whatever is playing */}
              {player.currentTrack && (
                <Suspense fallback={<LazyFallback />}>
                  <MusicVisualizer isPlaying={player.isPlaying} />
                </Suspense>
              )}



              {/* Featured / Trending hero — primary discovery */}
              {!hasSearched && trendingTracks.length > 0 && (
                <section className="space-y-3">
                  <h2 className="font-heading text-2xl tracking-[0.08em] uppercase text-foreground">Featured</h2>
                  <Suspense fallback={<LazyFallback />}>
                    <TrendingCarousel
                      tracks={trendingTracks}
                      onPlay={handlePlayTrending}
                      currentTrackId={player.currentTrack?.id}
                    />
                  </Suspense>
                </section>
              )}

              {/* Moods */}
              {!hasSearched && (
                <section className="space-y-3">
                  <h2 className="font-heading text-2xl tracking-[0.08em] uppercase text-foreground">Moods</h2>
                  <MoodGrid activeMood={activeMood} onSelectMood={handleMoodSelect} />
                </section>
              )}

              {/* Genres — condensed chip strip */}
              {!hasSearched && (
                <section className="space-y-3">
                  <h2 className="font-heading text-2xl tracking-[0.08em] uppercase text-foreground">Genres</h2>
                  <GenreGrid activeGenre={activeGenre} onSelectGenre={handleGenreSelect} />
                </section>
              )}


              {/* Recently Played */}
              {!hasSearched && recentlyPlayed.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Clock className="w-4 h-4 text-primary" />
                    <h2 className="font-heading text-2xl tracking-[0.08em] uppercase text-foreground">Recently Played</h2>
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
                            <Artwork
                              track={track}
                              size="480x480"
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
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

              {hasSearched && (
                <button
                  onClick={handleClearResults}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full glass-card text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back to discover
                </button>
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
                  <h2 className="font-heading text-3xl tracking-[0.05em] uppercase gradient-text">Liked Tracks</h2>
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

          {/* LIBRARY TAB */}
          {activeTab === "library" && (
            <motion.div
              key="library"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <Suspense fallback={<LazyFallback />}>
                <LocalLibrary
                  tracks={localLib.tracks}
                  loading={localLib.loading}
                  currentTrackId={player.currentTrack?.id}
                  isPlaying={player.isPlaying}
                  onAddFiles={(files) => localLib.addFiles(files)}
                  onPlay={handlePlayLocal}
                  onRemove={localLib.removeTrack}
                />
              </Suspense>
            </motion.div>
          )}
        </AnimatePresence>
      </main>


      <BottomTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onRandomPlay={handleRandomPlay}
        favCount={favorites.length}
        hasPlayer={!!player.currentTrack}
      />

    </div>
  );
};

export default Index;
