import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type AppThemeId = "purple" | "ocean" | "ember";

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
      "--primary": "270 80% 65%",
      "--accent": "320 70% 55%",
      "--ring": "270 80% 65%",
      "--glow-primary": "270 80% 65%",
      "--glow-accent": "320 70% 55%",
      "--gradient-start": "270 80% 65%",
      "--gradient-end": "320 70% 55%",
      "--sidebar-primary": "270 80% 65%",
      "--sidebar-ring": "270 80% 65%",
    },
  },
  {
    id: "ocean",
    label: "Ocean",
    icon: "🔵",
    vars: {
      "--primary": "200 80% 55%",
      "--accent": "170 70% 50%",
      "--ring": "200 80% 55%",
      "--glow-primary": "200 80% 55%",
      "--glow-accent": "170 70% 50%",
      "--gradient-start": "200 80% 55%",
      "--gradient-end": "170 70% 50%",
      "--sidebar-primary": "200 80% 55%",
      "--sidebar-ring": "200 80% 55%",
    },
  },
  {
    id: "ember",
    label: "Ember",
    icon: "🟠",
    vars: {
      "--primary": "25 90% 55%",
      "--accent": "350 80% 55%",
      "--ring": "25 90% 55%",
      "--glow-primary": "25 90% 55%",
      "--glow-accent": "350 80% 55%",
      "--gradient-start": "25 90% 55%",
      "--gradient-end": "350 80% 55%",
      "--sidebar-primary": "25 90% 55%",
      "--sidebar-ring": "25 90% 55%",
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
