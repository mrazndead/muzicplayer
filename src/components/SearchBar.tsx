import { useState } from "react";
import { Search, X } from "lucide-react";

interface SearchBarProps {
  onSearch: (query: string) => void;
  isLoading?: boolean;
}

export function SearchBar({ onSearch, isLoading }: SearchBarProps) {
  const [value, setValue] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) onSearch(value.trim());
  };

  const handleClear = () => {
    setValue("");
  };

  return (
    <form onSubmit={handleSubmit} className="relative w-full max-w-xl mx-auto">
      <div className="relative bg-secondary/80 rounded-2xl overflow-hidden border border-border/50 focus-within:border-primary/40 transition-colors">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Search tracks, artists, genres..."
          className="w-full bg-transparent py-3.5 pl-11 pr-11 text-foreground placeholder:text-muted-foreground outline-none font-body text-sm"
        />
        {value && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      {isLoading && (
        <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-muted rounded-full overflow-hidden">
          <div className="h-full w-1/3 gradient-primary rounded-full animate-pulse-glow" />
        </div>
      )}
    </form>
  );
}
