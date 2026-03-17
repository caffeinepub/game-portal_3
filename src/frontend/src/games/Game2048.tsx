import ScoreDialog from "@/components/ScoreDialog";
import { useCallback, useEffect, useState } from "react";

type Board = number[][];

const SIZE = 4;

function emptyBoard(): Board {
  return Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
}

function addRandom(board: Board): Board {
  const empty: [number, number][] = [];
  for (let r = 0; r < SIZE; r++)
    for (let c = 0; c < SIZE; c++) if (board[r][c] === 0) empty.push([r, c]);
  if (empty.length === 0) return board;
  const [r, c] = empty[Math.floor(Math.random() * empty.length)];
  const next = board.map((row) => [...row]);
  next[r][c] = Math.random() < 0.9 ? 2 : 4;
  return next;
}

function rotateRight(board: Board): Board {
  return board[0].map((_, c) => board.map((row) => row[c]).reverse());
}

function slideLeft(board: Board): { board: Board; score: number } {
  let score = 0;
  const next = board.map((row) => {
    const nums = row.filter((v) => v !== 0);
    const merged: number[] = [];
    let i = 0;
    while (i < nums.length) {
      if (i + 1 < nums.length && nums[i] === nums[i + 1]) {
        merged.push(nums[i] * 2);
        score += nums[i] * 2;
        i += 2;
      } else {
        merged.push(nums[i]);
        i++;
      }
    }
    while (merged.length < SIZE) merged.push(0);
    return merged;
  });
  return { board: next, score };
}

function slide(
  board: Board,
  dir: "left" | "right" | "up" | "down",
): { board: Board; score: number } {
  let b = board.map((r) => [...r]);
  let rotations = 0;
  if (dir === "right") rotations = 2;
  else if (dir === "up") rotations = 3;
  else if (dir === "down") rotations = 1;
  for (let i = 0; i < rotations; i++) b = rotateRight(b);
  const { board: slid, score } = slideLeft(b);
  let result = slid;
  for (let i = 0; i < (4 - rotations) % 4; i++) result = rotateRight(result);
  return { board: result, score };
}

function boardsEqual(a: Board, b: Board): boolean {
  for (let r = 0; r < SIZE; r++)
    for (let c = 0; c < SIZE; c++) if (a[r][c] !== b[r][c]) return false;
  return true;
}

function hasMovesLeft(board: Board): boolean {
  for (let r = 0; r < SIZE; r++)
    for (let c = 0; c < SIZE; c++) {
      if (board[r][c] === 0) return true;
      if (c + 1 < SIZE && board[r][c] === board[r][c + 1]) return true;
      if (r + 1 < SIZE && board[r][c] === board[r + 1][c]) return true;
    }
  return false;
}

const TILE_COLORS: Record<number, { bg: string; text: string }> = {
  0: { bg: "oklch(0.13 0.01 270)", text: "oklch(0.13 0.01 270)" },
  2: { bg: "oklch(0.20 0.04 270)", text: "oklch(0.82 0.01 275)" },
  4: { bg: "oklch(0.22 0.06 280)", text: "oklch(0.90 0.01 275)" },
  8: { bg: "oklch(0.30 0.12 290)", text: "oklch(0.95 0.01 275)" },
  16: { bg: "oklch(0.38 0.16 300)", text: "white" },
  32: { bg: "oklch(0.45 0.20 315)", text: "white" },
  64: { bg: "oklch(0.52 0.26 320)", text: "white" },
  128: { bg: "oklch(0.62 0.28 135)", text: "#0B0B10" },
  256: { bg: "oklch(0.70 0.28 135)", text: "#0B0B10" },
  512: { bg: "oklch(0.80 0.25 97)", text: "#0B0B10" },
  1024: { bg: "oklch(0.86 0.22 97)", text: "#0B0B10" },
  2048: { bg: "oklch(0.84 0.17 200)", text: "#0B0B10" },
};

function tileColors(val: number) {
  const keys = Object.keys(TILE_COLORS)
    .map(Number)
    .sort((a, b) => a - b);
  const match = keys.reverse().find((k) => val >= k);
  return TILE_COLORS[match ?? 0];
}

const CELL_KEYS = Array.from({ length: SIZE * SIZE }, (_, i) => `cell-${i}`);

export default function Game2048() {
  const [board, setBoard] = useState<Board>(() =>
    addRandom(addRandom(emptyBoard())),
  );
  const [score, setScore] = useState(0);
  const [started, setStarted] = useState(false);
  const [won, setWon] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [finalScore, setFinalScore] = useState(0);

  const startGame = useCallback(() => {
    setBoard(addRandom(addRandom(emptyBoard())));
    setScore(0);
    setStarted(true);
    setWon(false);
    setShowDialog(false);
  }, []);

  const move = useCallback((dir: "left" | "right" | "up" | "down") => {
    setBoard((prev) => {
      const { board: next, score: gained } = slide(prev, dir);
      if (boardsEqual(prev, next)) return prev;
      const withNew = addRandom(next);
      setScore((s) => s + gained);
      for (const row of withNew)
        for (const v of row) if (v === 2048) setWon(true);
      if (!hasMovesLeft(withNew)) {
        setScore((s) => {
          setFinalScore(s);
          return s;
        });
        setTimeout(() => setShowDialog(true), 300);
      }
      return withNew;
    });
  }, []);

  useEffect(() => {
    if (!started) return;
    const handleKey = (e: KeyboardEvent) => {
      const map: Record<string, "left" | "right" | "up" | "down"> = {
        ArrowLeft: "left",
        ArrowRight: "right",
        ArrowUp: "up",
        ArrowDown: "down",
      };
      const dir = map[e.key];
      if (dir) {
        move(dir);
        e.preventDefault();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [started, move]);

  const flat = board.flat();

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
            {score}
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
            ARROW KEYS
          </p>
        </div>
        {started && (
          <button
            type="button"
            onClick={startGame}
            className="neon-btn-cyan px-4 py-2 rounded font-orbitron text-xs tracking-widest"
            data-ocid="game2048.secondary_button"
          >
            RESTART
          </button>
        )}
      </div>

      {won && (
        <div
          className="font-orbitron text-sm px-4 py-2 rounded"
          style={{
            background: "oklch(0.84 0.17 200 / 0.15)",
            color: "oklch(0.84 0.17 200)",
            border: "1px solid oklch(0.84 0.17 200 / 0.4)",
          }}
        >
          🎉 YOU REACHED 2048! KEEP GOING!
        </div>
      )}

      <div
        className="relative"
        style={{
          border: "1px solid oklch(0.84 0.17 200 / 0.5)",
          boxShadow: "0 0 20px oklch(0.84 0.17 200 / 0.3)",
          borderRadius: "8px",
          padding: "8px",
          background: "oklch(0.11 0.02 270)",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "8px",
          }}
        >
          {flat.map((val, idx) => {
            const { bg, text } = tileColors(val);
            const fontSize =
              val >= 1024 ? "1rem" : val >= 128 ? "1.25rem" : "1.5rem";
            return (
              <div
                key={CELL_KEYS[idx]}
                style={{
                  width: "80px",
                  height: "80px",
                  background: bg,
                  color: text,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "6px",
                  fontFamily: "Orbitron, sans-serif",
                  fontWeight: "bold",
                  fontSize,
                  boxShadow: val >= 128 ? `0 0 12px ${bg}` : undefined,
                  transition: "background 0.15s",
                }}
                data-ocid={val > 0 ? `game2048.item.${idx + 1}` : undefined}
              >
                {val > 0 ? val : ""}
              </div>
            );
          })}
        </div>

        {!started && (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{
              background: "oklch(0.09 0.008 265 / 0.9)",
              borderRadius: "8px",
            }}
          >
            <div className="text-center">
              <p className="font-orbitron text-3xl font-black neon-purple-text mb-2">
                2048
              </p>
              <p
                className="font-orbitron text-xs mb-6"
                style={{ color: "oklch(0.72 0.015 280)" }}
              >
                Merge tiles to reach 2048
              </p>
              <button
                type="button"
                onClick={startGame}
                className="neon-btn-filled px-8 py-3 rounded font-orbitron text-sm tracking-widest"
                data-ocid="game2048.primary_button"
              >
                START GAME
              </button>
            </div>
          </div>
        )}
      </div>

      <p
        className="font-orbitron text-xs"
        style={{ color: "oklch(0.72 0.015 280)" }}
      >
        Slide tiles to merge matching numbers
      </p>

      <ScoreDialog
        open={showDialog}
        onClose={() => setShowDialog(false)}
        gameName="2048"
        gameTitle="2048"
        score={finalScore}
        onPlayAgain={startGame}
      />
    </div>
  );
}
