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
      "Navigate the cursed serpent through the void. Consume energy, grow stronger, survive the domain!",
    image: "/assets/generated/game-snake.dim_400x240.jpg",
    tag: "CLASSIC",
    tagColor: "jjk-green",
  },
  {
    id: "tictactoe",
    title: "TIC-TAC-TOE",
    description:
      "Challenge the cursed spirit in this ancient strategy battle. Three marks to claim victory!",
    image: "/assets/generated/game-tictactoe.dim_400x240.jpg",
    tag: "STRATEGY",
    tagColor: "jjk-blue",
  },
  {
    id: "memory",
    title: "MEMORY MATCH",
    description:
      "Flip the cursed seals and find matching pairs. A sorcerer's memory is their greatest weapon!",
    image: "/assets/generated/game-memory.dim_400x240.jpg",
    tag: "PUZZLE",
    tagColor: "jjk-purple",
  },
  {
    id: "breakout",
    title: "BREAKOUT",
    description:
      "Shatter cursed barriers with your energy paddle. Clear the domain and break free!",
    image: "/assets/generated/game-breakout.dim_400x240.jpg",
    tag: "ACTION",
    tagColor: "jjk-red",
  },
  {
    id: "tetris",
    title: "TETRIS",
    description:
      "Stack cursed technique fragments and clear lines. How many curses can you exorcise?",
    image: "/assets/generated/game-tetris.dim_400x240.jpg",
    tag: "CLASSIC",
    tagColor: "jjk-teal",
  },
  {
    id: "pong",
    title: "PONG",
    description:
      "Face off against a cursed spirit in this ancient duel. Return volleys and outlast your opponent!",
    image: "/assets/generated/game-pong.dim_400x240.jpg",
    tag: "CLASSIC",
    tagColor: "jjk-green",
  },
  {
    id: "spaceinvaders",
    title: "SPACE INVADERS",
    description:
      "Cursed spirits descend from the heavens. Channel your energy, exorcise them all!",
    image: "/assets/generated/game-spaceinvaders.dim_400x240.jpg",
    tag: "ACTION",
    tagColor: "jjk-red",
  },
  {
    id: "flappy",
    title: "FLAPPY BIRD",
    description:
      "Fly through cursed barriers using your technique. How far will your energy take you?",
    image: "/assets/generated/game-flappy.dim_400x240.jpg",
    tag: "ACTION",
    tagColor: "jjk-blue",
  },
  {
    id: "2048",
    title: "2048",
    description:
      "Merge cursed energy fragments to reach the ultimate technique. Hollow Purple awaits.",
    image: "/assets/generated/game-2048.dim_400x240.jpg",
    tag: "PUZZLE",
    tagColor: "jjk-purple",
  },
  {
    id: "whackmole",
    title: "WHACK-A-MOLE",
    description:
      "Cursed spirits are manifesting everywhere! Exorcise as many as you can in 30 seconds.",
    image: "/assets/generated/game-whackmole.dim_400x240.jpg",
    tag: "ARCADE",
    tagColor: "jjk-teal",
  },
  {
    id: "simon",
    title: "SIMON SAYS",
    description:
      "Memorize the cursed sequence and repeat it back. A sorcerer never forgets their technique!",
    image: "/assets/generated/game-simon.dim_400x240.jpg",
    tag: "MEMORY",
    tagColor: "jjk-green",
  },
  {
    id: "horror",
    title: "SURVIVE THE NIGHT",
    description:
      "Cursed spirits lurk in the darkness. Aim your technique, banish the shadows, and survive. Don't let them reach you!",
    image: "/assets/generated/game-horror.dim_400x240.jpg",
    tag: "HORROR",
    tagColor: "jjk-red",
  },
];

const NEWEST_ARRIVALS = [
  {
    kanji: "呪",
    title: "Survive The Night",
    description:
      "Aim your cursed energy and banish spirits before they reach you!",
    badge: "NEW",
  },
  {
    kanji: "術",
    title: "Pong — Cursed Duel",
    description: "Classic paddle battle infused with cursed energy physics",
    badge: "NEW",
  },
  {
    kanji: "廻",
    title: "Space Invaders",
    description: "Waves of cursed spirits descend — exorcise them all!",
    badge: "NEW",
  },
];

const TAG_COLOR_MAP: Record<string, { text: string; border: string }> = {
  "jjk-blue": {
    text: "oklch(0.70 0.22 240)",
    border: "oklch(0.70 0.22 240 / 0.5)",
  },
  "jjk-purple": {
    text: "oklch(0.65 0.22 290)",
    border: "oklch(0.45 0.20 290 / 0.5)",
  },
  "jjk-teal": {
    text: "oklch(0.65 0.18 195)",
    border: "oklch(0.65 0.18 195 / 0.5)",
  },
  "jjk-red": {
    text: "oklch(0.65 0.22 25)",
    border: "oklch(0.55 0.22 25 / 0.5)",
  },
  "jjk-green": {
    text: "oklch(0.75 0.22 150)",
    border: "oklch(0.75 0.22 150 / 0.5)",
  },
  // legacy aliases
  "neon-green": {
    text: "oklch(0.75 0.22 150)",
    border: "oklch(0.75 0.22 150 / 0.5)",
  },
  "neon-cyan": {
    text: "oklch(0.70 0.22 240)",
    border: "oklch(0.70 0.22 240 / 0.5)",
  },
  "neon-purple": {
    text: "oklch(0.65 0.22 290)",
    border: "oklch(0.45 0.20 290 / 0.5)",
  },
  "neon-magenta": {
    text: "oklch(0.65 0.22 290)",
    border: "oklch(0.45 0.20 290 / 0.5)",
  },
  "neon-yellow": {
    text: "oklch(0.65 0.18 195)",
    border: "oklch(0.65 0.18 195 / 0.5)",
  },
  "neon-red": {
    text: "oklch(0.65 0.22 25)",
    border: "oklch(0.55 0.22 25 / 0.5)",
  },
};

// Floating cursed particles config
const PARTICLES = [
  {
    id: "p1",
    symbol: "●",
    top: "15%",
    left: "8%",
    delay: "0s",
    size: "1.2rem",
  },
  {
    id: "p2",
    symbol: "✦",
    top: "25%",
    right: "10%",
    delay: "0.6s",
    size: "1rem",
  },
  {
    id: "p3",
    symbol: "◈",
    top: "60%",
    left: "5%",
    delay: "1.2s",
    size: "0.9rem",
  },
  {
    id: "p4",
    symbol: "●",
    top: "70%",
    right: "8%",
    delay: "0.3s",
    size: "0.8rem",
  },
  {
    id: "p5",
    symbol: "✦",
    top: "40%",
    left: "15%",
    delay: "1.8s",
    size: "0.7rem",
  },
  {
    id: "p6",
    symbol: "◈",
    top: "50%",
    right: "18%",
    delay: "0.9s",
    size: "1.1rem",
  },
];

const KANJI_FLOATS = [
  { char: "呪", top: "18%", left: "12%", delay: "0s" },
  { char: "術", top: "28%", right: "14%", delay: "0.7s" },
  { char: "廻", bottom: "25%", left: "18%", delay: "1.4s" },
  { char: "戦", bottom: "30%", right: "12%", delay: "0.4s" },
];

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
          { rank: 1, name: "GOJO_SATORU", game: "Breakout", score: 98400 },
          { rank: 2, name: "YUJI_ITADORI", game: "Snake", score: 84200 },
          { rank: 3, name: "MEGUMI_FX", game: "Memory Match", score: 72100 },
          { rank: 4, name: "NOBARA_K", game: "Tic-Tac-Toe", score: 65300 },
          { rank: 5, name: "SUGURU_G", game: "Breakout", score: 58700 },
        ];

  return (
    <div className="min-h-screen">
      <Header />

      {/* Hero Section */}
      <section
        className="relative overflow-hidden"
        style={{
          minHeight: "540px",
          background:
            "linear-gradient(135deg, oklch(0.07 0.015 265) 0%, oklch(0.09 0.04 270) 50%, oklch(0.07 0.015 265) 100%)",
        }}
      >
        {/* Cursed seal hexagonal grid */}
        <div className="absolute inset-0 cursed-seal-bg opacity-60" />
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at center, transparent 40%, oklch(0.07 0.015 265) 100%)",
          }}
        />

        {/* Floating cursed energy particles */}
        {PARTICLES.map((p, i) => (
          <div
            key={p.id}
            className="absolute curse-particle pointer-events-none"
            style={{
              top: p.top,
              left: (p as { left?: string }).left,
              right: (p as { right?: string }).right,
              fontSize: p.size,
              color: "oklch(0.70 0.22 240)",
              animationDelay: p.delay,
              animationDuration: `${2.5 + i * 0.4}s`,
              filter: "drop-shadow(0 0 6px oklch(0.70 0.22 240))",
            }}
          >
            {p.symbol}
          </div>
        ))}

        {/* Floating JJK kanji */}
        {KANJI_FLOATS.map((k) => (
          <div
            key={k.char}
            className="absolute animate-float pointer-events-none font-cinzel font-black"
            style={{
              top: k.top,
              left: (k as { left?: string }).left,
              right: (k as { right?: string }).right,
              bottom: (k as { bottom?: string }).bottom,
              fontSize: "2.5rem",
              color: "oklch(0.70 0.22 240 / 0.12)",
              animationDelay: k.delay,
              textShadow: "0 0 20px oklch(0.70 0.22 240 / 0.3)",
            }}
          >
            {k.char}
          </div>
        ))}

        <div className="relative z-10 max-w-7xl mx-auto px-6 py-24 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border mb-6"
              style={{
                borderColor: "oklch(0.70 0.22 240 / 0.4)",
                background: "oklch(0.70 0.22 240 / 0.06)",
              }}
            >
              <Zap
                className="w-4 h-4"
                style={{ color: "oklch(0.70 0.22 240)" }}
              />
              <span
                className="font-cinzel text-xs tracking-widest"
                style={{ color: "oklch(0.70 0.22 240)" }}
              >
                CURSED ENERGY ACTIVATED
              </span>
            </div>

            <h1 className="font-cinzel font-black text-5xl md:text-7xl mb-6 leading-tight">
              <span className="cursed-energy-text">PLAY</span>{" "}
              <span style={{ color: "oklch(0.92 0.01 265)" }}>THE</span>{" "}
              <span className="cursed-energy-text">BEST</span>
              <br />
              <span style={{ color: "oklch(0.92 0.01 265)" }}>
                CURSED GAMES
              </span>
            </h1>

            <p
              className="text-lg mb-10 max-w-xl mx-auto font-exo"
              style={{ color: "oklch(0.65 0.015 270)" }}
            >
              12 cursed domains to conquer. Channel your inner sorcerer, battle
              on the global leaderboard, and prove you are the supreme grade-1
              champion.
            </p>

            <button
              type="button"
              onClick={() =>
                document
                  .getElementById("games-section")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
              className="cursed-btn-filled domain-pulse px-10 py-4 rounded-lg font-cinzel text-sm tracking-widest uppercase inline-flex items-center gap-2"
              data-ocid="hero.primary_button"
            >
              ENTER THE DOMAIN <ChevronRight className="w-4 h-4" />
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
            <h2 className="font-cinzel font-bold text-3xl md:text-4xl cursed-blue-text">
              CURSED GAMES ARCHIVE
            </h2>
            <div
              className="mt-3 w-32 h-px mx-auto"
              style={{
                background:
                  "linear-gradient(90deg, transparent, oklch(0.70 0.22 240), oklch(0.45 0.20 290), transparent)",
              }}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {GAMES.map((game, i) => {
              const tagColors =
                TAG_COLOR_MAP[game.tagColor] ?? TAG_COLOR_MAP["jjk-blue"];
              return (
                <motion.div
                  key={game.id}
                  className="cursed-card rounded-lg overflow-hidden group cursor-pointer"
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
                          "linear-gradient(135deg, oklch(0.09 0.04 260), oklch(0.07 0.015 265))",
                      }}
                    >
                      <span
                        className="font-cinzel font-black text-4xl"
                        style={{ color: "oklch(0.70 0.22 240 / 0.5)" }}
                      >
                        呪
                      </span>
                    </div>
                    {/* Overlay glow on hover */}
                    <div
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      style={{
                        background:
                          "linear-gradient(to top, oklch(0.70 0.22 240 / 0.2), transparent)",
                      }}
                    />
                    <div className="absolute top-2 left-2">
                      <span
                        className="font-cinzel text-[10px] px-2 py-0.5 rounded tracking-widest"
                        style={{
                          background: "oklch(0.07 0.015 265 / 0.85)",
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
                      className="font-cinzel font-bold text-sm mb-2"
                      style={{ color: "oklch(0.92 0.01 265)" }}
                    >
                      {game.title}
                    </h3>
                    <p
                      className="text-xs mb-4 leading-relaxed font-exo"
                      style={{ color: "oklch(0.65 0.015 270)" }}
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
                      className="w-full py-2 rounded cursed-btn-filled font-cinzel text-xs tracking-widest hover:domain-pulse"
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
        className="border-y py-8"
        style={{
          background: "oklch(0.09 0.012 268)",
          borderColor: "oklch(0.70 0.22 240 / 0.18)",
        }}
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-3 gap-8 text-center">
            {[
              { value: "12", label: "CURSED DOMAINS" },
              { value: "∞", label: "CURSED HOURS" },
              { value: "#1", label: "DOMAIN EXPANSION" },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="font-cinzel text-3xl font-black cursed-blue-text">
                  {stat.value}
                </p>
                <p
                  className="font-cinzel text-xs tracking-widest mt-1"
                  style={{ color: "oklch(0.65 0.015 270)" }}
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
                style={{ color: "oklch(0.70 0.22 240)" }}
              />
              <h2 className="font-cinzel font-bold text-2xl cursed-blue-text">
                TOP SORCERERS
              </h2>
            </div>
            <div
              className="cursed-card rounded-lg overflow-hidden"
              data-ocid="leaderboard.table"
            >
              <div
                className="grid grid-cols-4 px-4 py-3 border-b"
                style={{ borderColor: "oklch(0.70 0.22 240 / 0.2)" }}
              >
                {["RANK", "SORCERER", "DOMAIN", "SCORE"].map((h) => (
                  <span
                    key={h}
                    className="font-cinzel text-[10px] tracking-widest"
                    style={{ color: "oklch(0.70 0.22 240)" }}
                  >
                    {h}
                  </span>
                ))}
              </div>
              {displayScorers.map((s, i) => (
                <div
                  key={`scorer-${s.rank}-${s.name}`}
                  className="grid grid-cols-4 px-4 py-3 border-b last:border-0 hover:bg-white/5 transition-colors"
                  style={{ borderColor: "oklch(0.70 0.22 240 / 0.12)" }}
                  data-ocid={`leaderboard.item.${i + 1}`}
                >
                  <span
                    className="font-cinzel text-sm font-bold"
                    style={{
                      color:
                        i === 0
                          ? "oklch(0.92 0.20 97)"
                          : i === 1
                            ? "oklch(0.75 0.015 280)"
                            : i === 2
                              ? "oklch(0.75 0.12 50)"
                              : "oklch(0.65 0.015 270)",
                    }}
                  >
                    #{s.rank}
                  </span>
                  <span
                    className="text-sm truncate font-exo"
                    style={{ color: "oklch(0.92 0.01 265)" }}
                  >
                    {s.name}
                  </span>
                  <span
                    className="text-xs truncate font-exo"
                    style={{ color: "oklch(0.65 0.015 270)" }}
                  >
                    {s.game}
                  </span>
                  <span
                    className="font-cinzel text-sm"
                    style={{ color: "oklch(0.70 0.22 240)" }}
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
                    className="text-sm font-exo"
                    style={{ color: "oklch(0.65 0.015 270)" }}
                  >
                    No sorcerers ranked yet. Be the first!
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
                style={{ color: "oklch(0.65 0.22 290)" }}
              />
              <h2 className="font-cinzel font-bold text-2xl cursed-purple-text">
                NEWLY CURSED
              </h2>
            </div>
            <div className="space-y-4">
              {NEWEST_ARRIVALS.map((item, i) => (
                <motion.div
                  key={item.title}
                  className="cursed-card rounded-lg p-4 flex items-center gap-4"
                  whileHover={{ x: 4 }}
                  data-ocid={`arrivals.item.${i + 1}`}
                >
                  <div
                    className="w-14 h-14 flex items-center justify-center rounded-lg flex-shrink-0 font-cinzel font-black text-2xl"
                    style={{
                      background: "oklch(0.45 0.20 290 / 0.15)",
                      color: "oklch(0.70 0.22 240)",
                      textShadow: "0 0 12px oklch(0.70 0.22 240 / 0.7)",
                      border: "1px solid oklch(0.70 0.22 240 / 0.2)",
                    }}
                  >
                    {item.kanji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4
                        className="font-cinzel text-sm font-bold"
                        style={{ color: "oklch(0.92 0.01 265)" }}
                      >
                        {item.title}
                      </h4>
                      <span
                        className="font-cinzel text-[9px] px-1.5 py-0.5 rounded tracking-widest flex-shrink-0"
                        style={{
                          background: "oklch(0.70 0.22 240 / 0.15)",
                          color: "oklch(0.70 0.22 240)",
                          border: "1px solid oklch(0.70 0.22 240 / 0.4)",
                        }}
                      >
                        {item.badge}
                      </span>
                    </div>
                    <p
                      className="text-sm font-exo"
                      style={{ color: "oklch(0.65 0.015 270)" }}
                    >
                      {item.description}
                    </p>
                  </div>
                  <ChevronRight
                    className="w-4 h-4 flex-shrink-0"
                    style={{ color: "oklch(0.70 0.22 240 / 0.6)" }}
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
