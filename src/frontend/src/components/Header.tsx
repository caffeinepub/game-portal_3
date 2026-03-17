import { Link } from "@tanstack/react-router";
import { Gamepad2 } from "lucide-react";

const NAV_ITEMS = ["HOME", "GAMES", "LEADERBOARDS", "NEWS", "COMMUNITY"];

export default function Header() {
  return (
    <header
      className="sticky top-0 z-50 border-b border-border"
      style={{
        background: "oklch(0.09 0.008 265 / 0.95)",
        backdropFilter: "blur(10px)",
      }}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link
          to="/"
          className="flex items-center gap-2 no-underline"
          data-ocid="nav.link"
        >
          <div className="flex items-center gap-2 px-3 py-1.5 rounded border neon-cyan-border">
            <Gamepad2
              className="w-5 h-5"
              style={{ color: "var(--neon-cyan)" }}
            />
            <span className="font-orbitron font-bold text-sm tracking-widest neon-cyan-text">
              NEON ARCADE
            </span>
          </div>
        </Link>

        {/* Nav Links */}
        <nav className="hidden md:flex items-center gap-8">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item}
              to="/"
              className="font-orbitron text-xs font-medium tracking-widest transition-colors no-underline"
              style={{ color: "oklch(0.84 0.17 200)" }}
              data-ocid="nav.link"
            >
              {item}
            </Link>
          ))}
        </nav>

        {/* Auth buttons */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="neon-btn-cyan px-5 py-1.5 rounded-full font-orbitron text-xs tracking-widest uppercase"
            data-ocid="nav.link"
          >
            LOGIN
          </button>
          <button
            type="button"
            className="neon-btn-magenta px-5 py-1.5 rounded-full font-orbitron text-xs tracking-widest uppercase"
            data-ocid="nav.link"
          >
            REGISTER
          </button>
        </div>
      </div>
    </header>
  );
}
