import { Home, Search, Heart, Music } from "lucide-react";

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
    <nav className={`fixed left-0 right-0 z-40 glass border-t border-border transition-all ${hasPlayer ? "bottom-[60px]" : "bottom-0"}`}>
      <div className="flex items-center justify-around max-w-screen-sm mx-auto">
        {tabs.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center gap-0.5 py-2 px-4 transition-colors relative
                ${active ? "text-primary" : "text-muted-foreground"}`}
            >
              <tab.icon className={`w-5 h-5 ${active ? "" : ""}`} />
              <span className="text-[10px] font-medium tracking-wide">{tab.label}</span>
              {tab.id === "favorites" && favCount > 0 && (
                <span className="absolute top-1.5 right-2 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center">
                  {favCount > 9 ? "9+" : favCount}
                </span>
              )}
              {active && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
