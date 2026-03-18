import { Link, useNavigate } from "@tanstack/react-router";
import { Film, Flame, Search } from "lucide-react";

const MOVIE_URL =
  "https://hydrahd.ru/movie/54297-watch-monster-house-2006-online";

const NAV_ITEMS = ["HOME", "GAMES", "LEADERBOARDS", "NEWS", "COMMUNITY"];

export default function Header() {
  const navigate = useNavigate();

  function openMovies() {
    navigate({ to: "/search", search: { url: MOVIE_URL } });
  }

  return (
    <header
      className="sticky top-0 z-50 border-b border-border"
      style={{
        background: "oklch(0.07 0.015 265 / 0.95)",
        backdropFilter: "blur(12px)",
        borderColor: "oklch(0.70 0.22 240 / 0.2)",
      }}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link
          to="/"
          className="flex items-center gap-2 no-underline"
          data-ocid="nav.link"
        >
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded border"
            style={{
              borderColor: "oklch(0.70 0.22 240 / 0.5)",
              boxShadow:
                "0 0 8px oklch(0.70 0.22 240 / 0.3), inset 0 0 8px oklch(0.70 0.22 240 / 0.05)",
            }}
          >
            <Flame
              className="w-5 h-5"
              style={{ color: "oklch(0.70 0.22 240)" }}
            />
            <span className="font-cinzel font-bold text-sm tracking-widest cursed-energy-text">
              CURSED ARCADE
            </span>
          </div>
        </Link>

        {/* Nav Links */}
        <nav className="hidden md:flex items-center gap-6">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item}
              to="/"
              className="font-cinzel text-xs font-medium tracking-widest transition-colors no-underline hover:text-[oklch(0.85_0.22_240)]"
              style={{ color: "oklch(0.70 0.22 240)" }}
              data-ocid="nav.link"
            >
              {item}
            </Link>
          ))}
          {/* Movies tab */}
          <button
            type="button"
            onClick={openMovies}
            className="flex items-center gap-1.5 font-cinzel text-xs font-medium tracking-widest transition-colors no-underline px-3 py-1.5 rounded border cursor-pointer bg-transparent"
            style={{
              color: "oklch(0.80 0.20 30)",
              borderColor: "oklch(0.60 0.18 30 / 0.5)",
              boxShadow: "0 0 6px oklch(0.60 0.18 30 / 0.2)",
            }}
            data-ocid="nav.link"
          >
            <Film className="w-3 h-3" />
            MOVIES
          </button>
          <Link
            to="/search"
            search={{ url: undefined }}
            className="flex items-center gap-1.5 font-cinzel text-xs font-medium tracking-widest transition-colors no-underline px-3 py-1.5 rounded border"
            style={{
              color: "oklch(0.65 0.22 290)",
              borderColor: "oklch(0.45 0.20 290 / 0.5)",
              boxShadow: "0 0 6px oklch(0.45 0.20 290 / 0.2)",
            }}
            data-ocid="nav.link"
          >
            <Search className="w-3 h-3" />
            SEARCH
          </Link>
        </nav>

        {/* Auth buttons */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="neon-btn-cyan px-5 py-1.5 rounded-full font-cinzel text-xs tracking-widest uppercase"
            data-ocid="nav.link"
          >
            LOGIN
          </button>
          <button
            type="button"
            className="neon-btn-magenta px-5 py-1.5 rounded-full font-cinzel text-xs tracking-widest uppercase"
            data-ocid="nav.link"
          >
            REGISTER
          </button>
        </div>
      </div>
    </header>
  );
}
