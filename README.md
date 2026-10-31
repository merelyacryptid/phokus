# Phokus — Aesthetic Pomodoro & Focus Space

A minimalist, aesthetic Pomodoro web application inspired by Flocus, designed for mindful work, study, and productivity.

## Key Features

- **Pomodoro Timer**:
  - Focus, Short Break, and Long Break intervals.
  - **Defaults**: 40 minutes (Focus), 10 minutes (Short Break), 20 minutes (Long Break).
  - Fully editable in **Settings** (change duration, long break cycle interval, auto-start options).
  - Cycle progress indicator (clean star indicators showing current session in cycle).
  - Picture-in-Picture (PiP) mini floating timer window.

- **Tasks & To-Do Drawer**:
  - Recreates the exact clean card design from the reference image.
  - Rounded checklist items with square check triggers.
  - Strikethrough on completed tasks.
  - Direct integration: click the target icon next to any task to set it as the active focus goal in the timer.
  - Task completion confetti (clean minimalist particles, no emojis).

- **User Authentication & Focus Statistics**:
  - Sign in / Sign up with email or username to sync and maintain focus stats.
  - Guest mode with instant demo stats exploration.
  - Daily streak tracker with flame indicator.
  - Total focus time (hours & minutes) and session counts.
  - Visual 7-day bar chart showing daily focus minutes.
  - Detailed session history log.

- **Themes**:
  - **White & Pink & Bunnies (Default)**: Soft pastel blush pinks, creamy white glassmorphism, and minimalist vector bunny line art mascot.
  - **Midnight Glow (Dark Mode)**: Ambient indigo/purple/magenta glowing mesh gradient matching the reference aesthetic.
  - Instant theme toggle in the bottom control bar or settings.

- **Strict Minimalist Aesthetic (No Emojis)**:
  - Zero unicode emojis throughout the application.
  - Modern, crisp SVG vector icons (Lucide React) and clean minimalist SVG bunny artwork.

- **Cute Encouraging Quotes**:
  - Top-right inspiring quote (e.g., *"Success comes to those who never stop learning"*).
  - Click anytime to cycle through soothing, mindful quotes.

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
