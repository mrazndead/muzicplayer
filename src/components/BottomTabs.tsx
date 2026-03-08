import { Home, Search, Heart } from "lucide-react";
import { motion } from "framer-motion";

export type TabId = "home" | "search" | "favorites";

interface BottomTabsProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  favCount: number;
  hasPlayer: boolean;
}

const tabs = [
  { id: "home" as TabId, label: "Home", icon: Home },
  { id: "search" as TabId, label: "Search", icon: Search },
  { id: "favorites" as TabId, label: "Liked", icon: Heart },
];

export function BottomTabs({ activeTab, onTabChange, favCount, hasPlayer }: BottomTabsProps) {
  return (
    <nav className="fixed left-3 right-3 z-40 bottom-3">
      <div className="glass-card flex items-center justify-around max-w-sm mx-auto py-1.5 px-2 neon-border rounded-2xl">
        {tabs.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center gap-0.5 py-2 px-6 transition-all duration-300 relative rounded-xl
                ${active ? "text-white" : "text-white/60 hover:text-white/80"}`}
            >
              {active && (
                <motion.div
                  layoutId="tab-bg"
                  className="absolute inset-0 gradient-primary opacity-15 rounded-xl"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <tab.icon className={`w-5 h-5 relative z-10 stroke-[1.5] ${active ? "text-white drop-shadow-[0_0_8px_hsl(var(--primary)/0.6)]" : "text-white/70"}`} />
              <span className="text-[10px] font-medium relative z-10 text-white/80">{tab.label}</span>
              {tab.id === "favorites" && favCount > 0 && (
                <span className="absolute top-0.5 right-2 w-4 h-4 rounded-full gradient-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center z-10">
                  {favCount > 9 ? "9+" : favCount}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
