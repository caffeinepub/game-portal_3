import ScoreDialog from "@/components/ScoreDialog";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useState } from "react";

type Cell = "X" | "O" | null;
type Board = Cell[];
type GameMode = null | "ai" | "pvp";

const WIN_LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

function checkWinner(board: Board): { winner: Cell; line: number[] | null } {
  for (const line of WIN_LINES) {
    const [a, b, c] = line;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a], line };
    }
  }
  return { winner: null, line: null };
}

function getBestMove(board: Board): number {
  function minimax(b: Board, isMax: boolean, depth: number): number {
    const { winner } = checkWinner(b);
    if (winner === "O") return 10 - depth;
    if (winner === "X") return depth - 10;
    if (b.every((c) => c !== null)) return 0;
    const available = b
      .map((c, i) => (c === null ? i : -1))
      .filter((i) => i !== -1);
    if (isMax) {
      let best = Number.NEGATIVE_INFINITY;
      for (const i of available) {
        b[i] = "O";
        best = Math.max(best, minimax(b, false, depth + 1));
        b[i] = null;
      }
      return best;
    }
    let best = Number.POSITIVE_INFINITY;
    for (const i of available) {
      b[i] = "X";
      best = Math.min(best, minimax(b, true, depth + 1));
      b[i] = null;
    }
    return best;
  }
  const available = board
    .map((c, i) => (c === null ? i : -1))
    .filter((i) => i !== -1);
  let bestVal = Number.NEGATIVE_INFINITY;
  let bestMove = available[0];
  for (const i of available) {
    const copy = [...board] as Board;
    copy[i] = "O";
    const val = minimax(copy, false, 0);
    if (val > bestVal) {
      bestVal = val;
      bestMove = i;
    }
  }
  return bestMove;
}

const CELL_IDS = ["c0", "c1", "c2", "c3", "c4", "c5", "c6", "c7", "c8"];

export default function TicTacToeGame() {
  const [mode, setMode] = useState<GameMode>(null);
  const [board, setBoard] = useState<Board>(Array(9).fill(null));
  const [playerTurn, setPlayerTurn] = useState(true); // true = X's turn
  const [scores, setScores] = useState({ X: 0, O: 0, draws: 0 });
  const [showDialog, setShowDialog] = useState(false);
  const [gameScore, setGameScore] = useState(0);
  const [gameEnded, setGameEnded] = useState(false);

  const { winner, line: winLine } = checkWinner(board);
  const isDraw = !winner && board.every((c) => c !== null);

  const handleClickAI = useCallback(
    (i: number) => {
      if (!playerTurn || board[i] || winner || isDraw) return;
      const newBoard = [...board] as Board;
      newBoard[i] = "X";
      setBoard(newBoard);
      setPlayerTurn(false);
      const { winner: w } = checkWinner(newBoard);
      if (w === "X") {
        const newScores = { ...scores, X: scores.X + 1 };
        setScores(newScores);
        setGameScore(newScores.X * 100);
        setGameEnded(true);
        setTimeout(() => setShowDialog(true), 800);
        return;
      }
      if (newBoard.every((c) => c !== null)) {
        const newScores = { ...scores, draws: scores.draws + 1 };
        setScores(newScores);
        setGameEnded(true);
        return;
      }
      setTimeout(() => {
        const aiBoard = [...newBoard] as Board;
        const aiMove = getBestMove(aiBoard);
        aiBoard[aiMove] = "O";
        setBoard(aiBoard);
        setPlayerTurn(true);
        const { winner: aiW } = checkWinner(aiBoard);
        if (aiW === "O") {
          setScores((prev) => ({ ...prev, O: prev.O + 1 }));
          setGameEnded(true);
        } else if (aiBoard.every((c) => c !== null)) {
          setScores((prev) => ({ ...prev, draws: prev.draws + 1 }));
          setGameEnded(true);
        }
      }, 400);
    },
    [board, playerTurn, winner, isDraw, scores],
  );

  const handleClickPvP = useCallback(
    (i: number) => {
      if (board[i] || winner || isDraw) return;
      const newBoard = [...board] as Board;
      const currentMark: Cell = playerTurn ? "X" : "O";
      newBoard[i] = currentMark;
      setBoard(newBoard);
      const { winner: w } = checkWinner(newBoard);
      if (w) {
        const newScores = { ...scores, [w]: scores[w] + 1 };
        setScores(newScores);
        setGameScore(newScores[w] * 100);
        setGameEnded(true);
        if (w === "X") setTimeout(() => setShowDialog(true), 800);
        return;
      }
      if (newBoard.every((c) => c !== null)) {
        setScores((prev) => ({ ...prev, draws: prev.draws + 1 }));
        setGameEnded(true);
        return;
      }
      setPlayerTurn((prev) => !prev);
    },
    [board, playerTurn, winner, isDraw, scores],
  );

  const resetGame = useCallback(() => {
    setBoard(Array(9).fill(null));
    setPlayerTurn(true);
    setGameEnded(false);
    setShowDialog(false);
  }, []);

  const handleBack = useCallback(() => {
    setMode(null);
    setBoard(Array(9).fill(null));
    setPlayerTurn(true);
    setGameEnded(false);
    setShowDialog(false);
    setScores({ X: 0, O: 0, draws: 0 });
  }, []);

  const statusText = () => {
    if (mode === "pvp") {
      if (winner) return winner === "X" ? "P1 WINS!" : "P2 WINS!";
      if (isDraw) return "DRAW!";
      return playerTurn ? "P1's TURN" : "P2's TURN";
    }
    if (winner) return winner === "X" ? "YOU WIN!" : "AI WINS!";
    if (isDraw) return "DRAW!";
    if (!playerTurn) return "AI IS THINKING...";
    return "YOUR TURN (X)";
  };

  const statusColor = () => {
    if (winner === "X") return "var(--neon-cyan)";
    if (winner === "O") return "var(--neon-magenta)";
    if (isDraw) return "var(--neon-yellow)";
    if (mode === "pvp" && !playerTurn) return "var(--neon-magenta)";
    return "var(--neon-cyan)";
  };

  const scoreLabels =
    mode === "pvp"
      ? [
          { label: "P1 (X)", value: scores.X, color: "var(--neon-cyan)" },
          { label: "DRAWS", value: scores.draws, color: "var(--neon-yellow)" },
          { label: "P2 (O)", value: scores.O, color: "var(--neon-magenta)" },
        ]
      : [
          { label: "YOU (X)", value: scores.X, color: "var(--neon-cyan)" },
          { label: "DRAWS", value: scores.draws, color: "var(--neon-yellow)" },
          { label: "AI (O)", value: scores.O, color: "var(--neon-magenta)" },
        ];

  // Mode select screen
  if (!mode) {
    return (
      <div className="flex flex-col items-center gap-8">
        <p className="font-orbitron text-2xl font-black neon-cyan-text tracking-widest">
          TIC-TAC-TOE
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
            onClick={() => setMode("ai")}
            className="neon-btn-filled px-10 py-4 rounded font-orbitron text-sm tracking-widest flex flex-col items-center gap-1"
            data-ocid="tictactoe.primary_button"
          >
            <span>VS AI</span>
            <span className="text-xs opacity-70">You are X</span>
          </button>
          <button
            type="button"
            onClick={() => setMode("pvp")}
            className="neon-btn-cyan px-10 py-4 rounded font-orbitron text-sm tracking-widest flex flex-col items-center gap-1"
            data-ocid="tictactoe.secondary_button"
          >
            <span>VS PLAYER</span>
            <span className="text-xs opacity-70">P1: X · P2: O</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-8">
      <div className="flex items-center gap-8">
        {scoreLabels.map((s) => (
          <div key={s.label} className="text-center">
            <p
              className="font-orbitron text-xs tracking-widest"
              style={{ color: "oklch(0.72 0.015 280)" }}
            >
              {s.label}
            </p>
            <p
              className="font-orbitron text-3xl font-black"
              style={{ color: s.color }}
            >
              {s.value}
            </p>
          </div>
        ))}
      </div>

      <p
        className="font-orbitron text-sm tracking-widest"
        style={{ color: statusColor() }}
      >
        {statusText()}
      </p>

      <div
        className="grid gap-2 p-4 rounded-lg"
        style={{
          gridTemplateColumns: "repeat(3, 100px)",
          background:
            "radial-gradient(ellipse at center, oklch(0.12 0.04 280) 0%, oklch(0.08 0.02 265) 60%, oklch(0.05 0.01 260) 100%)",
          border: "1px solid oklch(0.84 0.17 200 / 0.4)",
          boxShadow:
            "0 0 30px oklch(0.84 0.17 200 / 0.2), 0 0 60px oklch(0.47 0.24 290 / 0.1), inset 0 0 20px oklch(0.10 0.04 280 / 0.3)",
        }}
        data-ocid="tictactoe.table"
      >
        {board.map((cell, i) => {
          const isWinCell = winLine?.includes(i);
          const isInteractive =
            mode === "pvp"
              ? !cell && !winner && !isDraw
              : !cell && playerTurn && !winner && !isDraw;
          return (
            <motion.button
              key={CELL_IDS[i]}
              type="button"
              onClick={() =>
                mode === "pvp" ? handleClickPvP(i) : handleClickAI(i)
              }
              className="w-24 h-24 rounded flex items-center justify-center font-orbitron text-5xl font-black cursor-pointer"
              style={{
                background: isWinCell
                  ? "oklch(0.84 0.17 200 / 0.1)"
                  : "oklch(0.12 0.008 270)",
                border: `2px solid ${isWinCell ? "oklch(0.84 0.17 200)" : "oklch(0.22 0.02 270)"}`,
                boxShadow: isWinCell ? "0 0 15px oklch(0.84 0.17 200)" : "none",
                color:
                  cell === "X" ? "var(--neon-cyan)" : "var(--neon-magenta)",
              }}
              whileHover={
                isInteractive
                  ? { scale: 1.05, borderColor: "oklch(0.84 0.17 200 / 0.6)" }
                  : {}
              }
              whileTap={isInteractive ? { scale: 0.95 } : {}}
              data-ocid={`tictactoe.item.${i + 1}`}
            >
              <AnimatePresence>
                {cell && (
                  <motion.span
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  >
                    {cell}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </div>

      <div className="flex gap-4">
        <button
          type="button"
          onClick={resetGame}
          className="px-8 py-2 rounded font-orbitron text-xs tracking-widest uppercase neon-btn-cyan"
          data-ocid="tictactoe.primary_button"
        >
          NEW GAME
        </button>
        <button
          type="button"
          onClick={handleBack}
          className="px-6 py-2 rounded font-orbitron text-xs tracking-widest uppercase"
          style={{
            border: "1px solid oklch(0.55 0.01 270)",
            color: "oklch(0.55 0.01 270)",
          }}
          data-ocid="tictactoe.cancel_button"
        >
          ← BACK
        </button>
        {gameEnded && winner === "X" && (
          <button
            type="button"
            onClick={() => setShowDialog(true)}
            className="px-8 py-2 rounded font-orbitron text-xs tracking-widest uppercase neon-btn-filled"
            data-ocid="tictactoe.secondary_button"
          >
            SUBMIT SCORE
          </button>
        )}
      </div>

      <ScoreDialog
        open={showDialog}
        onClose={() => setShowDialog(false)}
        gameName="tictactoe"
        gameTitle="TIC-TAC-TOE"
        score={gameScore}
        onPlayAgain={resetGame}
      />
    </div>
  );
}
