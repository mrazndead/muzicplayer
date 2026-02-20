import { useAppTheme, APP_THEMES } from "@/contexts/AppThemeContext";

export function ThemeSwitcher() {
  const { themeId, setThemeId } = useAppTheme();

  return (
    <div className="flex items-center gap-1">
      {APP_THEMES.map((t) => (
        <button
          key={t.id}
          onClick={() => setThemeId(t.id)}
          className={`w-7 h-7 rounded-full flex items-center justify-center text-sm transition-all ${
            themeId === t.id
              ? "ring-2 ring-primary scale-110"
              : "opacity-60 hover:opacity-100"
          }`}
          title={t.label}
        >
          {t.icon}
        </button>
      ))}
    </div>
  );
}
