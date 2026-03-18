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

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

interface TrailPoint {
  x: number;
  y: number;
}

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

// Draw a 3D beveled brick
function drawBeveledBrick(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
  glow: string,
) {
  // Glow shadow
  ctx.shadowColor = glow;
  ctx.shadowBlur = 10;
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
  ctx.shadowBlur = 0;

  // Top-left bright bevel
  ctx.fillStyle = "rgba(255,255,255,0.40)";
  ctx.fillRect(x, y, w, 3);
  ctx.fillRect(x, y, 3, h);

  // Bottom-right dark bevel
  ctx.fillStyle = "rgba(0,0,0,0.45)";
  ctx.fillRect(x, y + h - 3, w, 3);
  ctx.fillRect(x + w - 3, y, 3, h);

  // Inner shine stripe
  ctx.fillStyle = "rgba(255,255,255,0.22)";
  ctx.fillRect(x + 3, y + 3, w - 6, 5);

  // Diagonal texture
  ctx.strokeStyle = "rgba(255,255,255,0.07)";
  ctx.lineWidth = 1;
  for (let d = 4; d < w + h; d += 8) {
    const x1 = x + Math.max(0, d - h);
    const y1 = y + Math.min(h, d);
    const x2 = x + Math.min(w, d);
    const y2 = y + Math.max(0, d - w);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }
}

export default function BreakoutGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const lastRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);
  const ballTrailRef = useRef<TrailPoint[]>([]);

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

  const spawnBrickParticles = useCallback(
    (brickX: number, brickY: number, color: string) => {
      const count = 8 + Math.floor(Math.random() * 5);
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1.5 + Math.random() * 4;
        particlesRef.current.push({
          x: brickX + BRICK_W / 2,
          y: brickY + BRICK_H / 2,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 25 + Math.random() * 15,
          maxLife: 40,
          color,
          size: 2 + Math.random() * 3,
        });
      }
    },
    [],
  );

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

    // Ball ambient glow on bg
    const ballGlowGrad = ctx.createRadialGradient(
      g.bx,
      g.by,
      0,
      g.bx,
      g.by,
      70,
    );
    ballGlowGrad.addColorStop(0, "rgba(255,61,247,0.12)");
    ballGlowGrad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = ballGlowGrad;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();

    // 3D beveled bricks
    for (const b of g.bricks) {
      if (!b.alive) continue;
      drawBeveledBrick(
        ctx,
        b.x,
        b.y,
        BRICK_W,
        BRICK_H,
        b.color.fill,
        b.color.glow,
      );
    }

    // --- Paddle: energy rune design ---
    const px = g.px;
    const py = H - 30;
    ctx.save();
    // Outer glow
    ctx.shadowColor = "#00E5FF";
    ctx.shadowBlur = 18;
    const paddleGrad = ctx.createLinearGradient(px, py, px + PADDLE_W, py);
    paddleGrad.addColorStop(0, "#7C3AED");
    paddleGrad.addColorStop(0.3, "#00aaff");
    paddleGrad.addColorStop(0.5, "#00E5FF");
    paddleGrad.addColorStop(0.7, "#00aaff");
    paddleGrad.addColorStop(1, "#7C3AED");
    ctx.fillStyle = paddleGrad;
    ctx.beginPath();
    ctx.roundRect(px, py, PADDLE_W, PADDLE_H, 6);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Inner glow lines
    ctx.strokeStyle = "rgba(255,255,255,0.35)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(px + 8, py + 3);
    ctx.lineTo(px + PADDLE_W - 8, py + 3);
    ctx.stroke();
    ctx.strokeStyle = "rgba(0,229,255,0.25)";
    ctx.beginPath();
    ctx.moveTo(px + 8, py + PADDLE_H - 4);
    ctx.lineTo(px + PADDLE_W - 8, py + PADDLE_H - 4);
    ctx.stroke();

    // Energy node circles at each end
    const nodeRadius = 5;
    for (const nx of [px + nodeRadius + 1, px + PADDLE_W - nodeRadius - 1]) {
      const nodeGrad = ctx.createRadialGradient(
        nx,
        py + PADDLE_H / 2,
        0,
        nx,
        py + PADDLE_H / 2,
        nodeRadius,
      );
      nodeGrad.addColorStop(0, "#ffffff");
      nodeGrad.addColorStop(0.4, "#00E5FF");
      nodeGrad.addColorStop(1, "rgba(0,229,255,0)");
      ctx.shadowColor = "#00E5FF";
      ctx.shadowBlur = 8;
      ctx.fillStyle = nodeGrad;
      ctx.beginPath();
      ctx.arc(nx, py + PADDLE_H / 2, nodeRadius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;
    ctx.restore();

    // --- Ball trail ---
    const trail = ballTrailRef.current;
    for (let i = 0; i < trail.length; i++) {
      const t = trail[i];
      const alpha = ((i + 1) / (trail.length + 1)) * 0.5;
      const radius = BALL_R * ((i + 1) / (trail.length + 1)) * 0.8;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = "#FF3DF7";
      ctx.shadowColor = "#FF3DF7";
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(t.x, t.y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;

    // --- Ball: shiny sphere ---
    ctx.save();
    // Outer halo
    const haloGrad = ctx.createRadialGradient(
      g.bx,
      g.by,
      BALL_R * 0.8,
      g.bx,
      g.by,
      BALL_R * 2.5,
    );
    haloGrad.addColorStop(0, "rgba(255,61,247,0.3)");
    haloGrad.addColorStop(1, "rgba(255,61,247,0)");
    ctx.fillStyle = haloGrad;
    ctx.beginPath();
    ctx.arc(g.bx, g.by, BALL_R * 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Core sphere with radial gradient (highlight offset top-left)
    ctx.shadowColor = "#FF3DF7";
    ctx.shadowBlur = 20;
    const hlx = g.bx - BALL_R * 0.35;
    const hly = g.by - BALL_R * 0.35;
    const sphereGrad = ctx.createRadialGradient(
      hlx,
      hly,
      0,
      g.bx,
      g.by,
      BALL_R,
    );
    sphereGrad.addColorStop(0, "#ffffff");
    sphereGrad.addColorStop(0.3, "#ffaaff");
    sphereGrad.addColorStop(0.65, "#FF3DF7");
    sphereGrad.addColorStop(1, "rgba(180,0,180,0.8)");
    ctx.fillStyle = sphereGrad;
    ctx.beginPath();
    ctx.arc(g.bx, g.by, BALL_R, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.restore();

    // --- Particles ---
    const alive: Particle[] = [];
    for (const p of particlesRef.current) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.1;
      p.life--;
      if (p.life > 0) {
        const a = p.life / p.maxLife;
        ctx.globalAlpha = a;
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 5;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * a, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        alive.push(p);
      }
    }
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
    particlesRef.current = alive;

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

      // Update ball trail
      ballTrailRef.current.push({ x: g.bx, y: g.by });
      if (ballTrailRef.current.length > 5) {
        ballTrailRef.current.shift();
      }

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
        ballTrailRef.current = [];
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
          spawnBrickParticles(b.x, b.y, b.color.fill);
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
    [draw, spawnBrickParticles],
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
    particlesRef.current = [];
    ballTrailRef.current = [];
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
