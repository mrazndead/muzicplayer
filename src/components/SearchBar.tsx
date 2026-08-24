import { useCallback, useEffect, useState } from "react";
import { Search, X, Clock } from "lucide-react";

interface SearchBarProps {
  onSearch: (query: string) => void;
  isLoading?: boolean;
}

const HISTORY_KEY = "pulse-search-history";
const HISTORY_LIMIT = 8;

function loadHistory(): string[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((q) => typeof q === "string").slice(0, HISTORY_LIMIT) : [];
  } catch {
    return [];
  }
}

export function SearchBar({ onSearch, isLoading }: SearchBarProps) {
  const [value, setValue] = useState("");
  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  const remember = useCallback((query: string) => {
    setHistory((prev) => {
      const next = [query, ...prev.filter((q) => q.toLowerCase() !== query.toLowerCase())].slice(0, HISTORY_LIMIT);
      try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
      } catch {
        /* storage unavailable — history stays in memory */
      }
      return next;
    });
  }, []);

  const submitQuery = useCallback(
    (query: string) => {
      const trimmed = query.trim();
      if (!trimmed) return;
      remember(trimmed);
      onSearch(trimmed);
    },
    [onSearch, remember]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitQuery(value);
  };

  const removeFromHistory = (query: string) => {
    setHistory((prev) => {
      const next = prev.filter((q) => q !== query);
      try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative rounded-2xl bg-white/[0.03] border border-white/[0.06] overflow-hidden focus-within:border-primary/40 focus-within:ring-1 focus-within:ring-primary/30 transition-all">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Search tracks, artists, genres…"
            className="w-full bg-transparent py-3 pl-11 pr-11 text-foreground placeholder:text-muted-foreground/70 outline-none font-body text-sm"
          />
          {value && (
            <button
              type="button"
              onClick={() => setValue("")}
              aria-label="Clear search"
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        {isLoading && (
          <div className="absolute bottom-0 left-6 right-6 h-0.5 bg-muted rounded-full overflow-hidden">
            <div className="h-full w-1/3 gradient-primary rounded-full animate-pulse-glow" />
          </div>
        )}
      </form>

      {history.length > 0 && (
        <div className="flex items-center gap-1.5 mt-2.5 overflow-x-auto scrollbar-hide">
          <Clock className="w-3 h-3 text-muted-foreground/60 flex-shrink-0" />
          {history.map((query) => (
            <span
              key={query}
              className="group flex items-center gap-1 pl-2.5 pr-1.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.06] flex-shrink-0"
            >
              <button
                type="button"
                onClick={() => {
                  setValue(query);
                  submitQuery(query);
                }}
                className="text-[11px] text-muted-foreground hover:text-foreground transition-colors max-w-[120px] truncate"
              >
                {query}
              </button>
              <button
                type="button"
                onClick={() => removeFromHistory(query)}
                aria-label={`Remove ${query} from recent searches`}
                className="text-muted-foreground/40 hover:text-foreground transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
