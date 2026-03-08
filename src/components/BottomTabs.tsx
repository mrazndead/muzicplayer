import { Home, Shuffle, Heart } from "lucide-react";
import { motion } from "framer-motion";

export type TabId = "home" | "favorites";

interface BottomTabsProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  onRandomPlay: () => void;
  favCount: number;
  hasPlayer: boolean;
}

export function BottomTabs({ activeTab, onTabChange, onRandomPlay, favCount, hasPlayer }: BottomTabsProps) {
  return (
    <nav className={`fixed left-3 right-3 z-40 transition-all ${hasPlayer ? "bottom-[90px]" : "bottom-[20px]"}`}>
      <div className="glass-card flex items-center justify-around max-w-sm mx-auto py-1.5 px-2 neon-border rounded-2xl">
        {/* Home */}
        <button
          onClick={() => onTabChange("home")}
          className={`flex flex-col items-center gap-0.5 py-2 px-6 transition-all duration-300 relative rounded-xl
            ${activeTab === "home" ? "text-white" : "text-white/60 hover:text-white/80"}`}
        >
          {activeTab === "home" && (
            <motion.div
              layoutId="tab-bg"
              className="absolute inset-0 gradient-primary opacity-15 rounded-xl"
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
          )}
          <Home className={`w-5 h-5 relative z-10 stroke-[1.5] ${activeTab === "home" ? "text-white drop-shadow-[0_0_8px_hsl(var(--primary)/0.6)]" : "text-white/70"}`} />
          <span className="text-[10px] font-medium relative z-10 text-white/80">Home</span>
        </button>

        {/* Random */}
        <button
          onClick={onRandomPlay}
          className="flex flex-col items-center gap-0.5 py-2 px-6 transition-all duration-300 relative rounded-xl text-white/60 hover:text-white/80 active:scale-95"
        >
          <Shuffle className="w-5 h-5 relative z-10 stroke-[1.5] text-white/70" />
          <span className="text-[10px] font-medium relative z-10 text-white/80">Random</span>
        </button>

        {/* Liked */}
        <button
          onClick={() => onTabChange("favorites")}
          className={`flex flex-col items-center gap-0.5 py-2 px-6 transition-all duration-300 relative rounded-xl
            ${activeTab === "favorites" ? "text-white" : "text-white/60 hover:text-white/80"}`}
        >
          {activeTab === "favorites" && (
            <motion.div
              layoutId="tab-bg"
              className="absolute inset-0 gradient-primary opacity-15 rounded-xl"
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
          )}
          <Heart className={`w-5 h-5 relative z-10 stroke-[1.5] ${activeTab === "favorites" ? "text-white drop-shadow-[0_0_8px_hsl(var(--primary)/0.6)]" : "text-white/70"}`} />
          <span className="text-[10px] font-medium relative z-10 text-white/80">Liked</span>
          {favCount > 0 && (
            <span className="absolute top-0.5 right-2 w-4 h-4 rounded-full gradient-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center z-10">
              {favCount > 9 ? "9+" : favCount}
            </span>
          )}
        </button>
      </div>
    </nav>
  );
}