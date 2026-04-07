# Battleship

A single-player Battleship game where you battle against an AI opponent. Built with React + TypeScript on the frontend and FastAPI on the backend.

**Play now:** [https://first-session-app-gxeymtmw.devinapps.com](https://first-session-app-gxeymtmw.devinapps.com)

## Features

- **Single-player vs AI** -- place your ships and battle a smart AI opponent
- **Smart AI targeting** -- the AI uses hunt/target strategy with checkerboard pattern for efficient searching
- **Ship graphics** -- SVG ship illustrations for all 5 ship types
- **Hit & sink animations** -- ships shake with explosions on hit; crack in half with dramatic effects on sink
- **Confetti & celebration effects** -- colorful confetti bursts and screen flash when you hit or sink enemy ships
- **Audio system** -- explosion + roar on hit, splash on miss, background music (off by default, toggle with button)
- **Enemy fleet legend** -- shows all ships with sizes, crossed out when sunk
- **Mobile-friendly** -- responsive layout that works on phones held vertically
- **Win/lose screens** -- dramatic animations with a "Play Again" button

## Ships

| Ship | Size |
|------|------|
| Carrier | 5 |
| Battleship | 4 |
| Cruiser | 3 |
| Submarine | 3 |
| Destroyer | 2 |

## Tech Stack

### Frontend
- React 18 + TypeScript
- Vite
- Tailwind CSS
- Web Audio API (procedurally generated sounds)

### Backend
- Python 3.12
- FastAPI
- WebSockets (for multiplayer support, currently unused in single-player mode)

## Getting Started

### Prerequisites
- Node.js 18+
- Python 3.12+
- Poetry

### Frontend

```bash
cd battleship-frontend
npm install
npm run dev
```

The frontend runs at `http://localhost:5173` by default.

### Backend

```bash
cd battleship-backend
poetry install
poetry run uvicorn app.main:app --reload
```

The backend runs at `http://localhost:8000` by default.

### Build for Production

```bash
cd battleship-frontend
npm run build
```

The production build outputs to `battleship-frontend/dist/`.

## How to Play

1. **Place your ships** -- click cells on your board to place each ship. Use the "Rotate" button to toggle between horizontal and vertical placement.
2. **Fire at the enemy** -- click cells on the enemy board to fire. Hits show as red X, misses as blue dots.
3. **Sink all 5 enemy ships to win!**

## Project Structure

```
battleship/
  battleship-frontend/       # React + TypeScript frontend
    src/
      App.tsx                 # Main game logic and UI
      GameOverlay.tsx         # Hit/sink/victory/defeat animations + confetti
      ShipGraphics.tsx        # SVG ship illustrations
      audio.ts                # Web Audio API sound effects and music
      animations.css          # CSS keyframe animations
      explosion.css           # Explosion effect styles
      App.css                 # Global styles
  battleship-backend/         # FastAPI backend
    app/
      main.py                 # API endpoints and WebSocket handler
      game.py                 # Game logic
```
