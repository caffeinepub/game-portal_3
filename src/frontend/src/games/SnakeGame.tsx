import ScoreDialog from "@/components/ScoreDialog";
import { useCallback, useEffect, useRef, useState } from "react";

const CELL_SIZE = 20;
const COLS = 25;
const ROWS = 20;
const CANVAS_W = COLS * CELL_SIZE;
const CANVAS_H = ROWS * CELL_SIZE;

type Dir = "UP" | "DOWN" | "LEFT" | "RIGHT";
type Point = { x: number; y: number };
type GameMode = null | "single" | "two";

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

export default function SnakeGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
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

  const drawBackground = useCallback((ctx: CanvasRenderingContext2D) => {
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
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const s = stateRef.current;

    drawBackground(ctx);

    // Food
    const fx = s.food.x * CELL_SIZE + CELL_SIZE / 2;
    const fy = s.food.y * CELL_SIZE + CELL_SIZE / 2;
    ctx.shadowColor = "#39FF14";
    ctx.shadowBlur = 15;
    ctx.fillStyle = "#39FF14";
    ctx.beginPath();
    ctx.arc(fx, fy, CELL_SIZE / 2 - 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // P1 snake (cyan)
    s.snake.forEach((seg, i) => {
      const isHead = i === 0;
      ctx.shadowColor = isHead ? "#00E5FF" : "#00BFFF";
      ctx.shadowBlur = isHead ? 12 : 6;
      ctx.fillStyle = isHead
        ? "#00E5FF"
        : `rgba(0, 229, 255, ${1 - (i / s.snake.length) * 0.6})`;
      const pad = isHead ? 1 : 2;
      ctx.fillRect(
        seg.x * CELL_SIZE + pad,
        seg.y * CELL_SIZE + pad,
        CELL_SIZE - pad * 2,
        CELL_SIZE - pad * 2,
      );
    });
    ctx.shadowBlur = 0;

    // P1 label
    if (s.mode === "two" && s.snake.length > 0) {
      const head = s.snake[0];
      ctx.fillStyle = "#00E5FF";
      ctx.font = "bold 9px Orbitron, monospace";
      ctx.fillText("P1", head.x * CELL_SIZE, head.y * CELL_SIZE - 3);
    }

    // P2 snake (magenta)
    if (s.mode === "two") {
      s.snake2.forEach((seg, i) => {
        const isHead = i === 0;
        ctx.shadowColor = isHead ? "#FF2D78" : "#CC2060";
        ctx.shadowBlur = isHead ? 12 : 6;
        ctx.fillStyle = isHead
          ? "#FF2D78"
          : `rgba(255, 45, 120, ${1 - (i / s.snake2.length) * 0.6})`;
        const pad = isHead ? 1 : 2;
        ctx.fillRect(
          seg.x * CELL_SIZE + pad,
          seg.y * CELL_SIZE + pad,
          CELL_SIZE - pad * 2,
          CELL_SIZE - pad * 2,
        );
      });
      ctx.shadowBlur = 0;

      if (s.snake2.length > 0) {
        const head2 = s.snake2[0];
        ctx.fillStyle = "#FF2D78";
        ctx.font = "bold 9px Orbitron, monospace";
        ctx.fillText("P2", head2.x * CELL_SIZE, head2.y * CELL_SIZE - 3);
      }
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
  }, [drawBackground]);

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
      // Two player mode
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
        setDisplayScore(s.score);
      }
      if (!ate2) newSnake2.pop();
      else {
        s.score2 += 10;
        setDisplayScore2(s.score2);
      }
      if (ate1 || ate2) s.food = randomFood([newSnake, newSnake2]);
      s.snake = newSnake;
      s.snake2 = newSnake2;
    }

    draw();
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
        // P1: WASD
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
        // P2: Arrow keys
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

  // Mode select screen
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
