import { useEffect, useRef, useState } from "react";

interface Monster {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  health: number;
  size: number;
  wobble: number;
  wobbleSpeed: number;
  dissolving: boolean;
  dissolveAlpha: number;
  eyeOffset: number;
}

export default function HorrorGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({
    monsters: [] as Monster[],
    mouseX: 400,
    mouseY: 300,
    lives: 3,
    score: 0,
    wave: 1,
    waveTimer: 0,
    gameOver: false,
    started: false,
    flashTimer: 0,
    flickerTimer: 0,
    flickerAlpha: 0,
    monsterIdCounter: 0,
    frameCount: 0,
    lastTime: 0,
  });
  const rafRef = useRef<number>(0);
  const [displayScore, setDisplayScore] = useState(0);
  const [displayLives, setDisplayLives] = useState(3);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isStarted, setIsStarted] = useState(false);

  const startGame = () => {
    const s = stateRef.current;
    s.monsters = [];
    s.lives = 3;
    s.score = 0;
    s.wave = 1;
    s.waveTimer = 0;
    s.gameOver = false;
    s.started = true;
    s.flashTimer = 0;
    s.monsterIdCounter = 0;
    s.frameCount = 0;
    s.lastTime = performance.now();
    setDisplayScore(0);
    setDisplayLives(3);
    setIsGameOver(false);
    setIsStarted(true);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;

    const spawnMonster = () => {
      const s = stateRef.current;
      const side = Math.floor(Math.random() * 4);
      let x = 0;
      let y = 0;
      if (side === 0) {
        x = Math.random() * W;
        y = -30;
      } else if (side === 1) {
        x = W + 30;
        y = Math.random() * H;
      } else if (side === 2) {
        x = Math.random() * W;
        y = H + 30;
      } else {
        x = -30;
        y = Math.random() * H;
      }

      const cx = W / 2;
      const cy = H / 2;
      const dx = cx - x;
      const dy = cy - y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const speed = 0.4 + s.wave * 0.08 + Math.random() * 0.3;

      s.monsters.push({
        id: s.monsterIdCounter++,
        x,
        y,
        vx: (dx / dist) * speed,
        vy: (dy / dist) * speed,
        health: 1,
        size: 18 + Math.random() * 14,
        wobble: Math.random() * Math.PI * 2,
        wobbleSpeed: 0.04 + Math.random() * 0.04,
        dissolving: false,
        dissolveAlpha: 1,
        eyeOffset: Math.random() * 0.5 - 0.25,
      });
    };

    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      stateRef.current.mouseX = (e.clientX - rect.left) * scaleX;
      stateRef.current.mouseY = (e.clientY - rect.top) * scaleY;
    };

    const onZap = () => {
      const s = stateRef.current;
      if (!s.started || s.gameOver) return;
      s.flashTimer = 12;
      const mx = s.mouseX;
      const my = s.mouseY;
      for (const m of s.monsters) {
        const ddx = m.x - mx;
        const ddy = m.y - my;
        if (Math.sqrt(ddx * ddx + ddy * ddy) < 120) {
          m.dissolving = true;
        }
      }
    };

    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("click", onZap);

    const drawMonsterBlob = (m: Monster, alpha: number) => {
      ctx.save();
      ctx.globalAlpha = alpha;
      const wobX = Math.sin(m.wobble) * 3;
      const wobY = Math.cos(m.wobble * 0.7) * 3;
      const px = m.x + wobX;
      const py = m.y + wobY;
      const r = m.size;

      ctx.beginPath();
      const bumps = 8;
      for (let i = 0; i <= bumps * 2; i++) {
        const angle = (i / (bumps * 2)) * Math.PI * 2;
        const bumpR =
          r +
          (i % 2 === 0 ? 0 : r * 0.35 * (0.8 + Math.sin(m.wobble + i) * 0.2));
        const bx = px + Math.cos(angle) * bumpR;
        const by = py + Math.sin(angle) * bumpR;
        if (i === 0) ctx.moveTo(bx, by);
        else ctx.lineTo(bx, by);
      }
      ctx.closePath();

      const grad = ctx.createRadialGradient(
        px - r * 0.3,
        py - r * 0.3,
        0,
        px,
        py,
        r * 1.5,
      );
      grad.addColorStop(0, "rgba(30,0,0,0.95)");
      grad.addColorStop(1, "rgba(5,0,0,0.98)");
      ctx.fillStyle = grad;
      ctx.shadowBlur = 15;
      ctx.shadowColor = "rgba(180,0,0,0.4)";
      ctx.fill();

      const eyeSpacing = r * 0.35;
      const eyeY = py - r * 0.15 + m.eyeOffset * r;
      for (const ex of [px - eyeSpacing, px + eyeSpacing]) {
        const eyeGrad = ctx.createRadialGradient(
          ex,
          eyeY,
          0,
          ex,
          eyeY,
          r * 0.22,
        );
        eyeGrad.addColorStop(0, "rgba(255,80,40,1)");
        eyeGrad.addColorStop(0.5, "rgba(200,0,0,0.9)");
        eyeGrad.addColorStop(1, "rgba(100,0,0,0)");
        ctx.beginPath();
        ctx.arc(ex, eyeY, r * 0.22, 0, Math.PI * 2);
        ctx.fillStyle = eyeGrad;
        ctx.shadowBlur = 20;
        ctx.shadowColor = "rgba(255,50,0,0.8)";
        ctx.fill();
      }

      ctx.restore();
    };

    const gameLoop = (timestamp: number) => {
      const s = stateRef.current;

      ctx.clearRect(0, 0, W, H);
      // Enhanced horror background
      ctx.save();
      const horrorBg = ctx.createRadialGradient(
        s.mouseX,
        s.mouseY,
        0,
        s.mouseX,
        s.mouseY,
        W * 0.9,
      );
      horrorBg.addColorStop(0, "#0A0005");
      horrorBg.addColorStop(0.4, "#050002");
      horrorBg.addColorStop(1, "#000000");
      ctx.fillStyle = horrorBg;
      ctx.fillRect(0, 0, W, H);

      // Red fog in corners
      const fogCorners = [
        [0, 0],
        [W, 0],
        [0, H],
        [W, H],
      ];
      for (const [fx, fy] of fogCorners) {
        const fogG = ctx.createRadialGradient(fx, fy, 0, fx, fy, 200);
        fogG.addColorStop(0, "rgba(100,0,0,0.08)");
        fogG.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = fogG;
        ctx.fillRect(0, 0, W, H);
      }
      ctx.restore();

      const ambGrad = ctx.createRadialGradient(
        W / 2,
        H / 2,
        0,
        W / 2,
        H / 2,
        Math.max(W, H) * 0.7,
      );
      ambGrad.addColorStop(0, "rgba(60,0,0,0.15)");
      ambGrad.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = ambGrad;
      ctx.fillRect(0, 0, W, H);

      if (!s.started) {
        ctx.fillStyle = "rgba(200,0,0,0.12)";
        ctx.fillRect(0, 0, W, H);
        ctx.save();
        ctx.fillStyle = "rgba(180,0,0,0.9)";
        ctx.font = "bold 32px 'Courier New', monospace";
        ctx.textAlign = "center";
        ctx.shadowBlur = 30;
        ctx.shadowColor = "rgba(255,0,0,0.8)";
        ctx.fillText("SURVIVE THE NIGHT", W / 2, H / 2 - 60);
        ctx.shadowBlur = 0;
        ctx.fillStyle = "rgba(180,80,80,0.85)";
        ctx.font = "14px 'Courier New', monospace";
        ctx.fillText("Move mouse to aim flashlight", W / 2, H / 2);
        ctx.fillText("Click to ZAP nearby monsters!", W / 2, H / 2 + 28);
        ctx.restore();
        rafRef.current = requestAnimationFrame(gameLoop);
        return;
      }

      if (s.gameOver) {
        ctx.fillStyle = "rgba(8,0,0,0.92)";
        ctx.fillRect(0, 0, W, H);
        ctx.save();
        ctx.textAlign = "center";
        ctx.shadowBlur = 40;
        ctx.shadowColor = "rgba(255,0,0,1)";
        ctx.fillStyle = "rgba(220,0,0,0.95)";
        ctx.font = "bold 42px 'Courier New', monospace";
        ctx.fillText("YOU DIED", W / 2, H / 2 - 80);
        ctx.shadowBlur = 0;
        ctx.fillStyle = "rgba(200,80,80,0.9)";
        ctx.font = "18px 'Courier New', monospace";
        ctx.fillText(`FINAL SCORE: ${s.score}`, W / 2, H / 2 - 30);
        ctx.fillStyle = "rgba(150,50,50,0.8)";
        ctx.font = "14px 'Courier New', monospace";
        ctx.fillText(`WAVE ${s.wave} REACHED`, W / 2, H / 2 + 10);
        ctx.restore();
        rafRef.current = requestAnimationFrame(gameLoop);
        return;
      }

      const dt = timestamp - (s.lastTime || timestamp);
      s.lastTime = timestamp;
      s.frameCount++;

      s.flickerTimer -= dt;
      if (s.flickerTimer <= 0) {
        s.flickerTimer = 800 + Math.random() * 3000;
        s.flickerAlpha = Math.random() * 0.08;
      }

      s.waveTimer += dt;
      const spawnInterval = Math.max(1200 - s.wave * 80, 400);
      const maxMonsters = 3 + s.wave * 2;
      const aliveCount = s.monsters.filter((m) => !m.dissolving).length;
      if (s.waveTimer >= spawnInterval && aliveCount < maxMonsters) {
        spawnMonster();
        s.waveTimer = 0;
      }

      if (s.frameCount % 60 === 0) {
        s.score += 1;
        setDisplayScore(s.score);
      }
      if (s.frameCount % (60 * 15) === 0) {
        s.wave++;
      }

      const cx = W / 2;
      const cy = H / 2;

      const toRemove: number[] = [];
      for (const m of s.monsters) {
        m.wobble += m.wobbleSpeed;

        if (m.dissolving) {
          m.dissolveAlpha -= 0.04;
          if (m.dissolveAlpha <= 0) {
            toRemove.push(m.id);
            s.score += 10;
            setDisplayScore(s.score);
          }
          continue;
        }

        const mx = s.mouseX;
        const my = s.mouseY;
        const toMonX = m.x - mx;
        const toMonY = m.y - my;
        const toMonDist = Math.sqrt(toMonX * toMonX + toMonY * toMonY);
        const toPlayerX = cx - mx;
        const toPlayerY = cy - my;
        const dotLen =
          Math.sqrt(toPlayerX * toPlayerX + toPlayerY * toPlayerY) || 1;

        let inCone = false;
        if (toMonDist > 0) {
          const dot =
            (toMonX / toMonDist) * (toPlayerX / dotLen) +
            (toMonY / toMonDist) * (toPlayerY / dotLen);
          if (dot > Math.cos(Math.PI / 5) && toMonDist < 220) {
            inCone = true;
          }
        }

        if (inCone) {
          const nx = toMonX / (toMonDist || 1);
          const ny = toMonY / (toMonDist || 1);
          m.vx += nx * 1.2 * (dt / 16);
          m.vy += ny * 1.2 * (dt / 16);
          m.health -= 0.008 * (dt / 16);
          if (m.health <= 0) m.dissolving = true;
        } else {
          const dxC = cx - m.x;
          const dyC = cy - m.y;
          const distC = Math.sqrt(dxC * dxC + dyC * dyC);
          const speed = 0.4 + s.wave * 0.08;
          m.vx = (dxC / (distC || 1)) * speed;
          m.vy = (dyC / (distC || 1)) * speed;
        }

        if (s.flashTimer > 8) {
          const fd = Math.sqrt((m.x - s.mouseX) ** 2 + (m.y - s.mouseY) ** 2);
          if (fd < 120) m.dissolving = true;
        }

        m.x += m.vx * (dt / 16);
        m.y += m.vy * (dt / 16);

        if (Math.sqrt((m.x - cx) ** 2 + (m.y - cy) ** 2) < 28) {
          s.lives--;
          setDisplayLives(s.lives);
          m.dissolving = true;
          if (s.lives <= 0) {
            s.gameOver = true;
            setIsGameOver(true);
          }
        }
      }

      s.monsters = s.monsters.filter((m) => !toRemove.includes(m.id));

      for (const m of s.monsters) {
        drawMonsterBlob(m, m.dissolving ? Math.max(0, m.dissolveAlpha) : 1);
      }

      // Player glow
      const playerPulse = 1 + Math.sin(timestamp / 200) * 0.08;
      const playerR = 12 * playerPulse;
      const playerGrad = ctx.createRadialGradient(
        cx,
        cy,
        0,
        cx,
        cy,
        playerR * 2,
      );
      playerGrad.addColorStop(0, "rgba(255,220,180,1)");
      playerGrad.addColorStop(0.5, "rgba(255,160,60,0.6)");
      playerGrad.addColorStop(1, "rgba(200,80,0,0)");
      ctx.beginPath();
      ctx.arc(cx, cy, playerR, 0, Math.PI * 2);
      ctx.fillStyle = playerGrad;
      ctx.shadowBlur = 20;
      ctx.shadowColor = "rgba(255,160,60,0.8)";
      ctx.fill();
      ctx.shadowBlur = 0;

      // Flashlight overlay
      const fmx = s.mouseX;
      const fmy = s.mouseY;
      const overlayCanvas = document.createElement("canvas");
      overlayCanvas.width = W;
      overlayCanvas.height = H;
      const octx = overlayCanvas.getContext("2d");
      if (octx) {
        octx.fillStyle = "rgba(0,0,0,0.88)";
        octx.fillRect(0, 0, W, H);
        octx.save();
        octx.globalCompositeOperation = "destination-out";

        const angleToCursor = Math.atan2(fmy - cy, fmx - cx);
        const halfAngle = Math.PI / 4.5;
        const flashReach = 240;
        octx.beginPath();
        octx.moveTo(cx, cy);
        octx.arc(
          cx,
          cy,
          flashReach,
          angleToCursor - halfAngle,
          angleToCursor + halfAngle,
        );
        octx.closePath();
        const coneGrad = octx.createRadialGradient(
          cx,
          cy,
          0,
          cx,
          cy,
          flashReach,
        );
        coneGrad.addColorStop(0, "rgba(255,255,255,1)");
        coneGrad.addColorStop(0.4, "rgba(255,255,255,0.85)");
        coneGrad.addColorStop(0.8, "rgba(255,255,255,0.4)");
        coneGrad.addColorStop(1, "rgba(255,255,255,0)");
        octx.fillStyle = coneGrad;
        octx.fill();

        const ambCircle = octx.createRadialGradient(cx, cy, 0, cx, cy, 40);
        ambCircle.addColorStop(0, "rgba(255,255,255,0.5)");
        ambCircle.addColorStop(1, "rgba(255,255,255,0)");
        octx.beginPath();
        octx.arc(cx, cy, 40, 0, Math.PI * 2);
        octx.fillStyle = ambCircle;
        octx.fill();

        if (s.flashTimer > 0) {
          const flashAlpha = (s.flashTimer / 12) * 0.6;
          const flashGrad = octx.createRadialGradient(
            fmx,
            fmy,
            0,
            fmx,
            fmy,
            130,
          );
          flashGrad.addColorStop(0, `rgba(255,255,255,${flashAlpha})`);
          flashGrad.addColorStop(1, "rgba(255,255,255,0)");
          octx.beginPath();
          octx.arc(fmx, fmy, 130, 0, Math.PI * 2);
          octx.fillStyle = flashGrad;
          octx.fill();
        }

        octx.restore();
      }

      if (s.flashTimer > 0) s.flashTimer--;

      ctx.drawImage(overlayCanvas, 0, 0);

      if (s.flickerAlpha > 0) {
        ctx.fillStyle = `rgba(0,0,0,${s.flickerAlpha})`;
        ctx.fillRect(0, 0, W, H);
      }

      const livesLost = 3 - s.lives;
      if (livesLost > 0) {
        const hbPulse = Math.abs(Math.sin(timestamp / (300 - livesLost * 60)));
        const hbAlpha = (livesLost / 3) * 0.5 * hbPulse;
        const borderW = 8 + livesLost * 4;
        ctx.save();
        ctx.strokeStyle = `rgba(200,0,0,${hbAlpha})`;
        ctx.lineWidth = borderW * 2;
        ctx.shadowBlur = 20;
        ctx.shadowColor = "rgba(200,0,0,0.6)";
        ctx.strokeRect(0, 0, W, H);
        ctx.restore();
      }

      rafRef.current = requestAnimationFrame(gameLoop);
    };

    rafRef.current = requestAnimationFrame(gameLoop);
    return () => {
      cancelAnimationFrame(rafRef.current);
      canvas.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("click", onZap);
    };
  }, []);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center justify-between w-full max-w-2xl px-4">
        <div className="flex items-center gap-2">
          {[1, 2, 3].map((i) => (
            <span
              key={i}
              style={{
                fontSize: "1.4rem",
                filter:
                  i <= displayLives
                    ? "drop-shadow(0 0 6px rgba(255,50,50,0.9))"
                    : "none",
                opacity: i <= displayLives ? 1 : 0.2,
              }}
            >
              ❤️
            </span>
          ))}
        </div>
        <div
          style={{
            fontFamily: "'Courier New', monospace",
            color: "rgba(200,0,0,0.9)",
            fontSize: "1rem",
            fontWeight: "bold",
            textShadow: "0 0 10px rgba(255,0,0,0.7)",
          }}
        >
          SCORE: {displayScore}
        </div>
      </div>

      <div style={{ position: "relative" }}>
        <canvas
          ref={canvasRef}
          width={800}
          height={500}
          style={{
            display: "block",
            borderRadius: "4px",
            border: "1px solid rgba(150,0,0,0.5)",
            boxShadow: "0 0 30px rgba(100,0,0,0.4)",
            cursor: "crosshair",
            maxWidth: "100%",
          }}
          data-ocid="horror.canvas_target"
        />

        {!isStarted && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <button
              type="button"
              onClick={startGame}
              style={{
                marginTop: "120px",
                padding: "12px 32px",
                background: "rgba(120,0,0,0.9)",
                border: "1px solid rgba(200,0,0,0.8)",
                borderRadius: "4px",
                color: "rgba(255,100,100,1)",
                fontFamily: "'Courier New', monospace",
                fontSize: "14px",
                fontWeight: "bold",
                letterSpacing: "3px",
                cursor: "pointer",
                textShadow: "0 0 10px rgba(255,0,0,0.8)",
                boxShadow: "0 0 20px rgba(200,0,0,0.6)",
              }}
              data-ocid="horror.primary_button"
            >
              BEGIN NIGHTMARE
            </button>
          </div>
        )}

        {isGameOver && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <button
              type="button"
              onClick={startGame}
              style={{
                marginTop: "80px",
                padding: "12px 32px",
                background: "rgba(80,0,0,0.95)",
                border: "1px solid rgba(200,0,0,0.8)",
                borderRadius: "4px",
                color: "rgba(255,80,80,1)",
                fontFamily: "'Courier New', monospace",
                fontSize: "14px",
                fontWeight: "bold",
                letterSpacing: "3px",
                cursor: "pointer",
                textShadow: "0 0 10px rgba(255,0,0,0.8)",
                boxShadow: "0 0 20px rgba(200,0,0,0.5)",
              }}
              data-ocid="horror.secondary_button"
            >
              PLAY AGAIN
            </button>
          </div>
        )}
      </div>

      <p
        style={{
          fontFamily: "'Courier New', monospace",
          color: "rgba(150,50,50,0.8)",
          fontSize: "12px",
          letterSpacing: "2px",
        }}
      >
        MOVE MOUSE → AIM FLASHLIGHT  |  CLICK → ZAP!
      </p>
    </div>
  );
}
