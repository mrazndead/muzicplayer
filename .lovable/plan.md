# Finish and strengthen PULSE

## What will change
- Complete the remaining app settings: remember the last open tab and add a visible keep-screen-awake control that preserves its setting.
- Replace remaining TP Music branding with PULSE in browser, sharing, and install metadata.
- Add three genuinely distinct selectable skins, each compatible with all existing color palettes:
  - **Blueprint** — technical grid, crisp cyan drafting lines, compact geometry.
  - **Candy** — bright pop-art surfaces, bold outlines, playful high-contrast shapes.
  - **Noir** — monochrome editorial styling, fine rules, cinematic typography.
- Improve the one-click MP3 flow with stronger response validation, bounded retries, safer filenames, download cancellation/timeout handling, clearer fallback behavior, and reduced memory use for large files.
- Verify uploaded-library persistence by uploading and playing an MP3, reloading the app, and playing it again.
- Run the full linter, type checks, tests, current diagnostics, and browser checks across Home, YouTube, Library, Liked, skin switching, saved tab restoration, wake lock, and MP3 download.

## Technical details
- Extend the existing skin union, switcher metadata, and semantic CSS-token overrides rather than creating a separate theme system.
- Keep color-palette selection independent from skin selection.
- Persist navigation under a versioned local key and validate stored values before restoring.
- Use the existing wake-lock hook and expose supported/enabled/active state in the header.
- Keep MP3 delivery within the existing app function and avoid holding duplicate copies of the downloaded file.
- Fix actionable lint or runtime issues found during validation; leave no known app-owned errors.
