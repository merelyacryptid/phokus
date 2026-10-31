# Phokus

I built a simple, sweet and minimalist customisable pomodoro web application for exam season (and yes it is bunny themed)

## Key Features

- **Pomodoro Timer**:
  - Focus, Short Break, and Long Break intervals.
  - **My defaults**: 40 minutes (Focus), 10 minutes (Short Break), 20 minutes (Long Break).
  - Fully editable in **Settings** (change duration, long break cycle interval, auto-start options).
  - Cycle progress indicator - clean star indicators showing current session in cycle (so you can feel accomplished).
  - Picture-in-Picture (PiP) mini floating timer window.

- **productivity helpers**:
  - Maintain a list of todos and strike them out as you get through each session
    - Task completion confetti!!
  - Encouraging quotes : Click anytime to cycle through soothing, mindful quotes.
  - Total focus time (hours & minutes) and session counts (because its nice to see progress)
  - Visual 7-day bar chart showing daily focus minutes
  - & a bunny mascot that cheers you on!

- **User Authentication & Focus Statistics**:
  - Sign in / Sign up with email or username to sync and maintain focus stats.
  - Guest mode with instant demo stats exploration.
  - Daily streak tracker
  - Detailed session history log.

- **Themes**:
  - **White & Pink & Bunnies (Default)**: Soft pastel blush pinks, creamy white glassmorphism, and some bunnies.
  - **Midnight Glow (Dark Mode)**: Ambient indigo/purple/magenta glowing mesh gradient
  - Instant theme toggle in the bottom control bar or settings.


- **Built-in Web Audio Synthesizer**:
  - 100% offline, zero-network-latency audio generation via Web Audio API.
  - Session completion alerts (Crystal tone, Zen Singing Bowl, Warm Marimba, Digital Ding).
  - Ambient noise generator (Gentle Rain, Forest Brook, Pink Noise, Quiet Breeze).
  - Optional subtle ticking sound.

## Keyboard Shortcuts

- `Space`: Start / Pause Timer
- `R`: Reset Timer
- `S`: Skip to Next Session
- `Esc`: Close any open modal / drawer

## Getting Started

```bash
# Install dependencies
npm install

# Start local development server
npm run dev

# Build for production
npm run build
```
