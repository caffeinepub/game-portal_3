import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";

interface Technique {
  name: string;
  cost: number;
  minDmg: number;
  maxDmg: number;
  description: string;
  type: "attack" | "defense" | "special";
  heals?: number;
}

interface Character {
  id: string;
  name: string;
  title: string;
  kanji: string;
  color: string;
  hp: number;
  ce: number;
  speed: number;
  techniques: Technique[];
}

const CHARACTERS: Character[] = [
  {
    id: "gojo",
    name: "Satoru Gojo",
    title: "The Honored One",
    kanji: "無",
    color: "oklch(0.70 0.22 240)",
    hp: 100,
    ce: 100,
    speed: 90,
    techniques: [
      {
        name: "Infinity",
        cost: 0,
        minDmg: 5,
        maxDmg: 12,
        description: "Passive barrier deflects attacks",
        type: "defense",
        heals: 8,
      },
      {
        name: "Blue (Attraction)",
        cost: 25,
        minDmg: 18,
        maxDmg: 28,
        description: "Cursed energy compression creates a void",
        type: "attack",
      },
      {
        name: "Hollow Purple",
        cost: 60,
        minDmg: 45,
        maxDmg: 65,
        description: "The convergence of Red and Blue obliterates everything",
        type: "special",
      },
    ],
  },
  {
    id: "yuji",
    name: "Yuji Itadori",
    title: "Sukuna's Vessel",
    kanji: "拳",
    color: "oklch(0.65 0.22 25)",
    hp: 130,
    ce: 70,
    speed: 85,
    techniques: [
      {
        name: "Divergent Fist",
        cost: 10,
        minDmg: 15,
        maxDmg: 25,
        description: "Two waves of impact: body and delayed CE",
        type: "attack",
      },
      {
        name: "Black Flash",
        cost: 30,
        minDmg: 30,
        maxDmg: 50,
        description: "Cursed energy distortion amplifies impact 2.5x",
        type: "attack",
      },
      {
        name: "Mahoraga Adaptation",
        cost: 50,
        minDmg: 20,
        maxDmg: 35,
        description: "Adapt and strike with evolved technique",
        type: "special",
        heals: 15,
      },
    ],
  },
  {
    id: "megumi",
    name: "Megumi Fushiguro",
    title: "Ten Shadows Sorcerer",
    kanji: "影",
    color: "oklch(0.72 0.08 270)",
    hp: 110,
    ce: 85,
    speed: 80,
    techniques: [
      {
        name: "Nue (Lightning Owl)",
        cost: 15,
        minDmg: 14,
        maxDmg: 22,
        description: "Summon Nue to electrocute the enemy",
        type: "attack",
      },
      {
        name: "Divine Dogs: Totality",
        cost: 25,
        minDmg: 20,
        maxDmg: 32,
        description: "Twin divine dogs tear into the opponent",
        type: "attack",
      },
      {
        name: "Chimera Shadow Garden",
        cost: 55,
        minDmg: 35,
        maxDmg: 55,
        description: "Domain floods area with shadows",
        type: "special",
        heals: 10,
      },
    ],
  },
  {
    id: "nobara",
    name: "Nobara Kugisaki",
    title: "Straw Doll Sorceress",
    kanji: "釘",
    color: "oklch(0.75 0.22 150)",
    hp: 95,
    ce: 90,
    speed: 75,
    techniques: [
      {
        name: "Straw Doll: Nail",
        cost: 10,
        minDmg: 12,
        maxDmg: 20,
        description: "Drive a nail into a straw doll, inflicting pain",
        type: "attack",
      },
      {
        name: "Resonance",
        cost: 35,
        minDmg: 25,
        maxDmg: 40,
        description: "Nail into effigy resonates cursed energy",
        type: "attack",
      },
      {
        name: "Hairpin",
        cost: 50,
        minDmg: 38,
        maxDmg: 55,
        description: "Compress nails to explosive bursting point",
        type: "special",
      },
    ],
  },
  {
    id: "sukuna",
    name: "Ryomen Sukuna",
    title: "King of Curses",
    kanji: "呪",
    color: "oklch(0.65 0.28 15)",
    hp: 120,
    ce: 110,
    speed: 95,
    techniques: [
      {
        name: "Dismantle",
        cost: 15,
        minDmg: 20,
        maxDmg: 30,
        description: "Slash of raw cursed energy cuts indiscriminately",
        type: "attack",
      },
      {
        name: "Cleave",
        cost: 25,
        minDmg: 28,
        maxDmg: 42,
        description: "Adapts to target's durability and slices perfectly",
        type: "attack",
      },
      {
        name: "Malevolent Shrine",
        cost: 70,
        minDmg: 55,
        maxDmg: 80,
        description: "Domain Expansion: guaranteed technique activation",
        type: "special",
      },
    ],
  },
  {
    id: "nanami",
    name: "Nanami Kento",
    title: "Grade 1 Sorcerer",
    kanji: "比",
    color: "oklch(0.72 0.18 75)",
    hp: 115,
    ce: 75,
    speed: 78,
    techniques: [
      {
        name: "Ratio: 7:3",
        cost: 15,
        minDmg: 16,
        maxDmg: 24,
        description: "Strike the 7:3 ratio point for maximum damage",
        type: "attack",
      },
      {
        name: "Overtime",
        cost: 30,
        minDmg: 28,
        maxDmg: 40,
        description: "Unleash enhanced strength beyond limits",
        type: "attack",
      },
      {
        name: "Collapse",
        cost: 50,
        minDmg: 40,
        maxDmg: 58,
        description: "Demolish the target with overwhelming force",
        type: "special",
      },
    ],
  },
  {
    id: "toge",
    name: "Toge Inumaki",
    title: "Cursed Speech User",
    kanji: "言",
    color: "oklch(0.78 0.15 200)",
    hp: 90,
    ce: 95,
    speed: 82,
    techniques: [
      {
        name: "Freeze",
        cost: 10,
        minDmg: 10,
        maxDmg: 18,
        description: "Command the enemy to freeze in place",
        type: "defense",
        heals: 5,
      },
      {
        name: "Blast Away",
        cost: 30,
        minDmg: 25,
        maxDmg: 38,
        description: "Speak the cursed word to repel the foe",
        type: "attack",
      },
      {
        name: "Twist",
        cost: 55,
        minDmg: 42,
        maxDmg: 62,
        description: "Command reality itself to twist and shatter",
        type: "special",
      },
    ],
  },
  {
    id: "maki",
    name: "Maki Zen'in",
    title: "Zen'in Sorcerer",
    kanji: "刃",
    color: "oklch(0.70 0.18 145)",
    hp: 125,
    ce: 40,
    speed: 92,
    techniques: [
      {
        name: "Polearm Strike",
        cost: 5,
        minDmg: 18,
        maxDmg: 28,
        description: "Swift strike with cursed tool",
        type: "attack",
      },
      {
        name: "Playful Cloud",
        cost: 20,
        minDmg: 30,
        maxDmg: 45,
        description: "Three-section staff delivers devastating blows",
        type: "attack",
      },
      {
        name: "Genocide",
        cost: 35,
        minDmg: 50,
        maxDmg: 70,
        description: "Overwhelm the enemy with pure physical might",
        type: "special",
      },
    ],
  },
  {
    id: "todo",
    name: "Aoi Todo",
    title: "Boogie Woogie",
    kanji: "換",
    color: "oklch(0.72 0.20 320)",
    hp: 120,
    ce: 80,
    speed: 88,
    techniques: [
      {
        name: "Divergent Fist",
        cost: 10,
        minDmg: 15,
        maxDmg: 22,
        description: "Explosive impact amplified by CE",
        type: "attack",
      },
      {
        name: "Boogie Woogie",
        cost: 25,
        minDmg: 20,
        maxDmg: 32,
        description: "Swap positions and confound the enemy",
        type: "defense",
        heals: 12,
      },
      {
        name: "True Boogie Woogie",
        cost: 55,
        minDmg: 45,
        maxDmg: 65,
        description: "The ultimate swap technique shatters all defenses",
        type: "special",
      },
    ],
  },
  {
    id: "choso",
    name: "Choso",
    title: "Death Painting Womb",
    kanji: "血",
    color: "oklch(0.62 0.25 20)",
    hp: 108,
    ce: 90,
    speed: 76,
    techniques: [
      {
        name: "Piercing Blood",
        cost: 15,
        minDmg: 20,
        maxDmg: 30,
        description: "Blood-hardened projectile pierces through anything",
        type: "attack",
      },
      {
        name: "Convergence",
        cost: 30,
        minDmg: 32,
        maxDmg: 48,
        description: "Compress blood to maximum density and release",
        type: "attack",
      },
      {
        name: "Supernova",
        cost: 60,
        minDmg: 50,
        maxDmg: 72,
        description: "Blood explosion of catastrophic scale",
        type: "special",
      },
    ],
  },
  {
    id: "geto",
    name: "Suguru Geto",
    title: "Curse Manipulator",
    kanji: "蟲",
    color: "oklch(0.58 0.18 310)",
    hp: 100,
    ce: 100,
    speed: 80,
    techniques: [
      {
        name: "Curse Spirit Manipulation",
        cost: 0,
        minDmg: 8,
        maxDmg: 14,
        description: "Absorb and redirect cursed spirits",
        type: "defense",
        heals: 10,
      },
      {
        name: "Uzumaki",
        cost: 20,
        minDmg: 22,
        maxDmg: 32,
        description: "Combine thousands of cursed spirits into one strike",
        type: "attack",
      },
      {
        name: "Maximum Uzumaki",
        cost: 45,
        minDmg: 38,
        maxDmg: 55,
        description: "Maximum output — a catastrophic cursed blast",
        type: "special",
      },
    ],
  },
  {
    id: "yuta",
    name: "Yuta Okkotsu",
    title: "Special Grade Sorcerer",
    kanji: "愛",
    color: "oklch(0.80 0.18 250)",
    hp: 110,
    ce: 105,
    speed: 87,
    techniques: [
      {
        name: "Rika",
        cost: 15,
        minDmg: 18,
        maxDmg: 28,
        description: "Rika manifests and strikes the enemy",
        type: "attack",
      },
      {
        name: "Rika: Rampage",
        cost: 35,
        minDmg: 35,
        maxDmg: 52,
        description: "Unleash Rika's full cursed energy in a frenzy",
        type: "special",
      },
      {
        name: "Copy",
        cost: 50,
        minDmg: 42,
        maxDmg: 60,
        description: "Copy the enemy's technique and overwhelm them",
        type: "special",
        heals: 8,
      },
    ],
  },
  {
    id: "mahito",
    name: "Mahito",
    title: "Idle Transfiguration",
    kanji: "魂",
    color: "oklch(0.65 0.22 185)",
    hp: 105,
    ce: 95,
    speed: 83,
    techniques: [
      {
        name: "Idle Transfiguration",
        cost: 15,
        minDmg: 16,
        maxDmg: 26,
        description: "Reshape the soul to twist the body",
        type: "attack",
      },
      {
        name: "Body Repel",
        cost: 30,
        minDmg: 28,
        maxDmg: 42,
        description: "Reshape own body to repel damage",
        type: "defense",
        heals: 10,
      },
      {
        name: "Polymorphic Soul Isomer",
        cost: 60,
        minDmg: 50,
        maxDmg: 70,
        description: "Transfigure the enemy's soul into oblivion",
        type: "special",
      },
    ],
  },
  {
    id: "kenjaku",
    name: "Kenjaku",
    title: "Ancient Sorcerer",
    kanji: "脳",
    color: "oklch(0.70 0.20 280)",
    hp: 112,
    ce: 108,
    speed: 84,
    techniques: [
      {
        name: "Antigravity System",
        cost: 20,
        minDmg: 22,
        maxDmg: 34,
        description: "Reverse cursed energy nullifies gravity",
        type: "attack",
      },
      {
        name: "Idle Transfiguration (Copied)",
        cost: 35,
        minDmg: 30,
        maxDmg: 46,
        description: "Use a stolen technique against its origin",
        type: "attack",
      },
      {
        name: "Prison Realm",
        cost: 65,
        minDmg: 55,
        maxDmg: 78,
        description: "Seal the enemy in an inescapable barrier",
        type: "special",
      },
    ],
  },
];

type Mode = "cpu" | "pvp";
type Phase = "mode" | "select" | "select_p2" | "battle" | "result";

interface BattleState {
  playerChar: Character;
  enemyChar: Character;
  playerHp: number;
  playerCe: number;
  enemyHp: number;
  enemyCe: number;
  turn: "player" | "enemy";
  log: string[];
  round: number;
  totalDamageDealt: number;
  ceUsed: number;
}

const randInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const KANJI_BG = ["呪", "術", "廻", "戦", "域", "展", "開", "霊", "力", "気"];

export default function JJKBattleGame() {
  const [phase, setPhase] = useState<Phase>("mode");
  const [mode, setMode] = useState<Mode>("cpu");
  const [selectedChar, setSelectedChar] = useState<Character | null>(null);
  const [selectedChar2, setSelectedChar2] = useState<Character | null>(null);
  const [battle, setBattle] = useState<BattleState | null>(null);
  const [flashColor, setFlashColor] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [won, setWon] = useState(false);
  const processingEnemyTurn = useRef(false);

  const triggerFlash = useCallback((color: string) => {
    setFlashColor(color);
    setTimeout(() => setFlashColor(null), 350);
  }, []);

  const startBattle = useCallback((p1: Character, p2: Character) => {
    setBattle({
      playerChar: p1,
      enemyChar: p2,
      playerHp: p1.hp,
      playerCe: p1.ce,
      enemyHp: p2.hp,
      enemyCe: p2.ce,
      turn: p1.speed >= p2.speed ? "player" : "enemy",
      log: [`⚡ ${p1.name} vs ${p2.name} — BATTLE START!`],
      round: 1,
      totalDamageDealt: 0,
      ceUsed: 0,
    });
    setPhase("battle");
  }, []);

  const endBattle = useCallback((b: BattleState, victory: boolean) => {
    const baseScore = b.totalDamageDealt * 10;
    const roundBonus = Math.max(0, (20 - b.round) * 50);
    const ceBonus =
      b.ceUsed > 0 ? Math.floor((b.totalDamageDealt / b.ceUsed) * 100) : 0;
    const score = baseScore + roundBonus + ceBonus + (victory ? 1000 : 0);
    setFinalScore(score);
    setWon(victory);
    setPhase("result");
  }, []);

  const doAction = useCallback(
    (techIndex: number | "auto", side: "player" | "enemy") => {
      if (!battle || battle.turn !== side || isAnimating) return;
      setIsAnimating(true);

      setBattle((prev) => {
        if (!prev) return prev;
        const isPlayer = side === "player";
        const actingChar = isPlayer ? prev.playerChar : prev.enemyChar;
        const actingCe = isPlayer ? prev.playerCe : prev.enemyCe;
        const actingHp = isPlayer ? prev.playerHp : prev.enemyHp;

        let dmg = 0;
        let healAmount = 0;
        let ceCost = 0;
        let actionName = "";

        if (techIndex === "auto") {
          dmg = randInt(3, 8);
          actionName = "Auto-Attack";

          const tech = actingChar.techniques[techIndex];
          if (actingCe < tech.cost) return prev;
          dmg = randInt(tech.minDmg, tech.maxDmg);
          healAmount = tech.heals ?? 0;
          ceCost = tech.cost;
          actionName = tech.name;
        }

        const newActingHp = Math.min(actingChar.hp, actingHp + healAmount);
        const newActingCe = Math.max(0, actingCe - ceCost);
        const emoji = isPlayer ? "🗡️" : "💢";
        const newLog = [
          `${emoji} ${actingChar.name} uses ${actionName} — ${dmg} DMG${healAmount > 0 ? ` (+${healAmount} HP)` : ""}`,
          ...prev.log,
        ].slice(0, 5);

        if (isPlayer) {
          const newEnemyHp = Math.max(0, prev.enemyHp - dmg);
          return {
            ...prev,
            enemyHp: newEnemyHp,
            playerHp: newActingHp,
            playerCe: newActingCe,
            totalDamageDealt: prev.totalDamageDealt + dmg,
            ceUsed: prev.ceUsed + ceCost,
            log: newLog,
            turn: "enemy",
          };
        }
        const newPlayerHp = Math.max(0, prev.playerHp - dmg);
        const regen = 8;
        return {
          ...prev,
          playerHp: newPlayerHp,
          enemyHp: newActingHp,
          enemyCe: Math.min(prev.enemyChar.ce, newActingCe + regen),
          playerCe: Math.min(prev.playerChar.ce, prev.playerCe + regen),
          log: newLog,
          round: prev.round + 1,
          turn: "player",
        };
      });

      triggerFlash(
        side === "player" ? battle.playerChar.color : battle.enemyChar.color,
      );
      setTimeout(() => setIsAnimating(false), 400);
    },
    [battle, isAnimating, triggerFlash],
  );

  const doPlayerAction = useCallback(
    (techIndex: number | "auto") => doAction(techIndex, "player"),
    [doAction],
  );
  const doP2Action = useCallback(
    (techIndex: number | "auto") => doAction(techIndex, "enemy"),
    [doAction],
  );

  // CPU enemy turn — only in cpu mode
  useEffect(() => {
    if (mode !== "cpu") return;
    if (!battle || battle.turn !== "enemy" || isAnimating) return;
    if (battle.enemyHp <= 0 || battle.playerHp <= 0) return;
    if (processingEnemyTurn.current) return;
    processingEnemyTurn.current = true;

    const timer = setTimeout(() => {
      setBattle((prev) => {
        if (!prev) return prev;
        const available = prev.enemyChar.techniques.filter(
          (t) => t.cost <= prev.enemyCe,
        );
        const tech =
          available.length > 0
            ? available[Math.floor(Math.random() * available.length)]
            : null;

        let dmg = 0;
        let healAmount = 0;
        let ceCost = 0;
        let actionName = "";

        if (tech) {
          dmg = randInt(tech.minDmg, tech.maxDmg);
          healAmount = tech.heals ?? 0;
          ceCost = tech.cost;
          actionName = tech.name;

          dmg = randInt(3, 8);
          actionName = "Auto-Attack";
        }

        const newPlayerHp = Math.max(0, prev.playerHp - dmg);
        const newEnemyHp = Math.min(
          prev.enemyChar.hp,
          prev.enemyHp + healAmount,
        );
        const newEnemyCe = Math.max(0, prev.enemyCe - ceCost);
        const newLog = [
          `💢 ${prev.enemyChar.name} uses ${actionName} — ${dmg} DMG${healAmount > 0 ? ` (+${healAmount} HP)` : ""}`,
          ...prev.log,
        ].slice(0, 5);

        const regen = 8;
        return {
          ...prev,
          playerHp: newPlayerHp,
          enemyHp: newEnemyHp,
          enemyCe: Math.min(prev.enemyChar.ce, newEnemyCe + regen),
          playerCe: Math.min(prev.playerChar.ce, prev.playerCe + regen),
          log: newLog,
          round: prev.round + 1,
          turn: "player",
        };
      });
      processingEnemyTurn.current = false;
    }, 900);

    return () => {
      clearTimeout(timer);
      processingEnemyTurn.current = false;
    };
  }, [battle, isAnimating, mode]);

  // Watch for flash and battle end
  useEffect(() => {
    if (!battle) return;
    if (battle.turn === "player" && battle.log[0]?.startsWith("💢")) {
      triggerFlash(battle.enemyChar.color);
    }
    if (battle.enemyHp <= 0) {
      setTimeout(() => endBattle(battle, true), 500);
    } else if (battle.playerHp <= 0) {
      setTimeout(() => endBattle(battle, false), 500);
    }
  }, [battle, triggerFlash, endBattle]);

  const resetGame = () => {
    setPhase("mode");
    setSelectedChar(null);
    setSelectedChar2(null);
    setBattle(null);
    processingEnemyTurn.current = false;
  };

  const handleModeSelect = (m: Mode) => {
    setMode(m);
    setPhase("select");
  };

  const handleP1Select = () => {
    if (!selectedChar) return;
    if (mode === "pvp") {
      setPhase("select_p2");
    } else {
      const enemies = CHARACTERS.filter((c) => c.id !== selectedChar.id);
      const enemy = enemies[Math.floor(Math.random() * enemies.length)];
      startBattle(selectedChar, enemy);
    }
  };

  const handleP2Select = () => {
    if (!selectedChar || !selectedChar2) return;
    startBattle(selectedChar, selectedChar2);
  };

  const isPvp = mode === "pvp";

  return (
    <div
      className="relative min-h-[600px] rounded-xl overflow-hidden"
      style={{
        background: "oklch(0.06 0.02 265)",
        border: "1px solid oklch(0.70 0.22 240 / 0.2)",
      }}
    >
      <style>{`
        @keyframes kanjiFloat {
          0%, 100% { transform: translateY(0) rotate(0deg); opacity: 0.04; }
          50% { transform: translateY(-20px) rotate(5deg); opacity: 0.08; }
        }
        @keyframes charPulse {
          0%, 100% { filter: drop-shadow(0 0 12px var(--char-color)); }
          50% { filter: drop-shadow(0 0 28px var(--char-color)); }
        }
        @keyframes battleShake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
        .battle-shake { animation: battleShake 0.3s ease-in-out; }
        @keyframes modeGlow {
          0%, 100% { box-shadow: 0 0 20px oklch(0.70 0.22 240 / 0.2); }
          50% { box-shadow: 0 0 40px oklch(0.70 0.22 240 / 0.45); }
        }
      `}</style>

      {/* Floating kanji background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {KANJI_BG.map((k, i) => (
          <span
            key={k}
            className="absolute font-cinzel font-black select-none"
            style={{
              fontSize: `${3 + (i % 3)}rem`,
              top: `${(i * 13 + 5) % 90}%`,
              left: `${(i * 17 + 3) % 95}%`,
              color: "oklch(0.70 0.22 240)",
              opacity: 0.04,
              animation: `kanjiFloat ${4 + i * 0.7}s ease-in-out infinite`,
              animationDelay: `${i * 0.5}s`,
            }}
          >
            {k}
          </span>
        ))}
      </div>

      {/* Flash overlay */}
      <AnimatePresence>
        {flashColor && (
          <motion.div
            className="absolute inset-0 pointer-events-none z-50"
            initial={{ opacity: 0.55 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            style={{ background: flashColor, mixBlendMode: "screen" }}
          />
        )}
      </AnimatePresence>

      <div className="relative z-10">
        <AnimatePresence mode="wait">
          {/* MODE SELECTION */}
          {phase === "mode" && (
            <motion.div
              key="mode"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="p-6 flex flex-col items-center justify-center min-h-[500px]"
            >
              <div className="text-center mb-10">
                <h2 className="font-cinzel font-black text-4xl md:text-5xl cursed-blue-text mb-3">
                  CURSED CLASH
                </h2>
                <p
                  className="font-exo text-sm"
                  style={{ color: "oklch(0.65 0.015 270)" }}
                >
                  Choose your battle mode
                </p>
                <div
                  className="mt-3 w-40 h-px mx-auto"
                  style={{
                    background:
                      "linear-gradient(90deg, transparent, oklch(0.70 0.22 240), transparent)",
                  }}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-lg">
                <motion.button
                  type="button"
                  whileHover={{ y: -8, scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleModeSelect("cpu")}
                  className="rounded-2xl p-8 flex flex-col items-center gap-4 cursor-pointer"
                  style={{
                    background: "oklch(0.09 0.025 265)",
                    border: "2px solid oklch(0.70 0.22 240 / 0.4)",
                    animation: "modeGlow 3s ease-in-out infinite",
                  }}
                  data-ocid="battle.cpu_mode_button"
                >
                  <span style={{ fontSize: "3.5rem" }}>⚔️</span>
                  <div className="text-center">
                    <p
                      className="font-cinzel font-black text-xl"
                      style={{ color: "oklch(0.70 0.22 240)" }}
                    >
                      VS CPU
                    </p>
                    <p
                      className="font-exo text-xs mt-1"
                      style={{ color: "oklch(0.55 0.015 270)" }}
                    >
                      Battle against the AI
                    </p>
                  </div>
                </motion.button>

                <motion.button
                  type="button"
                  whileHover={{ y: -8, scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleModeSelect("pvp")}
                  className="rounded-2xl p-8 flex flex-col items-center gap-4 cursor-pointer"
                  style={{
                    background: "oklch(0.09 0.025 265)",
                    border: "2px solid oklch(0.75 0.22 150 / 0.4)",
                    boxShadow: "0 0 20px oklch(0.75 0.22 150 / 0.15)",
                  }}
                  data-ocid="battle.pvp_mode_button"
                >
                  <span style={{ fontSize: "3.5rem" }}>👥</span>
                  <div className="text-center">
                    <p
                      className="font-cinzel font-black text-xl"
                      style={{ color: "oklch(0.75 0.22 150)" }}
                    >
                      VS PLAYER
                    </p>
                    <p
                      className="font-exo text-xs mt-1"
                      style={{ color: "oklch(0.55 0.015 270)" }}
                    >
                      2-player local battle
                    </p>
                  </div>
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* P1 CHARACTER SELECT */}
          {phase === "select" && (
            <motion.div
              key="select"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="p-6"
            >
              <div className="text-center mb-8">
                <h2 className="font-cinzel font-black text-3xl md:text-4xl cursed-blue-text mb-2">
                  {isPvp ? "PLAYER 1 — CHOOSE YOUR SORCERER" : "CURSED CLASH"}
                </h2>
                <p
                  className="font-exo text-sm"
                  style={{ color: "oklch(0.65 0.015 270)" }}
                >
                  {isPvp
                    ? "Player 1 selects their sorcerer"
                    : "Choose your sorcerer and unleash your cursed technique"}
                </p>
                <div
                  className="mt-2 w-40 h-px mx-auto"
                  style={{
                    background:
                      "linear-gradient(90deg, transparent, oklch(0.70 0.22 240), transparent)",
                  }}
                />
              </div>

              <CharacterGrid
                characters={CHARACTERS}
                selected={selectedChar}
                onSelect={setSelectedChar}
                disabledIds={[]}
              />

              <div className="mt-8 flex justify-center gap-4">
                <button
                  type="button"
                  onClick={() => setPhase("mode")}
                  className="cursed-btn px-6 py-3 rounded-lg font-cinzel text-sm tracking-widest uppercase"
                >
                  ← BACK
                </button>
                <button
                  type="button"
                  onClick={handleP1Select}
                  disabled={!selectedChar}
                  className="cursed-btn-filled px-12 py-4 rounded-lg font-cinzel text-sm tracking-widest uppercase disabled:opacity-40 disabled:cursor-not-allowed domain-pulse"
                  data-ocid="battle.start_button"
                >
                  {isPvp
                    ? selectedChar
                      ? `P1: ${selectedChar.name.split(" ")[0].toUpperCase()} — NEXT`
                      : "SELECT A SORCERER"
                    : selectedChar
                      ? `BATTLE AS ${selectedChar.name.toUpperCase()}`
                      : "SELECT A SORCERER"}
                </button>
              </div>
            </motion.div>
          )}

          {/* P2 CHARACTER SELECT */}
          {phase === "select_p2" && (
            <motion.div
              key="select_p2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="p-6"
            >
              <div className="text-center mb-8">
                <h2
                  className="font-cinzel font-black text-3xl md:text-4xl mb-2"
                  style={{ color: "oklch(0.75 0.22 150)" }}
                >
                  PLAYER 2 — CHOOSE YOUR SORCERER
                </h2>
                <p
                  className="font-exo text-sm"
                  style={{ color: "oklch(0.65 0.015 270)" }}
                >
                  P1 chose{" "}
                  <span style={{ color: selectedChar?.color }}>
                    {selectedChar?.name}
                  </span>{" "}
                  — P2 must pick a different sorcerer
                </p>
                <div
                  className="mt-2 w-40 h-px mx-auto"
                  style={{
                    background:
                      "linear-gradient(90deg, transparent, oklch(0.75 0.22 150), transparent)",
                  }}
                />
              </div>

              <CharacterGrid
                characters={CHARACTERS}
                selected={selectedChar2}
                onSelect={setSelectedChar2}
                disabledIds={selectedChar ? [selectedChar.id] : []}
              />

              <div className="mt-8 flex justify-center gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setPhase("select");
                    setSelectedChar2(null);
                  }}
                  className="cursed-btn px-6 py-3 rounded-lg font-cinzel text-sm tracking-widest uppercase"
                >
                  ← BACK
                </button>
                <button
                  type="button"
                  onClick={handleP2Select}
                  disabled={!selectedChar2}
                  className="cursed-btn-filled px-12 py-4 rounded-lg font-cinzel text-sm tracking-widest uppercase disabled:opacity-40 disabled:cursor-not-allowed domain-pulse"
                  data-ocid="battle.p2_start_button"
                >
                  {selectedChar2
                    ? `P2: ${selectedChar2.name.split(" ")[0].toUpperCase()} — FIGHT!`
                    : "SELECT A SORCERER"}
                </button>
              </div>
            </motion.div>
          )}

          {/* BATTLE */}
          {phase === "battle" && battle && (
            <motion.div
              key="battle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-6"
            >
              <div className="text-center mb-4">
                <span
                  className="font-cinzel text-xs tracking-widest px-3 py-1 rounded-full"
                  style={{
                    background: "oklch(0.70 0.22 240 / 0.1)",
                    color: "oklch(0.70 0.22 240)",
                    border: "1px solid oklch(0.70 0.22 240 / 0.3)",
                  }}
                >
                  ROUND {battle.round}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <BattlerCard
                  char={battle.playerChar}
                  currentHp={battle.playerHp}
                  currentCe={battle.playerCe}
                  label={isPvp ? "P1" : "YOU"}
                  isActive={battle.turn === "player"}
                  side="left"
                />
                <BattlerCard
                  char={battle.enemyChar}
                  currentHp={battle.enemyHp}
                  currentCe={battle.enemyCe}
                  label={isPvp ? "P2" : "ENEMY"}
                  isActive={battle.turn === "enemy"}
                  side="right"
                />
              </div>

              {/* Battle log */}
              <div
                className="rounded-lg p-3 mb-5"
                style={{
                  background: "oklch(0.08 0.015 265)",
                  border: "1px solid oklch(0.70 0.22 240 / 0.15)",
                  minHeight: "80px",
                }}
              >
                {battle.log.slice(0, 3).map((entry, i) => (
                  <motion.p
                    key={entry}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1 - i * 0.3, x: 0 }}
                    className="font-exo text-xs mb-1"
                    style={{
                      color:
                        i === 0
                          ? "oklch(0.90 0.01 265)"
                          : "oklch(0.55 0.015 270)",
                    }}
                  >
                    {entry}
                  </motion.p>
                ))}
              </div>

              {/* P1 action buttons */}
              {battle.turn === "player" && (
                <div>
                  <p
                    className="font-cinzel text-[11px] tracking-widest mb-3"
                    style={{ color: "oklch(0.70 0.22 240)" }}
                  >
                    {isPvp ? "— PLAYER 1's TURN —" : "— YOUR TURN —"}
                  </p>
                  <ActionButtons
                    char={battle.playerChar}
                    currentCe={battle.playerCe}
                    isAnimating={isAnimating}
                    onAction={doPlayerAction}
                    prefix="battle"
                  />
                </div>
              )}

              {/* P2 action buttons (PvP) */}
              {isPvp && battle.turn === "enemy" && (
                <div>
                  <p
                    className="font-cinzel text-[11px] tracking-widest mb-3"
                    style={{ color: "oklch(0.75 0.22 150)" }}
                  >
                    — PLAYER 2's TURN —
                  </p>
                  <ActionButtons
                    char={battle.enemyChar}
                    currentCe={battle.enemyCe}
                    isAnimating={isAnimating}
                    onAction={doP2Action}
                    prefix="battle_p2"
                  />
                </div>
              )}

              {/* CPU thinking */}
              {!isPvp && battle.turn === "enemy" && (
                <div>
                  <p
                    className="font-cinzel text-[11px] tracking-widest mb-3"
                    style={{ color: "oklch(0.65 0.22 25)" }}
                  >
                    — ENEMY TURN —
                  </p>
                  <div
                    className="rounded-lg p-4 text-center"
                    style={{
                      background: "oklch(0.10 0.025 265)",
                      border: "1px solid oklch(0.65 0.22 25 / 0.3)",
                    }}
                  >
                    <p
                      className="font-cinzel text-xs"
                      style={{ color: "oklch(0.65 0.22 25)" }}
                    >
                      {battle.enemyChar.name} is choosing...
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* RESULT */}
          {phase === "result" && (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="p-6 flex flex-col items-center justify-center min-h-[500px] text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="mb-6"
              >
                <span
                  className="font-cinzel font-black"
                  style={{
                    fontSize: "6rem",
                    color: won ? "oklch(0.75 0.22 150)" : "oklch(0.65 0.22 25)",
                    textShadow: won
                      ? "0 0 40px oklch(0.75 0.22 150)"
                      : "0 0 40px oklch(0.65 0.22 25)",
                    lineHeight: 1,
                  }}
                >
                  勝
                </span>
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="font-cinzel font-black text-3xl md:text-4xl mb-2"
                style={{
                  color: won ? "oklch(0.75 0.22 150)" : "oklch(0.65 0.22 25)",
                }}
              >
                {isPvp
                  ? won
                    ? "PLAYER 1 WINS!"
                    : "PLAYER 2 WINS!"
                  : won
                    ? "VICTORY!"
                    : "DEFEATED"}
              </motion.h2>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="font-exo text-sm mb-2"
                style={{ color: "oklch(0.65 0.015 270)" }}
              >
                {isPvp
                  ? won
                    ? `${battle?.playerChar.name ?? "Player 1"} reigns supreme!`
                    : `${battle?.enemyChar.name ?? "Player 2"} reigns supreme!`
                  : won
                    ? `${battle?.playerChar.name ?? "You"} reigns supreme!`
                    : `${battle?.enemyChar.name ?? "Enemy"} was too powerful.`}
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="rounded-xl p-6 mb-8 w-full max-w-sm"
                style={{
                  background: "oklch(0.09 0.025 265)",
                  border: "1px solid oklch(0.70 0.22 240 / 0.25)",
                }}
              >
                <p
                  className="font-cinzel text-xs tracking-widest mb-3"
                  style={{ color: "oklch(0.65 0.015 270)" }}
                >
                  BATTLE SUMMARY
                </p>
                <div className="space-y-2">
                  {[
                    { label: "Rounds Survived", val: battle?.round ?? 0 },
                    {
                      label: "Total Damage",
                      val: battle?.totalDamageDealt ?? 0,
                    },
                    { label: "CE Used", val: battle?.ceUsed ?? 0 },
                  ].map((item) => (
                    <div key={item.label} className="flex justify-between">
                      <span
                        className="font-exo text-sm"
                        style={{ color: "oklch(0.65 0.015 270)" }}
                      >
                        {item.label}
                      </span>
                      <span
                        className="font-cinzel text-sm"
                        style={{ color: "oklch(0.70 0.22 240)" }}
                      >
                        {item.val}
                      </span>
                    </div>
                  ))}
                  <div
                    className="h-px"
                    style={{ background: "oklch(0.70 0.22 240 / 0.2)" }}
                  />
                  <div className="flex justify-between">
                    <span
                      className="font-cinzel text-sm"
                      style={{ color: "oklch(0.90 0.01 265)" }}
                    >
                      FINAL SCORE
                    </span>
                    <span
                      className="font-cinzel text-lg font-bold"
                      style={{
                        color: won
                          ? "oklch(0.75 0.22 150)"
                          : "oklch(0.70 0.22 240)",
                      }}
                    >
                      {finalScore.toLocaleString()}
                    </span>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="flex gap-4"
              >
                <button
                  type="button"
                  onClick={resetGame}
                  className="cursed-btn-filled px-8 py-3 rounded-lg font-cinzel text-sm tracking-widest uppercase"
                  data-ocid="battle.play_again_button"
                >
                  PLAY AGAIN
                </button>
                <a
                  href="/"
                  className="cursed-btn px-8 py-3 rounded-lg font-cinzel text-sm tracking-widest uppercase inline-flex items-center"
                  data-ocid="battle.home_link"
                >
                  BACK TO PORTAL
                </a>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function CharacterGrid({
  characters,
  selected,
  onSelect,
  disabledIds,
}: {
  characters: Character[];
  selected: Character | null;
  onSelect: (c: Character) => void;
  disabledIds: string[];
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
      {characters.map((char) => {
        const isDisabled = disabledIds.includes(char.id);
        const isSelected = selected?.id === char.id;
        return (
          <motion.button
            key={char.id}
            type="button"
            onClick={() => !isDisabled && onSelect(char)}
            whileHover={isDisabled ? {} : { y: -6, scale: 1.02 }}
            whileTap={isDisabled ? {} : { scale: 0.97 }}
            className="relative rounded-xl p-4 text-left transition-all"
            style={{
              background: isDisabled
                ? "oklch(0.07 0.015 265)"
                : isSelected
                  ? `${char.color.replace(")", " / 0.15)")}`
                  : "oklch(0.09 0.025 265)",
              border: `2px solid ${isDisabled ? "oklch(0.14 0.02 265)" : isSelected ? char.color : "oklch(0.20 0.04 265)"}`,
              boxShadow:
                !isDisabled && isSelected
                  ? `0 0 24px ${char.color.replace(")", " / 0.4)")}, inset 0 0 20px ${char.color.replace(")", " / 0.08)")}`
                  : "none",
              opacity: isDisabled ? 0.4 : 1,
              cursor: isDisabled ? "not-allowed" : "pointer",
            }}
            data-ocid={`battle.${char.id}.card`}
          >
            {isDisabled && (
              <div
                className="absolute inset-0 rounded-xl flex items-center justify-center z-10"
                style={{ background: "oklch(0.06 0.02 265 / 0.7)" }}
              >
                <span
                  className="font-cinzel text-[10px] tracking-widest"
                  style={{ color: "oklch(0.55 0.015 270)" }}
                >
                  TAKEN
                </span>
              </div>
            )}

            <div
              className="w-full h-20 flex items-center justify-center rounded-lg mb-3 relative overflow-hidden"
              style={{
                background: `radial-gradient(ellipse at center, ${char.color.replace(")", " / 0.12)")}, oklch(0.06 0.02 265))`,
              }}
            >
              <span
                className="font-cinzel font-black select-none"
                style={{
                  fontSize: "3.5rem",
                  color: char.color,
                  textShadow: `0 0 20px ${char.color}, 0 0 40px ${char.color.replace(")", " / 0.5)")}`,
                  lineHeight: 1,
                }}
              >
                {char.kanji}
              </span>
            </div>

            <h3
              className="font-cinzel font-bold text-xs mb-0.5"
              style={{ color: "oklch(0.96 0.01 265)" }}
            >
              {char.name}
            </h3>
            <p
              className="font-exo text-[10px] mb-2"
              style={{ color: char.color }}
            >
              {char.title}
            </p>

            <div className="space-y-1 mb-3">
              {[
                {
                  label: "HP",
                  val: char.hp,
                  max: 130,
                  color: "oklch(0.65 0.22 25)",
                },
                {
                  label: "CE",
                  val: char.ce,
                  max: 110,
                  color: "oklch(0.70 0.22 240)",
                },
                {
                  label: "SPD",
                  val: char.speed,
                  max: 95,
                  color: "oklch(0.75 0.22 150)",
                },
              ].map((stat) => (
                <div key={stat.label}>
                  <div className="flex justify-between mb-0.5">
                    <span
                      className="font-cinzel text-[8px] tracking-widest"
                      style={{ color: "oklch(0.65 0.015 270)" }}
                    >
                      {stat.label}
                    </span>
                    <span
                      className="font-cinzel text-[8px]"
                      style={{ color: stat.color }}
                    >
                      {stat.val}
                    </span>
                  </div>
                  <div
                    className="h-1 rounded-full"
                    style={{ background: "oklch(0.14 0.025 265)" }}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${(stat.val / stat.max) * 100}%`,
                        background: stat.color,
                        boxShadow: `0 0 6px ${stat.color}`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-0.5">
              {char.techniques.map((t) => (
                <div key={t.name} className="flex items-center gap-1">
                  <span
                    className="text-[8px]"
                    style={{
                      color:
                        t.type === "special"
                          ? "oklch(0.75 0.20 290)"
                          : t.type === "defense"
                            ? "oklch(0.70 0.22 240)"
                            : "oklch(0.75 0.22 150)",
                    }}
                  >
                    {t.type === "special"
                      ? "★"
                      : t.type === "defense"
                        ? "◈"
                        : "▶"}
                  </span>
                  <span
                    className="font-exo text-[9px] truncate"
                    style={{ color: "oklch(0.80 0.01 265)" }}
                  >
                    {t.name}
                  </span>
                  {t.cost > 0 && (
                    <span
                      className="font-cinzel text-[7px] ml-auto flex-shrink-0"
                      style={{ color: "oklch(0.70 0.22 240 / 0.7)" }}
                    >
                      {t.cost}CE
                    </span>
                  )}
                </div>
              ))}
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}

function ActionButtons({
  char,
  currentCe,
  isAnimating,
  onAction,
  prefix,
}: {
  char: Character;
  currentCe: number;
  isAnimating: boolean;
  onAction: (techIndex: number | "auto") => void;
  prefix: string;
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <button
        type="button"
        onClick={() => onAction("auto")}
        disabled={isAnimating}
        className="py-3 px-3 rounded-lg font-cinzel text-[10px] tracking-widest uppercase transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        style={{
          background: "oklch(0.12 0.025 265)",
          border: "1px solid oklch(0.40 0.015 265)",
          color: "oklch(0.75 0.01 265)",
        }}
        data-ocid={`${prefix}.auto_button`}
      >
        ⚔️ AUTO
        <span
          className="block text-[9px] mt-0.5"
          style={{ color: "oklch(0.50 0.015 265)" }}
        >
          Free · 3–8 DMG
        </span>
      </button>

      {char.techniques.map((tech, i) => {
        const canUse = currentCe >= tech.cost;
        const isSpecial = tech.type === "special";
        const isDefense = tech.type === "defense";
        const techColor = isSpecial
          ? "oklch(0.70 0.22 290)"
          : isDefense
            ? "oklch(0.70 0.22 240)"
            : char.color;

        return (
          <button
            key={tech.name}
            type="button"
            onClick={() => onAction(i)}
            disabled={!canUse || isAnimating}
            className="py-3 px-3 rounded-lg font-cinzel text-[10px] tracking-widest uppercase transition-all text-left disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: canUse
                ? `${techColor.replace(")", " / 0.12)")}`
                : "oklch(0.10 0.015 265)",
              border: `1px solid ${canUse ? techColor.replace(")", " / 0.5)") : "oklch(0.18 0.02 265)"}`,
              color: canUse ? techColor : "oklch(0.40 0.015 265)",
              boxShadow:
                isSpecial && canUse
                  ? `0 0 12px ${techColor.replace(")", " / 0.3)")}`
                  : undefined,
            }}
            data-ocid={`${prefix}.technique.${i + 1}`}
          >
            {isSpecial ? "★ " : isDefense ? "◈ " : ""}
            {tech.name}
            <span
              className="block text-[9px] mt-0.5"
              style={{ color: "oklch(0.50 0.015 265)" }}
            >
              {tech.cost}CE · {tech.minDmg}–{tech.maxDmg} DMG
              {tech.heals ? ` +${tech.heals}HP` : ""}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function BattlerCard({
  char,
  currentHp,
  currentCe,
  label,
  isActive,
  side,
}: {
  char: Character;
  currentHp: number;
  currentCe: number;
  label: string;
  isActive: boolean;
  side: "left" | "right";
}) {
  const hpPct = (currentHp / char.hp) * 100;
  const cePct = (currentCe / char.ce) * 100;
  const hpColor =
    hpPct > 60
      ? "oklch(0.65 0.22 145)"
      : hpPct > 30
        ? "oklch(0.75 0.22 75)"
        : "oklch(0.65 0.22 25)";

  return (
    <div
      className="rounded-xl p-4 relative overflow-hidden"
      style={{
        background: isActive
          ? `${char.color.replace(")", " / 0.08)")}`
          : "oklch(0.09 0.025 265)",
        border: `1px solid ${isActive ? char.color.replace(")", " / 0.6)") : "oklch(0.16 0.03 265)"}`,
        boxShadow: isActive
          ? `0 0 20px ${char.color.replace(")", " / 0.2)")}`
          : "none",
        transition: "all 0.3s ease",
      }}
    >
      {isActive && (
        <div
          className="absolute top-2 right-2 w-2 h-2 rounded-full"
          style={{
            background: char.color,
            boxShadow: `0 0 8px ${char.color}`,
            animation: "charPulse 1.5s ease-in-out infinite",
          }}
        />
      )}

      <div
        className={`flex ${side === "right" ? "flex-row-reverse" : "flex-row"} items-center gap-3 mb-3`}
      >
        <div
          className="w-14 h-14 flex items-center justify-center rounded-lg flex-shrink-0"
          style={{
            background: `radial-gradient(ellipse at center, ${char.color.replace(")", " / 0.18)")}, oklch(0.06 0.02 265))`,
            border: `1px solid ${char.color.replace(")", " / 0.3)")}`,
          }}
        >
          <span
            className="font-cinzel font-black text-2xl"
            style={{ color: char.color, textShadow: `0 0 12px ${char.color}` }}
          >
            {char.kanji}
          </span>
        </div>
        <div className={side === "right" ? "text-right" : ""}>
          <p
            className="font-cinzel text-[9px] tracking-widest mb-0.5"
            style={{ color: char.color }}
          >
            {label}
          </p>
          <p
            className="font-cinzel font-bold text-xs"
            style={{ color: "oklch(0.92 0.01 265)" }}
          >
            {char.name}
          </p>
        </div>
      </div>

      <div className="mb-2">
        <div className="flex justify-between mb-1">
          <span
            className="font-cinzel text-[9px] tracking-widest"
            style={{ color: "oklch(0.65 0.015 270)" }}
          >
            HP
          </span>
          <span className="font-cinzel text-[9px]" style={{ color: hpColor }}>
            {currentHp}/{char.hp}
          </span>
        </div>
        <div
          className="h-2 rounded-full overflow-hidden"
          style={{ background: "oklch(0.14 0.025 265)" }}
        >
          <motion.div
            className="h-full rounded-full"
            animate={{ width: `${hpPct}%` }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            style={{
              background: `linear-gradient(90deg, ${hpColor}, ${hpColor.replace(")", " / 0.7)")})`,
              boxShadow: `0 0 8px ${hpColor}`,
            }}
          />
        </div>
      </div>

      <div>
        <div className="flex justify-between mb-1">
          <span
            className="font-cinzel text-[9px] tracking-widest"
            style={{ color: "oklch(0.65 0.015 270)" }}
          >
            CE
          </span>
          <span
            className="font-cinzel text-[9px]"
            style={{ color: "oklch(0.70 0.22 240)" }}
          >
            {currentCe}/{char.ce}
          </span>
        </div>
        <div
          className="h-2 rounded-full overflow-hidden"
          style={{ background: "oklch(0.14 0.025 265)" }}
        >
          <motion.div
            className="h-full rounded-full"
            animate={{ width: `${cePct}%` }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            style={{
              background:
                "linear-gradient(90deg, oklch(0.70 0.22 240), oklch(0.60 0.22 260))",
              boxShadow: "0 0 8px oklch(0.70 0.22 240 / 0.6)",
            }}
          />
        </div>
      </div>
    </div>
  );
}
