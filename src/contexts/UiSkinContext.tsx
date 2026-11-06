import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type UiSkinId = "pulse" | "cassette" | "vinyl" | "terminal" | "zen" | "blueprint" | "candy" | "noir" | "sunset" | "forest" | "arctic";

export interface UiSkin {
  id: UiSkinId;
  label: string;
  tagline: string;
  icon: string;
  /** Swatch preview colors (bg, surface, accent) */
  swatch: [string, string, string];
}

export const UI_SKINS: UiSkin[] = [
  { id: "pulse", label: "Pulse", tagline: "Neon glass, glowing depth", icon: "✦", swatch: ["#0a0a1a", "#141432", "#4f46e5"] },
  { id: "cassette", label: "Cassette", tagline: "Retro tape deck, hard edges", icon: "⏏", swatch: ["#f3ece1", "#ffffff", "#e2542c"] },
  { id: "vinyl", label: "Vinyl", tagline: "Warm 70s lounge, gold serif", icon: "◉", swatch: ["#1b1208", "#2a1c0d", "#d9a441"] },
  { id: "terminal", label: "Terminal", tagline: "Monospace CRT console", icon: "▮", swatch: ["#000000", "#0a1a0a", "#3cff7a"] },
  { id: "zen", label: "Zen", tagline: "Quiet editorial daylight", icon: "◌", swatch: ["#faf9f7", "#ffffff", "#2f6f5e"] },
  { id: "blueprint", label: "Blueprint", tagline: "Drafting grid, crisp cyan lines", icon: "⌗", swatch: ["#0b2a4a", "#103a63", "#7fd6ff"] },
  { id: "candy", label: "Candy", tagline: "Pop-art color, bold outlines", icon: "◆", swatch: ["#fff3b0", "#ffffff", "#ff3d8b"] },
  { id: "noir", label: "Noir", tagline: "Monochrome cinema, fine rules", icon: "◐", swatch: ["#0a0a0a", "#161616", "#f2f2f2"] },
  { id: "sunset", label: "Sunset", tagline: "Dusk glow, warm coral haze", icon: "☀", swatch: ["#2b0f1e", "#3d1526", "#ff7a4d"] },
  { id: "forest", label: "Forest", tagline: "Deep botanical, mossy serif", icon: "❦", swatch: ["#0d1f16", "#163024", "#8fd694"] },
  { id: "arctic", label: "Arctic", tagline: "Glacial light, crisp ice blue", icon: "❄", swatch: ["#eef4f8", "#ffffff", "#0e7fd6"] },
];

interface Ctx {
  skinId: UiSkinId;
  setSkinId: (id: UiSkinId) => void;
}

const UiSkinContext = createContext<Ctx>({ skinId: "pulse", setSkinId: () => {} });

export function UiSkinProvider({ children }: { children: ReactNode }) {
  const [skinId, setSkinId] = useState<UiSkinId>(() => {
    const saved = localStorage.getItem("ui-skin") as UiSkinId | null;
    return saved && UI_SKINS.some((s) => s.id === saved) ? saved : "pulse";
  });

  useEffect(() => {
    localStorage.setItem("ui-skin", skinId);
    document.documentElement.setAttribute("data-skin", skinId);
  }, [skinId]);

  return (
    <UiSkinContext.Provider value={{ skinId, setSkinId }}>{children}</UiSkinContext.Provider>
  );
}

export const useUiSkin = () => useContext(UiSkinContext);
