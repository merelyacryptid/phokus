// Inspiring and encouraging quotes for mindful focus
// Strict requirement: NO EMOJIS! Only clean, poetic, encouraging words.

export const ENCOURAGING_QUOTES: string[] = [
  "Success comes to those who never stop learning",
  "One gentle breath, one focused step at a time",
  "Little by little, a little becomes a lot",
  "Quiet progress is still progress",
  "Your dedication today is shaping your tomorrow",
  "Be kind to your mind while you create",
  "Focus on the step in front of you, not the whole mountain",
  "Small daily habits whisper big future results",
  "Calm minds build remarkable things",
  "Trust the beauty of steady, quiet growth",
  "Rest when you need, resume when you are ready",
  "Your focus is your superpower. Protect it gently",
  "Every minute invested in learning is never wasted",
  "Flow like water, steady like a mountain",
  "Breathe in calm purpose, breathe out doubt",
  "Great things are made of small things done with care",
  "Patience with yourself is the highest form of discipline",
  "Cherish the stillness of this very moment"
];

export function getRandomQuote(exclude?: string): string {
  const filtered = exclude ? ENCOURAGING_QUOTES.filter(q => q !== exclude) : ENCOURAGING_QUOTES;
  const index = Math.floor(Math.random() * filtered.length);
  return filtered[index];
}

