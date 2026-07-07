
# Expand PULSE to Millions of Free Songs

Currently PULSE searches only Audius (~1M tracks). We'll federate several free, ad-free, globally available music sources so a single search returns results from all of them combined, ranked, and deduplicated.

## Sources to add

| Source | Catalog size | Auth needed | Notes |
|---|---|---|---|
| **Audius** (current) | ~1M | none | Keep as-is |
| **Jamendo** | ~600k full tracks | Free client_id (secret) | Full-length CC-licensed songs, real metadata + artwork + streams |
| **Internet Archive Audio** | ~10M+ items | none | Live music, netlabels, 78rpm, public domain; huge but noisier metadata |
| **Radio Browser** | ~40k live stations | none | Adds a "Radio" mode with global free stations, no ads |

Combined this is a >20x jump vs. Audius alone, with zero ads.

## How search will work

- One search box, one result list.
- We fan out the query in parallel to all enabled sources (`Promise.allSettled`), merge, dedupe by `${title}|${artist}` lowercase, and sort by popularity/play count.
- Each track is tagged with its source (Audius / Jamendo / Archive), shown as a tiny badge on the row.
- Failures in one source never break the others.

## Player changes

- `AudiusTrack` becomes a generic `Track` with a `source` field and a resolved `streamUrl`.
- `getStreamUrl` becomes source-aware:
  - Audius: existing discovery-host stream URL
  - Jamendo: `audiodownload` / `audio` field from the API response
  - Archive: pick the best MP3 file from the item's file list
- Local uploaded MP3s continue to work unchanged.

## Radio mode (new)

Adds a small "Radio" section on Home that lists popular global stations from Radio Browser. Tapping one streams live audio through the same player. Opt-in — doesn't clutter regular search results.

## Genres

Existing genre chips keep working. Genre queries now fan out across all sources, so e.g. "Jazz" pulls jazz tracks from Audius + Jamendo + Archive together.

## Technical

- New file: `src/lib/sources/jamendo.ts`, `src/lib/sources/archive.ts`, `src/lib/sources/radioBrowser.ts`.
- `src/lib/audius.ts` stays but shrinks to just the Audius adapter; a new `src/lib/music.ts` orchestrates federation, dedup, and sort.
- Track type unified in `src/lib/types.ts`; `getArtworkUrl` handles per-source artwork with the same local-cover fallback for missing images.
- No backend changes required for Audius / Archive / Radio Browser (all called directly from the browser via public JSON endpoints with CORS).
- Jamendo needs a **free** client_id from https://developer.jamendo.com/ — I'll request it as a secret once you confirm. It's a publishable ID (safe in client code), but storing it as a secret + reading it via a tiny edge-function proxy keeps it swappable and keeps Jamendo's usage tied to your account rather than baked into the bundle.

## What I need from you

1. **OK to add Jamendo?** It's the single biggest quality bump (real songs, artists, artwork). Requires you to grab a free client_id from https://developer.jamendo.com/ (2-minute signup). If yes, I'll add the secret request after you confirm.
2. **OK to add Radio mode?** Or skip it and stay songs-only.

If you say "go" without answering, I'll ship Audius + Internet Archive + Radio Browser now and leave Jamendo as a follow-up.
