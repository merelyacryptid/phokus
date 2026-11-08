import React, { useState } from 'react';
import type { ThemeMode } from '../types';
import { Headphones, CloudRain, Waves, Wind, Radio, Volume2, VolumeX, X, Square, Music, Play, ExternalLink } from 'lucide-react';
import { soundEngine } from '../utils/audio';

interface AmbientSoundModalProps {
  isOpen: boolean;
  theme: ThemeMode;
  onClose: () => void;
}

const STUDY_PLAYLISTS = [
  {
    title: 'Vintage Disney Dreamy Strings',
    url: 'https://youtu.be/ie2zSl6snvs?si=WJiz6VBEG7lNioCu',
    desc: 'Dreamy strings & classical orchestra'
  },
  {
    title: 'Fall Grounds at Hogwarts',
    url: 'https://www.youtube.com/watch?v=YpF6N-tL70Y&list=RDYpF6N-tL70Y&start_radio=1',
    desc: 'Hogwarts autumn ambient music'
  },
  {
    title: 'Dark Academia Exam Prep',
    url: 'https://www.youtube.com/watch?v=SllpB3W5f6s&list=RDSllpB3W5f6s&start_radio=1&t=9287s',
    desc: 'Deep study & exam prep playlist'
  },
  {
    title: 'Classical Music for Deadlines',
    url: 'https://www.youtube.com/watch?v=dwY7w0k3j2Y&list=RDdwY7w0k3j2Y&start_radio=1',
    desc: 'Fast rhythmic classical focus'
  },
  {
    title: 'Rain, Books and Coffee',
    url: 'https://youtu.be/R-bI0AhSyU0?si=OXkgA_rbF9-K1FPm',
    desc: 'Cozy rainy cafe lo-fi acoustic'
  },
  {
    title: 'Studio Ghibli Relaxing Concert',
    url: 'https://youtu.be/Njt1io9jakQ?si=mQD7gdZkJljezNAO',
    desc: 'Peaceful orchestral Ghibli soundtracks'
  },
];

export const AmbientSoundModal: React.FC<AmbientSoundModalProps> = React.memo(({
  isOpen,
  theme,
  onClose,
}) => {
  const [activeSound, setActiveSound] = useState<'rain' | 'stream' | 'pink-noise' | 'wind' | 'none'>(
    soundEngine.getActiveAmbient()
  );
  const [volume, setVolume] = useState(0.4);
  const isMatteBlack = theme === 'matte-black';
  const isDark = theme === 'dark-mesh' || isMatteBlack;

  if (!isOpen) return null;

  const handleSelectSound = (type: 'rain' | 'stream' | 'pink-noise' | 'wind') => {
    if (activeSound === type) {
      soundEngine.stopAmbient();
      setActiveSound('none');
    } else {
      soundEngine.startAmbient(type, volume);
      setActiveSound(type);
    }
  };

  const handleStop = () => {
    soundEngine.stopAmbient();
    setActiveSound('none');
  };

  const handleVolumeChange = (v: number) => {
    setVolume(v);
    soundEngine.setAmbientVolume(v);
  };

  const ambientOptions = [
    { id: 'rain', label: 'Gentle Rain', desc: 'Soft raindrops on window', icon: CloudRain },
    { id: 'stream', label: 'Forest Brook', desc: 'Steady calming stream', icon: Waves },
    { id: 'pink-noise', label: 'Pink Noise', desc: 'Deep focus acoustic balance', icon: Radio },
    { id: 'wind', label: 'Quiet Breeze', desc: 'Mild rustling leaves', icon: Wind },
  ] as const;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="absolute inset-0" onClick={onClose} />

      <div
        className={`relative w-full max-w-md max-h-[88vh] flex flex-col rounded-3xl p-5 sm:p-6 shadow-2xl transition-all duration-300 ${isDark
            ? 'bg-[#140a12]/95 border border-pink-500/25 text-white shadow-2xl shadow-pink-950/60'
            : 'bg-white/95 border border-pink-200 text-pink-950 shadow-pink-200/50'
          }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-pink-500/20 mb-3 shrink-0">
          <div className="flex items-center space-x-2.5">
            <div
              className={`p-2 rounded-xl ${isDark ? 'bg-pink-600/20 text-pink-400 border border-pink-500/30' : 'bg-pink-100 text-pink-600'
                }`}
            >
              <Headphones size={20} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold">Focus Audio & Music</h3>
              <p className={`text-xs ${isDark ? 'text-pink-300/60' : 'text-pink-900/60'}`}>
                Ambient noise & curated study playlists
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-white/10 text-pink-200/70 hover:text-pink-100' : 'hover:bg-pink-100 text-pink-800'
              }`}
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Container */}
        <div className="smooth-scroll-container flex-1 overflow-y-auto space-y-4 pr-1 -mr-1">
          {/* Ambient Sounds Options */}
          <div>
            <h4 className={`text-[11px] font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-pink-300/70' : 'text-pink-900/70'
              }`}>
              Ambient Nature Sounds
            </h4>

            <div className="space-y-2">
              {ambientOptions.map((opt) => {
                const Icon = opt.icon;
                const isPlaying = activeSound === opt.id;

                return (
                  <button
                    key={opt.id}
                    onClick={() => handleSelectSound(opt.id)}
                    className={`w-full flex items-center justify-between p-2.5 sm:p-3 rounded-2xl transition-all ${isPlaying
                        ? isDark
                          ? 'bg-pink-600/25 border border-pink-500/50 text-white shadow-[0_0_12px_rgba(244,63,94,0.3)]'
                          : 'bg-pink-200/90 border border-pink-400 text-pink-950 shadow-sm'
                        : isDark
                          ? 'bg-white/[0.04] hover:bg-pink-950/30 border border-pink-500/15 text-pink-100'
                          : 'bg-pink-50/70 hover:bg-pink-100/60 border border-pink-100 text-pink-900'
                      }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-xl ${isPlaying ? 'bg-pink-600 text-white shadow-[0_0_8px_rgba(244,63,94,0.5)]' : isDark ? 'bg-white/10 text-pink-300' : 'bg-white/80 text-pink-600'}`}>
                        <Icon size={17} />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-semibold">{opt.label}</p>
                        <p className={`text-xs ${isDark ? 'text-pink-300/50' : 'text-pink-900/50'}`}>{opt.desc}</p>
                      </div>
                    </div>

                    <div className="flex items-center">
                      {isPlaying ? (
                        <span className="flex space-x-1 items-end h-4">
                          <span className="w-1 h-3 bg-pink-400 animate-pulse rounded-full" />
                          <span className="w-1 h-4 bg-pink-500 animate-pulse rounded-full" />
                          <span className="w-1 h-2 bg-pink-400 animate-pulse rounded-full" />
                        </span>
                      ) : (
                        <span className={`text-xs ${isDark ? 'text-pink-400/60' : 'text-pink-900/40'}`}>Play</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Volume & Stop */}
            {activeSound !== 'none' && (
              <div className="space-y-3 pt-3 mt-3 border-t border-pink-500/20">
                <div className="flex items-center justify-between text-xs">
                  <span className={isDark ? 'text-pink-200/80' : 'text-pink-900/70'}>Ambient Volume</span>
                  <div className="flex items-center space-x-2 w-32">
                    {volume === 0 ? <VolumeX size={14} /> : <Volume2 size={14} />}
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={volume}
                      onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                      className="w-full accent-pink-500 cursor-pointer"
                    />
                  </div>
                </div>

                <button
                  onClick={handleStop}
                  className={`w-full py-2 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors ${isDark ? 'bg-white/10 hover:bg-white/15 text-pink-200' : 'bg-pink-100 hover:bg-pink-200 text-pink-950'
                    }`}
                >
                  <Square size={13} />
                  <span>Stop Ambient Sound</span>
                </button>
              </div>
            )}
          </div>

          {/* sarah's study music recs: */}
          <div className="pt-3 border-t border-pink-500/20">
            <div className="flex items-center space-x-2 mb-2.5">
              <Music size={15} className={isDark ? 'text-pink-400' : 'text-pink-600'} />
              <h4 className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-pink-300' : 'text-pink-900'
                }`}>
                sarah's study music recs:
              </h4>
            </div>

            <div className="space-y-2">
              {STUDY_PLAYLISTS.map((item) => (
                <a
                  key={item.url}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`group flex items-center justify-between p-2.5 rounded-2xl transition-all duration-150 border ${isMatteBlack
                      ? 'bg-neutral-900/70 hover:bg-neutral-800/90 border-neutral-800 hover:border-neutral-700 text-neutral-200'
                      : isDark
                        ? 'bg-white/[0.04] hover:bg-pink-950/40 border-pink-500/15 hover:border-pink-500/35 text-pink-100'
                        : 'bg-pink-50/70 hover:bg-pink-100/70 border-pink-100 hover:border-pink-300 text-pink-950'
                    }`}
                >
                  <div className="flex items-center space-x-2.5 min-w-0 pr-2">
                    <div className={`p-1.5 rounded-xl shrink-0 transition-colors ${isMatteBlack
                        ? 'bg-white/10 text-white group-hover:bg-white group-hover:text-black'
                        : isDark
                          ? 'bg-pink-600/20 text-pink-300 group-hover:bg-pink-600 group-hover:text-white'
                          : 'bg-pink-100 text-pink-600 group-hover:bg-pink-600 group-hover:text-white'
                      }`}>
                      <Play size={13} className="fill-current stroke-[2] ml-0.5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-semibold truncate group-hover:underline decoration-pink-400">
                        {item.title}
                      </p>
                      <p className={`text-[11px] truncate ${isDark ? 'text-pink-300/50' : 'text-pink-900/50'
                        }`}>
                        {item.desc}
                      </p>
                    </div>
                  </div>

                  <ExternalLink size={13} className={`shrink-0 opacity-40 group-hover:opacity-100 transition-opacity ${isDark ? 'text-pink-300' : 'text-pink-700'
                    }`} />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
