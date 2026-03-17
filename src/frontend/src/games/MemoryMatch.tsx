import ScoreDialog from "@/components/ScoreDialog";
import { Timer } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";

const EMOJIS = [
  "\u{1F409}",
  "\u26A1",
  "\u{1F3AE}",
  "\u{1F47E}",
  "\u{1F680}",
  "\u{1F319}",
  "\u{1F48E}",
  "\u{1F525}",
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function createDeck() {
  return shuffle(
    [...EMOJIS, ...EMOJIS].map((emoji, id) => ({ id, emoji, matched: false })),
  );
}

interface Card {
  id: number;
  emoji: string;
  matched: boolean;
}

export default function MemoryMatch() {
  const [deck, setDeck] = useState<Card[]>(createDeck);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    if (!started || finished) return;
    const id = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [started, finished]);

  const handleFlip = useCallback(
    (idx: number) => {
      if (
        locked ||
        flipped.length >= 2 ||
        deck[idx].matched ||
        flipped.includes(idx)
      )
        return;
      if (!started) setStarted(true);

      const newFlipped = [...flipped, idx];
      setFlipped(newFlipped);

      if (newFlipped.length === 2) {
        setLocked(true);
        setMoves((m) => m + 1);
        const [a, b] = newFlipped;
        if (deck[a].emoji === deck[b].emoji) {
          setDeck((d) =>
            d.map((c, i) =>
              newFlipped.includes(i) ? { ...c, matched: true } : c,
            ),
          );
          setFlipped([]);
          setLocked(false);
          setTimeout(() => {
            setDeck((d) => {
              const allMatched = d.every(
                (c, i) => c.matched || newFlipped.includes(i),
              );
              if (allMatched) {
                setFinished(true);
                setTimeout(() => setShowDialog(true), 600);
              }
              return d;
            });
          }, 300);
        } else {
          setTimeout(() => {
            setFlipped([]);
            setLocked(false);
          }, 900);
        }
      }
    },
    [deck, flipped, locked, started],
  );

  const resetGame = useCallback(() => {
    setDeck(createDeck());
    setFlipped([]);
    setMoves(0);
    setSeconds(0);
    setStarted(false);
    setFinished(false);
    setShowDialog(false);
    setLocked(false);
  }, []);

  const calcScore = () => Math.max(0, 1000 - moves * 20 - seconds * 5);

  const formatTime = (s: number) =>
    `${Math.floor(s / 60)
      .toString()
      .padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  const isFlipped = (idx: number) => flipped.includes(idx) || deck[idx].matched;

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex items-center gap-10">
        <div className="text-center">
          <p
            className="font-orbitron text-xs tracking-widest"
            style={{ color: "oklch(0.72 0.015 280)" }}
          >
            MOVES
          </p>
          <p className="font-orbitron text-3xl font-black neon-cyan-text">
            {moves}
          </p>
        </div>
        <div className="text-center">
          <p
            className="font-orbitron text-xs tracking-widest flex items-center gap-1 justify-center"
            style={{ color: "oklch(0.72 0.015 280)" }}
          >
            <Timer className="w-3 h-3" /> TIME
          </p>
          <p
            className="font-orbitron text-3xl font-black"
            style={{
              color: finished ? "var(--neon-green)" : "var(--neon-yellow)",
            }}
          >
            {formatTime(seconds)}
          </p>
        </div>
        <div className="text-center">
          <p
            className="font-orbitron text-xs tracking-widest"
            style={{ color: "oklch(0.72 0.015 280)" }}
          >
            SCORE
          </p>
          <p className="font-orbitron text-3xl font-black neon-magenta-text">
            {calcScore()}
          </p>
        </div>
      </div>

      <div
        className="grid gap-3 p-4 rounded-lg"
        style={{
          gridTemplateColumns: "repeat(4, 80px)",
          background:
            "radial-gradient(ellipse at center, oklch(0.11 0.05 280) 0%, oklch(0.08 0.03 270) 50%, oklch(0.05 0.01 260) 100%)",
          border: "1px solid oklch(0.63 0.28 315 / 0.4)",
          boxShadow:
            "0 0 35px oklch(0.63 0.28 315 / 0.15), 0 0 70px oklch(0.47 0.24 290 / 0.1), inset 0 0 25px oklch(0.10 0.04 275 / 0.3)",
        }}
        data-ocid="memory.table"
      >
        {deck.map((card, idx) => (
          <button
            type="button"
            key={`card-${idx}-${card.emoji}`}
            className="relative cursor-pointer rounded-lg"
            style={{
              width: 80,
              height: 80,
              perspective: "600px",
              background: "transparent",
              border: "none",
              padding: 0,
            }}
            onClick={() => handleFlip(idx)}
            data-ocid={`memory.item.${idx + 1}`}
          >
            <motion.div
              className="w-full h-full relative"
              animate={{ rotateY: isFlipped(idx) ? 180 : 0 }}
              transition={{ duration: 0.4, type: "tween" }}
              style={{ transformStyle: "preserve-3d" }}
            >
              {/* Back */}
              <div
                className="absolute inset-0 rounded-lg flex items-center justify-center"
                style={{
                  backfaceVisibility: "hidden",
                  background: card.matched
                    ? "oklch(0.86 0.28 135 / 0.15)"
                    : "oklch(0.47 0.24 290 / 0.3)",
                  border: `2px solid ${card.matched ? "oklch(0.86 0.28 135)" : "oklch(0.47 0.24 290)"}`,
                  boxShadow: card.matched
                    ? "0 0 10px oklch(0.86 0.28 135 / 0.5)"
                    : "0 0 8px oklch(0.47 0.24 290 / 0.4)",
                }}
              >
                <span className="text-2xl">&#10067;</span>
              </div>
              {/* Front */}
              <div
                className="absolute inset-0 rounded-lg flex items-center justify-center"
                style={{
                  backfaceVisibility: "hidden",
                  transform: "rotateY(180deg)",
                  background: card.matched
                    ? "oklch(0.86 0.28 135 / 0.15)"
                    : "oklch(0.12 0.008 270)",
                  border: `2px solid ${card.matched ? "oklch(0.86 0.28 135)" : "oklch(0.63 0.28 315)"}`,
                  boxShadow: card.matched
                    ? "0 0 12px oklch(0.86 0.28 135 / 0.6)"
                    : "0 0 8px oklch(0.63 0.28 315 / 0.4)",
                }}
              >
                <AnimatePresence>
                  <motion.span
                    className="text-3xl"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    {card.emoji}
                  </motion.span>
                </AnimatePresence>
              </div>
            </motion.div>
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={resetGame}
        className="px-8 py-2 rounded font-orbitron text-xs tracking-widest uppercase neon-btn-cyan"
        data-ocid="memory.primary_button"
      >
        NEW GAME
      </button>

      <ScoreDialog
        open={showDialog}
        onClose={() => setShowDialog(false)}
        gameName="memory"
        gameTitle="MEMORY MATCH"
        score={calcScore()}
        onPlayAgain={resetGame}
      />
    </div>
  );
}
