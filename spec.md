# Game Portal

## Current State
A JJK-themed gaming portal with 14 games: Snake, Tic-Tac-Toe, Memory Match, Breakout, Tetris, Pong, Space Invaders, Flappy Bird, 2048, Whack-a-Mole, Simon Says, Survive the Night, Cursed Survival, and Cursed Clash. Features include persistent score tracking, global leaderboard, user login, DuckDuckGo search, fullscreen mode, Domain Expansion animations, and JJK-themed visuals throughout.

## Requested Changes (Diff)

### Add
- 15th game: "Cursed Court" -- a JJK-themed basketball game
  - Player controls a sorcerer shooter; aim and shoot basketballs imbued with cursed energy
  - Arc-based shooting mechanic: click/tap to set power, release to shoot
  - Moving hoop that oscillates left/right, speeding up over time
  - Score multipliers for consecutive makes (streak bonus)
  - Cursed energy meter that fills with makes; activate for slow-motion assist
  - JJK-themed court background with cursed seal floor markings and floating kanji
  - Unique Domain Expansion animation: "Unlimited Void" (infinite space effect with fading stars)
  - JJK-themed game card artwork for the portal grid
  - Fullscreen support
  - Score submitted to global leaderboard

### Modify
- Game list/grid: add Cursed Court as the 15th entry

### Remove
- Nothing

## Implementation Plan
1. Create CursedCourt game component with canvas-based basketball physics
2. Implement arc shooting mechanic with power/angle indicator
3. Add moving hoop with increasing difficulty
4. Add streak bonus and cursed energy slow-motion mechanic
5. Add JJK-themed court background (cursed seals, kanji)
6. Add Unlimited Void Domain Expansion animation
7. Add game card to the portal grid with JJK artwork
8. Wire up score submission and fullscreen support
