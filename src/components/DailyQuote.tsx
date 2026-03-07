const QUOTES = [
  { text: "Music is the universal language of mankind.", author: "Longfellow" },
  { text: "Where words fail, music speaks.", author: "Hans Christian Andersen" },
  { text: "One good thing about music, when it hits you, you feel no pain.", author: "Bob Marley" },
  { text: "Music expresses that which cannot be said.", author: "Victor Hugo" },
  { text: "Without music, life would be a mistake.", author: "Nietzsche" },
  { text: "Music is the strongest form of magic.", author: "Marilyn Manson" },
  { text: "Music is the shorthand of emotion.", author: "Tolstoy" },
  { text: "Life is a song — sing it.", author: "Sai Baba" },
  { text: "Music is moonlight in the gloomy night of life.", author: "Jean Paul" },
  { text: "I think music in itself is healing.", author: "Billy Joel" },
  { text: "Music gives a soul to the universe.", author: "Plato" },
  { text: "Where there's music there can be no evil.", author: "Cervantes" },
  { text: "Music is a world within itself.", author: "Stevie Wonder" },
  { text: "The only truth is music.", author: "Jack Kerouac" },
  { text: "Music is the wine that fills the cup of silence.", author: "Robert Fripp" },
  { text: "Life seems to go on without effort when I am filled with music.", author: "George Eliot" },
  { text: "Music washes away the dust of everyday life.", author: "Art Blakey" },
  { text: "After silence, that which comes nearest to expressing the inexpressible is music.", author: "Aldous Huxley" },
  { text: "If music be the food of love, play on.", author: "Shakespeare" },
  { text: "Music is like a dream. One that I cannot hear.", author: "Beethoven" },
  { text: "Every life has a soundtrack.", author: "Jodi Picoult" },
  { text: "Music can change the world because it can change people.", author: "Bono" },
  { text: "To stop the flow of music would be like the stopping of time itself.", author: "Aaron Copland" },
  { text: "Music produces a kind of pleasure which human nature cannot do without.", author: "Confucius" },
  { text: "Music is the art of thinking with sounds.", author: "Jules Combarieu" },
  { text: "A painter paints pictures on canvas. But musicians paint their pictures on silence.", author: "Leopold Stokowski" },
  { text: "My heart, which is so full to overflowing, has often been solaced and refreshed by music.", author: "Luther" },
  { text: "Music is a higher revelation than all wisdom and philosophy.", author: "Beethoven" },
  { text: "Information is not knowledge. Knowledge is not wisdom. Wisdom is not truth. Truth is not beauty. Beauty is not love. Love is not music. Music is the best.", author: "Zappa" },
  { text: "Music is everybody's possession.", author: "John Lennon" },
  { text: "People haven't always been there for me but music always has.", author: "Taylor Swift" },
];

function getDailyQuote() {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  );
  return QUOTES[dayOfYear % QUOTES.length];
}

export const DailyQuote = () => {
  const quote = getDailyQuote();

  return (
    <p className="text-[10px] sm:text-xs text-muted-foreground/70 italic truncate max-w-[200px] sm:max-w-xs hidden min-[480px]:block">
      "{quote.text}" — <span className="text-muted-foreground/50">{quote.author}</span>
    </p>
  );
};
