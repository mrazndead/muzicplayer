
# Mini Visualizer + Mood-Based Discovery

## 1. Mini Visualizer in the Bottom Player Bar

Add a small animated equalizer-style visualizer next to the track info in the mini player bar. It will use the existing `EqualizerBars` component (already built) and show animated bars when music is playing.

**What it looks like**: Between the album art and track title, a small set of 3-4 animated bars will pulse in sync with playback status -- animating when playing, static when paused.

**Changes**:
- **`src/components/MusicPlayer.tsx`**: Import `EqualizerBars` and place it inside the mini player, right after the album art thumbnail. It receives the `isPlaying` prop to animate/stop.

---

## 2. Mood-Based Music Discovery

Add a new "Moods" section on the Home tab (below the genre grid) that lets users discover music by mood. Each mood is a styled card with an emoji and label. Tapping a mood searches for tracks matching that vibe.

**Moods included**:
- Chill, Energetic, Melancholy, Romantic, Focus, Party, Dreamy, Uplifting

**Changes**:

- **`src/lib/audius.ts`**: Add a `DEFAULT_MOODS` array with id, label, emoji, and search query for each mood.

- **`src/components/MoodGrid.tsx`** (new file): A horizontal scrollable row of mood cards with gradient backgrounds, emoji, and label. Tapping a card triggers a search callback.

- **`src/pages/Index.tsx`**: Import `MoodGrid` and place it on the Home tab between the genre grid and the visualizer. Wire it to the existing `fetchTracks` function so selecting a mood searches for matching tracks.

---

## Technical Details

### Mini Visualizer
- Reuses the existing `EqualizerBars` component with `barCount={3}` and smaller sizing
- Placed inside the mini player's track info button, after the artwork image
- Only visible when a track is loaded; animates only when `isPlaying` is true

### Mood Grid
- `DEFAULT_MOODS` array structure: `{ id: string, label: string, query: string, emoji: string }`
- Example queries: `"chill vibes relaxing"`, `"energetic upbeat workout"`, `"sad emotional melancholy"`, `"romantic love songs"`, `"focus concentration study"`, `"party dance club"`, `"dreamy ethereal ambient"`, `"uplifting happy positive"`
- Cards use a horizontal scroll layout similar to the recently played section
- Each card has a subtle gradient background using the theme's primary/accent colors
