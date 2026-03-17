import ScoreDialog from "@/components/ScoreDialog";
import { useCallback, useEffect, useRef, useState } from "react";

const CELL_SIZE = 20;
const COLS = 25;
const ROWS = 20;
const CANVAS_W = COLS * CELL_SIZE;
const CANVAS_H = ROWS * CELL_SIZE;

type Dir = "UP" | "DOWN" | "LEFT" | "RIGHT";
type Point = { x: number; y: number };

function randomFood(snake: Point[]): Point {
  let pos: Point;
  do {
    pos = {
      x: Math.floor(Math.random() * COLS),
      y: Math.floor(Math.random() * ROWS),
    };
  } while (snake.some((s) => s.x === pos.x && s.y === pos.y));
  return pos;
}

export default function SnakeGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({
    snake: [
      { x: 12, y: 10 },
      { x: 11, y: 10 },
      { x: 10, y: 10 },
    ] as Point[],
    dir: "RIGHT" as Dir,
    nextDir: "RIGHT" as Dir,
    food: { x: 18, y: 10 } as Point,
    score: 0,
    running: false,
    gameOver: false,
    speed: 150,
  });
  const intervalRef = useRef<number | null>(null);
  const [displayScore, setDisplayScore] = useState(0);
  const [started, setStarted] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [finalScore, setFinalScore] = useState(0);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const s = stateRef.current;

    // Background
    ctx.save();
    const bgGrad = ctx.createRadialGradient(
      CANVAS_W / 2,
      CANVAS_H / 2,
      0,
      CANVAS_W / 2,
      CANVAS_H / 2,
      CANVAS_W * 0.8,
    );
    bgGrad.addColorStop(0, "#0D0A1A");
    bgGrad.addColorStop(0.6, "#080610");
    bgGrad.addColorStop(1, "#030208");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Cursed seal hex grid
    ctx.strokeStyle = "rgba(120, 60, 220, 0.12)";
    ctx.lineWidth = 0.8;
    const hexR = 28;
    const hexW = hexR * Math.sqrt(3);
    const hexH = hexR * 2;
    for (let row = -1; row < CANVAS_H / (hexH * 0.75) + 2; row++) {
      for (let col = -1; col < CANVAS_W / hexW + 2; col++) {
        const cx2 = col * hexW + (row % 2 === 0 ? 0 : hexW / 2);
        const cy2 = row * hexH * 0.75;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const angle = (Math.PI / 3) * i - Math.PI / 6;
          const hx = cx2 + hexR * Math.cos(angle);
          const hy = cy2 + hexR * Math.sin(angle);
          if (i === 0) ctx.moveTo(hx, hy);
          else ctx.lineTo(hx, hy);
        }
        ctx.closePath();
        ctx.stroke();
      }
    }

    // Vignette
    const vign = ctx.createRadialGradient(
      CANVAS_W / 2,
      CANVAS_H / 2,
      CANVAS_W * 0.25,
      CANVAS_W / 2,
      CANVAS_H / 2,
      CANVAS_W * 0.85,
    );
    vign.addColorStop(0, "rgba(0,0,0,0)");
    vign.addColorStop(1, "rgba(0,0,0,0.65)");
    ctx.fillStyle = vign;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.restore();

    const fx = s.food.x * CELL_SIZE + CELL_SIZE / 2;
    const fy = s.food.y * CELL_SIZE + CELL_SIZE / 2;
    ctx.shadowColor = "#39FF14";
    ctx.shadowBlur = 15;
    ctx.fillStyle = "#39FF14";
    ctx.beginPath();
    ctx.arc(fx, fy, CELL_SIZE / 2 - 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    s.snake.forEach((seg, i) => {
      const isHead = i === 0;
      ctx.shadowColor = isHead ? "#00E5FF" : "#39FF14";
      ctx.shadowBlur = isHead ? 12 : 6;
      ctx.fillStyle = isHead
        ? "#00E5FF"
        : `rgba(57, 255, 20, ${1 - (i / s.snake.length) * 0.6})`;
      const pad = isHead ? 1 : 2;
      ctx.fillRect(
        seg.x * CELL_SIZE + pad,
        seg.y * CELL_SIZE + pad,
        CELL_SIZE - pad * 2,
        CELL_SIZE - pad * 2,
      );
    });
    ctx.shadowBlur = 0;
  }, []);

  const tick = useCallback(() => {
    const s = stateRef.current;
    if (!s.running) return;

    s.dir = s.nextDir;
    const head = { ...s.snake[0] };
    if (s.dir === "UP") head.y -= 1;
    else if (s.dir === "DOWN") head.y += 1;
    else if (s.dir === "LEFT") head.x -= 1;
    else head.x += 1;

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
      s.food = randomFood(newSnake);
      if (s.score % 50 === 0 && s.speed > 60) {
        s.speed = Math.max(60, s.speed - 10);
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = window.setInterval(tick, s.speed);
      }
      setDisplayScore(s.score);
    }
    s.snake = newSnake;
    draw();
  }, [draw]);

  const startGame = useCallback(() => {
    const s = stateRef.current;
    s.snake = [
      { x: 12, y: 10 },
      { x: 11, y: 10 },
      { x: 10, y: 10 },
    ];
    s.dir = "RIGHT";
    s.nextDir = "RIGHT";
    s.food = randomFood(s.snake);
    s.score = 0;
    s.running = true;
    s.gameOver = false;
    s.speed = 150;
    setDisplayScore(0);
    setStarted(true);
    setShowDialog(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = window.setInterval(tick, s.speed);
    draw();
  }, [tick, draw]);

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
      if (!newDir) return;
      const opposites: Record<Dir, Dir> = {
        UP: "DOWN",
        DOWN: "UP",
        LEFT: "RIGHT",
        RIGHT: "LEFT",
      };
      if (opposites[s.dir] !== newDir) {
        s.nextDir = newDir;
        e.preventDefault();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
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
            ARROW KEYS / WASD
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
          width={CANVAS_W}
          height={CANVAS_H}
          style={{ display: "block" }}
        />
        {!started && (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ background: "oklch(0.09 0.008 265 / 0.85)" }}
          >
            <div className="text-center">
              <p className="font-orbitron text-2xl font-black neon-cyan-text mb-2">
                SNAKE
              </p>
              <p
                className="font-orbitron text-xs mb-6"
                style={{ color: "oklch(0.72 0.015 280)" }}
              >
                Use arrow keys or WASD to move
              </p>
              <button
                type="button"
                onClick={startGame}
                className="neon-btn-filled px-8 py-3 rounded font-orbitron text-sm tracking-widest"
                data-ocid="snake.primary_button"
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
        gameName="snake"
        gameTitle="SNAKE"
        score={finalScore}
        onPlayAgain={startGame}
      />
    </div>
  );
}
