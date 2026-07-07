import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const FALLBACK_QUOTES = [
  { text: "Music is the universal language of mankind.", author: "Longfellow" },
  { text: "Where words fail, music speaks.", author: "Hans Christian Andersen" },
  { text: "Without music, life would be a mistake.", author: "Nietzsche" },
  { text: "Music is the shorthand of emotion.", author: "Tolstoy" },
  { text: "One good thing about music, when it hits you, you feel no pain.", author: "Bob Marley" },
];

const CACHE_KEY = "pulse:daily-quote:v2";
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

interface Quote {
  text: string;
  author: string;
}
interface Cached {
  quote: Quote;
  fetchedAt: number;
}

function readCache(): Cached | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Cached;
  } catch {
    return null;
  }
}

function getFallback(): Quote {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  );
  return FALLBACK_QUOTES[dayOfYear % FALLBACK_QUOTES.length];
}

export const DailyQuote = () => {
  const cached = readCache();
  const [quote, setQuote] = useState<Quote>(cached?.quote ?? getFallback());

  useEffect(() => {
    const now = Date.now();
    if (cached && now - cached.fetchedAt < ONE_DAY_MS) return;

    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke("daily-quote");
        if (cancelled || error || !data?.text) return;
        const fresh: Quote = { text: data.text, author: data.author || "Unknown" };
        setQuote(fresh);
        localStorage.setItem(
          CACHE_KEY,
          JSON.stringify({ quote: fresh, fetchedAt: Date.now() } satisfies Cached)
        );
      } catch {
        // silent — keep fallback/cached quote
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <p className="text-[10px] sm:text-xs text-muted-foreground/70 italic flex-1 min-w-0 leading-snug">
      "{quote.text}" — <span className="text-muted-foreground/50">{quote.author}</span>
    </p>
  );
};
