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
  iframes: number;
}

interface Enemy {
  id: number;
  pos: Vec2;
  hp: number;
  maxHp: number;
  speed: number;
  radius: number;
  type: "grunt" | "fast" | "tank" | "ranged";
  shootCd: number;
  dead: boolean;
}

interface Projectile {
  id: number;
  pos: Vec2;
  vel: Vec2;
  radius: number;
  fromPlayer: boolean;
  dead: boolean;
  piercing?: boolean;
  isHollowPurple?: boolean;
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
  waveTimer: number;
  status: "playing" | "wave_clear" | "dead";
  nextId: number;
  // Ability stats
  dmgMultiplier: number;
  shootCdBase: number;
  iframeBonus: number;
  piercingShots: boolean;
  orbMagnet: boolean;
  doubleShot: boolean;
  aoeOnKill: boolean;
  blackFlashChance: number;
  pickedAbilities: string[];
  // New ability stats
  speedMultiplier: number;
  tripleShot: boolean;
  enemySlowMultiplier: number;
  hasRegen: boolean;
  regenTimer: number;
  knockbackShots: boolean;
  hasDomain: boolean;
  domainCd: number;
  healOnHit: boolean;
  hasHollowPurple: boolean;
  hollowPurpleCounter: number;
  // Extended overpowered abilities
  quadShot: boolean;
  burstShot: boolean;
  burstCounter: number;
  homingShots: boolean;
  explosiveShots: boolean;
  vampiricStrike: boolean;
  shieldHp: number;
  hasShield: boolean;
  shieldRechargeCd: number;
  timeSlowActive: boolean;
  timeSlowCd: number;
  timeSlowTimer: number;
  doomAura: boolean;
  doomAuraCd: number;
  cloneActive: boolean;
  clonePos: { x: number; y: number } | null;
  cloneShootCd: number;
  spikeAura: boolean;
  dmgReductionPct: number;
  orbBombActive: boolean;
  doubleScore: boolean;
  instaKillBelowPct: number;
  // Ultra-OP new abilities
  multiShotCount: number;
  ricochets: boolean;
  chainLightning: boolean;
  chainLightningCd: number;
  frozenTime: boolean;
  frozenTimeCd: number;
  frozenTimeTimer: number;
  blackHole: boolean;
  blackHoleCd: number;
  domainAmplification: boolean;
  cursedRain: boolean;
  cursedRainCd: number;
  thorns: boolean;
  thornsDmg: number;
  massiveRegen: boolean;
  massiveRegenTimer: number;
  deathBurst: boolean;
  deathBurstRadius: number;
  godMode: boolean;
  godModeCd: number;
  godModeTimer: number;
  infiniteAmmo: boolean;
  superOrb: boolean;
  ultraBlackFlash: boolean;
  soulAbsorb: boolean;
  soulAbsorbCount: number;
  chainExplosion: boolean;
  cursedStorm: boolean;
  cursedStormCd: number;
  teleport: boolean;
  teleportCd: number;
}

const W = 700;
const H = 500;
const PLAYER_SPEED = 3.2;
const BASE_SHOOT_CD = 22;
const SHOOT_SPEED = 8;
const ORB_RADIUS = 10;
const COLLECT_RANGE = 18;

// --- JJK Ability Definitions ---
export interface JJKAbility {
  id: string;
  name: string;
  character: string;
  description: string;
  emoji: string;
  color: string;
  apply: (s: GameState) => void;
}

export const JJK_ABILITIES: JJKAbility[] = [
  {
    id: "infinity",
    name: "Infinity",
    character: "Gojo Satoru",
    description:
      "Cursed energy forms an infinite barrier. Invincibility frames last much longer after taking damage.",
    emoji: "∞",
    color: "oklch(0.70 0.22 240)",
    apply: (s) => {
      s.iframeBonus += 25;
    },
  },
  {
    id: "divergent_fist",
    name: "Divergent Fist",
    character: "Yuji Itadori",
    description:
      "Cursed energy lags behind physical attacks. Projectile damage increased by 60%.",
    emoji: "👊",
    color: "oklch(0.72 0.22 25)",
    apply: (s) => {
      s.dmgMultiplier *= 1.6;
    },
  },
  {
    id: "rapid_fire",
    name: "Straw Doll: Hairpin",
    character: "Nobara Kugisaki",
    description: "Nails fly at cursed speed. Fire rate increased by 40%.",
    emoji: "🔨",
    color: "oklch(0.72 0.22 50)",
    apply: (s) => {
      s.shootCdBase = Math.max(6, Math.round(s.shootCdBase * 0.6));
    },
  },
  {
    id: "piercing_blood",
    name: "Piercing Blood",
    character: "Naoya Zenin",
    description:
      "Blood propelled at cursed speeds pierces through all enemies in its path.",
    emoji: "🩸",
    color: "oklch(0.65 0.22 15)",
    apply: (s) => {
      s.piercingShots = true;
    },
  },
  {
    id: "maximum_output",
    name: "Maximum Output",
    character: "Kento Nanami",
    description:
      "Push cursed energy to its absolute limit. Gain 40 max HP and fully restore health.",
    emoji: "⚡",
    color: "oklch(0.72 0.22 90)",
    apply: (s) => {
      s.player.maxHp += 40;
      s.player.hp = Math.min(s.player.hp + 40, s.player.maxHp);
    },
  },
  {
    id: "ten_shadows",
    name: "Ten Shadows Technique",
    character: "Megumi Fushiguro",
    description:
      "Shadow shikigami emerge beside every shot. Fire two projectiles simultaneously.",
    emoji: "🐉",
    color: "oklch(0.65 0.22 290)",
    apply: (s) => {
      s.doubleShot = true;
    },
  },
  {
    id: "black_flash",
    name: "Black Flash",
    character: "Yuji Itadori",
    description:
      "When cursed energy and force align, power amplifies. 30% chance to deal 3× damage per hit.",
    emoji: "⚫",
    color: "oklch(0.45 0.10 260)",
    apply: (s) => {
      s.blackFlashChance = Math.min(0.9, s.blackFlashChance + 0.3);
    },
  },
  {
    id: "cleave",
    name: "Cleave",
    character: "Ryomen Sukuna",
    description:
      "Adaptable slashing technique. Enemies explode on death, dealing 25 damage to nearby foes.",
    emoji: "🗡️",
    color: "oklch(0.65 0.22 350)",
    apply: (s) => {
      s.aoeOnKill = true;
    },
  },
  {
    id: "blue",
    name: "Limitless: Blue",
    character: "Gojo Satoru",
    description:
      "Reverse cursed technique creates attraction. Energy orbs are pulled toward you from across the arena.",
    emoji: "💙",
    color: "oklch(0.70 0.22 220)",
    apply: (s) => {
      s.orbMagnet = true;
    },
  },
  {
    id: "ratio_technique",
    name: "Ratio Technique",
    character: "Kento Nanami",
    description:
      "Strike the 7:3 weak spot. Bonus 40% damage against all enemies.",
    emoji: "📐",
    color: "oklch(0.72 0.22 80)",
    apply: (s) => {
      s.dmgMultiplier *= 1.4;
    },
  },
  {
    id: "reverse_cursed",
    name: "Reverse Cursed Technique",
    character: "Gojo Satoru",
    description:
      "Invert cursed energy to heal wounds. Restore 30 HP whenever you collect an energy orb.",
    emoji: "💚",
    color: "oklch(0.70 0.22 150)",
    apply: (_s) => {
      /* applied in orb pickup logic via id check */
    },
  },
  // --- New Abilities ---
  {
    id: "wind_scythe",
    name: "Wind Scythe",
    character: "Maki Zenin",
    description:
      "Cursed tool amplifies speed. Move 45% faster across the arena.",
    emoji: "💨",
    color: "oklch(0.72 0.22 150)",
    apply: (s) => {
      s.speedMultiplier *= 1.45;
      s.player.speed = PLAYER_SPEED * s.speedMultiplier;
    },
  },
  {
    id: "flowing_red_scale",
    name: "Flowing Red Scale",
    character: "Ryomen Sukuna",
    description: "Release three simultaneous slashes in a spread pattern.",
    emoji: "🔺",
    color: "oklch(0.65 0.22 10)",
    apply: (s) => {
      s.tripleShot = true;
      s.doubleShot = false;
    },
  },
  {
    id: "cursed_speech",
    name: "Cursed Speech: Freeze",
    character: "Toge Inumaki",
    description: "Binding words slow all cursed spirits by 40%.",
    emoji: "🗣️",
    color: "oklch(0.72 0.22 60)",
    apply: (s) => {
      s.enemySlowMultiplier *= 0.6;
    },
  },
  {
    id: "positive_energy",
    name: "Positive Energy",
    character: "Haibara Yu",
    description:
      "Latent healing reverses cursed damage. Regenerate 1 HP every 3 seconds.",
    emoji: "💛",
    color: "oklch(0.80 0.20 80)",
    apply: (s) => {
      s.hasRegen = true;
    },
  },
  {
    id: "red",
    name: "Limitless: Red",
    character: "Gojo Satoru",
    description:
      "Reversed Limitless repels. Projectiles knock enemies backward on impact.",
    emoji: "🔴",
    color: "oklch(0.65 0.22 25)",
    apply: (s) => {
      s.knockbackShots = true;
    },
  },
  {
    id: "malevolent_shrine",
    name: "Malevolent Shrine",
    character: "Ryomen Sukuna",
    description:
      "Domain expansion radiates destruction. Every 5 seconds, deal 15 damage to every enemy in the arena.",
    emoji: "⛩️",
    color: "oklch(0.65 0.22 350)",
    apply: (s) => {
      s.hasDomain = true;
      s.domainCd = 300;
    },
  },
  {
    id: "blood_manipulation",
    name: "Blood Manipulation: Supernova",
    character: "Choso",
    description:
      "Blood drawn from fallen enemies heals. Restore 8 HP for every enemy killed.",
    emoji: "🩸",
    color: "oklch(0.60 0.22 15)",
    apply: (s) => {
      s.healOnHit = true;
    },
  },
  {
    id: "hollow_purple",
    name: "Hollow Purple",
    character: "Gojo Satoru",
    description:
      "Convergence of Blue and Red. Every 8th shot fires a massive orb dealing 5× damage in a wide radius.",
    emoji: "🟣",
    color: "oklch(0.70 0.22 290)",
    apply: (s) => {
      s.hasHollowPurple = true;
    },
  },
  {
    id: "quad_shot",
    name: "Boogie Woogie",
    character: "Aoi Todo",
    description:
      "Swap positions to fire in ALL four diagonal directions simultaneously. Quad-shot devastates groups.",
    emoji: "🔀",
    color: "oklch(0.70 0.22 60)",
    apply: (s) => {
      s.quadShot = true;
    },
  },
  {
    id: "burst_shot",
    name: "Cursed Burst",
    character: "Yuji Itadori",
    description:
      "Every 5th shot unleashes a rapid 5-bullet burst. Suppression fire tears through crowds.",
    emoji: "💥",
    color: "oklch(0.65 0.22 30)",
    apply: (s) => {
      s.burstShot = true;
      s.burstCounter = 0;
    },
  },
  {
    id: "homing",
    name: "Flame Arrow",
    character: "Maki Zenin",
    description:
      "Projectiles gain cursed homing. They track the nearest enemy and never miss.",
    emoji: "🎯",
    color: "oklch(0.70 0.22 45)",
    apply: (s) => {
      s.homingShots = true;
    },
  },
  {
    id: "explosive",
    name: "Resonance: Detonation",
    character: "Nobara Kugisaki",
    description:
      "Every projectile explodes on impact, dealing 3× AoE damage in a 60px radius.",
    emoji: "💣",
    color: "oklch(0.68 0.22 50)",
    apply: (s) => {
      s.explosiveShots = true;
    },
  },
  {
    id: "vampiric",
    name: "Blood Drain",
    character: "Choso",
    description:
      "Each kill restores 20 HP. You heal faster than enemies can damage you.",
    emoji: "🩸",
    color: "oklch(0.60 0.22 10)",
    apply: (s) => {
      s.vampiricStrike = true;
    },
  },
  {
    id: "shield",
    name: "Cursed Shield",
    character: "Aoi Todo",
    description:
      "A 150 HP cursed barrier absorbs all damage first and recharges every 10 seconds.",
    emoji: "🛡️",
    color: "oklch(0.70 0.22 200)",
    apply: (s) => {
      s.hasShield = true;
      s.shieldHp = 150;
      s.shieldRechargeCd = 0;
    },
  },
  {
    id: "time_slow",
    name: "Idle Death Gamble",
    character: "Hiromi Higuruma",
    description:
      "Activates Domain Expansion every 8 seconds, slowing ALL enemies by 80% for 3 seconds.",
    emoji: "⏳",
    color: "oklch(0.68 0.22 270)",
    apply: (s) => {
      s.timeSlowActive = true;
      s.timeSlowCd = 0;
    },
  },
  {
    id: "doom_aura",
    name: "Divergent Sigil",
    character: "Kento Nanami",
    description:
      "Cursed sigils orbit you constantly, dealing 30 damage per second to all nearby enemies.",
    emoji: "🌀",
    color: "oklch(0.65 0.22 85)",
    apply: (s) => {
      s.doomAura = true;
      s.doomAuraCd = 0;
    },
  },
  {
    id: "clone",
    name: "Shadow Clone Shikigami",
    character: "Megumi Fushiguro",
    description:
      "A shadow clone mirrors your position and fires independently, doubling your firepower.",
    emoji: "👥",
    color: "oklch(0.55 0.15 290)",
    apply: (s) => {
      s.cloneActive = true;
      s.clonePos = { x: s.player.pos.x + 60, y: s.player.pos.y };
      s.cloneShootCd = 0;
    },
  },
  {
    id: "spike_aura",
    name: "Venom Spikes",
    character: "Hanami",
    description:
      "Enemies that touch you take 40 damage and are knocked back instantly.",
    emoji: "🌿",
    color: "oklch(0.65 0.22 140)",
    apply: (s) => {
      s.spikeAura = true;
    },
  },
  {
    id: "iron_body",
    name: "Iron Body",
    character: "Aoi Todo",
    description:
      "Immovable cursed toughness. Gain 80 max HP and reduce all incoming damage by 50%.",
    emoji: "🪨",
    color: "oklch(0.65 0.10 80)",
    apply: (s) => {
      s.player.maxHp += 80;
      s.player.hp = Math.min(s.player.hp + 80, s.player.maxHp);
      s.dmgReductionPct = Math.min(0.75, s.dmgReductionPct + 0.5);
    },
  },
  {
    id: "orb_bomb",
    name: "Orb Detonator",
    character: "Ryomen Sukuna",
    description:
      "Energy orbs explode when collected, dealing 80 damage to all enemies within 100px.",
    emoji: "💫",
    color: "oklch(0.65 0.22 350)",
    apply: (s) => {
      s.orbBombActive = true;
    },
  },
  {
    id: "double_score",
    name: "Heavenly Restriction",
    character: "Toji Fushiguro",
    description:
      "Transcend cursed energy entirely. All score gains are permanently doubled.",
    emoji: "⭐",
    color: "oklch(0.75 0.18 55)",
    apply: (s) => {
      s.doubleScore = true;
    },
  },
  {
    id: "instakill",
    name: "Dismantle",
    character: "Ryomen Sukuna",
    description:
      "Sukuna's innate technique activates. Enemies below 25% HP are instantly sliced to death.",
    emoji: "⚔️",
    color: "oklch(0.60 0.25 5)",
    apply: (s) => {
      s.instaKillBelowPct = Math.min(0.5, s.instaKillBelowPct + 0.25);
    },
  },
  {
    id: "rapid_fire_extreme",
    name: "Max Speed: Supernova",
    character: "Nanami",
    description:
      "Push fire rate to the absolute extreme. Shoot 3× faster than normal.",
    emoji: "🌟",
    color: "oklch(0.78 0.20 70)",
    apply: (s) => {
      s.shootCdBase = Math.max(3, Math.round(s.shootCdBase * 0.33));
    },
  },
  {
    id: "god_mode",
    name: "Six Eyes: Awakened",
    character: "Gojo Satoru",
    description:
      "The Six Eyes open fully. Deal 3× damage, gain 100 HP, and fire rate doubles.",
    emoji: "👁️",
    color: "oklch(0.85 0.22 230)",
    apply: (s) => {
      s.dmgMultiplier *= 3;
      s.player.maxHp += 100;
      s.player.hp = Math.min(s.player.hp + 100, s.player.maxHp);
      s.shootCdBase = Math.max(4, Math.round(s.shootCdBase * 0.5));
    },
  },
  {
    id: "multi_barrage",
    name: "Unlimited Void Barrage",
    character: "Gojo Satoru",
    description:
      "Fire 8 projectiles in all directions simultaneously every shot. Pure chaos.",
    emoji: "💠",
    color: "oklch(0.75 0.30 220)",
    apply: (s) => {
      s.multiShotCount = Math.min(16, (s.multiShotCount || 1) + 8);
    },
  },
  {
    id: "ricochet",
    name: "Divergent Ricochet",
    character: "Megumi Fushiguro",
    description:
      "Every projectile bounces off walls 5 times, hitting enemies repeatedly.",
    emoji: "🔀",
    color: "oklch(0.60 0.25 280)",
    apply: (s) => {
      s.ricochets = true;
    },
  },
  {
    id: "chain_lightning",
    name: "Thunder God Surge",
    character: "Nanami Kento",
    description:
      "Every 2 seconds, chain lightning arcs through ALL enemies dealing 80 damage each.",
    emoji: "⚡",
    color: "oklch(0.90 0.28 95)",
    apply: (s) => {
      s.chainLightning = true;
      s.chainLightningCd = 0;
    },
  },
  {
    id: "frozen_time",
    name: "Time Stop: Hollow Purple",
    character: "Gojo Satoru",
    description:
      "Every 10s, freeze ALL enemies solid for 3 seconds. You move freely.",
    emoji: "❄️",
    color: "oklch(0.80 0.20 200)",
    apply: (s) => {
      s.frozenTime = true;
      s.frozenTimeCd = 0;
      s.frozenTimeTimer = 0;
    },
  },
  {
    id: "black_hole",
    name: "Gravitational Singularity",
    character: "Kenjaku",
    description:
      "Every 8s, spawn a black hole that sucks in ALL enemies and deals 200 damage.",
    emoji: "🌑",
    color: "oklch(0.20 0.15 300)",
    apply: (s) => {
      s.blackHole = true;
      s.blackHoleCd = 0;
    },
  },
  {
    id: "domain_amplification",
    name: "Domain Amplification: Absolute",
    character: "Yuta Okkotsu",
    description:
      "Triply amplify all damage. All projectiles pierce every enemy. Fire rate halved.",
    emoji: "🌀",
    color: "oklch(0.70 0.35 340)",
    apply: (s) => {
      s.domainAmplification = true;
      s.dmgMultiplier *= 3;
      s.piercingShots = true;
      s.shootCdBase = Math.max(3, Math.floor(s.shootCdBase * 0.5));
    },
  },
  {
    id: "cursed_rain",
    name: "Cursed Rain of Destruction",
    character: "Suguru Geto",
    description:
      "Every 3s, 20 cursed energy bolts fall from the sky, each dealing 60 damage.",
    emoji: "🌧️",
    color: "oklch(0.55 0.28 130)",
    apply: (s) => {
      s.cursedRain = true;
      s.cursedRainCd = 0;
    },
  },
  {
    id: "thorns",
    name: "Cursed Thorn Aegis",
    character: "Hanami",
    description:
      "Reflect 300% of any damage taken back at attackers. The more they hit you, the more they die.",
    emoji: "🌿",
    color: "oklch(0.65 0.28 145)",
    apply: (s) => {
      s.thorns = true;
      s.thornsDmg = 3.0;
    },
  },
  {
    id: "massive_regen",
    name: "Reverse Cursed Technique: MAX",
    character: "Sukuna",
    description:
      "Regenerate 15 HP every second. Practically impossible to die from chip damage.",
    emoji: "💚",
    color: "oklch(0.75 0.30 140)",
    apply: (s) => {
      s.massiveRegen = true;
      s.massiveRegenTimer = 0;
    },
  },
  {
    id: "death_burst",
    name: "Death Explosion Nova",
    character: "Choso",
    description:
      "Every enemy death triggers a 180px explosion dealing 150 damage to all nearby enemies.",
    emoji: "💥",
    color: "oklch(0.65 0.32 20)",
    apply: (s) => {
      s.deathBurst = true;
      s.deathBurstRadius = 180;
    },
  },
  {
    id: "god_mode",
    name: "Limitless: God Form",
    character: "Gojo Satoru",
    description:
      "Every 20s, become completely invincible and deal 10× damage for 5 seconds.",
    emoji: "✨",
    color: "oklch(0.98 0.05 100)",
    apply: (s) => {
      s.godMode = true;
      s.godModeCd = 0;
      s.godModeTimer = 0;
    },
  },
  {
    id: "infinite_ammo",
    name: "Curtain: Endless Barrage",
    character: "Gojo Satoru",
    description:
      "Fire 3 projectiles per frame at no cooldown for 2 seconds every 6 seconds.",
    emoji: "∞",
    color: "oklch(0.80 0.25 260)",
    apply: (s) => {
      s.infiniteAmmo = true;
    },
  },
  {
    id: "super_orb",
    name: "Soul Orb Harvest",
    character: "Mahito",
    description:
      "Each orb collected now heals 50 HP and grants +3 score multiplier permanently.",
    emoji: "💎",
    color: "oklch(0.70 0.20 310)",
    apply: (s) => {
      s.superOrb = true;
    },
  },
  {
    id: "ultra_black_flash",
    name: "Black Flash: Zero Point",
    character: "Yuji Itadori",
    description:
      "75% chance to deal 10× damage on every hit. Absolutely broken.",
    emoji: "🖤",
    color: "oklch(0.25 0.10 270)",
    apply: (s) => {
      s.ultraBlackFlash = true;
      s.blackFlashChance = 0.75;
    },
  },
  {
    id: "soul_absorb",
    name: "Idle Transfiguration",
    character: "Mahito",
    description:
      "Every kill permanently increases your max HP by 5. Stack it forever.",
    emoji: "👻",
    color: "oklch(0.60 0.22 300)",
    apply: (s) => {
      s.soulAbsorb = true;
      s.soulAbsorbCount = 0;
    },
  },
  {
    id: "chain_explosion",
    name: "Blood Manipulation: Chain Detonation",
    character: "Choso",
    description:
      "Explosions chain-react: each explosion triggers more explosions, up to 5 deep.",
    emoji: "🔗",
    color: "oklch(0.55 0.30 10)",
    apply: (s) => {
      s.chainExplosion = true;
      s.explosiveShots = true;
    },
  },
  {
    id: "cursed_storm",
    name: "Chimera Shadow Garden Storm",
    character: "Megumi Fushiguro",
    description:
      "Every 5s, a shadow storm deals 50 damage to all enemies and stuns them for 2s.",
    emoji: "🌪️",
    color: "oklch(0.35 0.18 270)",
    apply: (s) => {
      s.cursedStorm = true;
      s.cursedStormCd = 0;
    },
  },
  {
    id: "teleport",
    name: "Space Distortion: Warp",
    character: "Gojo Satoru",
    description:
      "Press SPACE to instantly teleport to your cursor. 1 second cooldown.",
    emoji: "🌐",
    color: "oklch(0.70 0.28 195)",
    apply: (s) => {
      s.teleport = true;
      s.teleportCd = 0;
    },
  },
  {
    id: "nuke_wave",
    name: "Sukuna: Dismantle & Cleave",
    character: "Ryomen Sukuna",
    description:
      "At wave start, instantly delete 50% of all enemies. Pure king energy.",
    emoji: "👹",
    color: "oklch(0.65 0.32 15)",
    apply: (s) => {
      s.dmgMultiplier *= 2;
      s.player.maxHp += 200;
      s.player.hp = Math.min(s.player.hp + 200, s.player.maxHp);
      // Kill half the enemies right now
      let killed = 0;
      const half = Math.floor(s.enemies.filter((e) => !e.dead).length / 2);
      for (const e of s.enemies) {
        if (!e.dead && killed < half) {
          e.dead = true;
          killed++;
        }
      }
    },
  },
  {
    id: "true_infinity",
    name: "True Infinity",
    character: "Gojo Satoru",
    description:
      "Permanently reduce ALL incoming damage to 1. The strongest there is.",
    emoji: "♾️",
    color: "oklch(0.95 0.15 220)",
    apply: (s) => {
      s.dmgReductionPct = Math.min(0.99, s.dmgReductionPct + 0.95);
      s.iframeBonus += 60;
    },
  },
];

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
    const angle = Math.random() * Math.PI * 2;
    const spawnDist = 380;
    const pos = {
      x: W / 2 + Math.cos(angle) * spawnDist,
      y: H / 2 + Math.sin(angle) * spawnDist,
    };
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
    dmgMultiplier: 1,
    shootCdBase: BASE_SHOOT_CD,
    iframeBonus: 0,
    piercingShots: false,
    orbMagnet: false,
    doubleShot: false,
    aoeOnKill: false,
    blackFlashChance: 0,
    pickedAbilities: [],
    // New ability fields
    speedMultiplier: 1,
    tripleShot: false,
    enemySlowMultiplier: 1,
    hasRegen: false,
    regenTimer: 0,
    knockbackShots: false,
    hasDomain: false,
    domainCd: 0,
    healOnHit: false,
    hasHollowPurple: false,
    hollowPurpleCounter: 0,
    // Extended overpowered abilities
    quadShot: false,
    burstShot: false,
    burstCounter: 0,
    homingShots: false,
    explosiveShots: false,
    vampiricStrike: false,
    shieldHp: 0,
    hasShield: false,
    shieldRechargeCd: 0,
    timeSlowActive: false,
    timeSlowCd: 0,
    timeSlowTimer: 0,
    doomAura: false,
    doomAuraCd: 0,
    cloneActive: false,
    clonePos: null,
    cloneShootCd: 0,
    spikeAura: false,
    dmgReductionPct: 0,
    orbBombActive: false,
    doubleScore: false,
    instaKillBelowPct: 0,
    // Ultra-OP new abilities
    multiShotCount: 1,
    ricochets: false,
    chainLightning: false,
    chainLightningCd: 0,
    frozenTime: false,
    frozenTimeCd: 0,
    frozenTimeTimer: 0,
    blackHole: false,
    blackHoleCd: 0,
    domainAmplification: false,
    cursedRain: false,
    cursedRainCd: 0,
    thorns: false,
    thornsDmg: 0,
    massiveRegen: false,
    massiveRegenTimer: 0,
    deathBurst: false,
    deathBurstRadius: 0,
    godMode: false,
    godModeCd: 0,
    godModeTimer: 0,
    infiniteAmmo: false,
    superOrb: false,
    ultraBlackFlash: false,
    soulAbsorb: false,
    soulAbsorbCount: 0,
    chainExplosion: false,
    cursedStorm: false,
    cursedStormCd: 0,
    teleport: false,
    teleportCd: 0,
  };
}

function pickRandomAbilities(pickedIds: string[], count = 3): JJKAbility[] {
  const available = JJK_ABILITIES.filter((a) => !pickedIds.includes(a.id));
  if (available.length === 0) return [];
  const shuffled = [...available].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

export default function SurvivalGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<GameState>(initGame());
  const keysRef = useRef<Set<string>>(new Set());
  const mouseRef = useRef<Vec2>({ x: W / 2, y: H / 2 });
  const shootCdRef = useRef(0);
  const animRef = useRef<number>(0);
  const abilityPickerShownRef = useRef(false);
  const pausedRef = useRef(false);
  const bgParticlesRef = useRef<
    {
      x: number;
      y: number;
      vx: number;
      vy: number;
      r: number;
      alpha: number;
      hue: number;
    }[]
  >([]);
  const bgKanjiRef = useRef<
    {
      x: number;
      y: number;
      vx: number;
      vy: number;
      char: string;
      alpha: number;
    }[]
  >([]);
  const playerTrailRef = useRef<{ x: number; y: number }[]>([]);
  const fastTrailsRef = useRef<Map<number, { x: number; y: number }[]>>(
    new Map(),
  );

  const [uiState, setUiState] = useState({
    wave: 0,
    score: 0,
    hp: 100,
    maxHp: 100,
    orbs: 0,
    status: "playing" as GameState["status"],
    enemiesLeft: 0,
    pickedAbilities: [] as string[],
  });

  const [showAbilityPicker, setShowAbilityPicker] = useState(false);
  const [abilityChoices, setAbilityChoices] = useState<JJKAbility[]>([]);
  const [hoveredAbility, setHoveredAbility] = useState<string | null>(null);

  const resetGame = useCallback(() => {
    stateRef.current = initGame();
    shootCdRef.current = 0;
    abilityPickerShownRef.current = false;
    pausedRef.current = false;
    setShowAbilityPicker(false);
    setAbilityChoices([]);
    setUiState({
      wave: 0,
      score: 0,
      hp: 100,
      maxHp: 100,
      orbs: 0,
      status: "playing",
      enemiesLeft: 0,
      pickedAbilities: [],
    });
  }, []);

  const handlePickAbility = useCallback((ability: JJKAbility) => {
    const s = stateRef.current;
    ability.apply(s);
    s.pickedAbilities = [...s.pickedAbilities, ability.id];

    // Start next wave
    s.status = "playing";
    s.waveTimer = 120;
    s.wave++;
    const result = spawnWaveEnemies(s.wave, s.nextId);
    s.enemies = result.enemies;
    s.nextId = result.nextId;
    s.enemiesLeft = s.enemies.filter((e) => !e.dead).length;

    abilityPickerShownRef.current = false;
    pausedRef.current = false;
    setShowAbilityPicker(false);
    setAbilityChoices([]);
    setUiState((prev) => ({
      ...prev,
      pickedAbilities: s.pickedAbilities,
      wave: s.wave,
      hp: s.player.hp,
      maxHp: s.player.maxHp,
    }));
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

      // If paused for ability picker, just draw and wait
      if (pausedRef.current) {
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
        drawFrame();
        animRef.current = requestAnimationFrame(tick);
        return;
      }

      // wave_clear: show ability picker instead of auto-advancing
      if (s.status === "wave_clear" && !abilityPickerShownRef.current) {
        abilityPickerShownRef.current = true;
        pausedRef.current = true;
        const choices = pickRandomAbilities(s.pickedAbilities, 3);
        if (choices.length === 0) {
          // No abilities left, just advance
          pausedRef.current = false;
          abilityPickerShownRef.current = false;
          s.status = "playing";
          s.waveTimer = 120;
          s.wave++;
          const result = spawnWaveEnemies(s.wave, s.nextId);
          s.enemies = result.enemies;
          s.nextId = result.nextId;
          s.enemiesLeft = s.enemies.filter((e) => !e.dead).length;
        } else {
          setAbilityChoices(choices);
          setShowAbilityPicker(true);
        }
        drawFrame();
        animRef.current = requestAnimationFrame(tick);
        return;
      }

      if (s.status === "wave_clear") {
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

      // Record player trail
      playerTrailRef.current.push({ x: p.pos.x, y: p.pos.y });
      if (playerTrailRef.current.length > 12) playerTrailRef.current.shift();

      // Record fast enemy trails
      for (const e of s.enemies) {
        if (e.dead || e.type !== "fast") continue;
        if (!fastTrailsRef.current.has(e.id))
          fastTrailsRef.current.set(e.id, []);
        const tr = fastTrailsRef.current.get(e.id)!;
        tr.push({ x: e.pos.x, y: e.pos.y });
        if (tr.length > 8) tr.shift();
      }

      // Player shoot
      if (shootCdRef.current > 0) shootCdRef.current--;
      if (shootCdRef.current === 0) {
        const dir = norm({
          x: mouseRef.current.x - p.pos.x,
          y: mouseRef.current.y - p.pos.y,
        });
        if (dir.x !== 0 || dir.y !== 0) {
          const fireProj = (angle: number, isHollowPurple = false) => {
            const cos = Math.cos(angle);
            const sin = Math.sin(angle);
            const rx = dir.x * cos - dir.y * sin;
            const ry = dir.x * sin + dir.y * cos;
            const speed = isHollowPurple ? SHOOT_SPEED * 1.2 : SHOOT_SPEED;
            s.projectiles.push({
              id: s.nextId++,
              pos: { x: p.pos.x, y: p.pos.y },
              vel: { x: rx * speed, y: ry * speed },
              radius: isHollowPurple ? 22 : 5,
              fromPlayer: true,
              dead: false,
              piercing: isHollowPurple ? false : s.piercingShots,
              isHollowPurple,
            });
          };

          if (s.tripleShot) {
            fireProj((-12 * Math.PI) / 180);
            fireProj(0);
            fireProj((12 * Math.PI) / 180);
          } else {
            fireProj(0);
            if (s.doubleShot) {
              fireProj((10 * Math.PI) / 180);
            }
          }

          // Hollow Purple: every 8th shot fires massive orb
          if (s.hasHollowPurple) {
            s.hollowPurpleCounter++;
            if (s.hollowPurpleCounter >= 8) {
              s.hollowPurpleCounter = 0;
              fireProj(0, true);
            }
          }

          // Burst shot: every 5th shot triggers 5-bullet burst
          if (s.burstShot) {
            s.burstCounter = (s.burstCounter || 0) + 1;
            if (s.burstCounter >= 5) {
              s.burstCounter = 0;
              for (let bi = 0; bi < 4; bi++) {
                setTimeout(
                  () => {
                    if (!s.enemies.some((e) => !e.dead)) return;
                    const bdir = norm({
                      x: mouseRef.current.x - p.pos.x,
                      y: mouseRef.current.y - p.pos.y,
                    });
                    if (bdir.x !== 0 || bdir.y !== 0) {
                      s.projectiles.push({
                        id: s.nextId++,
                        pos: { x: p.pos.x, y: p.pos.y },
                        vel: { x: bdir.x * 9, y: bdir.y * 9 },
                        radius: 5,
                        fromPlayer: true,
                        dead: false,
                        piercing: s.piercingShots,
                      });
                    }
                  },
                  (bi + 1) * 60,
                );
              }
            }
          }

          // Quad shot
          if (s.quadShot) {
            for (let qi = 0; qi < 4; qi++) {
              const qa = (qi * Math.PI) / 2;
              s.projectiles.push({
                id: s.nextId++,
                pos: { x: p.pos.x, y: p.pos.y },
                vel: { x: Math.cos(qa) * 7, y: Math.sin(qa) * 7 },
                radius: 5,
                fromPlayer: true,
                dead: false,
                piercing: s.piercingShots,
              });
            }
          }

          // Multi-shot (Unlimited Void Barrage): fire in all directions
          if (s.multiShotCount > 1) {
            const extra = s.multiShotCount;
            for (let mi = 0; mi < extra; mi++) {
              const ma = (mi / extra) * 2 * Math.PI;
              s.projectiles.push({
                id: s.nextId++,
                pos: { x: p.pos.x, y: p.pos.y },
                vel: { x: Math.cos(ma) * 8, y: Math.sin(ma) * 8 },
                radius: 5,
                fromPlayer: true,
                dead: false,
                piercing: s.piercingShots,
              });
            }
          }

          shootCdRef.current = s.shootCdBase;
        }
      }

      // Iframes
      if (p.iframes > 0) p.iframes--;

      // Shield recharge
      if (s.hasShield && s.shieldHp <= 0) {
        s.shieldRechargeCd++;
        if (s.shieldRechargeCd >= 600) {
          s.shieldHp = 150;
          s.shieldRechargeCd = 0;
        }
      }

      // Time Slow: Idle Death Gamble
      if (s.timeSlowActive) {
        s.timeSlowCd++;
        if (s.timeSlowTimer > 0) {
          s.timeSlowTimer--;
        }
        if (s.timeSlowCd >= 480) {
          s.timeSlowCd = 0;
          s.timeSlowTimer = 180; // 3 sec slow
          spawnParticles(p.pos, "#6644ff", 20, 6);
        }
      }

      // Doom Aura: Divergent Sigil
      if (s.doomAura) {
        s.doomAuraCd++;
        if (s.doomAuraCd >= 30) {
          s.doomAuraCd = 0;
          for (const e of s.enemies) {
            if (e.dead) continue;
            if (dist(e.pos, p.pos) < 100) {
              e.hp -= 1.5;
              if (Math.random() < 0.1) spawnParticles(e.pos, "#ffaa00", 3, 2);
              if (e.hp <= 0) {
                e.dead = true;
                const pts =
                  e.type === "tank" ? 30 : e.type === "ranged" ? 20 : 10;
                s.score += s.doubleScore ? pts * 2 : pts;
                if (s.vampiricStrike) p.hp = Math.min(p.maxHp, p.hp + 20);
                if (s.vampiricStrike) {
                  p.hp = Math.min(p.maxHp, p.hp + 20);
                }
                if (s.aoeOnKill) {
                  for (const ae of s.enemies) {
                    if (!ae.dead && dist(ae.pos, e.pos) < 60) ae.hp -= 25;
                  }
                }
              }
            }
          }
        }
      }

      // Clone: fires independently
      if (s.cloneActive && s.clonePos) {
        // Move clone toward player slowly
        const cd = norm({
          x: p.pos.x - s.clonePos.x,
          y: p.pos.y - s.clonePos.y,
        });
        const cdist = dist(p.pos, s.clonePos);
        if (cdist > 80) {
          s.clonePos.x += cd.x * 1.5;
          s.clonePos.y += cd.y * 1.5;
        }
        s.cloneShootCd--;
        if (s.cloneShootCd <= 0) {
          s.cloneShootCd = s.shootCdBase + 5;
          // Find nearest enemy
          let nearest: (typeof s.enemies)[0] | null = null;
          let nearDist = Number.POSITIVE_INFINITY;
          for (const e of s.enemies) {
            if (e.dead) continue;
            const d = dist(s.clonePos, e.pos);
            if (d < nearDist) {
              nearDist = d;
              nearest = e;
            }
          }
          if (nearest) {
            const cdir = norm({
              x: nearest.pos.x - s.clonePos.x,
              y: nearest.pos.y - s.clonePos.y,
            });
            s.projectiles.push({
              id: s.nextId++,
              pos: { x: s.clonePos.x, y: s.clonePos.y },
              vel: { x: cdir.x * 8, y: cdir.y * 8 },
              radius: 5,
              fromPlayer: true,
              dead: false,
              piercing: s.piercingShots,
            });
          }
        }
      }

      // Instakill below HP threshold
      if (s.instaKillBelowPct > 0) {
        for (const e of s.enemies) {
          if (e.dead) continue;
          if (e.hp / e.maxHp < s.instaKillBelowPct) {
            e.dead = true;
            const pts = e.type === "tank" ? 30 : e.type === "ranged" ? 20 : 10;
            s.score += s.doubleScore ? pts * 2 : pts;
            spawnParticles(e.pos, "#ff2200", 12, 4);
            if (s.vampiricStrike) p.hp = Math.min(p.maxHp, p.hp + 20);
          }
        }
      }

      // Regen
      if (s.hasRegen) {
        s.regenTimer++;
        if (s.regenTimer >= 180) {
          s.regenTimer = 0;
          if (p.hp < p.maxHp) {
            p.hp = Math.min(p.maxHp, p.hp + 1);
          }
        }
      }

      // Domain pulse (Malevolent Shrine)
      if (s.hasDomain) {
        if (s.domainCd > 0) {
          s.domainCd--;
        } else {
          s.domainCd = 300;
          for (const e of s.enemies) {
            if (!e.dead) {
              e.hp -= 15;
              spawnParticles(e.pos, "#aa44ff", 4, 2);
              if (e.hp <= 0) {
                e.dead = true;
                s.score +=
                  e.type === "tank" ? 30 : e.type === "ranged" ? 20 : 10;
                spawnParticles(e.pos, "#aa44ff", 10, 4);
                if (s.healOnHit) {
                  p.hp = Math.min(p.maxHp, p.hp + 8);
                }
              }
            }
          }
        }
      }

      // Massive Regen
      if (s.massiveRegen) {
        s.massiveRegenTimer++;
        if (s.massiveRegenTimer >= 60) {
          s.massiveRegenTimer = 0;
          p.hp = Math.min(p.maxHp, p.hp + 15);
        }
      }

      // God Mode
      if (s.godMode) {
        s.godModeCd++;
        if (s.godModeTimer > 0) {
          s.godModeTimer--;
          p.iframes = 9999;
        } else if (s.godModeCd >= 1200) {
          s.godModeCd = 0;
          s.godModeTimer = 300; // 5s
          s.dmgMultiplier *= 10;
          setTimeout(() => {
            s.dmgMultiplier /= 10;
          }, 5100);
        }
      }

      // Chain Lightning
      if (s.chainLightning) {
        s.chainLightningCd++;
        if (s.chainLightningCd >= 120) {
          s.chainLightningCd = 0;
          for (const e of s.enemies) {
            if (!e.dead) {
              e.hp -= 80;
              spawnParticles(e.pos, "#ffff00", 6, 3);
              if (e.hp <= 0) {
                e.dead = true;
                const pts =
                  e.type === "tank" ? 30 : e.type === "ranged" ? 20 : 10;
                s.score += s.doubleScore ? pts * 2 : pts;
                if (s.soulAbsorb) {
                  s.soulAbsorbCount++;
                  p.maxHp += 5;
                  p.hp = Math.min(p.hp + 5, p.maxHp);
                }
              }
            }
          }
        }
      }

      // Frozen Time
      if (s.frozenTime) {
        if (s.frozenTimeTimer > 0) {
          s.frozenTimeTimer--;
        } else {
          s.frozenTimeCd++;
          if (s.frozenTimeCd >= 600) {
            s.frozenTimeCd = 0;
            s.frozenTimeTimer = 180;
            spawnParticles(p.pos, "#88eeff", 20, 6);
          }
        }
      }

      // Black Hole
      if (s.blackHole) {
        s.blackHoleCd++;
        if (s.blackHoleCd >= 480) {
          s.blackHoleCd = 0;
          for (const e of s.enemies) {
            if (!e.dead) {
              // Pull toward center
              const dir = norm({ x: W / 2 - e.pos.x, y: H / 2 - e.pos.y });
              e.pos.x += dir.x * 80;
              e.pos.y += dir.y * 80;
              e.hp -= 200;
              spawnParticles(e.pos, "#440066", 8, 4);
              if (e.hp <= 0) {
                e.dead = true;
                const pts =
                  e.type === "tank" ? 30 : e.type === "ranged" ? 20 : 10;
                s.score += s.doubleScore ? pts * 2 : pts;
                if (s.soulAbsorb) {
                  s.soulAbsorbCount++;
                  p.maxHp += 5;
                  p.hp = Math.min(p.hp + 5, p.maxHp);
                }
              }
            }
          }
          spawnParticles({ x: W / 2, y: H / 2 }, "#8800ff", 30, 8);
        }
      }

      // Cursed Rain
      if (s.cursedRain) {
        s.cursedRainCd++;
        if (s.cursedRainCd >= 180) {
          s.cursedRainCd = 0;
          for (let i = 0; i < 20; i++) {
            const rx = Math.random() * W;
            const ry = Math.random() * H;
            const rainPos = { x: rx, y: ry };
            for (const e of s.enemies) {
              if (!e.dead && dist(e.pos, rainPos) < 40) {
                e.hp -= 60;
                spawnParticles(e.pos, "#00ff44", 5, 3);
                if (e.hp <= 0) {
                  e.dead = true;
                  const pts =
                    e.type === "tank" ? 30 : e.type === "ranged" ? 20 : 10;
                  s.score += s.doubleScore ? pts * 2 : pts;
                  if (s.soulAbsorb) {
                    s.soulAbsorbCount++;
                    p.maxHp += 5;
                    p.hp = Math.min(p.hp + 5, p.maxHp);
                  }
                }
              }
            }
            spawnParticles(rainPos, "#00cc44", 3, 2);
          }
        }
      }

      // Cursed Storm
      if (s.cursedStorm) {
        s.cursedStormCd++;
        if (s.cursedStormCd >= 300) {
          s.cursedStormCd = 0;
          for (const e of s.enemies) {
            if (!e.dead) {
              e.hp -= 50;
              // stun for 2s = 120 frames via slow multiplier doesn't have stun, simulate via iframes-like
              spawnParticles(e.pos, "#6600cc", 8, 4);
              if (e.hp <= 0) {
                e.dead = true;
                const pts =
                  e.type === "tank" ? 30 : e.type === "ranged" ? 20 : 10;
                s.score += s.doubleScore ? pts * 2 : pts;
                if (s.soulAbsorb) {
                  s.soulAbsorbCount++;
                  p.maxHp += 5;
                  p.hp = Math.min(p.hp + 5, p.maxHp);
                }
              }
            }
          }
          spawnParticles(p.pos, "#9933ff", 20, 6);
        }
      }

      // Teleport cooldown
      if (s.teleport && s.teleportCd > 0) {
        s.teleportCd--;
      }

      // Orb magnet
      if (s.orbMagnet) {
        for (const orb of s.orbs) {
          if (orb.dead) continue;
          if (dist(orb.pos, p.pos) < 120) {
            const d = norm({ x: p.pos.x - orb.pos.x, y: p.pos.y - orb.pos.y });
            orb.pos.x += d.x * 2.5;
            orb.pos.y += d.y * 2.5;
          }
        }
      }

      // Update enemies
      for (const e of s.enemies) {
        if (e.dead) continue;
        const toPlayer = norm({ x: p.pos.x - e.pos.x, y: p.pos.y - e.pos.y });

        if (e.type === "ranged") {
          const d = dist(e.pos, p.pos);
          const tSlowFactor =
            s.frozenTimeTimer > 0 ? 0 : s.timeSlowTimer > 0 ? 0.2 : 1;
          if (d < 180) {
            e.pos.x -=
              toPlayer.x * e.speed * s.enemySlowMultiplier * tSlowFactor;
            e.pos.y -=
              toPlayer.y * e.speed * s.enemySlowMultiplier * tSlowFactor;
          } else if (d > 220) {
            e.pos.x +=
              toPlayer.x * e.speed * s.enemySlowMultiplier * tSlowFactor;
            e.pos.y +=
              toPlayer.y * e.speed * s.enemySlowMultiplier * tSlowFactor;
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
          const tSlowFactor2 =
            s.frozenTimeTimer > 0 ? 0 : s.timeSlowTimer > 0 ? 0.2 : 1;
          e.pos.x +=
            toPlayer.x * e.speed * s.enemySlowMultiplier * tSlowFactor2;
          e.pos.y +=
            toPlayer.y * e.speed * s.enemySlowMultiplier * tSlowFactor2;
        }

        // Melee damage
        if (
          e.type !== "ranged" &&
          dist(e.pos, p.pos) < e.radius + p.radius &&
          p.iframes === 0
        ) {
          const rawDmg = e.type === "tank" ? 20 : 10;
          let dmg = rawDmg;
          if (s.hasShield && s.shieldHp > 0) {
            const blocked = Math.min(s.shieldHp, dmg);
            s.shieldHp -= blocked;
            dmg -= blocked;
          }
          if (s.dmgReductionPct > 0)
            dmg = Math.round(dmg * (1 - s.dmgReductionPct));
          if (s.spikeAura) {
            e.hp -= 40;
            const kb = norm({ x: e.pos.x - p.pos.x, y: e.pos.y - p.pos.y });
            e.pos.x += kb.x * 60;
            e.pos.y += kb.y * 60;
            spawnParticles(e.pos, "#00ff88", 8, 4);
            if (e.hp <= 0) {
              e.dead = true;
              const spts = e.type === "tank" ? 30 : 10;
              s.score += s.doubleScore ? spts * 2 : spts;
              if (s.vampiricStrike) p.hp = Math.min(p.maxHp, p.hp + 20);
            }
          }
          // Thorns reflect
          if (s.thorns && s.thornsDmg > 0) {
            e.hp -= Math.round(rawDmg * s.thornsDmg);
            spawnParticles(e.pos, "#00ff88", 6, 3);
            if (e.hp <= 0) {
              e.dead = true;
              const tpts = e.type === "tank" ? 30 : 10;
              s.score += s.doubleScore ? tpts * 2 : tpts;
              if (s.soulAbsorb) {
                p.maxHp += 5;
                p.hp = Math.min(p.hp + 5, p.maxHp);
              }
            }
          }
          p.hp -= dmg;
          p.iframes = 45 + s.iframeBonus;
          spawnParticles(p.pos, "#ff4444", 6, 3);
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

        // Homing shots
        if (proj.fromPlayer && s.homingShots && !proj.isHollowPurple) {
          let nearestEnemy: (typeof s.enemies)[0] | null = null;
          let nearD = Number.POSITIVE_INFINITY;
          for (const e of s.enemies) {
            if (e.dead) continue;
            const d = dist(proj.pos, e.pos);
            if (d < nearD && d < 200) {
              nearD = d;
              nearestEnemy = e;
            }
          }
          if (nearestEnemy) {
            const td = norm({
              x: nearestEnemy.pos.x - proj.pos.x,
              y: nearestEnemy.pos.y - proj.pos.y,
            });
            proj.vel.x = lerp(proj.vel.x, td.x * 8, 0.12);
            proj.vel.y = lerp(proj.vel.y, td.y * 8, 0.12);
          }
        }
        // Ricochet off walls
        if (s.ricochets && proj.fromPlayer) {
          const bounces = (proj as any).bounceCount || 0;
          if (proj.pos.x < 0) {
            proj.pos.x = 0;
            proj.vel.x = Math.abs(proj.vel.x);
            (proj as any).bounceCount = bounces + 1;
          }
          if (proj.pos.x > W) {
            proj.pos.x = W;
            proj.vel.x = -Math.abs(proj.vel.x);
            (proj as any).bounceCount = bounces + 1;
          }
          if (proj.pos.y < 0) {
            proj.pos.y = 0;
            proj.vel.y = Math.abs(proj.vel.y);
            (proj as any).bounceCount = bounces + 1;
          }
          if (proj.pos.y > H) {
            proj.pos.y = H;
            proj.vel.y = -Math.abs(proj.vel.y);
            (proj as any).bounceCount = bounces + 1;
          }
          if ((proj as any).bounceCount >= 5) {
            proj.dead = true;
            continue;
          }
        } else if (
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
              if (!proj.piercing) proj.dead = true;
              let dmg = (20 + s.wave * 2) * s.dmgMultiplier;

              // Explosive shots AoE
              if (s.explosiveShots) {
                for (const ae of s.enemies) {
                  if (ae.dead || ae === e) continue;
                  if (dist(proj.pos, ae.pos) < 60) {
                    ae.hp -= dmg * 3;
                    spawnParticles(ae.pos, "#ff8800", 6, 3);
                    if (ae.hp <= 0) {
                      ae.dead = true;
                      const epts =
                        ae.type === "tank"
                          ? 30
                          : ae.type === "ranged"
                            ? 20
                            : 10;
                      s.score += s.doubleScore ? epts * 2 : epts;
                      if (s.vampiricStrike) p.hp = Math.min(p.maxHp, p.hp + 20);
                    }
                  }
                }
                spawnParticles(proj.pos, "#ff6600", 10, 5);
              }

              // Hollow Purple AoE
              if (proj.isHollowPurple) {
                dmg *= 5;
                // Hit all enemies within 50px
                for (const ae of s.enemies) {
                  if (ae.dead) continue;
                  if (dist(proj.pos, ae.pos) < 50) {
                    ae.hp -= dmg;
                    spawnParticles(ae.pos, "#cc44ff", 8, 4);
                    if (ae.hp <= 0) {
                      ae.dead = true;
                      s.score +=
                        ae.type === "tank"
                          ? 30
                          : ae.type === "ranged"
                            ? 20
                            : 10;
                      spawnParticles(ae.pos, "#aa44ff", 12, 5);
                      if (s.healOnHit) {
                        p.hp = Math.min(p.maxHp, p.hp + 8);
                      }
                    }
                  }
                }
                proj.dead = true;
                break;
              }

              // Black Flash / Ultra Black Flash
              if (s.ultraBlackFlash && Math.random() < 0.75) {
                dmg *= 10;
                spawnParticles(e.pos, "#000000", 12, 6);
                spawnParticles(e.pos, "#ffffff", 8, 8);
              } else if (
                s.blackFlashChance > 0 &&
                Math.random() < s.blackFlashChance
              ) {
                dmg *= 3;
                spawnParticles(e.pos, "#222244", 8, 4);
                spawnParticles(e.pos, "#8888ff", 5, 6);
              }
              e.hp -= dmg;
              spawnParticles(e.pos, typeColor(e.type), 5, 2.5);

              // Knockback shots
              if (s.knockbackShots && !e.dead) {
                const kb = norm({
                  x: e.pos.x - proj.pos.x,
                  y: e.pos.y - proj.pos.y,
                });
                e.pos.x = Math.max(
                  e.radius,
                  Math.min(W - e.radius, e.pos.x + kb.x * 20),
                );
                e.pos.y = Math.max(
                  e.radius,
                  Math.min(H - e.radius, e.pos.y + kb.y * 20),
                );
              }

              if (e.hp <= 0) {
                e.dead = true;
                const kPts =
                  e.type === "tank" ? 30 : e.type === "ranged" ? 20 : 10;
                s.score += s.doubleScore ? kPts * 2 : kPts;
                spawnParticles(e.pos, typeColor(e.type), 12, 4);
                // Soul Absorb
                if (s.soulAbsorb) {
                  s.soulAbsorbCount++;
                  p.maxHp += 5;
                  p.hp = Math.min(p.hp + 5, p.maxHp);
                }
                // Death Burst
                if (s.deathBurst) {
                  const br = s.deathBurstRadius;
                  for (const de of s.enemies) {
                    if (!de.dead && dist(de.pos, e.pos) < br) {
                      de.hp -= 150;
                      spawnParticles(de.pos, "#ff4400", 8, 4);
                      if (de.hp <= 0) {
                        de.dead = true;
                        const dPts =
                          de.type === "tank"
                            ? 30
                            : de.type === "ranged"
                              ? 20
                              : 10;
                        s.score += s.doubleScore ? dPts * 2 : dPts;
                        if (s.soulAbsorb) {
                          p.maxHp += 5;
                          p.hp = Math.min(p.hp + 5, p.maxHp);
                        }
                      }
                    }
                  }
                  spawnParticles(e.pos, "#ff6600", 20, 6);
                }
                // Heal on kill
                if (s.healOnHit) {
                  p.hp = Math.min(p.maxHp, p.hp + 8);
                }
                // AoE on kill
                if (s.aoeOnKill) {
                  for (const ne of s.enemies) {
                    if (ne.dead || ne.id === e.id) continue;
                    if (dist(ne.pos, e.pos) < 60) {
                      ne.hp -= 25;
                      spawnParticles(ne.pos, "#ff6600", 4, 3);
                      if (ne.hp <= 0) {
                        ne.dead = true;
                        s.score +=
                          ne.type === "tank"
                            ? 30
                            : ne.type === "ranged"
                              ? 20
                              : 10;
                        if (s.healOnHit) {
                          p.hp = Math.min(p.maxHp, p.hp + 8);
                        }
                      }
                    }
                  }
                }
                if (Math.random() < 0.4) {
                  s.orbs.push({
                    id: s.nextId++,
                    pos: { x: e.pos.x, y: e.pos.y },
                    dead: false,
                  });
                }
              }
              if (proj.piercing) continue;
              break;
            }
          }
        } else {
          if (
            dist(proj.pos, p.pos) < proj.radius + p.radius &&
            p.iframes === 0
          ) {
            proj.dead = true;
            let rdmg = 12;
            if (s.hasShield && s.shieldHp > 0) {
              const rblocked = Math.min(s.shieldHp, rdmg);
              s.shieldHp -= rblocked;
              rdmg -= rblocked;
            }
            if (s.dmgReductionPct > 0)
              rdmg = Math.round(rdmg * (1 - s.dmgReductionPct));
            p.hp -= rdmg;
            p.iframes = 30 + s.iframeBonus;
            spawnParticles(p.pos, "#ff4444", 6, 3);
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
          s.score += s.doubleScore ? 10 : 5;
          if (s.superOrb) {
            p.hp = Math.min(p.maxHp, p.hp + 50);
            s.dmgMultiplier += 0.1;
            spawnParticles(p.pos, "#ffdd44", 10, 4);
          }
          if (s.orbBombActive) {
            for (const e of s.enemies) {
              if (e.dead) continue;
              if (dist(orb.pos, e.pos) < 100) {
                e.hp -= 80;
                spawnParticles(e.pos, "#ffdd00", 8, 4);
                if (e.hp <= 0) {
                  e.dead = true;
                  const opts =
                    e.type === "tank" ? 30 : e.type === "ranged" ? 20 : 10;
                  s.score += s.doubleScore ? opts * 2 : opts;
                  if (s.vampiricStrike) p.hp = Math.min(p.maxHp, p.hp + 20);
                }
              }
            }
            spawnParticles(orb.pos, "#ffdd00", 15, 6);
          }
          spawnParticles(orb.pos, "#4499ff", 8, 2);
          // Reverse Cursed Technique healing
          if (s.pickedAbilities.includes("reverse_cursed")) {
            p.hp = Math.min(p.maxHp, p.hp + 30);
          }
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
      s.projectiles = s.projectiles.filter((pr) => !pr.dead);
      s.orbs = s.orbs.filter((o) => !o.dead);
      s.particles = s.particles.filter((pt) => pt.life > 0);
      s.enemies = s.enemies.filter((en) => {
        if (en.dead && !s.particles.some((pt) => dist(pt.pos, en.pos) < 1))
          return false;
        return true;
      });

      const alive = s.enemies.filter((en) => !en.dead);
      s.enemiesLeft = alive.length;

      if (alive.length === 0 && s.status === "playing") {
        s.status = "wave_clear";
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
        pickedAbilities: s.pickedAbilities,
      });
      animRef.current = requestAnimationFrame(tick);
    }

    function typeColor(type: Enemy["type"]) {
      switch (type) {
        case "fast":
          return "#22cc66";
        case "tank":
          return "#ff9933";
        case "ranged":
          return "#aa44ff";
        default:
          return "#ff4422";
      }
    }

    function drawFrame() {
      if (!ctx) return;
      const s = stateRef.current;
      const p = s.player;
      const now = Date.now();

      // --- Init background on first call ---
      if (bgParticlesRef.current.length === 0) {
        for (let i = 0; i < 50; i++) {
          bgParticlesRef.current.push({
            x: Math.random() * W,
            y: Math.random() * H,
            vx: (Math.random() - 0.5) * 0.25,
            vy: (Math.random() - 0.5) * 0.25,
            r: 15 + Math.random() * 50,
            alpha: 0.02 + Math.random() * 0.06,
            hue: 230 + Math.random() * 70,
          });
        }
        const kanjiChars = [
          "呪",
          "術",
          "廻",
          "戦",
          "霊",
          "域",
          "展",
          "開",
          "滅",
          "禍",
          "憎",
          "怨",
          "嘆",
          "苦",
        ];
        for (let i = 0; i < 14; i++) {
          bgKanjiRef.current.push({
            x: Math.random() * W,
            y: Math.random() * H,
            vx: (Math.random() - 0.5) * 0.12,
            vy: (Math.random() - 0.5) * 0.12,
            char: kanjiChars[i % kanjiChars.length],
            alpha: 0.04 + Math.random() * 0.06,
          });
        }
      }

      // Drift bg particles
      for (const bp of bgParticlesRef.current) {
        bp.x += bp.vx;
        bp.y += bp.vy;
        if (bp.x < -bp.r) bp.x = W + bp.r;
        if (bp.x > W + bp.r) bp.x = -bp.r;
        if (bp.y < -bp.r) bp.y = H + bp.r;
        if (bp.y > H + bp.r) bp.y = -bp.r;
      }
      for (const bk of bgKanjiRef.current) {
        bk.x += bk.vx;
        bk.y += bk.vy;
        if (bk.x < -60) bk.x = W + 60;
        if (bk.x > W + 60) bk.x = -60;
        if (bk.y < -60) bk.y = H + 60;
        if (bk.y > H + 60) bk.y = -60;
      }

      // ========================
      // BACKGROUND
      // ========================
      ctx.fillStyle = "#020208";
      ctx.fillRect(0, 0, W, H);

      // Hex grid floor
      const hexSize = 28;
      const hexH = hexSize * Math.sqrt(3);
      const hexW = hexSize * 2;
      const gridPulse = Math.sin(now * 0.0008) * 0.5 + 0.5;
      ctx.save();
      for (let row = -1; row < Math.ceil(H / hexH) + 1; row++) {
        for (let col = -1; col < Math.ceil((W / hexW) * 1.5) + 1; col++) {
          const offsetX = (row % 2) * hexSize * 1.5;
          const cx2 = col * hexSize * 3 + offsetX;
          const cy2 = row * hexH;
          const distFromCenter = Math.sqrt(
            (cx2 - W / 2) ** 2 + (cy2 - H / 2) ** 2,
          );
          const maxDist = Math.sqrt((W / 2) ** 2 + (H / 2) ** 2);
          const closeness = 1 - distFromCenter / maxDist;
          const alpha = 0.04 + closeness * 0.08 * gridPulse;
          ctx.globalAlpha = alpha;
          ctx.strokeStyle = `hsl(${240 + closeness * 50}, 80%, 60%)`;
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          for (let i2 = 0; i2 < 6; i2++) {
            const angle2 = (i2 / 6) * Math.PI * 2 + Math.PI / 6;
            const vx2 = cx2 + Math.cos(angle2) * hexSize * 0.85;
            const vy2 = cy2 + Math.sin(angle2) * hexSize * 0.85;
            if (i2 === 0) ctx.moveTo(vx2, vy2);
            else ctx.lineTo(vx2, vy2);
          }
          ctx.closePath();
          ctx.stroke();
          // Node dots at vertices
          if (closeness > 0.5 && Math.random() < 0.01) {
            ctx.globalAlpha = closeness * 0.4 * gridPulse;
            ctx.fillStyle = "#4488ff";
            ctx.beginPath();
            ctx.arc(cx2, cy2, 1.5, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
      ctx.globalAlpha = 1;
      ctx.restore();

      // Mist smoke
      for (const bp of bgParticlesRef.current) {
        const grad = ctx.createRadialGradient(bp.x, bp.y, 0, bp.x, bp.y, bp.r);
        grad.addColorStop(0, `hsla(${bp.hue},75%,35%,${bp.alpha * 1.2})`);
        grad.addColorStop(1, "transparent");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(bp.x, bp.y, bp.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // Floating kanji - larger and more ethereal
      for (const bk of bgKanjiRef.current) {
        ctx.save();
        ctx.globalAlpha = bk.alpha;
        ctx.font = `bold ${40 + Math.sin(now * 0.0005 + bk.x) * 6}px serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "#9966ff";
        ctx.shadowBlur = 12;
        ctx.shadowColor = "#6633cc";
        ctx.fillText(bk.char, bk.x, bk.y);
        ctx.restore();
      }

      // Arena center subtle glow
      const centerGlow = ctx.createRadialGradient(
        W / 2,
        H / 2,
        0,
        W / 2,
        H / 2,
        200,
      );
      centerGlow.addColorStop(0, `rgba(40,20,80,${0.08 + gridPulse * 0.06})`);
      centerGlow.addColorStop(1, "transparent");
      ctx.fillStyle = centerGlow;
      ctx.fillRect(0, 0, W, H);

      // Domain boundary vignette (deep)
      const vignette = ctx.createRadialGradient(
        W / 2,
        H / 2,
        Math.min(W, H) * 0.22,
        W / 2,
        H / 2,
        Math.max(W, H) * 0.88,
      );
      vignette.addColorStop(0, "transparent");
      vignette.addColorStop(1, "rgba(5,0,20,0.80)");
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, W, H);

      // Domain pulse ring (Malevolent Shrine)
      if (s.hasDomain) {
        const progress = 1 - s.domainCd / 300;
        const pulseRadius = 15 + progress * (Math.min(W, H) * 0.82);
        ctx.save();
        ctx.globalAlpha = 0.18 * (1 - progress);
        ctx.shadowBlur = 20;
        ctx.shadowColor = "#aa44ff";
        ctx.strokeStyle = "#cc66ff";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(p.pos.x, p.pos.y, pulseRadius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // Arena border - multi-layer neon glow
      for (let i = 3; i >= 1; i--) {
        ctx.globalAlpha = 0.15 + (4 - i) * 0.1;
        ctx.strokeStyle = i === 1 ? "#88aaff" : "#4466ff";
        ctx.lineWidth = i;
        ctx.shadowBlur = 8 * i;
        ctx.shadowColor = "#3355ff";
        ctx.strokeRect(3, 3, W - 6, H - 6);
      }
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;

      // ========================
      // PARTICLES
      // ========================
      for (const part of s.particles) {
        const alpha = part.life / part.maxLife;
        ctx.save();
        ctx.globalAlpha = alpha * 0.9;
        const ps = part.size * (0.5 + alpha * 0.5) + 1;
        const pg = ctx.createRadialGradient(
          part.pos.x,
          part.pos.y,
          0,
          part.pos.x,
          part.pos.y,
          ps,
        );
        pg.addColorStop(0, "#ffffff");
        pg.addColorStop(0.3, part.color);
        pg.addColorStop(1, "transparent");
        ctx.fillStyle = pg;
        ctx.beginPath();
        ctx.arc(part.pos.x, part.pos.y, ps, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      ctx.globalAlpha = 1;

      // ========================
      // ORBS — faceted crystal gems
      // ========================
      for (const orb of s.orbs) {
        if (orb.dead) continue;
        const t = now * 0.002;
        ctx.save();
        ctx.translate(orb.pos.x, orb.pos.y);

        // Outer glow halo
        ctx.shadowBlur = 22;
        ctx.shadowColor = "#3399ff";
        const halo = ctx.createRadialGradient(0, 0, 4, 0, 0, 18);
        halo.addColorStop(0, "rgba(100,180,255,0.15)");
        halo.addColorStop(1, "transparent");
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(0, 0, 18, 0, Math.PI * 2);
        ctx.fill();

        // Crystal gem body (diamond shape)
        ctx.rotate(t * 0.8);
        const gemGrad = ctx.createRadialGradient(-2, -3, 0, 0, 0, 11);
        gemGrad.addColorStop(0, "#ddeeff");
        gemGrad.addColorStop(0.35, "#66bbff");
        gemGrad.addColorStop(0.7, "#1155dd");
        gemGrad.addColorStop(1, "#003399");
        ctx.fillStyle = gemGrad;
        ctx.beginPath();
        ctx.moveTo(0, -12);
        ctx.lineTo(9, -3);
        ctx.lineTo(9, 4);
        ctx.lineTo(0, 11);
        ctx.lineTo(-9, 4);
        ctx.lineTo(-9, -3);
        ctx.closePath();
        ctx.fill();

        // Facet highlight
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = "rgba(255,255,255,0.6)";
        ctx.beginPath();
        ctx.moveTo(0, -12);
        ctx.lineTo(9, -3);
        ctx.lineTo(2, -2);
        ctx.closePath();
        ctx.fill();

        // 3 orbiting micro-sparks
        for (let i = 0; i < 3; i++) {
          const sa = t * 2.5 + (i * Math.PI * 2) / 3;
          ctx.globalAlpha = 0.85;
          ctx.fillStyle = i % 2 === 0 ? "#88ddff" : "#ffffff";
          ctx.shadowBlur = 5;
          ctx.shadowColor = "#4499ff";
          ctx.beginPath();
          ctx.arc(Math.cos(sa) * 17, Math.sin(sa) * 17, 2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
        ctx.restore();
      }

      // ========================
      // ENEMY PROJECTILES
      // ========================
      for (const proj of s.projectiles) {
        if (proj.dead || proj.fromPlayer) continue;
        const angle = Math.atan2(proj.vel.y, proj.vel.x);
        ctx.save();
        ctx.translate(proj.pos.x, proj.pos.y);
        ctx.rotate(angle);

        // Trail
        ctx.globalAlpha = 0.25;
        const trailGrad = ctx.createLinearGradient(-proj.radius * 3.5, 0, 0, 0);
        trailGrad.addColorStop(0, "transparent");
        trailGrad.addColorStop(1, "#880066");
        ctx.fillStyle = trailGrad;
        ctx.beginPath();
        ctx.ellipse(
          -proj.radius * 1.5,
          0,
          proj.radius * 3,
          proj.radius * 0.5,
          0,
          0,
          Math.PI * 2,
        );
        ctx.fill();

        // Core bolt
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 14;
        ctx.shadowColor = "#cc44ff";
        const epg = ctx.createRadialGradient(0, 0, 0, 0, 0, proj.radius * 1.8);
        epg.addColorStop(0, "#ffbbff");
        epg.addColorStop(0.4, "#dd44ff");
        epg.addColorStop(1, "#440088");
        ctx.fillStyle = epg;
        ctx.beginPath();
        ctx.ellipse(0, 0, proj.radius * 2.2, proj.radius, 0, 0, Math.PI * 2);
        ctx.fill();

        // Bright core tip
        ctx.fillStyle = "#ffffff";
        ctx.shadowBlur = 8;
        ctx.shadowColor = "#ff88ff";
        ctx.beginPath();
        ctx.arc(proj.radius * 0.6, 0, proj.radius * 0.35, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
      }

      // ========================
      // PLAYER PROJECTILES
      // ========================
      for (const proj of s.projectiles) {
        if (proj.dead || !proj.fromPlayer) continue;

        if (proj.isHollowPurple) {
          // Massive hollow purple orb
          ctx.save();
          const t2 = now * 0.003;

          // Outer shockwave rings
          for (let ring = 3; ring >= 1; ring--) {
            ctx.globalAlpha = 0.08 * (4 - ring);
            ctx.strokeStyle = ring === 1 ? "#ff88ff" : "#aa44ff";
            ctx.lineWidth = 2;
            ctx.shadowBlur = 10;
            ctx.shadowColor = "#cc44ff";
            ctx.beginPath();
            ctx.arc(
              proj.pos.x,
              proj.pos.y,
              proj.radius * (1 + ring * 0.55),
              0,
              Math.PI * 2,
            );
            ctx.stroke();
          }

          // Core body
          ctx.globalAlpha = 1;
          ctx.shadowBlur = 50;
          ctx.shadowColor = "#9900ff";
          const hpGrad2 = ctx.createRadialGradient(
            proj.pos.x - 4,
            proj.pos.y - 4,
            0,
            proj.pos.x,
            proj.pos.y,
            proj.radius,
          );
          hpGrad2.addColorStop(0, "#ffffff");
          hpGrad2.addColorStop(0.2, "#ffbbff");
          hpGrad2.addColorStop(0.55, "#cc44ff");
          hpGrad2.addColorStop(1, "#440077");
          ctx.fillStyle = hpGrad2;
          ctx.beginPath();
          ctx.arc(proj.pos.x, proj.pos.y, proj.radius, 0, Math.PI * 2);
          ctx.fill();

          // Rotating energy wisps
          for (let i = 0; i < 6; i++) {
            const wispAngle = t2 * 2 + (i / 6) * Math.PI * 2;
            const wx = proj.pos.x + Math.cos(wispAngle) * proj.radius * 0.7;
            const wy = proj.pos.y + Math.sin(wispAngle) * proj.radius * 0.7;
            ctx.globalAlpha = 0.6;
            ctx.fillStyle = i % 2 === 0 ? "#ffffff" : "#cc88ff";
            ctx.beginPath();
            ctx.arc(wx, wy, 3, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.globalAlpha = 1;
          ctx.shadowBlur = 0;
          ctx.restore();
        } else {
          // Normal bolt
          const angle = Math.atan2(proj.vel.y, proj.vel.x);
          ctx.save();
          ctx.translate(proj.pos.x, proj.pos.y);
          ctx.rotate(angle);

          // Extended tail trail
          ctx.globalAlpha = 0.35;
          const tailColor = proj.piercing ? "#ff0055" : "#0044ff";
          const tailGrad = ctx.createLinearGradient(-proj.radius * 5, 0, 0, 0);
          tailGrad.addColorStop(0, "transparent");
          tailGrad.addColorStop(1, tailColor);
          ctx.fillStyle = tailGrad;
          ctx.beginPath();
          ctx.ellipse(
            -proj.radius * 2,
            0,
            proj.radius * 4.5,
            proj.radius * 0.6,
            0,
            0,
            Math.PI * 2,
          );
          ctx.fill();

          // Core bolt
          ctx.globalAlpha = 1;
          ctx.shadowBlur = 22;
          ctx.shadowColor = proj.piercing ? "#ff4488" : "#4499ff";
          const boltGrad = ctx.createRadialGradient(
            proj.radius * 0.3,
            0,
            0,
            0,
            0,
            proj.radius * 2,
          );
          boltGrad.addColorStop(0, "#ffffff");
          boltGrad.addColorStop(0.2, proj.piercing ? "#ffaacc" : "#aaddff");
          boltGrad.addColorStop(0.6, proj.piercing ? "#ff2266" : "#1166ff");
          boltGrad.addColorStop(1, proj.piercing ? "#880033" : "#002299");
          ctx.fillStyle = boltGrad;
          ctx.beginPath();
          ctx.ellipse(0, 0, proj.radius * 2.8, proj.radius, 0, 0, Math.PI * 2);
          ctx.fill();

          // Bright nose
          ctx.fillStyle = "#ffffff";
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.arc(proj.radius * 1.2, 0, proj.radius * 0.4, 0, Math.PI * 2);
          ctx.fill();

          ctx.restore();
          ctx.globalAlpha = 1;
          ctx.shadowBlur = 0;
        }
      }

      // ========================
      // ENEMIES
      // ========================
      for (const e of s.enemies) {
        if (e.dead) continue;
        const color = typeColor(e.type);
        ctx.save();
        ctx.translate(e.pos.x, e.pos.y);

        if (e.type === "grunt") {
          // ---- GRUNT: Demonic cursed spirit with horns ----
          ctx.rotate(now * 0.0006);

          // Shadow aura
          ctx.shadowBlur = 28;
          ctx.shadowColor = "#ff3300";

          // Body
          const gGrad = ctx.createRadialGradient(-2, -3, 0, 0, 0, e.radius);
          gGrad.addColorStop(0, "#ff9966");
          gGrad.addColorStop(0.5, "#dd2200");
          gGrad.addColorStop(1, "#440000");
          ctx.fillStyle = gGrad;
          ctx.beginPath();
          ctx.arc(0, 0, e.radius, 0, Math.PI * 2);
          ctx.fill();

          // Cracked energy lines on body
          ctx.globalAlpha = 0.4;
          ctx.strokeStyle = "#ff6600";
          ctx.lineWidth = 1;
          for (let i = 0; i < 4; i++) {
            const ca = (i / 4) * Math.PI * 2 + now * 0.001;
            ctx.beginPath();
            ctx.moveTo(Math.cos(ca) * 2, Math.sin(ca) * 2);
            ctx.lineTo(
              Math.cos(ca) * (e.radius * 0.75),
              Math.sin(ca) * (e.radius * 0.75),
            );
            ctx.stroke();
          }
          ctx.globalAlpha = 1;

          // Horns (2 curved horns)
          ctx.fillStyle = "#cc3300";
          ctx.strokeStyle = "#ff5500";
          ctx.lineWidth = 1.5;
          for (let side = -1; side <= 1; side += 2) {
            ctx.beginPath();
            ctx.moveTo(side * e.radius * 0.4, -e.radius * 0.65);
            ctx.bezierCurveTo(
              side * e.radius * 0.6,
              -e.radius * 1.1,
              side * e.radius * 0.85,
              -e.radius * 1.35,
              side * e.radius * 0.55,
              -e.radius * 1.55,
            );
            ctx.lineWidth = 3;
            ctx.strokeStyle = "#aa2200";
            ctx.stroke();
            ctx.lineWidth = 1.5;
            ctx.strokeStyle = "#ff4400";
            ctx.stroke();
          }

          // Glowing cursed eyes
          for (let side = -1; side <= 1; side += 2) {
            const eyeX = side * e.radius * 0.32;
            const eyeY = -e.radius * 0.2;
            // Sclera
            ctx.fillStyle = "#ffcc88";
            ctx.shadowBlur = 8;
            ctx.shadowColor = "#ff4400";
            ctx.beginPath();
            ctx.ellipse(
              eyeX,
              eyeY,
              e.radius * 0.22,
              e.radius * 0.17,
              0,
              0,
              Math.PI * 2,
            );
            ctx.fill();
            // Slit pupil
            ctx.fillStyle = "#000000";
            ctx.beginPath();
            ctx.ellipse(
              eyeX,
              eyeY,
              e.radius * 0.07,
              e.radius * 0.15,
              0,
              0,
              Math.PI * 2,
            );
            ctx.fill();
            // Glow overlay
            ctx.globalAlpha = 0.5;
            ctx.fillStyle = "#ff4400";
            ctx.beginPath();
            ctx.ellipse(
              eyeX,
              eyeY,
              e.radius * 0.04,
              e.radius * 0.12,
              0,
              0,
              Math.PI * 2,
            );
            ctx.fill();
            ctx.globalAlpha = 1;
          }

          // Fangs (bottom)
          ctx.fillStyle = "#ffeecc";
          for (let fi = -1; fi <= 1; fi += 2) {
            ctx.beginPath();
            ctx.moveTo(fi * e.radius * 0.15, e.radius * 0.35);
            ctx.lineTo(fi * e.radius * 0.28, e.radius * 0.62);
            ctx.lineTo(fi * e.radius * 0.05, e.radius * 0.42);
            ctx.closePath();
            ctx.fill();
          }
        } else if (e.type === "fast") {
          // ---- FAST: Ghost specter with motion blur trail ----
          const toPlayer = norm({ x: p.pos.x - e.pos.x, y: p.pos.y - e.pos.y });
          const moveAngle = Math.atan2(toPlayer.y, toPlayer.x);
          ctx.rotate(moveAngle);

          // Draw trail
          const trail = fastTrailsRef.current.get(e.id) || [];
          for (let i = 0; i < trail.length; i++) {
            const t3 = trail[i];
            const ta = (i / trail.length) * 0.3;
            // translate back to world space for trail
            ctx.save();
            ctx.resetTransform();
            ctx.globalAlpha = ta;
            ctx.fillStyle = "#00ff66";
            ctx.shadowBlur = 6;
            ctx.shadowColor = "#22cc66";
            ctx.beginPath();
            ctx.ellipse(
              t3.x,
              t3.y,
              e.radius * 0.8 * (i / trail.length),
              e.radius * 0.35 * (i / trail.length),
              moveAngle,
              0,
              Math.PI * 2,
            );
            ctx.fill();
            ctx.restore();
          }

          // Shadow aura
          ctx.shadowBlur = 22;
          ctx.shadowColor = "#22cc66";

          // Specter body (elongated teardrop pointing forward)
          const fGrad = ctx.createRadialGradient(
            e.radius * 0.3,
            0,
            0,
            0,
            0,
            e.radius * 1.5,
          );
          fGrad.addColorStop(0, "#ccffdd");
          fGrad.addColorStop(0.3, "#44ff88");
          fGrad.addColorStop(0.7, "#22cc44");
          fGrad.addColorStop(1, "transparent");
          ctx.fillStyle = fGrad;
          ctx.beginPath();
          ctx.moveTo(e.radius * 1.7, 0);
          ctx.bezierCurveTo(
            e.radius * 1.2,
            -e.radius * 0.65,
            -e.radius * 0.8,
            -e.radius * 0.55,
            -e.radius * 1.2,
            0,
          );
          ctx.bezierCurveTo(
            -e.radius * 0.8,
            e.radius * 0.55,
            e.radius * 1.2,
            e.radius * 0.65,
            e.radius * 1.7,
            0,
          );
          ctx.closePath();
          ctx.fill();

          // Inner core highlight
          ctx.globalAlpha = 0.7;
          ctx.fillStyle = "#aaffcc";
          ctx.beginPath();
          ctx.ellipse(
            e.radius * 0.3,
            0,
            e.radius * 0.45,
            e.radius * 0.28,
            0,
            0,
            Math.PI * 2,
          );
          ctx.fill();

          // Single piercing eye
          ctx.globalAlpha = 1;
          ctx.fillStyle = "#ffffff";
          ctx.shadowBlur = 12;
          ctx.shadowColor = "#00ff88";
          ctx.beginPath();
          ctx.arc(e.radius * 0.65, 0, e.radius * 0.22, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#003322";
          ctx.beginPath();
          ctx.arc(e.radius * 0.7, 0, e.radius * 0.11, 0, Math.PI * 2);
          ctx.fill();
        } else if (e.type === "tank") {
          // ---- TANK: Armored heavy cursed spirit ----
          ctx.rotate(now * 0.0005);
          ctx.shadowBlur = 30;
          ctx.shadowColor = "#ff6600";

          // Outer spiky carapace
          ctx.strokeStyle = "#ff4400";
          ctx.lineWidth = 2.5;
          for (let i = 0; i < 10; i++) {
            const a = (i / 10) * Math.PI * 2;
            const innerR = e.radius * 0.92;
            const outerR = e.radius * 1.38 + Math.sin(now * 0.003 + i) * 3;
            ctx.globalAlpha = 0.7;
            ctx.beginPath();
            ctx.moveTo(Math.cos(a) * innerR, Math.sin(a) * innerR);
            ctx.lineTo(Math.cos(a) * outerR, Math.sin(a) * outerR);
            ctx.stroke();
          }
          ctx.globalAlpha = 1;

          // Armor plate outer ring
          ctx.strokeStyle = "#ff8833";
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(0, 0, e.radius, 0, Math.PI * 2);
          ctx.stroke();

          // Body - layered armor segments
          const tGrad = ctx.createRadialGradient(-4, -5, 0, 0, 0, e.radius);
          tGrad.addColorStop(0, "#ff7744");
          tGrad.addColorStop(0.35, "#dd3300");
          tGrad.addColorStop(0.7, "#881100");
          tGrad.addColorStop(1, "#220000");
          ctx.fillStyle = tGrad;
          ctx.beginPath();
          for (let i = 0; i < 10; i++) {
            const a = (i / 10) * Math.PI * 2 - Math.PI / 10;
            if (i === 0)
              ctx.moveTo(Math.cos(a) * e.radius, Math.sin(a) * e.radius);
            else ctx.lineTo(Math.cos(a) * e.radius, Math.sin(a) * e.radius);
          }
          ctx.closePath();
          ctx.fill();

          // Armor rivet lines
          ctx.globalAlpha = 0.4;
          ctx.strokeStyle = "#ff5500";
          ctx.lineWidth = 1;
          for (let i = 0; i < 5; i++) {
            const a = (i / 5) * Math.PI * 2;
            ctx.beginPath();
            ctx.moveTo(
              Math.cos(a) * e.radius * 0.4,
              Math.sin(a) * e.radius * 0.4,
            );
            ctx.lineTo(
              Math.cos(a) * e.radius * 0.85,
              Math.sin(a) * e.radius * 0.85,
            );
            ctx.stroke();
          }
          ctx.globalAlpha = 1;

          // Cracked energy eye in center
          const eyePulse = Math.sin(now * 0.005) * 0.5 + 0.5;
          ctx.fillStyle = `rgba(255, ${80 + eyePulse * 120}, 0, 1)`;
          ctx.shadowBlur = 15 + eyePulse * 15;
          ctx.shadowColor = "#ff4400";
          ctx.beginPath();
          ctx.arc(0, 0, e.radius * 0.28, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#ffcc00";
          ctx.beginPath();
          ctx.arc(0, 0, e.radius * 0.12, 0, Math.PI * 2);
          ctx.fill();
        } else if (e.type === "ranged") {
          // ---- RANGED: Multi-eye cursed spirit with tentacles ----
          ctx.shadowBlur = 20;
          ctx.shadowColor = "#aa44ff";

          // Tentacle arms (4 twisting)
          ctx.globalAlpha = 0.5;
          ctx.strokeStyle = "#7722cc";
          ctx.lineWidth = 2;
          for (let i = 0; i < 4; i++) {
            const baseA = (i / 4) * Math.PI * 2 + now * 0.001;
            ctx.beginPath();
            ctx.moveTo(
              Math.cos(baseA) * e.radius * 0.8,
              Math.sin(baseA) * e.radius * 0.8,
            );
            const midX = Math.cos(baseA + 0.5) * e.radius * 1.5;
            const midY = Math.sin(baseA + 0.5) * e.radius * 1.5;
            const endX = Math.cos(baseA + 0.9) * e.radius * 2.1;
            const endY = Math.sin(baseA + 0.9) * e.radius * 2.1;
            ctx.bezierCurveTo(
              Math.cos(baseA + 0.3) * e.radius * 1.2,
              Math.sin(baseA + 0.3) * e.radius * 1.2,
              midX,
              midY,
              endX,
              endY,
            );
            ctx.stroke();
          }
          ctx.globalAlpha = 1;

          // Main body orb
          const rGrad = ctx.createRadialGradient(-3, -3, 0, 0, 0, e.radius);
          rGrad.addColorStop(0, "#ddaaff");
          rGrad.addColorStop(0.4, "#8833dd");
          rGrad.addColorStop(0.8, "#440088");
          rGrad.addColorStop(1, "#110022");
          ctx.fillStyle = rGrad;
          ctx.beginPath();
          ctx.arc(0, 0, e.radius, 0, Math.PI * 2);
          ctx.fill();

          // Sigil rune circle
          ctx.globalAlpha = 0.35;
          ctx.strokeStyle = "#cc88ff";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(0, 0, e.radius * 0.72, 0, Math.PI * 2);
          ctx.stroke();
          for (let i = 0; i < 6; i++) {
            const a = (i / 6) * Math.PI * 2 + now * 0.0005;
            const dotX = Math.cos(a) * e.radius * 0.72;
            const dotY = Math.sin(a) * e.radius * 0.72;
            ctx.fillStyle = "#cc88ff";
            ctx.beginPath();
            ctx.arc(dotX, dotY, 1.5, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.globalAlpha = 1;

          // 3 orbiting eyes
          const eyeAngles = [
            now * 0.0012,
            now * 0.0012 + (Math.PI * 2) / 3,
            now * 0.0012 + (Math.PI * 4) / 3,
          ];
          for (let i = 0; i < 3; i++) {
            const ea = eyeAngles[i];
            const ex2 = Math.cos(ea) * e.radius * 0.52;
            const ey2 = Math.sin(ea) * e.radius * 0.52;
            // Eye white
            ctx.fillStyle = "#ffffdd";
            ctx.shadowBlur = 6;
            ctx.shadowColor = "#aa44ff";
            ctx.beginPath();
            ctx.ellipse(
              ex2,
              ey2,
              e.radius * 0.23,
              e.radius * 0.16,
              ea,
              0,
              Math.PI * 2,
            );
            ctx.fill();
            // Iris (purple)
            ctx.fillStyle = "#6600aa";
            ctx.beginPath();
            ctx.arc(ex2, ey2, e.radius * 0.11, 0, Math.PI * 2);
            ctx.fill();
            // Pupil
            ctx.fillStyle = "#000000";
            ctx.beginPath();
            ctx.arc(ex2, ey2, e.radius * 0.055, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
        ctx.restore();

        // HP bar — upgraded with glow
        const barW = e.radius * 2.8;
        const barH2 = 5;
        const barX = e.pos.x - barW / 2;
        const barY = e.pos.y - e.radius - 12;
        // Background track
        ctx.fillStyle = "rgba(5,5,15,0.85)";
        ctx.beginPath();
        ctx.roundRect(barX - 1, barY - 1, barW + 2, barH2 + 2, 2);
        ctx.fill();
        // HP fill
        const hpRatio = e.hp / e.maxHp;
        const hpBarColor =
          hpRatio > 0.5 ? color : hpRatio > 0.25 ? "#ffaa00" : "#ff2200";
        ctx.shadowBlur = 8;
        ctx.shadowColor = hpBarColor;
        const hpGrad2 = ctx.createLinearGradient(barX, barY, barX + barW, barY);
        hpGrad2.addColorStop(0, hpBarColor);
        hpGrad2.addColorStop(1, "#ffffff");
        ctx.fillStyle = hpGrad2;
        ctx.beginPath();
        ctx.roundRect(barX, barY, barW * hpRatio, barH2, 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // ========================
      // PLAYER
      // ========================
      const pFlash = p.iframes > 0 && Math.floor(p.iframes / 4) % 2 === 0;
      const pulse = Math.sin(now * 0.003) * 0.5 + 0.5;

      if (!pFlash) {
        // Player trail (energy wake)
        const trail = playerTrailRef.current;
        for (let i = 0; i < trail.length; i++) {
          const t4 = trail[i];
          const ta = (i / trail.length) * 0.35;
          ctx.save();
          ctx.globalAlpha = ta;
          ctx.shadowBlur = 8;
          ctx.shadowColor = "#2266ff";
          ctx.fillStyle = "#2266ff";
          ctx.beginPath();
          ctx.arc(
            t4.x,
            t4.y,
            p.radius * 0.5 * (i / trail.length),
            0,
            Math.PI * 2,
          );
          ctx.fill();
          ctx.restore();
        }

        // Outer orbit ring
        ctx.globalAlpha = 0.25 + pulse * 0.2;
        ctx.strokeStyle = "#2255aa";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(p.pos.x, p.pos.y, 32 + pulse * 3, 0, Math.PI * 2);
        ctx.stroke();

        // Energy wisps orbiting player
        for (let i = 0; i < 4; i++) {
          const wa = now * 0.002 + (i / 4) * Math.PI * 2;
          const wx = p.pos.x + Math.cos(wa) * 22;
          const wy = p.pos.y + Math.sin(wa) * 22;
          ctx.globalAlpha = 0.55 + Math.sin(now * 0.004 + i) * 0.2;
          ctx.shadowBlur = 8;
          ctx.shadowColor = "#4499ff";
          ctx.fillStyle = i % 2 === 0 ? "#66bbff" : "#4488ee";
          ctx.beginPath();
          ctx.arc(wx, wy, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }

        // Main pulsing aura ring
        ctx.globalAlpha = 0.35 + pulse * 0.3;
        ctx.shadowBlur = 30;
        ctx.shadowColor = "#3388ff";
        ctx.strokeStyle = "#4499ff";
        ctx.lineWidth = 2.5 + pulse;
        ctx.beginPath();
        ctx.arc(p.pos.x, p.pos.y, 26 + pulse, 0, Math.PI * 2);
        ctx.stroke();

        // Inner tight ring
        ctx.globalAlpha = 0.7 + pulse * 0.15;
        ctx.strokeStyle = "#88ddff";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(p.pos.x, p.pos.y, 19, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;

        // Hexagonal body
        ctx.save();
        ctx.translate(p.pos.x, p.pos.y);
        ctx.rotate(now * 0.001);
        ctx.shadowBlur = 30;
        ctx.shadowColor = "#3399ff";
        const bodyGrad = ctx.createRadialGradient(-3, -4, 0, 0, 0, p.radius);
        bodyGrad.addColorStop(0, "#aaddff");
        bodyGrad.addColorStop(0.5, "#3377dd");
        bodyGrad.addColorStop(1, "#0022aa");
        ctx.fillStyle = bodyGrad;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * Math.PI * 2 - Math.PI / 6;
          const r2 = p.radius * (0.92 + Math.sin(now * 0.005 + i) * 0.06);
          if (i === 0) ctx.moveTo(Math.cos(a) * r2, Math.sin(a) * r2);
          else ctx.lineTo(Math.cos(a) * r2, Math.sin(a) * r2);
        }
        ctx.closePath();
        ctx.fill();

        // Hex edge glow
        ctx.strokeStyle = "#88ccff";
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = 0.6 + pulse * 0.3;
        ctx.stroke();
        ctx.globalAlpha = 1;

        // Inner bright core
        const coreGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, 5);
        coreGrad.addColorStop(0, "#ffffff");
        coreGrad.addColorStop(0.5, "#aaddff");
        coreGrad.addColorStop(1, "transparent");
        ctx.fillStyle = coreGrad;
        ctx.shadowBlur = 15;
        ctx.shadowColor = "#ffffff";
        ctx.beginPath();
        ctx.arc(0, 0, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
        ctx.shadowBlur = 0;
      } else {
        // Damaged flicker
        ctx.save();
        ctx.translate(p.pos.x, p.pos.y);
        ctx.shadowBlur = 25;
        ctx.shadowColor = "#ff4422";
        const dmgGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, p.radius + 3);
        dmgGrad.addColorStop(0, "#ffaaaa");
        dmgGrad.addColorStop(0.5, "#ff2200");
        dmgGrad.addColorStop(1, "#660000");
        ctx.fillStyle = dmgGrad;
        ctx.beginPath();
        ctx.arc(0, 0, p.radius + 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        ctx.shadowBlur = 0;
      }

      // Aim line (dashed cursor indicator)
      const mouse = mouseRef.current;
      const aimDir = norm({ x: mouse.x - p.pos.x, y: mouse.y - p.pos.y });
      ctx.save();
      ctx.globalAlpha = 0.35;
      ctx.strokeStyle = "#4488ff";
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 5]);
      ctx.shadowBlur = 4;
      ctx.shadowColor = "#4488ff";
      ctx.beginPath();
      ctx.moveTo(
        p.pos.x + aimDir.x * (p.radius + 8),
        p.pos.y + aimDir.y * (p.radius + 8),
      );
      ctx.lineTo(p.pos.x + aimDir.x * 55, p.pos.y + aimDir.y * 55);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;

      // ========================
      // FINAL OVERLAYS
      // ========================

      // Deep vignette
      const vigFinal = ctx.createRadialGradient(
        W / 2,
        H / 2,
        Math.min(W, H) * 0.28,
        W / 2,
        H / 2,
        Math.max(W, H) * 0.78,
      );
      vigFinal.addColorStop(0, "transparent");
      vigFinal.addColorStop(1, "rgba(0,0,12,0.5)");
      ctx.fillStyle = vigFinal;
      ctx.fillRect(0, 0, W, H);

      // Fine scanlines
      ctx.globalAlpha = 0.03;
      ctx.fillStyle = "#000000";
      for (let sy = 0; sy < H; sy += 2) {
        ctx.fillRect(0, sy, W, 1);
      }
      ctx.globalAlpha = 1;

      // ========================
      // WAVE START OVERLAY
      // ========================
      if (s.waveTimer > 0 && s.wave > 0) {
        const fade = Math.min(1, s.waveTimer / 30);
        ctx.globalAlpha = fade;
        ctx.fillStyle = "rgba(5,10,40,0.80)";
        ctx.fillRect(0, 0, W, H);

        // Large background kanji 波
        ctx.font = "bold 120px serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.globalAlpha = 0.12 * fade;
        ctx.fillStyle = "#8866ff";
        ctx.fillText("波", W / 2, H / 2 - 15);

        // Wave title
        ctx.globalAlpha = fade;
        ctx.font = "bold 32px 'Cinzel', serif";
        ctx.shadowBlur = 35;
        ctx.shadowColor = "#4499ff";
        ctx.fillStyle = "#88ccff";
        ctx.fillText(`WAVE ${s.wave}`, W / 2, H / 2 + 18);
        ctx.shadowBlur = 0;

        ctx.font = "15px 'Exo 2', sans-serif";
        ctx.fillStyle = "#667799";
        ctx.fillText("Survive the cursed spirits", W / 2, H / 2 + 52);

        ctx.textBaseline = "alphabetic";
        ctx.textAlign = "left";
        ctx.globalAlpha = 1;
      }

      // ========================
      // WAVE CLEAR OVERLAY
      // ========================
      if (s.status === "wave_clear" && pausedRef.current) {
        ctx.fillStyle = "rgba(0,25,12,0.78)";
        ctx.fillRect(0, 0, W, H);

        ctx.font = "bold 30px 'Cinzel', serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.shadowBlur = 28;
        ctx.shadowColor = "#44ff88";
        ctx.fillStyle = "#55ffaa";
        ctx.fillText("WAVE CLEARED!", W / 2, H / 2 - 10);
        ctx.shadowBlur = 0;

        ctx.font = "14px 'Exo 2', sans-serif";
        ctx.fillStyle = "#8899bb";
        ctx.fillText("Choose your cursed technique...", W / 2, H / 2 + 26);

        ctx.textBaseline = "alphabetic";
        ctx.textAlign = "left";
      }
    }

    animRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  const { wave, score, hp, maxHp, orbs, status, enemiesLeft, pickedAbilities } =
    uiState;

  // Get full ability objects for picked abilities
  const pickedAbilityObjects = pickedAbilities
    .map((id) => JJK_ABILITIES.find((a) => a.id === id))
    .filter(Boolean) as JJKAbility[];

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
        @keyframes abilityCardGlow {
          0%, 100% { filter: brightness(1); }
          50% { filter: brightness(1.15); }
        }
        @keyframes overlayFadeIn {
          from { opacity: 0; transform: scale(0.96); }
          to { opacity: 1; transform: scale(1); }
        }
        .ability-card {
          transition: transform 0.18s ease, box-shadow 0.18s ease, filter 0.18s ease;
          cursor: pointer;
        }
        .ability-card:hover {
          transform: scale(1.06) translateY(-4px);
          filter: brightness(1.18);
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

      {/* Active Abilities Row */}
      {pickedAbilityObjects.length > 0 && (
        <div className="w-full max-w-[700px] flex flex-wrap gap-2 px-1">
          <span
            className="font-cinzel text-[10px] tracking-widest self-center"
            style={{ color: "oklch(0.70 0.22 240)" }}
          >
            TECHNIQUES:
          </span>
          {pickedAbilityObjects.map((ab) => (
            <div
              key={ab.id}
              title={`${ab.name} — ${ab.description}`}
              className="flex items-center gap-1 px-2 py-1 rounded text-xs font-cinzel"
              style={{
                background: "oklch(0.10 0.02 260)",
                border: `1px solid ${ab.color}44`,
                color: ab.color,
                boxShadow: `0 0 6px ${ab.color}44`,
                fontSize: "11px",
              }}
            >
              <span>{ab.emoji}</span>
              <span
                style={{
                  maxWidth: 90,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {ab.name}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Canvas + Overlay */}
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

        {/* Ability Picker Overlay */}
        {showAbilityPicker && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center rounded-lg gap-6"
            style={{
              background: "rgba(3,4,12,0.88)",
              backdropFilter: "blur(6px)",
              animation: "overlayFadeIn 0.25s ease",
              zIndex: 10,
            }}
          >
            {/* Title */}
            <div className="text-center">
              <p
                className="font-cinzel font-black text-2xl tracking-widest"
                style={{
                  color: "#88ccff",
                  textShadow: "0 0 24px #4499ff, 0 0 48px #4499ff44",
                  letterSpacing: "0.2em",
                }}
              >
                CHOOSE YOUR TECHNIQUE
              </p>
              <p
                className="font-exo text-xs mt-1"
                style={{ color: "oklch(0.55 0.015 270)" }}
              >
                Select a cursed technique to empower your next wave
              </p>
            </div>

            {/* Ability Cards */}
            <div className="flex gap-4 px-6">
              {abilityChoices.map((ab) => (
                <button
                  key={ab.id}
                  type="button"
                  className="ability-card flex flex-col items-center gap-3 p-4 rounded-xl text-left"
                  data-ocid="cursed_survival.ability.button"
                  style={{
                    width: 190,
                    background: "oklch(0.07 0.03 260)",
                    border: `1.5px solid ${ab.color}`,
                    boxShadow:
                      hoveredAbility === ab.id
                        ? `0 0 28px ${ab.color}99, 0 0 8px ${ab.color}44 inset`
                        : `0 0 12px ${ab.color}44`,
                  }}
                  onMouseEnter={() => setHoveredAbility(ab.id)}
                  onMouseLeave={() => setHoveredAbility(null)}
                  onClick={() => handlePickAbility(ab)}
                >
                  {/* Emoji */}
                  <div
                    className="flex items-center justify-center w-14 h-14 rounded-full text-3xl"
                    style={{
                      background: `${ab.color}1a`,
                      border: `1px solid ${ab.color}66`,
                      boxShadow: `0 0 16px ${ab.color}44`,
                    }}
                  >
                    {ab.emoji}
                  </div>

                  {/* Name */}
                  <p
                    className="font-cinzel font-bold text-center leading-tight"
                    style={{ color: "oklch(0.95 0.01 265)", fontSize: 13 }}
                  >
                    {ab.name}
                  </p>

                  {/* Character */}
                  <p
                    className="font-exo text-center"
                    style={{ color: ab.color, fontSize: 11, opacity: 0.9 }}
                  >
                    {ab.character}
                  </p>

                  {/* Description */}
                  <p
                    className="font-exo text-center"
                    style={{
                      color: "oklch(0.60 0.01 265)",
                      fontSize: 11,
                      lineHeight: 1.5,
                    }}
                  >
                    {ab.description}
                  </p>
                </button>
              ))}
            </div>

            {/* Wave indicator */}
            <p
              className="font-cinzel text-xs tracking-widest"
              style={{ color: "oklch(0.50 0.15 240)", opacity: 0.7 }}
            >
              WAVE {stateRef.current.wave} CLEARED — ABILITIES UNLOCKED:{" "}
              {pickedAbilities.length}
            </p>
          </div>
        )}

        {/* Dead Overlay */}
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
            {pickedAbilityObjects.length > 0 && (
              <p
                className="font-exo text-xs"
                style={{ color: "oklch(0.55 0.015 270)" }}
              >
                Techniques mastered:{" "}
                {pickedAbilityObjects.map((a) => a.emoji).join(" ")}
              </p>
            )}
            <button
              type="button"
              onClick={resetGame}
              data-ocid="cursed_survival.primary_button"
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
