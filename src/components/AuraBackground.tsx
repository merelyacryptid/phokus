import React from 'react';
import type { ThemeMode } from '../types';

interface AuraBackgroundProps {
  theme: ThemeMode;
}

export const AuraBackground: React.FC<AuraBackgroundProps> = ({ theme }) => {
  const isDark = theme === 'dark-mesh';

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none select-none z-0">
      {isDark ? (
        /* Dark Mode: Ethereal Luminous Pink & Orchid Aura Plume against Deep Midnight (Matching Image 2) */
        <div className="absolute inset-0 bg-[#05040a]">
          {/* Deep ambient dark indigo foundation */}
          <div className="absolute inset-0 bg-radial from-[#130924]/60 via-[#07050d] to-[#040308]" />

          {/* Central flowing luminous aura plume (matching the sinuous shape in Image 2) */}
          <div className="absolute inset-0 flex items-center justify-center">
            {/* Main radiant fuchsia/pink vertical flow */}
            <div 
              className="absolute w-[520px] sm:w-[680px] h-[120vh] rounded-[45%] opacity-80 blur-[90px] sm:blur-[125px] transform -rotate-[22deg] animate-aura-dark-main"
              style={{
                background: 'linear-gradient(135deg, rgba(236,72,153,0.92) 0%, rgba(219,39,119,0.85) 35%, rgba(168,85,247,0.75) 70%, rgba(79,70,229,0.45) 100%)',
              }}
            />

            {/* Glowing inner core of electric rose-pink */}
            <div 
              className="absolute w-[360px] sm:w-[480px] h-[95vh] rounded-[48%] opacity-85 blur-[70px] sm:blur-[95px] transform -rotate-[15deg] animate-aura-dark-core"
              style={{
                background: 'linear-gradient(180deg, rgba(251,113,133,0.9) 0%, rgba(244,63,94,0.95) 45%, rgba(217,70,239,0.8) 85%, transparent 100%)',
              }}
            />

            {/* Deep violet-orchid secondary veil curving along the side */}
            <div 
              className="absolute -right-16 top-1/4 w-[500px] h-[90vh] rounded-[52%] opacity-65 blur-[110px] animate-aura-dark-side"
              style={{
                background: 'radial-gradient(circle, rgba(147,51,234,0.7) 0%, rgba(88,28,135,0.5) 50%, transparent 80%)',
              }}
            />

            {/* Bottom-left grounding deep magenta aura */}
            <div 
              className="absolute -left-24 -bottom-20 w-[600px] h-[70vh] rounded-[50%] opacity-70 blur-[120px] animate-aura-dark-glow"
              style={{
                background: 'radial-gradient(circle, rgba(190,24,93,0.65) 0%, rgba(131,24,67,0.4) 60%, transparent 85%)',
              }}
            />
          </div>
        </div>
      ) : (
        /* Light Mode: Sinuous Silky Cream & Strawberry Aura Gradient (Matching Image 1) */
        <div className="absolute inset-0 bg-[#fff5ea]">
          {/* Base soft warmth */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#fff0f3] via-[#fff5ea] to-[#fce7f3]" />

          {/* Flowing silk aura ribbons (matching diagonal waves in Image 1) */}
          <div className="absolute inset-0 flex items-center justify-center">
            {/* Wave 1: Soft Strawberry Blossom Pink */}
            <div 
              className="absolute -top-32 -left-32 w-[750px] h-[95vh] rounded-[45%_55%_65%_35%] opacity-75 blur-[95px] sm:blur-[120px] transform rotate-[35deg] animate-aura-light-pink"
              style={{
                background: 'linear-gradient(135deg, #f472b6 0%, #fb7185 45%, #fda4af 85%, transparent 100%)',
              }}
            />

            {/* Wave 2: Sinuous Buttercream Vanilla Ribbons */}
            <div 
              className="absolute top-1/4 left-1/3 w-[620px] h-[85vh] rounded-[60%_40%_45%_55%] opacity-85 blur-[85px] sm:blur-[110px] transform -rotate-[28deg] animate-aura-light-cream"
              style={{
                background: 'linear-gradient(120deg, #fef08a 0%, #fed7aa 50%, #fbcfe8 100%)',
              }}
            />

            {/* Wave 3: Dusty Rose Lower Swirl */}
            <div 
              className="absolute -bottom-28 right-0 w-[800px] h-[85vh] rounded-[48%_52%_40%_60%] opacity-75 blur-[100px] sm:blur-[130px] transform rotate-[18deg] animate-aura-light-rose"
              style={{
                background: 'linear-gradient(145deg, #f43f5e 0%, #ec4899 40%, #fed7aa 80%, transparent 100%)',
              }}
            />

            {/* Wave 4: Pale Cream Highlights */}
            <div 
              className="absolute top-10 right-1/4 w-[450px] h-[60vh] rounded-[50%] opacity-90 blur-[75px] transform -rotate-[15deg] animate-aura-light-highlight"
              style={{
                background: 'radial-gradient(circle, #fffbeb 0%, #fef3c7 60%, transparent 100%)',
              }}
            />
          </div>
        </div>
      )}

      {/* Film Grain / Noise Overlay (The authentic aura grain seen in both images!) */}
      <div 
        className="absolute inset-0 opacity-[0.045] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          mixBlendMode: isDark ? 'screen' : 'multiply',
        }}
      />
    </div>
  );
};

