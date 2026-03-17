# Game Portal

## Current State
The portal has 5 playable games: Snake, Tic-Tac-Toe, Memory Match, Breakout, Tetris. Each game lives in `src/frontend/src/games/`. The `GamePage.tsx` renders games via a switch on `gameId`. `HomePage.tsx` shows a GAMES array of 5 entries with card UI. The backend supports score submission/retrieval via `submitScore`, `getTopScores`, `getAllGameScores`.

## Requested Changes (Diff)

### Add
- 6 new fully playable game components:
  1. **Pong** (`pong`) -- single-player vs AI paddle. Canvas-based.
  2. **Space Invaders** (`spaceinvaders`) -- player ship, descending aliens, shoot to score. Canvas-based.
  3. **Flappy Bird** (`flappy`) -- tap/spacebar to flap, avoid pipes. Canvas-based.
  4. **2048** (`2048`) -- tile sliding puzzle, arrow keys. React DOM grid.
  5. **Whack-a-Mole** (`whackmole`) -- moles pop up in grid, click to whack. React DOM.
  6. **Simon Says** (`simon`) -- color sequence memory game. React DOM.
- New entries in GAMES array in HomePage.tsx for all 6 games with appropriate tags/colors.
- New cases in GamePage.tsx switch and GAME_TITLES.
- All new games use ScoreDialog for score submission.
- Stats bar: update count from 5 to 11.

### Modify
- `HomePage.tsx`: Add 6 game cards. Update stats bar to 11. Update NEWEST_ARRIVALS. Use responsive grid that works for 11 cards.
- `GamePage.tsx`: Import and render 6 new game components.

### Remove
Nothing.

## Implementation Plan
1. Create PongGame.tsx, SpaceInvadersGame.tsx, FlappyBirdGame.tsx, Game2048.tsx, WhackAMoleGame.tsx, SimonSaysGame.tsx
2. Update GamePage.tsx
3. Update HomePage.tsx
