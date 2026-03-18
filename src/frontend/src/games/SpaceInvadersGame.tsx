import ScoreDialog from "@/components/ScoreDialog";
import { useCallback, useEffect, useRef, useState } from "react";

const W = 600;
const H = 480;
const PLAYER_W = 40;
const PLAYER_H = 20;
const PLAYER_SPEED = 5;
const ALIEN_COLS = 10;
const ALIEN_ROWS = 4;
const ALIEN_W = 36;
const ALIEN_H = 24;
const ALIEN_PAD_X = 14;
const ALIEN_PAD_Y = 18;

type Bullet = { x: number; y: number; vy: number };
type Alien = { x: number; y: number; alive: boolean };
type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
};
type UFO = { x: number; y: number; vx: number };
type StarLayer = { x: number; y: number; size: number; bright: number }[];

const ALIEN_COLORS = ["#FF2D78", "#A855F7", "#00E5FF", "#39FF14"];
const ALIEN_GLOWS = ["#FF2D78", "#A855F7", "#00E5FF", "#39FF14"];

function drawAlien(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  row: number,
  frame: number,
) {
  const color = ALIEN_COLORS[row % ALIEN_COLORS.length];
  const glow = ALIEN_GLOWS[row % ALIEN_GLOWS.length];
  ctx.save();
  ctx.shadowColor = glow;
  ctx.shadowBlur = 12;

  if (row === 0) {
    // Octopus: round body, tentacles, big eyes, antennae
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(x + 18, y + 12, 13, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    // Tentacles
    for (let t = 0; t < 4; t++) {
      const tx = x + 4 + t * 8;
      ctx.beginPath();
      ctx.moveTo(tx, y + 20);
      ctx.quadraticCurveTo(tx - 3, y + 28, tx, y + 34);
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = color;
      ctx.stroke();
    }
    // Eyes
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.ellipse(x + 11, y + 10, 4, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x + 25, y + 10, 4, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#111";
    ctx.beginPath();
    ctx.ellipse(x + 12, y + 11, 2, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x + 26, y + 11, 2, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    // Antennae
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + 12, y + 3);
    ctx.lineTo(x + 9, y - 5);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + 24, y + 3);
    ctx.lineTo(x + 27, y - 5);
    ctx.stroke();
  } else if (row === 1) {
    // Crab: wide body, pincer claws, spiky top
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(x + 5, y + 6, 26, 14, 3);
    ctx.fill();
    // Claws
    ctx.beginPath();
    ctx.moveTo(x + 5, y + 8);
    ctx.lineTo(x, y + 4);
    ctx.lineTo(x + 2, y + 12);
    ctx.lineTo(x + 5, y + 14);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x + 31, y + 8);
    ctx.lineTo(x + 36, y + 4);
    ctx.lineTo(x + 34, y + 12);
    ctx.lineTo(x + 31, y + 14);
    ctx.fill();
    // Spiky top
    for (let s = 0; s < 5; s++) {
      ctx.beginPath();
      ctx.moveTo(x + 8 + s * 5, y + 6);
      ctx.lineTo(x + 10 + s * 5, y + 1);
      ctx.lineTo(x + 12 + s * 5, y + 6);
      ctx.fill();
    }
    // Eyes
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.ellipse(x + 13, y + 12, 3, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x + 23, y + 12, 3, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#111";
    ctx.beginPath();
    ctx.ellipse(x + 14, y + 12, 1.5, 1.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x + 24, y + 12, 1.5, 1.5, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (row === 2) {
    // Squid: tapered body, wavy appendages, glowing core
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x + 18, y);
    ctx.bezierCurveTo(x + 30, y + 4, x + 32, y + 18, x + 24, y + 24);
    ctx.lineTo(x + 12, y + 24);
    ctx.bezierCurveTo(x + 4, y + 18, x + 6, y + 4, x + 18, y);
    ctx.fill();
    // Wavy appendages
    for (let w = 0; w < 3; w++) {
      const wx = x + 5 + w * 13;
      ctx.beginPath();
      ctx.moveTo(wx, y + 24);
      ctx.quadraticCurveTo(wx - 4, y + 30, wx, y + 36);
      ctx.lineWidth = 2;
      ctx.strokeStyle = color;
      ctx.stroke();
    }
    // Glowing core
    const coreGrad = ctx.createRadialGradient(
      x + 18,
      y + 12,
      0,
      x + 18,
      y + 12,
      8,
    );
    coreGrad.addColorStop(0, "rgba(255,255,255,0.9)");
    coreGrad.addColorStop(0.5, `${color}99`);
    coreGrad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = coreGrad;
    ctx.beginPath();
    ctx.ellipse(x + 18, y + 12, 8, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    // Eyes
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.ellipse(x + 13, y + 10, 3, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x + 23, y + 10, 3, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#111";
    ctx.beginPath();
    ctx.ellipse(x + 14, y + 11, 1.5, 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x + 24, y + 11, 1.5, 2, 0, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Spider: round body, 4 legs, menacing eyes
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(x + 18, y + 13, 12, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    // Legs
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = color;
    const legAnim = Math.sin(frame * 0.15) * 3;
    // Left legs
    ctx.beginPath();
    ctx.moveTo(x + 8, y + 10);
    ctx.lineTo(x + 1, y + 6 + legAnim);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + 7, y + 14);
    ctx.lineTo(x - 2, y + 14);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + 8, y + 18);
    ctx.lineTo(x + 1, y + 22 - legAnim);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + 9, y + 21);
    ctx.lineTo(x + 3, y + 28 + legAnim);
    ctx.stroke();
    // Right legs
    ctx.beginPath();
    ctx.moveTo(x + 28, y + 10);
    ctx.lineTo(x + 35, y + 6 + legAnim);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + 29, y + 14);
    ctx.lineTo(x + 38, y + 14);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + 28, y + 18);
    ctx.lineTo(x + 35, y + 22 - legAnim);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + 27, y + 21);
    ctx.lineTo(x + 33, y + 28 + legAnim);
    ctx.stroke();
    // Eyes (menacing)
    ctx.fillStyle = "#FF4444";
    ctx.shadowColor = "#FF0000";
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.ellipse(x + 12, y + 11, 3.5, 3, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x + 24, y + 11, 3.5, 3, 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.ellipse(x + 13, y + 11, 1.5, 1.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x + 25, y + 11, 1.5, 1.5, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawPlayer(
  ctx: CanvasRenderingContext2D,
  px: number,
  py: number,
  frame: number,
) {
  ctx.save();
  ctx.shadowColor = "#00E5FF";
  ctx.shadowBlur = 16;

  // Delta wings
  ctx.fillStyle = "#007A8A";
  ctx.beginPath();
  ctx.moveTo(px + PLAYER_W / 2, py);
  ctx.lineTo(px, py + PLAYER_H);
  ctx.lineTo(px + PLAYER_W, py + PLAYER_H);
  ctx.closePath();
  ctx.fill();

  // Main body highlight
  ctx.fillStyle = "#00B8CC";
  ctx.beginPath();
  ctx.moveTo(px + PLAYER_W / 2, py + 2);
  ctx.lineTo(px + 10, py + PLAYER_H);
  ctx.lineTo(px + PLAYER_W - 10, py + PLAYER_H);
  ctx.closePath();
  ctx.fill();

  // Cockpit bubble
  const cockpitGrad = ctx.createRadialGradient(
    px + PLAYER_W / 2,
    py + 4,
    0,
    px + PLAYER_W / 2,
    py + 8,
    8,
  );
  cockpitGrad.addColorStop(0, "rgba(180,255,255,1)");
  cockpitGrad.addColorStop(0.5, "rgba(0,229,255,0.7)");
  cockpitGrad.addColorStop(1, "rgba(0,100,150,0.3)");
  ctx.fillStyle = cockpitGrad;
  ctx.beginPath();
  ctx.ellipse(px + PLAYER_W / 2, py + 8, 6, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Wing cannons
  ctx.fillStyle = "#00E5FF";
  ctx.fillRect(px + 2, py + 12, 6, 4);
  ctx.fillRect(px + PLAYER_W - 8, py + 12, 6, 4);

  // Engine flame (animated flicker)
  const flameH = 8 + Math.sin(frame * 0.4) * 4;
  const flameGrad = ctx.createLinearGradient(
    px + PLAYER_W / 2,
    py + PLAYER_H,
    px + PLAYER_W / 2,
    py + PLAYER_H + flameH + 4,
  );
  flameGrad.addColorStop(0, "rgba(255,255,255,0.95)");
  flameGrad.addColorStop(0.3, "rgba(120,200,255,0.85)");
  flameGrad.addColorStop(0.7, "rgba(0,100,255,0.6)");
  flameGrad.addColorStop(1, "rgba(0,50,200,0)");
  ctx.fillStyle = flameGrad;
  ctx.beginPath();
  ctx.moveTo(px + PLAYER_W / 2 - 5, py + PLAYER_H);
  ctx.lineTo(px + PLAYER_W / 2, py + PLAYER_H + flameH + 4);
  ctx.lineTo(px + PLAYER_W / 2 + 5, py + PLAYER_H);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

function drawPlayerBullet(ctx: CanvasRenderingContext2D, b: Bullet) {
  ctx.save();
  // Trailing glow
  const grad = ctx.createLinearGradient(b.x, b.y, b.x, b.y + 16);
  grad.addColorStop(0, "rgba(255,255,200,0.95)");
  grad.addColorStop(0.4, "rgba(255,230,0,0.8)");
  grad.addColorStop(1, "rgba(255,180,0,0)");
  ctx.shadowColor = "#FFE600";
  ctx.shadowBlur = 12;
  ctx.fillStyle = grad;
  ctx.fillRect(b.x - 2, b.y - 12, 4, 16);
  // Bright core
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(b.x - 1, b.y - 10, 2, 8);
  ctx.restore();
}

function drawAlienBullet(ctx: CanvasRenderingContext2D, b: Bullet) {
  ctx.save();
  ctx.shadowColor = "#FF2D78";
  ctx.shadowBlur = 10;
  // Zigzag plasma bolt
  const zigW = 4;
  const segments = 5;
  const segH = 12 / segments;
  ctx.strokeStyle = "#FF2D78";
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i <= segments; i++) {
    const sx = b.x + (i % 2 === 0 ? -zigW / 2 : zigW / 2);
    const sy = b.y + i * segH - 6;
    if (i === 0) ctx.moveTo(sx, sy);
    else ctx.lineTo(sx, sy);
  }
  ctx.stroke();
  // Plasma core
  ctx.fillStyle = "#FF80C0";
  ctx.beginPath();
  ctx.ellipse(b.x, b.y, 3, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawUFO(ctx: CanvasRenderingContext2D, ufo: UFO, frame: number) {
  ctx.save();
  ctx.shadowColor = "#FF8800";
  ctx.shadowBlur = 18;
  const ux = ufo.x;
  const uy = ufo.y;
  // Saucer body
  ctx.fillStyle = "#CC4400";
  ctx.beginPath();
  ctx.ellipse(ux, uy + 6, 26, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  // Dome
  const domeGrad = ctx.createRadialGradient(ux, uy - 2, 0, ux, uy, 14);
  domeGrad.addColorStop(0, "rgba(255,220,180,0.95)");
  domeGrad.addColorStop(0.6, "rgba(255,100,0,0.7)");
  domeGrad.addColorStop(1, "rgba(180,40,0,0.4)");
  ctx.fillStyle = domeGrad;
  ctx.beginPath();
  ctx.ellipse(ux, uy, 14, 10, 0, 0, Math.PI, true);
  ctx.fill();
  // Underside lights
  const lightColors = ["#FF8800", "#FFFF00", "#FF4400", "#FFAA00"];
  for (let l = 0; l < 4; l++) {
    const pulse = Math.sin(frame * 0.2 + l * 1.5) > 0;
    ctx.fillStyle = pulse ? lightColors[l] : "rgba(80,30,0,0.8)";
    ctx.beginPath();
    ctx.ellipse(ux - 12 + l * 8, uy + 8, 3, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawParticles(ctx: CanvasRenderingContext2D, particles: Particle[]) {
  ctx.save();
  for (const p of particles) {
    const alpha = p.life / p.maxLife;
    ctx.globalAlpha = alpha;
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 6;
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}

function makeAliens(): Alien[] {
  const aliens: Alien[] = [];
  for (let r = 0; r < ALIEN_ROWS; r++) {
    for (let c = 0; c < ALIEN_COLS; c++) {
      aliens.push({
        x: 40 + c * (ALIEN_W + ALIEN_PAD_X),
        y: 50 + r * (ALIEN_H + ALIEN_PAD_Y),
        alive: true,
      });
    }
  }
  return aliens;
}

function makeStarLayers(): [StarLayer, StarLayer, StarLayer] {
  const layer1: StarLayer = [];
  const layer2: StarLayer = [];
  const layer3: StarLayer = [];
  for (let i = 0; i < 80; i++) {
    layer1.push({
      x: (i * 137 + 17) % W,
      y: (i * 73 + 41) % H,
      size: 1,
      bright: 0.3 + (i % 5) * 0.08,
    });
  }
  for (let i = 0; i < 30; i++) {
    layer2.push({
      x: (i * 211 + 53) % W,
      y: (i * 167 + 29) % H,
      size: 2,
      bright: 0.4 + (i % 4) * 0.1,
    });
  }
  for (let i = 0; i < 10; i++) {
    layer3.push({
      x: (i * 373 + 91) % W,
      y: (i * 251 + 67) % H,
      size: 3,
      bright: 0.7 + (i % 3) * 0.1,
    });
  }
  return [layer1, layer2, layer3];
}

function spawnParticles(
  particles: Particle[],
  x: number,
  y: number,
  color: string,
) {
  const count = 8 + Math.floor(Math.random() * 5);
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
    const speed = 1 + Math.random() * 3;
    particles.push({
      x: x + ALIEN_W / 2,
      y: y + ALIEN_H / 2,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 25 + Math.floor(Math.random() * 15),
      maxLife: 35,
      color,
      size: 2 + Math.floor(Math.random() * 3),
    });
  }
}

export default function SpaceInvadersGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [started, setStarted] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [displayScore, setDisplayScore] = useState(0);

  const starLayers = useRef<[StarLayer, StarLayer, StarLayer]>(
    makeStarLayers(),
  );

  const stateRef = useRef({
    playerX: W / 2 - PLAYER_W / 2,
    aliens: makeAliens(),
    bullets: [] as Bullet[],
    alienDir: 1,
    alienSpeed: 0.4,
    score: 0,
    running: false,
    keys: { left: false, right: false, fire: false },
    lastFire: 0,
    lastAlienFire: 0,
    frame: 0,
    particles: [] as Particle[],
    ufo: null as UFO | null,
    ufoFrame: 0,
  });
  const rafRef = useRef<number | null>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const s = stateRef.current;
    const layers = starLayers.current;

    ctx.save();
    // Deep space gradient
    const spaceGrad = ctx.createLinearGradient(0, 0, 0, H);
    spaceGrad.addColorStop(0, "#020008");
    spaceGrad.addColorStop(0.5, "#050310");
    spaceGrad.addColorStop(1, "#080218");
    ctx.fillStyle = spaceGrad;
    ctx.fillRect(0, 0, W, H);

    // Purple nebula
    const nebula = ctx.createRadialGradient(
      W * 0.6,
      H * 0.35,
      0,
      W * 0.6,
      H * 0.35,
      W * 0.55,
    );
    nebula.addColorStop(0, "rgba(80,20,140,0.18)");
    nebula.addColorStop(0.4, "rgba(40,5,80,0.12)");
    nebula.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = nebula;
    ctx.fillRect(0, 0, W, H);
    const nebula2 = ctx.createRadialGradient(
      W * 0.25,
      H * 0.6,
      0,
      W * 0.25,
      H * 0.6,
      W * 0.35,
    );
    nebula2.addColorStop(0, "rgba(0,60,120,0.14)");
    nebula2.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = nebula2;
    ctx.fillRect(0, 0, W, H);

    // Scanlines
    ctx.fillStyle = "rgba(0,0,0,0.04)";
    for (let sy = 0; sy < H; sy += 4) {
      ctx.fillRect(0, sy, W, 2);
    }
    ctx.restore();

    // Parallax stars - layer 1 (tiny, slow)
    ctx.save();
    for (const star of layers[0]) {
      const bri = star.bright + Math.sin(s.frame * 0.02 + star.x) * 0.15;
      ctx.fillStyle = `rgba(180,160,255,${Math.max(0.1, Math.min(0.9, bri))})`;
      ctx.fillRect(star.x, star.y, 1, 1);
    }
    // Layer 2 (medium, mid)
    for (const star of layers[1]) {
      const bri = star.bright + Math.sin(s.frame * 0.04 + star.x * 0.5) * 0.2;
      ctx.fillStyle = `rgba(220,200,255,${Math.max(0.1, Math.min(1, bri))})`;
      ctx.fillRect(star.x, star.y, 2, 2);
    }
    // Layer 3 (large, fast, sparkle)
    for (const star of layers[2]) {
      const bri = star.bright + Math.sin(s.frame * 0.05 + star.x * 0.3) * 0.2;
      ctx.shadowColor = "rgba(200,180,255,0.8)";
      ctx.shadowBlur = 4;
      ctx.fillStyle = `rgba(255,240,255,${Math.max(0.3, Math.min(1, bri))})`;
      ctx.fillRect(star.x, star.y, 3, 3);
      // Cross sparkle
      ctx.fillStyle = `rgba(255,255,255,${bri * 0.6})`;
      ctx.fillRect(star.x - 2, star.y + 1, 7, 1);
      ctx.fillRect(star.x + 1, star.y - 2, 1, 7);
      ctx.shadowBlur = 0;
    }
    ctx.restore();

    // UFO
    if (s.ufo) {
      drawUFO(ctx, s.ufo, s.frame);
    }

    // Aliens
    for (let idx = 0; idx < s.aliens.length; idx++) {
      const alien = s.aliens[idx];
      if (!alien.alive) continue;
      const row = Math.floor(idx / ALIEN_COLS);
      drawAlien(ctx, alien.x, alien.y, row, s.frame);
    }

    // Particles
    drawParticles(ctx, s.particles);

    // Bullets
    for (const b of s.bullets) {
      if (b.vy < 0) {
        drawPlayerBullet(ctx, b);
      } else {
        drawAlienBullet(ctx, b);
      }
    }

    // Player
    drawPlayer(ctx, s.playerX, H - 50, s.frame);

    // Ground line
    ctx.save();
    ctx.strokeStyle = "rgba(0,229,255,0.3)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, H - 28);
    ctx.lineTo(W, H - 28);
    ctx.stroke();
    ctx.restore();
  }, []);

  const endGame = useCallback((score: number) => {
    stateRef.current.running = false;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setFinalScore(score);
    setShowDialog(true);
  }, []);

  const loop = useCallback(() => {
    const s = stateRef.current;
    if (!s.running) return;
    s.frame++;

    // Scroll star layers
    const layers = starLayers.current;
    for (const star of layers[0]) {
      star.y = (star.y + 0.1) % H;
    }
    for (const star of layers[1]) {
      star.y = (star.y + 0.3) % H;
    }
    for (const star of layers[2]) {
      star.y = (star.y + 0.6) % H;
    }

    if (s.keys.left) s.playerX = Math.max(0, s.playerX - PLAYER_SPEED);
    if (s.keys.right)
      s.playerX = Math.min(W - PLAYER_W, s.playerX + PLAYER_SPEED);

    if (s.keys.fire && s.frame - s.lastFire > 18) {
      s.bullets.push({ x: s.playerX + PLAYER_W / 2, y: H - 56, vy: -9 });
      s.lastFire = s.frame;
    }

    if (s.frame - s.lastAlienFire > 60) {
      const alive = s.aliens.filter((a) => a.alive);
      if (alive.length > 0) {
        const shooter = alive[Math.floor(Math.random() * alive.length)];
        s.bullets.push({
          x: shooter.x + ALIEN_W / 2,
          y: shooter.y + ALIEN_H,
          vy: 5,
        });
        s.lastAlienFire = s.frame;
      }
    }

    // UFO spawn/move
    s.ufoFrame++;
    if (!s.ufo && s.ufoFrame >= 600) {
      const fromLeft = Math.random() > 0.5;
      s.ufo = {
        x: fromLeft ? -60 : W + 60,
        y: 22,
        vx: fromLeft ? 1.5 : -1.5,
      };
      s.ufoFrame = 0;
    }
    if (s.ufo) {
      s.ufo.x += s.ufo.vx;
      if (s.ufo.x < -80 || s.ufo.x > W + 80) {
        s.ufo = null;
      }
    }

    // Update particles
    s.particles = s.particles.filter((p) => p.life > 0);
    for (const p of s.particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.05;
      p.life--;
    }

    let hitWall = false;
    for (const alien of s.aliens) {
      if (!alien.alive) continue;
      alien.x += s.alienDir * s.alienSpeed;
      if (alien.x <= 0 || alien.x + ALIEN_W >= W) hitWall = true;
    }
    if (hitWall) {
      s.alienDir *= -1;
      for (const alien of s.aliens) {
        if (alien.alive) alien.y += 12;
      }
    }

    s.bullets = s.bullets.filter((b) => b.y > -20 && b.y < H + 20);
    for (const b of s.bullets) b.y += b.vy;

    for (const b of s.bullets) {
      if (b.vy >= 0) continue;
      // Check UFO
      if (s.ufo) {
        if (
          b.x >= s.ufo.x - 26 &&
          b.x <= s.ufo.x + 26 &&
          b.y >= s.ufo.y - 10 &&
          b.y <= s.ufo.y + 14
        ) {
          s.ufo = null;
          b.y = -100;
          s.score += 100;
          setDisplayScore(s.score);
          // Spawn particles at UFO
          const ux = b.x;
          const uy = 22;
          for (let i = 0; i < 12; i++) {
            const angle = (Math.PI * 2 * i) / 12;
            s.particles.push({
              x: ux,
              y: uy,
              vx: Math.cos(angle) * (1 + Math.random() * 3),
              vy: Math.sin(angle) * (1 + Math.random() * 3),
              life: 30,
              maxLife: 30,
              color: "#FF8800",
              size: 3,
            });
          }
          continue;
        }
      }
      for (const alien of s.aliens) {
        if (!alien.alive) continue;
        if (
          b.x >= alien.x &&
          b.x <= alien.x + ALIEN_W &&
          b.y >= alien.y &&
          b.y <= alien.y + ALIEN_H
        ) {
          alien.alive = false;
          b.y = -100;
          s.score += 10;
          s.alienSpeed = Math.min(2, s.alienSpeed + 0.015);
          setDisplayScore(s.score);
          const row = Math.floor(s.aliens.indexOf(alien) / ALIEN_COLS);
          spawnParticles(
            s.particles,
            alien.x,
            alien.y,
            ALIEN_COLORS[row % ALIEN_COLORS.length],
          );
          break;
        }
      }
    }

    const ppx = s.playerX;
    const ppy = H - 50;
    for (const b of s.bullets) {
      if (b.vy <= 0) continue;
      if (
        b.x >= ppx &&
        b.x <= ppx + PLAYER_W &&
        b.y >= ppy &&
        b.y <= ppy + PLAYER_H
      ) {
        endGame(s.score);
        return;
      }
    }

    for (const alien of s.aliens) {
      if (alien.alive && alien.y + ALIEN_H >= H - 30) {
        endGame(s.score);
        return;
      }
    }

    if (s.aliens.every((a) => !a.alive)) {
      s.aliens = makeAliens();
      s.alienSpeed += 0.2;
    }

    draw();
    rafRef.current = requestAnimationFrame(loop);
  }, [draw, endGame]);

  const startGame = useCallback(() => {
    const s = stateRef.current;
    s.playerX = W / 2 - PLAYER_W / 2;
    s.aliens = makeAliens();
    s.bullets = [];
    s.alienDir = 1;
    s.alienSpeed = 0.4;
    s.score = 0;
    s.running = true;
    s.frame = 0;
    s.lastFire = 0;
    s.lastAlienFire = 0;
    s.particles = [];
    s.ufo = null;
    s.ufoFrame = 0;
    starLayers.current = makeStarLayers();
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
      if (e.key === " ") {
        stateRef.current.keys.fire = true;
        e.preventDefault();
      }
    };
    const up = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a")
        stateRef.current.keys.left = false;
      if (e.key === "ArrowRight" || e.key === "d")
        stateRef.current.keys.right = false;
      if (e.key === " ") stateRef.current.keys.fire = false;
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
            ← → MOVE · SPACE FIRE
          </p>
        </div>
        <div className="text-center">
          <p
            className="font-orbitron text-xs tracking-widest"
            style={{ color: "oklch(0.72 0.015 280)" }}
          >
            UFO BONUS
          </p>
          <p className="font-orbitron text-xs" style={{ color: "#FF8800" }}>
            +100 PTS
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
              <p className="font-orbitron text-2xl font-black neon-magenta-text mb-2">
                SPACE INVADERS
              </p>
              <p
                className="font-orbitron text-xs mb-6"
                style={{ color: "oklch(0.72 0.015 280)" }}
              >
                Arrows to move · Space to shoot · Shoot UFO for +100!
              </p>
              <button
                type="button"
                onClick={startGame}
                className="neon-btn-filled px-8 py-3 rounded font-orbitron text-sm tracking-widest"
                data-ocid="spaceinvaders.primary_button"
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
        gameName="spaceinvaders"
        gameTitle="SPACE INVADERS"
        score={finalScore}
        onPlayAgain={startGame}
      />
    </div>
  );
}
