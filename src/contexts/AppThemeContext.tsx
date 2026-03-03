import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type AppThemeId = "purple" | "ocean" | "ember" | "mint" | "rose" | "midnight" | "golden";

interface AppTheme {
  id: AppThemeId;
  label: string;
  icon: string;
  vars: Record<string, string>;
}

export const APP_THEMES: AppTheme[] = [
  {
    id: "purple",
    label: "Purple",
    icon: "🟣",
    vars: {
      "--background": "270 50% 5%",
      "--card": "270 40% 10%",
      "--popover": "270 40% 10%",
      "--secondary": "270 35% 13%",
      "--muted": "270 28% 16%",
      "--muted-foreground": "270 15% 50%",
      "--border": "270 30% 14%",
      "--input": "270 30% 14%",
      "--primary": "280 85% 60%",
      "--primary-foreground": "0 0% 100%",
      "--accent": "315 80% 55%",
      "--accent-foreground": "0 0% 100%",
      "--ring": "280 85% 60%",
      "--glow-primary": "280 85% 60%",
      "--glow-accent": "315 80% 55%",
      "--gradient-start": "280 85% 60%",
      "--gradient-end": "315 80% 55%",
      "--sidebar-background": "270 48% 6%",
      "--sidebar-primary": "280 85% 60%",
      "--sidebar-ring": "280 85% 60%",
      "--sidebar-accent": "270 35% 13%",
      "--sidebar-border": "270 30% 14%",
      "--glass-bg": "270 40% 10% / 0.6",
      "--glass-border": "270 30% 25% / 0.3",
      "--glass-heavy-bg": "270 45% 7% / 0.85",
      "--bg-glow": "280 85% 60%",
    },
  },
  {
    id: "ocean",
    label: "Ocean",
    icon: "🔵",
    vars: {
      "--background": "215 55% 5%",
      "--card": "215 45% 9%",
      "--popover": "215 45% 9%",
      "--secondary": "215 38% 13%",
      "--muted": "215 30% 16%",
      "--muted-foreground": "210 22% 48%",
      "--border": "215 32% 14%",
      "--input": "215 32% 14%",
      "--primary": "200 85% 55%",
      "--primary-foreground": "0 0% 100%",
      "--accent": "170 75% 50%",
      "--accent-foreground": "0 0% 100%",
      "--ring": "200 85% 55%",
      "--glow-primary": "200 85% 55%",
      "--glow-accent": "170 75% 50%",
      "--gradient-start": "200 85% 55%",
      "--gradient-end": "170 75% 50%",
      "--sidebar-background": "215 50% 6%",
      "--sidebar-primary": "200 85% 55%",
      "--sidebar-ring": "200 85% 55%",
      "--sidebar-accent": "215 38% 13%",
      "--sidebar-border": "215 32% 14%",
      "--glass-bg": "215 45% 10% / 0.6",
      "--glass-border": "215 30% 22% / 0.3",
      "--glass-heavy-bg": "215 48% 7% / 0.85",
      "--bg-glow": "200 85% 55%",
    },
  },
  {
    id: "ember",
    label: "Ember",
    icon: "🟠",
    vars: {
      "--background": "12 50% 5%",
      "--card": "12 40% 9%",
      "--popover": "12 40% 9%",
      "--secondary": "12 32% 13%",
      "--muted": "12 26% 16%",
      "--muted-foreground": "12 18% 48%",
      "--border": "12 28% 14%",
      "--input": "12 28% 14%",
      "--primary": "25 92% 55%",
      "--primary-foreground": "0 0% 100%",
      "--accent": "350 82% 55%",
      "--accent-foreground": "0 0% 100%",
      "--ring": "25 92% 55%",
      "--glow-primary": "25 92% 55%",
      "--glow-accent": "350 82% 55%",
      "--gradient-start": "25 92% 55%",
      "--gradient-end": "350 82% 55%",
      "--sidebar-background": "12 45% 6%",
      "--sidebar-primary": "25 92% 55%",
      "--sidebar-ring": "25 92% 55%",
      "--sidebar-accent": "12 32% 13%",
      "--sidebar-border": "12 28% 14%",
      "--glass-bg": "12 40% 10% / 0.6",
      "--glass-border": "12 26% 22% / 0.3",
      "--glass-heavy-bg": "12 42% 7% / 0.85",
      "--bg-glow": "25 92% 55%",
    },
  },
  {
    id: "mint",
    label: "Mint",
    icon: "🟢",
    vars: {
      "--background": "155 50% 4%",
      "--card": "155 40% 8%",
      "--popover": "155 40% 8%",
      "--secondary": "155 32% 12%",
      "--muted": "155 26% 15%",
      "--muted-foreground": "155 18% 45%",
      "--border": "155 28% 13%",
      "--input": "155 28% 13%",
      "--primary": "160 75% 50%",
      "--primary-foreground": "0 0% 100%",
      "--accent": "130 65% 55%",
      "--accent-foreground": "0 0% 100%",
      "--ring": "160 75% 50%",
      "--glow-primary": "160 75% 50%",
      "--glow-accent": "130 65% 55%",
      "--gradient-start": "160 75% 50%",
      "--gradient-end": "130 65% 55%",
      "--sidebar-background": "155 45% 5%",
      "--sidebar-primary": "160 75% 50%",
      "--sidebar-ring": "160 75% 50%",
      "--sidebar-accent": "155 32% 12%",
      "--sidebar-border": "155 28% 13%",
      "--glass-bg": "155 40% 9% / 0.6",
      "--glass-border": "155 26% 20% / 0.3",
      "--glass-heavy-bg": "155 42% 6% / 0.85",
      "--bg-glow": "160 75% 50%",
    },
  },
  {
    id: "rose",
    label: "Rose",
    icon: "🩷",
    vars: {
      "--background": "335 48% 5%",
      "--card": "335 38% 9%",
      "--popover": "335 38% 9%",
      "--secondary": "335 30% 13%",
      "--muted": "335 24% 16%",
      "--muted-foreground": "335 16% 48%",
      "--border": "335 26% 14%",
      "--input": "335 26% 14%",
      "--primary": "340 80% 60%",
      "--primary-foreground": "0 0% 100%",
      "--accent": "310 70% 55%",
      "--accent-foreground": "0 0% 100%",
      "--ring": "340 80% 60%",
      "--glow-primary": "340 80% 60%",
      "--glow-accent": "310 70% 55%",
      "--gradient-start": "340 80% 60%",
      "--gradient-end": "310 70% 55%",
      "--sidebar-background": "335 42% 6%",
      "--sidebar-primary": "340 80% 60%",
      "--sidebar-ring": "340 80% 60%",
      "--sidebar-accent": "335 30% 13%",
      "--sidebar-border": "335 26% 14%",
      "--glass-bg": "335 38% 10% / 0.6",
      "--glass-border": "335 24% 22% / 0.3",
      "--glass-heavy-bg": "335 40% 7% / 0.85",
      "--bg-glow": "340 80% 60%",
    },
  },
  {
    id: "midnight",
    label: "Midnight",
    icon: "⚪",
    vars: {
      "--background": "225 35% 4%",
      "--card": "225 28% 8%",
      "--popover": "225 28% 8%",
      "--secondary": "225 20% 12%",
      "--muted": "225 16% 15%",
      "--muted-foreground": "225 12% 45%",
      "--border": "225 18% 13%",
      "--input": "225 18% 13%",
      "--primary": "220 25% 75%",
      "--primary-foreground": "225 35% 6%",
      "--accent": "220 18% 58%",
      "--accent-foreground": "0 0% 100%",
      "--ring": "220 25% 75%",
      "--glow-primary": "220 25% 75%",
      "--glow-accent": "220 18% 58%",
      "--gradient-start": "220 25% 75%",
      "--gradient-end": "220 18% 58%",
      "--sidebar-background": "225 32% 5%",
      "--sidebar-primary": "220 25% 75%",
      "--sidebar-ring": "220 25% 75%",
      "--sidebar-accent": "225 20% 12%",
      "--sidebar-border": "225 18% 13%",
      "--glass-bg": "225 28% 9% / 0.6",
      "--glass-border": "225 18% 18% / 0.3",
      "--glass-heavy-bg": "225 30% 6% / 0.85",
      "--bg-glow": "220 25% 75%",
    },
  },
  {
    id: "golden",
    label: "Golden",
    icon: "🟡",
    vars: {
      "--background": "38 48% 4%",
      "--card": "38 38% 8%",
      "--popover": "38 38% 8%",
      "--secondary": "38 30% 12%",
      "--muted": "38 24% 15%",
      "--muted-foreground": "38 16% 45%",
      "--border": "38 26% 13%",
      "--input": "38 26% 13%",
      "--primary": "45 88% 55%",
      "--primary-foreground": "38 48% 6%",
      "--accent": "30 82% 50%",
      "--accent-foreground": "0 0% 100%",
      "--ring": "45 88% 55%",
      "--glow-primary": "45 88% 55%",
      "--glow-accent": "30 82% 50%",
      "--gradient-start": "45 88% 55%",
      "--gradient-end": "30 82% 50%",
      "--sidebar-background": "38 42% 5%",
      "--sidebar-primary": "45 88% 55%",
      "--sidebar-ring": "45 88% 55%",
      "--sidebar-accent": "38 30% 12%",
      "--sidebar-border": "38 26% 13%",
      "--glass-bg": "38 38% 9% / 0.6",
      "--glass-border": "38 24% 18% / 0.3",
      "--glass-heavy-bg": "38 40% 6% / 0.85",
      "--bg-glow": "45 88% 55%",
    },
  },
];

interface AppThemeContextType {
  themeId: AppThemeId;
  setThemeId: (id: AppThemeId) => void;
}

const AppThemeContext = createContext<AppThemeContextType>({
  themeId: "purple",
  setThemeId: () => {},
});

export function AppThemeProvider({ children }: { children: ReactNode }) {
  const [themeId, setThemeId] = useState<AppThemeId>(() => {
    return (localStorage.getItem("app-theme") as AppThemeId) || "purple";
  });

  useEffect(() => {
    localStorage.setItem("app-theme", themeId);
    const theme = APP_THEMES.find((t) => t.id === themeId) || APP_THEMES[0];
    const root = document.documentElement;
    Object.entries(theme.vars).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });
  }, [themeId]);

  return (
    <AppThemeContext.Provider value={{ themeId, setThemeId }}>
      {children}
    </AppThemeContext.Provider>
  );
}

export const useAppTheme = () => useContext(AppThemeContext);
