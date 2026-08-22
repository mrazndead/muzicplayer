import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { LayoutGrid, Check } from "lucide-react";
import { UI_SKINS, useUiSkin } from "@/contexts/UiSkinContext";

export function SkinSwitcher() {
  const { skinId, setSkinId } = useUiSkin();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="p-2 rounded-xl glass-card text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Change interface style"
      >
        <LayoutGrid className="w-4 h-4" />
      </button>
      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -6 }}
              className="absolute top-full right-0 mt-2 w-60 p-2 glass-card z-50 space-y-1"
            >
              <p className="px-2 pt-1 pb-2 text-[10px] uppercase tracking-widest text-muted-foreground">
                Interface
              </p>
              {UI_SKINS.map((s) => {
                const active = s.id === skinId;
                return (
                  <button
                    key={s.id}
                    onClick={() => {
                      setSkinId(s.id);
                      setOpen(false);
                    }}
                    className={`w-full flex items-center gap-2.5 px-2 py-2 rounded-xl text-left transition-colors ${
                      active ? "bg-primary/15" : "hover:bg-foreground/5"
                    }`}
                  >
                    <span className="flex gap-0.5 shrink-0">
                      {s.swatch.map((c) => (
                        <span
                          key={c}
                          className="w-2.5 h-6 rounded-[3px] border border-foreground/10"
                          style={{ background: c }}
                        />
                      ))}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-xs font-semibold truncate">{s.label}</span>
                      <span className="block text-[10px] text-muted-foreground truncate">
                        {s.tagline}
                      </span>
                    </span>
                    {active && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
                  </button>
                );
              })}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
