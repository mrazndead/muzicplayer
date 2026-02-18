import { useEffect } from "react";

interface ShortcutHandlers {
  onTogglePlay: () => void;
  onNext: () => void;
  onPrev: () => void;
  onVolumeUp: () => void;
  onVolumeDown: () => void;
  hasTrack: boolean;
}

export function useKeyboardShortcuts({
  onTogglePlay,
  onNext,
  onPrev,
  onVolumeUp,
  onVolumeDown,
  hasTrack,
}: ShortcutHandlers) {
  useEffect(() => {
    if (!hasTrack) return;

    const handler = (e: KeyboardEvent) => {
      // Don't trigger if typing in an input
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      switch (e.code) {
        case "Space":
          e.preventDefault();
          onTogglePlay();
          break;
        case "ArrowRight":
          if (e.shiftKey) {
            e.preventDefault();
            onNext();
          }
          break;
        case "ArrowLeft":
          if (e.shiftKey) {
            e.preventDefault();
            onPrev();
          }
          break;
        case "ArrowUp":
          if (e.shiftKey) {
            e.preventDefault();
            onVolumeUp();
          }
          break;
        case "ArrowDown":
          if (e.shiftKey) {
            e.preventDefault();
            onVolumeDown();
          }
          break;
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [hasTrack, onTogglePlay, onNext, onPrev, onVolumeUp, onVolumeDown]);
}
