import ScoreDialog from "@/components/ScoreDialog";
import { useCallback, useEffect, useRef, useState } from "react";

const W = 600;
const H = 400;
const PADDLE_W = 90;
const PADDLE_H = 10;
const BALL_R = 7;
const PADDLE_SPEED = 6;

export default function PongGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [started, setStarted] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [displayScore, setDisplayScore] = useState(0);

  const stateRef = useRef({
    ball: { x: W / 2, y: H / 2, vx: 3.5, vy: 3.5 },
    playerX: W / 2 - PADDLE_W / 2,
    aiX: W / 2 - PADDLE_W / 2,
    score: 0,
    running: false,
    keys: { left: false, right: false },
  });
  const rafRef = useRef<number | null>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const s = stateRef.current;

    ctx.fillStyle = "#0B0B10";
    ctx.fillRect(0, 0, W, H);

    // grid
    ctx.strokeStyle = "rgba(0,229,255,0.06)";
    ctx.lineWidth = 0.5;
    for (let x = 0; x <= W; x += 20) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }
    for (let y = 0; y <= H; y += 20) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }

    // center line
    ctx.setLineDash([8, 8]);
    ctx.strokeStyle = "rgba(0,229,255,0.15)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, H / 2);
    ctx.lineTo(W, H / 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // AI paddle (top)
    ctx.shadowColor = "#FF2D78";
    ctx.shadowBlur = 10;
    ctx.fillStyle = "#FF2D78";
    ctx.fillRect(s.aiX, 20, PADDLE_W, PADDLE_H);

    // Player paddle (bottom)
    ctx.shadowColor = "#00E5FF";
    ctx.shadowBlur = 10;
    ctx.fillStyle = "#00E5FF";
    ctx.fillRect(s.playerX, H - 30, PADDLE_W, PADDLE_H);

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

    // player movement
    if (s.keys.left) s.playerX = Math.max(0, s.playerX - PADDLE_SPEED);
    if (s.keys.right)
      s.playerX = Math.min(W - PADDLE_W, s.playerX + PADDLE_SPEED);

    // AI movement
    const aiCenter = s.aiX + PADDLE_W / 2;
    if (s.ball.x < aiCenter - 5) s.aiX = Math.max(0, s.aiX - 3.5);
    else if (s.ball.x > aiCenter + 5)
      s.aiX = Math.min(W - PADDLE_W, s.aiX + 3.5);

    // ball movement
    s.ball.x += s.ball.vx;
    s.ball.y += s.ball.vy;

    // wall bounce
    if (s.ball.x < BALL_R) {
      s.ball.x = BALL_R;
      s.ball.vx *= -1;
    }
    if (s.ball.x > W - BALL_R) {
      s.ball.x = W - BALL_R;
      s.ball.vx *= -1;
    }

    // player paddle collision
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
      s.score += 1;
      setDisplayScore(s.score);
    }

    // AI paddle collision
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

    // top/bottom escape
    if (s.ball.y > H + 20) {
      s.running = false;
      setFinalScore(s.score);
      setShowDialog(true);
      return;
    }
    if (s.ball.y < -20) {
      // AI missed -- reset ball
      s.ball = {
        x: W / 2,
        y: H / 2,
        vx: 3.5 * (Math.random() > 0.5 ? 1 : -1),
        vy: 3.5,
      };
    }

    draw();
    rafRef.current = requestAnimationFrame(loop);
  }, [draw]);

  const startGame = useCallback(() => {
    const s = stateRef.current;
    s.ball = { x: W / 2, y: H / 2, vx: 3.5, vy: 3.5 };
    s.playerX = W / 2 - PADDLE_W / 2;
    s.aiX = W / 2 - PADDLE_W / 2;
    s.score = 0;
    s.running = true;
    setDisplayScore(0);
    setStarted(true);
    setShowDialog(false);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(loop);
  }, [loop]);

  useEffect(() => {
    draw();
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [draw]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a") {
        stateRef.current.keys.left = true;
        e.preventDefault();
      }
      if (e.key === "ArrowRight" || e.key === "d") {
        stateRef.current.keys.right = true;
        e.preventDefault();
      }
    };
    const up = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a")
        stateRef.current.keys.left = false;
      if (e.key === "ArrowRight" || e.key === "d")
        stateRef.current.keys.right = false;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

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
        {!started && (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ background: "oklch(0.09 0.008 265 / 0.85)" }}
          >
            <div className="text-center">
              <p className="font-orbitron text-2xl font-black neon-cyan-text mb-2">
                PONG
              </p>
              <p
                className="font-orbitron text-xs mb-1"
                style={{ color: "#FF2D78" }}
              >
                🔴 AI PADDLE (top)
              </p>
              <p
                className="font-orbitron text-xs mb-6"
                style={{ color: "#00E5FF" }}
              >
                🔵 YOUR PADDLE (bottom)
              </p>
              <button
                type="button"
                onClick={startGame}
                className="neon-btn-filled px-8 py-3 rounded font-orbitron text-sm tracking-widest"
                data-ocid="pong.primary_button"
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
        gameName="pong"
        gameTitle="PONG"
        score={finalScore}
        onPlayAgain={startGame}
      />
    </div>
  );
}
