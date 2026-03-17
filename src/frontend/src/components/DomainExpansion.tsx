import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";

interface Props {
  gameId?: string;
  onComplete: () => void;
}

const DOMAIN_CONFIG: Record<
  string,
  {
    name: string;
    kanji: string;
    bg: string;
    ringColor: string;
    sparkColor: string;
    glowColor: string;
    lineColor: string;
    variant:
      | "rings"
      | "slash"
      | "shadow"
      | "volcano"
      | "void"
      | "meteor"
      | "miasma"
      | "swap"
      | "hollow"
      | "sixeyes"
      | "horror"
      | "survival"
      | "basketball";
  }
> = {
  snake: {
    name: "INFINITE VOID",
    kanji: "無量空処",
    bg: "oklch(0.06 0.03 240)",
    ringColor: "oklch(0.70 0.22 240)",
    sparkColor: "oklch(0.70 0.22 240)",
    glowColor: "oklch(0.70 0.22 240 / 0.3)",
    lineColor: "oklch(0.70 0.22 240)",
    variant: "void",
  },
  tictactoe: {
    name: "MALEVOLENT SHRINE",
    kanji: "伏魔御廚子",
    bg: "oklch(0.05 0.03 25)",
    ringColor: "oklch(0.65 0.22 25)",
    sparkColor: "oklch(0.75 0.20 30)",
    glowColor: "oklch(0.65 0.22 25 / 0.4)",
    lineColor: "oklch(0.65 0.22 25)",
    variant: "slash",
  },
  memory: {
    name: "CHIMERA SHADOW GARDEN",
    kanji: "嵌合暗翳庭",
    bg: "oklch(0.04 0.02 280)",
    ringColor: "oklch(0.55 0.22 290)",
    sparkColor: "oklch(0.65 0.22 290)",
    glowColor: "oklch(0.55 0.22 290 / 0.4)",
    lineColor: "oklch(0.55 0.22 290)",
    variant: "shadow",
  },
  breakout: {
    name: "COFFIN OF THE IRON MOUNTAIN",
    kanji: "蓋棺鉄囲山",
    bg: "oklch(0.06 0.04 50)",
    ringColor: "oklch(0.70 0.22 50)",
    sparkColor: "oklch(0.80 0.20 55)",
    glowColor: "oklch(0.70 0.22 50 / 0.4)",
    lineColor: "oklch(0.70 0.22 50)",
    variant: "volcano",
  },
  tetris: {
    name: "SELF-EMBODIMENT OF PERFECTION",
    kanji: "我が貌こそ完璧",
    bg: "oklch(0.05 0.03 195)",
    ringColor: "oklch(0.65 0.18 195)",
    sparkColor: "oklch(0.75 0.18 195)",
    glowColor: "oklch(0.65 0.18 195 / 0.4)",
    lineColor: "oklch(0.65 0.18 195)",
    variant: "rings",
  },
  pong: {
    name: "IDLE DEATH GAMBLE",
    kanji: "蕩者悲歌",
    bg: "oklch(0.05 0.02 90)",
    ringColor: "oklch(0.72 0.16 97)",
    sparkColor: "oklch(0.82 0.18 97)",
    glowColor: "oklch(0.72 0.16 97 / 0.4)",
    lineColor: "oklch(0.72 0.16 97)",
    variant: "swap",
  },
  spaceinvaders: {
    name: "TRUE AND UTTER TRASH",
    kanji: "真人悪臭",
    bg: "oklch(0.04 0.03 150)",
    ringColor: "oklch(0.65 0.22 150)",
    sparkColor: "oklch(0.75 0.22 150)",
    glowColor: "oklch(0.65 0.22 150 / 0.4)",
    lineColor: "oklch(0.65 0.22 150)",
    variant: "miasma",
  },
  flappy: {
    name: "TIME CELL MOON PALACE",
    kanji: "嘉伐刻月宮",
    bg: "oklch(0.05 0.04 270)",
    ringColor: "oklch(0.70 0.22 240)",
    sparkColor: "oklch(0.65 0.22 290)",
    glowColor: "oklch(0.65 0.22 290 / 0.4)",
    lineColor: "oklch(0.65 0.22 290)",
    variant: "hollow",
  },
  "2048": {
    name: "HOLLOW PURPLE",
    kanji: "虚式・茈",
    bg: "oklch(0.05 0.04 270)",
    ringColor: "oklch(0.65 0.22 290)",
    sparkColor: "oklch(0.70 0.22 240)",
    glowColor: "oklch(0.65 0.22 290 / 0.5)",
    lineColor: "oklch(0.65 0.22 290)",
    variant: "hollow",
  },
  whackmole: {
    name: "MAXIMUM: METEOR",
    kanji: "極ノ番・隕",
    bg: "oklch(0.06 0.04 40)",
    ringColor: "oklch(0.72 0.20 40)",
    sparkColor: "oklch(0.82 0.22 45)",
    glowColor: "oklch(0.72 0.20 40 / 0.5)",
    lineColor: "oklch(0.72 0.20 40)",
    variant: "meteor",
  },
  simon: {
    name: "SIX EYES AWAKENED",
    kanji: "六眼覚醒",
    bg: "oklch(0.04 0.02 240)",
    ringColor: "oklch(0.90 0.05 240)",
    sparkColor: "oklch(0.95 0.04 240)",
    glowColor: "oklch(0.70 0.22 240 / 0.5)",
    lineColor: "oklch(0.85 0.10 240)",
    variant: "sixeyes",
  },
  survival: {
    name: "DOMAIN OF ENDLESS CURSES",
    kanji: "無限呪域",
    bg: "oklch(0.04 0.03 255)",
    ringColor: "oklch(0.70 0.22 240)",
    sparkColor: "oklch(0.80 0.22 240)",
    glowColor: "oklch(0.70 0.22 240 / 0.4)",
    lineColor: "oklch(0.65 0.22 290)",
    variant: "void",
  },
  basketball: {
    name: "UNLIMITED VOID",
    kanji: "無量空処",
    bg: "oklch(0.03 0.01 240)",
    ringColor: "oklch(0.68 0.22 240)",
    sparkColor: "oklch(0.80 0.22 240)",
    glowColor: "oklch(0.68 0.22 240 / 0.4)",
    lineColor: "oklch(0.68 0.22 240)",
    variant: "basketball",
  },
  horror: {
    name: "UNVEIL: BLACK FLASH",
    kanji: "黒閃解放",
    bg: "oklch(0.03 0.01 25)",
    ringColor: "oklch(0.55 0.22 25)",
    sparkColor: "oklch(0.65 0.22 25)",
    glowColor: "oklch(0.45 0.22 25 / 0.5)",
    lineColor: "oklch(0.55 0.22 25)",
    variant: "horror",
  },
};

const DEFAULT_CONFIG = DOMAIN_CONFIG.snake;

const SPARKS = Array.from({ length: 14 }, (_, i) => ({
  id: i,
  angle: (i / 14) * 360,
  length: 80 + (i % 3) * 60,
  delay: 0.3 + (i % 5) * 0.1,
}));

const SLASH_ANGLES = [0, 45, 90, 135];
const VOLCANO_COLS = ["a", "b", "c", "d", "e", "f", "g", "h"];
const EYE_KEYS = ["e1", "e2", "e3", "e4", "e5", "e6"];
const SIX_EYE_ANGLES = [0, 60, 120, 180, 240, 300];

export default function DomainExpansion({ gameId, onComplete }: Props) {
  const [phase, setPhase] = useState<"enter" | "exit">("enter");
  const cfg = (gameId ? DOMAIN_CONFIG[gameId] : undefined) ?? DEFAULT_CONFIG;

  useEffect(() => {
    const exitTimer = setTimeout(() => setPhase("exit"), 2200);
    const doneTimer = setTimeout(() => onComplete(), 3000);
    return () => {
      clearTimeout(exitTimer);
      clearTimeout(doneTimer);
    };
  }, [onComplete]);

  return (
    <AnimatePresence>
      {phase === "enter" && (
        <motion.div
          key="domain-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.04 }}
          transition={{ duration: 0.5 }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
            background: cfg.bg,
          }}
        >
          {/* Expanding void circle */}
          <motion.div
            initial={{ scale: 0, borderRadius: "50%" }}
            animate={{ scale: 7, borderRadius: "0%" }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            style={{
              position: "absolute",
              width: "40vmax",
              height: "40vmax",
              background: `radial-gradient(circle, ${cfg.bg.replace(")", " / 0.9)").replace("oklch(", "oklch(")} 0%, ${cfg.bg} 70%)`,
            }}
          />

          {/* Slash variant: diagonal cuts */}
          {cfg.variant === "slash" &&
            SLASH_ANGLES.map((a) => (
              <motion.div
                key={a}
                initial={{ scaleX: 0, opacity: 0 }}
                animate={{ scaleX: 1, opacity: [0, 0.8, 0.3] }}
                transition={{ duration: 0.4, delay: 0.3 + a / 400 }}
                style={{
                  position: "absolute",
                  width: "120vmax",
                  height: "3px",
                  background: `linear-gradient(90deg, transparent, ${cfg.ringColor}, transparent)`,
                  transform: `rotate(${a}deg)`,
                  boxShadow: `0 0 12px ${cfg.ringColor}`,
                }}
              />
            ))}

          {/* Shadow variant */}
          {cfg.variant === "shadow" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.5, 0.3] }}
              transition={{ duration: 1, delay: 0.3 }}
              style={{
                position: "absolute",
                inset: 0,
                background: `radial-gradient(ellipse 80% 60% at 50% 100%, ${cfg.glowColor} 0%, transparent 70%)`,
              }}
            />
          )}

          {/* Volcano variant: rising fire pillars */}
          {cfg.variant === "volcano" &&
            VOLCANO_COLS.map((col, i) => (
              <motion.div
                key={col}
                initial={{ y: "60vh", opacity: 0, scale: 0 }}
                animate={{ y: "-20vh", opacity: [0, 1, 0], scale: [0, 1.5, 0] }}
                transition={{
                  duration: 1.2,
                  delay: 0.2 + i * 0.12,
                  ease: "easeOut",
                }}
                style={{
                  position: "absolute",
                  left: `${10 + i * 11}%`,
                  width: "6px",
                  height: "60px",
                  background: `linear-gradient(to top, ${cfg.sparkColor}, transparent)`,
                  boxShadow: `0 0 10px ${cfg.sparkColor}`,
                  borderRadius: "3px",
                }}
              />
            ))}

          {/* Miasma variant */}
          {cfg.variant === "miasma" && (
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1.5, opacity: [0, 0.4, 0.2] }}
              transition={{ duration: 1.5, delay: 0.3 }}
              style={{
                position: "absolute",
                inset: 0,
                background: `radial-gradient(ellipse at center, ${cfg.glowColor} 0%, transparent 65%)`,
              }}
            />
          )}

          {/* Hollow Purple variant: two orbs converging */}
          {cfg.variant === "hollow" && (
            <>
              <motion.div
                initial={{ x: "-40vw", opacity: 0 }}
                animate={{ x: "0vw", opacity: [0, 0.7, 0.3] }}
                transition={{ duration: 0.8, delay: 0.4 }}
                style={{
                  position: "absolute",
                  width: "50vw",
                  height: "50vw",
                  borderRadius: "50%",
                  background:
                    "radial-gradient(circle, oklch(0.70 0.22 240 / 0.4) 0%, transparent 70%)",
                  filter: "blur(20px)",
                }}
              />
              <motion.div
                initial={{ x: "40vw", opacity: 0 }}
                animate={{ x: "0vw", opacity: [0, 0.7, 0.3] }}
                transition={{ duration: 0.8, delay: 0.4 }}
                style={{
                  position: "absolute",
                  width: "50vw",
                  height: "50vw",
                  borderRadius: "50%",
                  background:
                    "radial-gradient(circle, oklch(0.65 0.22 290 / 0.4) 0%, transparent 70%)",
                  filter: "blur(20px)",
                }}
              />
            </>
          )}

          {/* Six Eyes variant: radial beams */}
          {cfg.variant === "sixeyes" &&
            SIX_EYE_ANGLES.map((angle) => (
              <motion.div
                key={angle}
                initial={{ scaleX: 0, opacity: 0 }}
                animate={{ scaleX: 1, opacity: [0, 0.9, 0.4] }}
                transition={{ duration: 0.6, delay: 0.5 + angle / 1200 }}
                style={{
                  position: "absolute",
                  width: "100vmax",
                  height: "1px",
                  background: `linear-gradient(90deg, transparent, ${cfg.ringColor}, transparent)`,
                  transform: `rotate(${angle}deg)`,
                  boxShadow: `0 0 8px ${cfg.ringColor}`,
                }}
              />
            ))}

          {/* Horror variant: glowing eyes */}
          {cfg.variant === "horror" &&
            EYE_KEYS.map((key, i) => (
              <motion.div
                key={key}
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 0.3, 1, 0] }}
                transition={{ duration: 1.5, delay: 0.3 + i * 0.2 }}
                style={{
                  position: "absolute",
                  left: `${10 + i * 15}%`,
                  top: `${20 + (i % 3) * 20}%`,
                  width: "8px",
                  height: "5px",
                  borderRadius: "50%",
                  background: cfg.sparkColor,
                  boxShadow: `0 0 12px ${cfg.sparkColor}, 0 0 30px ${cfg.glowColor}`,
                }}
              />
            ))}

          {/* Meteor variant: falling orb */}
          {cfg.variant === "meteor" && (
            <motion.div
              initial={{ y: "-50vh", scale: 0.2, opacity: 0 }}
              animate={{ y: "0", scale: [0.2, 1.5, 1], opacity: [0, 1, 0.8] }}
              transition={{ duration: 0.8, delay: 0.3, ease: "easeIn" }}
              style={{
                position: "absolute",
                width: "20vmin",
                height: "20vmin",
                borderRadius: "50%",
                background: `radial-gradient(circle, ${cfg.sparkColor} 0%, ${cfg.ringColor} 40%, transparent 70%)`,
                boxShadow: `0 0 40px ${cfg.ringColor}, 0 0 80px ${cfg.glowColor}`,
              }}
            />
          )}

          {/* Basketball variant: infinite void with stars rushing inward */}
          {cfg.variant === "basketball" && (
            <>
              {Array.from({ length: 30 }, (_, i) => {
                const angle = (i / 30) * Math.PI * 2;
                const dist = 120 + (i % 5) * 60;
                const starKey = `bball-star-${i}`;
                return (
                  <motion.div
                    key={starKey}
                    initial={{
                      x: Math.cos(angle) * dist,
                      y: Math.sin(angle) * dist,
                      opacity: 0.9,
                      scale: 1.2,
                    }}
                    animate={{
                      x: 0,
                      y: 0,
                      opacity: 0,
                      scale: 0,
                    }}
                    transition={{
                      duration: 1.4,
                      delay: 0.1 + (i % 6) * 0.08,
                      ease: "easeIn",
                    }}
                    style={{
                      position: "absolute",
                      width: "3px",
                      height: "3px",
                      borderRadius: "50%",
                      background: cfg.sparkColor,
                      boxShadow: `0 0 6px ${cfg.sparkColor}`,
                    }}
                  />
                );
              })}
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: [0, 0.6, 0.3], scale: [0.5, 1.2, 1] }}
                transition={{ duration: 1, delay: 0.5 }}
                style={{
                  position: "absolute",
                  width: "60vmin",
                  height: "60vmin",
                  borderRadius: "50%",
                  background: `radial-gradient(circle, transparent 30%, ${cfg.glowColor} 70%, transparent 100%)`,
                  boxShadow: `inset 0 0 40px ${cfg.ringColor}`,
                }}
              />
            </>
          )}

          {/* Rotating rings */}
          {[1, 2, 3, 4].map((ring) => (
            <motion.div
              key={ring}
              initial={{ scale: 0, opacity: 0, rotate: 0 }}
              animate={{
                scale: ring * 0.6,
                opacity: [0, 0.9, 0.5],
                rotate: ring % 2 === 0 ? 360 : -360,
              }}
              transition={{
                duration: 1.8,
                delay: 0.2 + ring * 0.1,
                ease: "easeOut",
                rotate: {
                  duration: 3,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "linear",
                },
              }}
              style={{
                position: "absolute",
                width: "55vmin",
                height: "55vmin",
                borderRadius: "50%",
                border: `${ring === 1 ? 3 : 1.5}px solid ${cfg.ringColor}`,
                boxShadow: `0 0 20px ${cfg.ringColor}, 0 0 60px ${cfg.glowColor}`,
              }}
            />
          ))}

          {/* Cross lines */}
          {[0, 60, 120].map((angle) => (
            <motion.div
              key={angle}
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 0.35 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              style={{
                position: "absolute",
                width: "80vmin",
                height: "1px",
                background: `linear-gradient(90deg, transparent, ${cfg.lineColor}, transparent)`,
                transform: `rotate(${angle}deg)`,
                boxShadow: `0 0 8px ${cfg.lineColor}`,
              }}
            />
          ))}

          {/* Sparks */}
          {SPARKS.map((spark) => (
            <motion.div
              key={spark.id}
              initial={{ scale: 0, opacity: 0, x: 0, y: 0 }}
              animate={{
                scale: [0, 1, 0],
                opacity: [0, 1, 0],
                x: Math.cos((spark.angle * Math.PI) / 180) * spark.length,
                y: Math.sin((spark.angle * Math.PI) / 180) * spark.length,
              }}
              transition={{
                duration: 0.8,
                delay: spark.delay,
                ease: "easeOut",
              }}
              style={{
                position: "absolute",
                width: "4px",
                height: "4px",
                borderRadius: "50%",
                background: cfg.sparkColor,
                boxShadow: `0 0 6px ${cfg.sparkColor}, 0 0 12px ${cfg.glowColor}`,
              }}
            />
          ))}

          {/* Central kanji + title */}
          <motion.div
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: [0.4, 1.15, 1.0], opacity: [0, 1, 1] }}
            transition={{ duration: 0.9, delay: 0.4, ease: "easeOut" }}
            style={{
              position: "relative",
              zIndex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "16px",
            }}
          >
            <div
              style={{
                fontSize: "clamp(2.5rem, 9vmin, 6.5rem)",
                fontWeight: 900,
                letterSpacing: "0.12em",
                color: "oklch(0.95 0.01 265)",
                textShadow: `0 0 20px ${cfg.ringColor}, 0 0 60px ${cfg.glowColor}`,
                lineHeight: 1,
                textAlign: "center",
              }}
            >
              {cfg.kanji}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 10, letterSpacing: "0.8em" }}
              animate={{ opacity: 1, y: 0, letterSpacing: "0.3em" }}
              transition={{ duration: 0.7, delay: 0.9 }}
              style={{
                fontFamily: "'Cinzel', serif",
                fontSize: "clamp(0.65rem, 2.2vmin, 1.2rem)",
                fontWeight: 700,
                color: cfg.ringColor,
                textShadow: `0 0 10px ${cfg.ringColor}`,
                textTransform: "uppercase",
                whiteSpace: "nowrap",
                textAlign: "center",
                padding: "0 1rem",
              }}
            >
              {cfg.name}
            </motion.div>
          </motion.div>

          {/* Full-screen glow pulse */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.15, 0] }}
            transition={{ duration: 1.5, delay: 0.5, repeat: 1 }}
            style={{
              position: "absolute",
              inset: 0,
              background: `radial-gradient(circle at center, ${cfg.glowColor} 0%, transparent 70%)`,
              pointerEvents: "none",
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
