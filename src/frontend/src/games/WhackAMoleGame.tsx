import ScoreDialog from "@/components/ScoreDialog";
import { useCallback, useEffect, useRef, useState } from "react";

const GAME_DURATION = 30;
const HOLE_IDS = ["h0", "h1", "h2", "h3", "h4", "h5", "h6", "h7", "h8"];

export default function WhackAMoleGame() {
  const [started, setStarted] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [activeMoles, setActiveMoles] = useState<Set<number>>(new Set());
  const [hitMoles, setHitMoles] = useState<Set<number>>(new Set());
  const [showDialog, setShowDialog] = useState(false);
  const [finalScore, setFinalScore] = useState(0);

  const timerRef = useRef<number | null>(null);
  const moleTimerRef = useRef<number | null>(null);
  const scoreRef = useRef(0);

  const endGame = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (moleTimerRef.current) clearInterval(moleTimerRef.current);
    setActiveMoles(new Set());
    setFinalScore(scoreRef.current);
    setShowDialog(true);
  }, []);

  const startGame = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (moleTimerRef.current) clearInterval(moleTimerRef.current);
    scoreRef.current = 0;
    setScore(0);
    setTimeLeft(GAME_DURATION);
    setActiveMoles(new Set());
    setHitMoles(new Set());
    setStarted(true);
    setShowDialog(false);

    timerRef.current = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          endGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    const spawnMole = () => {
      const idx = Math.floor(Math.random() * HOLE_IDS.length);
      const duration = 800 + Math.random() * 700;
      setActiveMoles((prev) => new Set([...prev, idx]));
      setTimeout(() => {
        setActiveMoles((prev) => {
          const n = new Set(prev);
          n.delete(idx);
          return n;
        });
      }, duration);
    };

    spawnMole();
    moleTimerRef.current = window.setInterval(spawnMole, 600);
  }, [endGame]);

  const whackMole = useCallback(
    (idx: number) => {
      if (!started) return;
      setActiveMoles((prev) => {
        if (!prev.has(idx)) return prev;
        const n = new Set(prev);
        n.delete(idx);
        return n;
      });
      setHitMoles((prev) => {
        const n = new Set([...prev, idx]);
        setTimeout(
          () =>
            setHitMoles((p) => {
              const m = new Set(p);
              m.delete(idx);
              return m;
            }),
          200,
        );
        return n;
      });
      scoreRef.current += 10;
      setScore((s) => s + 10);
    },
    [started],
  );

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (moleTimerRef.current) clearInterval(moleTimerRef.current);
    };
  }, []);

  const timerPct = (timeLeft / GAME_DURATION) * 100;
  const timerColor =
    timerPct > 50 ? "#00E5FF" : timerPct > 25 ? "#FFE600" : "#FF2D78";

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
            TIME
          </p>
          <p
            className="font-orbitron text-3xl font-black"
            style={{ color: timerColor }}
          >
            {timeLeft}s
          </p>
        </div>
      </div>

      {started && (
        <div
          style={{
            width: "320px",
            height: "6px",
            background: "oklch(0.16 0.02 270)",
            borderRadius: "3px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${timerPct}%`,
              height: "100%",
              background: timerColor,
              transition: "width 1s linear, background 0.5s",
              boxShadow: `0 0 8px ${timerColor}`,
            }}
          />
        </div>
      )}

      <div
        className="relative"
        style={{
          padding: "24px",
          border: "1px solid oklch(0.84 0.17 200 / 0.5)",
          boxShadow: "0 0 20px oklch(0.84 0.17 200 / 0.3)",
          borderRadius: "12px",
          background: "oklch(0.10 0.01 270)",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "16px",
          }}
        >
          {HOLE_IDS.map((holeId, holeNum) => {
            const isActive = activeMoles.has(holeNum);
            const isHit = hitMoles.has(holeNum);
            return (
              <button
                key={holeId}
                type="button"
                onClick={() => whackMole(holeNum)}
                style={{
                  width: "90px",
                  height: "90px",
                  borderRadius: "50%",
                  border: `2px solid ${isActive ? "#FFE600" : "oklch(0.20 0.04 270)"}`,
                  background: isHit
                    ? "oklch(0.63 0.28 315 / 0.4)"
                    : isActive
                      ? "oklch(0.30 0.12 90)"
                      : "oklch(0.14 0.02 270)",
                  cursor: isActive ? "pointer" : "default",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: isActive ? "2.5rem" : "1.2rem",
                  transition: "all 0.12s ease",
                  transform: isActive ? "scale(1.05)" : "scale(0.95)",
                  boxShadow: isActive
                    ? "0 0 16px #FFE600"
                    : isHit
                      ? "0 0 16px #FF2D78"
                      : "none",
                }}
                data-ocid={`whackmole.item.${holeNum + 1}`}
              >
                {isHit ? "💥" : isActive ? "🐭" : "🕳️"}
              </button>
            );
          })}
        </div>

        {!started && (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{
              background: "oklch(0.09 0.008 265 / 0.9)",
              borderRadius: "12px",
            }}
          >
            <div className="text-center">
              <p className="font-orbitron text-2xl font-black neon-yellow-text mb-2">
                WHACK-A-MOLE
              </p>
              <p
                className="font-orbitron text-xs mb-6"
                style={{ color: "oklch(0.72 0.015 280)" }}
              >
                Click moles as fast as you can!
              </p>
              <button
                type="button"
                onClick={startGame}
                className="neon-btn-filled px-8 py-3 rounded font-orbitron text-sm tracking-widest"
                data-ocid="whackmole.primary_button"
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
        gameName="whackmole"
        gameTitle="WHACK-A-MOLE"
        score={finalScore}
        onPlayAgain={startGame}
      />
    </div>
  );
}
