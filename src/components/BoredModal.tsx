import React, { useState } from 'react';
import type { ThemeMode } from '../types';
import {
  Gamepad2,
  X,
  ExternalLink,
  Zap,
  RotateCcw,
  Search
} from 'lucide-react';

interface BoredModalProps {
  isOpen: boolean;
  theme: ThemeMode;
  onClose: () => void;
}

interface GameItem {
  id: string;
  title: string;
  category: 'word' | 'arcade' | 'puzzle' | 'quiz' | 'typing' | 'chat';
  categoryLabel: string;
  description: string;
  url: string;
  highlight?: boolean;
}

const BUZZFEED_QUIZZES = [
  'https://www.buzzfeed.com/quizzes',
  'https://www.buzzfeed.com/audreyworboys/which-type-of-pasta-are-you-quiz',
  'https://www.buzzfeed.com/mikespohr/which-decade-do-you-actually-belong-in',
  'https://www.buzzfeed.com/hannahmarder/which-studio-ghibli-food-matches-your-vibe',
  'https://www.buzzfeed.com/shelbyheinrich/pick-comfort-foods-for-a-movie-to-watch',
  'https://www.buzzfeed.com/tayloraowens/which-coffee-order-are-you-quiz',
  'https://www.buzzfeed.com/terripous/what-disney-sidekick-are-you',
  'https://www.buzzfeed.com/sarahaspler/which-interior-design-aesthetic-matches-your-personality',
  'https://www.buzzfeed.com/quizzes/personality',
  'https://www.buzzfeed.com/quizzes/trivia'
];

const GAMES: GameItem[] = [
  {
    id: 'monkeytype',
    title: 'Monkeytype',
    category: 'typing',
    categoryLabel: 'Typing Test',
    description: 'Customizable, aesthetic typing speed test to test and train your WPM and accuracy.',
    url: 'https://monkeytype.com',
    highlight: true,
  },
  {
    id: 'wordle',
    title: 'Wordle',
    category: 'word',
    categoryLabel: 'Word Game',
    description: 'The viral daily 5-letter word guessing game by The New York Times.',
    url: 'https://www.nytimes.com/games/wordle/index.html',
    highlight: true,
  },
  {
    id: 'connections',
    title: 'Connections',
    category: 'word',
    categoryLabel: 'Word Puzzle',
    description: 'Group four words that share a common secret category without making 4 mistakes.',
    url: 'https://www.nytimes.com/games/connections',
    highlight: true,
  },
  {
    id: 'krillion',
    title: 'Krillion',
    category: 'word',
    categoryLabel: 'Context Puzzle',
    description: 'Answer each prompt with an uncommon or niche response. The nicher your answer, the deeper you dive.',
    url: 'https://krillion.io/',
    highlight: true,
  },
  {
    id: 'level-devil',
    title: 'Level Devil',
    category: 'arcade',
    categoryLabel: 'Troll Platformer',
    description: 'A deviously tricky platformer where floors drop, spikes appear, and portals deceive you.',
    url: 'https://poki.com/en/g/level-devil',
    highlight: true,
  },
  {
    id: 'password-game',
    title: 'The Password Game',
    category: 'puzzle',
    categoryLabel: 'Absurdist Puzzle',
    description: 'Pick a password that satisfies increasingly chaotic, brilliant rules by Neal Agarwal.',
    url: 'https://neal.fun/password-game/',
  },
  {
    id: 'ducktype',
    title: 'DuckType',
    category: 'typing',
    categoryLabel: 'Typing Test',
    description: 'quality typing practice, purpose-built for real code',
    url: 'https://ducktype-ten.vercel.app/',
    highlight: true,
  },
  {
    id: 'human-or-not',
    title: 'Human Or Not',
    category: 'chat',
    categoryLabel: 'Turing Test',
    description: 'A social turing game where you decide if the other person is a bot or human.',
    url: 'https://humanornot.so/',
  },
  {
    id: 'infinite-craft',
    title: 'Infinite Craft',
    category: 'puzzle',
    categoryLabel: 'Element Sandbox',
    description: 'Start with Water, Fire, Earth, and Wind — combine elements into anything in existence.',
    url: 'https://neal.fun/infinite-craft/',
  },
  {
    id: '2048',
    title: '2048',
    category: 'puzzle',
    categoryLabel: 'Slide Puzzle',
    description: 'Merge identical numerical tiles together on a 4x4 grid to reach the 2048 tile.',
    url: 'https://play2048.co/',
  },
  {
    id: 'quick-draw',
    title: 'Quick, Draw!',
    category: 'arcade',
    categoryLabel: 'AI Doodle',
    description: 'Can a Google neural network recognize your doodles in under 20 seconds?',
    url: 'https://quickdraw.withgoogle.com/',
  },
  {
    id: 'chrome-dino',
    title: 'T-Rex Dino Runner',
    category: 'arcade',
    categoryLabel: 'Endless Runner',
    description: 'The classic browser dinosaur jumping game to test your twitch reflexes.',
    url: 'https://elgoog.im/t-rex/',
  },
  {
    id: 'city-guesser',
    title: 'City Guesser',
    category: 'arcade',
    categoryLabel: 'Geo Trivia',
    description: 'Watch first-person walking videos from cities worldwide and guess where you are.',
    url: 'https://virtualvacation.us/guess',
  },
];

export const BoredModal: React.FC<BoredModalProps> = React.memo(({
  isOpen,
  theme,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'games' | 'reaction'>('games');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Interactive Reaction Test state
  const [reactionState, setReactionState] = useState<'idle' | 'waiting' | 'ready' | 'result'>('idle');
  const [reactionStartTime, setReactionStartTime] = useState<number>(0);
  const [reactionScore, setReactionScore] = useState<number | null>(null);
  const [reactionTimerId, setReactionTimerId] = useState<ReturnType<typeof setTimeout> | null>(null);

  const isMatteBlack = theme === 'matte-black';
  const isDark = theme === 'dark-mesh' || isMatteBlack;

  if (!isOpen) return null;

  const handleRandomQuiz = () => {
    const randomIndex = Math.floor(Math.random() * BUZZFEED_QUIZZES.length);
    const chosenUrl = BUZZFEED_QUIZZES[randomIndex];
    window.open(chosenUrl, '_blank', 'noopener,noreferrer');
  };

  const handleStartReaction = () => {
    setReactionScore(null);
    setReactionState('waiting');
    const delay = Math.floor(Math.random() * 2500) + 1500; // 1.5 - 4.0s
    const timer = setTimeout(() => {
      setReactionState('ready');
      setReactionStartTime(Date.now());
    }, delay);
    setReactionTimerId(timer);
  };

  const handleReactionClick = () => {
    if (reactionState === 'waiting') {
      // Clicked too early!
      if (reactionTimerId) clearTimeout(reactionTimerId);
      setReactionState('idle');
      setReactionScore(-1); // penalty for jumping the gun
    } else if (reactionState === 'ready') {
      const diff = Date.now() - reactionStartTime;
      setReactionScore(diff);
      setReactionState('result');
    }
  };

  const filteredGames = GAMES.filter((game) => {
    const matchesCategory = selectedCategory === 'all' || game.category === selectedCategory;
    const matchesSearch = game.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      game.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="absolute inset-0" onClick={onClose} />

      <div
        className={`relative w-full max-w-2xl max-h-[85vh] flex flex-col rounded-3xl p-6 shadow-2xl transition-all duration-300 ${isMatteBlack
          ? 'bg-[#0f0f12] border border-neutral-700/80 text-white shadow-2xl shadow-black/95'
          : isDark
            ? 'bg-[#150f1d]/95 border border-pink-500/25 text-white shadow-2xl shadow-pink-950/60'
            : 'bg-white/95 border border-pink-200 text-pink-950 shadow-2xl shadow-pink-200/50'
          }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-pink-500/20 mb-4 shrink-0">
          <div className="flex items-center space-x-3">
            <div
              className={`p-2.5 rounded-2xl flex items-center justify-center ${isMatteBlack
                ? 'bg-neutral-800 text-white border border-neutral-700'
                : isDark
                  ? 'bg-pink-600/20 text-pink-400 border border-pink-500/35 shadow-[0_0_12px_rgba(244,63,94,0.25)]'
                  : 'bg-pink-100 text-pink-600 border border-pink-200'
                }`}
            >
              <Gamepad2 size={22} className="stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-xl font-bold leading-none">Bored? Brain Break Games</h3>
              <p className={`text-xs mt-1 ${isMatteBlack ? 'text-neutral-400' : isDark ? 'text-pink-300/70' : 'text-pink-900/60'}`}>
                Quick fun games & quizzes to relax between study sessions
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-xl transition-colors ${isMatteBlack
              ? 'hover:bg-neutral-800 text-neutral-400 hover:text-white'
              : isDark
                ? 'hover:bg-white/10 text-pink-200/70 hover:text-pink-100'
                : 'hover:bg-pink-100 text-pink-800'
              }`}
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Switcher & Quiz Button */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4 shrink-0">
          <div className={`p-1 rounded-2xl flex items-center space-x-1 ${isMatteBlack ? 'bg-neutral-900 border border-neutral-800' : isDark ? 'bg-white/5 border border-pink-500/15' : 'bg-pink-50 border border-pink-100'
            }`}>
            <button
              onClick={() => setActiveTab('games')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'games'
                ? isMatteBlack
                  ? 'bg-neutral-800 text-white shadow-sm'
                  : isDark
                    ? 'bg-pink-600/30 text-pink-200 shadow-sm border border-pink-500/30'
                    : 'bg-white text-pink-700 shadow-sm border border-pink-200'
                : isMatteBlack
                  ? 'text-neutral-400 hover:text-white'
                  : isDark
                    ? 'text-pink-300/60 hover:text-pink-200'
                    : 'text-pink-900/60 hover:text-pink-950'
                }`}
            >
              All Mini-Games
            </button>
            <button
              onClick={() => setActiveTab('reaction')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${activeTab === 'reaction'
                ? isMatteBlack
                  ? 'bg-neutral-800 text-white shadow-sm'
                  : isDark
                    ? 'bg-pink-600/30 text-pink-200 shadow-sm border border-pink-500/30'
                    : 'bg-white text-pink-700 shadow-sm border border-pink-200'
                : isMatteBlack
                  ? 'text-neutral-400 hover:text-white'
                  : isDark
                    ? 'text-pink-300/60 hover:text-pink-200'
                    : 'text-pink-900/60 hover:text-pink-950'
                }`}
            >
              <Zap size={13} className="text-amber-400" />
              <span>Speed Test</span>
            </button>
          </div>

          {/* Random BuzzFeed Quiz Button */}
          <button
            onClick={handleRandomQuiz}
            title="Opens a random BuzzFeed personality or trivia quiz"
            className={`px-3.5 py-2 rounded-2xl text-xs font-bold flex items-center space-x-2 transition-all active:scale-95 shadow-sm ${isMatteBlack
              ? 'bg-white text-black hover:bg-neutral-200'
              : 'bg-gradient-to-r from-pink-600 to-rose-500 hover:from-pink-500 hover:to-rose-400 text-white shadow-[0_0_12px_rgba(244,63,94,0.35)]'
              }`}
          >
            <span>Take a Random Quiz</span>
            <ExternalLink size={12} className="opacity-80" />
          </button>
        </div>

        {/* Tab 1: Games Directory */}
        {activeTab === 'games' && (
          <div className="flex-1 flex flex-col min-h-0 space-y-3">
            {/* Search and Category Filter */}
            <div className="flex items-center space-x-2 shrink-0">
              <div className="relative flex-1">
                <Search size={14} className={`absolute left-3 top-2.5 ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search games (Wordle, Level Devil, 2048...)"
                  className={`w-full pl-8 pr-3 py-1.5 rounded-xl text-xs outline-none transition-all ${isMatteBlack
                    ? 'bg-neutral-900 text-white placeholder-neutral-500 border border-neutral-700 focus:border-white'
                    : isDark
                      ? 'bg-white/[0.06] text-pink-100 placeholder-pink-300/30 border border-pink-500/25 focus:border-pink-500'
                      : 'bg-pink-50 text-pink-950 placeholder-pink-900/40 border border-pink-200 focus:border-pink-500'
                    }`}
                />
              </div>

              <div className="flex items-center space-x-1 shrink-0 overflow-x-auto">
                {['all', 'word', 'arcade', 'puzzle', 'typing', 'chat'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold capitalize transition-all ${selectedCategory === cat
                      ? isMatteBlack
                        ? 'bg-neutral-800 text-white'
                        : isDark
                          ? 'bg-pink-600/30 text-pink-200 border border-pink-500/30'
                          : 'bg-pink-200 text-pink-800'
                      : isMatteBlack
                        ? 'text-neutral-400 hover:text-white'
                        : isDark
                          ? 'text-pink-300/60 hover:text-pink-200'
                          : 'text-pink-900/60 hover:text-pink-950'
                      }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Scrollable Grid of Game Cards */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {filteredGames.map((game) => (
                  <a
                    key={game.id}
                    href={game.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`group p-3.5 rounded-2xl border transition-all duration-200 flex flex-col justify-between hover:scale-[1.01] active:scale-[0.99] ${isMatteBlack
                      ? 'bg-neutral-900/70 hover:bg-neutral-900 border-neutral-800 hover:border-neutral-600 text-white'
                      : isDark
                        ? 'bg-white/[0.03] hover:bg-white/[0.07] border-pink-500/20 hover:border-pink-500/40 text-pink-100'
                        : 'bg-pink-50/70 hover:bg-pink-100/70 border-pink-200/80 hover:border-pink-300 text-pink-950'
                      }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center space-x-1.5">
                          <span className="font-bold text-sm tracking-tight group-hover:underline">
                            {game.title}
                          </span>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg uppercase tracking-wider ${isMatteBlack
                          ? 'bg-neutral-800 text-neutral-300'
                          : isDark
                            ? 'bg-pink-600/20 text-pink-300'
                            : 'bg-pink-200 text-pink-800'
                          }`}>
                          {game.categoryLabel}
                        </span>
                      </div>
                      <p className={`text-xs line-clamp-2 leading-relaxed ${isMatteBlack ? 'text-neutral-400' : isDark ? 'text-pink-200/70' : 'text-pink-900/70'
                        }`}>
                        {game.description}
                      </p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-dashed border-pink-500/15 flex items-center justify-between text-[11px] font-semibold opacity-70 group-hover:opacity-100">
                      <span>Play in new tab</span>
                      <ExternalLink size={12} className="transform transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Interactive Reaction Speed Test */}
        {activeTab === 'reaction' && (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
            {reactionState === 'idle' && (
              <div className="space-y-4 max-w-sm">
                <div className={`w-16 h-16 mx-auto rounded-3xl flex items-center justify-center ${isMatteBlack ? 'bg-neutral-800 text-white' : isDark ? 'bg-pink-600/20 text-pink-300' : 'bg-pink-100 text-pink-600'
                  }`}>
                  <Zap size={28} className="stroke-[2.2]" />
                </div>
                <div>
                  <h4 className="text-lg font-bold">Reflex Speed Challenge</h4>
                  <p className={`text-xs mt-1 ${isMatteBlack ? 'text-neutral-400' : isDark ? 'text-pink-300/70' : 'text-pink-900/60'}`}>
                    Click "Start", wait for the screen to turn <strong className="text-emerald-400">GREEN</strong>, then tap as fast as you can!
                  </p>
                  {reactionScore === -1 && (
                    <p className="text-xs text-rose-400 font-semibold mt-2">Too quick! Wait for green before clicking.</p>
                  )}
                </div>
                <button
                  onClick={handleStartReaction}
                  className={`px-6 py-2.5 rounded-2xl font-bold text-sm transition-all active:scale-95 shadow-md ${isMatteBlack ? 'bg-white text-black hover:bg-neutral-200' : 'bg-pink-600 hover:bg-pink-500 text-white'
                    }`}
                >
                  Start Challenge
                </button>
              </div>
            )}

            {reactionState === 'waiting' && (
              <div
                onClick={handleReactionClick}
                className="w-full h-56 rounded-3xl bg-rose-950/70 border-2 border-rose-500/60 flex flex-col items-center justify-center cursor-pointer select-none animate-pulse"
              >
                <p className="text-xl font-bold text-rose-200">Wait for GREEN...</p>
                <p className="text-xs text-rose-300/70 mt-1">Don't tap yet!</p>
              </div>
            )}

            {reactionState === 'ready' && (
              <div
                onClick={handleReactionClick}
                className="w-full h-56 rounded-3xl bg-emerald-600 border-2 border-emerald-400 flex flex-col items-center justify-center cursor-pointer select-none animate-bounce"
              >
                <p className="text-3xl font-extrabold text-white tracking-wide">TAP NOW!</p>
              </div>
            )}

            {reactionState === 'result' && (
              <div className="space-y-4 max-w-sm">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400">Your Reaction Time</p>
                  <p className="text-4xl font-black mt-1 tracking-tight text-white">{reactionScore} ms</p>
                  <p className={`text-xs mt-2 ${isMatteBlack ? 'text-neutral-400' : isDark ? 'text-pink-300/70' : 'text-pink-900/70'}`}>
                    {reactionScore && reactionScore < 220
                      ? '⚡ Godlike reflexes! Faster than 95% of players.'
                      : reactionScore && reactionScore < 280
                        ? '🔥 Great reflexes! Sharp and alert.'
                        : '🐇 Relaxed pace. Take a deep breath and try again!'}
                  </p>
                </div>
                <button
                  onClick={handleStartReaction}
                  className={`px-5 py-2 rounded-2xl font-bold text-xs flex items-center space-x-1.5 mx-auto transition-all active:scale-95 ${isMatteBlack ? 'bg-white text-black' : 'bg-pink-600 hover:bg-pink-500 text-white'
                    }`}
                >
                  <RotateCcw size={14} />
                  <span>Try Again</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
});
