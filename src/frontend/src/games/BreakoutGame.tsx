import ScoreDialog from "@/components/ScoreDialog";
import { useCallback, useEffect, useRef, useState } from "react";

const W = 600;
const H = 500;
const PADDLE_W = 100;
const PADDLE_H = 12;
const BALL_R = 8;
const BRICK_ROWS = 5;
const BRICK_COLS = 10;
const BRICK_W = 52;
const BRICK_H = 20;
const BRICK_PAD = 4;
const BRICK_OFF_X = 14;
const BRICK_OFF_Y = 50;

const BRICK_COLORS = [
  { fill: "#FF3DF7", glow: "rgba(255,61,247,0.8)" },
  { fill: "#FF6B35", glow: "rgba(255,107,53,0.7)" },
  { fill: "#FFE600", glow: "rgba(255,230,0,0.7)" },
  { fill: "#00E5FF", glow: "rgba(0,229,255,0.8)" },
  { fill: "#39FF14", glow: "rgba(57,255,20,0.8)" },
];

function makeBricks() {
  const bricks: Array<{
    x: number;
    y: number;
    alive: boolean;
    color: (typeof BRICK_COLORS)[0];
  }> = [];
  for (let r = 0; r < BRICK_ROWS; r++) {
    for (let c = 0; c < BRICK_COLS; c++) {
      bricks.push({
        x: BRICK_OFF_X + c * (BRICK_W + BRICK_PAD),
        y: BRICK_OFF_Y + r * (BRICK_H + BRICK_PAD),
        alive: true,
        color: BRICK_COLORS[r % BRICK_COLORS.length],
      });
    }
  }
  return bricks;
}

export default function BreakoutGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const lastRef = useRef<number>(0);
  const gameRef = useRef({
    px: W / 2 - PADDLE_W / 2,
    bx: W / 2,
    by: H - 60,
    vx: 3.5,
    vy: -4,
    bricks: makeBricks(),
    score: 0,
    lives: 3,
    running: false,
    gameOver: false,
    won: false,
  });
  const mouseRef = useRef(W / 2);
  const [displayScore, setDisplayScore] = useState(0);
  const [displayLives, setDisplayLives] = useState(3);
  const [started, setStarted] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [finalScore, setFinalScore] = useState(0);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const g = gameRef.current;

    ctx.save();
    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, "#040118");
    bgGrad.addColorStop(0.3, "#07021A");
    bgGrad.addColorStop(1, "#030010");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // Aurora at top
    for (let band = 0; band < 3; band++) {
      const auroraGrad = ctx.createRadialGradient(
        W * (0.3 + band * 0.2),
        -20,
        0,
        W * (0.3 + band * 0.2),
        -20,
        180 + band * 40,
      );
      const colors = [
        ["rgba(0,229,255,0.12)", "rgba(0,229,255,0)"],
        ["rgba(124,58,237,0.10)", "rgba(124,58,237,0)"],
        ["rgba(0,255,180,0.08)", "rgba(0,255,180,0)"],
      ];
      auroraGrad.addColorStop(0, colors[band][0]);
      auroraGrad.addColorStop(1, colors[band][1]);
      ctx.fillStyle = auroraGrad;
      ctx.fillRect(0, 0, W, H);
    }

    // Energy grid
    ctx.strokeStyle = "rgba(0,229,255,0.05)";
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 30) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }
    for (let y = 0; y < H; y += 30) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }
    // Grid intersection dots
    ctx.fillStyle = "rgba(0,229,255,0.06)";
    for (let x = 0; x < W; x += 30) {
      for (let y = 0; y < H; y += 30) {
        ctx.fillRect(x - 1, y - 1, 2, 2);
      }
    }
    // Ball glow
    const ballGlowGrad = ctx.createRadialGradient(
      g.bx,
      g.by,
      0,
      g.bx,
      g.by,
      60,
    );
    ballGlowGrad.addColorStop(0, "rgba(255,61,247,0.15)");
    ballGlowGrad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = ballGlowGrad;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();

    for (const b of g.bricks) {
      if (!b.alive) continue;
      ctx.shadowColor = b.color.glow;
      ctx.shadowBlur = 10;
      ctx.fillStyle = b.color.fill;
      ctx.fillRect(b.x, b.y, BRICK_W, BRICK_H);
      ctx.shadowBlur = 0;
      ctx.fillStyle = "rgba(255,255,255,0.15)";
      ctx.fillRect(b.x + 2, b.y + 2, BRICK_W - 4, 4);
    }

    const px = g.px;
    ctx.shadowColor = "#00E5FF";
    ctx.shadowBlur = 15;
    const grad = ctx.createLinearGradient(px, H - 30, px + PADDLE_W, H - 30);
    grad.addColorStop(0, "#7C3AED");
    grad.addColorStop(0.5, "#00E5FF");
    grad.addColorStop(1, "#7C3AED");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(px, H - 30, PADDLE_W, PADDLE_H, 6);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.shadowColor = "#FF3DF7";
    ctx.shadowBlur = 20;
    const bgrad = ctx.createRadialGradient(g.bx, g.by, 0, g.bx, g.by, BALL_R);
    bgrad.addColorStop(0, "#FFFFFF");
    bgrad.addColorStop(0.5, "#FF3DF7");
    bgrad.addColorStop(1, "rgba(255,61,247,0)");
    ctx.fillStyle = bgrad;
    ctx.beginPath();
    ctx.arc(g.bx, g.by, BALL_R, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.font = "14px 'Orbitron', sans-serif";
    ctx.fillStyle = "#00E5FF";
    ctx.fillText(`LIVES: ${"\u2665 ".repeat(g.lives)}`, 10, 30);
    ctx.fillStyle = "#FF3DF7";
    ctx.textAlign = "right";
    ctx.fillText(`SCORE: ${g.score}`, W - 10, 30);
    ctx.textAlign = "left";
  }, []);

  const gameLoop = useCallback(
    (ts: number) => {
      const dt = Math.min(ts - lastRef.current, 32);
      lastRef.current = ts;
      const g = gameRef.current;
      if (!g.running) return;

      const targetX = mouseRef.current - PADDLE_W / 2;
      g.px = Math.max(0, Math.min(W - PADDLE_W, targetX));

      g.bx += g.vx * (dt / 16);
      g.by += g.vy * (dt / 16);

      if (g.bx - BALL_R <= 0) {
        g.bx = BALL_R;
        g.vx = Math.abs(g.vx);
      }
      if (g.bx + BALL_R >= W) {
        g.bx = W - BALL_R;
        g.vx = -Math.abs(g.vx);
      }
      if (g.by - BALL_R <= 0) {
        g.by = BALL_R;
        g.vy = Math.abs(g.vy);
      }

      if (
        g.by + BALL_R >= H - 30 &&
        g.by + BALL_R <= H - 30 + PADDLE_H + 4 &&
        g.bx >= g.px - 4 &&
        g.bx <= g.px + PADDLE_W + 4
      ) {
        g.vy = -Math.abs(g.vy);
        const rel = (g.bx - (g.px + PADDLE_W / 2)) / (PADDLE_W / 2);
        g.vx = rel * 5;
        g.by = H - 30 - BALL_R - 1;
      }

      if (g.by + BALL_R > H) {
        g.lives--;
        setDisplayLives(g.lives);
        if (g.lives <= 0) {
          g.running = false;
          g.gameOver = true;
          setFinalScore(g.score);
          setTimeout(() => setShowDialog(true), 400);
          draw();
          return;
        }
        g.bx = g.px + PADDLE_W / 2;
        g.by = H - 60;
        g.vx = 3.5 * (Math.random() > 0.5 ? 1 : -1);
        g.vy = -4;
      }

      for (const b of g.bricks) {
        if (!b.alive) continue;
        if (
          g.bx + BALL_R > b.x &&
          g.bx - BALL_R < b.x + BRICK_W &&
          g.by + BALL_R > b.y &&
          g.by - BALL_R < b.y + BRICK_H
        ) {
          b.alive = false;
          g.score += 10;
          setDisplayScore(g.score);
          const fromTop = g.by - BALL_R < b.y;
          const fromBottom = g.by + BALL_R > b.y + BRICK_H;
          if (fromTop || fromBottom) g.vy *= -1;
          else g.vx *= -1;
          const speed = Math.sqrt(g.vx * g.vx + g.vy * g.vy);
          if (speed < 8) {
            g.vx *= 1.02;
            g.vy *= 1.02;
          }
          break;
        }
      }

      if (g.bricks.every((b) => !b.alive)) {
        g.running = false;
        g.won = true;
        g.score += 500;
        setDisplayScore(g.score);
        setFinalScore(g.score);
        setTimeout(() => setShowDialog(true), 400);
        draw();
        return;
      }

      draw();
      rafRef.current = requestAnimationFrame(gameLoop);
    },
    [draw],
  );

  const startGame = useCallback(() => {
    const g = gameRef.current;
    g.px = W / 2 - PADDLE_W / 2;
    g.bx = W / 2;
    g.by = H - 60;
    g.vx = 3.5;
    g.vy = -4;
    g.bricks = makeBricks();
    g.score = 0;
    g.lives = 3;
    g.running = true;
    g.gameOver = false;
    g.won = false;
    setDisplayScore(0);
    setDisplayLives(3);
    setStarted(true);
    setShowDialog(false);
    lastRef.current = performance.now();
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(gameLoop);
  }, [gameLoop]);

  useEffect(() => {
    draw();
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [draw]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const handleMouse = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = e.clientX - rect.left;
    };
    const handleTouch = (e: TouchEvent) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = e.touches[0].clientX - rect.left;
    };
    canvas.addEventListener("mousemove", handleMouse);
    canvas.addEventListener("touchmove", handleTouch, { passive: false });
    return () => {
      canvas.removeEventListener("mousemove", handleMouse);
      canvas.removeEventListener("touchmove", handleTouch);
    };
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const g = gameRef.current;
      if (!g.running) return;
      if (e.key === "ArrowLeft")
        mouseRef.current = Math.max(PADDLE_W / 2, mouseRef.current - 20);
      if (e.key === "ArrowRight")
        mouseRef.current = Math.min(W - PADDLE_W / 2, mouseRef.current + 20);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex items-center gap-10">
        <div className="text-center">
          <p
            className="font-orbitron text-xs tracking-widest"
            style={{ color: "oklch(0.72 0.015 280)" }}
          >
            SCORE
          </p>
          <p className="font-orbitron text-3xl font-black neon-magenta-text">
            {displayScore}
          </p>
        </div>
        <div className="text-center">
          <p
            className="font-orbitron text-xs tracking-widest"
            style={{ color: "oklch(0.72 0.015 280)" }}
          >
            LIVES
          </p>
          <p
            className="font-orbitron text-2xl font-black"
            style={{ color: "var(--neon-yellow)" }}
          >
            {"\u2665 ".repeat(displayLives)}
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
            MOUSE / ARROWS
          </p>
        </div>
      </div>

      <div
        className="relative"
        style={{
          border: "1px solid oklch(0.63 0.28 315 / 0.5)",
          boxShadow: "0 0 20px oklch(0.63 0.28 315 / 0.3)",
          cursor: "none",
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
                BREAKOUT
              </p>
              <p
                className="font-orbitron text-xs mb-2"
                style={{ color: "oklch(0.72 0.015 280)" }}
              >
                Move mouse to control the paddle
              </p>
              <p
                className="font-orbitron text-xs mb-6"
                style={{ color: "oklch(0.72 0.015 280)" }}
              >
                Or use arrow keys
              </p>
              <button
                type="button"
                onClick={startGame}
                className="neon-btn-filled px-8 py-3 rounded font-orbitron text-sm tracking-widest"
                data-ocid="breakout.primary_button"
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
        gameName="breakout"
        gameTitle="BREAKOUT"
        score={finalScore}
        onPlayAgain={startGame}
      />
    </div>
  );
}
