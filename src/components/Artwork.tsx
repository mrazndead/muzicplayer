import { useEffect, useState } from "react";
import { AudiusTrack, getArtworkUrl, pickLocalCover } from "@/lib/audius";

type Size = "150x150" | "480x480" | "1000x1000";

interface ArtworkProps {
  track: AudiusTrack;
  size?: Size;
  className?: string;
  alt?: string;
  eager?: boolean;
  /** "square" thumbnails may be styled as vinyl records; "wide" ones never are. */
  shape?: "square" | "wide";
}

/**
 * Artwork with a guaranteed visual: if a remote cover 404s or is blocked,
 * it silently swaps to a deterministic local cover instead of a broken image.
 */
export function Artwork({ track, size = "480x480", className, alt, eager, shape = "square" }: ArtworkProps) {
  const primary = getArtworkUrl(track, size);
  const [src, setSrc] = useState(primary);

  useEffect(() => {
    setSrc(primary);
  }, [primary]);

  return (
    <img
      src={src}
      data-artwork={shape}
      alt={alt ?? track.title}
      className={className}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      draggable={false}
      onError={() => {
        const fb = pickLocalCover(track.id);
        if (src !== fb) setSrc(fb);
      }}
    />
  );
}
