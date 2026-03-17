import { useCallback, useEffect, useRef, useState } from "react";

interface Vec2 {
  x: number;
  y: number;
}

interface Player {
  pos: Vec2;
  vel: Vec2;
  hp: number;
  maxHp: number;
  radius: number;
  speed: number;
  iframes: number; // invincibility frames after hit
}

interface Enemy {
  id: number;
  pos: Vec2;
  hp: number;
  maxHp: number;
  speed: number;
  radius: number;
  type: "grunt" | "fast" | "tank" | "ranged";
  shootCd: number; // cooldown for ranged enemies
  dead: boolean;
}

interface Projectile {
  id: number;
  pos: Vec2;
  vel: Vec2;
  radius: number;
  fromPlayer: boolean;
  dead: boolean;
}

interface OrbPickup {
  id: number;
  pos: Vec2;
  dead: boolean;
}

interface Particle {
  id: number;
  pos: Vec2;
  vel: Vec2;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

interface GameState {
  player: Player;
  enemies: Enemy[];
  projectiles: Projectile[];
  orbs: OrbPickup[];
  particles: Particle[];
  wave: number;
  score: number;
  enemiesLeft: number;
  orbCount: number;
  waveTimer: number; // ticks between waves
  status: "playing" | "wave_clear" | "dead";
  nextId: number;
}

const W = 700;
const H = 500;
const PLAYER_SPEED = 3.2;
const SHOOT_CD = 22; // frames between player shots
const SHOOT_SPEED = 8;
const ORB_RADIUS = 10;
const COLLECT_RANGE = 18;

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function dist(a: Vec2, b: Vec2) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function norm(v: Vec2): Vec2 {
  const d = Math.sqrt(v.x * v.x + v.y * v.y);
  if (d === 0) return { x: 0, y: 0 };
  return { x: v.x / d, y: v.y / d };
}

function spawnWaveEnemies(
  wave: number,
  nextId: number,
): { enemies: Enemy[]; nextId: number } {
  const count = 5 + wave * 3;
  const enemies: Enemy[] = [];
  let id = nextId;
  const types: Enemy["type"][] = [
    "grunt",
    "fast",
    "tank",
    ...(wave >= 2 ? ["ranged" as Enemy["type"]] : []),
  ];

  for (let i = 0; i < count; i++) {
    const type =
      types[Math.floor(Math.random() * (wave >= 2 ? types.length : 2))];
    // Spawn outside arena
    const angle = Math.random() * Math.PI * 2;
    const spawnDist = 380;
    const pos = {
      x: W / 2 + Math.cos(angle) * spawnDist,
      y: H / 2 + Math.sin(angle) * spawnDist,
    };
    // Clamp to near-edge of canvas
    pos.x = Math.max(-30, Math.min(W + 30, pos.x));
    pos.y = Math.max(-30, Math.min(H + 30, pos.y));

    const baseHp =
      type === "tank"
        ? 120 + wave * 20
        : type === "ranged"
          ? 40 + wave * 10
          : 30 + wave * 8;
    const speed =
      type === "fast"
        ? 1.8 + wave * 0.15
        : type === "tank"
          ? 0.8 + wave * 0.05
          : 1.2 + wave * 0.08;
    const radius = type === "tank" ? 22 : type === "fast" ? 10 : 14;

    enemies.push({
      id: id++,
      pos,
      hp: baseHp,
      maxHp: baseHp,
      speed,
      radius,
      type,
      shootCd: 0,
      dead: false,
    });
  }
  return { enemies, nextId: id };
}

function initGame(): GameState {
  return {
    player: {
      pos: { x: W / 2, y: H / 2 },
      vel: { x: 0, y: 0 },
      hp: 100,
      maxHp: 100,
      radius: 14,
      speed: PLAYER_SPEED,
      iframes: 0,
    },
    enemies: [],
    projectiles: [],
    orbs: [],
    particles: [],
    wave: 0,
    score: 0,
    enemiesLeft: 0,
    orbCount: 0,
    waveTimer: 60,
    status: "playing",
    nextId: 1,
  };
}

export default function SurvivalGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<GameState>(initGame());
  const keysRef = useRef<Set<string>>(new Set());
  const mouseRef = useRef<Vec2>({ x: W / 2, y: H / 2 });
  const shootCdRef = useRef(0);
  const animRef = useRef<number>(0);
  const [uiState, setUiState] = useState({
    wave: 0,
    score: 0,
    hp: 100,
    maxHp: 100,
    orbs: 0,
    status: "playing" as GameState["status"],
    enemiesLeft: 0,
  });

  const resetGame = useCallback(() => {
    stateRef.current = initGame();
    shootCdRef.current = 0;
    setUiState({
      wave: 0,
      score: 0,
      hp: 100,
      maxHp: 100,
      orbs: 0,
      status: "playing",
      enemiesLeft: 0,
    });
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (
        [
          "ArrowUp",
          "ArrowDown",
          "ArrowLeft",
          "ArrowRight",
          "w",
          "a",
          "s",
          "d",
          "W",
          "A",
          "S",
          "D",
        ].includes(e.key)
      ) {
        e.preventDefault();
      }
      if (e.type === "keydown") keysRef.current.add(e.key.toLowerCase());
      else keysRef.current.delete(e.key.toLowerCase());
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keyup", onKey);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = W / rect.width;
      const scaleY = H / rect.height;
      mouseRef.current = {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    };
    canvas.addEventListener("mousemove", onMove);
    return () => canvas.removeEventListener("mousemove", onMove);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    function spawnParticles(
      pos: Vec2,
      color: string,
      count: number,
      speed: number,
    ) {
      const s = stateRef.current;
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const sp = speed * (0.5 + Math.random());
        s.particles.push({
          id: s.nextId++,
          pos: { x: pos.x, y: pos.y },
          vel: { x: Math.cos(angle) * sp, y: Math.sin(angle) * sp },
          life: 30 + Math.random() * 20,
          maxLife: 50,
          color,
          size: 2 + Math.random() * 3,
        });
      }
    }

    function tick() {
      const s = stateRef.current;
      if (s.status === "dead") {
        drawFrame();
        animRef.current = requestAnimationFrame(tick);
        return;
      }

      // Start wave
      if (s.wave === 0 && s.enemies.length === 0 && s.waveTimer <= 0) {
        s.wave = 1;
        const result = spawnWaveEnemies(1, s.nextId);
        s.enemies = result.enemies;
        s.nextId = result.nextId;
        s.enemiesLeft = s.enemies.length;
        s.status = "playing";
      }

      if (s.waveTimer > 0) {
        s.waveTimer--;
        if (s.waveTimer <= 0 && s.wave === 0) {
          // trigger first wave on next tick
        }
        drawFrame();
        animRef.current = requestAnimationFrame(tick);
        return;
      }

      if (s.status === "wave_clear") {
        // brief delay then next wave
        s.waveTimer = 120;
        s.status = "playing";
        s.wave++;
        const result = spawnWaveEnemies(s.wave, s.nextId);
        s.enemies = result.enemies;
        s.nextId = result.nextId;
        s.enemiesLeft = s.enemies.filter((e) => !e.dead).length;
        drawFrame();
        animRef.current = requestAnimationFrame(tick);
        return;
      }

      const keys = keysRef.current;
      const p = s.player;

      // Player movement
      let dx = 0;
      let dy = 0;
      if (keys.has("arrowleft") || keys.has("a")) dx -= 1;
      if (keys.has("arrowright") || keys.has("d")) dx += 1;
      if (keys.has("arrowup") || keys.has("w")) dy -= 1;
      if (keys.has("arrowdown") || keys.has("s")) dy += 1;
      const moveVec = norm({ x: dx, y: dy });
      p.vel.x = lerp(p.vel.x, moveVec.x * p.speed, 0.25);
      p.vel.y = lerp(p.vel.y, moveVec.y * p.speed, 0.25);
      p.pos.x = Math.max(p.radius, Math.min(W - p.radius, p.pos.x + p.vel.x));
      p.pos.y = Math.max(p.radius, Math.min(H - p.radius, p.pos.y + p.vel.y));

      // Player shoot toward mouse
      if (shootCdRef.current > 0) shootCdRef.current--;
      if (shootCdRef.current === 0) {
        const dir = norm({
          x: mouseRef.current.x - p.pos.x,
          y: mouseRef.current.y - p.pos.y,
        });
        if (dir.x !== 0 || dir.y !== 0) {
          s.projectiles.push({
            id: s.nextId++,
            pos: { x: p.pos.x, y: p.pos.y },
            vel: { x: dir.x * SHOOT_SPEED, y: dir.y * SHOOT_SPEED },
            radius: 5,
            fromPlayer: true,
            dead: false,
          });
          shootCdRef.current = SHOOT_CD;
        }
      }

      // Iframes
      if (p.iframes > 0) p.iframes--;

      // Update enemies
      for (const e of s.enemies) {
        if (e.dead) continue;
        // Move toward player
        const toPlayer = norm({ x: p.pos.x - e.pos.x, y: p.pos.y - e.pos.y });

        if (e.type === "ranged") {
          // Keep distance and shoot
          const d = dist(e.pos, p.pos);
          if (d < 180) {
            e.pos.x -= toPlayer.x * e.speed;
            e.pos.y -= toPlayer.y * e.speed;
          } else if (d > 220) {
            e.pos.x += toPlayer.x * e.speed;
            e.pos.y += toPlayer.y * e.speed;
          }
          e.shootCd--;
          if (e.shootCd <= 0) {
            e.shootCd = 90 - s.wave * 5;
            s.projectiles.push({
              id: s.nextId++,
              pos: { x: e.pos.x, y: e.pos.y },
              vel: { x: toPlayer.x * 3.5, y: toPlayer.y * 3.5 },
              radius: 6,
              fromPlayer: false,
              dead: false,
            });
          }
        } else {
          e.pos.x += toPlayer.x * e.speed;
          e.pos.y += toPlayer.y * e.speed;
        }

        // Melee damage
        if (
          e.type !== "ranged" &&
          dist(e.pos, p.pos) < e.radius + p.radius &&
          p.iframes === 0
        ) {
          const dmg = e.type === "tank" ? 20 : 10;
          p.hp -= dmg;
          p.iframes = 45;
          spawnParticles(p.pos, "oklch(0.65 0.22 25)", 6, 3);
          if (p.hp <= 0) {
            p.hp = 0;
            s.status = "dead";
          }
        }
      }

      // Update projectiles
      for (const proj of s.projectiles) {
        if (proj.dead) continue;
        proj.pos.x += proj.vel.x;
        proj.pos.y += proj.vel.y;
        // Out of bounds
        if (
          proj.pos.x < -20 ||
          proj.pos.x > W + 20 ||
          proj.pos.y < -20 ||
          proj.pos.y > H + 20
        ) {
          proj.dead = true;
          continue;
        }
        if (proj.fromPlayer) {
          for (const e of s.enemies) {
            if (e.dead) continue;
            if (dist(proj.pos, e.pos) < proj.radius + e.radius) {
              proj.dead = true;
              const dmg = 20 + s.wave * 2;
              e.hp -= dmg;
              spawnParticles(e.pos, typeColor(e.type), 5, 2.5);
              if (e.hp <= 0) {
                e.dead = true;
                s.score +=
                  e.type === "tank" ? 30 : e.type === "ranged" ? 20 : 10;
                spawnParticles(e.pos, typeColor(e.type), 12, 4);
                // Drop orb
                if (Math.random() < 0.4) {
                  s.orbs.push({
                    id: s.nextId++,
                    pos: { x: e.pos.x, y: e.pos.y },
                    dead: false,
                  });
                }
              }
              break;
            }
          }
        } else {
          // Enemy projectile hits player
          if (
            dist(proj.pos, p.pos) < proj.radius + p.radius &&
            p.iframes === 0
          ) {
            proj.dead = true;
            p.hp -= 12;
            p.iframes = 30;
            spawnParticles(p.pos, "oklch(0.65 0.22 25)", 6, 3);
            if (p.hp <= 0) {
              p.hp = 0;
              s.status = "dead";
            }
          }
        }
      }

      // Orb pickup
      for (const orb of s.orbs) {
        if (orb.dead) continue;
        if (dist(orb.pos, p.pos) < ORB_RADIUS + COLLECT_RANGE) {
          orb.dead = true;
          s.orbCount++;
          s.score += 5;
          spawnParticles(orb.pos, "oklch(0.70 0.22 240)", 8, 2);
        }
      }

      // Update particles
      for (const part of s.particles) {
        part.pos.x += part.vel.x;
        part.pos.y += part.vel.y;
        part.vel.x *= 0.92;
        part.vel.y *= 0.92;
        part.life--;
      }

      // Cleanup
      s.projectiles = s.projectiles.filter((p) => !p.dead);
      s.orbs = s.orbs.filter((o) => !o.dead);
      s.particles = s.particles.filter((p) => p.life > 0);
      s.enemies = s.enemies.filter((e) => {
        // Remove enemies far out of bounds
        if (e.dead && !s.particles.some((p) => dist(p.pos, e.pos) < 1))
          return false;
        return true;
      });

      const alive = s.enemies.filter((e) => !e.dead);
      s.enemiesLeft = alive.length;

      if (alive.length === 0 && s.status === "playing") {
        s.status = "wave_clear";
        s.waveTimer = 120;
      }

      drawFrame();
      setUiState({
        wave: s.wave,
        score: s.score,
        hp: p.hp,
        maxHp: p.maxHp,
        orbs: s.orbCount,
        status: s.status,
        enemiesLeft: s.enemiesLeft,
      });
      animRef.current = requestAnimationFrame(tick);
    }

    function typeColor(type: Enemy["type"]) {
      switch (type) {
        case "fast":
          return "oklch(0.65 0.22 150)";
        case "tank":
          return "oklch(0.65 0.22 50)";
        case "ranged":
          return "oklch(0.65 0.22 290)";
        default:
          return "oklch(0.65 0.22 25)";
      }
    }

    function drawFrame() {
      if (!ctx) return;
      const s = stateRef.current;
      const p = s.player;

      // Background
      ctx.fillStyle = "#050508";
      ctx.fillRect(0, 0, W, H);

      // Grid lines
      ctx.strokeStyle = "oklch(0.70 0.22 240 / 0.07)";
      ctx.lineWidth = 1;
      for (let x = 0; x < W; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, H);
        ctx.stroke();
      }
      for (let y = 0; y < H; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
      }

      // Arena boundary
      ctx.strokeStyle = "oklch(0.70 0.22 240 / 0.4)";
      ctx.lineWidth = 2;
      ctx.strokeRect(2, 2, W - 4, H - 4);

      // Particles
      for (const part of s.particles) {
        const alpha = part.life / part.maxLife;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = part.color;
        ctx.beginPath();
        ctx.arc(part.pos.x, part.pos.y, part.size * alpha, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // Orbs
      for (const orb of s.orbs) {
        if (orb.dead) continue;
        ctx.shadowBlur = 12;
        ctx.shadowColor = "oklch(0.70 0.22 240)";
        ctx.fillStyle = "oklch(0.80 0.22 240)";
        ctx.beginPath();
        ctx.arc(orb.pos.x, orb.pos.y, ORB_RADIUS, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Enemy projectiles
      for (const proj of s.projectiles) {
        if (proj.dead || proj.fromPlayer) continue;
        ctx.shadowBlur = 10;
        ctx.shadowColor = "oklch(0.65 0.22 290)";
        ctx.fillStyle = "oklch(0.75 0.22 290)";
        ctx.beginPath();
        ctx.arc(proj.pos.x, proj.pos.y, proj.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Player projectiles
      for (const proj of s.projectiles) {
        if (proj.dead || !proj.fromPlayer) continue;
        ctx.shadowBlur = 14;
        ctx.shadowColor = "oklch(0.70 0.22 240)";
        ctx.fillStyle = "oklch(0.90 0.22 240)";
        ctx.beginPath();
        ctx.arc(proj.pos.x, proj.pos.y, proj.radius, 0, Math.PI * 2);
        ctx.fill();
        // Tail
        ctx.globalAlpha = 0.4;
        ctx.fillStyle = "oklch(0.70 0.22 240)";
        ctx.beginPath();
        ctx.arc(
          proj.pos.x - proj.vel.x * 1.5,
          proj.pos.y - proj.vel.y * 1.5,
          proj.radius * 0.6,
          0,
          Math.PI * 2,
        );
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
      }

      // Enemies
      for (const e of s.enemies) {
        if (e.dead) continue;
        const color = typeColor(e.type);
        ctx.shadowBlur = 15;
        ctx.shadowColor = color;
        ctx.fillStyle = color;
        ctx.beginPath();
        if (e.type === "tank") {
          // Square-ish
          ctx.save();
          ctx.translate(e.pos.x, e.pos.y);
          ctx.rotate(Date.now() * 0.001);
          ctx.fillRect(-e.radius, -e.radius, e.radius * 2, e.radius * 2);
          ctx.restore();
        } else if (e.type === "fast") {
          // Triangle
          const dir = norm({ x: p.pos.x - e.pos.x, y: p.pos.y - e.pos.y });
          const perp = { x: -dir.y, y: dir.x };
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(
            e.pos.x + dir.x * e.radius * 1.5,
            e.pos.y + dir.y * e.radius * 1.5,
          );
          ctx.lineTo(e.pos.x + perp.x * e.radius, e.pos.y + perp.y * e.radius);
          ctx.lineTo(e.pos.x - perp.x * e.radius, e.pos.y - perp.y * e.radius);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        } else {
          ctx.arc(e.pos.x, e.pos.y, e.radius, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.shadowBlur = 0;

        // HP bar
        const barW = e.radius * 2.5;
        const barX = e.pos.x - barW / 2;
        const barY = e.pos.y - e.radius - 8;
        ctx.fillStyle = "#1a1a2e";
        ctx.fillRect(barX, barY, barW, 4);
        ctx.fillStyle = color;
        ctx.fillRect(barX, barY, barW * (e.hp / e.maxHp), 4);
      }

      // Player
      const pFlash = p.iframes > 0 && Math.floor(p.iframes / 4) % 2 === 0;
      if (!pFlash) {
        ctx.shadowBlur = 20;
        ctx.shadowColor = "oklch(0.70 0.22 240)";
        // Outer ring
        ctx.strokeStyle = "oklch(0.70 0.22 240)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(p.pos.x, p.pos.y, p.radius + 4, 0, Math.PI * 2);
        ctx.stroke();
        // Body
        ctx.fillStyle = "oklch(0.85 0.22 240)";
        ctx.beginPath();
        ctx.arc(p.pos.x, p.pos.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        // Cross mark
        ctx.strokeStyle = "#050508";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(p.pos.x - 6, p.pos.y);
        ctx.lineTo(p.pos.x + 6, p.pos.y);
        ctx.moveTo(p.pos.x, p.pos.y - 6);
        ctx.lineTo(p.pos.x, p.pos.y + 6);
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      // Aim line from player to mouse
      const mouse = mouseRef.current;
      const aimDir = norm({ x: mouse.x - p.pos.x, y: mouse.y - p.pos.y });
      ctx.strokeStyle = "oklch(0.70 0.22 240 / 0.3)";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 6]);
      ctx.beginPath();
      ctx.moveTo(
        p.pos.x + aimDir.x * (p.radius + 6),
        p.pos.y + aimDir.y * (p.radius + 6),
      );
      ctx.lineTo(p.pos.x + aimDir.x * 60, p.pos.y + aimDir.y * 60);
      ctx.stroke();
      ctx.setLineDash([]);

      // Wave start overlay
      if (s.waveTimer > 0 && s.wave > 0) {
        ctx.fillStyle = "oklch(0.70 0.22 240 / 0.12)";
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = "oklch(0.70 0.22 240)";
        ctx.font = "bold 22px 'Cinzel', serif";
        ctx.textAlign = "center";
        ctx.shadowBlur = 20;
        ctx.shadowColor = "oklch(0.70 0.22 240)";
        ctx.fillText(`WAVE ${s.wave}`, W / 2, H / 2);
        ctx.shadowBlur = 0;
        ctx.font = "14px 'Exo 2', sans-serif";
        ctx.fillStyle = "oklch(0.75 0.01 265)";
        ctx.fillText("Survive the cursed spirits", W / 2, H / 2 + 30);
        ctx.textAlign = "left";
      }

      // Wave clear overlay
      if (s.status === "wave_clear" && s.waveTimer <= 0) {
        ctx.fillStyle = "oklch(0.65 0.22 150 / 0.12)";
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = "oklch(0.75 0.22 150)";
        ctx.font = "bold 26px 'Cinzel', serif";
        ctx.textAlign = "center";
        ctx.shadowBlur = 20;
        ctx.shadowColor = "oklch(0.75 0.22 150)";
        ctx.fillText("WAVE CLEARED!", W / 2, H / 2);
        ctx.shadowBlur = 0;
        ctx.fillStyle = "oklch(0.65 0.015 270)";
        ctx.font = "14px 'Exo 2', sans-serif";
        ctx.fillText("Preparing next wave...", W / 2, H / 2 + 30);
        ctx.textAlign = "left";
      }
    }

    animRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  const { wave, score, hp, maxHp, orbs, status, enemiesLeft } = uiState;

  return (
    <div
      className="flex flex-col items-center gap-4"
      style={{ userSelect: "none" }}
    >
      <style>{`
        @keyframes survivalPulse {
          0%, 100% { box-shadow: 0 0 10px oklch(0.70 0.22 240 / 0.4); }
          50% { box-shadow: 0 0 25px oklch(0.70 0.22 240 / 0.7); }
        }
      `}</style>

      {/* HUD */}
      <div
        className="w-full max-w-[700px] rounded-lg px-4 py-3 grid grid-cols-3 gap-4"
        style={{
          background: "oklch(0.08 0.02 260)",
          border: "1px solid oklch(0.70 0.22 240 / 0.25)",
        }}
      >
        <div>
          <p
            className="font-cinzel text-[10px] tracking-widest"
            style={{ color: "oklch(0.70 0.22 240)" }}
          >
            WAVE
          </p>
          <p
            className="font-cinzel text-2xl font-black"
            style={{ color: "oklch(0.92 0.01 265)" }}
          >
            {wave}
          </p>
        </div>
        <div className="flex flex-col items-center">
          <p
            className="font-cinzel text-[10px] tracking-widest"
            style={{ color: "oklch(0.65 0.22 25)" }}
          >
            CURSED HP
          </p>
          <div
            className="w-full mt-1 h-3 rounded-full overflow-hidden"
            style={{ background: "oklch(0.12 0.02 260)" }}
          >
            <div
              className="h-full rounded-full transition-all duration-200"
              style={{
                width: `${Math.max(0, (hp / maxHp) * 100)}%`,
                background:
                  hp > 50
                    ? "oklch(0.65 0.22 150)"
                    : hp > 25
                      ? "oklch(0.70 0.22 50)"
                      : "oklch(0.65 0.22 25)",
                boxShadow: `0 0 8px ${hp > 50 ? "oklch(0.65 0.22 150)" : "oklch(0.65 0.22 25)"}`,
              }}
            />
          </div>
          <p
            className="font-exo text-xs mt-1"
            style={{ color: "oklch(0.65 0.015 270)" }}
          >
            {hp} / {maxHp}
          </p>
        </div>
        <div className="text-right">
          <p
            className="font-cinzel text-[10px] tracking-widest"
            style={{ color: "oklch(0.65 0.22 290)" }}
          >
            SCORE
          </p>
          <p
            className="font-cinzel text-2xl font-black"
            style={{ color: "oklch(0.92 0.01 265)" }}
          >
            {score.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Sub-HUD */}
      <div className="w-full max-w-[700px] flex justify-between px-1">
        <span
          className="font-exo text-xs"
          style={{ color: "oklch(0.65 0.015 270)" }}
        >
          Enemies:{" "}
          <span style={{ color: "oklch(0.65 0.22 25)" }}>{enemiesLeft}</span>
        </span>
        <span
          className="font-exo text-xs"
          style={{ color: "oklch(0.65 0.015 270)" }}
        >
          Energy Orbs:{" "}
          <span style={{ color: "oklch(0.70 0.22 240)" }}>{orbs}</span>
        </span>
      </div>

      {/* Canvas */}
      <div
        className="relative"
        style={{ animation: "survivalPulse 3s ease-in-out infinite" }}
      >
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          className="rounded-lg block cursor-crosshair"
          style={{
            maxWidth: "100%",
            border: "2px solid oklch(0.70 0.22 240 / 0.3)",
          }}
        />

        {status === "dead" && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center rounded-lg gap-4"
            style={{ background: "oklch(0.03 0.01 25 / 0.92)" }}
          >
            <p
              className="font-cinzel font-black text-4xl"
              style={{
                color: "oklch(0.65 0.22 25)",
                textShadow: "0 0 30px oklch(0.65 0.22 25)",
              }}
            >
              DOMAIN COLLAPSED
            </p>
            <p
              className="font-cinzel text-sm"
              style={{ color: "oklch(0.65 0.015 270)" }}
            >
              Wave {wave} &mdash; Score: {score.toLocaleString()}
            </p>
            <button
              type="button"
              onClick={resetGame}
              className="mt-2 px-8 py-3 rounded font-cinzel text-sm tracking-widest uppercase"
              style={{
                background: "oklch(0.65 0.22 25 / 0.15)",
                border: "1px solid oklch(0.65 0.22 25 / 0.5)",
                color: "oklch(0.65 0.22 25)",
                cursor: "pointer",
              }}
            >
              TRY AGAIN
            </button>
          </div>
        )}
      </div>

      {/* Controls */}
      <div
        className="w-full max-w-[700px] rounded-lg px-4 py-3 grid grid-cols-2 gap-4"
        style={{
          background: "oklch(0.08 0.02 260)",
          border: "1px solid oklch(0.70 0.22 240 / 0.15)",
        }}
      >
        <div>
          <p
            className="font-cinzel text-[10px] tracking-widest mb-2"
            style={{ color: "oklch(0.70 0.22 240)" }}
          >
            MOVEMENT
          </p>
          <p
            className="font-exo text-xs"
            style={{ color: "oklch(0.65 0.015 270)" }}
          >
            WASD / Arrow keys
          </p>
        </div>
        <div>
          <p
            className="font-cinzel text-[10px] tracking-widest mb-2"
            style={{ color: "oklch(0.70 0.22 240)" }}
          >
            ATTACK
          </p>
          <p
            className="font-exo text-xs"
            style={{ color: "oklch(0.65 0.015 270)" }}
          >
            Auto-shoots toward cursor
          </p>
        </div>
        <div>
          <p
            className="font-cinzel text-[10px] tracking-widest mb-1"
            style={{ color: "oklch(0.65 0.22 290)" }}
          >
            RANGED (purple)
          </p>
          <p
            className="font-exo text-xs"
            style={{ color: "oklch(0.65 0.015 270)" }}
          >
            Shoots at you, keep distance
          </p>
        </div>
        <div>
          <p
            className="font-cinzel text-[10px] tracking-widest mb-1"
            style={{ color: "oklch(0.70 0.22 240)" }}
          >
            ENERGY ORBS
          </p>
          <p
            className="font-exo text-xs"
            style={{ color: "oklch(0.65 0.015 270)" }}
          >
            Walk over blue orbs to collect
          </p>
        </div>
      </div>
    </div>
  );
}
