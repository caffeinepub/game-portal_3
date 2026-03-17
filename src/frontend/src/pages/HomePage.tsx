import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { useAllGameScores } from "@/hooks/useQueries";
import { useNavigate } from "@tanstack/react-router";
import { ChevronRight, Star, Trophy, Zap } from "lucide-react";
import { motion } from "motion/react";

const GAMES = [
  {
    id: "snake",
    title: "SNAKE",
    description:
      "Navigate the neon serpent through the grid. Eat food, grow longer, don't hit the walls!",
    image: "/assets/generated/game-snake.dim_400x240.jpg",
    tag: "CLASSIC",
    tagColor: "neon-green",
  },
  {
    id: "tictactoe",
    title: "TIC-TAC-TOE",
    description:
      "Challenge the AI in this timeless strategy game. Get three in a row to win!",
    image: "/assets/generated/game-tictactoe.dim_400x240.jpg",
    tag: "STRATEGY",
    tagColor: "neon-cyan",
  },
  {
    id: "memory",
    title: "MEMORY MATCH",
    description:
      "Flip the neon cards and find matching pairs. Test your memory and beat the clock!",
    image: "/assets/generated/game-memory.dim_400x240.jpg",
    tag: "PUZZLE",
    tagColor: "neon-purple",
  },
  {
    id: "breakout",
    title: "BREAKOUT",
    description:
      "Smash through neon bricks with your laser paddle. Clear the board and survive!",
    image: "/assets/generated/game-breakout.dim_400x240.jpg",
    tag: "ACTION",
    tagColor: "neon-magenta",
  },
  {
    id: "tetris",
    title: "TETRIS",
    description:
      "Stack falling blocks and clear lines in the ultimate puzzle classic. How many lines can you clear?",
    image: "/assets/generated/game-tetris.dim_400x240.jpg",
    tag: "CLASSIC",
    tagColor: "neon-yellow",
  },
  {
    id: "pong",
    title: "PONG",
    description:
      "Face off against the AI in this neon paddle classic. Return volleys and outlast your opponent!",
    image: "/assets/generated/game-pong.dim_400x240.jpg",
    tag: "CLASSIC",
    tagColor: "neon-green",
  },
  {
    id: "spaceinvaders",
    title: "SPACE INVADERS",
    description:
      "Defend Earth from waves of descending aliens. Shoot fast, dodge bullets, survive as long as you can!",
    image: "/assets/generated/game-spaceinvaders.dim_400x240.jpg",
    tag: "ACTION",
    tagColor: "neon-magenta",
  },
  {
    id: "flappy",
    title: "FLAPPY BIRD",
    description:
      "Tap to flap through neon pipe gaps. How far can you go without crashing?",
    image: "/assets/generated/game-flappy.dim_400x240.jpg",
    tag: "ACTION",
    tagColor: "neon-cyan",
  },
  {
    id: "2048",
    title: "2048",
    description:
      "Slide and merge neon tiles to reach 2048. A simple concept with endlessly deep strategy.",
    image: "/assets/generated/game-2048.dim_400x240.jpg",
    tag: "PUZZLE",
    tagColor: "neon-purple",
  },
  {
    id: "whackmole",
    title: "WHACK-A-MOLE",
    description:
      "Moles are popping up everywhere! Smash as many as you can in 30 seconds.",
    image: "/assets/generated/game-whackmole.dim_400x240.jpg",
    tag: "ARCADE",
    tagColor: "neon-yellow",
  },
  {
    id: "simon",
    title: "SIMON SAYS",
    description:
      "Watch the neon sequence and repeat it back. Each round gets longer -- how far can your memory take you?",
    image: "/assets/generated/game-simon.dim_400x240.jpg",
    tag: "MEMORY",
    tagColor: "neon-green",
  },
];

const NEWEST_ARRIVALS = [
  {
    emoji: "🏓",
    title: "Pong Neon",
    description: "Classic paddle vs AI with glowing ball physics",
    badge: "NEW",
  },
  {
    emoji: "👾",
    title: "Space Invaders",
    description: "Waves of alien invaders descend — shoot them all!",
    badge: "NEW",
  },
  {
    emoji: "🐦",
    title: "Flappy Bird",
    description: "Tap through neon pipe gaps and beat your high score",
    badge: "NEW",
  },
];

const TAG_COLOR_MAP: Record<string, { text: string; border: string }> = {
  "neon-green": {
    text: "oklch(0.86 0.28 135)",
    border: "oklch(0.86 0.28 135 / 0.5)",
  },
  "neon-cyan": {
    text: "oklch(0.84 0.17 200)",
    border: "oklch(0.84 0.17 200 / 0.5)",
  },
  "neon-purple": {
    text: "oklch(0.65 0.24 290)",
    border: "oklch(0.65 0.24 290 / 0.5)",
  },
  "neon-magenta": {
    text: "oklch(0.63 0.28 315)",
    border: "oklch(0.63 0.28 315 / 0.5)",
  },
  "neon-yellow": {
    text: "oklch(0.92 0.20 97)",
    border: "oklch(0.92 0.20 97 / 0.5)",
  },
};

export default function HomePage() {
  const navigate = useNavigate();
  const { data: allScores } = useAllGameScores();

  const topScorers: Array<{
    rank: number;
    name: string;
    game: string;
    score: number;
  }> = [];
  if (allScores) {
    for (const [game, scores] of allScores) {
      for (const s of scores.slice(0, 3)) {
        topScorers.push({
          rank: 0,
          name: s.playerName,
          game,
          score: Number(s.score),
        });
      }
    }
    topScorers.sort((a, b) => b.score - a.score);
    topScorers.slice(0, 5).forEach((s, i) => {
      s.rank = i + 1;
    });
  }

  const displayScorers =
    topScorers.length > 0
      ? topScorers.slice(0, 5)
      : [
          { rank: 1, name: "CYBERKING", game: "Breakout", score: 98400 },
          { rank: 2, name: "NEON_GHOST", game: "Snake", score: 84200 },
          { rank: 3, name: "PIXEL_ACE", game: "Memory Match", score: 72100 },
          { rank: 4, name: "ARCADE_X", game: "Tic-Tac-Toe", score: 65300 },
          { rank: 5, name: "RETRO_9000", game: "Breakout", score: 58700 },
        ];

  return (
    <div className="min-h-screen">
      <Header />

      {/* Hero Section */}
      <section
        className="relative overflow-hidden"
        style={{
          minHeight: "520px",
          background:
            "linear-gradient(135deg, oklch(0.09 0.008 265) 0%, oklch(0.11 0.04 290) 50%, oklch(0.09 0.008 265) 100%)",
        }}
      >
        <div className="absolute inset-0 perspective-grid opacity-40" />
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at center, transparent 40%, oklch(0.09 0.008 265) 100%)",
          }}
        />

        <div
          className="absolute top-16 left-12 text-4xl animate-float"
          style={{ animationDelay: "0s", opacity: 0.6 }}
        >
          &#127918;
        </div>
        <div
          className="absolute top-24 right-16 text-3xl animate-float"
          style={{ animationDelay: "0.5s", opacity: 0.5 }}
        >
          &#128126;
        </div>
        <div
          className="absolute bottom-20 left-20 text-2xl animate-float"
          style={{ animationDelay: "1s", opacity: 0.5 }}
        >
          &#128377;
        </div>
        <div
          className="absolute bottom-24 right-24 text-3xl animate-float"
          style={{ animationDelay: "1.5s", opacity: 0.4 }}
        >
          &#9889;
        </div>
        <div
          className="absolute top-1/2 left-8 text-2xl animate-float"
          style={{ animationDelay: "0.8s", opacity: 0.4 }}
        >
          &#128013;
        </div>
        <div
          className="absolute top-1/3 right-8 text-2xl animate-float"
          style={{ animationDelay: "1.2s", opacity: 0.4 }}
        >
          &#127942;
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 py-24 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border mb-6"
              style={{
                borderColor: "oklch(0.84 0.17 200 / 0.4)",
                background: "oklch(0.84 0.17 200 / 0.05)",
              }}
            >
              <Zap
                className="w-4 h-4"
                style={{ color: "oklch(0.84 0.17 200)" }}
              />
              <span
                className="font-orbitron text-xs tracking-widest"
                style={{ color: "oklch(0.84 0.17 200)" }}
              >
                ULTIMATE ARCADE EXPERIENCE
              </span>
            </div>

            <h1 className="font-orbitron font-black text-5xl md:text-7xl mb-6 leading-tight">
              <span className="neon-cyan-text">PLAY</span>{" "}
              <span style={{ color: "oklch(0.93 0.01 275)" }}>THE</span>{" "}
              <span className="neon-magenta-text">BEST</span>
              <br />
              <span style={{ color: "oklch(0.93 0.01 275)" }}>
                ARCADE GAMES
              </span>
            </h1>

            <p
              className="text-lg mb-10 max-w-xl mx-auto"
              style={{ color: "oklch(0.72 0.015 280)" }}
            >
              11 classic games reimagined with neon aesthetics. Compete on the
              global leaderboard and prove you are the ultimate arcade champion.
            </p>

            <button
              type="button"
              onClick={() =>
                document
                  .getElementById("games-section")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
              className="neon-btn-filled px-10 py-4 rounded-lg font-orbitron text-sm tracking-widest uppercase inline-flex items-center gap-2"
              data-ocid="hero.primary_button"
            >
              START PLAYING <ChevronRight className="w-4 h-4" />
            </button>
          </motion.div>
        </div>
      </section>

      {/* Featured Games */}
      <section id="games-section" className="max-w-7xl mx-auto px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="text-center mb-12">
            <h2 className="font-orbitron font-bold text-3xl md:text-4xl neon-cyan-text">
              FEATURED GAMES
            </h2>
            <div
              className="mt-3 w-24 h-px mx-auto"
              style={{
                background:
                  "linear-gradient(90deg, transparent, oklch(0.84 0.17 200), transparent)",
              }}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {GAMES.map((game, i) => {
              const tagColors =
                TAG_COLOR_MAP[game.tagColor] ?? TAG_COLOR_MAP["neon-cyan"];
              return (
                <motion.div
                  key={game.id}
                  className="neon-card rounded-lg overflow-hidden group cursor-pointer"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: (i % 4) * 0.1 }}
                  whileHover={{ y: -4 }}
                  data-ocid={`games.item.${i + 1}`}
                >
                  <div className="relative overflow-hidden">
                    <img
                      src={game.image}
                      alt={game.title}
                      className="w-full h-40 object-cover transition-transform duration-300 group-hover:scale-105"
                      onError={(e) => {
                        const target = e.currentTarget;
                        target.style.display = "none";
                        const next =
                          target.nextElementSibling as HTMLElement | null;
                        if (next) next.style.display = "flex";
                      }}
                    />
                    <div
                      className="w-full h-40 items-center justify-center"
                      style={{
                        display: "none",
                        background:
                          "linear-gradient(135deg, oklch(0.12 0.04 290), oklch(0.09 0.008 265))",
                      }}
                    >
                      <span style={{ fontSize: "2.5rem" }}>🎮</span>
                    </div>
                    <div className="absolute top-2 left-2">
                      <span
                        className="font-orbitron text-[10px] px-2 py-0.5 rounded tracking-widest"
                        style={{
                          background: "oklch(0.09 0.008 265 / 0.8)",
                          color: tagColors.text,
                          border: `1px solid ${tagColors.border}`,
                        }}
                      >
                        {game.tag}
                      </span>
                    </div>
                  </div>

                  <div className="p-4">
                    <h3
                      className="font-orbitron font-bold text-sm mb-2"
                      style={{ color: "oklch(0.93 0.01 275)" }}
                    >
                      {game.title}
                    </h3>
                    <p
                      className="text-xs mb-4 leading-relaxed"
                      style={{ color: "oklch(0.72 0.015 280)" }}
                    >
                      {game.description}
                    </p>
                    <button
                      type="button"
                      onClick={() =>
                        navigate({
                          to: "/game/$gameId",
                          params: { gameId: game.id },
                        })
                      }
                      className="w-full py-2 rounded neon-btn-filled-cyan font-orbitron text-xs tracking-widest"
                      data-ocid="games.primary_button"
                    >
                      PLAY NOW
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </section>

      {/* Stats Bar */}
      <div
        className="border-y border-border py-8"
        style={{ background: "oklch(0.10 0.006 270)" }}
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-3 gap-8 text-center">
            {[
              { value: "11", label: "GAMES" },
              { value: "Inf", label: "HOURS OF FUN" },
              { value: "#1", label: "ARCADE" },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="font-orbitron text-3xl font-black neon-cyan-text">
                  {stat.value}
                </p>
                <p
                  className="font-orbitron text-xs tracking-widest mt-1"
                  style={{ color: "oklch(0.72 0.015 280)" }}
                >
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Split: Top Scorers + Newest Arrivals */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <Trophy
                className="w-6 h-6"
                style={{ color: "var(--neon-yellow)" }}
              />
              <h2 className="font-orbitron font-bold text-2xl neon-cyan-text">
                TOP SCORERS
              </h2>
            </div>
            <div
              className="neon-card rounded-lg overflow-hidden"
              data-ocid="leaderboard.table"
            >
              <div className="grid grid-cols-4 px-4 py-3 border-b border-border">
                {["RANK", "PLAYER", "GAME", "SCORE"].map((h) => (
                  <span
                    key={h}
                    className="font-orbitron text-[10px] tracking-widest"
                    style={{ color: "oklch(0.84 0.17 200)" }}
                  >
                    {h}
                  </span>
                ))}
              </div>
              {displayScorers.map((s, i) => (
                <div
                  key={`scorer-${s.rank}-${s.name}`}
                  className="grid grid-cols-4 px-4 py-3 border-b border-border last:border-0 hover:bg-white/5 transition-colors"
                  data-ocid={`leaderboard.item.${i + 1}`}
                >
                  <span
                    className="font-orbitron text-sm font-bold"
                    style={{
                      color:
                        i === 0
                          ? "oklch(0.92 0.20 97)"
                          : i === 1
                            ? "oklch(0.72 0.015 280)"
                            : i === 2
                              ? "oklch(0.75 0.12 50)"
                              : "oklch(0.72 0.015 280)",
                    }}
                  >
                    #{s.rank}
                  </span>
                  <span
                    className="text-sm truncate"
                    style={{ color: "oklch(0.93 0.01 275)" }}
                  >
                    {s.name}
                  </span>
                  <span
                    className="text-xs truncate"
                    style={{ color: "oklch(0.72 0.015 280)" }}
                  >
                    {s.game}
                  </span>
                  <span
                    className="font-mono-tech text-sm"
                    style={{ color: "oklch(0.84 0.17 200)" }}
                  >
                    {s.score.toLocaleString()}
                  </span>
                </div>
              ))}
              {displayScorers.length === 0 && (
                <div
                  className="px-4 py-8 text-center"
                  data-ocid="leaderboard.empty_state"
                >
                  <p
                    className="text-sm"
                    style={{ color: "oklch(0.72 0.015 280)" }}
                  >
                    No scores yet. Be the first!
                  </p>
                </div>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <Star
                className="w-6 h-6"
                style={{ color: "var(--neon-magenta)" }}
              />
              <h2 className="font-orbitron font-bold text-2xl neon-magenta-text">
                NEWEST ARRIVALS
              </h2>
            </div>
            <div className="space-y-4">
              {NEWEST_ARRIVALS.map((item, i) => (
                <motion.div
                  key={item.title}
                  className="neon-card rounded-lg p-4 flex items-center gap-4"
                  whileHover={{ x: 4 }}
                  data-ocid={`arrivals.item.${i + 1}`}
                >
                  <div
                    className="text-4xl w-14 h-14 flex items-center justify-center rounded-lg flex-shrink-0"
                    style={{ background: "oklch(0.47 0.24 290 / 0.2)" }}
                  >
                    {item.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4
                        className="font-orbitron text-sm font-bold"
                        style={{ color: "oklch(0.93 0.01 275)" }}
                      >
                        {item.title}
                      </h4>
                      <span
                        className="font-orbitron text-[9px] px-1.5 py-0.5 rounded tracking-widest flex-shrink-0"
                        style={{
                          background:
                            item.badge === "NEW"
                              ? "oklch(0.86 0.28 135 / 0.2)"
                              : "oklch(0.84 0.17 200 / 0.15)",
                          color:
                            item.badge === "NEW"
                              ? "oklch(0.86 0.28 135)"
                              : "oklch(0.84 0.17 200)",
                          border: `1px solid ${item.badge === "NEW" ? "oklch(0.86 0.28 135 / 0.4)" : "oklch(0.84 0.17 200 / 0.4)"}`,
                        }}
                      >
                        {item.badge}
                      </span>
                    </div>
                    <p
                      className="text-sm"
                      style={{ color: "oklch(0.72 0.015 280)" }}
                    >
                      {item.description}
                    </p>
                  </div>
                  <ChevronRight
                    className="w-4 h-4 flex-shrink-0"
                    style={{ color: "oklch(0.72 0.015 280)" }}
                  />
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
