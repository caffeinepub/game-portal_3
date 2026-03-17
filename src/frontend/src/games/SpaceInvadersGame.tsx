import ScoreDialog from "@/components/ScoreDialog";
import { useCallback, useEffect, useRef, useState } from "react";

const W = 600;
const H = 480;
const PLAYER_W = 40;
const PLAYER_H = 20;
const PLAYER_SPEED = 5;
const ALIEN_COLS = 10;
const ALIEN_ROWS = 4;
const ALIEN_W = 36;
const ALIEN_H = 24;
const ALIEN_PAD_X = 14;
const ALIEN_PAD_Y = 18;

type Bullet = { x: number; y: number; vy: number };
type Alien = { x: number; y: number; alive: boolean };

const ALIEN_COLORS = ["#FF2D78", "#A855F7", "#00E5FF", "#39FF14"];

function drawAlien(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  row: number,
) {
  const color = ALIEN_COLORS[row % ALIEN_COLORS.length];
  ctx.shadowColor = color;
  ctx.shadowBlur = 8;
  ctx.fillStyle = color;
  ctx.fillRect(x + 8, y + 4, 20, 12);
  ctx.fillRect(x + 12, y, 12, 6);
  ctx.fillRect(x + 4, y + 14, 8, 6);
  ctx.fillRect(x + 24, y + 14, 8, 6);
  ctx.fillRect(x + 10, y - 4, 3, 5);
  ctx.fillRect(x + 23, y - 4, 3, 5);
  ctx.shadowBlur = 0;
}

function makeAliens(): Alien[] {
  const aliens: Alien[] = [];
  for (let r = 0; r < ALIEN_ROWS; r++) {
    for (let c = 0; c < ALIEN_COLS; c++) {
      aliens.push({
        x: 40 + c * (ALIEN_W + ALIEN_PAD_X),
        y: 50 + r * (ALIEN_H + ALIEN_PAD_Y),
        alive: true,
      });
    }
  }
  return aliens;
}

export default function SpaceInvadersGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [started, setStarted] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [displayScore, setDisplayScore] = useState(0);

  const stateRef = useRef({
    playerX: W / 2 - PLAYER_W / 2,
    aliens: makeAliens(),
    bullets: [] as Bullet[],
    alienDir: 1,
    alienSpeed: 0.4,
    score: 0,
    running: false,
    keys: { left: false, right: false, fire: false },
    lastFire: 0,
    lastAlienFire: 0,
    frame: 0,
  });
  const rafRef = useRef<number | null>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const s = stateRef.current;

    ctx.fillStyle = "#0B0B10";
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = "rgba(255,255,255,0.4)";
    for (let i = 0; i < 50; i++) {
      const sx = (i * 137 + 17) % W;
      const sy = (i * 73 + 41) % H;
      ctx.fillRect(sx, sy, 1, 1);
    }

    for (let idx = 0; idx < s.aliens.length; idx++) {
      const alien = s.aliens[idx];
      if (!alien.alive) continue;
      const row = Math.floor(idx / ALIEN_COLS);
      drawAlien(ctx, alien.x, alien.y, row);
    }

    for (const b of s.bullets) {
      ctx.shadowColor = b.vy < 0 ? "#FFE600" : "#FF2D78";
      ctx.shadowBlur = 8;
      ctx.fillStyle = b.vy < 0 ? "#FFE600" : "#FF2D78";
      ctx.fillRect(b.x - 2, b.y - 8, 4, 14);
      ctx.shadowBlur = 0;
    }

    ctx.shadowColor = "#00E5FF";
    ctx.shadowBlur = 12;
    ctx.fillStyle = "#00E5FF";
    const px = s.playerX;
    const py = H - 50;
    ctx.fillRect(px + 10, py + 6, PLAYER_W - 20, PLAYER_H - 6);
    ctx.fillRect(px + 16, py, 8, 8);
    ctx.fillRect(px, py + 12, 14, 8);
    ctx.fillRect(px + PLAYER_W - 14, py + 12, 14, 8);
    ctx.shadowBlur = 0;

    ctx.strokeStyle = "rgba(0,229,255,0.3)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, H - 28);
    ctx.lineTo(W, H - 28);
    ctx.stroke();
  }, []);

  const endGame = useCallback((score: number) => {
    stateRef.current.running = false;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setFinalScore(score);
    setShowDialog(true);
  }, []);

  const loop = useCallback(() => {
    const s = stateRef.current;
    if (!s.running) return;
    s.frame++;

    if (s.keys.left) s.playerX = Math.max(0, s.playerX - PLAYER_SPEED);
    if (s.keys.right)
      s.playerX = Math.min(W - PLAYER_W, s.playerX + PLAYER_SPEED);

    if (s.keys.fire && s.frame - s.lastFire > 18) {
      s.bullets.push({ x: s.playerX + PLAYER_W / 2, y: H - 56, vy: -9 });
      s.lastFire = s.frame;
    }

    if (s.frame - s.lastAlienFire > 60) {
      const alive = s.aliens.filter((a) => a.alive);
      if (alive.length > 0) {
        const shooter = alive[Math.floor(Math.random() * alive.length)];
        s.bullets.push({
          x: shooter.x + ALIEN_W / 2,
          y: shooter.y + ALIEN_H,
          vy: 5,
        });
        s.lastAlienFire = s.frame;
      }
    }

    let hitWall = false;
    for (const alien of s.aliens) {
      if (!alien.alive) continue;
      alien.x += s.alienDir * s.alienSpeed;
      if (alien.x <= 0 || alien.x + ALIEN_W >= W) hitWall = true;
    }
    if (hitWall) {
      s.alienDir *= -1;
      for (const alien of s.aliens) {
        if (alien.alive) alien.y += 12;
      }
    }

    s.bullets = s.bullets.filter((b) => b.y > -20 && b.y < H + 20);
    for (const b of s.bullets) b.y += b.vy;

    for (const b of s.bullets) {
      if (b.vy >= 0) continue;
      for (const alien of s.aliens) {
        if (!alien.alive) continue;
        if (
          b.x >= alien.x &&
          b.x <= alien.x + ALIEN_W &&
          b.y >= alien.y &&
          b.y <= alien.y + ALIEN_H
        ) {
          alien.alive = false;
          b.y = -100;
          s.score += 10;
          s.alienSpeed = Math.min(2, s.alienSpeed + 0.015);
          setDisplayScore(s.score);
          break;
        }
      }
    }

    const ppx = s.playerX;
    const ppy = H - 50;
    for (const b of s.bullets) {
      if (b.vy <= 0) continue;
      if (
        b.x >= ppx &&
        b.x <= ppx + PLAYER_W &&
        b.y >= ppy &&
        b.y <= ppy + PLAYER_H
      ) {
        endGame(s.score);
        return;
      }
    }

    for (const alien of s.aliens) {
      if (alien.alive && alien.y + ALIEN_H >= H - 30) {
        endGame(s.score);
        return;
      }
    }

    if (s.aliens.every((a) => !a.alive)) {
      s.aliens = makeAliens();
      s.alienSpeed += 0.2;
    }

    draw();
    rafRef.current = requestAnimationFrame(loop);
  }, [draw, endGame]);

  const startGame = useCallback(() => {
    const s = stateRef.current;
    s.playerX = W / 2 - PLAYER_W / 2;
    s.aliens = makeAliens();
    s.bullets = [];
    s.alienDir = 1;
    s.alienSpeed = 0.4;
    s.score = 0;
    s.running = true;
    s.frame = 0;
    s.lastFire = 0;
    s.lastAlienFire = 0;
    setDisplayScore(0);
    setStarted(true);
    setShowDialog(false);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(loop);
  }, [loop]);

  useEffect(() => {
    draw();
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [draw]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a") {
        stateRef.current.keys.left = true;
        e.preventDefault();
      }
      if (e.key === "ArrowRight" || e.key === "d") {
        stateRef.current.keys.right = true;
        e.preventDefault();
      }
      if (e.key === " ") {
        stateRef.current.keys.fire = true;
        e.preventDefault();
      }
    };
    const up = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a")
        stateRef.current.keys.left = false;
      if (e.key === "ArrowRight" || e.key === "d")
        stateRef.current.keys.right = false;
      if (e.key === " ") stateRef.current.keys.fire = false;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex items-center gap-8">
        <div className="text-center">
          <p
            className="font-orbitron text-xs tracking-widest"
            style={{ color: "oklch(0.72 0.015 280)" }}
          >
            SCORE
          </p>
          <p className="font-orbitron text-3xl font-black neon-cyan-text">
            {displayScore}
          </p>
        </div>
        <div className="text-center">
          <p
            className="font-orbitron text-xs tracking-widest"
            style={{ color: "oklch(0.72 0.015 280)" }}
          >
            CONTROLS
          </p>
          <p
            className="font-orbitron text-xs"
            style={{ color: "oklch(0.84 0.17 200)" }}
          >
            ← → MOVE · SPACE FIRE
          </p>
        </div>
      </div>
      <div
        className="relative"
        style={{
          border: "1px solid oklch(0.84 0.17 200 / 0.5)",
          boxShadow: "0 0 20px oklch(0.84 0.17 200 / 0.3)",
        }}
      >
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          style={{ display: "block" }}
        />
        {!started && (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ background: "oklch(0.09 0.008 265 / 0.85)" }}
          >
            <div className="text-center">
              <p className="font-orbitron text-2xl font-black neon-magenta-text mb-2">
                SPACE INVADERS
              </p>
              <p
                className="font-orbitron text-xs mb-6"
                style={{ color: "oklch(0.72 0.015 280)" }}
              >
                Arrows to move · Space to shoot
              </p>
              <button
                type="button"
                onClick={startGame}
                className="neon-btn-filled px-8 py-3 rounded font-orbitron text-sm tracking-widest"
                data-ocid="spaceinvaders.primary_button"
              >
                START GAME
              </button>
            </div>
          </div>
        )}
      </div>
      <ScoreDialog
        open={showDialog}
        onClose={() => setShowDialog(false)}
        gameName="spaceinvaders"
        gameTitle="SPACE INVADERS"
        score={finalScore}
        onPlayAgain={startGame}
      />
    </div>
  );
}
