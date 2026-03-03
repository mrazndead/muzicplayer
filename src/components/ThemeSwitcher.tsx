import { useAppTheme, APP_THEMES } from "@/contexts/AppThemeContext";
import { Palette } from "lucide-react";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

export function ThemeSwitcher() {
  const { themeId, setThemeId } = useAppTheme();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="p-2 rounded-xl glass-card text-muted-foreground hover:text-foreground transition-colors"
      >
        <Palette className="w-4 h-4" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -5 }}
            className="absolute top-full right-0 mt-2 p-2 glass-card flex gap-1.5 z-50"
          >
            {APP_THEMES.map((t) => (
              <button
                key={t.id}
                onClick={() => { setThemeId(t.id); setOpen(false); }}
                className={`w-7 h-7 rounded-full flex items-center justify-center text-sm transition-all ${
                  themeId === t.id
                    ? "ring-2 ring-primary scale-110"
                    : "opacity-50 hover:opacity-100"
                }`}
                title={t.label}
              >
                {t.icon}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
