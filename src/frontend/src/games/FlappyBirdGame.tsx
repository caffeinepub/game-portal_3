import ScoreDialog from "@/components/ScoreDialog";
import { useCallback, useEffect, useRef, useState } from "react";

const W = 480;
const H = 480;
const BIRD_X = 100;
const BIRD_R = 14;
const GRAVITY = 0.45;
const FLAP_FORCE = -8.5;
const PIPE_W = 52;
const PIPE_GAP = 140;
const PIPE_SPEED = 2.8;

type Pipe = { x: number; gapY: number; passed: boolean };

export default function FlappyBirdGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [started, setStarted] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [displayScore, setDisplayScore] = useState(0);

  const stateRef = useRef({
    birdY: H / 2,
    birdVy: 0,
    pipes: [] as Pipe[],
    score: 0,
    frame: 0,
    running: false,
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

    ctx.fillStyle = "rgba(255,255,255,0.3)";
    for (let i = 0; i < 40; i++) {
      ctx.fillRect((i * 157 + 11) % W, (i * 89 + 23) % H, 1, 1);
    }

    for (const pipe of s.pipes) {
      ctx.shadowColor = "#39FF14";
      ctx.shadowBlur = 12;
      ctx.fillStyle = "#39FF14";
      ctx.fillRect(pipe.x, 0, PIPE_W, pipe.gapY - PIPE_GAP / 2);
      ctx.fillRect(pipe.x - 4, pipe.gapY - PIPE_GAP / 2 - 16, PIPE_W + 8, 16);
      ctx.fillRect(
        pipe.x,
        pipe.gapY + PIPE_GAP / 2,
        PIPE_W,
        H - pipe.gapY - PIPE_GAP / 2,
      );
      ctx.fillRect(pipe.x - 4, pipe.gapY + PIPE_GAP / 2, PIPE_W + 8, 16);
      ctx.shadowBlur = 0;
    }

    ctx.shadowColor = "#FFE600";
    ctx.shadowBlur = 18;
    ctx.fillStyle = "#FFE600";
    ctx.beginPath();
    ctx.arc(BIRD_X, s.birdY, BIRD_R, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#FF9900";
    ctx.beginPath();
    ctx.ellipse(BIRD_X - 6, s.birdY + 4, 10, 6, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#0B0B10";
    ctx.beginPath();
    ctx.arc(BIRD_X + 6, s.birdY - 4, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.strokeStyle = "rgba(0,229,255,0.3)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, H - 2);
    ctx.lineTo(W, H - 2);
    ctx.stroke();
  }, []);

  const endGame = useCallback((score: number) => {
    stateRef.current.running = false;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setFinalScore(score);
    setShowDialog(true);
  }, []);

  const flap = useCallback(() => {
    const s = stateRef.current;
    if (s.running) s.birdVy = FLAP_FORCE;
  }, []);

  const loop = useCallback(() => {
    const s = stateRef.current;
    if (!s.running) return;
    s.frame++;

    s.birdVy += GRAVITY;
    s.birdY += s.birdVy;

    if (s.frame % 90 === 0) {
      s.pipes.push({
        x: W,
        gapY: 120 + Math.random() * (H - 240),
        passed: false,
      });
    }

    for (const pipe of s.pipes) pipe.x -= PIPE_SPEED;
    s.pipes = s.pipes.filter((p) => p.x > -PIPE_W - 10);

    for (const pipe of s.pipes) {
      if (!pipe.passed && pipe.x + PIPE_W < BIRD_X) {
        pipe.passed = true;
        s.score++;
        setDisplayScore(s.score);
      }
    }

    if (s.birdY - BIRD_R < 0 || s.birdY + BIRD_R > H) {
      endGame(s.score);
      return;
    }
    for (const pipe of s.pipes) {
      const inX = BIRD_X + BIRD_R > pipe.x && BIRD_X - BIRD_R < pipe.x + PIPE_W;
      const inGap =
        s.birdY > pipe.gapY - PIPE_GAP / 2 &&
        s.birdY < pipe.gapY + PIPE_GAP / 2;
      if (inX && !inGap) {
        endGame(s.score);
        return;
      }
    }

    draw();
    rafRef.current = requestAnimationFrame(loop);
  }, [draw, endGame]);

  const startGame = useCallback(() => {
    const s = stateRef.current;
    s.birdY = H / 2;
    s.birdVy = 0;
    s.pipes = [];
    s.score = 0;
    s.frame = 0;
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
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        flap();
        e.preventDefault();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [flap]);

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
            CLICK OR SPACE TO FLAP
          </p>
        </div>
      </div>
      <button
        type="button"
        className="relative cursor-pointer p-0 bg-transparent border-0"
        style={{
          border: "1px solid oklch(0.84 0.17 200 / 0.5)",
          boxShadow: "0 0 20px oklch(0.84 0.17 200 / 0.3)",
        }}
        onClick={flap}
        data-ocid="flappy.canvas_target"
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
              <p className="font-orbitron text-2xl font-black neon-yellow-text mb-2">
                FLAPPY BIRD
              </p>
              <p
                className="font-orbitron text-xs mb-6"
                style={{ color: "oklch(0.72 0.015 280)" }}
              >
                Click or Space to flap
              </p>
              <button
                type="button"
                onClick={startGame}
                className="neon-btn-filled px-8 py-3 rounded font-orbitron text-sm tracking-widest"
                data-ocid="flappy.primary_button"
              >
                START GAME
              </button>
            </div>
          </div>
        )}
      </button>
      <ScoreDialog
        open={showDialog}
        onClose={() => setShowDialog(false)}
        gameName="flappy"
        gameTitle="FLAPPY BIRD"
        score={finalScore}
        onPlayAgain={startGame}
      />
    </div>
  );
}
