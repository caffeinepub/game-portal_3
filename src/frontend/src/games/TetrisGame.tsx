import ScoreDialog from "@/components/ScoreDialog";
import { useCallback, useEffect, useRef, useState } from "react";

const COLS = 10;
const ROWS = 20;
const CELL = 30;
const CANVAS_W = COLS * CELL;
const CANVAS_H = ROWS * CELL;
const PREVIEW_SIZE = 4 * CELL;

type Board = (string | null)[][];

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

interface CursedOrb {
  x: number;
  y: number;
  vy: number;
  radius: number;
  alpha: number;
  phase: number;
}

interface KanjiFragment {
  x: number;
  y: number;
  vy: number;
  char: string;
  alpha: number;
  size: number;
}

const TETROMINOES: Record<
  string,
  { shape: number[][]; color: string; glow: string }
> = {
  I: { shape: [[1, 1, 1, 1]], color: "#00E5FF", glow: "#00E5FF" },
  O: {
    shape: [
      [1, 1],
      [1, 1],
    ],
    color: "#FFE600",
    glow: "#FFE600",
  },
  T: {
    shape: [
      [0, 1, 0],
      [1, 1, 1],
    ],
    color: "#CC44FF",
    glow: "#CC44FF",
  },
  S: {
    shape: [
      [0, 1, 1],
      [1, 1, 0],
    ],
    color: "#39FF14",
    glow: "#39FF14",
  },
  Z: {
    shape: [
      [1, 1, 0],
      [0, 1, 1],
    ],
    color: "#FF2D55",
    glow: "#FF2D55",
  },
  J: {
    shape: [
      [1, 0, 0],
      [1, 1, 1],
    ],
    color: "#0055FF",
    glow: "#5588FF",
  },
  L: {
    shape: [
      [0, 0, 1],
      [1, 1, 1],
    ],
    color: "#FF8C00",
    glow: "#FF8C00",
  },
};

const PIECE_KEYS = Object.keys(TETROMINOES);
const KANJI_CHARS = ["呪", "術", "廻", "戦", "霊", "域", "展", "開"];

function emptyBoard(): Board {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(null));
}

function randomPiece() {
  return PIECE_KEYS[Math.floor(Math.random() * PIECE_KEYS.length)];
}

function rotate(shape: number[][]): number[][] {
  const rows = shape.length;
  const cols = shape[0].length;
  const result: number[][] = Array.from({ length: cols }, () =>
    Array(rows).fill(0),
  );
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      result[c][rows - 1 - r] = shape[r][c];
    }
  }
  return result;
}

function isValid(
  board: Board,
  shape: number[][],
  row: number,
  col: number,
): boolean {
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (!shape[r][c]) continue;
      const nr = row + r;
      const nc = col + c;
      if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) return false;
      if (board[nr][nc]) return false;
    }
  }
  return true;
}

function placePiece(
  board: Board,
  shape: number[][],
  row: number,
  col: number,
  key: string,
): Board {
  const newBoard = board.map((r) => [...r]);
  const color = TETROMINOES[key].color;
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (shape[r][c]) {
        newBoard[row + r][col + c] = color;
      }
    }
  }
  return newBoard;
}

function clearLines(board: Board): { board: Board; cleared: number } {
  const newBoard = board.filter((row) => row.some((cell) => !cell));
  const cleared = ROWS - newBoard.length;
  const top = Array.from({ length: cleared }, () => Array(COLS).fill(null));
  return { board: [...top, ...newBoard], cleared };
}

function calcScore(cleared: number, level: number): number {
  const base = [0, 100, 300, 500, 800];
  return (base[cleared] ?? 0) * level;
}

function dropGhost(
  board: Board,
  shape: number[][],
  row: number,
  col: number,
): number {
  let ghostRow = row;
  while (isValid(board, shape, ghostRow + 1, col)) ghostRow++;
  return ghostRow;
}

// Draw a 3D beveled block cell
function drawBeveledBlock(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string,
  glowColor: string,
) {
  const pad = 1;
  const bx = x + pad;
  const by = y + pad;
  const bs = size - pad * 2;

  // Glow
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = 10;

  // Base fill
  ctx.fillStyle = color;
  ctx.fillRect(bx, by, bs, bs);
  ctx.shadowBlur = 0;

  // Top-left bright highlight bevel
  ctx.fillStyle = "rgba(255,255,255,0.45)";
  ctx.fillRect(bx, by, bs, 3); // top edge
  ctx.fillRect(bx, by, 3, bs); // left edge

  // Bottom-right dark shadow bevel
  ctx.fillStyle = "rgba(0,0,0,0.45)";
  ctx.fillRect(bx, by + bs - 3, bs, 3); // bottom edge
  ctx.fillRect(bx + bs - 3, by, 3, bs); // right edge

  // Inner shine stripe
  ctx.fillStyle = "rgba(255,255,255,0.18)";
  ctx.fillRect(bx + 3, by + 3, bs - 6, 4);

  // Diagonal texture lines
  ctx.strokeStyle = "rgba(255,255,255,0.06)";
  ctx.lineWidth = 1;
  for (let d = 4; d < bs; d += 7) {
    ctx.beginPath();
    ctx.moveTo(bx + d, by);
    ctx.lineTo(bx, by + d);
    ctx.stroke();
  }
}

function initOrbsAndKanji(
  orbsRef: React.MutableRefObject<CursedOrb[]>,
  kanjiRef: React.MutableRefObject<KanjiFragment[]>,
) {
  orbsRef.current = Array.from({ length: 8 }, (_, i) => ({
    x: 30 + ((i * 37) % CANVAS_W),
    y: 20 + ((i * 61) % CANVAS_H),
    vy: 0.2 + (i % 3) * 0.1,
    radius: 18 + (i % 4) * 10,
    alpha: 0.06 + (i % 3) * 0.02,
    phase: i * 0.8,
  }));
  kanjiRef.current = Array.from({ length: 6 }, (_, i) => ({
    x: 20 + ((i * 53) % CANVAS_W),
    y: (i * 71) % CANVAS_H,
    vy: 0.3 + (i % 3) * 0.15,
    char: KANJI_CHARS[i % KANJI_CHARS.length],
    alpha: 0.06 + (i % 2) * 0.03,
    size: 14 + (i % 3) * 5,
  }));
}

export default function TetrisGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const orbsRef = useRef<CursedOrb[]>([]);
  const kanjiRef = useRef<KanjiFragment[]>([]);

  const stateRef = useRef({
    board: emptyBoard(),
    piece: randomPiece(),
    nextPiece: randomPiece(),
    shape: [] as number[][],
    row: 0,
    col: 0,
    score: 0,
    level: 1,
    lines: 0,
    running: false,
    gameOver: false,
    bgFrame: 0,
  });

  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef(0);
  const dropIntervalRef = useRef(800);
  const dropAccumRef = useRef(0);
  const softDropRef = useRef(false);

  const [display, setDisplay] = useState({ score: 0, level: 1, lines: 0 });
  const [started, setStarted] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [finalScore, setFinalScore] = useState(0);

  const spawnLineClearParticles = useCallback(
    (clearedRows: number[], board: Board) => {
      const colors = [
        "#00E5FF",
        "#FF3DF7",
        "#FFE600",
        "#39FF14",
        "#CC44FF",
        "#FF2D55",
        "#FF8C00",
      ];
      for (const rowIdx of clearedRows) {
        for (let c = 0; c < COLS; c++) {
          const cellColor = board[rowIdx][c];
          const count = 3;
          for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1.5 + Math.random() * 3;
            particlesRef.current.push({
              x: c * CELL + CELL / 2,
              y: rowIdx * CELL + CELL / 2,
              vx: Math.cos(angle) * speed,
              vy: Math.sin(angle) * speed,
              life: 40 + Math.random() * 30,
              maxLife: 70,
              color:
                cellColor ?? colors[Math.floor(Math.random() * colors.length)],
              size: 2 + Math.random() * 3,
            });
          }
        }
      }
    },
    [],
  );

  const drawBoard = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const s = stateRef.current;

    s.bgFrame = (s.bgFrame || 0) + 1;
    const bgF = s.bgFrame;

    // Background
    ctx.save();
    const tetBg = ctx.createLinearGradient(0, 0, CANVAS_W, CANVAS_H);
    tetBg.addColorStop(0, "#040215");
    tetBg.addColorStop(0.5, "#07041A");
    tetBg.addColorStop(1, "#030010");
    ctx.fillStyle = tetBg;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Cursed energy orbs drifting
    for (const orb of orbsRef.current) {
      orb.y -= orb.vy;
      orb.phase += 0.02;
      orb.x += Math.sin(orb.phase) * 0.4;
      if (orb.y + orb.radius < 0) {
        orb.y = CANVAS_H + orb.radius;
        orb.x = Math.random() * CANVAS_W;
      }
      const grad = ctx.createRadialGradient(
        orb.x,
        orb.y,
        0,
        orb.x,
        orb.y,
        orb.radius,
      );
      grad.addColorStop(0, `rgba(0,180,255,${orb.alpha * 2.5})`);
      grad.addColorStop(0.5, `rgba(0,100,220,${orb.alpha})`);
      grad.addColorStop(1, "rgba(0,50,180,0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(orb.x, orb.y, orb.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Kanji fragments drifting upward
    ctx.textAlign = "center";
    for (const kf of kanjiRef.current) {
      kf.y -= kf.vy;
      if (kf.y + kf.size < 0) {
        kf.y = CANVAS_H + kf.size;
        kf.x = Math.random() * CANVAS_W;
        kf.char = KANJI_CHARS[Math.floor(Math.random() * KANJI_CHARS.length)];
      }
      ctx.globalAlpha = kf.alpha;
      ctx.fillStyle = "#00aaff";
      ctx.font = `${kf.size}px serif`;
      ctx.fillText(kf.char, kf.x, kf.y);
    }
    ctx.globalAlpha = 1;
    ctx.textAlign = "left";

    // Animated ghost blocks drifting down
    const ghostColors = [
      "#FF2D78",
      "#00E5FF",
      "#FFE600",
      "#39FF14",
      "#FF9900",
      "#7C3AED",
      "#FF3DF7",
    ];
    for (let i = 0; i < 12; i++) {
      const col2 = (i * 3 + 1) % COLS;
      const speed = 0.15 + (i % 3) * 0.08;
      const startY = (i * 47 + 11) % CANVAS_H;
      const by = ((startY + bgF * speed) % (CANVAS_H + CELL * 4)) - CELL * 2;
      const colorIdx = i % ghostColors.length;
      ctx.globalAlpha = 0.04 + Math.sin(bgF * 0.02 + i) * 0.015;
      ctx.fillStyle = ghostColors[colorIdx];
      ctx.fillRect(col2 * CELL + 1, by, CELL - 2, CELL - 2);
      ctx.fillRect(col2 * CELL + 1, by + CELL, CELL - 2, CELL - 2);
      ctx.fillRect((col2 + 1) * CELL + 1, by + CELL, CELL - 2, CELL - 2);
    }
    ctx.globalAlpha = 1;

    // Grid lines
    ctx.strokeStyle = "rgba(0, 229, 255, 0.04)";
    ctx.lineWidth = 0.5;
    for (let x = 0; x <= COLS; x++) {
      ctx.beginPath();
      ctx.moveTo(x * CELL, 0);
      ctx.lineTo(x * CELL, CANVAS_H);
      ctx.stroke();
    }
    for (let y = 0; y <= ROWS; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * CELL);
      ctx.lineTo(CANVAS_W, y * CELL);
      ctx.stroke();
    }

    // Scanlines
    ctx.fillStyle = "rgba(0,0,0,0.07)";
    for (let y = 0; y < CANVAS_H; y += 4) {
      ctx.fillRect(0, y, CANVAS_W, 2);
    }
    ctx.restore();

    // Placed blocks (3D beveled)
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const color = s.board[r][c];
        if (color) {
          drawBeveledBlock(ctx, c * CELL, r * CELL, CELL, color, color);
        }
      }
    }

    // Ghost piece
    if (s.running && s.shape.length) {
      const ghostRow = dropGhost(s.board, s.shape, s.row, s.col);
      const tetDef = TETROMINOES[s.piece];
      ctx.strokeStyle = tetDef.color;
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.3;
      for (let r = 0; r < s.shape.length; r++) {
        for (let c = 0; c < s.shape[r].length; c++) {
          if (s.shape[r][c]) {
            ctx.strokeRect(
              (s.col + c) * CELL + 1,
              (ghostRow + r) * CELL + 1,
              CELL - 2,
              CELL - 2,
            );
          }
        }
      }
      ctx.globalAlpha = 1;
    }

    // Active piece (3D beveled)
    if (s.running && s.shape.length) {
      const tetDef = TETROMINOES[s.piece];
      for (let r = 0; r < s.shape.length; r++) {
        for (let c = 0; c < s.shape[r].length; c++) {
          if (s.shape[r][c]) {
            drawBeveledBlock(
              ctx,
              (s.col + c) * CELL,
              (s.row + r) * CELL,
              CELL,
              tetDef.color,
              tetDef.glow,
            );
          }
        }
      }
    }

    // Particles
    const alive: Particle[] = [];
    for (const p of particlesRef.current) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.08; // gravity
      p.life--;
      if (p.life > 0) {
        const a = p.life / p.maxLife;
        ctx.globalAlpha = a;
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 4;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * a, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        alive.push(p);
      }
    }
    ctx.globalAlpha = 1;
    particlesRef.current = alive;
  }, []);

  const drawPreview = useCallback(() => {
    const canvas = previewRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const s = stateRef.current;

    ctx.fillStyle = "#0B0B10";
    ctx.fillRect(0, 0, PREVIEW_SIZE, PREVIEW_SIZE);

    const tetDef = TETROMINOES[s.nextPiece];
    const shape = tetDef.shape;
    const offsetX = Math.floor((4 - shape[0].length) / 2);
    const offsetY = Math.floor((4 - shape.length) / 2);

    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c]) {
          drawBeveledBlock(
            ctx,
            (offsetX + c) * CELL,
            (offsetY + r) * CELL,
            CELL,
            tetDef.color,
            tetDef.glow,
          );
        }
      }
    }
  }, []);

  const spawnPiece = useCallback(() => {
    const s = stateRef.current;
    s.piece = s.nextPiece;
    s.nextPiece = randomPiece();
    s.shape = TETROMINOES[s.piece].shape.map((r) => [...r]);
    s.col = Math.floor((COLS - s.shape[0].length) / 2);
    s.row = 0;
    if (!isValid(s.board, s.shape, s.row, s.col)) {
      s.running = false;
      s.gameOver = true;
      setFinalScore(s.score);
      setShowDialog(true);
    }
    drawPreview();
  }, [drawPreview]);

  const lockPiece = useCallback(() => {
    const s = stateRef.current;
    s.board = placePiece(s.board, s.shape, s.row, s.col, s.piece);

    // Find which rows will be cleared for particles
    const clearedRowIndices: number[] = [];
    for (let r = 0; r < ROWS; r++) {
      if (s.board[r].every((cell) => cell !== null)) {
        clearedRowIndices.push(r);
      }
    }

    if (clearedRowIndices.length > 0) {
      spawnLineClearParticles(clearedRowIndices, s.board);
    }

    const { board: cleared, cleared: numCleared } = clearLines(s.board);
    s.board = cleared;
    if (numCleared > 0) {
      s.score += calcScore(numCleared, s.level);
      s.lines += numCleared;
      s.level = Math.floor(s.lines / 10) + 1;
      dropIntervalRef.current = Math.max(100, 800 - (s.level - 1) * 70);
      setDisplay({ score: s.score, level: s.level, lines: s.lines });
    }
    spawnPiece();
    drawBoard();
  }, [spawnPiece, drawBoard, spawnLineClearParticles]);

  const gameLoop = useCallback(
    (time: number) => {
      const s = stateRef.current;
      if (!s.running) return;

      const delta = time - lastTimeRef.current;
      lastTimeRef.current = time;
      const interval = softDropRef.current ? 50 : dropIntervalRef.current;
      dropAccumRef.current += delta;

      if (dropAccumRef.current >= interval) {
        dropAccumRef.current = 0;
        if (isValid(s.board, s.shape, s.row + 1, s.col)) {
          s.row++;
          drawBoard();
        } else {
          lockPiece();
        }
      } else {
        drawBoard();
      }

      rafRef.current = requestAnimationFrame(gameLoop);
    },
    [drawBoard, lockPiece],
  );

  const startGame = useCallback(() => {
    const s = stateRef.current;
    s.board = emptyBoard();
    s.piece = randomPiece();
    s.nextPiece = randomPiece();
    s.shape = TETROMINOES[s.piece].shape.map((r) => [...r]);
    s.col = Math.floor((COLS - s.shape[0].length) / 2);
    s.row = 0;
    s.score = 0;
    s.level = 1;
    s.lines = 0;
    s.running = true;
    s.gameOver = false;
    dropIntervalRef.current = 800;
    dropAccumRef.current = 0;
    lastTimeRef.current = 0;
    particlesRef.current = [];
    setDisplay({ score: 0, level: 1, lines: 0 });
    setStarted(true);
    setShowDialog(false);
    drawPreview();
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(gameLoop);
  }, [gameLoop, drawPreview]);

  useEffect(() => {
    initOrbsAndKanji(orbsRef, kanjiRef);
    drawBoard();
    drawPreview();
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [drawBoard, drawPreview]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const s = stateRef.current;
      if (!s.running) return;

      switch (e.key) {
        case "ArrowLeft":
          e.preventDefault();
          if (isValid(s.board, s.shape, s.row, s.col - 1)) {
            s.col--;
            drawBoard();
          }
          break;
        case "ArrowRight":
          e.preventDefault();
          if (isValid(s.board, s.shape, s.row, s.col + 1)) {
            s.col++;
            drawBoard();
          }
          break;
        case "ArrowDown":
          e.preventDefault();
          softDropRef.current = true;
          break;
        case "ArrowUp": {
          e.preventDefault();
          const rotated = rotate(s.shape);
          if (isValid(s.board, rotated, s.row, s.col)) {
            s.shape = rotated;
            drawBoard();
          } else if (isValid(s.board, rotated, s.row, s.col - 1)) {
            s.shape = rotated;
            s.col--;
            drawBoard();
          } else if (isValid(s.board, rotated, s.row, s.col + 1)) {
            s.shape = rotated;
            s.col++;
            drawBoard();
          }
          break;
        }
        case " ": {
          e.preventDefault();
          const ghostRow = dropGhost(s.board, s.shape, s.row, s.col);
          s.row = ghostRow;
          lockPiece();
          break;
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") softDropRef.current = false;
    };

    window.addEventListener("keydown", handleKey);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKey);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [drawBoard, lockPiece]);

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex items-start gap-6">
        {/* Game Canvas */}
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
              style={{ background: "oklch(0.09 0.008 265 / 0.90)" }}
            >
              <div className="text-center">
                <p className="font-orbitron text-3xl font-black neon-cyan-text mb-1">
                  TETRIS
                </p>
                <p
                  className="font-orbitron text-xs mb-6"
                  style={{ color: "oklch(0.72 0.015 280)" }}
                >
                  ↑ Rotate · ← → Move · ↓ Soft Drop · Space Hard Drop
                </p>
                <button
                  type="button"
                  onClick={startGame}
                  className="neon-btn-filled px-8 py-3 rounded font-orbitron text-sm tracking-widest"
                  data-ocid="tetris.primary_button"
                >
                  START GAME
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Side Panel */}
        <div className="flex flex-col gap-4 min-w-[130px]">
          {/* Stats */}
          {[
            {
              label: "SCORE",
              value: display.score.toLocaleString(),
              neon: "neon-cyan-text",
            },
            { label: "LEVEL", value: display.level, neon: "neon-magenta-text" },
            { label: "LINES", value: display.lines, neon: "" },
          ].map(({ label, value, neon }) => (
            <div key={label} className="neon-card rounded-lg p-3 text-center">
              <p
                className="font-orbitron text-[10px] tracking-widest mb-1"
                style={{ color: "oklch(0.72 0.015 280)" }}
              >
                {label}
              </p>
              <p
                className={`font-orbitron text-xl font-black ${neon}`}
                style={!neon ? { color: "oklch(0.84 0.17 200)" } : undefined}
              >
                {value}
              </p>
            </div>
          ))}

          {/* Next Piece */}
          <div className="neon-card rounded-lg p-3">
            <p
              className="font-orbitron text-[10px] tracking-widest mb-2 text-center"
              style={{ color: "oklch(0.72 0.015 280)" }}
            >
              NEXT
            </p>
            <div
              style={{
                border: "1px solid oklch(0.84 0.17 200 / 0.3)",
                borderRadius: "4px",
              }}
            >
              <canvas
                ref={previewRef}
                width={PREVIEW_SIZE}
                height={PREVIEW_SIZE}
                style={{ display: "block" }}
              />
            </div>
          </div>

          {/* Controls hint */}
          <div
            className="neon-card rounded-lg p-3 text-center"
            style={{ fontSize: "10px" }}
          >
            <p
              className="font-orbitron text-[9px] tracking-widest mb-2"
              style={{ color: "oklch(0.72 0.015 280)" }}
            >
              CONTROLS
            </p>
            {[
              ["← →", "Move"],
              ["↑", "Rotate"],
              ["↓", "Soft Drop"],
              ["Space", "Hard Drop"],
            ].map(([key, action]) => (
              <div key={key} className="flex justify-between gap-2 mb-1">
                <span
                  className="font-orbitron"
                  style={{ color: "oklch(0.84 0.17 200)" }}
                >
                  {key}
                </span>
                <span style={{ color: "oklch(0.72 0.015 280)" }}>{action}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <ScoreDialog
        open={showDialog}
        onClose={() => setShowDialog(false)}
        gameName="tetris"
        gameTitle="TETRIS"
        score={finalScore}
        onPlayAgain={startGame}
      />
    </div>
  );
}
