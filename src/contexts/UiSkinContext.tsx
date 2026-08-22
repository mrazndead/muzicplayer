import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type UiSkinId = "pulse" | "cassette" | "vinyl" | "terminal" | "zen";

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
