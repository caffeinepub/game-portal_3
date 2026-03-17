import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useSubmitScore, useTopScores } from "@/hooks/useQueries";
import { Trophy } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface ScoreDialogProps {
  open: boolean;
  onClose: () => void;
  gameName: string;
  gameTitle: string;
  score: number;
  onPlayAgain: () => void;
}

export default function ScoreDialog({
  open,
  onClose,
  gameName,
  gameTitle,
  score,
  onPlayAgain,
}: ScoreDialogProps) {
  const [playerName, setPlayerName] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const { mutateAsync: submitScore, isPending } = useSubmitScore();
  const { data: topScores } = useTopScores(gameName);

  const handleSubmit = async () => {
    if (!playerName.trim()) return;
    try {
      await submitScore({
        game: gameName,
        playerName: playerName.trim(),
        score,
      });
      setSubmitted(true);
      toast.success("Score submitted!");
    } catch {
      toast.error("Failed to submit score");
    }
  };

  const handlePlayAgain = () => {
    setSubmitted(false);
    setPlayerName("");
    onPlayAgain();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="border"
        style={{
          background: "oklch(0.10 0.006 270)",
          borderColor: "oklch(0.63 0.28 315 / 0.6)",
        }}
        data-ocid="score.dialog"
      >
        <DialogHeader>
          <DialogTitle className="font-orbitron text-center text-xl neon-magenta-text">
            GAME OVER
          </DialogTitle>
        </DialogHeader>

        <div className="text-center py-4">
          <p
            className="font-orbitron text-sm mb-2"
            style={{ color: "oklch(0.72 0.015 280)" }}
          >
            {gameTitle}
          </p>
          <div className="flex items-center justify-center gap-3 mb-6">
            <Trophy
              className="w-8 h-8"
              style={{ color: "var(--neon-yellow)" }}
            />
            <span className="font-orbitron text-4xl font-bold neon-cyan-text">
              {score.toLocaleString()}
            </span>
          </div>

          {!submitted ? (
            <div className="space-y-4">
              <p className="text-sm" style={{ color: "oklch(0.72 0.015 280)" }}>
                Enter your name to submit your score:
              </p>
              <Input
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                placeholder="YOUR NAME"
                className="text-center font-orbitron tracking-widest border"
                style={{
                  background: "oklch(0.12 0.008 270)",
                  borderColor: "oklch(0.84 0.17 200 / 0.5)",
                  color: "oklch(0.93 0.01 275)",
                }}
                maxLength={20}
                data-ocid="score.input"
              />
            </div>
          ) : (
            <p className="text-sm" style={{ color: "oklch(0.86 0.28 135)" }}>
              Score submitted!
            </p>
          )}

          {/* Top Scores */}
          {topScores && topScores.length > 0 && (
            <div className="mt-6 text-left">
              <p
                className="font-orbitron text-xs tracking-widest mb-3"
                style={{ color: "oklch(0.84 0.17 200)" }}
              >
                TOP SCORES
              </p>
              <div className="space-y-1">
                {topScores.slice(0, 5).map((s, i) => (
                  <div
                    key={`${s.playerName}-${String(s.score)}`}
                    className="flex justify-between text-sm"
                    style={{ color: "oklch(0.72 0.015 280)" }}
                    data-ocid={`score.item.${i + 1}`}
                  >
                    <span>
                      #{i + 1} {s.playerName}
                    </span>
                    <span
                      className="font-mono-tech"
                      style={{ color: "oklch(0.84 0.17 200)" }}
                    >
                      {Number(s.score).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2 sm:flex-row">
          {!submitted && (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isPending || !playerName.trim()}
              className="flex-1 py-2 rounded font-orbitron text-xs tracking-widest uppercase neon-btn-filled"
              data-ocid="score.submit_button"
            >
              {isPending ? "SUBMITTING..." : "SUBMIT SCORE"}
            </button>
          )}
          <button
            type="button"
            onClick={handlePlayAgain}
            className="flex-1 py-2 rounded font-orbitron text-xs tracking-widest uppercase neon-btn-cyan"
            data-ocid="score.primary_button"
          >
            PLAY AGAIN
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
