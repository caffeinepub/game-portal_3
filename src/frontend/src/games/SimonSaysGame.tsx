import ScoreDialog from "@/components/ScoreDialog";
import { useCallback, useRef, useState } from "react";

const BUTTONS = [
  {
    id: 0,
    label: "RED",
    activeColor: "#FF2D78",
    baseColor: "oklch(0.18 0.10 315)",
    shadow: "#FF2D78",
  },
  {
    id: 1,
    label: "BLUE",
    activeColor: "#00E5FF",
    baseColor: "oklch(0.16 0.06 200)",
    shadow: "#00E5FF",
  },
  {
    id: 2,
    label: "GREEN",
    activeColor: "#39FF14",
    baseColor: "oklch(0.16 0.10 135)",
    shadow: "#39FF14",
  },
  {
    id: 3,
    label: "YELLOW",
    activeColor: "#FFE600",
    baseColor: "oklch(0.18 0.09 97)",
    shadow: "#FFE600",
  },
];

type Phase = "idle" | "showing" | "input" | "wrong";

export default function SimonSaysGame() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [sequence, setSequence] = useState<number[]>([]);
  const [inputIdx, setInputIdx] = useState(0);
  const [activeBtn, setActiveBtn] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [showDialog, setShowDialog] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const flashTimeout = useRef<number | null>(null);

  const flashButtonRef = useRef((id: number, duration = 500): Promise<void> => {
    setActiveBtn(id);
    return new Promise<void>((res) => {
      setTimeout(() => {
        setActiveBtn(null);
        res();
      }, duration);
    });
  });

  const playSequence = useCallback(async (seq: number[]) => {
    setPhase("showing");
    await new Promise((r) => setTimeout(r, 500));
    for (const id of seq) {
      await flashButtonRef.current(id, 500);
      await new Promise((r) => setTimeout(r, 200));
    }
    setPhase("input");
    setInputIdx(0);
  }, []);

  const startGame = useCallback(() => {
    if (flashTimeout.current) clearTimeout(flashTimeout.current);
    const first = [Math.floor(Math.random() * 4)];
    setSequence(first);
    setScore(0);
    setShowDialog(false);
    playSequence(first);
  }, [playSequence]);

  const handlePress = useCallback(
    (id: number) => {
      if (phase !== "input") return;

      flashButtonRef.current(id, 200);

      const expected = sequence[inputIdx];
      if (id !== expected) {
        setPhase("wrong");
        setFinalScore(score);
        setShowDialog(true);
        return;
      }

      const nextIdx = inputIdx + 1;
      if (nextIdx === sequence.length) {
        const newScore = score + 1;
        setScore(newScore);
        const next = [...sequence, Math.floor(Math.random() * 4)];
        setSequence(next);
        flashTimeout.current = window.setTimeout(() => playSequence(next), 800);
      } else {
        setInputIdx(nextIdx);
      }
    },
    [phase, sequence, inputIdx, score, playSequence],
  );

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex items-center gap-8">
        <div className="text-center">
          <p
            className="font-orbitron text-xs tracking-widest"
            style={{ color: "oklch(0.72 0.015 280)" }}
          >
            ROUND
          </p>
          <p className="font-orbitron text-3xl font-black neon-cyan-text">
            {score}
          </p>
        </div>
        <div className="text-center">
          <p
            className="font-orbitron text-xs tracking-widest mb-1"
            style={{ color: "oklch(0.72 0.015 280)" }}
          >
            STATUS
          </p>
          <p
            className="font-orbitron text-xs"
            style={{
              color:
                phase === "showing"
                  ? "#FFE600"
                  : phase === "input"
                    ? "#39FF14"
                    : phase === "wrong"
                      ? "#FF2D78"
                      : "oklch(0.72 0.015 280)",
            }}
          >
            {phase === "idle"
              ? "PRESS START"
              : phase === "showing"
                ? "WATCH CLOSELY"
                : phase === "input"
                  ? "YOUR TURN"
                  : "WRONG!"}
          </p>
        </div>
      </div>

      <div
        style={{
          padding: "32px",
          border: "1px solid oklch(0.84 0.17 200 / 0.5)",
          boxShadow: "0 0 20px oklch(0.84 0.17 200 / 0.3)",
          borderRadius: "16px",
          background: "oklch(0.10 0.01 270)",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "16px",
          }}
        >
          {BUTTONS.map((btn) => {
            const isActive = activeBtn === btn.id;
            return (
              <button
                key={btn.label}
                type="button"
                onClick={() => handlePress(btn.id)}
                onKeyDown={() => handlePress(btn.id)}
                disabled={phase !== "input"}
                style={{
                  width: "120px",
                  height: "120px",
                  borderRadius: "12px",
                  border: `2px solid ${isActive ? btn.activeColor : "oklch(0.25 0.04 270)"}`,
                  background: isActive ? `${btn.activeColor}33` : btn.baseColor,
                  cursor: phase === "input" ? "pointer" : "default",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  transition: "all 0.1s ease",
                  boxShadow: isActive
                    ? `0 0 30px ${btn.shadow}, 0 0 60px ${btn.shadow}40`
                    : "none",
                  transform: isActive ? "scale(1.05)" : "scale(1)",
                }}
                data-ocid={`simon.button.${btn.id + 1}`}
              >
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    background: isActive
                      ? btn.activeColor
                      : "oklch(0.25 0.04 270)",
                    boxShadow: isActive ? `0 0 16px ${btn.shadow}` : "none",
                  }}
                />
                <span
                  style={{
                    fontFamily: "Orbitron, sans-serif",
                    fontSize: "0.65rem",
                    color: isActive ? btn.activeColor : "oklch(0.50 0.04 270)",
                    letterSpacing: "0.1em",
                  }}
                >
                  {btn.label}
                </span>
              </button>
            );
          })}
        </div>

        {phase === "idle" && (
          <div className="mt-6 flex justify-center">
            <button
              type="button"
              onClick={startGame}
              className="neon-btn-filled px-8 py-3 rounded font-orbitron text-sm tracking-widest"
              data-ocid="simon.primary_button"
            >
              START GAME
            </button>
          </div>
        )}
        {phase === "wrong" && (
          <div className="mt-6 flex justify-center">
            <button
              type="button"
              onClick={startGame}
              className="neon-btn-filled px-8 py-3 rounded font-orbitron text-sm tracking-widest"
              data-ocid="simon.primary_button"
            >
              PLAY AGAIN
            </button>
          </div>
        )}
      </div>

      <ScoreDialog
        open={showDialog}
        onClose={() => setShowDialog(false)}
        gameName="simon"
        gameTitle="SIMON SAYS"
        score={finalScore}
        onPlayAgain={startGame}
      />
    </div>
  );
}
