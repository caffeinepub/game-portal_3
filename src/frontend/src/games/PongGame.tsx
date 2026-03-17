import ScoreDialog from "@/components/ScoreDialog";
import { useCallback, useEffect, useRef, useState } from "react";

const W = 600;
const H = 400;
const PADDLE_W = 90;
const PADDLE_H = 10;
const BALL_R = 7;
const PADDLE_SPEED = 6;
const WIN_SCORE = 7;

type GameMode = null | "ai" | "pvp";

export default function PongGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<GameMode>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [displayScore, setDisplayScore] = useState(0);
  const [p1Score, setP1Score] = useState(0);
  const [p2Score, setP2Score] = useState(0);
  const [p1Wins, setP1Wins] = useState(0);
  const [p2Wins, setP2Wins] = useState(0);

  const stateRef = useRef({
    ball: { x: W / 2, y: H / 2, vx: 3.5, vy: 3.5 },
    playerX: W / 2 - PADDLE_W / 2,
    aiX: W / 2 - PADDLE_W / 2,
    score: 0,
    p1Score: 0,
    p2Score: 0,
    running: false,
    mode: "ai" as "ai" | "pvp",
    keys: { left: false, right: false, a: false, d: false },
  });
  const rafRef = useRef<number | null>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const s = stateRef.current;

    ctx.save();
    const bgGrad = ctx.createRadialGradient(
      W / 2,
      H / 2,
      0,
      W / 2,
      H / 2,
      W * 0.75,
    );
    bgGrad.addColorStop(0, "#0C0A1F");
    bgGrad.addColorStop(0.5, "#07050F");
    bgGrad.addColorStop(1, "#020108");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    const corners: [number, number][] = [
      [0, 0],
      [W, 0],
      [0, H],
      [W, H],
    ];
    for (const [cx2, cy2] of corners) {
      const cg = ctx.createRadialGradient(cx2, cy2, 0, cx2, cy2, 120);
      cg.addColorStop(0, "rgba(124,58,237,0.18)");
      cg.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = cg;
      ctx.fillRect(0, 0, W, H);
    }

    ctx.strokeStyle = "rgba(0,229,255,0.04)";
    ctx.lineWidth = 0.5;
    for (let x = 0; x <= W; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }
    for (let y = 0; y <= H; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }

    const centerGlow = ctx.createLinearGradient(0, H / 2, W, H / 2);
    centerGlow.addColorStop(0, "rgba(0,229,255,0)");
    centerGlow.addColorStop(0.3, "rgba(0,229,255,0.25)");
    centerGlow.addColorStop(0.5, "rgba(124,58,237,0.5)");
    centerGlow.addColorStop(0.7, "rgba(0,229,255,0.25)");
    centerGlow.addColorStop(1, "rgba(0,229,255,0)");
    ctx.setLineDash([12, 6]);
    ctx.strokeStyle = centerGlow;
    ctx.lineWidth = 2;
    ctx.shadowColor = "#7C3AED";
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(0, H / 2);
    ctx.lineTo(W, H / 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.shadowBlur = 0;
    ctx.restore();

    // Top paddle (AI or P2)
    const topColor = s.mode === "pvp" ? "#FF2D78" : "#FF2D78";
    ctx.shadowColor = topColor;
    ctx.shadowBlur = 10;
    ctx.fillStyle = topColor;
    ctx.fillRect(s.aiX, 20, PADDLE_W, PADDLE_H);

    // P2 label in PvP
    if (s.mode === "pvp") {
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#FF2D78";
      ctx.font = "bold 10px Orbitron, monospace";
      ctx.fillText("P2", s.aiX + PADDLE_W + 6, 30);
    }

    // Bottom paddle (P1)
    ctx.shadowColor = "#00E5FF";
    ctx.shadowBlur = 10;
    ctx.fillStyle = "#00E5FF";
    ctx.fillRect(s.playerX, H - 30, PADDLE_W, PADDLE_H);

    // P1 label in PvP
    if (s.mode === "pvp") {
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#00E5FF";
      ctx.font = "bold 10px Orbitron, monospace";
      ctx.fillText("P1", s.playerX + PADDLE_W + 6, H - 22);
    }

    // Ball
    ctx.shadowColor = "#FFE600";
    ctx.shadowBlur = 20;
    ctx.fillStyle = "#FFE600";
    ctx.beginPath();
    ctx.arc(s.ball.x, s.ball.y, BALL_R, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }, []);

  const loop = useCallback(() => {
    const s = stateRef.current;
    if (!s.running) return;

    // P1 movement (bottom paddle)
    if (s.keys.left) s.playerX = Math.max(0, s.playerX - PADDLE_SPEED);
    if (s.keys.right)
      s.playerX = Math.min(W - PADDLE_W, s.playerX + PADDLE_SPEED);

    if (s.mode === "pvp") {
      // P2 movement (top paddle) via A/D
      if (s.keys.a) s.aiX = Math.max(0, s.aiX - PADDLE_SPEED);
      if (s.keys.d) s.aiX = Math.min(W - PADDLE_W, s.aiX + PADDLE_SPEED);
    } else {
      // AI movement
      const aiCenter = s.aiX + PADDLE_W / 2;
      if (s.ball.x < aiCenter - 5) s.aiX = Math.max(0, s.aiX - 3.5);
      else if (s.ball.x > aiCenter + 5)
        s.aiX = Math.min(W - PADDLE_W, s.aiX + 3.5);
    }

    s.ball.x += s.ball.vx;
    s.ball.y += s.ball.vy;

    if (s.ball.x < BALL_R) {
      s.ball.x = BALL_R;
      s.ball.vx *= -1;
    }
    if (s.ball.x > W - BALL_R) {
      s.ball.x = W - BALL_R;
      s.ball.vx *= -1;
    }

    // P1 (bottom) paddle collision
    if (
      s.ball.y + BALL_R >= H - 30 &&
      s.ball.y + BALL_R <= H - 30 + PADDLE_H + 4 &&
      s.ball.x >= s.playerX - BALL_R &&
      s.ball.x <= s.playerX + PADDLE_W + BALL_R &&
      s.ball.vy > 0
    ) {
      s.ball.vy *= -1.04;
      s.ball.vx += (s.ball.x - (s.playerX + PADDLE_W / 2)) * 0.05;
      s.ball.y = H - 30 - BALL_R;
      if (s.mode === "ai") {
        s.score += 1;
        setDisplayScore(s.score);
      }
    }

    // Top paddle collision
    if (
      s.ball.y - BALL_R <= 30 &&
      s.ball.y - BALL_R >= 20 - 4 &&
      s.ball.x >= s.aiX - BALL_R &&
      s.ball.x <= s.aiX + PADDLE_W + BALL_R &&
      s.ball.vy < 0
    ) {
      s.ball.vy *= -1;
      s.ball.y = 30 + BALL_R;
    }

    if (s.mode === "ai") {
      // AI mode: ball exits bottom = game over
      if (s.ball.y > H + 20) {
        s.running = false;
        setFinalScore(s.score);
        setShowDialog(true);
        return;
      }
      // Ball exits top = reset
      if (s.ball.y < -20) {
        s.ball = {
          x: W / 2,
          y: H / 2,
          vx: 3.5 * (Math.random() > 0.5 ? 1 : -1),
          vy: 3.5,
        };
      }
    } else {
      // PvP mode: ball exits bottom = P2 scores; exits top = P1 scores
      if (s.ball.y > H + 20) {
        s.p2Score += 1;
        setP2Score(s.p2Score);
        if (s.p2Score >= WIN_SCORE) {
          s.running = false;
          setP2Wins((w) => w + 1);
          setFinalScore(s.p1Score);
          setShowDialog(true);
          return;
        }
        s.ball = {
          x: W / 2,
          y: H / 2,
          vx: 3.5 * (Math.random() > 0.5 ? 1 : -1),
          vy: 3.5,
        };
      } else if (s.ball.y < -20) {
        s.p1Score += 1;
        setP1Score(s.p1Score);
        if (s.p1Score >= WIN_SCORE) {
          s.running = false;
          setP1Wins((w) => w + 1);
          setFinalScore(s.p1Score);
          setShowDialog(true);
          return;
        }
        s.ball = {
          x: W / 2,
          y: H / 2,
          vx: 3.5 * (Math.random() > 0.5 ? 1 : -1),
          vy: -3.5,
        };
      }
    }

    draw();
    rafRef.current = requestAnimationFrame(loop);
  }, [draw]);

  const startGame = useCallback(
    (selectedMode: "ai" | "pvp") => {
      const s = stateRef.current;
      s.ball = { x: W / 2, y: H / 2, vx: 3.5, vy: 3.5 };
      s.playerX = W / 2 - PADDLE_W / 2;
      s.aiX = W / 2 - PADDLE_W / 2;
      s.score = 0;
      s.p1Score = 0;
      s.p2Score = 0;
      s.mode = selectedMode;
      s.running = true;
      setDisplayScore(0);
      setP1Score(0);
      setP2Score(0);
      setShowDialog(false);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(loop);
    },
    [loop],
  );

  const handleModeSelect = useCallback(
    (selectedMode: "ai" | "pvp") => {
      setMode(selectedMode);
      startGame(selectedMode);
    },
    [startGame],
  );

  const handleBack = useCallback(() => {
    stateRef.current.running = false;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setMode(null);
    setShowDialog(false);
    setDisplayScore(0);
    setP1Score(0);
    setP2Score(0);
    setP1Wins(0);
    setP2Wins(0);
  }, []);

  useEffect(() => {
    draw();
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [draw]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const s = stateRef.current;
      if (e.key === "ArrowLeft") {
        s.keys.left = true;
        e.preventDefault();
      }
      if (e.key === "ArrowRight") {
        s.keys.right = true;
        e.preventDefault();
      }
      if (e.key === "a" || e.key === "A") {
        if (s.mode === "pvp") {
          s.keys.a = true;
          e.preventDefault();
        } else {
          s.keys.left = true;
        }
      }
      if (e.key === "d" || e.key === "D") {
        if (s.mode === "pvp") {
          s.keys.d = true;
          e.preventDefault();
        } else {
          s.keys.right = true;
        }
      }
    };
    const up = (e: KeyboardEvent) => {
      const s = stateRef.current;
      if (e.key === "ArrowLeft") s.keys.left = false;
      if (e.key === "ArrowRight") s.keys.right = false;
      if (e.key === "a" || e.key === "A") {
        s.keys.a = false;
        s.keys.left = false;
      }
      if (e.key === "d" || e.key === "D") {
        s.keys.d = false;
        s.keys.right = false;
      }
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  // Mode select screen
  if (!mode) {
    return (
      <div className="flex flex-col items-center gap-8">
        <p className="font-orbitron text-2xl font-black neon-cyan-text tracking-widest">
          PONG
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
            onClick={() => handleModeSelect("ai")}
            className="neon-btn-filled px-10 py-4 rounded font-orbitron text-sm tracking-widest flex flex-col items-center gap-1"
            data-ocid="pong.primary_button"
          >
            <span>VS AI</span>
            <span className="text-xs opacity-70">Arrow Keys / A&D</span>
          </button>
          <button
            type="button"
            onClick={() => handleModeSelect("pvp")}
            className="neon-btn-cyan px-10 py-4 rounded font-orbitron text-sm tracking-widest flex flex-col items-center gap-1"
            data-ocid="pong.secondary_button"
          >
            <span>VS PLAYER</span>
            <span className="text-xs opacity-70">P1: Arrows · P2: A&D</span>
          </button>
        </div>
        <p
          className="font-orbitron text-xs"
          style={{ color: "oklch(0.55 0.01 270)" }}
        >
          First to {WIN_SCORE} points wins
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6">
      {mode === "ai" ? (
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
              ARROW KEYS / A & D
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
              {p1Score}
            </p>
            <p
              className="font-orbitron text-xs"
              style={{ color: "oklch(0.55 0.01 270)" }}
            >
              ← → ARROWS
            </p>
          </div>
          <div className="flex flex-col items-center gap-1">
            <p
              className="font-orbitron text-xl font-black"
              style={{ color: "oklch(0.55 0.01 270)" }}
            >
              VS
            </p>
            <p
              className="font-orbitron text-xs tracking-widest"
              style={{ color: "oklch(0.55 0.01 270)" }}
            >
              WINS
            </p>
            <div className="flex gap-3 text-xs font-orbitron">
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
              {p2Score}
            </p>
            <p
              className="font-orbitron text-xs"
              style={{ color: "oklch(0.55 0.01 270)" }}
            >
              A D KEYS
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
          width={W}
          height={H}
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
        data-ocid="pong.cancel_button"
      >
        ← BACK TO MODE SELECT
      </button>

      <ScoreDialog
        open={showDialog}
        onClose={() => setShowDialog(false)}
        gameName="pong"
        gameTitle="PONG"
        score={finalScore}
        onPlayAgain={() => startGame(stateRef.current.mode)}
      />
    </div>
  );
}
