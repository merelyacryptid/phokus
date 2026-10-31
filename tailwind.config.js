/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      colors: {
        pinky: {
          50: '#fff1f4',
          100: '#ffe4ea',
          200: '#fecdd7',
          300: '#fea3b8',
          400: '#fb718f',
          500: '#f43f68',
          600: '#e11d4d',
          700: '#be123e',
          800: '#9f1238',
          900: '#831433',
        },
      },
      animation: {
        'subtle-pulse': 'subtlePulse 3s ease-in-out infinite',
        'float': 'float 4s ease-in-out infinite',
        'fade-in': 'fadeIn 0.25s ease-out forwards',
        'mesh-glow': 'meshGlow 22s ease-in-out infinite alternate',
        'aura-dark-main': 'auraDarkMain 16s ease-in-out infinite alternate',
        'aura-dark-core': 'auraDarkCore 12s ease-in-out infinite alternate',
        'aura-dark-side': 'auraDarkSide 18s ease-in-out infinite alternate',
        'aura-dark-glow': 'auraDarkGlow 15s ease-in-out infinite alternate',
        'aura-light-pink': 'auraLightPink 16s ease-in-out infinite alternate',
        'aura-light-cream': 'auraLightCream 14s ease-in-out infinite alternate',
        'aura-light-rose': 'auraLightRose 19s ease-in-out infinite alternate',
        'aura-light-highlight': 'auraLightHighlight 13s ease-in-out infinite alternate',
      },
      keyframes: {
        subtlePulse: {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.02)', opacity: '0.96' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        meshGlow: {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
        auraDarkMain: {
          '0%': { transform: 'rotate(-22deg) scale(1) translateY(0px)' },
          '50%': { transform: 'rotate(-18deg) scale(1.08) translateY(-30px) translateX(20px)' },
          '100%': { transform: 'rotate(-25deg) scale(0.96) translateY(20px) translateX(-15px)' },
        },
        auraDarkCore: {
          '0%': { transform: 'rotate(-15deg) scale(1) translateY(0px)' },
          '50%': { transform: 'rotate(-12deg) scale(1.12) translateY(-25px)' },
          '100%': { transform: 'rotate(-18deg) scale(0.92) translateY(15px)' },
        },
        auraDarkSide: {
          '0%': { transform: 'scale(1) translateX(0px)' },
          '50%': { transform: 'scale(1.1) translateX(-30px) translateY(20px)' },
          '100%': { transform: 'scale(0.95) translateX(20px) translateY(-15px)' },
        },
        auraDarkGlow: {
          '0%': { transform: 'scale(1) translateY(0px)' },
          '50%': { transform: 'scale(1.15) translateY(-20px) translateX(25px)' },
          '100%': { transform: 'scale(0.9) translateY(25px) translateX(-20px)' },
        },
        auraLightPink: {
          '0%': { transform: 'rotate(35deg) scale(1) translateY(0px)' },
          '50%': { transform: 'rotate(40deg) scale(1.08) translateY(-25px) translateX(20px)' },
          '100%': { transform: 'rotate(30deg) scale(0.95) translateY(20px) translateX(-15px)' },
        },
        auraLightCream: {
          '0%': { transform: 'rotate(-28deg) scale(1) translateX(0px)' },
          '50%': { transform: 'rotate(-22deg) scale(1.12) translateX(-20px) translateY(30px)' },
          '100%': { transform: 'rotate(-32deg) scale(0.92) translateX(25px) translateY(-20px)' },
        },
        auraLightRose: {
          '0%': { transform: 'rotate(18deg) scale(1)' },
          '50%': { transform: 'rotate(24deg) scale(1.06) translateY(-30px)' },
          '100%': { transform: 'rotate(12deg) scale(0.96) translateY(20px)' },
        },
        auraLightHighlight: {
          '0%': { transform: 'rotate(-15deg) scale(1) opacity(0.9)' },
          '50%': { transform: 'rotate(-10deg) scale(1.15) opacity(1)' },
          '100%': { transform: 'rotate(-20deg) scale(0.88) opacity(0.75)' },
        },
      }
    },
  },
  plugins: [],
}
