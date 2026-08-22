import { Home, Shuffle, Heart, Library } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";

export type TabId = "home" | "favorites" | "library";

interface BottomTabsProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  onRandomPlay: () => void;
  favCount: number;
  hasPlayer: boolean;
}

export function BottomTabs({ activeTab, onTabChange, onRandomPlay, favCount, hasPlayer }: BottomTabsProps) {
  const [randomPressed, setRandomPressed] = useState(false);

  const handleRandomClick = () => {
    setRandomPressed(true);
    onRandomPlay();
    setTimeout(() => setRandomPressed(false), 600);
  };

  const tabBtn = (id: TabId, Icon: typeof Home, label: string, badge?: number) => (
    <button
      onClick={() => onTabChange(id)}
      className={`flex flex-col items-center gap-0.5 py-2 px-4 transition-all duration-300 relative rounded-full
        ${activeTab === id ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
    >
      {activeTab === id && (
        <motion.div
          layoutId="tab-bg"
          className="absolute inset-0 gradient-primary opacity-20 rounded-full"
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        />
      )}
      <Icon
        className={`w-5 h-5 relative z-10 stroke-[1.5] ${
          activeTab === id ? "text-foreground drop-shadow-[0_0_8px_hsl(var(--primary)/0.7)]" : "text-muted-foreground"
        }`}
      />
      <span className="text-[10px] font-medium relative z-10 text-foreground/80">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="absolute top-0.5 right-1 w-4 h-4 rounded-full gradient-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center z-10">
          {badge > 9 ? "9+" : badge}
        </span>
      )}
    </button>
  );


  return (
    <nav className={`fixed left-3 right-3 z-40 transition-all ${hasPlayer ? "bottom-[90px]" : "bottom-[20px]"}`}>
      <div className="flex items-center justify-around max-w-sm mx-auto py-2 px-2 rounded-full glass-heavy border border-border shadow-2xl">
        {tabBtn("home", Home, "Home")}

        {/* Random */}
        <motion.button
          onClick={handleRandomClick}
          animate={randomPressed ? { scale: [1, 1.15, 1], rotate: [0, 180, 360] } : {}}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className={`flex flex-col items-center gap-0.5 py-2 px-4 transition-all duration-300 relative rounded-xl
            ${randomPressed ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
        >
          {randomPressed && (
            <motion.div
              initial={{ scale: 0, opacity: 0.5 }}
              animate={{ scale: 2, opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0 gradient-primary rounded-full"
            />
          )}
          <Shuffle className={`w-5 h-5 relative z-10 stroke-[1.5] transition-colors ${randomPressed ? "text-primary" : "text-muted-foreground"}`} />
          <span className="text-[10px] font-medium relative z-10 text-muted-foreground">Random</span>
        </motion.button>

        {tabBtn("library", Library, "Library")}
        {tabBtn("favorites", Heart, "Liked", favCount)}
      </div>
    </nav>
  );
}

