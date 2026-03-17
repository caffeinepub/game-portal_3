import { useCallback, useEffect, useRef, useState } from "react";

const COURT_W = 800;
const COURT_H = 500;
const HOOP_X = 680;
const HOOP_Y_MIN = 80;
const HOOP_Y_MAX = 380;
const HOOP_W = 60;
const HOOP_INNER = 48;
const HOOP_THICKNESS = 6;
const NET_H = 36;
const PLAYER_X = 90;
const PLAYER_Y = 320;
const BALL_R = 16;
const GRAVITY = 0.32;
const MAX_MISSES = 5;
const CURSED_FILLS = 5;

type Phase = "aim" | "flying" | "scored" | "missed" | "gameover" | "idle";
type GameMode = "1p" | "2p";

interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface PlayerState {
  score: number;
  misses: number;
  streak: number;
  cursedFills: number;
  cursedActive: boolean;
  cursedTimer: number;
}

interface GameState {
  p1: PlayerState;
  p2: PlayerState;
  currentPlayer: 1 | 2;
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

function initPlayerState(): PlayerState {
  return {
    score: 0,
    misses: 0,
    streak: 0,
    cursedFills: 0,
    cursedActive: false,
    cursedTimer: 0,
  };
}

function initState(): GameState {
  return {
    p1: initPlayerState(),
    p2: initPlayerState(),
    currentPlayer: 1,
    hoopY: 230,
    hoopDir: 1,
    hoopSpeed: 0.8,
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
  return Math.min(3.5, 0.8 + score * 0.04);
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
  const bg = ctx.createLinearGradient(0, 0, 0, COURT_H);
  bg.addColorStop(0, "#050510");
  bg.addColorStop(1, "#0a0820");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, COURT_W, COURT_H);

  const floor = ctx.createLinearGradient(0, 340, 0, COURT_H);
  floor.addColorStop(0, "#1a1008");
  floor.addColorStop(1, "#0d0804");
  ctx.fillStyle = floor;
  ctx.fillRect(0, 340, COURT_W, COURT_H - 340);

  ctx.strokeStyle = "rgba(80,60,20,0.7)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 340);
  ctx.lineTo(COURT_W, 340);
  ctx.stroke();

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

  ctx.save();
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = glow;
  ctx.strokeStyle = cursedActive ? "#60d0ff" : "#ff8c1a";
  ctx.lineWidth = HOOP_THICKNESS;
  ctx.beginPath();
  ctx.ellipse(HOOP_X, hoopY, HOOP_W / 2, 6, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

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
  for (let i = 0; i <= 5; i++) {
    const nx = netX + (i / 5) * (netXR - netX);
    const droop = Math.sin((i / 5) * Math.PI) * 8;
    ctx.beginPath();
    ctx.moveTo(nx, netTop);
    ctx.lineTo(nx + (netMid - nx + netX) * 0.08, netBot + droop);
    ctx.stroke();
  }
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
  const px = PLAYER_X;
  const py = PLAYER_Y;
  ctx.save();
  ctx.shadowColor = "#3a8fff";
  ctx.shadowBlur = 16;
  ctx.fillStyle = "#0e2a55";
  ctx.beginPath();
  ctx.ellipse(px, py + 35, 16, 32, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(px, py - 5, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#0e2a55";
  ctx.lineWidth = 8;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(px + 8, py + 10);
  ctx.quadraticCurveTo(px + 36, py - 12, px + 50, py + 4);
  ctx.stroke();
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

  ctx.strokeStyle = "rgba(80,30,0,0.7)";
  ctx.lineWidth = 1.5;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(spin);
  ctx.beginPath();
  ctx.arc(0, 0, BALL_R, 0, Math.PI * 2);
  ctx.clip();
  ctx.beginPath();
  ctx.moveTo(-BALL_R, 0);
  ctx.lineTo(BALL_R, 0);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, -BALL_R);
  ctx.lineTo(0, BALL_R);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(0, 0, BALL_R * 0.5, BALL_R, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

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

function getAimBall(): { x: number; y: number } {
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
  const t = Math.max(12, Math.abs(dx) / 6);
  const vx = dx / t;
  const vy = dy / t - (GRAVITY * t) / 2;
  return { vx, vy };
}

function checkScore(ball: Ball, hoopY: number): "through" | "rim" | "none" {
  const rimLeft = HOOP_X - HOOP_INNER / 2;
  const rimRight = HOOP_X + HOOP_INNER / 2;
  if (
    ball.x > rimLeft &&
    ball.x < rimRight &&
    ball.y >= hoopY - 4 &&
    ball.y <= hoopY + 10 &&
    ball.vy > 0
  ) {
    return "through";
  }
  const dist = Math.sqrt((ball.x - HOOP_X) ** 2 + (ball.y - hoopY) ** 2);
  if (dist < HOOP_W / 2 + BALL_R && dist > HOOP_INNER / 2) {
    return "rim";
  }
  return "none";
}

interface UiState {
  score: number;
  misses: number;
  streak: number;
  cursedFills: number;
  cursedActive: boolean;
  p1Score: number;
  p2Score: number;
  currentPlayer: 1 | 2;
  gameOver: boolean;
  gameStarted: boolean;
  mode: GameMode | null;
}

export default function CursedCourtGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<GameState>(initState());
  const animRef = useRef<number>(0);
  const spinRef = useRef(0);
  const modeRef = useRef<GameMode>("1p");

  const [ui, setUi] = useState<UiState>({
    score: 0,
    misses: 0,
    streak: 0,
    cursedFills: 0,
    cursedActive: false,
    p1Score: 0,
    p2Score: 0,
    currentPlayer: 1,
    gameOver: false,
    gameStarted: false,
    mode: null,
  });

  const [p1Wins, setP1Wins] = useState(0);
  const [p2Wins, setP2Wins] = useState(0);

  const syncUI = useCallback(() => {
    const s = stateRef.current;
    const cp = s.currentPlayer === 1 ? s.p1 : s.p2;
    setUi((prev) => ({
      ...prev,
      score: cp.score,
      misses: cp.misses,
      streak: cp.streak,
      cursedFills: cp.cursedFills,
      cursedActive: cp.cursedActive,
      p1Score: s.p1.score,
      p2Score: s.p2.score,
      currentPlayer: s.currentPlayer,
    }));
  }, []);

  // Track wins across rematches
  useEffect(() => {
    if (ui.gameOver && ui.mode === "2p") {
      if (ui.p1Score > ui.p2Score) setP1Wins((w) => w + 1);
      else if (ui.p2Score > ui.p1Score) setP2Wins((w) => w + 1);
    }
  }, [ui.gameOver, ui.mode, ui.p1Score, ui.p2Score]);

  const activateCursed = useCallback(() => {
    const s = stateRef.current;
    const cp = s.currentPlayer === 1 ? s.p1 : s.p2;
    if (cp.cursedFills < CURSED_FILLS || cp.cursedActive) return;
    cp.cursedActive = true;
    cp.cursedTimer = 300;
    cp.cursedFills = 0;
    syncUI();
  }, [syncUI]);

  const startWithMode = useCallback((mode: GameMode) => {
    modeRef.current = mode;
    stateRef.current = initState();
    stateRef.current.phase = "idle";
    setUi((prev) => ({
      ...prev,
      gameStarted: true,
      gameOver: false,
      mode,
      score: 0,
      misses: 0,
      streak: 0,
      cursedFills: 0,
      cursedActive: false,
      p1Score: 0,
      p2Score: 0,
      currentPlayer: 1,
    }));
  }, []);

  const restartGame = useCallback(() => {
    setUi((prev) => ({
      ...prev,
      gameStarted: false,
      gameOver: false,
      mode: null,
    }));
  }, []);

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

  const shoot = useCallback(
    (clientX: number, clientY: number) => {
      const s = stateRef.current;
      if (!ui.gameStarted || ui.gameOver) return;
      if (s.phase !== "idle" && s.phase !== "aim") return;
      // In 2p mode, don't allow shooting if current player is already out
      if (modeRef.current === "2p") {
        const cp = s.currentPlayer === 1 ? s.p1 : s.p2;
        if (cp.misses >= MAX_MISSES) return;
      }
      const pos = getCanvasPos(clientX, clientY);
      const start = getAimBall();
      const { vx, vy } = calcLaunchVelocity(start.x, start.y, pos.x, pos.y);
      s.ball = { x: start.x, y: start.y, vx, vy };
      s.phase = "flying";
    },
    [ui.gameStarted, ui.gameOver, getCanvasPos],
  );

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      shoot(e.clientX, e.clientY);
    },
    [shoot],
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      const touch = e.changedTouches[0];
      shoot(touch.clientX, touch.clientY);
    },
    [shoot],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const loop = () => {
      const s = stateRef.current;
      const gameStarted = ui.gameStarted;
      const gameOver = ui.gameOver;
      s.frameCount++;

      // Current player ref
      const cp = s.currentPlayer === 1 ? s.p1 : s.p2;

      // Update hoop
      if (gameStarted && !gameOver) {
        const totalScore = s.p1.score + s.p2.score;
        s.hoopSpeed = getHoopSpeed(totalScore);
        if (cp.cursedActive) {
          s.hoopY += s.hoopDir * s.hoopSpeed * 0.22;
          cp.cursedTimer--;
          if (cp.cursedTimer <= 0) {
            cp.cursedActive = false;
            cp.cursedTimer = 0;
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
          cp.score += 1;
          cp.streak += 1;
          cp.cursedFills = Math.min(CURSED_FILLS, cp.cursedFills + 1);
          let combo = "";
          if (cp.streak >= 5) combo = `CURSED COMBO x${cp.streak}!`;
          else if (cp.streak >= 3) combo = `CURSED STREAK x${cp.streak}!`;
          else if (cp.streak >= 2) combo = "NICE!";
          if (combo) {
            s.comboText = combo;
            s.comboAlpha = 1;
          }
          spawnParticles(
            s,
            s.ball.x,
            s.ball.y,
            cp.cursedActive ? "#3ab8ff" : "#ff9840",
            16,
          );
          s.ball = null;
          // Switch players in 2p mode
          if (modeRef.current === "2p") {
            const next: 1 | 2 = s.currentPlayer === 1 ? 2 : 1;
            const nextP = next === 1 ? s.p1 : s.p2;
            // Skip if next player is out
            if (nextP.misses < MAX_MISSES) {
              s.currentPlayer = next;
            }
          }
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
          cp.streak = 0;
          cp.misses += 1;
          s.ball = null;

          if (modeRef.current === "1p") {
            if (cp.misses >= MAX_MISSES) {
              s.phase = "gameover";
              setUi((prev) => ({
                ...prev,
                gameOver: true,
                p1Score: s.p1.score,
              }));
            } else {
              s.phase = "idle";
            }
          } else {
            // 2p mode
            const bothOut =
              s.p1.misses >= MAX_MISSES && s.p2.misses >= MAX_MISSES;
            if (bothOut) {
              s.phase = "gameover";
              setUi((prev) => ({
                ...prev,
                gameOver: true,
                p1Score: s.p1.score,
                p2Score: s.p2.score,
              }));
            } else {
              // Switch to the other player if they still have misses left
              const next: 1 | 2 = s.currentPlayer === 1 ? 2 : 1;
              const nextP = next === 1 ? s.p1 : s.p2;
              if (nextP.misses < MAX_MISSES) {
                s.currentPlayer = next;
              }
              // else stay on current player (they might still have shots)
              s.phase = "idle";
            }
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

      // Turn banner in 2p mode
      if (gameStarted && !gameOver && modeRef.current === "2p") {
        const bannerColor = s.currentPlayer === 1 ? "#3ab8ff" : "#c084fc";
        const bannerText =
          s.currentPlayer === 1 ? "PLAYER 1'S TURN" : "PLAYER 2'S TURN";
        ctx.save();
        ctx.font = "bold 18px 'Cinzel', serif";
        ctx.textAlign = "center";
        ctx.fillStyle = bannerColor;
        ctx.shadowColor = bannerColor;
        ctx.shadowBlur = 14;
        ctx.fillText(bannerText, COURT_W / 2, 28);
        ctx.shadowBlur = 0;
        ctx.restore();
      }

      // Hoop
      drawHoop(ctx, s.hoopY, cp.cursedActive);

      // Aim arc
      if (
        gameStarted &&
        !gameOver &&
        (s.phase === "idle" || s.phase === "aim")
      ) {
        const start = getAimBall();
        drawAimArc(ctx, start.x, start.y, s.mouseX, s.mouseY);
      }

      // Ball
      if (s.ball) {
        drawBall(ctx, s.ball.x, s.ball.y, cp.cursedActive, spinRef.current);
      } else if (gameStarted && !gameOver) {
        const pos = getAimBall();
        drawBall(ctx, pos.x, pos.y, cp.cursedActive, spinRef.current);
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

      // Streak multiplier
      if (gameStarted && !gameOver && cp.streak >= 3) {
        const mult = cp.streak >= 5 ? 3 : 2;
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
      if (cp.cursedActive && cp.cursedTimer > 0) {
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
  }, [ui.gameStarted, ui.gameOver, syncUI]);

  const is2p = ui.mode === "2p";
  const cpColor = ui.currentPlayer === 1 ? "#3ab8ff" : "#c084fc";
  const multiplier = ui.streak >= 5 ? 3 : ui.streak >= 3 ? 2 : 1;

  // Winner calc for game over in 2p
  const p1Final = stateRef.current.p1.score;
  const p2Final = stateRef.current.p2.score;
  let winnerText = "";
  let winnerColor = "#ffdd44";
  if (ui.gameOver && is2p) {
    if (p1Final > p2Final) {
      winnerText = "PLAYER 1 WINS!";
      winnerColor = "#3ab8ff";
    } else if (p2Final > p1Final) {
      winnerText = "PLAYER 2 WINS!";
      winnerColor = "#c084fc";
    } else {
      winnerText = "TIE!";
      winnerColor = "#ffdd44";
    }
  }

  return (
    <div
      className="flex flex-col items-center gap-4 w-full"
      style={{ fontFamily: "'Cinzel', serif" }}
    >
      {/* HUD */}
      {ui.gameStarted && !ui.gameOver && (
        <div className="flex items-center justify-between w-full max-w-3xl px-2">
          {/* 2P: show both scores; 1P: show single score */}
          {is2p ? (
            <>
              <div className="flex flex-col items-center">
                <span
                  style={{
                    color: "#3ab8ff",
                    fontSize: 10,
                    letterSpacing: "0.15em",
                  }}
                >
                  P1 SCORE
                </span>
                <span
                  style={{
                    color: "#3ab8ff",
                    fontSize: 24,
                    fontWeight: 900,
                    textShadow: "0 0 10px #3ab8ff",
                  }}
                >
                  {ui.p1Score}
                </span>
                <span
                  style={{
                    color: "#00E5FF",
                    fontSize: 9,
                    fontFamily: "Orbitron, monospace",
                    opacity: 0.8,
                  }}
                >
                  WINS: {p1Wins}
                </span>
              </div>
              <div className="flex flex-col items-center">
                <span
                  style={{
                    color: cpColor,
                    fontSize: 10,
                    letterSpacing: "0.15em",
                  }}
                >
                  STREAK
                </span>
                <span style={{ color: cpColor, fontSize: 20, fontWeight: 700 }}>
                  {ui.streak}
                  {ui.streak >= 3 ? ` x${multiplier}` : ""}
                </span>
              </div>
              <div
                className="flex flex-col items-center"
                data-ocid="basketball.error_state"
              >
                <span
                  style={{
                    color: "#ff4444",
                    fontSize: 10,
                    letterSpacing: "0.15em",
                  }}
                >
                  MISSES
                </span>
                <div className="flex gap-1">
                  {Array.from({ length: MAX_MISSES }, (_, i) => (
                    <span
                      key={["m0", "m1", "m2", "m3", "m4"][i]}
                      style={{ fontSize: 16 }}
                    >
                      {i < ui.misses ? "💀" : "❤️"}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex flex-col items-center gap-1">
                <span
                  style={{
                    color: cpColor,
                    fontSize: 10,
                    letterSpacing: "0.15em",
                  }}
                >
                  CURSED ENERGY
                </span>
                <div className="flex gap-1">
                  {Array.from({ length: CURSED_FILLS }, (_, i) => (
                    <div
                      key={["c0", "c1", "c2", "c3", "c4"][i]}
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: "50%",
                        background:
                          i < ui.cursedFills
                            ? ui.cursedActive
                              ? cpColor
                              : "#1a5fcc"
                            : "#1a1a2e",
                        border: `1.5px solid ${cpColor}`,
                        boxShadow:
                          i < ui.cursedFills ? `0 0 8px ${cpColor}` : "none",
                      }}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={activateCursed}
                  disabled={ui.cursedFills < CURSED_FILLS || ui.cursedActive}
                  data-ocid="basketball.primary_button"
                  style={{
                    fontSize: 9,
                    letterSpacing: "0.1em",
                    padding: "2px 8px",
                    borderRadius: 4,
                    border: `1.5px solid ${cpColor}`,
                    background:
                      ui.cursedFills >= CURSED_FILLS && !ui.cursedActive
                        ? "rgba(30,100,255,0.35)"
                        : "rgba(10,10,30,0.6)",
                    color:
                      ui.cursedFills >= CURSED_FILLS && !ui.cursedActive
                        ? cpColor
                        : "#336",
                    cursor:
                      ui.cursedFills >= CURSED_FILLS && !ui.cursedActive
                        ? "pointer"
                        : "not-allowed",
                    transition: "all 0.2s",
                    boxShadow: ui.cursedActive ? `0 0 12px ${cpColor}` : "none",
                  }}
                >
                  {ui.cursedActive ? "ACTIVE" : "ACTIVATE"}
                </button>
              </div>
              <div className="flex flex-col items-center">
                <span
                  style={{
                    color: "#c084fc",
                    fontSize: 10,
                    letterSpacing: "0.15em",
                  }}
                >
                  P2 SCORE
                </span>
                <span
                  style={{
                    color: "#c084fc",
                    fontSize: 24,
                    fontWeight: 900,
                    textShadow: "0 0 10px #c084fc",
                  }}
                >
                  {ui.p2Score}
                </span>
                <span
                  style={{
                    color: "#FF2D78",
                    fontSize: 9,
                    fontFamily: "Orbitron, monospace",
                    opacity: 0.8,
                  }}
                >
                  WINS: {p2Wins}
                </span>
              </div>
            </>
          ) : (
            <>
              <div className="flex flex-col items-center">
                <span
                  style={{
                    color: "#3ab8ff",
                    fontSize: 11,
                    letterSpacing: "0.2em",
                  }}
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
                  {ui.score}
                </span>
              </div>
              <div className="flex flex-col items-center">
                <span
                  style={{
                    color: "#ffdd44",
                    fontSize: 11,
                    letterSpacing: "0.2em",
                  }}
                >
                  STREAK
                </span>
                <span
                  style={{ color: "#ffdd44", fontSize: 22, fontWeight: 700 }}
                >
                  {ui.streak}
                  {ui.streak >= 3 ? ` x${multiplier}` : ""}
                </span>
              </div>
              <div
                className="flex flex-col items-center"
                data-ocid="basketball.error_state"
              >
                <span
                  style={{
                    color: "#ff4444",
                    fontSize: 11,
                    letterSpacing: "0.2em",
                  }}
                >
                  MISSES
                </span>
                <div className="flex gap-1">
                  {Array.from({ length: MAX_MISSES }, (_, i) => (
                    <span
                      key={["m0", "m1", "m2", "m3", "m4"][i]}
                      style={{ fontSize: 18 }}
                    >
                      {i < ui.misses ? "💀" : "❤️"}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex flex-col items-center gap-1">
                <span
                  style={{
                    color: "#3ab8ff",
                    fontSize: 11,
                    letterSpacing: "0.2em",
                  }}
                >
                  CURSED ENERGY
                </span>
                <div className="flex gap-1">
                  {Array.from({ length: CURSED_FILLS }, (_, i) => (
                    <div
                      key={["c0", "c1", "c2", "c3", "c4"][i]}
                      style={{
                        width: 14,
                        height: 14,
                        borderRadius: "50%",
                        background:
                          i < ui.cursedFills
                            ? ui.cursedActive
                              ? "#3ab8ff"
                              : "#1a5fcc"
                            : "#1a1a2e",
                        border: "1.5px solid #3ab8ff",
                        boxShadow:
                          i < ui.cursedFills ? "0 0 8px #3ab8ff" : "none",
                      }}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={activateCursed}
                  disabled={ui.cursedFills < CURSED_FILLS || ui.cursedActive}
                  data-ocid="basketball.primary_button"
                  style={{
                    fontSize: 10,
                    letterSpacing: "0.15em",
                    padding: "3px 10px",
                    borderRadius: 4,
                    border: "1.5px solid #3ab8ff",
                    background:
                      ui.cursedFills >= CURSED_FILLS && !ui.cursedActive
                        ? "rgba(30,100,255,0.35)"
                        : "rgba(10,10,30,0.6)",
                    color:
                      ui.cursedFills >= CURSED_FILLS && !ui.cursedActive
                        ? "#3ab8ff"
                        : "#336",
                    cursor:
                      ui.cursedFills >= CURSED_FILLS && !ui.cursedActive
                        ? "pointer"
                        : "not-allowed",
                    transition: "all 0.2s",
                    boxShadow: ui.cursedActive ? "0 0 12px #3ab8ff" : "none",
                  }}
                >
                  {ui.cursedActive ? "ACTIVE" : "ACTIVATE"}
                </button>
              </div>
            </>
          )}
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
            cursor: ui.gameStarted && !ui.gameOver ? "crosshair" : "default",
            display: "block",
            background: "#050510",
          }}
        />

        {/* Mode select overlay */}
        {!ui.gameStarted && (
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
              style={{ color: "#aaa", fontSize: 14, letterSpacing: "0.2em" }}
            >
              CHOOSE YOUR BATTLE
            </div>
            <div
              style={{
                color: "rgba(150,180,255,0.6)",
                fontSize: 12,
                textAlign: "center",
                maxWidth: 340,
                lineHeight: 1.6,
              }}
            >
              Click to aim and shoot. Fill your cursed energy meter to slow the
              hoop. {MAX_MISSES} misses and it's game over.
            </div>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => startWithMode("1p")}
                data-ocid="basketball.primary_button"
                style={{
                  padding: "12px 32px",
                  fontSize: 14,
                  letterSpacing: "0.25em",
                  fontWeight: 700,
                  borderRadius: 6,
                  border: "2px solid #3ab8ff",
                  background: "rgba(30,80,200,0.3)",
                  color: "#3ab8ff",
                  cursor: "pointer",
                  boxShadow: "0 0 18px rgba(58,136,255,0.4)",
                  transition: "all 0.2s",
                }}
              >
                1 PLAYER
              </button>
              <button
                type="button"
                onClick={() => startWithMode("2p")}
                data-ocid="basketball.secondary_button"
                style={{
                  padding: "12px 32px",
                  fontSize: 14,
                  letterSpacing: "0.25em",
                  fontWeight: 700,
                  borderRadius: 6,
                  border: "2px solid #c084fc",
                  background: "rgba(140,50,220,0.25)",
                  color: "#c084fc",
                  cursor: "pointer",
                  boxShadow: "0 0 18px rgba(192,132,252,0.35)",
                  transition: "all 0.2s",
                }}
              >
                2 PLAYERS
              </button>
            </div>
          </div>
        )}

        {/* Game over overlay */}
        {ui.gameOver && (
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
            {is2p ? (
              <>
                <div
                  style={{
                    display: "flex",
                    gap: 32,
                    fontSize: 20,
                    fontWeight: 700,
                  }}
                >
                  <span
                    style={{ color: "#3ab8ff", textShadow: "0 0 10px #3ab8ff" }}
                  >
                    P1: {p1Final}
                  </span>
                  <span style={{ color: "#aaa" }}>vs</span>
                  <span
                    style={{ color: "#c084fc", textShadow: "0 0 10px #c084fc" }}
                  >
                    P2: {p2Final}
                  </span>
                </div>
                <div
                  style={{
                    color: winnerColor,
                    fontSize: 28,
                    fontWeight: 900,
                    textShadow: `0 0 16px ${winnerColor}`,
                  }}
                >
                  {winnerText}
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: 24,
                    fontSize: 13,
                    fontFamily: "Orbitron, monospace",
                    letterSpacing: "0.12em",
                    marginTop: 4,
                  }}
                >
                  <span
                    style={{ color: "#00E5FF", textShadow: "0 0 8px #00E5FF" }}
                  >
                    P1 WINS: {p1Wins}
                  </span>
                  <span
                    style={{ color: "#FF2D78", textShadow: "0 0 8px #FF2D78" }}
                  >
                    P2 WINS: {p2Wins}
                  </span>
                </div>
              </>
            ) : (
              <>
                <div style={{ color: "#aaa", fontSize: 13 }}>
                  {MAX_MISSES} misses — your cursed technique failed.
                </div>
                <div
                  style={{
                    color: "#3ab8ff",
                    fontSize: 28,
                    fontWeight: 900,
                    textShadow: "0 0 16px #3ab8ff",
                  }}
                >
                  FINAL SCORE: {ui.p1Score}
                </div>
              </>
            )}
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
        )}
      </div>

      {/* Instructions */}
      {ui.gameStarted && !ui.gameOver && (
        <div
          style={{
            color: "rgba(100,150,255,0.5)",
            fontSize: 11,
            letterSpacing: "0.2em",
            textAlign: "center",
          }}
        >
          CLICK TO AIM &amp; SHOOT &nbsp;|&nbsp; FILL CURSED ENERGY TO SLOW THE
          HOOP
        </div>
      )}
    </div>
  );
}
