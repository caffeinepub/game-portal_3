import { useCallback, useEffect, useRef, useState } from "react";

const COURT_W = 800;
const COURT_H = 500;
const HOOP_X = 680;
const HOOP_Y_MIN = 80;
const HOOP_Y_MAX = 380;
const HOOP_W = 60;
const HOOP_INNER = 38;
const HOOP_THICKNESS = 6;
const NET_H = 36;
const PLAYER_X = 90;
const PLAYER_Y = 320;
const BALL_R = 16;
const GRAVITY = 0.38;
const MAX_MISSES = 3;
const CURSED_FILLS = 5;

type Phase = "aim" | "flying" | "scored" | "missed" | "gameover" | "idle";

interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface GameState {
  score: number;
  streak: number;
  misses: number;
  cursedFills: number;
  cursedActive: boolean;
  cursedTimer: number;
  hoopY: number;
  hoopDir: number;
  hoopSpeed: number;
  ball: Ball | null;
  phase: Phase;
  comboText: string;
  comboAlpha: number;
  mouseX: number;
  mouseY: number;
  particles: Array<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    color: string;
  }>;
  floatingKanji: Array<{
    x: number;
    y: number;
    vy: number;
    alpha: number;
    char: string;
  }>;
  frameCount: number;
}

const KANJI_CHARS = [
  "呪",
  "術",
  "廻",
  "戦",
  "霊",
  "域",
  "閃",
  "刻",
  "蓋",
  "棺",
];

function initState(): GameState {
  return {
    score: 0,
    streak: 0,
    misses: 0,
    cursedFills: 0,
    cursedActive: false,
    cursedTimer: 0,
    hoopY: 230,
    hoopDir: 1,
    hoopSpeed: 1.4,
    ball: null,
    phase: "idle",
    comboText: "",
    comboAlpha: 0,
    mouseX: 400,
    mouseY: 250,
    particles: [],
    floatingKanji: Array.from({ length: 8 }, (_, i) => ({
      x: 80 + i * 95,
      y: 30 + (i % 4) * 40,
      vy: -0.25 - (i % 3) * 0.1,
      alpha: 0.12 + (i % 3) * 0.06,
      char: KANJI_CHARS[i % KANJI_CHARS.length],
    })),
    frameCount: 0,
  };
}

function getHoopSpeed(score: number): number {
  return 1.4 + score * 0.12;
}

function spawnParticles(
  state: GameState,
  x: number,
  y: number,
  color: string,
  count: number,
) {
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
    const speed = 2 + Math.random() * 3;
    state.particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1,
      color,
    });
  }
}

function drawCourt(ctx: CanvasRenderingContext2D) {
  // Sky background gradient
  const bg = ctx.createLinearGradient(0, 0, 0, COURT_H);
  bg.addColorStop(0, "#050510");
  bg.addColorStop(1, "#0a0820");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, COURT_W, COURT_H);

  // Court floor
  const floor = ctx.createLinearGradient(0, 340, 0, COURT_H);
  floor.addColorStop(0, "#1a1008");
  floor.addColorStop(1, "#0d0804");
  ctx.fillStyle = floor;
  ctx.fillRect(0, 340, COURT_W, COURT_H - 340);

  // Court line
  ctx.strokeStyle = "rgba(80,60,20,0.7)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 340);
  ctx.lineTo(COURT_W, 340);
  ctx.stroke();

  // Cursed seal hex pattern on floor
  ctx.save();
  ctx.globalAlpha = 0.18;
  for (let col = 0; col < 9; col++) {
    for (let row = 0; row < 3; row++) {
      const hx = 50 + col * 90 + (row % 2) * 45;
      const hy = 365 + row * 48;
      drawHex(ctx, hx, hy, 28, "#1a6aff");
    }
  }
  ctx.globalAlpha = 1;
  ctx.restore();

  // Outer ring seal on floor center
  ctx.save();
  ctx.globalAlpha = 0.1;
  ctx.strokeStyle = "#3a8fff";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(400, 420, 70, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(400, 420, 50, 0, Math.PI * 2);
  ctx.stroke();
  // Rune marks
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    ctx.save();
    ctx.translate(400 + Math.cos(a) * 60, 420 + Math.sin(a) * 60);
    ctx.rotate(a);
    ctx.strokeRect(-4, -2, 8, 4);
    ctx.restore();
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}

function drawHex(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  color: string,
) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i - Math.PI / 6;
    if (i === 0) ctx.moveTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
    else ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
  }
  ctx.closePath();
  ctx.stroke();
}

function drawHoop(
  ctx: CanvasRenderingContext2D,
  hoopY: number,
  cursedActive: boolean,
) {
  const glow = cursedActive ? 18 : 8;
  const glowColor = cursedActive
    ? "rgba(60,180,255,0.8)"
    : "rgba(255,140,30,0.6)";

  // Backboard
  ctx.save();
  ctx.strokeStyle = cursedActive ? "#3ab8ff" : "#aaa";
  ctx.lineWidth = 4;
  ctx.shadowColor = cursedActive ? "#3ab8ff" : "#555";
  ctx.shadowBlur = 6;
  ctx.beginPath();
  ctx.moveTo(HOOP_X + 28, hoopY - 30);
  ctx.lineTo(HOOP_X + 28, hoopY + 50);
  ctx.stroke();
  ctx.restore();

  // Rim glow
  ctx.save();
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = glow;
  ctx.strokeStyle = cursedActive ? "#60d0ff" : "#ff8c1a";
  ctx.lineWidth = HOOP_THICKNESS;
  ctx.beginPath();
  ctx.ellipse(HOOP_X, hoopY, HOOP_W / 2, 6, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // Net
  ctx.save();
  ctx.strokeStyle = cursedActive
    ? "rgba(100,200,255,0.5)"
    : "rgba(255,255,255,0.35)";
  ctx.lineWidth = 1;
  const netX = HOOP_X - HOOP_INNER / 2;
  const netXR = HOOP_X + HOOP_INNER / 2;
  const netTop = hoopY + 6;
  const netBot = hoopY + NET_H;
  const netMid = (netXR - netX) / 2;
  // Vertical lines
  for (let i = 0; i <= 5; i++) {
    const nx = netX + (i / 5) * (netXR - netX);
    const droop = Math.sin((i / 5) * Math.PI) * 8;
    ctx.beginPath();
    ctx.moveTo(nx, netTop);
    ctx.lineTo(nx + (netMid - nx + netX) * 0.08, netBot + droop);
    ctx.stroke();
  }
  // Horizontal lines
  for (let j = 1; j <= 4; j++) {
    const ny = netTop + (j / 5) * NET_H;
    const shrink = (j / 5) * 6;
    ctx.beginPath();
    ctx.moveTo(netX + shrink / 2, ny);
    ctx.lineTo(netXR - shrink / 2, ny);
    ctx.stroke();
  }
  ctx.restore();
}

function drawPlayer(ctx: CanvasRenderingContext2D) {
  // Sorcerer silhouette
  const px = PLAYER_X;
  const py = PLAYER_Y;
  ctx.save();
  ctx.shadowColor = "#3a8fff";
  ctx.shadowBlur = 16;
  ctx.fillStyle = "#0e2a55";
  // Body
  ctx.beginPath();
  ctx.ellipse(px, py + 35, 16, 32, 0, 0, Math.PI * 2);
  ctx.fill();
  // Head
  ctx.beginPath();
  ctx.arc(px, py - 5, 14, 0, Math.PI * 2);
  ctx.fill();
  // Arm reaching
  ctx.strokeStyle = "#0e2a55";
  ctx.lineWidth = 8;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(px + 8, py + 10);
  ctx.quadraticCurveTo(px + 36, py - 12, px + 50, py + 4);
  ctx.stroke();
  // Glow outline
  ctx.strokeStyle = "rgba(60,140,255,0.3)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(px, py + 35, 16, 32, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(px, py - 5, 14, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawBall(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  cursedActive: boolean,
  spin: number,
) {
  ctx.save();
  if (cursedActive) {
    ctx.shadowColor = "#3ab8ff";
    ctx.shadowBlur = 24;
  } else {
    ctx.shadowColor = "rgba(255,140,30,0.6)";
    ctx.shadowBlur = 10;
  }

  // Ball body
  const grad = ctx.createRadialGradient(
    x - BALL_R * 0.3,
    y - BALL_R * 0.3,
    2,
    x,
    y,
    BALL_R,
  );
  grad.addColorStop(0, "#ff9840");
  grad.addColorStop(0.5, "#e86a00");
  grad.addColorStop(1, "#8a3200");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(x, y, BALL_R, 0, Math.PI * 2);
  ctx.fill();

  // Lines
  ctx.strokeStyle = "rgba(80,30,0,0.7)";
  ctx.lineWidth = 1.5;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(spin);
  ctx.beginPath();
  ctx.arc(0, 0, BALL_R, 0, Math.PI * 2);
  ctx.clip();
  // Horizontal seam
  ctx.beginPath();
  ctx.moveTo(-BALL_R, 0);
  ctx.lineTo(BALL_R, 0);
  ctx.stroke();
  // Vertical seam
  ctx.beginPath();
  ctx.moveTo(0, -BALL_R);
  ctx.lineTo(0, BALL_R);
  ctx.stroke();
  // Curved seams
  ctx.beginPath();
  ctx.ellipse(0, 0, BALL_R * 0.5, BALL_R, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // Cursed energy glow ring
  if (cursedActive) {
    ctx.strokeStyle = "rgba(80,200,255,0.8)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, BALL_R + 5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = "rgba(60,140,255,0.4)";
    ctx.beginPath();
    ctx.arc(x, y, BALL_R + 10, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

function getAimBall(_state: GameState): { x: number; y: number } {
  return { x: PLAYER_X + 55, y: PLAYER_Y + 4 };
}

function drawAimArc(
  ctx: CanvasRenderingContext2D,
  startX: number,
  startY: number,
  targetX: number,
  targetY: number,
) {
  const { vx, vy } = calcLaunchVelocity(startX, startY, targetX, targetY);
  ctx.save();
  ctx.setLineDash([6, 8]);
  ctx.strokeStyle = "rgba(100,180,255,0.5)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  let x = startX;
  let y = startY;
  let pvx = vx;
  let pvy = vy;
  ctx.moveTo(x, y);
  for (let i = 0; i < 40; i++) {
    x += pvx;
    y += pvy;
    pvy += GRAVITY;
    ctx.lineTo(x, y);
    if (x > COURT_W || x < 0 || y > COURT_H) break;
  }
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
}

function calcLaunchVelocity(
  sx: number,
  sy: number,
  tx: number,
  ty: number,
): { vx: number; vy: number } {
  const dx = tx - sx;
  const dy = ty - sy;
  // Time to travel dx horizontally; boost arc
  const t = Math.max(12, Math.abs(dx) / 6);
  const vx = dx / t;
  const vy = dy / t - (GRAVITY * t) / 2;
  return { vx, vy };
}

function checkScore(ball: Ball, hoopY: number): "through" | "rim" | "none" {
  // Through hoop: ball crosses from above hoop rim to below, horizontally within inner width
  const rimLeft = HOOP_X - HOOP_INNER / 2;
  const rimRight = HOOP_X + HOOP_INNER / 2;
  const rimY = hoopY;
  if (
    ball.x > rimLeft &&
    ball.x < rimRight &&
    ball.y >= rimY - 4 &&
    ball.y <= rimY + 10 &&
    ball.vy > 0
  ) {
    return "through";
  }
  // Rim hit: close but not through
  const dist = Math.sqrt((ball.x - HOOP_X) ** 2 + (ball.y - hoopY) ** 2);
  if (dist < HOOP_W / 2 + BALL_R && dist > HOOP_INNER / 2) {
    return "rim";
  }
  return "none";
}

export default function CursedCourtGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<GameState>(initState());
  const animRef = useRef<number>(0);
  const spinRef = useRef(0);
  const [uiScore, setUiScore] = useState(0);
  const [uiMisses, setUiMisses] = useState(0);
  const [uiStreak, setUiStreak] = useState(0);
  const [uiCursedFills, setUiCursedFills] = useState(0);
  const [uiCursedActive, setUiCursedActive] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  const syncUI = useCallback(() => {
    const s = stateRef.current;
    setUiScore(s.score);
    setUiMisses(s.misses);
    setUiStreak(s.streak);
    setUiCursedFills(s.cursedFills);
    setUiCursedActive(s.cursedActive);
  }, []);

  const activateCursed = useCallback(() => {
    const s = stateRef.current;
    if (s.cursedFills < CURSED_FILLS || s.cursedActive) return;
    s.cursedActive = true;
    s.cursedTimer = 300; // ~5 seconds at 60fps
    s.cursedFills = 0;
    syncUI();
  }, [syncUI]);

  const restartGame = useCallback(() => {
    stateRef.current = initState();
    setGameOver(false);
    setGameStarted(true);
    syncUI();
  }, [syncUI]);

  const startGame = useCallback(() => {
    setGameStarted(true);
    stateRef.current.phase = "idle";
  }, []);

  // Mouse/touch handlers
  const getCanvasPos = useCallback(
    (clientX: number, clientY: number): { x: number; y: number } => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      const scaleX = COURT_W / rect.width;
      const scaleY = COURT_H / rect.height;
      return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY,
      };
    },
    [],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const pos = getCanvasPos(e.clientX, e.clientY);
      stateRef.current.mouseX = pos.x;
      stateRef.current.mouseY = pos.y;
    },
    [getCanvasPos],
  );

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const s = stateRef.current;
      if (!gameStarted || gameOver) return;
      if (s.phase !== "idle" && s.phase !== "aim") return;
      const pos = getCanvasPos(e.clientX, e.clientY);
      const start = getAimBall(s);
      const { vx, vy } = calcLaunchVelocity(start.x, start.y, pos.x, pos.y);
      s.ball = { x: start.x, y: start.y, vx, vy };
      s.phase = "flying";
    },
    [gameStarted, gameOver, getCanvasPos],
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      const s = stateRef.current;
      if (!gameStarted || gameOver) return;
      if (s.phase !== "idle" && s.phase !== "aim") return;
      const touch = e.changedTouches[0];
      const pos = getCanvasPos(touch.clientX, touch.clientY);
      const start = getAimBall(s);
      const { vx, vy } = calcLaunchVelocity(start.x, start.y, pos.x, pos.y);
      s.ball = { x: start.x, y: start.y, vx, vy };
      s.phase = "flying";
    },
    [gameStarted, gameOver, getCanvasPos],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const loop = () => {
      const s = stateRef.current;
      s.frameCount++;

      // Update hoop
      if (gameStarted && !gameOver) {
        s.hoopSpeed = getHoopSpeed(s.score);
        if (s.cursedActive) {
          s.hoopY += s.hoopDir * s.hoopSpeed * 0.22;
          s.cursedTimer--;
          if (s.cursedTimer <= 0) {
            s.cursedActive = false;
            s.cursedTimer = 0;
          }
        } else {
          s.hoopY += s.hoopDir * s.hoopSpeed;
        }
        if (s.hoopY >= HOOP_Y_MAX) {
          s.hoopY = HOOP_Y_MAX;
          s.hoopDir = -1;
        }
        if (s.hoopY <= HOOP_Y_MIN) {
          s.hoopY = HOOP_Y_MIN;
          s.hoopDir = 1;
        }
      }

      // Floating kanji
      for (const k of s.floatingKanji) {
        k.y += k.vy;
        if (k.y < -20) {
          k.y = COURT_H + 10;
          k.x = 30 + Math.random() * 740;
        }
      }

      // Update particles
      s.particles = s.particles
        .map((p) => ({
          ...p,
          x: p.x + p.vx,
          y: p.y + p.vy,
          vy: p.vy + 0.15,
          life: p.life - 0.035,
        }))
        .filter((p) => p.life > 0);

      // Update combo text fade
      if (s.comboAlpha > 0) s.comboAlpha -= 0.018;

      // Ball physics
      if (s.ball && s.phase === "flying") {
        s.ball.vx *= 0.998;
        s.ball.vy += GRAVITY;
        s.ball.x += s.ball.vx;
        s.ball.y += s.ball.vy;
        spinRef.current += s.ball.vx * 0.06;

        const result = checkScore(s.ball, s.hoopY);

        if (result === "through") {
          s.score += 1;
          s.streak += 1;
          s.cursedFills = Math.min(CURSED_FILLS, s.cursedFills + 1);
          let combo = "";
          if (s.streak >= 5) combo = `CURSED COMBO x${s.streak}!`;
          else if (s.streak >= 3) combo = `CURSED STREAK x${s.streak}!`;
          else if (s.streak >= 2) combo = "NICE!";
          if (combo) {
            s.comboText = combo;
            s.comboAlpha = 1;
          }
          spawnParticles(
            s,
            s.ball.x,
            s.ball.y,
            s.cursedActive ? "#3ab8ff" : "#ff9840",
            16,
          );
          s.ball = null;
          s.phase = "idle";
          syncUI();
        } else if (result === "rim") {
          s.ball.vx *= -0.3;
          s.ball.vy *= -0.4;
        } else if (
          s.ball.x > COURT_W + 20 ||
          s.ball.x < -20 ||
          s.ball.y > COURT_H + 20
        ) {
          // Miss
          s.streak = 0;
          s.misses += 1;
          s.ball = null;
          if (s.misses >= MAX_MISSES) {
            s.phase = "gameover";
            setGameOver(true);
          } else {
            s.phase = "idle";
          }
          syncUI();
        }
      }

      // --- Draw ---
      drawCourt(ctx);

      // Floating kanji
      ctx.save();
      ctx.font = "bold 22px serif";
      ctx.textAlign = "center";
      for (const k of s.floatingKanji) {
        ctx.globalAlpha = k.alpha;
        ctx.fillStyle = "#3a8fff";
        ctx.fillText(k.char, k.x, k.y);
      }
      ctx.globalAlpha = 1;
      ctx.restore();

      // Hoop
      drawHoop(ctx, s.hoopY, s.cursedActive);

      // Aim arc
      if (
        gameStarted &&
        !gameOver &&
        (s.phase === "idle" || s.phase === "aim")
      ) {
        const start = getAimBall(s);
        drawAimArc(ctx, start.x, start.y, s.mouseX, s.mouseY);
      }

      // Ball in flight
      if (s.ball) {
        drawBall(ctx, s.ball.x, s.ball.y, s.cursedActive, spinRef.current);
      } else if (gameStarted && !gameOver) {
        // Ball at player
        const pos = getAimBall(s);
        drawBall(ctx, pos.x, pos.y, s.cursedActive, spinRef.current);
      }

      // Player
      drawPlayer(ctx);

      // Particles
      ctx.save();
      for (const p of s.particles) {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
      ctx.restore();

      // Combo text
      if (s.comboAlpha > 0) {
        ctx.save();
        ctx.globalAlpha = s.comboAlpha;
        ctx.font = "bold 28px 'Cinzel', serif";
        ctx.textAlign = "center";
        ctx.fillStyle = "#ffdd44";
        ctx.shadowColor = "#ff9800";
        ctx.shadowBlur = 18;
        ctx.fillText(s.comboText, COURT_W / 2, 120);
        ctx.restore();
      }

      // Streak multiplier display
      if (gameStarted && !gameOver && s.streak >= 3) {
        const mult = s.streak >= 5 ? 3 : 2;
        ctx.save();
        ctx.font = "bold 16px 'Cinzel', serif";
        ctx.textAlign = "left";
        ctx.fillStyle = "#ffdd44";
        ctx.shadowColor = "#ff9800";
        ctx.shadowBlur = 8;
        ctx.fillText(`${mult}x MULTIPLIER`, 16, 60);
        ctx.restore();
      }

      // Cursed energy slow flash
      if (s.cursedActive && s.cursedTimer > 0) {
        const pulse = 0.05 + 0.05 * Math.sin(s.frameCount * 0.3);
        ctx.save();
        ctx.globalAlpha = pulse;
        ctx.fillStyle = "#1a6aff";
        ctx.fillRect(0, 0, COURT_W, COURT_H);
        ctx.globalAlpha = 1;
        ctx.restore();
      }

      animRef.current = requestAnimationFrame(loop);
    };

    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, [gameStarted, gameOver, syncUI]);

  const multiplier = uiStreak >= 5 ? 3 : uiStreak >= 3 ? 2 : 1;

  return (
    <div
      className="flex flex-col items-center gap-4 w-full"
      style={{ fontFamily: "'Cinzel', serif" }}
    >
      {/* HUD */}
      {gameStarted && !gameOver && (
        <div className="flex items-center justify-between w-full max-w-3xl px-2">
          {/* Score */}
          <div className="flex flex-col items-center">
            <span
              style={{ color: "#3ab8ff", fontSize: 11, letterSpacing: "0.2em" }}
            >
              SCORE
            </span>
            <span
              style={{
                color: "#fff",
                fontSize: 28,
                fontWeight: 900,
                textShadow: "0 0 12px #3ab8ff",
              }}
            >
              {uiScore}
            </span>
          </div>
          {/* Streak */}
          <div className="flex flex-col items-center">
            <span
              style={{ color: "#ffdd44", fontSize: 11, letterSpacing: "0.2em" }}
            >
              STREAK
            </span>
            <span style={{ color: "#ffdd44", fontSize: 22, fontWeight: 700 }}>
              {uiStreak}
              {uiStreak >= 3 ? ` x${multiplier}` : ""}
            </span>
          </div>
          {/* Misses */}
          <div
            className="flex flex-col items-center"
            data-ocid="basketball.error_state"
          >
            <span
              style={{ color: "#ff4444", fontSize: 11, letterSpacing: "0.2em" }}
            >
              MISSES
            </span>
            <div className="flex gap-1">
              {["miss-a", "miss-b", "miss-c"].map((k, i) => (
                <span key={k} style={{ fontSize: 20 }}>
                  {i < uiMisses ? "💀" : "❤️"}
                </span>
              ))}
            </div>
          </div>
          {/* Cursed Energy */}
          <div className="flex flex-col items-center gap-1">
            <span
              style={{ color: "#3ab8ff", fontSize: 11, letterSpacing: "0.2em" }}
            >
              CURSED ENERGY
            </span>
            <div className="flex gap-1">
              {["f1", "f2", "f3", "f4", "f5"].map((k, i) => (
                <div
                  key={k}
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: "50%",
                    background:
                      i < uiCursedFills
                        ? uiCursedActive
                          ? "#3ab8ff"
                          : "#1a5fcc"
                        : "#1a1a2e",
                    border: "1.5px solid #3ab8ff",
                    boxShadow: i < uiCursedFills ? "0 0 8px #3ab8ff" : "none",
                  }}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={activateCursed}
              disabled={uiCursedFills < CURSED_FILLS || uiCursedActive}
              data-ocid="basketball.primary_button"
              style={{
                fontSize: 10,
                letterSpacing: "0.15em",
                padding: "3px 10px",
                borderRadius: 4,
                border: "1.5px solid #3ab8ff",
                background:
                  uiCursedFills >= CURSED_FILLS && !uiCursedActive
                    ? "rgba(30,100,255,0.35)"
                    : "rgba(10,10,30,0.6)",
                color:
                  uiCursedFills >= CURSED_FILLS && !uiCursedActive
                    ? "#3ab8ff"
                    : "#336",
                cursor:
                  uiCursedFills >= CURSED_FILLS && !uiCursedActive
                    ? "pointer"
                    : "not-allowed",
                transition: "all 0.2s",
                boxShadow: uiCursedActive ? "0 0 12px #3ab8ff" : "none",
              }}
            >
              {uiCursedActive ? "ACTIVE" : "ACTIVATE"}
            </button>
          </div>
        </div>
      )}

      {/* Canvas */}
      <div style={{ position: "relative", width: "100%", maxWidth: 800 }}>
        <canvas
          ref={canvasRef}
          width={COURT_W}
          height={COURT_H}
          onMouseMove={handleMouseMove}
          onClick={handleClick}
          onTouchEnd={handleTouchEnd}
          onKeyDown={() => {}}
          data-ocid="basketball.canvas_target"
          style={{
            width: "100%",
            borderRadius: 8,
            border: "2px solid rgba(58,136,255,0.35)",
            boxShadow:
              "0 0 30px rgba(30,80,255,0.25), 0 0 60px rgba(30,80,255,0.1)",
            cursor: gameStarted && !gameOver ? "crosshair" : "default",
            display: "block",
            background: "#050510",
          }}
        />

        {/* Start overlay */}
        {!gameStarted && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(5,5,20,0.88)",
              borderRadius: 8,
              gap: 20,
            }}
          >
            <div
              style={{
                fontSize: 38,
                fontWeight: 900,
                color: "#3ab8ff",
                textShadow: "0 0 24px #3ab8ff",
                letterSpacing: "0.15em",
              }}
            >
              🏀 CURSED COURT
            </div>
            <div
              style={{
                color: "#aaa",
                fontSize: 13,
                textAlign: "center",
                maxWidth: 340,
                lineHeight: 1.6,
              }}
            >
              Click to aim and shoot. Fill your cursed energy meter to slow the
              hoop. 3 misses and it's game over.
            </div>
            <button
              type="button"
              onClick={startGame}
              data-ocid="basketball.primary_button"
              style={{
                padding: "12px 36px",
                fontSize: 14,
                letterSpacing: "0.3em",
                fontWeight: 700,
                borderRadius: 6,
                border: "2px solid #3ab8ff",
                background: "rgba(30,80,200,0.3)",
                color: "#3ab8ff",
                cursor: "pointer",
                boxShadow: "0 0 18px rgba(58,136,255,0.4)",
              }}
            >
              ENTER DOMAIN
            </button>
          </div>
        )}

        {/* Game over overlay */}
        {gameOver && (
          <div
            data-ocid="basketball.modal"
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(5,5,20,0.92)",
              borderRadius: 8,
              gap: 16,
            }}
          >
            <div
              style={{
                fontSize: 32,
                fontWeight: 900,
                color: "#ff4444",
                textShadow: "0 0 20px #ff4444",
                letterSpacing: "0.15em",
              }}
            >
              DOMAIN COLLAPSED
            </div>
            <div style={{ color: "#aaa", fontSize: 13 }}>
              3 misses — your cursed technique failed.
            </div>
            <div
              style={{
                color: "#3ab8ff",
                fontSize: 28,
                fontWeight: 900,
                textShadow: "0 0 16px #3ab8ff",
              }}
            >
              FINAL SCORE: {uiScore}
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={restartGame}
                data-ocid="basketball.confirm_button"
                style={{
                  padding: "10px 28px",
                  fontSize: 12,
                  letterSpacing: "0.25em",
                  fontWeight: 700,
                  borderRadius: 6,
                  border: "2px solid #3ab8ff",
                  background: "rgba(30,80,200,0.3)",
                  color: "#3ab8ff",
                  cursor: "pointer",
                }}
              >
                PLAY AGAIN
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Instructions */}
      {gameStarted && !gameOver && (
        <div
          style={{
            color: "rgba(100,150,255,0.5)",
            fontSize: 11,
            letterSpacing: "0.2em",
            textAlign: "center",
          }}
        >
          CLICK TO AIM & SHOOT &nbsp;|&nbsp; FILL CURSED ENERGY TO SLOW THE HOOP
        </div>
      )}
    </div>
  );
}
