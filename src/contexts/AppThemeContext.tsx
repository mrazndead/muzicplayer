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
      "--background": "230 35% 7%",
      "--card": "230 30% 11%",
      "--popover": "230 30% 11%",
      "--secondary": "230 25% 14%",
      "--muted": "230 20% 16%",
      "--muted-foreground": "225 15% 50%",
      "--border": "230 20% 15%",
      "--input": "230 20% 15%",
      "--primary": "270 80% 65%",
      "--accent": "320 70% 55%",
      "--ring": "270 80% 65%",
      "--glow-primary": "270 80% 65%",
      "--glow-accent": "320 70% 55%",
      "--gradient-start": "270 80% 65%",
      "--gradient-end": "320 70% 55%",
      "--sidebar-background": "230 30% 8%",
      "--sidebar-primary": "270 80% 65%",
      "--sidebar-ring": "270 80% 65%",
      "--sidebar-accent": "230 25% 14%",
      "--sidebar-border": "230 20% 15%",
      "--glass-bg": "230 30% 12% / 0.7",
      "--glass-border": "230 20% 22% / 0.4",
    },
  },
  {
    id: "ocean",
    label: "Ocean",
    icon: "🔵",
    vars: {
      "--background": "210 40% 6%",
      "--card": "210 35% 10%",
      "--popover": "210 35% 10%",
      "--secondary": "210 30% 13%",
      "--muted": "210 25% 15%",
      "--muted-foreground": "205 20% 48%",
      "--border": "210 25% 14%",
      "--input": "210 25% 14%",
      "--primary": "200 80% 55%",
      "--accent": "170 70% 50%",
      "--ring": "200 80% 55%",
      "--glow-primary": "200 80% 55%",
      "--glow-accent": "170 70% 50%",
      "--gradient-start": "200 80% 55%",
      "--gradient-end": "170 70% 50%",
      "--sidebar-background": "210 38% 7%",
      "--sidebar-primary": "200 80% 55%",
      "--sidebar-ring": "200 80% 55%",
      "--sidebar-accent": "210 30% 13%",
      "--sidebar-border": "210 25% 14%",
      "--glass-bg": "210 35% 11% / 0.7",
      "--glass-border": "210 25% 20% / 0.4",
    },
  },
  {
    id: "ember",
    label: "Ember",
    icon: "🟠",
    vars: {
      "--background": "15 35% 6%",
      "--card": "15 28% 10%",
      "--popover": "15 28% 10%",
      "--secondary": "15 22% 13%",
      "--muted": "15 18% 15%",
      "--muted-foreground": "15 15% 48%",
      "--border": "15 20% 14%",
      "--input": "15 20% 14%",
      "--primary": "25 90% 55%",
      "--accent": "350 80% 55%",
      "--ring": "25 90% 55%",
      "--glow-primary": "25 90% 55%",
      "--glow-accent": "350 80% 55%",
      "--gradient-start": "25 90% 55%",
      "--gradient-end": "350 80% 55%",
      "--sidebar-background": "15 32% 7%",
      "--sidebar-primary": "25 90% 55%",
      "--sidebar-ring": "25 90% 55%",
      "--sidebar-accent": "15 22% 13%",
      "--sidebar-border": "15 20% 14%",
      "--glass-bg": "15 28% 11% / 0.7",
      "--glass-border": "15 20% 20% / 0.4",
    },
  },
  {
    id: "mint",
    label: "Mint",
    icon: "🟢",
    vars: {
      "--background": "160 35% 5%",
      "--card": "160 28% 9%",
      "--popover": "160 28% 9%",
      "--secondary": "160 22% 12%",
      "--muted": "160 18% 14%",
      "--muted-foreground": "160 15% 45%",
      "--border": "160 20% 13%",
      "--input": "160 20% 13%",
      "--primary": "160 70% 50%",
      "--accent": "130 60% 55%",
      "--ring": "160 70% 50%",
      "--glow-primary": "160 70% 50%",
      "--glow-accent": "130 60% 55%",
      "--gradient-start": "160 70% 50%",
      "--gradient-end": "130 60% 55%",
      "--sidebar-background": "160 32% 6%",
      "--sidebar-primary": "160 70% 50%",
      "--sidebar-ring": "160 70% 50%",
      "--sidebar-accent": "160 22% 12%",
      "--sidebar-border": "160 20% 13%",
      "--glass-bg": "160 28% 10% / 0.7",
      "--glass-border": "160 20% 18% / 0.4",
    },
  },
  {
    id: "rose",
    label: "Rose",
    icon: "🩷",
    vars: {
      "--background": "340 30% 6%",
      "--card": "340 25% 10%",
      "--popover": "340 25% 10%",
      "--secondary": "340 20% 13%",
      "--muted": "340 16% 15%",
      "--muted-foreground": "340 12% 48%",
      "--border": "340 18% 14%",
      "--input": "340 18% 14%",
      "--primary": "340 75% 60%",
      "--accent": "310 65% 55%",
      "--ring": "340 75% 60%",
      "--glow-primary": "340 75% 60%",
      "--glow-accent": "310 65% 55%",
      "--gradient-start": "340 75% 60%",
      "--gradient-end": "310 65% 55%",
      "--sidebar-background": "340 28% 7%",
      "--sidebar-primary": "340 75% 60%",
      "--sidebar-ring": "340 75% 60%",
      "--sidebar-accent": "340 20% 13%",
      "--sidebar-border": "340 18% 14%",
      "--glass-bg": "340 25% 11% / 0.7",
      "--glass-border": "340 18% 20% / 0.4",
    },
  },
  {
    id: "midnight",
    label: "Midnight",
    icon: "⚪",
    vars: {
      "--background": "220 20% 4%",
      "--card": "220 15% 8%",
      "--popover": "220 15% 8%",
      "--secondary": "220 12% 11%",
      "--muted": "220 10% 14%",
      "--muted-foreground": "220 8% 45%",
      "--border": "220 12% 12%",
      "--input": "220 12% 12%",
      "--primary": "220 15% 75%",
      "--accent": "220 10% 60%",
      "--ring": "220 15% 75%",
      "--glow-primary": "220 15% 75%",
      "--glow-accent": "220 10% 60%",
      "--gradient-start": "220 15% 75%",
      "--gradient-end": "220 10% 60%",
      "--sidebar-background": "220 18% 5%",
      "--sidebar-primary": "220 15% 75%",
      "--sidebar-ring": "220 15% 75%",
      "--sidebar-accent": "220 12% 11%",
      "--sidebar-border": "220 12% 12%",
      "--glass-bg": "220 15% 9% / 0.7",
      "--glass-border": "220 12% 18% / 0.4",
    },
  },
  {
    id: "golden",
    label: "Golden",
    icon: "🟡",
    vars: {
      "--background": "40 30% 5%",
      "--card": "40 25% 9%",
      "--popover": "40 25% 9%",
      "--secondary": "40 20% 12%",
      "--muted": "40 16% 14%",
      "--muted-foreground": "40 12% 45%",
      "--border": "40 18% 13%",
      "--input": "40 18% 13%",
      "--primary": "45 85% 55%",
      "--accent": "30 80% 50%",
      "--ring": "45 85% 55%",
      "--glow-primary": "45 85% 55%",
      "--glow-accent": "30 80% 50%",
      "--gradient-start": "45 85% 55%",
      "--gradient-end": "30 80% 50%",
      "--sidebar-background": "40 28% 6%",
      "--sidebar-primary": "45 85% 55%",
      "--sidebar-ring": "45 85% 55%",
      "--sidebar-accent": "40 20% 12%",
      "--sidebar-border": "40 18% 13%",
      "--glass-bg": "40 25% 10% / 0.7",
      "--glass-border": "40 18% 18% / 0.4",
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
