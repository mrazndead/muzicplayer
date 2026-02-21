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
      "--background": "265 45% 8%",
      "--card": "265 38% 12%",
      "--popover": "265 38% 12%",
      "--secondary": "265 32% 16%",
      "--muted": "265 25% 19%",
      "--muted-foreground": "260 20% 55%",
      "--border": "265 28% 18%",
      "--input": "265 28% 18%",
      "--primary": "270 80% 65%",
      "--primary-foreground": "0 0% 100%",
      "--accent": "320 70% 55%",
      "--accent-foreground": "0 0% 100%",
      "--ring": "270 80% 65%",
      "--glow-primary": "270 80% 65%",
      "--glow-accent": "320 70% 55%",
      "--gradient-start": "270 80% 65%",
      "--gradient-end": "320 70% 55%",
      "--sidebar-background": "265 42% 9%",
      "--sidebar-primary": "270 80% 65%",
      "--sidebar-ring": "270 80% 65%",
      "--sidebar-accent": "265 32% 16%",
      "--sidebar-border": "265 28% 18%",
      "--glass-bg": "265 38% 13% / 0.75",
      "--glass-border": "265 25% 25% / 0.4",
      "--glass-heavy-bg": "265 40% 10% / 0.88",
      "--bg-glow": "270 80% 65%",
    },
  },
  {
    id: "ocean",
    label: "Ocean",
    icon: "🔵",
    vars: {
      "--background": "215 50% 7%",
      "--card": "215 42% 11%",
      "--popover": "215 42% 11%",
      "--secondary": "215 35% 15%",
      "--muted": "215 28% 18%",
      "--muted-foreground": "210 22% 52%",
      "--border": "215 30% 16%",
      "--input": "215 30% 16%",
      "--primary": "200 80% 55%",
      "--primary-foreground": "0 0% 100%",
      "--accent": "170 70% 50%",
      "--accent-foreground": "0 0% 100%",
      "--ring": "200 80% 55%",
      "--glow-primary": "200 80% 55%",
      "--glow-accent": "170 70% 50%",
      "--gradient-start": "200 80% 55%",
      "--gradient-end": "170 70% 50%",
      "--sidebar-background": "215 48% 8%",
      "--sidebar-primary": "200 80% 55%",
      "--sidebar-ring": "200 80% 55%",
      "--sidebar-accent": "215 35% 15%",
      "--sidebar-border": "215 30% 16%",
      "--glass-bg": "215 42% 12% / 0.75",
      "--glass-border": "215 28% 22% / 0.4",
      "--glass-heavy-bg": "215 45% 9% / 0.88",
      "--bg-glow": "200 80% 55%",
    },
  },
  {
    id: "ember",
    label: "Ember",
    icon: "🟠",
    vars: {
      "--background": "12 45% 7%",
      "--card": "12 38% 11%",
      "--popover": "12 38% 11%",
      "--secondary": "12 30% 15%",
      "--muted": "12 24% 18%",
      "--muted-foreground": "12 18% 50%",
      "--border": "12 26% 16%",
      "--input": "12 26% 16%",
      "--primary": "25 90% 55%",
      "--primary-foreground": "0 0% 100%",
      "--accent": "350 80% 55%",
      "--accent-foreground": "0 0% 100%",
      "--ring": "25 90% 55%",
      "--glow-primary": "25 90% 55%",
      "--glow-accent": "350 80% 55%",
      "--gradient-start": "25 90% 55%",
      "--gradient-end": "350 80% 55%",
      "--sidebar-background": "12 42% 8%",
      "--sidebar-primary": "25 90% 55%",
      "--sidebar-ring": "25 90% 55%",
      "--sidebar-accent": "12 30% 15%",
      "--sidebar-border": "12 26% 16%",
      "--glass-bg": "12 38% 12% / 0.75",
      "--glass-border": "12 24% 22% / 0.4",
      "--glass-heavy-bg": "12 40% 9% / 0.88",
      "--bg-glow": "25 90% 55%",
    },
  },
  {
    id: "mint",
    label: "Mint",
    icon: "🟢",
    vars: {
      "--background": "155 45% 6%",
      "--card": "155 38% 10%",
      "--popover": "155 38% 10%",
      "--secondary": "155 30% 14%",
      "--muted": "155 24% 17%",
      "--muted-foreground": "155 18% 48%",
      "--border": "155 26% 15%",
      "--input": "155 26% 15%",
      "--primary": "160 70% 50%",
      "--primary-foreground": "0 0% 100%",
      "--accent": "130 60% 55%",
      "--accent-foreground": "0 0% 100%",
      "--ring": "160 70% 50%",
      "--glow-primary": "160 70% 50%",
      "--glow-accent": "130 60% 55%",
      "--gradient-start": "160 70% 50%",
      "--gradient-end": "130 60% 55%",
      "--sidebar-background": "155 42% 7%",
      "--sidebar-primary": "160 70% 50%",
      "--sidebar-ring": "160 70% 50%",
      "--sidebar-accent": "155 30% 14%",
      "--sidebar-border": "155 26% 15%",
      "--glass-bg": "155 38% 11% / 0.75",
      "--glass-border": "155 24% 20% / 0.4",
      "--glass-heavy-bg": "155 40% 8% / 0.88",
      "--bg-glow": "160 70% 50%",
    },
  },
  {
    id: "rose",
    label: "Rose",
    icon: "🩷",
    vars: {
      "--background": "335 42% 7%",
      "--card": "335 35% 11%",
      "--popover": "335 35% 11%",
      "--secondary": "335 28% 15%",
      "--muted": "335 22% 18%",
      "--muted-foreground": "335 16% 50%",
      "--border": "335 24% 16%",
      "--input": "335 24% 16%",
      "--primary": "340 75% 60%",
      "--primary-foreground": "0 0% 100%",
      "--accent": "310 65% 55%",
      "--accent-foreground": "0 0% 100%",
      "--ring": "340 75% 60%",
      "--glow-primary": "340 75% 60%",
      "--glow-accent": "310 65% 55%",
      "--gradient-start": "340 75% 60%",
      "--gradient-end": "310 65% 55%",
      "--sidebar-background": "335 40% 8%",
      "--sidebar-primary": "340 75% 60%",
      "--sidebar-ring": "340 75% 60%",
      "--sidebar-accent": "335 28% 15%",
      "--sidebar-border": "335 24% 16%",
      "--glass-bg": "335 35% 12% / 0.75",
      "--glass-border": "335 22% 22% / 0.4",
      "--glass-heavy-bg": "335 38% 9% / 0.88",
      "--bg-glow": "340 75% 60%",
    },
  },
  {
    id: "midnight",
    label: "Midnight",
    icon: "⚪",
    vars: {
      "--background": "225 30% 5%",
      "--card": "225 24% 9%",
      "--popover": "225 24% 9%",
      "--secondary": "225 18% 13%",
      "--muted": "225 14% 16%",
      "--muted-foreground": "225 10% 48%",
      "--border": "225 16% 14%",
      "--input": "225 16% 14%",
      "--primary": "220 20% 75%",
      "--primary-foreground": "225 30% 8%",
      "--accent": "220 15% 60%",
      "--accent-foreground": "0 0% 100%",
      "--ring": "220 20% 75%",
      "--glow-primary": "220 20% 75%",
      "--glow-accent": "220 15% 60%",
      "--gradient-start": "220 20% 75%",
      "--gradient-end": "220 15% 60%",
      "--sidebar-background": "225 28% 6%",
      "--sidebar-primary": "220 20% 75%",
      "--sidebar-ring": "220 20% 75%",
      "--sidebar-accent": "225 18% 13%",
      "--sidebar-border": "225 16% 14%",
      "--glass-bg": "225 24% 10% / 0.75",
      "--glass-border": "225 16% 20% / 0.4",
      "--glass-heavy-bg": "225 26% 7% / 0.88",
      "--bg-glow": "220 20% 75%",
    },
  },
  {
    id: "golden",
    label: "Golden",
    icon: "🟡",
    vars: {
      "--background": "38 42% 6%",
      "--card": "38 35% 10%",
      "--popover": "38 35% 10%",
      "--secondary": "38 28% 14%",
      "--muted": "38 22% 17%",
      "--muted-foreground": "38 16% 48%",
      "--border": "38 24% 15%",
      "--input": "38 24% 15%",
      "--primary": "45 85% 55%",
      "--primary-foreground": "38 42% 8%",
      "--accent": "30 80% 50%",
      "--accent-foreground": "0 0% 100%",
      "--ring": "45 85% 55%",
      "--glow-primary": "45 85% 55%",
      "--glow-accent": "30 80% 50%",
      "--gradient-start": "45 85% 55%",
      "--gradient-end": "30 80% 50%",
      "--sidebar-background": "38 40% 7%",
      "--sidebar-primary": "45 85% 55%",
      "--sidebar-ring": "45 85% 55%",
      "--sidebar-accent": "38 28% 14%",
      "--sidebar-border": "38 24% 15%",
      "--glass-bg": "38 35% 11% / 0.75",
      "--glass-border": "38 22% 20% / 0.4",
      "--glass-heavy-bg": "38 38% 8% / 0.88",
      "--bg-glow": "45 85% 55%",
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
