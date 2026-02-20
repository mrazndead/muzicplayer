import { Home, Search, Heart, Volume2 } from "lucide-react";

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
    <nav className={`fixed left-0 right-0 z-40 glass-heavy border-t border-border/50 transition-all ${hasPlayer ? "bottom-[84px]" : "bottom-[20px]"}`}>
      <div className="flex items-center justify-around max-w-screen-sm mx-auto py-1">
        {tabs.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center gap-0.5 py-2 px-6 transition-all duration-200 relative
                ${active ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
            >
              <tab.icon className={`w-5 h-5 ${active ? "drop-shadow-[0_0_6px_hsl(var(--primary)/0.5)]" : ""}`} />
              <span className="text-[10px] font-medium">{tab.label}</span>
              {tab.id === "favorites" && favCount > 0 && (
                <span className="absolute top-1 right-3 w-4 h-4 rounded-full gradient-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center">
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
