import ScoreDialog from "@/components/ScoreDialog";
import { useCallback, useEffect, useRef, useState } from "react";

const CELL_SIZE = 22;
const COLS = 25;
const ROWS = 20;
const CANVAS_W = COLS * CELL_SIZE;
const CANVAS_H = ROWS * CELL_SIZE;

type Dir = "UP" | "DOWN" | "LEFT" | "RIGHT";
type Point = { x: number; y: number };
type GameMode = null | "single" | "two";
type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
};

function randomFood(snakes: Point[][]): Point {
  let pos: Point;
  const allOccupied = snakes.flat();
  do {
    pos = {
      x: Math.floor(Math.random() * COLS),
      y: Math.floor(Math.random() * ROWS),
    };
  } while (allOccupied.some((s) => s.x === pos.x && s.y === pos.y));
  return pos;
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

export default function SnakeGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const frameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const accumRef = useRef<number>(0);

  const stateRef = useRef({
    snake: [
      { x: 12, y: 10 },
      { x: 11, y: 10 },
      { x: 10, y: 10 },
    ] as Point[],
    snake2: [
      { x: 14, y: 10 },
      { x: 15, y: 10 },
      { x: 16, y: 10 },
    ] as Point[],
    dir: "RIGHT" as Dir,
    dir2: "LEFT" as Dir,
    nextDir: "RIGHT" as Dir,
    nextDir2: "LEFT" as Dir,
    food: { x: 18, y: 10 } as Point,
    score: 0,
    score2: 0,
    running: false,
    gameOver: false,
    speed: 150,
    mode: "single" as "single" | "two",
    winner: "" as "" | "P1" | "P2",
    foodAnim: 0,
  });
  const intervalRef = useRef<number | null>(null);
  const [displayScore, setDisplayScore] = useState(0);
  const [displayScore2, setDisplayScore2] = useState(0);
  const [showDialog, setShowDialog] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [mode, setMode] = useState<GameMode>(null);
  const [gameWinner, setGameWinner] = useState<"" | "P1" | "P2">("");
  const [p1Wins, setP1Wins] = useState(0);
  const [p2Wins, setP2Wins] = useState(0);

  const spawnParticles = useCallback(
    (cx: number, cy: number, color: string) => {
      for (let i = 0; i < 10; i++) {
        const angle = (Math.PI * 2 * i) / 10 + Math.random() * 0.4;
        const speed = 1.5 + Math.random() * 2.5;
        particlesRef.current.push({
          x: cx,
          y: cy,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 1,
          color,
          size: 2 + Math.random() * 3,
        });
      }
    },
    [],
  );

  const drawBackground = useCallback((ctx: CanvasRenderingContext2D) => {
    // Dark grass-like gradient background
    const bgGrad = ctx.createLinearGradient(0, 0, CANVAS_W, CANVAS_H);
    bgGrad.addColorStop(0, "#0a1a0a");
    bgGrad.addColorStop(0.5, "#061206");
    bgGrad.addColorStop(1, "#030a03");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Subtle grid lines
    ctx.strokeStyle = "rgba(0, 180, 0, 0.06)";
    ctx.lineWidth = 0.5;
    for (let x = 0; x <= CANVAS_W; x += CELL_SIZE) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, CANVAS_H);
      ctx.stroke();
    }
    for (let y = 0; y <= CANVAS_H; y += CELL_SIZE) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(CANVAS_W, y);
      ctx.stroke();
    }

    // Subtle checkerboard grass texture
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        if ((row + col) % 2 === 0) {
          ctx.fillStyle = "rgba(0, 120, 0, 0.04)";
          ctx.fillRect(col * CELL_SIZE, row * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        }
      }
    }

    // Vignette
    const vign = ctx.createRadialGradient(
      CANVAS_W / 2,
      CANVAS_H / 2,
      CANVAS_W * 0.2,
      CANVAS_W / 2,
      CANVAS_H / 2,
      CANVAS_W * 0.75,
    );
    vign.addColorStop(0, "rgba(0,0,0,0)");
    vign.addColorStop(1, "rgba(0,0,0,0.55)");
    ctx.fillStyle = vign;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  }, []);

  const drawApple = useCallback(
    (ctx: CanvasRenderingContext2D, food: Point, anim: number) => {
      const cx = food.x * CELL_SIZE + CELL_SIZE / 2;
      const cy = food.y * CELL_SIZE + CELL_SIZE / 2;
      const pulse = 1 + Math.sin(anim * 0.05) * 0.08;
      const r = (CELL_SIZE / 2 - 2) * pulse;

      ctx.save();
      ctx.translate(cx, cy);

      // Glow
      ctx.shadowColor = "#ff3333";
      ctx.shadowBlur = 14;

      // Apple body gradient
      const grad = ctx.createRadialGradient(
        -r * 0.3,
        -r * 0.3,
        r * 0.1,
        0,
        0,
        r,
      );
      grad.addColorStop(0, "#ff6666");
      grad.addColorStop(0.45, "#cc1111");
      grad.addColorStop(1, "#660000");
      ctx.fillStyle = grad;
      ctx.beginPath();
      // Apple shape: two circles merged
      ctx.arc(r * 0.18, 0, r * 0.82, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(-r * 0.18, 0, r * 0.82, 0, Math.PI * 2);
      ctx.fill();

      ctx.shadowBlur = 0;

      // Shine highlight
      const shine = ctx.createRadialGradient(
        -r * 0.35,
        -r * 0.38,
        0,
        -r * 0.2,
        -r * 0.25,
        r * 0.48,
      );
      shine.addColorStop(0, "rgba(255,255,255,0.55)");
      shine.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = shine;
      ctx.beginPath();
      ctx.ellipse(
        -r * 0.25,
        -r * 0.3,
        r * 0.38,
        r * 0.25,
        -0.4,
        0,
        Math.PI * 2,
      );
      ctx.fill();

      // Stem
      ctx.strokeStyle = "#5a3000";
      ctx.lineWidth = 1.8;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(r * 0.05, -r * 0.8);
      ctx.quadraticCurveTo(r * 0.4, -r * 1.3, r * 0.3, -r * 1.5);
      ctx.stroke();

      // Leaf
      ctx.fillStyle = "#22aa22";
      ctx.shadowColor = "#00ff00";
      ctx.shadowBlur = 4;
      ctx.beginPath();
      ctx.ellipse(
        r * 0.28,
        -r * 1.15,
        r * 0.28,
        r * 0.14,
        -0.8,
        0,
        Math.PI * 2,
      );
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.restore();
    },
    [],
  );

  const drawSnakeSegment = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      seg: Point,
      prev: Point | null,
      _next: Point | null,
      idx: number,
      total: number,
      isHead: boolean,
      dir: Dir,
      baseColor: string,
      glowColor: string,
      scale2: string,
    ) => {
      const t = idx / Math.max(total - 1, 1);
      const pad = isHead ? 1 : lerp(2, 5, t);
      const x = seg.x * CELL_SIZE + pad;
      const y = seg.y * CELL_SIZE + pad;
      const w = CELL_SIZE - pad * 2;
      const h = CELL_SIZE - pad * 2;
      const radius = isHead ? 7 : lerp(7, 3, t);

      // Determine if we need to fill connection between segments
      if (prev) {
        const dx = seg.x - prev.x;
        const dy = seg.y - prev.y;
        if (Math.abs(dx) === 1 || Math.abs(dy) === 1) {
          ctx.fillStyle = glowColor;
          const cx = ((seg.x + prev.x) / 2) * CELL_SIZE + CELL_SIZE / 2;
          const cy = ((seg.y + prev.y) / 2) * CELL_SIZE + CELL_SIZE / 2;
          ctx.fillRect(
            Math.min(seg.x, prev.x) * CELL_SIZE + pad + 1,
            Math.min(seg.y, prev.y) * CELL_SIZE + pad + 1,
            (Math.abs(dx) === 1 ? 2 : 1) * CELL_SIZE - (pad + 1) * 2,
            (Math.abs(dy) === 1 ? 2 : 1) * CELL_SIZE - (pad + 1) * 2,
          );
          void cx;
          void cy;
        }
      }

      // Body gradient
      const bodyGrad = ctx.createLinearGradient(x, y, x + w, y + h);
      if (isHead) {
        bodyGrad.addColorStop(0, baseColor);
        bodyGrad.addColorStop(1, glowColor);
      } else {
        const alpha = 1 - t * 0.45;
        bodyGrad.addColorStop(
          0,
          `${baseColor}${Math.round(alpha * 255)
            .toString(16)
            .padStart(2, "0")}`,
        );
        bodyGrad.addColorStop(
          1,
          `${scale2}${Math.round(alpha * 200)
            .toString(16)
            .padStart(2, "0")}`,
        );
      }

      ctx.shadowColor = glowColor;
      ctx.shadowBlur = isHead ? 14 : lerp(10, 3, t);
      ctx.fillStyle = isHead ? baseColor : bodyGrad;
      drawRoundedRect(ctx, x, y, w, h, radius);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Scale pattern on body
      if (!isHead && idx % 2 === 0 && w > 6) {
        ctx.strokeStyle = "rgba(255,255,255,0.1)";
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.arc(x + w / 2, y + h / 2, w / 3, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Head: eyes and tongue
      if (isHead) {
        const cx = seg.x * CELL_SIZE + CELL_SIZE / 2;
        const cy2 = seg.y * CELL_SIZE + CELL_SIZE / 2;
        const eyeOffset = 4;
        const eyeRadius = 2.5;
        let e1x = cx;
        let e1y = cy2;
        let e2x = cx;
        let e2y = cy2;
        let tongueDx = 0;
        let tongueDy = 0;

        if (dir === "RIGHT") {
          e1x = cx + 3;
          e1y = cy2 - eyeOffset;
          e2x = cx + 3;
          e2y = cy2 + eyeOffset;
          tongueDx = 8;
        } else if (dir === "LEFT") {
          e1x = cx - 3;
          e1y = cy2 - eyeOffset;
          e2x = cx - 3;
          e2y = cy2 + eyeOffset;
          tongueDx = -8;
        } else if (dir === "UP") {
          e1x = cx - eyeOffset;
          e1y = cy2 - 3;
          e2x = cx + eyeOffset;
          e2y = cy2 - 3;
          tongueDy = -8;
        } else {
          e1x = cx - eyeOffset;
          e1y = cy2 + 3;
          e2x = cx + eyeOffset;
          e2y = cy2 + 3;
          tongueDy = 8;
        }

        // Tongue
        ctx.strokeStyle = "#ff4444";
        ctx.lineWidth = 1.5;
        ctx.lineCap = "round";
        const tx = cx + tongueDx * 0.5;
        const ty = cy2 + tongueDy * 0.5;
        ctx.beginPath();
        ctx.moveTo(cx + tongueDx * 0.3, cy2 + tongueDy * 0.3);
        ctx.lineTo(tx, ty);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.lineTo(
          tx + tongueDx * 0.3 + tongueDy * 0.2,
          ty + tongueDy * 0.3 - tongueDx * 0.2,
        );
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.lineTo(
          tx + tongueDx * 0.3 - tongueDy * 0.2,
          ty + tongueDy * 0.3 + tongueDx * 0.2,
        );
        ctx.stroke();

        // Eye white
        ctx.fillStyle = "white";
        ctx.shadowColor = "white";
        ctx.shadowBlur = 4;
        ctx.beginPath();
        ctx.arc(e1x, e1y, eyeRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(e2x, e2y, eyeRadius, 0, Math.PI * 2);
        ctx.fill();

        // Pupil
        ctx.fillStyle = "#000";
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.arc(
          e1x + tongueDx * 0.1,
          e1y + tongueDy * 0.1,
          1.3,
          0,
          Math.PI * 2,
        );
        ctx.fill();
        ctx.beginPath();
        ctx.arc(
          e2x + tongueDx * 0.1,
          e2y + tongueDy * 0.1,
          1.3,
          0,
          Math.PI * 2,
        );
        ctx.fill();
      }
    },
    [],
  );

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const s = stateRef.current;
    s.foodAnim = (s.foodAnim || 0) + 1;

    drawBackground(ctx);

    // Food
    drawApple(ctx, s.food, s.foodAnim);

    // Particles
    const alive: Particle[] = [];
    for (const p of particlesRef.current) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.08;
      p.life -= 0.04;
      if (p.life > 0) {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        alive.push(p);
      }
    }
    ctx.globalAlpha = 1;
    particlesRef.current = alive;

    // P1 snake
    s.snake.forEach((seg, i) => {
      drawSnakeSegment(
        ctx,
        seg,
        i < s.snake.length - 1 ? s.snake[i + 1] : null,
        i > 0 ? s.snake[i - 1] : null,
        i,
        s.snake.length,
        i === 0,
        s.dir,
        "#00e5ff",
        "#00bfff",
        "#0066aa",
      );
    });

    // P2 snake
    if (s.mode === "two") {
      s.snake2.forEach((seg, i) => {
        drawSnakeSegment(
          ctx,
          seg,
          i < s.snake2.length - 1 ? s.snake2[i + 1] : null,
          i > 0 ? s.snake2[i - 1] : null,
          i,
          s.snake2.length,
          i === 0,
          s.dir2,
          "#ff2d78",
          "#cc2060",
          "#880030",
        );
      });
    }

    // Player labels
    if (s.mode === "two") {
      const drawLabel = (snake: Point[], color: string, label: string) => {
        if (snake.length === 0) return;
        const head = snake[0];
        ctx.fillStyle = color;
        ctx.font = "bold 8px Orbitron, monospace";
        ctx.textAlign = "center";
        ctx.fillText(
          label,
          head.x * CELL_SIZE + CELL_SIZE / 2,
          head.y * CELL_SIZE - 4,
        );
        ctx.textAlign = "left";
      };
      drawLabel(s.snake, "#00e5ff", "P1");
      drawLabel(s.snake2, "#ff2d78", "P2");
    }

    // Game over overlay
    if (s.gameOver && s.winner) {
      ctx.fillStyle = "rgba(0,0,0,0.6)";
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      const winColor = s.winner === "P1" ? "#00E5FF" : "#FF2D78";
      ctx.shadowColor = winColor;
      ctx.shadowBlur = 20;
      ctx.fillStyle = winColor;
      ctx.font = "bold 36px Orbitron, monospace";
      ctx.textAlign = "center";
      ctx.fillText(`${s.winner} WINS!`, CANVAS_W / 2, CANVAS_H / 2);
      ctx.shadowBlur = 0;
      ctx.textAlign = "left";
    }
  }, [drawBackground, drawApple, drawSnakeSegment]);

  const tick = useCallback(() => {
    const s = stateRef.current;
    if (!s.running) return;

    s.dir = s.nextDir;
    const head = { ...s.snake[0] };
    if (s.dir === "UP") head.y -= 1;
    else if (s.dir === "DOWN") head.y += 1;
    else if (s.dir === "LEFT") head.x -= 1;
    else head.x += 1;

    if (s.mode === "single") {
      if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS) {
        s.running = false;
        s.gameOver = true;
        setFinalScore(s.score);
        setShowDialog(true);
        return;
      }
      if (s.snake.some((seg) => seg.x === head.x && seg.y === head.y)) {
        s.running = false;
        s.gameOver = true;
        setFinalScore(s.score);
        setShowDialog(true);
        return;
      }
      const ate = head.x === s.food.x && head.y === s.food.y;
      const newSnake = [head, ...s.snake];
      if (!ate) newSnake.pop();
      else {
        s.score += 10;
        const fx = s.food.x * CELL_SIZE + CELL_SIZE / 2;
        const fy = s.food.y * CELL_SIZE + CELL_SIZE / 2;
        spawnParticles(fx, fy, "#ff4444");
        spawnParticles(fx, fy, "#ffaa00");
        s.food = randomFood([newSnake]);
        if (s.score % 50 === 0 && s.speed > 60) {
          s.speed = Math.max(60, s.speed - 10);
          if (intervalRef.current) clearInterval(intervalRef.current);
          intervalRef.current = window.setInterval(tick, s.speed);
        }
        setDisplayScore(s.score);
      }
      s.snake = newSnake;
    } else {
      s.dir2 = s.nextDir2;
      const head2 = { ...s.snake2[0] };
      if (s.dir2 === "UP") head2.y -= 1;
      else if (s.dir2 === "DOWN") head2.y += 1;
      else if (s.dir2 === "LEFT") head2.x -= 1;
      else head2.x += 1;

      const p1Dead =
        head.x < 0 ||
        head.x >= COLS ||
        head.y < 0 ||
        head.y >= ROWS ||
        s.snake.some((seg) => seg.x === head.x && seg.y === head.y) ||
        s.snake2.some((seg) => seg.x === head.x && seg.y === head.y);
      const p2Dead =
        head2.x < 0 ||
        head2.x >= COLS ||
        head2.y < 0 ||
        head2.y >= ROWS ||
        s.snake2.some((seg) => seg.x === head2.x && seg.y === head2.y) ||
        s.snake.some((seg) => seg.x === head2.x && seg.y === head2.y);

      if (p1Dead || p2Dead) {
        s.running = false;
        s.gameOver = true;
        if (p1Dead && p2Dead) s.winner = s.score2 >= s.score ? "P2" : "P1";
        else if (p1Dead) s.winner = "P2";
        else s.winner = "P1";
        setGameWinner(s.winner);
        if (s.winner === "P1") setP1Wins((w) => w + 1);
        else if (s.winner === "P2") setP2Wins((w) => w + 1);
        setFinalScore(s.winner === "P1" ? s.score : s.score2);
        setTimeout(() => setShowDialog(true), 1000);
        draw();
        return;
      }

      const ate1 = head.x === s.food.x && head.y === s.food.y;
      const ate2 = head2.x === s.food.x && head2.y === s.food.y;
      const newSnake = [head, ...s.snake];
      const newSnake2 = [head2, ...s.snake2];
      if (!ate1) newSnake.pop();
      else {
        s.score += 10;
        spawnParticles(
          s.food.x * CELL_SIZE + CELL_SIZE / 2,
          s.food.y * CELL_SIZE + CELL_SIZE / 2,
          "#00e5ff",
        );
        setDisplayScore(s.score);
      }
      if (!ate2) newSnake2.pop();
      else {
        s.score2 += 10;
        spawnParticles(
          s.food.x * CELL_SIZE + CELL_SIZE / 2,
          s.food.y * CELL_SIZE + CELL_SIZE / 2,
          "#ff2d78",
        );
        setDisplayScore2(s.score2);
      }
      if (ate1 || ate2) s.food = randomFood([newSnake, newSnake2]);
      s.snake = newSnake;
      s.snake2 = newSnake2;
    }
    draw();
  }, [draw, spawnParticles]);

  // Continuous render loop for particle animations
  useEffect(() => {
    let running = true;
    const loop = (time: number) => {
      if (!running) return;
      const dt = time - lastTimeRef.current;
      lastTimeRef.current = time;
      accumRef.current += dt;
      // Only draw particles if game is not running (game loop handles draw during gameplay)
      if (!stateRef.current.running && particlesRef.current.length > 0) {
        draw();
      }
      frameRef.current = requestAnimationFrame(loop);
    };
    frameRef.current = requestAnimationFrame(loop);
    return () => {
      running = false;
      cancelAnimationFrame(frameRef.current);
    };
  }, [draw]);

  const startGame = useCallback(
    (selectedMode: "single" | "two") => {
      const s = stateRef.current;
      s.snake = [
        { x: 6, y: 10 },
        { x: 5, y: 10 },
        { x: 4, y: 10 },
      ];
      s.snake2 = [
        { x: 19, y: 10 },
        { x: 20, y: 10 },
        { x: 21, y: 10 },
      ];
      s.dir = "RIGHT";
      s.nextDir = "RIGHT";
      s.dir2 = "LEFT";
      s.nextDir2 = "LEFT";
      s.food = randomFood([s.snake, s.snake2]);
      s.score = 0;
      s.score2 = 0;
      s.running = true;
      s.gameOver = false;
      s.speed = 150;
      s.mode = selectedMode;
      s.winner = "";
      s.foodAnim = 0;
      particlesRef.current = [];
      setDisplayScore(0);
      setDisplayScore2(0);
      setShowDialog(false);
      setGameWinner("");
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = window.setInterval(tick, s.speed);
      draw();
    },
    [tick, draw],
  );

  const handleModeSelect = useCallback(
    (selectedMode: "single" | "two") => {
      setMode(selectedMode);
      startGame(selectedMode);
    },
    [startGame],
  );

  const handleBack = useCallback(() => {
    stateRef.current.running = false;
    if (intervalRef.current) clearInterval(intervalRef.current);
    setMode(null);
    setShowDialog(false);
    setDisplayScore(0);
    setDisplayScore2(0);
    setGameWinner("");
    setP1Wins(0);
    setP2Wins(0);
  }, []);

  useEffect(() => {
    draw();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [draw]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const s = stateRef.current;
      if (!s.running) return;
      const opposites: Record<Dir, Dir> = {
        UP: "DOWN",
        DOWN: "UP",
        LEFT: "RIGHT",
        RIGHT: "LEFT",
      };
      if (s.mode === "single") {
        const map: Record<string, Dir> = {
          ArrowUp: "UP",
          ArrowDown: "DOWN",
          ArrowLeft: "LEFT",
          ArrowRight: "RIGHT",
          w: "UP",
          s: "DOWN",
          a: "LEFT",
          d: "RIGHT",
        };
        const newDir = map[e.key];
        if (newDir && opposites[s.dir] !== newDir) {
          s.nextDir = newDir;
          e.preventDefault();
        }
      } else {
        const p1Map: Record<string, Dir> = {
          w: "UP",
          s: "DOWN",
          a: "LEFT",
          d: "RIGHT",
        };
        const p1Dir = p1Map[e.key];
        if (p1Dir && opposites[s.dir] !== p1Dir) {
          s.nextDir = p1Dir;
          e.preventDefault();
        }
        const p2Map: Record<string, Dir> = {
          ArrowUp: "UP",
          ArrowDown: "DOWN",
          ArrowLeft: "LEFT",
          ArrowRight: "RIGHT",
        };
        const p2Dir = p2Map[e.key];
        if (p2Dir && opposites[s.dir2] !== p2Dir) {
          s.nextDir2 = p2Dir;
          e.preventDefault();
        }
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  if (!mode) {
    return (
      <div className="flex flex-col items-center gap-8">
        <p className="font-orbitron text-2xl font-black neon-cyan-text tracking-widest">
          SNAKE
        </p>
        <p
          className="font-orbitron text-sm tracking-widest"
          style={{ color: "oklch(0.72 0.015 280)" }}
        >
          SELECT MODE
        </p>
        <div className="flex gap-6">
          <button
            type="button"
            onClick={() => handleModeSelect("single")}
            className="neon-btn-filled px-10 py-4 rounded font-orbitron text-sm tracking-widest flex flex-col items-center gap-1"
            data-ocid="snake.primary_button"
          >
            <span>1 PLAYER</span>
            <span className="text-xs opacity-70">Arrow Keys / WASD</span>
          </button>
          <button
            type="button"
            onClick={() => handleModeSelect("two")}
            className="neon-btn-cyan px-10 py-4 rounded font-orbitron text-sm tracking-widest flex flex-col items-center gap-1"
            data-ocid="snake.secondary_button"
          >
            <span>2 PLAYERS</span>
            <span className="text-xs opacity-70">P1: WASD · P2: Arrows</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6">
      {mode === "single" ? (
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
              ARROW KEYS / WASD
            </p>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-10">
          <div className="text-center">
            <p
              className="font-orbitron text-xs tracking-widest"
              style={{ color: "#00E5FF" }}
            >
              P1 SCORE
            </p>
            <p
              className="font-orbitron text-3xl font-black"
              style={{ color: "#00E5FF", textShadow: "0 0 12px #00E5FF" }}
            >
              {displayScore}
            </p>
            <p
              className="font-orbitron text-xs"
              style={{ color: "oklch(0.55 0.01 270)" }}
            >
              WASD
            </p>
          </div>
          <div className="flex flex-col items-center gap-1">
            {gameWinner && (
              <p
                className="font-orbitron text-lg font-black"
                style={{ color: gameWinner === "P1" ? "#00E5FF" : "#FF2D78" }}
              >
                {gameWinner} WINS!
              </p>
            )}
            <p
              className="font-orbitron text-xs tracking-widest"
              style={{ color: "oklch(0.55 0.01 270)" }}
            >
              MATCH WINS
            </p>
            <div className="flex gap-3 font-orbitron text-xs">
              <span style={{ color: "#00E5FF", textShadow: "0 0 8px #00E5FF" }}>
                P1: {p1Wins}
              </span>
              <span style={{ color: "#FF2D78", textShadow: "0 0 8px #FF2D78" }}>
                P2: {p2Wins}
              </span>
            </div>
          </div>
          <div className="text-center">
            <p
              className="font-orbitron text-xs tracking-widest"
              style={{ color: "#FF2D78" }}
            >
              P2 SCORE
            </p>
            <p
              className="font-orbitron text-3xl font-black"
              style={{ color: "#FF2D78", textShadow: "0 0 12px #FF2D78" }}
            >
              {displayScore2}
            </p>
            <p
              className="font-orbitron text-xs"
              style={{ color: "oklch(0.55 0.01 270)" }}
            >
              ARROW KEYS
            </p>
          </div>
        </div>
      )}

      <div
        className="relative"
        style={{
          border: "1px solid rgba(0,180,0,0.4)",
          boxShadow:
            "0 0 24px rgba(0,180,0,0.2), inset 0 0 40px rgba(0,0,0,0.4)",
          borderRadius: "4px",
        }}
      >
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          style={{ display: "block", borderRadius: "4px" }}
        />
      </div>

      <button
        type="button"
        onClick={handleBack}
        className="px-6 py-2 rounded font-orbitron text-xs tracking-widest uppercase"
        style={{
          border: "1px solid oklch(0.55 0.01 270)",
          color: "oklch(0.55 0.01 270)",
        }}
        data-ocid="snake.cancel_button"
      >
        ← BACK TO MODE SELECT
      </button>

      <ScoreDialog
        open={showDialog}
        onClose={() => setShowDialog(false)}
        gameName="snake"
        gameTitle="SNAKE"
        score={finalScore}
        onPlayAgain={() => startGame(stateRef.current.mode)}
      />
    </div>
  );
}
