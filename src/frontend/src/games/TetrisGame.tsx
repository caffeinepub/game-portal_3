import ScoreDialog from "@/components/ScoreDialog";
import { useCallback, useEffect, useRef, useState } from "react";

const COLS = 10;
const ROWS = 20;
const CELL = 30;
const CANVAS_W = COLS * CELL;
const CANVAS_H = ROWS * CELL;
const PREVIEW_SIZE = 4 * CELL;

type Board = (string | null)[][];

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

export default function TetrisGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewRef = useRef<HTMLCanvasElement>(null);

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

  const drawBoard = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const s = stateRef.current;

    // Increment bg animation frame
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
      ctx.globalAlpha = 0.06 + Math.sin(bgF * 0.02 + i) * 0.02;
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
    ctx.fillStyle = "rgba(0,0,0,0.08)";
    for (let y = 0; y < CANVAS_H; y += 4) {
      ctx.fillRect(0, y, CANVAS_W, 2);
    }
    ctx.restore();

    // Placed blocks
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const color = s.board[r][c];
        if (color) {
          ctx.shadowColor = color;
          ctx.shadowBlur = 8;
          ctx.fillStyle = color;
          ctx.fillRect(c * CELL + 1, r * CELL + 1, CELL - 2, CELL - 2);
          ctx.shadowBlur = 0;
          // inner highlight
          ctx.fillStyle = "rgba(255,255,255,0.15)";
          ctx.fillRect(c * CELL + 1, r * CELL + 1, CELL - 2, 4);
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

    // Active piece
    if (s.running && s.shape.length) {
      const tetDef = TETROMINOES[s.piece];
      ctx.shadowColor = tetDef.glow;
      ctx.shadowBlur = 14;
      ctx.fillStyle = tetDef.color;
      for (let r = 0; r < s.shape.length; r++) {
        for (let c = 0; c < s.shape[r].length; c++) {
          if (s.shape[r][c]) {
            ctx.fillRect(
              (s.col + c) * CELL + 1,
              (s.row + r) * CELL + 1,
              CELL - 2,
              CELL - 2,
            );
            ctx.fillStyle = "rgba(255,255,255,0.15)";
            ctx.fillRect(
              (s.col + c) * CELL + 1,
              (s.row + r) * CELL + 1,
              CELL - 2,
              4,
            );
            ctx.fillStyle = tetDef.color;
          }
        }
      }
      ctx.shadowBlur = 0;
    }
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

    ctx.shadowColor = tetDef.glow;
    ctx.shadowBlur = 10;
    ctx.fillStyle = tetDef.color;
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c]) {
          ctx.fillRect(
            (offsetX + c) * CELL + 1,
            (offsetY + r) * CELL + 1,
            CELL - 2,
            CELL - 2,
          );
        }
      }
    }
    ctx.shadowBlur = 0;
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
  }, [spawnPiece, drawBoard]);

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
    setDisplay({ score: 0, level: 1, lines: 0 });
    setStarted(true);
    setShowDialog(false);
    drawPreview();
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(gameLoop);
  }, [gameLoop, drawPreview]);

  useEffect(() => {
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
